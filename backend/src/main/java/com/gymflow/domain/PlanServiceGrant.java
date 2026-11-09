package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "plan_service_grants")
@Getter
@Setter
@NoArgsConstructor
public class PlanServiceGrant {

    @EmbeddedId
    private PlanServiceGrantId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("planId")
    @JoinColumn(name = "plan_id", nullable = false)
    private MembershipPlan plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("serviceId")
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceItem service;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "valid_days", nullable = false)
    private int validDays;

    @Column(name = "conditions", length = 255)
    private String conditions;

    public PlanServiceGrant(MembershipPlan plan, ServiceItem service, int quantity, int validDays, String conditions) {
        this.id = new PlanServiceGrantId(plan.getId(), service.getId());
        this.plan = plan;
        this.service = service;
        this.quantity = quantity;
        this.validDays = validDays;
        this.conditions = conditions;
    }
}
