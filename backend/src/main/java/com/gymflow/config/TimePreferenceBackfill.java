package com.gymflow.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Chạy sau DataSeeder: nếu chưa ai khai giờ tập mong muốn, suy ra từ lịch tập 10 tuần gần nhất
 * (khung giờ hội viên đã đến từ 2 lần trở lên, tối đa 3 khung mỗi ngày, trong giờ mở cửa 05:00–22:00).
 * Hội viên sửa lại trong Hồ sơ → Hồ sơ tập luyện. Lỗi ở bước này chỉ ghi log, không chặn khởi động.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class TimePreferenceBackfill implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    private static final String SQL = """
            INSERT INTO member_time_preferences (member_id, day_of_week, start_time, end_time)
            SELECT member_id, dow, MAKETIME(h, 0, 0), MAKETIME(h + 1, 0, 0)
            FROM (
                SELECT s.member_id, (DAYOFWEEK(s.start_time) + 5) % 7 + 1 AS dow, HOUR(s.start_time) AS h,
                       ROW_NUMBER() OVER (PARTITION BY s.member_id, (DAYOFWEEK(s.start_time) + 5) % 7 + 1
                                          ORDER BY COUNT(*) DESC, HOUR(s.start_time)) AS rn
                FROM workout_schedules s
                WHERE s.status <> 'CANCELLED' AND s.start_time >= NOW() - INTERVAL 70 DAY
                GROUP BY s.member_id, (DAYOFWEEK(s.start_time) + 5) % 7 + 1, HOUR(s.start_time)
                HAVING COUNT(*) >= 2 AND HOUR(s.start_time) BETWEEN 5 AND 21
            ) x
            WHERE rn <= 3
            """;

    @Override
    public void run(ApplicationArguments args) {
        try {
            Integer existing = jdbc.queryForObject("SELECT COUNT(*) FROM member_time_preferences", Integer.class);
            if (existing != null && existing > 0) return;
            int n = jdbc.update(SQL);
            if (n > 0) log.info("Đã suy ra {} khung giờ tập mong muốn từ lịch tập cũ", n);
        } catch (RuntimeException e) {
            log.warn("Bỏ qua bước suy ra giờ tập mong muốn: {}", e.getMessage());
        }
    }
}
