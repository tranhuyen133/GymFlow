package com.gymflow.repository;

import com.gymflow.domain.EmailKind;
import com.gymflow.domain.EmailLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
    Optional<EmailLog> findByKindAndRefKey(EmailKind kind, String refKey);

    @Query("""
            select l from EmailLog l
            where (:kind is null or l.kind = :kind)
              and (:status is null or l.status = :status)
              and (:q = '' or lower(l.toEmail) like lower(concat('%', :q, '%')) or lower(l.subject) like lower(concat('%', :q, '%')))
            order by l.createdAt desc, l.id desc
            """)
    Page<EmailLog> search(@Param("kind") EmailKind kind, @Param("status") String status, @Param("q") String q, Pageable pageable);

    @Query("select l.kind, l.status, count(l) from EmailLog l where l.createdAt >= :from group by l.kind, l.status")
    List<Object[]> countSince(@Param("from") LocalDateTime from);

    List<EmailLog> findByStatusAndAttemptsLessThanOrderByCreatedAtAsc(String status, int attempts);
}
