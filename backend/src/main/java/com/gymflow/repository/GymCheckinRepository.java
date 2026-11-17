package com.gymflow.repository;

import com.gymflow.domain.GymCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GymCheckinRepository extends JpaRepository<GymCheckin, Long> {

    /** Lượt check-in gần nhất của hội viên kể từ một mốc – chống quét trùng và hiện trạng thái "đã check-in". */
    Optional<GymCheckin> findFirstByMemberIdAndCheckedInAtGreaterThanEqualOrderByCheckedInAtDesc(Long memberId, LocalDateTime from);

    long countByMemberIdAndCheckedInAtBetween(Long memberId, LocalDateTime from, LocalDateTime to);

    long countByCheckedInAtGreaterThanEqual(LocalDateTime from);

    @Query("""
            select c from GymCheckin c join fetch c.member m join fetch m.user left join fetch c.createdBy
            where c.checkedInAt >= :from and c.checkedInAt < :to
            order by c.checkedInAt desc
            """)
    List<GymCheckin> findBetweenWithMember(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Chỉ lấy giờ check-in để tính biểu đồ giờ đông, không nạp cả hội viên. */
    @Query("select c.checkedInAt from GymCheckin c where c.checkedInAt >= :from and c.checkedInAt < :to")
    List<LocalDateTime> timesBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
