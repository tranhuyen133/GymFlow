package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.ChatConversation;
import com.gymflow.dto.Dtos.ChatSendRequest;
import com.gymflow.repository.ChatConversationRepository;
import com.gymflow.repository.ChatMessageRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;

import java.time.Clock;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {
    @Mock ChatConversationRepository conversationRepository;
    @Mock ChatMessageRepository messageRepository;
    @Mock UserRepository userRepository;

    ChatService service;
    AuthUser owner;

    @BeforeEach
    void setUp() {
        service = new ChatService(conversationRepository, messageRepository, userRepository, RestClient.builder(),
                Clock.systemUTC(), "https://example.invalid/v1", "test-model", "test-key", 1);
        owner = new AuthUser(7L, "owner@example.test", com.gymflow.domain.Role.MEMBER, "Owner");
    }

    @Test
    void historyCannotReadAnotherUsersConversation() {
        when(conversationRepository.findByIdAndUser_Id(42L, owner.id())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.history(owner, 42L))
                .isInstanceOfSatisfying(ApiException.class, error -> {
                    org.assertj.core.api.Assertions.assertThat(error.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                });
        verifyNoInteractions(messageRepository);
    }

    @Test
    void sendCannotAppendToAnotherUsersConversation() {
        when(conversationRepository.findByIdAndUser_Id(42L, owner.id())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.send(owner, new ChatSendRequest(42L, "Cách dùng GymFlow?")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("hội thoại");
        verify(messageRepository, never()).save(any());
    }

    @Test
    void emptyAndOversizedQuestionsAreRejectedBeforePersistence() {
        assertThatThrownBy(() -> service.send(owner, new ChatSendRequest(1L, "  ")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("nhập câu hỏi");
        assertThatThrownBy(() -> service.send(owner, new ChatSendRequest(1L, "x".repeat(2001))))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("2.000");
        verifyNoInteractions(conversationRepository, messageRepository, userRepository);
    }
}
