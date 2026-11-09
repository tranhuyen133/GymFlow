package com.gymflow.repository;

import com.gymflow.domain.EmailVerificationToken;
import com.gymflow.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findFirstByUser_IdAndUsedAtIsNullOrderByCreatedAtDesc(Long userId);

    long countByUser_IdAndCreatedAtAfter(Long userId, LocalDateTime after);

    @Modifying
    @Query("UPDATE EmailVerificationToken t SET t.usedAt = :now WHERE t.user = :user AND t.usedAt IS NULL")
    int invalidateActiveTokens(@Param("user") User user, @Param("now") LocalDateTime now);
}
