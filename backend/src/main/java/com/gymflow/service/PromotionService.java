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
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final MembershipPlanRepository planRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<PromotionResponse> listAll() {
        return promotionRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(mappers::promotion).toList();
    }

    @Transactional(readOnly = true)
    public Promotion get(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("chương trình ưu đãi"));
    }

    @Transactional(readOnly = true)
    public PromotionValidationResponse validate(AuthUser user, PromotionValidateRequest req) {
        MembershipPlan plan = planRepository.findById(req.planId())
                .orElseThrow(() -> ApiException.notFound("gói tập"));
        LocalDateTime now = LocalDateTime.now(clock);

        String code = req.code() == null ? null : req.code().trim();
        Promotion promo = null;
        if (code != null && !code.isEmpty()) {
            promo = promotionRepository.findByCodeIgnoreCase(code).orElse(null);
            if (promo == null) {
                return invalidResult(plan.getPrice(), "Mã ưu đãi không tồn tại");
            }
        } else {
            // Kiểm tra các ưu đãi tự động áp dụng (code IS NULL)
            List<Promotion> autoList = promotionRepository.findByCodeIsNullAndActiveTrue();
            for (Promotion p : autoList) {
                PromotionValidationResponse res = checkEligibility(user, p, plan, now);
                if (res.valid()) {
                    return res;
                }
            }
            return new PromotionValidationResponse(true, null, null, null, null, null,
                    DiscountType.NONE, 0L, plan.getPrice(), 0L, plan.getPrice(), List.of());
        }

        return checkEligibility(user, promo, plan, now);
    }

    public PromotionValidationResponse checkEligibility(AuthUser user, Promotion promo, MembershipPlan plan, LocalDateTime now) {
        long originalPrice = plan.getPrice();

        if (!promo.isActive()) {
            return invalidResult(promo, originalPrice, "Chương trình ưu đãi hiện đã tạm ngưng");
        }
        if (now.isBefore(promo.getStartsAt())) {
            return invalidResult(promo, originalPrice, "Chương trình ưu đãi chưa bắt đầu");
        }
        if (now.isAfter(promo.getEndsAt())) {
            return invalidResult(promo, originalPrice, "Chương trình ưu đãi đã kết thúc");
        }
        if (promo.getMaxUses() != null && promo.getUsedCount() >= promo.getMaxUses()) {
            return invalidResult(promo, originalPrice, "Mã ưu đãi đã hết lượt sử dụng");
        }
        if (!promo.appliesToPlan(plan.getId())) {
            return invalidResult(promo, originalPrice, "Mã ưu đãi không áp dụng cho gói " + plan.getName());
        }

        if (user != null && user.isMember()) {
            Member member = access.requireMemberOf(user);
            long priorSubs = subscriptionRepository.countByMemberId(member.getId());
            if (promo.isNewMembersOnly() && priorSubs > 0) {
                return invalidResult(promo, originalPrice, "Mã ưu đãi chỉ áp dụng cho hội viên mới chưa từng mua gói");
            }
            if (promo.isRenewalOnly() && priorSubs == 0) {
                return invalidResult(promo, originalPrice, "Mã ưu đãi chỉ áp dụng cho hội viên gia hạn gói");
            }
        }

        long discountAmount = 0L;
        if (promo.getDiscountType() == DiscountType.PERCENT) {
            discountAmount = Math.round(originalPrice * promo.getDiscountValue() / 100.0);
            discountAmount = Math.min(originalPrice, discountAmount);
        } else if (promo.getDiscountType() == DiscountType.AMOUNT) {
            discountAmount = Math.min(originalPrice, promo.getDiscountValue());
        }
        long finalPrice = Math.max(0, originalPrice - discountAmount);

        List<PromotionGrantDto> gifts = promo.getGrants() == null ? List.of()
                : promo.getGrants().stream().map(mappers::promotionGrant).toList();

        return new PromotionValidationResponse(
                true, null, promo.getId(), promo.getCode(), promo.getName(), promo.getDescription(),
                promo.getDiscountType(), promo.getDiscountValue(),
                originalPrice, discountAmount, finalPrice, gifts
        );
    }

    private PromotionValidationResponse invalidResult(long originalPrice, String reason) {
        return new PromotionValidationResponse(false, reason, null, null, null, null,
                DiscountType.NONE, 0L, originalPrice, 0L, originalPrice, List.of());
    }

    private PromotionValidationResponse invalidResult(Promotion promo, long originalPrice, String reason) {
        return new PromotionValidationResponse(false, reason, promo.getId(), promo.getCode(), promo.getName(), promo.getDescription(),
                promo.getDiscountType(), promo.getDiscountValue(), originalPrice, 0L, originalPrice, List.of());
    }

    @Transactional
    public PromotionResponse create(PromotionRequest req) {
        validateRequest(req, null);
        Promotion p = new Promotion();
        copyProperties(p, req);
        promotionRepository.save(p);
        auditService.log("PROMOTION_CREATE", "PROMOTION", p.getId(), p.getName() + (p.getCode() == null ? "" : " (" + p.getCode() + ")"));
        return mappers.promotion(p);
    }

    @Transactional
    public PromotionResponse update(Long id, PromotionRequest req) {
        validateRequest(req, id);
        Promotion p = get(id);
        copyProperties(p, req);
        auditService.log("PROMOTION_UPDATE", "PROMOTION", p.getId(), p.getName());
        return mappers.promotion(p);
    }

    @Transactional
    public PromotionResponse toggleActive(Long id, boolean active) {
        Promotion p = get(id);
        p.setActive(active);
        auditService.log("PROMOTION_TOGGLE_ACTIVE", "PROMOTION", p.getId(), p.getName() + " → active=" + active);
        return mappers.promotion(p);
    }

    private void validateRequest(PromotionRequest req, Long existingId) {
        String code = Mappers.blankToNull(req.code());
        if (code != null) {
            Optional<Promotion> existing = promotionRepository.findByCodeIgnoreCase(code);
            if (existing.isPresent() && !existing.get().getId().equals(existingId)) {
                throw ApiException.conflict("Mã ưu đãi '" + code + "' đã tồn tại trong hệ thống");
            }
        }
        if (req.endsAt().isBefore(req.startsAt())) {
            throw ApiException.badRequest("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
        if (req.discountType() == DiscountType.PERCENT) {
            if (req.discountValue() < 1 || req.discountValue() > 100) {
                throw ApiException.badRequest("Mức giảm theo phần trăm phải từ 1 đến 100%");
            }
        }
    }

    private void copyProperties(Promotion p, PromotionRequest req) {
        p.setCode(Mappers.blankToNull(req.code() == null ? null : req.code().trim().toUpperCase()));
        p.setName(req.name().trim());
        p.setDescription(Mappers.blankToNull(req.description()));
        p.setDiscountType(req.discountType());
        p.setDiscountValue(req.discountValue() == null ? 0L : req.discountValue());
        p.setStartsAt(req.startsAt());
        p.setEndsAt(req.endsAt());
        p.setMaxUses(req.maxUses());
        p.setNewMembersOnly(req.newMembersOnly());
        p.setRenewalOnly(req.renewalOnly());
        p.setStackable(req.stackable());
        if (req.active() != null) {
            p.setActive(req.active());
        }

        if (req.planIds() != null) {
            Set<MembershipPlan> plans = new HashSet<>(planRepository.findAllById(req.planIds()));
            p.setPlans(plans);
        } else {
            p.getPlans().clear();
        }

        p.getGrants().clear();
        if (req.grants() != null) {
            for (PromotionGrantDto g : req.grants()) {
                ServiceItem s = serviceItemRepository.findById(g.serviceId())
                        .orElseThrow(() -> ApiException.badRequest("Dịch vụ quà tặng #" + g.serviceId() + " không tồn tại"));
                p.getGrants().add(new PromotionGrant(p, s, g.quantity(), g.validDays(), Mappers.blankToNull(g.conditions())));
            }
        }
    }
}
