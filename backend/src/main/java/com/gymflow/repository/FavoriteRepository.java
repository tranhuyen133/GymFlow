package com.gymflow.repository;

import com.gymflow.domain.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    List<Favorite> findByUserIdAndTargetType(Long userId, String targetType);
    Optional<Favorite> findByUserIdAndTargetTypeAndTargetId(Long userId, String targetType, String targetId);
    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, String targetType, String targetId);
    void deleteByUserIdAndTargetTypeAndTargetId(Long userId, String targetType, String targetId);
}
