package com.gymflow.web;

import com.gymflow.dto.TimePreferenceDtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.TimePreferenceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Giờ tập mong muốn")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TimePreferenceController {

    private final TimePreferenceService service;

    @GetMapping("/members/me/time-preferences")
    @PreAuthorize("hasRole('MEMBER')")
    public List<TimeSlotResponse> mine() {
        return service.mine(CurrentUser.get());
    }

    @PutMapping("/members/me/time-preferences")
    @PreAuthorize("hasRole('MEMBER')")
    public List<TimeSlotResponse> replaceMine(@Valid @RequestBody TimeSlotsRequest req) {
        return service.replaceMine(CurrentUser.get(), req.slots());
    }

    @GetMapping("/members/{id}/time-preferences")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public List<TimeSlotResponse> ofMember(@PathVariable Long id) {
        return service.of(CurrentUser.get(), id);
    }

    @GetMapping("/trainers/{id}/member-preferences")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public List<MemberTimeSlotResponse> ofTrainerMembers(@PathVariable Long id) {
        return service.ofTrainerMembers(CurrentUser.get(), id);
    }
}
