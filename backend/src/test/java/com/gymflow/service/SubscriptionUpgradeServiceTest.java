package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.PromotionValidationResponse;
import com.gymflow.dto.Dtos.SubscriptionRequest;
import com.gymflow.dto.Dtos.SubscriptionResponse;
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

/** V49 · Nâng gói tự tập lên gói có PT: báo giá, điều kiện, duyệt cắt gói cũ + tạo gói PT. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubscriptionUpgradeServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 16);
    private static final AuthUser MEMBER_USER = new AuthUser(10L, "member@gymflow.vn", Role.MEMBER, "Hội viên");
    private static final AuthUser ADMIN = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");

    @Mock PackageRequestRepository requestRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock SubscriptionAdjustmentRepository adjustmentRepository;
    @Mock MemberServiceEntitlementRepository entitlementRepository;
    @Mock PromotionRepository promotionRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock UserRepository userRepository;
    @Mock PlanService planService;
    @Mock PromotionService promotionService;
    @Mock PackageRequestService packageRequestService;
    @Mock SubscriptionService subscriptionService;
    @Mock PaymentSettingsService paymentSettings;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    SubscriptionUpgradeService service;
    Member member;
    Trainer trainer;
    MembershipPlan gym, pt;
    MemberSubscription current;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(TODAY.atTime(10, 0).atZone(ZONE).toInstant(), ZONE);
        service = new SubscriptionUpgradeService(requestRepository, subscriptionRepository, adjustmentRepository, entitlementRepository,
                promotionRepository, trainerRepository, userRepository, planService, promotionService, packageRequestService,
                subscriptionService, paymentSettings, access, auditService, mappers, clock);
        when(mappers.today()).thenReturn(TODAY);

        User tu = new User();
        tu.setFullName("HLV Phúc");
        trainer = new Trainer();
        trainer.setId(3L);
        trainer.setUser(tu);
        trainer.setActive(true);
        when(trainerRepository.findById(3L)).thenReturn(Optional.of(trainer));

        User mu = new User();
        mu.setId(10L);
        mu.setFullName("Hội viên");
        member = new Member();
        member.setId(100L);
        member.setCode("HV00100");
        member.setStatus(MemberStatus.ACTIVE);
        member.setUser(mu);
        member.setTrainer(trainer); // hội viên từng được HLV này phụ trách nhưng đang dùng gói tự tập
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);

        gym = new MembershipPlan();
        gym.setId(1L);
        gym.setName("Gói 1 tháng");
        gym.setPrice(500_000L);
        gym.setDurationDays(30);
        pt = new MembershipPlan();
        pt.setId(7L);
        pt.setName("Gym + PT 8 buổi");
        pt.setPrice(2_900_000L);
        pt.setDurationDays(30);
        pt.setPlanType(PlanType.GYM_PT);
        pt.setIncludesTrainer(true);
        pt.setPtSessions(8);
        pt.setPtValidDays(30);
        when(planService.load(7L)).thenReturn(pt);
        when(planService.load(1L)).thenReturn(gym);

        current = new MemberSubscription();
        current.setId(50L);
        current.setMember(member);
        current.setPlan(gym);
        current.setStartDate(LocalDate.of(2026, 11, 1));
        current.setEndDate(LocalDate.of(2026, 11, 30));
        current.setPricePaid(500_000L);
        when(subscriptionRepository.findEffective(100L, TODAY)).thenReturn(List.of(current));
        when(subscriptionRepository.findById(50L)).thenReturn(Optional.of(current));
        when(subscriptionRepository.existsOverlapExcluding(eq(100L), any(), any(), any())).thenReturn(false);
        when(promotionService.validateFor(any(), any(), any(), anyLong(), eq(true))).thenAnswer(inv -> {
            long base = inv.getArgument(3);
            return new PromotionValidationResponse(true, null, null, null, null, null, DiscountType.NONE, 0L, base, 0L, base, List.of());
        });
    }

    @Test
    @DisplayName("Báo giá: mặc định bắt đầu ngày mai, trừ 14/30 ngày còn lại của gói 500.000đ, gợi ý HLV đang phụ trách")
    void quoteDefaultsToTomorrow() {
        UpgradeQuote q = service.quote(MEMBER_USER, 7L, null, null);
        assertThat(q.eligible()).isTrue();
        assertThat(q.startDate()).isEqualTo(TODAY.plusDays(1));
        assertThat(q.remainingDays()).isEqualTo(14);
        assertThat(q.credit()).isEqualTo(233_000); // 500.000 × 14 / 30 = 233.333 → 233.000
        assertThat(q.amountAfterCredit()).isEqualTo(2_667_000);
        assertThat(q.finalPrice()).isEqualTo(2_667_000);
        assertThat(q.endDate()).isEqualTo(TODAY.plusDays(30));
        assertThat(q.ptValidUntil()).isEqualTo(TODAY.plusDays(31));
        assertThat(q.maxStart()).isEqualTo(current.getEndDate());
        assertThat(q.currentTrainerId()).isEqualTo(3L);
    }

    @Test
    @DisplayName("Không nâng cấp được: bắt đầu hôm nay, sau ngày hết gói cũ, gói đích không có PT, đang có gói PT")
    void quoteRules() {
        assertThat(service.quote(MEMBER_USER, 7L, TODAY, null).reason()).contains("sớm nhất từ ngày mai");
        assertThat(service.quote(MEMBER_USER, 7L, LocalDate.of(2026, 12, 1), null).reason()).contains("trước khi gói hiện tại hết hạn");
        assertThat(service.quote(MEMBER_USER, 1L, null, null).reason()).contains("gói có huấn luyện viên");

        MemberSubscription ptSub = new MemberSubscription();
        ptSub.setId(60L);
        ptSub.setPlan(pt);
        when(subscriptionRepository.findEffective(100L, TODAY)).thenReturn(List.of(current, ptSub));
        assertThat(service.quote(MEMBER_USER, 7L, null, null).eligible()).isFalse();
    }

    @Test
    @DisplayName("Đang có đơn chờ thì không gửi thêm đơn nâng cấp")
    void pendingRequestBlocks() {
        when(requestRepository.existsByMemberIdAndStatus(100L, PackageRequestStatus.PENDING)).thenReturn(true);
        assertThatThrownBy(() -> service.create(MEMBER_USER, new CreateUpgradeRequest(7L, TODAY.plusDays(1), null, null, null, null)))
                .isInstanceOf(ApiException.class).hasMessageContaining("đơn chờ xác nhận");
        verify(requestRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Gửi đơn: chốt giá sau bù trừ, gắn gói cũ, mặc định HLV đang phụ trách")
    void createStoresUpgradeRequest() {
        when(requestRepository.saveAndFlush(any())).thenAnswer(inv -> { PackageRequest r = inv.getArgument(0); r.setId(321L); return r; });
        service.create(MEMBER_USER, new CreateUpgradeRequest(7L, TODAY.plusDays(1), null, PaymentMethod.COUNTER, null, "  "));
        ArgumentCaptor<PackageRequest> cap = ArgumentCaptor.forClass(PackageRequest.class);
        verify(requestRepository).saveAndFlush(cap.capture());
        PackageRequest r = cap.getValue();
        assertThat(r.getRequestType()).isEqualTo(PackageRequestType.UPGRADE);
        assertThat(r.getUpgradeFrom()).isSameAs(current);
        assertThat(r.getUpgradeCredit()).isEqualTo(233_000);
        assertThat(r.getPrice()).isEqualTo(2_667_000L);
        assertThat(r.getOriginalPrice()).isEqualTo(2_900_000);
        assertThat(r.getTrainer()).isSameAs(trainer);
        assertThat(r.getMemberNote()).isNull();
        assertThat(r.getPaymentCode()).isEqualTo("GF000321");
    }

    @Test
    @DisplayName("Duyệt: gói cũ cắt tới hôm trước ngày bắt đầu, lưu lịch sử, gói PT tạo đúng ngày và giá đã chốt")
    void approveCutsOldAndCreatesPt() {
        PackageRequest r = new PackageRequest();
        r.setId(321L);
        r.setRequestType(PackageRequestType.UPGRADE);
        r.setStatus(PackageRequestStatus.PENDING);
        r.setMember(member);
        r.setPlan(pt);
        r.setUpgradeFrom(current);
        r.setTrainer(trainer);
        r.setPrice(2_667_000L);
        r.setUpgradeCredit(233_000L);
        r.setDurationDays(30);
        r.setPtSessionsSnapshot(8);
        r.setPtValidDaysSnapshot(30);
        r.setDesiredStartDate(TODAY.plusDays(1));
        r.setPaymentMethod(PaymentMethod.COUNTER);
        when(requestRepository.lockById(321L)).thenReturn(Optional.of(r));
        when(packageRequestService.resolveTrainerForApproval(eq(r), any())).thenReturn(trainer);
        when(entitlementRepository.findBySubscriptionIdAndSource(50L, EntitlementSource.PLAN)).thenReturn(List.of());
        SubscriptionResponse created = mock(SubscriptionResponse.class);
        when(created.id()).thenReturn(901L);
        when(created.startDate()).thenReturn(TODAY.plusDays(1));
        when(created.endDate()).thenReturn(TODAY.plusDays(30));
        when(subscriptionService.create(eq(ADMIN), any())).thenReturn(created);
        MemberSubscription newSub = new MemberSubscription();
        newSub.setId(901L);
        when(subscriptionRepository.findById(901L)).thenReturn(Optional.of(newSub));

        service.approve(ADMIN, 321L, null);

        assertThat(current.getEndDate()).isEqualTo(TODAY);
        ArgumentCaptor<SubscriptionAdjustment> adj = ArgumentCaptor.forClass(SubscriptionAdjustment.class);
        verify(adjustmentRepository).save(adj.capture());
        assertThat(adj.getValue().getSource()).isEqualTo(AdjustmentSource.UPGRADE);
        assertThat(adj.getValue().getOldEndDate()).isEqualTo(LocalDate.of(2026, 11, 30));
        ArgumentCaptor<SubscriptionRequest> sr = ArgumentCaptor.forClass(SubscriptionRequest.class);
        verify(subscriptionService).create(eq(ADMIN), sr.capture());
        assertThat(sr.getValue().startDate()).isEqualTo(TODAY.plusDays(1));
        assertThat(sr.getValue().pricePaid()).isEqualTo(2_667_000L);
        assertThat(sr.getValue().ptSessionsTotal()).isEqualTo(8);
        assertThat(newSub.getUpgradedFrom()).isSameAs(current);
        verify(packageRequestService).assignTrainer(r, trainer);
        assertThat(r.getStatus()).isEqualTo(PackageRequestStatus.APPROVED);
    }

    @Test
    @DisplayName("Duyệt khi hội viên còn gói khác trùng thời gian gói PT → báo rõ, không cắt gói cũ")
    void approveBlockedByChainedSubscription() {
        PackageRequest r = new PackageRequest();
        r.setId(322L);
        r.setRequestType(PackageRequestType.UPGRADE);
        r.setStatus(PackageRequestStatus.PENDING);
        r.setMember(member);
        r.setPlan(pt);
        r.setUpgradeFrom(current);
        r.setDurationDays(30);
        r.setDesiredStartDate(TODAY.plusDays(1));
        when(requestRepository.lockById(322L)).thenReturn(Optional.of(r));
        when(packageRequestService.resolveTrainerForApproval(eq(r), any())).thenReturn(trainer);
        MemberSubscription next = new MemberSubscription();
        next.setId(51L);
        next.setPlan(gym);
        next.setStartDate(LocalDate.of(2026, 12, 1));
        next.setEndDate(LocalDate.of(2026, 12, 30));
        when(subscriptionRepository.existsOverlapExcluding(eq(100L), any(), any(), any())).thenReturn(true);
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(100L)).thenReturn(List.of(next, current));

        assertThatThrownBy(() -> service.approve(ADMIN, 322L, null)).isInstanceOf(ApiException.class).hasMessageContaining("trùng thời gian");
        assertThat(current.getEndDate()).isEqualTo(LocalDate.of(2026, 11, 30));
        verify(subscriptionService, never()).create(any(), any());
    }
}
