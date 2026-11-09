package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/** Luồng duyệt nội dung: chỉ ADMIN duyệt/xuất bản, phải có nguồn, HLV sửa thì quay về chờ duyệt. */
@ExtendWith(MockitoExtension.class)
class ContentReviewTest {

    @Mock ExerciseRepository exerciseRepository;
    @Mock ContentSourceRepository sourceRepository;
    @Mock WorkoutPlanItemRepository planItemRepository;
    @Mock ArticleRepository articleRepository;
    @Mock UserRepository userRepository;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    ExerciseService exercises;
    ArticleService articles;

    static final AuthUser ADMIN = new AuthUser(1L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
    static final AuthUser TRAINER = new AuthUser(2L, "trainer@gymflow.vn", Role.TRAINER, "HLV");

    @BeforeEach
    void setUp() {
        exercises = new ExerciseService(exerciseRepository, sourceRepository, planItemRepository, userRepository, auditService, mappers);
        articles = new ArticleService(articleRepository, sourceRepository, userRepository, auditService, mappers);
    }

    private Exercise exercise(ReviewStatus status, boolean withSource) {
        Exercise e = new Exercise();
        e.setId(10L);
        e.setName("Plank");
        e.setMuscleGroup(MuscleGroup.CORE);
        e.setReviewStatus(status);
        if (withSource) e.setSources(new java.util.LinkedHashSet<>(Set.of(new ContentSource())));
        when(exerciseRepository.findById(10L)).thenReturn(Optional.of(e));
        return e;
    }

    private static ExerciseRequest exerciseReq() {
        return new ExerciseRequest("Plank", MuscleGroup.CORE, "Thảm", Level.BEGINNER, null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void approvingExerciseWithoutSourceIsRejected() {
        Exercise e = exercise(ReviewStatus.PENDING, false);
        assertThatThrownBy(() -> exercises.review(ADMIN, 10L, new ReviewRequest(ReviewStatus.APPROVED, null)))
                .isInstanceOf(ApiException.class)
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.PENDING);
    }

    @Test
    void needsReviewRequiresNote() {
        exercise(ReviewStatus.PENDING, true);
        assertThatThrownBy(() -> exercises.review(ADMIN, 10L, new ReviewRequest(ReviewStatus.NEEDS_REVIEW, "  ")))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void approvingExerciseRecordsReviewer() {
        Exercise e = complete(exercise(ReviewStatus.PENDING, true));
        when(userRepository.getReferenceById(1L)).thenReturn(new User());
        exercises.review(ADMIN, 10L, new ReviewRequest(ReviewStatus.APPROVED, null));
        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.APPROVED);
        assertThat(e.getReviewedBy()).isNotNull();
        assertThat(e.getReviewedAt()).isNotNull();
    }

    /** Điền đủ các mục trong checklist duyệt (mô tả, ≥ 2 bước, lưu ý an toàn, nơi tập, mục tiêu). */
    private static Exercise complete(Exercise e) {
        e.setDescription("Bài giữ thân trên cẳng tay, rèn sức bền cơ lõi.");
        e.setInstructions("1. Chống cẳng tay xuống thảm.\n2. Giữ thân thẳng từ đầu đến gót.");
        e.setSafetyNotes("Dừng nếu đau lưng.");
        e.setLocation(ExerciseLocation.ANY);
        e.setGoals("ENDURANCE");
        return e;
    }

    @Test
    void approvingIncompleteExerciseListsMissingItems() {
        Exercise e = exercise(ReviewStatus.PENDING, true);
        e.setInstructions("Chống tay và giữ thân thẳng.");
        assertThatThrownBy(() -> exercises.review(ADMIN, 10L, new ReviewRequest(ReviewStatus.APPROVED, null)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("ít nhất 2 bước")
                .hasMessageContaining("lưu ý an toàn");
        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.PENDING);
    }

    @Test
    void approveManySkipsIncompleteAndAlreadyApproved() {
        Exercise ready = complete(exercise(ReviewStatus.PENDING, true));
        Exercise missing = new Exercise();
        missing.setId(11L);
        missing.setName("Bài thiếu");
        Exercise done = new Exercise();
        done.setId(12L);
        done.setReviewStatus(ReviewStatus.APPROVED);
        when(exerciseRepository.findById(11L)).thenReturn(Optional.of(missing));
        when(exerciseRepository.findById(12L)).thenReturn(Optional.of(done));
        when(userRepository.getReferenceById(1L)).thenReturn(new User());

        BulkApproveResponse res = exercises.approveMany(ADMIN, new BulkApproveRequest(java.util.List.of(10L, 11L, 12L), null));

        assertThat(res.approved()).isEqualTo(1);
        assertThat(res.skipped()).hasSize(1);
        assertThat(res.skipped().get(0)).startsWith("Bài thiếu:");
        assertThat(ready.getReviewStatus()).isEqualTo(ReviewStatus.APPROVED);
        assertThat(missing.getReviewStatus()).isEqualTo(ReviewStatus.PENDING);
    }

    @Test
    void trainerEditOfApprovedExerciseGoesBackToPending() {
        Exercise e = exercise(ReviewStatus.APPROVED, true);
        exercises.update(TRAINER, 10L, exerciseReq());
        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.PENDING);
        assertThat(e.getReviewedBy()).isNull();
        // sourceIds = null → giữ nguyên nguồn đang gắn
        assertThat(e.getSources()).hasSize(1);
    }

    @Test
    void adminEditKeepsApprovedStatus() {
        Exercise e = exercise(ReviewStatus.APPROVED, true);
        exercises.update(ADMIN, 10L, exerciseReq());
        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.APPROVED);
    }

    private Article article(ArticleStatus status, Long authorId, boolean withSource) {
        Article a = new Article();
        a.setId(20L);
        a.setTitle("Uống đủ nước");
        a.setStatus(status);
        User author = new User();
        author.setId(authorId);
        a.setAuthor(author);
        if (withSource) a.setSources(new java.util.LinkedHashSet<>(Set.of(new ContentSource())));
        when(articleRepository.findById(20L)).thenReturn(Optional.of(a));
        return a;
    }

    @Test
    void trainerCannotPublishArticle() {
        Article a = article(ArticleStatus.PENDING, 2L, true);
        assertThatThrownBy(() -> articles.act(TRAINER, 20L, new ArticleActionRequest(ArticleAction.APPROVE, null)))
                .isInstanceOf(ApiException.class)
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(a.getStatus()).isEqualTo(ArticleStatus.PENDING);
    }

    @Test
    void trainerCannotSubmitSomeoneElsesArticle() {
        article(ArticleStatus.DRAFT, 99L, true);
        assertThatThrownBy(() -> articles.act(TRAINER, 20L, new ArticleActionRequest(ArticleAction.SUBMIT, null)))
                .isInstanceOf(ApiException.class)
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void publishingRequiresPendingStatusAndSource() {
        article(ArticleStatus.DRAFT, 2L, true);
        assertThatThrownBy(() -> articles.act(ADMIN, 20L, new ArticleActionRequest(ArticleAction.APPROVE, null)))
                .isInstanceOf(ApiException.class)
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void publishingWithoutSourceIsRejected() {
        article(ArticleStatus.PENDING, 2L, false);
        assertThatThrownBy(() -> articles.act(ADMIN, 20L, new ArticleActionRequest(ArticleAction.APPROVE, null)))
                .isInstanceOf(ApiException.class)
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void adminPublishesPendingArticle() {
        Article a = article(ArticleStatus.PENDING, 2L, true);
        when(userRepository.getReferenceById(1L)).thenReturn(new User());
        articles.act(ADMIN, 20L, new ArticleActionRequest(ArticleAction.APPROVE, null));
        assertThat(a.getStatus()).isEqualTo(ArticleStatus.PUBLISHED);
        assertThat(a.getPublishedAt()).isNotNull();
    }

    @Test
    void rejectRequiresNote() {
        article(ArticleStatus.PENDING, 2L, true);
        assertThatThrownBy(() -> articles.act(ADMIN, 20L, new ArticleActionRequest(ArticleAction.REJECT, null)))
                .isInstanceOf(ApiException.class)
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void publishedArticleMustBeArchivedBeforeDelete() {
        article(ArticleStatus.PUBLISHED, 2L, true);
        assertThatThrownBy(() -> articles.delete(20L)).isInstanceOf(ApiException.class);
        verify(articleRepository, never()).delete(any());
    }
}
