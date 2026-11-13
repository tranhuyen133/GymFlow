package com.gymflow.dto;

import com.gymflow.domain.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/** Toàn bộ request/response của API, gom một chỗ để FE (src/api/types.ts) đối chiếu 1-1. */
public final class Dtos {
    private Dtos() {
    }

    private static final String PASSWORD_RULE = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$";
    private static final String PASSWORD_MSG = "Mật khẩu tối thiểu 8 ký tự, gồm cả chữ và số";
    private static final String EMAIL_RULE = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
    private static final String EMAIL_MSG = "Email không hợp lệ (không dùng chữ có dấu hoặc khoảng trắng)";
    private static final String PHONE_RULE = "^$|^(0|\\+84)\\d{9,10}$";
    private static final String PHONE_MSG = "Số điện thoại không hợp lệ";
    private static final String NAME_RULE = "^[\\p{L}\\p{M}][\\p{L}\\p{M} .'-]*$";
    private static final String NAME_MSG = "Họ tên chỉ gồm chữ cái và khoảng trắng";
    /** Tên giáo án / bài tập: phải có chữ cái (không chỉ gồm số), cho phép số và dấu câu thường gặp. Trùng validation.ts. */
    private static final String TITLE_RULE = "^(?=.*\\p{L})[\\p{L}\\p{M}\\d .,:;/()+&#'’–-]+$";
    private static final String PLAN_NAME_MSG = "Tên giáo án phải có chữ cái (có thể kèm số), VD: Full body 3 buổi/tuần";
    private static final String EXERCISE_NAME_MSG = "Tên bài tập phải có chữ cái (có thể kèm số), VD: Squat thanh đòn";
    /** Để trống hoặc có ít nhất một chữ cái (dụng cụ, cơ phụ trợ, tên gọi khác). */
    private static final String TEXT_RULE = "^$|(?s).*\\p{L}.*";
    private static final String NAME_EN_RULE = "^$|^[A-Za-z][A-Za-z0-9 ()'’/,.&+-]*$";
    /** Số lần: 10, 10-12, 45s (giây). Trùng PlanEditor.tsx. */
    private static final String REPS_RULE = "^\\d{1,3}(\\s*-\\s*\\d{1,3})?\\s*[sS]?$";

    // ===================== Auth =====================
    public record LoginRequest(
            @NotBlank(message = "Vui lòng nhập email") @Email(message = "Email không hợp lệ") @Pattern(regexp = EMAIL_RULE, message = EMAIL_MSG) @Size(max = 120, message = "Email tối đa 120 ký tự") String email,
            @NotBlank(message = "Vui lòng nhập mật khẩu") String password) {
    }

    public record MeResponse(Long id, String email, String fullName, String phone, Role role,
                             Long memberId, Long trainerId, LocalDateTime lastLoginAt, LocalDateTime avatarUpdatedAt) {
    }

    public record LoginResponse(String token, long expiresInMinutes, MeResponse user) {
    }

    /**
     * Hội viên tự đăng ký. Không có trường vai trò: server luôn gán MEMBER, nên gửi thêm "role" cũng bị bỏ qua.
     * Mật khẩu xác nhận được kiểm tra lại ở service (FE đã kiểm tra trước).
     */
    public record RegisterRequest(
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(min = 2, max = 100, message = "Họ tên từ 2 đến 100 ký tự") @Pattern(regexp = NAME_RULE, message = NAME_MSG) String fullName,
            @NotBlank(message = "Vui lòng nhập email") @Email(message = "Email không hợp lệ") @Pattern(regexp = EMAIL_RULE, message = EMAIL_MSG) @Size(max = 120, message = "Email tối đa 120 ký tự") String email,
            @Pattern(regexp = PHONE_RULE, message = PHONE_MSG) String phone,
            @NotBlank(message = "Vui lòng nhập mật khẩu") @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MSG) String password,
            @NotBlank(message = "Vui lòng nhập lại mật khẩu") String confirmPassword,
            @AssertTrue(message = "Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật") boolean acceptTerms) {
    }

    public record RegisterResponse(String message, String email) {
    }

    public record VerifyEmailRequest(
            @NotBlank @Email @Pattern(regexp = EMAIL_RULE, message = EMAIL_MSG) @Size(max = 120) String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "Mã OTP gồm 6 chữ số") String code) {
    }

    public record ResendVerificationRequest(
            @NotBlank @Email @Pattern(regexp = EMAIL_RULE, message = EMAIL_MSG) @Size(max = 120) String email) {
    }

    public record AuthMessageResponse(String message) {
    }

    /** Tài khoản demo chỉ trả về khi bật app.demo.quick-login và tài khoản thật sự tồn tại, đang hoạt động. */
    public record DemoAccount(String label, Role role, String email, String password) {
    }

    public record AuthOptions(boolean registrationEnabled, List<DemoAccount> demoAccounts) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại") String currentPassword,
            @NotBlank @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MSG) String newPassword) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Vui lòng nhập email") @Email(message = "Email không hợp lệ") @Pattern(regexp = EMAIL_RULE, message = EMAIL_MSG) @Size(max = 120, message = "Email tối đa 120 ký tự") String email) {
    }

    public record ForgotPasswordResponse(String message, int validMinutes) {
    }

    public record ResetPasswordRequest(
            @NotBlank @Email @Pattern(regexp = EMAIL_RULE, message = EMAIL_MSG) @Size(max = 120) String email,
            @NotBlank(message = "Vui lòng nhập mã khôi phục") @Pattern(regexp = "\\d{6}", message = "Mã OTP gồm 6 chữ số") String code,
            @NotBlank @Pattern(regexp = PASSWORD_RULE, message = PASSWORD_MSG) String newPassword) {
    }

    public record ChatSendRequest(@NotNull(message = "Thiếu mã hội thoại") Long conversationId,
                                  String topic,
                                  String text) {
        public ChatSendRequest(Long conversationId, String topic) {
            this(conversationId, topic, null);
        }
    }

    public record ChatSuggestion(String key, String label) {
    }

    public record ChatSuggestionsResponse(boolean freeTextEnabled, List<ChatSuggestion> suggestions) {
    }

    public record ChatMessageResponse(Long id, String sender, String content, LocalDateTime createdAt, String provider) {
        public ChatMessageResponse(Long id, String sender, String content, LocalDateTime createdAt) {
            this(id, sender, content, createdAt, "RULE");
        }
    }

    public record AiHealthResponse(boolean aiEnabled, boolean aiReachable, String provider, String model, String info) {
    }

    public record ChatConversationResponse(Long id, String title, LocalDateTime createdAt,
                                          LocalDateTime updatedAt, String lastMessage) {
    }

    public record ChatCreateConversationResponse(Long id, String title, LocalDateTime createdAt,
                                                LocalDateTime updatedAt) {
    }

    public record ChatHistoryResponse(Long conversationId, List<ChatMessageResponse> messages) {
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 100, message = "Họ tên tối đa 100 ký tự") @Pattern(regexp = NAME_RULE, message = NAME_MSG) String fullName,
            @Pattern(regexp = PHONE_RULE, message = PHONE_MSG) String phone) {
    }

    // ===================== Member =====================
    public record MemberCreateRequest(
            @NotBlank(message = "Vui lòng nhập email") @Email(message = "Email không hợp lệ") @Pattern(regexp = EMAIL_RULE, message = EMAIL_MSG) @Size(max = 120, message = "Email tối đa 120 ký tự") String email,
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 100, message = "Họ tên tối đa 100 ký tự") @Pattern(regexp = NAME_RULE, message = NAME_MSG) String fullName,
            @Pattern(regexp = PHONE_RULE, message = PHONE_MSG) String phone,
            @Pattern(regexp = "^$|" + PASSWORD_RULE, message = PASSWORD_MSG) String password,
            @Past(message = "Ngày sinh phải ở quá khứ") LocalDate dateOfBirth,
            Gender gender,
            @DecimalMin(value = "80", message = "Chiều cao phải từ 80 cm trở lên") @DecimalMax(value = "250", message = "Chiều cao không được vượt quá 250 cm") Double heightCm,
            @Size(max = 255, message = "Mục tiêu tối đa 255 ký tự") String goal,
            @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự") String address,
            Long trainerId,
            @Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note) {
        @AssertTrue(message = "Ngày sinh phải sau ngày 01/01/1900")
        public boolean isDateOfBirthValid() {
            return dateOfBirth == null || dateOfBirth.isAfter(LocalDate.of(1900, 1, 1));
        }
    }

    public record MemberUpdateRequest(
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 100, message = "Họ tên tối đa 100 ký tự") @Pattern(regexp = NAME_RULE, message = NAME_MSG) String fullName,
            @Pattern(regexp = PHONE_RULE, message = PHONE_MSG) String phone,
            @Past(message = "Ngày sinh phải ở quá khứ") LocalDate dateOfBirth,
            Gender gender,
            @DecimalMin(value = "80", message = "Chiều cao phải từ 80 cm trở lên") @DecimalMax(value = "250", message = "Chiều cao không được vượt quá 250 cm") Double heightCm,
            @Size(max = 255, message = "Mục tiêu tối đa 255 ký tự") String goal,
            @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự") String address,
            Long trainerId,
            @Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note) {
        @AssertTrue(message = "Ngày sinh phải sau ngày 01/01/1900")
        public boolean isDateOfBirthValid() {
            return dateOfBirth == null || dateOfBirth.isAfter(LocalDate.of(1900, 1, 1));
        }
    }

    /** Hội viên tự sửa: không được đổi HLV hay ghi chú nội bộ. */
    public record MemberSelfUpdateRequest(
            @Pattern(regexp = PHONE_RULE, message = PHONE_MSG) String phone,
            @Past(message = "Ngày sinh phải ở quá khứ") LocalDate dateOfBirth,
            Gender gender,
            @DecimalMin(value = "80", message = "Chiều cao phải từ 80 cm trở lên") @DecimalMax(value = "250", message = "Chiều cao không được vượt quá 250 cm") Double heightCm,
            @Size(max = 255, message = "Mục tiêu tối đa 255 ký tự") String goal,
            @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự") String address) {
        @AssertTrue(message = "Ngày sinh phải sau ngày 01/01/1900")
        public boolean isDateOfBirthValid() {
            return dateOfBirth == null || dateOfBirth.isAfter(LocalDate.of(1900, 1, 1));
        }
    }

    public record MemberStatusRequest(@NotNull(message = "Vui lòng chọn trạng thái") MemberStatus status) {
    }

    public record AssignTrainerRequest(Long trainerId) {
    }

    public record MemberResponse(Long id, Long userId, String code, String fullName, String email, String phone,
                                 LocalDate dateOfBirth, Gender gender, Double heightCm, String goal, String address,
                                 MemberStatus status, UserStatus accountStatus, Long trainerId, String trainerName,
                                 LocalDate joinedAt, String note,
                                 String currentPlanName, SubscriptionState subscriptionState,
                                 LocalDate subscriptionEndDate, Long daysLeft) {
    }

    public record MemberCreatedResponse(MemberResponse member, String temporaryPassword) {
    }

    public record MemberDetailResponse(MemberResponse member, List<SubscriptionResponse> subscriptions,
                                       List<WorkoutPlanSummary> plans, WeightResponse latestWeight,
                                       long totalSessions, long completedSessions) {
    }

    // ===================== Trainer =====================
    public record TrainerCreateRequest(
            @NotBlank(message = "Vui lòng nhập email") @Email(message = "Email không hợp lệ") @Pattern(regexp = EMAIL_RULE, message = EMAIL_MSG) @Size(max = 120, message = "Email tối đa 120 ký tự") String email,
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 100, message = "Họ tên tối đa 100 ký tự") String fullName,
            @Pattern(regexp = PHONE_RULE, message = PHONE_MSG) String phone,
            @Pattern(regexp = "^$|" + PASSWORD_RULE, message = PASSWORD_MSG) String password,
            @Size(max = 120) String specialty,
            @Min(value = 0, message = "Kinh nghiệm không âm") @Max(value = 60, message = "Kinh nghiệm tối đa 60 năm") Integer experienceYears,
            @Size(max = 255) String certificates,
            @Size(max = 1000) String bio) {
    }

    public record TrainerUpdateRequest(
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 100, message = "Họ tên tối đa 100 ký tự") String fullName,
            @Pattern(regexp = PHONE_RULE, message = PHONE_MSG) String phone,
            @Size(max = 120) String specialty,
            @Min(value = 0, message = "Kinh nghiệm không âm") @Max(value = 60, message = "Kinh nghiệm tối đa 60 năm") Integer experienceYears,
            @Size(max = 255) String certificates,
            @Size(max = 1000) String bio) {
    }

    public record ActiveRequest(@NotNull Boolean active) {
    }

    public record ShiftRequest(
            @NotNull @Min(value = 1, message = "Thứ từ 1 (T2) đến 7 (CN)") @Max(value = 7, message = "Thứ từ 1 (T2) đến 7 (CN)") Integer dayOfWeek,
            @NotNull(message = "Thiếu giờ bắt đầu") LocalTime startTime,
            @NotNull(message = "Thiếu giờ kết thúc") LocalTime endTime) {
    }

    public record ShiftsRequest(@NotNull @Valid List<ShiftRequest> shifts) {
    }

    public record ShiftResponse(Long id, Integer dayOfWeek, LocalTime startTime, LocalTime endTime) {
    }

    public record TrainerResponse(Long id, Long userId, String fullName, String email, String phone, String specialty,
                                  Integer experienceYears, String certificates, String bio, boolean active,
                                  UserStatus accountStatus, long memberCount, List<ShiftResponse> shifts) {
    }

    public record TrainerCreatedResponse(TrainerResponse trainer, String temporaryPassword) {
    }

    // ===================== Membership plan =====================
    public record PlanServiceGrantDto(
            @NotNull(message = "Chọn dịch vụ") Long serviceId,
            String serviceName,
            @Min(value = 1, message = "Số lượt tối thiểu là 1") int quantity,
            @Min(value = 1, message = "Số ngày hiệu lực tối thiểu là 1") int validDays,
            @Size(max = 255) String conditions) {
    }

    public record PlanRequest(
            @NotBlank(message = "Vui lòng nhập tên gói") @Size(max = 100) String name,
            @Size(max = 500) String description,
            @NotNull(message = "Vui lòng nhập giá") @Min(value = 0, message = "Giá không âm") Long price,
            @NotNull(message = "Vui lòng nhập thời hạn") @Min(value = 1, message = "Thời hạn tối thiểu 1 ngày") @Max(value = 1095, message = "Thời hạn tối đa 3 năm") Integer durationDays,
            @Size(max = 1000) String benefits,
            /** Gói có HLV kèm (PT). Không gửi = false: hội viên tự soạn giáo án, tự xếp lịch. */
            boolean includesTrainer,
            PlanType planType,
            Integer ptSessions,
            Integer ptValidDays,
            List<PlanServiceGrantDto> serviceGrants,
            /** V24 · mã gói, để trống được. */
            @Size(max = 30, message = "Mã gói tối đa 30 ký tự") @Pattern(regexp = "^$|^[A-Za-z0-9_-]+$", message = "Mã gói chỉ gồm chữ không dấu, số, - và _") String code,
            @Size(max = 1000, message = "Điều kiện sử dụng tối đa 1000 ký tự") String usageTerms,
            @Min(value = 15, message = "Buổi PT tối thiểu 15 phút") @Max(value = 240, message = "Buổi PT tối đa 240 phút") Integer ptSessionMinutes,
            @Min(value = 0, message = "Số giờ báo trước không âm") @Max(value = 168, message = "Báo trước tối đa 168 giờ (7 ngày)") Integer ptCancelNoticeHours,
            @Size(max = 100) String nameEn,
            String descriptionEn,
            String benefitsEn) {
        /** Giữ chữ ký trước V24. */
        public PlanRequest(String name, String description, Long price, Integer durationDays, String benefits,
                           boolean includesTrainer, PlanType planType, Integer ptSessions, Integer ptValidDays,
                           List<PlanServiceGrantDto> serviceGrants) {
            this(name, description, price, durationDays, benefits, includesTrainer, planType, ptSessions, ptValidDays,
                    serviceGrants, null, null, null, null, null, null, null);
        }

        /** Giữ chữ ký V24. */
        public PlanRequest(String name, String description, Long price, Integer durationDays, String benefits,
                           boolean includesTrainer, PlanType planType, Integer ptSessions, Integer ptValidDays,
                           List<PlanServiceGrantDto> serviceGrants, String code, String usageTerms,
                           Integer ptSessionMinutes, Integer ptCancelNoticeHours) {
            this(name, description, price, durationDays, benefits, includesTrainer, planType, ptSessions, ptValidDays,
                    serviceGrants, code, usageTerms, ptSessionMinutes, ptCancelNoticeHours, null, null, null);
        }

        public PlanRequest(String name, String description, Long price, Integer durationDays, String benefits) {
            this(name, description, price, durationDays, benefits, false, PlanType.GYM, null, null, null);
        }

        public PlanRequest(String name, String description, Long price, Integer durationDays, String benefits, boolean includesTrainer) {
            this(name, description, price, durationDays, benefits, includesTrainer, includesTrainer ? PlanType.GYM_PT : PlanType.GYM, null, null, null);
        }

        public PlanRequest(String name, String description, Long price, Integer durationDays, String benefits,
                           boolean includesTrainer, PlanType planType, Integer ptSessions, Integer ptValidDays) {
            this(name, description, price, durationDays, benefits, includesTrainer, planType, ptSessions, ptValidDays, null);
        }
    }

    public record PlanResponse(Long id, String name, String description, Long price, Integer durationDays,
                               String benefits, boolean active, long currentSubscriptions, boolean includesTrainer,
                               PlanType planType, Integer ptSessions, Integer ptValidDays,
                               List<PlanServiceGrantDto> serviceGrants,
                               String code, String usageTerms, Integer ptSessionMinutes, Integer ptCancelNoticeHours,
                               String nameEn, String descriptionEn, String benefitsEn) {
        /** Giữ chữ ký trước V24. */
        public PlanResponse(Long id, String name, String description, Long price, Integer durationDays,
                            String benefits, boolean active, long currentSubscriptions, boolean includesTrainer,
                            PlanType planType, Integer ptSessions, Integer ptValidDays,
                            List<PlanServiceGrantDto> serviceGrants) {
            this(id, name, description, price, durationDays, benefits, active, currentSubscriptions, includesTrainer,
                    planType, ptSessions, ptValidDays, serviceGrants, null, null, null, null, null, null, null);
        }

        /** Giữ chữ ký V24. */
        public PlanResponse(Long id, String name, String description, Long price, Integer durationDays,
                            String benefits, boolean active, long currentSubscriptions, boolean includesTrainer,
                            PlanType planType, Integer ptSessions, Integer ptValidDays,
                            List<PlanServiceGrantDto> serviceGrants,
                            String code, String usageTerms, Integer ptSessionMinutes, Integer ptCancelNoticeHours) {
            this(id, name, description, price, durationDays, benefits, active, currentSubscriptions, includesTrainer,
                    planType, ptSessions, ptValidDays, serviceGrants, code, usageTerms, ptSessionMinutes,
                    ptCancelNoticeHours, null, null, null);
        }
    }

    // ===================== Subscription =====================
    public record SubscriptionRequest(
            @NotNull(message = "Vui lòng chọn hội viên") Long memberId,
            @NotNull(message = "Vui lòng chọn gói tập") Long planId,
            LocalDate startDate,
            @Min(value = 0, message = "Số tiền không âm") Long pricePaid,
            @Size(max = 255) String note,
            Integer ptSessionsTotal,
            LocalDate ptValidUntil,
            /** V24 · chốt theo đơn hội viên gửi; null = lấy theo gói hiện tại. */
            Integer ptSessionMinutes,
            Integer ptCancelNoticeHours) {
        /** Giữ chữ ký trước V24. */
        public SubscriptionRequest(Long memberId, Long planId, LocalDate startDate, Long pricePaid, String note,
                                   Integer ptSessionsTotal, LocalDate ptValidUntil) {
            this(memberId, planId, startDate, pricePaid, note, ptSessionsTotal, ptValidUntil, null, null);
        }

        public SubscriptionRequest(Long memberId, Long planId, LocalDate startDate, Long pricePaid, String note) {
            this(memberId, planId, startDate, pricePaid, note, null, null);
        }
    }

    public record CancelRequest(@Size(max = 200) String reason) {
    }

    public record SubscriptionPreview(LocalDate startDate, LocalDate endDate, Long price, boolean chained) {
    }

    public record SubscriptionResponse(Long id, Long memberId, String memberName, String memberCode,
                                       Long planId, String planName, LocalDate startDate, LocalDate endDate,
                                       Long pricePaid, SubscriptionState state, long daysLeft, boolean cancelled,
                                       LocalDateTime cancelledAt, String note, LocalDateTime createdAt, String createdByName,
                                       Integer ptSessionsTotal, Integer ptSessionsUsed, Integer ptSessionsRemaining, LocalDate ptValidUntil,
                                       PlanType planType, Integer ptSessionMinutes, Integer ptCancelNoticeHours,
                                       String benefits, String usageTerms, String trainerName) {
        /** Giữ chữ ký trước V24. */
        public SubscriptionResponse(Long id, Long memberId, String memberName, String memberCode,
                                    Long planId, String planName, LocalDate startDate, LocalDate endDate,
                                    Long pricePaid, SubscriptionState state, long daysLeft, boolean cancelled,
                                    LocalDateTime cancelledAt, String note, LocalDateTime createdAt, String createdByName,
                                    Integer ptSessionsTotal, Integer ptSessionsUsed, Integer ptSessionsRemaining, LocalDate ptValidUntil) {
            this(id, memberId, memberName, memberCode, planId, planName, startDate, endDate, pricePaid, state, daysLeft,
                    cancelled, cancelledAt, note, createdAt, createdByName, ptSessionsTotal, ptSessionsUsed,
                    ptSessionsRemaining, ptValidUntil, null, null, null, null, null, null);
        }
    }

    /** V24 · một dòng theo dõi buổi PT cho quản lý / HLV. ptSessionsRemaining = null khi gói chưa khai báo số buổi. */
    public record PtOverviewRow(Long subscriptionId, Long memberId, String memberCode, String memberName,
                                Long trainerId, String trainerName, String planName,
                                LocalDate startDate, LocalDate endDate, LocalDate ptValidUntil, SubscriptionState state,
                                Integer ptSessionsTotal, long ptSessionsUsed, long ptSessionsScheduled,
                                Integer ptSessionsRemaining, Integer ptSessionMinutes) {
    }

    public record PtSessionUsageResponse(Long id, Long subscriptionId, Long scheduleId, String scheduleTitle,
                                         LocalDateTime startTime, LocalDateTime endTime,
                                         Long trainerId, String trainerName,
                                         LocalDateTime usedAt, Long createdById, String createdByName) {
    }

    // ===================== Exercise =====================
    public record ExerciseRequest(
            @NotBlank(message = "Vui lòng nhập tên bài tập") @Size(min = 2, max = 120, message = "Tên bài tập từ 2 đến 120 ký tự")
            @Pattern(regexp = TITLE_RULE, message = EXERCISE_NAME_MSG) String name,
            @NotNull(message = "Vui lòng chọn nhóm cơ") MuscleGroup muscleGroup,
            @Size(max = 60, message = "Dụng cụ tối đa 60 ký tự") @Pattern(regexp = TEXT_RULE, message = "Dụng cụ phải có chữ, VD: Tạ đơn") String equipment,
            @NotNull(message = "Vui lòng chọn cấp độ") Level level,
            @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự") String description,
            @Size(max = 1000, message = "Mô tả tiếng Anh tối đa 1000 ký tự") String descriptionEn,
            @Size(max = 2000, message = "Hướng dẫn tối đa 2000 ký tự") String instructions,
            @Pattern(regexp = "^$|^https?://[^\\s]+\\.[^\\s]+$", message = "Link video phải là địa chỉ web đầy đủ, bắt đầu bằng http(s)://") @Size(max = 255) String videoUrl,
            @Size(max = 120) @Pattern(regexp = NAME_EN_RULE, message = "Tên tiếng Anh chỉ gồm chữ không dấu, số và khoảng trắng") String nameEn,
            @Size(max = 255) @Pattern(regexp = TEXT_RULE, message = "Tên gọi khác phải có chữ") String aliases,
            @Size(max = 255) @Pattern(regexp = TEXT_RULE, message = "Cơ phụ trợ phải có chữ, VD: Mông, lưng dưới") String secondaryMuscles,
            ExerciseLocation location,
            @Size(max = 5) List<ExerciseGoal> goals,
            @Size(max = 500) String breathing,
            @Size(max = 2000) String commonMistakes,
            @Size(max = 2000) String safetyNotes,
            @Size(max = 2000) String variations,
            @Size(max = 255) String suggestedDose,
            ContentOrigin contentOrigin,
            /** null = giữ nguyên nguồn đang gắn; danh sách rỗng = bỏ hết nguồn */
            @Size(max = 20, message = "Tối đa 20 nguồn") List<Long> sourceIds,
            /** V13 · khoá vùng cơ trên bản đồ (lib/anatomy.ts). null = giữ nguyên. */
            @Size(max = 6, message = "Chọn tối đa 6 vùng cơ chính") List<String> targetMuscles,
            @Size(max = 10, message = "Chọn tối đa 10 vùng cơ phụ") List<String> secondaryMuscleKeys,
            @Size(max = 6, message = "Chọn tối đa 6 loại dụng cụ") List<String> equipmentKeys,
            @Size(max = 80) @Pattern(regexp = "^$|^[A-Za-z0-9_-]+$", message = "Mã ảnh chỉ gồm chữ không dấu, số, _ và -") String imageKey,
            String setupPosition,
            String steps,
            @Size(max = 100) String setsRepsHint,
            ExerciseGoal primaryGoal,
            List<Long> alternativeIds,
            ExerciseType exerciseType,
            String subCategory,
            @Size(max = 2000) String instructionsEn,
            @Size(max = 2000) String stepsEn,
            @Size(max = 2000) String setupPositionEn,
            @Size(max = 500) String breathingEn,
            @Size(max = 2000) String commonMistakesEn,
            @Size(max = 2000) String safetyNotesEn,
            @Size(max = 255) String suggestedDoseEn,
            @Size(max = 100) String setsRepsHintEn,
            @Size(max = 2000) String variationsEn) {

        /** Giữ chữ ký V18 (trước V26). */
        public ExerciseRequest(String name, MuscleGroup muscleGroup, String equipment, Level level, String description,
                               String instructions, String videoUrl, String nameEn, String aliases, String secondaryMuscles,
                               ExerciseLocation location, List<ExerciseGoal> goals, String breathing, String commonMistakes,
                               String safetyNotes, String variations, String suggestedDose, ContentOrigin contentOrigin,
                               List<Long> sourceIds, List<String> targetMuscles, List<String> secondaryMuscleKeys,
                               List<String> equipmentKeys, String imageKey, String setupPosition, String steps,
                               String setsRepsHint, ExerciseGoal primaryGoal, List<Long> alternativeIds) {
            this(name, muscleGroup, equipment, level, description, null, instructions, videoUrl, nameEn, aliases, secondaryMuscles,
                    location, goals, breathing, commonMistakes, safetyNotes, variations, suggestedDose, contentOrigin, sourceIds,
                    targetMuscles, secondaryMuscleKeys, equipmentKeys, imageKey, setupPosition, steps, setsRepsHint,
                    primaryGoal, alternativeIds, ExerciseType.STRENGTH, null,
                    null, null, null, null, null, null, null, null, null);
        }

        /** Giữ chữ ký V13 */
        public ExerciseRequest(String name, MuscleGroup muscleGroup, String equipment, Level level, String description,
                               String instructions, String videoUrl, String nameEn, String aliases, String secondaryMuscles,
                               ExerciseLocation location, List<ExerciseGoal> goals, String breathing, String commonMistakes,
                               String safetyNotes, String variations, String suggestedDose, ContentOrigin contentOrigin,
                               List<Long> sourceIds, List<String> targetMuscles, List<String> secondaryMuscleKeys,
                               List<String> equipmentKeys, String imageKey) {
            this(name, muscleGroup, equipment, level, description, instructions, videoUrl, nameEn, aliases, secondaryMuscles,
                    location, goals, breathing, commonMistakes, safetyNotes, variations, suggestedDose, contentOrigin, sourceIds,
                    targetMuscles, secondaryMuscleKeys, equipmentKeys, imageKey, null, instructions, null,
                    goals != null && !goals.isEmpty() ? goals.get(0) : null, List.of());
        }

        /** Giữ chữ ký cũ (trước V13) cho các chỗ gọi / test đang dùng. */
        public ExerciseRequest(String name, MuscleGroup muscleGroup, String equipment, Level level, String description,
                               String instructions, String videoUrl, String nameEn, String aliases, String secondaryMuscles,
                               ExerciseLocation location, List<ExerciseGoal> goals, String breathing, String commonMistakes,
                               String safetyNotes, String variations, String suggestedDose, ContentOrigin contentOrigin,
                               List<Long> sourceIds) {
            this(name, muscleGroup, equipment, level, description, instructions, videoUrl, nameEn, aliases, secondaryMuscles,
                    location, goals, breathing, commonMistakes, safetyNotes, variations, suggestedDose, contentOrigin, sourceIds,
                    null, null, null, null);
        }
    }

    public record HiddenRequest(@NotNull Boolean hidden) {
    }

    /** Duyệt loạt: chỉ bài đạt đủ checklist được duyệt, bài thiếu được trả về kèm lý do. */
    public record BulkApproveRequest(@NotEmpty(message = "Chọn ít nhất một bài") @Size(max = 100, message = "Tối đa 100 bài mỗi lần") List<Long> ids,
                                     @Size(max = 500, message = "Ghi chú tối đa 500 ký tự") String note) {
    }

    public record BulkApproveResponse(int approved, List<String> skipped) {
    }

    public record ExerciseImportReport(
            int totalRead,
            int validCount,
            int createdCount,
            int updatedCount,
            int skippedCount,
            int errorCount,
            boolean dryRun,
            List<String> sampleCreated,
            List<String> messages) {
    }

    /** Chỉ ADMIN. NEEDS_REVIEW bắt buộc kèm ghi chú để người biên soạn biết cần sửa gì. */
    public record ReviewRequest(
            @NotNull(message = "Vui lòng chọn trạng thái duyệt") ReviewStatus status,
            @Size(max = 500, message = "Ghi chú tối đa 500 ký tự") String note) {
    }

    public record SourceResponse(Long id, String code, String publisher, String title, String url, String license,
                                 String licenseUrl, boolean licenseVerified, String attribution,
                                 LocalDate publisherReviewed, LocalDate accessedAt) {
    }

    public record ExerciseSummary(Long id, String name, String nameEn, Level level,
                                  List<String> targetMuscles, String imageKey) {
    }

    public record ExerciseResponse(Long id, String name, MuscleGroup muscleGroup, String equipment, Level level,
                                   String description, String descriptionEn, String instructions, String videoUrl, boolean hidden,
                                   long usageCount, String createdByName,
                                   String nameEn, String aliases, String secondaryMuscles, ExerciseLocation location,
                                   List<ExerciseGoal> goals, String breathing, String commonMistakes, String safetyNotes,
                                   String variations, String suggestedDose, ContentOrigin contentOrigin,
                                   ReviewStatus reviewStatus, String reviewNote, String reviewedByName,
                                   LocalDateTime reviewedAt, LocalDateTime updatedAt, List<SourceResponse> sources,
                                   List<String> targetMuscles, List<String> secondaryMuscleKeys, List<String> equipmentKeys,
                                   String imageKey,
                                   String setupPosition, String steps, String setsRepsHint,
                                   ExerciseGoal primaryGoal, List<ExerciseSummary> alternatives,
                                   ExerciseType exerciseType, String subCategory, Boolean isFavorite,
                                   List<KnowledgeDtos.EquipmentSummary> equipments,
                                   String instructionsEn, String stepsEn, String setupPositionEn, String breathingEn,
                                   String commonMistakesEn, String safetyNotesEn, String suggestedDoseEn, String setsRepsHintEn,
                                   String variationsEn) {

        /** Giữ chữ ký V18 (trước V26). */
        public ExerciseResponse(Long id, String name, MuscleGroup muscleGroup, String equipment, Level level,
                                String description, String instructions, String videoUrl, boolean hidden,
                                long usageCount, String createdByName,
                                String nameEn, String aliases, String secondaryMuscles, ExerciseLocation location,
                                List<ExerciseGoal> goals, String breathing, String commonMistakes, String safetyNotes,
                                String variations, String suggestedDose, ContentOrigin contentOrigin,
                                ReviewStatus reviewStatus, String reviewNote, String reviewedByName,
                                LocalDateTime reviewedAt, LocalDateTime updatedAt, List<SourceResponse> sources,
                                List<String> targetMuscles, List<String> secondaryMuscleKeys, List<String> equipmentKeys,
                                String imageKey,
                                String setupPosition, String steps, String setsRepsHint,
                                ExerciseGoal primaryGoal, List<ExerciseSummary> alternatives) {
            this(id, name, muscleGroup, equipment, level, description, null, instructions, videoUrl, hidden, usageCount, createdByName,
                    nameEn, aliases, secondaryMuscles, location, goals, breathing, commonMistakes, safetyNotes, variations,
                    suggestedDose, contentOrigin, reviewStatus, reviewNote, reviewedByName, reviewedAt, updatedAt, sources,
                    targetMuscles, secondaryMuscleKeys, equipmentKeys, imageKey, setupPosition, steps, setsRepsHint,
                    primaryGoal, alternatives, ExerciseType.STRENGTH, null, false, List.of(),
                    null, null, null, null, null, null, null, null, null);
        }

        /** Giữ chữ ký V13 (chưa có trường mới V18). */
        public ExerciseResponse(Long id, String name, MuscleGroup muscleGroup, String equipment, Level level,
                                String description, String instructions, String videoUrl, boolean hidden,
                                long usageCount, String createdByName,
                                String nameEn, String aliases, String secondaryMuscles, ExerciseLocation location,
                                List<ExerciseGoal> goals, String breathing, String commonMistakes, String safetyNotes,
                                String variations, String suggestedDose, ContentOrigin contentOrigin,
                                ReviewStatus reviewStatus, String reviewNote, String reviewedByName,
                                LocalDateTime reviewedAt, LocalDateTime updatedAt, List<SourceResponse> sources,
                                List<String> targetMuscles, List<String> secondaryMuscleKeys, List<String> equipmentKeys,
                                String imageKey) {
            this(id, name, muscleGroup, equipment, level, description, instructions, videoUrl, hidden, usageCount, createdByName,
                    nameEn, aliases, secondaryMuscles, location, goals, breathing, commonMistakes, safetyNotes, variations,
                    suggestedDose, contentOrigin, reviewStatus, reviewNote, reviewedByName, reviewedAt, updatedAt, sources,
                    targetMuscles, secondaryMuscleKeys, equipmentKeys, imageKey,
                    null, instructions, null,
                    goals != null && !goals.isEmpty() ? goals.get(0) : null, List.of());
        }

        /** Giữ chữ ký trước V13 (test và code cũ): chưa có vùng cơ, dụng cụ, ảnh. */
        public ExerciseResponse(Long id, String name, MuscleGroup muscleGroup, String equipment, Level level,
                                String description, String instructions, String videoUrl, boolean hidden,
                                long usageCount, String createdByName,
                                String nameEn, String aliases, String secondaryMuscles, ExerciseLocation location,
                                List<ExerciseGoal> goals, String breathing, String commonMistakes, String safetyNotes,
                                String variations, String suggestedDose, ContentOrigin contentOrigin,
                                ReviewStatus reviewStatus, String reviewNote, String reviewedByName,
                                LocalDateTime reviewedAt, LocalDateTime updatedAt, List<SourceResponse> sources) {
            this(id, name, muscleGroup, equipment, level, description, instructions, videoUrl, hidden, usageCount, createdByName,
                    nameEn, aliases, secondaryMuscles, location, goals, breathing, commonMistakes, safetyNotes, variations,
                    suggestedDose, contentOrigin, reviewStatus, reviewNote, reviewedByName, reviewedAt, updatedAt, sources,
                    List.of(), List.of(), List.of(), null);
        }
    }

    // ===================== Equipment =====================
    public record EquipmentResponse(
            String key,
            String name,
            EquipmentCategory category,
            String shortDesc,
            List<String> targetMuscleKeys,
            String imageKey,
            int sortOrder,
            long exerciseCount,
            ReviewStatus reviewStatus,
            boolean hidden,
            ContentOrigin origin
    ) {
    }

    public record EquipmentDetailResponse(
            String key,
            String name,
            EquipmentCategory category,
            String shortDesc,
            String usageGuide,
            String adjustGuide,
            String commonMistakes,
            String safetyNotes,
            List<String> targetMuscleKeys,
            String imageKey,
            int sortOrder,
            long exerciseCount,
            ReviewStatus reviewStatus,
            boolean hidden,
            ContentOrigin origin,
            List<ExerciseResponse> relatedExercises,
            String usageGuideEn,
            String adjustGuideEn,
            String commonMistakesEn,
            String safetyNotesEn
    ) {
        /** Giữ chữ ký V18 */
        public EquipmentDetailResponse(String key, String name, EquipmentCategory category, String shortDesc,
                                       String usageGuide, String safetyNotes, List<String> targetMuscleKeys,
                                       String imageKey, int sortOrder, long exerciseCount, ReviewStatus reviewStatus,
                                       boolean hidden, ContentOrigin origin, List<ExerciseResponse> relatedExercises) {
            this(key, name, category, shortDesc, usageGuide, null, null, safetyNotes, targetMuscleKeys, imageKey,
                    sortOrder, exerciseCount, reviewStatus, hidden, origin, relatedExercises, null, null, null, null);
        }
    }

    public record EquipmentRequest(
            @NotBlank(message = "Mã dụng cụ không được để trống")
            @Pattern(regexp = "^[a-z0-9-]+$", message = "Mã dụng cụ chỉ gồm chữ thường không dấu, số và dấu gạch ngang")
            String key,
            @NotBlank(message = "Tên dụng cụ không được để trống")
            @Size(max = 120, message = "Tên dụng cụ tối đa 120 ký tự")
            String name,
            @NotNull(message = "Vui lòng chọn loại dụng cụ")
            EquipmentCategory category,
            @Size(max = 255, message = "Mô tả ngắn tối đa 255 ký tự")
            String shortDesc,
            String usageGuide,
            String adjustGuide,
            String commonMistakes,
            String safetyNotes,
            List<String> targetMuscleKeys,
            String imageKey,
            Integer sortOrder,
            Boolean hidden,
            String usageGuideEn,
            String adjustGuideEn,
            String commonMistakesEn,
            String safetyNotesEn
    ) {
        public EquipmentRequest(String key, String name, EquipmentCategory category, String shortDesc,
                                String usageGuide, String safetyNotes, List<String> targetMuscleKeys,
                                String imageKey, Integer sortOrder, Boolean hidden) {
            this(key, name, category, shortDesc, usageGuide, null, null, safetyNotes, targetMuscleKeys, imageKey, sortOrder, hidden,
                    null, null, null, null);
        }
    }

    // ===================== Knowledge base =====================
    public record ArticleRequest(
            @NotBlank(message = "Vui lòng nhập tiêu đề") @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự") String title,
            @NotBlank(message = "Vui lòng nhập đường dẫn")
            @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang")
            @Size(max = 120) String slug,
            @NotNull(message = "Vui lòng chọn chủ đề") ArticleCategory category,
            @NotBlank(message = "Vui lòng nhập tóm tắt") @Size(max = 500, message = "Tóm tắt tối đa 500 ký tự") String summary,
            @NotBlank(message = "Vui lòng nhập nội dung") @Size(max = 20000, message = "Nội dung tối đa 20.000 ký tự") String body,
            ContentOrigin contentOrigin,
            List<Long> sourceIds,
            String titleEn,
            String summaryEn,
            String bodyEn) {
        public ArticleRequest(String title, String slug, ArticleCategory category, String summary, String body,
                              ContentOrigin contentOrigin, List<Long> sourceIds) {
            this(title, slug, category, summary, body, contentOrigin, sourceIds, null, null, null);
        }
    }

    /** SUBMIT (gửi duyệt) · APPROVE (xuất bản) · REJECT (trả về bản nháp) · ARCHIVE (gỡ) · RESTORE (khôi phục về nháp) */
    public enum ArticleAction { SUBMIT, APPROVE, REJECT, ARCHIVE, RESTORE }

    public record ArticleActionRequest(
            @NotNull(message = "Vui lòng chọn thao tác") ArticleAction action,
            @Size(max = 500, message = "Ghi chú tối đa 500 ký tự") String note) {
    }

    /** Bản rút gọn cho danh sách công khai (không kèm thân bài). */
    public record ArticleSummary(Long id, String slug, String title, ArticleCategory category, String summary,
                                 LocalDateTime publishedAt, String titleEn, String summaryEn) {
        public ArticleSummary(Long id, String slug, String title, ArticleCategory category, String summary,
                              LocalDateTime publishedAt) {
            this(id, slug, title, category, summary, publishedAt, null, null);
        }
    }

    public record ArticleResponse(Long id, String slug, String title, ArticleCategory category, String summary,
                                  String body, ContentOrigin contentOrigin, ArticleStatus status, String reviewNote,
                                  String authorName, Long authorId, String reviewedByName, LocalDateTime reviewedAt,
                                  LocalDateTime publishedAt, LocalDateTime createdAt, LocalDateTime updatedAt,
                                  List<SourceResponse> sources, String titleEn, String summaryEn, String bodyEn) {
        public ArticleResponse(Long id, String slug, String title, ArticleCategory category, String summary,
                               String body, ContentOrigin contentOrigin, ArticleStatus status, String reviewNote,
                               String authorName, Long authorId, String reviewedByName, LocalDateTime reviewedAt,
                               LocalDateTime publishedAt, LocalDateTime createdAt, LocalDateTime updatedAt,
                               List<SourceResponse> sources) {
            this(id, slug, title, category, summary, body, contentOrigin, status, reviewNote, authorName, authorId,
                    reviewedByName, reviewedAt, publishedAt, createdAt, updatedAt, sources, null, null, null);
        }
    }

    // ===================== Workout plan =====================
    public record PlanItemRequest(
            @NotNull(message = "Vui lòng chọn bài tập") Long exerciseId,
            @NotNull @Min(value = 1, message = "Thứ từ 1 đến 7") @Max(value = 7, message = "Thứ từ 1 đến 7") Integer dayOfWeek,
            Integer sortOrder,
            @NotNull(message = "Nhập số hiệp") @Min(value = 1, message = "Tối thiểu 1 hiệp") @Max(value = 20, message = "Tối đa 20 hiệp") Integer sets,
            @NotBlank(message = "Nhập số lần (VD: 10-12)") @Size(max = 20)
            @Pattern(regexp = REPS_RULE, message = "Số lần ghi dạng 10, 10-12 hoặc 45s") String reps,
            @DecimalMin(value = "0", message = "Mức tạ không âm") @DecimalMax(value = "500", message = "Mức tạ tối đa 500 kg") Double weightKg,
            @Min(value = 0, message = "Nghỉ không âm") @Max(value = 900, message = "Nghỉ tối đa 900 giây") Integer restSeconds,
            @Min(value = 1, message = "Tối thiểu 1 phút") @Max(value = 300, message = "Tối đa 300 phút") Integer durationMinutes,
            @Size(max = 255) String note,
            @Size(max = 255) String noteEn) {
        public PlanItemRequest(Long exerciseId, Integer dayOfWeek, Integer sortOrder, Integer sets, String reps,
                               Double weightKg, Integer restSeconds, Integer durationMinutes, String note) {
            this(exerciseId, dayOfWeek, sortOrder, sets, reps, weightKg, restSeconds, durationMinutes, note, null);
        }
    }

    public record WorkoutPlanRequest(
            @NotNull(message = "Vui lòng chọn hội viên") Long memberId,
            @NotBlank(message = "Vui lòng nhập tên giáo án") @Size(min = 3, max = 120, message = "Tên giáo án từ 3 đến 120 ký tự")
            @Pattern(regexp = TITLE_RULE, message = PLAN_NAME_MSG) String name,
            @Size(max = 255) String goal,
            @NotNull(message = "Chọn ngày bắt đầu") LocalDate startDate,
            @NotNull(message = "Chọn ngày kết thúc") LocalDate endDate,
            @Size(max = 1000) String note,
            @NotNull @Size(max = 100, message = "Tối đa 100 bài tập") @Valid List<PlanItemRequest> items,
            @Size(max = 120) String nameEn,
            @Size(max = 255) String goalEn,
            @Size(max = 1000) String noteEn) {
        public WorkoutPlanRequest(Long memberId, String name, String goal, LocalDate startDate, LocalDate endDate,
                                  String note, List<PlanItemRequest> items) {
            this(memberId, name, goal, startDate, endDate, note, items, null, null, null);
        }
    }

    public record PlanStatusRequest(@NotNull PlanStatus status) {
    }

    public record PlanItemResponse(Long id, Long exerciseId, String exerciseName, String exerciseNameEn, MuscleGroup muscleGroup,
                                   String equipment, Integer dayOfWeek, Integer sortOrder, Integer sets, String reps,
                                   Double weightKg, Integer restSeconds, Integer durationMinutes, String note, String noteEn) {
        public PlanItemResponse(Long id, Long exerciseId, String exerciseName, String exerciseNameEn, MuscleGroup muscleGroup,
                                String equipment, Integer dayOfWeek, Integer sortOrder, Integer sets, String reps,
                                Double weightKg, Integer restSeconds, Integer durationMinutes, String note) {
            this(id, exerciseId, exerciseName, exerciseNameEn, muscleGroup, equipment, dayOfWeek, sortOrder, sets, reps,
                    weightKg, restSeconds, durationMinutes, note, null);
        }
    }

    public record WorkoutPlanSummary(Long id, Long memberId, String memberName, Long trainerId, String trainerName,
                                     String name, String goal, LocalDate startDate, LocalDate endDate,
                                     PlanStatus status, int itemCount, int trainingDays, LocalDateTime createdAt,
                                     String nameEn, String goalEn) {
        public WorkoutPlanSummary(Long id, Long memberId, String memberName, Long trainerId, String trainerName,
                                  String name, String goal, LocalDate startDate, LocalDate endDate,
                                  PlanStatus status, int itemCount, int trainingDays, LocalDateTime createdAt) {
            this(id, memberId, memberName, trainerId, trainerName, name, goal, startDate, endDate, status,
                    itemCount, trainingDays, createdAt, null, null);
        }
    }

    public record WorkoutPlanResponse(WorkoutPlanSummary summary, String note, List<PlanItemResponse> items, String noteEn) {
        public WorkoutPlanResponse(WorkoutPlanSummary summary, String note, List<PlanItemResponse> items) {
            this(summary, note, items, null);
        }
    }

    public record WorkoutPlanHistoryResponse(
            Long id, Long memberId,
            Long oldPlanId, String oldPlanName,
            Long newPlanId, String newPlanName,
            LocalDateTime appliedAt, LocalDateTime endedAt,
            int cancelledFutureSessions, String note,
            String oldPlanNameEn, String newPlanNameEn, String noteEn) {
        public WorkoutPlanHistoryResponse(Long id, Long memberId, Long oldPlanId, String oldPlanName,
                                          Long newPlanId, String newPlanName, LocalDateTime appliedAt,
                                          LocalDateTime endedAt, int cancelledFutureSessions, String note) {
            this(id, memberId, oldPlanId, oldPlanName, newPlanId, newPlanName, appliedAt, endedAt,
                    cancelledFutureSessions, note, null, null, null);
        }
    }

    public record SwitchPlanRequest(
            @NotNull(message = "Vui lòng chọn giáo án mới") Long newPlanId,
            String note,
            String noteEn) {
        public SwitchPlanRequest(Long newPlanId, String note) {
            this(newPlanId, note, null);
        }
    }

    // ===================== Schedule =====================
    public record ScheduleRequest(
            @NotNull(message = "Vui lòng chọn hội viên") Long memberId,
            Long trainerId,
            Long planId,
            @NotBlank(message = "Vui lòng nhập tiêu đề") @Size(max = 120, message = "Tiêu đề tối đa 120 ký tự") String title,
            @NotNull(message = "Chọn giờ bắt đầu") LocalDateTime startTime,
            @NotNull(message = "Chọn giờ kết thúc") LocalDateTime endTime,
            @Size(max = 255) String note,
            @Min(value = 0, message = "Số tuần lặp không âm") @Max(value = 12, message = "Lặp tối đa 12 tuần") Integer repeatWeeks,
            Boolean confirmDuplicateDay,
            @Size(max = 120) String titleEn,
            @Size(max = 255) String noteEn) {
        public ScheduleRequest(Long memberId, Long trainerId, Long planId, String title, LocalDateTime startTime, LocalDateTime endTime, String note, Integer repeatWeeks) {
            this(memberId, trainerId, planId, title, startTime, endTime, note, repeatWeeks, false, null, null);
        }

        public ScheduleRequest(Long memberId, Long trainerId, Long planId, String title, LocalDateTime startTime,
                               LocalDateTime endTime, String note, Integer repeatWeeks, Boolean confirmDuplicateDay) {
            this(memberId, trainerId, planId, title, startTime, endTime, note, repeatWeeks, confirmDuplicateDay, null, null);
        }
    }

    public record ScheduleUpdateRequest(
            Long trainerId,
            Long planId,
            @NotBlank(message = "Vui lòng nhập tiêu đề") @Size(max = 120, message = "Tiêu đề tối đa 120 ký tự") String title,
            @NotNull(message = "Chọn giờ bắt đầu") LocalDateTime startTime,
            @NotNull(message = "Chọn giờ kết thúc") LocalDateTime endTime,
            @Size(max = 255) String note,
            Boolean confirmDuplicateDay,
            @Size(max = 120) String titleEn,
            @Size(max = 255) String noteEn) {
        public ScheduleUpdateRequest(Long trainerId, Long planId, String title, LocalDateTime startTime, LocalDateTime endTime, String note) {
            this(trainerId, planId, title, startTime, endTime, note, false, null, null);
        }

        public ScheduleUpdateRequest(Long trainerId, Long planId, String title, LocalDateTime startTime,
                                     LocalDateTime endTime, String note, Boolean confirmDuplicateDay) {
            this(trainerId, planId, title, startTime, endTime, note, confirmDuplicateDay, null, null);
        }
    }

    public record GenerateScheduleFromPlanRequest(
            @NotNull(message = "Vui lòng chọn hội viên") Long memberId,
            @NotNull(message = "Vui lòng chọn giáo án") Long planId,
            Long trainerId,
            @NotNull(message = "Chọn ngày bắt đầu") LocalDate startDate,
            @Min(value = 1, message = "Số tuần tối thiểu là 1") @Max(value = 12, message = "Tối đa 12 tuần") Integer weeks,
            @NotNull(message = "Chọn giờ bắt đầu tập") LocalTime defaultStartTime,
            @Min(value = 15, message = "Tối thiểu 15 phút") @Max(value = 240, message = "Tối đa 240 phút") Integer durationMinutes,
            Boolean confirmDuplicateDay) {
    }

    public record CompleteRequest(
            @Min(value = 1, message = "Tối thiểu 1 phút") @Max(value = 600, message = "Tối đa 600 phút") Integer durationMinutes,
            ExerciseIntensity intensity,
            @Min(value = 1, message = "Đánh giá từ 1 đến 5") @Max(value = 5, message = "Đánh giá từ 1 đến 5") Integer rating,
            @Size(max = 255) String note) {
    }

    public record WorkoutLogResponse(Long id, LocalDateTime completedAt, Integer durationMinutes, Integer calories,
                                     Double weightKgUsed, Double activeMinutes, ExerciseIntensity intensity,
                                     String formulaVersion, EstimateStatus estimateStatus,
                                     EstimateQuality estimateQuality, boolean estimated,
                                     Integer rating, String note) {
    }

    // ===================== Calorie (MET) =====================
    public record CalorieExerciseResponse(Long exerciseId, String exerciseName, String exerciseNameEn, ActivityCategory activityCategory,
                                          ExerciseIntensity intensity, Double metValue, String metSourceCode,
                                          String metSourceVersion, Integer sets, String reps,
                                          Integer workSecondsPerSet, Integer restSeconds,
                                          Double activeMinutes, Integer calories, String dataSource) {
    }

    public record CaloriePreviewResponse(Long scheduleId, String title, LocalDate date, Integer durationMinutes,
                                         Double weightKg, String weightSource, ExerciseIntensity intensity,
                                         List<CalorieExerciseResponse> exercises, Integer totalCalories,
                                         Double activeMinutes, EstimateStatus estimateStatus,
                                         EstimateQuality estimateQuality, String disclaimer, String titleEn) {
        public CaloriePreviewResponse(Long scheduleId, String title, LocalDate date, Integer durationMinutes,
                                      Double weightKg, String weightSource, ExerciseIntensity intensity,
                                      List<CalorieExerciseResponse> exercises, Integer totalCalories,
                                      Double activeMinutes, EstimateStatus estimateStatus,
                                      EstimateQuality estimateQuality, String disclaimer) {
            this(scheduleId, title, date, durationMinutes, weightKg, weightSource, intensity, exercises,
                    totalCalories, activeMinutes, estimateStatus, estimateQuality, disclaimer, null);
        }
    }

    public record CalorieBucket(String key, String label, LocalDate from, LocalDate to,
                                long calories, long sessions, double activeMinutes) {
    }

    public record CaloriePeriodSummary(LocalDate from, LocalDate to, long calories, long sessions,
                                       double activeMinutes, Double avgCaloriesPerSession,
                                       Double changePercent) {
    }

    public record CalorieTopDay(LocalDate date, long calories, long sessions) {
    }

    public record CalorieSummaryResponse(String period, LocalDate from, LocalDate to, String timezone,
                                         long totalCalories, long totalSessions, long estimatedSessions,
                                         long unestimatedSessions, double totalActiveMinutes,
                                         Double avgCaloriesPerSession, List<CalorieBucket> buckets,
                                         CalorieTopDay topDay, CaloriePeriodSummary previous, String disclaimer) {
    }

    public record CalorieSessionResponse(Long logId, Long scheduleId, String title, LocalDateTime completedAt,
                                         Integer durationMinutes, Double activeMinutes, Integer calories,
                                         ExerciseIntensity intensity, Double weightKgUsed,
                                         EstimateStatus estimateStatus, EstimateQuality estimateQuality,
                                         String formulaVersion, List<CalorieExerciseResponse> exercises, String titleEn) {
        public CalorieSessionResponse(Long logId, Long scheduleId, String title, LocalDateTime completedAt,
                                      Integer durationMinutes, Double activeMinutes, Integer calories,
                                      ExerciseIntensity intensity, Double weightKgUsed,
                                      EstimateStatus estimateStatus, EstimateQuality estimateQuality,
                                      String formulaVersion, List<CalorieExerciseResponse> exercises) {
            this(logId, scheduleId, title, completedAt, durationMinutes, activeMinutes, calories, intensity,
                    weightKgUsed, estimateStatus, estimateQuality, formulaVersion, exercises, null);
        }
    }

    public record CalorieBackfillResponse(int processed, int estimated, int missingWeight, int noExerciseData,
                                          int skipped, int failed, String formulaVersion) {
    }

    public record ScheduleResponse(Long id, Long memberId, String memberName, Long trainerId, String trainerName,
                                   Long planId, String planName, String title, LocalDateTime startTime,
                                   LocalDateTime endTime, ScheduleStatus status, String note, WorkoutLogResponse log,
                                   String planNameEn, String titleEn, String noteEn) {
        public ScheduleResponse(Long id, Long memberId, String memberName, Long trainerId, String trainerName,
                                Long planId, String planName, String title, LocalDateTime startTime,
                                LocalDateTime endTime, ScheduleStatus status, String note, WorkoutLogResponse log) {
            this(id, memberId, memberName, trainerId, trainerName, planId, planName, title, startTime,
                    endTime, status, note, log, null, null, null);
        }
    }

    public record ScheduleCreatedResponse(List<ScheduleResponse> created, List<String> skipped) {
    }

    // ===================== Weight & progress =====================
    public record WeightRequest(
            @NotNull(message = "Chọn ngày") @PastOrPresent(message = "Không ghi cho ngày tương lai") LocalDate recordedDate,
            @NotNull(message = "Nhập cân nặng") @DecimalMin(value = "20", message = "Cân nặng phải từ 20 kg trở lên") @DecimalMax(value = "300", message = "Cân nặng không được vượt quá 300 kg") Double weightKg,
            @DecimalMin(value = "2", message = "% mỡ cơ thể phải từ 2% trở lên") @DecimalMax(value = "70", message = "% mỡ cơ thể không được vượt quá 70%") Double bodyFat,
            @DecimalMin(value = "40", message = "Vòng eo phải từ 40 cm trở lên") @DecimalMax(value = "200", message = "Vòng eo không được vượt quá 200 cm") Double waistCm,
            @DecimalMin(value = "50", message = "Vòng ngực phải từ 50 cm trở lên") @DecimalMax(value = "200", message = "Vòng ngực không được vượt quá 200 cm") Double chestCm,
            @DecimalMin(value = "15", message = "Vòng tay phải từ 15 cm trở lên") @DecimalMax(value = "80", message = "Vòng tay không được vượt quá 80 cm") Double armCm,
            @DecimalMin(value = "25", message = "Vòng đùi phải từ 25 cm trở lên") @DecimalMax(value = "120", message = "Vòng đùi không được vượt quá 120 cm") Double thighCm,
            @Size(max = 255) String note) {
    }

    public record WeightResponse(Long id, LocalDate recordedDate, Double weightKg, Double bodyFat,
                                 Double waistCm, Double chestCm, Double armCm, Double thighCm, String note) {
    }

    public record WeekAttendance(LocalDate weekStart, long scheduled, long completed, long missed) {
    }

    public record ProgressResponse(Long memberId, Double heightCm, Double currentWeight, Double startWeight,
                                   Double weightChange, Double bodyFat, Double bmi, String bmiCategory,
                                   List<WeightResponse> weights, List<WeekAttendance> attendance,
                                   Double attendanceRate, int streakWeeks, long totalSessions,
                                   long totalMinutes, long totalCalories, Double avgRating) {
    }

    // ===================== Dashboards =====================
    public record LabelValue(String label, long value) {
    }

    public record AdminDashboard(long totalMembers, long activeMembers, long newMembersThisMonth,
                                 long membersWithActivePackage, long expiringSoon, long revenueThisMonth,
                                 long revenuePrevMonth, Double revenueGrowthPercent, long activeTrainers, long sessionsToday,
                                 List<LabelValue> revenueByMonth, List<LabelValue> planDistribution,
                                 List<SubscriptionResponse> expiring, List<AuditResponse> recentActivity) {
    }

    public record TrainerMemberProgress(Long memberId, String code, String fullName,
                                        Double attendanceThisWeek, int streakWeeks, ScheduleResponse nextSession) {
    }

    public record TrainerDashboard(long memberCount, long sessionsToday, long sessionsThisWeek,
                                   long completedThisWeek, long missedThisWeek, Double completionRate,
                                   long activePlans, List<ScheduleResponse> todaySessions,
                                   List<SubscriptionResponse> expiringMembers, List<LabelValue> weekLoad,
                                   List<TrainerMemberProgress> assignedMembers) {
    }

    public record MemberDashboard(MemberResponse member, SubscriptionResponse currentSubscription,
                                  ScheduleResponse nextSession, List<ScheduleResponse> weekSessions,
                                  long completedThisMonth, int streakWeeks, WeightResponse latestWeight,
                                  Double bmi, String bmiCategory, WorkoutPlanSummary currentPlan,
                                  List<ScheduleResponse> needsCompletion) {
    }

    // ===================== Reports =====================
    public record TrainerAttendance(Long trainerId, String trainerName, long total, long completed, long missed) {
    }

    public record ReportResponse(LocalDate from, LocalDate to, long revenueTotal, long subscriptionCount,
                                 List<LabelValue> revenueByMonth, List<LabelValue> revenueByPlan,
                                 long scheduled, long completed, long missed, long cancelled, Double attendanceRate,
                                 List<TrainerAttendance> byTrainer, List<LabelValue> membersByStatus,
                                 List<LabelValue> membersByGender, List<LabelValue> newMembersByMonth) {
    }

    // ===================== Users & audit =====================
    public record UserResponse(Long id, String email, String fullName, String phone, Role role, UserStatus status,
                               LocalDateTime lastLoginAt, LocalDateTime createdAt) {
    }

    public record UserStatusRequest(@NotNull UserStatus status) {
    }

    public record AdminCreateRequest(
            @NotBlank(message = "Vui lòng nhập email") @Email(message = "Email không hợp lệ") @Pattern(regexp = EMAIL_RULE, message = EMAIL_MSG) @Size(max = 120, message = "Email tối đa 120 ký tự") String email,
            @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 100, message = "Họ tên tối đa 100 ký tự") String fullName,
            @Pattern(regexp = PHONE_RULE, message = PHONE_MSG) String phone,
            @Pattern(regexp = "^$|" + PASSWORD_RULE, message = PASSWORD_MSG) String password) {
    }

    public record UserCreatedResponse(UserResponse user, String temporaryPassword) {
    }

    public record TempPasswordResponse(String temporaryPassword) {
    }

    public record AuditResponse(Long id, Long actorId, String actorEmail, String action, String targetType,
                                String targetId, String detail, boolean success, String ip, LocalDateTime createdAt) {
    }

    // ===================== Notifications =====================
    public record NotificationResponse(String id, String level, String title, String message, String link,
                                       LocalDateTime at) {
    }

    public record MessageResponse(String message) {
    }

    // ===================== Member - Trainer Chat & Public Trainers =====================
    public record TrainerPublicResponse(Long id, String fullName, String avatar, String specialty,
                                        Integer experienceYears, String certificates, String bio,
                                        List<ShiftResponse> shifts) {
    }

    public record CreateConversationRequest(Long trainerId, Long memberId) {
    }

    public record SendMessageRequest(
            @NotBlank(message = "Nội dung tin nhắn không được để trống")
            @Size(max = 2000, message = "Tin nhắn tối đa 2000 ký tự")
            String body,
            @Size(max = 500, message = "Đường dẫn đính kèm tối đa 500 ký tự")
            String attachmentUrl) {
        public SendMessageRequest(String body) {
            this(body, null);
        }
    }

    public record MessageResponseDto(Long id, Long conversationId, Long senderUserId, String senderName,
                                     String senderRole, String attachmentUrl,
                                     String body, LocalDateTime createdAt, LocalDateTime readAt) {
        public MessageResponseDto(Long id, Long conversationId, Long senderUserId, String senderName,
                                  String body, LocalDateTime createdAt, LocalDateTime readAt) {
            this(id, conversationId, senderUserId, senderName, null, null, body, createdAt, readAt);
        }
    }

    public record ConversationResponse(Long id, Long memberId, String memberName, String memberAvatar,
                                       Long trainerId, String trainerName, String trainerAvatar,
                                       LocalDateTime createdAt, LocalDateTime lastMessageAt,
                                       MessageResponseDto lastMessage, long unreadCount, String relation) {
    }

    public record AdminConversationSummary(Long id, Long memberId, String memberName, String memberAvatar,
                                           Long trainerId, String trainerName, String trainerAvatar,
                                           String lastMessageSnippet, LocalDateTime lastMessageAt,
                                           long messageCount, LocalDateTime updatedAt, LocalDateTime createdAt) {
    }

    public record UnreadCountResponse(long unreadCount) {
    }

    // ===================== Services & Entitlements =====================
    public record ServiceItemRequest(
            @NotBlank(message = "Vui lòng nhập tên dịch vụ") @Size(max = 100) String name,
            @NotNull(message = "Vui lòng chọn danh mục") ServiceCategory category,
            @Size(max = 1000) String description,
            @Min(value = 0, message = "Giá không âm") Long unitPrice,
            boolean requiresBooking,
            @Size(max = 255) String openingNote,
            Boolean active) {
    }

    public record ServiceItemResponse(
            Long id, String name, ServiceCategory category, String description,
            Long unitPrice, boolean requiresBooking, String openingNote, boolean active,
            LocalDateTime createdAt) {
    }

    public record ServiceUsageResponse(
            Long id, Long entitlementId, LocalDateTime usedAt,
            Long confirmedById, String confirmedByName, String note) {
    }

    public record MemberServiceEntitlementResponse(
            Long id, Long memberId, String memberName, String memberCode,
            Long serviceId, String serviceName,
            EntitlementSource source, Long subscriptionId, String planName, Long packageRequestId,
            int grantedQty, int usedQty, int remainingQty,
            LocalDate validFrom, LocalDate validUntil, String conditions,
            EntitlementStatus status, boolean usable, LocalDateTime createdAt,
            List<ServiceUsageResponse> usages) {
    }

    public record UseEntitlementRequest(@Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note) {
    }

    // ===================== Promotions =====================
    public record PromotionGrantDto(
            @NotNull(message = "Chọn dịch vụ") Long serviceId,
            String serviceName,
            @Min(value = 1, message = "Số lượt tối thiểu là 1") int quantity,
            @Min(value = 1, message = "Số ngày hiệu lực tối thiểu là 1") int validDays,
            @Size(max = 255) String conditions) {
    }

    public record PromotionRequest(
            @Size(max = 50, message = "Mã ưu đãi tối đa 50 ký tự") String code,
            @NotBlank(message = "Vui lòng nhập tên chương trình ưu đãi") @Size(max = 100) String name,
            @Size(max = 1000) String description,
            @NotNull(message = "Vui lòng chọn loại giảm giá") DiscountType discountType,
            @Min(value = 0, message = "Mức giảm không âm") Long discountValue,
            @NotNull(message = "Thiếu thời gian bắt đầu") LocalDateTime startsAt,
            @NotNull(message = "Thiếu thời gian kết thúc") LocalDateTime endsAt,
            @Min(value = 1, message = "Số lượt sử dụng tối đa phải từ 1") Integer maxUses,
            boolean newMembersOnly,
            boolean renewalOnly,
            boolean stackable,
            Boolean active,
            List<Long> planIds,
            List<PromotionGrantDto> grants) {
    }

    public record PromotionResponse(
            Long id, String code, String name, String description,
            DiscountType discountType, Long discountValue,
            LocalDateTime startsAt, LocalDateTime endsAt,
            Integer maxUses, int usedCount,
            boolean newMembersOnly, boolean renewalOnly, boolean stackable, boolean active,
            LocalDateTime createdAt, List<Long> planIds, List<PromotionGrantDto> grants) {
    }

    public record PromotionValidateRequest(
            String code,
            @NotNull(message = "Vui lòng chọn gói tập để áp dụng ưu đãi") Long planId) {
    }

    public record PromotionValidationResponse(
            boolean valid, String reason,
            Long promotionId, String promotionCode, String promotionName, String description,
            DiscountType discountType, Long discountValue,
            long originalPrice, long discountAmount, long finalPrice,
            List<PromotionGrantDto> gifts) {
    }

    // ===================== Service Requests (Mua lẻ) =====================
    public record ServiceRequestInput(
            @NotNull(message = "Vui lòng chọn dịch vụ") Long serviceId,
            @Min(value = 1, message = "Số lượng tối thiểu là 1") @Max(value = 100, message = "Số lượng tối đa là 100") int quantity,
            PaymentMethod paymentMethod,
            @Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note) {
    }

    public record ServiceRequestResponse(
            Long id, Long memberId, String memberName, String memberCode, String memberPhone,
            Long serviceId, String serviceName, int quantity, long unitPrice, long totalPrice,
            PaymentMethod paymentMethod, String paymentCode, LocalDateTime memberPaidAt,
            String memberNote, PackageRequestStatus status, String decisionNote, String decidedByName,
            LocalDateTime decidedAt, Long entitlementId, LocalDateTime createdAt) {
    }

    public record ApproveServiceRequest(@Size(max = 255, message = "Ghi chú tối đa 255 ký tự") String note) {
    }

    public record RejectServiceRequest(
            @NotBlank(message = "Vui lòng nhập lý do từ chối")
            @Size(min = 5, max = 255, message = "Lý do từ 5 đến 255 ký tự") String reason) {
    }

    // ===================== Member Onboarding & Tours =====================
    public record OnboardingStepDto(String key, String title, boolean required, String status,
                                    LocalDateTime updatedAt, String reason,
                                    String nextActionLabel, String nextActionUrl) {
    }

    public record EntitlementsDto(String planName, LocalDate startDate, LocalDate endDate, Long daysLeft) {
    }

    public record OnboardingResponse(boolean readyToTrain, String currentStep,
                                     List<OnboardingStepDto> steps, EntitlementsDto entitlements) {
    }

    public record TourProgressDto(String tourKey, Integer step, String status, LocalDateTime updatedAt) {
    }

    public record UpdateTourProgressRequest(
            @NotNull(message = "Bước không được để trống") Integer step,
            @NotBlank(message = "Trạng thái không được để trống")
            @Pattern(regexp = "PAUSED|DONE|SKIPPED", message = "Trạng thái chỉ có thể là PAUSED, DONE hoặc SKIPPED")
            String status) {
    }
}
