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

/**
 * Triển khai trợ lý thông minh kết nối mô hình ngôn ngữ lớn (LLM) chạy cục bộ qua Ollama.
 * Toàn bộ câu trả lời được neo chặt (grounded) vào dữ liệu thực tế của GymFlow.
 * Tự động chuyển về RuleBasedProvider khi Ollama lỗi, quá tải hoặc quá thời gian chờ (timeout).
 */
@Slf4j
@Component("ollamaProvider")
@RequiredArgsConstructor
public class OllamaProvider implements AssistantProvider {

    private final AiConfig aiConfig;
    private final AiDataGroundingService groundingService;
    private final AiRateLimiter rateLimiter;
    private final RuleBasedProvider ruleBasedFallback;
    private final ChatMessageRepository messageRepository;
    private final ResourceLoader resourceLoader;

    private RestClient restClient;
    private String baseSystemPrompt = "";

    public record OllamaMessage(String role, String content) {}
    public record OllamaChatRequest(String model, List<OllamaMessage> messages, boolean stream, Map<String, Object> options) {}
    public record OllamaChatResponse(String model, OllamaMessage message, boolean done) {}

    @PostConstruct
    public void init() {
        // Cấu hình RestClient với thời gian chờ
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(aiConfig.getOllamaTimeoutSeconds()));

        this.restClient = RestClient.builder()
                .baseUrl(aiConfig.getOllamaBaseUrl())
                .requestFactory(requestFactory)
                .build();

        // Đọc System Prompt từ file tài nguyên
        try {
            Resource resource = resourceLoader.getResource("classpath:ai/system-prompt.txt");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    this.baseSystemPrompt = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            } else {
                log.warn("Không tìm thấy file classpath:ai/system-prompt.txt, sử dụng prompt mặc định");
                this.baseSystemPrompt = "Bạn là trợ lý GymFlow. Trả lời bằng tiếng Việt dựa trên dữ liệu hệ thống được cấp.";
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi tải system prompt: {}", ex.getMessage());
            this.baseSystemPrompt = "Bạn là trợ lý GymFlow. Trả lời bằng tiếng Việt dựa trên dữ liệu hệ thống được cấp.";
        }
    }

    @Override
    public String getProviderName() {
        return "ollama";
    }

    @Override
    public boolean isAvailable() {
        if (!aiConfig.isOllamaEnabled()) {
            return false;
        }
        try {
            SimpleClientHttpRequestFactory quickFactory = new SimpleClientHttpRequestFactory();
            quickFactory.setConnectTimeout(Duration.ofSeconds(2));
            quickFactory.setReadTimeout(Duration.ofSeconds(2));
            RestClient quickClient = RestClient.builder()
                    .baseUrl(aiConfig.getOllamaBaseUrl())
                    .requestFactory(quickFactory)
                    .build();

            String res = quickClient.get()
                    .uri("/")
                    .retrieve()
                    .body(String.class);
            return res != null && res.contains("Ollama is running");
        } catch (Exception ex) {
            return false;
        }
    }

    @Override
    public String answerTopic(AuthUser user, ChatTopic topic) {
        // Với topic có sẵn, sử dụng logic rule-based để đảm bảo phản hồi tức thì và chính xác
        return ruleBasedFallback.answerTopic(user, topic);
    }

    @Override
    public String answerText(AuthUser user, String text, ChatConversation conversation) {
        if (text == null || text.isBlank()) {
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

            List<OllamaMessage> messages = new ArrayList<>();
            messages.add(new OllamaMessage("system", fullSystemPrompt));

            // 4. Lấy ngữ cảnh vài tin nhắn gần nhất của hội thoại (tối đa 4 tin nhắn)
            if (conversation != null && conversation.getId() != null) {
                List<ChatMessage> history = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId());
                int startIdx = Math.max(0, history.size() - 4);
                for (int i = startIdx; i < history.size(); i++) {
                    ChatMessage msg = history.get(i);
                    String role = (msg.getSender() == ChatMessage.Sender.USER) ? "user" : "assistant";
                    messages.add(new OllamaMessage(role, msg.getContent()));
                }
            }

            // Thêm câu hỏi hiện tại của người dùng
            messages.add(new OllamaMessage("user", text.trim()));

            Map<String, Object> options = Map.of(
                    "temperature", 0.3,
                    "top_p", 0.9
            );

            OllamaChatRequest payload = new OllamaChatRequest(aiConfig.getOllamaModel(), messages, false, options);

            // 5. Gọi HTTP POST tới Ollama
            OllamaChatResponse response = restClient.post()
                    .uri("/api/chat")
                    .body(payload)
                    .retrieve()
                    .body(OllamaChatResponse.class);

            long duration = System.currentTimeMillis() - startTime;
            log.info("Ollama [{}] phản hồi thành công trong {}ms cho tài khoản ID: {}",
                    aiConfig.getOllamaModel(), duration, user.id());

            if (response != null && response.message() != null && response.message().content() != null) {
                String reply = response.message().content().trim();
                if (!reply.isBlank()) {
                    return reply;
                }
            }

            log.warn("Ollama trả về nội dung rỗng, chuyển sang fallback RuleBasedProvider");
            return ruleBasedFallback.answerText(user, text, conversation);

        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("Gọi Ollama thất bại sau {}ms (Lỗi: {}). Tự động chuyển sang fallback RuleBasedProvider",
                    duration, ex.getMessage());
            return ruleBasedFallback.answerText(user, text, conversation);
        }
    }
}
