package com.gymflow.repository;

import com.gymflow.domain.UserTourProgress;
import com.gymflow.domain.UserTourProgressId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserTourProgressRepository extends JpaRepository<UserTourProgress, UserTourProgressId> {
    List<UserTourProgress> findByUserId(Long userId);
    Optional<UserTourProgress> findByUserIdAndTourKey(Long userId, String tourKey);
}
