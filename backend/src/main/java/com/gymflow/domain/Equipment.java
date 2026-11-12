package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "equipment")
@Getter
@Setter
@NoArgsConstructor
public class Equipment {

    @Id
    @Column(name = "`key`", length = 30)
    private String key;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EquipmentCategory category;

    @Column(name = "short_desc")
    private String shortDesc;

    @Column(name = "usage_guide", columnDefinition = "TEXT")
    private String usageGuide;

    /** TASK 01 / SCRUM-229: Hướng dẫn điều chỉnh ghế, chốt, ròng rọc. */
    @Column(name = "adjust_guide", columnDefinition = "TEXT")
    private String adjustGuide;

    /** TASK 01 / SCRUM-229: Lỗi thường gặp khi thao tác thiết bị. */
    @Column(name = "common_mistakes", columnDefinition = "TEXT")
    private String commonMistakes;

    @Column(name = "safety_notes", columnDefinition = "TEXT")
    private String safetyNotes;

    @Column(name = "target_muscle_keys")
    private String targetMuscleKeys;

    @Column(name = "image_key", length = 100)
    private String imageKey;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(nullable = false)
    private boolean hidden = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 20)
    private ReviewStatus reviewStatus = ReviewStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentOrigin origin = ContentOrigin.SELF_AUTHORED;

    /** Quan hệ nhiều-nhiều hai chiều với bảng exercises. */
    @ManyToMany(mappedBy = "equipments")
    private Set<Exercise> exercises = new LinkedHashSet<>();

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
