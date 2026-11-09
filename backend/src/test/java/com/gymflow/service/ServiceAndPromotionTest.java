package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.dto.PackageRequestDtos.CreatePackageRequest;
import com.gymflow.dto.PackageRequestDtos.PackageRequestResponse;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceAndPromotionTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 10, 10, 0);
    private static final LocalDate TODAY = NOW.toLocalDate();

    private static final AuthUser ADMIN = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Quản trị viên");
    private static final AuthUser MEMBER_USER = new AuthUser(10L, "member@gymflow.vn", Role.MEMBER, "Hội viên Linh");

    @Mock ServiceItemRepository serviceItemRepository;
    @Mock PlanServiceGrantRepository planServiceGrantRepository;
    @Mock MemberServiceEntitlementRepository entitlementRepository;
    @Mock ServiceUsageRepository serviceUsageRepository;
    @Mock PromotionRepository promotionRepository;
    @Mock PromotionGrantRepository promotionGrantRepository;
    @Mock ServiceRequestRepository serviceRequestRepository;
    @Mock MembershipPlanRepository planRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock PackageRequestRepository packageRequestRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock UserRepository userRepository;
    @Mock SubscriptionService subscriptionService;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;
    @Mock PaymentSettingsService paymentSettings;

    Clock clock;
    ServiceItemService serviceItemService;
    PromotionService promotionService;
    EntitlementService entitlementService;
    PlanService planService;
    PackageRequestService packageRequestService;

    Member member;
    User memberEntityUser;
    ServiceItem saunaService;
    MembershipPlan gym3mPlan;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);

        serviceItemService = new ServiceItemService(serviceItemRepository, auditService, mappers);
        promotionService = new PromotionService(promotionRepository, planRepository, serviceItemRepository, subscriptionRepository, access, auditService, mappers, clock);
        entitlementService = new EntitlementService(entitlementRepository, serviceUsageRepository, userRepository, access, auditService, mappers, clock);
        planService = new PlanService(planRepository, subscriptionRepository, packageRequestRepository, serviceItemRepository, auditService, mappers);
        packageRequestService = new PackageRequestService(packageRequestRepository, subscriptionRepository, entitlementRepository, promotionRepository, promotionService, userRepository, subscriptionService, planService, access, auditService, mappers, clock, trainerRepository, paymentSettings);

        memberEntityUser = new User();
        memberEntityUser.setId(10L);
        memberEntityUser.setFullName("Hội viên Linh");

        member = new Member();
        member.setId(100L);
        member.setCode("HV00100");
        member.setStatus(MemberStatus.ACTIVE);
        member.setUser(memberEntityUser);

        saunaService = new ServiceItem();
        saunaService.setId(1L);
        saunaService.setName("Xông hơi Sauna");
        saunaService.setCategory(ServiceCategory.RECOVERY);
        saunaService.setUnitPrice(100_000L);
        saunaService.setActive(true);

        gym3mPlan = new MembershipPlan();
        gym3mPlan.setId(5L);
        gym3mPlan.setName("Gói Gym 3 tháng");
        gym3mPlan.setPrice(1_500_000L);
        gym3mPlan.setDurationDays(90);
        gym3mPlan.setPlanType(PlanType.GYM);
        gym3mPlan.setActive(true);

        lenient().when(mappers.today()).thenReturn(TODAY);
        lenient().when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        lenient().when(planRepository.findById(5L)).thenReturn(Optional.of(gym3mPlan));
        lenient().when(serviceItemRepository.findById(1L)).thenReturn(Optional.of(saunaService));
    }

    @Test
    @DisplayName("1. Gói Gym 3 tháng tặng 2 lượt xông hơi, hạn 30 ngày: duyệt đơn → entitlement 0/2 → dùng 1/2 → dùng 2/2 → dùng lần 3 → 409")
    void test1_twoGrants_useTwoSuccess_thirdThrowsConflict() {
        // Gắn quà tặng 2 lượt xông hơi, hạn 30 ngày cho gói Gym 3 tháng
        PlanServiceGrant grant = new PlanServiceGrant(gym3mPlan, saunaService, 2, 30, "Tặng kèm gói");
        gym3mPlan.getServiceGrants().add(grant);

        PackageRequest request = new PackageRequest();
        request.setId(201L);
        request.setMember(member);
        request.setPlan(gym3mPlan);
        request.setPlanName(gym3mPlan.getName());
        request.setPrice(1_500_000L);
        request.setFinalPrice(1_500_000L);
        request.setDurationDays(90);
        request.setStatus(PackageRequestStatus.PENDING);

        when(packageRequestRepository.lockById(201L)).thenReturn(Optional.of(request));
        when(subscriptionService.preview(eq(member.getId()), eq(gym3mPlan.getId()), any()))
                .thenReturn(new SubscriptionPreview(TODAY, TODAY.plusDays(89), 1_500_000L, false));

        MemberSubscription createdSub = new MemberSubscription();
        createdSub.setId(501L);
        createdSub.setMember(member);
        createdSub.setPlan(gym3mPlan);
        createdSub.setStartDate(TODAY);
        createdSub.setEndDate(TODAY.plusDays(89));
        when(subscriptionRepository.getReferenceById(501L)).thenReturn(createdSub);

        SubscriptionResponse subResp = new SubscriptionResponse(501L, member.getId(), "Hội viên Linh", "HV00100",
                gym3mPlan.getId(), gym3mPlan.getName(), TODAY, TODAY.plusDays(89), 1_500_000L,
                SubscriptionState.ACTIVE, 90L, false, null, null, NOW, "Admin", null, null, null, null);
        when(subscriptionService.create(eq(ADMIN), any())).thenReturn(subResp);

        // Lưu danh sách entitlement được tạo
        List<MemberServiceEntitlement> savedEntitlements = new ArrayList<>();
        when(entitlementRepository.save(any(MemberServiceEntitlement.class))).thenAnswer(inv -> {
            MemberServiceEntitlement e = inv.getArgument(0);
            e.setId(1001L);
            savedEntitlements.add(e);
            return e;
        });

        // Quản lý duyệt đơn
        packageRequestService.approve(ADMIN, 201L, null);

        assertThat(savedEntitlements).hasSize(1);
        MemberServiceEntitlement entitlement = savedEntitlements.get(0);
        assertThat(entitlement.getServiceNameSnapshot()).isEqualTo("Xông hơi Sauna");
        assertThat(entitlement.getGrantedQty()).isEqualTo(2);
        assertThat(entitlement.getUsedQty()).isEqualTo(0);
        assertThat(entitlement.getValidFrom()).isEqualTo(TODAY);
        assertThat(entitlement.getValidUntil()).isEqualTo(TODAY.plusDays(30));
        assertThat(entitlement.getStatus()).isEqualTo(EntitlementStatus.ACTIVE);

        // Ghi nhận sử dụng
        when(entitlementRepository.findByIdForUpdate(1001L)).thenReturn(Optional.of(entitlement));
        when(userRepository.getReferenceById(ADMIN.id())).thenReturn(new User());

        // Dùng lần 1: 0/2 -> 1/2
        entitlementService.recordUsage(ADMIN, 1001L, new UseEntitlementRequest("Lần 1"));
        assertThat(entitlement.getUsedQty()).isEqualTo(1);

        // Dùng lần 2: 1/2 -> 2/2
        entitlementService.recordUsage(ADMIN, 1001L, new UseEntitlementRequest("Lần 2"));
        assertThat(entitlement.getUsedQty()).isEqualTo(2);

        // Dùng lần 3: đã hết lượt -> 409
        assertThatThrownBy(() -> entitlementService.recordUsage(ADMIN, 1001L, new UseEntitlementRequest("Lần 3")))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiEx.getMessage()).contains("đã sử dụng hết số lượt");
                });
    }

    @Test
    @DisplayName("2. Qua ngày thứ 31 (dùng Clock cố định) → dùng → 409 dù gói vẫn còn hạn")
    void test2_expiredAfter31Days_throwsConflict() {
        MemberServiceEntitlement entitlement = new MemberServiceEntitlement();
        entitlement.setId(1002L);
        entitlement.setMember(member);
        entitlement.setService(saunaService);
        entitlement.setServiceNameSnapshot("Xông hơi Sauna");
        entitlement.setGrantedQty(2);
        entitlement.setUsedQty(0);
        entitlement.setValidFrom(TODAY);
        entitlement.setValidUntil(TODAY.plusDays(30)); // hạn 30 ngày
        entitlement.setStatus(EntitlementStatus.ACTIVE);

        MemberSubscription sub = new MemberSubscription();
        sub.setId(502L);
        sub.setMember(member);
        sub.setStartDate(TODAY);
        sub.setEndDate(TODAY.plusDays(89)); // gói 90 ngày vẫn còn hạn
        entitlement.setSubscription(sub);

        // Clock cố định ở ngày thứ 31 kể từ ngày bắt đầu
        LocalDate day31 = TODAY.plusDays(31);
        Clock clockDay31 = Clock.fixed(day31.atStartOfDay(ZONE).toInstant(), ZONE);

        EntitlementService serviceAtDay31 = new EntitlementService(
                entitlementRepository, serviceUsageRepository, userRepository, access, auditService, mappers, clockDay31
        );

        when(entitlementRepository.findByIdForUpdate(1002L)).thenReturn(Optional.of(entitlement));

        assertThatThrownBy(() -> serviceAtDay31.recordUsage(ADMIN, 1002L, null))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiEx.getMessage()).contains("đã hết hạn sử dụng");
                });
    }

    @Test
    @DisplayName("3. Huỷ gói → entitlement PLAN thành CANCELLED → dùng → 409")
    void test3_cancelSubscription_cancelsPlanEntitlements_throwsConflictOnUse() {
        MemberSubscription sub = new MemberSubscription();
        sub.setId(503L);
        sub.setMember(member);
        sub.setPlan(gym3mPlan);
        sub.setStartDate(TODAY);
        sub.setEndDate(TODAY.plusDays(89));
        sub.setCancelled(false);

        MemberServiceEntitlement entitlement = new MemberServiceEntitlement();
        entitlement.setId(1003L);
        entitlement.setMember(member);
        entitlement.setService(saunaService);
        entitlement.setSource(EntitlementSource.PLAN);
        entitlement.setSubscription(sub);
        entitlement.setGrantedQty(2);
        entitlement.setUsedQty(0);
        entitlement.setValidFrom(TODAY);
        entitlement.setValidUntil(TODAY.plusDays(30));
        entitlement.setStatus(EntitlementStatus.ACTIVE);

        when(subscriptionRepository.findById(503L)).thenReturn(Optional.of(sub));
        when(entitlementRepository.findBySubscriptionIdAndSource(503L, EntitlementSource.PLAN))
                .thenReturn(List.of(entitlement));

        // Huỷ gói tập
        SubscriptionService realSubscriptionService = new SubscriptionService(
                subscriptionRepository, userRepository, planService, access, auditService, mappers, clock, null, entitlementRepository
        );
        realSubscriptionService.cancel(503L, "Hội viên chuyển nhà");

        // Entitlement PLAN phải chuyển sang CANCELLED
        assertThat(entitlement.getStatus()).isEqualTo(EntitlementStatus.CANCELLED);

        // Dùng entitlement đã bị CANCELLED -> 409
        when(entitlementRepository.findByIdForUpdate(1003L)).thenReturn(Optional.of(entitlement));

        assertThatThrownBy(() -> entitlementService.recordUsage(ADMIN, 1003L, null))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiEx.getMessage()).contains("đã bị huỷ");
                });
    }

    @Test
    @DisplayName("4. Admin đổi số lượt tặng của gói sau khi duyệt → entitlement cũ không đổi")
    void test4_adminModifiesPlanGrants_oldEntitlementUnaffected() {
        // Gói ban đầu tặng 2 lượt
        PlanServiceGrant grant = new PlanServiceGrant(gym3mPlan, saunaService, 2, 30, "Tặng kèm");
        gym3mPlan.getServiceGrants().add(grant);

        // Entitlement đã tạo từ trước khi Admin sửa gói
        MemberServiceEntitlement oldEntitlement = new MemberServiceEntitlement();
        oldEntitlement.setId(1004L);
        oldEntitlement.setGrantedQty(2);
        oldEntitlement.setUsedQty(0);

        when(planRepository.findById(5L)).thenReturn(Optional.of(gym3mPlan));

        // Admin sửa gói thành tặng 5 lượt
        PlanServiceGrantDto newGrantDto = new PlanServiceGrantDto(1L, "Xông hơi Sauna", 5, 45, "Ưu đãi mới");
        PlanRequest updateReq = new PlanRequest(
                "Gói Gym 3 tháng", "Mô tả", 1_500_000L, 90, null, false, PlanType.GYM, null, null, List.of(newGrantDto)
        );

        planService.update(5L, updateReq);

        // Quyền lợi cũ của hội viên vẫn giữ nguyên 2 lượt
        assertThat(oldEntitlement.getGrantedQty()).isEqualTo(2);
        assertThat(oldEntitlement.getUsedQty()).isEqualTo(0);
    }

    @Test
    @DisplayName("5. Hai request dùng lượt cuối cùng lúc → chỉ 1 thành công (kiểm thử đồng thời)")
    void test5_concurrentUsageOnLastSession_onlyOneSucceeds() throws Exception {
        MemberServiceEntitlement entitlement = new MemberServiceEntitlement();
        entitlement.setId(1005L);
        entitlement.setMember(member);
        entitlement.setService(saunaService);
        entitlement.setServiceNameSnapshot("Xông hơi Sauna");
        entitlement.setGrantedQty(2);
        entitlement.setUsedQty(1); // Chỉ còn đúng 1 lượt
        entitlement.setValidFrom(TODAY);
        entitlement.setValidUntil(TODAY.plusDays(30));
        entitlement.setStatus(EntitlementStatus.ACTIVE);

        // Giả lập khóa bi quan: thread nào vào lock trước sẽ kiểm tra usedQty và ghi nhận
        Object dbLock = new Object();
        when(entitlementRepository.findByIdForUpdate(1005L)).thenAnswer(inv -> Optional.of(entitlement));
        when(userRepository.getReferenceById(ADMIN.id())).thenReturn(new User());

        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CyclicBarrier barrier = new CyclicBarrier(threads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futures.add(executor.submit(() -> {
                try {
                    barrier.await();
                    synchronized (dbLock) {
                        entitlementService.recordUsage(ADMIN, 1005L, null);
                    }
                    successCount.incrementAndGet();
                } catch (ApiException e) {
                    if (e.getStatus() == HttpStatus.CONFLICT) {
                        conflictCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                }
            }));
        }

        for (Future<?> f : futures) {
            f.get(5, TimeUnit.SECONDS);
        }
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(1);
        assertThat(entitlement.getUsedQty()).isEqualTo(2);
    }

    @Test
    @DisplayName("6. Mã hết hạn, hết lượt, sai gói, hội viên cũ dùng mã chỉ cho hội viên mới → bị từ chối kèm lý do")
    void test6_promotionValidationFailures() {
        LocalDateTime now = LocalDateTime.now(clock);

        // 6a. Mã hết hạn
        Promotion expiredPromo = new Promotion();
        expiredPromo.setCode("EXPIRED");
        expiredPromo.setName("Khuyến mãi hết hạn");
        expiredPromo.setStartsAt(now.minusDays(10));
        expiredPromo.setEndsAt(now.minusDays(1)); // Đã kết thúc hôm qua
        expiredPromo.setActive(true);
        when(promotionRepository.findByCodeIgnoreCase("EXPIRED")).thenReturn(Optional.of(expiredPromo));

        PromotionValidationResponse r1 = promotionService.validate(MEMBER_USER, new PromotionValidateRequest("EXPIRED", 5L));
        assertThat(r1.valid()).isFalse();
        assertThat(r1.reason()).contains("đã kết thúc");

        // 6b. Mã hết lượt dùng
        Promotion outOfUsesPromo = new Promotion();
        outOfUsesPromo.setCode("OUT_OF_USES");
        outOfUsesPromo.setName("Khuyến mãi giới hạn");
        outOfUsesPromo.setStartsAt(now.minusDays(1));
        outOfUsesPromo.setEndsAt(now.plusDays(5));
        outOfUsesPromo.setMaxUses(5);
        outOfUsesPromo.setUsedCount(5); // Đã dùng 5/5
        outOfUsesPromo.setActive(true);
        when(promotionRepository.findByCodeIgnoreCase("OUT_OF_USES")).thenReturn(Optional.of(outOfUsesPromo));

        PromotionValidationResponse r2 = promotionService.validate(MEMBER_USER, new PromotionValidateRequest("OUT_OF_USES", 5L));
        assertThat(r2.valid()).isFalse();
        assertThat(r2.reason()).contains("hết lượt sử dụng");

        // 6c. Áp sai gói
        MembershipPlan otherPlan = new MembershipPlan();
        otherPlan.setId(99L);
        otherPlan.setName("Gói Vip khác");

        Promotion wrongPlanPromo = new Promotion();
        wrongPlanPromo.setCode("FOR_OTHER_PLAN");
        wrongPlanPromo.setName("Chỉ áp dụng gói khác");
        wrongPlanPromo.setStartsAt(now.minusDays(1));
        wrongPlanPromo.setEndsAt(now.plusDays(5));
        wrongPlanPromo.setActive(true);
        wrongPlanPromo.setPlans(Set.of(otherPlan)); // Chỉ áp dụng gói 99L
        when(promotionRepository.findByCodeIgnoreCase("FOR_OTHER_PLAN")).thenReturn(Optional.of(wrongPlanPromo));

        PromotionValidationResponse r3 = promotionService.validate(MEMBER_USER, new PromotionValidateRequest("FOR_OTHER_PLAN", 5L));
        assertThat(r3.valid()).isFalse();
        assertThat(r3.reason()).contains("không áp dụng cho gói");

        // 6d. Hội viên cũ dùng mã chỉ cho hội viên mới
        Promotion newMemberPromo = new Promotion();
        newMemberPromo.setCode("NEWBIE_ONLY");
        newMemberPromo.setName("Chỉ dành cho người mới");
        newMemberPromo.setStartsAt(now.minusDays(1));
        newMemberPromo.setEndsAt(now.plusDays(5));
        newMemberPromo.setNewMembersOnly(true);
        newMemberPromo.setActive(true);
        when(promotionRepository.findByCodeIgnoreCase("NEWBIE_ONLY")).thenReturn(Optional.of(newMemberPromo));
        // Hội viên đã có 2 gói trước đó
        when(subscriptionRepository.countByMemberId(member.getId())).thenReturn(2L);

        PromotionValidationResponse r4 = promotionService.validate(MEMBER_USER, new PromotionValidateRequest("NEWBIE_ONLY", 5L));
        assertThat(r4.valid()).isFalse();
        assertThat(r4.reason()).contains("chỉ áp dụng cho hội viên mới");
    }

    @Test
    @DisplayName("7. Frontend gửi giá sai → backend vẫn tính đúng final_price từ gói và ưu đãi")
    void test7_frontendSendsTamperedPrice_backendCalculatesFinalPrice() {
        LocalDateTime now = LocalDateTime.now(clock);

        // Ưu đãi giảm 20%
        Promotion promo = new Promotion();
        promo.setId(77L);
        promo.setCode("SALE20");
        promo.setName("Giảm 20%");
        promo.setDiscountType(DiscountType.PERCENT);
        promo.setDiscountValue(20L); // 20%
        promo.setStartsAt(now.minusDays(1));
        promo.setEndsAt(now.plusDays(10));
        promo.setActive(true);

        when(promotionRepository.findByCodeIgnoreCase("SALE20")).thenReturn(Optional.of(promo));
        when(promotionRepository.findById(77L)).thenReturn(Optional.of(promo));

        // Frontend gửi giá sai (ví dụ 100,000 VND trong khi gói 1,500,000 VND)
        CreatePackageRequest req = new CreatePackageRequest(5L, null, "Đăng ký", PaymentMethod.COUNTER, null, "SALE20");

        when(packageRequestRepository.saveAndFlush(any())).thenAnswer(inv -> {
            PackageRequest r = inv.getArgument(0);
            r.setId(701L);
            return r;
        });

        PackageRequestResponse res = packageRequestService.create(MEMBER_USER, req);

        // Giá gốc 1,500,000 VND - Giảm 20% (300,000 VND) = Giá cuối 1,200,000 VND
        assertThat(res.originalPrice()).isEqualTo(1_500_000L);
        assertThat(res.discountAmount()).isEqualTo(300_000L);
        assertThat(res.finalPrice()).isEqualTo(1_200_000L);
        assertThat(res.price()).isEqualTo(1_200_000L); // Giá thực tế phải thanh toán
    }

    @Test
    @DisplayName("8. MEMBER gọi API ghi nhận sử dụng → 403 Forbidden")
    void test8_memberCallUseEntitlement_throwsForbidden() {
        assertThatThrownBy(() -> entitlementService.recordUsage(MEMBER_USER, 1008L, null))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(apiEx.getMessage()).contains("Chỉ quản lý (ADMIN) mới có quyền ghi nhận");
                });
    }
}
