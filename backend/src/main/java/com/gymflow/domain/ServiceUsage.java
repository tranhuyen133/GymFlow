package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "service_usages")
@Getter
@Setter
@NoArgsConstructor
public class ServiceUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entitlement_id", nullable = false)
    private MemberServiceEntitlement entitlement;

    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "confirmed_by", nullable = false)
    private User confirmedBy;

    @Column(name = "note", length = 255)
    private String note;

    public ServiceUsage(MemberServiceEntitlement entitlement, LocalDateTime usedAt, User confirmedBy, String note) {
        this.entitlement = entitlement;
        this.usedAt = usedAt;
        this.confirmedBy = confirmedBy;
        this.note = note;
    }
}
