package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.WorkoutPlanHistoryRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WorkoutPlanService {

    private final WorkoutPlanRepository planRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final ExerciseService exerciseService;
    private final AccessService access;
    private final AuditService auditService;
    private final Mappers mappers;
    private final WorkoutPlanHistoryRepository historyRepository;
    private final Clock clock;

    @Autowired
    public WorkoutPlanService(WorkoutPlanRepository planRepository, WorkoutScheduleRepository scheduleRepository,
                              ExerciseService exerciseService, AccessService access, AuditService auditService,
                              Mappers mappers, WorkoutPlanHistoryRepository historyRepository, Clock clock) {
        this.planRepository = planRepository;
        this.scheduleRepository = scheduleRepository;
        this.exerciseService = exerciseService;
        this.access = access;
        this.auditService = auditService;
        this.mappers = mappers;
        this.historyRepository = historyRepository;
        this.clock = clock;
    }

    public WorkoutPlanService(WorkoutPlanRepository planRepository, WorkoutScheduleRepository scheduleRepository,
                              ExerciseService exerciseService, AccessService access, AuditService auditService,
                              Mappers mappers) {
        this(planRepository, scheduleRepository, exerciseService, access, auditService, mappers, null, Clock.systemDefaultZone());
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanSummary> list(AuthUser user, Long memberId) {
        List<WorkoutPlan> plans;
        if (memberId != null) {
            access.requireView(user, memberId);
            plans = planRepository.findByMemberIdOrderByStartDateDesc(memberId);
        } else if (user.isAdmin()) {
            plans = planRepository.findAllByOrderByCreatedAtDesc();
        } else if (user.isTrainer()) {
            plans = planRepository.findByMemberTrainerIdOrderByCreatedAtDesc(access.requireTrainerOf(user).getId());
        } else {
            plans = planRepository.findByMemberIdOrderByStartDateDesc(access.requireMemberOf(user).getId());
        }
        return plans.stream().map(mappers::planSummary).toList();
    }

    @Transactional(readOnly = true)
    public WorkoutPlanResponse get(AuthUser user, Long id) {
        WorkoutPlan p = load(id);
        if (!access.canView(user, p.getMember())) throw ApiException.forbidden();
        return mappers.planDetail(p);
    }

    @Transactional(readOnly = true)
    public WorkoutPlanResponse current(AuthUser user) {
        Member m = access.requireMemberOf(user);
        return planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(m.getId(), PlanStatus.ACTIVE)
                .map(mappers::planDetail).orElse(null);
    }

    /** HLV / quản lý soạn cho hội viên; hội viên chưa có HLV (gói không kèm HLV) tự soạn cho mình, trainer = null. */
    @Transactional
    public WorkoutPlanResponse create(AuthUser user, WorkoutPlanRequest req) {
        Member m = user.isMember() ? access.requireSelfCoach(user, req.memberId()) : access.requireCoach(user, req.memberId());
        validate(req);
        WorkoutPlan p = new WorkoutPlan();
        p.setMember(m);
        p.setTrainer(user.isTrainer() ? access.requireTrainerOf(user) : m.getTrainer());
        p.setStatus(PlanStatus.ACTIVE);
        apply(p, req);
        planRepository.save(p);
        archiveOtherActive(p);
        auditService.log("WORKOUT_PLAN_CREATE", "WORKOUT_PLAN", p.getId(), m.getCode() + " · " + p.getName()
                + (user.isMember() ? " · hội viên tự soạn" : ""));
        return mappers.planDetail(p);
    }

    @Transactional
    public WorkoutPlanResponse update(AuthUser user, Long id, WorkoutPlanRequest req) {
        WorkoutPlan p = load(id);
        requireEdit(user, p);
        if (!p.getMember().getId().equals(req.memberId())) throw ApiException.badRequest("Không thể chuyển giáo án sang hội viên khác");
        validate(req);
        apply(p, req);
        planRepository.saveAndFlush(p);
        auditService.log("WORKOUT_PLAN_UPDATE", "WORKOUT_PLAN", p.getId(), p.getName());
        return mappers.planDetail(p);
    }

    @Transactional
    public WorkoutPlanSummary setStatus(AuthUser user, Long id, PlanStatus status) {
        WorkoutPlan p = load(id);
        requireEdit(user, p);
        p.setStatus(status);
        if (status == PlanStatus.ACTIVE) archiveOtherActive(p);
        auditService.log("WORKOUT_PLAN_STATUS", "WORKOUT_PLAN", p.getId(), p.getName() + " → " + status);
        return mappers.planSummary(p);
    }

    @Transactional
    public void delete(AuthUser user, Long id) {
        WorkoutPlan p = load(id);
        requireEdit(user, p);
        // Buổi tập đã gắn giáo án vẫn giữ lại, chỉ bỏ liên kết.
        scheduleRepository.findByPlanId(id).forEach(s -> s.setPlan(null));
        planRepository.delete(p);
        auditService.log("WORKOUT_PLAN_DELETE", "WORKOUT_PLAN", id, p.getName());
    }

    /**
     * Đổi sang giáo án khác:
     * - Lưu lại lịch sử gồm: giáo án cũ, giáo án mới, thời điểm bắt đầu và kết thúc áp dụng.
     * - Tại một thời điểm, mỗi người dùng chỉ có tối đa MỘT giáo án đang áp dụng (ACTIVE). Giáo án cũ chuyển sang kết thúc (ARCHIVED).
     * - Các buổi tập trong tương lai của giáo án cũ bị huỷ (CANCELLED), còn các buổi đã tập trong quá khứ giữ nguyên.
     */
    @Transactional
    public WorkoutPlanResponse switchPlan(AuthUser user, SwitchPlanRequest req) {
        Member m = access.requireMemberOf(user);
        WorkoutPlan newPlan = load(req.newPlanId());
        if (!access.canView(user, newPlan.getMember())) throw ApiException.forbidden();

        LocalDateTime now = LocalDateTime.now(clock);
        Optional<WorkoutPlan> activeOpt = planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(m.getId(), PlanStatus.ACTIVE);

        WorkoutPlan oldPlan = null;
        String oldPlanName = null;
        String oldPlanNameEn = null;
        int cancelledFutureCount = 0;

        if (activeOpt.isPresent()) {
            oldPlan = activeOpt.get();
            oldPlanName = oldPlan.getName();
            oldPlanNameEn = oldPlan.getNameEn();
            if (!oldPlan.getId().equals(newPlan.getId())) {
                oldPlan.setStatus(PlanStatus.ARCHIVED);
                planRepository.save(oldPlan);

                // Huỷ các buổi tập trong tương lai của giáo án cũ, giữ nguyên buổi trong quá khứ / đã hoàn thành
                List<WorkoutSchedule> oldSchedules = scheduleRepository.findByPlanId(oldPlan.getId());
                for (WorkoutSchedule s : oldSchedules) {
                    if (s.getStatus() == ScheduleStatus.SCHEDULED && s.getStartTime().isAfter(now)) {
                        s.setStatus(ScheduleStatus.CANCELLED);
                        cancelledFutureCount++;
                    }
                }
            }
        }

        archiveOtherActive(newPlan);
        newPlan.setStatus(PlanStatus.ACTIVE);
        planRepository.save(newPlan);

        if (historyRepository != null) {
            WorkoutPlanHistory history = new WorkoutPlanHistory();
            history.setMember(m);
            history.setOldPlan(oldPlan);
            history.setOldPlanName(oldPlanName);
            history.setOldPlanNameEn(oldPlanNameEn);
            history.setNewPlan(newPlan);
            history.setNewPlanName(newPlan.getName());
            history.setNewPlanNameEn(newPlan.getNameEn());
            history.setAppliedAt(now);
            history.setEndedAt(now);
            history.setCancelledFutureSessions(cancelledFutureCount);
            history.setNote(req.note());
            history.setNoteEn(req.noteEn());
            historyRepository.save(history);
        }

        auditService.log("WORKOUT_PLAN_SWITCH", "WORKOUT_PLAN", newPlan.getId(),
                (oldPlanName != null ? oldPlanName + " → " : "") + newPlan.getName()
                        + " · huỷ " + cancelledFutureCount + " buổi tương lai");

        return mappers.planDetail(newPlan);
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanHistoryResponse> history(AuthUser user, Long memberId) {
        Long targetMemberId;
        if (memberId != null) {
            access.requireView(user, memberId);
            targetMemberId = memberId;
        } else {
            targetMemberId = access.requireMemberOf(user).getId();
        }
        if (historyRepository == null) return List.of();
        return historyRepository.findByMemberIdOrderByAppliedAtDesc(targetMemberId).stream()
                .map(mappers::planHistory).toList();
    }

    /** Admin / HLV phụ trách sửa được mọi giáo án của hội viên; hội viên tự tập chỉ sửa giáo án do chính mình soạn (không có HLV). */
    private void requireEdit(AuthUser user, WorkoutPlan p) {
        if (access.canCoach(user, p.getMember())) return;
        if (p.getTrainer() == null && access.canSelfCoach(user, p.getMember())) return;
        throw ApiException.forbidden();
    }

    /** Mỗi hội viên chỉ có một giáo án đang áp dụng; giáo án cũ chuyển sang lưu trữ. */
    private void archiveOtherActive(WorkoutPlan current) {
        planRepository.findByMemberIdOrderByStartDateDesc(current.getMember().getId()).stream()
                .filter(o -> !o.getId().equals(current.getId()) && o.getStatus() == PlanStatus.ACTIVE)
                .forEach(o -> o.setStatus(PlanStatus.ARCHIVED));
    }

    private void validate(WorkoutPlanRequest req) {
        if (req.endDate().isBefore(req.startDate())) throw ApiException.badRequest("Ngày kết thúc phải sau ngày bắt đầu");
        if (req.startDate().plusYears(1).isBefore(req.endDate())) throw ApiException.badRequest("Giáo án dài tối đa 1 năm");
        if (req.items().isEmpty()) throw ApiException.badRequest("Giáo án cần ít nhất một bài tập");
        for (PlanItemRequest r : req.items()) {
            String reps = r.reps().replace(" ", "").replaceAll("[sS]$", "");
            if (!reps.matches("\\d{1,3}(-\\d{1,3})?")) continue;
            String[] range = reps.split("-");
            if (Integer.parseInt(range[0]) == 0) throw ApiException.badRequest("Số lần phải lớn hơn 0");
            if (range.length == 2 && Integer.parseInt(range[0]) > Integer.parseInt(range[1])) {
                throw ApiException.badRequest("Số lần \"" + r.reps().trim() + "\": số đầu phải nhỏ hơn số sau, VD 8-12");
            }
        }
    }

    private void apply(WorkoutPlan p, WorkoutPlanRequest req) {
        // Bài đã có trong giáo án được giữ dù sau đó bị ẩn hoặc trả về chỉnh sửa; bài thêm mới phải đã duyệt và đang hiện.
        Set<Long> existing = p.getItems().stream().map(i -> i.getExercise().getId()).collect(Collectors.toSet());
        p.setName(req.name().trim());
        p.setNameEn(Mappers.blankToNull(req.nameEn()));
        p.setGoal(Mappers.blankToNull(req.goal()));
        p.setGoalEn(Mappers.blankToNull(req.goalEn()));
        p.setStartDate(req.startDate());
        p.setEndDate(req.endDate());
        p.setNote(Mappers.blankToNull(req.note()));
        p.setNoteEn(Mappers.blankToNull(req.noteEn()));
        p.getItems().clear();
        int order = 0;
        for (PlanItemRequest r : req.items()) {
            Exercise ex = exerciseService.load(r.exerciseId());
            if (!existing.contains(ex.getId()) && (ex.getReviewStatus() != ReviewStatus.APPROVED || ex.isHidden())) {
                throw ApiException.badRequest("Bài \"" + ex.getName() + "\" chưa được quản lý duyệt hoặc đang ẩn, chưa thêm được vào giáo án");
            }
            WorkoutPlanItem i = new WorkoutPlanItem();
            i.setPlan(p);
            i.setExercise(ex);
            i.setDayOfWeek(r.dayOfWeek());
            i.setSortOrder(r.sortOrder() == null ? order : r.sortOrder());
            i.setSets(r.sets());
            i.setReps(r.reps().trim());
            i.setWeightKg(r.weightKg());
            i.setRestSeconds(r.restSeconds());
            i.setDurationMinutes(r.durationMinutes());
            i.setNote(Mappers.blankToNull(r.note()));
            i.setNoteEn(Mappers.blankToNull(r.noteEn()));
            p.getItems().add(i);
            order++;
        }
    }

    WorkoutPlan load(Long id) {
        return planRepository.findById(id).orElseThrow(() -> ApiException.notFound("giáo án"));
    }
}
