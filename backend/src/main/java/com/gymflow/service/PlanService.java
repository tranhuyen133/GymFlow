package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.MembershipPlan;
import com.gymflow.domain.PlanType;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.MembershipPlanRepository;
import com.gymflow.repository.PackageRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final MembershipPlanRepository planRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final PackageRequestRepository packageRequestRepository;
    private final AuditService auditService;
    private final Mappers mappers;

    @Transactional(readOnly = true)
    public List<PlanResponse> list(boolean includeInactive) {
        return list(null, includeInactive);
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> list(PlanType type, boolean includeInactive) {
        List<MembershipPlan> plans;
        if (type != null) {
            plans = includeInactive ? planRepository.findByPlanTypeOrderByPriceAsc(type)
                    : planRepository.findByPlanTypeAndActiveTrueOrderByPriceAsc(type);
        } else {
            plans = includeInactive ? planRepository.findAllByOrderByPriceAsc()
                    : planRepository.findByActiveTrueOrderByPriceAsc();
        }
        return plans.stream().map(mappers::plan).toList();
    }

    @Transactional
    public PlanResponse create(PlanRequest req) {
        if (planRepository.existsByNameIgnoreCase(req.name().trim())) throw ApiException.conflict("Tên gói tập đã tồn tại");
        MembershipPlan p = new MembershipPlan();
        apply(p, req);
        p.setActive(true);
        planRepository.save(p);
        auditService.log("PLAN_CREATE", "PLAN", p.getId(), p.getName() + (p.isIncludesTrainer() ? " · có HLV kèm" : ""));
        return mappers.plan(p);
    }

    /**
     * Sửa giá không ảnh hưởng gói đã bán: số tiền thực trả lưu riêng ở member_subscriptions.price_paid.
     * Đổi "có HLV kèm" cũng không gỡ HLV khỏi hội viên đang tập – quản lý đổi HLV ở hồ sơ hội viên nếu cần.
     */
    @Transactional
    public PlanResponse update(Long id, PlanRequest req) {
        MembershipPlan p = load(id);
        if (planRepository.existsByNameIgnoreCaseAndIdNot(req.name().trim(), id)) throw ApiException.conflict("Tên gói tập đã tồn tại");
        apply(p, req);
        auditService.log("PLAN_UPDATE", "PLAN", p.getId(), p.getName() + (p.isIncludesTrainer() ? " · có HLV kèm" : ""));
        return mappers.plan(p);
    }

    @Transactional
    public PlanResponse setActive(Long id, boolean active) {
        MembershipPlan p = load(id);
        p.setActive(active);
        auditService.log(active ? "PLAN_ACTIVATE" : "PLAN_DEACTIVATE", "PLAN", p.getId(), p.getName());
        return mappers.plan(p);
    }

    /** Gói đã từng được bán chỉ ngừng cung cấp, không xoá cứng (giữ lịch sử doanh thu). */
    @Transactional
    public void delete(Long id) {
        MembershipPlan p = load(id);
        if (subscriptionRepository.existsByPlanId(id) || packageRequestRepository.existsByPlanId(id)) {
            throw ApiException.conflict("Gói đã có người đăng ký, hãy chuyển sang \"Ngừng cung cấp\" thay vì xoá");
        }
        planRepository.delete(p);
        auditService.log("PLAN_DELETE", "PLAN", id, p.getName());
    }

    private void apply(MembershipPlan p, PlanRequest req) {
        PlanType type = req.planType();
        if (type == null) {
            type = req.includesTrainer() ? PlanType.GYM_PT : PlanType.GYM;
        }
        if (type == PlanType.GYM_PT) {
            if (req.ptSessions() == null || req.ptSessions() < 1 || req.ptSessions() > 200) {
                throw ApiException.badRequest("Gói có PT bắt buộc nhập số buổi PT từ 1 đến 200");
            }
            if (req.ptValidDays() == null || req.ptValidDays() < 1 || req.ptValidDays() > 1095) {
                throw ApiException.badRequest("Gói có PT bắt buộc nhập hạn dùng buổi từ 1 đến 1095 ngày");
            }
        } else {
            if (req.ptSessions() != null) {
                throw ApiException.badRequest("Gói Gym (tự tập) không được có số buổi PT");
            }
            if (req.ptValidDays() != null) {
                throw ApiException.badRequest("Gói Gym (tự tập) không được có hạn dùng buổi PT");
            }
        }

        p.setName(req.name().trim());
        p.setDescription(Mappers.blankToNull(req.description()));
        p.setPrice(req.price());
        p.setDurationDays(req.durationDays());
        p.setBenefits(Mappers.blankToNull(req.benefits()));
        p.setPlanType(type);
        p.setIncludesTrainer(type == PlanType.GYM_PT);
        p.setPtSessions(type == PlanType.GYM_PT ? req.ptSessions() : null);
        p.setPtValidDays(type == PlanType.GYM_PT ? req.ptValidDays() : null);
    }

    MembershipPlan load(Long id) {
        return planRepository.findById(id).orElseThrow(() -> ApiException.notFound("gói tập"));
    }
}
