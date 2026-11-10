package com.gymflow.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class AiConfig {

    private final String provider;
    private final String ollamaBaseUrl;
    private final String ollamaModel;
    private final int ollamaTimeoutSeconds;
    private final int maxInputChars;

    public AiConfig(
            @Value("${app.ai.provider:rule}") String provider,
            @Value("${app.ai.ollama-base-url:http://ollama:11434}") String ollamaBaseUrl,
            @Value("${app.ai.ollama-model:qwen2.5:3b}") String ollamaModel,
            @Value("${app.ai.ollama-timeout-seconds:15}") int ollamaTimeoutSeconds,
            @Value("${app.ai.max-input-chars:500}") int maxInputChars) {
        this.provider = (provider == null || provider.isBlank()) ? "rule" : provider.trim().toLowerCase();
        this.ollamaBaseUrl = (ollamaBaseUrl == null || ollamaBaseUrl.isBlank()) ? "http://ollama:11434" : ollamaBaseUrl.replaceAll("/+$", "");
        this.ollamaModel = (ollamaModel == null || ollamaModel.isBlank()) ? "qwen2.5:3b" : ollamaModel.trim();
        this.ollamaTimeoutSeconds = ollamaTimeoutSeconds > 0 ? ollamaTimeoutSeconds : 15;
        this.maxInputChars = maxInputChars > 0 ? maxInputChars : 500;
    }

    public boolean isOllamaEnabled() {
        return "ollama".equalsIgnoreCase(provider);
    }
}
