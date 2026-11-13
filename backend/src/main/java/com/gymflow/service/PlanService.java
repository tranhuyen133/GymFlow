package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.MemberSubscription;
import com.gymflow.domain.MembershipPlan;
import com.gymflow.domain.PlanServiceGrant;
import com.gymflow.domain.PlanType;
import com.gymflow.domain.ServiceItem;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.MembershipPlanRepository;
import com.gymflow.repository.PackageRequestRepository;
import com.gymflow.repository.ServiceItemRepository;
import com.gymflow.security.AuthUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PlanService {

    private final MembershipPlanRepository planRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final PackageRequestRepository packageRequestRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final AuditService auditService;
    private final Mappers mappers;
    private final AccessService access;

    @Autowired
    public PlanService(MembershipPlanRepository planRepository,
                       MemberSubscriptionRepository subscriptionRepository,
                       PackageRequestRepository packageRequestRepository,
                       ServiceItemRepository serviceItemRepository,
                       AuditService auditService,
                       Mappers mappers,
                       AccessService access) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.packageRequestRepository = packageRequestRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.auditService = auditService;
        this.mappers = mappers;
        this.access = access;
    }

    public PlanService(MembershipPlanRepository planRepository,
                       MemberSubscriptionRepository subscriptionRepository,
                       PackageRequestRepository packageRequestRepository,
                       ServiceItemRepository serviceItemRepository,
                       AuditService auditService,
                       Mappers mappers) {
        this(planRepository, subscriptionRepository, packageRequestRepository, serviceItemRepository, auditService, mappers, null);
    }

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

    @Transactional(readOnly = true)
    public List<PlanResponse> listUpgrades(AuthUser user) {
        Long memberId = (access != null && user != null) ? access.memberIdOrNull(user) : null;
        if (memberId == null) {
            return list(null, false);
        }

        LocalDate today = mappers.today();
        List<MemberSubscription> effective = subscriptionRepository.findEffective(memberId, today);
        if (effective.isEmpty()) {
            return list(null, false);
        }

        // Lấy gói có giá trị cao nhất trong các gói đang có hiệu lực
        MembershipPlan currentPlan = effective.stream()
                .map(MemberSubscription::getPlan)
                .max((p1, p2) -> {
                    int t1 = p1.getPlanType() == PlanType.GYM_PT ? 1 : 0;
                    int t2 = p2.getPlanType() == PlanType.GYM_PT ? 1 : 0;
                    if (t1 != t2) return Integer.compare(t1, t2);
                    return Long.compare(p1.getPrice(), p2.getPrice());
                })
                .orElse(effective.get(0).getPlan());

        List<MembershipPlan> activePlans = planRepository.findByActiveTrueOrderByPriceAsc();
        return activePlans.stream()
                .filter(p -> isUpgrade(p, currentPlan))
                .map(mappers::plan)
                .toList();
    }

    public boolean isUpgrade(MembershipPlan candidate, MembershipPlan current) {
        if (candidate == null || current == null) {
            return false;
        }
        if (candidate.getId() != null && candidate.getId().equals(current.getId())) {
            return false;
        }

        PlanType currentType = current.getPlanType() != null ? current.getPlanType()
                : (current.isIncludesTrainer() ? PlanType.GYM_PT : PlanType.GYM);
        PlanType candidateType = candidate.getPlanType() != null ? candidate.getPlanType()
                : (candidate.isIncludesTrainer() ? PlanType.GYM_PT : PlanType.GYM);

        // Không hiện gói hạ cấp: đang dùng GYM_PT mà ứng viên là GYM
        if (currentType == PlanType.GYM_PT && candidateType == PlanType.GYM) {
            return false;
        }

        // Nâng bậc: từ GYM lên GYM_PT
        if (currentType == PlanType.GYM && candidateType == PlanType.GYM_PT) {
            return true;
        }

        // Cùng bậc GYM: giá cao hơn
        if (currentType == PlanType.GYM && candidateType == PlanType.GYM) {
            return candidate.getPrice() > current.getPrice();
        }

        // Cùng bậc GYM_PT: giá cao hơn hoặc có số buổi PT nhiều hơn
        if (currentType == PlanType.GYM_PT && candidateType == PlanType.GYM_PT) {
            int currentPt = current.getPtSessions() != null ? current.getPtSessions() : 0;
            int candidatePt = candidate.getPtSessions() != null ? candidate.getPtSessions() : 0;
            if (candidate.getPrice() > current.getPrice()) {
                return true;
            }
            if (candidatePt > currentPt) {
                return true;
            }
            return false;
        }

        return false;
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
        p.setNameEn(Mappers.blankToNull(req.nameEn()));
        p.setDescription(Mappers.blankToNull(req.description()));
        p.setDescriptionEn(Mappers.blankToNull(req.descriptionEn()));
        p.setPrice(req.price());
        p.setDurationDays(req.durationDays());
        p.setBenefits(Mappers.blankToNull(req.benefits()));
        p.setBenefitsEn(Mappers.blankToNull(req.benefitsEn()));
        p.setPlanType(type);
        p.setIncludesTrainer(type == PlanType.GYM_PT);
        p.setPtSessions(type == PlanType.GYM_PT ? req.ptSessions() : null);
        p.setPtValidDays(type == PlanType.GYM_PT ? req.ptValidDays() : null);

        // V24 · mã gói, điều kiện sử dụng, thời lượng buổi PT, số giờ báo huỷ. Để trống = chưa khai báo, không tự đặt số liệu.
        String code = Mappers.blankToNull(req.code());
        if (code != null) {
            code = code.trim().toUpperCase(java.util.Locale.ROOT);
            if (!code.matches("[A-Z0-9_-]{1,30}")) throw ApiException.badRequest("Mã gói chỉ gồm chữ không dấu, số, - và _ (tối đa 30 ký tự)");
            boolean taken = p.getId() == null ? planRepository.existsByCodeIgnoreCase(code)
                    : planRepository.existsByCodeIgnoreCaseAndIdNot(code, p.getId());
            if (taken) throw ApiException.conflict("Mã gói " + code + " đã dùng cho gói khác");
        }
        String terms = Mappers.blankToNull(req.usageTerms());
        if (terms != null) terms = terms.trim();
        if (terms != null && terms.length() > 1000) throw ApiException.badRequest("Điều kiện sử dụng tối đa 1000 ký tự");
        Integer minutes = type == PlanType.GYM_PT ? req.ptSessionMinutes() : null;
        if (minutes != null && (minutes < 15 || minutes > 240)) throw ApiException.badRequest("Thời lượng buổi PT từ 15 đến 240 phút");
        Integer notice = type == PlanType.GYM_PT ? req.ptCancelNoticeHours() : null;
        if (notice != null && (notice < 0 || notice > 168)) throw ApiException.badRequest("Số giờ báo huỷ buổi PT từ 0 đến 168");
        p.setCode(code);
        p.setUsageTerms(terms);
        p.setPtSessionMinutes(minutes);
        p.setPtCancelNoticeHours(notice);

        if (req.serviceGrants() != null) {
            p.getServiceGrants().clear();
            for (PlanServiceGrantDto g : req.serviceGrants()) {
                ServiceItem s = serviceItemRepository.findById(g.serviceId())
                        .orElseThrow(() -> ApiException.badRequest("Dịch vụ quà tặng #" + g.serviceId() + " không tồn tại"));
                p.getServiceGrants().add(new PlanServiceGrant(p, s, g.quantity(), g.validDays(), Mappers.blankToNull(g.conditions())));
            }
        }
    }

    MembershipPlan load(Long id) {
        return planRepository.findById(id).orElseThrow(() -> ApiException.notFound("gói tập"));
    }
}
