package com.gymflow.ai;

import com.gymflow.config.AiConfig;
import com.gymflow.domain.ChatConversation;
import com.gymflow.domain.Role;
import com.gymflow.repository.ChatMessageRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ResourceLoader;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OllamaProviderTest {

    @Mock AiConfig aiConfig;
    @Mock AiDataGroundingService groundingService;
    @Mock AiRateLimiter rateLimiter;
    @Mock RuleBasedProvider ruleBasedFallback;
    @Mock ChatMessageRepository messageRepository;
    @Mock ResourceLoader resourceLoader;

    OllamaProvider provider;
    AuthUser user;
    ChatConversation conversation;

    @BeforeEach
    void setUp() {
        provider = new OllamaProvider(aiConfig, groundingService, rateLimiter, ruleBasedFallback, messageRepository, resourceLoader);
        user = new AuthUser(10L, "test@gymflow.vn", Role.MEMBER, "Người Dùng Test");
        conversation = new ChatConversation();
        conversation.setId(5L);

        lenient().when(aiConfig.getOllamaBaseUrl()).thenReturn("http://127.0.0.1:59999");
        lenient().when(aiConfig.getOllamaModel()).thenReturn("qwen2.5:3b");
        lenient().when(aiConfig.getOllamaTimeoutSeconds()).thenReturn(15);
        lenient().when(aiConfig.getMaxInputChars()).thenReturn(500);
        lenient().when(aiConfig.isOllamaEnabled()).thenReturn(true);
        lenient().when(rateLimiter.tryAcquire(user.id())).thenReturn(true);

        provider.init();
    }

    @Test
    void rejectsQueryExceedingMaxInputCharacters() {
        String longText = "A".repeat(501);

        String answer = provider.answerText(user, longText, conversation);

        assertThat(answer).contains("quá dài");
        verifyNoInteractions(groundingService);
    }

    @Test
    void throttlesQueryWhenRateLimitExceeded() {
        when(rateLimiter.tryAcquire(user.id())).thenReturn(false);

        String answer = provider.answerText(user, "Hôm nay tôi tập gì?", conversation);

        assertThat(answer).contains("quá nhanh");
        verifyNoInteractions(groundingService);
    }

    @Test
    void fallsBackToRuleBasedProviderWhenOllamaFailsOrTimesOut() {
        when(groundingService.buildGroundingContext(eq(user), any())).thenReturn("Dữ liệu grounding test");
        when(messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId())).thenReturn(List.of());
        when(ruleBasedFallback.answerText(eq(user), eq("Hôm nay tôi tập gì?"), eq(conversation)))
                .thenReturn("Hôm nay bạn có 1 buổi tập lúc 17:30 (Fallback thành công).");

        // Gọi với URL không tồn tại để kích hoạt lỗi kết nối / timeout
        String answer = provider.answerText(user, "Hôm nay tôi tập gì?", conversation);

        assertThat(answer).isEqualTo("Hôm nay bạn có 1 buổi tập lúc 17:30 (Fallback thành công).");
        verify(ruleBasedFallback).answerText(eq(user), eq("Hôm nay tôi tập gì?"), eq(conversation));
    }
}
