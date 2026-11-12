package com.gymflow.service;

import com.gymflow.domain.ActivityCategory;
import com.gymflow.domain.Exercise;
import com.gymflow.domain.MuscleGroup;

import java.util.Locale;

/**
 * Phân loại bài tập vào nhóm hoạt động để tra MET.
 * Quy tắc ưu tiên tên bài/thiết bị trước, sau đó mới dựa vào nhóm cơ.
 * Đây chỉ là phân loại hoạt động; giá trị MET lấy từ bảng met_reference.
 */
public final class ExerciseCalorieClassifier {

    private ExerciseCalorieClassifier() {
    }

    public static ActivityCategory classify(Exercise exercise) {
        if (exercise == null) return ActivityCategory.OTHER;
        String text = String.join(" ",
                nz(exercise.getName()),
                nz(exercise.getNameEn()),
                nz(exercise.getAliases()),
                nz(exercise.getEquipment()),
                nz(exercise.getEquipmentKeys())).toLowerCase(Locale.ROOT);

        if (containsAny(text, "jump rope", "skipping", "nhảy dây", "rope jump")) {
            return ActivityCategory.JUMP_ROPE;
        }
        if (containsAny(text, "hiit", "burpee", "tabata", "circuit", "bootcamp")) {
            return ActivityCategory.HIIT;
        }
        if (containsAny(text, "run", "chạy", "jog", "treadmill", "sprint")) {
            return ActivityCategory.RUNNING;
        }
        if (containsAny(text, "walk", "đi bộ", "hiking", "đi dạo")) {
            return ActivityCategory.WALKING;
        }
        if (containsAny(text, "bike", "cycle", "cycling", "đạp xe", "spinning", "bicycle")) {
            return ActivityCategory.CYCLING;
        }
        if (exercise.getMuscleGroup() == MuscleGroup.CARDIO) {
            return ActivityCategory.CARDIO;
        }
        if (containsAny(text, "cardio")) {
            return ActivityCategory.CARDIO;
        }
        return ActivityCategory.RESISTANCE;
    }

    private static boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) return true;
        }
        return false;
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }
}
