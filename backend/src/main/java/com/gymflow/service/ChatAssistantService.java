package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.ChatSuggestion;
import com.gymflow.dto.Dtos.ProgressResponse;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.MembershipPlanRepository;
import com.gymflow.repository.PtSessionUsageRepository;
import com.gymflow.repository.WorkoutLogRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Trả lời các câu hỏi sẵn bằng dữ liệu nội bộ của GymFlow.
 * Không dùng API key và không gọi dịch vụ AI bên ngoài.
 *
 * <p>Dữ liệu ở đây cũng là nguồn "grounding" cho Gemini: mọi câu trả lời của AI
 * chỉ được tổng hợp từ các fact do service này truy vấn từ MySQL theo đúng
 * hội viên đang đăng nhập.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatAssistantService {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM HH:mm");
    private static final String[] DOW = {"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"};

    private static final int WEEK_DAYS = 7;
    private static final int HISTORY_LIMIT = 8;
    private static final int PACKAGE_LIMIT = 6;
    private static final int CATALOG_LIMIT = 10;

    private final AccessService access;
    private final WorkoutScheduleRepository scheduleRepository;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final WorkoutPlanRepository planRepository;
    private final WorkoutLogRepository logRepository;
    private final PtSessionUsageRepository ptUsageRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    private final ProgressService progressService;
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
            case SCHEDULE_WEEK -> scheduleWeek(user);
            case WHO_TODAY -> whoToday(user);
            case NEXT_SESSION -> nextSession(user);
            case MY_PACKAGE -> myPackage(user);
            case MY_PLAN -> myPlan(user);
            case MY_PROGRESS -> myProgress(user);
            case WORKOUT_HISTORY -> workoutHistory(user);
            case TODAY_EXERCISES -> todayExercises(user);
            case PLAN_CATALOG -> planCatalog();
            case EXERCISE_TIPS -> exerciseTips();
            case EQUIPMENT_GUIDE -> equipmentGuide();
            case WORKOUT_PLANS -> workoutPlansGuide();
            case HELP -> help();
        };
    }

    /** Hồ sơ hội viên dùng làm ngữ cảnh cho AI, không phải một nút câu hỏi. */
    public String memberProfile(AuthUser user) {
        Member m = access.requireMemberOf(user);
        StringBuilder out = new StringBuilder("Hội viên: ").append(m.getUser().getFullName())
                .append(" (mã ").append(m.getCode()).append(")\n");
        if (m.getGoal() != null && !m.getGoal().isBlank()) {
            out.append("• Mục tiêu: ").append(m.getGoal()).append('\n');
        }
        if (m.getHeightCm() != null) {
            out.append("• Chiều cao: ").append(m.getHeightCm()).append(" cm\n");
        }
        out.append("• Trạng thái: ")
                .append(m.getStatus() == MemberStatus.ACTIVE ? "Đang hoạt động" : statusLabel(m.getStatus()))
                .append('\n');
        if (m.getTrainer() != null && m.getTrainer().getUser() != null) {
            out.append("• HLV phụ trách: ").append(m.getTrainer().getUser().getFullName()).append('\n');
        } else {
            out.append("• HLV phụ trách: chưa có (bạn tự soạn giáo án và xếp lịch)\n");
        }
        return out.toString().trim();
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

    private String scheduleWeek(AuthUser user) {
        Member member = access.requireMemberOf(user);
        LocalDate today = LocalDate.now(clock);
        List<WorkoutSchedule> sessions = scheduleRepository.findInRange(
                        today.atStartOfDay(), today.plusDays(WEEK_DAYS).atStartOfDay(), member.getId(), null)
                .stream()
                .filter(s -> s.getStatus() != ScheduleStatus.CANCELLED)
                .toList();
        if (sessions.isEmpty()) {
            return "7 ngày tới bạn chưa có buổi tập nào được lên lịch.";
        }
        StringBuilder out = new StringBuilder("Lịch tập 7 ngày tới của bạn:\n");
        for (WorkoutSchedule s : sessions) {
            out.append("• ").append(s.getStartTime().format(DATE_TIME)).append("–")
                    .append(s.getEndTime().format(TIME)).append(" · ").append(s.getTitle());
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

    /** Toàn bộ gói của hội viên kèm số buổi PT còn lại (dùng cho cả grounding AI). */
    public String myPackages(AuthUser user) {
        Member member = access.requireMemberOf(user);
        LocalDate today = LocalDate.now(clock);
        List<MemberSubscription> subs = subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId());
        if (subs.isEmpty()) {
            return "Bạn chưa có gói tập nào. Vui lòng liên hệ quầy để đăng ký hoặc gia hạn gói.";
        }
        StringBuilder out = new StringBuilder("Gói tập của bạn:\n");
        for (MemberSubscription s : subs.stream().limit(PACKAGE_LIMIT).toList()) {
            SubscriptionState state = s.stateOn(today);
            out.append("• ").append(s.getPlan().getName())
                    .append(" (").append(s.getStartDate().format(DATE)).append(" – ")
                    .append(s.getEndDate().format(DATE)).append(")")
                    .append(" · ").append(stateLabel(state));
            if (state == SubscriptionState.ACTIVE || state == SubscriptionState.EXPIRING) {
                out.append(" · còn ").append(s.daysLeft(today)).append(" ngày");
            }
            if (s.getPtSessionsTotal() != null) {
                long used = s.getId() == null ? 0 : ptUsageRepository.countBySubscriptionId(s.getId());
                long left = Math.max(0, s.getPtSessionsTotal() - used);
                out.append(" · PT còn ").append(left).append('/').append(s.getPtSessionsTotal()).append(" buổi");
            }
            out.append('\n');
        }
        if (subs.size() > PACKAGE_LIMIT) {
            out.append("• ... còn ").append(subs.size() - PACKAGE_LIMIT).append(" gói cũ hơn\n");
        }
        return out.toString().trim();
    }

    /** Giáo án đang áp dụng, đầy đủ các thứ trong tuần. */
    private String myPlan(AuthUser user) {
        Member member = access.requireMemberOf(user);
        WorkoutPlan plan = planRepository
                .findFirstByMemberIdAndStatusOrderByStartDateDesc(member.getId(), PlanStatus.ACTIVE)
                .orElse(null);
        if (plan == null) {
            return "Bạn chưa có giáo án đang áp dụng. Vào mục **Giáo án** để xem hoặc chọn một giáo án mẫu.";
        }
        Map<Integer, List<WorkoutPlanItem>> itemsByDay = new LinkedHashMap<>();
        for (WorkoutPlanItem item : plan.getItems()) {
            if (item.getDayOfWeek() == null) continue;
            itemsByDay.computeIfAbsent(item.getDayOfWeek(), key -> new ArrayList<>()).add(item);
        }
        itemsByDay.values().forEach(items -> items.sort(Comparator.comparing(WorkoutPlanItem::getSortOrder)));

        StringBuilder out = new StringBuilder("Giáo án đang áp dụng: ").append(plan.getName())
                .append(" (").append(plan.getStartDate().format(DATE)).append(" – ")
                .append(plan.getEndDate().format(DATE)).append(")\n");
        for (int day = 1; day <= 7; day++) {
            List<WorkoutPlanItem> items = itemsByDay.get(day);
            if (items == null || items.isEmpty()) continue;
            List<String> parts = new ArrayList<>();
            for (WorkoutPlanItem item : items) {
                StringBuilder part = new StringBuilder(item.getExercise().getName())
                        .append(' ').append(item.getSets()).append('x').append(item.getReps());
                if (item.getWeightKg() != null) part.append(" @").append(item.getWeightKg()).append("kg");
                if (item.getRestSeconds() != null) part.append(" (nghỉ ").append(item.getRestSeconds()).append("s)");
                parts.add(part.toString());
            }
            out.append("• ").append(DOW[day - 1]).append(": ").append(String.join("; ", parts)).append('\n');
        }
        return out.toString().trim();
    }

    /** Cân nặng, BMI, chuyên cần và tổng hợp buổi tập (dùng ProgressService của module tiến độ). */
    private String myProgress(AuthUser user) {
        Member member = access.requireMemberOf(user);
        ProgressResponse progress = progressService.progress(user, member.getId());
        if (progress.currentWeight() == null) {
            return "Bạn chưa ghi cân nặng nào. Vào mục **Tiến độ** để nhập cân nặng, số đo và theo dõi thay đổi.";
        }
        StringBuilder out = new StringBuilder("Tiến độ của bạn:\n")
                .append("• Cân nặng hiện tại: ").append(progress.currentWeight()).append(" kg\n");
        if (progress.startWeight() != null) {
            out.append("• Cân nặng ban đầu: ").append(progress.startWeight()).append(" kg\n");
        }
        if (progress.weightChange() != null) {
            out.append("• Thay đổi: ").append(signedKg(progress.weightChange())).append('\n');
        }
        if (progress.bodyFat() != null) {
            out.append("• Tỷ lệ mỡ: ").append(progress.bodyFat()).append("%\n");
        }
        if (progress.bmi() != null) {
            out.append("• BMI: ").append(progress.bmi())
                    .append(progress.bmiCategory() == null ? "" : " (" + progress.bmiCategory() + ")")
                    .append('\n');
        }
        out.append("• Số buổi đã tập: ").append(progress.totalSessions()).append('\n');
        if (progress.totalMinutes() > 0) {
            out.append("• Tổng thời lượng: ").append(progress.totalMinutes()).append(" phút\n");
        }
        if (progress.totalCalories() > 0) {
            out.append("• Tổng calo: ").append(progress.totalCalories()).append(" kcal\n");
        }
        if (progress.attendanceRate() != null) {
            out.append("• Chuyên cần 8 tuần: ").append(progress.attendanceRate()).append("%\n");
        }
        if (progress.streakWeeks() > 0) {
            out.append("• Chuỗi tuần liên tiếp có tập: ").append(progress.streakWeeks()).append(" tuần\n");
        }
        if (progress.avgRating() != null) {
            out.append("• Đánh giá trung bình: ").append(progress.avgRating()).append("/5\n");
        }
        return out.toString().trim();
    }

    /** Các buổi đã ghi nhận hoàn thành (WorkoutLog), mới nhất trước. */
    private String workoutHistory(AuthUser user) {
        Member member = access.requireMemberOf(user);
        List<WorkoutLog> all = logRepository.findByMemberIdOrderByCompletedAtDesc(member.getId());
        if (all.isEmpty()) {
            return "Bạn chưa có buổi tập nào được ghi nhận hoàn thành.";
        }
        StringBuilder out = new StringBuilder("Các buổi tập đã hoàn thành gần đây:\n");
        for (WorkoutLog log : all.stream().limit(HISTORY_LIMIT).toList()) {
            String title = log.getSchedule() != null && log.getSchedule().getTitle() != null
                    ? log.getSchedule().getTitle() : "Buổi tập";
            out.append("• ").append(log.getCompletedAt().format(DATE_TIME)).append(" · ").append(title);
            if (log.getDurationMinutes() != null) {
                out.append(" · ").append(log.getDurationMinutes()).append(" phút");
            }
            if (log.getCalories() != null) {
                out.append(" · ").append(log.getCalories()).append(" kcal");
            }
            if (log.getRating() != null) {
                out.append(" · ").append(log.getRating()).append("/5 sao");
            }
            out.append('\n');
        }
        out.append("Tổng cộng: ").append(all.size()).append(" buổi đã hoàn thành.");
        return out.toString().trim();
    }

    /** Danh mục gói đang bán để tư vấn giá và quyền lợi. */
    private String planCatalog() {
        List<MembershipPlan> plans = membershipPlanRepository.findByActiveTrueOrderByPriceAsc();
        if (plans.isEmpty()) return "Hiện chưa có gói tập nào đang bán.";
        StringBuilder out = new StringBuilder("Các gói tập đang bán tại GymFlow:\n");
        for (MembershipPlan plan : plans.stream().limit(CATALOG_LIMIT).toList()) {
            out.append("• ").append(plan.getName()).append(": ").append(money(plan.getPrice()))
                    .append(" · ").append(plan.getDurationDays()).append(" ngày");
            if (plan.getPtSessions() != null) {
                out.append(" · ").append(plan.getPtSessions()).append(" buổi PT");
            }
            if (plan.isIncludesTrainer()) {
                out.append(" · kèm HLV");
            }
            out.append('\n');
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
                • Tay & Bụng: Cuốn tạ đơn (Bicep Curl), Ép cáp tay sau (Triceps Pushdown), Plank và Gập bụng (Crunch).""";
    }

    private static String equipmentGuide() {
        return """
                Hướng dẫn an toàn khi sử dụng thiết bị tại phòng gym:
                • Tạ tự do (Dumbbell, Barbell): Luôn kẹp khóa an toàn (collars) trên thanh đòn. Bắt đầu với mức tạ nhẹ để khởi động khớp.
                • Máy tập khối tạ (Pin-selected Machines): Chỉnh vị trí ghế và đệm tỳ trước khi cắm chốt tạ. Đặt mức tạ kiểm soát được trọn vẹn đường đi.
                • Dàn kéo cáp (Cable Station): Đảm bảo ròng rọc đã vào đúng khớp chốt nấc trước khi móc phụ kiện (dây thừng, tay cầm).
                • Máy Cardio (Treadmill, Bike): Kẹp dây dừng khẩn cấp vào áo khi chạy bộ; bấm Stop và chờ băng tải dừng hẳn trước khi bước xuống.""";
    }

    private static String workoutPlansGuide() {
        return """
                Các khung lịch tập mẫu chuẩn khoa học được tích hợp trong GymFlow:
                • Toàn thân (Full Body) 3 buổi/tuần: T2 – T4 – T6. Rất phù hợp cho người mới bắt đầu hoặc người bận rộn.
                • Thân trên / Thân dưới (Upper/Lower) 4 buổi/tuần: T2, T3 và T5, T6. Cân bằng tối ưu giữa kích thích cơ và thời gian phục hồi.
                • Đẩy – Kéo – Chân (Push/Pull/Legs) 6 buổi/tuần: Tối ưu khối lượng tập luyện cho người đã có nền tảng thể lực.
                • Thể hình tại nhà không tạ (Bodyweight HIIT) 3 buổi/tuần: Tập luyện linh hoạt với trọng lượng cơ thể.""";
    }

    private static String help() {
        return """
                Trợ lý GymFlow trả lời câu hỏi của hội viên bằng dữ liệu thật của chính bạn:
                • Lịch tập hôm nay / 7 ngày tới / buổi kế tiếp: xem buổi đã lên lịch, HLV và trạng thái.
                • Gói tập còn hạn / Gói tập & giá: hạn dùng, số ngày còn lại, số buổi PT còn lại và gói đang bán.
                • Giáo án của tôi / Bài tập hôm nay: toàn bộ lịch tập theo giáo án đang áp dụng.
                • Buổi đã tập / Cân nặng & tiến độ: lịch sử buổi tập, calo, BMI và chuyên cần.
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

    private static String statusLabel(MemberStatus status) {
        return switch (status) {
            case ACTIVE -> "Đang hoạt động";
            case PAUSED -> "Tạm ngừng";
            case INACTIVE -> "Đã ngừng";
        };
    }

    private static String signedKg(Double value) {
        if (value == null) return "chưa có";
        String sign = value > 0 ? "+" : "";
        return sign + value + " kg";
    }

    private static String money(Long amount) {
        if (amount == null) return "liên hệ";
        return java.text.NumberFormat.getInstance(Locale.of("vi", "VN")).format(amount) + " đ";
    }
}
