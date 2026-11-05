package com.gymflow.dto;

import com.gymflow.dto.Dtos.MemberSelfUpdateRequest;
import com.gymflow.dto.Dtos.RegisterRequest;
import com.gymflow.dto.Dtos.UpdateProfileRequest;
import com.gymflow.dto.Dtos.WeightRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/** Ràng buộc phía server cho các form hội viên (khớp frontend/src/lib/validation.ts). */
class MemberInputValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void init() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void close() {
        factory.close();
    }

    /** Tên trường -> thông báo lỗi. */
    private static Map<String, String> errors(Object req) {
        return validator.validate(req).stream().collect(Collectors.toMap(
                v -> v.getPropertyPath().toString(), ConstraintViolation::getMessage, (a, b) -> a));
    }

    private static WeightRequest weight(Double kg, Double fat) {
        return new WeightRequest(LocalDate.now().minusDays(1), kg, fat, null);
    }

    @Test
    void weightLimitsSayWhichBoundIsBroken() {
        assertThat(errors(weight(20.0, null))).isEmpty();
        assertThat(errors(weight(300.0, 70.0))).isEmpty();
        assertThat(errors(weight(19.9, null))).containsEntry("weightKg", "Cân nặng phải từ 20 kg trở lên");
        assertThat(errors(weight(300.1, null))).containsEntry("weightKg", "Cân nặng không được vượt quá 300 kg");
        assertThat(errors(weight(null, null))).containsKey("weightKg");
        assertThat(errors(weight(62.5, 1.9))).containsEntry("bodyFat", "% mỡ cơ thể phải từ 2% trở lên");
        assertThat(errors(weight(62.5, 70.1))).containsEntry("bodyFat", "% mỡ cơ thể không được vượt quá 70%");
    }

    @Test
    void weightCannotBeRecordedForTheFuture() {
        assertThat(errors(new WeightRequest(LocalDate.now().plusDays(1), 62.5, null, null))).containsKey("recordedDate");
    }

    @Test
    void fullNameRejectsDigitsAndAcceptsVietnamese() {
        assertThat(errors(new UpdateProfileRequest("Nguyễn Thế Kiên", "0912345678"))).isEmpty();
        assertThat(errors(new UpdateProfileRequest("Nguyễn Thế Kiên1", "")))
                .containsEntry("fullName", "Họ tên chỉ gồm chữ cái và khoảng trắng");
        assertThat(errors(new RegisterRequest("Kiên 2", "kien@example.com", "", "Pass1234", "Pass1234", true)))
                .containsKey("fullName");
        assertThat(errors(new RegisterRequest("Lê-Anh O'Brien", "kien@example.com", "", "Pass1234", "Pass1234", true)))
                .isEmpty();
    }

    @Test
    void selfUpdateChecksHeightAndBirthday() {
        assertThat(errors(new MemberSelfUpdateRequest("", null, null, 170.0, null, null))).isEmpty();
        assertThat(errors(new MemberSelfUpdateRequest("", null, null, 79.0, null, null)))
                .containsEntry("heightCm", "Chiều cao phải từ 80 cm trở lên");
        assertThat(errors(new MemberSelfUpdateRequest("", null, null, 251.0, null, null)))
                .containsEntry("heightCm", "Chiều cao không được vượt quá 250 cm");
        assertThat(errors(new MemberSelfUpdateRequest("", LocalDate.now().plusDays(1), null, null, null, null)))
                .containsKey("dateOfBirth");
    }
}
