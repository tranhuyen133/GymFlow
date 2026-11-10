package com.gymflow.ai;

import com.gymflow.security.AuthUser;
import com.gymflow.service.ChatAssistantService;
import com.gymflow.service.ChatTopic;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Thu thập và định dạng dữ liệu thực tế từ hệ thống GymFlow để đưa vào ngữ cảnh (Grounding) của AI.
 * Đảm bảo: AI không trực tiếp truy vấn DB, không sinh SQL, và tuân thủ nghiêm ngặt quyền của người dùng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiDataGroundingService {

    private final ChatAssistantService chatAssistantService;

    public String buildGroundingContext(AuthUser user, String userQuery) {
        if (user == null) {
            return "Không có thông tin người dùng.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("--- DỮ LIỆU HỆ THỐNG GYMFLOW (Chỉ dùng dữ liệu này để trả lời) ---\n");
        sb.append("Tên người dùng: ").append(user.fullName()).append("\n");
        sb.append("Vai trò trong hệ thống: ").append(user.role().name()).append("\n\n");

        String lower = (userQuery == null ? "" : userQuery.trim().toLowerCase(Locale.ROOT));
        Set<String> facts = new LinkedHashSet<>();

        // 1. Kiểm tra yêu cầu bảo mật / danh sách hội viên khác
        if (containsAny(lower, "ai tập", "danh sách hội viên", "người khác", "lịch người khác", "hội viên khác", "thông tin người khác")) {
            if (user.isAdmin() || user.isTrainer()) {
                facts.add("[Lịch hội viên hôm nay]:\n" + chatAssistantService.answer(user, ChatTopic.WHO_TODAY));
            } else {
                facts.add("[CẢNH BÁO BẢO MẬT]: Người dùng này là HỘI VIÊN (MEMBER), KHÔNG CÓ QUYỀN xem lịch tập hoặc thông tin của bất kỳ hội viên nào khác. Bạn phải từ chối rõ ràng và giải thích nguyên tắc bảo mật thông tin cá nhân của GymFlow.");
            }
        }

        // 2. Lịch tập hôm nay & Buổi tập kế tiếp
        if (containsAny(lower, "hôm nay", "lịch", "tập gì", "kế tiếp", "tiếp theo", "sắp tới", "bao giờ", "khi nào", "thời gian")) {
            facts.add("[Lịch tập hôm nay]:\n" + chatAssistantService.answer(user, ChatTopic.SCHEDULE_TODAY));
            facts.add("[Buổi tập kế tiếp gần nhất]:\n" + chatAssistantService.answer(user, ChatTopic.NEXT_SESSION));
        }

        // 3. Gói tập & số buổi PT (cho Hội viên)
        if (containsAny(lower, "gói", "hạn", "bao lâu", "hết hạn", "ngày", "pt", "dịch vụ", "đăng ký")) {
            if (ChatTopic.MY_PACKAGE.allowedFor(user)) {
                facts.add("[Thông tin gói tập hiện tại]:\n" + chatAssistantService.answer(user, ChatTopic.MY_PACKAGE));
            } else {
                facts.add("[Gói tập]: Tài khoản Huấn luyện viên / Quản trị viên không sở hữu gói tập hội viên.");
            }
        }

        // 4. Bài tập trong ngày / giáo án
        if (containsAny(lower, "bài tập", "động tác", "giáo án", "luyện tập", "hôm nay tập gì")) {
            if (ChatTopic.TODAY_EXERCISES.allowedFor(user)) {
                facts.add("[Bài tập trong giáo án hôm nay]:\n" + chatAssistantService.answer(user, ChatTopic.TODAY_EXERCISES));
            }
            facts.add("[Gợi ý giáo án mẫu & chia lịch]:\n" + chatAssistantService.answer(user, ChatTopic.WORKOUT_PLANS));
        }

        // 5. Kỹ thuật bài tập & Nhóm cơ
        if (containsAny(lower, "kỹ thuật", "nhóm cơ", "ngực", "lưng", "vai", "tay", "chân", "bụng", "squat", "bench press", "deadlift")) {
            facts.add("[Hướng dẫn kỹ thuật bài tập & nhóm cơ]:\n" + chatAssistantService.answer(user, ChatTopic.EXERCISE_TIPS));
        }

        // 6. Dụng cụ & Thiết bị
        if (containsAny(lower, "thiết bị", "dụng cụ", "máy", "tạ", "đòn", "cáp", "kettlebell", "foam roller", "an toàn")) {
            facts.add("[Hướng dẫn thiết bị phòng gym]:\n" + chatAssistantService.answer(user, ChatTopic.EQUIPMENT_GUIDE));
        }

        // 7. Cảnh báo chấn thương / đau nhức
        if (containsAny(lower, "đau", "chấn thương", "mỏi", "nhức", "rách cơ", "chuột rút", "sưng", "gãy")) {
            facts.add("[LƯU Ý Y TẾ QUAN TRỌNG]: Nếu có dấu hiệu đau nhói bất thường, chấn thương khớp hoặc cơ: KHUYÊN HỘI VIÊN DỪNG TẬP NGAY LẬP TỨC và đến cơ sở y tế để được thăm khám. Trợ lý GymFlow không có chức năng chẩn đoán hay điều trị y tế.");
        }

        // Nếu không khớp từ khoá nào cụ thể, cung cấp dữ liệu cơ bản tổng quan về người dùng
        if (facts.isEmpty()) {
            facts.add("[Lịch tập hôm nay]:\n" + chatAssistantService.answer(user, ChatTopic.SCHEDULE_TODAY));
            facts.add("[Buổi tập kế tiếp gần nhất]:\n" + chatAssistantService.answer(user, ChatTopic.NEXT_SESSION));
            if (ChatTopic.MY_PACKAGE.allowedFor(user)) {
                facts.add("[Thông tin gói tập hiện tại]:\n" + chatAssistantService.answer(user, ChatTopic.MY_PACKAGE));
            }
            facts.add("[Trợ giúp & an toàn]:\n" + chatAssistantService.answer(user, ChatTopic.HELP));
        }

        for (String fact : facts) {
            sb.append(fact).append("\n\n");
        }

        sb.append("--- HẾT DỮ LIỆU HỆ THỐNG ---\n");
        sb.append("CHỈ DẪN TRÌNH BÀY: Dựa vào các thông tin hệ thống trên, hãy soạn câu trả lời bằng tiếng Việt tự nhiên, thân thiện và mạch lạc. Sử dụng định dạng văn bản trực quan (in đậm các thông tin then chốt, gạch đầu dòng danh sách, hoặc bảng tóm tắt nếu cần) để người dùng dễ theo dõi.");
        return sb.toString();
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
