package com.gymflow.repository;

import com.gymflow.domain.PtSessionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PtSessionUsageRepository extends JpaRepository<PtSessionUsage, Long> {

    long countBySubscriptionId(Long subscriptionId);

    boolean existsByScheduleId(Long scheduleId);

    Optional<PtSessionUsage> findByScheduleId(Long scheduleId);

    @Query("SELECT u FROM PtSessionUsage u " +
           "JOIN FETCH u.schedule s " +
           "LEFT JOIN FETCH u.trainer t " +
           "LEFT JOIN FETCH t.user tu " +
           "LEFT JOIN FETCH u.createdBy cb " +
           "WHERE u.subscription.id = :subscriptionId " +
           "ORDER BY u.usedAt DESC")
    List<PtSessionUsage> findBySubscriptionIdWithDetails(@Param("subscriptionId") Long subscriptionId);
}
