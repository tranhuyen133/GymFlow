package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.SubscriptionRequest;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** SCRUM-160: huỷ gói và các luật còn lại khi đăng ký (bổ sung cho SubscriptionServiceTest). */
@ExtendWith(MockitoExtension.class)
class SubscriptionCancelTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 26);
    private static final AuthUser ADMIN = new AuthUser(9L, "admin@gymflow.vn", Role.ADMIN, "Admin");

    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock UserRepository userRepository;
    @Mock PlanService planService;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    SubscriptionService service;
    Member member;
    MembershipPlan plan;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(TODAY.atTime(10, 0).atZone(ZONE).toInstant(), ZONE);
        service = new SubscriptionService(subscriptionRepository, userRepository, planService, access, auditService, mappers, clock);
        member = new Member();
        member.setId(1L);
        member.setCode("HV00001");
        member.setStatus(MemberStatus.ACTIVE);
        plan = new MembershipPlan();
        plan.setId(2L);
        plan.setName("Gói 1 tháng");
        plan.setDurationDays(30);
        plan.setPrice(500_000L);
        plan.setActive(true);
        lenient().when(mappers.today()).thenReturn(TODAY);
        lenient().when(access.loadMember(1L)).thenReturn(member);
        lenient().when(planService.load(2L)).thenReturn(plan);
    }

    private MemberSubscription stored(LocalDate start, LocalDate end) {
        MemberSubscription s = new MemberSubscription();
        s.setId(7L);
        s.setMember(member);
        s.setPlan(plan);
        s.setStartDate(start);
        s.setEndDate(end);
        when(subscriptionRepository.findById(7L)).thenReturn(Optional.of(s));
        return s;
    }

    // ---------- Huỷ gói ----------

    @Test
    void cancelKeepsRecordAndLogsAudit() {
        MemberSubscription s = stored(TODAY.minusDays(5), TODAY.plusDays(24));
        service.cancel(7L, null);
        assertThat(s.isCancelled()).isTrue();
        assertThat(s.getCancelledAt()).isEqualTo(TODAY.atTime(10, 0));
        assertThat(s.getNote()).isNull();
        verify(subscriptionRepository, never()).delete(any());
        verify(subscriptionRepository, never()).deleteById(any());
        verify(auditService).log("SUBSCRIPTION_CANCEL", "SUBSCRIPTION", 7L, "HV00001");
    }

    @Test
    void upcomingPackageCanBeCancelled() {
        MemberSubscription s = stored(TODAY.plusDays(1), TODAY.plusDays(30));
        service.cancel(7L, "Đổi gói");
        assertThat(s.stateOn(TODAY)).isEqualTo(SubscriptionState.CANCELLED);
    }

    @Test
    void cancellingTwiceIsRejected() {
        MemberSubscription s = stored(TODAY, TODAY.plusDays(29));
        s.setCancelled(true);
        assertThatThrownBy(() -> service.cancel(7L, null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("đã bị huỷ")
                .extracting(e -> ((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(auditService);
    }

    @Test
    void expiredPackageCannotBeCancelled() {
        MemberSubscription s = stored(TODAY.minusDays(30), TODAY.minusDays(1));
        assertThatThrownBy(() -> service.cancel(7L, null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("hết hạn");
        assertThat(s.isCancelled()).isFalse();
    }

    @Test
    void packageEndingTodayCanStillBeCancelled() {
        MemberSubscription s = stored(TODAY.minusDays(29), TODAY);
        service.cancel(7L, null);
        assertThat(s.isCancelled()).isTrue();
    }

    @Test
    void unknownSubscriptionIs404() {
        when(subscriptionRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.cancel(99L, null))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void reasonIsAppendedToExistingNote() {
        MemberSubscription s = stored(TODAY, TODAY.plusDays(29));
        s.setNote("Khuyến mãi tháng 10");
        service.cancel(7L, "  Chuyển nhà  ");
        assertThat(s.getNote()).isEqualTo("Khuyến mãi tháng 10 | Huỷ: Chuyển nhà");
        verify(auditService).log("SUBSCRIPTION_CANCEL", "SUBSCRIPTION", 7L, "HV00001 · Chuyển nhà");
    }

    @Test
    void blankReasonDoesNotTouchNote() {
        MemberSubscription s = stored(TODAY, TODAY.plusDays(29));
        service.cancel(7L, "   ");
        assertThat(s.getNote()).isNull();
    }

    @Test
    void mergedNoteIsCutToColumnLength() {
        MemberSubscription s = stored(TODAY, TODAY.plusDays(29));
        s.setNote("x".repeat(250));
        service.cancel(7L, "Lý do dài");
        assertThat(s.getNote()).hasSize(255).startsWith("x".repeat(250) + " | Hu");
    }

    // ---------- Luật còn lại khi đăng ký ----------

    @Test
    void inactiveMemberIsRejectedBeforeLocking() {
        member.setStatus(MemberStatus.INACTIVE);
        assertThatThrownBy(() -> service.create(ADMIN, new SubscriptionRequest(1L, 2L, null, null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("ngừng hoạt động");
        verify(subscriptionRepository, never()).lockMember(any());
        verify(subscriptionRepository, never()).saveAndFlush(any());
    }

    @Test
    void startDateMoreThan30DaysBackIsRejected() {
        assertThatThrownBy(() -> service.create(ADMIN, new SubscriptionRequest(1L, 2L, TODAY.minusDays(31), null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("30 ngày");
        verify(subscriptionRepository, never()).saveAndFlush(any());
    }

    @Test
    void startDateExactly30DaysBackIsAllowed() {
        when(subscriptionRepository.existsOverlap(any(), any(), any())).thenReturn(false);
        when(subscriptionRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        service.create(ADMIN, new SubscriptionRequest(1L, 2L, TODAY.minusDays(30), null, null));
        verify(subscriptionRepository).saveAndFlush(argThat(s -> s.getStartDate().equals(TODAY.minusDays(30))
                && s.getEndDate().equals(TODAY.minusDays(1))));
    }

    @Test
    void chainedRenewalIsLoggedAsRenew() {
        when(subscriptionRepository.maxEndDate(1L)).thenReturn(TODAY.plusDays(5));
        when(subscriptionRepository.existsOverlap(any(), any(), any())).thenReturn(false);
        when(subscriptionRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        service.create(ADMIN, new SubscriptionRequest(1L, 2L, null, null, null));
        verify(auditService).log(eq("SUBSCRIPTION_RENEW"), eq("SUBSCRIPTION"), any(), contains(TODAY.plusDays(6).toString()));
    }

    @Test
    void firstPackageIsLoggedAsCreate() {
        when(subscriptionRepository.maxEndDate(1L)).thenReturn(null);
        when(subscriptionRepository.existsOverlap(any(), any(), any())).thenReturn(false);
        when(subscriptionRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        service.create(ADMIN, new SubscriptionRequest(1L, 2L, null, null, null));
        verify(auditService).log(eq("SUBSCRIPTION_CREATE"), eq("SUBSCRIPTION"), any(), anyString());
    }

    @Test
    void explicitPriceAndNoteAreKept() {
        when(subscriptionRepository.maxEndDate(1L)).thenReturn(null);
        when(subscriptionRepository.existsOverlap(any(), any(), any())).thenReturn(false);
        when(subscriptionRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        service.create(ADMIN, new SubscriptionRequest(1L, 2L, null, 400_000L, "  Giảm giá sinh viên "));
        verify(subscriptionRepository).saveAndFlush(argThat(s -> s.getPricePaid() == 400_000L
                && "Giảm giá sinh viên".equals(s.getNote())));
    }
}
