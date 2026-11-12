package com.gymflow.repository;

import com.gymflow.domain.WorkoutPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WorkoutPlanItemRepository extends JpaRepository<WorkoutPlanItem, Long> {
    boolean existsByExerciseId(Long exerciseId);

    long countByExerciseId(Long exerciseId);

    @Query("SELECT DISTINCT wpi.exercise.id FROM WorkoutPlanItem wpi WHERE wpi.plan.member.id = :memberId AND wpi.plan.status = 'ACTIVE'")
    List<Long> findActiveAssignedExerciseIdsByMemberId(@Param("memberId") Long memberId);
}
