package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.MessageResponseDto;
import com.gymflow.dto.Dtos.RecallSyncResponse;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;

/**
 * Tệp đính kèm, thu hồi và "xoá phía tôi" cho tin nhắn Hội viên ↔ HLV.
 *
 * <ul>
 *   <li>Gửi tệp: chỉ người trong hội thoại (Admin chỉ xem); kiểm tra loại tệp từ nội dung, dung lượng theo loại,
 *       chú thích ≤ 2000 ký tự, chung giới hạn 20 tin/phút và tối đa 200 MB tệp / 24 giờ / người.</li>
 *   <li>Tải tệp: người trong hội thoại hoặc Admin (có ghi nhật ký); tin đã thu hồi / đã xoá phía mình → 404.</li>
 *   <li>Thu hồi: chỉ người gửi, trong {@value #RECALL_MINUTES} phút; xoá nội dung + dữ liệu tệp, hai bên thấy "đã thu hồi".</li>
 *   <li>Xoá phía tôi: ẩn với người bấm; tin của người kia chưa đọc thì coi như đã đọc để không còn đếm chưa đọc.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class MessageAttachmentService {

    public static final int RECALL_MINUTES = 15;
    public static final int MAX_CAPTION = 2000;

    private final MessageRepository messageRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final MessageHiddenRepository hiddenRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final ConversationService conversationService;
    private final MessageRateLimiter rateLimiter;
    private final AuditService auditService;
    private final Clock clock;

    public record AttachmentFile(byte[] data, String contentType, String fileName, boolean inline) {
    }

    @Transactional
    public MessageResponseDto upload(AuthUser user, Long conversationId, MultipartFile file, String rawCaption) {
        if (user.isAdmin()) {
            throw ApiException.forbidden("Quản trị viên chỉ có quyền xem tin nhắn, không thể gửi tin");
        }
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Vui lòng chọn tệp cần gửi");
        }
        String caption = rawCaption == null ? "" : rawCaption.trim();
        if (caption.length() > MAX_CAPTION) {
            throw ApiException.badRequest("Tin nhắn tối đa 2000 ký tự");
        }
        if (file.getSize() > AttachmentRules.MAX_VIDEO) {
            throw ApiException.badRequest("Tệp quá lớn: ảnh và tệp tối đa 10 MB, video tối đa 25 MB");
        }

        Conversation c = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("hội thoại"));
        conversationService.checkParticipant(user, c);

        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("Không đọc được tệp, vui lòng thử lại");
        }
        String name = AttachmentRules.sanitizeFileName(file.getOriginalFilename(), null);
        AttachmentRules.Detected type = AttachmentRules.detect(data, name);

        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        long usedToday = messageRepository.sumAttachmentBytesSince(user.id(), now.minusHours(24));
        if (usedToday + data.length > AttachmentRules.DAILY_QUOTA) {
            throw ApiException.tooManyRequests("Bạn đã gửi quá 200 MB tệp trong 24 giờ qua. Vui lòng thử lại sau.");
        }
        rateLimiter.checkLimit(user.id());

        User sender = userRepository.findById(user.id()).orElseThrow(() -> ApiException.notFound("tài khoản"));
        Message msg = new Message(c, sender, user.role(), caption, null);
        msg.setKind(type.kind());
        msg.setAttachmentName(name);
        msg.setAttachmentType(type.contentType());
        msg.setAttachmentSize((long) data.length);
        msg.setCreatedAt(now);
        msg = messageRepository.save(msg);

        MessageAttachment a = new MessageAttachment();
        a.setMessageId(msg.getId());
        a.setSizeBytes(data.length);
        a.setSha256(sha256(data));
        a.setData(data);
        a.setCreatedAt(now);
        attachmentRepository.save(a);

        c.setLastMessageAt(now);
        c.setUpdatedAt(now);
        conversationRepository.save(c);
        return conversationService.toMessageDto(msg);
    }

    @Transactional(readOnly = true)
    public AttachmentFile download(AuthUser user, Long messageId) {
        Message m = loadMessage(messageId);
        conversationService.checkParticipant(user, m.getConversation());
        if (m.getRecalledAt() != null) throw ApiException.notFound("tệp – tin nhắn đã được thu hồi");
        if (!user.isAdmin() && hiddenRepository.existsByMessageIdAndUserId(messageId, user.id())) {
            throw ApiException.notFound("tệp đính kèm");
        }
        if (m.getAttachmentType() == null) throw ApiException.notFound("tệp đính kèm");
        MessageAttachment a = attachmentRepository.findById(messageId)
                .orElseThrow(() -> ApiException.notFound("tệp đính kèm"));
        if (user.isAdmin()) {
            auditService.log("MESSAGE_ATTACHMENT_VIEW", "MESSAGE", messageId,
                    "Quản lý xem tệp trong hội thoại #" + m.getConversation().getId());
        }
        return new AttachmentFile(a.getData(), m.getAttachmentType(), m.getAttachmentName(),
                AttachmentRules.inline(m.getKind()));
    }

    @Transactional
    public MessageResponseDto recall(AuthUser user, Long messageId) {
        if (user.isAdmin()) throw ApiException.forbidden("Quản trị viên không thể thu hồi tin nhắn");
        Message m = loadMessage(messageId);
        conversationService.checkParticipant(user, m.getConversation());
        if (!Objects.equals(m.getSenderUser().getId(), user.id())) {
            throw ApiException.forbidden("Chỉ người gửi mới thu hồi được tin nhắn");
        }
        if (m.getRecalledAt() != null) return conversationService.toMessageDto(m);
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        if (Duration.between(m.getCreatedAt(), now).toMinutes() >= RECALL_MINUTES) {
            throw ApiException.badRequest("Chỉ thu hồi được tin nhắn trong vòng 15 phút sau khi gửi");
        }
        m.setRecalledAt(now);
        m.setBody("");
        m.setAttachmentUrl(null);
        m.setAttachmentName(null);
        m.setAttachmentType(null);
        // giữ attachment_size để vẫn tính vào hạn mức ngày (chống gửi – thu hồi liên tục)
        if (attachmentRepository.existsById(messageId)) attachmentRepository.deleteById(messageId);
        messageRepository.save(m);
        return conversationService.toMessageDto(m);
    }

    @Transactional
    public void hide(AuthUser user, Long messageId) {
        if (user.isAdmin()) throw ApiException.forbidden("Quản trị viên không thể xoá tin nhắn");
        Message m = loadMessage(messageId);
        conversationService.checkParticipant(user, m.getConversation());
        if (hiddenRepository.existsByMessageIdAndUserId(messageId, user.id())) return;
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        hiddenRepository.save(new MessageHidden(messageId, user.id(), now));
        if (!Objects.equals(m.getSenderUser().getId(), user.id()) && m.getReadAt() == null) {
            m.setReadAt(now);
            messageRepository.save(m);
        }
    }

    @Transactional(readOnly = true)
    public RecallSyncResponse recalledSince(AuthUser user, Long conversationId, LocalDateTime since) {
        Conversation c = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("hội thoại"));
        conversationService.checkParticipant(user, c);
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        List<Long> ids = since == null ? List.of() : messageRepository.findRecalledSince(conversationId, since);
        return new RecallSyncResponse(ids, now);
    }

    private Message loadMessage(Long id) {
        Message m = messageRepository.findById(id).orElseThrow(() -> ApiException.notFound("tin nhắn"));
        if (m.getDeletedAt() != null) throw ApiException.notFound("tin nhắn");
        return m;
    }

    static String sha256(byte[] data) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
