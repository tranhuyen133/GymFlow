package com.gymflow.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** V55 · DTO cho email tự động, huy hiệu và thống kê HLV (tách file riêng để không đụng Dtos.java). */
public final class EngagementDtos {
    private EngagementDtos() {}

    // ---------- Tuỳ chọn email ----------
    /** prefs: loại email → bật/tắt, chỉ gồm các loại áp dụng cho vai trò của tài khoản. */
    public record EmailPrefsResponse(String locale, Map<String, Boolean> prefs, boolean mailConfigured) {}

    public record EmailPrefsRequest(Map<String, Boolean> prefs) {}

    public record LocaleRequest(String locale) {}

    /** Trang tắt email mở từ chân thư (không đăng nhập): chỉ hiện email đã che bớt. */
    public record UnsubscribeInfo(String maskedEmail, String fullName, String locale, Map<String, Boolean> prefs) {}

    // ---------- Quản lý email ----------
    public record EmailLogResponse(Long id, String toEmail, String kind, String refKey, String subject, String status,
                                   int attempts, String error, LocalDateTime createdAt, LocalDateTime sentAt) {}

    public record EmailKindSummary(String kind, String schedule, long sent, long failed, long skipped) {}

    public record EmailSummary(boolean mailConfigured, String from, List<EmailKindSummary> kinds) {}

    public record EmailPreviewResponse(String kind, String locale, String subject, String html) {}

    public record EmailRunResponse(String kind, int sent) {}

    // ---------- Huy hiệu ----------
    public record BadgeResponse(String code, String icon, String titleVi, String titleEn, String descVi, String descEn,
                                int goal, int progress, boolean earned, LocalDateTime earnedAt, boolean isNew) {}

    public record RecordsResponse(int totalWorkouts, int totalCheckins, long totalCalories, long totalMinutes,
                                  int currentStreakWeeks, int longestStreakWeeks, int bestWeekWorkouts,
                                  int maxSessionCalories, int longestSessionMinutes, int activeDays) {}

    public record BadgesResponse(List<BadgeResponse> badges, RecordsResponse records, int earnedCount) {}

    // ---------- Thống kê HLV ----------
    public record InactiveMember(Long memberId, String fullName, String code, Integer daysAway, LocalDate lastVisit) {}

    public record WeekPoint(LocalDate weekStart, int completed, int missed) {}

    public record TrainerStatsResponse(Long trainerId, String fullName, int days,
                                       int sessionsTotal, int completed, int missed, int cancelled, int upcoming,
                                       Double attendanceRate, Double avgRating, int ratingCount,
                                       int members, int activeMembers, int membersTrained,
                                       List<InactiveMember> inactiveMembers, List<WeekPoint> weeks) {}
}
