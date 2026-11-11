package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "workout_logs")
@Getter
@Setter
@NoArgsConstructor
public class WorkoutLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private WorkoutSchedule schedule;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt = LocalDateTime.now();

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    private Integer calories;

    @Column(name = "weight_kg_used")
    private Double weightKgUsed;

    @Column(name = "active_minutes")
    private Double activeMinutes;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ExerciseIntensity intensity;

    @Column(name = "met_method", length = 40)
    private String metMethod;

    @Column(name = "formula_version", length = 40)
    private String formulaVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estimate_status", nullable = false, length = 20)
    private EstimateStatus estimateStatus = EstimateStatus.LEGACY;

    @Enumerated(EnumType.STRING)
    @Column(name = "estimate_quality", length = 20)
    private EstimateQuality estimateQuality;

    @Column(nullable = false)
    private boolean estimated = false;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    /** 1–5 sao, hội viên tự đánh giá buổi tập */
    private Integer rating;

    private String note;
}
