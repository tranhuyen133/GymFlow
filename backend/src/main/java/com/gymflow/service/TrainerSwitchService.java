package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.PackageRequestDtos.ChangeRequestResponse;
import com.gymflow.dto.PackageRequestDtos.CreateChangeRequest;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.SubscriptionChangeRequestRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Hội viên tự đổi HLV, không chờ quản lý: nếu HLV mới rảnh đúng giờ mọi buổi PT sắp tới thì đổi ngay
 * (buổi sắp tới + giáo án đang áp dụng chuyển sang HLV mới qua TrainerHandoverService.reassign).
 * Có buổi trùng giờ với lịch của HLV mới thì gửi yêu cầu để quản lý xếp lại như trước.
 * Mỗi lần đổi vẫn lưu một dòng yêu cầu điều chỉnh (đã duyệt) để hội viên và quản lý xem lại lịch sử.
 */
@Service
@RequiredArgsConstructor
public class TrainerSwitchService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM HH:mm");
    static final String INSTANT_NOTE = "Đổi ngay: HLV mới rảnh mọi buổi sắp tới";

    private final MemberSubscriptionRepository subscriptionRepository;
    private final SubscriptionChangeRequestRepository changeRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final TrainerRepository trainerRepository;
    private final TrainerHandoverService handoverService;
    private final SubscriptionAdjustmentService adjustmentService;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;
    private final Clock clock;

    public record SwitchPreview(Long trainerId, String trainerName, int moving, List<String> conflicts, boolean instant) {
    }

    public record SwitchRequest(Long subscriptionId, Long trainerId, String reason) {
    }

    public record SwitchResult(ChangeRequestResponse request, boolean instant, int moved, List<String> notes) {
    }

    @Transactional(readOnly = true)
    public SwitchPreview preview(AuthUser user, Long subscriptionId, Long trainerId) {
        Member m = access.requireMemberOf(user);
        MemberSubscription s = ptSubscription(m, subscriptionId);
        Trainer t = target(m, trainerId);
        if (changeRepository.existsBySubscriptionIdAndStatus(s.getId(), PackageRequestStatus.PENDING)) {
            throw ApiException.conflict("Gói này đang có một yêu cầu chờ quản lý duyệt. Huỷ yêu cầu đó nếu muốn đổi HLV.");
        }
        List<WorkoutSchedule> upcoming = upcoming(m);
        List<String> conflicts = conflicts(upcoming, t);
        return new SwitchPreview(t.getId(), t.getUser().getFullName(), upcoming.size() - conflicts.size(), conflicts, conflicts.isEmpty());
    }

    @Transactional
    public SwitchResult switchTrainer(AuthUser user, SwitchRequest req) {
        if (req == null || req.trainerId() == null) throw ApiException.badRequest("Chọn huấn luyện viên mới");
        Member m = access.requireMemberOf(user);
        if (m.getStatus() == MemberStatus.INACTIVE) throw ApiException.badRequest("Hồ sơ hội viên đang ngừng hoạt động, vui lòng liên hệ quầy lễ tân");
        subscriptionRepository.lockMember(m.getId());
        MemberSubscription s = ptSubscription(m, req.subscriptionId());
        Trainer t = target(m, req.trainerId());
        if (changeRepository.existsBySubscriptionIdAndStatus(s.getId(), PackageRequestStatus.PENDING)) {
            throw ApiException.conflict("Gói này đang có một yêu cầu chờ quản lý duyệt. Huỷ yêu cầu đó nếu muốn đổi HLV.");
        }
        String reason = req.reason() == null ? "" : req.reason().trim();
        if (reason.length() > 255) throw ApiException.badRequest("Lý do tối đa 255 ký tự");

        // Khoá HLV mới trước khi kiểm tra trùng giờ (cùng thứ tự với ScheduleService / TrainerHandoverService).
        scheduleRepository.lockTrainer(t.getId());
        List<String> conflicts = conflicts(upcoming(m), t);
        if (!conflicts.isEmpty()) {
            String why = reason.length() >= 5 ? reason : "Đổi sang HLV " + t.getUser().getFullName() + " – có buổi trùng giờ, nhờ quản lý xếp lại";
            ChangeRequestResponse pending = adjustmentService.create(user,
                    new CreateChangeRequest(s.getId(), ChangeRequestType.CHANGE_TRAINER, null, null, t.getId(), cut(why)));
            return new SwitchResult(pending, false, 0, conflicts);
        }

        Trainer old = m.getTrainer();
        LocalDateTime now = LocalDateTime.now(clock);
        SubscriptionChangeRequest r = new SubscriptionChangeRequest();
        r.setMember(m);
        r.setSubscription(s);
        r.setChangeType(ChangeRequestType.CHANGE_TRAINER);
        r.setOldStartDate(s.getStartDate());
        r.setOldEndDate(s.getEndDate());
        r.setTrainer(t);
        r.setReason(reason.length() >= 5 ? reason : "Hội viên tự đổi HLV");
        r.setStatus(PackageRequestStatus.APPROVED);
        r.setDecisionNote(INSTANT_NOTE);
        r.setDecidedAt(now);
        changeRepository.save(r);

        m.setTrainer(t);
        TrainerHandoverService.Result h = handoverService.reassign(m, old, t);
        List<String> notes = new ArrayList<>();
        notes.add(h.attached() == 0 ? "Chưa có buổi PT sắp tới cần chuyển" : "Đã chuyển " + h.attached() + " buổi sắp tới sang HLV " + t.getUser().getFullName());
        notes.addAll(h.skipped());
        if (h.planLinked()) notes.add("Giáo án đang áp dụng chuyển cho HLV mới");
        auditService.log("MEMBER_SWITCH_TRAINER", "MEMBER", m.getId(), m.getCode() + " · "
                + (old == null ? "—" : old.getUser().getFullName()) + " → " + t.getUser().getFullName() + " · tự đổi ngay · chuyển " + h.attached() + " buổi");
        return new SwitchResult(adjustmentService.toResponse(r), true, h.attached(), notes);
    }

    /** Gói PT còn dùng được (đang chạy hoặc sắp bắt đầu); subscriptionId để trống = gói gần nhất. */
    private MemberSubscription ptSubscription(Member m, Long subscriptionId) {
        LocalDate today = mappers.today();
        List<MemberSubscription> pts = subscriptionRepository.findByMemberIdOrderByStartDateDesc(m.getId()).stream()
                .filter(s -> !s.isCancelled() && !s.getEndDate().isBefore(today) && SubscriptionUpgradeService.isPtSub(s))
                .sorted(Comparator.comparing(MemberSubscription::getStartDate))
                .toList();
        if (subscriptionId != null) {
            return pts.stream().filter(s -> s.getId().equals(subscriptionId)).findFirst()
                    .orElseThrow(() -> ApiException.badRequest("Chỉ gói có huấn luyện viên (PT) còn hiệu lực mới đổi được HLV"));
        }
        if (pts.isEmpty()) throw ApiException.badRequest("Bạn chưa có gói kèm huấn luyện viên (PT) còn hiệu lực");
        return pts.get(0);
    }

    private Trainer target(Member m, Long trainerId) {
        if (trainerId == null) throw ApiException.badRequest("Chọn huấn luyện viên mới");
        Trainer t = trainerRepository.findById(trainerId).orElseThrow(() -> ApiException.notFound("huấn luyện viên"));
        if (!t.isActive()) throw ApiException.badRequest("Huấn luyện viên này đang ngừng nhận hội viên, vui lòng chọn HLV khác");
        if (m.getTrainer() != null && m.getTrainer().getId().equals(t.getId())) {
            throw ApiException.badRequest("Đây đã là huấn luyện viên đang phụ trách bạn");
        }
        return t;
    }

    private List<WorkoutSchedule> upcoming(Member m) {
        Trainer old = m.getTrainer();
        if (old == null) return List.of();
        return scheduleRepository.findUpcomingWithTrainer(m.getId(), old.getId(), LocalDateTime.now(clock), ScheduleStatus.SCHEDULED);
    }

    private List<String> conflicts(List<WorkoutSchedule> upcoming, Trainer t) {
        List<String> out = new ArrayList<>();
        for (WorkoutSchedule s : upcoming) {
            if (scheduleRepository.trainerBusy(t.getId(), s.getStartTime(), s.getEndTime(), s.getId(), ScheduleStatus.CANCELLED)) {
                out.add(s.getStartTime().format(FMT) + " (" + s.getTitle() + "): HLV mới đã có lịch giờ này");
            }
        }
        return out;
    }

    private static String cut(String s) {
        return s.length() <= 255 ? s : s.substring(0, 255);
    }
}
