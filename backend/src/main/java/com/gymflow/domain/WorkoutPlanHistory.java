package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "workout_plan_history")
@Getter
@Setter
@NoArgsConstructor
public class WorkoutPlanHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "old_plan_id")
    private WorkoutPlan oldPlan;

    @Column(name = "old_plan_name", length = 120)
    private String oldPlanName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "new_plan_id", nullable = false)
    private WorkoutPlan newPlan;

    @Column(name = "new_plan_name", nullable = false, length = 120)
    private String newPlanName;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "cancelled_future_sessions", nullable = false)
    private int cancelledFutureSessions = 0;

    @Column(length = 255)
    private String note;

    @PrePersist
    void onCreate() {
        if (appliedAt == null) appliedAt = LocalDateTime.now();
    }
}
