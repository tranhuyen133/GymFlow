package com.gymflow.web;

import com.gymflow.dto.Dtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.OnboardingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Hành trình người mới & Hướng dẫn")
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @GetMapping("/onboarding")
    @PreAuthorize("hasRole('MEMBER')")
    public OnboardingResponse onboarding() {
        return onboardingService.getOnboarding(CurrentUser.get());
    }

    @GetMapping("/tours")
    @PreAuthorize("isAuthenticated()")
    public List<TourProgressDto> tours() {
        return onboardingService.getTours(CurrentUser.get());
    }

    @PutMapping("/tours/{tourKey}")
    @PreAuthorize("isAuthenticated()")
    public TourProgressDto updateTour(@PathVariable String tourKey,
                                      @Valid @RequestBody UpdateTourProgressRequest req) {
        return onboardingService.updateTour(CurrentUser.get(), tourKey, req);
    }
}
