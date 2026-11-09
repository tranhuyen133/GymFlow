package com.gymflow.repository;

import com.gymflow.domain.ForumCategory;
import com.gymflow.domain.ForumTopic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ForumTopicRepository extends JpaRepository<ForumTopic, Long> {

    /** Collation utf8mb4_0900_ai_ci: tìm không phân biệt hoa thường và dấu ("tap chan" khớp "Tập chân"). */
    @EntityGraph(attributePaths = "author")
    @Query("""
            select t from ForumTopic t
            where (:includeHidden = true or t.hidden = false)
              and (:category is null or t.category = :category)
              and (:q = '' or t.title like concat('%', :q, '%') or t.body like concat('%', :q, '%'))
            """)
    Page<ForumTopic> search(@Param("includeHidden") boolean includeHidden,
                            @Param("category") ForumCategory category,
                            @Param("q") String q,
                            Pageable pageable);

    boolean existsByAuthor_IdAndCreatedAtAfter(Long authorId, LocalDateTime after);
}
