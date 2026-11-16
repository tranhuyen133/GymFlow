package com.gymflow.web;

import com.gymflow.domain.PackageRequestStatus;
import com.gymflow.dto.PackageRequestDtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.SubscriptionAdjustmentService;
import com.gymflow.service.SubscriptionAdjustmentService.AdjustResultWithRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** V49 · Thời gian sử dụng gói: quản lý sửa trực tiếp, hội viên gửi yêu cầu điều chỉnh để quản lý duyệt. */
@Tag(name = "Điều chỉnh gói tập")
@RestController
@RequiredArgsConstructor
public class SubscriptionChangeController {
    private final SubscriptionAdjustmentService service;

    // ---------- Quản lý sửa thời gian gói ----------

    @PutMapping("/api/subscriptions/{id}/dates")
    @PreAuthorize("hasRole('ADMIN')")
    public AdjustResult adjust(@PathVariable Long id, @Valid @RequestBody AdjustDatesRequest req) {
        return service.adminAdjust(CurrentUser.get(), id, req);
    }

    @GetMapping("/api/subscriptions/{id}/adjustments")
    @PreAuthorize("hasAnyRole('MEMBER', 'TRAINER', 'ADMIN')")
    public List<AdjustmentResponse> adjustments(@PathVariable Long id) {
        return service.history(CurrentUser.get(), id);
    }

    // ---------- Hội viên ----------

    @GetMapping("/api/subscription-changes/me")
    @PreAuthorize("hasRole('MEMBER')")
    public List<ChangeRequestResponse> mine() {
        return service.mine(CurrentUser.get());
    }

    @PostMapping("/api/subscription-changes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('MEMBER')")
    public ChangeRequestResponse create(@Valid @RequestBody CreateChangeRequest req) {
        return service.create(CurrentUser.get(), req);
    }

    @PutMapping("/api/subscription-changes/{id}/cancel")
    @PreAuthorize("hasRole('MEMBER')")
    public ChangeRequestResponse cancel(@PathVariable Long id) {
        return service.cancelMine(CurrentUser.get(), id);
    }

    // ---------- Quản lý duyệt ----------

    @GetMapping("/api/subscription-changes")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ChangeRequestResponse> list(@RequestParam(required = false) PackageRequestStatus status) {
        return service.list(status);
    }

    @GetMapping("/api/subscription-changes/pending-count")
    @PreAuthorize("hasRole('ADMIN')")
    public CountResponse pendingCount() {
        return new CountResponse(service.pendingCount());
    }

    @PutMapping("/api/subscription-changes/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public AdjustResultWithRequest approve(@PathVariable Long id, @Valid @RequestBody(required = false) DecideChangeRequest req) {
        return service.approve(CurrentUser.get(), id, req);
    }

    @PutMapping("/api/subscription-changes/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ChangeRequestResponse reject(@PathVariable Long id, @Valid @RequestBody RejectPackageRequest req) {
        return service.reject(CurrentUser.get(), id, req);
    }
}
