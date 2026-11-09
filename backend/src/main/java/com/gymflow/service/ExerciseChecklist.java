package com.gymflow.service;

import com.gymflow.domain.Exercise;

import java.util.ArrayList;
import java.util.List;

/**
 * Điều kiện tối thiểu để quản lý duyệt một bài tập. Trùng với checklist ở Exercises.tsx (REVIEW_CHECKS).
 * Phần đối chiếu nội dung với trang nguồn vẫn do quản lý tự kiểm tra và tick trên giao diện.
 */
final class ExerciseChecklist {
    static final int MIN_DESCRIPTION = 20;
    static final int MIN_STEPS = 2;

    private ExerciseChecklist() {
    }

    /** Danh sách mục còn thiếu; rỗng = đủ điều kiện duyệt. */
    static List<String> missing(Exercise e) {
        List<String> out = new ArrayList<>();
        if (e.getSources() == null || e.getSources().isEmpty()) out.add("chưa gắn nguồn tham khảo");
        if (blank(e.getDescription()) || e.getDescription().trim().length() < MIN_DESCRIPTION) {
            out.add("mô tả ngắn cần từ " + MIN_DESCRIPTION + " ký tự");
        }
        if (steps(e.getInstructions()) < MIN_STEPS) out.add("hướng dẫn cần ít nhất " + MIN_STEPS + " bước, mỗi bước một dòng");
        if (blank(e.getSafetyNotes())) out.add("chưa có lưu ý an toàn");
        if (e.getLocation() == null) out.add("chưa chọn nơi tập");
        if (blank(e.getGoals())) out.add("chưa chọn mục tiêu");
        return out;
    }

    static int steps(String instructions) {
        if (blank(instructions)) return 0;
        return (int) instructions.lines().map(String::trim).filter(l -> !l.isEmpty()).count();
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
