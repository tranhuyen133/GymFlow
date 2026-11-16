package com.gymflow.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/** V49 · Tiền bù trừ khi nâng gói tự tập lên gói có PT. */
class UpgradeMathTest {

    private static final LocalDate START = LocalDate.of(2026, 11, 1);
    private static final LocalDate END = LocalDate.of(2026, 11, 30); // 30 ngày

    @Test
    @DisplayName("Còn 15/30 ngày của gói 500.000đ → trừ 250.000đ")
    void halfRemaining() {
        LocalDate up = LocalDate.of(2026, 11, 16);
        assertThat(UpgradeMath.totalDays(START, END)).isEqualTo(30);
        assertThat(UpgradeMath.remainingDays(START, END, up)).isEqualTo(15);
        assertThat(UpgradeMath.credit(500_000, START, END, up, 2_900_000)).isEqualTo(250_000);
    }

    @Test
    @DisplayName("Làm tròn xuống 1.000đ, không vượt giá gói mới, không âm")
    void roundingAndCaps() {
        // 1.350.000 × 77 / 90 = 1.155.000 (chẵn); 1.350.000 × 76 / 90 = 1.140.000; thử số lẻ: 500.000 × 7 / 30 = 116.666 → 116.000
        assertThat(UpgradeMath.credit(500_000, START, END, LocalDate.of(2026, 11, 24), 2_900_000)).isEqualTo(116_000);
        assertThat(UpgradeMath.credit(4_500_000, START, START.plusDays(364), START.plusDays(1), 690_000)).isEqualTo(690_000);
        assertThat(UpgradeMath.credit(0, START, END, START.plusDays(5), 2_900_000)).isZero();
    }

    @Test
    @DisplayName("Bắt đầu sau ngày hết gói cũ → không còn gì để trừ; trước ngày bắt đầu → trừ trọn gói")
    void outsideRange() {
        assertThat(UpgradeMath.remainingDays(START, END, END.plusDays(1))).isZero();
        assertThat(UpgradeMath.credit(500_000, START, END, END.plusDays(1), 2_900_000)).isZero();
        assertThat(UpgradeMath.remainingDays(START, END, START.minusDays(3))).isEqualTo(30);
        assertThat(UpgradeMath.credit(500_000, START, END, START.minusDays(3), 2_900_000)).isEqualTo(500_000);
    }

    @Test
    @DisplayName("Ngày cuối cùng của gói cũ: còn đúng 1 ngày")
    void lastDay() {
        assertThat(UpgradeMath.remainingDays(START, END, END)).isEqualTo(1);
        assertThat(UpgradeMath.credit(300_000, START, END, END, 2_900_000)).isEqualTo(10_000);
    }
}
