package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Bảng tra MET theo loại hoạt động và cường độ, kèm nguồn trích dẫn. */
@Entity
@Table(name = "met_reference")
@Getter
@Setter
@NoArgsConstructor
public class MetReference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_category", nullable = false, length = 30)
    private ActivityCategory activityCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExerciseIntensity intensity;

    @Column(name = "met_value", nullable = false)
    private Double metValue;

    @Column(name = "source_code", nullable = false, length = 30)
    private String sourceCode;

    @Column(name = "source_version", nullable = false, length = 20)
    private String sourceVersion = "2011";

    @Column(name = "source_url", length = 255)
    private String sourceUrl;

    @Column(nullable = false, length = 255)
    private String citation;

    @Column(length = 255)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
