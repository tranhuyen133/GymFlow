package com.gymflow.service.mail;

import com.gymflow.domain.EmailKind;
import com.gymflow.domain.EmailPreference;
import com.gymflow.domain.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** V55 · Nội dung email song ngữ và tuỳ chọn nhận email. */
class EmailTemplatesTest {

    EmailPreferenceService preferences;
    EmailTemplates templates;

    @BeforeEach
    void setUp() {
        preferences = new EmailPreferenceService(null);
        ReflectionTestUtils.setField(preferences, "appBaseUrl", "https://gymflow.io.vn/");
        templates = new EmailTemplates(preferences);
    }

    private static EmailPreference pref(String locale) {
        EmailPreference p = new EmailPreference();
        p.setUserId(1L);
        p.setLocale(locale);
        p.setUnsubscribeToken("b".repeat(64));
        return p;
    }

    @Test
    @DisplayName("Nhắc gia hạn: đúng ngôn ngữ, có ưu đãi, liên kết tắt đúng loại email")
    void renewalIsBilingual() {
        List<EmailTemplates.Offer> offers = List.of(EmailTemplates.offerOf("GIAHAN15", "Gia hạn sớm", "Early renewal", "PERCENT", 15L, null));

        EmailLayout.Rendered vi = templates.renewal(pref("vi"), "Nguyễn Văn An", "Gym 3 tháng", LocalDate.of(2026, 11, 25), 7, offers);
        EmailLayout.Rendered en = templates.renewal(pref("en"), "Nguyễn Văn An", "Gym 3 months", LocalDate.of(2026, 11, 25), 7, offers);

        assertThat(vi.subject()).contains("còn 7 ngày");
        assertThat(vi.html()).contains("Gia hạn ngay").contains("GIAHAN15").contains("Giảm 15%").contains("lang=\"vi\"")
                .contains("https://gymflow.io.vn/email/unsubscribe?token=" + "b".repeat(64) + "&amp;kind=RENEWAL");
        assertThat(en.subject()).contains("ends in 7 days");
        assertThat(en.html()).contains("Renew now").contains("15% off").contains("lang=\"en\"").doesNotContain("Gia hạn ngay");
    }

    @Test
    @DisplayName("Mọi mẫu xem trước đều dựng được ở cả hai ngôn ngữ, tiêu đề khác nhau")
    void allSamplesRender() {
        Set<String> subjects = new HashSet<>();
        for (EmailKind k : EmailTemplates.previewKinds()) {
            for (String lang : List.of("vi", "en")) {
                EmailLayout.Rendered r = templates.sample(k, pref(lang));
                assertThat(r.subject()).isNotBlank();
                assertThat(r.html()).startsWith("<!DOCTYPE html>").contains("GymFlow").endsWith("</html>");
                assertThat(r.text()).isNotBlank();
                subjects.add(r.subject());
            }
        }
        assertThat(subjects).hasSize(EmailTemplates.previewKinds().size() * 2);
    }

    @Test
    @DisplayName("Email bảo mật không có liên kết tắt email")
    void securityEmailHasNoUnsubscribe() {
        EmailLayout.Rendered r = templates.passwordResetCode(false, "123456", 30);
        assertThat(r.html()).contains("123456").doesNotContain("Tắt loại email này");
        assertThat(r.subject()).contains("123456");
    }

    @Test
    @DisplayName("Tuỳ chọn: bật/tắt đúng cờ, email bảo mật luôn bật; mỗi vai trò thấy đúng loại email")
    void preferenceFlags() {
        EmailPreference p = pref("vi");
        for (EmailKind k : EmailKind.values()) assertThat(p.allows(k)).isTrue();
        p.set(EmailKind.WEEKLY_DIGEST, false);
        p.set(EmailKind.SECURITY, false);
        assertThat(p.allows(EmailKind.WEEKLY_DIGEST)).isFalse();
        assertThat(p.allows(EmailKind.SECURITY)).isTrue();
        assertThat(p.allows(EmailKind.RENEWAL)).isTrue();

        assertThat(EmailPreferenceService.kindsFor(Role.MEMBER)).contains(EmailKind.RENEWAL, EmailKind.ACHIEVEMENT).doesNotContain(EmailKind.TRAINER_REPORT);
        assertThat(EmailPreferenceService.kindsFor(Role.TRAINER)).containsExactly(EmailKind.TRAINER_REPORT);
        assertThat(EmailPreferenceService.kindsFor(Role.ADMIN)).isEmpty();
        assertThat(EmailPreferenceService.newToken()).matches("[0-9a-f]{64}");
    }
}
