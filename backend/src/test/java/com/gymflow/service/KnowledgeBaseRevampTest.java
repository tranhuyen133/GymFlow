package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.PageResponse;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.dto.KnowledgeDtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KnowledgeBaseRevampTest {

    private static final AuthUser ADMIN = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
    private static final AuthUser TRAINER = new AuthUser(2L, "trainer@gymflow.vn", Role.TRAINER, "HLV Nam");
    private static final AuthUser MEMBER = new AuthUser(3L, "member@gymflow.vn", Role.MEMBER, "Hội viên Linh");

    @Mock ExerciseRepository exerciseRepository;
    @Mock EquipmentRepository equipmentRepository;
    @Mock ContentSourceRepository sourceRepository;
    @Mock WorkoutPlanItemRepository planItemRepository;
    @Mock UserRepository userRepository;
    @Mock AuditService auditService;
    @Mock MemberFavoriteExerciseRepository favoriteRepository;
    @Mock AccessService accessService;

    Mappers mappers;
    ExerciseService exerciseService;
    EquipmentService equipmentService;
    MuscleService muscleService;

    private Member dummyMember;

    @BeforeEach
    void setUp() {
        mappers = new Mappers(null, null, planItemRepository, null, null, null);
        exerciseService = new ExerciseService(
                exerciseRepository, equipmentRepository, sourceRepository,
                planItemRepository, userRepository, auditService, mappers,
                favoriteRepository, accessService
        );
        equipmentService = new EquipmentService(equipmentRepository, exerciseRepository, auditService, mappers);
        muscleService = new MuscleService(exerciseRepository, equipmentRepository, mappers);

        User u = new User();
        u.setId(3L);
        u.setEmail("member@gymflow.vn");
        dummyMember = new Member();
        dummyMember.setId(10L);
        dummyMember.setUser(u);
    }

    private Exercise makeExercise(Long id, String name, ExerciseType type, String subCategory,
                                 String targetMuscles, String secMuscles, String eqKeys, boolean hidden) {
        Exercise e = new Exercise();
        e.setId(id);
        e.setName(name);
        e.setNameEn(name + " En");
        e.setExerciseType(type);
        e.setSubCategory(subCategory);
        e.setMuscleGroup(MuscleGroup.CHEST);
        e.setLevel(Level.BEGINNER);
        e.setLocation(ExerciseLocation.GYM);
        e.setTargetMuscles(targetMuscles);
        e.setSecondaryMuscleKeys(secMuscles);
        e.setEquipmentKeys(eqKeys);
        e.setHidden(hidden);
        e.setReviewStatus(ReviewStatus.APPROVED);
        e.setContentOrigin(ContentOrigin.SELF_AUTHORED);
        return e;
    }

    private Equipment makeEquipment(String key, String name, EquipmentCategory category, String targetMuscles) {
        Equipment eq = new Equipment();
        eq.setKey(key);
        eq.setName(name);
        eq.setCategory(category);
        eq.setTargetMuscleKeys(targetMuscles);
        eq.setHidden(false);
        eq.setReviewStatus(ReviewStatus.APPROVED);
        eq.setOrigin(ContentOrigin.SELF_AUTHORED);
        return eq;
    }

    @Nested
    @DisplayName("1. Lọc kết hợp theo ExerciseType và SubCategory")
    class ExerciseFilteringTests {

        @Test
        @DisplayName("Lọc đúng theo ExerciseType STRENGTH, WARMUP, CARDIO")
        void testFilterByType() {
            Exercise exStrength = makeExercise(1L, "Đẩy ngực ngang", ExerciseType.STRENGTH, "Ngực", "chest", null, "barbell", false);
            Exercise exWarmup = makeExercise(2L, "Xoay khớp vai", ExerciseType.WARMUP, "Khởi động vai", "front-deltoids", null, "bodyweight", false);
            Exercise exCardio = makeExercise(3L, "Chạy bộ máy", ExerciseType.CARDIO, "Chạy bộ", "quadriceps,calves", null, "cardio-machine", false);

            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(exStrength, exWarmup, exCardio));

            ExerciseService.Filter filterWarmup = new ExerciseService.Filter(
                    null, null, null, null, null, null, null, null,
                    ExerciseType.WARMUP, null, null, null, false
            );
            List<ExerciseResponse> warmupResults = exerciseService.list(MEMBER, filterWarmup);
            assertThat(warmupResults).hasSize(1);
            assertThat(warmupResults.get(0).id()).isEqualTo(2L);
            assertThat(warmupResults.get(0).exerciseType()).isEqualTo(ExerciseType.WARMUP);

            ExerciseService.Filter filterCardio = new ExerciseService.Filter(
                    null, null, null, null, null, null, null, null,
                    ExerciseType.CARDIO, null, null, null, false
            );
            List<ExerciseResponse> cardioResults = exerciseService.list(MEMBER, filterCardio);
            assertThat(cardioResults).hasSize(1);
            assertThat(cardioResults.get(0).id()).isEqualTo(3L);
        }

        @Test
        @DisplayName("Lọc theo danh mục con (subCategory) không phân biệt dấu và hoa thường")
        void testFilterBySubCategory() {
            Exercise ex1 = makeExercise(1L, "Xoay khớp vai", ExerciseType.WARMUP, "Khởi động vai", "front-deltoids", null, null, false);
            Exercise ex2 = makeExercise(2L, "Xoay hông", ExerciseType.WARMUP, "Khởi động hông", "gluteal", null, null, false);

            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(ex1, ex2));

            ExerciseService.Filter filter = new ExerciseService.Filter(
                    null, null, null, null, null, null, null, null,
                    ExerciseType.WARMUP, "khoi dong vai", null, null, false
            );
            List<ExerciseResponse> results = exerciseService.list(MEMBER, filter);
            assertThat(results).hasSize(1);
            assertThat(results.get(0).name()).isEqualTo("Xoay khớp vai");
        }
    }

    @Nested
    @DisplayName("2. Bài tập yêu thích và Bài được Trainer giao")
    class FavoriteAndAssignedTests {

        @Test
        @DisplayName("Hội viên lọc favoriteOnly chỉ ra bài đã lưu vào danh sách yêu thích")
        void testFilterFavoriteOnly() {
            Exercise ex1 = makeExercise(1L, "Bài 1", ExerciseType.STRENGTH, "Ngực", "chest", null, null, false);
            Exercise ex2 = makeExercise(2L, "Bài 2", ExerciseType.STRENGTH, "Lưng", "upper-back", null, null, false);

            when(accessService.requireMemberOf(MEMBER)).thenReturn(dummyMember);
            when(favoriteRepository.findExerciseIdsByMemberId(10L)).thenReturn(List.of(2L));
            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(ex1, ex2));

            ExerciseService.Filter filter = new ExerciseService.Filter(
                    null, null, null, null, null, null, null, null,
                    null, null, true, null, false
            );
            List<ExerciseResponse> results = exerciseService.list(MEMBER, filter);
            assertThat(results).hasSize(1);
            assertThat(results.get(0).id()).isEqualTo(2L);
            assertThat(results.get(0).isFavorite()).isTrue();
        }

        @Test
        @DisplayName("Hội viên lọc assignedOnly chỉ ra bài nằm trong giáo án ACTIVE hiện tại")
        void testFilterAssignedOnly() {
            Exercise ex1 = makeExercise(1L, "Bài 1", ExerciseType.STRENGTH, "Ngực", "chest", null, null, false);
            Exercise ex2 = makeExercise(2L, "Bài 2", ExerciseType.STRENGTH, "Lưng", "upper-back", null, null, false);

            when(accessService.requireMemberOf(MEMBER)).thenReturn(dummyMember);
            when(favoriteRepository.findExerciseIdsByMemberId(10L)).thenReturn(List.of());
            when(planItemRepository.findActiveAssignedExerciseIdsByMemberId(10L)).thenReturn(List.of(1L));
            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(ex1, ex2));

            ExerciseService.Filter filter = new ExerciseService.Filter(
                    null, null, null, null, null, null, null, null,
                    null, null, null, true, false
            );
            List<ExerciseResponse> results = exerciseService.list(MEMBER, filter);
            assertThat(results).hasSize(1);
            assertThat(results.get(0).id()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Toggle yêu thích: thêm mới khi chưa có, xoá khi đã có")
        void testToggleFavorite() {
            Exercise ex = makeExercise(5L, "Bài test", ExerciseType.STRENGTH, "Ngực", "chest", null, null, false);
            when(accessService.requireMemberOf(MEMBER)).thenReturn(dummyMember);
            when(exerciseRepository.findById(5L)).thenReturn(Optional.of(ex));

            // Lần 1: Chưa có -> lưu mới
            when(favoriteRepository.findByMemberIdAndExerciseId(10L, 5L)).thenReturn(Optional.empty());
            when(favoriteRepository.countByMemberId(10L)).thenReturn(1L);

            FavoriteToggleResponse res1 = exerciseService.toggleFavorite(MEMBER, 5L);
            assertThat(res1.isFavorite()).isTrue();
            assertThat(res1.favoriteCount()).isEqualTo(1L);
            verify(favoriteRepository, times(1)).save(any(MemberFavoriteExercise.class));

            // Lần 2: Đã có -> xoá
            MemberFavoriteExercise mfe = new MemberFavoriteExercise(dummyMember, ex);
            when(favoriteRepository.findByMemberIdAndExerciseId(10L, 5L)).thenReturn(Optional.of(mfe));
            when(favoriteRepository.countByMemberId(10L)).thenReturn(0L);

            FavoriteToggleResponse res2 = exerciseService.toggleFavorite(MEMBER, 5L);
            assertThat(res2.isFavorite()).isFalse();
            assertThat(res2.favoriteCount()).isEqualTo(0L);
            verify(favoriteRepository, times(1)).delete(mfe);
        }

        @Test
        @DisplayName("Chỉ Member mới được dùng chức năng yêu thích, Trainer/Admin gọi sẽ bị chặn 403")
        void testFavoriteRoleProtection() {
            assertThatThrownBy(() -> exerciseService.getFavorites(TRAINER))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Chỉ hội viên");

            assertThatThrownBy(() -> exerciseService.toggleFavorite(ADMIN, 1L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Chỉ hội viên");
        }
    }

    @Nested
    @DisplayName("3. Phân trang bài tập liên quan tới thiết bị")
    class EquipmentExercisesPagedTests {

        @Test
        @DisplayName("Equipment getExercisesPaged trả đúng phân trang và số bài tập liên quan")
        void testGetExercisesPaged() {
            Equipment eq = makeEquipment("barbell", "Thanh đòn", EquipmentCategory.FREE_WEIGHT, "chest");
            when(equipmentRepository.findById("barbell")).thenReturn(Optional.of(eq));

            Exercise e1 = makeExercise(1L, "Bài đòn 1", ExerciseType.STRENGTH, "Ngực", "chest", null, "barbell", false);
            Exercise e2 = makeExercise(2L, "Bài đòn 2", ExerciseType.STRENGTH, "Ngực", "chest", null, "barbell", false);
            Exercise e3 = makeExercise(3L, "Bài đòn 3", ExerciseType.STRENGTH, "Lưng", "upper-back", null, "barbell", false);

            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(e1, e2, e3));

            PageResponse<ExerciseResponse> page = equipmentService.getExercisesPaged(MEMBER, "barbell", 0, 2);
            assertThat(page.content()).hasSize(2);
            assertThat(page.totalElements()).isEqualTo(3);
            assertThat(page.totalPages()).isEqualTo(2);
            assertThat(page.page()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("4. Dịch vụ kiến thức nhóm cơ (MuscleService)")
    class MuscleServiceTests {

        @Test
        @DisplayName("listMuscles trả về đầy đủ 18 vùng cơ với số lượng bài tập")
        void testListMuscles() {
            Exercise e1 = makeExercise(1L, "Hít đất", ExerciseType.STRENGTH, "Ngực", "chest", "triceps", "bodyweight", false);
            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(e1));

            List<MuscleSummaryResponse> muscles = muscleService.listMuscles(MEMBER);
            assertThat(muscles).hasSize(18);

            MuscleSummaryResponse chest = muscles.stream().filter(m -> m.key().equals("chest")).findFirst().orElseThrow();
            assertThat(chest.exerciseCount()).isEqualTo(1L);
            assertThat(chest.name()).isEqualTo("Ngực");

            MuscleSummaryResponse triceps = muscles.stream().filter(m -> m.key().equals("triceps")).findFirst().orElseThrow();
            assertThat(triceps.exerciseCount()).isEqualTo(1L);
        }

        @Test
        @DisplayName("getMuscleDetail trả về bài tập chính, bài tập phụ và dụng cụ thường dùng")
        void testMuscleDetail() {
            Exercise primary = makeExercise(1L, "Đẩy ngực", ExerciseType.STRENGTH, "Ngực", "chest", "triceps", "barbell", false);
            Exercise secondary = makeExercise(2L, "Chống đẩy hẹp tay", ExerciseType.STRENGTH, "Tay sau", "triceps", "chest", "bodyweight", false);

            Equipment eq = makeEquipment("barbell", "Thanh đòn", EquipmentCategory.FREE_WEIGHT, "chest");

            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(primary, secondary));
            when(equipmentRepository.findByHiddenFalseOrderBySortOrderAscNameAsc()).thenReturn(List.of(eq));

            MuscleDetailResponse detail = muscleService.getMuscleDetail(MEMBER, "chest");
            assertThat(detail.key()).isEqualTo("chest");
            assertThat(detail.name()).isEqualTo("Ngực");
            assertThat(detail.primaryExercises()).hasSize(1);
            assertThat(detail.primaryExercises().get(0).id()).isEqualTo(1L);
            assertThat(detail.secondaryExercises()).hasSize(1);
            assertThat(detail.secondaryExercises().get(0).id()).isEqualTo(2L);
            assertThat(detail.commonEquipment()).hasSize(1);
            assertThat(detail.commonEquipment().get(0).key()).isEqualTo("barbell");
        }

        @Test
        @DisplayName("getMuscleDetail với key không hợp lệ trả về 404")
        void testMuscleNotFound() {
            assertThatThrownBy(() -> muscleService.getMuscleDetail(MEMBER, "invalid-muscle"))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("nhóm cơ");
        }
    }
}