package com.gymflow.repository;

import com.gymflow.domain.SubscriptionAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SubscriptionAdjustmentRepository extends JpaRepository<SubscriptionAdjustment, Long> {
    List<SubscriptionAdjustment> findBySubscriptionIdOrderByCreatedAtDesc(Long subscriptionId);

    /** Lần đổi thời gian gần đây của một hội viên – để báo cho hội viên biết. */
    @Query("""
            select a from SubscriptionAdjustment a
            where a.subscription.member.id = :memberId and a.createdAt >= :since
            order by a.createdAt desc
            """)
    List<SubscriptionAdjustment> findRecentForMember(@Param("memberId") Long memberId, @Param("since") LocalDateTime since);
}
