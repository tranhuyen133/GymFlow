package com.gymflow.dto;

import com.gymflow.dto.Dtos.ShiftRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;
import java.util.List;

/** DTO giờ tập mong muốn của hội viên. Để riêng file này, không đụng Dtos.java dùng chung. */
public final class TimePreferenceDtos {
    private TimePreferenceDtos() {
    }

    /** Mỗi ngày tối đa 3 khung giờ → cả tuần tối đa 21. */
    public record TimeSlotsRequest(@NotNull @Size(max = 21, message = "Tối đa 21 khung giờ mỗi tuần") @Valid List<ShiftRequest> slots) {
    }

    public record TimeSlotResponse(Integer dayOfWeek, LocalTime startTime, LocalTime endTime) {
    }

    /** Giờ tập của một hội viên mà HLV phụ trách, dùng ở màn xếp ca. */
    public record MemberTimeSlotResponse(Long memberId, String memberName, String memberCode,
                                         Integer dayOfWeek, LocalTime startTime, LocalTime endTime) {
    }
}
