package com.gymflow.ai;

import com.gymflow.domain.ChatConversation;
import com.gymflow.security.AuthUser;
import com.gymflow.service.ChatTopic;

/**
 * Giao diện nhà cung cấp câu trả lời cho Trợ lý GymFlow.
 * Hỗ trợ chuyển đổi giữa RuleBasedProvider (câu hỏi sẵn) và OllamaProvider (AI local).
 */
public interface AssistantProvider {

    /**
     * Tên định danh của provider (ví dụ: "rule", "ollama").
     */
    String getProviderName();

    /**
     * Kiểm tra provider có sẵn sàng phục vụ không.
     */
    boolean isAvailable();

    /**
     * Trả lời câu hỏi theo chủ đề (topic) có sẵn.
     */
    String answerTopic(AuthUser user, ChatTopic topic);

    /**
     * Trả lời câu hỏi tự do bằng văn bản (text query), có ngữ cảnh hội thoại.
     */
    String answerText(AuthUser user, String text, ChatConversation conversation);
}
