package com.gymflow.dto;

import com.gymflow.domain.PackageRequestStatus;
import com.gymflow.domain.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** DTO cho hội viên tự đăng ký gói (V4). Tách khỏi Dtos.java để không đụng các record đang dùng. */
public final class PackageRequestDtos {

    private PackageRequestDtos() {
    }

    /**
     * paymentMethod để trống = trả tại quầy (giữ tương thích với form cũ).
     * trainerId bắt buộc khi gói có HLV kèm, bị bỏ qua với gói không kèm HLV.
     * promotionCode tuỳ chọn, backend kiểm tra lại và áp dụng nếu hợp lệ.
     */
    public record CreatePackageRequest(
            @NotNull(message = "Vui lòng chọn gói tập") Long planId,
            LocalDate desiredStartDate,
            @Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note,
            PaymentMethod paymentMethod,
            Long trainerId,
            String promotionCode) {
        public CreatePackageRequest(Long planId, LocalDate desiredStartDate, String note) {
            this(planId, desiredStartDate, note, null, null, null);
        }

        public CreatePackageRequest(Long planId, LocalDate desiredStartDate, String note, PaymentMethod paymentMethod, Long trainerId) {
            this(planId, desiredStartDate, note, paymentMethod, trainerId, null);
        }
    }

    /** trainerId: quản lý đổi HLV khi duyệt (VD HLV hội viên chọn đã kín lịch); để trống = giữ HLV hội viên chọn. */
    public record ApprovePackageRequest(@Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note, Long trainerId) {
        public ApprovePackageRequest(String note) {
            this(note, null);
        }
    }

    public record RejectPackageRequest(
            @NotBlank(message = "Vui lòng nhập lý do từ chối")
            @Size(min = 5, max = 255, message = "Lý do từ 5 đến 255 ký tự") String reason) {
    }

    public record PackageRequestResponse(Long id, Long memberId, String memberName, String memberCode, String memberPhone,
                                         Long planId, String planName, Long price, Integer durationDays,
                                         boolean planStillOnSale, LocalDate desiredStartDate, String note,
                                         PackageRequestStatus status, String decisionNote, String decidedByName,
                                         LocalDateTime decidedAt, Long subscriptionId, LocalDateTime createdAt,
                                         boolean includesTrainer, Long trainerId, String trainerName,
                                         PaymentMethod paymentMethod, String paymentCode, LocalDateTime memberPaidAt,
                                         Long promotionId, String promotionCode, String promotionName,
                                         long originalPrice, long discountAmount, long finalPrice) {
    }

    public record CountResponse(long count) {
    }

    // ---------------- Thông tin chuyển khoản (V12) ----------------

    /** Hội viên đọc được (để chuyển khoản); chỉ quản lý sửa. Ảnh QR lấy riêng qua GET /api/payment-settings/qr. */
    public record PaymentSettingsResponse(boolean onlineEnabled, String bankName, String accountNumber, String accountName,
                                          boolean hasQr, LocalDateTime qrUpdatedAt, LocalDateTime updatedAt) {
    }

    public record PaymentSettingsRequest(
            boolean onlineEnabled,
            @Size(max = 100, message = "Tên ngân hàng tối đa 100 ký tự") String bankName,
            @Size(max = 30, message = "Số tài khoản tối đa 30 ký tự") String accountNumber,
            @Size(max = 100, message = "Tên chủ tài khoản tối đa 100 ký tự") String accountName) {
    }
}
