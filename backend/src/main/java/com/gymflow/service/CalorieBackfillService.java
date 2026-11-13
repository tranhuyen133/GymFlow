package com.gymflow.service;

import com.gymflow.domain.EstimateStatus;
import com.gymflow.domain.ScheduleStatus;
import com.gymflow.domain.WorkoutLog;
import com.gymflow.domain.WorkoutSchedule;
import com.gymflow.dto.Dtos.CalorieBackfillResponse;
import com.gymflow.repository.WorkoutLogExerciseRepository;
import com.gymflow.repository.WorkoutLogRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Backfill calo MET cho các buổi tập đã hoàn thành trước khi có tính năng ước tính.
 *
 * <p>Nguyên tắc:
 * <ul>
 *   <li>Chỉ xử lý log của buổi {@code COMPLETED}; không đụng buổi huỷ / vắng.</li>
 *   <li>Bỏ qua log đã ước tính thành công ({@code OK}) để không tính lại lịch sử khi cân nặng đổi.</li>
 *   <li>Giữ calo nhập tay cũ trong {@code legacy_calories} trước khi ghi đè.</li>
 *   <li>Idempotent: mỗi buổi chỉ có một log (ràng buộc UNIQUE schedule_id), chạy lại không ghi trùng.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CalorieBackfillService {

    public static final String FORMULA_VERSION = "MET-COMPENDIUM-2011-v2-backfill";
    public static final String MET_METHOD = "MET_COMPENDIUM_2011_BACKFILL";

    /** Công thức v1 chỉ tính vài giây nâng tạ (không tính nghỉ, khởi động) → calo quá thấp, cần tính lại. */
    static final List<String> OUTDATED_VERSIONS = List.of(
            "MET-COMPENDIUM-2011-v1", "MET-COMPENDIUM-2011-v1-backfill");

    private static final Set<EstimateStatus> RETRYABLE = EnumSet.of(
            EstimateStatus.LEGACY, EstimateStatus.MISSING_WEIGHT, EstimateStatus.NO_EXERCISE_DATA);

    private final WorkoutLogRepository logRepository;
    private final WorkoutLogExerciseRepository logExerciseRepository;
    private final CalorieEstimationService estimationService;
    private final AccessService access;

    /** Chạy một lần khi khởi động: chỉ các log LEGACY chưa từng được xử lý. */
    @Transactional
    public CalorieBackfillResponse backfillLegacy() {
        List<WorkoutLog> logs = logRepository
                .findByEstimateStatusAndFormulaVersionIsNullOrderByCompletedAtAsc(EstimateStatus.LEGACY);
        return process(logs);
    }

    /**
     * Chạy khi khởi động: tính lại các log đã ước tính bằng công thức v1.
     * Log hoàn thành trực tiếp giữ cường độ hội viên đã chọn và ghi phiên bản công thức hiện hành;
     * log từng được backfill vẫn đi đường backfill. Idempotent: sau khi chạy, không còn log v1.
     */
    @Transactional
    public CalorieBackfillResponse recomputeOutdated() {
        List<WorkoutLog> logs = logRepository.findByFormulaVersionInOrderByCompletedAtAsc(OUTDATED_VERSIONS);
        int processed = 0;
        int failed = 0;
        for (WorkoutLog entry : logs) {
            WorkoutSchedule schedule = entry.getSchedule();
            try {
                CalorieEstimate estimate;
                String method;
                String version;
                if (schedule == null) {
                    estimate = estimationService.estimateStandalone(
                            entry.getMember(), entry.getCompletedAt().toLocalDate(), durationOf(entry, null));
                    method = MET_METHOD;
                    version = FORMULA_VERSION;
                } else if (OUTDATED_VERSIONS.get(0).equals(entry.getFormulaVersion())) {
                    estimate = estimationService.estimate(schedule, durationOf(entry, schedule), entry.getIntensity());
                    method = CalorieEstimationService.MET_METHOD;
                    version = CalorieEstimationService.FORMULA_VERSION;
                } else {
                    estimate = estimationService.estimateForBackfill(schedule, durationOf(entry, schedule), null);
                    method = MET_METHOD;
                    version = FORMULA_VERSION;
                }
                estimationService.applyToLog(entry, estimate, method, version);
                logRepository.save(entry);
                logExerciseRepository.deleteByWorkoutLogId(entry.getId());
                logExerciseRepository.flush();
                estimationService.saveExercises(entry, estimate);
                processed++;
            } catch (RuntimeException e) {
                failed++;
                log.warn("Tính lại calo lỗi cho workout_log {}: {}", entry.getId(), e.getMessage());
            }
        }
        if (processed > 0 || failed > 0) {
            log.info("Tính lại calo theo công thức mới: {} buổi, lỗi {}", processed, failed);
        }
        return new CalorieBackfillResponse(processed, processed, 0, 0, 0, failed,
                CalorieEstimationService.FORMULA_VERSION);
    }

    /** Tính lại cho một hội viên: Admin/HLV phụ trách hoặc chính hội viên. */
    @Transactional
    public CalorieBackfillResponse recomputeMember(AuthUser user, Long memberId) {
        access.requireView(user, memberId);
        List<WorkoutLog> logs = logRepository
                .findByMemberIdAndEstimatedFalseAndEstimateStatusInOrderByCompletedAtAsc(memberId, RETRYABLE);
        return process(logs);
    }

    private CalorieBackfillResponse process(List<WorkoutLog> logs) {
        int processed = 0;
        int estimated = 0;
        int missingWeight = 0;
        int noData = 0;
        int skipped = 0;
        int failed = 0;

        for (WorkoutLog entry : logs) {
            WorkoutSchedule schedule = entry.getSchedule();
            if (schedule != null && schedule.getStatus() != ScheduleStatus.COMPLETED) {
                skipped++;
                continue;
            }
            try {
                CalorieEstimate estimate;
                if (schedule == null) {
                    estimate = estimationService.estimateStandalone(
                            entry.getMember(), entry.getCompletedAt().toLocalDate(), durationOf(entry, null));
                } else {
                    estimate = estimationService.estimateForBackfill(
                            schedule, durationOf(entry, schedule), null);
                }

                if (entry.getLegacyCalories() == null && entry.getCalories() != null
                        && entry.getFormulaVersion() == null) {
                    entry.setLegacyCalories(entry.getCalories());
                }
                estimationService.applyToLog(entry, estimate, MET_METHOD, FORMULA_VERSION);
                logRepository.save(entry);

                logExerciseRepository.deleteByWorkoutLogId(entry.getId());
                logExerciseRepository.flush();
                estimationService.saveExercises(entry, estimate);

                processed++;
                switch (estimate.status()) {
                    case OK -> estimated++;
                    case MISSING_WEIGHT -> missingWeight++;
                    case NO_EXERCISE_DATA -> noData++;
                    default -> { }
                }
            } catch (RuntimeException e) {
                failed++;
                log.warn("Backfill calo lỗi cho workout_log {}: {}", entry.getId(), e.getMessage());
            }
        }

        if (processed > 0 || failed > 0) {
            log.info("Backfill calo MET: xử lý {}, ước tính OK {}, thiếu cân nặng {}, thiếu dữ liệu {}, "
                            + "bỏ qua {}, lỗi {}",
                    processed, estimated, missingWeight, noData, skipped, failed);
        }
        return new CalorieBackfillResponse(processed, estimated, missingWeight, noData, skipped, failed,
                FORMULA_VERSION);
    }

    private static int durationOf(WorkoutLog entry, WorkoutSchedule schedule) {
        if (entry.getDurationMinutes() != null && entry.getDurationMinutes() > 0) {
            return entry.getDurationMinutes();
        }
        if (schedule != null) {
            long minutes = Duration.between(schedule.getStartTime(), schedule.getEndTime()).toMinutes();
            if (minutes > 0) return (int) minutes;
        }
        return 1;
    }
}
