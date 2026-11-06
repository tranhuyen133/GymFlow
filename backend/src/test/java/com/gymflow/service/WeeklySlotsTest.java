package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.dto.Dtos.ShiftRequest;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Khung giờ theo tuần (ca HLV, giờ tập hội viên): giờ mở cửa 05:00–22:00, ≥ 30 phút, không chồng, tối đa 3/ngày. */
class WeeklySlotsTest {

    private static ShiftRequest slot(int day, String start, String end) {
        return new ShiftRequest(day, LocalTime.parse(start), LocalTime.parse(end));
    }

    @Test
    void sortsValidSlotsByDayThenTime() {
        List<ShiftRequest> out = WeeklySlots.validate(List.of(slot(2, "16:00", "21:00"), slot(1, "17:00", "22:00"), slot(1, "05:00", "11:00")), "Ca");
        assertThat(out).extracting(ShiftRequest::dayOfWeek).containsExactly(1, 1, 2);
        assertThat(out.get(0).startTime()).isEqualTo(LocalTime.of(5, 0));
    }

    @Test
    void rejectsSlotBeforeOpening() {
        assertThatThrownBy(() -> WeeklySlots.validate(List.of(slot(1, "04:00", "09:00")), "Ca"))
                .isInstanceOf(ApiException.class).hasMessageContaining("05:00–22:00");
    }

    @Test
    void rejectsSlotAfterClosing() {
        assertThatThrownBy(() -> WeeklySlots.validate(List.of(slot(3, "20:00", "22:30")), "Giờ tập"))
                .isInstanceOf(ApiException.class).hasMessageContaining("Giờ tập Thứ 4");
    }

    @Test
    void rejectsReversedAndTooShortSlots() {
        assertThatThrownBy(() -> WeeklySlots.validate(List.of(slot(1, "11:30", "05:30")), "Ca"))
                .isInstanceOf(ApiException.class).hasMessageContaining("giờ kết thúc phải sau giờ bắt đầu");
        assertThatThrownBy(() -> WeeklySlots.validate(List.of(slot(1, "06:00", "06:15")), "Ca"))
                .isInstanceOf(ApiException.class).hasMessageContaining("30 phút");
    }

    @Test
    void rejectsOverlapAndMoreThanThreePerDay() {
        assertThatThrownBy(() -> WeeklySlots.validate(List.of(slot(1, "05:30", "11:30"), slot(1, "11:00", "13:00")), "Ca"))
                .isInstanceOf(ApiException.class).hasMessageContaining("chồng nhau");
        assertThatThrownBy(() -> WeeklySlots.validate(List.of(slot(7, "05:00", "06:00"), slot(7, "07:00", "08:00"),
                slot(7, "09:00", "10:00"), slot(7, "11:00", "12:00")), "Ca"))
                .isInstanceOf(ApiException.class).hasMessageContaining("tối đa 3");
    }
}
