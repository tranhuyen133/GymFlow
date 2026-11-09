package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Đơn hội viên tự đăng ký gói (V4). Giá / tên gói / thời hạn chốt lúc gửi đơn. */
@Entity
@Table(name = "package_requests")
@Getter
@Setter
@NoArgsConstructor
public class PackageRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private MembershipPlan plan;

    /** HLV hội viên chọn cho gói có PT (V12); duyệt đơn thì HLV này được gán cho hội viên. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id")
    private Trainer trainer;

    @Column(name = "plan_name", nullable = false, length = 100)
    private String planName;

    @Column(nullable = false)
    private Long price;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "desired_start_date")
    private LocalDate desiredStartDate;

    @Column(name = "member_note")
    private String memberNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod = PaymentMethod.COUNTER;

    /** Nội dung chuyển khoản GF000123, sinh theo id đơn nên không trùng. */
    @Column(name = "payment_code", length = 20)
    private String paymentCode;

    /** Lúc hội viên bấm "Tôi đã chuyển khoản" – chỉ là lời báo, quản lý vẫn phải đối chiếu tài khoản trước khi duyệt. */
    @Column(name = "member_paid_at")
    private LocalDateTime memberPaidAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PackageRequestStatus status = PackageRequestStatus.PENDING;

    @Column(name = "decision_note")
    private String decisionNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private User decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private MemberSubscription subscription;

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
