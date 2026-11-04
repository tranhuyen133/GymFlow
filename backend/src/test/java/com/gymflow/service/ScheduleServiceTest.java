/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền) · TASK: SCRUM-185, SCRUM-186
 */
package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.CompleteRequest;
import com.gymflow.dto.Dtos.ScheduleCreatedResponse;
import com.gymflow.dto.Dtos.ScheduleRequest;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.WorkoutLogRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

    private WorkoutSchedule createSchedule(Long id, ScheduleStatus status, LocalDateTime start, LocalDateTime end) {
        WorkoutSchedule s = new WorkoutSchedule();
        s.setId(id);
        s.setMember(member);
        s.setTrainer(trainer);
        s.setStatus(status);
        s.setStartTime(start);
        s.setEndTime(end);
        s.setTitle("Buổi tập cá nhân");
        return s;
    }

    // ==========================================
    // Base tests
    // ==========================================

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

    // ==========================================
    // SCRUM-185: Lặp 12 tuần & Khoá dòng
    // ==========================================

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

    // ==========================================
    // SCRUM-186: Hoàn thành buổi & Ghi muộn 7 ngày
    // ==========================================

    @Test
    @DisplayName("LOG-01: Không thể hoàn thành buổi tập chưa tới giờ bắt đầu")
    void cannotCompleteFutureSession() {
        WorkoutSchedule s = new WorkoutSchedule();
        s.setId(10L);
        s.setMember(member);
        s.setStatus(ScheduleStatus.SCHEDULED);
        s.setStartTime(NOW.plusHours(3));
        s.setEndTime(NOW.plusHours(4));
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);
        assertThatThrownBy(() -> service.complete(trainerUser, 10L, new CompleteRequest(null, null, null, null)))
                .hasMessageContaining("Chưa đến giờ tập");
        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("LOG-01: Hoàn thành hợp lệ buổi tập đã qua giờ bắt đầu, lưu nhật ký đầy đủ và ghi audit")
    void complete_success_withFullDetails_savesLogAndLogsAudit() {
        WorkoutSchedule s = createSchedule(10L, ScheduleStatus.SCHEDULED, NOW.minusHours(2), NOW.minusHours(1));
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);

        CompleteRequest req = new CompleteRequest(60, 350, 5, "Buổi tập rất tốt");
        service.complete(trainerUser, 10L, req);

        ArgumentCaptor<WorkoutLog> captor = ArgumentCaptor.forClass(WorkoutLog.class);
        verify(logRepository, times(1)).save(captor.capture());
        WorkoutLog saved = captor.getValue();
        assertThat(saved.getSchedule()).isSameAs(s);
        assertThat(saved.getMember()).isSameAs(member);
        assertThat(saved.getCompletedAt()).isEqualTo(NOW);
        assertThat(saved.getDurationMinutes()).isEqualTo(60);
        assertThat(saved.getCalories()).isEqualTo(350);
        assertThat(saved.getRating()).isEqualTo(5);
        assertThat(saved.getNote()).isEqualTo("Buổi tập rất tốt");

        assertThat(s.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        verify(auditService, times(1)).log(eq("SCHEDULE_COMPLETE"), eq("SCHEDULE"), eq(10L), eq("HV00001"));
    }

    @Test
    @DisplayName("LOG-01: Khi không truyền durationMinutes, thời lượng nhật ký lấy mặc định theo độ dài buổi tập")
    void complete_defaultDuration_usesSessionLength() {
        // Buổi tập dài 90 phút: 07:00 đến 08:30
        WorkoutSchedule s = createSchedule(11L, ScheduleStatus.SCHEDULED, NOW.minusHours(2), NOW.minusHours(2).plusMinutes(90));
        when(scheduleRepository.findById(11L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);

        CompleteRequest req = new CompleteRequest(null, 400, 4, "Tập vừa sức");
        service.complete(trainerUser, 11L, req);

        ArgumentCaptor<WorkoutLog> captor = ArgumentCaptor.forClass(WorkoutLog.class);
        verify(logRepository).save(captor.capture());
        assertThat(captor.getValue().getDurationMinutes()).isEqualTo(90);
    }

    @Test
    @DisplayName("LOG-01: Ghi chú chỉ chứa khoảng trắng thì lưu null vào nhật ký")
    void complete_blankNote_savesNull() {
        WorkoutSchedule s = createSchedule(12L, ScheduleStatus.SCHEDULED, NOW.minusHours(2), NOW.minusHours(1));
        when(scheduleRepository.findById(12L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);

        CompleteRequest req = new CompleteRequest(60, 300, 4, "   ");
        service.complete(trainerUser, 12L, req);

        ArgumentCaptor<WorkoutLog> captor = ArgumentCaptor.forClass(WorkoutLog.class);
        verify(logRepository).save(captor.capture());
        assertThat(captor.getValue().getNote()).isNull();
    }

    @Test
    @DisplayName("LOG-03: Buổi tập bị đánh vắng (MISSED) kết thúc 3 ngày trước vẫn hoàn thành được và đổi sang COMPLETED")
    void complete_missedSessionWithin7Days_completesSuccessfully() {
        WorkoutSchedule s = createSchedule(13L, ScheduleStatus.MISSED, NOW.minusDays(3).minusHours(1), NOW.minusDays(3));
        when(scheduleRepository.findById(13L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);

        CompleteRequest req = new CompleteRequest(60, 250, 4, "Học viên tập bù");
        service.complete(trainerUser, 13L, req);

        assertThat(s.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        verify(logRepository).save(any(WorkoutLog.class));
        verify(auditService).log(eq("SCHEDULE_COMPLETE"), eq("SCHEDULE"), eq(13L), eq("HV00001"));
    }

    @Test
    @DisplayName("LOG-03: Buổi kết thúc quá 7 ngày (+1 phút) bị từ chối với lỗi 400, không lưu nhật ký")
    void complete_past7DaysCutoff_failsWith400() {
        WorkoutSchedule s = createSchedule(14L, ScheduleStatus.SCHEDULED, NOW.minusDays(7).minusHours(2), NOW.minusDays(7).minusMinutes(1));
        when(scheduleRepository.findById(14L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);

        CompleteRequest req = new CompleteRequest(60, 200, 3, null);
        assertThatThrownBy(() -> service.complete(trainerUser, 14L, req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("Đã quá 7 ngày");

        verify(logRepository, never()).save(any());
        verify(auditService, never()).log(any(), any(), any(), any());
    }

    @Test
    @DisplayName("LOG-03: Buổi kết thúc cách đây đúng 7 ngày vẫn ghi nhận hoàn thành thành công")
    void complete_exactly7DaysCutoff_completesSuccessfully() {
        WorkoutSchedule s = createSchedule(15L, ScheduleStatus.SCHEDULED, NOW.minusDays(7).minusHours(1), NOW.minusDays(7));
        when(scheduleRepository.findById(15L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);

        CompleteRequest req = new CompleteRequest(60, 200, 3, null);
        service.complete(trainerUser, 15L, req);

        assertThat(s.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        verify(logRepository, times(1)).save(any(WorkoutLog.class));
        verify(auditService).log(eq("SCHEDULE_COMPLETE"), eq("SCHEDULE"), eq(15L), eq("HV00001"));
    }

    @Test
    @DisplayName("Từ chối hoàn thành buổi tập đã bị huỷ (CANCELLED) với lỗi 400, không lưu nhật ký, không ghi audit")
    void complete_cancelledSession_failsWith400() {
        WorkoutSchedule s = createSchedule(16L, ScheduleStatus.CANCELLED, NOW.minusHours(2), NOW.minusHours(1));
        when(scheduleRepository.findById(16L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);

        CompleteRequest req = new CompleteRequest(60, 200, 3, null);
        assertThatThrownBy(() -> service.complete(trainerUser, 16L, req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("Buổi tập đã bị huỷ");

        verify(logRepository, never()).save(any());
        verify(auditService, never()).log(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Từ chối hoàn thành buổi tập đã hoàn thành trước đó (COMPLETED) với lỗi 409 Conflict, không lưu nhật ký")
    void complete_alreadyCompleted_failsWith409() {
        WorkoutSchedule s = createSchedule(17L, ScheduleStatus.COMPLETED, NOW.minusHours(2), NOW.minusHours(1));
        when(scheduleRepository.findById(17L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);

        CompleteRequest req = new CompleteRequest(60, 200, 3, null);
        assertThatThrownBy(() -> service.complete(trainerUser, 17L, req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("Buổi tập này đã được ghi nhận hoàn thành");

        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("Từ chối hoàn thành khi người dùng không có quyền xem thông tin hội viên với lỗi 403 Forbidden")
    void complete_forbidden_failsWith403() {
        WorkoutSchedule s = createSchedule(18L, ScheduleStatus.SCHEDULED, NOW.minusHours(2), NOW.minusHours(1));
        when(scheduleRepository.findById(18L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(false);

        CompleteRequest req = new CompleteRequest(60, 200, 3, null);
        assertThatThrownBy(() -> service.complete(trainerUser, 18L, req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("Từ chối hoàn thành khi mã buổi tập không tồn tại với lỗi 404 Not Found")
    void complete_notFound_failsWith404() {
        when(scheduleRepository.findById(999L)).thenReturn(Optional.empty());

        CompleteRequest req = new CompleteRequest(60, 200, 3, null);
        assertThatThrownBy(() -> service.complete(trainerUser, 999L, req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                .hasMessageContaining("buổi tập");

        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("Buổi tập đang diễn ra (startTime trước hiện tại, endTime sau hiện tại) vẫn ghi nhận hoàn thành được")
    void complete_inProgressSession_completesSuccessfully() {
        WorkoutSchedule s = createSchedule(19L, ScheduleStatus.SCHEDULED, NOW.minusMinutes(30), NOW.plusMinutes(30));
        when(scheduleRepository.findById(19L)).thenReturn(Optional.of(s));
        when(access.canView(trainerUser, member)).thenReturn(true);

        CompleteRequest req = new CompleteRequest(30, 150, 4, "Hoàn thành sớm");
        service.complete(trainerUser, 19L, req);

        assertThat(s.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        verify(logRepository).save(any(WorkoutLog.class));
        verify(auditService).log(eq("SCHEDULE_COMPLETE"), eq("SCHEDULE"), eq(19L), eq("HV00001"));
    }
}
