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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PtPlanAndUsageTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 10, 10, 0);
    private static final LocalDate TODAY = NOW.toLocalDate();

    private static final AuthUser ADMIN = new AuthUser(99L, "admin@gymflow.vn", Role.ADMIN, "Admin");
    private static final AuthUser TRAINER_USER = new AuthUser(5L, "trainer@gymflow.vn", Role.TRAINER, "HLV Phuc");
    private static final AuthUser MEMBER_USER = new AuthUser(10L, "member@gymflow.vn", Role.MEMBER, "Hoi Vien");

    @Mock MembershipPlanRepository planRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock PackageRequestRepository packageRequestRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock WorkoutLogRepository logRepository;
    @Mock WorkoutPlanRepository workoutPlanRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock UserRepository userRepository;
    @Mock PtSessionUsageRepository ptSessionUsageRepository;
    @Mock ServiceItemRepository serviceItemRepository;
    @Mock MemberServiceEntitlementRepository entitlementRepository;
    @Mock PromotionRepository promotionRepository;
    @Mock PromotionService promotionService;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;
    @Mock PaymentSettingsService paymentSettings;
    @Mock CalorieEstimationService calorieEstimationService;

    Clock clock;
    PlanService planService;
    SubscriptionService subscriptionService;
    PackageRequestService packageRequestService;
    ScheduleService scheduleService;

    Member member;
    Trainer trainer;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);

        planService = new PlanService(planRepository, subscriptionRepository, packageRequestRepository, serviceItemRepository, auditService, mappers, access);
        subscriptionService = new SubscriptionService(subscriptionRepository, userRepository, planService, access, auditService, mappers, clock, ptSessionUsageRepository, entitlementRepository);
        packageRequestService = new PackageRequestService(packageRequestRepository, subscriptionRepository, entitlementRepository, promotionRepository, promotionService, userRepository, subscriptionService, planService, access, auditService, mappers, clock, trainerRepository, paymentSettings);
        scheduleService = new ScheduleService(scheduleRepository, logRepository, workoutPlanRepository, trainerRepository, subscriptionService, access, auditService, mappers, clock, userRepository, ptSessionUsageRepository, subscriptionRepository, calorieEstimationService);
        CalorieEstimate dummyCalories = new CalorieEstimate(EstimateStatus.OK, EstimateQuality.DETAILED, 65.0,
                "WEIGHT_RECORD@2026-11-10", ExerciseIntensity.MODERATE, 60.0, 300, List.of());
        lenient().when(calorieEstimationService.estimate(any(), anyInt(), any())).thenReturn(dummyCalories);
        lenient().doAnswer(inv -> {
            WorkoutLog log = inv.getArgument(0);
            CalorieEstimate estimate = inv.getArgument(1);
            log.setCalories(estimate.totalCalories());
            log.setEstimateStatus(estimate.status());
            log.setEstimateQuality(estimate.quality());
            log.setEstimated(estimate.status() == EstimateStatus.OK);
            return null;
        }).when(calorieEstimationService).applyToLog(any(), any());
        lenient().doNothing().when(calorieEstimationService).saveExercises(any(), any());

        lenient().when(promotionService.validate(any(), any()))
                .thenReturn(new PromotionValidationResponse(true, null, null, null, null, null, DiscountType.NONE, 0L, 500_000L, 0L, 500_000L, List.of()));

        User memberUser = new User();
        memberUser.setId(10L);
        memberUser.setFullName("Hội Viên A");
        memberUser.setEmail("member@gymflow.vn");

        member = new Member();
        member.setId(1L);
        member.setCode("HV00001");
        member.setUser(memberUser);
        member.setStatus(MemberStatus.ACTIVE);

        User trainerUserEntity = new User();
        trainerUserEntity.setId(5L);
        trainerUserEntity.setFullName("Lê Hoàng Phúc");

        trainer = new Trainer();
        trainer.setId(3L);
        trainer.setUser(trainerUserEntity);
        trainer.setActive(true);

        lenient().when(mappers.today()).thenReturn(TODAY);
        lenient().when(userRepository.getReferenceById(anyLong())).thenReturn(trainerUserEntity);

        SubscriptionResponse dummySubResponse = new SubscriptionResponse(77L, 1L, "Hội Viên A", "HV00001",
                10L, "Gói", TODAY, TODAY.plusDays(30), 100_000L, SubscriptionState.ACTIVE, 30, false, null, null, null, "Admin",
                12, 0, 12, TODAY.plusDays(30));
        lenient().when(mappers.subscription(any())).thenReturn(dummySubResponse);
    }

    // 1. Tạo gói GYM_PT không có số buổi → 400
    @Test
    @DisplayName("Tạo gói GYM_PT không có số buổi -> 400")
    void createGymPt_withoutSessions_failsWith400() {
        PlanRequest req = new PlanRequest("Gói PT 1 tháng", "Mô tả", 2_000_000L, 30, null, true, PlanType.GYM_PT, null, 30);
        assertThatThrownBy(() -> planService.create(req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("số buổi PT từ 1 đến 200");
    }

    // 2. Tạo gói GYM có số buổi → 400
    @Test
    @DisplayName("Tạo gói GYM có số buổi -> 400")
    void createGym_withSessions_failsWith400() {
        PlanRequest req = new PlanRequest("Gói Gym 1 tháng", "Mô tả", 500_000L, 30, null, false, PlanType.GYM, 12, null);
        assertThatThrownBy(() -> planService.create(req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("không được có số buổi PT");
    }

    // 3. Gói 12 buổi: ghi nhận 12 buổi thành công, buổi thứ 13 → 409
    @Test
    @DisplayName("Gói 12 buổi: ghi nhận 12 buổi thành công, buổi thứ 13 -> 409")
    void complete_session13Of12_failsWith409() {
        MemberSubscription sub = new MemberSubscription();
        sub.setId(50L);
        sub.setMember(member);
        sub.setStartDate(TODAY.minusDays(5));
        sub.setEndDate(TODAY.plusDays(25));
        sub.setPtSessionsTotal(12);
        sub.setPtValidUntil(TODAY.plusDays(25));

        when(subscriptionRepository.findEffectivePtSubscriptionsForUpdate(eq(1L), any()))
                .thenReturn(List.of(sub));

        // 12 buổi đã ghi nhận
        when(ptSessionUsageRepository.countBySubscriptionId(50L)).thenReturn(12L);

        WorkoutSchedule s13 = new WorkoutSchedule();
        s13.setId(113L);
        s13.setMember(member);
        s13.setTrainer(trainer);
        s13.setStatus(ScheduleStatus.SCHEDULED);
        s13.setStartTime(NOW.minusHours(2));
        s13.setEndTime(NOW.minusHours(1));

        when(scheduleRepository.findByIdForUpdate(113L)).thenReturn(Optional.of(s13));
        when(access.canView(TRAINER_USER, member)).thenReturn(true);

        assertThatThrownBy(() -> scheduleService.complete(TRAINER_USER, 113L, new CompleteRequest(60, ExerciseIntensity.MODERATE, 5, "Buổi 13")))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("đã sử dụng hết 12 buổi PT");
    }

    // 4. Ghi nhận sau pt_valid_until → 409
    @Test
    @DisplayName("Ghi nhận sau pt_valid_until -> 409")
    void complete_afterPtValidUntil_failsWith409() {
        MemberSubscription sub = new MemberSubscription();
        sub.setId(60L);
        sub.setMember(member);
        sub.setStartDate(TODAY.minusDays(40));
        sub.setEndDate(TODAY.plusDays(10));
        sub.setPtSessionsTotal(12);
        sub.setPtValidUntil(TODAY.minusDays(1)); // Đã hết hạn hôm qua

        when(subscriptionRepository.findEffectivePtSubscriptionsForUpdate(eq(1L), any()))
                .thenReturn(List.of(sub));

        WorkoutSchedule s = new WorkoutSchedule();
        s.setId(114L);
        s.setMember(member);
        s.setTrainer(trainer);
        s.setStatus(ScheduleStatus.SCHEDULED);
        s.setStartTime(NOW.minusHours(2));
        s.setEndTime(NOW.minusHours(1));

        when(scheduleRepository.findByIdForUpdate(114L)).thenReturn(Optional.of(s));
        when(access.canView(TRAINER_USER, member)).thenReturn(true);

        assertThatThrownBy(() -> scheduleService.complete(TRAINER_USER, 114L, new CompleteRequest(60, ExerciseIntensity.MODERATE, 5, "Quá hạn")))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("hết hạn sử dụng");
    }

    // 5. Hai request ghi nhận cùng lúc khi chỉ còn 1 buổi → chỉ 1 thành công (test đồng thời)
    @Test
    @DisplayName("Hai request ghi nhận cùng lúc khi chỉ còn 1 buổi -> chỉ 1 thành công (test đồng thời)")
    void complete_concurrentRequests_onlyOneSucceeds() throws Exception {
        MemberSubscription sub = new MemberSubscription();
        sub.setId(70L);
        sub.setMember(member);
        sub.setStartDate(TODAY.minusDays(5));
        sub.setEndDate(TODAY.plusDays(25));
        sub.setPtSessionsTotal(1); // Chỉ còn đúng 1 buổi
        sub.setPtValidUntil(TODAY.plusDays(25));

        // Giả lập khóa PESSIMISTIC_WRITE tuần tự hóa bằng monitor
        Object lock = new Object();
        AtomicInteger usageCounter = new AtomicInteger(0);

        when(subscriptionRepository.findEffectivePtSubscriptionsForUpdate(eq(1L), any()))
                .thenAnswer(inv -> List.of(sub));

        when(ptSessionUsageRepository.countBySubscriptionId(70L))
                .thenAnswer(inv -> (long) usageCounter.get());

        doAnswer(inv -> {
            usageCounter.incrementAndGet();
            return null;
        }).when(ptSessionUsageRepository).save(any(PtSessionUsage.class));

        WorkoutSchedule s1 = new WorkoutSchedule();
        s1.setId(101L);
        s1.setMember(member);
        s1.setTrainer(trainer);
        s1.setStatus(ScheduleStatus.SCHEDULED);
        s1.setStartTime(NOW.minusHours(3));
        s1.setEndTime(NOW.minusHours(2));

        WorkoutSchedule s2 = new WorkoutSchedule();
        s2.setId(102L);
        s2.setMember(member);
        s2.setTrainer(trainer);
        s2.setStatus(ScheduleStatus.SCHEDULED);
        s2.setStartTime(NOW.minusHours(2));
        s2.setEndTime(NOW.minusHours(1));

        when(scheduleRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(s1));
        when(scheduleRepository.findByIdForUpdate(102L)).thenReturn(Optional.of(s2));
        when(access.canView(any(), any())).thenReturn(true);

        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CyclicBarrier barrier = new CyclicBarrier(threads);
        List<Future<Boolean>> results = new ArrayList<>();

        Callable<Boolean> task1 = () -> {
            barrier.await();
            synchronized (lock) { // Giả lập hành vi khóa hàng SELECT ... FOR UPDATE của CSDL
                scheduleService.complete(TRAINER_USER, 101L, new CompleteRequest(60, ExerciseIntensity.MODERATE, 5, "Buổi 1"));
            }
            return true;
        };

        Callable<Boolean> task2 = () -> {
            barrier.await();
            synchronized (lock) { // Giả lập hành vi khóa hàng SELECT ... FOR UPDATE của CSDL
                scheduleService.complete(TRAINER_USER, 102L, new CompleteRequest(60, ExerciseIntensity.MODERATE, 5, "Buổi 2"));
            }
            return true;
        };

        results.add(executor.submit(task1));
        results.add(executor.submit(task2));

        int successCount = 0;
        int conflictCount = 0;

        for (Future<Boolean> f : results) {
            try {
                if (f.get()) successCount++;
            } catch (ExecutionException e) {
                if (e.getCause() instanceof ApiException apiEx && apiEx.getStatus() == HttpStatus.CONFLICT) {
                    conflictCount++;
                } else {
                    throw e;
                }
            }
        }
        executor.shutdown();

        assertThat(successCount).isEqualTo(1);
        assertThat(conflictCount).isEqualTo(1);
        assertThat(usageCounter.get()).isEqualTo(1);
    }

    // 6. Admin đổi số buổi của gói sau khi đã duyệt đơn → subscription cũ giữ nguyên số buổi
    @Test
    @DisplayName("Admin đổi số buổi của gói sau khi đã duyệt đơn -> subscription cũ giữ nguyên số buổi")
    void adminChangesPlan_afterApproval_subscriptionKeepsOriginalSnapshot() {
        MembershipPlan plan = new MembershipPlan();
        plan.setId(10L);
        plan.setName("Gói 12 buổi PT");
        plan.setPrice(3_000_000L);
        plan.setDurationDays(60);
        plan.setPlanType(PlanType.GYM_PT);
        plan.setIncludesTrainer(true);
        plan.setPtSessions(12);
        plan.setPtValidDays(60);
        plan.setActive(true);

        when(planRepository.findById(10L)).thenReturn(Optional.of(plan));
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(trainerRepository.findById(3L)).thenReturn(Optional.of(trainer));
        when(packageRequestRepository.saveAndFlush(any())).thenAnswer(inv -> {
            PackageRequest r = inv.getArgument(0);
            r.setId(99L);
            return r;
        });

        // 1. Hội viên gửi đơn: lưu snapshot số buổi là 12
        CreatePackageRequest createReq = new CreatePackageRequest(10L, TODAY, "Ghi chú", PaymentMethod.COUNTER, 3L);
        PackageRequestResponse reqRes = packageRequestService.create(MEMBER_USER, createReq);
        assertThat(reqRes.planId()).isEqualTo(10L);

        // 2. Admin duyệt đơn: subscription nhận pt_sessions_total = 12 từ snapshot
        PackageRequest savedReq = new PackageRequest();
        savedReq.setId(99L);
        savedReq.setMember(member);
        savedReq.setPlan(plan);
        savedReq.setTrainer(trainer);
        savedReq.setPlanName(plan.getName());
        savedReq.setPrice(plan.getPrice());
        savedReq.setDurationDays(plan.getDurationDays());
        savedReq.setPtSessionsSnapshot(12);
        savedReq.setPtValidDaysSnapshot(60);
        savedReq.setDesiredStartDate(TODAY);
        savedReq.setStatus(PackageRequestStatus.PENDING);

        when(packageRequestRepository.lockById(99L)).thenReturn(Optional.of(savedReq));
        when(access.loadMember(1L)).thenReturn(member);

        packageRequestService.approve(ADMIN, 99L, null);

        // Kiểm tra subscription được tạo với pt_sessions_total = 12
        verify(subscriptionRepository).saveAndFlush(argThat(sub ->
                sub.getPtSessionsTotal() != null && sub.getPtSessionsTotal() == 12
        ));

        // 3. Admin sửa gói thành 20 buổi
        PlanRequest updateReq = new PlanRequest("Gói 12 buổi PT (đã tăng lên 20)", "Mới", 4_000_000L, 60, null, true, PlanType.GYM_PT, 20, 60);
        when(planRepository.existsByNameIgnoreCaseAndIdNot(any(), any())).thenReturn(false);
        planService.update(10L, updateReq);
        assertThat(plan.getPtSessions()).isEqualTo(20);

        // Snapshot trên đơn và subscription cũ không bị thay đổi
        assertThat(savedReq.getPtSessionsSnapshot()).isEqualTo(12);
    }

    // 7. Hội viên gói GYM không có buổi nào bị trừ, và không được gán HLV qua đơn đăng ký
    @Test
    @DisplayName("Hội viên gói GYM không có buổi nào bị trừ và không được gán HLV qua đơn đăng ký")
    void gymPlan_noPtDeduction_andNoTrainerAssigned() {
        MembershipPlan gymPlan = new MembershipPlan();
        gymPlan.setId(11L);
        gymPlan.setName("Gói Gym Tự Tập 1 tháng");
        gymPlan.setPrice(450_000L);
        gymPlan.setDurationDays(30);
        gymPlan.setPlanType(PlanType.GYM);
        gymPlan.setIncludesTrainer(false);
        gymPlan.setPtSessions(null);
        gymPlan.setPtValidDays(null);
        gymPlan.setActive(true);

        when(planRepository.findById(11L)).thenReturn(Optional.of(gymPlan));
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(packageRequestRepository.saveAndFlush(any())).thenAnswer(inv -> {
            PackageRequest r = inv.getArgument(0);
            r.setId(100L);
            return r;
        });

        // Dù người dùng có gửi trainerId lên thì gói GYM vẫn bỏ qua
        CreatePackageRequest createReq = new CreatePackageRequest(11L, TODAY, "Gói Gym", PaymentMethod.COUNTER, 3L);
        PackageRequestResponse reqRes = packageRequestService.create(MEMBER_USER, createReq);
        assertThat(reqRes.trainerId()).isNull();

        PackageRequest gymReq = new PackageRequest();
        gymReq.setId(100L);
        gymReq.setMember(member);
        gymReq.setPlan(gymPlan);
        gymReq.setTrainer(null);
        gymReq.setPlanName(gymPlan.getName());
        gymReq.setPrice(gymPlan.getPrice());
        gymReq.setDurationDays(gymPlan.getDurationDays());
        gymReq.setPtSessionsSnapshot(null);
        gymReq.setPtValidDaysSnapshot(null);
        gymReq.setDesiredStartDate(TODAY);
        gymReq.setStatus(PackageRequestStatus.PENDING);

        when(packageRequestRepository.lockById(100L)).thenReturn(Optional.of(gymReq));
        when(access.loadMember(1L)).thenReturn(member);

        // Duyệt đơn gói GYM: Member không bị gán HLV
        packageRequestService.approve(ADMIN, 100L, null);
        assertThat(member.getTrainer()).isNull();

        // Buổi tự tập (trainer = null): Hoàn thành không trừ bất kỳ buổi PT nào
        WorkoutSchedule selfSchedule = new WorkoutSchedule();
        selfSchedule.setId(201L);
        selfSchedule.setMember(member);
        selfSchedule.setTrainer(null);
        selfSchedule.setStatus(ScheduleStatus.SCHEDULED);
        selfSchedule.setStartTime(NOW.minusHours(2));
        selfSchedule.setEndTime(NOW.minusHours(1));

        when(scheduleRepository.findByIdForUpdate(201L)).thenReturn(Optional.of(selfSchedule));
        when(access.canView(MEMBER_USER, member)).thenReturn(true);

        scheduleService.complete(MEMBER_USER, 201L, new CompleteRequest(60, ExerciseIntensity.MODERATE, 4, "Tự tập"));

        assertThat(selfSchedule.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        verify(ptSessionUsageRepository, never()).save(any());
        verify(subscriptionRepository, never()).findEffectivePtSubscriptionsForUpdate(any(), any());
    }

    @Test
    @DisplayName("listUpgrades: Chưa có gói còn hiệu lực -> trả về tất cả gói đang mở bán")
    void listUpgrades_whenNoActiveSubscription_returnsAllActivePlans() {
        when(access.memberIdOrNull(MEMBER_USER)).thenReturn(1L);
        when(subscriptionRepository.findEffective(1L, TODAY)).thenReturn(List.of());

        MembershipPlan p1 = new MembershipPlan();
        p1.setId(10L);
        p1.setName("Gói 1 tháng");
        p1.setPrice(500_000L);
        p1.setPlanType(PlanType.GYM);
        p1.setActive(true);

        when(planRepository.findByActiveTrueOrderByPriceAsc()).thenReturn(List.of(p1));
        when(mappers.plan(p1)).thenReturn(new PlanResponse(10L, "Gói 1 tháng", null, 500_000L, 30, null, true, 0L, false, PlanType.GYM, null, null, List.of()));

        List<PlanResponse> result = planService.listUpgrades(MEMBER_USER);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(10L);
    }

    @Test
    @DisplayName("listUpgrades: Đang dùng gói Gym 500k -> chỉ đề xuất gói Gym giá cao hơn hoặc gói PT")
    void listUpgrades_whenUserHasGymPlan_returnsHigherPriceGymAndPtPlans() {
        when(access.memberIdOrNull(MEMBER_USER)).thenReturn(1L);

        MembershipPlan currentGymPlan = new MembershipPlan();
        currentGymPlan.setId(10L);
        currentGymPlan.setName("Gói 1 tháng");
        currentGymPlan.setPrice(500_000L);
        currentGymPlan.setPlanType(PlanType.GYM);

        MemberSubscription sub = new MemberSubscription();
        sub.setId(50L);
        sub.setMember(member);
        sub.setPlan(currentGymPlan);
        sub.setStartDate(TODAY.minusDays(5));
        sub.setEndDate(TODAY.plusDays(25));
        sub.setPricePaid(500_000L);

        when(subscriptionRepository.findEffective(1L, TODAY)).thenReturn(List.of(sub));

        MembershipPlan pCheap = new MembershipPlan();
        pCheap.setId(9L);
        pCheap.setName("Gói tuần");
        pCheap.setPrice(200_000L);
        pCheap.setPlanType(PlanType.GYM);
        pCheap.setActive(true);

        MembershipPlan pSame = new MembershipPlan();
        pSame.setId(10L);
        pSame.setName("Gói 1 tháng");
        pSame.setPrice(500_000L);
        pSame.setPlanType(PlanType.GYM);
        pSame.setActive(true);

        MembershipPlan pHigherGym = new MembershipPlan();
        pHigherGym.setId(11L);
        pHigherGym.setName("Gói 3 tháng");
        pHigherGym.setPrice(1_350_000L);
        pHigherGym.setPlanType(PlanType.GYM);
        pHigherGym.setActive(true);

        MembershipPlan pPt = new MembershipPlan();
        pPt.setId(12L);
        pPt.setName("Gói PT 12 buổi");
        pPt.setPrice(3_600_000L);
        pPt.setPlanType(PlanType.GYM_PT);
        pPt.setPtSessions(12);
        pPt.setActive(true);

        when(planRepository.findByActiveTrueOrderByPriceAsc()).thenReturn(List.of(pCheap, pSame, pHigherGym, pPt));
        when(mappers.plan(pHigherGym)).thenReturn(new PlanResponse(11L, "Gói 3 tháng", null, 1_350_000L, 90, null, true, 0L, false, PlanType.GYM, null, null, List.of()));
        when(mappers.plan(pPt)).thenReturn(new PlanResponse(12L, "Gói PT 12 buổi", null, 3_600_000L, 30, null, true, 0L, true, PlanType.GYM_PT, 12, 60, List.of()));

        List<PlanResponse> result = planService.listUpgrades(MEMBER_USER);
        assertThat(result).hasSize(2);
        assertThat(result).extracting(PlanResponse::id).containsExactly(11L, 12L);
    }

    @Test
    @DisplayName("listUpgrades: Đang dùng gói PT 12 buổi -> chỉ đề xuất gói PT cao hơn, không hiện gói Gym rẻ hơn hoặc hạ cấp")
    void listUpgrades_whenUserHasPtPlan_excludesGymPlansAndCheaperPt() {
        when(access.memberIdOrNull(MEMBER_USER)).thenReturn(1L);

        MembershipPlan currentPtPlan = new MembershipPlan();
        currentPtPlan.setId(12L);
        currentPtPlan.setName("Gói PT 12 buổi");
        currentPtPlan.setPrice(3_600_000L);
        currentPtPlan.setPlanType(PlanType.GYM_PT);
        currentPtPlan.setPtSessions(12);

        MemberSubscription sub = new MemberSubscription();
        sub.setId(50L);
        sub.setMember(member);
        sub.setPlan(currentPtPlan);
        sub.setStartDate(TODAY.minusDays(5));
        sub.setEndDate(TODAY.plusDays(25));
        sub.setPricePaid(3_600_000L);

        when(subscriptionRepository.findEffective(1L, TODAY)).thenReturn(List.of(sub));

        MembershipPlan pGym12m = new MembershipPlan();
        pGym12m.setId(13L);
        pGym12m.setName("Gói Gym 12 tháng");
        pGym12m.setPrice(4_500_000L);
        pGym12m.setPlanType(PlanType.GYM);
        pGym12m.setActive(true);

        MembershipPlan pPt24 = new MembershipPlan();
        pPt24.setId(14L);
        pPt24.setName("Gói PT 24 buổi");
        pPt24.setPrice(6_500_000L);
        pPt24.setPlanType(PlanType.GYM_PT);
        pPt24.setPtSessions(24);
        pPt24.setActive(true);

        when(planRepository.findByActiveTrueOrderByPriceAsc()).thenReturn(List.of(currentPtPlan, pGym12m, pPt24));
        when(mappers.plan(pPt24)).thenReturn(new PlanResponse(14L, "Gói PT 24 buổi", null, 6_500_000L, 60, null, true, 0L, true, PlanType.GYM_PT, 24, 90, List.of()));

        List<PlanResponse> result = planService.listUpgrades(MEMBER_USER);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(14L);
    }
}
