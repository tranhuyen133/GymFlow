package com.gymflow.ai;

import com.gymflow.config.AiConfig;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Điều phối và chọn lựa AssistantProvider phù hợp theo cấu hình môi trường.
 * Chỉ chọn Gemini khi đã có API key; nếu thiếu key thì dùng rule-based ngay từ đầu.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssistantProviderService {

    private final AiConfig aiConfig;
    private final RuleBasedProvider ruleBasedProvider;
    private final GeminiProvider geminiProvider;

    @PostConstruct
    void logActiveProvider() {
        if (aiConfig.isGeminiEnabled() && geminiProvider.isAvailable()) {
            log.info("Trợ lý AI Gemini đã bật (model: {}).", aiConfig.getGeminiModel());
        } else if (aiConfig.isGeminiEnabled()) {
            log.warn("AI_PROVIDER=gemini nhưng chưa có GEMINI_API_KEY hợp lệ — trợ lý sẽ dùng RuleBasedProvider.");
        } else {
            log.info("Trợ lý AI chạy ở chế độ rule-based (không gọi API ngoài).");
        }
    }

    public AssistantProvider getActiveProvider() {
        if (aiConfig.isGeminiEnabled() && geminiProvider.isAvailable()) {
            return geminiProvider;
        }
        return ruleBasedProvider;
    }

    public boolean isFreeTextEnabled() {
        return aiConfig.isFreeTextEnabled();
    }
}
