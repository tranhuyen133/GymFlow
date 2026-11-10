package com.gymflow.service;

import com.gymflow.ai.AssistantProvider;
import com.gymflow.ai.AssistantProviderService;
import com.gymflow.common.ApiException;
import com.gymflow.config.AiConfig;
import com.gymflow.domain.ChatConversation;
import com.gymflow.domain.ChatMessage;
import com.gymflow.domain.User;
import com.gymflow.dto.Dtos.AiHealthResponse;
import com.gymflow.dto.Dtos.ChatConversationResponse;
import com.gymflow.dto.Dtos.ChatCreateConversationResponse;
import com.gymflow.dto.Dtos.ChatHistoryResponse;
import com.gymflow.dto.Dtos.ChatMessageResponse;
import com.gymflow.dto.Dtos.ChatSendRequest;
import com.gymflow.dto.Dtos.ChatSuggestionsResponse;
import com.gymflow.repository.ChatConversationRepository;
import com.gymflow.repository.ChatMessageRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/**
 * Quản lý Trợ lý GymFlow: lịch sử hội thoại, điều phối câu trả lời qua AssistantProviderService.
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatAssistantService assistant;
    private final AssistantProviderService assistantProviderService;
    private final AiConfig aiConfig;
    private final Clock clock;

    @Transactional(readOnly = true)
    public ChatSuggestionsResponse suggestions(AuthUser principal) {
        var items = assistant.suggestions(principal);
        boolean freeText = assistantProviderService.isFreeTextEnabled();
        return new ChatSuggestionsResponse(freeText, items);
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

    @Transactional
    public ChatMessageResponse send(AuthUser principal, ChatSendRequest request) {
        boolean hasTopic = request.topic() != null && !request.topic().isBlank();
        boolean hasText = request.text() != null && !request.text().isBlank();
        if (!hasTopic && !hasText) {
            throw ApiException.badRequest("Vui lòng chọn câu hỏi có sẵn hoặc nhập nội dung câu hỏi");
        }

        ChatConversation conversation = ownedConversation(principal, request.conversationId());
        AssistantProvider provider = assistantProviderService.getActiveProvider();

        String userContent;
        String answer;
        String usedProviderName;

        if (hasTopic) {
            ChatTopic topic = ChatTopic.parse(request.topic())
                    .orElseThrow(() -> ApiException.badRequest("Câu hỏi không hợp lệ"));
            if (!topic.allowedFor(principal)) {
                throw ApiException.forbidden("Bạn không có quyền dùng câu hỏi này");
            }
            userContent = topic.label();
            answer = provider.answerTopic(principal, topic);
            usedProviderName = "RULE";
        } else {
            userContent = request.text().trim();
            answer = provider.answerText(principal, userContent, conversation);
            usedProviderName = provider.getProviderName().toUpperCase(Locale.ROOT);
        }

        if (messageRepository.findTop1ByConversation_IdOrderByCreatedAtDesc(conversation.getId()).isEmpty()) {
            String title = userContent.length() > 60 ? userContent.substring(0, 57) + "..." : userContent;
            conversation.setTitle(title);
        }

        ChatMessage userMessage = message(conversation, ChatMessage.Sender.USER, userContent, "USER");
        messageRepository.save(userMessage);

        ChatMessage assistantMessage = message(conversation, ChatMessage.Sender.ASSISTANT, answer, usedProviderName);
        messageRepository.save(assistantMessage);

        conversation.setUpdatedAt(LocalDateTime.now(clock));
        conversationRepository.save(conversation);
        return toResponse(assistantMessage);
    }

    @Transactional(readOnly = true)
    public AiHealthResponse aiHealth() {
        AssistantProvider active = assistantProviderService.getActiveProvider();
        return new AiHealthResponse(
                aiConfig.isOllamaEnabled(),
                active.isAvailable(),
                aiConfig.getProvider(),
                aiConfig.getOllamaModel(),
                aiConfig.getOllamaBaseUrl()
        );
    }

    private ChatConversation ownedConversation(AuthUser principal, Long id) {
        return conversationRepository.findByIdAndUser_Id(id, principal.id())
                .orElseThrow(() -> ApiException.notFound("hội thoại"));
    }

    private ChatMessage message(ChatConversation conversation, ChatMessage.Sender sender, String content, String provider) {
        ChatMessage message = new ChatMessage();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(content);
        message.setProvider(provider != null ? provider : "RULE");
        message.setCreatedAt(LocalDateTime.now(clock));
        return message;
    }

    private static ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getSender().name(),
                message.getContent(),
                message.getCreatedAt(),
                message.getProvider()
        );
    }
}
