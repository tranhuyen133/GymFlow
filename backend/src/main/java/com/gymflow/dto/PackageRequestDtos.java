package com.gymflow.dto;

import com.gymflow.domain.ChangeRequestType;
import com.gymflow.domain.PackageRequestType;
import com.gymflow.domain.PackageRequestStatus;
import com.gymflow.domain.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
                                         Long planId, String planName, String planNameEn, Long price, Integer durationDays,
                                         boolean planStillOnSale, LocalDate desiredStartDate, String note,
                                         PackageRequestStatus status, String decisionNote, String decidedByName,
                                         LocalDateTime decidedAt, Long subscriptionId, LocalDateTime createdAt,
                                         boolean includesTrainer, Long trainerId, String trainerName,
                                         PaymentMethod paymentMethod, String paymentCode, LocalDateTime memberPaidAt,
                                         Long promotionId, String promotionCode, String promotionName, String promotionNameEn,
                                         long originalPrice, long discountAmount, long finalPrice,
                                         /** V49 · đơn nâng cấp lên PT: gói cũ và số tiền bù trừ */
                                         PackageRequestType requestType, Long upgradeFromSubscriptionId,
                                         String upgradeFromPlanName, long upgradeCredit) {
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

    // ---------------- V49 · Nâng cấp gói tự tập lên gói có PT ----------------

    /** Hội viên xin nâng cấp: chọn gói PT, ngày bắt đầu (sớm nhất ngày mai), HLV, cách trả tiền, mã ưu đãi. */
    public record CreateUpgradeRequest(
            @NotNull(message = "Vui lòng chọn gói có PT") Long planId,
            @NotNull(message = "Vui lòng chọn ngày bắt đầu gói mới") LocalDate startDate,
            Long trainerId,
            PaymentMethod paymentMethod,
            @Size(max = 50, message = "Mã ưu đãi tối đa 50 ký tự") String promotionCode,
            @Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note) {
    }

    /**
     * Báo giá nâng cấp. eligible = false kèm reason khi không nâng cấp được (VD gói hiện tại đã có PT).
     * credit = giá trị còn lại của gói tự tập (theo số ngày chưa dùng), amountAfterCredit = giá gói PT − credit,
     * finalPrice = số tiền phải trả sau ưu đãi. minStart / maxStart = khoảng ngày được chọn.
     */
    public record UpgradeQuote(boolean eligible, String reason,
                               Long fromSubscriptionId, String fromPlanName, LocalDate fromStartDate, LocalDate fromEndDate,
                               long fromPricePaid, long totalDays, long remainingDays, long credit,
                               Long planId, String planName, long planPrice, long amountAfterCredit,
                               Long promotionId, String promotionCode, String promotionName, String promotionReason,
                               long discountAmount, long finalPrice, List<Dtos.PromotionGrantDto> gifts,
                               LocalDate startDate, LocalDate endDate, Integer ptSessions, LocalDate ptValidUntil,
                               LocalDate minStart, LocalDate maxStart, Long currentTrainerId, String currentTrainerName) {
    }

    // ---------------- V49 · Yêu cầu điều chỉnh gói (hội viên gửi, quản lý duyệt) ----------------

    public record CreateChangeRequest(
            @NotNull(message = "Chọn gói cần điều chỉnh") Long subscriptionId,
            @NotNull(message = "Chọn loại điều chỉnh") ChangeRequestType type,
            LocalDate newStartDate,
            Integer pauseDays,
            Long trainerId,
            @NotBlank(message = "Vui lòng nêu lý do")
            @Size(min = 5, max = 255, message = "Lý do từ 5 đến 255 ký tự") String reason) {
    }

    /** newStartDate / newEndDate = thời gian dự kiến sau khi duyệt, để hai bên cùng thấy trước / sau. */
    public record ChangeRequestResponse(Long id, Long memberId, String memberName, String memberCode, String memberPhone,
                                        Long subscriptionId, String planName, ChangeRequestType type,
                                        LocalDate oldStartDate, LocalDate oldEndDate,
                                        LocalDate newStartDate, LocalDate newEndDate, Integer pauseDays,
                                        Long trainerId, String trainerName, String currentTrainerName,
                                        String reason, PackageRequestStatus status, String decisionNote,
                                        String decidedByName, LocalDateTime decidedAt, LocalDateTime createdAt) {
    }

    public record DecideChangeRequest(@Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note) {
    }

    // ---------------- V49 · Quản lý sửa thời gian gói ----------------

    /** ptValidUntil để trống = tự dời theo ngày bắt đầu mới. */
    public record AdjustDatesRequest(
            @NotNull(message = "Chọn ngày bắt đầu") LocalDate startDate,
            @NotNull(message = "Chọn ngày kết thúc") LocalDate endDate,
            LocalDate ptValidUntil,
            @NotBlank(message = "Vui lòng nhập lý do sửa")
            @Size(min = 5, max = 255, message = "Lý do từ 5 đến 255 ký tự") String reason) {
    }

    public record AdjustmentResponse(Long id, Long subscriptionId, com.gymflow.domain.AdjustmentSource source,
                                     LocalDate oldStartDate, LocalDate oldEndDate, LocalDate newStartDate, LocalDate newEndDate,
                                     LocalDate oldPtValidUntil, LocalDate newPtValidUntil, String reason,
                                     String createdByName, LocalDateTime createdAt) {
    }

    /** cancelledSessions = buổi đã xếp bị huỷ vì không còn nằm trong gói nào; notes = các việc hệ thống đã làm kèm. */
    public record AdjustResult(Dtos.SubscriptionResponse subscription, int cancelledSessions, List<String> notes) {
    }
}
