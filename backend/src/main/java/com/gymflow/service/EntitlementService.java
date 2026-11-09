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
public class EntitlementService {

    private final MemberServiceEntitlementRepository entitlementRepository;
    private final ServiceUsageRepository serviceUsageRepository;
    private final UserRepository userRepository;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<MemberServiceEntitlementResponse> listMine(AuthUser user) {
        Member m = access.requireMemberOf(user);
        return entitlementRepository.findByMemberIdOrderByValidUntilAsc(m.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<MemberServiceEntitlementResponse> listOfMember(AuthUser user, Long memberId) {
        access.requireView(user, memberId);
        return entitlementRepository.findByMemberIdOrderByValidUntilAsc(memberId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public MemberServiceEntitlementResponse recordUsage(AuthUser user, Long entitlementId, UseEntitlementRequest req) {
        if (!user.isAdmin()) {
            throw ApiException.forbidden("Chỉ quản lý (ADMIN) mới có quyền ghi nhận sử dụng dịch vụ");
        }
        LocalDate today = LocalDate.now(clock);
        MemberServiceEntitlement e = entitlementRepository.findByIdForUpdate(entitlementId)
                .orElseThrow(() -> ApiException.notFound("quyền lợi dịch vụ"));

        if (e.getStatus() == EntitlementStatus.CANCELLED) {
            throw ApiException.conflict("Quyền lợi dịch vụ này đã bị huỷ");
        }
        if (today.isBefore(e.getValidFrom())) {
            throw ApiException.conflict("Quyền lợi dịch vụ chưa đến ngày bắt đầu sử dụng (" + e.getValidFrom() + ")");
        }
        if (today.isAfter(e.getValidUntil())) {
            throw ApiException.conflict("Quyền lợi dịch vụ đã hết hạn sử dụng vào ngày " + e.getValidUntil());
        }
        if (e.getUsedQty() >= e.getGrantedQty()) {
            throw ApiException.conflict("Quyền lợi dịch vụ này đã sử dụng hết số lượt (" + e.getGrantedQty() + "/" + e.getGrantedQty() + ")");
        }

        if (e.getSubscription() != null) {
            MemberSubscription sub = e.getSubscription();
            if (sub.isCancelled()) {
                throw ApiException.conflict("Gói tập liên kết với quyền lợi này đã bị huỷ");
            }
            if (today.isBefore(sub.getStartDate())) {
                throw ApiException.conflict("Gói tập liên kết chưa đến ngày bắt đầu hiệu lực (" + sub.getStartDate() + ")");
            }
        }

        e.setUsedQty(e.getUsedQty() + 1);

        User confirmedBy = userRepository.getReferenceById(user.id());
        ServiceUsage usage = new ServiceUsage(e, LocalDateTime.now(clock), confirmedBy, Mappers.blankToNull(req == null ? null : req.note()));
        serviceUsageRepository.save(usage);

        auditService.log("SERVICE_ENTITLEMENT_USE", "SERVICE_ENTITLEMENT", e.getId(),
                e.getMember().getCode() + " · " + e.getServiceNameSnapshot() + " (" + e.getUsedQty() + "/" + e.getGrantedQty() + ")");

        return toResponse(e);
    }

    private MemberServiceEntitlementResponse toResponse(MemberServiceEntitlement e) {
        List<ServiceUsage> usages = serviceUsageRepository.findByEntitlementIdOrderByUsedAtDesc(e.getId());
        return mappers.entitlement(e, usages);
    }
}
