package com.gymflow.dto;

import com.gymflow.domain.CheckinMethod;
import com.gymflow.domain.MuscleGroup;
import com.gymflow.dto.Dtos.ScheduleResponse;
import com.gymflow.dto.Dtos.SubscriptionResponse;
import com.gymflow.dto.Dtos.WorkoutPlanSummary;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** V53 · Check-in tại quầy, mức đông của phòng tập và trang "Hôm nay" của hội viên. FE: src/api/checkinTypes.ts */
public final class CheckinDtos {
    private CheckinDtos() {
    }

    /** Mã đang hiện ở quầy. qr: ma trận mã QR, mỗi chuỗi là một hàng gồm '1' (ô đen) và '0' (ô trắng). */
    public record KioskCode(String code, String url, int secondsLeft, int periodSeconds, List<String> qr) {
    }

    public record CheckinRequest(
            @NotBlank(message = "Nhập mã check-in")
            @Pattern(regexp = "\\d{6}", message = "Mã check-in gồm 6 chữ số") String code) {
    }

    public record ManualCheckinRequest(@NotNull(message = "Chọn hội viên") Long memberId) {
    }

    public record CheckinResponse(Long id, Long memberId, String memberCode, String memberName,
                                  LocalDateTime checkedInAt, CheckinMethod method, String createdByName,
                                  String planName, Integer daysLeft, String sessionTitle, LocalDateTime sessionStart) {
    }

    /** already = true: hội viên đã check-in trong 3 giờ qua, trả lại lượt cũ thay vì ghi thêm. */
    public record CheckinResult(CheckinResponse checkin, boolean already, long visitsThisMonth) {
    }

    public record HourValue(int hour, double value) {
    }

    public record CheckinToday(long total, long inGymNow, List<CheckinResponse> items, List<HourValue> byHour) {
    }

    /**
     * Mức đông theo giờ, tính trung bình trên {@code days} ngày gần nhất.
     * source = CHECKIN (lượt check-in thật) hoặc SCHEDULE (lịch tập đã đặt, dùng khi chưa đủ lượt check-in).
     * week: 7 hàng (T2 → CN) × 24 giờ. level của giờ hiện tại: QUIET / NORMAL / BUSY / UNKNOWN.
     */
    public record CrowdResponse(String source, int days, int dayOfWeek, int currentHour, int openHour, int closeHour,
                                List<HourValue> today, List<List<Double>> week, String level, long inGymNow,
                                Integer peakHour, Integer quietHour, boolean enoughData) {
    }

    public record TodayExercise(Long itemId, Long exerciseId, String name, String nameEn, MuscleGroup muscleGroup,
                                Integer sets, String reps, Double weightKg, Integer restSeconds, Integer durationMinutes,
                                String note, boolean hasVideo, String imageKey) {
    }

    /** nextPlanDay: hôm nay là ngày nghỉ theo giáo án thì đây là thứ của buổi kế tiếp (1 = Thứ Hai … 7 = Chủ nhật). */
    public record TodayResponse(String fullName, LocalDate date, int dayOfWeek, CheckinResponse checkin,
                                long visitsThisMonth, List<ScheduleResponse> sessions, ScheduleResponse nextSession,
                                SubscriptionResponse subscription, WorkoutPlanSummary plan, List<TodayExercise> workout,
                                Integer nextPlanDay, int streakWeeks, long completedThisMonth, CrowdResponse crowd) {
    }
}
