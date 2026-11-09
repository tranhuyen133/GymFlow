package com.gymflow.repository;

import com.gymflow.domain.WorkoutPlanHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutPlanHistoryRepository extends JpaRepository<WorkoutPlanHistory, Long> {
    List<WorkoutPlanHistory> findByMemberIdOrderByAppliedAtDesc(Long memberId);
}
