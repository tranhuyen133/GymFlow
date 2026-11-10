package com.gymflow.service;

import com.gymflow.ai.AssistantProvider;
import com.gymflow.ai.AssistantProviderService;
import com.gymflow.common.ApiException;
import com.gymflow.config.AiConfig;
import com.gymflow.domain.ChatConversation;
import com.gymflow.domain.ChatMessage;
import com.gymflow.domain.Role;
import com.gymflow.dto.Dtos.ChatSendRequest;
import com.gymflow.dto.Dtos.ChatSuggestion;
import com.gymflow.repository.ChatConversationRepository;
import com.gymflow.repository.ChatMessageRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {
    @Mock ChatConversationRepository conversationRepository;
    @Mock ChatMessageRepository messageRepository;
    @Mock UserRepository userRepository;
    @Mock ChatAssistantService assistant;
    @Mock AssistantProviderService assistantProviderService;
    @Mock AssistantProvider activeProvider;
    @Mock AiConfig aiConfig;

    ChatService service;
    AuthUser owner;

    @BeforeEach
    void setUp() {
        service = new ChatService(conversationRepository, messageRepository, userRepository, assistant,
                assistantProviderService, aiConfig,
                Clock.fixed(Instant.parse("2026-11-10T10:00:00Z"), ZoneOffset.UTC));
        owner = new AuthUser(7L, "owner@example.test", Role.MEMBER, "Owner");
    }

    private ChatConversation conversation() {
        ChatConversation conversation = new ChatConversation();
        conversation.setId(1L);
        conversation.setTitle("Cuộc trò chuyện mới");
        return conversation;
    }

    @Test
    void historyCannotReadAnotherUsersConversation() {
        when(conversationRepository.findByIdAndUser_Id(42L, owner.id())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.history(owner, 42L))
                .isInstanceOfSatisfying(ApiException.class, error ->
                        assertThat(error.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        verifyNoInteractions(messageRepository);
    }

    @Test
    void sendCannotAppendToAnotherUsersConversation() {
        when(conversationRepository.findByIdAndUser_Id(42L, owner.id())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.send(owner, new ChatSendRequest(42L, "SCHEDULE_TODAY")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("hội thoại");
        verify(messageRepository, never()).save(any());
    }

    @Test
    void unknownTopicIsRejectedBeforePersistence() {
        ChatConversation conversation = conversation();
        when(conversationRepository.findByIdAndUser_Id(1L, owner.id())).thenReturn(Optional.of(conversation));
        when(assistantProviderService.getActiveProvider()).thenReturn(activeProvider);

        assertThatThrownBy(() -> service.send(owner, new ChatSendRequest(1L, "KHONG_TON_TAI")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("không hợp lệ");
        verifyNoInteractions(messageRepository, assistant);
    }

    @Test
    void topicOutsideMemberRoleIsRejected() {
        ChatConversation conversation = conversation();
        when(conversationRepository.findByIdAndUser_Id(1L, owner.id())).thenReturn(Optional.of(conversation));
        when(assistantProviderService.getActiveProvider()).thenReturn(activeProvider);

        assertThatThrownBy(() -> service.send(owner, new ChatSendRequest(1L, "WHO_TODAY")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("quyền");
        verifyNoInteractions(messageRepository, assistant);
    }

    @Test
    void sendStoresQuestionLabelAndRuleBasedAnswer() {
        ChatConversation conversation = conversation();
        when(conversationRepository.findByIdAndUser_Id(1L, owner.id())).thenReturn(Optional.of(conversation));
        when(assistantProviderService.getActiveProvider()).thenReturn(activeProvider);
        when(activeProvider.answerTopic(owner, ChatTopic.SCHEDULE_TODAY)).thenReturn("Hôm nay bạn có 1 buổi tập.");
        when(messageRepository.findTop1ByConversation_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.send(owner, new ChatSendRequest(1L, "SCHEDULE_TODAY"));

        assertThat(response.sender()).isEqualTo("ASSISTANT");
        assertThat(response.content()).isEqualTo("Hôm nay bạn có 1 buổi tập.");
        assertThat(conversation.getTitle()).isEqualTo("Lịch tập hôm nay");

        ArgumentCaptor<ChatMessage> saved = ArgumentCaptor.forClass(ChatMessage.class);
        verify(messageRepository, times(2)).save(saved.capture());
        assertThat(saved.getAllValues().get(0).getSender()).isEqualTo(ChatMessage.Sender.USER);
        assertThat(saved.getAllValues().get(0).getContent()).isEqualTo("Lịch tập hôm nay");
        assertThat(saved.getAllValues().get(1).getSender()).isEqualTo(ChatMessage.Sender.ASSISTANT);
        verify(conversationRepository).save(conversation);
    }

    @Test
    void sendFreeTextInvokesActiveProvider() {
        ChatConversation conversation = conversation();
        when(conversationRepository.findByIdAndUser_Id(1L, owner.id())).thenReturn(Optional.of(conversation));
        when(assistantProviderService.getActiveProvider()).thenReturn(activeProvider);
        when(activeProvider.getProviderName()).thenReturn("gemini");
        when(activeProvider.answerText(eq(owner), eq("Hôm nay tôi tập gì?"), eq(conversation)))
                .thenReturn("Hôm nay bạn có bài tập ngực.");
        when(messageRepository.findTop1ByConversation_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.send(owner, new ChatSendRequest(1L, null, "Hôm nay tôi tập gì?"));

        assertThat(response.sender()).isEqualTo("ASSISTANT");
        assertThat(response.content()).isEqualTo("Hôm nay bạn có bài tập ngực.");
        assertThat(response.provider()).isEqualTo("GEMINI");
        assertThat(conversation.getTitle()).isEqualTo("Hôm nay tôi tập gì?");
    }

    @Test
    void suggestionsAreDelegatedToAssistantWithFreeTextFlag() {
        when(assistant.suggestions(owner)).thenReturn(List.of(new ChatSuggestion("HELP", "Hướng dẫn & an toàn")));
        when(assistantProviderService.isFreeTextEnabled()).thenReturn(true);

        var res = service.suggestions(owner);
        assertThat(res.freeTextEnabled()).isTrue();
        assertThat(res.suggestions())
                .extracting(ChatSuggestion::key)
                .containsExactly("HELP");
    }
}
