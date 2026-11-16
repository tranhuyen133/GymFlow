package com.gymflow.repository;

import com.gymflow.domain.PackageRequestStatus;
import com.gymflow.domain.SubscriptionChangeRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubscriptionChangeRequestRepository extends JpaRepository<SubscriptionChangeRequest, Long> {
    List<SubscriptionChangeRequest> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    List<SubscriptionChangeRequest> findAllByOrderByCreatedAtDesc();

    List<SubscriptionChangeRequest> findByStatusOrderByCreatedAtAsc(PackageRequestStatus status);

    boolean existsBySubscriptionIdAndStatus(Long subscriptionId, PackageRequestStatus status);

    long countByStatus(PackageRequestStatus status);

    /** SELECT … FOR UPDATE: hai quản lý bấm duyệt cùng lúc thì người sau thấy yêu cầu đã xử lý. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from SubscriptionChangeRequest r where r.id = :id")
    Optional<SubscriptionChangeRequest> lockById(@Param("id") Long id);
}
