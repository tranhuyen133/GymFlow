package com.gymflow.web;

import com.gymflow.dto.Dtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.EquipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping("/api/equipment")
    public List<EquipmentResponse> list(@RequestParam(defaultValue = "false") boolean includeHidden) {
        return equipmentService.list(CurrentUser.get(), includeHidden);
    }

    @GetMapping("/api/equipment/{key}")
    public EquipmentDetailResponse get(@PathVariable String key) {
        return equipmentService.get(CurrentUser.get(), key);
    }

    @GetMapping("/api/equipment/{key}/exercises")
    public com.gymflow.common.PageResponse<ExerciseResponse> exercises(
            @PathVariable String key,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return equipmentService.getExercisesPaged(CurrentUser.get(), key, page, size);
    }

    @PostMapping("/api/equipment")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public EquipmentResponse create(@Valid @RequestBody EquipmentRequest req) {
        return equipmentService.create(CurrentUser.get(), req);
    }

    @PutMapping("/api/equipment/{key}")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public EquipmentResponse update(@PathVariable String key, @Valid @RequestBody EquipmentRequest req) {
        return equipmentService.update(CurrentUser.get(), key, req);
    }

    @PutMapping("/api/equipment/{key}/hidden")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public EquipmentResponse setHidden(@PathVariable String key, @Valid @RequestBody HiddenRequest req) {
        return equipmentService.setHidden(CurrentUser.get(), key, req.hidden());
    }

    @PatchMapping("/api/equipment/{key}/hidden")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public EquipmentResponse patchHidden(@PathVariable String key, @Valid @RequestBody HiddenRequest req) {
        return equipmentService.setHidden(CurrentUser.get(), key, req.hidden());
    }

    @PutMapping("/api/equipment/{key}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public EquipmentResponse review(@PathVariable String key, @Valid @RequestBody ReviewRequest req) {
        return equipmentService.review(CurrentUser.get(), key, req);
    }
}
