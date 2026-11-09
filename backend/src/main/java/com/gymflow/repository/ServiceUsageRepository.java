package com.gymflow.repository;

import com.gymflow.domain.ServiceUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ServiceUsageRepository extends JpaRepository<ServiceUsage, Long> {

    @Query("SELECT u FROM ServiceUsage u " +
           "JOIN FETCH u.confirmedBy " +
           "WHERE u.entitlement.id = :entitlementId " +
           "ORDER BY u.usedAt DESC")
    List<ServiceUsage> findByEntitlementIdOrderByUsedAtDesc(@Param("entitlementId") Long entitlementId);
}
