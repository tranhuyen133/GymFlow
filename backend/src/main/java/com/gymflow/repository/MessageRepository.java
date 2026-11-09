package com.gymflow.repository;

import com.gymflow.domain.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("select m from Message m where m.conversation.id = :conversationId and (:before is null or m.id < :before) order by m.id desc")
    List<Message> findMessagesBefore(@Param("conversationId") Long conversationId, @Param("before") Long before, Pageable pageable);

    @Query("select m from Message m where m.conversation.id = :conversationId and m.id > :after order by m.id asc")
    List<Message> findNewMessages(@Param("conversationId") Long conversationId, @Param("after") Long after);

    @Query("select count(m) from Message m where m.conversation.id = :conversationId and m.senderUser.id <> :userId and m.readAt is null")
    long countUnreadInConversation(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Query("select count(m) from Message m where (m.conversation.member.user.id = :userId or m.conversation.trainer.user.id = :userId) and m.senderUser.id <> :userId and m.readAt is null")
    long countTotalUnreadForUser(@Param("userId") Long userId);

    @Modifying
    @Query("update Message m set m.readAt = :now where m.conversation.id = :conversationId and m.senderUser.id <> :userId and m.readAt is null")
    int markAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId, @Param("now") LocalDateTime now);

    Optional<Message> findFirstByConversationIdOrderByIdDesc(Long conversationId);

    @Query("select m from Message m where (m.conversation.member.user.id = :userId or m.conversation.trainer.user.id = :userId) and m.senderUser.id <> :userId and m.readAt is null order by m.createdAt desc")
    List<Message> findUnreadMessagesForUser(@Param("userId") Long userId);
}
