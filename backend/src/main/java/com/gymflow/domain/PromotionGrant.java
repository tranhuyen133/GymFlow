package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "promotion_grants")
@Getter
@Setter
@NoArgsConstructor
public class PromotionGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "promotion_id", nullable = false)
    private Promotion promotion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceItem service;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "valid_days", nullable = false)
    private int validDays;

    @Column(name = "conditions", length = 255)
    private String conditions;

    public PromotionGrant(Promotion promotion, ServiceItem service, int quantity, int validDays, String conditions) {
        this.promotion = promotion;
        this.service = service;
        this.quantity = quantity;
        this.validDays = validDays;
        this.conditions = conditions;
    }
}
