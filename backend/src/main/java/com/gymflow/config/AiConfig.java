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
    private final String ollamaBaseUrl;
    private final String ollamaModel;
    private final int ollamaTimeoutSeconds;
    private final int maxInputChars;

    public AiConfig(
            @Value("${app.ai.provider:gemini}") String provider,
            @Value("${app.ai.free-text-enabled:true}") boolean freeTextEnabled,
            @Value("${app.ai.gemini-api-key:${GEMINI_API_KEY:}}") String geminiApiKey,
            @Value("${app.ai.gemini-model:${GEMINI_MODEL:gemini-1.5-flash}}") String geminiModel,
            @Value("${app.ai.ollama-base-url:http://ollama:11434}") String ollamaBaseUrl,
            @Value("${app.ai.ollama-model:qwen2.5:3b}") String ollamaModel,
            @Value("${app.ai.ollama-timeout-seconds:15}") int ollamaTimeoutSeconds,
            @Value("${app.ai.max-input-chars:500}") int maxInputChars) {
        this.provider = (provider == null || provider.isBlank()) ? "gemini" : provider.trim().toLowerCase();
        this.freeTextEnabled = freeTextEnabled;
        this.geminiApiKey = geminiApiKey != null ? geminiApiKey.trim() : "";
        this.geminiModel = (geminiModel == null || geminiModel.isBlank()) ? "gemini-1.5-flash" : geminiModel.trim();
        this.ollamaBaseUrl = (ollamaBaseUrl == null || ollamaBaseUrl.isBlank()) ? "http://ollama:11434" : ollamaBaseUrl.replaceAll("/+$", "");
        this.ollamaModel = (ollamaModel == null || ollamaModel.isBlank()) ? "qwen2.5:3b" : ollamaModel.trim();
        this.ollamaTimeoutSeconds = ollamaTimeoutSeconds > 0 ? ollamaTimeoutSeconds : 15;
        this.maxInputChars = maxInputChars > 0 ? maxInputChars : 500;
    }

    public boolean isGeminiEnabled() {
        return "gemini".equalsIgnoreCase(provider) || (geminiApiKey != null && !geminiApiKey.isBlank() && !"ollama".equalsIgnoreCase(provider) && !"rule".equalsIgnoreCase(provider));
    }

    public boolean isOllamaEnabled() {
        return "ollama".equalsIgnoreCase(provider);
    }
}
