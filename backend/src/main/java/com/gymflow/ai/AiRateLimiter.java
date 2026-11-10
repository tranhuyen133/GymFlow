package com.gymflow.ai;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Giới hạn tần suất gọi AI theo từng người dùng để bảo vệ tài nguyên hệ thống (Sliding Window).
 */
@Component
public class AiRateLimiter {

    private static final int MAX_REQUESTS_PER_MINUTE = 15;
    private static final long WINDOW_SECONDS = 60;

    private final Map<Long, Deque<Instant>> userRequests = new ConcurrentHashMap<>();

    public synchronized boolean tryAcquire(Long userId) {
        if (userId == null) {
            return false;
        }

        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds(WINDOW_SECONDS);

        Deque<Instant> timestamps = userRequests.computeIfAbsent(userId, k -> new ArrayDeque<>());

        // Xoá các timestamp nằm ngoài khoảng thời gian 60 giây
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(windowStart)) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
            return false;
        }

        timestamps.addLast(now);
        return true;
    }

    public synchronized void reset(Long userId) {
        if (userId != null) {
            userRequests.remove(userId);
        }
    }
}
