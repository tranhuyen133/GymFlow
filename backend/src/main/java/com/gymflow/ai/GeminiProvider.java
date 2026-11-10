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
    public String answerTopic(AuthUser user, ChatTopic topic) {
        return ruleBasedFallback.answerTopic(user, topic);
    }

    @Override
    public String answerText(AuthUser user, String text, ChatConversation conversation) {
        if (text == null || text.isBlank()) {
            return ruleBasedFallback.answerText(user, text, conversation);
        }

        // Kiểm tra API Key đã cấu hình chưa
        String apiKey = aiConfig.getGeminiApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY chưa được cấu hình, tự động chuyển sang RuleBasedProvider");
            return ruleBasedFallback.answerText(user, text, conversation);
        }

        // 1. Kiểm tra giới hạn độ dài ký tự
        if (text.length() > aiConfig.getMaxInputChars()) {
            return "Câu hỏi của bạn quá dài (" + text.length() + "/" + aiConfig.getMaxInputChars() + " ký tự). " +
                    "Vui lòng tóm tắt ngắn gọn câu hỏi để trợ lý hỗ trợ tốt nhất.";
        }

        // 2. Kiểm tra giới hạn tần suất (Rate limit)
        if (!rateLimiter.tryAcquire(user.id())) {
            return "Bạn đang gửi câu hỏi quá nhanh. Vui lòng chờ vài giây trước khi gửi câu hỏi tiếp theo.";
        }

        long startTime = System.currentTimeMillis();

        try {
            // 3. Chuẩn bị dữ liệu Grounding thật từ hệ thống
            String groundingData = groundingService.buildGroundingContext(user, text);
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
            contents.add(new GeminiContent("user", List.of(new GeminiTextPart(text.trim()))));

            GeminiGenerationConfig config = new GeminiGenerationConfig(0.2, 2048);
            GeminiGenerateRequest payload = new GeminiGenerateRequest(systemInstruction, contents, config);

            String model = (aiConfig.getGeminiModel() != null && !aiConfig.getGeminiModel().isBlank())
                    ? aiConfig.getGeminiModel() : "gemini-3.5-flash-lite";

            // 5. Gọi Google Gemini API
            GeminiGenerateResponse response = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
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

            log.warn("Gemini trả về phản hồi rỗng, chuyển sang fallback RuleBasedProvider");
            return ruleBasedFallback.answerText(user, text, conversation);

        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("Gọi Google Gemini API thất bại sau {}ms (Lỗi: {}). Tự động chuyển sang fallback RuleBasedProvider",
                    duration, ex.getMessage());
            return ruleBasedFallback.answerText(user, text, conversation);
        }
    }
}
