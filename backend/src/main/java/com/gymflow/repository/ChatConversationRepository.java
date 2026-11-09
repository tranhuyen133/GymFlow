package com.gymflow.repository;

import com.gymflow.domain.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    List<ChatConversation> findAllByUser_IdOrderByUpdatedAtDesc(Long userId);

    Optional<ChatConversation> findByIdAndUser_Id(Long id, Long userId);
}
