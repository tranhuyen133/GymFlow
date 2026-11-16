package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.PackageRequestDtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** V49 · Quản lý sửa thời gian gói và hội viên gửi yêu cầu điều chỉnh. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubscriptionAdjustmentServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 16);
    private static final AuthUser ADMIN = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
    private static final AuthUser MEMBER_USER = new AuthUser(10L, "member@gymflow.vn", Role.MEMBER, "Hội viên");

    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock SubscriptionAdjustmentRepository adjustmentRepository;
    @Mock SubscriptionChangeRequestRepository changeRepository;
    @Mock MemberServiceEntitlementRepository entitlementRepository;
    @Mock PtSessionUsageRepository ptSessionUsageRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock UserRepository userRepository;
    @Mock TrainerHandoverService handoverService;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    SubscriptionAdjustmentService service;
    Member member;
    MembershipPlan pt;
    MemberSubscription sub;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(TODAY.atTime(10, 0).atZone(ZONE).toInstant(), ZONE);
        service = new SubscriptionAdjustmentService(subscriptionRepository, adjustmentRepository, changeRepository, entitlementRepository,
                ptSessionUsageRepository, scheduleRepository, trainerRepository, userRepository, handoverService, access, auditService,
                mappers, clock);
        when(mappers.today()).thenReturn(TODAY);
        User u = new User();
        u.setId(10L);
        u.setFullName("Hội viên");
        member = new Member();
        member.setId(100L);
        member.setCode("HV00100");
        member.setStatus(MemberStatus.ACTIVE);
        member.setUser(u);
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);

        pt = new MembershipPlan();
        pt.setId(7L);
        pt.setName("Gym + PT 8 buổi");
        pt.setPlanType(PlanType.GYM_PT);
        sub = new MemberSubscription();
        sub.setId(50L);
        sub.setMember(member);
        sub.setPlan(pt);
        sub.setStartDate(LocalDate.of(2026, 11, 1));
        sub.setEndDate(LocalDate.of(2026, 11, 30));
        sub.setPtSessionsTotal(8);
        sub.setPtValidUntil(LocalDate.of(2026, 12, 1));
        when(subscriptionRepository.findById(50L)).thenReturn(Optional.of(sub));
        when(subscriptionRepository.existsOverlapExcluding(eq(100L), any(), any(), any())).thenReturn(false);
        when(ptSessionUsageRepository.findBySubscriptionIdWithDetails(50L)).thenReturn(List.of());
        when(entitlementRepository.findBySubscriptionIdAndSource(anyLong(), any())).thenReturn(List.of());
        when(scheduleRepository.findUpcoming(eq(100L), any(), any())).thenReturn(List.of());
        when(changeRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
    }

    @Test
    @DisplayName("Quản lý gia hạn thêm 10 ngày: lưu lịch sử trước / sau, hạn dùng buổi PT kéo dài theo")
    void adminExtends() {
        AdjustResult res = service.adminAdjust(ADMIN, 50L, new AdjustDatesRequest(sub.getStartDate(), LocalDate.of(2026, 12, 10), null,
                "Bù 10 ngày phòng tập sửa chữa"));
        assertThat(sub.getEndDate()).isEqualTo(LocalDate.of(2026, 12, 10));
        assertThat(sub.getPtValidUntil()).isEqualTo(LocalDate.of(2026, 12, 11));
        assertThat(res.cancelledSessions()).isZero();
        ArgumentCaptor<SubscriptionAdjustment> cap = ArgumentCaptor.forClass(SubscriptionAdjustment.class);
        verify(adjustmentRepository).save(cap.capture());
        assertThat(cap.getValue().getSource()).isEqualTo(AdjustmentSource.ADMIN);
        assertThat(cap.getValue().getOldEndDate()).isEqualTo(LocalDate.of(2026, 11, 30));
        assertThat(cap.getValue().getNewEndDate()).isEqualTo(LocalDate.of(2026, 12, 10));
    }

    @Test
    @DisplayName("Chặn: kết thúc trước bắt đầu, không đổi gì, trùng gói khác, bỏ ra ngoài buổi PT đã trừ")
    void adminRules() {
        assertThatThrownBy(() -> service.adminAdjust(ADMIN, 50L, new AdjustDatesRequest(TODAY, TODAY.minusDays(1), null, "Nhập nhầm ngày")))
                .isInstanceOf(ApiException.class).hasMessageContaining("Ngày kết thúc");
        assertThatThrownBy(() -> service.adminAdjust(ADMIN, 50L, new AdjustDatesRequest(sub.getStartDate(), sub.getEndDate(), null, "Không đổi gì")))
                .isInstanceOf(ApiException.class).hasMessageContaining("giống hệt");

        PtSessionUsage used = new PtSessionUsage();
        WorkoutSchedule ws = new WorkoutSchedule();
        ws.setStartTime(LocalDateTime.of(2026, 11, 5, 18, 0));
        used.setSchedule(ws);
        when(ptSessionUsageRepository.findBySubscriptionIdWithDetails(50L)).thenReturn(List.of(used));
        assertThatThrownBy(() -> service.adminAdjust(ADMIN, 50L, new AdjustDatesRequest(LocalDate.of(2026, 11, 10), LocalDate.of(2026, 12, 9), null, "Dời ngày bắt đầu")))
                .isInstanceOf(ApiException.class).hasMessageContaining("05/11/2026");

        MemberSubscription other = new MemberSubscription();
        other.setId(51L);
        other.setPlan(pt);
        other.setStartDate(LocalDate.of(2026, 12, 1));
        other.setEndDate(LocalDate.of(2026, 12, 30));
        when(subscriptionRepository.existsOverlapExcluding(eq(100L), any(), any(), any())).thenReturn(true);
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(100L)).thenReturn(List.of(other, sub));
        when(ptSessionUsageRepository.findBySubscriptionIdWithDetails(50L)).thenReturn(List.of());
        assertThatThrownBy(() -> service.adminAdjust(ADMIN, 50L, new AdjustDatesRequest(sub.getStartDate(), LocalDate.of(2026, 12, 5), null, "Gia hạn thêm")))
                .isInstanceOf(ApiException.class).hasMessageContaining("trùng gói");
        verify(adjustmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Buổi đã xếp không còn nằm trong gói nào sau khi rút ngắn → tự huỷ và báo lại")
    void cancelsUncoveredSessions() {
        WorkoutSchedule late = new WorkoutSchedule();
        late.setTitle("Buổi PT");
        late.setStartTime(LocalDateTime.of(2026, 11, 28, 18, 0));
        late.setStatus(ScheduleStatus.SCHEDULED);
        when(scheduleRepository.findUpcoming(eq(100L), any(), any())).thenReturn(List.of(late));
        when(subscriptionRepository.findEffective(100L, LocalDate.of(2026, 11, 28))).thenReturn(List.of());

        AdjustResult res = service.adminAdjust(ADMIN, 50L, new AdjustDatesRequest(sub.getStartDate(), LocalDate.of(2026, 11, 25), null,
                "Hội viên xin rút ngắn gói"));
        assertThat(res.cancelledSessions()).isEqualTo(1);
        assertThat(late.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(res.notes()).anyMatch(n -> n.contains("28/11"));
    }

    @Test
    @DisplayName("Hội viên: gói đang dùng không dời ngày bắt đầu được, bảo lưu tối đa 30 ngày, đổi HLV phải khác HLV hiện tại")
    void memberRequestRules() {
        assertThatThrownBy(() -> service.create(MEMBER_USER, new CreateChangeRequest(50L, ChangeRequestType.CHANGE_START, TODAY.plusDays(3), null, null, "Đi công tác")))
                .isInstanceOf(ApiException.class).hasMessageContaining("Bảo lưu");
        assertThatThrownBy(() -> service.create(MEMBER_USER, new CreateChangeRequest(50L, ChangeRequestType.PAUSE, null, 31, null, "Ốm phải nghỉ dài")))
                .isInstanceOf(ApiException.class).hasMessageContaining("từ 1 đến 30");

        Trainer t = new Trainer();
        t.setId(3L);
        t.setActive(true);
        t.setUser(new User());
        member.setTrainer(t);
        when(trainerRepository.findById(3L)).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> service.create(MEMBER_USER, new CreateChangeRequest(50L, ChangeRequestType.CHANGE_TRAINER, null, null, 3L, "Muốn đổi giờ tập")))
                .isInstanceOf(ApiException.class).hasMessageContaining("đang phụ trách");
        verify(changeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Hội viên gửi bảo lưu 7 ngày hợp lệ → lưu yêu cầu chờ duyệt kèm thời gian cũ")
    void memberPauseRequest() {
        ChangeRequestResponse res = service.create(MEMBER_USER, new CreateChangeRequest(50L, ChangeRequestType.PAUSE, null, 7, null, "  Đi công tác Đà Nẵng  "));
        ArgumentCaptor<SubscriptionChangeRequest> cap = ArgumentCaptor.forClass(SubscriptionChangeRequest.class);
        verify(changeRepository).save(cap.capture());
        assertThat(cap.getValue().getPauseDays()).isEqualTo(7);
        assertThat(cap.getValue().getReason()).isEqualTo("Đi công tác Đà Nẵng");
        assertThat(cap.getValue().getOldEndDate()).isEqualTo(LocalDate.of(2026, 11, 30));
        assertThat(res.newEndDate()).isEqualTo(LocalDate.of(2026, 12, 7));
        assertThat(res.status()).isEqualTo(PackageRequestStatus.PENDING);
    }

    @Test
    @DisplayName("Không gửi được yêu cầu cho gói của người khác")
    void otherMembersSubscription() {
        Member someone = new Member();
        someone.setId(999L);
        sub.setMember(someone);
        assertThatThrownBy(() -> service.create(MEMBER_USER, new CreateChangeRequest(50L, ChangeRequestType.PAUSE, null, 3, null, "Thử gói người khác")))
                .isInstanceOf(ApiException.class);
        verify(changeRepository, never()).save(any());
    }
}
