package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.SubscriptionRequest;
import com.gymflow.dto.Dtos.SubscriptionResponse;
import com.gymflow.dto.PackageRequestDtos.*;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.PackageRequestRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PackageRequestServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 4);

    @Mock PackageRequestRepository requestRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock UserRepository userRepository;
    @Mock SubscriptionService subscriptionService;
    @Mock PlanService planService;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;
    @Mock TrainerRepository trainerRepository;
    @Mock PaymentSettingsService paymentSettings;

    PackageRequestService service;
    AuthUser memberUser = new AuthUser(20L, "hv@example.com", Role.MEMBER, "Hội Viên");
    AuthUser admin = new AuthUser(9L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
    Member member;
    MembershipPlan plan;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(TODAY.atTime(10, 0).atZone(ZONE).toInstant(), ZONE);
        service = new PackageRequestService(requestRepository, subscriptionRepository, userRepository, subscriptionService,
                planService, access, auditService, mappers, clock, trainerRepository, paymentSettings);
        User u = new User();
        u.setId(20L);
        u.setFullName("Hội Viên");
        member = new Member();
        member.setId(1L);
        member.setCode("HV00001");
        member.setStatus(MemberStatus.ACTIVE);
        member.setUser(u);
        plan = new MembershipPlan();
        plan.setId(2L);
        plan.setName("Gói 1 tháng");
        plan.setDurationDays(30);
        plan.setPrice(500_000L);
        plan.setActive(true);
        lenient().when(mappers.today()).thenReturn(TODAY);
        lenient().when(access.requireMemberOf(memberUser)).thenReturn(member);
        lenient().when(planService.load(2L)).thenReturn(plan);
        lenient().when(requestRepository.saveAndFlush(any())).thenAnswer(inv -> {
            PackageRequest r = inv.getArgument(0);
            r.setId(100L);
            return r;
        });
    }

    private PackageRequest pending(LocalDate desired) {
        PackageRequest r = new PackageRequest();
        r.setId(100L);
        r.setMember(member);
        r.setPlan(plan);
        r.setPlanName(plan.getName());
        r.setPrice(450_000L);
        r.setDurationDays(30);
        r.setDesiredStartDate(desired);
        r.setStatus(PackageRequestStatus.PENDING);
        return r;
    }

    private static SubscriptionResponse sub(LocalDate start) {
        return new SubscriptionResponse(77L, 1L, "Hội Viên", "HV00001", 2L, "Gói 1 tháng", start, start.plusDays(29),
                450_000L, SubscriptionState.ACTIVE, 29, false, null, null, null, "Quản lý", null, null, null, null);
    }

    // ---------- Gửi đơn ----------

    @Test
    void createSnapshotsPriceAndIsPending() {
        PackageRequestResponse res = service.create(memberUser, new CreatePackageRequest(2L, null, "  "));
        assertThat(res.status()).isEqualTo(PackageRequestStatus.PENDING);
        assertThat(res.price()).isEqualTo(500_000L);
        assertThat(res.planName()).isEqualTo("Gói 1 tháng");
        assertThat(res.note()).isNull();
        verify(auditService).log(eq("PACKAGE_REQUEST_CREATE"), eq("PACKAGE_REQUEST"), eq(100L), any());
        verifyNoInteractions(subscriptionService);
    }

    @Test
    void memberRowIsLockedBeforePendingCheck() {
        service.create(memberUser, new CreatePackageRequest(2L, null, null));
        InOrder order = inOrder(subscriptionRepository, requestRepository);
        order.verify(subscriptionRepository).lockMember(1L);
        order.verify(requestRepository).existsByMemberIdAndStatus(1L, PackageRequestStatus.PENDING);
        order.verify(requestRepository).saveAndFlush(any());
    }

    @Test
    void secondPendingRequestIsRejected() {
        when(requestRepository.existsByMemberIdAndStatus(1L, PackageRequestStatus.PENDING)).thenReturn(true);
        assertThatThrownBy(() -> service.create(memberUser, new CreatePackageRequest(2L, null, null)))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        verify(requestRepository, never()).saveAndFlush(any());
    }

    @Test
    void discontinuedPlanCannotBeRequested() {
        plan.setActive(false);
        assertThatThrownBy(() -> service.create(memberUser, new CreatePackageRequest(2L, null, null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("ngừng kinh doanh");
        verify(requestRepository, never()).saveAndFlush(any());
    }

    @Test
    void inactiveMemberCannotRequest() {
        member.setStatus(MemberStatus.INACTIVE);
        assertThatThrownBy(() -> service.create(memberUser, new CreatePackageRequest(2L, null, null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("ngừng hoạt động");
    }

    @Test
    void desiredStartMustBeTodayToSixtyDays() {
        assertThatThrownBy(() -> service.create(memberUser, new CreatePackageRequest(2L, TODAY.minusDays(1), null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("quá khứ");
        assertThatThrownBy(() -> service.create(memberUser, new CreatePackageRequest(2L, TODAY.plusDays(61), null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("60 ngày");
        assertThat(service.create(memberUser, new CreatePackageRequest(2L, TODAY.plusDays(60), null)).desiredStartDate())
                .isEqualTo(TODAY.plusDays(60));
    }

    @Test
    void desiredStartOverlappingCurrentPackageIsRejected() {
        when(subscriptionRepository.existsOverlap(1L, TODAY, TODAY.plusDays(29))).thenReturn(true);
        assertThatThrownBy(() -> service.create(memberUser, new CreatePackageRequest(2L, TODAY, null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("trùng");
    }

    // ---------- Hội viên huỷ ----------

    @Test
    void memberCancelsOwnPendingRequest() {
        PackageRequest r = pending(null);
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(r));
        assertThat(service.cancelMine(memberUser, 100L).status()).isEqualTo(PackageRequestStatus.CANCELLED);
    }

    @Test
    void memberCannotCancelSomeoneElsesRequest() {
        Member other = new Member();
        other.setId(5L);
        PackageRequest r = pending(null);
        r.setMember(other);
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.cancelMine(memberUser, 100L))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        assertThat(r.getStatus()).isEqualTo(PackageRequestStatus.PENDING);
    }

    @Test
    void decidedRequestCannotBeCancelled() {
        PackageRequest r = pending(null);
        r.setStatus(PackageRequestStatus.APPROVED);
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.cancelMine(memberUser, 100L)).isInstanceOf(ApiException.class);
    }

    // ---------- Quản lý duyệt / từ chối ----------

    @Test
    void approveCreatesSubscriptionWithSnapshotPrice() {
        PackageRequest r = pending(TODAY.plusDays(3));
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(r));
        when(subscriptionService.create(eq(admin), any())).thenReturn(sub(TODAY.plusDays(3)));

        PackageRequestResponse res = service.approve(admin, 100L, new ApprovePackageRequest("Đã thu tiền mặt"));

        ArgumentCaptor<SubscriptionRequest> cap = ArgumentCaptor.forClass(SubscriptionRequest.class);
        verify(subscriptionService).create(eq(admin), cap.capture());
        assertThat(cap.getValue().memberId()).isEqualTo(1L);
        assertThat(cap.getValue().startDate()).isEqualTo(TODAY.plusDays(3));
        assertThat(cap.getValue().pricePaid()).isEqualTo(450_000L);
        assertThat(cap.getValue().note()).contains("Đơn #100").contains("Đã thu tiền mặt");
        assertThat(res.status()).isEqualTo(PackageRequestStatus.APPROVED);
        assertThat(r.getDecisionNote()).isEqualTo("Đã thu tiền mặt");
    }

    @Test
    void approveChainsWhenDesiredStartPassedOrTaken() {
        PackageRequest past = pending(TODAY.minusDays(2));
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(past));
        when(subscriptionService.create(eq(admin), any())).thenReturn(sub(TODAY));
        service.approve(admin, 100L, null);
        verify(subscriptionService).create(eq(admin), argThat(s -> s.startDate() == null));
    }

    @Test
    void approvedRequestCannotBeApprovedTwice() {
        PackageRequest r = pending(null);
        r.setStatus(PackageRequestStatus.APPROVED);
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.approve(admin, 100L, null))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        verifyNoInteractions(subscriptionService);
    }

    @Test
    void approveBlockedWhenPlanDiscontinued() {
        plan.setActive(false);
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(pending(null)));
        assertThatThrownBy(() -> service.approve(admin, 100L, null)).isInstanceOf(ApiException.class).hasMessageContaining("từ chối");
        verifyNoInteractions(subscriptionService);
    }

    @Test
    void rejectStoresReasonAndDoesNotCreateSubscription() {
        PackageRequest r = pending(null);
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(r));
        PackageRequestResponse res = service.reject(admin, 100L, new RejectPackageRequest("  Chưa thanh toán tại quầy  "));
        assertThat(res.status()).isEqualTo(PackageRequestStatus.REJECTED);
        assertThat(r.getDecisionNote()).isEqualTo("Chưa thanh toán tại quầy");
        verifyNoInteractions(subscriptionService);
    }

    @Test
    void rejectNeedsRealReason() {
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(pending(null)));
        assertThatThrownBy(() -> service.reject(admin, 100L, new RejectPackageRequest("  ab   ")))
                .isInstanceOf(ApiException.class).hasMessageContaining("Lý do");
    }

    // ---------- Gói có / không kèm HLV, thanh toán chuyển khoản (V12) ----------

    private Trainer trainer(long id, boolean active) {
        User u = new User();
        u.setId(300L + id);
        u.setFullName("HLV " + id);
        Trainer t = new Trainer();
        t.setId(id);
        t.setUser(u);
        t.setActive(active);
        return t;
    }

    @Test
    void createDefaultsToCounterAndGivesPaymentCode() {
        PackageRequestResponse res = service.create(memberUser, new CreatePackageRequest(2L, null, null));
        assertThat(res.paymentMethod()).isEqualTo(PaymentMethod.COUNTER);
        assertThat(res.paymentCode()).isEqualTo("GF000100");
        assertThat(res.trainerId()).isNull();
        verifyNoInteractions(paymentSettings, trainerRepository);
    }

    @Test
    void bankTransferNeedsOnlinePaymentEnabled() {
        when(paymentSettings.onlineReady()).thenReturn(false);
        assertThatThrownBy(() -> service.create(memberUser, new CreatePackageRequest(2L, null, null, PaymentMethod.BANK_TRANSFER, null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("chuyển khoản");
        verify(requestRepository, never()).saveAndFlush(any());
    }

    @Test
    void bankTransferRequestIsPendingUntilAdminApproves() {
        when(paymentSettings.onlineReady()).thenReturn(true);
        PackageRequestResponse res = service.create(memberUser, new CreatePackageRequest(2L, null, null, PaymentMethod.BANK_TRANSFER, null));
        assertThat(res.paymentMethod()).isEqualTo(PaymentMethod.BANK_TRANSFER);
        assertThat(res.status()).isEqualTo(PackageRequestStatus.PENDING);
        verifyNoInteractions(subscriptionService);
    }

    @Test
    void ptPlanRequiresActiveTrainer() {
        plan.setIncludesTrainer(true);
        assertThatThrownBy(() -> service.create(memberUser, new CreatePackageRequest(2L, null, null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("chọn huấn luyện viên");
        when(trainerRepository.findById(7L)).thenReturn(Optional.of(trainer(7L, false)));
        assertThatThrownBy(() -> service.create(memberUser, new CreatePackageRequest(2L, null, null, null, 7L)))
                .isInstanceOf(ApiException.class).hasMessageContaining("ngừng nhận");
        verify(requestRepository, never()).saveAndFlush(any());
    }

    @Test
    void nonPtPlanIgnoresTrainerChoice() {
        PackageRequestResponse res = service.create(memberUser, new CreatePackageRequest(2L, null, null, null, 7L));
        assertThat(res.trainerId()).isNull();
        verifyNoInteractions(trainerRepository);
    }

    @Test
    void approvingPtRequestAssignsChosenTrainer() {
        plan.setIncludesTrainer(true);
        Trainer t = trainer(7L, true);
        PackageRequest r = pending(null);
        r.setTrainer(t);
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(r));
        when(subscriptionService.create(eq(admin), any())).thenReturn(sub(TODAY));

        service.approve(admin, 100L, null);

        assertThat(member.getTrainer()).isSameAs(t);
        verify(auditService).log(eq("MEMBER_ASSIGN_TRAINER"), eq("MEMBER"), eq(1L), any());
    }

    @Test
    void approvingPtRequestWithInactiveTrainerCreatesNothing() {
        plan.setIncludesTrainer(true);
        PackageRequest r = pending(null);
        r.setTrainer(trainer(7L, false));
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.approve(admin, 100L, null)).isInstanceOf(ApiException.class).hasMessageContaining("HLV khác");
        verifyNoInteractions(subscriptionService);
        assertThat(member.getTrainer()).isNull();
    }

    @Test
    void memberMarksBankTransferAsPaidOnlyForOwnPendingRequest() {
        PackageRequest r = pending(null);
        r.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        r.setPaymentCode("GF000100");
        when(requestRepository.lockById(100L)).thenReturn(Optional.of(r));
        assertThat(service.markPaid(memberUser, 100L).memberPaidAt()).isNotNull();
        assertThat(r.getStatus()).isEqualTo(PackageRequestStatus.PENDING);
        verifyNoInteractions(subscriptionService);

        PackageRequest counter = pending(null);
        when(requestRepository.lockById(101L)).thenReturn(Optional.of(counter));
        assertThatThrownBy(() -> service.markPaid(memberUser, 101L)).isInstanceOf(ApiException.class).hasMessageContaining("tại quầy");
    }
}
