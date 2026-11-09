package com.gymflow.web;

import com.gymflow.domain.PackageRequestStatus;
import com.gymflow.dto.Dtos.*;
import com.gymflow.dto.PackageRequestDtos.CountResponse;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.EntitlementService;
import com.gymflow.service.ServiceItemService;
import com.gymflow.service.ServiceRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceItemService serviceItemService;
    private final EntitlementService entitlementService;
    private final ServiceRequestService serviceRequestService;

    // ---------------- Services (Dịch vụ bổ sung) ----------------
    @GetMapping("/api/services")
    public List<ServiceItemResponse> listActiveServices() {
        return serviceItemService.listActive();
    }

    @GetMapping("/api/admin/services")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ServiceItemResponse> listAllServices() {
        return serviceItemService.listAll();
    }

    @PostMapping("/api/admin/services")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceItemResponse createService(@Valid @RequestBody ServiceItemRequest req) {
        return serviceItemService.create(req);
    }

    @PutMapping("/api/admin/services/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceItemResponse updateService(@PathVariable Long id, @Valid @RequestBody ServiceItemRequest req) {
        return serviceItemService.update(id, req);
    }

    @PutMapping("/api/admin/services/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceItemResponse toggleServiceActive(@PathVariable Long id, @RequestBody ActiveRequest req) {
        return serviceItemService.toggleActive(id, req.active());
    }

    // ---------------- Entitlements (Quyền lợi) ----------------
    @GetMapping("/api/me/entitlements")
    @PreAuthorize("hasRole('MEMBER')")
    public List<MemberServiceEntitlementResponse> listMyEntitlements() {
        return entitlementService.listMine(CurrentUser.get());
    }

    @GetMapping("/api/admin/members/{id}/entitlements")
    public List<MemberServiceEntitlementResponse> listMemberEntitlements(@PathVariable Long id) {
        return entitlementService.listOfMember(CurrentUser.get(), id);
    }

    @PostMapping("/api/admin/entitlements/{id}/use")
    @PreAuthorize("hasRole('ADMIN')")
    public MemberServiceEntitlementResponse useEntitlement(@PathVariable Long id,
                                                          @RequestBody(required = false) UseEntitlementRequest req) {
        return entitlementService.recordUsage(CurrentUser.get(), id, req);
    }

    // ---------------- Service Requests (Mua lẻ dịch vụ) ----------------
    @PostMapping("/api/service-requests")
    @PreAuthorize("hasRole('MEMBER')")
    public ServiceRequestResponse createServiceRequest(@Valid @RequestBody ServiceRequestInput req) {
        return serviceRequestService.create(CurrentUser.get(), req);
    }

    @GetMapping("/api/service-requests/me")
    @PreAuthorize("hasRole('MEMBER')")
    public List<ServiceRequestResponse> myServiceRequests() {
        return serviceRequestService.mine(CurrentUser.get());
    }

    @PutMapping("/api/service-requests/{id}/paid")
    @PreAuthorize("hasRole('MEMBER')")
    public ServiceRequestResponse markPaid(@PathVariable Long id) {
        return serviceRequestService.markPaid(CurrentUser.get(), id);
    }

    @PutMapping("/api/service-requests/{id}/cancel")
    @PreAuthorize("hasRole('MEMBER')")
    public ServiceRequestResponse cancelMine(@PathVariable Long id) {
        return serviceRequestService.cancelMine(CurrentUser.get(), id);
    }

    @GetMapping("/api/service-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ServiceRequestResponse> listServiceRequests(@RequestParam(required = false) PackageRequestStatus status) {
        return serviceRequestService.list(status);
    }

    @GetMapping("/api/service-requests/pending-count")
    @PreAuthorize("hasRole('ADMIN')")
    public CountResponse pendingServiceRequestCount() {
        return new CountResponse(serviceRequestService.pendingCount());
    }

    @PutMapping("/api/service-requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceRequestResponse approveServiceRequest(@PathVariable Long id,
                                                        @RequestBody(required = false) ApproveServiceRequest req) {
        return serviceRequestService.approve(CurrentUser.get(), id, req);
    }

    @PutMapping("/api/service-requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceRequestResponse rejectServiceRequest(@PathVariable Long id,
                                                       @Valid @RequestBody RejectServiceRequest req) {
        return serviceRequestService.reject(CurrentUser.get(), id, req);
    }
}
