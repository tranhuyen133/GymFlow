package com.gymflow.repository;

import com.gymflow.domain.PackageRequest;
import com.gymflow.domain.PackageRequestStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PackageRequestRepository extends JpaRepository<PackageRequest, Long> {

    List<PackageRequest> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    List<PackageRequest> findAllByOrderByCreatedAtDesc();

    List<PackageRequest> findByStatusOrderByCreatedAtAsc(PackageRequestStatus status);

    boolean existsByMemberIdAndStatus(Long memberId, PackageRequestStatus status);

    Optional<PackageRequest> findFirstByMemberIdAndStatus(Long memberId, PackageRequestStatus status);

    long countByStatus(PackageRequestStatus status);

    boolean existsByPlanId(Long planId);

    /** SELECT … FOR UPDATE: hai quản lý bấm duyệt cùng lúc thì người sau thấy đơn đã xử lý. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from PackageRequest r where r.id = :id")
    Optional<PackageRequest> lockById(@Param("id") Long id);
}
