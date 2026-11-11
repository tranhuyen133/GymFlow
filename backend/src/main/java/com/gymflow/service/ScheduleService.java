package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.GymHours;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.PtSessionUsageRepository;
import com.gymflow.repository.TrainerRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.repository.WorkoutLogRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM HH:mm");
    private static final int MIN_MINUTES = 15;
    private static final int MAX_MINUTES = 240;
    /** Hội viên được ghi nhận hoàn thành muộn tối đa 7 ngày (kể cả khi buổi đã bị tự đánh "Vắng"). */
    private static final int LATE_COMPLETE_DAYS = 7;

    private final WorkoutScheduleRepository scheduleRepository;
    private final WorkoutLogRepository logRepository;
    private final WorkoutPlanRepository planRepository;
    private final TrainerRepository trainerRepository;
    private final SubscriptionService subscriptionService;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;
    private final Clock clock;
    private final UserRepository userRepository;
    private final PtSessionUsageRepository ptSessionUsageRepository;
    private final MemberSubscriptionRepository subscriptionRepository;

    @Transactional(readOnly = true)
    public List<ScheduleResponse> list(AuthUser user, LocalDateTime from, LocalDateTime to, Long memberId, Long trainerId) {
        if (from == null || to == null || !to.isAfter(from)) throw ApiException.badRequest("Khoảng thời gian không hợp lệ");
        if (Duration.between(from, to).toDays() > 93) throw ApiException.badRequest("Chỉ xem tối đa 3 tháng mỗi lần");
        Long scopeMember = memberId;
        Long scopeTrainer = trainerId;
        if (user.isMember()) {
            scopeMember = access.requireMemberOf(user).getId();
            scopeTrainer = null;
        } else if (user.isTrainer()) {
            Long myId = access.requireTrainerOf(user).getId();
            if (memberId != null) {
                access.requireView(user, memberId);
            } else {
                scopeTrainer = myId;
            }
        }
        return mappers.schedules(scheduleRepository.findInRange(from, to, scopeMember, scopeTrainer));
    }

    /**
     * Tạo buổi tập, có thể lặp hằng tuần. Buổi đầu tiên phải hợp lệ; các tuần sau nếu trùng giờ
     * hoặc hết gói thì bỏ qua và báo lại trong {@code skipped} thay vì huỷ cả loạt.
     */
    @Transactional
    public ScheduleCreatedResponse create(AuthUser user, ScheduleRequest req) {
        Member member = user.isMember() ? access.requireSelfCoach(user, req.memberId()) : access.requireCoach(user, req.memberId());
        if (member.getStatus() != MemberStatus.ACTIVE) throw ApiException.badRequest("Hội viên không ở trạng thái hoạt động");
        Trainer trainer = resolveTrainer(user, member, req.trainerId());
        WorkoutPlan plan = resolvePlan(member, req.planId());
        validateTime(req.startTime(), req.endTime(), true);

        lockForConflictCheck(member, trainer);
        int repeat = req.repeatWeeks() == null ? 0 : req.repeatWeeks();
        List<WorkoutSchedule> created = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        for (int w = 0; w <= repeat; w++) {
            LocalDateTime start = req.startTime().plusWeeks(w);
            LocalDateTime end = req.endTime().plusWeeks(w);
            String problem = conflict(member, trainer, start, end, null);
            if (problem != null) {
                if (w == 0) throw ApiException.conflict(problem);
                skipped.add(start.format(FMT) + ": " + problem);
                continue;
            }
            String sameDayProblem = checkSameDayDuplicate(member, start, null, req.confirmDuplicateDay());
            if (sameDayProblem != null) {
                if (w == 0) throw ApiException.badRequest(sameDayProblem);
                skipped.add(start.format(FMT) + ": " + sameDayProblem);
                continue;
            }
            WorkoutSchedule s = new WorkoutSchedule();
            s.setMember(member);
            s.setTrainer(trainer);
            s.setPlan(plan);
            s.setTitle(req.title().trim());
            s.setStartTime(start);
            s.setEndTime(end);
            s.setNote(Mappers.blankToNull(req.note()));
            s.setStatus(ScheduleStatus.SCHEDULED);
            created.add(scheduleRepository.saveAndFlush(s));
        }
        auditService.log("SCHEDULE_CREATE", "SCHEDULE", created.get(0).getId(),
                member.getCode() + " · " + created.size() + " buổi từ " + req.startTime().format(FMT)
                        + (skipped.isEmpty() ? "" : " · bỏ qua " + skipped.size()));
        return new ScheduleCreatedResponse(mappers.schedules(created), skipped);
    }

    @Transactional
    public ScheduleResponse update(AuthUser user, Long id, ScheduleUpdateRequest req) {
        WorkoutSchedule s = load(id);
        requireManage(user, s);
        if (s.getStatus() != ScheduleStatus.SCHEDULED) throw ApiException.badRequest("Chỉ dời được buổi đang ở trạng thái \"Đã lên lịch\"");
        Trainer trainer = resolveTrainer(user, s.getMember(), req.trainerId());
        validateTime(req.startTime(), req.endTime(), !req.startTime().equals(s.getStartTime()));
        lockForConflictCheck(s.getMember(), trainer);
        String problem = conflict(s.getMember(), trainer, req.startTime(), req.endTime(), s.getId());
        if (problem != null) throw ApiException.conflict(problem);
        String sameDayProblem = checkSameDayDuplicate(s.getMember(), req.startTime(), s.getId(), req.confirmDuplicateDay());
        if (sameDayProblem != null) throw ApiException.badRequest(sameDayProblem);
        String before = s.getStartTime().format(FMT);
        s.setTrainer(trainer);
        s.setPlan(resolvePlan(s.getMember(), req.planId()));
        s.setTitle(req.title().trim());
        s.setStartTime(req.startTime());
        s.setEndTime(req.endTime());
        s.setNote(Mappers.blankToNull(req.note()));
        scheduleRepository.saveAndFlush(s);
        auditService.log("SCHEDULE_UPDATE", "SCHEDULE", s.getId(), before + " → " + s.getStartTime().format(FMT));
        return mappers.schedule(s);
    }

    @Transactional
    public ScheduleResponse cancel(AuthUser user, Long id) {
        WorkoutSchedule s = load(id);
        requireManage(user, s);
        if (s.getStatus() != ScheduleStatus.SCHEDULED) throw ApiException.badRequest("Chỉ huỷ được buổi chưa diễn ra");
        s.setStatus(ScheduleStatus.CANCELLED);
        auditService.log("SCHEDULE_CANCEL", "SCHEDULE", s.getId(), s.getMember().getCode() + " · " + s.getStartTime().format(FMT));
        return mappers.schedule(s);
    }

    @Transactional
    public ScheduleResponse markMissed(AuthUser user, Long id) {
        WorkoutSchedule s = load(id);
        if (!access.canCoach(user, s.getMember())) throw ApiException.forbidden();
        if (s.getStatus() != ScheduleStatus.SCHEDULED) throw ApiException.badRequest("Buổi này không còn ở trạng thái \"Đã lên lịch\"");
        if (s.getStartTime().isAfter(LocalDateTime.now(clock))) throw ApiException.badRequest("Buổi tập chưa bắt đầu");
        s.setStatus(ScheduleStatus.MISSED);
        auditService.log("SCHEDULE_MISSED", "SCHEDULE", s.getId(), s.getMember().getCode());
        return mappers.schedule(s);
    }

    /** Hội viên của buổi, HLV phụ trách hoặc quản lý ghi nhận hoàn thành. */
    @Transactional
    public ScheduleResponse complete(AuthUser user, Long id, CompleteRequest req) {
        WorkoutSchedule s = load(id);
        if (!access.canView(user, s.getMember())) throw ApiException.forbidden();
        LocalDateTime now = LocalDateTime.now(clock);
        if (s.getStatus() == ScheduleStatus.CANCELLED) throw ApiException.badRequest("Buổi tập đã bị huỷ");
        if (s.getStatus() == ScheduleStatus.COMPLETED) throw ApiException.conflict("Buổi tập này đã được ghi nhận hoàn thành");
        if (s.getStartTime().isAfter(now)) throw ApiException.badRequest("Chưa đến giờ tập, không thể đánh dấu hoàn thành");
        if (s.getEndTime().plusDays(LATE_COMPLETE_DAYS).isBefore(now)) {
            throw ApiException.badRequest("Đã quá " + LATE_COMPLETE_DAYS + " ngày, không thể ghi nhận buổi này");
        }
        WorkoutLog log = new WorkoutLog();
        log.setSchedule(s);
        log.setMember(s.getMember());
        log.setCompletedAt(now);
        log.setDurationMinutes(req.durationMinutes() != null ? req.durationMinutes()
                : (int) Duration.between(s.getStartTime(), s.getEndTime()).toMinutes());
        log.setCalories(req.calories());
        log.setRating(req.rating());
        log.setNote(Mappers.blankToNull(req.note()));
        logRepository.save(log);

        // Nếu buổi tập có HLV (buổi PT): trừ 1 buổi PT trong cùng transaction
        if (s.getTrainer() != null) {
            LocalDate today = now.toLocalDate();
            List<MemberSubscription> ptSubs = subscriptionRepository.findEffectivePtSubscriptionsForUpdate(s.getMember().getId(), today);
            if (ptSubs.isEmpty()) {
                ptSubs = subscriptionRepository.findEffectivePtSubscriptionsForUpdate(s.getMember().getId(), s.getStartTime().toLocalDate());
            }
            if (ptSubs.isEmpty()) {
                throw ApiException.conflict("Hội viên không có gói tập kèm HLV (PT) còn hiệu lực");
            }
            MemberSubscription sub = ptSubs.get(0);
            if (sub.getPtValidUntil() != null && today.isAfter(sub.getPtValidUntil())) {
                throw ApiException.conflict("Buổi PT của gói đã hết hạn sử dụng (hạn đến " + sub.getPtValidUntil().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ")");
            }
            if (sub.getPtSessionsTotal() != null) {
                long used = ptSessionUsageRepository.countBySubscriptionId(sub.getId());
                if (used >= sub.getPtSessionsTotal()) {
                    throw ApiException.conflict("Hội viên đã sử dụng hết " + sub.getPtSessionsTotal() + " buổi PT của gói này");
                }
            }
            PtSessionUsage usage = new PtSessionUsage();
            usage.setSubscription(sub);
            usage.setSchedule(s);
            usage.setTrainer(s.getTrainer());
            usage.setUsedAt(now);
            usage.setCreatedBy(userRepository.getReferenceById(user.id()));
            ptSessionUsageRepository.save(usage);
        }

        s.setStatus(ScheduleStatus.COMPLETED);
        auditService.log("SCHEDULE_COMPLETE", "SCHEDULE", s.getId(), s.getMember().getCode());
        return mappers.schedule(s, log);
    }

    // FIX #1: Task 176 - note-only, không thay đổi logic tự đánh vắng khi buổi đã quá giờ kết thúc.
    /** 00:05 hằng ngày và khi khởi động: buổi đã qua giờ kết thúc mà chưa hoàn thành → "Vắng". */
    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Ho_Chi_Minh")
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void autoMarkMissed() {
        LocalDateTime cutoff = LocalDateTime.now(clock).toLocalDate().atStartOfDay();
        int n = scheduleRepository.markMissed(cutoff, ScheduleStatus.SCHEDULED, ScheduleStatus.MISSED);
        if (n > 0) {
            log.info("Tự đánh vắng {} buổi tập trước {}", n, cutoff);
            auditService.logAs(null, "system", "SCHEDULE_AUTO_MISSED", "SCHEDULE", null, n + " buổi", true);
        }
    }

    // ---------- helpers ----------
    private void validateTime(LocalDateTime start, LocalDateTime end, boolean mustBeFuture) {
        if (!end.isAfter(start)) throw ApiException.badRequest("Giờ kết thúc phải sau giờ bắt đầu");
        if (!start.toLocalDate().equals(end.toLocalDate())) throw ApiException.badRequest("Buổi tập phải bắt đầu và kết thúc trong cùng một ngày");
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes < MIN_MINUTES || minutes > MAX_MINUTES) {
            throw ApiException.badRequest("Buổi tập dài từ " + MIN_MINUTES + " đến " + MAX_MINUTES + " phút");
        }
        if (!GymHours.contains(start.toLocalTime(), end.toLocalTime())) {
            throw ApiException.badRequest("Phòng tập mở cửa " + GymHours.LABEL + ", buổi tập phải nằm trong giờ này");
        }
        if (mustBeFuture && start.isBefore(LocalDateTime.now(clock))) throw ApiException.badRequest("Không xếp lịch vào thời điểm đã qua");
    }

    // NOTE #1: Khóa đồng thời hội viên rồi HLV để chống trùng giờ khi nhiều request cùng lúc.
    /** Khoá hội viên rồi HLV (thứ tự cố định, tránh deadlock) để kiểm tra trùng giờ không bị yêu cầu đồng thời vượt qua. */
    private void lockForConflictCheck(Member member, Trainer trainer) {
        scheduleRepository.lockMember(member.getId());
        if (trainer != null) scheduleRepository.lockTrainer(trainer.getId());
    }

    /** Trả về lý do không xếp được, hoặc null nếu hợp lệ. */
    String conflict(Member member, Trainer trainer, LocalDateTime start, LocalDateTime end, Long excludeId) {
        if (!subscriptionService.hasEffective(member.getId(), start.toLocalDate())) {
            return "hội viên không có gói tập hiệu lực vào ngày " + start.toLocalDate();
        }
        if (trainer != null && !subscriptionRepository.hasEffectivePtSubscription(member.getId(), start.toLocalDate())) {
            return "hội viên chỉ có gói tự tập, không thể xếp lịch có huấn luyện viên (PT)";
        }
        if (trainer != null) {
            String quota = ptQuotaProblem(member, start.toLocalDate(), excludeId);
            if (quota != null) return quota;
        }
        if (scheduleRepository.memberBusy(member.getId(), start, end, excludeId, ScheduleStatus.CANCELLED)) {
            return "hội viên đã có buổi tập khác trùng giờ";
        }
        if (trainer != null && scheduleRepository.trainerBusy(trainer.getId(), start, end, excludeId, ScheduleStatus.CANCELLED)) {
            return "HLV " + trainer.getUser().getFullName() + " đã có buổi khác trùng giờ";
        }
        return null;
    }

    /**
     * V24 · không xếp quá số buổi PT của gói: buổi đã dùng + buổi PT đang chờ trong thời hạn gói phải nhỏ hơn tổng số buổi,
     * và không xếp buổi PT sau hạn dùng buổi. Gói chưa khai báo số buổi (null) thì không chặn.
     * Xếp lịch không trừ buổi; buổi chỉ bị trừ khi ghi nhận hoàn thành (complete).
     */
    String ptQuotaProblem(Member member, LocalDate day, Long excludeId) {
        MemberSubscription sub = subscriptionRepository.findEffective(member.getId(), day).stream()
                .filter(x -> x.getPtSessionsTotal() != null)
                .findFirst().orElse(null);
        if (sub == null) return null;
        if (sub.getPtValidUntil() != null && day.isAfter(sub.getPtValidUntil())) {
            return "buổi PT của gói chỉ dùng được đến " + sub.getPtValidUntil().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }
        long used = ptSessionUsageRepository.countBySubscriptionId(sub.getId());
        long booked = scheduleRepository.countPtBooked(member.getId(), sub.getStartDate().atStartOfDay(),
                sub.getEndDate().plusDays(1).atStartOfDay(), ScheduleStatus.SCHEDULED, excludeId);
        if (used + booked >= sub.getPtSessionsTotal()) {
            return "gói chỉ có " + sub.getPtSessionsTotal() + " buổi PT (đã dùng " + used + ", đã xếp " + booked + "), không xếp thêm được";
        }
        return null;
    }

    /** Dời / huỷ buổi: admin, HLV phụ trách, hoặc hội viên tự tập với buổi tự xếp (không có HLV). Đánh vắng vẫn chỉ nhân viên. */
    private void requireManage(AuthUser user, WorkoutSchedule s) {
        if (access.canCoach(user, s.getMember())) return;
        if (s.getTrainer() == null && access.canSelfCoach(user, s.getMember())) return;
        throw ApiException.forbidden();
    }

    private Trainer resolveTrainer(AuthUser user, Member member, Long trainerId) {
        // Hội viên tự xếp lịch: buổi tự tập, không gắn HLV (bỏ qua trainerId gửi lên).
        if (user.isMember()) return null;
        if (user.isTrainer()) return access.requireTrainerOf(user);
        if (trainerId == null) return member.getTrainer();
        Trainer t = trainerRepository.findById(trainerId).orElseThrow(() -> ApiException.notFound("huấn luyện viên"));
        if (!t.isActive()) throw ApiException.badRequest("Huấn luyện viên đang ngừng hoạt động");
        return t;
    }

    private WorkoutPlan resolvePlan(Member member, Long planId) {
        if (planId == null) return null;
        WorkoutPlan p = planRepository.findById(planId).orElseThrow(() -> ApiException.notFound("giáo án"));
        if (!p.getMember().getId().equals(member.getId())) throw ApiException.badRequest("Giáo án không thuộc hội viên này");
        return p;
    }

    private static final String[] DOW_NAMES = {"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"};

    /**
     * Tự sinh lịch tập theo các thứ trong tuần của giáo án mẫu.
     * Người dùng giữ nguyên cấu trúc thứ và bài tập của giáo án, chỉ được sửa giờ tập và dời buổi cụ thể.
     */
    @Transactional
    public ScheduleCreatedResponse generateFromPlan(AuthUser user, GenerateScheduleFromPlanRequest req) {
        Member member = user.isMember() ? access.requireSelfCoach(user, req.memberId()) : access.requireCoach(user, req.memberId());
        if (member.getStatus() != MemberStatus.ACTIVE) throw ApiException.badRequest("Hội viên không ở trạng thái hoạt động");
        WorkoutPlan plan = resolvePlan(member, req.planId());
        if (plan == null) throw ApiException.badRequest("Vui lòng chọn giáo án hợp lệ");
        if (plan.getItems().isEmpty()) throw ApiException.badRequest("Giáo án chưa có bài tập nào");

        Trainer trainer = resolveTrainer(user, member, req.trainerId());
        lockForConflictCheck(member, trainer);

        int weeks = req.weeks() == null ? 1 : req.weeks();
        int duration = req.durationMinutes() == null ? 60 : req.durationMinutes();
        LocalTime startTime = req.defaultStartTime();

        // Gom các bài tập của giáo án theo từng thứ trong tuần (1 = T2 ... 7 = CN)
        java.util.Map<Integer, List<WorkoutPlanItem>> itemsByDay = plan.getItems().stream()
                .collect(java.util.stream.Collectors.groupingBy(WorkoutPlanItem::getDayOfWeek));

        List<WorkoutSchedule> created = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        LocalDate startMonday = req.startDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        for (int w = 0; w < weeks; w++) {
            LocalDate weekMonday = startMonday.plusWeeks(w);
            for (int dow = 1; dow <= 7; dow++) {
                if (!itemsByDay.containsKey(dow)) continue;
                LocalDate sessionDate = weekMonday.plusDays(dow - 1L);
                if (sessionDate.isBefore(req.startDate())) continue;

                LocalDateTime start = sessionDate.atTime(startTime);
                LocalDateTime end = start.plusMinutes(duration);

                if (!GymHours.contains(start.toLocalTime(), end.toLocalTime())) {
                    skipped.add(start.format(FMT) + ": ngoài giờ mở cửa " + GymHours.LABEL);
                    continue;
                }
                if (start.isBefore(LocalDateTime.now(clock))) {
                    skipped.add(start.format(FMT) + ": thời điểm đã qua");
                    continue;
                }

                String problem = conflict(member, trainer, start, end, null);
                if (problem != null) {
                    skipped.add(start.format(FMT) + ": " + problem);
                    continue;
                }

                String sameDay = checkSameDayDuplicate(member, start, null, req.confirmDuplicateDay());
                if (sameDay != null) {
                    skipped.add(start.format(FMT) + ": " + sameDay);
                    continue;
                }

                List<WorkoutPlanItem> dayItems = itemsByDay.get(dow);
                String dayTitle = plan.getName() + " (" + DOW_NAMES[dow - 1] + ")";
                String notes = dayItems.stream()
                        .map(it -> it.getExercise().getName() + " (" + it.getSets() + " hiệp)")
                        .collect(java.util.stream.Collectors.joining(", "));
                if (notes.length() > 255) notes = notes.substring(0, 252) + "...";

                WorkoutSchedule s = new WorkoutSchedule();
                s.setMember(member);
                s.setTrainer(trainer);
                s.setPlan(plan);
                s.setTitle(dayTitle.length() > 120 ? dayTitle.substring(0, 120) : dayTitle);
                s.setStartTime(start);
                s.setEndTime(end);
                s.setNote(notes);
                s.setStatus(ScheduleStatus.SCHEDULED);
                created.add(scheduleRepository.saveAndFlush(s));
            }
        }

        if (created.isEmpty() && !skipped.isEmpty()) {
            throw ApiException.badRequest("Không thể sinh lịch tập: " + String.join("; ", skipped));
        }

        if (!created.isEmpty()) {
            auditService.log("SCHEDULE_GENERATE_PLAN", "SCHEDULE", created.get(0).getId(),
                    member.getCode() + " · sinh " + created.size() + " buổi từ giáo án " + plan.getName()
                            + (skipped.isEmpty() ? "" : " · bỏ qua " + skipped.size()));
        }
        return new ScheduleCreatedResponse(mappers.schedules(created), skipped);
    }

    /**
     * Cảnh báo trùng buổi tập trong cùng một ngày:
     * Nếu trong ngày đã có buổi tập khác (chưa huỷ) và chưa được người dùng xác nhận cho phép trùng ngày,
     * trả về thông báo cảnh báo để người dùng chọn "Vẫn thêm" hoặc "Hủy".
     */
    String checkSameDayDuplicate(Member member, LocalDateTime start, Long excludeId, Boolean confirmDuplicateDay) {
        if (Boolean.TRUE.equals(confirmDuplicateDay)) return null;
        LocalDate day = start.toLocalDate();
        LocalDateTime dayStart = day.atStartOfDay();
        LocalDateTime dayEnd = day.plusDays(1).atStartOfDay();
        List<WorkoutSchedule> onDay = scheduleRepository.findMemberSchedulesOnDay(member.getId(), dayStart, dayEnd, excludeId, ScheduleStatus.CANCELLED);
        if (!onDay.isEmpty()) {
            WorkoutSchedule first = onDay.get(0);
            String dateStr = start.format(DateTimeFormatter.ofPattern("dd/MM"));
            String timeStr = first.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"));
            return "Ngày " + dateStr + " bạn đã có buổi tập lúc " + timeStr + ". Bạn có chắc muốn thêm buổi thứ hai?";
        }
        return null;
    }

    private WorkoutSchedule load(Long id) {
        return scheduleRepository.findById(id).orElseThrow(() -> ApiException.notFound("buổi tập"));
    }
}
