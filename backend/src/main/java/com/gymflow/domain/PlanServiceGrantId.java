package com.gymflow.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PlanServiceGrantId implements Serializable {

    @Column(name = "plan_id")
    private Long planId;

    @Column(name = "service_id")
    private Long serviceId;
}
