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

    @Query("select m from Message m where m.conversation.id = :conversationId and m.deletedAt is null and (:before is null or m.id < :before) order by m.id desc")
    List<Message> findMessagesBefore(@Param("conversationId") Long conversationId, @Param("before") Long before, Pageable pageable);

    @Query("select m from Message m where m.conversation.id = :conversationId and m.deletedAt is null and m.id > :after order by m.id asc")
    List<Message> findNewMessages(@Param("conversationId") Long conversationId, @Param("after") Long after);

    @Query("select count(m) from Message m where m.conversation.id = :conversationId and m.deletedAt is null and m.senderUser.id <> :userId and m.readAt is null and m.recalledAt is null")
    long countUnreadInConversation(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Query("select count(m) from Message m where (m.conversation.member.user.id = :userId or m.conversation.trainer.user.id = :userId) and m.deletedAt is null and m.senderUser.id <> :userId and m.readAt is null and m.recalledAt is null")
    long countTotalUnreadForUser(@Param("userId") Long userId);

    @Modifying
    @Query("update Message m set m.readAt = :now where m.conversation.id = :conversationId and m.senderUser.id <> :userId and m.readAt is null and m.deletedAt is null")
    int markAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId, @Param("now") LocalDateTime now);

    Optional<Message> findFirstByConversationIdOrderByIdDesc(Long conversationId);

    Optional<Message> findFirstByConversationIdAndDeletedAtIsNullOrderByIdDesc(Long conversationId);

    @Query("select count(m) from Message m where m.conversation.id = :conversationId and m.deletedAt is null")
    long countByConversationIdAndDeletedAtIsNull(@Param("conversationId") Long conversationId);

    @Query("select m from Message m where (m.conversation.member.user.id = :userId or m.conversation.trainer.user.id = :userId) and m.deletedAt is null and m.senderUser.id <> :userId and m.readAt is null and m.recalledAt is null order by m.createdAt desc")
    List<Message> findUnreadMessagesForUser(@Param("userId") Long userId);

    // ---------- V45: bỏ tin đã "xoá phía tôi" của người đang xem ----------
    String VISIBLE = " and m.deletedAt is null and not exists (select 1 from MessageHidden h where h.messageId = m.id and h.userId = :userId)";

    @Query("select m from Message m where m.conversation.id = :conversationId" + VISIBLE + " and (:before is null or m.id < :before) order by m.id desc")
    List<Message> findVisibleBefore(@Param("conversationId") Long conversationId, @Param("userId") Long userId,
                                    @Param("before") Long before, Pageable pageable);

    @Query("select m from Message m where m.conversation.id = :conversationId" + VISIBLE + " and m.id > :after order by m.id asc")
    List<Message> findVisibleNew(@Param("conversationId") Long conversationId, @Param("userId") Long userId,
                                 @Param("after") Long after);

    @Query("select m from Message m where m.conversation.id = :conversationId" + VISIBLE + " and m.id > :after order by m.id asc")
    List<Message> findVisibleAfter(@Param("conversationId") Long conversationId, @Param("userId") Long userId,
                                   @Param("after") Long after, Pageable pageable);

    /** Tìm trong nội dung tin / tên tệp (không dấu phân biệt hoa thường), bỏ tin đã thu hồi / đã xoá phía tôi. */
    @Query("select m from Message m where m.conversation.id = :conversationId" + VISIBLE +
            " and m.recalledAt is null" +
            " and (:q = '' or locate(:q, lower(m.body)) > 0 or locate(:q, lower(coalesce(m.attachmentName, ''))) > 0)" +
            " and (:before is null or m.id < :before) order by m.id desc")
    List<Message> findVisibleSearch(@Param("conversationId") Long conversationId, @Param("userId") Long userId,
                                    @Param("q") String q, @Param("before") Long before, Pageable pageable);

    /** Ảnh / video / tệp đã gửi còn hiển thị (dùng cho mục thư viện phương tiện). */
    @Query("select m from Message m where m.conversation.id = :conversationId" + VISIBLE +
            " and m.recalledAt is null and m.attachmentType is not null" +
            " and (:kind is null or m.kind = :kind)" +
            " and (:before is null or m.id < :before) order by m.id desc")
    List<Message> findVisibleMedia(@Param("conversationId") Long conversationId, @Param("userId") Long userId,
                                   @Param("kind") String kind, @Param("before") Long before, Pageable pageable);

    /** Id các tin bị thu hồi sau mốc `since` – để màn hình đang mở cập nhật "đã thu hồi" khi thăm dò định kỳ. */
    @Query("select m.id from Message m where m.conversation.id = :conversationId and m.recalledAt is not null and m.recalledAt > :since")
    List<Long> findRecalledSince(@Param("conversationId") Long conversationId, @Param("since") LocalDateTime since);

    /** Tổng dung lượng tệp một người đã gửi từ mốc `since` (kể cả tin đã thu hồi) – hạn mức theo ngày. */
    @Query("select coalesce(sum(m.attachmentSize), 0) from Message m where m.senderUser.id = :userId and m.attachmentSize is not null and m.createdAt >= :since")
    long sumAttachmentBytesSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
