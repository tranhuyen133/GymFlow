package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
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
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * V49 · Thời gian sử dụng gói:
 * - Quản lý sửa trực tiếp ngày bắt đầu / kết thúc (kèm lý do, lưu lịch sử trước / sau);
 * - Hội viên gửi yêu cầu dời ngày bắt đầu, bảo lưu (cộng thêm ngày) hoặc đổi HLV → quản lý duyệt / từ chối.
 * Mọi thay đổi đi qua {@link #applyDates}: không trùng gói khác, không bỏ ra ngoài các buổi PT đã trừ,
 * buổi đã xếp nằm ngoài mọi gói sau khi đổi thì tự huỷ và báo lại số buổi.
 */
@Service
@RequiredArgsConstructor
public class SubscriptionAdjustmentService {

    /** Khớp CHECK ck_plans_duration / ck_preq_duration. */
    public static final int MAX_DAYS = 1095;
    /** Bảo lưu tối đa mỗi lần và cộng dồn cho một gói. */
    public static final int MAX_PAUSE_DAYS = 30;
    /** Dời ngày bắt đầu trong vòng bao nhiêu ngày tới. */
    public static final int MAX_MOVE_START_DAYS = 60;
    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM HH:mm");

    private final MemberSubscriptionRepository subscriptionRepository;
    private final SubscriptionAdjustmentRepository adjustmentRepository;
    private final SubscriptionChangeRequestRepository changeRepository;
    private final MemberServiceEntitlementRepository entitlementRepository;
    private final PtSessionUsageRepository ptSessionUsageRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final TrainerRepository trainerRepository;
    private final UserRepository userRepository;
    private final TrainerHandoverService handoverService;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;
    private final Clock clock;

    // ---------------- Quản lý sửa trực tiếp ----------------

    @Transactional
    public AdjustResult adminAdjust(AuthUser admin, Long subscriptionId, AdjustDatesRequest req) {
        MemberSubscription s = load(subscriptionId);
        subscriptionRepository.lockMember(s.getMember().getId());
        List<String> notes = new ArrayList<>();
        int cancelled = applyDates(s, req.startDate(), req.endDate(), req.ptValidUntil(), AdjustmentSource.ADMIN, null,
                req.reason().trim(), admin, notes);
        return new AdjustResult(mappers.subscription(s), cancelled, notes);
    }

    @Transactional(readOnly = true)
    public List<AdjustmentResponse> history(AuthUser user, Long subscriptionId) {
        MemberSubscription s = load(subscriptionId);
        access.requireView(user, s.getMember().getId());
        return adjustmentRepository.findBySubscriptionIdOrderByCreatedAtDesc(subscriptionId).stream().map(this::toAdjustment).toList();
    }

    // ---------------- Hội viên gửi yêu cầu ----------------

    @Transactional(readOnly = true)
    public List<ChangeRequestResponse> mine(AuthUser user) {
        Member m = access.requireMemberOf(user);
        return changeRepository.findByMemberIdOrderByCreatedAtDesc(m.getId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ChangeRequestResponse create(AuthUser user, CreateChangeRequest req) {
        Member m = access.requireMemberOf(user);
        if (m.getStatus() == MemberStatus.INACTIVE) throw ApiException.badRequest("Hồ sơ hội viên đang ngừng hoạt động, vui lòng liên hệ quầy lễ tân");
        MemberSubscription s = subscriptionRepository.findById(req.subscriptionId()).orElseThrow(() -> ApiException.notFound("gói tập"));
        // Không cho biết gói của người khác có tồn tại hay không.
        if (!s.getMember().getId().equals(m.getId())) throw ApiException.notFound("gói tập");
        subscriptionRepository.lockMember(m.getId());
        LocalDate today = mappers.today();
        SubscriptionState state = s.stateOn(today);
        if (state == SubscriptionState.CANCELLED) throw ApiException.badRequest("Gói này đã bị huỷ");
        if (state == SubscriptionState.EXPIRED) throw ApiException.badRequest("Gói này đã hết hạn, không điều chỉnh được");
        if (changeRepository.existsBySubscriptionIdAndStatus(s.getId(), PackageRequestStatus.PENDING)) {
            throw ApiException.conflict("Gói này đang có một yêu cầu chờ quản lý duyệt. Huỷ yêu cầu đó nếu muốn gửi lại.");
        }
        String reason = req.reason() == null ? "" : req.reason().trim();
        if (reason.length() < 5 || reason.length() > 255) throw ApiException.badRequest("Lý do từ 5 đến 255 ký tự");

        SubscriptionChangeRequest r = new SubscriptionChangeRequest();
        r.setMember(m);
        r.setSubscription(s);
        r.setChangeType(req.type());
        r.setOldStartDate(s.getStartDate());
        r.setOldEndDate(s.getEndDate());
        r.setReason(reason);
        switch (req.type()) {
            case CHANGE_START -> {
                if (state != SubscriptionState.UPCOMING) {
                    throw ApiException.badRequest("Chỉ dời được ngày bắt đầu của gói chưa tới ngày. Gói đang dùng hãy chọn Bảo lưu.");
                }
                LocalDate ns = req.newStartDate();
                if (ns == null) throw ApiException.badRequest("Chọn ngày bắt đầu mới");
                if (ns.isBefore(today)) throw ApiException.badRequest("Ngày bắt đầu mới không được ở quá khứ");
                if (ns.isAfter(today.plusDays(MAX_MOVE_START_DAYS))) {
                    throw ApiException.badRequest("Ngày bắt đầu mới chỉ chọn trong vòng " + MAX_MOVE_START_DAYS + " ngày tới");
                }
                if (ns.equals(s.getStartDate())) throw ApiException.badRequest("Ngày bắt đầu mới trùng ngày hiện tại");
                LocalDate ne = ns.plusDays(ChronoUnit.DAYS.between(s.getStartDate(), s.getEndDate()));
                MemberSubscription other = clash(s, ns, ne);
                if (other != null) throw ApiException.conflict("Thời gian mới trùng gói " + planName(other) + " (" + range(other) + ")");
                r.setNewStartDate(ns);
            }
            case PAUSE -> {
                Integer days = req.pauseDays();
                if (days == null || days < 1 || days > MAX_PAUSE_DAYS) {
                    throw ApiException.badRequest("Số ngày bảo lưu từ 1 đến " + MAX_PAUSE_DAYS);
                }
                int used = pausedDays(s.getId());
                if (used + days > MAX_PAUSE_DAYS) {
                    throw ApiException.badRequest("Mỗi gói bảo lưu tối đa " + MAX_PAUSE_DAYS + " ngày (đã dùng " + used + " ngày)");
                }
                r.setPauseDays(days);
            }
            case CHANGE_TRAINER -> {
                if (!SubscriptionUpgradeService.isPtSub(s)) throw ApiException.badRequest("Chỉ gói có huấn luyện viên (PT) mới đổi được HLV");
                if (req.trainerId() == null) throw ApiException.badRequest("Chọn huấn luyện viên mới");
                Trainer t = trainerRepository.findById(req.trainerId()).orElseThrow(() -> ApiException.notFound("huấn luyện viên"));
                if (!t.isActive()) throw ApiException.badRequest("Huấn luyện viên này đang ngừng nhận hội viên, vui lòng chọn HLV khác");
                if (m.getTrainer() != null && m.getTrainer().getId().equals(t.getId())) {
                    throw ApiException.badRequest("Đây đã là huấn luyện viên đang phụ trách bạn");
                }
                r.setTrainer(t);
            }
        }
        changeRepository.save(r);
        auditService.log("SUB_CHANGE_REQUEST", "SUBSCRIPTION", s.getId(), m.getCode() + " · " + describe(r));
        return toResponse(r);
    }

    @Transactional
    public ChangeRequestResponse cancelMine(AuthUser user, Long id) {
        Member m = access.requireMemberOf(user);
        SubscriptionChangeRequest r = changeRepository.lockById(id).orElseThrow(() -> ApiException.notFound("yêu cầu điều chỉnh"));
        if (!r.getMember().getId().equals(m.getId())) throw ApiException.notFound("yêu cầu điều chỉnh");
        if (!r.isPending()) throw ApiException.badRequest("Chỉ huỷ được yêu cầu đang chờ duyệt");
        r.setStatus(PackageRequestStatus.CANCELLED);
        r.setDecidedAt(LocalDateTime.now(clock));
        auditService.log("SUB_CHANGE_CANCEL", "SUBSCRIPTION", r.getSubscription().getId(), m.getCode() + " · " + describe(r));
        return toResponse(r);
    }

    // ---------------- Quản lý duyệt ----------------

    @Transactional(readOnly = true)
    public List<ChangeRequestResponse> list(PackageRequestStatus status) {
        List<SubscriptionChangeRequest> all = status == null ? changeRepository.findAllByOrderByCreatedAtDesc()
                : changeRepository.findByStatusOrderByCreatedAtAsc(status);
        return all.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return changeRepository.countByStatus(PackageRequestStatus.PENDING);
    }

    @Transactional
    public AdjustResultWithRequest approve(AuthUser admin, Long id, DecideChangeRequest req) {
        SubscriptionChangeRequest r = changeRepository.lockById(id).orElseThrow(() -> ApiException.notFound("yêu cầu điều chỉnh"));
        if (!r.isPending()) throw ApiException.conflict("Yêu cầu này đã được xử lý trước đó");
        MemberSubscription s = r.getSubscription();
        Member m = r.getMember();
        subscriptionRepository.lockMember(m.getId());
        LocalDate today = mappers.today();
        if (s.isCancelled()) throw ApiException.conflict("Gói đã bị huỷ. Từ chối yêu cầu này.");
        String why = "Yêu cầu #" + r.getId() + ": " + r.getReason();
        List<String> notes = new ArrayList<>();
        int cancelled = 0;
        switch (r.getChangeType()) {
            case CHANGE_START -> {
                if (!s.getStartDate().isAfter(today)) throw ApiException.conflict("Gói đã bắt đầu, không dời ngày bắt đầu được nữa. Từ chối yêu cầu này.");
                if (r.getNewStartDate().isBefore(today)) throw ApiException.conflict("Ngày bắt đầu mới đã qua. Từ chối để hội viên chọn ngày khác.");
                LocalDate ne = r.getNewStartDate().plusDays(ChronoUnit.DAYS.between(s.getStartDate(), s.getEndDate()));
                cancelled = applyDates(s, r.getNewStartDate(), ne, null, AdjustmentSource.MEMBER_REQUEST, r, why, admin, notes);
            }
            case PAUSE -> {
                if (s.stateOn(today) == SubscriptionState.EXPIRED) throw ApiException.conflict("Gói đã hết hạn, không bảo lưu được nữa. Từ chối yêu cầu này.");
                int days = r.getPauseDays();
                // Dời các gói nối tiếp chưa bắt đầu (gói sau cùng trước) để gói được bảo lưu kéo dài không bị trùng.
                List<MemberSubscription> next = new ArrayList<>(subscriptionRepository.findStartingAfter(m.getId(), s.getEndDate()));
                Collections.reverse(next);
                for (MemberSubscription n : next) {
                    if (!n.getStartDate().isAfter(today)) continue;
                    cancelled += applyDates(n, n.getStartDate().plusDays(days), n.getEndDate().plusDays(days), null,
                            AdjustmentSource.MEMBER_REQUEST, r, cut("Dời theo bảo lưu gói " + planName(s) + " · " + why), admin, notes, false);
                    notes.add("Gói nối tiếp " + planName(n) + " dời " + days + " ngày: " + range(n));
                }
                cancelled += applyDates(s, s.getStartDate(), s.getEndDate().plusDays(days), null, AdjustmentSource.MEMBER_REQUEST, r, why, admin, notes);
            }
            case CHANGE_TRAINER -> {
                Trainer t = r.getTrainer();
                if (t == null || !t.isActive()) throw ApiException.conflict("HLV hội viên chọn hiện ngừng nhận hội viên. Từ chối để hội viên chọn HLV khác.");
                Trainer old = m.getTrainer();
                if (old != null && old.getId().equals(t.getId())) throw ApiException.conflict("Hội viên đã được HLV này phụ trách");
                m.setTrainer(t);
                TrainerHandoverService.Result h = handoverService.reassign(m, old, t);
                notes.add("Chuyển " + h.attached() + " buổi sắp tới sang HLV " + t.getUser().getFullName());
                notes.addAll(h.skipped());
                if (h.planLinked()) notes.add("Giáo án đang áp dụng chuyển cho HLV mới");
                auditService.log("MEMBER_ASSIGN_TRAINER", "MEMBER", m.getId(), m.getCode() + " → " + t.getUser().getFullName() + " (yêu cầu #" + r.getId() + ")");
            }
        }
        r.setStatus(PackageRequestStatus.APPROVED);
        r.setDecisionNote(Mappers.blankToNull(req == null ? null : req.note()));
        r.setDecidedBy(userRepository.getReferenceById(admin.id()));
        r.setDecidedAt(LocalDateTime.now(clock));
        auditService.log("SUB_CHANGE_APPROVE", "SUBSCRIPTION", s.getId(), m.getCode() + " · " + describe(r));
        return new AdjustResultWithRequest(toResponse(r), cancelled, notes);
    }

    @Transactional
    public ChangeRequestResponse reject(AuthUser admin, Long id, RejectPackageRequest req) {
        SubscriptionChangeRequest r = changeRepository.lockById(id).orElseThrow(() -> ApiException.notFound("yêu cầu điều chỉnh"));
        if (!r.isPending()) throw ApiException.conflict("Yêu cầu này đã được xử lý trước đó");
        String reason = req.reason().trim();
        if (reason.length() < 5) throw ApiException.badRequest("Lý do từ 5 đến 255 ký tự");
        r.setStatus(PackageRequestStatus.REJECTED);
        r.setDecisionNote(reason);
        r.setDecidedBy(userRepository.getReferenceById(admin.id()));
        r.setDecidedAt(LocalDateTime.now(clock));
        auditService.log("SUB_CHANGE_REJECT", "SUBSCRIPTION", r.getSubscription().getId(), r.getMember().getCode() + " · " + reason);
        return toResponse(r);
    }

    public record AdjustResultWithRequest(ChangeRequestResponse request, int cancelledSessions, List<String> notes) {
    }

    // ---------------- Lõi đổi thời gian ----------------

    /**
     * Đổi thời gian một gói và ghi lịch sử. Trả về số buổi đã xếp bị huỷ vì không còn nằm trong gói nào.
     * ptValidUntil null = tự dời theo ngày bắt đầu (và kéo dài thêm nếu gói dài ra), không vượt quá ngày sau ngày kết thúc.
     */
    int applyDates(MemberSubscription s, LocalDate newStart, LocalDate newEnd, LocalDate ptValidUntil, AdjustmentSource source,
                   SubscriptionChangeRequest cr, String reason, AuthUser actor, List<String> notes) {
        return applyDates(s, newStart, newEnd, ptValidUntil, source, cr, reason, actor, notes, true);
    }

    /** checkSessions = false khi còn đổi tiếp gói khác trong cùng thao tác (kiểm tra buổi tập một lần ở cuối). */
    int applyDates(MemberSubscription s, LocalDate newStart, LocalDate newEnd, LocalDate ptValidUntil, AdjustmentSource source,
                   SubscriptionChangeRequest cr, String reason, AuthUser actor, List<String> notes, boolean checkSessions) {
        LocalDate today = mappers.today();
        if (s.isCancelled()) throw ApiException.badRequest("Gói đã huỷ, không sửa được thời gian");
        if (newStart == null || newEnd == null) throw ApiException.badRequest("Chọn đủ ngày bắt đầu và ngày kết thúc");
        if (newEnd.isBefore(newStart)) throw ApiException.badRequest("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        if (ChronoUnit.DAYS.between(newStart, newEnd) + 1 > MAX_DAYS) throw ApiException.badRequest("Gói dài tối đa " + MAX_DAYS + " ngày (3 năm)");
        if (newStart.isBefore(today.minusYears(1))) throw ApiException.badRequest("Ngày bắt đầu không lùi quá 1 năm");
        if (reason == null || reason.isBlank() || reason.trim().length() < 5) throw ApiException.badRequest("Lý do từ 5 đến 255 ký tự");

        LocalDate oldStart = s.getStartDate(), oldEnd = s.getEndDate(), oldPt = s.getPtValidUntil();
        LocalDate newPt = ptValidUntil;
        if (newPt == null && oldPt != null) {
            long shift = ChronoUnit.DAYS.between(oldStart, newStart);
            long extra = ChronoUnit.DAYS.between(oldEnd, newEnd) - shift;
            newPt = oldPt.plusDays(shift + Math.max(0, extra));
        }
        if (newPt != null) {
            if (newPt.isBefore(newStart)) {
                if (ptValidUntil != null) throw ApiException.badRequest("Hạn dùng buổi PT phải từ ngày bắt đầu gói trở đi");
                newPt = newStart;
            }
            if (newPt.isAfter(newEnd.plusDays(1))) {
                if (ptValidUntil != null) throw ApiException.badRequest("Hạn dùng buổi PT không quá ngày kết thúc gói");
                newPt = newEnd.plusDays(1);
            }
        }
        if (oldStart.equals(newStart) && oldEnd.equals(newEnd) && Objects.equals(oldPt, newPt)) {
            throw ApiException.badRequest("Thời gian mới giống hệt hiện tại");
        }
        MemberSubscription other = clash(s, newStart, newEnd);
        if (other != null) {
            throw ApiException.conflict("Thời gian mới trùng gói " + planName(other) + " (" + range(other) + ") của hội viên. Sửa gói đó trước.");
        }
        for (PtSessionUsage u : ptSessionUsageRepository.findBySubscriptionIdWithDetails(s.getId())) {
            LocalDate day = u.getSchedule() != null ? u.getSchedule().getStartTime().toLocalDate() : u.getUsedAt().toLocalDate();
            if (day.isBefore(newStart) || day.isAfter(newEnd)) {
                throw ApiException.conflict("Gói đã trừ buổi PT ngày " + day.format(D) + ", thời gian mới phải bao gồm ngày đó");
            }
        }

        SubscriptionAdjustment a = new SubscriptionAdjustment();
        a.setSubscription(s);
        a.setSource(source);
        a.setChangeRequest(cr);
        a.setOldStartDate(oldStart);
        a.setOldEndDate(oldEnd);
        a.setNewStartDate(newStart);
        a.setNewEndDate(newEnd);
        a.setOldPtValidUntil(oldPt);
        a.setNewPtValidUntil(newPt);
        a.setReason(cut(reason.trim()));
        a.setCreatedBy(actor == null ? null : userRepository.getReferenceById(actor.id()));
        adjustmentRepository.save(a);

        s.setStartDate(newStart);
        s.setEndDate(newEnd);
        s.setPtValidUntil(newPt);
        s.setNote(cut(SubscriptionUpgradeService.appendNote(s.getNote(), "Đổi thời gian " + newStart.format(D) + " – " + newEnd.format(D))));
        // Quà tặng kèm gói không dùng quá ngày hết gói mới.
        for (MemberServiceEntitlement e : entitlementRepository.findBySubscriptionIdAndSource(s.getId(), EntitlementSource.PLAN)) {
            if (e.getStatus() == EntitlementStatus.ACTIVE && e.getValidUntil().isAfter(newEnd)) {
                e.setValidUntil(e.getValidFrom().isAfter(newEnd) ? e.getValidFrom() : newEnd);
            }
        }
        subscriptionRepository.saveAndFlush(s);

        int cancelled = checkSessions ? cancelUncovered(s.getMember(), notes) : 0;
        auditService.log("SUBSCRIPTION_ADJUST", "SUBSCRIPTION", s.getId(), s.getMember().getCode() + " · " + planName(s) + " · "
                + oldStart + "→" + oldEnd + " thành " + newStart + "→" + newEnd
                + (Objects.equals(oldPt, newPt) ? "" : " · hạn PT " + newPt) + " · " + source
                + (cancelled > 0 ? " · huỷ " + cancelled + " buổi" : "") + " · " + reason.trim());
        return cancelled;
    }

    /** Buổi đã xếp sắp tới không còn gói hiệu lực (hoặc buổi có HLV mà không còn gói PT) → huỷ để lịch không sai. */
    private int cancelUncovered(Member m, List<String> notes) {
        int n = 0;
        for (WorkoutSchedule ws : scheduleRepository.findUpcoming(m.getId(), LocalDateTime.now(clock), ScheduleStatus.SCHEDULED)) {
            LocalDate day = ws.getStartTime().toLocalDate();
            boolean covered = !subscriptionRepository.findEffective(m.getId(), day).isEmpty();
            boolean ptOk = ws.getTrainer() == null || subscriptionRepository.hasEffectivePtSubscription(m.getId(), day);
            if (!covered || !ptOk) {
                ws.setStatus(ScheduleStatus.CANCELLED);
                notes.add("Huỷ buổi " + ws.getStartTime().format(DT) + " (" + ws.getTitle() + "): "
                        + (!covered ? "ngày này không còn gói hiệu lực" : "ngày này không còn gói PT"));
                n++;
            }
        }
        return n;
    }

    private int pausedDays(Long subscriptionId) {
        return changeRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> r.getSubscription().getId().equals(subscriptionId) && r.getChangeType() == ChangeRequestType.PAUSE
                        && r.getStatus() == PackageRequestStatus.APPROVED && r.getPauseDays() != null)
                .mapToInt(SubscriptionChangeRequest::getPauseDays).sum();
    }

    private MemberSubscription clash(MemberSubscription s, LocalDate start, LocalDate end) {
        Long memberId = s.getMember().getId();
        if (!subscriptionRepository.existsOverlapExcluding(memberId, start, end, List.of(s.getId()))) return null;
        return subscriptionRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
                .filter(o -> !o.isCancelled() && !o.getId().equals(s.getId())
                        && !o.getStartDate().isAfter(end) && !o.getEndDate().isBefore(start))
                .findFirst().orElse(null);
    }

    private MemberSubscription load(Long id) {
        return subscriptionRepository.findById(id).orElseThrow(() -> ApiException.notFound("gói tập"));
    }

    private static String planName(MemberSubscription s) {
        return SubscriptionUpgradeService.planName(s);
    }

    private static String range(MemberSubscription s) {
        return s.getStartDate().format(D) + " – " + s.getEndDate().format(D);
    }

    private static String cut(String s) {
        return SubscriptionUpgradeService.cut(s, 255);
    }

    private static String describe(SubscriptionChangeRequest r) {
        return switch (r.getChangeType()) {
            case CHANGE_START -> "dời ngày bắt đầu " + r.getOldStartDate() + " → " + r.getNewStartDate();
            case PAUSE -> "bảo lưu " + r.getPauseDays() + " ngày";
            case CHANGE_TRAINER -> "đổi HLV → " + (r.getTrainer() == null ? "—" : r.getTrainer().getUser().getFullName());
        };
    }

    // ---------------- Mapping ----------------

    ChangeRequestResponse toResponse(SubscriptionChangeRequest r) {
        Member m = r.getMember();
        LocalDate ns = r.getOldStartDate(), ne = r.getOldEndDate();
        if (r.getChangeType() == ChangeRequestType.CHANGE_START && r.getNewStartDate() != null) {
            ns = r.getNewStartDate();
            ne = ns.plusDays(ChronoUnit.DAYS.between(r.getOldStartDate(), r.getOldEndDate()));
        } else if (r.getChangeType() == ChangeRequestType.PAUSE && r.getPauseDays() != null) {
            ne = r.getOldEndDate().plusDays(r.getPauseDays());
        }
        Trainer t = r.getTrainer();
        Trainer cur = m.getTrainer();
        return new ChangeRequestResponse(r.getId(), m.getId(), m.getUser().getFullName(), m.getCode(), m.getUser().getPhone(),
                r.getSubscription().getId(), planName(r.getSubscription()),
                r.getSubscription().getPlan().getNameEn(), r.getChangeType(),
                r.getOldStartDate(), r.getOldEndDate(), ns, ne, r.getPauseDays(),
                t == null ? null : t.getId(), t == null ? null : t.getUser().getFullName(),
                cur == null ? null : cur.getUser().getFullName(),
                r.getReason(), r.getStatus(), r.getDecisionNote(),
                r.getDecidedBy() == null ? null : r.getDecidedBy().getFullName(), r.getDecidedAt(), r.getCreatedAt());
    }

    private AdjustmentResponse toAdjustment(SubscriptionAdjustment a) {
        return new AdjustmentResponse(a.getId(), a.getSubscription().getId(), a.getSource(),
                a.getOldStartDate(), a.getOldEndDate(), a.getNewStartDate(), a.getNewEndDate(),
                a.getOldPtValidUntil(), a.getNewPtValidUntil(), a.getReason(),
                a.getCreatedBy() == null ? "Hệ thống" : a.getCreatedBy().getFullName(), a.getCreatedAt());
    }
}
