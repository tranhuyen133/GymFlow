package com.gymflow.repository;

import com.gymflow.domain.Promotion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    Optional<Promotion> findByCodeIgnoreCase(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Promotion p WHERE p.id = :id")
    Optional<Promotion> findByIdForUpdate(@Param("id") Long id);

    List<Promotion> findByCodeIsNullAndActiveTrue();

    List<Promotion> findAllByOrderByCreatedAtDesc();

    @Query("SELECT p FROM Promotion p WHERE p.active = true AND p.startsAt <= :now AND p.endsAt BETWEEN :now AND :to")
    List<Promotion> findExpiringBetween(@Param("now") LocalDateTime now, @Param("to") LocalDateTime to);
}
