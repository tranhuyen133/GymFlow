package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.ChatSuggestion;
import com.gymflow.repository.MemberSubscriptionRepository;
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
    @Mock Mappers mappers;

    ChatAssistantService assistant;

    @BeforeEach
    void setUp() {
        assistant = new ChatAssistantService(access, scheduleRepository, subscriptionRepository, planRepository, mappers, CLOCK);
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
                .containsExactly("SCHEDULE_TODAY", "NEXT_SESSION", "MY_PACKAGE", "TODAY_EXERCISES", "HELP");
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
}
