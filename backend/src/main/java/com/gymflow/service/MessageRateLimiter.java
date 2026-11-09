package com.gymflow.service;

import com.gymflow.common.ApiException;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/**
 * Giới hạn tốc độ gửi tin nhắn: tối đa 20 tin/phút cho mỗi người dùng (cửa sổ trượt / cố định theo phút).
 */
@Component
public class MessageRateLimiter {

    public static final int LIMIT = 20;
    public static final long WINDOW_MS = 60_000L;

    private static class Window {
        final long start;
        int count;

        Window(long start) {
            this.start = start;
        }
    }

    private final ConcurrentHashMap<Long, Window> windows = new ConcurrentHashMap<>();
    private final LongSupplier now;

    public MessageRateLimiter() {
        this(System::currentTimeMillis);
    }

    public MessageRateLimiter(LongSupplier now) {
        this.now = now;
    }

    public void checkLimit(Long userId) {
        long t = now.getAsLong();
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(e -> t - e.getValue().start >= WINDOW_MS);
        }
        Window w = windows.compute(userId, (k, cur) -> {
            Window next = cur == null || t - cur.start >= WINDOW_MS ? new Window(t) : cur;
            next.count++;
            return next;
        });

        if (w.count > LIMIT) {
            long retrySeconds = Math.max(1, (w.start + WINDOW_MS - t + 999) / 1000);
            throw ApiException.tooManyRequests("Bạn gửi tin nhắn quá nhanh. Vui lòng thử lại sau " + retrySeconds + " giây.");
        }
    }

    public void reset() {
        windows.clear();
    }
}
