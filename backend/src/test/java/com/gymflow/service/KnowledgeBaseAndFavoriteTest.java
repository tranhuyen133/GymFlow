package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.ExerciseResponse;
import com.gymflow.dto.Dtos.FavoriteSummaryResponse;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KnowledgeBaseAndFavoriteTest {

    private static final AuthUser MEMBER = new AuthUser(10L, "member@gymflow.vn", Role.MEMBER, "Hội viên An");

    @Mock FavoriteRepository favoriteRepository;
    @Mock UserRepository userRepository;
    @Mock ExerciseRepository exerciseRepository;
    @Mock EquipmentRepository equipmentRepository;
    @Mock ContentSourceRepository sourceRepository;
    @Mock WorkoutPlanItemRepository planItemRepository;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    FavoriteService favoriteService;
    ExerciseService exerciseService;
    EquipmentService equipmentService;

    @BeforeEach
    void setUp() {
        favoriteService = new FavoriteService(favoriteRepository, userRepository);
        exerciseService = new ExerciseService(exerciseRepository, equipmentRepository, sourceRepository,
                planItemRepository, userRepository, auditService, mappers, favoriteRepository);
        equipmentService = new EquipmentService(equipmentRepository, exerciseRepository,
                auditService, mappers, favoriteRepository);
    }

    @Test
    @DisplayName("FAV-01: Toggle bài tập yêu thích - thêm mới và xoá khi toggle lại")
    void toggleFavoriteExercise_addsAndRemoves() {
        User user = new User();
        user.setId(10L);
        when(userRepository.getReferenceById(10L)).thenReturn(user);
        when(favoriteRepository.findByUserIdAndTargetTypeAndTargetId(10L, "EXERCISE", "101"))
                .thenReturn(Optional.empty());

        boolean added = favoriteService.toggleExercise(MEMBER, 101L);
        assertThat(added).isTrue();
        verify(favoriteRepository).save(any(Favorite.class));

        Favorite existing = new Favorite(user, "EXERCISE", "101");
        when(favoriteRepository.findByUserIdAndTargetTypeAndTargetId(10L, "EXERCISE", "101"))
                .thenReturn(Optional.of(existing));

        boolean removed = favoriteService.toggleExercise(MEMBER, 101L);
        assertThat(removed).isFalse();
        verify(favoriteRepository).delete(existing);
    }

    @Test
    @DisplayName("FAV-02: Lấy danh sách ID yêu thích theo tài khoản hội viên")
    void getSummary_returnsCategorizedFavorites() {
        User user = new User();
        user.setId(10L);
        Favorite favEx = new Favorite(user, "EXERCISE", "201");
        Favorite favEq = new Favorite(user, "EQUIPMENT", "kettlebell");

        when(favoriteRepository.findByUserId(10L)).thenReturn(List.of(favEx, favEq));

        FavoriteSummaryResponse summary = favoriteService.getSummary(MEMBER);
        assertThat(summary.exerciseIds()).containsExactly(201L);
        assertThat(summary.equipmentKeys()).containsExactly("kettlebell");
    }

    @Test
    @DisplayName("EX-TYPE-01: Lọc bài tập theo loại (WARMUP / CARDIO / MAIN)")
    void list_filtersByExerciseType() {
        Exercise mainEx = new Exercise();
        mainEx.setId(1L);
        mainEx.setName("Bench Press");
        mainEx.setExerciseType(ExerciseType.MAIN);
        mainEx.setMuscleGroup(MuscleGroup.CHEST);

        Exercise warmupEx = new Exercise();
        warmupEx.setId(2L);
        warmupEx.setName("Khởi động xoay khớp");
        warmupEx.setExerciseType(ExerciseType.WARMUP);
        warmupEx.setSubCategory("joint_mobility");
        warmupEx.setMuscleGroup(MuscleGroup.FULL_BODY);

        Exercise cardioEx = new Exercise();
        cardioEx.setId(3L);
        cardioEx.setName("Chạy bộ máy");
        cardioEx.setExerciseType(ExerciseType.CARDIO);
        cardioEx.setSubCategory("running");
        cardioEx.setCardioIntensity("MEDIUM");
        cardioEx.setMuscleGroup(MuscleGroup.CARDIO);

        when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(mainEx, warmupEx, cardioEx));
        when(favoriteRepository.findByUserIdAndTargetType(10L, "EXERCISE")).thenReturn(List.of());

        lenient().when(mappers.exercise(any(Exercise.class), anyBoolean())).thenAnswer(inv -> {
            Exercise e = inv.getArgument(0);
            return new ExerciseResponse(e.getId(), e.getName(), e.getMuscleGroup(), null, Level.BEGINNER,
                    null, null, null, false, 0, null, null, null, null, null, List.of(),
                    null, null, null, null, null, ContentOrigin.SELF_AUTHORED,
                    ReviewStatus.APPROVED, null, null, null, null, List.of(),
                    List.of(), List.of(), List.of(), null, null, null, null, null, List.of(),
                    e.getExerciseType(), e.getSubCategory(), e.getCardioIntensity(), false);
        });

        // 1. Lọc WARMUP
        ExerciseService.Filter warmupFilter = new ExerciseService.Filter("", null, null, null, null,
                null, null, null, false, ExerciseType.WARMUP, null, null, false);
        List<ExerciseResponse> warmupList = exerciseService.list(MEMBER, warmupFilter);
        assertThat(warmupList).hasSize(1);
        assertThat(warmupList.get(0).name()).isEqualTo("Khởi động xoay khớp");

        // 2. Lọc CARDIO
        ExerciseService.Filter cardioFilter = new ExerciseService.Filter("", null, null, null, null,
                null, null, null, false, ExerciseType.CARDIO, "running", "MEDIUM", false);
        List<ExerciseResponse> cardioList = exerciseService.list(MEMBER, cardioFilter);
        assertThat(cardioList).hasSize(1);
        assertThat(cardioList.get(0).name()).isEqualTo("Chạy bộ máy");
    }
}
