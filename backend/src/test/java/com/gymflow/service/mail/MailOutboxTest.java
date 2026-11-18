package com.gymflow.service.mail;

import com.gymflow.domain.*;
import com.gymflow.repository.EmailLogRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** V55 · Gửi một lần cho mỗi sự kiện, tôn trọng tuỳ chọn tắt email, ghi lỗi để thử lại. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MailOutboxTest {

    @Mock ObjectProvider<JavaMailSender> senderProvider;
    @Mock JavaMailSender sender;
    @Mock EmailLogRepository logRepository;
    @Mock EmailPreferenceService preferences;

    MailOutbox outbox;
    User user;
    EmailPreference pref;
    final EmailLayout.Rendered content = EmailLayout.create(false).title("Xin chào").render("Tiêu đề");

    @BeforeEach
    void setUp() {
        outbox = new MailOutbox(senderProvider, logRepository, preferences,
                Clock.fixed(Instant.parse("2026-11-18T01:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh")));
        ReflectionTestUtils.setField(outbox, "from", "no-reply@gymflow.io.vn");
        ReflectionTestUtils.setField(outbox, "fromName", "GymFlow");
        when(senderProvider.getIfAvailable()).thenReturn(sender);
        when(sender.createMimeMessage()).thenAnswer(inv -> new MimeMessage(Session.getInstance(new Properties())));
        when(logRepository.save(any(EmailLog.class))).thenAnswer(inv -> inv.getArgument(0));
        user = new User();
        user.setId(7L);
        user.setEmail("an@example.com");
        user.setStatus(UserStatus.ACTIVE);
        pref = new EmailPreference();
        pref.setUserId(7L);
        pref.setUnsubscribeToken("a".repeat(64));
        when(preferences.forUser(7L)).thenReturn(pref);
        when(preferences.oneClickUrl(any(), any())).thenReturn("https://gymflow.io.vn/api/email/unsubscribe/x?kind=RENEWAL");
    }

    @Test
    @DisplayName("Gửi thành công: ghi SENT, có tiêu đề List-Unsubscribe để Gmail hiện nút huỷ đăng ký")
    void sendsOnceAndLogs() throws Exception {
        when(logRepository.findByKindAndRefKey(EmailKind.RENEWAL, "sub-1")).thenReturn(Optional.empty());

        boolean sent = outbox.sendOnce(user, EmailKind.RENEWAL, "sub-1", p -> content);

        assertThat(sent).isTrue();
        ArgumentCaptor<MimeMessage> msg = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(msg.capture());
        assertThat(msg.getValue().getHeader("List-Unsubscribe")[0]).contains("/api/email/unsubscribe/");
        ArgumentCaptor<EmailLog> log = ArgumentCaptor.forClass(EmailLog.class);
        verify(logRepository).save(log.capture());
        assertThat(log.getValue().getStatus()).isEqualTo(EmailLog.SENT);
        assertThat(log.getValue().getAttempts()).isEqualTo(1);
        assertThat(log.getValue().getSubject()).isEqualTo("Tiêu đề");
    }

    @Test
    @DisplayName("Đã gửi rồi thì không gửi lại")
    void neverSendsTwice() {
        EmailLog done = new EmailLog();
        done.setStatus(EmailLog.SENT);
        when(logRepository.findByKindAndRefKey(EmailKind.RENEWAL, "sub-1")).thenReturn(Optional.of(done));

        assertThat(outbox.sendOnce(user, EmailKind.RENEWAL, "sub-1", p -> content)).isFalse();
        verify(sender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Người nhận tắt loại email: không gửi, ghi SKIPPED, không dựng nội dung")
    void respectsOptOut() {
        pref.setRenewal(false);
        when(logRepository.findByKindAndRefKey(EmailKind.RENEWAL, "sub-2")).thenReturn(Optional.empty());

        boolean sent = outbox.sendOnce(user, EmailKind.RENEWAL, "sub-2", p -> { throw new AssertionError("không được dựng nội dung"); });

        assertThat(sent).isFalse();
        verify(sender, never()).send(any(MimeMessage.class));
        ArgumentCaptor<EmailLog> log = ArgumentCaptor.forClass(EmailLog.class);
        verify(logRepository).save(log.capture());
        assertThat(log.getValue().getStatus()).isEqualTo(EmailLog.SKIPPED);
    }

    @Test
    @DisplayName("SMTP lỗi: ghi FAILED để lần chạy sau thử lại; quá 3 lần thì thôi")
    void failureIsLoggedAndRetriedUpToLimit() {
        when(logRepository.findByKindAndRefKey(EmailKind.WEEKLY_DIGEST, "m1-2026W47")).thenReturn(Optional.empty());
        doThrow(new MailSendException("SMTP down")).when(sender).send(any(MimeMessage.class));

        assertThat(outbox.sendOnce(user, EmailKind.WEEKLY_DIGEST, "m1-2026W47", p -> content)).isFalse();
        ArgumentCaptor<EmailLog> log = ArgumentCaptor.forClass(EmailLog.class);
        verify(logRepository).save(log.capture());
        assertThat(log.getValue().getStatus()).isEqualTo(EmailLog.FAILED);
        assertThat(log.getValue().getError()).contains("SMTP down");

        EmailLog exhausted = new EmailLog();
        exhausted.setStatus(EmailLog.FAILED);
        exhausted.setAttempts(MailOutbox.MAX_ATTEMPTS);
        when(logRepository.findByKindAndRefKey(EmailKind.WEEKLY_DIGEST, "m1-2026W46")).thenReturn(Optional.of(exhausted));
        assertThat(outbox.sendOnce(user, EmailKind.WEEKLY_DIGEST, "m1-2026W46", p -> content)).isFalse();
        verify(sender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Tài khoản bị khoá thì không gửi email tự động")
    void lockedUserGetsNothing() {
        user.setStatus(UserStatus.LOCKED);
        assertThat(outbox.sendOnce(user, EmailKind.RENEWAL, "sub-3", p -> content)).isFalse();
        verifyNoInteractions(logRepository);
    }
}
