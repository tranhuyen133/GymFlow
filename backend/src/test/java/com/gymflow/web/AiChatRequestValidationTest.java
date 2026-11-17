package com.gymflow.web;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền)
 * CẦN LÀM: Kiểm tra giới hạn 500 ký tự và bắt buộc nhập câu hỏi.
 */
class AiChatRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsMessageUpTo500Characters() {
        assertThat(validator.validate(new AiChatController.AiChatRequest("a".repeat(500)))).isEmpty();
    }

    @Test
    void rejectsMessageLongerThan500Characters() {
        assertThat(validator.validate(new AiChatController.AiChatRequest("a".repeat(501)))).isNotEmpty();
    }

    @Test
    void rejectsBlankMessage() {
        assertThat(validator.validate(new AiChatController.AiChatRequest("   "))).isNotEmpty();
    }
}
