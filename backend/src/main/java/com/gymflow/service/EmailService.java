package com.gymflow.service;

import com.gymflow.domain.User;
import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:true}")
    private boolean enabled;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${app.mail.from:no-reply@gymflow.vn}")
    private String from;

    @Value("${app.mail.from-name:GymFlow}")
    private String fromName;

    @PostConstruct
    void warnIfNotConfigured() {
        if (enabled && (username.isBlank() || password.isBlank())) {
            log.warn("MAIL_ENABLED=true nhưng thiếu MAIL_USERNAME/MAIL_PASSWORD — email khôi phục mật khẩu sẽ KHÔNG được gửi.");
        }
    }

    /**
     * Gửi mã khôi phục mật khẩu qua SMTP (Brevo mặc định). Lỗi cấu hình/SMTP chỉ được ghi log,
     * không làm hỏng luồng quên mật khẩu và không tiết lộ email có tồn tại hay không.
     */
    public void sendPasswordResetCode(User user, String code, int validMinutes) {
        if (!enabled) {
            log.info("Bỏ qua gửi email khôi phục vì MAIL_ENABLED=false ({}).", user.getEmail());
            return;
        }
        if (username.isBlank() || password.isBlank()) {
            log.warn("Chưa cấu hình MAIL_USERNAME/MAIL_PASSWORD, không gửi được email khôi phục cho {}.", user.getEmail());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(from, fromName, StandardCharsets.UTF_8.name()));
            helper.setTo(user.getEmail());
            helper.setSubject("Mã khôi phục mật khẩu GymFlow");
            helper.setText(html(user, code, validMinutes), true);
            mailSender.send(message);
            log.info("Đã gửi mã khôi phục mật khẩu tới {}", user.getEmail());
        } catch (Exception e) {
            log.error("Không gửi được email khôi phục mật khẩu tới {}", user.getEmail(), e);
        }
    }

    private String html(User user, String code, int validMinutes) {
        String name = user.getFullName() == null || user.getFullName().isBlank()
                ? "bạn"
                : HtmlUtils.htmlEscape(user.getFullName().trim());
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background:#0f1115;font-family:Arial,Helvetica,sans-serif;color:#e6e8ec;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#0f1115;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#171a21;border:1px solid #262b36;border-radius:16px;overflow:hidden;">
                          <tr>
                            <td style="padding:28px 32px 8px;">
                              <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">Gym<span style="color:#7c5cff;">Flow</span></div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 32px 0;">
                              <p style="margin:0 0 8px;font-size:16px;line-height:1.6;">Xin chào %s,</p>
                              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a8afbd;">
                                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản GymFlow của bạn.
                                Nhập mã dưới đây để tiếp tục:
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:0 32px 20px;">
                              <div style="display:inline-block;padding:18px 28px;background:#0f1115;border:1px dashed #4b3fa8;border-radius:12px;font-size:34px;font-weight:800;letter-spacing:10px;color:#b9a8ff;font-family:'Courier New',monospace;">%s</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 32px 24px;">
                              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a8afbd;">
                                Mã có hiệu lực trong <b style="color:#e6e8ec;">%d phút</b> và chỉ dùng được một lần.
                              </p>
                              <p style="margin:0;font-size:13px;line-height:1.6;color:#6f7787;">
                                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu hiện tại vẫn an toàn.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:18px 32px;border-top:1px solid #262b36;font-size:12px;color:#6f7787;">
                              Email tự động từ GymFlow — vui lòng không trả lời.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(name, HtmlUtils.htmlEscape(code), validMinutes);
    }
}
