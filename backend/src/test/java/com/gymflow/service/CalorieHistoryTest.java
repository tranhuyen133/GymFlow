package com.gymflow.service;

import com.gymflow.domain.EstimateStatus;
import com.gymflow.domain.WorkoutLog;
import com.gymflow.dto.Dtos.CalorieHistoryResponse;
import com.gymflow.dto.Dtos.CalorieWeek;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Lịch sử calo theo tuần + từng ngày, số kg mỡ tương đương (calo / 7.700). */
class CalorieHistoryTest {

    private static final LocalDate MON = LocalDate.of(2026, 11, 2); // Thứ 2

    private static WorkoutLog log(LocalDate day, int hour, Integer calories, boolean ok) {
        WorkoutLog l = new WorkoutLog();
        l.setCompletedAt(day.atTime(hour, 0));
        l.setCalories(calories);
        l.setActiveMinutes(45.0);
        l.setEstimated(ok);
        l.setEstimateStatus(ok ? EstimateStatus.OK : EstimateStatus.MISSING_WEIGHT);
        return l;
    }

    @Test
    void groupsByMondayWeeksWithSevenDays() {
        List<WorkoutLog> logs = List.of(
                log(MON, 7, 400, true),
                log(MON.plusDays(6), 23, 350, true),      // Chủ nhật 23:00 vẫn thuộc tuần 1
                log(MON.plusDays(7), 0, 500, true),       // Thứ 2 tuần sau
                log(MON.plusDays(8), 18, null, false));   // chưa ước tính → đếm buổi, không cộng calo

        CalorieHistoryResponse h = CalorieStatsService.buildHistory(logs, MON, 3);

        assertThat(h.weeks()).hasSize(3);
        CalorieWeek w1 = h.weeks().get(0);
        assertThat(w1.weekStart()).isEqualTo(MON);
        assertThat(w1.weekEnd()).isEqualTo(MON.plusDays(6));
        assertThat(w1.calories()).isEqualTo(750);
        assertThat(w1.sessions()).isEqualTo(2);
        assertThat(w1.days()).hasSize(7);
        assertThat(w1.days().get(0).calories()).isEqualTo(400);
        assertThat(w1.days().get(6).calories()).isEqualTo(350);

        CalorieWeek w2 = h.weeks().get(1);
        assertThat(w2.calories()).isEqualTo(500);
        assertThat(w2.sessions()).isEqualTo(2);

        assertThat(h.weeks().get(2).calories()).isZero();
        assertThat(h.totalCalories()).isEqualTo(1250);
        assertThat(h.totalSessions()).isEqualTo(4);
        assertThat(h.avgWeeklyCalories()).isEqualTo(416.7);
    }

    @Test
    void fatKgUses7700KcalPerKg() {
        assertThat(CalorieStatsService.fatKg(7700)).isEqualTo(1.0);
        assertThat(CalorieStatsService.fatKg(1540)).isEqualTo(0.2);
        assertThat(CalorieStatsService.fatKg(0)).isZero();

        CalorieHistoryResponse h = CalorieStatsService.buildHistory(List.of(log(MON, 9, 3850, true)), MON, 1);
        assertThat(h.weeks().get(0).fatKg()).isEqualTo(0.5);
        assertThat(h.totalFatKg()).isEqualTo(0.5);
        assertThat(h.kcalPerKg()).isEqualTo(7700);
    }
}
