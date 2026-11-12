package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Bài tập yêu thích của hội viên (TASK 01 / SCRUM-229).
 */
@Entity
@Table(name = "member_favorite_exercises",
        uniqueConstraints = @UniqueConstraint(name = "uq_mfe_member_exercise", columnNames = {"member_id", "exercise_id"}))
@Getter
@Setter
@NoArgsConstructor
public class MemberFavoriteExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public MemberFavoriteExercise(Member member, Exercise exercise) {
        this.member = member;
        this.exercise = exercise;
        this.createdAt = LocalDateTime.now();
    }
}
