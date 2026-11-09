package com.gymflow.repository;

import com.gymflow.domain.PackageRequestStatus;
import com.gymflow.domain.ServiceRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    List<ServiceRequest> findAllByOrderByCreatedAtDesc();

    List<ServiceRequest> findByStatusOrderByCreatedAtAsc(PackageRequestStatus status);

    long countByStatus(PackageRequestStatus status);

    Optional<ServiceRequest> findFirstByMemberIdAndStatus(Long memberId, PackageRequestStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ServiceRequest r WHERE r.id = :id")
    Optional<ServiceRequest> lockById(@Param("id") Long id);
}
