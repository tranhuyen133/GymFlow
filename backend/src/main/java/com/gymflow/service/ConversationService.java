package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.Conversation;
import com.gymflow.domain.Member;
import com.gymflow.domain.Message;
import com.gymflow.domain.Trainer;
import com.gymflow.domain.User;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.ConversationRepository;
import com.gymflow.repository.MessageRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final TrainerRepository trainerRepository;
    private final UserRepository userRepository;
    private final AccessService access;
    private final AuditService auditService;
    private final MessageRateLimiter messageRateLimiter;

    @Transactional
    public ConversationResponse getOrCreate(AuthUser user, Long trainerId) {
        if (!user.isMember()) {
            throw ApiException.forbidden();
        }
        Member member = access.requireMemberOf(user);
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> ApiException.notFound("huấn luyện viên"));
        if (!trainer.isActive()) {
            throw ApiException.badRequest("Huấn luyện viên hiện không hoạt động");
        }

        Optional<Conversation> existing = conversationRepository.findByMemberIdAndTrainerId(member.getId(), trainer.getId());
        if (existing.isPresent()) {
            return toResponse(existing.get(), user);
        }

        Conversation c = new Conversation(member, trainer);
        c = conversationRepository.save(c);
        auditService.log("CONVERSATION_CREATE", "CONVERSATION", c.getId(),
                "Tạo hội thoại giữa hội viên " + member.getId() + " và HLV " + trainer.getId());
        return toResponse(c, user);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listConversations(AuthUser user) {
        List<Conversation> list;
        if (user.isMember()) {
            Member m = access.requireMemberOf(user);
            list = conversationRepository.findByMemberId(m.getId());
        } else if (user.isTrainer()) {
            Trainer t = access.requireTrainerOf(user);
            list = conversationRepository.findByTrainerId(t.getId());
        } else {
            return List.of();
        }
        return list.stream().map(c -> toResponse(c, user)).toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponseDto> getMessages(AuthUser user, Long conversationId, Long before, int size) {
        Conversation c = loadConversation(conversationId);
        checkParticipant(user, c);
        int limit = Math.min(Math.max(size, 1), 50);
        List<Message> desc = messageRepository.findMessagesBefore(conversationId, before, PageRequest.of(0, limit));
        List<Message> asc = new ArrayList<>(desc);
        Collections.reverse(asc);
        return asc.stream().map(this::toMessageDto).toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponseDto> getNewMessages(AuthUser user, Long conversationId, Long after) {
        Conversation c = loadConversation(conversationId);
        checkParticipant(user, c);
        Long minId = after == null ? 0L : after;
        return messageRepository.findNewMessages(conversationId, minId).stream()
                .map(this::toMessageDto)
                .toList();
    }

    @Transactional
    public MessageResponseDto sendMessage(AuthUser user, Long conversationId, String rawBody) {
        if (rawBody == null || rawBody.trim().isEmpty()) {
            throw ApiException.badRequest("Nội dung tin nhắn không được để trống");
        }
        String body = rawBody.trim();
        if (body.length() > 2000) {
            throw ApiException.badRequest("Tin nhắn tối đa 2000 ký tự");
        }

        messageRateLimiter.checkLimit(user.id());

        Conversation c = loadConversation(conversationId);
        checkParticipant(user, c);

        User sender = userRepository.findById(user.id())
                .orElseThrow(() -> ApiException.notFound("tài khoản"));

        Message msg = new Message(c, sender, body);
        msg = messageRepository.save(msg);

        c.setLastMessageAt(msg.getCreatedAt());
        conversationRepository.save(c);

        return toMessageDto(msg);
    }

    @Transactional
    public void markAsRead(AuthUser user, Long conversationId) {
        Conversation c = loadConversation(conversationId);
        checkParticipant(user, c);
        messageRepository.markAsRead(conversationId, user.id(), LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(AuthUser user) {
        long count = messageRepository.countTotalUnreadForUser(user.id());
        return new UnreadCountResponse(count);
    }

    public void checkParticipant(AuthUser user, Conversation c) {
        boolean isMember = Objects.equals(c.getMember().getUser().getId(), user.id());
        boolean isTrainer = Objects.equals(c.getTrainer().getUser().getId(), user.id());
        if (!isMember && !isTrainer) {
            throw ApiException.forbidden();
        }
    }

    private Conversation loadConversation(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("hội thoại"));
    }

    private ConversationResponse toResponse(Conversation c, AuthUser user) {
        User mu = c.getMember().getUser();
        User tu = c.getTrainer().getUser();
        String memberAvatar = mu.getAvatarUpdatedAt() != null ? "/api/users/" + mu.getId() + "/avatar?v=" + mu.getAvatarUpdatedAt() : null;
        String trainerAvatar = tu.getAvatarUpdatedAt() != null ? "/api/users/" + tu.getId() + "/avatar?v=" + tu.getAvatarUpdatedAt() : null;

        MessageResponseDto lastMsg = messageRepository.findFirstByConversationIdOrderByIdDesc(c.getId())
                .map(this::toMessageDto)
                .orElse(null);

        long unread = messageRepository.countUnreadInConversation(c.getId(), user.id());

        String relation = (c.getMember().getTrainer() != null &&
                Objects.equals(c.getMember().getTrainer().getId(), c.getTrainer().getId()))
                ? "ASSIGNED" : "CONSULTING";

        return new ConversationResponse(
                c.getId(),
                c.getMember().getId(),
                mu.getFullName(),
                memberAvatar,
                c.getTrainer().getId(),
                tu.getFullName(),
                trainerAvatar,
                c.getCreatedAt(),
                c.getLastMessageAt(),
                lastMsg,
                unread,
                relation
        );
    }

    private MessageResponseDto toMessageDto(Message m) {
        return new MessageResponseDto(
                m.getId(),
                m.getConversation().getId(),
                m.getSenderUser().getId(),
                m.getSenderUser().getFullName(),
                m.getBody(),
                m.getCreatedAt(),
                m.getReadAt()
        );
    }
}
