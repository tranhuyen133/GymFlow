package com.gymflow.ai;

import com.gymflow.domain.ChatConversation;
import com.gymflow.security.AuthUser;
import com.gymflow.service.ChatAssistantService;
import com.gymflow.service.ChatTopic;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Triển khai trợ lý dựa trên nguyên tắc luật (Rule-based) và dữ liệu thật nội bộ.
 * Không gọi dịch vụ ngoài, hoạt động ổn định và là phương án dự phòng (fallback) mặc định.
 */
@Slf4j
@Component("ruleBasedProvider")
@RequiredArgsConstructor
public class RuleBasedProvider implements AssistantProvider {

    private final ChatAssistantService chatAssistantService;

    @Override
    public String getProviderName() {
        return "rule";
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public String answerTopic(AuthUser user, ChatTopic topic) {
        return chatAssistantService.answer(user, topic);
    }

    @Override
    public String answerText(AuthUser user, String text, ChatConversation conversation) {
        if (text == null || text.isBlank()) {
            return "Xin chào! Bạn vui lòng nhập câu hỏi hoặc chọn một câu hỏi có sẵn bên dưới để xem thông tin.";
        }

        String lower = text.trim().toLowerCase(Locale.ROOT);

        // Phát hiện ý định dựa trên từ khoá cơ bản
        if (containsAny(lower, "hôm nay ai", "ai tập", "danh sách tập", "ai có lịch")) {
            if (!ChatTopic.WHO_TODAY.allowedFor(user)) {
                return "Bạn không có quyền xem danh sách hội viên khác. Vui lòng liên hệ ban quản lý hoặc huấn luyện viên.";
            }
            return chatAssistantService.answer(user, ChatTopic.WHO_TODAY);
        }

        if (containsAny(lower, "lịch hôm nay", "hôm nay tập gì", "buổi tập hôm nay", "lịch tập hôm nay", "hôm nay có tập")) {
            return chatAssistantService.answer(user, ChatTopic.SCHEDULE_TODAY);
        }

        if (containsAny(lower, "buổi tiếp", "kế tiếp", "buổi tới", "sắp tới", "bao giờ tập", "khi nào tập")) {
            return chatAssistantService.answer(user, ChatTopic.NEXT_SESSION);
        }

        if (containsAny(lower, "gói của tôi", "gói tập", "còn hạn", "hết hạn", "còn bao lâu", "buổi pt", "thời hạn gói")) {
            if (!ChatTopic.MY_PACKAGE.allowedFor(user)) {
                return "Chức năng xem gói tập cá nhân chỉ dành cho tài khoản Hội viên.";
            }
            return chatAssistantService.answer(user, ChatTopic.MY_PACKAGE);
        }

        if (containsAny(lower, "bài tập hôm nay", "động tác hôm nay", "giáo án hôm nay")) {
            if (!ChatTopic.TODAY_EXERCISES.allowedFor(user)) {
                return "Chức năng xem bài tập trong giáo án hôm nay chỉ dành cho tài khoản Hội viên.";
            }
            return chatAssistantService.answer(user, ChatTopic.TODAY_EXERCISES);
        }

        if (containsAny(lower, "kỹ thuật", "nhóm cơ", "bài tập ngực", "bài tập lưng", "bài tập chân", "bài tập vai", "bài tập tay")) {
            return chatAssistantService.answer(user, ChatTopic.EXERCISE_TIPS);
        }

        if (containsAny(lower, "thiết bị", "dụng cụ", "máy tập", "tạ đơn", "thanh đòn", "máy kéo cáp", "con lăn")) {
            return chatAssistantService.answer(user, ChatTopic.EQUIPMENT_GUIDE);
        }

        if (containsAny(lower, "giáo án mẫu", "lịch mẫu", "lịch tập mẫu", "gợi ý giáo án")) {
            return chatAssistantService.answer(user, ChatTopic.WORKOUT_PLANS);
        }

        if (containsAny(lower, "đau", "chấn thương", "nhức mỏi", "rách cơ", "chuột rút")) {
            return "GymFlow lưu ý: Nếu bạn gặp phải cảm giác đau nhức bất thường, chấn thương hoặc khó chịu cơ khớp, vui lòng DỪNG TẬP NGAY LẬP TỨC và tham khảo ý kiến của bác sĩ hoặc chuyên gia y tế. Không nên cố gắng tự tập khi đang có chấn thương.";
        }

        if (containsAny(lower, "trợ giúp", "hướng dẫn", "an toàn", "liên hệ", "lễ tân", "help")) {
            return chatAssistantService.answer(user, ChatTopic.HELP);
        }

        // Phản hồi mặc định khi không khớp chủ đề rõ ràng
        return "Xin chào! Trợ lý GymFlow đã tiếp nhận câu hỏi của bạn. " +
                "Hiện tại bạn có thể bấm vào các nút gợi ý nhanh bên dưới (lịch tập, gói tập, bài tập, thiết bị) " +
                "hoặc hỏi các câu hỏi như: \"Lịch tập hôm nay\", \"Gói của tôi còn bao lâu?\", \"Buổi tập tiếp theo khi nào?\". " +
                "Nếu cần hỗ trợ thêm, bạn có thể liên hệ quầy lễ tân hoặc HLV trực ca.";
    }

    private static boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) {
                return true;
            }
        }
        return false;
    }
}
