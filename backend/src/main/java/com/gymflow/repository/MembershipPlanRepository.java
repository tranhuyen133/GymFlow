package com.gymflow.repository;

import com.gymflow.domain.MembershipPlan;
import com.gymflow.domain.PlanType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {
    List<MembershipPlan> findAllByOrderByPriceAsc();

    List<MembershipPlan> findByActiveTrueOrderByPriceAsc();

    List<MembershipPlan> findByPlanTypeOrderByPriceAsc(PlanType planType);

    List<MembershipPlan> findByPlanTypeAndActiveTrueOrderByPriceAsc(PlanType planType);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
}
