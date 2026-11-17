package com.gymflow.service;

import com.gymflow.domain.ScheduleStatus;
import com.gymflow.domain.WorkoutSchedule;
import com.gymflow.dto.CheckinDtos.CrowdResponse;
import com.gymflow.dto.CheckinDtos.HourValue;
import com.gymflow.repository.GymCheckinRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * V53 · Giờ đông / giờ vắng: trung bình số lượt mỗi giờ theo từng thứ trong 4 tuần gần nhất.
 * Đủ lượt check-in thì tính từ check-in thật; chưa đủ (phòng mới dùng) thì tạm tính từ lịch tập đã đặt.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CrowdService {

    public static final int DAYS = 28;
    public static final int OPEN_HOUR = 5;
    public static final int CLOSE_HOUR = 22;
    /** Khoảng thời gian coi như hội viên vẫn còn trong phòng sau khi check-in. */
    public static final int STAY_MINUTES = 90;
    static final int MIN_CHECKINS = 30;
    static final int MIN_SAMPLES = 10;

    private final GymCheckinRepository checkinRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final Clock clock;

    public CrowdResponse crowd() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        LocalDateTime from = today.minusDays(DAYS).atStartOfDay();
        LocalDateTime to = today.atStartOfDay();
        List<LocalDateTime> checkins = checkinRepository.timesBetween(from, to);
        long inGym = checkinRepository.countByCheckedInAtGreaterThanEqual(now.minusMinutes(STAY_MINUTES));
        if (checkins.size() >= MIN_CHECKINS) return build(checkins, "CHECKIN", now, inGym);
        List<LocalDateTime> booked = scheduleRepository.findByStartTimeBetweenOrderByStartTimeAsc(from, to).stream()
                .filter(s -> s.getStatus() != ScheduleStatus.CANCELLED)
                .map(WorkoutSchedule::getStartTime)
                .toList();
        return booked.size() > checkins.size() ? build(booked, "SCHEDULE", now, inGym) : build(checkins, "CHECKIN", now, inGym);
    }

    /** Tính thuần từ danh sách thời điểm trong {@link #DAYS} ngày trước hôm nay – tách riêng để kiểm thử. */
    static CrowdResponse build(List<LocalDateTime> times, String source, LocalDateTime now, long inGymNow) {
        int[][] count = new int[7][24];
        for (LocalDateTime t : times) count[t.getDayOfWeek().getValue() - 1][t.getHour()]++;
        double perDay = DAYS / 7.0;
        List<List<Double>> week = new ArrayList<>(7);
        double max = 0;
        for (int d = 0; d < 7; d++) {
            List<Double> row = new ArrayList<>(24);
            for (int h = 0; h < 24; h++) {
                double avg = Math.round(count[d][h] / perDay * 10) / 10.0;
                row.add(avg);
                if (h >= OPEN_HOUR && h <= CLOSE_HOUR) max = Math.max(max, avg);
            }
            week.add(row);
        }
        int dow = now.getDayOfWeek().getValue();
        int hourNow = now.getHour();
        List<Double> todayRow = week.get(dow - 1);
        List<HourValue> today = new ArrayList<>();
        Integer peak = null;
        for (int h = OPEN_HOUR; h <= CLOSE_HOUR; h++) {
            today.add(new HourValue(h, todayRow.get(h)));
            if (todayRow.get(h) > 0 && (peak == null || todayRow.get(h) > todayRow.get(peak))) peak = h;
        }
        Integer quiet = quietest(todayRow, Math.max(OPEN_HOUR, hourNow + 1));
        if (quiet == null) quiet = quietest(todayRow, OPEN_HOUR);
        boolean open = hourNow >= OPEN_HOUR && hourNow <= CLOSE_HOUR;
        String level = !open || max == 0 ? "UNKNOWN" : levelOf(todayRow.get(hourNow) / max);
        return new CrowdResponse(source, DAYS, dow, hourNow, OPEN_HOUR, CLOSE_HOUR, today, week, level, inGymNow,
                peak, max == 0 ? null : quiet, times.size() >= MIN_SAMPLES);
    }

    static String levelOf(double ratio) {
        if (ratio < 0.34) return "QUIET";
        if (ratio < 0.67) return "NORMAL";
        return "BUSY";
    }

    /** Giờ vắng nhất từ {@code fromHour} tới giờ đóng cửa (giờ cuối 1 tiếng trước đóng cửa để còn kịp tập). */
    private static Integer quietest(List<Double> row, int fromHour) {
        Integer best = null;
        for (int h = fromHour; h <= CLOSE_HOUR - 1; h++) {
            if (best == null || row.get(h) < row.get(best)) best = h;
        }
        return best;
    }
}
