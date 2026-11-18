package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.PackageRequestDtos.CreateChangeRequest;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.SubscriptionChangeRequestRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** V56 · Hội viên tự đổi HLV: rảnh hết thì đổi ngay, trùng giờ thì gửi quản lý. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TrainerSwitchServiceTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-18T03:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 18);

    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock SubscriptionChangeRequestRepository changeRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock TrainerHandoverService handoverService;
    @Mock SubscriptionAdjustmentService adjustmentService;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    TrainerSwitchService service;
    AuthUser me = new AuthUser(1L, "hv@example.test", Role.MEMBER, "Hội viên");
    Member member;
    Trainer oldTrainer;
    Trainer newTrainer;
    MemberSubscription ptSub;
    WorkoutSchedule session;

    @BeforeEach
    void setUp() {
        service = new TrainerSwitchService(subscriptionRepository, changeRepository, scheduleRepository, trainerRepository,
                handoverService, adjustmentService, access, auditService, mappers, CLOCK);
        oldTrainer = trainer(5L, "HLV Cũ");
        newTrainer = trainer(6L, "HLV Mới");
        member = new Member();
        member.setId(10L);
        member.setCode("HV00010");
        member.setTrainer(oldTrainer);

        MembershipPlan plan = new MembershipPlan();
        plan.setName("Gym + PT 3 tháng");
        plan.setPlanType(PlanType.GYM_PT);
        ptSub = new MemberSubscription();
        ptSub.setId(100L);
        ptSub.setMember(member);
        ptSub.setPlan(plan);
        ptSub.setStartDate(TODAY.minusDays(10));
        ptSub.setEndDate(TODAY.plusDays(80));

        session = new WorkoutSchedule();
        session.setId(500L);
        session.setMember(member);
        session.setTrainer(oldTrainer);
        session.setTitle("Tập ngực");
        session.setStartTime(TODAY.plusDays(1).atTime(18, 0));
        session.setEndTime(TODAY.plusDays(1).atTime(19, 0));
        session.setStatus(ScheduleStatus.SCHEDULED);

        when(mappers.today()).thenReturn(TODAY);
        when(access.requireMemberOf(any(AuthUser.class))).thenReturn(member);
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(10L)).thenReturn(List.of(ptSub));
        when(trainerRepository.findById(6L)).thenReturn(Optional.of(newTrainer));
        when(trainerRepository.findById(5L)).thenReturn(Optional.of(oldTrainer));
        when(scheduleRepository.findUpcomingWithTrainer(eq(10L), eq(5L), any(), eq(ScheduleStatus.SCHEDULED))).thenReturn(List.of(session));
    }

    @Test
    void switchesImmediatelyWhenNewTrainerIsFree() {
        when(scheduleRepository.trainerBusy(eq(6L), any(), any(), anyLong(), eq(ScheduleStatus.CANCELLED))).thenReturn(false);
        when(handoverService.reassign(member, oldTrainer, newTrainer)).thenReturn(new TrainerHandoverService.Result(1, List.of(), true));

        TrainerSwitchService.SwitchResult res = service.switchTrainer(me, new TrainerSwitchService.SwitchRequest(null, 6L, null));

        assertThat(res.instant()).isTrue();
        assertThat(res.moved()).isEqualTo(1);
        assertThat(member.getTrainer()).isSameAs(newTrainer);
        ArgumentCaptor<SubscriptionChangeRequest> saved = ArgumentCaptor.forClass(SubscriptionChangeRequest.class);
        verify(changeRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo(PackageRequestStatus.APPROVED);
        assertThat(saved.getValue().getChangeType()).isEqualTo(ChangeRequestType.CHANGE_TRAINER);
        assertThat(saved.getValue().getDecidedBy()).isNull();
        verify(adjustmentService, never()).create(any(), any());
    }

    @Test
    void clashSendsRequestToManagerInsteadOfSwitching() {
        when(scheduleRepository.trainerBusy(eq(6L), any(), any(), anyLong(), eq(ScheduleStatus.CANCELLED))).thenReturn(true);

        TrainerSwitchService.SwitchResult res = service.switchTrainer(me, new TrainerSwitchService.SwitchRequest(100L, 6L, ""));

        assertThat(res.instant()).isFalse();
        assertThat(res.notes()).hasSize(1).first().asString().contains("19/11 18:00");
        assertThat(member.getTrainer()).isSameAs(oldTrainer);
        ArgumentCaptor<CreateChangeRequest> req = ArgumentCaptor.forClass(CreateChangeRequest.class);
        verify(adjustmentService).create(eq(me), req.capture());
        assertThat(req.getValue().type()).isEqualTo(ChangeRequestType.CHANGE_TRAINER);
        assertThat(req.getValue().reason().length()).isGreaterThanOrEqualTo(5);
        verify(handoverService, never()).reassign(any(), any(), any());
    }

    @Test
    void previewCountsMovableSessionsAndRejectsCurrentTrainer() {
        when(scheduleRepository.trainerBusy(eq(6L), any(), any(), anyLong(), eq(ScheduleStatus.CANCELLED))).thenReturn(false);
        TrainerSwitchService.SwitchPreview p = service.preview(me, null, 6L);
        assertThat(p.instant()).isTrue();
        assertThat(p.moving()).isEqualTo(1);

        assertThatThrownBy(() -> service.preview(me, null, 5L)).isInstanceOf(ApiException.class)
                .hasMessageContaining("đang phụ trách");
    }

    @Test
    void selfTrainingPlanCannotSwitchTrainer() {
        ptSub.getPlan().setPlanType(PlanType.GYM);
        assertThatThrownBy(() -> service.switchTrainer(me, new TrainerSwitchService.SwitchRequest(null, 6L, null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("PT");
    }

    private static Trainer trainer(Long id, String name) {
        User u = new User();
        u.setFullName(name);
        Trainer t = new Trainer();
        t.setId(id);
        t.setUser(u);
        t.setActive(true);
        return t;
    }
}
