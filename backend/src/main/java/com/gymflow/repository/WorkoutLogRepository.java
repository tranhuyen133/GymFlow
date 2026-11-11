package com.gymflow.repository;

import com.gymflow.domain.EstimateStatus;
import com.gymflow.domain.WorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
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
}
