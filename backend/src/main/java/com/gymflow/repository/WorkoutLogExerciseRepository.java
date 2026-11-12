package com.gymflow.repository;

import com.gymflow.domain.WorkoutLogExercise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutLogExerciseRepository extends JpaRepository<WorkoutLogExercise, Long> {
    List<WorkoutLogExercise> findByWorkoutLogIdOrderBySortOrderAsc(Long workoutLogId);
}
