package com.gymflow.ai;

import com.gymflow.config.AiConfig;
import com.gymflow.domain.ChatConversation;
import com.gymflow.domain.ChatMessage;
import com.gymflow.repository.ChatMessageRepository;
import com.gymflow.security.AuthUser;
import com.gymflow.service.ChatTopic;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Triển khai trợ lý thông minh kết nối với Google Gemini API (sử dụng API key).
 * Toàn bộ thông tin được neo chặt (grounded) vào dữ liệu thực tế của GymFlow.
 * Tự động chuyển về RuleBasedProvider khi mất mạng, quá hạn ngạch (quota) hoặc lỗi API key.
 */
@Slf4j
@Component("geminiProvider")
@RequiredArgsConstructor
public class GeminiProvider implements AssistantProvider {

    private final AiConfig aiConfig;
    private final AiDataGroundingService groundingService;
    private final AiRateLimiter rateLimiter;
    private final RuleBasedProvider ruleBasedFallback;
    private final ChatMessageRepository messageRepository;
    private final ResourceLoader resourceLoader;

    private RestClient restClient;
    private String baseSystemPrompt = "";

    /** Provider thực tế của câu trả lời gần nhất trên thread đang xử lý request. */
    private final ThreadLocal<String> lastProvider = new ThreadLocal<>();

    public record GeminiTextPart(String text) {}
    public record GeminiContent(String role, List<GeminiTextPart> parts) {}
    public record GeminiSystemInstruction(List<GeminiTextPart> parts) {}
    public record GeminiGenerationConfig(Double temperature, Integer maxOutputTokens) {}

    public record GeminiGenerateRequest(
            GeminiSystemInstruction system_instruction,
            List<GeminiContent> contents,
            GeminiGenerationConfig generationConfig
    ) {}

    public record GeminiCandidate(GeminiContent content, String finishReason) {}
    public record GeminiGenerateResponse(List<GeminiCandidate> candidates) {}

    @PostConstruct
    public void init() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(4));
        requestFactory.setReadTimeout(Duration.ofSeconds(aiConfig.getTimeoutSeconds() > 0 ? aiConfig.getTimeoutSeconds() : 15));

        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(requestFactory)
                .build();

        try {
            Resource resource = resourceLoader.getResource("classpath:ai/system-prompt.txt");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    this.baseSystemPrompt = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            } else {
                this.baseSystemPrompt = "Bạn là trợ lý GymFlow. Trả lời bằng tiếng Việt dựa trên dữ liệu hệ thống được cấp.";
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi tải system prompt: {}", ex.getMessage());
            this.baseSystemPrompt = "Bạn là trợ lý GymFlow. Trả lời bằng tiếng Việt dựa trên dữ liệu hệ thống được cấp.";
        }
    }

    @Override
    public String getProviderName() {
        return "gemini";
    }

    @Override
    public boolean isAvailable() {
        return aiConfig.getGeminiApiKey() != null && !aiConfig.getGeminiApiKey().isBlank();
    }

    @Override
    public String lastAnswerProvider() {
        String provider = lastProvider.get();
        return (provider != null && !provider.isBlank()) ? provider : getProviderName();
    }

    /**
     * Câu hỏi gợi ý: lấy dữ liệu thật từ RuleBasedProvider rồi để Gemini diễn đạt lại tự nhiên.
     * Nếu không gọi được Gemini thì trả nguyên câu trả lời dữ liệu gốc.
     */
    @Override
    public String answerTopic(AuthUser user, ChatTopic topic) {
        if (topic == null) {
            lastProvider.set("rule");
            return "Câu hỏi không hợp lệ.";
        }

        String factualAnswer = ruleBasedFallback.answerTopic(user, topic);
        lastProvider.set("rule");

        if (!isAvailable() || !rateLimiter.tryAcquire(user.id())) {
            return factualAnswer;
        }

        String grounding = """
                --- DỮ LIỆU HỆ THỐNG GYMFLOW (Chỉ dùng dữ liệu này để trả lời) ---
                [Kết quả tra cứu nội bộ cho chủ đề "%s"]:
                %s
                --- HẾT DỮ LIỆU HỆ THỐNG ---
                """.formatted(topic.label(), factualAnswer);

        return generate(user, topic.label(), null, grounding, () -> factualAnswer);
    }

    @Override
    public String answerText(AuthUser user, String text, ChatConversation conversation) {
        lastProvider.set("rule");

        if (text == null || text.isBlank()) {
            return ruleBasedFallback.answerText(user, text, conversation);
        }

        // Chưa cấu hình API key: dùng rule-based ngay, không gọi mạng.
        if (!isAvailable()) {
            log.warn("GEMINI_API_KEY chưa được cấu hình, tự động chuyển sang RuleBasedProvider");
            return ruleBasedFallback.answerText(user, text, conversation);
        }

        // 1. Kiểm tra giới hạn độ dài ký tự
        if (text.length() > aiConfig.getMaxInputChars()) {
            lastProvider.set("system");
            return "Câu hỏi của bạn quá dài (" + text.length() + "/" + aiConfig.getMaxInputChars() + " ký tự). " +
                    "Vui lòng tóm tắt ngắn gọn câu hỏi để trợ lý hỗ trợ tốt nhất.";
        }

        // 2. Kiểm tra giới hạn tần suất (Rate limit)
        if (!rateLimiter.tryAcquire(user.id())) {
            lastProvider.set("system");
            return "Bạn đang gửi câu hỏi quá nhanh. Vui lòng chờ vài giây trước khi gửi câu hỏi tiếp theo.";
        }

        String groundingData;
        try {
            // 3. Chuẩn bị dữ liệu Grounding thật từ hệ thống
            groundingData = groundingService.buildGroundingContext(user, text);
        } catch (Exception ex) {
            log.warn("Không dựng được dữ liệu grounding ({}), chuyển sang RuleBasedProvider", ex.getMessage());
            lastProvider.set("rule");
            return ruleBasedFallback.answerText(user, text, conversation);
        }

        return generate(user, text.trim(), conversation, groundingData,
                () -> ruleBasedFallback.answerText(user, text, conversation));
    }

    /**
     * Gọi Gemini với ngữ cảnh đã chuẩn bị. Tự fallback về câu trả lời dữ liệu gốc nếu lỗi.
     */
    private String generate(AuthUser user, String prompt, ChatConversation conversation,
                            String groundingData, Supplier<String> fallback) {
        lastProvider.set("gemini");
        long startTime = System.currentTimeMillis();

        try {
            String fullSystemPrompt = baseSystemPrompt + "\n\n" + groundingData;

            GeminiSystemInstruction systemInstruction = new GeminiSystemInstruction(
                    List.of(new GeminiTextPart(fullSystemPrompt))
            );

            List<GeminiContent> contents = new ArrayList<>();

            // 4. Lấy ngữ cảnh hội thoại gần nhất (tối đa 4 tin nhắn)
            if (conversation != null && conversation.getId() != null) {
                List<ChatMessage> history = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId());
                int startIdx = Math.max(0, history.size() - 4);
                for (int i = startIdx; i < history.size(); i++) {
                    ChatMessage msg = history.get(i);
                    // Gemini dùng role "user" và "model"
                    String role = (msg.getSender() == ChatMessage.Sender.USER) ? "user" : "model";
                    contents.add(new GeminiContent(role, List.of(new GeminiTextPart(msg.getContent()))));
                }
            }

            // Thêm câu hỏi hiện tại
            contents.add(new GeminiContent("user", List.of(new GeminiTextPart(prompt))));

            GeminiGenerationConfig config = new GeminiGenerationConfig(0.2, 2048);
            GeminiGenerateRequest payload = new GeminiGenerateRequest(systemInstruction, contents, config);

            String model = (aiConfig.getGeminiModel() != null && !aiConfig.getGeminiModel().isBlank())
                    ? aiConfig.getGeminiModel() : "gemini-3.5-flash-lite";

            // 5. Gọi Google Gemini API (key gửi qua header, không đưa lên URL/log)
            GeminiGenerateResponse response = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", aiConfig.getGeminiApiKey())
                    .body(payload)
                    .retrieve()
                    .body(GeminiGenerateResponse.class);

            long duration = System.currentTimeMillis() - startTime;
            log.info("Gemini [{}] phản hồi thành công trong {}ms cho tài khoản ID: {}", model, duration, user.id());

            if (response != null && response.candidates() != null && !response.candidates().isEmpty()) {
                var candidate = response.candidates().get(0);
                log.info("Gemini [{}] finishReason: {}", model, candidate.finishReason());
                if (candidate.content() != null && candidate.content().parts() != null && !candidate.content().parts().isEmpty()) {
                    String reply = candidate.content().parts().stream()
                            .map(GeminiTextPart::text)
                            .filter(t -> t != null && !t.isBlank())
                            .collect(Collectors.joining(""));
                    if (reply != null && !reply.isBlank()) {
                        return reply.trim();
                    }
                }
            }

            log.warn("Gemini trả về phản hồi rỗng, chuyển sang dữ liệu gốc");
            lastProvider.set("rule");
            return fallback.get();

        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("Gọi Google Gemini API thất bại sau {}ms (Lỗi: {}). Tự động chuyển sang dữ liệu gốc",
                    duration, ex.getMessage());
            lastProvider.set("rule");
            return fallback.get();
        }
    }
}
