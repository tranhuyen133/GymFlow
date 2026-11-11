package com.gymflow.service;

import com.gymflow.domain.EstimateStatus;
import com.gymflow.domain.Member;
import com.gymflow.domain.Role;
import com.gymflow.domain.WorkoutLog;
import com.gymflow.dto.Dtos.CalorieSummaryResponse;
import com.gymflow.repository.WorkoutLogExerciseRepository;
import com.gymflow.repository.WorkoutLogRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalorieStatsServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate ANCHOR = LocalDate.of(2026, 11, 11); // Thứ 4

    @Mock WorkoutLogRepository logRepository;
    @Mock WorkoutLogExerciseRepository logExerciseRepository;
    @Mock AccessService access;

    CalorieStatsService service;
    List<WorkoutLog> logs;
    AuthUser user = new AuthUser(10L, "member@gymflow.vn", Role.MEMBER, "Hội Viên");

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(ANCHOR.atTime(12, 0).atZone(ZONE).toInstant(), ZONE);
        service = new CalorieStatsService(logRepository, logExerciseRepository, access, clock);
        Member member = new Member();
        member.setId(1L);
        lenient().when(access.requireView(user, 1L)).thenReturn(member);
        logs = new ArrayList<>();
        when(logRepository.findByMemberIdAndCompletedAtBetweenAndEstimatedTrueAndEstimateStatusOrderByCompletedAtAsc(
                eq(1L), any(), any(), eq(EstimateStatus.OK)))
                .thenAnswer(inv -> {
                    LocalDateTime from = inv.getArgument(1);
                    LocalDateTime to = inv.getArgument(2);
                    return logs.stream()
                            .filter(l -> !l.getCompletedAt().isBefore(from) && l.getCompletedAt().isBefore(to))
                            .toList();
                });
    }

    private void log(LocalDateTime at, int calories, double activeMinutes) {
        WorkoutLog l = new WorkoutLog();
        l.setCompletedAt(at);
        l.setCalories(calories);
        l.setActiveMinutes(activeMinutes);
        l.setEstimated(true);
        l.setEstimateStatus(EstimateStatus.OK);
        logs.add(l);
    }

    @Test
    @DisplayName("Tuần bắt đầu Thứ 2, tổng hợp đúng và so sánh tuần trước")
    void weeklySummary() {
        log(ANCHOR.minusDays(2).atTime(18, 0), 100, 10); // Thứ 2
        log(ANCHOR.atTime(18, 0), 200, 20);              // Thứ 4
        log(ANCHOR.minusWeeks(1).atTime(18, 0), 100, 10); // tuần trước

        CalorieSummaryResponse res = service.summary(user, 1L, "WEEK", ANCHOR);

        assertThat(res.from()).isEqualTo(LocalDate.of(2026, 11, 9));
        assertThat(res.to()).isEqualTo(LocalDate.of(2026, 11, 16));
        assertThat(res.totalCalories()).isEqualTo(300);
        assertThat(res.totalSessions()).isEqualTo(2);
        assertThat(res.totalActiveMinutes()).isEqualTo(30.0);
        assertThat(res.avgCaloriesPerSession()).isEqualTo(150.0);
        assertThat(res.buckets()).hasSize(7);
        assertThat(res.topDay().date()).isEqualTo(ANCHOR);
        assertThat(res.topDay().calories()).isEqualTo(200);
        assertThat(res.previous().calories()).isEqualTo(100);
        assertThat(res.previous().sessions()).isEqualTo(1);
        assertThat(res.previous().changePercent()).isEqualTo(200.0);
    }

    @Test
    @DisplayName("Tháng lấy đúng biên ngày đầu tháng và loại dữ liệu tháng trước khỏi tổng")
    void monthlySummary() {
        log(LocalDate.of(2026, 11, 1).atTime(0, 0), 50, 5);
        log(LocalDate.of(2026, 11, 30).atTime(23, 0), 150, 15);
        log(LocalDate.of(2026, 12, 1).atTime(0, 0), 999, 99);
        log(LocalDate.of(2026, 10, 31).atTime(23, 0), 100, 10);

        CalorieSummaryResponse res = service.summary(user, 1L, "MONTH", ANCHOR);

        assertThat(res.from()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(res.to()).isEqualTo(LocalDate.of(2026, 12, 1));
        assertThat(res.totalCalories()).isEqualTo(200);
        assertThat(res.totalSessions()).isEqualTo(2);
        assertThat(res.buckets()).hasSize(30);
        assertThat(res.topDay().date()).isEqualTo(LocalDate.of(2026, 11, 30));
        assertThat(res.previous().calories()).isEqualTo(100);
    }
}
