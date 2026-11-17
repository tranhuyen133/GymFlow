package com.gymflow.service;

import com.gymflow.security.AuthUser;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Các câu trả lời sẵn của trợ lý GymFlow. Không gọi AI/API ngoài;
 * mỗi chủ đề được trả lời từ dữ liệu thật của hệ thống theo vai trò người dùng.
 *
 * <p>Trợ lý AI chỉ phục vụ hội viên (Role.MEMBER). Các chủ đề dành cho
 * ADMIN/TRAINER vẫn giữ lại để ChatAssistantService dùng nội bộ
 * (grounding, thống kê) nhưng ChatService sẽ chặn ở tầng API.</p>
 */
public enum ChatTopic {
    SCHEDULE_TODAY("Lịch tập hôm nay", true, true, true),
    SCHEDULE_WEEK("Lịch 7 ngày tới", false, false, true),
    WHO_TODAY("Hôm nay ai tập", true, true, false),
    NEXT_SESSION("Buổi tập kế tiếp", true, true, true),
    MY_PACKAGE("Gói tập còn hạn", false, false, true),
    MY_PLAN("Giáo án của tôi", false, false, true),
    MY_PROGRESS("Cân nặng & tiến độ", false, false, true),
    WORKOUT_HISTORY("Buổi đã tập", false, false, true),
    TODAY_EXERCISES("Bài tập hôm nay", false, false, true),
    PLAN_CATALOG("Gói tập & giá", false, false, true),
    EXERCISE_TIPS("Gợi ý bài tập & nhóm cơ", true, true, true),
    EQUIPMENT_GUIDE("Hướng dẫn sử dụng thiết bị", true, true, true),
    WORKOUT_PLANS("Gợi ý lịch tập mẫu", true, true, true),
    HELP("Hướng dẫn & an toàn", true, true, true);

    private final String label;
    private final boolean admin;
    private final boolean trainer;
    private final boolean member;

    ChatTopic(String label, boolean admin, boolean trainer, boolean member) {
        this.label = label;
        this.admin = admin;
        this.trainer = trainer;
        this.member = member;
    }

    public String key() {
        return name();
    }

    public String label() {
        return label;
    }

    public boolean allowedFor(AuthUser user) {
        if (user == null) return false;
        if (user.isAdmin()) return admin;
        if (user.isTrainer()) return trainer;
        return member;
    }

    public static List<ChatTopic> forUser(AuthUser user) {
        return Arrays.stream(values()).filter(t -> t.allowedFor(user)).toList();
    }

    public static Optional<ChatTopic> parse(String key) {
        if (key == null || key.isBlank()) return Optional.empty();
        try {
            return Optional.of(valueOf(key.trim().toUpperCase(java.util.Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
