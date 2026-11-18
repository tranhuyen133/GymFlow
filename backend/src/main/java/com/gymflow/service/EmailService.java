package com.gymflow.service;

import com.gymflow.domain.EmailPreference;
import com.gymflow.repository.UserRepository;
import com.gymflow.service.mail.EmailPreferenceService;
import com.gymflow.service.mail.EmailTemplates;
import com.gymflow.service.mail.MailOutbox;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Email bảo mật (mã xác thực email, mã đặt lại mật khẩu).
 * V55 · Gửi bằng khung HTML chung của GymFlow (kèm bản chữ trơn), theo ngôn ngữ tài khoản đã chọn trên web.
 * Giữ nguyên chữ ký hàm và cách báo lỗi như trước (503 khi chưa cấu hình / gửi lỗi) để AuthService không phải đổi.
 */
@Service
@RequiredArgsConstructor
public class EmailService {
    private final MailOutbox outbox;
    private final EmailTemplates templates;
    private final EmailPreferenceService preferences;
    private final UserRepository userRepository;

    public void sendVerificationCode(String email, String code, int validMinutes) {
        outbox.sendNow(email, templates.verificationCode(english(email), code, validMinutes));
    }

    public void sendPasswordResetCode(String email, String code, int validMinutes) {
        outbox.sendNow(email, templates.passwordResetCode(english(email), code, validMinutes));
    }

    /** Ngôn ngữ đã lưu của tài khoản; chưa có thì tiếng Việt. Không tạo dòng tuỳ chọn mới ở đây. */
    private boolean english(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .flatMap(u -> preferences.find(u.getId()))
                .map(EmailPreference::english)
                .orElse(false);
    }
}
