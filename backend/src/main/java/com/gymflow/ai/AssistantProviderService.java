package com.gymflow.ai;

import com.gymflow.config.AiConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Điều phối và chọn lựa AssistantProvider phù hợp theo cấu hình môi trường.
 */
@Service
@RequiredArgsConstructor
public class AssistantProviderService {

    private final AiConfig aiConfig;
    private final RuleBasedProvider ruleBasedProvider;
    private final GeminiProvider geminiProvider;

    public AssistantProvider getActiveProvider() {
        if (aiConfig.isGeminiEnabled()) {
            return geminiProvider;
        }
        return ruleBasedProvider;
    }

    public boolean isFreeTextEnabled() {
        return aiConfig.isFreeTextEnabled();
    }
}
