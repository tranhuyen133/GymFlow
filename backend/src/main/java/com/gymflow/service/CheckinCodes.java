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
import java.time.LocalDate;
import java.util.regex.Pattern;

/**
 * Mã check-in theo ngày: mỗi ngày (giờ Việt Nam) một mã 6 số, quản lý in hoặc viết lên bảng ở quầy từ đầu ngày,
 * hội viên tự quét / nhập khi tới. Mã tính từ khoá bí mật (JWT_SECRET) và ngày, không lưu CSDL; qua nửa đêm là mã mới.
 * Không có mã thì ai ở nhà cũng bấm check-in được, làm sai số lượt đến và biểu đồ giờ đông.
 */
@Component
public class CheckinCodes {

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

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    /** Mã của hôm nay. */
    public String current() {
        return codeFor(today());
    }

    public String codeFor(LocalDate date) {
        return codeAt(date.toEpochDay());
    }

    /** Chỉ nhận mã của hôm nay (so sánh thời gian hằng để không dò được từng chữ số). */
    public boolean verify(String code) {
        if (code == null || !code.matches("\\d{6}")) return false;
        return MessageDigest.isEqual(current().getBytes(StandardCharsets.US_ASCII), code.getBytes(StandardCharsets.US_ASCII));
    }

    /** Đường dẫn trong mã QR: ưu tiên địa chỉ trang quầy đang mở (để chạy được cả ở localhost), sai định dạng thì dùng APP_BASE_URL. */
    public String checkinUrl(String origin, String code) {
        String base = origin != null && ORIGIN.matcher(origin).matches() ? origin : baseUrl;
        return base + "/checkin?c=" + code;
    }

    String codeAt(long counter) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            byte[] h = mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());
            int off = h[h.length - 1] & 0x0f;
            int bin = ((h[off] & 0x7f) << 24) | ((h[off + 1] & 0xff) << 16) | ((h[off + 2] & 0xff) << 8) | (h[off + 3] & 0xff);
            return String.format("%06d", bin % 1_000_000);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Không tạo được mã check-in", e);
        }
    }
}
