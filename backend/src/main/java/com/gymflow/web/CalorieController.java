package com.gymflow.web;

import com.gymflow.domain.ExerciseIntensity;
import com.gymflow.dto.Dtos.CaloriePreviewResponse;
import com.gymflow.dto.Dtos.CalorieSessionResponse;
import com.gymflow.dto.Dtos.CalorieSummaryResponse;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.CalorieStatsService;
import com.gymflow.service.ScheduleService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Calo & thống kê")
@RestController
@RequiredArgsConstructor
public class CalorieController {

    private final ScheduleService scheduleService;
    private final CalorieStatsService statsService;

    @GetMapping("/api/schedules/{id}/calorie-preview")
    public CaloriePreviewResponse preview(@PathVariable Long id,
                                          @RequestParam(required = false) ExerciseIntensity intensity) {
        return scheduleService.caloriePreview(CurrentUser.get(), id, intensity);
    }

    @GetMapping("/api/members/{id}/calories/summary")
    public CalorieSummaryResponse summary(@PathVariable Long id,
                                          @RequestParam(defaultValue = "WEEK") String period,
                                          @RequestParam(required = false)
                                          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate anchor) {
        return statsService.summary(CurrentUser.get(), id, period, anchor);
    }

    @GetMapping("/api/members/{id}/calories/sessions")
    public List<CalorieSessionResponse> sessions(@PathVariable Long id,
                                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return statsService.sessions(CurrentUser.get(), id, from, to);
    }
}
