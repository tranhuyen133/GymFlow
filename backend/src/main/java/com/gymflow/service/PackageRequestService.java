package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.SubscriptionRequest;
import com.gymflow.dto.Dtos.SubscriptionResponse;
import com.gymflow.dto.PackageRequestDtos.*;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.PackageRequestRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Hội viên tự đăng ký gói (SUB-08). Chưa nối cổng thanh toán nên không giả lập "đã thanh toán":
 * hội viên gửi đơn, trả tại quầy hoặc chuyển khoản theo mã QR (V12) với nội dung là mã đơn GFxxxxxx →
 * quản lý xác nhận đã nhận tiền → tạo gói qua SubscriptionService.create
 * (dùng lại toàn bộ kiểm tra: gói còn bán, hội viên còn hoạt động, chống trùng thời gian, nối tiếp gói cũ).
 * Gói có HLV kèm: hội viên chọn HLV khi gửi đơn, duyệt đơn thì HLV đó được gán cho hội viên.
 */
@Service
@RequiredArgsConstructor
public class PackageRequestService {

    /** Ngày bắt đầu mong muốn tối đa bao nhiêu ngày tới. */
    public static final int MAX_DESIRED_START_DAYS = 60;

    private final PackageRequestRepository requestRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    private final PlanService planService;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;
    private final Clock clock;
    private final TrainerRepository trainerRepository;
    private final PaymentSettingsService paymentSettings;

    /** Nội dung chuyển khoản theo id đơn: GF000123. Không dấu, không khoảng trắng để app ngân hàng nào cũng gõ được. */
    static String paymentCode(Long id) {
        return String.format("GF%06d", id);
    }

    // ---------------- Hội viên ----------------

    @Transactional(readOnly = true)
    public List<PackageRequestResponse> mine(AuthUser user) {
        Member m = access.requireMemberOf(user);
        return requestRepository.findByMemberIdOrderByCreatedAtDesc(m.getId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public PackageRequestResponse create(AuthUser user, CreatePackageRequest req) {
        Member member = access.requireMemberOf(user);
        if (member.getStatus() == MemberStatus.INACTIVE) {
            throw ApiException.badRequest("Hồ sơ hội viên đang ngừng hoạt động, vui lòng liên hệ quầy lễ tân");
        }
        MembershipPlan plan = planService.load(req.planId());
        if (!plan.isActive()) throw ApiException.badRequest("Gói tập này đã ngừng kinh doanh, vui lòng chọn gói khác");

        PaymentMethod method = req.paymentMethod() == null ? PaymentMethod.COUNTER : req.paymentMethod();
        if (method == PaymentMethod.BANK_TRANSFER && !paymentSettings.onlineReady()) {
            throw ApiException.badRequest("Phòng tập chưa mở nhận chuyển khoản, vui lòng chọn thanh toán tại quầy");
        }
        // Gói không kèm HLV: bỏ qua trainerId gửi lên, hội viên tự soạn giáo án và tự xếp lịch.
        Trainer trainer = null;
        if (plan.isIncludesTrainer()) {
            if (req.trainerId() == null) throw ApiException.badRequest("Gói này có HLV kèm, vui lòng chọn huấn luyện viên");
            trainer = activeTrainer(req.trainerId());
        }

        LocalDate today = mappers.today();
        LocalDate start = req.desiredStartDate();
        if (start != null) {
            if (start.isBefore(today)) throw ApiException.badRequest("Ngày bắt đầu không được ở quá khứ");
            if (start.isAfter(today.plusDays(MAX_DESIRED_START_DAYS))) {
                throw ApiException.badRequest("Ngày bắt đầu chỉ được chọn trong vòng " + MAX_DESIRED_START_DAYS + " ngày tới");
            }
        }

        // Khoá dòng hội viên: hai lần bấm gửi đồng thời không tạo được hai đơn chờ.
        subscriptionRepository.lockMember(member.getId());
        if (requestRepository.existsByMemberIdAndStatus(member.getId(), PackageRequestStatus.PENDING)) {
            throw ApiException.conflict("Bạn đang có một đơn đăng ký chờ xác nhận. Huỷ đơn đó nếu muốn chọn gói khác.");
        }
        if (start != null && subscriptionRepository.existsOverlap(member.getId(), start, start.plusDays(plan.getDurationDays() - 1L))) {
            throw ApiException.conflict("Ngày bắt đầu bị trùng với gói bạn đang có. Để trống ngày bắt đầu để gói mới nối tiếp gói hiện tại.");
        }

        PackageRequest r = new PackageRequest();
        r.setMember(member);
        r.setPlan(plan);
        r.setTrainer(trainer);
        r.setPlanName(plan.getName());
        r.setPrice(plan.getPrice());
        r.setDurationDays(plan.getDurationDays());
        r.setDesiredStartDate(start);
        r.setMemberNote(Mappers.blankToNull(req.note()));
        r.setPaymentMethod(method);
        r.setStatus(PackageRequestStatus.PENDING);
        requestRepository.saveAndFlush(r);
        r.setPaymentCode(paymentCode(r.getId()));
        auditService.log("PACKAGE_REQUEST_CREATE", "PACKAGE_REQUEST", r.getId(), member.getCode() + " · " + plan.getName()
                + (method == PaymentMethod.BANK_TRANSFER ? " · chuyển khoản " + r.getPaymentCode() : " · tại quầy")
                + (trainer == null ? "" : " · HLV " + trainer.getUser().getFullName()));
        return toResponse(r);
    }

    /** Hội viên báo đã chuyển khoản. Chỉ để quản lý biết mà kiểm tra tài khoản – gói chưa được kích hoạt ở bước này. */
    @Transactional
    public PackageRequestResponse markPaid(AuthUser user, Long id) {
        Member member = access.requireMemberOf(user);
        PackageRequest r = requestRepository.lockById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
        if (!r.getMember().getId().equals(member.getId())) throw ApiException.notFound("đơn đăng ký gói");
        if (!r.isPending()) throw ApiException.badRequest("Đơn này đã được xử lý");
        if (r.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) throw ApiException.badRequest("Đơn này thanh toán tại quầy");
        if (r.getMemberPaidAt() == null) {
            r.setMemberPaidAt(LocalDateTime.now(clock));
            auditService.log("PACKAGE_REQUEST_PAID", "PACKAGE_REQUEST", r.getId(), member.getCode() + " · " + r.getPaymentCode());
        }
        return toResponse(r);
    }

    @Transactional
    public PackageRequestResponse cancelMine(AuthUser user, Long id) {
        Member member = access.requireMemberOf(user);
        PackageRequest r = requestRepository.lockById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
        // Không cho biết đơn của người khác có tồn tại hay không.
        if (!r.getMember().getId().equals(member.getId())) throw ApiException.notFound("đơn đăng ký gói");
        if (!r.isPending()) throw ApiException.badRequest("Chỉ huỷ được đơn đang chờ xác nhận");
        r.setStatus(PackageRequestStatus.CANCELLED);
        r.setDecidedAt(LocalDateTime.now(clock));
        auditService.log("PACKAGE_REQUEST_CANCEL", "PACKAGE_REQUEST", r.getId(), member.getCode() + " · " + r.getPlanName());
        return toResponse(r);
    }

    // ---------------- Quản lý ----------------

    @Transactional(readOnly = true)
    public List<PackageRequestResponse> list(PackageRequestStatus status) {
        List<PackageRequest> all = status == null ? requestRepository.findAllByOrderByCreatedAtDesc()
                : requestRepository.findByStatusOrderByCreatedAtAsc(status);
        return all.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return requestRepository.countByStatus(PackageRequestStatus.PENDING);
    }

    /** Quản lý xác nhận đã nhận tiền (tại quầy hoặc chuyển khoản) → tạo gói với đúng giá đã chốt trong đơn. */
    @Transactional
    public PackageRequestResponse approve(AuthUser admin, Long id, ApprovePackageRequest req) {
        PackageRequest r = requestRepository.lockById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
        if (!r.isPending()) throw ApiException.conflict("Đơn này đã được xử lý trước đó");
        if (!r.getPlan().isActive()) {
            throw ApiException.badRequest("Gói đã ngừng kinh doanh. Hãy từ chối đơn và hướng dẫn hội viên chọn gói khác.");
        }
        // Gói có HLV kèm: kiểm tra HLV trước khi tạo gói, để lỗi HLV không để lại gói đã tạo.
        Trainer assign = null;
        if (r.getTrainer() != null || r.getPlan().isIncludesTrainer()) {
            assign = req != null && req.trainerId() != null ? activeTrainer(req.trainerId()) : r.getTrainer();
            if (assign == null) throw ApiException.badRequest("Gói có HLV kèm: chọn huấn luyện viên cho hội viên trước khi duyệt");
            if (!assign.isActive()) throw ApiException.badRequest("Huấn luyện viên " + assign.getUser().getFullName() + " đang ngừng nhận hội viên, hãy chọn HLV khác");
        }
        Long memberId = r.getMember().getId();
        LocalDate today = mappers.today();
        // Ngày mong muốn đã qua hoặc đã bị gói khác chiếm thì để trống: SubscriptionService tự nối tiếp gói hiện tại.
        LocalDate start = r.getDesiredStartDate();
        if (start != null && (start.isBefore(today)
                || subscriptionRepository.existsOverlap(memberId, start, start.plusDays(r.getDurationDays() - 1L)))) {
            start = null;
        }
        String decision = Mappers.blankToNull(req == null ? null : req.note());
        String paid = r.getPaymentMethod() == PaymentMethod.BANK_TRANSFER ? " · chuyển khoản " + r.getPaymentCode() : "";
        String note = "Đơn #" + r.getId() + " hội viên tự đăng ký" + paid + (decision == null ? "" : " · " + decision);
        SubscriptionResponse created = subscriptionService.create(admin,
                new SubscriptionRequest(memberId, r.getPlan().getId(), start, r.getPrice(), note.length() > 255 ? note.substring(0, 255) : note));

        if (assign != null) {
            Member m = r.getMember();
            if (m.getTrainer() == null || !Objects.equals(m.getTrainer().getId(), assign.getId())) {
                m.setTrainer(assign);
                auditService.log("MEMBER_ASSIGN_TRAINER", "MEMBER", m.getId(),
                        m.getCode() + " → " + assign.getUser().getFullName() + " (đơn #" + r.getId() + ")");
            }
            r.setTrainer(assign);
        }
        r.setStatus(PackageRequestStatus.APPROVED);
        r.setDecisionNote(decision);
        r.setDecidedBy(userRepository.getReferenceById(admin.id()));
        r.setDecidedAt(LocalDateTime.now(clock));
        r.setSubscription(subscriptionRepository.getReferenceById(created.id()));
        auditService.log("PACKAGE_REQUEST_APPROVE", "PACKAGE_REQUEST", r.getId(),
                r.getMember().getCode() + " · " + r.getPlanName() + " · " + created.startDate() + " → " + created.endDate() + paid);
        return toResponse(r);
    }

    @Transactional
    public PackageRequestResponse reject(AuthUser admin, Long id, RejectPackageRequest req) {
        PackageRequest r = requestRepository.lockById(id).orElseThrow(() -> ApiException.notFound("đơn đăng ký gói"));
        if (!r.isPending()) throw ApiException.conflict("Đơn này đã được xử lý trước đó");
        String reason = req.reason().trim();
        if (reason.length() < 5) throw ApiException.badRequest("Lý do từ 5 đến 255 ký tự");
        r.setStatus(PackageRequestStatus.REJECTED);
        r.setDecisionNote(reason);
        r.setDecidedBy(userRepository.getReferenceById(admin.id()));
        r.setDecidedAt(LocalDateTime.now(clock));
        auditService.log("PACKAGE_REQUEST_REJECT", "PACKAGE_REQUEST", r.getId(), r.getMember().getCode() + " · " + reason);
        return toResponse(r);
    }

    private Trainer activeTrainer(Long trainerId) {
        Trainer t = trainerRepository.findById(trainerId).orElseThrow(() -> ApiException.notFound("huấn luyện viên"));
        if (!t.isActive()) throw ApiException.badRequest("Huấn luyện viên này đang ngừng nhận hội viên, vui lòng chọn HLV khác");
        return t;
    }

    PackageRequestResponse toResponse(PackageRequest r) {
        Member m = r.getMember();
        Trainer t = r.getTrainer();
        return new PackageRequestResponse(r.getId(), m.getId(), m.getUser().getFullName(), m.getCode(), m.getUser().getPhone(),
                r.getPlan().getId(), r.getPlanName(), r.getPrice(), r.getDurationDays(), r.getPlan().isActive(),
                r.getDesiredStartDate(), r.getMemberNote(), r.getStatus(), r.getDecisionNote(),
                r.getDecidedBy() == null ? null : r.getDecidedBy().getFullName(), r.getDecidedAt(),
                r.getSubscription() == null ? null : r.getSubscription().getId(), r.getCreatedAt(),
                r.getPlan().isIncludesTrainer(), t == null ? null : t.getId(), t == null ? null : t.getUser().getFullName(),
                r.getPaymentMethod(), r.getPaymentCode(), r.getMemberPaidAt());
    }
}
