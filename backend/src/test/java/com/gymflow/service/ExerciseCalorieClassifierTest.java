package com.gymflow.service;

import com.gymflow.domain.ActivityCategory;
import com.gymflow.domain.Exercise;
import com.gymflow.domain.MuscleGroup;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ExerciseCalorieClassifierTest {

    private static Exercise exercise(String name, String equipment, MuscleGroup group) {
        Exercise e = new Exercise();
        e.setName(name);
        e.setEquipment(equipment);
        e.setMuscleGroup(group);
        return e;
    }

    @Test
    @DisplayName("Nhận diện chạy bộ, đi bộ, đạp xe, nhảy dây, HIIT")
    void classifiesCardioTypes() {
        assertThat(ExerciseCalorieClassifier.classify(exercise("Treadmill Run", "treadmill", MuscleGroup.CARDIO)))
                .isEqualTo(ActivityCategory.RUNNING);
        assertThat(ExerciseCalorieClassifier.classify(exercise("Đi bộ nhanh", null, MuscleGroup.CARDIO)))
                .isEqualTo(ActivityCategory.WALKING);
        assertThat(ExerciseCalorieClassifier.classify(exercise("Đạp xe", "bike", MuscleGroup.CARDIO)))
                .isEqualTo(ActivityCategory.CYCLING);
        assertThat(ExerciseCalorieClassifier.classify(exercise("Jump Rope", "rope", MuscleGroup.CARDIO)))
                .isEqualTo(ActivityCategory.JUMP_ROPE);
        assertThat(ExerciseCalorieClassifier.classify(exercise("Burpee HIIT", "body weight", MuscleGroup.FULL_BODY)))
                .isEqualTo(ActivityCategory.HIIT);
    }

    @Test
    @DisplayName("Bài tập tạ/kháng lực mặc định là RESISTANCE")
    void classifiesResistance() {
        assertThat(ExerciseCalorieClassifier.classify(exercise("Bench Press", "barbell", MuscleGroup.CHEST)))
                .isEqualTo(ActivityCategory.RESISTANCE);
        assertThat(ExerciseCalorieClassifier.classify(exercise("Squat", "barbell", MuscleGroup.LEGS)))
                .isEqualTo(ActivityCategory.RESISTANCE);
    }

    @Test
    @DisplayName("Cardio không khớp từ khoá cụ thể vẫn là CARDIO")
    void classifiesGenericCardio() {
        assertThat(ExerciseCalorieClassifier.classify(exercise("Jumping Jacks", "body weight", MuscleGroup.CARDIO)))
                .isEqualTo(ActivityCategory.CARDIO);
        assertThat(ExerciseCalorieClassifier.classify(null)).isEqualTo(ActivityCategory.OTHER);
    }
}
