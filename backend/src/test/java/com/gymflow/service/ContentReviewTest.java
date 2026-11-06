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

import java.time.LocalDateTime;
import java.util.List;
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
        Exercise e = exercise(ReviewStatus.PENDING, true);
        when(userRepository.getReferenceById(1L)).thenReturn(new User());
        exercises.review(ADMIN, 10L, new ReviewRequest(ReviewStatus.APPROVED, null));
        assertThat(e.getReviewStatus()).isEqualTo(ReviewStatus.APPROVED);
        assertThat(e.getReviewedBy()).isNotNull();
        assertThat(e.getReviewedAt()).isNotNull();
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

    @Test
    void trainerEditOfPublishedArticleGoesBackToPendingAndClearsMetadata() {
        Article a = article(ArticleStatus.PUBLISHED, 2L, true);
        a.setPublishedAt(LocalDateTime.now());
        a.setReviewedBy(new User());
        a.setReviewedAt(LocalDateTime.now());
        a.setReviewNote("Đạt chuẩn");
        when(articleRepository.existsBySlugAndIdNot(any(), eq(20L))).thenReturn(false);

        ArticleRequest req = new ArticleRequest("uong-du-nuoc", "Uống đủ nước mỗi ngày", ArticleCategory.HYDRATION,
                "Tóm tắt mới", "Nội dung mới", null, null);
        articles.update(TRAINER, 20L, req);

        assertThat(a.getStatus()).isEqualTo(ArticleStatus.PENDING);
        assertThat(a.getPublishedAt()).isNull();
        assertThat(a.getReviewedBy()).isNull();
        assertThat(a.getReviewedAt()).isNull();
        assertThat(a.getReviewNote()).isNull();
    }

    @Test
    void trainerSubmitResetsReviewMetadataFromPreviousRejection() {
        Article a = article(ArticleStatus.DRAFT, 2L, true);
        a.setReviewedBy(new User());
        a.setReviewedAt(LocalDateTime.now());
        a.setReviewNote("Cần bổ sung nguồn tin cậy");

        articles.act(TRAINER, 20L, new ArticleActionRequest(ArticleAction.SUBMIT, null));

        assertThat(a.getStatus()).isEqualTo(ArticleStatus.PENDING);
        assertThat(a.getReviewNote()).isNull();
        assertThat(a.getReviewedBy()).isNull();
        assertThat(a.getReviewedAt()).isNull();
    }

    @Test
    void trainerCannotEditArchivedArticle() {
        article(ArticleStatus.ARCHIVED, 2L, true);
        ArticleRequest req = new ArticleRequest("uong-du-nuoc", "Uống đủ nước", ArticleCategory.HYDRATION,
                "Tóm tắt", "Nội dung", null, null);
        assertThatThrownBy(() -> articles.update(TRAINER, 20L, req))
                .isInstanceOf(ApiException.class)
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void trainerCannotEditSomeoneElsesArticle() {
        article(ArticleStatus.DRAFT, 99L, true);
        ArticleRequest req = new ArticleRequest("uong-du-nuoc", "Uống đủ nước", ArticleCategory.HYDRATION,
                "Tóm tắt", "Nội dung", null, null);
        assertThatThrownBy(() -> articles.update(TRAINER, 20L, req))
                .isInstanceOf(ApiException.class)
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void publicEndpointOnlyReturnsPublishedArticles() {
        Article published = new Article();
        published.setId(1L);
        published.setTitle("Bài 1");
        published.setSummary("Tóm tắt 1");
        published.setStatus(ArticleStatus.PUBLISHED);

        when(articleRepository.findByStatusOrderByPublishedAtDesc(ArticleStatus.PUBLISHED))
                .thenReturn(List.of(published));

        articles.published(null, "");
        verify(articleRepository).findByStatusOrderByPublishedAtDesc(ArticleStatus.PUBLISHED);
    }

    @Test
    void publicArticleResponseHidesReviewedAt() {
        Mappers realMappers = new Mappers(null, null, null, null, java.time.Clock.systemDefaultZone());
        Article a = new Article();
        a.setId(1L);
        a.setTitle("Uống nước");
        a.setSummary("Tóm tắt");
        a.setBody("Nội dung");
        a.setCategory(ArticleCategory.HYDRATION);
        a.setContentOrigin(ContentOrigin.SELF_AUTHORED);
        a.setStatus(ArticleStatus.PUBLISHED);
        a.setReviewedAt(LocalDateTime.now());
        a.setPublishedAt(LocalDateTime.now());
        a.setReviewNote("Ghi chú nội bộ");

        ArticleResponse pub = realMappers.article(a, false);
        assertThat(pub.reviewedAt()).isNull();
        assertThat(pub.reviewNote()).isNull();
        assertThat(pub.reviewedByName()).isNull();
        assertThat(pub.authorId()).isNull();

        ArticleResponse internal = realMappers.article(a, true);
        assertThat(internal.reviewedAt()).isNotNull();
        assertThat(internal.reviewNote()).isEqualTo("Ghi chú nội bộ");
    }
}
