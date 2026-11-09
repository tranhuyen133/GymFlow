package com.gymflow.repository;

import com.gymflow.domain.EntitlementSource;
import com.gymflow.domain.EntitlementStatus;
import com.gymflow.domain.MemberServiceEntitlement;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MemberServiceEntitlementRepository extends JpaRepository<MemberServiceEntitlement, Long> {

    List<MemberServiceEntitlement> findByMemberIdOrderByValidUntilAsc(Long memberId);

    List<MemberServiceEntitlement> findByMemberIdAndStatusOrderByValidUntilAsc(Long memberId, EntitlementStatus status);

    List<MemberServiceEntitlement> findBySubscriptionIdAndSource(Long subscriptionId, EntitlementSource source);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM MemberServiceEntitlement e WHERE e.id = :id")
    Optional<MemberServiceEntitlement> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT e FROM MemberServiceEntitlement e WHERE e.member.id = :memberId AND e.status = 'ACTIVE' " +
           "AND e.usedQty < e.grantedQty AND e.validUntil BETWEEN :from AND :to")
    List<MemberServiceEntitlement> findExpiringBetween(@Param("memberId") Long memberId,
                                                      @Param("from") LocalDate from,
                                                      @Param("to") LocalDate to);
}
