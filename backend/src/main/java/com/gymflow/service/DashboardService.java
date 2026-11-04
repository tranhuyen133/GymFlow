package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final MemberRepository memberRepository;
    private final TrainerRepository trainerRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final WorkoutPlanRepository planRepository;
    private final WeightRecordRepository weightRepository;
    private final AuditLogRepository auditRepository;
    private final java.time.Clock clock;
    private final AccessService access;
    private final Mappers mappers;

    public AdminDashboard admin() {
        LocalDate today = mappers.today();
        YearMonth month = YearMonth.from(today);
        List<LabelValue> revenue = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = month.minusMonths(i);
            revenue.add(new LabelValue(String.format("%02d/%d", ym.getMonthValue(), ym.getYear()), revenueOf(ym)));
        }
        List<MemberSubscription> effective = subscriptionRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(s -> s.isEffectiveOn(today)).toList();
        Map<String, Long> byPlan = new TreeMap<>();
        effective.forEach(s -> byPlan.merge(s.getPlan().getName(), 1L, Long::sum));
        List<MemberSubscription> expiring = subscriptionRepository.findEndingBetween(today, today.plusDays(MemberSubscription.EXPIRING_DAYS));
        LocalDateTime dayStart = today.atStartOfDay();
        long sessionsToday = scheduleRepository.findByStartTimeBetweenOrderByStartTimeAsc(dayStart, dayStart.plusDays(1)).stream()
                .filter(s -> s.getStatus() != ScheduleStatus.CANCELLED).count();
        long thisMonth = revenueOf(month);
        long prevMonth = revenueOf(month.minusMonths(1));
        Double revenueGrowthPercent = prevMonth == 0 ? null
                : Math.round((thisMonth - prevMonth) * 1000.0 / prevMonth) / 10.0;
        return new AdminDashboard(
                memberRepository.count(),
                memberRepository.countByStatus(MemberStatus.ACTIVE),
                memberRepository.countByJoinedAtBetween(month.atDay(1), month.atEndOfMonth()),
                subscriptionRepository.countMembersWithEffective(today),
                expiring.size(),
                thisMonth,
                prevMonth,
                revenueGrowthPercent,
                trainerRepository.countByActiveTrue(),
                sessionsToday,
                revenue,
                byPlan.entrySet().stream().map(e -> new LabelValue(e.getKey(), e.getValue())).toList(),
                expiring.stream().limit(8).map(mappers::subscription).toList(),
                auditRepository.findTop8ByOrderByCreatedAtDesc().stream().map(mappers::audit).toList());
    }

    public TrainerDashboard trainer(AuthUser user) {
        Trainer t = access.requireTrainerOf(user);
        LocalDate today = mappers.today();
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate ws = ProgressService.weekStart(today);
        List<WorkoutSchedule> week = scheduleRepository.findInRange(ws.atStartOfDay(), ws.plusDays(7).atStartOfDay(), null, t.getId())
                .stream().filter(s -> s.getStatus() != ScheduleStatus.CANCELLED).toList();
        List<WorkoutSchedule> todayList = week.stream().filter(s -> s.getStartTime().toLocalDate().equals(today)).toList();
        long completed = week.stream().filter(s -> s.getStatus() == ScheduleStatus.COMPLETED).count();
        long missed = week.stream().filter(s -> s.getStatus() == ScheduleStatus.MISSED).count();
        // Tỉ lệ hoàn thành của HLV trong tuần hiện tại: completed / (completed + missed).
        // Khác với công thức chuyên cần ở mục 13.2 SRS (completed / tổng scheduled):
        // Vì tuần đang diễn ra, các buổi SCHEDULED trong tương lai chưa diễn ra nên chưa tính vào mẫu số,
        // chỉ tính trên các buổi đã có kết quả kết thúc (COMPLETED hoặc MISSED). Buổi CANCELLED bỏ qua.
        Double rate = completed + missed == 0 ? null : Math.round(completed * 1000.0 / (completed + missed)) / 10.0;
        String[] days = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};
        List<LabelValue> load = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = ws.plusDays(i);
            load.add(new LabelValue(days[i], week.stream().filter(s -> s.getStartTime().toLocalDate().equals(d)).count()));
        }
        List<Member> members = memberRepository.findByTrainerId(t.getId());
        Set<Long> memberIds = new HashSet<>();
        members.forEach(m -> memberIds.add(m.getId()));
        List<SubscriptionResponse> expiring = subscriptionRepository.findEndingBetween(today, today.plusDays(MemberSubscription.EXPIRING_DAYS))
                .stream().filter(s -> memberIds.contains(s.getMember().getId())).map(mappers::subscription).toList();
        long activePlans = planRepository.findByMemberTrainerIdOrderByCreatedAtDesc(t.getId()).stream()
                .filter(p -> p.getStatus() == PlanStatus.ACTIVE).count();
        List<TrainerMemberProgress> assignedMembers = members.stream()
                .map(m -> {
                    List<WorkoutSchedule> memberSessions = scheduleRepository.findByMemberIdOrderByStartTimeAsc(m.getId());
                    List<WorkoutSchedule> mWeek = memberSessions.stream()
                            .filter(s -> !s.getStartTime().toLocalDate().isBefore(ws)
                                    && s.getStartTime().toLocalDate().isBefore(ws.plusDays(7))
                                    && s.getStatus() != ScheduleStatus.CANCELLED)
                            .toList();
                    long mCompleted = mWeek.stream().filter(s -> s.getStatus() == ScheduleStatus.COMPLETED).count();
                    long mMissed = mWeek.stream().filter(s -> s.getStatus() == ScheduleStatus.MISSED).count();
                    Double mAttendance = (mCompleted + mMissed == 0) ? null
                            : Math.round(mCompleted * 1000.0 / (mCompleted + mMissed)) / 10.0;
                    int mStreak = ProgressService.streakWeeks(memberSessions, today);
                    ScheduleResponse mNext = memberSessions.stream()
                            .filter(s -> s.getStatus() == ScheduleStatus.SCHEDULED && s.getEndTime().isAfter(now))
                            .findFirst()
                            .map(mappers::schedule)
                            .orElse(null);
                    return new TrainerMemberProgress(
                            m.getId(),
                            m.getCode(),
                            m.getUser().getFullName(),
                            mAttendance,
                            mStreak,
                            mNext
                    );
                })
                .sorted(Comparator.comparing(TrainerMemberProgress::attendanceThisWeek, Comparator.nullsLast(Double::compareTo)))
                .limit(20)
                .toList();
        return new TrainerDashboard(members.size(), todayList.size(), week.size(), completed, missed, rate, activePlans,
                mappers.schedules(todayList), expiring, load, assignedMembers);
    }

    public MemberDashboard member(AuthUser user) {
        Member m = access.requireMemberOf(user);
        LocalDate today = mappers.today();
        LocalDateTime now = LocalDateTime.now(clock);
        MemberSubscription current = mappers.pickCurrent(subscriptionRepository.findByMemberIdOrderByStartDateDesc(m.getId()), today);
        LocalDate ws = ProgressService.weekStart(today);
        List<WorkoutSchedule> all = scheduleRepository.findByMemberIdOrderByStartTimeAsc(m.getId());
        List<WorkoutSchedule> week = all.stream().filter(s -> !s.getStartTime().toLocalDate().isBefore(ws)
                && s.getStartTime().toLocalDate().isBefore(ws.plusDays(7)) && s.getStatus() != ScheduleStatus.CANCELLED).toList();
        ScheduleResponse next = all.stream().filter(s -> s.getStatus() == ScheduleStatus.SCHEDULED && s.getEndTime().isAfter(now))
                .findFirst().map(mappers::schedule).orElse(null);
        YearMonth month = YearMonth.from(today);
        long doneMonth = all.stream().filter(s -> s.getStatus() == ScheduleStatus.COMPLETED
                && YearMonth.from(s.getStartTime()).equals(month)).count();
        WeightRecord latest = weightRepository.findFirstByMemberIdOrderByRecordedDateDesc(m.getId()).orElse(null);
        Double bmi = ProgressService.bmi(latest == null ? null : latest.getWeightKg(), m.getHeightCm());
        WorkoutPlanSummary plan = planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(m.getId(), PlanStatus.ACTIVE)
                .map(mappers::planSummary).orElse(null);
        List<ScheduleResponse> needsCompletion = all.stream()
                .filter(s -> (s.getStatus() == ScheduleStatus.SCHEDULED && s.getEndTime().isBefore(now) && !s.getEndTime().plusDays(7).isBefore(now))
                        || (s.getStatus() == ScheduleStatus.MISSED && !s.getEndTime().plusDays(7).isBefore(now)))
                .map(mappers::schedule)
                .toList();
        return new MemberDashboard(mappers.member(m), current == null ? null : mappers.subscription(current), next,
                mappers.schedules(week), doneMonth, ProgressService.streakWeeks(all, today), mappers.weight(latest),
                bmi, ProgressService.bmiCategory(bmi), plan, needsCompletion);
    }

    private long revenueOf(YearMonth ym) {
        Long v = subscriptionRepository.revenueBetween(ym.atDay(1).atStartOfDay(), ym.plusMonths(1).atDay(1).atStartOfDay());
        return v == null ? 0 : v;
    }
}
