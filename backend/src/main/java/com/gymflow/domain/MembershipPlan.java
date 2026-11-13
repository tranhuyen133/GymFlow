package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "membership_plans")
@Getter
@Setter
@NoArgsConstructor
public class MembershipPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_en", length = 100)
    private String nameEn;

    private String description;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(nullable = false)
    private Long price;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    private String benefits;

    @Column(name = "benefits_en", columnDefinition = "TEXT")
    private String benefitsEn;

    /** Gói có HLV kèm (PT): hội viên chọn HLV khi gửi đơn. Không kèm: hội viên tự soạn giáo án, tự xếp lịch (V12). */
    @Column(name = "includes_trainer", nullable = false)
    private boolean includesTrainer;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false, length = 10)
    private PlanType planType = PlanType.GYM;

    @Column(name = "pt_sessions")
    private Integer ptSessions;

    @Column(name = "pt_valid_days")
    private Integer ptValidDays;

    /** V24 · mã gói cho quầy và báo cáo, không bắt buộc. */
    @Column(length = 30)
    private String code;

    /** V24 · thời lượng một buổi PT (phút); null = chưa khai báo. */
    @Column(name = "pt_session_minutes")
    private Integer ptSessionMinutes;

    /** V24 · số giờ tối thiểu phải báo trước khi huỷ/dời buổi PT; null = chưa khai báo. */
    @Column(name = "pt_cancel_notice_hours")
    private Integer ptCancelNoticeHours;

    /** V24 · điều kiện sử dụng (đặt lịch, đổi HLV, bảo lưu...) do quản lý nhập. */
    @Column(name = "usage_terms", length = 1000)
    private String usageTerms;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<PlanServiceGrant> serviceGrants = new java.util.ArrayList<>();

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
