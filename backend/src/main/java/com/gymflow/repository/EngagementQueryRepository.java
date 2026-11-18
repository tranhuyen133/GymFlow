package com.gymflow.repository;

import com.gymflow.domain.Member;
import com.gymflow.domain.ScheduleStatus;
import com.gymflow.domain.WorkoutLog;
import com.gymflow.domain.WorkoutSchedule;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * V55 · Truy vấn chỉ đọc cho email tự động, huy hiệu và thống kê HLV.
 * Gom vào một chỗ để không phải sửa các repository đang có của nhóm.
 */
public interface EngagementQueryRepository extends Repository<WorkoutSchedule, Long> {

    /** Hội viên đang hoạt động có gói hiệu lực vào ngày day (kèm tài khoản). */
    @Query("""
            select distinct m from MemberSubscription s join s.member m join fetch m.user u
            where s.cancelled = false and s.startDate <= :day and s.endDate >= :day
              and m.status = com.gymflow.domain.MemberStatus.ACTIVE
              and u.status = com.gymflow.domain.UserStatus.ACTIVE
            """)
    List<Member> activeMembersWithPlan(@Param("day") LocalDate day);

    /** Hội viên đang hoạt động có sinh nhật trong tháng month (1–12). */
    @Query("""
            select m from Member m join fetch m.user u
            where m.dateOfBirth is not null and extract(month from m.dateOfBirth) = :month
              and m.status = com.gymflow.domain.MemberStatus.ACTIVE
              and u.status = com.gymflow.domain.UserStatus.ACTIVE
            """)
    List<Member> birthdayMembers(@Param("month") int month);

    /** Buổi theo trạng thái trong khoảng [from, to), kèm hội viên, tài khoản, HLV. */
    @Query("""
            select s from WorkoutSchedule s join fetch s.member m join fetch m.user
            left join fetch s.trainer t left join fetch t.user
            where s.status = :status and s.startTime >= :from and s.startTime < :to
            order by s.startTime asc
            """)
    List<WorkoutSchedule> sessionsBetween(@Param("status") ScheduleStatus status,
                                          @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Mọi buổi của HLV (HLV dạy) trong khoảng [from, to), kèm hội viên. */
    @Query("""
            select s from WorkoutSchedule s join fetch s.member m join fetch m.user
            where s.trainer.id = :trainerId and s.startTime >= :from and s.startTime < :to
            order by s.startTime asc
            """)
    List<WorkoutSchedule> trainerSessions(@Param("trainerId") Long trainerId,
                                          @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Nhật ký các buổi HLV dạy (để lấy điểm hội viên tự chấm). */
    @Query("""
            select l from WorkoutLog l join l.schedule s
            where s.trainer.id = :trainerId and l.completedAt >= :from and l.completedAt < :to
            """)
    List<WorkoutLog> trainerLogs(@Param("trainerId") Long trainerId,
                                 @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("select l from WorkoutLog l where l.member.id = :memberId order by l.completedAt asc")
    List<WorkoutLog> memberLogs(@Param("memberId") Long memberId);

    @Query("select c.checkedInAt from GymCheckin c where c.member.id = :memberId order by c.checkedInAt asc")
    List<LocalDateTime> memberCheckins(@Param("memberId") Long memberId);

    /** Lần đến phòng gần nhất (check-in) theo hội viên: [memberId, max(checkedInAt)]. */
    @Query("select c.member.id, max(c.checkedInAt) from GymCheckin c group by c.member.id")
    List<Object[]> lastCheckins();

    /** Buổi tập hoàn thành gần nhất theo hội viên: [memberId, max(completedAt)]. */
    @Query("select l.member.id, max(l.completedAt) from WorkoutLog l group by l.member.id")
    List<Object[]> lastWorkouts();

    /** Hội viên HLV đang phụ trách (kèm tài khoản). */
    @Query("select m from Member m join fetch m.user where m.trainer.id = :trainerId")
    List<Member> membersOfTrainer(@Param("trainerId") Long trainerId);
}
