package com.gymflow.service;

import com.gymflow.domain.Gender;
import com.gymflow.domain.Member;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/** % mỡ ước tính theo Deurenberg: 1,20 × BMI + 0,23 × tuổi − 10,8 × giới tính − 5,4 (nam = 1, nữ = 0). */
class BodyFatEstimateTest {

    @Test
    void maleAndFemaleUseSexFactor() {
        // Nam, BMI 22,5, 30 tuổi: 27 + 6,9 − 10,8 − 5,4 = 17,7
        assertThat(ProgressService.deurenbergBodyFat(22.5, 30, Gender.MALE)).isEqualTo(17.7);
        // Nữ cùng chỉ số: 27 + 6,9 − 5,4 = 28,5
        assertThat(ProgressService.deurenbergBodyFat(22.5, 30, Gender.FEMALE)).isEqualTo(28.5);
    }

    @Test
    void missingDataOrUnsupportedCasesReturnNull() {
        assertThat(ProgressService.deurenbergBodyFat(null, 30, Gender.MALE)).isNull();
        assertThat(ProgressService.deurenbergBodyFat(22.5, null, Gender.MALE)).isNull();
        assertThat(ProgressService.deurenbergBodyFat(22.5, 30, null)).isNull();
        assertThat(ProgressService.deurenbergBodyFat(22.5, 30, Gender.OTHER)).isNull();
        assertThat(ProgressService.deurenbergBodyFat(22.5, 16, Gender.MALE)).isNull();
    }

    @Test
    void resultIsClampedToValidRange() {
        assertThat(ProgressService.deurenbergBodyFat(10.0, 18, Gender.MALE)).isEqualTo(2.0);
        assertThat(ProgressService.deurenbergBodyFat(60.0, 80, Gender.FEMALE)).isEqualTo(70.0);
    }

    @Test
    void ageIsCountedAtRecordDate() {
        LocalDate dob = LocalDate.of(1996, 11, 20);
        assertThat(ProgressService.ageAt(dob, LocalDate.of(2026, 11, 19))).isEqualTo(29);
        assertThat(ProgressService.ageAt(dob, LocalDate.of(2026, 11, 20))).isEqualTo(30);
        assertThat(ProgressService.ageAt(null, LocalDate.of(2026, 11, 20))).isNull();
        assertThat(ProgressService.ageAt(dob, LocalDate.of(1990, 1, 1))).isNull();
    }

    @Test
    void hintNamesMissingProfileFields() {
        Member m = new Member();
        assertThat(ProgressService.bodyFatHint(m)).contains("chiều cao", "ngày sinh", "giới tính");
        m.setHeightCm(170.0);
        m.setDateOfBirth(LocalDate.of(1990, 1, 1));
        m.setGender(Gender.OTHER);
        assertThat(ProgressService.bodyFatHint(m)).contains("Nam hoặc Nữ");
    }
}
