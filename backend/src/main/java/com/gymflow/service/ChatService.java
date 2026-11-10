package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.ChatConversation;
import com.gymflow.domain.ChatMessage;
import com.gymflow.domain.User;
import com.gymflow.dto.Dtos.ChatConversationResponse;
import com.gymflow.dto.Dtos.ChatCreateConversationResponse;
import com.gymflow.dto.Dtos.ChatHistoryResponse;
import com.gymflow.dto.Dtos.ChatMessageResponse;
import com.gymflow.dto.Dtos.ChatSendRequest;
import com.gymflow.dto.Dtos.ChatSuggestion;
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

/**
 * Trợ lý GymFlow dạng câu trả lời sẵn. Không dùng API key, không gọi dịch vụ AI bên ngoài.
 * Câu trả lời được tạo từ dữ liệu nội bộ qua {@link ChatAssistantService}.
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatAssistantService assistant;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<ChatSuggestion> suggestions(AuthUser principal) {
        return assistant.suggestions(principal);
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
        ChatTopic topic = ChatTopic.parse(request.topic())
                .orElseThrow(() -> ApiException.badRequest("Câu hỏi không hợp lệ"));
        if (!topic.allowedFor(principal)) {
            throw ApiException.forbidden("Bạn không có quyền dùng câu hỏi này");
        }

        ChatConversation conversation = ownedConversation(principal, request.conversationId());
        if (messageRepository.findTop1ByConversation_IdOrderByCreatedAtDesc(conversation.getId()).isEmpty()) {
            conversation.setTitle(topic.label());
        }
        messageRepository.save(message(conversation, ChatMessage.Sender.USER, topic.label()));

        String answer = assistant.answer(principal, topic);
        ChatMessage assistantMessage = message(conversation, ChatMessage.Sender.ASSISTANT, answer);
        messageRepository.save(assistantMessage);

        conversation.setUpdatedAt(LocalDateTime.now(clock));
        conversationRepository.save(conversation);
        return toResponse(assistantMessage);
    }

    private ChatConversation ownedConversation(AuthUser principal, Long id) {
        return conversationRepository.findByIdAndUser_Id(id, principal.id())
                .orElseThrow(() -> ApiException.notFound("hội thoại"));
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
