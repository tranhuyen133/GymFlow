package com.gymflow.repository;

import com.gymflow.domain.EstimateStatus;
import com.gymflow.domain.WorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, Long> {
    Optional<WorkoutLog> findByScheduleId(Long scheduleId);

    List<WorkoutLog> findByMemberIdOrderByCompletedAtDesc(Long memberId);

    List<WorkoutLog> findByMemberIdAndCompletedAtBetween(Long memberId, LocalDateTime from, LocalDateTime to);

    List<WorkoutLog> findByMemberIdAndCompletedAtBetweenOrderByCompletedAtAsc(Long memberId, LocalDateTime from, LocalDateTime to);

    List<WorkoutLog> findByMemberIdAndCompletedAtBetweenOrderByCompletedAtDesc(Long memberId, LocalDateTime from, LocalDateTime to);

    List<WorkoutLog> findByMemberIdAndCompletedAtBetweenAndEstimatedTrueAndEstimateStatusOrderByCompletedAtAsc(
            Long memberId, LocalDateTime from, LocalDateTime to, EstimateStatus estimateStatus);

    /**
     * Log lịch sử chưa từng được ước tính (dùng cho backfill một lần khi khởi động).
     * V25 đã set calculated_at = completed_at cho log LEGACY nên dùng formula_version IS NULL làm mốc.
     */
    List<WorkoutLog> findByEstimateStatusAndFormulaVersionIsNullOrderByCompletedAtAsc(EstimateStatus estimateStatus);

    /** Buổi chưa ước tính của một hội viên (dùng khi tính lại sau khi nhập cân nặng). */
    List<WorkoutLog> findByMemberIdAndEstimatedFalseAndEstimateStatusInOrderByCompletedAtAsc(
            Long memberId, Collection<EstimateStatus> estimateStatuses);
}
