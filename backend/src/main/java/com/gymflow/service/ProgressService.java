package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.WeightRecordRepository;
import com.gymflow.repository.WorkoutLogRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** Cân nặng (mỗi ngày một bản ghi, ghi lại thì cập nhật) và tổng hợp tiến độ. */
@Service
@RequiredArgsConstructor
public class ProgressService {

    static final int ATTENDANCE_WEEKS = 8;

    private final WeightRecordRepository weightRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final WorkoutLogRepository logRepository;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;

    @Transactional(readOnly = true)
    public List<WeightResponse> weights(AuthUser user, Long memberId) {
        access.requireView(user, memberId);
        return weightRepository.findByMemberIdOrderByRecordedDateAsc(memberId).stream().map(mappers::weight).toList();
    }

    /** Hội viên tự ghi của mình; HLV phụ trách / quản lý ghi hộ. */
    @Transactional
    public WeightResponse upsertWeight(AuthUser user, Long memberId, WeightRequest req) {
        Member m = access.requireView(user, memberId);
        if (req.recordedDate().isAfter(mappers.today())) throw ApiException.badRequest("Không ghi cân nặng cho ngày tương lai");
        WeightRecord w = weightRepository.findByMemberIdAndRecordedDate(memberId, req.recordedDate()).orElseGet(() -> {
            WeightRecord n = new WeightRecord();
            n.setMember(m);
            n.setRecordedDate(req.recordedDate());
            return n;
        });
        boolean isNew = w.getId() == null;
        w.setWeightKg(round1(req.weightKg()));
        w.setBodyFat(req.bodyFat() == null ? null : round1(req.bodyFat()));
        w.setWaistCm(req.waistCm() == null ? null : round1(req.waistCm()));
        w.setChestCm(req.chestCm() == null ? null : round1(req.chestCm()));
        w.setArmCm(req.armCm() == null ? null : round1(req.armCm()));
        w.setThighCm(req.thighCm() == null ? null : round1(req.thighCm()));
        w.setNote(Mappers.blankToNull(req.note()));
        weightRepository.save(w);
        auditService.log(isNew ? "WEIGHT_CREATE" : "WEIGHT_UPDATE", "MEMBER", memberId,
                req.recordedDate() + ": " + w.getWeightKg() + " kg");
        return mappers.weight(w);
    }

    @Transactional
    public void deleteWeight(AuthUser user, Long weightId) {
        WeightRecord w = weightRepository.findById(weightId).orElseThrow(() -> ApiException.notFound("bản ghi cân nặng"));
        if (!access.canView(user, w.getMember())) throw ApiException.forbidden();
        weightRepository.delete(w);
        auditService.log("WEIGHT_DELETE", "MEMBER", w.getMember().getId(), String.valueOf(w.getRecordedDate()));
    }

    @Transactional(readOnly = true)
    public ProgressResponse progress(AuthUser user, Long memberId) {
        Member m = access.requireView(user, memberId);
        return build(m);
    }

    ProgressResponse build(Member m) {
        LocalDate today = mappers.today();
        List<WeightRecord> weights = weightRepository.findByMemberIdOrderByRecordedDateAsc(m.getId());
        Double current = weights.isEmpty() ? null : weights.get(weights.size() - 1).getWeightKg();
        Double start = weights.isEmpty() ? null : weights.get(0).getWeightKg();
        Double change = current == null ? null : round1(current - start);
        Double bodyFat = null;
        for (int i = weights.size() - 1; i >= 0 && bodyFat == null; i--) bodyFat = weights.get(i).getBodyFat();
        Double bmi = bmi(current, m.getHeightCm());
        Double fatEstimate = deurenbergBodyFat(bmi, ageAt(m.getDateOfBirth(), today), m.getGender());
        String fatHint = fatEstimate != null || current == null ? null : bodyFatHint(m);

        List<WorkoutSchedule> sessions = scheduleRepository.findByMemberIdOrderByStartTimeAsc(m.getId());
        List<WeekAttendance> attendance = attendance(sessions, today);
        long done = attendance.stream().mapToLong(WeekAttendance::completed).sum();
        long missed = attendance.stream().mapToLong(WeekAttendance::missed).sum();
        Double rate = attendanceRate(done, missed);

        List<WorkoutLog> logs = logRepository.findByMemberIdOrderByCompletedAtDesc(m.getId());
        long minutes = totalMinutes(logs);
        long calories = estimatedCalories(logs);
        Double avgRating = logs.stream().map(WorkoutLog::getRating).filter(Objects::nonNull)
                .mapToInt(Integer::intValue).average().stream().mapToObj(ProgressService::round1).findFirst().orElse(null);

        return new ProgressResponse(m.getId(), m.getHeightCm(), current, start, change, bodyFat, bmi, bmiCategory(bmi),
                weights.stream().map(mappers::weight).toList(), attendance, rate, streakWeeks(sessions, today),
                logs.size(), minutes, calories, avgRating, fatEstimate, fatHint);
    }

    // ---------- Các phép tính thuần (có unit test) ----------

    /**
     * % mỡ ước tính theo Deurenberg (1991): 1,20 × BMI + 0,23 × tuổi − 10,8 × giới tính − 5,4 (nam = 1, nữ = 0).
     * Chỉ là ước tính từ BMI cho người trưởng thành; thiếu dữ liệu hoặc giới tính "Khác" thì trả null.
     */
    public static Double deurenbergBodyFat(Double bmi, Integer age, Gender gender) {
        if (bmi == null || age == null || age < 18 || gender == null || gender == Gender.OTHER) return null;
        int sex = gender == Gender.MALE ? 1 : 0;
        double v = 1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4;
        return round1(Math.max(2, Math.min(70, v)));
    }

    public static Integer ageAt(LocalDate dateOfBirth, LocalDate on) {
        if (dateOfBirth == null || on == null || dateOfBirth.isAfter(on)) return null;
        return java.time.Period.between(dateOfBirth, on).getYears();
    }

    /** Lý do chưa ước tính được % mỡ, để giao diện nhắc hội viên bổ sung hồ sơ. */
    static String bodyFatHint(Member m) {
        List<String> missing = new ArrayList<>();
        if (m.getHeightCm() == null) missing.add("chiều cao");
        if (m.getDateOfBirth() == null) missing.add("ngày sinh");
        if (m.getGender() == null) missing.add("giới tính");
        if (!missing.isEmpty()) return "Cập nhật " + String.join(", ", missing) + " trong Hồ sơ để ước tính % mỡ";
        if (m.getGender() == Gender.OTHER) return "Công thức Deurenberg chỉ áp dụng cho giới tính Nam hoặc Nữ";
        return "Công thức Deurenberg áp dụng cho người từ 18 tuổi";
    }

    public static Double bmi(Double weightKg, Double heightCm) {
        if (weightKg == null || heightCm == null || heightCm <= 0) return null;
        double h = heightCm / 100.0;
        return round1(weightKg / (h * h));
    }

    /** Ngưỡng WHO cho người châu Á (IDI & WPRO 2000). */
    public static String bmiCategory(Double bmi) {
        if (bmi == null) return null;
        if (bmi < 18.5) return "Thiếu cân";
        if (bmi < 23) return "Bình thường";
        if (bmi < 25) return "Thừa cân";
        if (bmi < 30) return "Béo phì độ I";
        return "Béo phì độ II";
    }

    /**
     * Chuyên cần (PRG-05, mục 13.2) = buổi hoàn thành / buổi đã xếp không huỷ, làm tròn 1 chữ số.
     * Chỉ tính buổi đã diễn ra (COMPLETED + MISSED) nên buổi sắp tới trong tuần chưa kéo tỉ lệ xuống.
     */
    public static Double attendanceRate(long completed, long missed) {
        if (completed + missed == 0) return null;
        return round1(completed * 100.0 / (completed + missed));
    }

    public static LocalDate weekStart(LocalDate d) {
        return d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    /** 8 tuần gần nhất (tuần hiện tại ở cuối). */
    public static List<WeekAttendance> attendance(List<WorkoutSchedule> sessions, LocalDate today) {
        LocalDate thisWeek = weekStart(today);
        List<WeekAttendance> result = new ArrayList<>();
        for (int i = ATTENDANCE_WEEKS - 1; i >= 0; i--) {
            LocalDate ws = thisWeek.minusWeeks(i);
            LocalDate we = ws.plusDays(7);
            long scheduled = 0, completed = 0, missed = 0;
            for (WorkoutSchedule s : sessions) {
                LocalDate d = s.getStartTime().toLocalDate();
                if (d.isBefore(ws) || !d.isBefore(we) || s.getStatus() == ScheduleStatus.CANCELLED) continue;
                scheduled++;
                if (s.getStatus() == ScheduleStatus.COMPLETED) completed++;
                if (s.getStatus() == ScheduleStatus.MISSED) missed++;
            }
            result.add(new WeekAttendance(ws, scheduled, completed, missed));
        }
        return result;
    }

    /**
     * Số tuần liên tiếp có ít nhất 1 buổi hoàn thành, tính lùi từ tuần này.
     * Tuần hiện tại chưa có buổi nào thì không làm đứt chuỗi (tuần chưa kết thúc).
     */
    public static int streakWeeks(List<WorkoutSchedule> sessions, LocalDate today) {
        java.util.Set<LocalDate> weeks = new java.util.HashSet<>();
        for (WorkoutSchedule s : sessions) {
            if (s.getStatus() == ScheduleStatus.COMPLETED) weeks.add(weekStart(s.getStartTime().toLocalDate()));
        }
        LocalDate cursor = weekStart(today);
        if (!weeks.contains(cursor)) cursor = cursor.minusWeeks(1);
        int streak = 0;
        while (weeks.contains(cursor)) {
            streak++;
            cursor = cursor.minusWeeks(1);
        }
        return streak;
    }

    /** PRG-06 · tổng calo các buổi đã ghi nhật ký; buổi không nhập calo thì bỏ qua. */
    public static long totalCalories(List<WorkoutLog> logs) {
        return logs.stream().map(WorkoutLog::getCalories).filter(Objects::nonNull).mapToLong(Integer::longValue).sum();
    }

    /** Tổng calo cho tiến độ: chỉ tính buổi đã ước tính MET hợp lệ. */
    public static long estimatedCalories(List<WorkoutLog> logs) {
        return logs.stream()
                .filter(l -> l.isEstimated() && l.getEstimateStatus() == EstimateStatus.OK)
                .map(WorkoutLog::getCalories).filter(Objects::nonNull).mapToLong(Integer::longValue).sum();
    }

    public static long totalMinutes(List<WorkoutLog> logs) {
        return logs.stream().map(WorkoutLog::getDurationMinutes).filter(Objects::nonNull).mapToLong(Integer::longValue).sum();
    }

    static Double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
