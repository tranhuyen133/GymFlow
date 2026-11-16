package com.gymflow.service;

import com.gymflow.dto.Dtos.PresenceResponse;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Trạng thái online khi nhắn tin (V47).
 *
 * <p>Trình duyệt gửi heartbeat định kỳ; máy chủ chỉ ghi {@code users.last_seen_at} nếu mốc cũ đã cũ hơn
 * {@value #WRITE_INTERVAL_SECONDS} giây. Một tài khoản được coi là online nếu hoạt động trong
 * {@value #ONLINE_WINDOW_SECONDS} giây gần nhất, nhờ vậy đóng tab / mất mạng sẽ tự offline.</p>
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

    public static final int ONLINE_WINDOW_SECONDS = 60;
    public static final int WRITE_INTERVAL_SECONDS = 20;

    private final UserRepository userRepository;
    private final Clock clock;

    @Transactional
    public PresenceResponse heartbeat(AuthUser user) {
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        userRepository.touchLastSeen(user.id(), now, now.minusSeconds(WRITE_INTERVAL_SECONDS));
        return new PresenceResponse(now);
    }

    public static boolean isOnline(LocalDateTime lastSeen, LocalDateTime now) {
        return lastSeen != null && !lastSeen.isBefore(now.minus(Duration.ofSeconds(ONLINE_WINDOW_SECONDS)));
    }
}
