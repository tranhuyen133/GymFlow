package com.gymflow.service.mail;

import com.gymflow.domain.EmailKind;
import com.gymflow.domain.EmailPreference;
import com.gymflow.domain.Role;
import com.gymflow.repository.EmailPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.EnumSet;
import java.util.HexFormat;
import java.util.Optional;
import java.util.Set;

/** V55 · Tuỳ chọn nhận email + ngôn ngữ email + liên kết tắt email không cần đăng nhập. */
@Service
@RequiredArgsConstructor
public class EmailPreferenceService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailPreferenceRepository repository;

    @Value("${app.app-base-url:http://localhost:5173}")
    private String appBaseUrl;

    /** Loại email áp dụng cho từng vai trò (quyết định ô bật/tắt hiện ra). */
    public static Set<EmailKind> kindsFor(Role role) {
        return switch (role) {
            case MEMBER -> EnumSet.of(EmailKind.RENEWAL, EmailKind.BIRTHDAY, EmailKind.SESSION_REMINDER,
                    EmailKind.WEEKLY_DIGEST, EmailKind.RETENTION, EmailKind.ACHIEVEMENT);
            case TRAINER -> EnumSet.of(EmailKind.TRAINER_REPORT);
            case ADMIN -> EnumSet.noneOf(EmailKind.class);
        };
    }

    /** Lấy hoặc tạo tuỳ chọn mặc định (nhận mọi loại, tiếng Việt). */
    @Transactional
    public EmailPreference forUser(Long userId) {
        return repository.findById(userId).orElseGet(() -> {
            EmailPreference p = new EmailPreference();
            p.setUserId(userId);
            p.setUnsubscribeToken(newToken());
            return repository.save(p);
        });
    }

    /** Chỉ đọc, không tạo dòng mới (dùng cho email bảo mật khi chưa chắc tài khoản đã có tuỳ chọn). */
    @Transactional(readOnly = true)
    public Optional<EmailPreference> find(Long userId) {
        return repository.findById(userId);
    }

    @Transactional(readOnly = true)
    public Optional<EmailPreference> byToken(String token) {
        if (token == null || !token.matches("[0-9a-f]{64}")) return Optional.empty();
        return repository.findByUnsubscribeToken(token);
    }

    @Transactional
    public EmailPreference setLocale(Long userId, String locale) {
        EmailPreference p = forUser(userId);
        p.setLocale("en".equals(locale) ? "en" : "vi");
        return repository.save(p);
    }

    @Transactional
    public EmailPreference save(EmailPreference p) {
        return repository.save(p);
    }

    /** Trang tuỳ chọn email trên web (mở từ chân thư, không cần đăng nhập). */
    public String manageUrl(EmailPreference p, EmailKind kind) {
        String base = trimSlash(appBaseUrl) + "/email/unsubscribe?token=" + p.getUnsubscribeToken();
        return kind == null || !kind.optional() ? base : base + "&kind=" + kind.name();
    }

    /** Địa chỉ cho tiêu đề List-Unsubscribe (Gmail hiện nút "Huỷ đăng ký" cạnh tên người gửi). */
    public String oneClickUrl(EmailPreference p, EmailKind kind) {
        return trimSlash(appBaseUrl) + "/api/email/unsubscribe/" + p.getUnsubscribeToken() + "?kind=" + kind.name();
    }

    public String appUrl(String path) {
        return trimSlash(appBaseUrl) + (path.startsWith("/") ? path : "/" + path);
    }

    static String newToken() {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        return HexFormat.of().formatHex(b);
    }

    private static String trimSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
