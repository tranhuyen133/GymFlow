package com.gymflow.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** V55 · Luật huy hiệu: ngày đạt thật, chuỗi tuần, chim sớm, calo. */
class BadgeRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 18); // thứ Tư

    private static BadgeRules.Workout w(LocalDateTime at, int minutes, int calories) {
        return new BadgeRules.Workout(at, minutes, calories);
    }

    @Test
    @DisplayName("Huy hiệu số buổi mang ngày của đúng buổi đạt mốc")
    void workoutMilestonesUseRealDate() {
        List<BadgeRules.Workout> ws = new ArrayList<>();
        for (int i = 0; i < 12; i++) ws.add(w(LocalDateTime.of(2026, 10, 1, 18, 0).plusDays(i), 60, 300));

        BadgeRules.Result r = BadgeRules.compute(ws, List.of(), TODAY);

        assertThat(r.earned()).containsKeys("FIRST_WORKOUT", "WORKOUTS_10").doesNotContainKey("WORKOUTS_25");
        assertThat(r.earned().get("FIRST_WORKOUT")).isEqualTo(LocalDateTime.of(2026, 10, 1, 18, 0));
        assertThat(r.earned().get("WORKOUTS_10")).isEqualTo(LocalDateTime.of(2026, 10, 10, 18, 0));
        assertThat(r.progress().get("WORKOUTS_25")).isEqualTo(12);
        assertThat(r.records().totalWorkouts()).isEqualTo(12);
        assertThat(r.records().totalCalories()).isEqualTo(3600);
    }

    @Test
    @DisplayName("Chuỗi 4 tuần liền thì đạt; tuần trống làm đứt chuỗi; tuần này chưa tập vẫn giữ chuỗi hiện tại")
    void weeklyStreak() {
        List<LocalDateTime> checkins = List.of(
                LocalDateTime.of(2026, 10, 5, 7, 30),   // tuần 05/10 (lẻ, sau đó trống 1 tuần)
                LocalDateTime.of(2026, 10, 19, 7, 30),  // tuần 19/10
                LocalDateTime.of(2026, 10, 27, 7, 30),  // tuần 26/10
                LocalDateTime.of(2026, 11, 3, 7, 30),   // tuần 02/11
                LocalDateTime.of(2026, 11, 12, 19, 0)); // tuần 09/11 → đủ 4 tuần liền

        BadgeRules.Result r = BadgeRules.compute(List.of(), checkins, TODAY);

        assertThat(r.earned()).containsKey("STREAK_4").doesNotContainKey("STREAK_8");
        assertThat(r.earned().get("STREAK_4")).isEqualTo(LocalDateTime.of(2026, 11, 12, 19, 0));
        assertThat(r.records().longestStreakWeeks()).isEqualTo(4);
        // Tuần 16/11 chưa tập nhưng tuần trước có → chuỗi hiện tại vẫn là 4
        assertThat(r.records().currentStreakWeeks()).isEqualTo(4);
    }

    @Test
    @DisplayName("Chim sớm cần 5 NGÀY khác nhau có mặt trước 7 giờ")
    void earlyBirdCountsDistinctDays() {
        List<LocalDateTime> checkins = new ArrayList<>();
        for (int i = 0; i < 4; i++) checkins.add(LocalDateTime.of(2026, 11, 2 + i, 6, 15));
        checkins.add(LocalDateTime.of(2026, 11, 5, 6, 40)); // trùng ngày 05/11 → không tính thêm

        assertThat(BadgeRules.compute(List.of(), checkins, TODAY).earned()).doesNotContainKey("EARLY_BIRD");

        checkins.add(LocalDateTime.of(2026, 11, 9, 6, 50));
        BadgeRules.Result r = BadgeRules.compute(List.of(), checkins, TODAY);
        assertThat(r.earned().get("EARLY_BIRD")).isEqualTo(LocalDateTime.of(2026, 11, 9, 6, 50));
    }

    @Test
    @DisplayName("Mốc calo và buổi 90 phút")
    void caloriesAndMarathon() {
        List<BadgeRules.Workout> ws = List.of(
                w(LocalDateTime.of(2026, 11, 1, 18, 0), 60, 2500),
                w(LocalDateTime.of(2026, 11, 3, 18, 0), 95, 2600),
                w(LocalDateTime.of(2026, 11, 5, 18, 0), 30, 100));

        BadgeRules.Result r = BadgeRules.compute(ws, List.of(), TODAY);

        assertThat(r.earned().get("CALORIES_5K")).isEqualTo(LocalDateTime.of(2026, 11, 3, 18, 0));
        assertThat(r.earned().get("MARATHON")).isEqualTo(LocalDateTime.of(2026, 11, 3, 18, 0));
        assertThat(r.records().maxSessionCalories()).isEqualTo(2600);
        assertThat(r.records().longestSessionMinutes()).isEqualTo(95);
        assertThat(r.records().bestWeekWorkouts()).isEqualTo(2);
    }

    @Test
    @DisplayName("Chưa có dữ liệu thì không có huy hiệu, mọi tiến độ bằng 0")
    void emptyHistory() {
        BadgeRules.Result r = BadgeRules.compute(List.of(), List.of(), TODAY);
        assertThat(r.earned()).isEmpty();
        assertThat(r.progress().values()).allMatch(v -> v == 0);
        assertThat(BadgeRules.CATALOG).extracting(BadgeRules.Def::code).doesNotHaveDuplicates();
    }
}
