package com.gymflow.repository;

import com.gymflow.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);

    List<ChatMessage> findTop20ByConversation_IdOrderByCreatedAtDesc(Long conversationId);

    List<ChatMessage> findTop1ByConversation_IdOrderByCreatedAtDesc(Long conversationId);
}
