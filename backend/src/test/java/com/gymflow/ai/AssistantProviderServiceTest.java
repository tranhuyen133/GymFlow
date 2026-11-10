package com.gymflow.ai;

import com.gymflow.config.AiConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssistantProviderServiceTest {

    @Mock AiConfig aiConfig;
    @Mock RuleBasedProvider ruleBasedProvider;
    @Mock OllamaProvider ollamaProvider;

    @Test
    void selectsRuleBasedProviderWhenOllamaIsDisabled() {
        when(aiConfig.isOllamaEnabled()).thenReturn(false);
        when(aiConfig.isFreeTextEnabled()).thenReturn(true);

        AssistantProviderService service = new AssistantProviderService(aiConfig, ruleBasedProvider, ollamaProvider);

        assertThat(service.getActiveProvider()).isSameAs(ruleBasedProvider);
        assertThat(service.isFreeTextEnabled()).isTrue();
    }

    @Test
    void selectsOllamaProviderWhenOllamaIsEnabled() {
        when(aiConfig.isOllamaEnabled()).thenReturn(true);
        when(aiConfig.isFreeTextEnabled()).thenReturn(true);

        AssistantProviderService service = new AssistantProviderService(aiConfig, ruleBasedProvider, ollamaProvider);

        assertThat(service.getActiveProvider()).isSameAs(ollamaProvider);
        assertThat(service.isFreeTextEnabled()).isTrue();
    }
}
