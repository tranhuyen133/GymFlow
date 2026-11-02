/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền) · TASK: SCRUM-163
 * Kiểm thử dịch vụ giáo án: CRUD giáo án, phân bổ bài theo 7 ngày, kiểm tra quyền và lưu trữ giáo án cũ.
 */
package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkoutPlanServiceTest {

    @Mock WorkoutPlanRepository planRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock ExerciseService exerciseService;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    WorkoutPlanService service;

    static final AuthUser ADMIN = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
    static final AuthUser TRAINER = new AuthUser(2L, "trainer@gymflow.vn", Role.TRAINER, "HLV Nam");
    static final AuthUser MEMBER_USER = new AuthUser(3L, "member@gymflow.vn", Role.MEMBER, "Hội viên Linh");

    Member member;
    Trainer trainer;
    Exercise benchPress;
    Exercise squat;
    Exercise pullUp;

    @BeforeEach
    void setUp() {
        service = new WorkoutPlanService(planRepository, scheduleRepository, exerciseService, access, auditService, mappers);

        User memberAccount = new User();
        memberAccount.setId(30L);
        memberAccount.setFullName("Lê Thu Hà");

        member = new Member();
        member.setId(10L);
        member.setCode("HV00010");
        member.setUser(memberAccount);

        User trainerAccount = new User();
        trainerAccount.setId(20L);
        trainerAccount.setFullName("Trần Văn HLV");

        trainer = new Trainer();
        trainer.setId(5L);
        trainer.setUser(trainerAccount);
        trainer.setActive(true);
        member.setTrainer(trainer);

        benchPress = createExercise(1L, "Đẩy ngực tạ đòn", MuscleGroup.CHEST);
        squat = createExercise(2L, "Gánh đùi tạ đòn", MuscleGroup.LEGS);
        pullUp = createExercise(3L, "Hít xà đơn", MuscleGroup.BACK);

        lenient().when(planRepository.save(any(WorkoutPlan.class))).thenAnswer(inv -> {
            WorkoutPlan wp = inv.getArgument(0);
            if (wp.getId() == null) wp.setId(100L);
            return wp;
        });

        lenient().when(mappers.planDetail(any(WorkoutPlan.class))).thenAnswer(inv -> {
            WorkoutPlan wp = inv.getArgument(0);
            List<PlanItemResponse> items = wp.getItems().stream().map(i ->
                    new PlanItemResponse(i.getId(), i.getExercise().getId(), i.getExercise().getName(),
                            i.getExercise().getMuscleGroup(), i.getExercise().getEquipment(),
                            i.getDayOfWeek(), i.getSortOrder(), i.getSets(), i.getReps(),
                            i.getWeightKg(), i.getRestSeconds(), i.getDurationMinutes(), i.getNote())
            ).toList();
            WorkoutPlanSummary summary = new WorkoutPlanSummary(wp.getId(), wp.getMember().getId(),
                    wp.getMember().getUser().getFullName(),
                    wp.getTrainer() != null ? wp.getTrainer().getId() : null,
                    wp.getTrainer() != null ? wp.getTrainer().getUser().getFullName() : null,
                    wp.getName(), wp.getGoal(), wp.getStartDate(), wp.getEndDate(), wp.getStatus(),
                    wp.getItems().size(),
                    (int) wp.getItems().stream().map(WorkoutPlanItem::getDayOfWeek).distinct().count(),
                    wp.getCreatedAt());
            return new WorkoutPlanResponse(summary, wp.getNote(), items);
        });

        lenient().when(mappers.planSummary(any(WorkoutPlan.class))).thenAnswer(inv -> {
            WorkoutPlan wp = inv.getArgument(0);
            return new WorkoutPlanSummary(wp.getId(), wp.getMember().getId(),
                    wp.getMember().getUser().getFullName(),
                    wp.getTrainer() != null ? wp.getTrainer().getId() : null,
                    wp.getTrainer() != null ? wp.getTrainer().getUser().getFullName() : null,
                    wp.getName(), wp.getGoal(), wp.getStartDate(), wp.getEndDate(), wp.getStatus(),
                    wp.getItems().size(),
                    (int) wp.getItems().stream().map(WorkoutPlanItem::getDayOfWeek).distinct().count(),
                    wp.getCreatedAt());
        });
    }

    private Exercise createExercise(Long id, String name, MuscleGroup group) {
        Exercise e = new Exercise();
        e.setId(id);
        e.setName(name);
        e.setMuscleGroup(group);
        e.setLevel(Level.BEGINNER);
        e.setLocation(ExerciseLocation.GYM);
        e.setEquipment("Tạ đòn");
        return e;
    }

    // ==========================================
    // WP-01: Tạo giáo án
    // ==========================================

    @Test
    @DisplayName("WP-01: Tạo giáo án hợp lệ: status = ACTIVE, lưu đúng dayOfWeek, sortOrder tự tăng và ghi audit WORKOUT_PLAN_CREATE")
    void create_validRequest_createsActivePlan_withAutoSortOrder_andLogsAudit() {
        when(access.requireCoach(TRAINER, 10L)).thenReturn(member);
        when(access.requireTrainerOf(TRAINER)).thenReturn(trainer);
        when(exerciseService.load(1L)).thenReturn(benchPress);
        when(exerciseService.load(2L)).thenReturn(squat);
        when(planRepository.findByMemberIdOrderByStartDateDesc(10L)).thenReturn(Collections.emptyList());

        PlanItemRequest item1 = new PlanItemRequest(1L, 1, null, 4, "10-12", 50.0, 90, null, "Khởi động kỹ");
        PlanItemRequest item2 = new PlanItemRequest(2L, 1, null, 4, "8-10", 70.0, 120, null, null);
        WorkoutPlanRequest req = new WorkoutPlanRequest(
                10L, "Giáo án Tăng cơ", "Tăng 2kg",
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1),
                "Ghi chú", List.of(item1, item2)
        );

        WorkoutPlanResponse res = service.create(TRAINER, req);

        assertThat(res).isNotNull();
        assertThat(res.summary().status()).isEqualTo(PlanStatus.ACTIVE);
        assertThat(res.summary().name()).isEqualTo("Giáo án Tăng cơ");
        assertThat(res.items()).hasSize(2);

        // Kiểm tra sortOrder tự tăng (0, 1) khi request không gửi sortOrder
        assertThat(res.items().get(0).sortOrder()).isEqualTo(0);
        assertThat(res.items().get(0).dayOfWeek()).isEqualTo(1);
        assertThat(res.items().get(1).sortOrder()).isEqualTo(1);
        assertThat(res.items().get(1).dayOfWeek()).isEqualTo(1);

        verify(planRepository).save(any(WorkoutPlan.class));
        verify(auditService).log(eq("WORKOUT_PLAN_CREATE"), eq("WORKOUT_PLAN"), eq(100L), contains("HV00010 · Giáo án Tăng cơ"));
    }

    @Test
    @DisplayName("WP-01: Tạo giáo án mới: giáo án ACTIVE cũ chuyển sang ARCHIVED, giáo án đã ARCHIVED giữ nguyên")
    void create_newPlan_archivesPreviousActivePlans_andKeepsArchivedPlansUnchanged() {
        when(access.requireCoach(ADMIN, 10L)).thenReturn(member);
        when(exerciseService.load(1L)).thenReturn(benchPress);

        WorkoutPlan oldActivePlan = new WorkoutPlan();
        oldActivePlan.setId(50L);
        oldActivePlan.setMember(member);
        oldActivePlan.setStatus(PlanStatus.ACTIVE);

        WorkoutPlan alreadyArchivedPlan = new WorkoutPlan();
        alreadyArchivedPlan.setId(40L);
        alreadyArchivedPlan.setMember(member);
        alreadyArchivedPlan.setStatus(PlanStatus.ARCHIVED);

        when(planRepository.findByMemberIdOrderByStartDateDesc(10L))
                .thenReturn(List.of(oldActivePlan, alreadyArchivedPlan));

        PlanItemRequest item = new PlanItemRequest(1L, 1, 0, 3, "10", 40.0, 60, null, null);
        WorkoutPlanRequest req = new WorkoutPlanRequest(
                10L, "Giáo án Mới", null,
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1),
                null, List.of(item)
        );

        service.create(ADMIN, req);

        // Giáo án đang ACTIVE cũ chuyển sang ARCHIVED
        assertThat(oldActivePlan.getStatus()).isEqualTo(PlanStatus.ARCHIVED);
        // Giáo án đã ARCHIVED vẫn giữ nguyên ARCHIVED
        assertThat(alreadyArchivedPlan.getStatus()).isEqualTo(PlanStatus.ARCHIVED);
    }

    // ==========================================
    // WP-01: Kiểm tra dữ liệu (Validation -> 400 Bad Request)
    // ==========================================

    @Test
    @DisplayName("WP-01 Validate: endDate trước startDate ném 400 Bad Request")
    void create_endDateBeforeStartDate_throwsBadRequest400() {
        when(access.requireCoach(ADMIN, 10L)).thenReturn(member);

        WorkoutPlanRequest req = new WorkoutPlanRequest(
                10L, "Giáo án lỗi", null,
                LocalDate.of(2026, 12, 1), LocalDate.of(2026, 11, 1), // endDate trước startDate
                null, List.of(new PlanItemRequest(1L, 1, 0, 3, "10", null, null, null, null))
        );

        assertThatThrownBy(() -> service.create(ADMIN, req))
                .isInstanceOf(ApiException.class)
                .hasMessage("Ngày kết thúc phải sau ngày bắt đầu")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("WP-01 Validate: Giáo án dài hơn 1 năm ném 400 Bad Request")
    void create_durationLongerThanOneYear_throwsBadRequest400() {
        when(access.requireCoach(ADMIN, 10L)).thenReturn(member);

        WorkoutPlanRequest req = new WorkoutPlanRequest(
                10L, "Giáo án quá dài", null,
                LocalDate.of(2026, 1, 1), LocalDate.of(2027, 1, 2), // Hơn 1 năm (1 năm + 1 ngày)
                null, List.of(new PlanItemRequest(1L, 1, 0, 3, "10", null, null, null, null))
        );

        assertThatThrownBy(() -> service.create(ADMIN, req))
                .isInstanceOf(ApiException.class)
                .hasMessage("Giáo án dài tối đa 1 năm")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("WP-01 Validate: Danh sách bài tập rỗng ném 400 Bad Request")
    void create_emptyItemList_throwsBadRequest400() {
        when(access.requireCoach(ADMIN, 10L)).thenReturn(member);

        WorkoutPlanRequest req = new WorkoutPlanRequest(
                10L, "Giáo án không bài", null,
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1),
                null, Collections.emptyList()
        );

        assertThatThrownBy(() -> service.create(ADMIN, req))
                .isInstanceOf(ApiException.class)
                .hasMessage("Giáo án cần ít nhất một bài tập")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // ==========================================
    // WP-01: Sửa giáo án
    // ==========================================

    @Test
    @DisplayName("WP-01 Sửa: Đổi memberId sang hội viên khác ném 400 Bad Request")
    void update_changingMemberId_throwsBadRequest400() {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setId(100L);
        plan.setMember(member); // member.id = 10L

        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);

        WorkoutPlanRequest req = new WorkoutPlanRequest(
                99L, "Tên mới", null, // Đổi sang memberId = 99L
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1),
                null, List.of(new PlanItemRequest(1L, 1, 0, 3, "10", null, null, null, null))
        );

        assertThatThrownBy(() -> service.update(ADMIN, 100L, req))
                .isInstanceOf(ApiException.class)
                .hasMessage("Không thể chuyển giáo án sang hội viên khác")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("WP-01 Sửa: Người không có quyền HLV (canCoach = false) ném 403 Forbidden")
    void update_withoutCoachPermission_throwsForbidden403() {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setId(100L);
        plan.setMember(member);

        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(TRAINER, member)).thenReturn(false);

        WorkoutPlanRequest req = new WorkoutPlanRequest(
                10L, "Tên mới", null,
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1),
                null, List.of(new PlanItemRequest(1L, 1, 0, 3, "10", null, null, null, null))
        );

        assertThatThrownBy(() -> service.update(TRAINER, 100L, req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    @DisplayName("WP-01 Sửa: Sửa hợp lệ thì danh sách bài được thay mới hoàn toàn, không cộng dồn bài cũ")
    void update_validRequest_replacesItemListCompletely_doesNotAccumulateOldItems() {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setId(100L);
        plan.setName("Giáo án cũ");
        plan.setMember(member);
        plan.setStartDate(LocalDate.of(2026, 11, 1));
        plan.setEndDate(LocalDate.of(2026, 12, 1));

        // Ban đầu có 2 bài cũ
        WorkoutPlanItem oldItem1 = new WorkoutPlanItem();
        oldItem1.setPlan(plan);
        oldItem1.setExercise(benchPress);
        oldItem1.setDayOfWeek(1);
        oldItem1.setSets(3);
        oldItem1.setReps("10");

        WorkoutPlanItem oldItem2 = new WorkoutPlanItem();
        oldItem2.setPlan(plan);
        oldItem2.setExercise(pullUp);
        oldItem2.setDayOfWeek(3);
        oldItem2.setSets(3);
        oldItem2.setReps("8");

        plan.getItems().add(oldItem1);
        plan.getItems().add(oldItem2);
        assertThat(plan.getItems()).hasSize(2);

        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);
        when(exerciseService.load(2L)).thenReturn(squat);

        // Gửi 1 bài tập mới duy nhất (Squat)
        PlanItemRequest newItem = new PlanItemRequest(2L, 5, 0, 5, "5", 80.0, 180, null, "Bài mới");
        WorkoutPlanRequest req = new WorkoutPlanRequest(
                10L, "Giáo án đã sửa", "Mục tiêu mới",
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1),
                "Ghi chú mới", List.of(newItem)
        );

        WorkoutPlanResponse res = service.update(ADMIN, 100L, req);

        // Danh sách bài được thay mới hoàn toàn: chỉ có 1 bài Squat, không còn 2 bài cũ
        assertThat(plan.getItems()).hasSize(1);
        assertThat(plan.getItems().get(0).getExercise().getId()).isEqualTo(2L);
        assertThat(plan.getItems().get(0).getDayOfWeek()).isEqualTo(5);
        assertThat(plan.getName()).isEqualTo("Giáo án đã sửa");

        verify(planRepository).saveAndFlush(plan);
        verify(auditService).log(eq("WORKOUT_PLAN_UPDATE"), eq("WORKOUT_PLAN"), eq(100L), eq("Giáo án đã sửa"));
    }

    // ==========================================
    // WP-01: Xoá giáo án
    // ==========================================

    @Test
    @DisplayName("WP-01 Xoá: Các buổi tập gắn giáo án được set plan = null, giáo án bị xoá và ghi audit WORKOUT_PLAN_DELETE")
    void delete_planWithSchedules_unlinksSchedules_deletesPlan_andLogsAudit() {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setId(100L);
        plan.setName("Giáo án cần xoá");
        plan.setMember(member);

        WorkoutSchedule s1 = new WorkoutSchedule();
        s1.setId(1L);
        s1.setPlan(plan);

        WorkoutSchedule s2 = new WorkoutSchedule();
        s2.setId(2L);
        s2.setPlan(plan);

        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);
        when(scheduleRepository.findByPlanId(100L)).thenReturn(List.of(s1, s2));

        service.delete(ADMIN, 100L);

        // Buổi tập đã gắn giáo án được gỡ liên kết (plan = null)
        assertThat(s1.getPlan()).isNull();
        assertThat(s2.getPlan()).isNull();

        verify(planRepository).delete(plan);
        verify(auditService).log(eq("WORKOUT_PLAN_DELETE"), eq("WORKOUT_PLAN"), eq(100L), eq("Giáo án cần xoá"));
    }

    @Test
    @DisplayName("WP-01 Xoá: Id không tồn tại thì ném 404 Not Found")
    void delete_nonExistentPlan_throwsNotFound404() {
        when(planRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(ADMIN, 999L))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        verify(planRepository, never()).delete(any());
        verify(auditService, never()).log(anyString(), anyString(), any(), any());
    }

    // ==========================================
    // WP-02: Bài theo 7 ngày trong tuần
    // ==========================================

    @Test
    @DisplayName("WP-02: Một giáo án có bài ở nhiều ngày (thứ 2, 4, 6, có 2 bài cùng ngày) thì mỗi bài giữ đúng ngày và thứ tự")
    void wp02_sevenDaySchedule_maintainsDayOfWeekAndSortOrderAcrossMultipleDays() {
        when(access.requireCoach(ADMIN, 10L)).thenReturn(member);
        when(exerciseService.load(1L)).thenReturn(benchPress);
        when(exerciseService.load(2L)).thenReturn(squat);
        when(exerciseService.load(3L)).thenReturn(pullUp);
        when(planRepository.findByMemberIdOrderByStartDateDesc(10L)).thenReturn(Collections.emptyList());

        // Thứ 2 (dayOfWeek=1): 2 bài (Bench Press thứ tự 0, Squat thứ tự 1)
        PlanItemRequest mon1 = new PlanItemRequest(1L, 1, 0, 4, "10", 60.0, 90, null, "Ngực");
        PlanItemRequest mon2 = new PlanItemRequest(2L, 1, 1, 4, "8", 80.0, 120, null, "Đùi");
        // Thứ 4 (dayOfWeek=3): 1 bài (Pull-up thứ tự 0)
        PlanItemRequest wed = new PlanItemRequest(3L, 3, 0, 3, "12", null, 60, null, "Lưng");
        // Thứ 6 (dayOfWeek=5): 1 bài (Bench Press thứ tự 0)
        PlanItemRequest fri = new PlanItemRequest(1L, 5, 0, 4, "10", 62.5, 90, null, "Ngực nhẹ");

        WorkoutPlanRequest req = new WorkoutPlanRequest(
                10L, "Giáo án 3 buổi/tuần", "Tăng sức mạnh",
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1),
                null, List.of(mon1, mon2, wed, fri)
        );

        WorkoutPlanResponse res = service.create(ADMIN, req);

        assertThat(res.items()).hasSize(4);

        // Thứ 2: bài 1 (order 0) và bài 2 (order 1)
        assertThat(res.items().get(0).dayOfWeek()).isEqualTo(1);
        assertThat(res.items().get(0).sortOrder()).isEqualTo(0);
        assertThat(res.items().get(0).exerciseId()).isEqualTo(1L);

        assertThat(res.items().get(1).dayOfWeek()).isEqualTo(1);
        assertThat(res.items().get(1).sortOrder()).isEqualTo(1);
        assertThat(res.items().get(1).exerciseId()).isEqualTo(2L);

        // Thứ 4: bài 3 (order 0)
        assertThat(res.items().get(2).dayOfWeek()).isEqualTo(3);
        assertThat(res.items().get(2).sortOrder()).isEqualTo(0);
        assertThat(res.items().get(2).exerciseId()).isEqualTo(3L);

        // Thứ 6: bài 1 (order 0)
        assertThat(res.items().get(3).dayOfWeek()).isEqualTo(5);
        assertThat(res.items().get(3).sortOrder()).isEqualTo(0);
        assertThat(res.items().get(3).exerciseId()).isEqualTo(1L);
    }

    // ==========================================
    // setStatus
    // ==========================================

    @Test
    @DisplayName("setStatus: Chuyển giáo án về ACTIVE thì giáo án ACTIVE khác của hội viên đó chuyển sang ARCHIVED")
    void setStatus_toActive_archivesOtherActivePlansOfSameMember() {
        WorkoutPlan currentPlan = new WorkoutPlan();
        currentPlan.setId(100L);
        currentPlan.setName("Giáo án hiện tại");
        currentPlan.setMember(member);
        currentPlan.setStatus(PlanStatus.COMPLETED);

        WorkoutPlan anotherActivePlan = new WorkoutPlan();
        anotherActivePlan.setId(90L);
        anotherActivePlan.setName("Giáo án khác đang active");
        anotherActivePlan.setMember(member);
        anotherActivePlan.setStatus(PlanStatus.ACTIVE);

        when(planRepository.findById(100L)).thenReturn(Optional.of(currentPlan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);
        when(planRepository.findByMemberIdOrderByStartDateDesc(10L))
                .thenReturn(List.of(currentPlan, anotherActivePlan));

        WorkoutPlanSummary summary = service.setStatus(ADMIN, 100L, PlanStatus.ACTIVE);

        assertThat(currentPlan.getStatus()).isEqualTo(PlanStatus.ACTIVE);
        // Giáo án active khác tự động bị chuyển sang ARCHIVED
        assertThat(anotherActivePlan.getStatus()).isEqualTo(PlanStatus.ARCHIVED);

        verify(auditService).log(eq("WORKOUT_PLAN_STATUS"), eq("WORKOUT_PLAN"), eq(100L), contains("ACTIVE"));
    }

    // ==========================================
    // current()
    // ==========================================

    @Test
    @DisplayName("current(): Hội viên không có giáo án ACTIVE thì trả về null")
    void current_noActivePlan_returnsNull() {
        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(10L, PlanStatus.ACTIVE))
                .thenReturn(Optional.empty());

        WorkoutPlanResponse res = service.current(MEMBER_USER);

        assertThat(res).isNull();
    }
}
