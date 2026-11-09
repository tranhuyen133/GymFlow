package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_service_entitlements")
@Getter
@Setter
@NoArgsConstructor
public class MemberServiceEntitlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceItem service;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private EntitlementSource source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private MemberSubscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_request_id")
    private PackageRequest packageRequest;

    @Column(name = "service_name_snapshot", nullable = false, length = 100)
    private String serviceNameSnapshot;

    @Column(name = "granted_qty", nullable = false)
    private int grantedQty;

    @Column(name = "used_qty", nullable = false)
    private int usedQty = 0;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Column(name = "conditions_snapshot", length = 255)
    private String conditionsSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private EntitlementStatus status = EntitlementStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public int getRemainingQty() {
        return Math.max(0, grantedQty - usedQty);
    }

    public boolean isUsableOn(LocalDate date) {
        return status == EntitlementStatus.ACTIVE
                && !date.isBefore(validFrom)
                && !date.isAfter(validUntil)
                && usedQty < grantedQty;
    }
}
