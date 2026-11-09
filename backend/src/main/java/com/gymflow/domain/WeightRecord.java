package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "weight_records")
@Getter
@Setter
@NoArgsConstructor
public class WeightRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate;

    @Column(name = "weight_kg", nullable = false)
    private Double weightKg;

    @Column(name = "body_fat")
    private Double bodyFat;

    /** Số đo vòng (cm), không bắt buộc */
    @Column(name = "waist_cm")
    private Double waistCm;

    @Column(name = "chest_cm")
    private Double chestCm;

    @Column(name = "arm_cm")
    private Double armCm;

    @Column(name = "thigh_cm")
    private Double thighCm;

    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
