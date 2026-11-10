package com.gymflow.repository;

import com.gymflow.domain.ExerciseMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseMediaRepository extends JpaRepository<ExerciseMedia, Long> {
    List<ExerciseMedia> findByExerciseIdOrderByCoverDescIdAsc(Long exerciseId);
}
