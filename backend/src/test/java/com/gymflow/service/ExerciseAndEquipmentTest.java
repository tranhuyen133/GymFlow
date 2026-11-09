package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.PageResponse;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.ContentSourceRepository;
import com.gymflow.repository.EquipmentRepository;
import com.gymflow.repository.ExerciseRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.repository.WorkoutPlanItemRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExerciseAndEquipmentTest {

    private static final AuthUser ADMIN = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
    private static final AuthUser TRAINER = new AuthUser(2L, "trainer@gymflow.vn", Role.TRAINER, "HLV Huy");
    private static final AuthUser MEMBER = new AuthUser(3L, "member@gymflow.vn", Role.MEMBER, "Hội viên Linh");

    @Mock EquipmentRepository equipmentRepository;
    @Mock ExerciseRepository exerciseRepository;
    @Mock ContentSourceRepository sourceRepository;
    @Mock WorkoutPlanItemRepository planItemRepository;
    @Mock UserRepository userRepository;
    @Mock AuditService auditService;

    Mappers mappers;
    EquipmentService equipmentService;
    ExerciseService exerciseService;

    @BeforeEach
    void setUp() {
        mappers = new Mappers(null, null, planItemRepository, null, null, null);
        equipmentService = new EquipmentService(equipmentRepository, exerciseRepository, auditService, mappers);
        exerciseService = new ExerciseService(exerciseRepository, sourceRepository, planItemRepository, userRepository, auditService, mappers);
    }

    private Equipment createEquipment(String key, String name, EquipmentCategory category, boolean hidden, ReviewStatus status) {
        Equipment eq = new Equipment();
        eq.setKey(key);
        eq.setName(name);
        eq.setCategory(category);
        eq.setHidden(hidden);
        eq.setReviewStatus(status);
        eq.setTargetMuscleKeys("chest,triceps");
        eq.setOrigin(ContentOrigin.SELF_AUTHORED);
        return eq;
    }

    private Exercise createExercise(Long id, String name, String equipmentKeys, boolean hidden, ReviewStatus status) {
        Exercise ex = new Exercise();
        ex.setId(id);
        ex.setName(name);
        ex.setNameEn("Exercise " + id);
        ex.setMuscleGroup(MuscleGroup.CHEST);
        ex.setLevel(Level.BEGINNER);
        ex.setLocation(ExerciseLocation.GYM);
        ex.setEquipmentKeys(equipmentKeys);
        ex.setHidden(hidden);
        ex.setReviewStatus(status);
        ex.setContentOrigin(ContentOrigin.SELF_AUTHORED);
        return ex;
    }

    @Nested
    @DisplayName("1. Truy vấn Dụng cụ (Equipment query & exercise counting)")
    class EquipmentQueryTests {

        @Test
        @DisplayName("Hội viên chỉ thấy dụng cụ đã duyệt và không ẩn, số lượng bài tập đếm đúng bài hợp lệ")
        void list_memberOnlySeesApprovedAndVisibleEquipment_withCorrectExerciseCount() {
            Equipment eqBarbell = createEquipment("barbell", "Đòn tạ", EquipmentCategory.FREE_WEIGHT, false, ReviewStatus.APPROVED);
            Equipment eqPending = createEquipment("smith-machine", "Máy Smith", EquipmentCategory.MACHINE, false, ReviewStatus.PENDING);
            Equipment eqHidden = createEquipment("foam-roller", "Con lăn xốp", EquipmentCategory.RECOVERY, true, ReviewStatus.APPROVED);

            when(equipmentRepository.findByHiddenFalseAndReviewStatusOrderBySortOrderAscNameAsc(ReviewStatus.APPROVED))
                    .thenReturn(List.of(eqBarbell));

            Exercise e1 = createExercise(1L, "Đẩy ngực đòn tạ", "barbell", false, ReviewStatus.APPROVED);
            Exercise e2 = createExercise(2L, "Deadlift", "barbell", false, ReviewStatus.APPROVED);
            Exercise eHidden = createExercise(3L, "Squat ẩn", "barbell", true, ReviewStatus.APPROVED);
            Exercise ePending = createExercise(4L, "Gánh tạ chưa duyệt", "barbell", false, ReviewStatus.PENDING);
            Exercise eOther = createExercise(5L, "Kéo cáp", "cable", false, ReviewStatus.APPROVED);

            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(e1, e2, eHidden, ePending, eOther));

            List<EquipmentResponse> result = equipmentService.list(MEMBER, false);

            assertThat(result).hasSize(1);
            EquipmentResponse item = result.get(0);
            assertThat(item.key()).isEqualTo("barbell");
            assertThat(item.name()).isEqualTo("Đòn tạ");
            assertThat(item.exerciseCount()).isEqualTo(2L); // eHidden and ePending are not counted!
        }

        @Test
        @DisplayName("Quản lý/HLV có includeHidden=true thì thấy tất cả dụng cụ bao gồm cả ẩn và chờ duyệt")
        void list_staffWithIncludeHidden_seesAllEquipment() {
            Equipment eq1 = createEquipment("barbell", "Đòn tạ", EquipmentCategory.FREE_WEIGHT, false, ReviewStatus.APPROVED);
            Equipment eq2 = createEquipment("smith-machine", "Máy Smith", EquipmentCategory.MACHINE, false, ReviewStatus.PENDING);
            Equipment eq3 = createEquipment("foam-roller", "Con lăn xốp", EquipmentCategory.RECOVERY, true, ReviewStatus.APPROVED);

            when(equipmentRepository.findAllByOrderBySortOrderAscNameAsc()).thenReturn(List.of(eq1, eq2, eq3));
            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of());

            List<EquipmentResponse> adminResult = equipmentService.list(ADMIN, true);
            assertThat(adminResult).hasSize(3);

            List<EquipmentResponse> trainerResult = equipmentService.list(TRAINER, true);
            assertThat(trainerResult).hasSize(3);
        }

        @Test
        @DisplayName("Hội viên xem chi tiết dụng cụ ẩn hoặc chưa duyệt sẽ bị 404, quản lý xem được bình thường")
        void get_hiddenOrPendingEquipment_memberGets404_staffCanView() {
            Equipment hiddenEq = createEquipment("foam-roller", "Con lăn xốp", EquipmentCategory.RECOVERY, true, ReviewStatus.APPROVED);
            when(equipmentRepository.findById("foam-roller")).thenReturn(Optional.of(hiddenEq));

            assertThatThrownBy(() -> equipmentService.get(MEMBER, "foam-roller"))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of());
            EquipmentDetailResponse staffDetail = equipmentService.get(TRAINER, "foam-roller");
            assertThat(staffDetail.key()).isEqualTo("foam-roller");
            assertThat(staffDetail.hidden()).isTrue();
        }
    }

    @Nested
    @DisplayName("2. Kiểm định URL video (Validate & Transform video_url)")
    class VideoUrlValidationTests {

        @Test
        @DisplayName("Chuyển đổi URL YouTube dạng watch/youtu.be/embed sang youtube-nocookie.com/embed")
        void sanitizeVideoUrl_transformsValidYoutubeUrls() {
            String watchUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
            String shortUrl = "https://youtu.be/dQw4w9WgXcQ";
            String embedUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";
            String watchWithParams = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s";

            String expected = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
            assertThat(ExerciseService.sanitizeVideoUrl(watchUrl)).isEqualTo(expected);
            assertThat(ExerciseService.sanitizeVideoUrl(shortUrl)).isEqualTo(expected);
            assertThat(ExerciseService.sanitizeVideoUrl(embedUrl)).isEqualTo(expected);
            assertThat(ExerciseService.sanitizeVideoUrl(watchWithParams)).isEqualTo(expected);
        }

        @Test
        @DisplayName("Chuyển đổi URL Vimeo sang player.vimeo.com/video")
        void sanitizeVideoUrl_transformsValidVimeoUrls() {
            String vimeoUrl = "https://vimeo.com/76979871";
            String playerUrl = "https://player.vimeo.com/video/76979871";

            String expected = "https://player.vimeo.com/video/76979871";
            assertThat(ExerciseService.sanitizeVideoUrl(vimeoUrl)).isEqualTo(expected);
            assertThat(ExerciseService.sanitizeVideoUrl(playerUrl)).isEqualTo(expected);
        }

        @Test
        @DisplayName("URL rỗng hoặc null trả về null")
        void sanitizeVideoUrl_emptyOrNull_returnsNull() {
            assertThat(ExerciseService.sanitizeVideoUrl(null)).isNull();
            assertThat(ExerciseService.sanitizeVideoUrl("")).isNull();
            assertThat(ExerciseService.sanitizeVideoUrl("   ")).isNull();
        }

        @Test
        @DisplayName("URL không thuộc YouTube/Vimeo bị từ chối với mã lỗi 400 Bad Request")
        void sanitizeVideoUrl_invalidOrUnknownDomains_throws400BadRequest() {
            List<String> invalidUrls = List.of(
                    "https://tiktok.com/@user/video/123456",
                    "https://facebook.com/reel/123456",
                    "https://example.com/demo.mp4",
                    "https://malicious.site/video",
                    "javascript:alert(1)"
            );

            for (String url : invalidUrls) {
                assertThatThrownBy(() -> ExerciseService.sanitizeVideoUrl(url))
                        .isInstanceOf(ApiException.class)
                        .hasMessage("Chỉ chấp nhận link video từ YouTube hoặc Vimeo")
                        .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
            }
        }
    }

    @Nested
    @DisplayName("3. Phân quyền (Role Authorization: MEMBER gets 403)")
    class RoleAuthorizationTests {

        @Test
        @DisplayName("Hội viên gọi tạo hoặc cập nhật dụng cụ bị chặn với mã 403 Forbidden")
        void equipmentMutations_memberGets403Forbidden() {
            EquipmentRequest req = new EquipmentRequest("barbell", "Đòn tạ", EquipmentCategory.FREE_WEIGHT,
                    "Mô tả", "Hướng dẫn", "An toàn", List.of("chest"), null, 1, false);

            assertThatThrownBy(() -> equipmentService.create(MEMBER, req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

            assertThatThrownBy(() -> equipmentService.update(MEMBER, "barbell", req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

            assertThatThrownBy(() -> equipmentService.setHidden(MEMBER, "barbell", true))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        }

        @Test
        @DisplayName("HLV duyệt dụng cụ bị chặn với mã 403 (chỉ Admin mới được duyệt)")
        void equipmentReview_trainerGets403Forbidden() {
            ReviewRequest req = new ReviewRequest(ReviewStatus.APPROVED, "Duyệt");
            assertThatThrownBy(() -> equipmentService.review(TRAINER, "barbell", req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        }

        @Test
        @DisplayName("Hội viên gọi tạo hoặc cập nhật bài tập bị chặn với mã 403 Forbidden")
        void exerciseMutations_memberGets403Forbidden() {
            ExerciseRequest req = new ExerciseRequest("Đẩy tạ đơn", MuscleGroup.CHEST, "Dumbbell",
                    Level.BEGINNER, "Mô tả", "Hướng dẫn", null, "Dumbbell Press", null, null,
                    ExerciseLocation.GYM, List.of(ExerciseGoal.STRENGTH), null, null, null,
                    null, null, ContentOrigin.SELF_AUTHORED, List.of(), List.of("chest"),
                    List.of(), List.of("dumbbell"), null, "Tư thế chuẩn bị", "Bước thực hiện",
                    "3 hiệp x 10 lần", ExerciseGoal.STRENGTH, List.of());

            assertThatThrownBy(() -> exerciseService.create(MEMBER, req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

            assertThatThrownBy(() -> exerciseService.update(MEMBER, 1L, req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        }
    }

    @Nested
    @DisplayName("4. Tìm kiếm không dấu tiếng Việt (Unaccented search)")
    class UnaccentedSearchTests {

        @Test
        @DisplayName("Từ khoá không dấu 'day ta' khớp chính xác bài 'Đẩy tạ đơn'")
        void list_unaccentedSearch_matchesAccentedNames() {
            Exercise e1 = createExercise(1L, "Đẩy tạ đơn", "dumbbell", false, ReviewStatus.APPROVED);
            Exercise e2 = createExercise(2L, "Kéo xà đơn", "pullup-bar", false, ReviewStatus.APPROVED);
            Exercise e3 = createExercise(3L, "Gánh tạ đòn", "barbell", false, ReviewStatus.APPROVED);

            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(e1, e2, e3));

            ExerciseService.Filter filter = new ExerciseService.Filter("day ta", null, null, null, null, null, null, null, false);
            List<ExerciseResponse> results = exerciseService.list(MEMBER, filter);

            assertThat(results).hasSize(1);
            assertThat(results.get(0).name()).isEqualTo("Đẩy tạ đơn");
        }

        @Test
        @DisplayName("Từ khoá không dấu 'keo xa' khớp 'Kéo xà đơn', 'ganh ta' khớp 'Gánh tạ đòn'")
        void list_unaccentedSearch_matchesOtherVietnameseCharacters() {
            Exercise e1 = createExercise(1L, "Đẩy tạ đơn", "dumbbell", false, ReviewStatus.APPROVED);
            Exercise e2 = createExercise(2L, "Kéo xà đơn", "pullup-bar", false, ReviewStatus.APPROVED);
            Exercise e3 = createExercise(3L, "Gánh tạ đòn", "barbell", false, ReviewStatus.APPROVED);

            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(e1, e2, e3));

            List<ExerciseResponse> rKeoXa = exerciseService.list(MEMBER,
                    new ExerciseService.Filter("keo xa", null, null, null, null, null, null, null, false));
            assertThat(rKeoXa).hasSize(1);
            assertThat(rKeoXa.get(0).name()).isEqualTo("Kéo xà đơn");

            List<ExerciseResponse> rGanhTa = exerciseService.list(MEMBER,
                    new ExerciseService.Filter("ganh ta", null, null, null, null, null, null, null, false));
            assertThat(rGanhTa).hasSize(1);
            assertThat(rGanhTa.get(0).name()).isEqualTo("Gánh tạ đòn");
        }
    }

    @Nested
    @DisplayName("5. Quan hệ bài tập thay thế (Alternative Exercises)")
    class AlternativeExercisesTests {

        @Test
        @DisplayName("Trả đúng danh sách bài thay thế trong ExerciseResponse")
        void exerciseDetail_returnsMappedAlternatives() {
            Exercise main = createExercise(10L, "Bench Press", "barbell", false, ReviewStatus.APPROVED);
            Exercise alt1 = createExercise(11L, "Dumbbell Press", "dumbbell", false, ReviewStatus.APPROVED);
            Exercise alt2 = createExercise(12L, "Push-up", "bodyweight", false, ReviewStatus.APPROVED);

            main.setAlternatives(new LinkedHashSet<>(List.of(alt1, alt2)));

            when(exerciseRepository.findById(10L)).thenReturn(Optional.of(main));

            ExerciseResponse res = exerciseService.get(MEMBER, 10L);
            assertThat(res.alternatives()).hasSize(2);
            assertThat(res.alternatives()).extracting(ExerciseSummary::name)
                    .containsExactly("Dumbbell Press", "Push-up");
        }

        @Test
        @DisplayName("Không cho phép bài tập tự trỏ chính nó làm bài thay thế và loại bỏ id trùng lặp")
        void apply_alternativeIds_excludesSelfAndDeduplicates() {
            Exercise main = createExercise(10L, "Bench Press", "barbell", false, ReviewStatus.APPROVED);
            when(exerciseRepository.findById(10L)).thenReturn(Optional.of(main));

            Exercise alt = createExercise(11L, "Dumbbell Press", "dumbbell", false, ReviewStatus.APPROVED);
            when(exerciseRepository.findAllById(List.of(11L))).thenReturn(List.of(alt));

            // Gửi id của chính bài tập (10L) và trùng lặp id (11L, 11L)
            ExerciseRequest req = new ExerciseRequest("Bench Press Sửa", MuscleGroup.CHEST, "Barbell",
                    Level.INTERMEDIATE, "Mô tả", "Hướng dẫn", null, "Bench Press", null, null,
                    ExerciseLocation.GYM, List.of(ExerciseGoal.STRENGTH), null, null, null,
                    null, null, ContentOrigin.SELF_AUTHORED, List.of(), List.of("chest"),
                    List.of(), List.of("barbell"), null, "Tư thế", "Các bước",
                    "3x10", ExerciseGoal.STRENGTH, List.of(10L, 11L, 11L));

            ExerciseResponse updated = exerciseService.update(ADMIN, 10L, req);

            assertThat(main.getAlternatives()).hasSize(1);
            assertThat(main.getAlternatives().iterator().next().getId()).isEqualTo(11L);
        }
    }

    @Nested
    @DisplayName("6. Phân trang danh sách bài tập (Pagination)")
    class PaginationTests {

        @Test
        @DisplayName("listPaged phân chia trang và tính toán tổng số trang chính xác")
        void listPaged_returnsExpectedPageAndSlice() {
            List<Exercise> all = new ArrayList<>();
            for (long i = 1; i <= 7; i++) {
                all.add(createExercise(i, "Bài tập " + i, "barbell", false, ReviewStatus.APPROVED));
            }
            when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(all);

            ExerciseService.Filter filter = new ExerciseService.Filter("", null, null, null, null, null, null, null, false);

            // Trang 0, size 3: bài 1, 2, 3
            PageResponse<ExerciseResponse> page0 = exerciseService.listPaged(ADMIN, filter, 0, 3);
            assertThat(page0.content()).hasSize(3);
            assertThat(page0.page()).isEqualTo(0);
            assertThat(page0.size()).isEqualTo(3);
            assertThat(page0.totalElements()).isEqualTo(7);
            assertThat(page0.totalPages()).isEqualTo(3);
            assertThat(page0.content().get(0).name()).isEqualTo("Bài tập 1");

            // Trang 1, size 3: bài 4, 5, 6
            PageResponse<ExerciseResponse> page1 = exerciseService.listPaged(ADMIN, filter, 1, 3);
            assertThat(page1.content()).hasSize(3);
            assertThat(page1.page()).isEqualTo(1);
            assertThat(page1.content().get(0).name()).isEqualTo("Bài tập 4");

            // Trang 2, size 3: bài 7
            PageResponse<ExerciseResponse> page2 = exerciseService.listPaged(ADMIN, filter, 2, 3);
            assertThat(page2.content()).hasSize(1);
            assertThat(page2.page()).isEqualTo(2);
            assertThat(page2.content().get(0).name()).isEqualTo("Bài tập 7");

            // Trang vượt quá tổng số: trả về mảng rỗng
            PageResponse<ExerciseResponse> page3 = exerciseService.listPaged(ADMIN, filter, 3, 3);
            assertThat(page3.content()).isEmpty();
            assertThat(page3.page()).isEqualTo(3);
            assertThat(page3.totalElements()).isEqualTo(7);
        }
    }
}
