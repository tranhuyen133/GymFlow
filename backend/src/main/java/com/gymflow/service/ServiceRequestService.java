package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceRequestService {

    private final ServiceRequestRepository requestRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final MemberServiceEntitlementRepository entitlementRepository;
    private final UserRepository userRepository;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;
    private final Clock clock;

    private static String paymentCode(Long id) {
        return String.format("SR%06d", id);
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> mine(AuthUser user) {
        Member member = access.requireMemberOf(user);
        return requestRepository.findByMemberIdOrderByCreatedAtDesc(member.getId())
                .stream().map(mappers::serviceRequest).toList();
    }

    @Transactional
    public ServiceRequestResponse create(AuthUser user, ServiceRequestInput req) {
        Member member = access.requireMemberOf(user);
        ServiceItem service = serviceItemRepository.findById(req.serviceId())
                .orElseThrow(() -> ApiException.notFound("dịch vụ"));
        if (!service.isActive()) {
            throw ApiException.badRequest("Dịch vụ này hiện đang tạm ngưng phục vụ");
        }
        if (service.getUnitPrice() == null) {
            throw ApiException.badRequest("Dịch vụ này không bán lẻ");
        }
        if (req.quantity() < 1 || req.quantity() > 100) {
            throw ApiException.badRequest("Số lượng mua từ 1 đến 100 lượt");
        }

        PaymentMethod method = req.paymentMethod() == null ? PaymentMethod.COUNTER : req.paymentMethod();
        long unitPrice = service.getUnitPrice();
        long totalPrice = unitPrice * req.quantity();

        ServiceRequest r = new ServiceRequest();
        r.setMember(member);
        r.setService(service);
        r.setServiceName(service.getName());
        r.setQuantity(req.quantity());
        r.setUnitPrice(unitPrice);
        r.setTotalPrice(totalPrice);
        r.setPaymentMethod(method);
        r.setMemberNote(Mappers.blankToNull(req.note()));
        r.setStatus(PackageRequestStatus.PENDING);
        requestRepository.saveAndFlush(r);

        r.setPaymentCode(paymentCode(r.getId()));
        auditService.log("SERVICE_REQUEST_CREATE", "SERVICE_REQUEST", r.getId(),
                member.getCode() + " · " + service.getName() + " x" + req.quantity() + " (" + totalPrice + " VND)");
        return mappers.serviceRequest(r);
    }

    @Transactional
    public ServiceRequestResponse markPaid(AuthUser user, Long id) {
        Member member = access.requireMemberOf(user);
        ServiceRequest r = requestRepository.lockById(id)
                .orElseThrow(() -> ApiException.notFound("đơn mua dịch vụ"));
        if (!r.getMember().getId().equals(member.getId())) throw ApiException.notFound("đơn mua dịch vụ");
        if (!r.isPending()) throw ApiException.badRequest("Đơn này đã được xử lý");
        if (r.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) throw ApiException.badRequest("Đơn này thanh toán tại quầy");

        if (r.getMemberPaidAt() == null) {
            r.setMemberPaidAt(LocalDateTime.now(clock));
            auditService.log("SERVICE_REQUEST_PAID", "SERVICE_REQUEST", r.getId(), member.getCode() + " · " + r.getPaymentCode());
        }
        return mappers.serviceRequest(r);
    }

    @Transactional
    public ServiceRequestResponse cancelMine(AuthUser user, Long id) {
        Member member = access.requireMemberOf(user);
        ServiceRequest r = requestRepository.lockById(id)
                .orElseThrow(() -> ApiException.notFound("đơn mua dịch vụ"));
        if (!r.getMember().getId().equals(member.getId())) throw ApiException.notFound("đơn mua dịch vụ");
        if (!r.isPending()) throw ApiException.badRequest("Chỉ huỷ được đơn đang chờ xác nhận");

        r.setStatus(PackageRequestStatus.CANCELLED);
        r.setDecidedAt(LocalDateTime.now(clock));
        auditService.log("SERVICE_REQUEST_CANCEL", "SERVICE_REQUEST", r.getId(), member.getCode() + " · " + r.getServiceName());
        return mappers.serviceRequest(r);
    }

    // ---------------- Quản lý (ADMIN) ----------------

    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> list(PackageRequestStatus status) {
        List<ServiceRequest> all = status == null ? requestRepository.findAllByOrderByCreatedAtDesc()
                : requestRepository.findByStatusOrderByCreatedAtAsc(status);
        return all.stream().map(mappers::serviceRequest).toList();
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return requestRepository.countByStatus(PackageRequestStatus.PENDING);
    }

    @Transactional
    public ServiceRequestResponse approve(AuthUser admin, Long id, ApproveServiceRequest req) {
        ServiceRequest r = requestRepository.lockById(id)
                .orElseThrow(() -> ApiException.notFound("đơn mua dịch vụ"));
        if (!r.isPending()) throw ApiException.conflict("Đơn này đã được xử lý trước đó");
        if (!r.getService().isActive()) {
            throw ApiException.badRequest("Dịch vụ đã ngừng phục vụ. Hãy từ chối đơn và báo hội viên.");
        }

        LocalDate today = LocalDate.now(clock);
        LocalDate validUntil = today.plusDays(90);

        MemberServiceEntitlement e = new MemberServiceEntitlement();
        e.setMember(r.getMember());
        e.setService(r.getService());
        e.setSource(EntitlementSource.PURCHASE);
        e.setServiceNameSnapshot(r.getServiceName());
        e.setGrantedQty(r.getQuantity());
        e.setUsedQty(0);
        e.setValidFrom(today);
        e.setValidUntil(validUntil);
        e.setConditionsSnapshot("Mua lẻ dịch vụ đơn #" + r.getId());
        e.setStatus(EntitlementStatus.ACTIVE);
        entitlementRepository.save(e);

        String decision = Mappers.blankToNull(req == null ? null : req.note());
        r.setStatus(PackageRequestStatus.APPROVED);
        r.setDecisionNote(decision);
        r.setDecidedBy(userRepository.getReferenceById(admin.id()));
        r.setDecidedAt(LocalDateTime.now(clock));
        r.setEntitlement(e);

        auditService.log("SERVICE_REQUEST_APPROVE", "SERVICE_REQUEST", r.getId(),
                r.getMember().getCode() + " · " + r.getServiceName() + " x" + r.getQuantity());
        return mappers.serviceRequest(r);
    }

    @Transactional
    public ServiceRequestResponse reject(AuthUser admin, Long id, RejectServiceRequest req) {
        ServiceRequest r = requestRepository.lockById(id)
                .orElseThrow(() -> ApiException.notFound("đơn mua dịch vụ"));
        if (!r.isPending()) throw ApiException.conflict("Đơn này đã được xử lý trước đó");

        r.setStatus(PackageRequestStatus.REJECTED);
        r.setDecisionNote(req.reason().trim());
        r.setDecidedBy(userRepository.getReferenceById(admin.id()));
        r.setDecidedAt(LocalDateTime.now(clock));

        auditService.log("SERVICE_REQUEST_REJECT", "SERVICE_REQUEST", r.getId(),
                r.getMember().getCode() + " · " + r.getServiceName() + " · Lý do: " + r.getDecisionNote());
        return mappers.serviceRequest(r);
    }
}
