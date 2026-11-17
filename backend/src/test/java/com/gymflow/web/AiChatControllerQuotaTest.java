package com.gymflow.web;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class AiChatControllerQuotaTest {

    @Test
    void allowsTwentyQuestionsPerDayThenResetsNextDay() {
        AiChatController.DailyQuota quota = new AiChatController.DailyQuota();
        LocalDate day = LocalDate.of(2026, 11, 17);

        for (int i = 0; i < 20; i++) {
            assertThat(quota.tryConsume(day)).as("câu thứ %d", i + 1).isTrue();
        }
        assertThat(quota.tryConsume(day)).isFalse();

        assertThat(quota.tryConsume(day.plusDays(1))).isTrue();
    }
}
