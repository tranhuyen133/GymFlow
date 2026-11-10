package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.ChatSuggestion;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Trả lời các câu hỏi sẵn bằng dữ liệu nội bộ của GymFlow.
 * Không dùng API key và không gọi dịch vụ AI bên ngoài.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatAssistantService {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM HH:mm");
    private static final String[] DOW = {"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"};

    private final AccessService access;
    private final WorkoutScheduleRepository scheduleRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final WorkoutPlanRepository planRepository;
    private final Mappers mappers;
    private final Clock clock;

    public List<ChatSuggestion> suggestions(AuthUser user) {
        return ChatTopic.forUser(user).stream()
                .map(topic -> new ChatSuggestion(topic.key(), topic.label()))
                .toList();
    }

    public String answer(AuthUser user, ChatTopic topic) {
        return switch (topic) {
            case SCHEDULE_TODAY -> scheduleToday(user);
            case WHO_TODAY -> whoToday(user);
            case NEXT_SESSION -> nextSession(user);
            case MY_PACKAGE -> myPackage(user);
            case TODAY_EXERCISES -> todayExercises(user);
            case EXERCISE_TIPS -> exerciseTips();
            case EQUIPMENT_GUIDE -> equipmentGuide();
            case WORKOUT_PLANS -> workoutPlansGuide();
            case HELP -> help();
        };
    }

    private String scheduleToday(AuthUser user) {
        List<WorkoutSchedule> sessions = todaySessions(user);
        if (sessions.isEmpty()) {
            return user.isMember()
                    ? "Hôm nay bạn chưa có buổi tập nào được lên lịch."
                    : "Hôm nay chưa có buổi tập nào được lên lịch.";
        }
        StringBuilder out = new StringBuilder(user.isMember()
                ? "Lịch tập hôm nay của bạn:\n"
                : "Lịch tập hôm nay (" + sessions.size() + " buổi):\n");
        for (WorkoutSchedule s : sessions) {
            out.append("• ").append(s.getStartTime().format(TIME)).append("–")
                    .append(s.getEndTime().format(TIME)).append(" · ");
            if (!user.isMember()) {
                out.append(s.getMember().getUser().getFullName()).append(" · ");
            }
            out.append(s.getTitle());
            if (s.getTrainer() != null) {
                out.append(" · HLV ").append(s.getTrainer().getUser().getFullName());
            }
            out.append(" [").append(statusLabel(s.getStatus())).append("]\n");
        }
        return out.toString().trim();
    }

    private String whoToday(AuthUser user) {
        List<WorkoutSchedule> sessions = todaySessions(user);
        if (sessions.isEmpty()) return "Hôm nay chưa có hội viên nào có lịch tập.";
        Map<Long, WorkoutSchedule> firstByMember = new LinkedHashMap<>();
        for (WorkoutSchedule s : sessions) {
            firstByMember.putIfAbsent(s.getMember().getId(), s);
        }
        StringBuilder out = new StringBuilder("Hôm nay có " + firstByMember.size() + " hội viên có lịch tập:\n");
        for (WorkoutSchedule s : firstByMember.values()) {
            out.append("• ").append(s.getStartTime().format(TIME)).append(" · ")
                    .append(s.getMember().getUser().getFullName())
                    .append(" (").append(s.getMember().getCode()).append(")")
                    .append(" – ").append(s.getTitle());
            if (user.isAdmin() && s.getTrainer() != null) {
                out.append(" · HLV ").append(s.getTrainer().getUser().getFullName());
            }
            out.append('\n');
        }
        return out.toString().trim();
    }

    private String nextSession(AuthUser user) {
        LocalDateTime now = LocalDateTime.now(clock);
        WorkoutSchedule next;
        if (user.isMember()) {
            Member member = access.requireMemberOf(user);
            next = scheduleRepository.findByMemberIdOrderByStartTimeAsc(member.getId()).stream()
                    .filter(s -> s.getStatus() == ScheduleStatus.SCHEDULED && s.getEndTime().isAfter(now))
                    .min(Comparator.comparing(WorkoutSchedule::getStartTime))
                    .orElse(null);
        } else {
            Long trainerId = user.isTrainer() ? access.requireTrainerOf(user).getId() : null;
            next = scheduleRepository.findInRange(now, now.plusDays(90), null, trainerId).stream()
                    .filter(s -> s.getStatus() == ScheduleStatus.SCHEDULED && s.getEndTime().isAfter(now))
                    .min(Comparator.comparing(WorkoutSchedule::getStartTime))
                    .orElse(null);
        }
        if (next == null) return "Chưa có buổi tập nào được lên lịch sắp tới.";

        StringBuilder out = new StringBuilder("Buổi tập kế tiếp: ")
                .append(next.getStartTime().format(DATE_TIME)).append("–")
                .append(next.getEndTime().format(TIME)).append("\n")
                .append("• ").append(next.getTitle()).append('\n');
        if (user.isMember()) {
            if (next.getTrainer() != null) {
                out.append("• HLV: ").append(next.getTrainer().getUser().getFullName()).append('\n');
            }
            if (next.getPlan() != null) {
                out.append("• Giáo án: ").append(next.getPlan().getName()).append('\n');
            }
        } else {
            out.append("• Hội viên: ").append(next.getMember().getUser().getFullName()).append('\n');
            if (next.getTrainer() != null) {
                out.append("• HLV: ").append(next.getTrainer().getUser().getFullName()).append('\n');
            }
        }
        return out.toString().trim();
    }

    private String myPackage(AuthUser user) {
        Member member = access.requireMemberOf(user);
        LocalDate today = LocalDate.now(clock);
        MemberSubscription current = mappers.pickCurrent(
                subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId()), today);
        if (current == null) {
            return "Bạn chưa có gói tập nào. Vui lòng liên hệ quầy để đăng ký hoặc gia hạn gói.";
        }
        SubscriptionState state = current.stateOn(today);
        long daysLeft = current.daysLeft(today);
        StringBuilder out = new StringBuilder("Gói tập hiện tại: ")
                .append(current.getPlan().getName()).append('\n')
                .append("• Hiệu lực: ").append(current.getStartDate().format(DATE))
                .append(" – ").append(current.getEndDate().format(DATE)).append('\n')
                .append("• Trạng thái: ").append(stateLabel(state)).append('\n');
        if (state != SubscriptionState.EXPIRED) {
            out.append("• Còn lại: ").append(daysLeft).append(" ngày\n");
        }
        return out.toString().trim();
    }

    private String todayExercises(AuthUser user) {
        Member member = access.requireMemberOf(user);
        LocalDate today = LocalDate.now(clock);
        int dayOfWeek = today.getDayOfWeek().getValue();

        WorkoutPlan plan = todaySessions(user).stream()
                .map(WorkoutSchedule::getPlan)
                .filter(Objects::nonNull)
                .findFirst()
                .orElseGet(() -> planRepository
                        .findFirstByMemberIdAndStatusOrderByStartDateDesc(member.getId(), PlanStatus.ACTIVE)
                        .orElse(null));
        if (plan == null) {
            return "Bạn chưa có giáo án đang hoạt động nên hôm nay chưa có bài tập theo giáo án.";
        }
        List<WorkoutPlanItem> items = plan.getItems().stream()
                .filter(i -> Objects.equals(i.getDayOfWeek(), dayOfWeek))
                .sorted(Comparator.comparing(WorkoutPlanItem::getSortOrder))
                .toList();
        if (items.isEmpty()) {
            return "Hôm nay (" + DOW[dayOfWeek - 1] + ") giáo án \"" + plan.getName() + "\" không có bài tập.";
        }
        StringBuilder out = new StringBuilder("Bài tập hôm nay (").append(DOW[dayOfWeek - 1])
                .append(") – giáo án ").append(plan.getName()).append(":\n");
        for (WorkoutPlanItem item : items) {
            out.append("• ").append(item.getExercise().getName()).append(": ")
                    .append(item.getSets()).append(" hiệp x ").append(item.getReps());
            if (item.getWeightKg() != null) out.append(" · ").append(item.getWeightKg()).append(" kg");
            out.append('\n');
        }
        return out.toString().trim();
    }

    private static String exerciseTips() {
        return """
                Gợi ý các bài tập cơ bản theo nhóm cơ chính tại GymFlow:
                • Ngực: Đẩy ngực đòn ngang (Bench Press), Đẩy ngực tạ đơn dốc lên (Incline Dumbbell Press), Hít đất (Push-up).
                • Lưng & Xô: Kéo xô (Lat Pulldown), Chèo thuyền cáp ngồi (Seated Cable Row), Hít xà đơn (Pull-up).
                • Đùi & Mông: Gánh tạ (Back Squat), Deadlift chân thẳng (Romanian Deadlift), Đạp đùi (Leg Press).
                • Vai: Đẩy vai tạ đơn (Overhead Press), Nâng tạ ngang (Lateral Raise).
                • Tay & Bụng: Cuốn tạ đơn (Bicep Curl), Ép cáp tay sau (Triceps Pushdown), Plank và Gập bụng (Crunch).

                💡 Mẹo: Bạn có thể vào "Thư viện bài tập" (/exercises) để xem kỹ thuật từng bước, nhịp thở và bản đồ giải phẫu cơ bắp chi tiết!""";
    }

    private static String equipmentGuide() {
        return """
                Hướng dẫn an toàn khi sử dụng thiết bị tại phòng gym:
                • Tạ tự do (Dumbbell, Barbell): Luôn kẹp khóa an toàn (collars) trên thanh đòn. Bắt đầu với mức tạ nhẹ để khởi động khớp.
                • Máy tập khối tạ (Pin-selected Machines): Chỉnh vị trí ghế và đệm tỳ trước khi cắm chốt tạ. Đặt mức tạ kiểm soát được trọn vẹn đường đi.
                • Dàn kéo cáp (Cable Station): Đảm bảo ròng rọc đã vào đúng khớp chốt nấc trước khi móc phụ kiện (dây thừng, tay cầm).
                • Máy Cardio (Treadmill, Bike): Kẹp dây dừng khẩn cấp vào áo khi chạy bộ; bấm Stop và chờ băng tải dừng hẳn trước khi bước xuống.

                💡 Bạn có thể tra cứu toàn bộ danh mục thiết bị và bài tập tương ứng tại "Dụng cụ tập" (/equipment).""";
    }

    private static String workoutPlansGuide() {
        return """
                Các khung lịch tập mẫu chuẩn khoa học được tích hợp trong GymFlow:
                • Toàn thân (Full Body) 3 buổi/tuần: T2 – T4 – T6. Rất phù hợp cho người mới bắt đầu hoặc người bận rộn.
                • Thân trên / Thân dưới (Upper/Lower) 4 buổi/tuần: T2, T3 và T5, T6. Cân bằng tối ưu giữa kích thích cơ và thời gian phục hồi.
                • Đẩy – Kéo – Chân (Push/Pull/Legs) 6 buổi/tuần: Tối ưu khối lượng tập luyện cho người đã có nền tảng thể lực.
                • Thể hình tại nhà không tạ (Bodyweight HIIT) 3 buổi/tuần: Tập luyện linh hoạt với trọng lượng cơ thể.

                💡 Bấm vào mục "Lịch tập mẫu" (/programs) để xem chi tiết từng buổi tập và chọn "Dùng làm giáo án"!""";
    }

    private static String help() {
        return """
                Trợ lý GymFlow trả lời nhanh bằng các nút câu hỏi sẵn:
                • Lịch tập hôm nay / Hôm nay ai tập: xem buổi tập theo vai trò.
                • Buổi tập kế tiếp: buổi sắp tới gần nhất.
                • Gói tập còn hạn / Bài tập hôm nay: dành cho hội viên.
                • Cần hỗ trợ thêm: liên hệ quầy hoặc huấn luyện viên phụ trách.
                • An toàn: dừng tập ngay nếu đau, chóng mặt hoặc khó thở bất thường. Nội dung chỉ mang tính tham khảo, không thay thế tư vấn y tế.""";
    }

    private List<WorkoutSchedule> todaySessions(AuthUser user) {
        LocalDate today = LocalDate.now(clock);
        Long memberId = user.isMember() ? access.requireMemberOf(user).getId() : null;
        Long trainerId = user.isTrainer() ? access.requireTrainerOf(user).getId() : null;
        return scheduleRepository.findInRange(today.atStartOfDay(), today.plusDays(1).atStartOfDay(), memberId, trainerId)
                .stream()
                .filter(s -> s.getStatus() != ScheduleStatus.CANCELLED)
                .toList();
    }

    private static String statusLabel(ScheduleStatus status) {
        return switch (status) {
            case SCHEDULED -> "Đã lên lịch";
            case COMPLETED -> "Hoàn thành";
            case MISSED -> "Vắng";
            case CANCELLED -> "Đã huỷ";
        };
    }

    private static String stateLabel(SubscriptionState state) {
        return switch (state) {
            case UPCOMING -> "Sắp hiệu lực";
            case ACTIVE -> "Đang hiệu lực";
            case EXPIRING -> "Sắp hết hạn";
            case EXPIRED -> "Đã hết hạn";
            case CANCELLED -> "Đã huỷ";
        };
    }
}
