package com.gymflow.service;

import com.gymflow.domain.ActivityCategory;
import com.gymflow.domain.EstimateQuality;
import com.gymflow.domain.EstimateStatus;
import com.gymflow.domain.Exercise;
import com.gymflow.domain.ExerciseIntensity;

import java.util.List;

/** Kết quả ước tính calo cho một buổi tập, dùng nội bộ giữa service và mapper. */
public record CalorieEstimate(
        EstimateStatus status,
        EstimateQuality quality,
        Double weightKg,
        String weightSource,
        ExerciseIntensity intensity,
        Double activeMinutes,
        Integer totalCalories,
        List<ExerciseEstimate> exercises) {

    public record ExerciseEstimate(
            Exercise exercise,
            String exerciseName,
            ActivityCategory activityCategory,
            ExerciseIntensity intensity,
            Double metValue,
            String metSourceCode,
            String metSourceVersion,
            Integer sets,
            String reps,
            Integer workSecondsPerSet,
            Integer restSeconds,
            Double activeMinutes,
            Integer calories,
            String dataSource) {
    }
}
