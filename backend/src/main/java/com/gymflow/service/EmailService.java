package com.gymflow.service;

import com.gymflow.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:no-reply@gymflow.local}")
    private String from;

    @Value("${app.app-base-url:http://localhost:5173}")
    private String appBaseUrl;

    public void sendVerificationCode(String email, String code, int validMinutes) {
        send(email, "Mã xác thực email GymFlow",
                "Mã xác thực email GymFlow của bạn là: " + code + "\n"
                        + "Mã có hiệu lực trong " + validMinutes + " phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.\n"
                        + appBaseUrl);
    }

    public void sendPasswordResetCode(String email, String code, int validMinutes) {
        send(email, "Mã đặt lại mật khẩu GymFlow",
                "Mã đặt lại mật khẩu GymFlow của bạn là: " + code + "\n"
                        + "Mã có hiệu lực trong " + validMinutes + " phút và chỉ dùng một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này.\n"
                        + appBaseUrl);
    }

    private void send(String to, String subject, String text) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ email chưa được cấu hình");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        try {
            sender.send(message);
        } catch (MailException e) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Không gửi được email lúc này, vui lòng thử lại sau");
        }
    }
}
