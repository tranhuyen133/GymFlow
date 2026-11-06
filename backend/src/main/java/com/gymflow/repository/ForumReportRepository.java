package com.gymflow.repository;

import com.gymflow.domain.ForumReport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForumReportRepository extends JpaRepository<ForumReport, Long> {

    @EntityGraph(attributePaths = {"topic", "topic.author", "reply", "reply.author", "reporter"})
    List<ForumReport> findByStatusOrderByCreatedAtDesc(String status);

    boolean existsByReporter_IdAndTopic_IdAndReplyIsNullAndStatus(Long reporterId, Long topicId, String status);

    boolean existsByReporter_IdAndReply_IdAndStatus(Long reporterId, Long replyId, String status);
}
