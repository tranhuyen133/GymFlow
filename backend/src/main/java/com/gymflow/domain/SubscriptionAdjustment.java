package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** V49 · Một lần đổi thời gian gói: trước / sau, lý do, ai đổi. Không sửa, không xoá. */
@Entity
@Table(name = "subscription_adjustments")
@Getter
@Setter
@NoArgsConstructor
public class SubscriptionAdjustment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscription_id", nullable = false)
    private MemberSubscription subscription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AdjustmentSource source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id")
    private SubscriptionChangeRequest changeRequest;

    @Column(name = "old_start_date", nullable = false)
    private LocalDate oldStartDate;

    @Column(name = "old_end_date", nullable = false)
    private LocalDate oldEndDate;

    @Column(name = "new_start_date", nullable = false)
    private LocalDate newStartDate;

    @Column(name = "new_end_date", nullable = false)
    private LocalDate newEndDate;

    @Column(name = "old_pt_valid_until")
    private LocalDate oldPtValidUntil;

    @Column(name = "new_pt_valid_until")
    private LocalDate newPtValidUntil;

    @Column(nullable = false, length = 255)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
