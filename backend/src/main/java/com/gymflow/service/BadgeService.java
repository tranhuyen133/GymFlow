package com.gymflow.service;

import com.gymflow.domain.Member;
import com.gymflow.domain.MemberBadge;
import com.gymflow.domain.WorkoutLog;
import com.gymflow.dto.EngagementDtos.BadgeResponse;
import com.gymflow.dto.EngagementDtos.BadgesResponse;
import com.gymflow.dto.EngagementDtos.RecordsResponse;
import com.gymflow.repository.EngagementQueryRepository;
import com.gymflow.repository.MemberBadgeRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/** V55 · Huy hiệu và kỷ lục cá nhân của hội viên. Luật tính nằm ở BadgeRules. */
@Service
@RequiredArgsConstructor
public class BadgeService {

    private final EngagementQueryRepository queries;
    private final MemberBadgeRepository badgeRepository;
    private final AccessService access;
    private final Clock clock;

    /** Tính lại huy hiệu, lưu huy hiệu mới đạt; trả về danh sách huy hiệu vừa lưu (ngày đạt thật, có thể trong quá khứ). */
    @Transactional
    public List<MemberBadge> evaluate(Member member) {
        BadgeRules.Result r = compute(member.getId());
        Set<String> have = new HashSet<>();
        badgeRepository.findByMemberIdOrderByEarnedAtAsc(member.getId()).forEach(b -> have.add(b.getCode()));
        List<MemberBadge> added = new ArrayList<>();
        for (Map.Entry<String, LocalDateTime> e : r.earned().entrySet()) {
            if (have.contains(e.getKey())) continue;
            MemberBadge b = new MemberBadge();
            b.setMemberId(member.getId());
            b.setCode(e.getKey());
            b.setEarnedAt(e.getValue());
            added.add(badgeRepository.save(b));
        }
        return added;
    }

    @Transactional
    public BadgesResponse mine(AuthUser user) {
        Member m = access.requireMemberOf(user);
        evaluate(m);
        return view(m.getId());
    }

    @Transactional(readOnly = true)
    public BadgesResponse ofMember(AuthUser user, Long memberId) {
        Member m = access.requireView(user, memberId);
        return view(m.getId());
    }

    @Transactional
    public void markSeen(AuthUser user) {
        Member m = access.requireMemberOf(user);
        badgeRepository.markSeen(m.getId(), LocalDateTime.now(clock));
    }

    public BadgeRules.Result compute(Long memberId) {
        List<BadgeRules.Workout> workouts = new ArrayList<>();
        for (WorkoutLog l : queries.memberLogs(memberId)) {
            workouts.add(new BadgeRules.Workout(l.getCompletedAt(), l.getDurationMinutes(), l.getCalories()));
        }
        return BadgeRules.compute(workouts, queries.memberCheckins(memberId), LocalDate.now(clock));
    }

    private BadgesResponse view(Long memberId) {
        BadgeRules.Result r = compute(memberId);
        Map<String, MemberBadge> saved = new HashMap<>();
        badgeRepository.findByMemberIdOrderByEarnedAtAsc(memberId).forEach(b -> saved.put(b.getCode(), b));
        List<BadgeResponse> list = new ArrayList<>();
        for (BadgeRules.Def d : BadgeRules.CATALOG) {
            MemberBadge b = saved.get(d.code());
            int progress = r.progress().getOrDefault(d.code(), 0);
            list.add(new BadgeResponse(d.code(), d.icon(), d.titleVi(), d.titleEn(), d.descVi(), d.descEn(), d.goal(),
                    b != null ? d.goal() : progress, b != null, b == null ? null : b.getEarnedAt(), b != null && b.getSeenAt() == null));
        }
        BadgeRules.Records rec = r.records();
        RecordsResponse records = new RecordsResponse(rec.totalWorkouts(), rec.totalCheckins(), rec.totalCalories(), rec.totalMinutes(),
                rec.currentStreakWeeks(), rec.longestStreakWeeks(), rec.bestWeekWorkouts(), rec.maxSessionCalories(),
                rec.longestSessionMinutes(), rec.activeDays());
        return new BadgesResponse(list, records, saved.size());
    }
}
