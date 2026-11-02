/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền) · TASK: SCRUM-162
 * Kiểm thử dịch vụ bài tập: lọc, xem chi tiết, ẩn/hiện, và xoá ràng buộc (RESTRICT).
 */
package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.ExerciseResponse;
import com.gymflow.repository.ContentSourceRepository;
import com.gymflow.repository.ExerciseRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.repository.WorkoutPlanItemRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExerciseServiceTest {

    @Mock ExerciseRepository exerciseRepository;
    @Mock ContentSourceRepository sourceRepository;
    @Mock WorkoutPlanItemRepository planItemRepository;
    @Mock UserRepository userRepository;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    ExerciseService service;

    static final AuthUser ADMIN = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
    static final AuthUser TRAINER = new AuthUser(2L, "trainer@gymflow.vn", Role.TRAINER, "HLV Nam");
    static final AuthUser MEMBER = new AuthUser(3L, "member@gymflow.vn", Role.MEMBER, "Hội viên Linh");

    @BeforeEach
    void setUp() {
        service = new ExerciseService(exerciseRepository, sourceRepository, planItemRepository, userRepository, auditService, mappers);

        lenient().when(mappers.exercise(any(Exercise.class))).thenAnswer(inv -> {
            Exercise e = inv.getArgument(0);
            return dummyResponse(e);
        });
    }

    private Exercise createExercise(Long id, String name, String nameEn, MuscleGroup group,
                                   Level level, ExerciseLocation location, String equipment, boolean hidden) {
        Exercise e = new Exercise();
        e.setId(id);
        e.setName(name);
        e.setNameEn(nameEn);
        e.setMuscleGroup(group);
        e.setLevel(level);
        e.setLocation(location);
        e.setEquipment(equipment);
        e.setHidden(hidden);
        e.setReviewStatus(ReviewStatus.APPROVED);
        return e;
    }

    private ExerciseResponse dummyResponse(Exercise e) {
        return new ExerciseResponse(
                e.getId(),
                e.getName(),
                e.getMuscleGroup(),
                e.getEquipment(),
                e.getLevel(),
                e.getDescription(),
                e.getInstructions(),
                e.getVideoUrl(),
                e.isHidden(),
                0L,
                null,
                e.getNameEn(),
                e.getAliases(),
                e.getSecondaryMuscles(),
                e.getLocation(),
                null,
                e.getBreathing(),
                e.getCommonMistakes(),
                e.getSafetyNotes(),
                e.getVariations(),
                e.getSuggestedDose(),
                e.getContentOrigin(),
                e.getReviewStatus(),
                e.getReviewNote(),
                null,
                null,
                null,
                List.of()
        );
    }

    // ==========================================
    // EX-01: Lọc bài tập
    // ==========================================

    @Test
    @DisplayName("EX-01: Hội viên không thấy bài ẩn kể cả khi gửi includeHidden=true")
    void list_memberNeverSeesHiddenExercises_evenWithIncludeHiddenTrue() {
        Exercise visible = createExercise(1L, "Squat", "Squat", MuscleGroup.LEGS, Level.BEGINNER, ExerciseLocation.ANY, null, false);
        Exercise hidden = createExercise(2L, "Deadlift", "Deadlift", MuscleGroup.BACK, Level.ADVANCED, ExerciseLocation.GYM, "Barbell", true);

        when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(visible, hidden));

        ExerciseService.Filter filter = new ExerciseService.Filter(null, null, null, null, null, null, true);
        List<ExerciseResponse> result = service.list(MEMBER, filter);

        assertThat(result)
                .extracting(ExerciseResponse::id)
                .containsExactly(1L);
    }

    @Test
    @DisplayName("EX-01: HLV có includeHidden=true thì thấy bài ẩn, false thì không thấy")
    void list_trainerSeesHiddenExercisesOnlyWhenIncludeHiddenIsTrue() {
        Exercise visible = createExercise(1L, "Squat", "Squat", MuscleGroup.LEGS, Level.BEGINNER, ExerciseLocation.ANY, null, false);
        Exercise hidden = createExercise(2L, "Deadlift", "Deadlift", MuscleGroup.BACK, Level.ADVANCED, ExerciseLocation.GYM, "Barbell", true);

        when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(visible, hidden));

        // Khi includeHidden = true -> HLV thấy cả 2 bài
        ExerciseService.Filter filterShow = new ExerciseService.Filter(null, null, null, null, null, null, true);
        List<ExerciseResponse> withHidden = service.list(TRAINER, filterShow);
        assertThat(withHidden)
                .extracting(ExerciseResponse::id)
                .containsExactly(1L, 2L);

        // Khi includeHidden = false -> HLV chỉ thấy bài không ẩn
        ExerciseService.Filter filterHide = new ExerciseService.Filter(null, null, null, null, null, null, false);
        List<ExerciseResponse> withoutHidden = service.list(TRAINER, filterHide);
        assertThat(withoutHidden)
                .extracting(ExerciseResponse::id)
                .containsExactly(1L);
    }

    @Test
    @DisplayName("EX-01: Lọc kết hợp nhóm cơ và cấp độ chỉ trả đúng bài khớp cả hai tiêu chí")
    void list_filtersByMuscleGroupAndLevel() {
        Exercise chestInter = createExercise(1L, "Bench Press", "Bench Press", MuscleGroup.CHEST, Level.INTERMEDIATE, ExerciseLocation.GYM, "Barbell", false);
        Exercise chestBegin = createExercise(2L, "Push-up", "Push-up", MuscleGroup.CHEST, Level.BEGINNER, ExerciseLocation.ANY, null, false);
        Exercise backInter = createExercise(3L, "Pull-up", "Pull-up", MuscleGroup.BACK, Level.INTERMEDIATE, ExerciseLocation.ANY, null, false);
        Exercise backAdv = createExercise(4L, "Deadlift", "Deadlift", MuscleGroup.BACK, Level.ADVANCED, ExerciseLocation.GYM, "Barbell", false);

        when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(chestInter, chestBegin, backInter, backAdv));

        ExerciseService.Filter filter = new ExerciseService.Filter(null, MuscleGroup.CHEST, Level.INTERMEDIATE, null, null, null, false);
        List<ExerciseResponse> result = service.list(ADMIN, filter);

        assertThat(result)
                .extracting(ExerciseResponse::id)
                .containsExactly(1L);
    }

    @Test
    @DisplayName("EX-01: Bài có location ANY hiện khi lọc theo một nơi tập cụ thể (GYM hoặc HOME)")
    void list_anyLocationAppearsWhenFilteringSpecificLocation() {
        Exercise gymOnly = createExercise(1L, "Leg Press", "Leg Press", MuscleGroup.LEGS, Level.INTERMEDIATE, ExerciseLocation.GYM, "Machine", false);
        Exercise anyLocation = createExercise(2L, "Push-up", "Push-up", MuscleGroup.CHEST, Level.BEGINNER, ExerciseLocation.ANY, null, false);
        Exercise homeOnly = createExercise(3L, "Banded Squat", "Banded Squat", MuscleGroup.LEGS, Level.BEGINNER, ExerciseLocation.HOME, "Band", false);

        when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(gymOnly, anyLocation, homeOnly));

        // Lọc GYM: bài GYM và bài ANY xuất hiện, HOME bị loại
        ExerciseService.Filter gymFilter = new ExerciseService.Filter(null, null, null, ExerciseLocation.GYM, null, null, false);
        List<ExerciseResponse> gymResult = service.list(ADMIN, gymFilter);
        assertThat(gymResult)
                .extracting(ExerciseResponse::id)
                .containsExactly(1L, 2L);

        // Lọc HOME: bài HOME và bài ANY xuất hiện, GYM bị loại
        ExerciseService.Filter homeFilter = new ExerciseService.Filter(null, null, null, ExerciseLocation.HOME, null, null, false);
        List<ExerciseResponse> homeResult = service.list(ADMIN, homeFilter);
        assertThat(homeResult)
                .extracting(ExerciseResponse::id)
                .containsExactly(2L, 3L);
    }

    @Test
    @DisplayName("EX-01: Từ khoá không phân biệt hoa thường, có cắt khoảng trắng, khớp được tên, nameEn và equipment")
    void list_keywordSearch_caseInsensitive_trimmed_matchesName_nameEn_andEquipment() {
        Exercise e1 = createExercise(1L, "Đẩy ngực tạ đòn", "Barbell Bench Press", MuscleGroup.CHEST, Level.INTERMEDIATE, ExerciseLocation.GYM, "Đòn tạ", false);
        Exercise e2 = createExercise(2L, "Đạp đùi nghiêng", "Leg Press", MuscleGroup.LEGS, Level.BEGINNER, ExerciseLocation.GYM, "Máy Leg Press", false);
        Exercise e3 = createExercise(3L, "Gập bụng thảm", "Floor Crunch", MuscleGroup.CORE, Level.BEGINNER, ExerciseLocation.HOME, "Thảm tập", false);
        Exercise e4 = createExercise(4L, "Gánh tạ đòn", "Barbell Back Squat", MuscleGroup.LEGS, Level.ADVANCED, ExerciseLocation.GYM, "Đòn tạ", false);

        when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(e1, e2, e3, e4));

        // 1. Khớp nameEn không phân biệt hoa thường và cắt khoảng trắng: "  bEnCh  "
        List<ExerciseResponse> r1 = service.list(ADMIN, new ExerciseService.Filter("  bEnCh  ", null, null, null, null, null, false));
        assertThat(r1).extracting(ExerciseResponse::id).containsExactly(1L);

        // 2. Khớp tiếng Việt có dấu: "  ĐẨY NGỰC  "
        List<ExerciseResponse> r2 = service.list(ADMIN, new ExerciseService.Filter("  ĐẨY NGỰC  ", null, null, null, null, null, false));
        assertThat(r2).extracting(ExerciseResponse::id).containsExactly(1L);

        // 3. Khớp thiết bị (equipment): "  máy leg  "
        List<ExerciseResponse> r3 = service.list(ADMIN, new ExerciseService.Filter("  máy leg  ", null, null, null, null, null, false));
        assertThat(r3).extracting(ExerciseResponse::id).containsExactly(2L);

        // 4. Khớp nhiều bài qua equipment "Đòn tạ": "  đòn tạ  "
        List<ExerciseResponse> r4 = service.list(ADMIN, new ExerciseService.Filter("  đòn tạ  ", null, null, null, null, null, false));
        assertThat(r4).extracting(ExerciseResponse::id).containsExactly(1L, 4L);
    }

    // ==========================================
    // EX-02: Xem chi tiết bài tập
    // ==========================================

    @Test
    @DisplayName("EX-02: Hội viên get() bài ẩn thì nhận 404, HLV vẫn xem được")
    void get_hiddenExercise_memberGets404_trainerCanView() {
        Exercise hidden = createExercise(10L, "Bài tập ẩn", "Hidden Exercise", MuscleGroup.CHEST, Level.BEGINNER, ExerciseLocation.GYM, null, true);
        when(exerciseRepository.findById(10L)).thenReturn(Optional.of(hidden));

        // Hội viên xem bài ẩn -> 404 Not Found
        assertThatThrownBy(() -> service.get(MEMBER, 10L))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        // HLV xem bài ẩn -> thành công
        ExerciseResponse trainerRes = service.get(TRAINER, 10L);
        assertThat(trainerRes).isNotNull();
        assertThat(trainerRes.id()).isEqualTo(10L);

        // Quản lý xem bài ẩn -> thành công
        ExerciseResponse adminRes = service.get(ADMIN, 10L);
        assertThat(adminRes).isNotNull();
        assertThat(adminRes.id()).isEqualTo(10L);

        // Bài không ẩn -> hội viên xem bình thường
        hidden.setHidden(false);
        ExerciseResponse memberRes = service.get(MEMBER, 10L);
        assertThat(memberRes).isNotNull();
        assertThat(memberRes.id()).isEqualTo(10L);
    }

    // ==========================================
    // EX-06: Ẩn / hiện bài tập
    // ==========================================

    @Test
    @DisplayName("EX-06: setHidden(true) rồi setHidden(false) đổi đúng cờ và ghi đúng 2 loại audit")
    void setHidden_togglesFlag_andLogsAuditCorrectly() {
        Exercise exercise = createExercise(15L, "Hít xà đơn", "Pull-up", MuscleGroup.BACK, Level.INTERMEDIATE, ExerciseLocation.ANY, "Xà đơn", false);
        when(exerciseRepository.findById(15L)).thenReturn(Optional.of(exercise));

        // 1. Ẩn bài tập
        ExerciseResponse resHide = service.setHidden(15L, true);
        assertThat(exercise.isHidden()).isTrue();
        assertThat(resHide.hidden()).isTrue();
        verify(auditService).log(eq("EXERCISE_HIDE"), eq("EXERCISE"), eq(15L), eq("Hít xà đơn"));

        // 2. Hiện bài tập
        ExerciseResponse resShow = service.setHidden(15L, false);
        assertThat(exercise.isHidden()).isFalse();
        assertThat(resShow.hidden()).isFalse();
        verify(auditService).log(eq("EXERCISE_SHOW"), eq("EXERCISE"), eq(15L), eq("Hít xà đơn"));
    }

    // ==========================================
    // EX-07: Xoá bài tập (RESTRICT khi đang có giáo án dùng)
    // ==========================================

    @Test
    @DisplayName("EX-07: Bài đang nằm trong giáo án thì delete() ném 409, không gọi exerciseRepository.delete và không ghi audit")
    void delete_exerciseInUseByWorkoutPlan_throwsConflict409_doesNotDeleteOrAudit() {
        Exercise inUse = createExercise(20L, "Bài tập đang dùng", "Used Exercise", MuscleGroup.CHEST, Level.BEGINNER, ExerciseLocation.GYM, null, false);
        when(exerciseRepository.findById(20L)).thenReturn(Optional.of(inUse));
        when(planItemRepository.existsByExerciseId(20L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(20L))
                .isInstanceOf(ApiException.class)
                .hasMessage("Bài tập đang được dùng trong giáo án, hãy ẩn thay vì xoá")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

        verify(exerciseRepository, never()).delete(any());
        verify(auditService, never()).log(anyString(), anyString(), any(), any());
    }

    @Test
    @DisplayName("EX-07: Bài chưa dùng trong giáo án thì xoá được và ghi audit EXERCISE_DELETE")
    void delete_unusedExercise_succeeds_andLogsExerciseDeleteAudit() {
        Exercise unused = createExercise(25L, "Bài tập chưa dùng", "Unused Exercise", MuscleGroup.ARMS, Level.BEGINNER, ExerciseLocation.GYM, null, false);
        when(exerciseRepository.findById(25L)).thenReturn(Optional.of(unused));
        when(planItemRepository.existsByExerciseId(25L)).thenReturn(false);

        service.delete(25L);

        verify(exerciseRepository).delete(unused);
        verify(auditService).log(eq("EXERCISE_DELETE"), eq("EXERCISE"), eq(25L), eq("Bài tập chưa dùng"));
    }

    // ==========================================
    // Xoá id không tồn tại
    // ==========================================

    @Test
    @DisplayName("Xoá id không tồn tại thì trả 404 Not Found")
    void delete_nonExistentId_throwsNotFound404() {
        when(exerciseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(999L))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        verify(planItemRepository, never()).existsByExerciseId(any());
        verify(exerciseRepository, never()).delete(any());
        verify(auditService, never()).log(anyString(), anyString(), any(), any());
    }
}
