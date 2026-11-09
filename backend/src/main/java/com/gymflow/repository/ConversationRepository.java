package com.gymflow.repository;

import com.gymflow.domain.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByMemberIdAndTrainerId(Long memberId, Long trainerId);

    @Query("select c from Conversation c where c.member.id = :memberId order by coalesce(c.lastMessageAt, c.createdAt) desc")
    List<Conversation> findByMemberId(@Param("memberId") Long memberId);

    @Query("select c from Conversation c where c.trainer.id = :trainerId order by coalesce(c.lastMessageAt, c.createdAt) desc")
    List<Conversation> findByTrainerId(@Param("trainerId") Long trainerId);
}
