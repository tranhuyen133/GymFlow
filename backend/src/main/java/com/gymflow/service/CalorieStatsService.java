package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.EstimateStatus;
import com.gymflow.domain.WorkoutLog;
import com.gymflow.dto.Dtos.CalorieBucket;
import com.gymflow.dto.Dtos.CalorieHistoryResponse;
import com.gymflow.dto.Dtos.CalorieWeek;
import com.gymflow.dto.Dtos.CaloriePeriodSummary;
import com.gymflow.dto.Dtos.CalorieSessionResponse;
import com.gymflow.dto.Dtos.CalorieSummaryResponse;
import com.gymflow.dto.Dtos.CalorieTopDay;
import com.gymflow.repository.WorkoutLogExerciseRepository;
import com.gymflow.repository.WorkoutLogRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Thống kê calo theo ngày/tuần/tháng, dùng múi giờ Việt Nam và tuần bắt đầu Thứ 2. */
@Service
@RequiredArgsConstructor
public class CalorieStatsService {

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd/MM");
    private static final int MAX_RANGE_DAYS = 366;
    static final int MAX_HISTORY_WEEKS = 52;
    static final int KCAL_PER_KG_FAT = 7700;

    private final WorkoutLogRepository logRepository;
    private final WorkoutLogExerciseRepository logExerciseRepository;
    private final AccessService access;
    private final Clock clock;

    @Transactional(readOnly = true)
    public CalorieSummaryResponse summary(AuthUser user, Long memberId, String periodRaw, LocalDate anchor) {
        access.requireView(user, memberId);
        String period = periodRaw == null ? "WEEK" : periodRaw.toUpperCase();
        LocalDate base = anchor == null ? LocalDate.now(clock) : anchor;

        LocalDate from;
        LocalDate to;
        LocalDate previousFrom;
        LocalDate previousTo;
        if ("DAY".equals(period)) {
            from = base;
            to = base.plusDays(1);
            previousFrom = base.minusDays(1);
            previousTo = base;
        } else if ("MONTH".equals(period)) {
            YearMonth ym = YearMonth.from(base);
            from = ym.atDay(1);
            to = ym.plusMonths(1).atDay(1);
            YearMonth prev = ym.minusMonths(1);
            previousFrom = prev.atDay(1);
            previousTo = from;
        } else if ("WEEK".equals(period)) {
            from = base.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            to = from.plusDays(7);
            previousFrom = from.minusWeeks(1);
            previousTo = from;
        } else {
            throw ApiException.badRequest("Kỳ thống kê chỉ có thể là DAY, WEEK hoặc MONTH");
        }

        List<WorkoutLog> logs = logs(memberId, from, to);
        List<WorkoutLog> previousLogs = logs(memberId, previousFrom, previousTo);

        List<WorkoutLog> counted = estimated(logs);
        long totalCalories = sumCalories(counted);
        long totalSessions = logs.size();
        long estimatedSessions = counted.size();
        long unestimatedSessions = totalSessions - estimatedSessions;
        double totalActive = sumActiveMinutes(logs);
        Double avg = estimatedSessions == 0 ? null : round1(totalCalories / (double) estimatedSessions);

        List<CalorieBucket> buckets = buckets(logs, from, to);
        CalorieTopDay topDay = buckets.stream()
                .filter(b -> b.calories() > 0)
                .max((a, b) -> Long.compare(a.calories(), b.calories()))
                .map(b -> new CalorieTopDay(b.from(), b.calories(), b.sessions()))
                .orElse(null);

        List<WorkoutLog> previousCounted = estimated(previousLogs);
        long prevCalories = sumCalories(previousCounted);
        long prevSessions = previousLogs.size();
        long prevEstimated = previousCounted.size();
        double prevActive = sumActiveMinutes(previousLogs);
        Double prevAvg = prevEstimated == 0 ? null : round1(prevCalories / (double) prevEstimated);
        Double changePercent = prevCalories == 0 ? null : round1((totalCalories - prevCalories) * 100.0 / prevCalories);
        CaloriePeriodSummary previous = new CaloriePeriodSummary(
                previousFrom, previousTo, prevCalories, prevSessions, round1(prevActive), prevAvg, changePercent);

        return new CalorieSummaryResponse(period, from, to, "Asia/Ho_Chi_Minh",
                totalCalories, totalSessions, estimatedSessions, unestimatedSessions, round1(totalActive),
                avg, buckets, topDay, previous, CalorieEstimationService.DISCLAIMER);
    }

    @Transactional(readOnly = true)
    public List<CalorieSessionResponse> sessions(AuthUser user, Long memberId, LocalDate from, LocalDate to) {
        access.requireView(user, memberId);
        if (from == null || to == null) throw ApiException.badRequest("Vui lòng chọn khoảng ngày");
        if (to.isBefore(from)) throw ApiException.badRequest("Ngày kết thúc phải sau ngày bắt đầu");
        if (from.plusDays(MAX_RANGE_DAYS).isBefore(to)) {
            throw ApiException.badRequest("Chỉ xem tối đa " + MAX_RANGE_DAYS + " ngày mỗi lần");
        }
        List<WorkoutLog> logs = logRepository.findByMemberIdAndCompletedAtBetweenOrderByCompletedAtDesc(
                memberId, from.atStartOfDay(), to.plusDays(1).atStartOfDay());
        return logs.stream()
                .map(log -> CalorieMapper.session(log,
                        logExerciseRepository.findByWorkoutLogIdOrderBySortOrderAsc(log.getId())))
                .toList();
    }

    private List<WorkoutLog> logs(Long memberId, LocalDate from, LocalDate to) {
        return logRepository.findByMemberIdAndCompletedAtBetweenOrderByCompletedAtAsc(
                memberId, from.atStartOfDay(), to.atStartOfDay());
    }

    /**
     * Lịch sử calo theo tuần (Thứ 2 → Chủ nhật), tuần hiện tại ở cuối, mỗi tuần kèm 7 ngày.
     * Số kg mỡ tương đương = calo / 7.700 – quy ước thô, chỉ để hình dung, không phải dự báo giảm cân.
     */
    @Transactional(readOnly = true)
    public CalorieHistoryResponse history(AuthUser user, Long memberId, int weeksRaw) {
        access.requireView(user, memberId);
        int weeks = Math.max(1, Math.min(MAX_HISTORY_WEEKS, weeksRaw));
        LocalDate thisWeek = LocalDate.now(clock).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate from = thisWeek.minusWeeks(weeks - 1L);
        return buildHistory(logs(memberId, from, thisWeek.plusWeeks(1)), from, weeks);
    }

    static CalorieHistoryResponse buildHistory(List<WorkoutLog> logs, LocalDate firstMonday, int weeks) {
        List<CalorieWeek> result = new ArrayList<>();
        long total = 0;
        long sessions = 0;
        for (int i = 0; i < weeks; i++) {
            LocalDate ws = firstMonday.plusWeeks(i);
            LocalDate we = ws.plusDays(7);
            List<WorkoutLog> weekLogs = logs.stream()
                    .filter(l -> !l.getCompletedAt().toLocalDate().isBefore(ws) && l.getCompletedAt().toLocalDate().isBefore(we))
                    .toList();
            long cal = sumCalories(estimated(weekLogs));
            total += cal;
            sessions += weekLogs.size();
            result.add(new CalorieWeek(ws, we.minusDays(1), cal, weekLogs.size(), round1(sumActiveMinutes(weekLogs)),
                    fatKg(cal), buckets(weekLogs, ws, we)));
        }
        return new CalorieHistoryResponse(result, total, sessions, round1(total / (double) weeks), fatKg(total),
                KCAL_PER_KG_FAT, "Asia/Ho_Chi_Minh",
                "Ước tính thô: khoảng 7.700 kcal tương đương 1 kg mỡ. Cân nặng thực tế còn phụ thuộc ăn uống, nước và cơ.");
    }

    static double fatKg(long calories) {
        return Math.round(calories * 100.0 / KCAL_PER_KG_FAT) / 100.0;
    }

    private static List<WorkoutLog> estimated(List<WorkoutLog> logs) {
        return logs.stream()
                .filter(l -> l.isEstimated() && l.getEstimateStatus() == EstimateStatus.OK)
                .toList();
    }

    private static List<CalorieBucket> buckets(List<WorkoutLog> logs, LocalDate from, LocalDate to) {
        Map<LocalDate, List<WorkoutLog>> byDay = logs.stream()
                .collect(Collectors.groupingBy(l -> l.getCompletedAt().toLocalDate()));
        List<CalorieBucket> buckets = new ArrayList<>();
        for (LocalDate day = from; day.isBefore(to); day = day.plusDays(1)) {
            List<WorkoutLog> dayLogs = byDay.getOrDefault(day, List.of());
            buckets.add(new CalorieBucket(
                    day.toString(),
                    day.format(DAY_LABEL),
                    day,
                    day.plusDays(1),
                    sumCalories(estimated(dayLogs)),
                    dayLogs.size(),
                    round1(sumActiveMinutes(dayLogs))));
        }
        return buckets;
    }

    private static long sumCalories(List<WorkoutLog> logs) {
        return logs.stream()
                .map(WorkoutLog::getCalories)
                .filter(c -> c != null)
                .mapToLong(Integer::longValue)
                .sum();
    }

    private static double sumActiveMinutes(List<WorkoutLog> logs) {
        return logs.stream()
                .map(WorkoutLog::getActiveMinutes)
                .filter(a -> a != null)
                .mapToDouble(Double::doubleValue)
                .sum();
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
