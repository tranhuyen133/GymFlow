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
        // Không nhập mã thì không áp gì: hội viên tự chọn ưu đãi trong danh sách (GET /api/promotions/offers).
        if (Mappers.blankToNull(req.code()) == null) return noPromotion(plan.getPrice());
        return validateFor(user, req.code(), plan, plan.getPrice(), false);
    }

    /**
     * Các ưu đãi không cần mã mà hội viên đủ điều kiện cho gói này, giảm nhiều nhất trước.
     * Chỉ để hội viên chọn – không tự áp vào đơn.
     */
    @Transactional(readOnly = true)
    public List<PromotionValidationResponse> offers(AuthUser user, Long planId) {
        MembershipPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> ApiException.notFound("gói tập"));
        return offers(user, plan, plan.getPrice(), false);
    }

    @Transactional(readOnly = true)
    public List<PromotionValidationResponse> offers(AuthUser user, MembershipPlan plan, long basePrice, boolean upgrade) {
        LocalDateTime now = LocalDateTime.now(clock);
        List<PromotionValidationResponse> out = new ArrayList<>();
        for (Promotion p : promotionRepository.findByCodeIsNullAndActiveTrue()) {
            PromotionValidationResponse res = checkEligibility(user, p, plan, now, basePrice, upgrade);
            if (res.valid() && (res.discountAmount() > 0 || !res.gifts().isEmpty())) out.add(res);
        }
        out.sort(Comparator.comparingLong(PromotionValidationResponse::discountAmount).reversed());
        return out;
    }

    /** Ưu đãi không cần mã mà hội viên đã chọn trong danh sách: kiểm tra lại đủ điều kiện ở thời điểm gửi đơn. */
    @Transactional(readOnly = true)
    public PromotionValidationResponse validateOffer(AuthUser user, Long promotionId, MembershipPlan plan, long basePrice, boolean upgrade) {
        Promotion promo = promotionRepository.findById(promotionId).orElse(null);
        if (promo == null) return invalidResult(basePrice, "Ưu đãi không còn tồn tại");
        if (promo.getCode() != null) return invalidResult(promo, basePrice, "Ưu đãi này cần nhập mã");
        return checkEligibility(user, promo, plan, LocalDateTime.now(clock), basePrice, upgrade);
    }

    private PromotionValidationResponse noPromotion(long basePrice) {
        return new PromotionValidationResponse(true, null, null, null, null, null, null, null,
                DiscountType.NONE, 0L, basePrice, 0L, basePrice, List.of());
    }

    /**
     * V49 · Kiểm tra ưu đãi trên một số tiền gốc bất kỳ: đăng ký thường thì là giá gói, nâng cấp thì là giá gói PT
     * đã trừ giá trị còn lại của gói cũ. upgrade = true mới dùng được ưu đãi dành cho nâng cấp.
     * Không nhập mã: trả về ưu đãi tự áp dụng giảm nhiều nhất (chỉ để gợi ý; đơn hàng không gọi nhánh này).
     */
    @Transactional(readOnly = true)
    public PromotionValidationResponse validateFor(AuthUser user, String rawCode, MembershipPlan plan, long basePrice, boolean upgrade) {
        LocalDateTime now = LocalDateTime.now(clock);
        String code = rawCode == null ? null : rawCode.trim();
        if (code != null && !code.isEmpty()) {
            Promotion promo = promotionRepository.findByCodeIgnoreCase(code).orElse(null);
            if (promo == null) {
                return invalidResult(basePrice, "Mã ưu đãi không tồn tại");
            }
            return checkEligibility(user, promo, plan, now, basePrice, upgrade);
        }
        PromotionValidationResponse best = null;
        for (Promotion p : promotionRepository.findByCodeIsNullAndActiveTrue()) {
            PromotionValidationResponse res = checkEligibility(user, p, plan, now, basePrice, upgrade);
            if (res.valid() && (best == null || res.discountAmount() > best.discountAmount())) {
                best = res;
            }
        }
        return best != null ? best : new PromotionValidationResponse(true, null, null, null, null, null, null, null,
                DiscountType.NONE, 0L, basePrice, 0L, basePrice, List.of());
    }

    public PromotionValidationResponse checkEligibility(AuthUser user, Promotion promo, MembershipPlan plan, LocalDateTime now) {
        return checkEligibility(user, promo, plan, now, plan.getPrice(), false);
    }

    public PromotionValidationResponse checkEligibility(AuthUser user, Promotion promo, MembershipPlan plan, LocalDateTime now,
                                                        long originalPrice, boolean upgrade) {
        PromotionAudience audience = promo.getAudience() == null ? PromotionAudience.ALL : promo.getAudience();
        if (audience == PromotionAudience.UPGRADE && !upgrade) {
            return invalidResult(promo, originalPrice, "Ưu đãi này chỉ áp dụng khi nâng cấp từ gói tự tập lên gói có HLV");
        }

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
            if (audience == PromotionAudience.BIRTHDAY) {
                String problem = birthdayProblem(member.getDateOfBirth(), now.toLocalDate());
                if (problem != null) return invalidResult(promo, originalPrice, problem);
            }
        } else if (audience == PromotionAudience.BIRTHDAY) {
            return invalidResult(promo, originalPrice, "Ưu đãi sinh nhật chỉ dành cho hội viên tự đăng ký");
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
                true, null, promo.getId(), promo.getCode(), promo.getName(), promo.getNameEn(),
                promo.getDescription(), promo.getDescriptionEn(),
                promo.getDiscountType(), promo.getDiscountValue(),
                originalPrice, discountAmount, finalPrice, gifts
        );
    }

    /** V49 · null nếu hôm nay thuộc tháng sinh nhật; ngược lại là lý do không áp dụng. */
    static String birthdayProblem(java.time.LocalDate dateOfBirth, java.time.LocalDate today) {
        if (dateOfBirth == null) return "Cập nhật ngày sinh trong hồ sơ để nhận ưu đãi sinh nhật";
        if (dateOfBirth.getMonthValue() != today.getMonthValue()) {
            return "Ưu đãi sinh nhật chỉ dùng trong tháng " + dateOfBirth.getMonthValue() + " (tháng sinh nhật của bạn)";
        }
        return null;
    }

    private PromotionValidationResponse invalidResult(long originalPrice, String reason) {
        return new PromotionValidationResponse(false, reason, null, null, null, null, null, null,
                DiscountType.NONE, 0L, originalPrice, 0L, originalPrice, List.of());
    }

    private PromotionValidationResponse invalidResult(Promotion promo, long originalPrice, String reason) {
        return new PromotionValidationResponse(false, reason, promo.getId(), promo.getCode(), promo.getName(), promo.getNameEn(),
                promo.getDescription(), promo.getDescriptionEn(),
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
        if (req.audience() == PromotionAudience.UPGRADE && req.newMembersOnly()) {
            throw ApiException.badRequest("Ưu đãi nâng cấp dành cho hội viên đang có gói, không thể chỉ áp dụng cho hội viên mới");
        }
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
        p.setNameEn(Mappers.blankToNull(req.nameEn()));
        p.setDescription(Mappers.blankToNull(req.description()));
        p.setDescriptionEn(Mappers.blankToNull(req.descriptionEn()));
        p.setDiscountType(req.discountType());
        p.setDiscountValue(req.discountValue() == null ? 0L : req.discountValue());
        p.setStartsAt(req.startsAt());
        p.setEndsAt(req.endsAt());
        p.setMaxUses(req.maxUses());
        p.setNewMembersOnly(req.newMembersOnly());
        p.setRenewalOnly(req.renewalOnly());
        p.setStackable(req.stackable());
        p.setAudience(req.audience() == null ? PromotionAudience.ALL : req.audience());
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
                PromotionGrant grant = new PromotionGrant(p, s, g.quantity(), g.validDays(), Mappers.blankToNull(g.conditions()));
                grant.setConditionsEn(Mappers.blankToNull(g.conditionsEn()));
                p.getGrants().add(grant);
            }
        }
    }
}
