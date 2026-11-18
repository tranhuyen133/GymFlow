package com.gymflow.web;

import com.gymflow.dto.EngagementDtos.BadgesResponse;
import com.gymflow.dto.EngagementDtos.TrainerStatsResponse;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.BadgeService;
import com.gymflow.service.TrainerStatsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** V55 · Huy hiệu & kỷ lục của hội viên, thống kê HLV. */
@Tag(name = "Huy hiệu & thống kê HLV")
@RestController
@RequiredArgsConstructor
public class EngagementController {

    private final BadgeService badgeService;
    private final TrainerStatsService trainerStatsService;

    @GetMapping("/api/me/badges")
    @PreAuthorize("hasRole('MEMBER')")
    public BadgesResponse myBadges() {
        return badgeService.mine(CurrentUser.get());
    }

    /** Đã xem hiệu ứng chúc mừng huy hiệu mới. */
    @PostMapping("/api/me/badges/seen")
    @PreAuthorize("hasRole('MEMBER')")
    public void seen() {
        badgeService.markSeen(CurrentUser.get());
    }

    @GetMapping("/api/members/{id}/badges")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public BadgesResponse memberBadges(@PathVariable Long id) {
        return badgeService.ofMember(CurrentUser.get(), id);
    }

    @GetMapping("/api/coach-stats/me")
    @PreAuthorize("hasRole('TRAINER')")
    public TrainerStatsResponse mine(@RequestParam(defaultValue = "30") int days) {
        return trainerStatsService.mine(CurrentUser.get(), days);
    }

    @GetMapping("/api/coach-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TrainerStatsResponse> all(@RequestParam(defaultValue = "30") int days) {
        return trainerStatsService.all(days);
    }

    @GetMapping("/api/coach-stats/{trainerId}")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public TrainerStatsResponse one(@PathVariable Long trainerId, @RequestParam(defaultValue = "30") int days) {
        return trainerStatsService.one(CurrentUser.get(), trainerId, days);
    }
}
