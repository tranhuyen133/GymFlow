package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.CheckinDtos.TodayExercise;
import com.gymflow.dto.CheckinDtos.TodayResponse;
import com.gymflow.dto.Dtos.ScheduleResponse;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;

/** V53 · Trang "Hôm nay" của hội viên: check-in, buổi tập, bài tập theo giáo án, gói tập và mức đông của phòng – gom trong một lần gọi. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TodayService {

    private final AccessService access;
    private final WorkoutScheduleRepository scheduleRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final WorkoutPlanRepository planRepository;
    private final CheckinService checkinService;
    private final CrowdService crowdService;
    private final Mappers mappers;
    private final Clock clock;

    public TodayResponse today(AuthUser user) {
        Member m = access.requireMemberOf(user);
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        int dow = today.getDayOfWeek().getValue();

        List<WorkoutSchedule> all = scheduleRepository.findByMemberIdOrderByStartTimeAsc(m.getId());
        List<WorkoutSchedule> todays = all.stream()
                .filter(s -> s.getStartTime().toLocalDate().equals(today) && s.getStatus() != ScheduleStatus.CANCELLED)
                .toList();
        ScheduleResponse next = all.stream()
                .filter(s -> s.getStatus() == ScheduleStatus.SCHEDULED && s.getStartTime().toLocalDate().isAfter(today))
                .findFirst().map(mappers::schedule).orElse(null);
        YearMonth month = YearMonth.from(today);
        long doneMonth = all.stream()
                .filter(s -> s.getStatus() == ScheduleStatus.COMPLETED && YearMonth.from(s.getStartTime()).equals(month))
                .count();

        MemberSubscription sub = mappers.pickCurrent(subscriptionRepository.findByMemberIdOrderByStartDateDesc(m.getId()), today);
        WorkoutPlan plan = planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(m.getId(), PlanStatus.ACTIVE).orElse(null);
        List<TodayExercise> workout = plan == null ? List.of() : plan.getItems().stream()
                .filter(i -> i.getDayOfWeek() == dow)
                .sorted(Comparator.comparing(WorkoutPlanItem::getSortOrder))
                .map(TodayService::exercise)
                .toList();
        Integer nextPlanDay = plan == null || !workout.isEmpty() ? null : nextTrainingDay(plan, dow);

        return new TodayResponse(m.getUser().getFullName(), today, dow,
                checkinService.latestToday(m.getId()), checkinService.visitsThisMonth(m.getId()),
                mappers.schedules(todays), next,
                sub == null ? null : mappers.subscription(sub),
                plan == null ? null : mappers.planSummary(plan), workout, nextPlanDay,
                ProgressService.streakWeeks(all, today), doneMonth, crowdService.crowd());
    }

    /** Thứ gần nhất sau hôm nay có bài trong giáo án (vòng qua tuần sau); giáo án trống thì null. */
    static Integer nextTrainingDay(WorkoutPlan plan, int dow) {
        for (int k = 1; k <= 7; k++) {
            int d = (dow - 1 + k) % 7 + 1;
            if (plan.getItems().stream().anyMatch(i -> i.getDayOfWeek() == d)) return d;
        }
        return null;
    }

    private static TodayExercise exercise(WorkoutPlanItem i) {
        Exercise e = i.getExercise();
        boolean hasVideo = e.getVideoUrl() != null && !e.getVideoUrl().isBlank();
        return new TodayExercise(i.getId(), e.getId(), e.getName(), e.getNameEn(), e.getMuscleGroup(), i.getSets(),
                i.getReps(), i.getWeightKg(), i.getRestSeconds(), i.getDurationMinutes(), i.getNote(), hasVideo, e.getImageKey());
    }
}
