package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.MessageResponseDto;
import com.gymflow.dto.Dtos.RecallSyncResponse;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageAttachmentServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 14, 10, 0);
    private static final byte[] JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0};

    @Mock MessageRepository messageRepository;
    @Mock MessageAttachmentRepository attachmentRepository;
    @Mock MessageHiddenRepository hiddenRepository;
    @Mock ConversationRepository conversationRepository;
    @Mock UserRepository userRepository;
    @Mock AccessService accessService;
    @Mock AuditService auditService;
    @Mock TrainerRepository trainerRepository;
    @Mock MemberRepository memberRepository;
    @Mock WorkoutPlanRepository workoutPlanRepository;

    MessageAttachmentService service;
    Conversation conv;
    User memberUser;
    User trainerUser;
    AuthUser member = new AuthUser(10L, "m@test.com", Role.MEMBER, "Hội Viên");
    AuthUser trainer = new AuthUser(20L, "t@test.com", Role.TRAINER, "HLV");
    AuthUser outsider = new AuthUser(30L, "x@test.com", Role.MEMBER, "Người lạ");
    AuthUser admin = new AuthUser(1L, "a@test.com", Role.ADMIN, "Admin");

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        ConversationService conversationService = new ConversationService(conversationRepository, messageRepository,
                trainerRepository, memberRepository, workoutPlanRepository, userRepository, accessService, auditService,
                new MessageRateLimiter());
        service = new MessageAttachmentService(messageRepository, attachmentRepository, hiddenRepository,
                conversationRepository, userRepository, conversationService, new MessageRateLimiter(), auditService, clock);

        memberUser = user(10L, Role.MEMBER);
        trainerUser = user(20L, Role.TRAINER);
        Member m = new Member();
        m.setId(100L);
        m.setUser(memberUser);
        Trainer t = new Trainer();
        t.setId(200L);
        t.setUser(trainerUser);
        t.setActive(true);
        conv = new Conversation(m, t);
        conv.setId(1L);
    }

    private static User user(Long id, Role role) {
        User u = new User();
        u.setId(id);
        u.setFullName("U" + id);
        u.setRole(role);
        return u;
    }

    private Message message(Long id, User sender, String kind, LocalDateTime createdAt) {
        Message msg = new Message(conv, sender, sender.getRole(), "chú thích", null);
        msg.setId(id);
        msg.setKind(kind);
        msg.setCreatedAt(createdAt);
        if (!"TEXT".equals(kind)) {
            msg.setAttachmentName("anh.jpg");
            msg.setAttachmentType("image/jpeg");
            msg.setAttachmentSize(8L);
        }
        return msg;
    }

    private void stubUploadHappyPath() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        when(messageRepository.sumAttachmentBytesSince(eq(10L), any())).thenReturn(0L);
        when(userRepository.findById(10L)).thenReturn(Optional.of(memberUser));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message saved = inv.getArgument(0);
            saved.setId(500L);
            return saved;
        });
    }

    @Test
    @DisplayName("Gửi ảnh: lưu tin IMAGE + dữ liệu tệp, tên tệp được làm sạch, chú thích được trim")
    void uploadImage() {
        stubUploadHappyPath();
        MockMultipartFile file = new MockMultipartFile("file", "../Ảnh  buổi tập.jpg", "application/octet-stream", JPG);

        MessageResponseDto dto = service.upload(member, 1L, file, "  form squat  ");

        assertThat(dto.kind()).isEqualTo("IMAGE");
        assertThat(dto.attachmentName()).isEqualTo("Ảnh buổi tập.jpg");
        assertThat(dto.attachmentType()).isEqualTo("image/jpeg");
        assertThat(dto.attachmentSize()).isEqualTo(8L);
        assertThat(dto.body()).isEqualTo("form squat");
        assertThat(dto.recalled()).isFalse();
        ArgumentCaptor<MessageAttachment> cap = ArgumentCaptor.forClass(MessageAttachment.class);
        verify(attachmentRepository).save(cap.capture());
        assertThat(cap.getValue().getMessageId()).isEqualTo(500L);
        assertThat(cap.getValue().getSha256()).hasSize(64);
        assertThat(conv.getLastMessageAt()).isEqualTo(NOW);
    }

    @Test
    @DisplayName("Gửi tệp: Admin bị chặn, người ngoài hội thoại bị chặn, tệp rỗng / chú thích quá dài bị chặn")
    void uploadValidation() {
        MockMultipartFile ok = new MockMultipartFile("file", "a.jpg", "image/jpeg", JPG);
        assertThatThrownBy(() -> service.upload(admin, 1L, ok, null)).isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.upload(member, 1L, new MockMultipartFile("file", "a.jpg", "image/jpeg", new byte[0]), null))
                .hasMessage("Vui lòng chọn tệp cần gửi");
        assertThatThrownBy(() -> service.upload(member, 1L, null, null)).hasMessage("Vui lòng chọn tệp cần gửi");
        assertThatThrownBy(() -> service.upload(member, 1L, ok, "x".repeat(2001))).hasMessage("Tin nhắn tối đa 2000 ký tự");

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        assertThatThrownBy(() -> service.upload(outsider, 1L, ok, null))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Gửi tệp đổi đuôi (.exe → .jpg) bị từ chối, không lưu gì")
    void uploadRejectsDisguisedFile() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        MockMultipartFile exe = new MockMultipartFile("file", "anh.jpg", "image/jpeg", new byte[]{'M', 'Z', 0, 0, 0, 0});
        assertThatThrownBy(() -> service.upload(member, 1L, exe, null)).hasMessageContaining("không khớp");
        verify(messageRepository, never()).save(any());
        verify(attachmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Vượt hạn mức 200 MB / 24 giờ → 429, không lưu")
    void uploadDailyQuota() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        when(messageRepository.sumAttachmentBytesSince(eq(10L), any())).thenReturn(AttachmentRules.DAILY_QUOTA - 4);
        MockMultipartFile file = new MockMultipartFile("file", "a.jpg", "image/jpeg", JPG);
        assertThatThrownBy(() -> service.upload(member, 1L, file, null))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Thu hồi trong 15 phút: xoá nội dung + tệp, hai bên thấy đã thu hồi; gọi lại vẫn trả kết quả")
    void recallWithinWindow() {
        Message msg = message(7L, memberUser, "IMAGE", NOW.minusMinutes(14).minusSeconds(59));
        when(messageRepository.findById(7L)).thenReturn(Optional.of(msg));
        when(attachmentRepository.existsById(7L)).thenReturn(true);

        MessageResponseDto dto = service.recall(member, 7L);

        assertThat(dto.recalled()).isTrue();
        assertThat(dto.body()).isEmpty();
        assertThat(dto.attachmentName()).isNull();
        assertThat(msg.getRecalledAt()).isEqualTo(NOW);
        assertThat(msg.getAttachmentSize()).isEqualTo(8L);
        verify(attachmentRepository).deleteById(7L);

        assertThat(service.recall(member, 7L).recalled()).isTrue();
        verify(attachmentRepository, times(1)).deleteById(7L);
    }

    @Test
    @DisplayName("Thu hồi: quá 15 phút, không phải người gửi, Admin đều bị chặn")
    void recallRules() {
        Message old = message(8L, memberUser, "TEXT", NOW.minusMinutes(15));
        when(messageRepository.findById(8L)).thenReturn(Optional.of(old));
        assertThatThrownBy(() -> service.recall(member, 8L)).hasMessageContaining("15 phút");
        assertThat(old.getRecalledAt()).isNull();

        Message fresh = message(9L, memberUser, "TEXT", NOW.minusMinutes(1));
        when(messageRepository.findById(9L)).thenReturn(Optional.of(fresh));
        assertThatThrownBy(() -> service.recall(trainer, 9L)).hasMessage("Chỉ người gửi mới thu hồi được tin nhắn");
        assertThatThrownBy(() -> service.recall(admin, 9L))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.recall(outsider, 9L))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThat(fresh.getRecalledAt()).isNull();
    }

    @Test
    @DisplayName("Xoá phía tôi: chỉ ẩn với người bấm, tin chưa đọc của người kia thành đã đọc, bấm lại không lỗi")
    void hideForMe() {
        Message fromMember = message(11L, memberUser, "TEXT", NOW.minusDays(2));
        when(messageRepository.findById(11L)).thenReturn(Optional.of(fromMember));
        when(hiddenRepository.existsByMessageIdAndUserId(11L, 20L)).thenReturn(false, true);

        service.hide(trainer, 11L);
        service.hide(trainer, 11L);

        verify(hiddenRepository, times(1)).save(any(MessageHidden.class));
        assertThat(fromMember.getReadAt()).isEqualTo(NOW);
        assertThat(fromMember.getRecalledAt()).isNull();
        assertThatThrownBy(() -> service.hide(outsider, 11L))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.hide(admin, 11L))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    @DisplayName("Tải tệp: đúng người được tải; đã thu hồi / đã ẩn / người ngoài → chặn; Admin xem có ghi nhật ký")
    void downloadRules() {
        Message msg = message(12L, memberUser, "IMAGE", NOW.minusMinutes(3));
        when(messageRepository.findById(12L)).thenReturn(Optional.of(msg));
        MessageAttachment a = new MessageAttachment();
        a.setMessageId(12L);
        a.setData(JPG);
        when(attachmentRepository.findById(12L)).thenReturn(Optional.of(a));

        MessageAttachmentService.AttachmentFile f = service.download(trainer, 12L);
        assertThat(f.contentType()).isEqualTo("image/jpeg");
        assertThat(f.inline()).isTrue();
        assertThat(f.data()).isEqualTo(JPG);

        service.download(admin, 12L);
        verify(auditService).log(eq("MESSAGE_ATTACHMENT_VIEW"), eq("MESSAGE"), eq(12L), any());

        assertThatThrownBy(() -> service.download(outsider, 12L))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        when(hiddenRepository.existsByMessageIdAndUserId(12L, 10L)).thenReturn(true);
        assertThatThrownBy(() -> service.download(member, 12L))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        msg.setRecalledAt(NOW);
        assertThatThrownBy(() -> service.download(trainer, 12L))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("Thăm dò thu hồi: lần đầu chỉ lấy giờ máy chủ, lần sau trả id tin vừa thu hồi")
    void recallSync() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conv));
        RecallSyncResponse first = service.recalledSince(member, 1L, null);
        assertThat(first.recalledIds()).isEmpty();
        assertThat(first.serverTime()).isEqualTo(NOW);
        verify(messageRepository, never()).findRecalledSince(any(), any());

        when(messageRepository.findRecalledSince(1L, NOW.minusSeconds(5))).thenReturn(List.of(7L));
        assertThat(service.recalledSince(trainer, 1L, NOW.minusSeconds(5)).recalledIds()).containsExactly(7L);
        assertThatThrownBy(() -> service.recalledSince(outsider, 1L, null))
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }
}
