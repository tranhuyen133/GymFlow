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
import java.util.function.Supplier;

/**
 * Thu thập và định dạng dữ liệu thực tế từ MySQL để đưa vào ngữ cảnh (Grounding) của AI.
 *
 * <p>Phạm vi: chỉ hội viên (Role.MEMBER) và chỉ dữ liệu của chính họ. AI không trực tiếp
 * truy vấn DB, không sinh SQL; mọi con số đều do backend truy vấn rồi ghép vào prompt.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiDataGroundingService {

    private final ChatAssistantService chatAssistantService;

    public String buildGroundingContext(AuthUser user, String userQuery) {
        StringBuilder sb = new StringBuilder();
        sb.append("--- DỮ LIỆU HỆ THỐNG GYMFLOW (chỉ dùng dữ liệu này để trả lời) ---\n");
        if (user == null) {
            sb.append("Không có thông tin người dùng.\n");
            return sb.append("--- HẾT DỮ LIỆU HỆ THỐNG ---\n").toString();
        }

        sb.append("Người đang hỏi: ").append(user.fullName())
                .append(" · vai trò ").append(user.role().name()).append("\n\n");

        if (!user.isMember()) {
            sb.append("[PHẠM VI PHỤC VỤ]: Trợ lý AI chỉ phục vụ tài khoản hội viên (MEMBER) ")
                    .append("và chỉ trả lời dữ liệu của chính hội viên đang đăng nhập. ")
                    .append("Hãy lịch sự từ chối và hướng dẫn liên hệ quầy lễ tân nếu cần hỗ trợ.\n");
            return sb.append("--- HẾT DỮ LIỆU HỆ THỐNG ---\n").toString();
        }

        String lower = userQuery == null ? "" : userQuery.trim().toLowerCase(Locale.ROOT);
        Set<String> facts = new LinkedHashSet<>();

        // Dữ liệu cốt lõi của hội viên: luôn có trong prompt để AI trả lời đúng ngữ cảnh.
        addFact(facts, "Hồ sơ hội viên", () -> chatAssistantService.memberProfile(user));
        addFact(facts, "Gói tập của tôi", () -> chatAssistantService.myPackages(user));
        addFact(facts, "Giáo án đang áp dụng", () -> chatAssistantService.answer(user, ChatTopic.MY_PLAN));
        addFact(facts, "Lịch tập hôm nay", () -> chatAssistantService.answer(user, ChatTopic.SCHEDULE_TODAY));
        addFact(facts, "Buổi tập kế tiếp", () -> chatAssistantService.answer(user, ChatTopic.NEXT_SESSION));
        addFact(facts, "Buổi tập đã hoàn thành", () -> chatAssistantService.answer(user, ChatTopic.WORKOUT_HISTORY));
        addFact(facts, "Cân nặng và tiến độ", () -> chatAssistantService.answer(user, ChatTopic.MY_PROGRESS));

        // Dữ liệu bổ sung theo ý định của câu hỏi.
        if (containsAny(lower, "lịch", "tuần", "hôm nay", "sắp tới", "khi nào", "bao giờ", "thời gian", "mai")) {
            addFact(facts, "Lịch tập 7 ngày tới", () -> chatAssistantService.answer(user, ChatTopic.SCHEDULE_WEEK));
        }

        if (containsAny(lower, "bài tập", "động tác", "giáo án", "tập gì", "luyện tập", "hiệp", "rep")) {
            addFact(facts, "Bài tập trong giáo án hôm nay", () -> chatAssistantService.answer(user, ChatTopic.TODAY_EXERCISES));
            addFact(facts, "Lịch tập mẫu tham khảo", () -> chatAssistantService.answer(user, ChatTopic.WORKOUT_PLANS));
        }

        if (containsAny(lower, "gói", "giá", "bao nhiêu", "hạn", "hết hạn", "pt", "dịch vụ", "đăng ký", "mua")) {
            addFact(facts, "Gói tập hiện tại", () -> chatAssistantService.answer(user, ChatTopic.MY_PACKAGE));
            addFact(facts, "Các gói đang bán", () -> chatAssistantService.answer(user, ChatTopic.PLAN_CATALOG));
        }

        if (containsAny(lower, "kỹ thuật", "nhóm cơ", "ngực", "lưng", "vai", "tay", "chân", "bụng",
                "squat", "bench press", "deadlift")) {
            addFact(facts, "Hướng dẫn kỹ thuật và nhóm cơ", () -> chatAssistantService.answer(user, ChatTopic.EXERCISE_TIPS));
        }

        if (containsAny(lower, "thiết bị", "dụng cụ", "máy", "tạ", "đòn", "cáp", "kettlebell",
                "foam roller", "an toàn")) {
            addFact(facts, "Hướng dẫn thiết bị phòng gym", () -> chatAssistantService.answer(user, ChatTopic.EQUIPMENT_GUIDE));
        }

        if (containsAny(lower, "đau", "chấn thương", "mỏi", "nhức", "rách cơ", "chuột rút", "sưng", "gãy")) {
            facts.add("[LƯU Ý Y TẾ QUAN TRỌNG]: Nếu có dấu hiệu đau nhói bất thường, chấn thương khớp hoặc cơ: "
                    + "KHUYÊN HỘI VIÊN DỪNG TẬP NGAY LẬP TỨC và đến cơ sở y tế để được thăm khám. "
                    + "Trợ lý GymFlow không có chức năng chẩn đoán hay điều trị y tế.");
        }

        if (containsAny(lower, "hội viên khác", "người khác", "ai tập", "danh sách hội viên",
                "lịch của bạn khác", "thông tin người khác")) {
            facts.add("[QUY TẮC BẢO MẬT]: Đây là tài khoản HỘI VIÊN. Không được tiết lộ lịch tập, gói tập "
                    + "hay thông tin cá nhân của bất kỳ hội viên nào khác. Hãy từ chối lịch sự.");
        }

        for (String fact : facts) {
            sb.append(fact).append("\n\n");
        }

        sb.append("--- HẾT DỮ LIỆU HỆ THỐNG ---\n");
        sb.append("CHỈ DẪN TRÌNH BÀY: Chỉ trả lời dựa trên dữ liệu hệ thống ở trên, bằng tiếng Việt tự nhiên, ")
                .append("thân thiện và mạch lạc. Không bịa thêm ngày giờ, số buổi, số tiền hay tên giáo án. ")
                .append("Nếu dữ liệu không có, nói rõ \"Hiện tại hệ thống GymFlow chưa ghi nhận thông tin này của bạn\" ")
                .append("và gợi ý liên hệ quầy lễ tân/huấn luyện viên. Dùng in đậm cho thông tin quan trọng, ")
                .append("gạch đầu dòng khi liệt kê, có thể dùng bảng Markdown khi tóm tắt số liệu.");
        return sb.toString();
    }

    private void addFact(Set<String> facts, String label, Supplier<String> supplier) {
        try {
            String value = supplier.get();
            if (value != null && !value.isBlank()) {
                facts.add("[" + label + "]\n" + value);
            }
        } catch (Exception ex) {
            log.warn("Không lấy được dữ liệu grounding '{}': {}", label, ex.getMessage());
            facts.add("[" + label + "]\nHệ thống chưa lấy được dữ liệu này.");
        }
    }

    private static boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
