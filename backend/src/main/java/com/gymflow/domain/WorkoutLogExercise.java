package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Snapshot chi tiết một bài tập đã thực hiện trong buổi, phục vụ truy vết calo. */
@Entity
@Table(name = "workout_log_exercises",
        uniqueConstraints = @UniqueConstraint(name = "uq_wle_log_order", columnNames = {"workout_log_id", "sort_order"}))
@Getter
@Setter
@NoArgsConstructor
public class WorkoutLogExercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workout_log_id", nullable = false)
    private WorkoutLog workoutLog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id")
    private Exercise exercise;

    @Column(name = "exercise_name", nullable = false, length = 120)
    private String exerciseName;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_category", nullable = false, length = 30)
    private ActivityCategory activityCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExerciseIntensity intensity;

    @Column(name = "met_value", nullable = false)
    private Double metValue;

    @Column(name = "met_source_code", length = 30)
    private String metSourceCode;

    @Column(name = "met_source_version", length = 20)
    private String metSourceVersion;

    private Integer sets;

    @Column(length = 20)
    private String reps;

    @Column(name = "work_seconds_per_set")
    private Integer workSecondsPerSet;

    @Column(name = "rest_seconds")
    private Integer restSeconds;

    @Column(name = "active_minutes", nullable = false)
    private Double activeMinutes = 0d;

    private Integer calories;

    /** PLAN = lấy từ giáo án; FALLBACK = ước tính thô toàn buổi. */
    @Column(name = "data_source", nullable = false, length = 20)
    private String dataSource = "PLAN";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
