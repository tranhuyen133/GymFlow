package com.gymflow.service;

import com.gymflow.domain.User;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock JavaMailSender mailSender;

    EmailService service;

    @BeforeEach
    void setUp() {
        service = new EmailService(mailSender);
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "username", "brevo-login@smtp-brevo.com");
        ReflectionTestUtils.setField(service, "password", "smtp-key");
        ReflectionTestUtils.setField(service, "from", "no-reply@gymflow.vn");
        ReflectionTestUtils.setField(service, "fromName", "GymFlow");
    }

    private static User user() {
        User u = new User();
        u.setEmail("member@example.com");
        u.setFullName("Nguyễn Văn A");
        return u;
    }

    @Test
    void skipsWhenDisabled() {
        ReflectionTestUtils.setField(service, "enabled", false);

        service.sendPasswordResetCode(user(), "123456", 30);

        verifyNoInteractions(mailSender);
    }

    @Test
    void skipsWhenCredentialsMissing() {
        ReflectionTestUtils.setField(service, "password", " ");

        service.sendPasswordResetCode(user(), "123456", 30);

        verifyNoInteractions(mailSender);
    }

    @Test
    void sendsHtmlEmailWithCode() throws Exception {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        service.sendPasswordResetCode(user(), "123456", 30);

        verify(mailSender).send(message);
        assertThat(message.getSubject()).isEqualTo("Mã khôi phục mật khẩu GymFlow");
        assertThat(message.getAllRecipients()[0].toString()).isEqualTo("member@example.com");
        assertThat(text(message.getContent()))
                .contains("123456").contains("GymFlow").contains("30 phút");
    }

    @Test
    void doesNotThrowWhenSmtpFails() {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);
        doThrow(new MailSendException("smtp down")).when(mailSender).send(any(MimeMessage.class));

        assertThatCode(() -> service.sendPasswordResetCode(user(), "123456", 30))
                .doesNotThrowAnyException();
    }

    private static String text(Object content) throws Exception {
        if (content instanceof Multipart multipart) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < multipart.getCount(); i++) {
                sb.append(text(multipart.getBodyPart(i).getContent()));
            }
            return sb.toString();
        }
        return content == null ? "" : content.toString();
    }
}
