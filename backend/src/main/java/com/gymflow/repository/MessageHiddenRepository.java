package com.gymflow.repository;

import com.gymflow.domain.MessageHidden;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageHiddenRepository extends JpaRepository<MessageHidden, MessageHidden.Key> {
    boolean existsByMessageIdAndUserId(Long messageId, Long userId);
}
