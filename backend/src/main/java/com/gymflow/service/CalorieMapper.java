package com.gymflow.service;

import com.gymflow.domain.WorkoutLog;
import com.gymflow.domain.WorkoutLogExercise;
import com.gymflow.domain.WorkoutSchedule;
import com.gymflow.dto.Dtos.CalorieExerciseResponse;
import com.gymflow.dto.Dtos.CaloriePreviewResponse;
import com.gymflow.dto.Dtos.CalorieSessionResponse;

import java.util.List;

public final class CalorieMapper {

    private CalorieMapper() {
    }

    public static CalorieExerciseResponse exercise(CalorieEstimate.ExerciseEstimate e) {
        return new CalorieExerciseResponse(
                e.exercise() == null ? null : e.exercise().getId(),
                e.exerciseName(), e.exercise() == null ? null : e.exercise().getNameEn(), e.activityCategory(), e.intensity(), e.metValue(),
                e.metSourceCode(), e.metSourceVersion(), e.sets(), e.reps(),
                e.workSecondsPerSet(), e.restSeconds(), e.activeMinutes(), e.calories(), e.dataSource());
    }

    public static List<CalorieExerciseResponse> exercises(List<CalorieEstimate.ExerciseEstimate> list) {
        return list.stream().map(CalorieMapper::exercise).toList();
    }

    public static CaloriePreviewResponse preview(WorkoutSchedule schedule, int durationMinutes, CalorieEstimate est) {
        return new CaloriePreviewResponse(
                schedule.getId(), schedule.getTitle(), schedule.getStartTime().toLocalDate(), durationMinutes,
                est.weightKg(), est.weightSource(), est.intensity(), exercises(est.exercises()),
                est.totalCalories(), est.activeMinutes(), est.status(), est.quality(),
                CalorieEstimationService.DISCLAIMER, schedule.getTitleEn());
    }

    public static CalorieSessionResponse session(WorkoutLog log, List<WorkoutLogExercise> rows) {
        String title = log.getSchedule() == null ? "Buổi tập" : log.getSchedule().getTitle();
        String titleEn = log.getSchedule() == null ? "Workout session" : log.getSchedule().getTitleEn();
        List<CalorieExerciseResponse> exercises = rows.stream()
                .map(CalorieMapper::exercise)
                .toList();
        return new CalorieSessionResponse(
                log.getId(),
                log.getSchedule() == null ? null : log.getSchedule().getId(),
                title,
                log.getCompletedAt(),
                log.getDurationMinutes(),
                log.getActiveMinutes(),
                log.getCalories(),
                log.getIntensity(),
                log.getWeightKgUsed(),
                log.getEstimateStatus(),
                log.getEstimateQuality(),
                log.getFormulaVersion(),
                exercises,
                titleEn);
    }

    private static CalorieExerciseResponse exercise(WorkoutLogExercise e) {
        return new CalorieExerciseResponse(
                e.getExercise() == null ? null : e.getExercise().getId(),
                e.getExerciseName(), e.getExercise() == null ? null : e.getExercise().getNameEn(), e.getActivityCategory(), e.getIntensity(), e.getMetValue(),
                e.getMetSourceCode(), e.getMetSourceVersion(), e.getSets(), e.getReps(),
                e.getWorkSecondsPerSet(), e.getRestSeconds(), e.getActiveMinutes(), e.getCalories(), e.getDataSource());
    }
}
