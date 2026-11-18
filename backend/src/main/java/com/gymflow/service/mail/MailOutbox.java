package com.gymflow.service.mail;

import com.gymflow.common.ApiException;
import com.gymflow.domain.EmailKind;
import com.gymflow.domain.EmailLog;
import com.gymflow.domain.EmailPreference;
import com.gymflow.domain.User;
import com.gymflow.domain.UserStatus;
import com.gymflow.repository.EmailLogRepository;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.function.Function;

/**
 * V55 · Gửi email HTML (kèm bản chữ trơn) và ghi nhật ký.
 * sendOnce: mỗi (loại, mã sự kiện) chỉ gửi một lần; người nhận tắt loại email đó thì ghi SKIPPED, không gửi.
 * Gửi lỗi ghi FAILED và được thử lại tối đa 3 lần ở lần chạy sau của cùng việc.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailOutbox {

    public static final int MAX_ATTEMPTS = 3;

    private final ObjectProvider<JavaMailSender> senderProvider;
    private final EmailLogRepository logRepository;
    private final EmailPreferenceService preferences;
    private final Clock clock;

    @Value("${app.mail.from:no-reply@gymflow.local}")
    private String from;

    @Value("${app.mail.from-name:GymFlow}")
    private String fromName;

    /** spring.mail.host để trống (máy local) thì Spring vẫn tạo JavaMailSender: coi như chưa cấu hình để không ghi lỗi hàng loạt. */
    public boolean configured() {
        JavaMailSender sender = senderProvider.getIfAvailable();
        if (sender == null) return false;
        return !(sender instanceof JavaMailSenderImpl impl) || (impl.getHost() != null && !impl.getHost().isBlank());
    }

    /**
     * Gửi một email tự động cho user. render nhận tuỳ chọn của người nhận (ngôn ngữ, mã tắt email) và trả nội dung.
     * Trả về true nếu lần này đã gửi thành công.
     */
    public boolean sendOnce(User user, EmailKind kind, String refKey, Function<EmailPreference, EmailLayout.Rendered> render) {
        if (user == null || user.getEmail() == null || user.getStatus() != UserStatus.ACTIVE || !configured()) return false;
        String ref = refKey.length() > 100 ? refKey.substring(0, 100) : refKey;
        EmailLog existing = logRepository.findByKindAndRefKey(kind, ref).orElse(null);
        if (existing != null && (!EmailLog.FAILED.equals(existing.getStatus()) || existing.getAttempts() >= MAX_ATTEMPTS)) return false;

        EmailPreference pref = preferences.forUser(user.getId());
        EmailLog entry = existing != null ? existing : newEntry(user, kind, ref);
        if (!pref.allows(kind)) {
            entry.setStatus(EmailLog.SKIPPED);
            entry.setSubject(trim("(" + kind.name() + ") – người nhận đã tắt loại email này", 200));
            logRepository.save(entry);
            return false;
        }
        EmailLayout.Rendered content = render.apply(pref);
        entry.setSubject(trim(content.subject(), 200));
        entry.setAttempts(entry.getAttempts() + 1);
        try {
            deliver(user.getEmail(), content, kind.optional() ? preferences.oneClickUrl(pref, kind) : null);
            entry.setStatus(EmailLog.SENT);
            entry.setSentAt(LocalDateTime.now(clock));
            entry.setError(null);
            logRepository.save(entry);
            return true;
        } catch (RuntimeException e) {
            log.warn("Gửi email {} ({}) tới user {} lỗi: {}", kind, ref, user.getId(), e.getMessage());
            entry.setStatus(EmailLog.FAILED);
            entry.setError(trim(e.getClass().getSimpleName() + ": " + String.valueOf(e.getMessage()), 300));
            logRepository.save(entry);
            return false;
        }
    }

    /** Gửi ngay, không qua nhật ký (mã xác thực, email thử). Lỗi → ApiException 503 như trước đây. */
    public void sendNow(String to, EmailLayout.Rendered content) {
        if (!configured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ email chưa được cấu hình");
        try {
            deliver(to, content, null);
        } catch (RuntimeException e) {
            log.warn("Gửi email tới {} lỗi: {}", mask(to), e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Không gửi được email lúc này, vui lòng thử lại sau");
        }
    }

    private void deliver(String to, EmailLayout.Rendered content, String listUnsubscribe) {
        JavaMailSender sender = senderProvider.getIfAvailable();
        if (sender == null) throw new IllegalStateException("Dịch vụ email chưa được cấu hình (SMTP)");
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(from, fromName, StandardCharsets.UTF_8.name()));
            helper.setTo(to);
            helper.setSubject(content.subject());
            helper.setText(content.text(), content.html());
            if (listUnsubscribe != null) {
                message.setHeader("List-Unsubscribe", "<" + listUnsubscribe + ">");
                message.setHeader("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
            }
            sender.send(message);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
    }

    private EmailLog newEntry(User user, EmailKind kind, String ref) {
        EmailLog l = new EmailLog();
        l.setUserId(user.getId());
        l.setToEmail(trim(user.getEmail(), 120));
        l.setKind(kind);
        l.setRefKey(ref);
        l.setCreatedAt(LocalDateTime.now(clock));
        return l;
    }

    static String trim(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max - 1) + "…" : s;
    }

    static String mask(String email) {
        if (email == null) return "";
        int at = email.indexOf('@');
        return at <= 1 ? "***" + email.substring(Math.max(at, 0)) : email.charAt(0) + "***" + email.substring(at);
    }
}
