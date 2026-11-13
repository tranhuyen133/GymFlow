package com.gymflow.repository;

import com.gymflow.domain.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("select c from Conversation c where c.member.id = :memberId order by coalesce(c.lastMessageAt, c.createdAt) desc")
    List<Conversation> findByMemberIdOrderByLastMessageAtDesc(@Param("memberId") Long memberId);

    @Query("select c from Conversation c where (:trainerId is null or c.trainer.id = :trainerId) " +
           "and (:q is null or :q = '' or lower(c.member.user.fullName) like lower(concat('%', :q, '%')) or lower(c.trainer.user.fullName) like lower(concat('%', :q, '%'))) " +
           "order by coalesce(c.lastMessageAt, c.createdAt) desc")
    Page<Conversation> findAllAdmin(@Param("q") String q, @Param("trainerId") Long trainerId, Pageable pageable);
}
