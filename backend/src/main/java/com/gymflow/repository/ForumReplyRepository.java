package com.gymflow.repository;

import com.gymflow.domain.ForumReply;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ForumReplyRepository extends JpaRepository<ForumReply, Long> {

    @EntityGraph(attributePaths = "author")
    List<ForumReply> findByTopic_IdOrderByCreatedAtAscIdAsc(Long topicId);

    long countByTopic_IdAndHiddenFalse(Long topicId);

    /** Chủ đề đã có người khác trả lời thì người viết không tự xoá được nữa. */
    boolean existsByTopic_IdAndAuthor_IdNot(Long topicId, Long authorId);

    boolean existsByAuthor_IdAndCreatedAtAfter(Long authorId, LocalDateTime after);

    /** Chống gửi trùng (bấm 2 lần, mạng chậm gửi lại): cùng người, cùng chủ đề, cùng nội dung trong vài phút. */
    boolean existsByTopic_IdAndAuthor_IdAndBodyAndCreatedAtAfter(Long topicId, Long authorId, String body, LocalDateTime after);
}
