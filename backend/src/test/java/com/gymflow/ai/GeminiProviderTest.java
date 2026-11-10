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
class GeminiProviderTest {

    @Mock AiConfig aiConfig;
    @Mock AiDataGroundingService groundingService;
    @Mock AiRateLimiter rateLimiter;
    @Mock RuleBasedProvider ruleBasedFallback;
    @Mock ChatMessageRepository messageRepository;
    @Mock ResourceLoader resourceLoader;

    GeminiProvider provider;
    AuthUser user;
    ChatConversation conversation;

    @BeforeEach
    void setUp() {
        provider = new GeminiProvider(aiConfig, groundingService, rateLimiter, ruleBasedFallback, messageRepository, resourceLoader);
        user = new AuthUser(15L, "member@gymflow.vn", Role.MEMBER, "Hội Viên Test");
        conversation = new ChatConversation();
        conversation.setId(8L);

        lenient().when(aiConfig.getGeminiApiKey()).thenReturn("test-gemini-key");
        lenient().when(aiConfig.getGeminiModel()).thenReturn("gemini-3.5-flash-lite");
        lenient().when(aiConfig.getTimeoutSeconds()).thenReturn(15);
        lenient().when(aiConfig.getMaxInputChars()).thenReturn(500);
        lenient().when(rateLimiter.tryAcquire(user.id())).thenReturn(true);

        provider.init();
    }

    @Test
    void fallsBackToRuleBasedProviderWhenApiKeyIsBlank() {
        when(aiConfig.getGeminiApiKey()).thenReturn("");
        when(ruleBasedFallback.answerText(eq(user), eq("Hôm nay tôi tập gì?"), eq(conversation)))
                .thenReturn("Hôm nay bạn có 1 buổi tập.");

        String answer = provider.answerText(user, "Hôm nay tôi tập gì?", conversation);

        assertThat(answer).isEqualTo("Hôm nay bạn có 1 buổi tập.");
        verify(ruleBasedFallback).answerText(eq(user), eq("Hôm nay tôi tập gì?"), eq(conversation));
    }

    @Test
    void rejectsQueryExceedingMaxInputCharacters() {
        String longText = "B".repeat(501);

        String answer = provider.answerText(user, longText, conversation);

        assertThat(answer).contains("quá dài");
        verifyNoInteractions(groundingService);
    }

    @Test
    void throttlesQueryWhenRateLimitExceeded() {
        when(rateLimiter.tryAcquire(user.id())).thenReturn(false);

        String answer = provider.answerText(user, "Lịch tập hôm nay", conversation);

        assertThat(answer).contains("quá nhanh");
        verifyNoInteractions(groundingService);
    }

    @Test
    void fallsBackToRuleBasedProviderWhenGeminiApiFails() {
        when(groundingService.buildGroundingContext(eq(user), any())).thenReturn("Dữ liệu grounding");
        when(messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId())).thenReturn(List.of());
        when(ruleBasedFallback.answerText(eq(user), eq("Gói của tôi còn bao lâu?"), eq(conversation)))
                .thenReturn("Gói của bạn còn 10 ngày (Fallback rule).");

        // Gọi với key giả sẽ gây lỗi 400/403/connection và tự động fallback
        String answer = provider.answerText(user, "Gói của tôi còn bao lâu?", conversation);

        assertThat(answer).isEqualTo("Gói của bạn còn 10 ngày (Fallback rule).");
        verify(ruleBasedFallback).answerText(eq(user), eq("Gói của tôi còn bao lâu?"), eq(conversation));
    }
}
