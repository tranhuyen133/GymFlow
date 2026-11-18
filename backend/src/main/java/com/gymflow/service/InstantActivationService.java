package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.PackageRequestDtos.ApprovePackageRequest;
import com.gymflow.dto.PackageRequestDtos.PackageRequestResponse;
import com.gymflow.repository.MemberServiceEntitlementRepository;
import com.gymflow.repository.PackageRequestRepository;
import com.gymflow.repository.PaymentReconcileRepository;
import com.gymflow.repository.PromotionRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * V56 · Chuyển khoản QR không phải chờ quản lý: hội viên bấm "Tôi đã chuyển khoản" là gói được tạo ngay
 * (đi qua đúng luồng duyệt PackageApprovalService nên giữ mọi kiểm tra: trùng gói, ưu đãi, quà tặng, HLV, nâng cấp PT).
 * Quản lý đối soát sau ở trang Đối soát chuyển khoản: xác nhận đã nhận tiền, hoặc thu hồi gói nếu không thấy tiền về.
 *
 * <p>Chống lạm dụng: mỗi hội viên chỉ được một đơn tự kích hoạt chưa đối soát; đơn thứ hai chờ quản lý như trước.
 * Kích hoạt lỗi (ưu đãi hết lượt, HLV ngừng nhận…) thì đơn vẫn giữ trạng thái "đã báo chuyển khoản" cho quản lý xử lý.
 * Tắt bằng PAYMENT_INSTANT_ACTIVATION=false.</p>
 */
@Slf4j
@Service
public class InstantActivationService {

    static final String AUTO_NOTE = "Tự kích hoạt khi hội viên báo đã chuyển khoản · chờ quản lý đối soát";

    private final PackageRequestService requestService;
    private final PackageApprovalService approvalService;
    private final PackageRequestRepository requestRepository;
    private final PaymentReconcileRepository reconcile;
    private final SubscriptionService subscriptionService;
    private final MemberServiceEntitlementRepository entitlementRepository;
    private final PromotionRepository promotionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final Clock clock;
    private final TransactionTemplate tx;
    private final boolean enabled;

    public InstantActivationService(PackageRequestService requestService, PackageApprovalService approvalService,
                                    PackageRequestRepository requestRepository, PaymentReconcileRepository reconcile,
                                    SubscriptionService subscriptionService, MemberServiceEntitlementRepository entitlementRepository,
                                    PromotionRepository promotionRepository, UserRepository userRepository,
                                    AuditService auditService, Clock clock, PlatformTransactionManager tm,
                                    @Value("${app.payment.instant-activation:true}") boolean enabled) {
        this.requestService = requestService;
        this.approvalService = approvalService;
        this.requestRepository = requestRepository;
        this.reconcile = reconcile;
        this.subscriptionService = subscriptionService;
        this.entitlementRepository = entitlementRepository;
        this.promotionRepository = promotionRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.clock = clock;
        this.tx = new TransactionTemplate(tm);
        this.enabled = enabled;
    }

    public boolean enabled() {
        return enabled;
    }

    // ---------------- Hội viên ----------------

    /** Báo đã chuyển khoản (lưu riêng, không mất khi kích hoạt lỗi) rồi thử kích hoạt gói ngay. */
    public PackageRequestResponse paid(AuthUser user, Long id) {
        PackageRequestResponse marked = requestService.markPaid(user, id);
        if (!enabled || marked.status() != PackageRequestStatus.PENDING) return marked;
        if (reconcile.countOpenForMember(marked.memberId()) > 0) {
            log.info("Đơn #{}: hội viên còn đơn tự kích hoạt chưa đối soát, chờ quản lý duyệt", id);
            return marked;
        }
        try {
            return tx.execute(status -> {
                approvalService.approve(user, id, new ApprovePackageRequest(AUTO_NOTE, null));
                PackageRequest r = requestRepository.findById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
                // Người duyệt để trống: quản lý chưa xem đơn này. Điền khi quản lý xác nhận đã nhận tiền.
                r.setDecidedBy(null);
                reconcile.markAuto(id, LocalDateTime.now(clock));
                auditService.log("PACKAGE_AUTO_ACTIVATE", "PACKAGE_REQUEST", id,
                        r.getMember().getCode() + " · " + r.getPlanName() + " · " + r.getPaymentCode() + " · chờ đối soát");
                return requestService.toResponse(r);
            });
        } catch (RuntimeException ex) {
            log.info("Đơn #{} chưa tự kích hoạt được, chờ quản lý duyệt: {}", id, ex.getMessage());
            return tx.execute(status -> requestService.toResponse(
                    requestRepository.findById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"))));
        }
    }

    // ---------------- Quản lý đối soát ----------------

    public record ReconcileItem(PackageRequestResponse request, LocalDateTime autoActivatedAt,
                                LocalDateTime reconciledAt, LocalDateTime revokedAt, boolean canRevoke) {
    }

    public record ReconcileOverview(boolean enabled, long openCount, List<ReconcileItem> open, List<ReconcileItem> recent) {
    }

    public ReconcileOverview overview() {
        return tx.execute(status -> new ReconcileOverview(enabled, reconcile.countOpen(),
                reconcile.open().stream().map(this::item).toList(),
                reconcile.recentClosed().stream().map(this::item).toList()));
    }

    public long openCount() {
        return reconcile.countOpen();
    }

    /** Đã thấy tiền về tài khoản: ghi người đối soát làm người duyệt đơn. */
    public ReconcileItem confirm(AuthUser admin, Long id) {
        return tx.execute(status -> {
            PackageRequest r = requestRepository.lockById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
            requireOpen(id);
            LocalDateTime now = LocalDateTime.now(clock);
            if (reconcile.markReconciled(id, admin.id(), now) == 0) throw ApiException.conflict("Đơn này vừa được đối soát");
            r.setDecidedBy(userRepository.getReferenceById(admin.id()));
            auditService.log("PACKAGE_RECONCILE_OK", "PACKAGE_REQUEST", id, r.getMember().getCode() + " · " + r.getPaymentCode()
                    + " · đã nhận " + r.getPrice() + " VND");
            return item(reconcile.find(id).orElseThrow());
        });
    }

    /** Không thấy tiền về: huỷ gói vừa tạo (kèm quà tặng), trả lại lượt ưu đãi, đơn chuyển sang Từ chối. */
    public ReconcileItem revoke(AuthUser admin, Long id, String reason) {
        String why = reason == null ? "" : reason.trim();
        if (why.length() < 5 || why.length() > 200) throw ApiException.badRequest("Lý do từ 5 đến 200 ký tự");
        return tx.execute(status -> {
            PackageRequest r = requestRepository.lockById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
            requireOpen(id);
            if (r.isUpgrade()) {
                throw ApiException.badRequest("Đơn nâng cấp lên PT đã cắt ngắn gói cũ, không thu hồi tự động được. "
                        + "Vào Đăng ký gói để huỷ gói PT và sửa lại thời gian gói cũ.");
            }
            MemberSubscription sub = r.getSubscription();
            if (sub != null && !sub.isCancelled()) {
                subscriptionService.cancel(sub.getId(), "Không nhận được chuyển khoản " + r.getPaymentCode() + ": " + why);
                for (MemberServiceEntitlement e : entitlementRepository.findBySubscriptionIdAndSource(sub.getId(), EntitlementSource.PROMOTION)) {
                    if (e.getStatus() == EntitlementStatus.ACTIVE) e.setStatus(EntitlementStatus.CANCELLED);
                }
            }
            if (r.getPromotion() != null) {
                promotionRepository.findByIdForUpdate(r.getPromotion().getId())
                        .ifPresent(p -> p.setUsedCount(Math.max(0, p.getUsedCount() - 1)));
            }
            LocalDateTime now = LocalDateTime.now(clock);
            if (reconcile.markRevoked(id, admin.id(), now) == 0) throw ApiException.conflict("Đơn này vừa được đối soát");
            r.setStatus(PackageRequestStatus.REJECTED);
            r.setDecisionNote(cut("Thu hồi: chưa nhận được chuyển khoản · " + why));
            r.setDecidedBy(userRepository.getReferenceById(admin.id()));
            r.setDecidedAt(now);
            auditService.log("PACKAGE_RECONCILE_REVOKE", "PACKAGE_REQUEST", id, r.getMember().getCode() + " · " + r.getPaymentCode()
                    + " · thu hồi gói · " + why);
            return item(reconcile.find(id).orElseThrow());
        });
    }

    private void requireOpen(Long id) {
        PaymentReconcileRepository.Row row = reconcile.find(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
        if (row.autoActivatedAt() == null) throw ApiException.badRequest("Đơn này không được tự kích hoạt");
        if (!row.open()) throw ApiException.conflict("Đơn này đã được đối soát");
    }

    private ReconcileItem item(PaymentReconcileRepository.Row row) {
        PackageRequest r = requestRepository.findById(row.id()).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
        return new ReconcileItem(requestService.toResponse(r), row.autoActivatedAt(), row.reconciledAt(), row.revokedAt(),
                row.open() && !r.isUpgrade());
    }

    private static String cut(String s) {
        return s.length() <= 255 ? s : s.substring(0, 255);
    }
}
