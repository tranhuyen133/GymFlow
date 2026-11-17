package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.ChatSuggestion;
import com.gymflow.dto.Dtos.ProgressResponse;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.MembershipPlanRepository;
import com.gymflow.repository.PtSessionUsageRepository;
import com.gymflow.repository.WorkoutLogRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatAssistantServiceTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-10T10:00:00Z"), ZoneOffset.UTC);
    private static final LocalDate TODAY = LocalDate.now(CLOCK);

    private static final AuthUser MEMBER_USER = new AuthUser(10L, "linh@example.test", Role.MEMBER, "Linh");
    private static final AuthUser TRAINER_USER = new AuthUser(20L, "huy@example.test", Role.TRAINER, "Huy");
    private static final AuthUser ADMIN_USER = new AuthUser(30L, "admin@example.test", Role.ADMIN, "Admin");

    @Mock AccessService access;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock WorkoutPlanRepository planRepository;
    @Mock WorkoutLogRepository logRepository;
    @Mock PtSessionUsageRepository ptUsageRepository;
    @Mock MembershipPlanRepository membershipPlanRepository;
    @Mock ProgressService progressService;
    @Mock Mappers mappers;

    ChatAssistantService assistant;

    @BeforeEach
    void setUp() {
        assistant = new ChatAssistantService(access, scheduleRepository, subscriptionRepository, planRepository,
                logRepository, ptUsageRepository, membershipPlanRepository, progressService, mappers, CLOCK);
    }

    private Member member(Long id, String name) {
        User user = new User();
        user.setFullName(name);
        Member member = new Member();
        member.setId(id);
        member.setCode("HV" + id);
        member.setUser(user);
        return member;
    }

    private WorkoutSchedule schedule(Member member, String title, LocalDateTime start, LocalDateTime end, ScheduleStatus status) {
        WorkoutSchedule schedule = new WorkoutSchedule();
        schedule.setMember(member);
        schedule.setTitle(title);
        schedule.setStartTime(start);
        schedule.setEndTime(end);
        schedule.setStatus(status);
        return schedule;
    }

    @Test
    void suggestionsForMemberOnlyContainMemberTopics() {
        assertThat(assistant.suggestions(MEMBER_USER))
                .extracting(ChatSuggestion::key)
                .containsExactly("SCHEDULE_TODAY", "SCHEDULE_WEEK", "NEXT_SESSION", "MY_PACKAGE", "MY_PLAN",
                        "MY_PROGRESS", "WORKOUT_HISTORY", "TODAY_EXERCISES", "PLAN_CATALOG",
                        "EXERCISE_TIPS", "EQUIPMENT_GUIDE", "WORKOUT_PLANS", "HELP");
    }

    @Test
    void answersFitnessKnowledgeTopicsCorrectly() {
        assertThat(assistant.answer(MEMBER_USER, ChatTopic.EXERCISE_TIPS)).contains("Bench Press", "Back Squat")
                .doesNotContain("(/exercises)");
        assertThat(assistant.answer(MEMBER_USER, ChatTopic.EQUIPMENT_GUIDE)).contains("Dumbbell", "Cable")
                .doesNotContain("(/equipment)");
        assertThat(assistant.answer(MEMBER_USER, ChatTopic.WORKOUT_PLANS)).contains("Full Body", "Upper/Lower")
                .doesNotContain("(/programs)");
    }

    @Test
    void suggestionsForTrainerIncludeWhoToday() {
        assertThat(assistant.suggestions(TRAINER_USER))
                .extracting(ChatSuggestion::key)
                .contains("WHO_TODAY");
    }

    @Test
    void scheduleTodayListsMemberSessions() {
        Member member = member(100L, "Linh");
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(scheduleRepository.findInRange(TODAY.atStartOfDay(), TODAY.plusDays(1).atStartOfDay(), 100L, null))
                .thenReturn(List.of(schedule(member, "Tập ngực", TODAY.atTime(18, 0), TODAY.atTime(19, 0), ScheduleStatus.SCHEDULED)));

        String answer = assistant.answer(MEMBER_USER, ChatTopic.SCHEDULE_TODAY);

        assertThat(answer).contains("18:00", "19:00", "Tập ngực", "Đã lên lịch");
    }

    @Test
    void whoTodayGroupsDistinctMembers() {
        Member linh = member(100L, "Linh");
        Member an = member(101L, "An");
        when(scheduleRepository.findInRange(TODAY.atStartOfDay(), TODAY.plusDays(1).atStartOfDay(), null, null))
                .thenReturn(List.of(
                        schedule(linh, "Buổi sáng", TODAY.atTime(7, 0), TODAY.atTime(8, 0), ScheduleStatus.SCHEDULED),
                        schedule(linh, "Buổi chiều", TODAY.atTime(17, 0), TODAY.atTime(18, 0), ScheduleStatus.SCHEDULED),
                        schedule(an, "Buổi tối", TODAY.atTime(19, 0), TODAY.atTime(20, 0), ScheduleStatus.SCHEDULED)));

        String answer = assistant.answer(ADMIN_USER, ChatTopic.WHO_TODAY);

        assertThat(answer).contains("2 hội viên", "Linh", "An");
    }

    @Test
    void nextSessionReturnsNearestUpcoming() {
        Member member = member(100L, "Linh");
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(scheduleRepository.findByMemberIdOrderByStartTimeAsc(100L)).thenReturn(List.of(
                schedule(member, "Buổi cũ", TODAY.minusDays(1).atTime(18, 0), TODAY.minusDays(1).atTime(19, 0), ScheduleStatus.COMPLETED),
                schedule(member, "Buổi tới", TODAY.plusDays(1).atTime(18, 0), TODAY.plusDays(1).atTime(19, 0), ScheduleStatus.SCHEDULED)));

        String answer = assistant.answer(MEMBER_USER, ChatTopic.NEXT_SESSION);

        assertThat(answer).contains("Buổi tới", "11/11 18:00");
    }

    @Test
    void myPackageShowsRemainingDays() {
        Member member = member(100L, "Linh");
        MembershipPlan plan = new MembershipPlan();
        plan.setName("Gói 3 tháng");
        MemberSubscription subscription = new MemberSubscription();
        subscription.setPlan(plan);
        subscription.setStartDate(TODAY.minusDays(10));
        subscription.setEndDate(TODAY.plusDays(5));

        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(100L)).thenReturn(List.of(subscription));
        when(mappers.pickCurrent(any(), eq(TODAY))).thenReturn(subscription);

        String answer = assistant.answer(MEMBER_USER, ChatTopic.MY_PACKAGE);

        assertThat(answer).contains("Gói 3 tháng", "Còn lại: 5 ngày", "Sắp hết hạn");
    }

    @Test
    void todayExercisesListsPlanItemsForToday() {
        Member member = member(100L, "Linh");
        WorkoutPlan plan = new WorkoutPlan();
        plan.setName("Giáo án tăng cơ");

        Exercise exercise = new Exercise();
        exercise.setName("Bench Press");
        WorkoutPlanItem item = new WorkoutPlanItem();
        item.setPlan(plan);
        item.setExercise(exercise);
        item.setDayOfWeek(TODAY.getDayOfWeek().getValue());
        item.setSortOrder(1);
        item.setSets(4);
        item.setReps("8-10");
        plan.setItems(new java.util.ArrayList<>(List.of(item)));

        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(scheduleRepository.findInRange(TODAY.atStartOfDay(), TODAY.plusDays(1).atStartOfDay(), 100L, null))
                .thenReturn(List.of());
        when(planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(100L, PlanStatus.ACTIVE))
                .thenReturn(java.util.Optional.of(plan));

        String answer = assistant.answer(MEMBER_USER, ChatTopic.TODAY_EXERCISES);

        assertThat(answer).contains("Bench Press", "4 hiệp x 8-10");
    }

    @Test
    void myProgressSummarisesWeightAndAttendance() {
        Member member = member(100L, "Linh");
        ProgressResponse progress = new ProgressResponse(100L, 170.0, 70.0, 75.0, -5.0, 20.0,
                24.2, "Thừa cân", List.of(), List.of(), 80.0, 3, 10L, 600L, 3000L, 4.5, 18.0, "trong ngưỡng");
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(progressService.progress(MEMBER_USER, 100L)).thenReturn(progress);

        String answer = assistant.answer(MEMBER_USER, ChatTopic.MY_PROGRESS);

        assertThat(answer).contains("70.0 kg", "-5.0 kg", "24.2", "Thừa cân", "80.0%", "3 tuần", "4.5/5");
    }

    @Test
    void myProgressAsksForFirstWeightWhenEmpty() {
        Member member = member(100L, "Linh");
        ProgressResponse progress = new ProgressResponse(100L, 170.0, null, null, null, null,
                null, null, List.of(), List.of(), null, 0, 0L, 0L, 0L, null, null, null);
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(progressService.progress(MEMBER_USER, 100L)).thenReturn(progress);

        assertThat(assistant.answer(MEMBER_USER, ChatTopic.MY_PROGRESS)).contains("chưa ghi cân nặng");
    }

    @Test
    void workoutHistoryListsCompletedSessionsFromLogs() {
        Member member = member(100L, "Linh");
        WorkoutSchedule schedule = schedule(member, "Tập ngực", TODAY.atTime(18, 0), TODAY.atTime(19, 0), ScheduleStatus.COMPLETED);
        WorkoutLog log = new WorkoutLog();
        log.setMember(member);
        log.setSchedule(schedule);
        log.setCompletedAt(TODAY.atTime(19, 0));
        log.setDurationMinutes(60);
        log.setCalories(420);
        log.setRating(5);

        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(logRepository.findByMemberIdOrderByCompletedAtDesc(100L)).thenReturn(List.of(log));

        String answer = assistant.answer(MEMBER_USER, ChatTopic.WORKOUT_HISTORY);

        assertThat(answer).contains("Tập ngực", "60 phút", "420 kcal", "5/5 sao", "Tổng cộng: 1 buổi");
    }

    @Test
    void myPlanListsEveryTrainingDayFromActivePlan() {
        Member member = member(100L, "Linh");
        WorkoutPlan plan = new WorkoutPlan();
        plan.setName("Giáo án tăng cơ");
        plan.setStartDate(TODAY.minusDays(5));
        plan.setEndDate(TODAY.plusDays(25));

        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        WorkoutPlanItem monday = new WorkoutPlanItem();
        monday.setPlan(plan);
        monday.setExercise(bench);
        monday.setDayOfWeek(1);
        monday.setSortOrder(1);
        monday.setSets(4);
        monday.setReps("8-10");
        monday.setWeightKg(60.0);

        Exercise squat = new Exercise();
        squat.setName("Back Squat");
        WorkoutPlanItem wednesday = new WorkoutPlanItem();
        wednesday.setPlan(plan);
        wednesday.setExercise(squat);
        wednesday.setDayOfWeek(3);
        wednesday.setSortOrder(1);
        wednesday.setSets(5);
        wednesday.setReps("5");
        plan.setItems(new java.util.ArrayList<>(List.of(monday, wednesday)));

        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(100L, PlanStatus.ACTIVE))
                .thenReturn(java.util.Optional.of(plan));

        String answer = assistant.answer(MEMBER_USER, ChatTopic.MY_PLAN);

        assertThat(answer).contains("Giáo án tăng cơ", "Thứ 2", "Bench Press 4x8-10 @60.0kg",
                "Thứ 4", "Back Squat 5x5");
    }

    @Test
    void myPackagesShowsRemainingPtSessions() {
        Member member = member(100L, "Linh");
        MembershipPlan plan = new MembershipPlan();
        plan.setName("Gói PT 3 tháng");
        MemberSubscription subscription = new MemberSubscription();
        subscription.setId(5L);
        subscription.setPlan(plan);
        subscription.setStartDate(TODAY.minusDays(10));
        subscription.setEndDate(TODAY.plusDays(20));
        subscription.setPtSessionsTotal(10);

        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(100L)).thenReturn(List.of(subscription));
        when(ptUsageRepository.countBySubscriptionId(5L)).thenReturn(3L);

        assertThat(assistant.myPackages(MEMBER_USER))
                .contains("Gói PT 3 tháng", "PT còn 7/10 buổi", "còn 20 ngày");
    }

    @Test
    void planCatalogShowsPricesOfActivePlans() {
        MembershipPlan plan = new MembershipPlan();
        plan.setName("Gói 1 tháng");
        plan.setPrice(500_000L);
        plan.setDurationDays(30);
        when(membershipPlanRepository.findByActiveTrueOrderByPriceAsc()).thenReturn(List.of(plan));

        String answer = assistant.answer(MEMBER_USER, ChatTopic.PLAN_CATALOG);

        assertThat(answer).contains("Gói 1 tháng", "500.000 đ", "30 ngày");
    }
}
