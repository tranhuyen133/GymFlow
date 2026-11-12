package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.EstimateStatus;
import com.gymflow.domain.WorkoutLog;
import com.gymflow.dto.Dtos.CalorieBucket;
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
import java.time.LocalDateTime;
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
        if ("MONTH".equals(period)) {
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
            throw ApiException.badRequest("Kỳ thống kê chỉ có thể là WEEK hoặc MONTH");
        }

        List<WorkoutLog> logs = estimatedLogs(memberId, from, to);
        List<WorkoutLog> previousLogs = estimatedLogs(memberId, previousFrom, previousTo);

        long totalCalories = sumCalories(logs);
        long totalSessions = logs.size();
        double totalActive = sumActiveMinutes(logs);
        Double avg = totalSessions == 0 ? null : round1(totalCalories / (double) totalSessions);

        List<CalorieBucket> buckets = buckets(logs, from, to);
        CalorieTopDay topDay = buckets.stream()
                .filter(b -> b.calories() > 0)
                .max((a, b) -> Long.compare(a.calories(), b.calories()))
                .map(b -> new CalorieTopDay(b.from(), b.calories(), b.sessions()))
                .orElse(null);

        long prevCalories = sumCalories(previousLogs);
        long prevSessions = previousLogs.size();
        double prevActive = sumActiveMinutes(previousLogs);
        Double prevAvg = prevSessions == 0 ? null : round1(prevCalories / (double) prevSessions);
        Double changePercent = prevCalories == 0 ? null : round1((totalCalories - prevCalories) * 100.0 / prevCalories);
        CaloriePeriodSummary previous = new CaloriePeriodSummary(
                previousFrom, previousTo, prevCalories, prevSessions, round1(prevActive), prevAvg, changePercent);

        return new CalorieSummaryResponse(period, from, to, "Asia/Ho_Chi_Minh",
                totalCalories, totalSessions, round1(totalActive), avg, buckets, topDay, previous,
                CalorieEstimationService.DISCLAIMER);
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

    private List<WorkoutLog> estimatedLogs(Long memberId, LocalDate from, LocalDate to) {
        return logRepository.findByMemberIdAndCompletedAtBetweenAndEstimatedTrueAndEstimateStatusOrderByCompletedAtAsc(
                memberId, from.atStartOfDay(), to.atStartOfDay(), EstimateStatus.OK);
    }

    private List<CalorieBucket> buckets(List<WorkoutLog> logs, LocalDate from, LocalDate to) {
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
                    sumCalories(dayLogs),
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
