/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền) · TASK: SCRUM-163, SCRUM-164
 * Kiểm thử dịch vụ giáo án: CRUD giáo án, phân bổ bài theo 7 ngày, kiểm tra quyền và lưu trữ giáo án cũ.
 */
package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.WorkoutPlanHistoryRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;

import java.time.Clock;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
    @Mock WorkoutPlanHistoryRepository historyRepository;

    WorkoutPlanService service;
    Clock clock;

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
        clock = Clock.fixed(java.time.Instant.parse("2026-11-10T03:00:00Z"), java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        service = new WorkoutPlanService(planRepository, scheduleRepository, exerciseService, access, auditService, mappers, historyRepository, clock);

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
        // Giáo án chỉ nhận bài mới đã duyệt; bài chưa duyệt có test riêng ở cuối file
        e.setReviewStatus(ReviewStatus.APPROVED);
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
    // Bài chưa duyệt và số lần không hợp lệ
    // ==========================================

    @Test
    @DisplayName("Thêm bài chưa duyệt vào giáo án mới thì bị từ chối 400")
    void create_withUnapprovedExercise_isRejected() {
        squat.setReviewStatus(ReviewStatus.PENDING);
        when(access.requireCoach(TRAINER, 10L)).thenReturn(member);
        when(access.requireTrainerOf(TRAINER)).thenReturn(trainer);
        when(exerciseService.load(2L)).thenReturn(squat);

        WorkoutPlanRequest req = new WorkoutPlanRequest(10L, "Giáo án chân", null,
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), null,
                List.of(new PlanItemRequest(2L, 1, 0, 3, "10", null, null, null, null)));

        assertThatThrownBy(() -> service.create(TRAINER, req))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(planRepository, never()).save(any());
    }

    @Test
    @DisplayName("Bài đã có trong giáo án vẫn được giữ khi sửa dù sau đó bị trả về chỉnh sửa")
    void update_keepsExistingExercise_evenIfNoLongerApproved() {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setId(100L);
        plan.setMember(member);
        WorkoutPlanItem old = new WorkoutPlanItem();
        old.setPlan(plan);
        old.setExercise(benchPress);
        old.setDayOfWeek(1);
        old.setSets(3);
        old.setReps("10");
        plan.getItems().add(old);
        benchPress.setReviewStatus(ReviewStatus.NEEDS_REVIEW);

        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);
        when(exerciseService.load(1L)).thenReturn(benchPress);

        WorkoutPlanRequest req = new WorkoutPlanRequest(10L, "Giáo án ngực", null,
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), null,
                List.of(new PlanItemRequest(1L, 1, 0, 4, "8-10", 40.0, 90, null, null)));

        service.update(ADMIN, 100L, req);
        assertThat(plan.getItems()).hasSize(1);
        assertThat(plan.getItems().get(0).getSets()).isEqualTo(4);
    }

    @Test
    @DisplayName("Số lần dạng khoảng ngược (12-8) bị từ chối 400")
    void create_withReversedRepRange_isRejected() {
        when(access.requireCoach(TRAINER, 10L)).thenReturn(member);
        WorkoutPlanRequest req = new WorkoutPlanRequest(10L, "Giáo án ngực", null,
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1), null,
                List.of(new PlanItemRequest(1L, 1, 0, 3, "12-8", null, null, null, null)));

        assertThatThrownBy(() -> service.create(TRAINER, req))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("số đầu phải nhỏ hơn số sau");
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

    // ==========================================
    // ===== SCRUM-164 =====
    // ==========================================

    private WorkoutPlan createDummyPlan(Long id, PlanStatus status) {
        WorkoutPlan p = new WorkoutPlan();
        p.setId(id);
        p.setName("Giáo án " + id);
        p.setMember(member);
        p.setTrainer(trainer);
        p.setStatus(status);
        p.setStartDate(LocalDate.of(2026, 11, 1));
        p.setEndDate(LocalDate.of(2026, 12, 1));
        return p;
    }

    private WorkoutPlanRequest createPlanRequest(Long memberId, String name) {
        PlanItemRequest item = new PlanItemRequest(1L, 1, 0, 3, "10", 40.0, 60, null, null);
        return new WorkoutPlanRequest(
                memberId, name, "Mục tiêu tập luyện",
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 12, 1),
                "Ghi chú", List.of(item)
        );
    }

    @Test
    @DisplayName("BR-11/WP-04 Trạng thái: Chuyển giáo án sang COMPLETED hoặc ARCHIVED thì các giáo án khác giữ nguyên, không gọi tìm giáo án để lưu trữ")
    void br11_wp04_setStatusToCompletedOrArchived_doesNotArchiveOtherPlans() {
        WorkoutPlan plan = createDummyPlan(100L, PlanStatus.ACTIVE);
        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);

        service.setStatus(ADMIN, 100L, PlanStatus.COMPLETED);
        assertThat(plan.getStatus()).isEqualTo(PlanStatus.COMPLETED);

        service.setStatus(ADMIN, 100L, PlanStatus.ARCHIVED);
        assertThat(plan.getStatus()).isEqualTo(PlanStatus.ARCHIVED);

        verify(planRepository, never()).findByMemberIdOrderByStartDateDesc(anyLong());
    }

    @Test
    @DisplayName("BR-11/WP-05 Lưu trữ: Tạo giáo án cho hội viên A thì chỉ lưu trữ giáo án của A, không gọi hay ảnh hưởng đến hội viên khác")
    void br11_wp05_createPlanForMemberA_onlyArchivesPlansOfMemberA() {
        when(access.requireCoach(TRAINER, 10L)).thenReturn(member);
        when(access.requireTrainerOf(TRAINER)).thenReturn(trainer);
        when(exerciseService.load(1L)).thenReturn(benchPress);

        WorkoutPlan planAOld = createDummyPlan(101L, PlanStatus.ACTIVE);
        when(planRepository.findByMemberIdOrderByStartDateDesc(10L)).thenReturn(List.of(planAOld));

        service.create(TRAINER, createPlanRequest(10L, "Giáo án mới cho A"));

        assertThat(planAOld.getStatus()).isEqualTo(PlanStatus.ARCHIVED);
        verify(planRepository).findByMemberIdOrderByStartDateDesc(10L);
        verify(planRepository, never()).findByMemberIdOrderByStartDateDesc(argThat(id -> id != null && !id.equals(10L)));
    }

    @Test
    @DisplayName("BR-11/WP-04 Trạng thái: Kích hoạt lại giáo án vốn đang ACTIVE thì giáo án đó vẫn ACTIVE, không tự chuyển thành ARCHIVED")
    void br11_wp04_setStatusActiveOnAlreadyActivePlan_remainsActiveAndDoesNotSelfArchive() {
        WorkoutPlan currentPlan = createDummyPlan(100L, PlanStatus.ACTIVE);
        when(planRepository.findById(100L)).thenReturn(Optional.of(currentPlan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);
        when(planRepository.findByMemberIdOrderByStartDateDesc(10L)).thenReturn(List.of(currentPlan));

        WorkoutPlanSummary summary = service.setStatus(ADMIN, 100L, PlanStatus.ACTIVE);

        assertThat(currentPlan.getStatus()).isEqualTo(PlanStatus.ACTIVE);
        assertThat(summary.status()).isEqualTo(PlanStatus.ACTIVE);
    }

    @Test
    @DisplayName("BR-11/WP-05 Lưu trữ: Nếu dữ liệu có nhiều giáo án ACTIVE cũ, tạo giáo án mới thì tất cả giáo án ACTIVE cũ đều chuyển sang ARCHIVED")
    void br11_wp05_createPlan_whenMultipleActivePlansExist_archivesAllOldActivePlans() {
        when(access.requireCoach(TRAINER, 10L)).thenReturn(member);
        when(access.requireTrainerOf(TRAINER)).thenReturn(trainer);
        when(exerciseService.load(1L)).thenReturn(benchPress);

        WorkoutPlan oldActive1 = createDummyPlan(81L, PlanStatus.ACTIVE);
        WorkoutPlan oldActive2 = createDummyPlan(82L, PlanStatus.ACTIVE);
        WorkoutPlan oldCompleted = createDummyPlan(83L, PlanStatus.COMPLETED);

        when(planRepository.findByMemberIdOrderByStartDateDesc(10L))
                .thenReturn(List.of(oldActive1, oldActive2, oldCompleted));

        service.create(TRAINER, createPlanRequest(10L, "Giáo án thay thế"));

        assertThat(oldActive1.getStatus()).isEqualTo(PlanStatus.ARCHIVED);
        assertThat(oldActive2.getStatus()).isEqualTo(PlanStatus.ARCHIVED);
        assertThat(oldCompleted.getStatus()).isEqualTo(PlanStatus.COMPLETED);
    }

    @Test
    @DisplayName("WP-04 Phân quyền: Đổi trạng thái khi canCoach = false ném 403 Forbidden, trạng thái không đổi và không ghi audit")
    void wp04_setStatus_forbiddenWhenCannotCoach_throws403AndNoAudit() {
        WorkoutPlan plan = createDummyPlan(100L, PlanStatus.ACTIVE);
        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(TRAINER, member)).thenReturn(false);

        assertThatThrownBy(() -> service.setStatus(TRAINER, 100L, PlanStatus.COMPLETED))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        assertThat(plan.getStatus()).isEqualTo(PlanStatus.ACTIVE);
        verify(auditService, never()).log(anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("WP-04 Trạng thái: Đổi trạng thái id giáo án không tồn tại ném 404 Not Found")
    void wp04_setStatus_notFound_throws404() {
        when(planRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.setStatus(ADMIN, 999L, PlanStatus.COMPLETED))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                .hasMessageContaining("giáo án");

        verify(auditService, never()).log(anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("WP-04 Audit: Đổi trạng thái sang COMPLETED ghi audit WORKOUT_PLAN_STATUS chứa '→ COMPLETED'")
    void wp04_setStatus_auditLogsStatusTransitionWithArrow() {
        WorkoutPlan plan = createDummyPlan(100L, PlanStatus.ACTIVE);
        plan.setName("Giáo án Siết cân");
        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);

        service.setStatus(ADMIN, 100L, PlanStatus.COMPLETED);

        verify(auditService).log(eq("WORKOUT_PLAN_STATUS"), eq("WORKOUT_PLAN"), eq(100L), contains("Giáo án Siết cân → COMPLETED"));
    }

    @Test
    @DisplayName("WP-07 Phân quyền: Xoá giáo án khi canCoach = false ném 403 Forbidden, không gỡ buổi và không xoá giáo án")
    void wp07_delete_forbiddenWhenCannotCoach_throws403AndSchedulesUnchanged() {
        WorkoutPlan plan = createDummyPlan(100L, PlanStatus.ACTIVE);
        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(TRAINER, member)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(TRAINER, 100L))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(scheduleRepository, never()).findByPlanId(anyLong());
        verify(planRepository, never()).delete(any());
        verify(auditService, never()).log(anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("WP-07 Xoá: Giáo án không có buổi tập nào gắn kèm thì vẫn xoá thành công và ghi audit WORKOUT_PLAN_DELETE")
    void wp07_delete_planWithNoSchedules_deletesSuccessfullyAndLogsAudit() {
        WorkoutPlan plan = createDummyPlan(100L, PlanStatus.ACTIVE);
        plan.setName("Giáo án mới tạo");
        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);
        when(scheduleRepository.findByPlanId(100L)).thenReturn(List.of());

        service.delete(ADMIN, 100L);

        verify(planRepository).delete(plan);
        verify(auditService).log(eq("WORKOUT_PLAN_DELETE"), eq("WORKOUT_PLAN"), eq(100L), eq("Giáo án mới tạo"));
    }

    @Test
    @DisplayName("WP-07 Xoá giữ buổi tập: Các WorkoutSchedule gắn giáo án không bị xoá, scheduleRepository.delete không bao giờ được gọi, status và thời gian buổi giữ nguyên")
    void wp07_delete_preservesWorkoutSchedules_detachesPlanAndDoesNotDeleteSchedules() {
        WorkoutPlan plan = createDummyPlan(100L, PlanStatus.ACTIVE);
        when(planRepository.findById(100L)).thenReturn(Optional.of(plan));
        when(access.canCoach(ADMIN, member)).thenReturn(true);

        WorkoutSchedule s1 = new WorkoutSchedule();
        s1.setId(1L);
        s1.setPlan(plan);
        s1.setStatus(ScheduleStatus.SCHEDULED);
        s1.setStartTime(LocalDateTime.of(2026, 11, 10, 8, 0));
        s1.setEndTime(LocalDateTime.of(2026, 11, 10, 9, 0));

        WorkoutSchedule s2 = new WorkoutSchedule();
        s2.setId(2L);
        s2.setPlan(plan);
        s2.setStatus(ScheduleStatus.COMPLETED);
        s2.setStartTime(LocalDateTime.of(2026, 11, 3, 8, 0));
        s2.setEndTime(LocalDateTime.of(2026, 11, 3, 9, 0));

        when(scheduleRepository.findByPlanId(100L)).thenReturn(List.of(s1, s2));

        service.delete(ADMIN, 100L);

        // Các buổi tập chỉ bị gỡ plan liên kết
        assertThat(s1.getPlan()).isNull();
        assertThat(s2.getPlan()).isNull();
        // Trạng thái và thời gian buổi tập giữ nguyên vẹn
        assertThat(s1.getStatus()).isEqualTo(ScheduleStatus.SCHEDULED);
        assertThat(s2.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        assertThat(s1.getStartTime()).isEqualTo(LocalDateTime.of(2026, 11, 10, 8, 0));
        assertThat(s2.getStartTime()).isEqualTo(LocalDateTime.of(2026, 11, 3, 8, 0));

        // Buổi tập KHÔNG bị xoá khỏi database
        verify(scheduleRepository, never()).delete(any());
        verify(scheduleRepository, never()).deleteAll(any());
        verify(scheduleRepository, never()).deleteById(any());
        verify(planRepository).delete(plan);
    }

    // ==========================================
    // PHẦN 2: Đổi giáo án có lưu lịch sử
    // ==========================================

    @Test
    @DisplayName("Đổi giáo án lưu lịch sử, huỷ các buổi tương lai và giữ nguyên các buổi quá khứ")
    void switchPlan_savesHistory_archivesOldPlan_cancelsFutureSchedulesOnly() {
        LocalDateTime now = LocalDateTime.now(clock);

        WorkoutPlan oldPlan = new WorkoutPlan();
        oldPlan.setId(100L);
        oldPlan.setName("Giáo án cũ");
        oldPlan.setMember(member);
        oldPlan.setStatus(PlanStatus.ACTIVE);

        WorkoutPlan newPlan = new WorkoutPlan();
        newPlan.setId(200L);
        newPlan.setName("Giáo án mới");
        newPlan.setMember(member);
        newPlan.setStatus(PlanStatus.ARCHIVED);

        // Buổi tương lai (sẽ bị huỷ)
        WorkoutSchedule futureSchedule = new WorkoutSchedule();
        futureSchedule.setId(1L);
        futureSchedule.setPlan(oldPlan);
        futureSchedule.setMember(member);
        futureSchedule.setStatus(ScheduleStatus.SCHEDULED);
        futureSchedule.setStartTime(now.plusDays(2));
        futureSchedule.setEndTime(now.plusDays(2).plusHours(1));

        // Buổi quá khứ chưa hoàn thành (giữ nguyên, không huỷ)
        WorkoutSchedule pastSchedule = new WorkoutSchedule();
        pastSchedule.setId(2L);
        pastSchedule.setPlan(oldPlan);
        pastSchedule.setMember(member);
        pastSchedule.setStatus(ScheduleStatus.SCHEDULED);
        pastSchedule.setStartTime(now.minusDays(2));
        pastSchedule.setEndTime(now.minusDays(2).plusHours(1));

        // Buổi đã hoàn thành (giữ nguyên COMPLETED)
        WorkoutSchedule completedSchedule = new WorkoutSchedule();
        completedSchedule.setId(3L);
        completedSchedule.setPlan(oldPlan);
        completedSchedule.setMember(member);
        completedSchedule.setStatus(ScheduleStatus.COMPLETED);
        completedSchedule.setStartTime(now.minusDays(5));
        completedSchedule.setEndTime(now.minusDays(5).plusHours(1));

        when(access.requireMemberOf(MEMBER_USER)).thenReturn(member);
        when(planRepository.findById(200L)).thenReturn(Optional.of(newPlan));
        when(access.canView(MEMBER_USER, member)).thenReturn(true);
        when(planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(member.getId(), PlanStatus.ACTIVE))
                .thenReturn(Optional.of(oldPlan));
        when(scheduleRepository.findByPlanId(100L)).thenReturn(List.of(futureSchedule, pastSchedule, completedSchedule));
        when(planRepository.findByMemberIdOrderByStartDateDesc(member.getId())).thenReturn(List.of(oldPlan, newPlan));
        when(mappers.planDetail(newPlan)).thenReturn(new WorkoutPlanResponse(null, null, List.of()));

        SwitchPlanRequest req = new SwitchPlanRequest(200L, "Chuyển sang giáo án tăng cơ");
        WorkoutPlanResponse res = service.switchPlan(MEMBER_USER, req);

        // 1. Trạng thái giáo án mới là ACTIVE, giáo án cũ là ARCHIVED
        assertThat(newPlan.getStatus()).isEqualTo(PlanStatus.ACTIVE);
        assertThat(oldPlan.getStatus()).isEqualTo(PlanStatus.ARCHIVED);

        // 2. Buổi tương lai bị CANCELLED
        assertThat(futureSchedule.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        // Buổi quá khứ giữ nguyên trạng thái
        assertThat(pastSchedule.getStatus()).isEqualTo(ScheduleStatus.SCHEDULED);
        assertThat(completedSchedule.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);

        // 3. Lưu lịch sử đổi giáo án
        org.mockito.ArgumentCaptor<WorkoutPlanHistory> historyCaptor = org.mockito.ArgumentCaptor.forClass(WorkoutPlanHistory.class);
        verify(historyRepository).save(historyCaptor.capture());
        WorkoutPlanHistory savedHistory = historyCaptor.getValue();

        assertThat(savedHistory.getMember().getId()).isEqualTo(member.getId());
        assertThat(savedHistory.getOldPlan().getId()).isEqualTo(100L);
        assertThat(savedHistory.getOldPlanName()).isEqualTo("Giáo án cũ");
        assertThat(savedHistory.getNewPlan().getId()).isEqualTo(200L);
        assertThat(savedHistory.getNewPlanName()).isEqualTo("Giáo án mới");
        assertThat(savedHistory.getCancelledFutureSessions()).isEqualTo(1);
        assertThat(savedHistory.getNote()).isEqualTo("Chuyển sang giáo án tăng cơ");
    }
}
