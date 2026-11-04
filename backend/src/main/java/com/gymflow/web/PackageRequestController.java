package com.gymflow.web;

import com.gymflow.domain.PackageRequestStatus;
import com.gymflow.dto.PackageRequestDtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.PackageRequestService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Hội viên tự đăng ký gói")
@RestController
@RequestMapping("/api/package-requests")
@RequiredArgsConstructor
public class PackageRequestController {

    private final PackageRequestService service;

    // ---------- Hội viên ----------
    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public List<PackageRequestResponse> mine() {
        return service.mine(CurrentUser.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('MEMBER')")
    public PackageRequestResponse create(@Valid @RequestBody CreatePackageRequest req) {
        return service.create(CurrentUser.get(), req);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('MEMBER')")
    public PackageRequestResponse cancel(@PathVariable Long id) {
        return service.cancelMine(CurrentUser.get(), id);
    }

    // ---------- Quản lý ----------
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<PackageRequestResponse> list(@RequestParam(required = false) PackageRequestStatus status) {
        return service.list(status);
    }

    @GetMapping("/pending-count")
    @PreAuthorize("hasRole('ADMIN')")
    public CountResponse pendingCount() {
        return new CountResponse(service.pendingCount());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public PackageRequestResponse approve(@PathVariable Long id, @Valid @RequestBody(required = false) ApprovePackageRequest req) {
        return service.approve(CurrentUser.get(), id, req);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public PackageRequestResponse reject(@PathVariable Long id, @Valid @RequestBody RejectPackageRequest req) {
        return service.reject(CurrentUser.get(), id, req);
    }
}
