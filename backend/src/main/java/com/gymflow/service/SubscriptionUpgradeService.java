package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.PromotionValidationResponse;
import com.gymflow.dto.Dtos.SubscriptionRequest;
import com.gymflow.dto.Dtos.SubscriptionResponse;
import com.gymflow.dto.PackageRequestDtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * V49 · Nâng gói tự tập đang dùng lên gói có PT mà không phải chờ hết gói cũ:
 * - gói PT bắt đầu sớm nhất từ ngày mai (để kịp xếp lịch với HLV), muộn nhất trước khi gói cũ hết hạn;
 * - giá trị chưa dùng của gói cũ được trừ vào giá gói PT ({@link UpgradeMath}), sau đó mới áp ưu đãi
 *   (ưu đãi riêng cho nâng cấp, sinh nhật, ngày lễ…);
 * - vẫn đi qua đơn chờ thanh toán như đăng ký thường; khi quản lý duyệt: gói cũ cắt tới hôm trước ngày bắt đầu,
 *   gói PT được tạo, HLV được gán và nhận luôn lịch của hội viên (PackageApprovalService gọi TrainerHandoverService).
 */
@Service
@RequiredArgsConstructor
public class SubscriptionUpgradeService {

    /** Ngày bắt đầu gói PT chọn được trong vòng bao nhiêu ngày tới. */
    public static final int MAX_UPGRADE_START_DAYS = 30;
    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PackageRequestRepository requestRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final SubscriptionAdjustmentRepository adjustmentRepository;
    private final MemberServiceEntitlementRepository entitlementRepository;
    private final PromotionRepository promotionRepository;
    private final TrainerRepository trainerRepository;
    private final UserRepository userRepository;
    private final PlanService planService;
    private final PromotionService promotionService;
    private final PackageRequestService packageRequestService;
    private final SubscriptionService subscriptionService;
    private final PaymentSettingsService paymentSettings;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;
    private final Clock clock;

    static boolean isPtPlan(MembershipPlan p) {
        return p.getPlanType() == PlanType.GYM_PT || p.isIncludesTrainer();
    }

    static boolean isPtSub(MemberSubscription s) {
        return isPtPlan(s.getPlan()) || s.getPtSessionsTotal() != null;
    }

    // ---------------- Hội viên ----------------

    @Transactional(readOnly = true)
    public UpgradeQuote quote(AuthUser user, Long planId, LocalDate startDate, String promotionCode) {
        Member m = access.requireMemberOf(user);
        return build(user, m, planId == null ? null : planService.load(planId), startDate, promotionCode, true);
    }

    @Transactional
    public PackageRequestResponse create(AuthUser user, CreateUpgradeRequest req) {
        Member m = access.requireMemberOf(user);
        // Khoá dòng hội viên: hai lần bấm gửi đồng thời không tạo được hai đơn chờ.
        subscriptionRepository.lockMember(m.getId());
        MembershipPlan plan = planService.load(req.planId());
        String code = Mappers.blankToNull(req.promotionCode());
        UpgradeQuote q = build(user, m, plan, req.startDate(), code, true);
        if (!q.eligible()) throw ApiException.badRequest(q.reason());
        if (code != null && q.promotionReason() != null) throw ApiException.badRequest(q.promotionReason());

        PaymentMethod method = req.paymentMethod() == null ? PaymentMethod.COUNTER : req.paymentMethod();
        if (method == PaymentMethod.BANK_TRANSFER && !paymentSettings.onlineReady()) {
            throw ApiException.badRequest("Phòng tập chưa mở nhận chuyển khoản, vui lòng chọn thanh toán tại quầy");
        }
        Long trainerId = req.trainerId() != null ? req.trainerId() : q.currentTrainerId();
        if (trainerId == null) throw ApiException.badRequest("Gói có HLV kèm, vui lòng chọn huấn luyện viên");
        Trainer trainer = trainerRepository.findById(trainerId).orElseThrow(() -> ApiException.notFound("huấn luyện viên"));
        if (!trainer.isActive()) throw ApiException.badRequest("Huấn luyện viên này đang ngừng nhận hội viên, vui lòng chọn HLV khác");
        String note = Mappers.blankToNull(req.note());
        if (note != null && note.length() > 255) throw ApiException.badRequest("Ghi chú tối đa 255 ký tự");

        MemberSubscription from = subscriptionRepository.findById(q.fromSubscriptionId()).orElseThrow(() -> ApiException.notFound("gói tập"));
        PackageRequest r = new PackageRequest();
        r.setRequestType(PackageRequestType.UPGRADE);
        r.setUpgradeFrom(from);
        r.setMember(m);
        r.setPlan(plan);
        r.setTrainer(trainer);
        r.setPromotion(q.promotionId() == null ? null : promotionRepository.findById(q.promotionId()).orElse(null));
        r.setPlanName(plan.getName());
        r.setOriginalPrice(plan.getPrice());
        r.setUpgradeCredit(q.credit());
        r.setDiscountAmount(q.discountAmount());
        r.setFinalPrice(q.finalPrice());
        r.setPrice(q.finalPrice());
        r.setDurationDays(plan.getDurationDays());
        r.setPtSessionsSnapshot(plan.getPtSessions());
        r.setPtValidDaysSnapshot(plan.getPtValidDays());
        r.setPtSessionMinutesSnapshot(plan.getPtSessionMinutes());
        r.setPtCancelNoticeHoursSnapshot(plan.getPtCancelNoticeHours());
        r.setDesiredStartDate(q.startDate());
        r.setMemberNote(note);
        r.setPaymentMethod(method);
        r.setStatus(PackageRequestStatus.PENDING);
        requestRepository.saveAndFlush(r);
        r.setPaymentCode(PackageRequestService.paymentCode(r.getId()));
        auditService.log("PACKAGE_UPGRADE_REQUEST", "PACKAGE_REQUEST", r.getId(), m.getCode() + " · " + q.fromPlanName() + " → "
                + plan.getName() + " từ " + q.startDate() + " · trừ " + q.credit() + " · ưu đãi " + q.discountAmount()
                + " · trả " + q.finalPrice() + " VND · HLV " + trainer.getUser().getFullName()
                + (method == PaymentMethod.BANK_TRANSFER ? " · chuyển khoản " + r.getPaymentCode() : " · tại quầy"));
        return packageRequestService.toResponse(r);
    }

    // ---------------- Quản lý duyệt ----------------

    /** Gọi trong transaction của PackageApprovalService. Giá chốt theo đơn (hội viên đã trả đúng số tiền này). */
    @Transactional
    public PackageRequestResponse approve(AuthUser admin, Long id, ApprovePackageRequest req) {
        PackageRequest r = requestRepository.lockById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
        if (!r.isPending()) throw ApiException.conflict("Đơn này đã được xử lý trước đó");
        if (!r.isUpgrade()) throw ApiException.conflict("Đơn này không phải đơn nâng cấp");
        MembershipPlan plan = r.getPlan();
        if (!plan.isActive()) throw ApiException.badRequest("Gói PT đã ngừng kinh doanh. Hãy từ chối đơn và hướng dẫn hội viên chọn gói khác.");
        MemberSubscription from = r.getUpgradeFrom();
        if (from == null || from.isCancelled()) {
            throw ApiException.conflict("Gói tự tập cần nâng cấp đã bị huỷ. Từ chối đơn để hội viên đăng ký gói PT mới.");
        }
        Trainer assign = packageRequestService.resolveTrainerForApproval(r, req);
        Long memberId = r.getMember().getId();
        subscriptionRepository.lockMember(memberId);

        LocalDate today = mappers.today();
        LocalDate start = r.getDesiredStartDate() == null || r.getDesiredStartDate().isBefore(today) ? today : r.getDesiredStartDate();
        if (!start.isAfter(from.getStartDate())) start = from.getStartDate().plusDays(1);
        if (from.getEndDate().isBefore(start)) {
            throw ApiException.conflict("Gói tự tập đã hết hạn (" + from.getEndDate().format(D) + ") trước ngày bắt đầu gói PT. "
                    + "Từ chối đơn để hội viên đăng ký gói PT mới.");
        }
        LocalDate end = start.plusDays(r.getDurationDays() - 1L);
        MemberSubscription clash = clash(memberId, start, end, from.getId());
        if (clash != null) {
            throw ApiException.conflict("Hội viên còn gói " + planName(clash) + " (" + clash.getStartDate().format(D) + " – "
                    + clash.getEndDate().format(D) + ") trùng thời gian gói PT mới. Sửa thời gian gói đó trước rồi duyệt lại.");
        }
        String decision = Mappers.blankToNull(req == null ? null : req.note());
        String paid = r.getPaymentMethod() == PaymentMethod.BANK_TRANSFER ? " · chuyển khoản " + r.getPaymentCode() : "";

        // 1. Cắt gói tự tập tới hôm trước ngày bắt đầu gói PT, ghi lại lịch sử.
        LocalDate cutEnd = start.minusDays(1);
        SubscriptionAdjustment adj = new SubscriptionAdjustment();
        adj.setSubscription(from);
        adj.setSource(AdjustmentSource.UPGRADE);
        adj.setOldStartDate(from.getStartDate());
        adj.setOldEndDate(from.getEndDate());
        adj.setNewStartDate(from.getStartDate());
        adj.setNewEndDate(cutEnd);
        adj.setOldPtValidUntil(from.getPtValidUntil());
        adj.setNewPtValidUntil(from.getPtValidUntil());
        adj.setReason(cut("Nâng cấp lên " + plan.getName() + " từ " + start.format(D) + " (đơn #" + r.getId() + ")", 255));
        adj.setCreatedBy(userRepository.getReferenceById(admin.id()));
        adjustmentRepository.save(adj);
        from.setEndDate(cutEnd);
        from.setNote(cut(appendNote(from.getNote(), "Nâng cấp lên " + plan.getName() + " từ " + start.format(D)), 255));
        for (MemberServiceEntitlement e : entitlementRepository.findBySubscriptionIdAndSource(from.getId(), EntitlementSource.PLAN)) {
            if (e.getStatus() == EntitlementStatus.ACTIVE && e.getValidUntil().isAfter(cutEnd)) {
                e.setValidUntil(e.getValidFrom().isAfter(cutEnd) ? e.getValidFrom() : cutEnd);
            }
        }
        subscriptionRepository.saveAndFlush(from);

        // 2. Tạo gói PT với đúng giá đã chốt trong đơn.
        LocalDate ptUntil = r.getPtValidDaysSnapshot() != null ? start.plusDays(r.getPtValidDaysSnapshot()) : null;
        String note = "Nâng cấp từ " + planName(from) + " · đơn #" + r.getId() + " · trừ " + r.getUpgradeCredit() + "đ giá trị còn lại"
                + paid + (decision == null ? "" : " · " + decision);
        SubscriptionResponse created = subscriptionService.create(admin, new SubscriptionRequest(memberId, plan.getId(), start,
                r.getPrice(), cut(note, 255), r.getPtSessionsSnapshot(), ptUntil, r.getPtSessionMinutesSnapshot(),
                r.getPtCancelNoticeHoursSnapshot()));
        MemberSubscription sub = subscriptionRepository.findById(created.id()).orElseThrow(() -> ApiException.notFound("gói tập"));
        sub.setUpgradedFrom(from);

        // 3. Ưu đãi, quà tặng, HLV – dùng chung với đơn đăng ký thường.
        packageRequestService.bumpPromotion(r);
        packageRequestService.grantEntitlements(r, sub, created.startDate(), created.endDate());
        packageRequestService.assignTrainer(r, assign);

        r.setStatus(PackageRequestStatus.APPROVED);
        r.setDecisionNote(decision);
        r.setDecidedBy(userRepository.getReferenceById(admin.id()));
        r.setDecidedAt(LocalDateTime.now(clock));
        r.setSubscription(sub);
        auditService.log("PACKAGE_UPGRADE_APPROVE", "PACKAGE_REQUEST", r.getId(), r.getMember().getCode() + " · " + planName(from)
                + " cắt tới " + cutEnd + " · " + plan.getName() + " " + created.startDate() + " → " + created.endDate() + paid);
        return packageRequestService.toResponse(r);
    }

    // ---------------- Tính báo giá ----------------

    private UpgradeQuote build(AuthUser user, Member m, MembershipPlan plan, LocalDate startDate, String code, boolean checkPending) {
        LocalDate today = mappers.today();
        LocalDate minStart = today.plusDays(1);
        List<MemberSubscription> effective = subscriptionRepository.findEffective(m.getId(), today);
        MemberSubscription from = effective.stream().filter(s -> !isPtSub(s)).findFirst().orElse(null);
        Trainer ct = m.getTrainer();
        Long ctId = ct == null || !ct.isActive() ? null : ct.getId();
        String ctName = ct == null ? null : ct.getUser().getFullName();

        String problem = null;
        if (m.getStatus() == MemberStatus.INACTIVE) {
            problem = "Hồ sơ hội viên đang ngừng hoạt động, vui lòng liên hệ quầy lễ tân";
        } else if (effective.stream().anyMatch(SubscriptionUpgradeService::isPtSub)) {
            problem = "Bạn đang có gói kèm huấn luyện viên (PT) còn hiệu lực";
        } else if (from == null) {
            problem = "Bạn chưa có gói tự tập đang hiệu lực để nâng cấp. Hãy đăng ký gói có PT mới.";
        } else if (checkPending && requestRepository.existsByMemberIdAndStatus(m.getId(), PackageRequestStatus.PENDING)) {
            problem = "Bạn đang có một đơn chờ xác nhận. Huỷ đơn đó nếu muốn nâng cấp.";
        }
        if (problem == null && plan == null) problem = "Vui lòng chọn gói có PT";
        if (problem == null && !plan.isActive()) problem = "Gói " + plan.getName() + " đã ngừng kinh doanh, vui lòng chọn gói khác";
        if (problem == null && !isPtPlan(plan)) problem = "Chỉ nâng cấp lên gói có huấn luyện viên (PT)";
        if (problem == null && plan.getPtSessions() == null) problem = "Gói PT này chưa khai báo số buổi, chưa nâng cấp được";

        LocalDate maxStart = from == null ? minStart : min(from.getEndDate(), today.plusDays(MAX_UPGRADE_START_DAYS));
        if (problem == null && maxStart.isBefore(minStart)) {
            problem = "Gói hiện tại hết hạn hôm nay, hãy đăng ký gói PT mới để bắt đầu từ ngày mai";
        }
        LocalDate start = startDate == null ? minStart : startDate;
        if (problem == null && start.isBefore(minStart)) problem = "Gói PT bắt đầu sớm nhất từ ngày mai (" + minStart.format(D) + ")";
        if (problem == null && start.isAfter(maxStart)) {
            problem = maxStart.equals(from.getEndDate())
                    ? "Ngày bắt đầu phải trước khi gói hiện tại hết hạn (" + from.getEndDate().format(D) + ")"
                    : "Ngày bắt đầu chỉ chọn trong vòng " + MAX_UPGRADE_START_DAYS + " ngày tới";
        }
        LocalDate end = plan == null ? null : start.plusDays(plan.getDurationDays() - 1L);
        if (problem == null) {
            MemberSubscription clash = clash(m.getId(), start, end, from.getId());
            if (clash != null) {
                problem = "Bạn còn gói " + planName(clash) + " từ " + clash.getStartDate().format(D)
                        + " trùng thời gian gói PT mới. Liên hệ lễ tân để dời gói đó trước.";
            }
        }

        long planPrice = plan == null ? 0 : plan.getPrice();
        long total = from == null ? 0 : UpgradeMath.totalDays(from.getStartDate(), from.getEndDate());
        long remaining = from == null ? 0 : UpgradeMath.remainingDays(from.getStartDate(), from.getEndDate(), start);
        long credit = from == null ? 0 : UpgradeMath.credit(from.getPricePaid(), from.getStartDate(), from.getEndDate(), start, planPrice);
        long amount = planPrice - credit;

        Long promoId = null;
        String promoCode = null, promoName = null, promoReason = null;
        long discount = 0;
        List<com.gymflow.dto.Dtos.PromotionGrantDto> gifts = List.of();
        if (plan != null && problem == null) {
            PromotionValidationResponse v = promotionService.validateFor(user, code, plan, amount, true);
            if (v.valid() && v.promotionId() != null) {
                promoId = v.promotionId();
                promoCode = v.promotionCode();
                promoName = v.promotionName();
                discount = v.discountAmount();
                gifts = v.gifts();
            } else if (!v.valid()) {
                promoReason = v.reason();
            }
        }
        LocalDate ptUntil = plan == null || plan.getPtValidDays() == null ? null : start.plusDays(plan.getPtValidDays());
        return new UpgradeQuote(problem == null, problem,
                from == null ? null : from.getId(), from == null ? null : planName(from),
                from == null ? null : from.getStartDate(), from == null ? null : from.getEndDate(),
                from == null ? 0 : from.getPricePaid(), total, remaining, credit,
                plan == null ? null : plan.getId(), plan == null ? null : plan.getName(), planPrice, amount,
                promoId, promoCode, promoName, promoReason, discount, Math.max(0, amount - discount), gifts,
                start, end, plan == null ? null : plan.getPtSessions(), ptUntil, minStart, maxStart, ctId, ctName);
    }

    /** Gói chưa huỷ (khác gói được bỏ qua) trùng khoảng [start, end], hoặc null. */
    private MemberSubscription clash(Long memberId, LocalDate start, LocalDate end, Long ignoreId) {
        if (!subscriptionRepository.existsOverlapExcluding(memberId, start, end, List.of(ignoreId))) return null;
        return subscriptionRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
                .filter(s -> !s.isCancelled() && !s.getId().equals(ignoreId)
                        && !s.getStartDate().isAfter(end) && !s.getEndDate().isBefore(start))
                .findFirst().orElse(null);
    }

    static String planName(MemberSubscription s) {
        return s.getPlanNameSnapshot() != null ? s.getPlanNameSnapshot() : s.getPlan().getName();
    }

    static String appendNote(String note, String add) {
        return note == null || note.isBlank() ? add : note + " | " + add;
    }

    static String cut(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }

    private static LocalDate min(LocalDate a, LocalDate b) {
        return a.isBefore(b) ? a : b;
    }
}
