package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.OnboardingResponse;
import com.gymflow.repository.ConversationRepository;
import com.gymflow.repository.MemberRepository;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.PackageRequestRepository;
import com.gymflow.repository.UserTourProgressRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OnboardingServiceTest {

    @Mock
    private MemberRepository memberRepository;
    @Mock
    private MemberSubscriptionRepository subscriptionRepository;
    @Mock
    private PackageRequestRepository packageRequestRepository;
    @Mock
    private ConversationRepository conversationRepository;
    @Mock
    private UserTourProgressRepository tourProgressRepository;
    @Mock
    private AccessService access;

    private Clock fixedClock;
    private LocalDate today;
    private OnboardingService onboardingService;

    private User user;
    private Member member;
    private AuthUser authUser;
    private MembershipPlan plan;

    @BeforeEach
    void setUp() {
        // Cố định "hôm nay" là 10/11/2026
        fixedClock = Clock.fixed(Instant.parse("2026-11-10T10:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        today = LocalDate.now(fixedClock);

        onboardingService = new OnboardingService(
                memberRepository,
                subscriptionRepository,
                packageRequestRepository,
                conversationRepository,
                tourProgressRepository,
                access,
                fixedClock
        );

        user = new User();
        user.setId(1L);
        user.setFullName("Nguyễn Văn A");
        user.setPhone("0987654321");
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.of(2026, 11, 1, 8, 0));
        user.setUpdatedAt(LocalDateTime.of(2026, 11, 1, 8, 0));

        member = new Member();
        member.setId(10L);
        member.setUser(user);
        member.setStatus(MemberStatus.ACTIVE);
        member.setDateOfBirth(LocalDate.of(2000, 1, 1));

        authUser = new AuthUser(1L, "member@gymflow.local", Role.MEMBER, "Nguyễn Văn A");

        plan = new MembershipPlan();
        plan.setId(100L);
        plan.setName("Gói 1 tháng");
        plan.setPrice(500_000L);
        plan.setDurationDays(30);

        when(access.requireMemberOf(authUser)).thenReturn(member);
    }

    private MemberSubscription createSub(LocalDate start, LocalDate end, boolean cancelled) {
        MemberSubscription s = new MemberSubscription();
        s.setId(1000L);
        s.setMember(member);
        s.setPlan(plan);
        s.setStartDate(start);
        s.setEndDate(end);
        s.setPricePaid(500_000L);
        s.setCancelled(cancelled);
        s.setCreatedAt(start.atStartOfDay());
        return s;
    }

    private PackageRequest createRequest(PackageRequestStatus status, PaymentMethod method, LocalDateTime memberPaidAt) {
        PackageRequest pr = new PackageRequest();
        pr.setId(500L);
        pr.setMember(member);
        pr.setPlan(plan);
        pr.setPlanName(plan.getName());
        pr.setPrice(plan.getPrice());
        pr.setDurationDays(plan.getDurationDays());
        pr.setStatus(status);
        pr.setPaymentMethod(method);
        pr.setPaymentCode("GF000500");
        pr.setMemberPaidAt(memberPaidAt);
        pr.setCreatedAt(LocalDateTime.of(2026, 11, 2, 10, 0));
        return pr;
    }

    @Test
    @DisplayName("readyToTrain = false: vừa đăng ký, chưa có đơn")
    void newlyRegisteredWithoutRequest() {
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(Collections.emptyList());
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(Collections.emptyList());
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        assertThat(res.readyToTrain()).isFalse();
        assertThat(res.currentStep()).isEqualTo("request");
        assertThat(res.entitlements()).isNull();
    }

    @Test
    @DisplayName("readyToTrain = false: đơn PENDING")
    void pendingRequest() {
        PackageRequest pr = createRequest(PackageRequestStatus.PENDING, PaymentMethod.COUNTER, null);
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(Collections.emptyList());
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(List.of(pr));
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        assertThat(res.readyToTrain()).isFalse();
        assertThat(res.currentStep()).isEqualTo("payment");
    }

    @Test
    @DisplayName("readyToTrain = false: đơn PENDING đã có member_paid_at")
    void pendingRequestWithMemberPaidAt() {
        PackageRequest pr = createRequest(PackageRequestStatus.PENDING, PaymentMethod.BANK_TRANSFER, LocalDateTime.of(2026, 11, 3, 14, 30));
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(Collections.emptyList());
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(List.of(pr));
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        assertThat(res.readyToTrain()).isFalse();
        assertThat(res.currentStep()).isEqualTo("payment");
        assertThat(res.steps().stream().filter(s -> s.key().equals("payment")).findFirst().get().reason())
                .contains("Bạn đã báo chuyển khoản lúc 14:30");
    }

    @Test
    @DisplayName("readyToTrain = false: đơn APPROVED nhưng start_date ở tương lai")
    void approvedRequestWithFutureStartDate() {
        PackageRequest pr = createRequest(PackageRequestStatus.APPROVED, PaymentMethod.BANK_TRANSFER, LocalDateTime.of(2026, 11, 3, 14, 30));
        pr.setDecidedAt(LocalDateTime.of(2026, 11, 3, 15, 0));

        // start_date ở tương lai: 15/11/2026 (sau hôm nay 10/11)
        MemberSubscription futureSub = createSub(LocalDate.of(2026, 11, 15), LocalDate.of(2026, 12, 15), false);

        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(List.of(futureSub));
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(List.of(pr));
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        assertThat(res.readyToTrain()).isFalse();
        assertThat(res.currentStep()).isEqualTo("activation");
        assertThat(res.steps().stream().filter(s -> s.key().equals("activation")).findFirst().get().status())
                .isEqualTo("BLOCKED");
        assertThat(res.steps().stream().filter(s -> s.key().equals("activation")).findFirst().get().reason())
                .contains("Gói của bạn bắt đầu từ 15/11/2026");
    }

    @Test
    @DisplayName("readyToTrain = false: gói đã hết hạn")
    void expiredSubscription() {
        // Hết hạn ngày 05/11/2026 (trước hôm nay 10/11)
        MemberSubscription expiredSub = createSub(LocalDate.of(2026, 10, 5), LocalDate.of(2026, 11, 5), false);
        PackageRequest pr = createRequest(PackageRequestStatus.APPROVED, PaymentMethod.COUNTER, null);

        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(List.of(expiredSub));
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(List.of(pr));
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        assertThat(res.readyToTrain()).isFalse();
        assertThat(res.currentStep()).isEqualTo("activation");
        assertThat(res.steps().stream().filter(s -> s.key().equals("activation")).findFirst().get().reason())
                .contains("Gói đã hết hạn");
    }

    @Test
    @DisplayName("readyToTrain = false: gói bị huỷ")
    void cancelledSubscription() {
        // Gói bao trùm hôm nay nhưng bị huỷ (cancelled = true)
        MemberSubscription cancelledSub = createSub(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), true);
        PackageRequest pr = createRequest(PackageRequestStatus.APPROVED, PaymentMethod.COUNTER, null);

        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(List.of(cancelledSub));
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(List.of(pr));
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        assertThat(res.readyToTrain()).isFalse();
        assertThat(res.currentStep()).isEqualTo("activation");
    }

    @Test
    @DisplayName("readyToTrain = false: hội viên PAUSED")
    void memberPaused() {
        member.setStatus(MemberStatus.PAUSED);
        MemberSubscription activeSub = createSub(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), false);
        PackageRequest pr = createRequest(PackageRequestStatus.APPROVED, PaymentMethod.COUNTER, null);

        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(List.of(activeSub));
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(List.of(pr));
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        assertThat(res.readyToTrain()).isFalse();
        assertThat(res.steps().stream().filter(s -> s.key().equals("ready")).findFirst().get().status())
                .isEqualTo("BLOCKED");
        assertThat(res.steps().stream().filter(s -> s.key().equals("ready")).findFirst().get().reason())
                .contains("Hội viên đang tạm ngưng");
    }

    @Test
    @DisplayName("readyToTrain = false: tài khoản LOCKED")
    void userLocked() {
        user.setStatus(UserStatus.LOCKED);
        MemberSubscription activeSub = createSub(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), false);
        PackageRequest pr = createRequest(PackageRequestStatus.APPROVED, PaymentMethod.COUNTER, null);

        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(List.of(activeSub));
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(List.of(pr));
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        assertThat(res.readyToTrain()).isFalse();
        assertThat(res.steps().stream().filter(s -> s.key().equals("ready")).findFirst().get().status())
                .isEqualTo("BLOCKED");
        assertThat(res.steps().stream().filter(s -> s.key().equals("ready")).findFirst().get().reason())
                .contains("Tài khoản đang bị khoá");
    }

    @Test
    @DisplayName("readyToTrain = true: tài khoản ACTIVE, hội viên ACTIVE, gói còn hiệu lực hôm nay")
    void readyToTrainTrueWhenAllActive() {
        MemberSubscription activeSub = createSub(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), false);
        PackageRequest pr = createRequest(PackageRequestStatus.APPROVED, PaymentMethod.COUNTER, null);

        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(List.of(activeSub));
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(List.of(pr));
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        assertThat(res.readyToTrain()).isTrue();
        assertThat(res.currentStep()).isEqualTo("ready");
        assertThat(res.entitlements()).isNotNull();
        assertThat(res.entitlements().planName()).isEqualTo("Gói 1 tháng");
        assertThat(res.steps().stream().filter(s -> s.key().equals("ready")).findFirst().get().status())
                .isEqualTo("DONE");
    }

    @Test
    @DisplayName("Bước 'explore' chưa DONE nhưng các điều kiện bắt buộc đã đủ -> readyToTrain vẫn true")
    void exploreNotDoneDoesNotBlockReadyToTrain() {
        MemberSubscription activeSub = createSub(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), false);
        PackageRequest pr = createRequest(PackageRequestStatus.APPROVED, PaymentMethod.COUNTER, null);

        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(List.of(activeSub));
        when(packageRequestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())).thenReturn(List.of(pr));
        when(conversationRepository.findByMemberId(member.getId())).thenReturn(Collections.emptyList());

        OnboardingResponse res = onboardingService.getOnboarding(authUser);

        // explore là khuyến nghị (required = false)
        assertThat(res.steps().stream().filter(s -> s.key().equals("explore")).findFirst().get().required())
                .isFalse();
        assertThat(res.readyToTrain()).isTrue();
    }
}
