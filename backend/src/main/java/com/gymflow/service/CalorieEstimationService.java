package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.repository.WeightRecordRepository;
import com.gymflow.repository.WorkoutLogExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Ước tính calo tiêu hao theo MET từ dữ liệu buổi tập + giáo án + cân nặng gần nhất.
 *
 * <p>Quy tắc:
 * <ul>
 *   <li>Cân nặng: bản ghi mới nhất có ngày ghi ≤ ngày tập. Thiếu → MISSING_WEIGHT, calo null.</li>
 *   <li>Tập tạ: tính cả cụm bài = các hiệp + nghỉ giữa hiệp (thiếu số giây nghỉ → 90 giây).</li>
 *   <li>Cardio: dùng durationMinutes của bài; thiếu thì bỏ qua bài đó.</li>
 *   <li>Không có bài tập/không đủ dữ liệu: fallback ước tính thô toàn buổi (OTHER, MODERATE).</li>
 *   <li>Thời gian còn lại của buổi (khởi động, chuyển bài, giãn cơ) tính ở mức nhẹ (OTHER, LIGHT).</li>
 *   <li>Tổng thời gian không vượt quá thời lượng buổi tập (vượt thì thu nhỏ theo tỉ lệ).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class CalorieEstimationService {

    public static final String FORMULA_VERSION = "MET-COMPENDIUM-2011-v2";
    public static final String MET_METHOD = "MET_COMPENDIUM_2011";
    public static final String TRANSITION_NAME = "Khởi động, chuyển bài & giãn cơ";
    public static final String DISCLAIMER = "Lượng calo là giá trị ước tính dựa trên dữ liệu vận động và thông tin cá nhân. "
            + "Giá trị thực tế có thể khác nhau giữa từng người. Đây là calo tiêu hao do tập luyện, "
            + "không phải tổng năng lượng tiêu hao trong ngày.";

    private final WeightRecordRepository weightRepository;
    private final MetReferenceService metReferenceService;
    private final WorkoutLogExerciseRepository logExerciseRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public CalorieEstimate estimate(WorkoutSchedule schedule, int durationMinutes, ExerciseIntensity requestedIntensity) {
        return estimateInternal(schedule, schedule.getMember().getId(), schedule.getStartTime().toLocalDate(),
                durationMinutes, requestedIntensity, false, null);
    }

    /**
     * Dùng riêng cho backfill dữ liệu lịch sử: cho phép lấy cân nặng gần nhất và ép chất lượng COARSE
     * vì cường độ của buổi cũ chỉ là giả định (MODERATE).
     */
    @Transactional(readOnly = true)
    public CalorieEstimate estimateForBackfill(WorkoutSchedule schedule, int durationMinutes,
                                               ExerciseIntensity requestedIntensity) {
        return estimateInternal(schedule, schedule.getMember().getId(), schedule.getStartTime().toLocalDate(),
                durationMinutes, requestedIntensity, true, EstimateQuality.COARSE);
    }

    /** Log không còn schedule: chỉ có thể ước tính thô toàn buổi từ cân nặng gần nhất. */
    @Transactional(readOnly = true)
    public CalorieEstimate estimateStandalone(Member member, LocalDate sessionDate, int durationMinutes) {
        return estimateInternal(null, member.getId(), sessionDate, durationMinutes,
                ExerciseIntensity.MODERATE, true, EstimateQuality.COARSE);
    }

    private CalorieEstimate estimateInternal(WorkoutSchedule schedule, Long memberId, LocalDate sessionDate,
                                             int durationMinutes, ExerciseIntensity requestedIntensity,
                                             boolean allowNearestWeight, EstimateQuality qualityOverride) {
        ExerciseIntensity intensity = requestedIntensity == null ? ExerciseIntensity.MODERATE : requestedIntensity;
        int duration = Math.max(1, durationMinutes);

        WeightChoice weightChoice = resolveWeight(memberId, sessionDate, allowNearestWeight);
        Double weight = weightChoice.weight();
        String weightSource = weightChoice.source();

        List<CalorieEstimate.ExerciseEstimate> exercises = new ArrayList<>();
        if (schedule != null) {
            for (WorkoutPlanItem item : planItemsFor(schedule)) {
                CalorieEstimate.ExerciseEstimate estimate = estimateItem(item, intensity, weight);
                if (estimate != null && estimate.activeMinutes() != null && estimate.activeMinutes() > 0) {
                    exercises.add(estimate);
                }
            }
        }

        EstimateQuality quality = exercises.isEmpty() ? EstimateQuality.COARSE : EstimateQuality.DETAILED;
        if (qualityOverride != null) quality = qualityOverride;
        if (exercises.isEmpty()) {
            exercises.add(fallbackEstimate(duration, weight));
        }

        double totalActive = exercises.stream().mapToDouble(CalorieEstimate.ExerciseEstimate::activeMinutes).sum();
        if (totalActive > duration && totalActive > 0) {
            double factor = duration / totalActive;
            exercises = exercises.stream().map(e -> scale(e, factor, weight)).toList();
            totalActive = duration;
        } else if (duration - totalActive >= 1.0) {
            double remaining = round1(duration - totalActive);
            exercises = new ArrayList<>(exercises);
            exercises.add(transitionEstimate(remaining, weight));
            totalActive += remaining;
        }

        EstimateStatus status;
        Integer totalCalories = null;
        if (weight == null) {
            status = EstimateStatus.MISSING_WEIGHT;
        } else if (totalActive <= 0) {
            status = EstimateStatus.NO_EXERCISE_DATA;
        } else {
            status = EstimateStatus.OK;
            totalCalories = exercises.stream()
                    .map(CalorieEstimate.ExerciseEstimate::calories)
                    .filter(c -> c != null)
                    .mapToInt(Integer::intValue)
                    .sum();
        }

        return new CalorieEstimate(status, quality, weight, weightSource, intensity,
                round1(totalActive), totalCalories, List.copyOf(exercises));
    }

    private WeightChoice resolveWeight(Long memberId, LocalDate sessionDate, boolean allowNearestWeight) {
        WeightRecord weightRecord = weightRepository
                .findFirstByMemberIdAndRecordedDateLessThanEqualOrderByRecordedDateDesc(memberId, sessionDate)
                .orElse(null);
        if (weightRecord != null) {
            return new WeightChoice(weightRecord.getWeightKg(), "WEIGHT_RECORD@" + weightRecord.getRecordedDate());
        }
        if (allowNearestWeight) {
            WeightRecord nearest = weightRepository.findFirstByMemberIdOrderByRecordedDateAsc(memberId).orElse(null);
            if (nearest != null) {
                return new WeightChoice(nearest.getWeightKg(),
                        "WEIGHT_RECORD_NEAREST@" + nearest.getRecordedDate());
            }
        }
        return new WeightChoice(null, "MISSING");
    }

    private record WeightChoice(Double weight, String source) {
    }

    /** Ghi snapshot ước tính vào nhật ký (phải gọi trước khi lưu log). */
    public void applyToLog(WorkoutLog log, CalorieEstimate estimate) {
        applyToLog(log, estimate, MET_METHOD, FORMULA_VERSION);
    }

    /** Ghi snapshot với phương pháp/công thức tuỳ biến (dùng cho backfill lịch sử). */
    public void applyToLog(WorkoutLog log, CalorieEstimate estimate, String metMethod, String formulaVersion) {
        log.setWeightKgUsed(estimate.weightKg());
        log.setActiveMinutes(estimate.activeMinutes());
        log.setIntensity(estimate.intensity());
        log.setMetMethod(metMethod);
        log.setFormulaVersion(formulaVersion);
        log.setEstimateStatus(estimate.status());
        log.setEstimateQuality(estimate.quality());
        log.setEstimated(estimate.status() == EstimateStatus.OK);
        log.setCalculatedAt(LocalDateTime.now(clock));
        log.setCalories(estimate.totalCalories());
    }

    /** Lưu chi tiết từng bài sau khi log đã có id. */
    @Transactional
    public void saveExercises(WorkoutLog log, CalorieEstimate estimate) {
        List<WorkoutLogExercise> rows = new ArrayList<>();
        int order = 0;
        for (CalorieEstimate.ExerciseEstimate e : estimate.exercises()) {
            WorkoutLogExercise row = new WorkoutLogExercise();
            row.setWorkoutLog(log);
            row.setExercise(e.exercise());
            row.setExerciseName(e.exerciseName());
            row.setActivityCategory(e.activityCategory());
            row.setIntensity(e.intensity());
            row.setMetValue(e.metValue());
            row.setMetSourceCode(e.metSourceCode());
            row.setMetSourceVersion(e.metSourceVersion());
            row.setSets(e.sets());
            row.setReps(e.reps());
            row.setWorkSecondsPerSet(e.workSecondsPerSet());
            row.setRestSeconds(e.restSeconds());
            row.setActiveMinutes(e.activeMinutes());
            row.setCalories(e.calories());
            row.setDataSource(e.dataSource());
            row.setSortOrder(order++);
            rows.add(row);
        }
        logExerciseRepository.saveAll(rows);
    }

    private List<WorkoutPlanItem> planItemsFor(WorkoutSchedule schedule) {
        if (schedule.getPlan() == null) return List.of();
        int dayOfWeek = schedule.getStartTime().getDayOfWeek().getValue();
        return schedule.getPlan().getItems().stream()
                .filter(item -> item.getDayOfWeek() != null && item.getDayOfWeek() == dayOfWeek)
                .sorted(Comparator.comparing(WorkoutPlanItem::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .toList();
    }

    private CalorieEstimate.ExerciseEstimate estimateItem(WorkoutPlanItem item, ExerciseIntensity intensity, Double weight) {
        Exercise exercise = item.getExercise();
        if (exercise == null) return null;
        ActivityCategory category = ExerciseCalorieClassifier.classify(exercise);
        MetReference metRef = metReferenceService.get(category, intensity);
        double met = metRef.getMetValue();

        boolean timeBasedReps = isTimeBased(item.getReps());
        Double activeMinutes;
        if (timeBasedReps) {
            activeMinutes = MetCalorieCalculator.strengthBlockMinutes(item.getSets(), item.getReps(), item.getRestSeconds());
        } else if (isCardioLike(category)) {
            activeMinutes = item.getDurationMinutes() == null ? null : item.getDurationMinutes().doubleValue();
        } else {
            activeMinutes = MetCalorieCalculator.strengthBlockMinutes(item.getSets(), item.getReps(), item.getRestSeconds());
            if (activeMinutes == null && item.getDurationMinutes() != null) {
                activeMinutes = item.getDurationMinutes().doubleValue();
            }
        }
        if (activeMinutes == null || activeMinutes <= 0) return null;

        Integer workSeconds = MetCalorieCalculator.workSecondsPerSet(item.getReps());
        Double rawCalories = weight == null ? null
                : MetCalorieCalculator.calories(met, weight, activeMinutes);
        Integer calories = rawCalories == null ? null : MetCalorieCalculator.roundKcal(rawCalories);

        return new CalorieEstimate.ExerciseEstimate(
                exercise, exercise.getName(), category, intensity, met,
                metRef.getSourceCode(), metRef.getSourceVersion(),
                item.getSets(), item.getReps(), workSeconds, item.getRestSeconds(),
                round1(activeMinutes), calories, "PLAN");
    }

    private CalorieEstimate.ExerciseEstimate fallbackEstimate(int durationMinutes, Double weight) {
        ActivityCategory category = ActivityCategory.OTHER;
        ExerciseIntensity intensity = ExerciseIntensity.MODERATE;
        MetReference metRef = metReferenceService.get(category, intensity);
        double met = metRef.getMetValue();
        Double active = (double) durationMinutes;
        Double rawCalories = weight == null ? null : MetCalorieCalculator.calories(met, weight, active);
        Integer calories = rawCalories == null ? null : MetCalorieCalculator.roundKcal(rawCalories);
        return new CalorieEstimate.ExerciseEstimate(
                null, "Hoạt động tập luyện chung", category, intensity, met,
                metRef.getSourceCode(), metRef.getSourceVersion(),
                null, null, null, null, round1(active), calories, "FALLBACK");
    }

    /** Phần còn lại của buổi ngoài các bài trong giáo án: khởi động, chuyển máy, giãn cơ – mức nhẹ. */
    private CalorieEstimate.ExerciseEstimate transitionEstimate(double minutes, Double weight) {
        ActivityCategory category = ActivityCategory.OTHER;
        ExerciseIntensity intensity = ExerciseIntensity.LIGHT;
        MetReference metRef = metReferenceService.get(category, intensity);
        double met = metRef.getMetValue();
        Double rawCalories = weight == null ? null : MetCalorieCalculator.calories(met, weight, minutes);
        Integer calories = rawCalories == null ? null : MetCalorieCalculator.roundKcal(rawCalories);
        return new CalorieEstimate.ExerciseEstimate(
                null, TRANSITION_NAME, category, intensity, met,
                metRef.getSourceCode(), metRef.getSourceVersion(),
                null, null, null, null, minutes, calories, "FALLBACK");
    }

    private CalorieEstimate.ExerciseEstimate scale(CalorieEstimate.ExerciseEstimate e, double factor, Double weight) {
        double active = round1(e.activeMinutes() * factor);
        Double rawCalories = weight == null ? null : MetCalorieCalculator.calories(e.metValue(), weight, active);
        Integer calories = rawCalories == null ? null : MetCalorieCalculator.roundKcal(rawCalories);
        return new CalorieEstimate.ExerciseEstimate(
                e.exercise(), e.exerciseName(), e.activityCategory(), e.intensity(), e.metValue(),
                e.metSourceCode(), e.metSourceVersion(), e.sets(), e.reps(), e.workSecondsPerSet(),
                e.restSeconds(), active, calories, e.dataSource());
    }

    private static boolean isCardioLike(ActivityCategory category) {
        return category != ActivityCategory.RESISTANCE && category != ActivityCategory.OTHER;
    }

    private static boolean isTimeBased(String reps) {
        if (reps == null) return false;
        String s = reps.trim().toLowerCase();
        return s.endsWith("s") || s.contains("giây") || s.contains("phút") || s.contains("min");
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
