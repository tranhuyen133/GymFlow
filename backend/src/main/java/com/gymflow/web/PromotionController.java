package com.gymflow.web;

import com.gymflow.domain.Promotion;
import com.gymflow.dto.Dtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.Mappers;
import com.gymflow.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;
    private final Mappers mappers;

    @PostMapping("/api/promotions/validate")
    public PromotionValidationResponse validatePromotion(@Valid @RequestBody PromotionValidateRequest req) {
        return promotionService.validate(CurrentUser.get(), req);
    }

    @GetMapping("/api/admin/promotions")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PromotionResponse> listAllPromotions() {
        return promotionService.listAll();
    }

    @GetMapping("/api/admin/promotions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse getPromotion(@PathVariable Long id) {
        return mappers.promotion(promotionService.get(id));
    }

    @PostMapping("/api/admin/promotions")
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse createPromotion(@Valid @RequestBody PromotionRequest req) {
        return promotionService.create(req);
    }

    @PutMapping("/api/admin/promotions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse updatePromotion(@PathVariable Long id, @Valid @RequestBody PromotionRequest req) {
        return promotionService.update(id, req);
    }

    @PutMapping("/api/admin/promotions/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse togglePromotionActive(@PathVariable Long id, @RequestBody ActiveRequest req) {
        return promotionService.toggleActive(id, req.active());
    }
}
