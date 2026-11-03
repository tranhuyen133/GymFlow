/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền) · TASK: SCRUM-187
 */
package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 26, 9, 0); // Thứ Hai 26/10/2026 09:00

    @Mock MemberRepository memberRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock WorkoutPlanRepository planRepository;
    @Mock WeightRecordRepository weightRepository;
    @Mock AuditLogRepository auditRepository;
    @Mock AccessService access;
    @Mock Mappers mappers;

    DashboardService service;
    Clock clock;

    AuthUser adminUser = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Admin");
    AuthUser trainerUser = new AuthUser(2L, "trainer@gymflow.vn", Role.TRAINER, "HLV");
    AuthUser memberUser = new AuthUser(3L, "member@gymflow.vn", Role.MEMBER, "Hội viên");

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        service = new DashboardService(
                memberRepository,
                trainerRepository,
                subscriptionRepository,
                scheduleRepository,
                planRepository,
                weightRepository,
                auditRepository,
                clock,
                access,
                mappers
        );

        lenient().when(mappers.today()).thenReturn(LocalDate.now(clock));
        lenient().when(mappers.schedule(any())).thenAnswer(inv -> toResponse(inv.getArgument(0)));
        lenient().when(mappers.schedules(anyList())).thenAnswer(inv -> {
            List<WorkoutSchedule> list = inv.getArgument(0);
            return list.stream().map(this::toResponse).toList();
        });
    }

    @Test
    @DisplayName("DASH-01: Tăng trưởng doanh thu 120 vs 100 -> 20.0%, tháng trước 0 -> null")
    void admin_revenueGrowth_calculatesPercentageAndNullWhenZero() {
        YearMonth thisMonth = YearMonth.of(2026, 10);
        YearMonth prevMonth = YearMonth.of(2026, 9);

        lenient().when(subscriptionRepository.revenueBetween(any(), any())).thenReturn(0L);

        // Case 1: Tháng này 120, tháng trước 100 -> (120 - 100) * 100 / 100 = 20.0%
        when(subscriptionRepository.revenueBetween(thisMonth.atDay(1).atStartOfDay(), thisMonth.plusMonths(1).atDay(1).atStartOfDay()))
                .thenReturn(120L);
        when(subscriptionRepository.revenueBetween(prevMonth.atDay(1).atStartOfDay(), prevMonth.plusMonths(1).atDay(1).atStartOfDay()))
                .thenReturn(100L);

        when(subscriptionRepository.findAllByOrderByCreatedAtDesc()).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findEndingBetween(any(), any())).thenReturn(Collections.emptyList());
        when(scheduleRepository.findByStartTimeBetweenOrderByStartTimeAsc(any(), any())).thenReturn(Collections.emptyList());
        when(memberRepository.count()).thenReturn(50L);
        when(memberRepository.countByStatus(MemberStatus.ACTIVE)).thenReturn(40L);
        when(memberRepository.countByJoinedAtBetween(any(), any())).thenReturn(5L);
        when(subscriptionRepository.countMembersWithEffective(any())).thenReturn(30L);
        when(trainerRepository.countByActiveTrue()).thenReturn(4L);
        when(auditRepository.findTop8ByOrderByCreatedAtDesc()).thenReturn(Collections.emptyList());

        AdminDashboard d1 = service.admin();

        assertThat(d1.revenueThisMonth()).isEqualTo(120L);
        assertThat(d1.revenuePrevMonth()).isEqualTo(100L);
        assertThat(d1.revenueGrowthPercent()).isEqualTo(20.0);

        // Case 2: Tháng trước doanh thu = 0 -> revenueGrowthPercent phải là null (không chia cho 0)
        when(subscriptionRepository.revenueBetween(prevMonth.atDay(1).atStartOfDay(), prevMonth.plusMonths(1).atDay(1).atStartOfDay()))
                .thenReturn(0L);

        AdminDashboard d2 = service.admin();

        assertThat(d2.revenueThisMonth()).isEqualTo(120L);
        assertThat(d2.revenuePrevMonth()).isEqualTo(0L);
        assertThat(d2.revenueGrowthPercent()).isNull();
    }

    @Test
    @DisplayName("DASH-02: Tuần HLV có 2 COMPLETED, 1 MISSED, 1 CANCELLED, 1 SCHEDULED tương lai -> tỉ lệ 66.7%, CANCELLED bỏ qua")
    void trainer_completionRate_ignoresCancelledAndFutureSessions() {
        Trainer trainer = createTrainer(10L, "HLV Nam");
        when(access.requireTrainerOf(trainerUser)).thenReturn(trainer);

        LocalDate ws = LocalDate.of(2026, 10, 26); // Thứ Hai
        Member m = createMember(1L, "HV001", "Nguyen Van A");

        WorkoutSchedule sCompleted1 = createSchedule(1L, m, trainer, ws.atTime(7, 0), ws.atTime(8, 0), ScheduleStatus.COMPLETED);
        WorkoutSchedule sCompleted2 = createSchedule(2L, m, trainer, ws.atTime(9, 0), ws.atTime(10, 0), ScheduleStatus.COMPLETED);
        WorkoutSchedule sMissed = createSchedule(3L, m, trainer, ws.atTime(11, 0), ws.atTime(12, 0), ScheduleStatus.MISSED);
        WorkoutSchedule sCancelled = createSchedule(4L, m, trainer, ws.plusDays(1).atTime(8, 0), ws.plusDays(1).atTime(9, 0), ScheduleStatus.CANCELLED);
        WorkoutSchedule sFuture = createSchedule(5L, m, trainer, ws.plusDays(2).atTime(8, 0), ws.plusDays(2).atTime(9, 0), ScheduleStatus.SCHEDULED);

        when(scheduleRepository.findInRange(ws.atStartOfDay(), ws.plusDays(7).atStartOfDay(), null, trainer.getId()))
                .thenReturn(List.of(sCompleted1, sCompleted2, sMissed, sCancelled, sFuture));

        when(memberRepository.findByTrainerId(trainer.getId())).thenReturn(Collections.emptyList());
        when(planRepository.findByMemberTrainerIdOrderByCreatedAtDesc(trainer.getId())).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findEndingBetween(any(), any())).thenReturn(Collections.emptyList());

        TrainerDashboard dashboard = service.trainer(trainerUser);

        // sessionsThisWeek bỏ qua CANCELLED: 5 - 1 = 4
        assertThat(dashboard.sessionsThisWeek()).isEqualTo(4L);
        assertThat(dashboard.completedThisWeek()).isEqualTo(2L);
        assertThat(dashboard.missedThisWeek()).isEqualTo(1L);
        // Tỉ lệ: 2 / (2 + 1) * 100 = 66.7% (CANCELLED và SCHEDULED tương lai không tính vào mẫu số)
        assertThat(dashboard.completionRate()).isEqualTo(66.7);
    }

    @Test
    @DisplayName("DASH-02: HLV chỉ nhìn thấy hội viên mình phụ trách và sắp xếp theo tỉ lệ đi tập tăng dần")
    void trainer_onlySeesOwnAssignedMembersAndSortsByAttendanceAsc() {
        Trainer trainer1 = createTrainer(10L, "HLV Nam");
        when(access.requireTrainerOf(trainerUser)).thenReturn(trainer1);

        Member m1 = createMember(1L, "HV001", "Hoi Vien Kem");
        Member m2 = createMember(2L, "HV002", "Hoi Vien Cham");
        Member m3NoSessions = createMember(3L, "HV003", "Hoi Vien Moi");

        // memberRepository chỉ trả về hội viên thuộc trainer1 (không chứa hội viên của trainer khác)
        when(memberRepository.findByTrainerId(trainer1.getId())).thenReturn(List.of(m1, m2, m3NoSessions));

        LocalDate ws = LocalDate.of(2026, 10, 26);

        // M1: 1 COMPLETED, 1 MISSED trong tuần -> rate = 50.0%
        WorkoutSchedule s1Done = createSchedule(11L, m1, trainer1, ws.atTime(7, 0), ws.atTime(8, 0), ScheduleStatus.COMPLETED);
        WorkoutSchedule s1Miss = createSchedule(12L, m1, trainer1, ws.atTime(9, 0), ws.atTime(10, 0), ScheduleStatus.MISSED);
        when(scheduleRepository.findByMemberIdOrderByStartTimeAsc(1L)).thenReturn(List.of(s1Done, s1Miss));

        // M2: 1 COMPLETED trong tuần -> rate = 100.0%
        WorkoutSchedule s2Done = createSchedule(21L, m2, trainer1, ws.atTime(8, 0), ws.atTime(9, 0), ScheduleStatus.COMPLETED);
        WorkoutSchedule s2Next = createSchedule(22L, m2, trainer1, ws.plusDays(1).atTime(14, 0), ws.plusDays(1).atTime(15, 0), ScheduleStatus.SCHEDULED);
        when(scheduleRepository.findByMemberIdOrderByStartTimeAsc(2L)).thenReturn(List.of(s2Done, s2Next));

        // M3: Chưa có buổi nào -> rate = null
        when(scheduleRepository.findByMemberIdOrderByStartTimeAsc(3L)).thenReturn(Collections.emptyList());

        when(scheduleRepository.findInRange(any(), any(), any(), any())).thenReturn(Collections.emptyList());
        when(planRepository.findByMemberTrainerIdOrderByCreatedAtDesc(trainer1.getId())).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findEndingBetween(any(), any())).thenReturn(Collections.emptyList());

        TrainerDashboard dashboard = service.trainer(trainerUser);

        List<TrainerMemberProgress> assigned = dashboard.assignedMembers();
        assertThat(assigned).hasSize(3);

        // Thứ tự tăng dần tỉ lệ đi tập, null xếp cuối:
        // 1. M1: 50.0%
        assertThat(assigned.get(0).memberId()).isEqualTo(1L);
        assertThat(assigned.get(0).code()).isEqualTo("HV001");
        assertThat(assigned.get(0).fullName()).isEqualTo("Hoi Vien Kem");
        assertThat(assigned.get(0).attendanceThisWeek()).isEqualTo(50.0);

        // 2. M2: 100.0%
        assertThat(assigned.get(1).memberId()).isEqualTo(2L);
        assertThat(assigned.get(1).attendanceThisWeek()).isEqualTo(100.0);
        assertThat(assigned.get(1).nextSession()).isNotNull();
        assertThat(assigned.get(1).nextSession().id()).isEqualTo(22L);

        // 3. M3: null (xếp cuối)
        assertThat(assigned.get(2).memberId()).isEqualTo(3L);
        assertThat(assigned.get(2).attendanceThisWeek()).isNull();
    }

    @Test
    @DisplayName("DASH-03: needsCompletion chứa buổi SCHEDULED quá giờ và buổi MISSED trong 7 ngày, loại buổi MISSED quá 7 ngày")
    void member_needsCompletion_includesPastScheduledAndRecentMissed() {
        Member member = createMember(1L, "HV001", "Tran Thi Khanh Huyen");
        when(access.requireMemberOf(memberUser)).thenReturn(member);

        // NOW = 2026-10-26 09:00
        // Buổi 1: SCHEDULED, kết thúc 2026-10-26 08:00 (1 giờ trước) -> cần hoàn thành
        WorkoutSchedule sPastScheduled = createSchedule(101L, member, null,
                NOW.minusHours(2), NOW.minusHours(1), ScheduleStatus.SCHEDULED);

        // Buổi 2: MISSED 3 ngày trước (kết thúc 2026-10-23 09:00, <= 7 ngày) -> cần hoàn thành
        WorkoutSchedule sRecentMissed = createSchedule(102L, member, null,
                NOW.minusDays(3).minusHours(1), NOW.minusDays(3), ScheduleStatus.MISSED);

        // Buổi 3: MISSED 8 ngày trước (kết thúc 2026-10-18 09:00, > 7 ngày) -> KHÔNG đưa vào (hết hạn hoàn thành)
        WorkoutSchedule sOldMissed = createSchedule(103L, member, null,
                NOW.minusDays(8).minusHours(1), NOW.minusDays(8), ScheduleStatus.MISSED);

        // Buổi 4: SCHEDULED tương lai (kết thúc 2026-10-26 11:00) -> KHÔNG đưa vào
        WorkoutSchedule sFutureScheduled = createSchedule(104L, member, null,
                NOW.plusHours(1), NOW.plusHours(2), ScheduleStatus.SCHEDULED);

        // Buổi 5: COMPLETED -> KHÔNG đưa vào
        WorkoutSchedule sCompleted = createSchedule(105L, member, null,
                NOW.minusHours(3), NOW.minusHours(2), ScheduleStatus.COMPLETED);

        // Buổi 6: CANCELLED -> KHÔNG đưa vào
        WorkoutSchedule sCancelled = createSchedule(106L, member, null,
                NOW.minusHours(4), NOW.minusHours(3), ScheduleStatus.CANCELLED);

        List<WorkoutSchedule> all = List.of(sPastScheduled, sRecentMissed, sOldMissed, sFutureScheduled, sCompleted, sCancelled);
        when(scheduleRepository.findByMemberIdOrderByStartTimeAsc(member.getId())).thenReturn(all);
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(Collections.emptyList());
        when(weightRepository.findFirstByMemberIdOrderByRecordedDateDesc(member.getId())).thenReturn(Optional.empty());
        when(planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(member.getId(), PlanStatus.ACTIVE))
                .thenReturn(Optional.empty());

        MemberResponse mr = mock(MemberResponse.class);
        when(mappers.member(member)).thenReturn(mr);

        MemberDashboard dashboard = service.member(memberUser);

        List<ScheduleResponse> needs = dashboard.needsCompletion();
        assertThat(needs).hasSize(2);
        List<Long> needIds = needs.stream().map(ScheduleResponse::id).toList();
        assertThat(needIds).containsExactlyInAnyOrder(101L, 102L);
        assertThat(needIds).doesNotContain(103L, 104L, 105L, 106L);
    }

    @Test
    @DisplayName("DASH-03: Hội viên chưa có gói tập và chưa có buổi nào -> không lỗi, trả về null/rỗng phù hợp")
    void member_noPackageAndNoSessions_returnsNullOrEmptyWithoutErrors() {
        Member member = createMember(1L, "HV001", "Hoi Vien Moi");
        member.setHeightCm(175.0);
        when(access.requireMemberOf(memberUser)).thenReturn(member);

        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(Collections.emptyList());
        when(scheduleRepository.findByMemberIdOrderByStartTimeAsc(member.getId())).thenReturn(Collections.emptyList());
        when(weightRepository.findFirstByMemberIdOrderByRecordedDateDesc(member.getId())).thenReturn(Optional.empty());
        when(planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(member.getId(), PlanStatus.ACTIVE))
                .thenReturn(Optional.empty());

        MemberResponse mr = mock(MemberResponse.class);
        when(mappers.member(member)).thenReturn(mr);

        MemberDashboard dashboard = service.member(memberUser);

        assertThat(dashboard.member()).isNotNull();
        assertThat(dashboard.currentSubscription()).isNull();
        assertThat(dashboard.nextSession()).isNull();
        assertThat(dashboard.weekSessions()).isEmpty();
        assertThat(dashboard.completedThisMonth()).isEqualTo(0L);
        assertThat(dashboard.streakWeeks()).isEqualTo(0);
        assertThat(dashboard.latestWeight()).isNull();
        assertThat(dashboard.bmi()).isNull();
        assertThat(dashboard.bmiCategory()).isNull();
        assertThat(dashboard.currentPlan()).isNull();
        assertThat(dashboard.needsCompletion()).isEmpty();
    }

    // ---------- Helper methods ----------

    private User createUser(Long id, String fullName, String email, Role role) {
        User u = new User();
        u.setId(id);
        u.setFullName(fullName);
        u.setEmail(email);
        u.setRole(role);
        return u;
    }

    private Member createMember(Long id, String code, String fullName) {
        User u = createUser(id + 100, fullName, code.toLowerCase() + "@test.com", Role.MEMBER);
        Member m = new Member();
        m.setId(id);
        m.setCode(code);
        m.setUser(u);
        m.setStatus(MemberStatus.ACTIVE);
        m.setJoinedAt(LocalDate.of(2026, 1, 1));
        return m;
    }

    private Trainer createTrainer(Long id, String fullName) {
        User u = createUser(id + 200, fullName, "trainer" + id + "@test.com", Role.TRAINER);
        Trainer t = new Trainer();
        t.setId(id);
        t.setUser(u);
        t.setActive(true);
        return t;
    }

    private WorkoutSchedule createSchedule(Long id, Member member, Trainer trainer,
                                           LocalDateTime start, LocalDateTime end, ScheduleStatus status) {
        WorkoutSchedule s = new WorkoutSchedule();
        s.setId(id);
        s.setMember(member);
        s.setTrainer(trainer);
        s.setStartTime(start);
        s.setEndTime(end);
        s.setStatus(status);
        s.setTitle("Buổi tập " + id);
        return s;
    }

    private ScheduleResponse toResponse(WorkoutSchedule s) {
        if (s == null) return null;
        return new ScheduleResponse(
                s.getId(),
                s.getMember() != null ? s.getMember().getId() : null,
                s.getMember() != null && s.getMember().getUser() != null ? s.getMember().getUser().getFullName() : null,
                s.getTrainer() != null ? s.getTrainer().getId() : null,
                s.getTrainer() != null && s.getTrainer().getUser() != null ? s.getTrainer().getUser().getFullName() : null,
                null,
                null,
                s.getTitle(),
                s.getStartTime(),
                s.getEndTime(),
                s.getStatus(),
                s.getNote(),
                null
        );
    }
}
