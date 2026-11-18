package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.EngagementDtos.InactiveMember;
import com.gymflow.dto.EngagementDtos.TrainerStatsResponse;
import com.gymflow.dto.EngagementDtos.WeekPoint;
import com.gymflow.repository.EngagementQueryRepository;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * V55 · Thống kê HLV trong N ngày gần nhất: số buổi dạy, tỉ lệ hội viên có mặt, điểm hội viên tự chấm sau buổi,
 * hội viên đang theo và hội viên lâu không tới (để HLV chủ động nhắn hỏi thăm).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrainerStatsService {

    public static final int INACTIVE_DAYS = 14;

    private final EngagementQueryRepository queries;
    private final TrainerRepository trainerRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final AccessService access;
    private final Clock clock;

    public TrainerStatsResponse mine(AuthUser user, int days) {
        return build(access.requireTrainerOf(user), clampDays(days), lastVisits());
    }

    public TrainerStatsResponse one(AuthUser user, Long trainerId, int days) {
        Trainer t = trainerRepository.findById(trainerId).orElseThrow(() -> ApiException.notFound("huấn luyện viên"));
        access.requireTrainerSelfOrAdmin(user, t);
        return build(t, clampDays(days), lastVisits());
    }

    /** Quản lý: so sánh mọi HLV đang hoạt động, xếp theo số buổi đã dạy. */
    public List<TrainerStatsResponse> all(int days) {
        int d = clampDays(days);
        Map<Long, LocalDateTime> visits = lastVisits();
        return trainerRepository.findByActiveTrueOrderByIdAsc().stream()
                .map(t -> build(t, d, visits))
                .sorted(Comparator.comparingInt(TrainerStatsResponse::completed).reversed())
                .toList();
    }

    public TrainerStatsResponse build(Trainer t, int days, Map<Long, LocalDateTime> visits) {
        LocalDate today = LocalDate.now(clock);
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime from = today.minusDays(days - 1L).atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();
        List<WorkoutSchedule> sessions = queries.trainerSessions(t.getId(), from, to);

        int completed = 0, missed = 0, cancelled = 0, upcoming = 0;
        Set<Long> trained = new HashSet<>();
        for (WorkoutSchedule s : sessions) {
            switch (s.getStatus()) {
                case COMPLETED -> { completed++; trained.add(s.getMember().getId()); }
                case MISSED -> missed++;
                case CANCELLED -> cancelled++;
                case SCHEDULED -> { if (s.getStartTime().isAfter(now)) upcoming++; }
            }
        }
        Double attendance = completed + missed == 0 ? null : Math.round(1000.0 * completed / (completed + missed)) / 10.0;

        List<Integer> ratings = queries.trainerLogs(t.getId(), from, to).stream()
                .map(WorkoutLog::getRating).filter(Objects::nonNull).toList();
        Double avgRating = ratings.isEmpty() ? null
                : Math.round(10.0 * ratings.stream().mapToInt(Integer::intValue).average().orElse(0)) / 10.0;

        // Hội viên đang theo, đang có gói, và ai lâu không tới phòng
        List<Member> members = queries.membersOfTrainer(t.getId());
        int activeMembers = 0;
        List<InactiveMember> inactive = new ArrayList<>();
        for (Member m : members) {
            if (m.getStatus() != MemberStatus.ACTIVE || subscriptionRepository.findEffective(m.getId(), today).isEmpty()) continue;
            activeMembers++;
            LocalDateTime last = visits.get(m.getId());
            LocalDate lastDay = last != null ? last.toLocalDate() : m.getJoinedAt();
            long away = lastDay == null ? INACTIVE_DAYS : ChronoUnit.DAYS.between(lastDay, today);
            if (away >= INACTIVE_DAYS) {
                inactive.add(new InactiveMember(m.getId(), m.getUser().getFullName(), m.getCode(), (int) away, last == null ? null : last.toLocalDate()));
            }
        }
        inactive.sort(Comparator.comparing(InactiveMember::daysAway, Comparator.nullsLast(Comparator.<Integer>reverseOrder())));

        // Từng tuần (thứ Hai) trong khoảng: buổi hoàn thành / vắng
        TreeMap<LocalDate, int[]> weeks = new TreeMap<>();
        for (LocalDate w = BadgeRules.monday(from.toLocalDate()); !w.isAfter(today); w = w.plusWeeks(1)) weeks.put(w, new int[2]);
        for (WorkoutSchedule s : sessions) {
            int[] c = weeks.get(BadgeRules.monday(s.getStartTime().toLocalDate()));
            if (c == null) continue;
            if (s.getStatus() == ScheduleStatus.COMPLETED) c[0]++;
            else if (s.getStatus() == ScheduleStatus.MISSED) c[1]++;
        }
        List<WeekPoint> weekPoints = weeks.entrySet().stream().map(e -> new WeekPoint(e.getKey(), e.getValue()[0], e.getValue()[1])).toList();

        return new TrainerStatsResponse(t.getId(), t.getUser().getFullName(), days, sessions.size(), completed, missed, cancelled, upcoming,
                attendance, avgRating, ratings.size(), members.size(), activeMembers, trained.size(), inactive, weekPoints);
    }

    /** Lần đến phòng gần nhất của từng hội viên = muộn nhất giữa check-in và buổi tập hoàn thành. */
    public Map<Long, LocalDateTime> lastVisits() {
        Map<Long, LocalDateTime> out = new HashMap<>();
        for (Object[] row : queries.lastCheckins()) merge(out, row);
        for (Object[] row : queries.lastWorkouts()) merge(out, row);
        return out;
    }

    private static void merge(Map<Long, LocalDateTime> out, Object[] row) {
        if (row == null || row.length < 2 || row[0] == null || row[1] == null) return;
        Long id = ((Number) row[0]).longValue();
        LocalDateTime at = (LocalDateTime) row[1];
        out.merge(id, at, (a, b) -> a.isAfter(b) ? a : b);
    }

    static int clampDays(int days) {
        return days <= 0 ? 30 : Math.min(days, 180);
    }
}
