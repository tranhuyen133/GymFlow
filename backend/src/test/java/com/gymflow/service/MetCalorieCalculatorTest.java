package com.gymflow.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MetCalorieCalculatorTest {

    @Test
    @DisplayName("Công thức MET: 3.5 MET, 70 kg, 60 phút = 257 kcal")
    void computesCaloriesForModerateWeight() {
        assertThat(MetCalorieCalculator.calories(3.5, 70.0, 60.0)).isEqualTo(257.25);
        assertThat(MetCalorieCalculator.roundKcal(257.25)).isEqualTo(257);
    }

    @Test
    @DisplayName("Cân nặng khác nhau cho kết quả tỉ lệ thuận")
    void scalesWithWeight() {
        double at50 = MetCalorieCalculator.calories(5.0, 50.0, 30.0);
        double at100 = MetCalorieCalculator.calories(5.0, 100.0, 30.0);
        assertThat(at100).isEqualTo(at50 * 2);
    }

    @Test
    @DisplayName("Thiếu hoặc sai dữ liệu trả null, không bịa calo")
    void returnsNullForMissingOrInvalidInput() {
        assertThat(MetCalorieCalculator.calories(null, 70.0, 30.0)).isNull();
        assertThat(MetCalorieCalculator.calories(5.0, null, 30.0)).isNull();
        assertThat(MetCalorieCalculator.calories(5.0, 70.0, null)).isNull();
        assertThat(MetCalorieCalculator.calories(0.0, 70.0, 30.0)).isNull();
        assertThat(MetCalorieCalculator.calories(5.0, 0.0, 30.0)).isNull();
        assertThat(MetCalorieCalculator.calories(5.0, 70.0, 0.0)).isNull();
    }

    @Test
    @DisplayName("Đổi reps sang giây/hiệp: 10, 8-12, 45s, 1 phút")
    void parsesReps() {
        assertThat(MetCalorieCalculator.workSecondsPerSet("10")).isEqualTo(30);
        assertThat(MetCalorieCalculator.workSecondsPerSet("8-12")).isEqualTo(30);
        assertThat(MetCalorieCalculator.workSecondsPerSet("45s")).isEqualTo(45);
        assertThat(MetCalorieCalculator.workSecondsPerSet("45 giây")).isEqualTo(45);
        assertThat(MetCalorieCalculator.workSecondsPerSet("1 phút")).isEqualTo(60);
        assertThat(MetCalorieCalculator.workSecondsPerSet(null)).isNull();
        assertThat(MetCalorieCalculator.workSecondsPerSet("abc")).isNull();
    }

    @Test
    @DisplayName("Thời gian vận động kháng lực = sets × giây/hiệp / 60, không gồm nghỉ")
    void computesStrengthActiveMinutes() {
        assertThat(MetCalorieCalculator.strengthActiveMinutes(3, "10")).isEqualTo(1.5);
        assertThat(MetCalorieCalculator.strengthActiveMinutes(4, "45s")).isEqualTo(3.0);
        assertThat(MetCalorieCalculator.strengthActiveMinutes(null, "10")).isNull();
        assertThat(MetCalorieCalculator.strengthActiveMinutes(3, "abc")).isNull();
    }

    @Test
    @DisplayName("Cụm bài kháng lực = các hiệp + nghỉ giữa hiệp; thiếu nghỉ → 90 giây; chặn giá trị bất thường")
    void computesStrengthBlockMinutes() {
        assertThat(MetCalorieCalculator.strengthBlockMinutes(3, "10", 60)).isEqualTo(3.5);
        assertThat(MetCalorieCalculator.strengthBlockMinutes(4, "10", null)).isEqualTo(6.5);
        assertThat(MetCalorieCalculator.strengthBlockMinutes(1, "10", 120)).isEqualTo(0.5);
        assertThat(MetCalorieCalculator.strengthBlockMinutes(3, "10", -30)).isEqualTo(1.5);
        assertThat(MetCalorieCalculator.strengthBlockMinutes(2, "10", 100000)).isEqualTo(11.0);
        assertThat(MetCalorieCalculator.strengthBlockMinutes(0, "10", 60)).isNull();
        assertThat(MetCalorieCalculator.strengthBlockMinutes(3, "", 60)).isNull();
    }

    @Test
    @DisplayName("Buổi 60 phút, 5 bài 4×10 nghỉ 90s, 70 kg ra khoảng 300 kcal (không phải vài chục)")
    void realisticSessionIsNotTiny() {
        double block = MetCalorieCalculator.strengthBlockMinutes(4, "10", 90);
        double lifting = MetCalorieCalculator.calories(5.0, 70.0, block * 5);
        double rest = MetCalorieCalculator.calories(3.5, 70.0, 60 - block * 5);
        assertThat(MetCalorieCalculator.roundKcal(lifting + rest)).isBetween(300, 340);
    }
}
