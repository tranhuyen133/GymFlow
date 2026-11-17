package com.gymflow.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CheckinCodesTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Instant T0 = Instant.parse("2026-11-17T01:00:05Z");

    private CheckinCodes at(Instant t) {
        return new CheckinCodes("test-secret-at-least-32-characters-long!!", "https://gymflow.io.vn/", Clock.fixed(t, ZONE));
    }

    @Test
    @DisplayName("Mã 6 chữ số, cố định trong một chu kỳ 30 giây")
    void stableWithinPeriod() {
        String a = at(T0).current();
        assertThat(a).matches("\\d{6}");
        assertThat(at(T0.plusSeconds(20)).current()).isEqualTo(a);
        assertThat(at(T0).secondsLeft()).isEqualTo(25);
    }

    @Test
    @DisplayName("Nhận mã của 4 chu kỳ trước, từ chối mã cũ hơn hoặc sai định dạng")
    void verifyWindow() {
        String code = at(T0).current();
        assertThat(at(T0).verify(code)).isTrue();
        assertThat(at(T0.plusSeconds(30L * CheckinCodes.ACCEPT_PREVIOUS)).verify(code)).isTrue();
        assertThat(at(T0.plusSeconds(30L * (CheckinCodes.ACCEPT_PREVIOUS + 1))).verify(code)).isFalse();
        assertThat(at(T0).verify("12345")).isFalse();
        assertThat(at(T0).verify(null)).isFalse();
        assertThat(at(T0).verify("abcdef")).isFalse();
    }

    @Test
    @DisplayName("Khoá bí mật khác thì mã khác")
    void secretMatters() {
        CheckinCodes other = new CheckinCodes("another-secret-at-least-32-characters!!", "http://x", Clock.fixed(T0, ZONE));
        long same = 0;
        for (long w = 0; w < 20; w++) if (other.codeAt(w).equals(at(T0).codeAt(w))) same++;
        assertThat(same).isLessThan(3);
    }

    @Test
    @DisplayName("Đường dẫn QR: dùng địa chỉ trang quầy nếu hợp lệ, không thì dùng APP_BASE_URL")
    void url() {
        CheckinCodes c = at(T0);
        assertThat(c.checkinUrl("http://localhost:8081", "123456")).isEqualTo("http://localhost:8081/checkin?c=123456");
        assertThat(c.checkinUrl("javascript:alert(1)", "123456")).isEqualTo("https://gymflow.io.vn/checkin?c=123456");
        assertThat(c.checkinUrl(null, "123456")).isEqualTo("https://gymflow.io.vn/checkin?c=123456");
    }

    @Test
    @DisplayName("Ma trận QR vuông, chỉ gồm 0/1, có 3 ô định vị ở góc")
    void qrMatrix() {
        List<String> rows = QrMatrix.encode("https://gymflow.io.vn/checkin?c=123456");
        assertThat(rows.size()).isGreaterThanOrEqualTo(21);
        assertThat(rows).allSatisfy(r -> assertThat(r).hasSize(rows.size()).matches("[01]+"));
        assertThat(rows.get(0)).startsWith("1111111");
        assertThat(rows.get(0)).endsWith("1111111");
        assertThat(rows.get(rows.size() - 1)).startsWith("1111111");
    }
}
