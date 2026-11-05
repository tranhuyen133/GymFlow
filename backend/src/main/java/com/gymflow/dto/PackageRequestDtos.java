package com.gymflow.dto;

import com.gymflow.domain.PackageRequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** DTO cho hội viên tự đăng ký gói (V4). Tách khỏi Dtos.java để không đụng các record đang dùng. */
public final class PackageRequestDtos {

    private PackageRequestDtos() {
    }

    public record CreatePackageRequest(
            @NotNull(message = "Vui lòng chọn gói tập") Long planId,
            LocalDate desiredStartDate,
            @Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note) {
    }

    public record ApprovePackageRequest(@Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note) {
    }

    public record RejectPackageRequest(
            @NotBlank(message = "Vui lòng nhập lý do từ chối")
            @Size(min = 5, max = 255, message = "Lý do từ 5 đến 255 ký tự") String reason) {
    }

    public record PackageRequestResponse(Long id, Long memberId, String memberName, String memberCode, String memberPhone,
                                         Long planId, String planName, Long price, Integer durationDays,
                                         boolean planStillOnSale, LocalDate desiredStartDate, String note,
                                         PackageRequestStatus status, String decisionNote, String decidedByName,
                                         LocalDateTime decidedAt, Long subscriptionId, LocalDateTime createdAt) {
    }

    public record CountResponse(long count) {
    }
}
