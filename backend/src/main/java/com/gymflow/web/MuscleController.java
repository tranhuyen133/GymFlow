package com.gymflow.web;

import com.gymflow.dto.KnowledgeDtos.MuscleDetailResponse;
import com.gymflow.dto.KnowledgeDtos.MuscleSummaryResponse;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.MuscleService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Kiến thức nhóm cơ")
@RestController
@RequiredArgsConstructor
public class MuscleController {

    private final MuscleService muscleService;

    @GetMapping("/api/muscles")
    public List<MuscleSummaryResponse> listMuscles() {
        return muscleService.listMuscles(CurrentUser.get());
    }

    @GetMapping("/api/muscles/{key}")
    public MuscleDetailResponse getMuscleDetail(@PathVariable String key) {
        return muscleService.getMuscleDetail(CurrentUser.get(), key);
    }
}