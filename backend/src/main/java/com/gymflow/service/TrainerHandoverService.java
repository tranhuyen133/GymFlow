package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.repository.PtSessionUsageRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * V49 · Bàn giao hội viên cho HLV ngay khi gói có PT được duyệt (đăng ký mới, nâng cấp, đổi HLV):
 * - giáo án đang áp dụng do hội viên tự soạn được gắn HLV, HLV sửa tiếp được;
 * - buổi tự tập đã xếp trong thời hạn gói PT chuyển thành buổi có HLV nếu HLV rảnh giờ đó và gói còn buổi PT;
 *   buổi nào không chuyển được thì giữ là buổi tự tập (HLV vẫn thấy trong lịch vì đang phụ trách hội viên).
 * Không tự trừ buổi PT: buổi chỉ bị trừ khi ghi nhận hoàn thành, giống luồng xếp lịch thường.
 */
@Service
@RequiredArgsConstructor
public class TrainerHandoverService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM HH:mm");

    private final WorkoutScheduleRepository scheduleRepository;
    private final WorkoutPlanRepository planRepository;
    private final PtSessionUsageRepository ptSessionUsageRepository;
    private final AuditService auditService;
    private final Clock clock;

    /** attached = số buổi đã chuyển cho HLV; skipped = buổi giữ nguyên kèm lý do; planLinked = đã gắn giáo án. */
    public record Result(int attached, List<String> skipped, boolean planLinked) {
    }

    @Transactional
    public Result attach(MemberSubscription sub, Trainer trainer) {
        Member m = sub.getMember();
        boolean planLinked = false;
        WorkoutPlan active = planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(m.getId(), PlanStatus.ACTIVE).orElse(null);
        if (active != null && active.getTrainer() == null) {
            active.setTrainer(trainer);
            planLinked = true;
        }

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate lastDay = sub.getEndDate();
        if (sub.getPtValidUntil() != null && sub.getPtValidUntil().isBefore(lastDay)) lastDay = sub.getPtValidUntil();
        LocalDateTime from = sub.getStartDate().atStartOfDay().isAfter(now) ? sub.getStartDate().atStartOfDay() : now;
        LocalDateTime to = lastDay.plusDays(1).atStartOfDay();

        List<String> skipped = new ArrayList<>();
        int attached = 0;
        if (from.isBefore(to)) {
            // Khoá HLV để kiểm tra trùng giờ không bị yêu cầu xếp lịch đồng thời vượt qua (cùng thứ tự với ScheduleService).
            scheduleRepository.lockTrainer(trainer.getId());
            long remaining = Long.MAX_VALUE;
            if (sub.getPtSessionsTotal() != null) {
                long used = ptSessionUsageRepository.countBySubscriptionId(sub.getId());
                long booked = scheduleRepository.countPtBooked(m.getId(), sub.getStartDate().atStartOfDay(),
                        sub.getEndDate().plusDays(1).atStartOfDay(), ScheduleStatus.SCHEDULED, null);
                remaining = sub.getPtSessionsTotal() - used - booked;
            }
            for (WorkoutSchedule s : scheduleRepository.findUnassigned(m.getId(), from, to, ScheduleStatus.SCHEDULED)) {
                if (remaining <= 0) {
                    skipped.add(s.getStartTime().format(FMT) + ": gói đã xếp đủ " + sub.getPtSessionsTotal() + " buổi PT");
                    continue;
                }
                if (scheduleRepository.trainerBusy(trainer.getId(), s.getStartTime(), s.getEndTime(), s.getId(), ScheduleStatus.CANCELLED)) {
                    skipped.add(s.getStartTime().format(FMT) + ": HLV đã có buổi khác trùng giờ");
                    continue;
                }
                s.setTrainer(trainer);
                attached++;
                remaining--;
            }
        }
        if (attached > 0 || planLinked || !skipped.isEmpty()) {
            auditService.log("TRAINER_HANDOVER", "MEMBER", m.getId(), m.getCode() + " → " + trainer.getUser().getFullName()
                    + " · chuyển " + attached + " buổi" + (skipped.isEmpty() ? "" : " · giữ tự tập " + skipped.size())
                    + (planLinked ? " · gắn giáo án " + active.getName() : ""));
        }
        return new Result(attached, skipped, planLinked);
    }

    /** Đổi HLV: buổi sắp tới của HLV cũ chuyển sang HLV mới nếu HLV mới rảnh; trùng giờ thì giữ và báo lại để dời. */
    @Transactional
    public Result reassign(Member m, Trainer oldTrainer, Trainer newTrainer) {
        List<String> kept = new ArrayList<>();
        int moved = 0;
        if (oldTrainer != null) {
            scheduleRepository.lockTrainer(newTrainer.getId());
            LocalDateTime now = LocalDateTime.now(clock);
            for (WorkoutSchedule s : scheduleRepository.findUpcomingWithTrainer(m.getId(), oldTrainer.getId(), now, ScheduleStatus.SCHEDULED)) {
                if (scheduleRepository.trainerBusy(newTrainer.getId(), s.getStartTime(), s.getEndTime(), s.getId(), ScheduleStatus.CANCELLED)) {
                    kept.add(s.getStartTime().format(FMT) + ": HLV mới trùng giờ, cần dời buổi");
                    continue;
                }
                s.setTrainer(newTrainer);
                moved++;
            }
        }
        boolean planLinked = false;
        WorkoutPlan active = planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(m.getId(), PlanStatus.ACTIVE).orElse(null);
        if (active != null && (active.getTrainer() == null || oldTrainer != null && active.getTrainer().getId().equals(oldTrainer.getId()))) {
            active.setTrainer(newTrainer);
            planLinked = true;
        }
        auditService.log("TRAINER_REASSIGN", "MEMBER", m.getId(), m.getCode() + " · "
                + (oldTrainer == null ? "—" : oldTrainer.getUser().getFullName()) + " → " + newTrainer.getUser().getFullName()
                + " · chuyển " + moved + " buổi" + (kept.isEmpty() ? "" : " · cần dời " + kept.size()));
        return new Result(moved, kept, planLinked);
    }
}
