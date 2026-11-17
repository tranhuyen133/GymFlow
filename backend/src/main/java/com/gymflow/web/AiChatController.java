package com.gymflow.web;

import com.gymflow.common.ApiException;
import com.gymflow.security.AuthUser;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.AiChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền)
 * CẦN LÀM: API trợ lý AI cho hội viên.
 *
 * <p>Chỉ MEMBER được gọi (chặn bằng {@code @PreAuthorize} giống các controller khác).
 * Giới hạn 20 câu hỏi/ngày/hội viên, đếm trong bộ nhớ (mất khi khởi động lại app).</p>
 */
@Tag(name = "Trợ lý AI hội viên")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private static final int MAX_QUESTIONS_PER_DAY = 20;

    private final AiChatService aiChatService;
    private final Clock clock;

    /** Bộ đếm theo userId; mỗi user một object tự đồng bộ nên không cần khoá toàn map. */
    private final Map<Long, DailyQuota> quotas = new ConcurrentHashMap<>();

    public record AiChatRequest(
            @NotBlank(message = "Vui lòng nhập câu hỏi")
            @Size(max = 500, message = "Câu hỏi tối đa 500 ký tự") String message) {
    }

    public record AiChatResponse(String reply) {
    }

    @PostMapping("/chat")
    @PreAuthorize("hasRole('MEMBER')")
    public AiChatResponse chat(@Valid @RequestBody AiChatRequest request) {
        AuthUser user = CurrentUser.get();
        consumeQuota(user.id());
        String reply = aiChatService.chat(user.id(), request.message());
        return new AiChatResponse(reply);
    }

    private void consumeQuota(Long userId) {
        LocalDate today = LocalDate.now(clock);
        DailyQuota quota = quotas.computeIfAbsent(userId, id -> new DailyQuota());
        if (!quota.tryConsume(today)) {
            throw ApiException.tooManyRequests("Bạn đã hết lượt hỏi hôm nay");
        }
    }

    /** Đếm số câu đã hỏi trong ngày; sang ngày mới tự đặt lại. */
    static final class DailyQuota {
        private LocalDate day;
        private int count;

        synchronized boolean tryConsume(LocalDate today) {
            if (!today.equals(day)) {
                day = today;
                count = 0;
            }
            if (count >= MAX_QUESTIONS_PER_DAY) {
                return false;
            }
            count++;
            return true;
        }
    }
}
