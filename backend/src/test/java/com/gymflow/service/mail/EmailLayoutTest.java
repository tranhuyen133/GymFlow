package com.gymflow.service.mail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** V55 · Khung email: escape dữ liệu, chặn liên kết lạ, luôn có bản chữ trơn. */
class EmailLayoutTest {

    @Test
    @DisplayName("Chữ từ dữ liệu người dùng được escape, không chèn được thẻ HTML")
    void escapesUserText() {
        EmailLayout.Rendered r = EmailLayout.create(false)
                .title("Xin chào <script>alert(1)</script>")
                .paragraph("Tên gói: \"VIP\" & <b>đặc biệt</b>")
                .list("Lịch", List.of(new EmailLayout.Item("<img src=x onerror=1>", "a & b", "07:00")))
                .render("Tiêu đề <i>thử</i>");

        assertThat(r.html()).doesNotContain("<script>").doesNotContain("<img src=x").doesNotContain("<b>đặc biệt</b>")
                .contains("&lt;script&gt;").contains("&quot;VIP&quot; &amp;").contains("<title>Tiêu đề &lt;i&gt;thử&lt;/i&gt;</title>");
        assertThat(r.subject()).isEqualTo("Tiêu đề <i>thử</i>");
    }

    @Test
    @DisplayName("Nút chỉ nhận liên kết http(s); javascript: bị thay bằng #")
    void buttonRejectsUnsafeUrls() {
        EmailLayout.Rendered ok = EmailLayout.create(false).button("Mở", "https://gymflow.io.vn/today").render("x");
        EmailLayout.Rendered bad = EmailLayout.create(false).button("Mở", "javascript:alert(1)").render("x");

        assertThat(ok.html()).contains("href=\"https://gymflow.io.vn/today\"");
        assertThat(bad.html()).doesNotContain("javascript:").contains("href=\"#\"");
    }

    @Test
    @DisplayName("Có bản chữ trơn đầy đủ nội dung, liên kết và chân thư")
    void plainTextAlternative() {
        EmailLayout.Rendered r = EmailLayout.create(true)
                .preheader("Preview line")
                .title("Your week")
                .stats(List.of(new EmailLayout.Stat("4", "workouts"), new EmailLayout.Stat("1,860", "kcal")))
                .code("482913", "Valid for 10 minutes")
                .button("Open Today", "https://gymflow.io.vn/today")
                .reason("You get this email because weekly summary is on.")
                .footerLink("Turn off this email", "https://gymflow.io.vn/email/unsubscribe?token=abc")
                .render("Your week: 4 workouts");

        assertThat(r.html()).contains("lang=\"en\"").contains("Preview line").contains("Turn off this email").contains("prefers-color-scheme:dark");
        assertThat(r.text()).contains("Your week").contains("- workouts: 4").contains("482913")
                .contains("Open Today: https://gymflow.io.vn/today")
                .contains("Turn off this email: https://gymflow.io.vn/email/unsubscribe?token=abc")
                .doesNotContain("<");
    }
}
