package com.gymflow.repository;

import com.gymflow.domain.MemberBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MemberBadgeRepository extends JpaRepository<MemberBadge, Long> {
    List<MemberBadge> findByMemberIdOrderByEarnedAtAsc(Long memberId);

    @Modifying
    @Query("update MemberBadge b set b.seenAt = :now where b.memberId = :memberId and b.seenAt is null")
    int markSeen(@Param("memberId") Long memberId, @Param("now") LocalDateTime now);
}
