package com.gymflow.repository;

import com.gymflow.domain.Article;
import com.gymflow.domain.ArticleStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    @EntityGraph(attributePaths = {"sources"})
    List<Article> findByStatusOrderByPublishedAtDesc(ArticleStatus status);

    @EntityGraph(attributePaths = {"sources"})
    Optional<Article> findBySlugAndStatus(String slug, ArticleStatus status);

    @EntityGraph(attributePaths = {"sources", "author", "reviewedBy"})
    @Query("SELECT a FROM Article a ORDER BY COALESCE(a.updatedAt, a.createdAt) DESC")
    List<Article> findAllOrdered();

    @EntityGraph(attributePaths = {"sources", "author", "reviewedBy"})
    List<Article> findAllByOrderByUpdatedAtDescCreatedAtDesc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
