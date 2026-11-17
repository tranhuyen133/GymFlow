package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.repository.WeightRecordRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền)
 * CẦN LÀM: Dựng ngữ cảnh dữ liệu của hội viên và gọi Gemini.
 *
 * <p>CHỈ phục vụ hội viên (Role.MEMBER) và chỉ đọc dữ liệu của chính họ.
 * Không gửi email, số điện thoại, mật khẩu hay lịch sử chat vào prompt.</p>
 */
@Service
@RequiredArgsConstructor
public class AiChatService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final String[] DOW = {"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"};

    /** Giữ phần dữ liệu ghép vào prompt khoảng 1500 ký tự để kiểm soát chi phí/token. */
    private static final int MAX_CONTEXT_CHARS = 1500;
    private static final int MAX_WEEK_SESSIONS = 10;
    private static final int MAX_ITEMS_PER_DAY = 8;

    private static final String SYSTEM_PROMPT =
            "Bạn là trợ lý tập luyện của phòng gym GymFlow, người hỏi là hội viên. "
                    + "Trả lời bằng tiếng Việt, tối đa 5 câu, CHỈ dựa trên dữ liệu bên dưới. "
                    + "Nếu không có thông tin thì nói là không có. Không đưa lời khuyên y tế.";

    private final UserRepository userRepository;
    private final AccessService access;
    private final MemberSubscriptionRepository subscriptionRepository;
    private final WorkoutPlanRepository planRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final WeightRecordRepository weightRepository;
    private final GeminiClient geminiClient;
    private final Clock clock;

    /**
     * Trả lời câu hỏi của hội viên dựa trên dữ liệu thật của chính họ.
     *
     * @param userId   id tài khoản đang đăng nhập (bắt buộc là MEMBER)
     * @param question câu hỏi hiện tại, không kèm lịch sử các câu trước
     */
    @Transactional(readOnly = true)
    public String chat(Long userId, String question) {
        if (question == null || question.isBlank()) {
            throw ApiException.badRequest("Vui lòng nhập câu hỏi");
        }

        String context = buildContext(userId);
        String prompt = SYSTEM_PROMPT
                + "\n\nDỮ LIỆU CỦA HỘI VIÊN:\n" + context
                + "\n\nCÂU HỎI: " + question.trim();
        return geminiClient.ask(prompt);
    }

    /**
     * Ghép dữ liệu của đúng hội viên thành các gạch đầu dòng ngắn.
     * Dùng AccessService để giữ đúng phạm vi dữ liệu AUTH-07 (chỉ dữ liệu của chính mình).
     */
    @Transactional(readOnly = true)
    public String buildContext(Long userId) {
        Member member = requireMember(userId);
        LocalDate today = LocalDate.now(clock);

        StringBuilder sb = new StringBuilder();
        sb.append("- Hôm nay: ").append(DOW[today.getDayOfWeek().getValue() - 1])
                .append(", ").append(today.format(DATE)).append('\n');
        appendSubscription(sb, member, today);
        appendActivePlan(sb, member);
        appendWeekSchedule(sb, member, today);
        appendRecentSessions(sb, member);
        appendRecentWeights(sb, member);
        return cap(sb.toString().trim(), MAX_CONTEXT_CHARS);
    }

    private Member requireMember(Long userId) {
        if (userId == null) {
            throw ApiException.unauthorized("Phiên đăng nhập không hợp lệ");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("tài khoản"));
        if (user.getRole() != Role.MEMBER) {
            throw ApiException.forbidden("Trợ lý AI chỉ dành cho hội viên");
        }
        AuthUser auth = new AuthUser(user.getId(), user.getEmail(), user.getRole(), user.getFullName());
        return access.requireMemberOf(auth);
    }

    private void appendSubscription(StringBuilder sb, Member member, LocalDate today) {
        MemberSubscription current = subscriptionRepository
                .findFirstByMemberIdAndCancelledFalseAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByEndDateDesc(
                        member.getId(), today, today)
                .orElseGet(() -> subscriptionRepository.findByMemberIdOrderByStartDateDesc(member.getId())
                        .stream().findFirst().orElse(null));

        if (current == null) {
            sb.append("- Gói tập: chưa có\n");
            return;
        }
        String name = current.getPlanNameSnapshot() != null && !current.getPlanNameSnapshot().isBlank()
                ? current.getPlanNameSnapshot()
                : current.getPlan().getName();
        long daysLeft = Math.max(0, ChronoUnit.DAYS.between(today, current.getEndDate()));
        sb.append("- Gói tập: ").append(name)
                .append(", hết hạn ").append(current.getEndDate().format(DATE))
                .append(", còn ").append(daysLeft).append(" ngày\n");
    }

    private void appendActivePlan(StringBuilder sb, Member member) {
        WorkoutPlan plan = planRepository
                .findFirstByMemberIdAndStatusOrderByStartDateDesc(member.getId(), PlanStatus.ACTIVE)
                .orElse(null);
        if (plan == null) {
            sb.append("- Giáo án: chưa có\n");
            return;
        }
        sb.append("- Giáo án: ").append(plan.getName()).append('\n');

        Map<Integer, List<WorkoutPlanItem>> itemsByDay = new LinkedHashMap<>();
        for (WorkoutPlanItem item : plan.getItems()) {
            if (item.getDayOfWeek() == null) continue;
            itemsByDay.computeIfAbsent(item.getDayOfWeek(), key -> new ArrayList<>()).add(item);
        }
        for (Map.Entry<Integer, List<WorkoutPlanItem>> entry : itemsByDay.entrySet()) {
            int day = entry.getKey();
            if (day < 1 || day > 7) continue;
            List<WorkoutPlanItem> items = entry.getValue().stream()
                    .sorted(Comparator.comparing(WorkoutPlanItem::getSortOrder))
                    .limit(MAX_ITEMS_PER_DAY)
                    .toList();
            String line = items.stream()
                    .map(item -> item.getExercise().getName() + " " + item.getSets() + "x" + item.getReps())
                    .collect(Collectors.joining(", "));
            sb.append("  + ").append(DOW[day - 1]).append(": ").append(line).append('\n');
        }
    }

    private void appendWeekSchedule(StringBuilder sb, Member member, LocalDate today) {
        List<WorkoutSchedule> sessions = scheduleRepository.findInRange(
                        today.atStartOfDay(), today.plusDays(7).atStartOfDay(), member.getId(), null)
                .stream()
                .filter(s -> s.getStatus() != ScheduleStatus.CANCELLED)
                .limit(MAX_WEEK_SESSIONS)
                .toList();
        if (sessions.isEmpty()) {
            sb.append("- Lịch 7 ngày tới: chưa có\n");
            return;
        }
        sb.append("- Lịch 7 ngày tới:\n");
        for (WorkoutSchedule session : sessions) {
            String trainer = session.getTrainer() != null && session.getTrainer().getUser() != null
                    ? session.getTrainer().getUser().getFullName()
                    : "không có HLV";
            sb.append("  + ").append(session.getStartTime().format(DAY)).append(' ')
                    .append(session.getStartTime().format(TIME)).append('-')
                    .append(session.getEndTime().format(TIME))
                    .append(", HLV: ").append(trainer).append('\n');
        }
    }

    private void appendRecentSessions(StringBuilder sb, Member member) {
        List<WorkoutSchedule> recent = scheduleRepository
                .findTop5ByMemberIdAndStatusInOrderByStartTimeDesc(
                        member.getId(), List.of(ScheduleStatus.COMPLETED, ScheduleStatus.MISSED));
        if (recent.isEmpty()) {
            sb.append("- 5 buổi gần nhất: chưa có\n");
            return;
        }
        sb.append("- 5 buổi gần nhất:\n");
        for (WorkoutSchedule session : recent) {
            sb.append("  + ").append(session.getStartTime().format(DAY))
                    .append(": ").append(session.getStatus() == ScheduleStatus.COMPLETED ? "hoàn thành" : "vắng")
                    .append('\n');
        }
    }

    private void appendRecentWeights(StringBuilder sb, Member member) {
        List<WeightRecord> weights = weightRepository
                .findTop3ByMemberIdOrderByRecordedDateDesc(member.getId());
        if (weights.isEmpty()) {
            sb.append("- 3 lần cân gần nhất: chưa có\n");
            return;
        }
        sb.append("- 3 lần cân gần nhất:\n");
        for (WeightRecord record : weights) {
            sb.append("  + ").append(record.getRecordedDate().format(DAY))
                    .append(": ").append(record.getWeightKg()).append(" kg\n");
        }
    }

    private static String cap(String text, int maxChars) {
        if (text.length() <= maxChars) return text;
        return text.substring(0, maxChars - 1).trim() + "…";
    }
}
