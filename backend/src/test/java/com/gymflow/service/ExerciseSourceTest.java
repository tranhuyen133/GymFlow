package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/** SCRUM-205 · EX-04 gắn nguồn tham khảo cho bài tập, EX-05 duyệt bài tập (bổ sung cho ContentReviewTest). */
@ExtendWith(MockitoExtension.class)
class ExerciseSourceTest {

    @Mock ExerciseRepository exerciseRepository;
    @Mock EquipmentRepository equipmentRepository;
    @Mock ContentSourceRepository sourceRepository;
    @Mock WorkoutPlanItemRepository planItemRepository;
    @Mock UserRepository userRepository;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    ExerciseService exercises;

    static final AuthUser ADMIN = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
    static final AuthUser TRAINER = new AuthUser(2L, "trainer@gymflow.vn", Role.TRAINER, "HLV");

    @BeforeEach
    void setUp() {
        exercises = new ExerciseService(exerciseRepository, equipmentRepository, sourceRepository, planItemRepository, userRepository, auditService, mappers);
    }

    private static ContentSource source(long id) {
        ContentSource s = new ContentSource();
        s.setId(id);
        s.setCode("SRC_" + id);
        return s;
    }

    private Exercise approvedWithSource() {
        Exercise e = new Exercise();
        e.setId(10L);
        e.setName("Plank");
        e.setMuscleGroup(MuscleGroup.CORE);
        e.setReviewStatus(ReviewStatus.APPROVED);
        e.setSources(new LinkedHashSet<>(List.of(source(1))));
        when(exerciseRepository.findById(10L)).thenReturn(Optional.of(e));
        return e;
    }

    private static ExerciseRequest req(ContentOrigin origin, List<Long> sourceIds) {
        return new ExerciseRequest("Plank", MuscleGroup.CORE, "Thảm", Level.BEGINNER, null, null, null,
                null, null, null, null, null, null, null, null, null, null, origin, sourceIds);
    }

    @Test
    void createAttachesDistinctSourcesAndStartsPending() {
        when(sourceRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(source(1), source(2)));

        exercises.create(TRAINER, req(ContentOrigin.ADAPTED, List.of(1L, 2L, 1L)));

        ArgumentCaptor<Exercise> saved = ArgumentCaptor.forClass(Exercise.class);
        verify(exerciseRepository).save(saved.capture());
        assertThat(saved.getValue().getSources()).extracting(ContentSource::getId).containsExactly(1L, 2L);
        assertThat(saved.getValue().getContentOrigin()).isEqualTo(ContentOrigin.ADAPTED);
        assertThat(saved.getValue().getReviewStatus()).isEqualTo(ReviewStatus.PENDING);
    }

    @Test
    void unknownSourceIsRejectedAndNothingSaved() {
        when(sourceRepository.findAllById(List.of(1L, 99L))).thenReturn(List.of(source(1)));

        assertThatThrownBy(() -> exercises.create(ADMIN, req(ContentOrigin.SELF_AUTHORED, List.of(1L, 99L))))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("nguồn tham khảo không tồn tại")
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(exerciseRepository, never()).save(any());
    }

    @Test
    void adminCannotRemoveAllSourcesFromApprovedExercise() {
        Exercise e = approvedWithSource();

        assertThatThrownBy(() -> exercises.update(ADMIN, 10L, req(null, List.of())))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("ít nhất một nguồn")
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(e.getSources()).hasSize(1);
        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.APPROVED);
    }

    @Test
    void adminCanStillEditLegacyApprovedExerciseWithoutSources() {
        Exercise e = approvedWithSource();
        e.setSources(new LinkedHashSet<>());

        exercises.update(ADMIN, 10L, req(null, List.of()));

        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.APPROVED);
        assertThat(e.getSources()).isEmpty();
    }

    @Test
    void adminCanReplaceSourcesOfApprovedExercise() {
        Exercise e = approvedWithSource();
        when(sourceRepository.findAllById(List.of(2L))).thenReturn(List.of(source(2)));

        exercises.update(ADMIN, 10L, req(null, List.of(2L)));

        assertThat(e.getSources()).extracting(ContentSource::getId).containsExactly(2L);
        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.APPROVED);
    }

    @Test
    void trainerRemovingSourcesSendsExerciseBackToPending() {
        Exercise e = approvedWithSource();

        exercises.update(TRAINER, 10L, req(null, List.of()));

        assertThat(e.getSources()).isEmpty();
        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.PENDING);
        assertThat(e.getReviewedBy()).isNull();
    }

    @Test
    void needsReviewKeepsNoteAndRecordsReviewer() {
        Exercise e = approvedWithSource();
        when(userRepository.getReferenceById(1L)).thenReturn(new User());

        exercises.review(ADMIN, 10L, new ReviewRequest(ReviewStatus.NEEDS_REVIEW, "  Bổ sung lưu ý an toàn  "));

        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.NEEDS_REVIEW);
        assertThat(e.getReviewNote()).isEqualTo("Bổ sung lưu ý an toàn");
        assertThat(e.getReviewedBy()).isNotNull();
        assertThat(e.getReviewedAt()).isNotNull();
        verify(auditService).log(eq("EXERCISE_REVIEW"), eq("EXERCISE"), eq(10L), contains("NEEDS_REVIEW"));
    }
}
