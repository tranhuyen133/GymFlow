package com.gymflow.web;

import com.gymflow.security.CurrentUser;
import com.gymflow.service.InstantActivationService;
import com.gymflow.service.InstantActivationService.ReconcileItem;
import com.gymflow.service.InstantActivationService.ReconcileOverview;
import com.gymflow.service.TrainerSwitchService;
import com.gymflow.service.TrainerSwitchService.SwitchPreview;
import com.gymflow.service.TrainerSwitchService.SwitchRequest;
import com.gymflow.service.TrainerSwitchService.SwitchResult;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** V56 · Tự phục vụ không chờ quản lý: kích hoạt gói khi báo chuyển khoản (đối soát sau) và đổi HLV ngay. */
@Tag(name = "Tự phục vụ & đối soát")
@RestController
@RequiredArgsConstructor
public class SelfServiceController {

    private final InstantActivationService instantActivation;
    private final TrainerSwitchService trainerSwitch;

    public record RevokeRequest(String reason) {
    }

    /** Giao diện hội viên đổi câu chữ theo chế độ: gói chạy ngay hay chờ quản lý xác nhận. */
    @GetMapping("/api/payments/instant")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Boolean> instantMode() {
        return Map.of("instant", instantActivation.enabled());
    }

    // ---------- Hội viên đổi HLV ----------

    @GetMapping("/api/me/trainer-switch/preview")
    @PreAuthorize("hasRole('MEMBER')")
    public SwitchPreview preview(@RequestParam Long trainerId, @RequestParam(required = false) Long subscriptionId) {
        return trainerSwitch.preview(CurrentUser.get(), subscriptionId, trainerId);
    }

    @PostMapping("/api/me/trainer-switch")
    @PreAuthorize("hasRole('MEMBER')")
    public SwitchResult switchTrainer(@RequestBody SwitchRequest req) {
        return trainerSwitch.switchTrainer(CurrentUser.get(), req);
    }

    // ---------- Quản lý đối soát chuyển khoản ----------

    @GetMapping("/api/payment-reconcile")
    @PreAuthorize("hasRole('ADMIN')")
    public ReconcileOverview overview() {
        return instantActivation.overview();
    }

    @GetMapping("/api/payment-reconcile/count")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> count() {
        return Map.of("count", instantActivation.openCount());
    }

    @PutMapping("/api/payment-reconcile/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ReconcileItem confirm(@PathVariable Long id) {
        return instantActivation.confirm(CurrentUser.get(), id);
    }

    @PutMapping("/api/payment-reconcile/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ReconcileItem revoke(@PathVariable Long id, @RequestBody RevokeRequest req) {
        return instantActivation.revoke(CurrentUser.get(), id, req == null ? null : req.reason());
    }
}
