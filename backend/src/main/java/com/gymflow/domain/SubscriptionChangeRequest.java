package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** V49 · Hội viên xin dời ngày bắt đầu / bảo lưu / đổi HLV; chỉ có hiệu lực khi quản lý duyệt. */
@Entity
@Table(name = "subscription_change_requests")
@Getter
@Setter
@NoArgsConstructor
public class SubscriptionChangeRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscription_id", nullable = false)
    private MemberSubscription subscription;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 20)
    private ChangeRequestType changeType;

    @Column(name = "new_start_date")
    private LocalDate newStartDate;

    @Column(name = "pause_days")
    private Integer pauseDays;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id")
    private Trainer trainer;

    /** Thời gian gói lúc gửi yêu cầu, để quản lý so trước / sau. */
    @Column(name = "old_start_date", nullable = false)
    private LocalDate oldStartDate;

    @Column(name = "old_end_date", nullable = false)
    private LocalDate oldEndDate;

    @Column(nullable = false, length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PackageRequestStatus status = PackageRequestStatus.PENDING;

    @Column(name = "decision_note", length = 255)
    private String decisionNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private User decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public boolean isPending() {
        return status == PackageRequestStatus.PENDING;
    }
}
