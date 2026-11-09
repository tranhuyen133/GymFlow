package com.gymflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.gymflow.common.ApiException;
import com.gymflow.domain.ChatConversation;
import com.gymflow.domain.ChatMessage;
import com.gymflow.domain.User;
import com.gymflow.dto.Dtos.ChatConversationResponse;
import com.gymflow.dto.Dtos.ChatCreateConversationResponse;
import com.gymflow.dto.Dtos.ChatHistoryResponse;
import com.gymflow.dto.Dtos.ChatMessageResponse;
import com.gymflow.dto.Dtos.ChatSendRequest;
import com.gymflow.repository.ChatConversationRepository;
import com.gymflow.repository.ChatMessageRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.net.http.HttpClient;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ChatService {
    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý GymFlow, trả lời bằng tiếng Việt rõ ràng, hữu ích.
            Ưu tiên hướng dẫn cách dùng GymFlow và kiến thức tập luyện/sức khỏe thể chất ở mức thông tin chung.
            Không chẩn đoán, không thay thế tư vấn của bác sĩ/huấn luyện viên; với dấu hiệu đau, chấn thương hoặc bệnh lý,
            khuyên người dùng dừng tập và hỏi chuyên gia phù hợp.
            Bạn không được truy cập dữ liệu trực tiếp của GymFlow. Không được đoán hoặc tự bịa giá, quyền lợi gói,
            lịch tập, huấn luyện viên, tiến độ hay dữ liệu tài khoản. Nếu được hỏi dữ liệu cụ thể của hệ thống,
            hãy nói rõ bạn không có dữ liệu đó và hướng dẫn người dùng xem màn hình tương ứng hoặc liên hệ quầy/HLV.
            """;

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final RestClient client;
    private final String apiKey;
    private final String model;
    private final Clock clock;

    public ChatService(ChatConversationRepository conversationRepository,
                       ChatMessageRepository messageRepository,
                       UserRepository userRepository,
                       RestClient.Builder builder,
                       Clock clock,
                       @Value("${app.ai.base-url}") String baseUrl,
                       @Value("${app.ai.model}") String model,
                       @Value("${app.ai.api-key:}") String apiKey,
                       @Value("${app.ai.timeout-seconds:20}") int timeoutSeconds) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.apiKey = apiKey.trim();
        this.model = model;
        this.clock = clock;
        int boundedTimeout = Math.max(1, Math.min(60, timeoutSeconds));
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(boundedTimeout)).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(boundedTimeout));
        this.client = builder.baseUrl(baseUrl).requestFactory(requestFactory).build();
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> conversations(AuthUser principal) {
        return conversationRepository.findAllByUser_IdOrderByUpdatedAtDesc(principal.id()).stream()
                .map(conversation -> {
                    String last = messageRepository.findTop1ByConversation_IdOrderByCreatedAtDesc(conversation.getId())
                            .stream().findFirst().map(ChatMessage::getContent).orElse("");
                    return new ChatConversationResponse(conversation.getId(), conversation.getTitle(),
                            conversation.getCreatedAt(), conversation.getUpdatedAt(), last);
                }).toList();
    }

    @Transactional(readOnly = true)
    public ChatHistoryResponse history(AuthUser principal, Long conversationId) {
        ChatConversation conversation = ownedConversation(principal, conversationId);
        return new ChatHistoryResponse(conversation.getId(),
                messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId()).stream()
                        .map(ChatService::toResponse).toList());
    }

    @Transactional
    public ChatCreateConversationResponse createConversation(AuthUser principal) {
        User user = userRepository.findById(principal.id()).orElseThrow(() -> ApiException.notFound("tài khoản"));
        LocalDateTime now = LocalDateTime.now(clock);
        ChatConversation conversation = new ChatConversation();
        conversation.setUser(user);
        conversation.setTitle("Cuộc trò chuyện mới");
        conversation.setCreatedAt(now);
        conversation.setUpdatedAt(now);
        ChatConversation saved = conversationRepository.save(conversation);
        return new ChatCreateConversationResponse(saved.getId(), saved.getTitle(), saved.getCreatedAt(), saved.getUpdatedAt());
    }

    public ChatMessageResponse send(AuthUser principal, ChatSendRequest request) {
        String question = request.content() == null ? "" : request.content().trim();
        if (question.isEmpty()) throw ApiException.badRequest("Vui lòng nhập câu hỏi");
        if (question.length() > 2000) throw ApiException.badRequest("Câu hỏi tối đa 2.000 ký tự");
        if (apiKey.isBlank()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI Chatbot chưa được cấu hình");

        ChatConversation conversation = ownedConversation(principal, request.conversationId());
        if (messageRepository.findTop1ByConversation_IdOrderByCreatedAtDesc(conversation.getId()).isEmpty()) {
            int end = question.offsetByCodePoints(0, Math.min(120, question.codePointCount(0, question.length())));
            conversation.setTitle(question.substring(0, end));
        }
        ChatMessage userMessage = message(conversation, ChatMessage.Sender.USER, question);
        messageRepository.save(userMessage);
        conversation.setUpdatedAt(LocalDateTime.now(clock));
        conversationRepository.save(conversation);

        String answer = askProvider(conversation);
        ChatMessage assistant = message(conversation, ChatMessage.Sender.ASSISTANT, answer);
        messageRepository.save(assistant);
        conversation.setUpdatedAt(LocalDateTime.now(clock));
        conversationRepository.save(conversation);
        return toResponse(assistant);
    }

    private ChatConversation ownedConversation(AuthUser principal, Long id) {
        return conversationRepository.findByIdAndUser_Id(id, principal.id())
                .orElseThrow(() -> ApiException.notFound("hội thoại"));
    }

    private String askProvider(ChatConversation conversation) {
        List<ChatMessage> history = new ArrayList<>(messageRepository
                .findTop20ByConversation_IdOrderByCreatedAtDesc(conversation.getId()));
        history.sort(Comparator.comparing(ChatMessage::getCreatedAt));
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        for (ChatMessage item : history) {
            messages.add(Map.of("role", item.getSender() == ChatMessage.Sender.USER ? "user" : "assistant",
                    "content", item.getContent()));
        }
        try {
            JsonNode response = client.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("model", model, "messages", messages, "temperature", 0.2, "max_tokens", 800))
                    .retrieve()
                    .body(JsonNode.class);
            String answer = response == null ? null : response.path("choices").path(0).path("message").path("content").asText(null);
            if (answer == null || answer.isBlank()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI provider trả về phản hồi không hợp lệ");
            }
            return answer.trim();
        } catch (RestClientResponseException e) {
            log.warn("AI provider returned HTTP {}", e.getStatusCode().value());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI chưa thể trả lời lúc này, vui lòng thử lại sau");
        } catch (ResourceAccessException e) {
            throw new ApiException(HttpStatus.GATEWAY_TIMEOUT, "AI phản hồi quá thời gian chờ, vui lòng thử lại");
        } catch (RestClientException e) {
            log.warn("AI provider request failed ({})", e.getClass().getSimpleName());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Không kết nối được AI lúc này, vui lòng thử lại sau");
        }
    }

    private ChatMessage message(ChatConversation conversation, ChatMessage.Sender sender, String content) {
        ChatMessage message = new ChatMessage();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(content);
        message.setCreatedAt(LocalDateTime.now(clock));
        return message;
    }

    private static ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(message.getId(), message.getSender().name(), message.getContent(), message.getCreatedAt());
    }
}
