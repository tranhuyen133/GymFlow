package com.gymflow.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.util.regex.Pattern;

/**
 * V53 · Mã check-in 6 số đổi mỗi 30 giây (cùng cách tính với mã OTP của app xác thực), khoá bí mật lấy từ JWT_SECRET.
 * Không lưu mã vào CSDL; nhận mã của 4 chu kỳ trước để hội viên còn kịp đăng nhập sau khi quét.
 */
@Component
public class CheckinCodes {

    public static final int PERIOD_SECONDS = 30;
    static final int ACCEPT_PREVIOUS = 4;
    private static final Pattern ORIGIN = Pattern.compile("^https?://[A-Za-z0-9.-]+(:\\d{1,5})?$");

    private final byte[] key;
    private final String baseUrl;
    private final Clock clock;

    public CheckinCodes(@Value("${app.jwt.secret}") String secret,
                        @Value("${app.app-base-url:http://localhost:5173}") String baseUrl,
                        Clock clock) {
        this.key = ("gymflow-checkin|" + secret).getBytes(StandardCharsets.UTF_8);
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.clock = clock;
    }

    public long window() {
        return clock.millis() / 1000 / PERIOD_SECONDS;
    }

    public String current() {
        return codeAt(window());
    }

    public int secondsLeft() {
        long sec = clock.millis() / 1000;
        return (int) (PERIOD_SECONDS - sec % PERIOD_SECONDS);
    }

    public boolean verify(String code) {
        if (code == null || !code.matches("\\d{6}")) return false;
        long w = window();
        byte[] given = code.getBytes(StandardCharsets.US_ASCII);
        boolean ok = false;
        for (int i = 0; i <= ACCEPT_PREVIOUS; i++) {
            ok |= MessageDigest.isEqual(codeAt(w - i).getBytes(StandardCharsets.US_ASCII), given);
        }
        return ok;
    }

    /** Đường dẫn trong mã QR: ưu tiên địa chỉ trang quầy đang mở (để chạy được cả ở localhost), sai định dạng thì dùng APP_BASE_URL. */
    public String checkinUrl(String origin, String code) {
        String base = origin != null && ORIGIN.matcher(origin).matches() ? origin : baseUrl;
        return base + "/checkin?c=" + code;
    }

    String codeAt(long window) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            byte[] h = mac.doFinal(ByteBuffer.allocate(8).putLong(window).array());
            int off = h[h.length - 1] & 0x0f;
            int bin = ((h[off] & 0x7f) << 24) | ((h[off + 1] & 0xff) << 16) | ((h[off + 2] & 0xff) << 8) | (h[off + 3] & 0xff);
            return String.format("%06d", bin % 1_000_000);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Không tạo được mã check-in", e);
        }
    }
}
