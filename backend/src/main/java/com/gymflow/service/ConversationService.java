package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.PageResponse;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
    private final MemberRepository memberRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final UserRepository userRepository;
    private final AccessService access;
    private final AuditService auditService;
    private final MessageRateLimiter messageRateLimiter;

    public boolean isTrainerAssignedToMember(Member member, Trainer trainer) {
        if (member == null || trainer == null) {
            return false;
        }
        if (member.getTrainer() != null && Objects.equals(member.getTrainer().getId(), trainer.getId())) {
            return true;
        }
        return workoutPlanRepository.existsByMemberIdAndTrainerIdAndStatus(member.getId(), trainer.getId(), PlanStatus.ACTIVE);
    }

    @Transactional
    public ConversationResponse getOrCreate(AuthUser user, CreateConversationRequest req) {
        if (user.isAdmin()) {
            throw ApiException.forbidden("Quản trị viên chỉ có quyền xem tin nhắn, không thể tạo hội thoại");
        }

        Member member;
        Trainer trainer;

        if (user.isMember()) {
            member = access.requireMemberOf(user);
            Long trainerId = req != null ? req.trainerId() : null;
            if (trainerId == null) {
                if (member.getTrainer() != null) {
                    trainerId = member.getTrainer().getId();
                } else {
                    Optional<WorkoutPlan> activePlan = workoutPlanRepository
                            .findFirstByMemberIdAndStatusOrderByStartDateDesc(member.getId(), PlanStatus.ACTIVE);
                    if (activePlan.isPresent() && activePlan.get().getTrainer() != null) {
                        trainerId = activePlan.get().getTrainer().getId();
                    } else {
                        throw ApiException.badRequest("Hội viên chưa có huấn luyện viên phụ trách");
                    }
                }
            }
            trainer = trainerRepository.findById(trainerId)
                    .orElseThrow(() -> ApiException.notFound("huấn luyện viên"));

            if (!isTrainerAssignedToMember(member, trainer)) {
                throw ApiException.forbidden("Hội viên chỉ có thể nhắn tin với Huấn luyện viên đang phụ trách");
            }
        } else if (user.isTrainer()) {
            trainer = access.requireTrainerOf(user);
            Long memberId = req != null ? req.memberId() : null;
            if (memberId == null) {
                throw ApiException.badRequest("Vui lòng chọn hội viên");
            }
            member = memberRepository.findById(memberId)
                    .orElseThrow(() -> ApiException.notFound("hội viên"));

            if (!isTrainerAssignedToMember(member, trainer)) {
                throw ApiException.forbidden("Huấn luyện viên chỉ có thể nhắn tin với hội viên mình phụ trách");
            }
        } else {
            throw ApiException.forbidden();
        }

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

    @Transactional
    public ConversationResponse getOrCreate(AuthUser user, Long trainerId) {
        return getOrCreate(user, new CreateConversationRequest(trainerId, null));
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
        if (user.isAdmin()) {
            auditService.log("CONVERSATION_VIEW", "CONVERSATION", conversationId,
                    "Quản lý xem hội thoại #" + conversationId);
        }
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
    public MessageResponseDto sendMessage(AuthUser user, Long conversationId, String rawBody, String attachmentUrl) {
        if (user.isAdmin()) {
            throw ApiException.forbidden("Quản trị viên chỉ có quyền xem tin nhắn, không thể gửi tin");
        }
        if (rawBody == null || rawBody.trim().isEmpty()) {
            throw ApiException.badRequest("Nội dung tin nhắn không được để trống");
        }
        String body = rawBody.trim();
        if (body.length() > 2000) {
            throw ApiException.badRequest("Tin nhắn tối đa 2000 ký tự");
        }
        if (attachmentUrl != null && attachmentUrl.length() > 500) {
            throw ApiException.badRequest("Đường dẫn đính kèm tối đa 500 ký tự");
        }

        messageRateLimiter.checkLimit(user.id());

        Conversation c = loadConversation(conversationId);
        checkParticipant(user, c);

        User sender = userRepository.findById(user.id())
                .orElseThrow(() -> ApiException.notFound("tài khoản"));

        Role senderRole = user.role();
        Message msg = new Message(c, sender, senderRole, body, attachmentUrl);
        msg = messageRepository.save(msg);

        c.setLastMessageAt(msg.getCreatedAt());
        c.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(c);

        return toMessageDto(msg);
    }

    @Transactional
    public MessageResponseDto sendMessage(AuthUser user, Long conversationId, String rawBody) {
        return sendMessage(user, conversationId, rawBody, null);
    }

    @Transactional
    public void markAsRead(AuthUser user, Long conversationId) {
        if (user.isAdmin()) {
            return;
        }
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
        if (user.isAdmin()) {
            return;
        }
        boolean isMember = Objects.equals(c.getMember().getUser().getId(), user.id());
        boolean isTrainer = Objects.equals(c.getTrainer().getUser().getId(), user.id());
        if (!isMember && !isTrainer) {
            throw ApiException.forbidden();
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminConversationSummary> adminListConversations(AuthUser user, String q, Long trainerId, int page, int size) {
        if (!user.isAdmin()) {
            throw ApiException.forbidden();
        }
        int pageSize = (size == 10 || size == 20 || size == 50) ? size : 20;
        int pageIndex = Math.max(page, 0);
        String search = (q != null && !q.trim().isEmpty()) ? q.trim() : null;

        Page<Conversation> p = conversationRepository.findAllAdmin(
                search,
                trainerId,
                PageRequest.of(pageIndex, pageSize)
        );

        return PageResponse.of(p, c -> {
            User mu = c.getMember().getUser();
            User tu = c.getTrainer().getUser();
            String memberAvatar = mu.getAvatarUpdatedAt() != null ? "/api/users/" + mu.getId() + "/avatar?v=" + mu.getAvatarUpdatedAt() : null;
            String trainerAvatar = tu.getAvatarUpdatedAt() != null ? "/api/users/" + tu.getId() + "/avatar?v=" + tu.getAvatarUpdatedAt() : null;

            Message lastMsg = messageRepository.findFirstByConversationIdAndDeletedAtIsNullOrderByIdDesc(c.getId()).orElse(null);
            String snippet = null;
            LocalDateTime lastTime = c.getLastMessageAt();
            if (lastMsg != null) {
                snippet = lastMsg.getBody();
                if (snippet.length() > 80) {
                    snippet = snippet.substring(0, 80) + "...";
                }
                lastTime = lastMsg.getCreatedAt();
            }
            long count = messageRepository.countByConversationIdAndDeletedAtIsNull(c.getId());

            return new AdminConversationSummary(
                    c.getId(),
                    c.getMember().getId(),
                    mu.getFullName(),
                    memberAvatar,
                    c.getTrainer().getId(),
                    tu.getFullName(),
                    trainerAvatar,
                    snippet,
                    lastTime,
                    count,
                    c.getUpdatedAt() != null ? c.getUpdatedAt() : c.getCreatedAt(),
                    c.getCreatedAt()
            );
        });
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> adminGetConversationsByMember(AuthUser user, Long memberId) {
        if (!user.isAdmin()) {
            throw ApiException.forbidden();
        }
        List<Conversation> list = conversationRepository.findByMemberIdOrderByLastMessageAtDesc(memberId);
        return list.stream().map(c -> toResponse(c, user)).toList();
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

        MessageResponseDto lastMsg = messageRepository.findFirstByConversationIdAndDeletedAtIsNullOrderByIdDesc(c.getId())
                .map(this::toMessageDto)
                .orElse(null);

        long unread = user != null ? messageRepository.countUnreadInConversation(c.getId(), user.id()) : 0L;

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
                m.getSenderRole() != null ? m.getSenderRole().name() : null,
                m.getAttachmentUrl(),
                m.getBody(),
                m.getCreatedAt(),
                m.getReadAt()
        );
    }
}
