package com.gymflow.dto;

import com.gymflow.domain.EquipmentCategory;
import com.gymflow.domain.MuscleGroup;
import com.gymflow.dto.Dtos.EquipmentResponse;
import com.gymflow.dto.Dtos.ExerciseResponse;

import java.util.List;

/**
 * DTOs cho phân hệ Kho kiến thức (TASK 01 / SCRUM-229).
 */
public final class KnowledgeDtos {

    private KnowledgeDtos() {}

    public record EquipmentSummary(
            String key,
            String name,
            EquipmentCategory category,
            String imageKey
    ) {}

    public record MuscleSummaryResponse(
            String key,
            String name,
            String nameEn,
            MuscleGroup group,
            String view,
            String hint,
            long exerciseCount
    ) {}

    public record MuscleDetailResponse(
            String key,
            String name,
            String nameEn,
            MuscleGroup group,
            String view,
            String hint,
            String description,
            long exerciseCount,
            List<ExerciseResponse> primaryExercises,
            List<ExerciseResponse> secondaryExercises,
            List<EquipmentResponse> commonEquipment
    ) {}

    public record FavoriteToggleResponse(
            Long exerciseId,
            boolean isFavorite,
            long favoriteCount,
            String message
    ) {
        public FavoriteToggleResponse(Long exerciseId, boolean isFavorite, long favoriteCount) {
            this(exerciseId, isFavorite, favoriteCount, isFavorite ? "Đã lưu vào bài tập yêu thích" : "Đã bỏ lưu khỏi bài tập yêu thích");
        }
    }
}
