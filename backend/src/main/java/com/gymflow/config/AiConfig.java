package com.gymflow.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class AiConfig {

    private final String provider;
    private final boolean freeTextEnabled;
    private final String geminiApiKey;
    private final String geminiModel;
    private final int timeoutSeconds;
    private final int maxInputChars;

    public AiConfig(
            @Value("${app.ai.provider:gemini}") String provider,
            @Value("${app.ai.free-text-enabled:true}") boolean freeTextEnabled,
            @Value("${app.ai.gemini-api-key:${GEMINI_API_KEY:}}") String geminiApiKey,
            @Value("${app.ai.gemini-model:${GEMINI_MODEL:gemini-3.5-flash-lite}}") String geminiModel,
            @Value("${app.ai.timeout-seconds:15}") int timeoutSeconds,
            @Value("${app.ai.max-input-chars:500}") int maxInputChars) {
        this.provider = (provider == null || provider.isBlank()) ? "gemini" : provider.trim().toLowerCase();
        this.freeTextEnabled = freeTextEnabled;
        this.geminiApiKey = geminiApiKey != null ? geminiApiKey.trim() : "";
        this.geminiModel = (geminiModel == null || geminiModel.isBlank()) ? "gemini-3.5-flash-lite" : geminiModel.trim();
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 15;
        this.maxInputChars = maxInputChars > 0 ? maxInputChars : 500;
    }

    public boolean isGeminiEnabled() {
        return "gemini".equalsIgnoreCase(provider) || (geminiApiKey != null && !geminiApiKey.isBlank() && !"rule".equalsIgnoreCase(provider));
    }
}
