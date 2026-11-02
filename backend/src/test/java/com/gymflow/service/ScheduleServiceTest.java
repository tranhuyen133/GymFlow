package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.ScheduleCreatedResponse;
import com.gymflow.dto.Dtos.ScheduleRequest;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.WorkoutLogRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 26, 9, 0);

    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock WorkoutLogRepository logRepository;
    @Mock WorkoutPlanRepository planRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock SubscriptionService subscriptionService;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    ScheduleService service;
    Member member;
    Trainer trainer;
    AuthUser trainerUser = new AuthUser(5L, "trainer@gymflow.vn", Role.TRAINER, "HLV");

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        service = new ScheduleService(scheduleRepository, logRepository, planRepository, trainerRepository,
                subscriptionService, access, auditService, mappers, clock);
        User tu = new User();
        tu.setId(5L);
        tu.setFullName("Lê Hoàng Phúc");
        trainer = new Trainer();
        trainer.setId(3L);
        trainer.setUser(tu);
        trainer.setActive(true);
        member = new Member();
        member.setId(1L);
        member.setCode("HV00001");
        member.setStatus(MemberStatus.ACTIVE);
        member.setTrainer(trainer);
        lenient().when(access.requireCoach(trainerUser, 1L)).thenReturn(member);
        lenient().when(access.requireTrainerOf(trainerUser)).thenReturn(trainer);
        lenient().when(scheduleRepository.saveAndFlush(any())).thenAnswer(inv -> {
            WorkoutSchedule s = inv.getArgument(0);
            s.setId((long) (Math.random() * 1_000_000));
            return s;
        });
        lenient().when(mappers.schedules(anyList())).thenReturn(List.of());
    }

    private ScheduleRequest request(LocalDateTime start, int minutes, int repeat) {
        return new ScheduleRequest(1L, null, null, "Buổi 1", start, start.plusMinutes(minutes), null, repeat);
    }

    @Test
    void rejectsSessionWithoutActivePackage() {
        when(subscriptionService.hasEffective(eq(1L), any())).thenReturn(false);
        assertThatThrownBy(() -> service.create(trainerUser, request(NOW.plusDays(1), 60, 0)))
                .isInstanceOf(ApiException.class).hasMessageContaining("gói tập hiệu lực");
    }

    @Test
    void rejectsTrainerDoubleBooking() {
        when(subscriptionService.hasEffective(eq(1L), any())).thenReturn(true);
        when(scheduleRepository.memberBusy(any(), any(), any(), any(), any())).thenReturn(false);
        when(scheduleRepository.trainerBusy(eq(3L), any(), any(), isNull(), eq(ScheduleStatus.CANCELLED))).thenReturn(true);
        assertThatThrownBy(() -> service.create(trainerUser, request(NOW.plusDays(1), 60, 0)))
                .isInstanceOf(ApiException.class).hasMessageContaining("trùng giờ");
    }

    @Test
    void rejectsPastTimeAndBadDuration() {
        assertThatThrownBy(() -> service.create(trainerUser, request(NOW.minusHours(2), 60, 0)))
                .hasMessageContaining("đã qua");
        assertThatThrownBy(() -> service.create(trainerUser, request(NOW.plusDays(1), 10, 0)))
                .hasMessageContaining("từ 15 đến 240 phút");
    }

    @Test
    void weeklyRepeatSkipsConflictingWeeksInsteadOfFailingAll() {
        LocalDateTime start = NOW.plusDays(1).withHour(18);
        when(subscriptionService.hasEffective(eq(1L), any())).thenReturn(true);
        when(scheduleRepository.trainerBusy(any(), any(), any(), any(), any())).thenReturn(false);
        when(scheduleRepository.memberBusy(any(), any(), any(), any(), any())).thenReturn(false);
        // Tuần thứ 3 hội viên đã có lịch khác.
        when(scheduleRepository.memberBusy(eq(1L), eq(start.plusWeeks(2)), any(), any(), any())).thenReturn(true);

        ScheduleCreatedResponse res = service.create(trainerUser, request(start, 60, 3));

        verify(scheduleRepository, times(3)).saveAndFlush(any());
        assertThat(res.skipped()).hasSize(1);
        assertThat(res.skipped().get(0)).contains("trùng giờ");
    }

    @Test
    void cannotCompleteFutureSession() {
        WorkoutSchedule s = new WorkoutSchedule();
        s.setId(10L);
        s.setMember(member);
        s.setStatus(ScheduleStatus.SCHEDULED);
        s.setStartTime(NOW.plusHours(3));
        s.setEndTime(NOW.plusHours(4));
        when(scheduleRepository.findById(10L)).thenReturn(java.util.Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);
        assertThatThrownBy(() -> service.complete(trainerUser, 10L, new com.gymflow.dto.Dtos.CompleteRequest(null, null, null, null)))
                .hasMessageContaining("Chưa đến giờ tập");
        verify(logRepository, never()).save(any());
    }

    @Test
    void br06_repeatWeeksSkipsWhenPackageExpiresMidway() {
        LocalDateTime start = NOW.plusDays(1).withHour(10);
        when(subscriptionService.hasEffective(eq(1L), any(LocalDate.class))).thenAnswer(inv -> {
            LocalDate date = inv.getArgument(1);
            return !date.isAfter(start.plusWeeks(1).toLocalDate());
        });
        when(scheduleRepository.memberBusy(any(), any(), any(), any(), any())).thenReturn(false);
        when(scheduleRepository.trainerBusy(any(), any(), any(), any(), any())).thenReturn(false);

        ScheduleCreatedResponse res = service.create(trainerUser, request(start, 60, 4));

        verify(scheduleRepository, times(2)).saveAndFlush(any());
        assertThat(res.skipped()).hasSize(3);
        assertThat(res.skipped()).allSatisfy(s -> assertThat(s).contains("gói tập hiệu lực"));
    }

    @Test
    void sch02_repeat12WeeksCreates13SessionsExactly7DaysApart() {
        LocalDateTime start = NOW.plusDays(1).withHour(8).withMinute(30);
        when(subscriptionService.hasEffective(eq(1L), any())).thenReturn(true);
        when(scheduleRepository.memberBusy(any(), any(), any(), any(), any())).thenReturn(false);
        when(scheduleRepository.trainerBusy(any(), any(), any(), any(), any())).thenReturn(false);

        ArgumentCaptor<WorkoutSchedule> captor = ArgumentCaptor.forClass(WorkoutSchedule.class);
        ScheduleCreatedResponse res = service.create(trainerUser, request(start, 60, 12));

        verify(scheduleRepository, times(13)).saveAndFlush(captor.capture());
        assertThat(res.skipped()).isEmpty();

        List<WorkoutSchedule> saved = captor.getAllValues();
        assertThat(saved).hasSize(13);
        for (int i = 0; i < 13; i++) {
            WorkoutSchedule s = saved.get(i);
            LocalDateTime expectedStart = start.plusWeeks(i);
            LocalDateTime expectedEnd = expectedStart.plusMinutes(60);
            assertThat(s.getStartTime()).isEqualTo(expectedStart);
            assertThat(s.getEndTime()).isEqualTo(expectedEnd);
            assertThat(s.getStartTime().toLocalTime()).isEqualTo(start.toLocalTime());
            assertThat(s.getEndTime().toLocalTime()).isEqualTo(start.plusMinutes(60).toLocalTime());
            if (i > 0) {
                assertThat(Duration.between(saved.get(i - 1).getStartTime(), s.getStartTime()).toDays()).isEqualTo(7);
            }
        }
    }

    @Test
    void sch04_firstWeekConflictFailsImmediatelyWith409AndNoAudit() {
        LocalDateTime start = NOW.plusDays(1).withHour(10);
        when(subscriptionService.hasEffective(eq(1L), any())).thenReturn(false);

        assertThatThrownBy(() -> service.create(trainerUser, request(start, 60, 4)))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("gói tập hiệu lực");

        verify(scheduleRepository, never()).saveAndFlush(any());
        verify(auditService, never()).log(any(), any(), any(), any());
    }

    @Test
    void br04_rejectsWhenMemberHasOverlappingSessionInFirstWeek() {
        LocalDateTime start = NOW.plusDays(1).withHour(10);
        when(subscriptionService.hasEffective(eq(1L), any())).thenReturn(true);
        when(scheduleRepository.memberBusy(eq(1L), eq(start), eq(start.plusMinutes(60)), isNull(), eq(ScheduleStatus.CANCELLED)))
                .thenReturn(true);

        assertThatThrownBy(() -> service.create(trainerUser, request(start, 60, 2)))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("hội viên đã có buổi tập khác trùng giờ");

        verify(scheduleRepository, never()).saveAndFlush(any());
        verify(auditService, never()).log(any(), any(), any(), any());
    }

    @Test
    void rowLocking_locksMemberThenTrainerBeforeCheckingBusy() {
        LocalDateTime start = NOW.plusDays(1).withHour(14);
        when(subscriptionService.hasEffective(eq(1L), any())).thenReturn(true);
        when(scheduleRepository.memberBusy(any(), any(), any(), any(), any())).thenReturn(false);
        when(scheduleRepository.trainerBusy(any(), any(), any(), any(), any())).thenReturn(false);

        service.create(trainerUser, request(start, 60, 0));

        InOrder inOrder = inOrder(scheduleRepository);
        inOrder.verify(scheduleRepository).lockMember(1L);
        inOrder.verify(scheduleRepository).lockTrainer(3L);
        inOrder.verify(scheduleRepository).memberBusy(eq(1L), eq(start), eq(start.plusMinutes(60)), isNull(), eq(ScheduleStatus.CANCELLED));
        inOrder.verify(scheduleRepository).trainerBusy(eq(3L), eq(start), eq(start.plusMinutes(60)), isNull(), eq(ScheduleStatus.CANCELLED));
    }

    @Test
    void adminCreateWithoutTrainer_locksMemberAndNeverLocksTrainer() {
        AuthUser adminUser = new AuthUser(99L, "admin@gymflow.vn", Role.ADMIN, "Admin");
        Member memberNoTrainer = new Member();
        memberNoTrainer.setId(1L);
        memberNoTrainer.setCode("HV00001");
        memberNoTrainer.setStatus(MemberStatus.ACTIVE);
        memberNoTrainer.setTrainer(null);

        when(access.requireCoach(adminUser, 1L)).thenReturn(memberNoTrainer);
        when(subscriptionService.hasEffective(eq(1L), any())).thenReturn(true);
        when(scheduleRepository.memberBusy(any(), any(), any(), any(), any())).thenReturn(false);

        LocalDateTime start = NOW.plusDays(1).withHour(15);
        ScheduleRequest req = new ScheduleRequest(1L, null, null, "Buổi tự tập", start, start.plusMinutes(60), null, 0);

        service.create(adminUser, req);

        verify(scheduleRepository).lockMember(1L);
        verify(scheduleRepository, never()).lockTrainer(any());
        verify(scheduleRepository, never()).trainerBusy(any(), any(), any(), any(), any());
    }

    @Test
    void rejectsWhenMemberNotActive() {
        member.setStatus(MemberStatus.PAUSED);
        LocalDateTime start = NOW.plusDays(1).withHour(10);

        assertThatThrownBy(() -> service.create(trainerUser, request(start, 60, 0)))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("Hội viên không ở trạng thái hoạt động");

        member.setStatus(MemberStatus.INACTIVE);
        assertThatThrownBy(() -> service.create(trainerUser, request(start, 60, 0)))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("Hội viên không ở trạng thái hoạt động");

        verify(scheduleRepository, never()).lockMember(any());
        verify(scheduleRepository, never()).lockTrainer(any());
        verify(scheduleRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsWhenPlanDoesNotBelongToMember() {
        Member otherMember = new Member();
        otherMember.setId(99L);
        WorkoutPlan otherPlan = new WorkoutPlan();
        otherPlan.setId(42L);
        otherPlan.setMember(otherMember);

        when(planRepository.findById(42L)).thenReturn(Optional.of(otherPlan));

        LocalDateTime start = NOW.plusDays(1).withHour(10);
        ScheduleRequest req = new ScheduleRequest(1L, null, 42L, "Tập ngực", start, start.plusMinutes(60), null, 0);

        assertThatThrownBy(() -> service.create(trainerUser, req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("Giáo án không thuộc hội viên này");

        verify(scheduleRepository, never()).lockMember(any());
        verify(scheduleRepository, never()).saveAndFlush(any());
    }

    @Test
    void logsAuditWithSkippedCountWhenRepeatingScheduleHasConflicts() {
        LocalDateTime start = NOW.plusDays(1).withHour(18);
        when(subscriptionService.hasEffective(eq(1L), any())).thenReturn(true);
        when(scheduleRepository.trainerBusy(any(), any(), any(), any(), any())).thenReturn(false);
        when(scheduleRepository.memberBusy(any(), any(), any(), any(), any())).thenReturn(false);
        // Tuần thứ 2 (index 1) bị trùng giờ
        when(scheduleRepository.memberBusy(eq(1L), eq(start.plusWeeks(1)), any(), any(), any())).thenReturn(true);

        ScheduleCreatedResponse res = service.create(trainerUser, request(start, 60, 2));

        assertThat(res.skipped()).hasSize(1);
        verify(auditService, times(1)).log(
                eq("SCHEDULE_CREATE"),
                eq("SCHEDULE"),
                any(),
                argThat(desc -> desc.contains("2 buổi") && desc.contains("bỏ qua 1"))
        );
    }
}
