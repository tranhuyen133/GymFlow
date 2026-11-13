package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
public class Exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã định danh từ dataset mở (nếu có) phục vụ đồng bộ dữ liệu idempotent. */
    @Column(name = "external_id", length = 40)
    private String externalId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "name_en", length = 120)
    private String nameEn;

    /** Tên gọi khác, cách nhau bởi dấu phẩy – dùng cho tìm kiếm. */
    private String aliases;

    /** TASK 01 / SCRUM-229: Loại bài tập bắt buộc phân biệt (STRENGTH / WARMUP / CARDIO). */
    @Enumerated(EnumType.STRING)
    @Column(name = "exercise_type", nullable = false, length = 20)
    private ExerciseType exerciseType = ExerciseType.STRENGTH;

    /** Danh mục con chi tiết (VD: CHEST, SHOULDER_WARMUP, HIIT, LISS...). */
    @Column(name = "sub_category", length = 60)
    private String subCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "muscle_group", nullable = false)
    private MuscleGroup muscleGroup;

    @Column(name = "secondary_muscles")
    private String secondaryMuscles;

    /** V13 · vùng cơ chính trên bản đồ cơ thể, khoá cách nhau dấu phẩy (VD "chest,triceps"). */
    @Column(name = "target_muscles", length = 160)
    private String targetMuscles;

    /** V13 · vùng cơ phụ trên bản đồ cơ thể. */
    @Column(name = "secondary_muscle_keys", length = 160)
    private String secondaryMuscleKeys;

    private String equipment;

    /** V13 · khoá dụng cụ (barbell, dumbbell, machine…), cách nhau dấu phẩy. */
    @Column(name = "equipment_keys", length = 120)
    private String equipmentKeys;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Level level = Level.BEGINNER;

    @Enumerated(EnumType.STRING)
    private ExerciseLocation location;

    /** Danh sách {@link ExerciseGoal} cách nhau bởi dấu phẩy. */
    private String goals;

    @Enumerated(EnumType.STRING)
    @Column(name = "primary_goal", length = 20)
    private ExerciseGoal primaryGoal;

    private String description;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    private String instructions;

    @Column(name = "setup_position", columnDefinition = "TEXT")
    private String setupPosition;

    @Column(columnDefinition = "TEXT")
    private String steps;

    private String breathing;

    @Column(name = "common_mistakes")
    private String commonMistakes;

    @Column(name = "safety_notes")
    private String safetyNotes;

    private String variations;

    @Column(name = "suggested_dose")
    private String suggestedDose;

    @Column(name = "sets_reps_hint", length = 100)
    private String setsRepsHint;

    @Column(name = "video_url")
    private String videoUrl;

    /** V13 · thư mục ảnh minh hoạ /exercise-img/{imageKey}/0.jpg và 1.jpg. */
    @Column(name = "image_key", length = 80)
    private String imageKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_origin", nullable = false)
    private ContentOrigin contentOrigin = ContentOrigin.SELF_AUTHORED;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false)
    private ReviewStatus reviewStatus = ReviewStatus.PENDING;

    @Column(name = "review_note")
    private String reviewNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToMany
    @JoinTable(name = "exercise_sources",
            joinColumns = @JoinColumn(name = "exercise_id"),
            inverseJoinColumns = @JoinColumn(name = "source_id"))
    private Set<ContentSource> sources = new LinkedHashSet<>();

    @ManyToMany
    @JoinTable(name = "exercise_alternatives",
            joinColumns = @JoinColumn(name = "exercise_id"),
            inverseJoinColumns = @JoinColumn(name = "alternative_id"))
    private Set<Exercise> alternatives = new LinkedHashSet<>();

    /** TASK 01 / SCRUM-229: Quan hệ nhiều-nhiều hai chiều với bảng equipment. */
    @ManyToMany
    @JoinTable(name = "exercise_equipment",
            joinColumns = @JoinColumn(name = "exercise_id"),
            inverseJoinColumns = @JoinColumn(name = "equipment_key"))
    private Set<Equipment> equipments = new LinkedHashSet<>();

    /** Bài tập đã nằm trong kế hoạch thì chỉ ẩn, không xoá cứng. */
    @Column(nullable = false)
    private boolean hidden = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
