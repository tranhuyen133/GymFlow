package com.gymflow.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Mã check-in tại phòng tập.
 *
 * <p>V56 · Mã động (cách chính): màn hình ở quầy (trang Check-in quầy, chỉ quản lý mở được) hiện một mã 6 số + QR,
 * đổi mỗi {@link #LIVE_TTL} và <b>chỉ dùng được một lần</b>: hội viên đầu tiên quét là mã bị "tiêu", màn hình đổi mã mới ngay.
 * Ảnh chụp mã gửi cho người ở nhà sẽ hết hạn sau tối đa {@code LIVE_TTL + LIVE_GRACE} giây, hoặc đã bị người khác dùng mất.
 * Mã giữ trong bộ nhớ (một backend), khởi động lại là mã cũ hết hiệu lực – màn hình quầy tự lấy mã mới.</p>
 *
 * <p>Mã theo ngày (cũ): mỗi ngày một mã tính từ khoá bí mật, in dán ở quầy. Dán cả ngày nên dễ bị chụp gửi đi,
 * vì vậy mặc định không còn được nhận (bật lại bằng {@code CHECKIN_DAILY_CODE_ENABLED=true} nếu thật sự cần).</p>
 */
@Component
public class CheckinCodes {

    /** Mỗi mã hiện trên màn hình quầy tối đa 30 giây. */
    public static final Duration LIVE_TTL = Duration.ofSeconds(30);
    /** Cho thêm 15 giây sau khi màn hình đã đổi mã (mạng chậm, hội viên vừa quét xong). */
    static final Duration LIVE_GRACE = Duration.ofSeconds(15);

    private static final Pattern ORIGIN = Pattern.compile("^https?://[A-Za-z0-9.-]+(:\\d{1,5})?$");

    public enum LiveResult { OK, USED, INVALID }

    /** Mã đang hiện trên màn hình quầy. */
    public record Live(String code, Instant expiresAt) {
    }

    private static final class LiveEntry {
        final Instant expiresAt;
        Long usedBy;

        LiveEntry(Instant expiresAt) {
            this.expiresAt = expiresAt;
        }
    }

    private final byte[] key;
    private final String baseUrl;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    /** Mã động còn nhận (chưa quá hạn + thời gian chờ). Truy cập trong synchronized. */
    private final Map<String, LiveEntry> live = new LinkedHashMap<>();
    private String currentLive;

    public CheckinCodes(@Value("${app.jwt.secret}") String secret,
                        @Value("${app.app-base-url:http://localhost:5173}") String baseUrl,
                        Clock clock) {
        this.key = ("gymflow-checkin|" + secret).getBytes(StandardCharsets.UTF_8);
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.clock = clock;
    }

    // ---------------- Mã động trên màn hình quầy ----------------

    /** Mã đang hiện; hết hạn hoặc vừa có người dùng thì tạo mã mới. */
    public synchronized Live currentLive() {
        Instant now = clock.instant();
        purge(now);
        LiveEntry e = currentLive == null ? null : live.get(currentLive);
        if (e == null || e.usedBy != null || !now.isBefore(e.expiresAt)) {
            String code;
            do {
                code = String.format("%06d", random.nextInt(1_000_000));
            } while (live.containsKey(code) || code.equals(current()));
            e = new LiveEntry(now.plus(LIVE_TTL));
            live.put(code, e);
            currentLive = code;
        }
        return new Live(currentLive, e.expiresAt);
    }

    /**
     * Hội viên gửi mã: OK lần đầu (đánh dấu đã dùng), USED nếu người khác đã dùng mã này,
     * INVALID nếu sai hoặc quá hạn. Cùng một hội viên gửi lại cùng mã (bấm 2 lần) vẫn OK.
     */
    public synchronized LiveResult consumeLive(String code, long memberId) {
        if (code == null || !code.matches("\\d{6}")) return LiveResult.INVALID;
        Instant now = clock.instant();
        purge(now);
        LiveEntry e = live.get(code);
        if (e == null) return LiveResult.INVALID;
        if (e.usedBy != null) return e.usedBy == memberId ? LiveResult.OK : LiveResult.USED;
        e.usedBy = memberId;
        return LiveResult.OK;
    }

    private void purge(Instant now) {
        live.values().removeIf(e -> !now.isBefore(e.expiresAt.plus(LIVE_GRACE)));
    }

    // ---------------- Mã theo ngày (cũ, mặc định không nhận) ----------------

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
