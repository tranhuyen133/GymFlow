package com.gymflow.repository;

import com.gymflow.domain.MemberTimePreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MemberTimePreferenceRepository extends JpaRepository<MemberTimePreference, Long> {
    List<MemberTimePreference> findByMemberIdOrderByDayOfWeekAscStartTimeAsc(Long memberId);

    /** Giờ tập mong muốn của mọi hội viên đang do HLV này phụ trách. */
    @Query("""
            select p from MemberTimePreference p join fetch p.member m join fetch m.user
            where m.trainer.id = :trainerId and m.status = com.gymflow.domain.MemberStatus.ACTIVE
            order by p.dayOfWeek, p.startTime
            """)
    List<MemberTimePreference> findActiveByTrainerId(@Param("trainerId") Long trainerId);

    @Modifying
    @Query("delete from MemberTimePreference p where p.member.id = :memberId")
    void deleteByMemberId(@Param("memberId") Long memberId);
}
