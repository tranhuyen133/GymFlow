package com.gymflow.repository;

import com.gymflow.domain.PlanServiceGrant;
import com.gymflow.domain.PlanServiceGrantId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanServiceGrantRepository extends JpaRepository<PlanServiceGrant, PlanServiceGrantId> {

    List<PlanServiceGrant> findByPlanId(Long planId);

    void deleteByPlanId(Long planId);
}
