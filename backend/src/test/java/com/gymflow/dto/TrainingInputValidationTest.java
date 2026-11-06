package com.gymflow.dto;

import com.gymflow.domain.Level;
import com.gymflow.domain.MuscleGroup;
import com.gymflow.dto.Dtos.ExerciseRequest;
import com.gymflow.dto.Dtos.PlanItemRequest;
import com.gymflow.dto.Dtos.WorkoutPlanRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** Tên giáo án / bài tập phải có chữ cái; số lần chỉ nhận 10, 10-12, 45s. */
class TrainingInputValidationTest {

    private static final Validator V = Validation.buildDefaultValidatorFactory().getValidator();

    private static Set<String> fields(Object o) {
        return V.validate(o).stream().map(ConstraintViolation::getPropertyPath).map(Object::toString)
                .collect(java.util.stream.Collectors.toSet());
    }

    private static WorkoutPlanRequest plan(String name, String reps) {
        return new WorkoutPlanRequest(1L, name, null, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), null,
                List.of(new PlanItemRequest(1L, 1, 0, 3, reps, null, null, null, null)));
    }

    @ParameterizedTest
    @ValueSource(strings = {"0123456789", "123", "--- 45", "!!"})
    void planNameWithoutLettersIsRejected(String name) {
        assertThat(fields(plan(name, "10"))).contains("name");
    }

    @ParameterizedTest
    @ValueSource(strings = {"Full body 3 buổi/tuần", "Upper / Lower + Cardio", "Giai đoạn 2", "PPL 6 ngày"})
    void planNameWithLettersAndDigitsIsAccepted(String name) {
        assertThat(fields(plan(name, "10"))).doesNotContain("name");
    }

    @ParameterizedTest
    @ValueSource(strings = {"10", "8-12", "8 - 12", "45s", "1"})
    void validRepsAreAccepted(String reps) {
        assertThat(fields(plan("Giáo án A", reps))).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"mười", "10x3", "-5", "10--12", "1000"})
    void invalidRepsAreRejected(String reps) {
        assertThat(fields(plan("Giáo án A", reps))).contains("items[0].reps");
    }

    private static ExerciseRequest exercise(String name, String nameEn, String equipment) {
        return new ExerciseRequest(name, MuscleGroup.CHEST, equipment, Level.BEGINNER, null, null, null,
                nameEn, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void exerciseNameMustContainLetters() {
        assertThat(fields(exercise("12345", null, null))).contains("name");
        assertThat(fields(exercise("Hít đất (Push-up)", "Push-up", "Không"))).isEmpty();
        assertThat(fields(exercise("Ngồi xuống – đứng lên", "Sit-to-stand", ""))).isEmpty();
    }

    @Test
    void exerciseEnglishNameAndEquipmentAreChecked() {
        assertThat(fields(exercise("Đẩy ngực", "Đẩy ngực", null))).contains("nameEn");
        assertThat(fields(exercise("Đẩy ngực", null, "123"))).contains("equipment");
    }
}
