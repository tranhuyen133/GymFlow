package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.repository.*;
import com.gymflow.service.mail.EmailTemplates;
import com.gymflow.service.mail.EmailTemplates.Absent;
import com.gymflow.service.mail.EmailTemplates.Offer;
import com.gymflow.service.mail.EmailTemplates.Session;
import com.gymflow.service.mail.EmailTemplates.WeekStats;
import com.gymflow.service.mail.MailOutbox;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.IsoFields;
import java.util.*;
import java.util.function.Supplier;

/**
 * V55 · Các email tự động chạy theo giờ (múi giờ Việt Nam). Mỗi việc làm 2 bước:
 * (1) đọc dữ liệu trong một giao dịch chỉ đọc, gom thành danh sách "việc gửi" chỉ chứa dữ liệu thường;
 * (2) gửi từng email ngoài giao dịch – SMTP chậm hay lỗi không giữ khoá CSDL, mỗi email ghi nhật ký riêng.
 * Chống gửi trùng nhờ (loại, mã sự kiện) duy nhất trong email_logs, nên chạy lại bao nhiêu lần cũng an toàn.
 */
@Slf4j
@Service
public class EmailJobs {

    private static final String ZONE = "Asia/Ho_Chi_Minh";
    private static final DateTimeFormatter VI_DM = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");
    public static final int RETENTION_DAYS = 10;

    private final MemberSubscriptionRepository subscriptionRepository;
    private final PromotionRepository promotionRepository;
    private final EngagementQueryRepository queries;
    private final TrainerRepository trainerRepository;
    private final WorkoutLogRepository workoutLogRepository;
    private final GymCheckinRepository checkinRepository;
    private final WorkoutScheduleRepository scheduleRepository;
    private final MemberBadgeRepository badgeRepository;
    private final BadgeService badgeService;
    private final TrainerStatsService trainerStatsService;
    private final MailOutbox outbox;
    private final EmailTemplates templates;
    private final TransactionTemplate readTx;
    private final Clock clock;

    @Value("${app.mail.jobs-enabled:true}")
    private boolean enabled;

    public EmailJobs(MemberSubscriptionRepository subscriptionRepository, PromotionRepository promotionRepository,
                     EngagementQueryRepository queries, TrainerRepository trainerRepository,
                     WorkoutLogRepository workoutLogRepository, GymCheckinRepository checkinRepository,
                     WorkoutScheduleRepository scheduleRepository, MemberBadgeRepository badgeRepository,
                     BadgeService badgeService, TrainerStatsService trainerStatsService, MailOutbox outbox,
                     EmailTemplates templates, PlatformTransactionManager transactionManager, Clock clock) {
        this.subscriptionRepository = subscriptionRepository;
        this.promotionRepository = promotionRepository;
        this.queries = queries;
        this.trainerRepository = trainerRepository;
        this.workoutLogRepository = workoutLogRepository;
        this.checkinRepository = checkinRepository;
        this.scheduleRepository = scheduleRepository;
        this.badgeRepository = badgeRepository;
        this.badgeService = badgeService;
        this.trainerStatsService = trainerStatsService;
        this.outbox = outbox;
        this.templates = templates;
        this.readTx = new TransactionTemplate(transactionManager);
        this.readTx.setReadOnly(true);
        this.clock = clock;
    }

    // ---------- Lịch chạy ----------
    @Scheduled(cron = "0 0 8 * * *", zone = ZONE)
    public void scheduledRenewal() { if (enabled) safe(EmailKind.RENEWAL); }

    @Scheduled(cron = "0 30 8 * * *", zone = ZONE)
    public void scheduledBirthday() { if (enabled) safe(EmailKind.BIRTHDAY); }

    @Scheduled(cron = "0 0 19 * * *", zone = ZONE)
    public void scheduledSessionReminder() { if (enabled) safe(EmailKind.SESSION_REMINDER); }

    @Scheduled(cron = "0 30 7 * * MON", zone = ZONE)
    public void scheduledWeeklyDigest() { if (enabled) safe(EmailKind.WEEKLY_DIGEST); }

    @Scheduled(cron = "0 0 7 * * *", zone = ZONE)
    public void scheduledTrainerReport() { if (enabled) safe(EmailKind.TRAINER_REPORT); }

    @Scheduled(cron = "0 0 10 * * *", zone = ZONE)
    public void scheduledRetention() { if (enabled) safe(EmailKind.RETENTION); }

    /** 00:30 – sau khi hệ thống tự đánh vắng (00:05): tính huy hiệu cho mọi hội viên, gửi email huy hiệu đạt hôm qua. */
    @Scheduled(cron = "0 30 0 * * *", zone = ZONE)
    public void scheduledBadges() { safe(EmailKind.ACHIEVEMENT); }

    public static String scheduleLabel(EmailKind kind) {
        return switch (kind) {
            case RENEWAL -> "08:00 mỗi ngày · gói còn 7 ngày";
            case BIRTHDAY -> "08:30 mỗi ngày · một lần trong tháng sinh nhật";
            case SESSION_REMINDER -> "19:00 mỗi ngày · lịch ngày mai";
            case WEEKLY_DIGEST -> "07:30 thứ Hai · tuần trước";
            case TRAINER_REPORT -> "07:00 mỗi ngày · gửi HLV";
            case RETENTION -> "10:00 mỗi ngày · vắng từ " + RETENTION_DAYS + " ngày";
            case ACHIEVEMENT -> "00:30 mỗi ngày · huy hiệu đạt hôm qua";
            case SECURITY -> "Gửi ngay khi có yêu cầu";
        };
    }

    private void safe(EmailKind kind) {
        try {
            int n = run(kind);
            if (n > 0) log.info("Email tự động {}: đã gửi {}", kind, n);
        } catch (RuntimeException e) {
            log.error("Email tự động {} lỗi: {}", kind, e.getMessage(), e);
        }
    }

    /** Chạy ngay một việc (quản lý bấm "Chạy ngay"); trả số email đã gửi lần này. */
    public int run(EmailKind kind) {
        return switch (kind) {
            case RENEWAL -> send(collectRenewal());
            case BIRTHDAY -> send(collectBirthday());
            case SESSION_REMINDER -> send(collectSessionReminder());
            case WEEKLY_DIGEST -> send(collectWeeklyDigest());
            case TRAINER_REPORT -> send(collectTrainerReport());
            case RETENTION -> send(collectRetention());
            case ACHIEVEMENT -> send(collectBadges());
            case SECURITY -> 0;
        };
    }

    private int send(List<Supplier<Boolean>> jobs) {
        int sent = 0;
        for (Supplier<Boolean> j : jobs) {
            try {
                if (Boolean.TRUE.equals(j.get())) sent++;
            } catch (RuntimeException e) {
                log.warn("Bỏ qua một email tự động do lỗi: {}", e.getMessage());
            }
        }
        return sent;
    }

    private <T> T read(Supplier<T> s) {
        return readTx.execute(status -> s.get());
    }

    // ---------- Nhắc gia hạn ----------
    List<Supplier<Boolean>> collectRenewal() {
        LocalDate today = LocalDate.now(clock);
        return read(() -> {
            List<Supplier<Boolean>> out = new ArrayList<>();
            for (MemberSubscription s : subscriptionRepository.findEndingBetween(today, today.plusDays(MemberSubscription.EXPIRING_DAYS))) {
                Member m = s.getMember();
                if (m.getStatus() != MemberStatus.ACTIVE) continue;
                // Đã có gói nối tiếp thì không nhắc
                if (!subscriptionRepository.findStartingAfter(m.getId(), s.getEndDate()).isEmpty()) continue;
                User u = m.getUser();
                String plan = s.getPlanNameSnapshot() != null ? s.getPlanNameSnapshot() : s.getPlan().getName();
                LocalDate end = s.getEndDate();
                long days = s.daysLeft(today);
                List<Offer> offers = renewalOffers(s.getPlan().getId());
                String name = u.getFullName();
                out.add(() -> outbox.sendOnce(u, EmailKind.RENEWAL, "sub-" + s.getId(),
                        p -> templates.renewal(p, name, plan, end, days, offers)));
            }
            return out;
        });
    }

    private List<Offer> renewalOffers(Long planId) {
        LocalDateTime now = LocalDateTime.now(clock);
        return promotionRepository.findAll().stream()
                .filter(p -> usable(p, now) && !p.isNewMembersOnly() && audience(p, "ALL"))
                .filter(p -> p.appliesToPlan(planId))
                .sorted(Comparator.comparing((Promotion p) -> !p.isRenewalOnly()).thenComparing(p -> -percentValue(p)))
                .limit(3)
                .map(EmailJobs::offer)
                .toList();
    }

    // ---------- Sinh nhật ----------
    List<Supplier<Boolean>> collectBirthday() {
        LocalDate today = LocalDate.now(clock);
        LocalDateTime now = LocalDateTime.now(clock);
        return read(() -> {
            List<Offer> offers = promotionRepository.findAll().stream()
                    .filter(p -> usable(p, now) && audience(p, "BIRTHDAY"))
                    .sorted(Comparator.comparing((Promotion p) -> -percentValue(p)))
                    .map(EmailJobs::offer).toList();
            List<Supplier<Boolean>> out = new ArrayList<>();
            for (Member m : queries.birthdayMembers(today.getMonthValue())) {
                User u = m.getUser();
                String name = u.getFullName();
                out.add(() -> outbox.sendOnce(u, EmailKind.BIRTHDAY, "m" + m.getId() + "-" + today.getYear(),
                        p -> templates.birthday(p, name, offers)));
            }
            return out;
        });
    }

    // ---------- Nhắc lịch ngày mai ----------
    List<Supplier<Boolean>> collectSessionReminder() {
        LocalDate tomorrow = LocalDate.now(clock).plusDays(1);
        return read(() -> {
            Map<Long, List<WorkoutSchedule>> byMember = new LinkedHashMap<>();
            for (WorkoutSchedule s : queries.sessionsBetween(ScheduleStatus.SCHEDULED, tomorrow.atStartOfDay(), tomorrow.plusDays(1).atStartOfDay())) {
                if (s.getMember().getStatus() != MemberStatus.ACTIVE) continue;
                byMember.computeIfAbsent(s.getMember().getId(), k -> new ArrayList<>()).add(s);
            }
            List<Supplier<Boolean>> out = new ArrayList<>();
            for (List<WorkoutSchedule> list : byMember.values()) {
                Member m = list.get(0).getMember();
                User u = m.getUser();
                String name = u.getFullName();
                List<Session> sessions = list.stream().map(EmailJobs::session).toList();
                out.add(() -> outbox.sendOnce(u, EmailKind.SESSION_REMINDER, "m" + m.getId() + "-" + tomorrow,
                        p -> templates.sessionReminder(p, name, tomorrow, sessions)));
            }
            return out;
        });
    }

    // ---------- Tóm tắt tuần ----------
    List<Supplier<Boolean>> collectWeeklyDigest() {
        LocalDate today = LocalDate.now(clock);
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate weekStart = BadgeRules.monday(today).minusWeeks(1);
        LocalDateTime from = weekStart.atStartOfDay();
        LocalDateTime to = weekStart.plusDays(7).atStartOfDay();
        LocalDateTime nextMonday = BadgeRules.monday(today).plusWeeks(1).atStartOfDay();
        String ref = weekStart.get(IsoFields.WEEK_BASED_YEAR) + "W" + weekStart.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        return read(() -> {
            List<Supplier<Boolean>> out = new ArrayList<>();
            for (Member m : queries.activeMembersWithPlan(today)) {
                List<WorkoutLog> logs = workoutLogRepository.findByMemberIdAndCompletedAtBetween(m.getId(), from, to.minusNanos(1));
                int checkins = (int) checkinRepository.countByMemberIdAndCheckedInAtBetween(m.getId(), from, to.minusNanos(1));
                List<Session> upcoming = scheduleRepository.findUpcoming(m.getId(), now, ScheduleStatus.SCHEDULED).stream()
                        .filter(s -> s.getStartTime().isBefore(nextMonday)).map(EmailJobs::session).toList();
                if (logs.isEmpty() && checkins == 0 && upcoming.isEmpty()) continue;
                long minutes = logs.stream().mapToLong(l -> l.getDurationMinutes() == null ? 0 : l.getDurationMinutes()).sum();
                long calories = logs.stream().mapToLong(l -> l.getCalories() == null ? 0 : l.getCalories()).sum();
                int streak = badgeService.compute(m.getId()).records().currentStreakWeeks();
                List<BadgeRules.Def> newBadges = badgeRepository.findByMemberIdOrderByEarnedAtAsc(m.getId()).stream()
                        .filter(b -> !b.getEarnedAt().isBefore(from) && b.getEarnedAt().isBefore(to))
                        .map(b -> BadgeRules.def(b.getCode())).filter(Objects::nonNull).toList();
                WeekStats stats = new WeekStats(logs.size(), minutes, calories, checkins, streak);
                User u = m.getUser();
                String name = u.getFullName();
                out.add(() -> outbox.sendOnce(u, EmailKind.WEEKLY_DIGEST, "m" + m.getId() + "-" + ref,
                        p -> templates.weeklyDigest(p, name, weekStart, stats, newBadges, upcoming)));
            }
            return out;
        });
    }

    // ---------- Báo cáo sáng HLV ----------
    List<Supplier<Boolean>> collectTrainerReport() {
        LocalDate today = LocalDate.now(clock);
        return read(() -> {
            Map<Long, LocalDateTime> visits = trainerStatsService.lastVisits();
            List<Supplier<Boolean>> out = new ArrayList<>();
            for (Trainer t : trainerRepository.findByActiveTrueOrderByIdAsc()) {
                User u = t.getUser();
                if (u.getStatus() != UserStatus.ACTIVE) continue;
                List<Session> todayList = queries.trainerSessions(t.getId(), today.atStartOfDay(), today.plusDays(1).atStartOfDay()).stream()
                        .filter(s -> s.getStatus() == ScheduleStatus.SCHEDULED)
                        .map(s -> new Session(s.getStartTime(), s.getEndTime(), s.getTitle(), en(s.getTitleEn(), s.getTitle()), s.getMember().getUser().getFullName()))
                        .toList();
                List<Absent> missed = queries.trainerSessions(t.getId(), today.minusDays(1).atStartOfDay(), today.atStartOfDay()).stream()
                        .filter(s -> s.getStatus() == ScheduleStatus.MISSED)
                        .map(s -> new Absent(s.getMember().getUser().getFullName(), s.getTitle() + " · " + s.getStartTime().format(HM), "vắng"))
                        .toList();
                List<Absent> inactive = trainerStatsService.build(t, 7, visits).inactiveMembers().stream()
                        .map(i -> new Absent(i.fullName(),
                                i.lastVisit() == null ? "Chưa tới phòng lần nào" : "Lần cuối " + i.lastVisit().format(VI_DM),
                                i.daysAway() + " ngày"))
                        .toList();
                if (todayList.isEmpty() && missed.isEmpty() && inactive.isEmpty()) continue;
                String name = u.getFullName();
                out.add(() -> outbox.sendOnce(u, EmailKind.TRAINER_REPORT, "t" + t.getId() + "-" + today,
                        p -> templates.trainerReport(p, name, today, todayList, missed, inactive)));
            }
            return out;
        });
    }

    // ---------- Giữ chân: vắng từ 10 ngày ----------
    List<Supplier<Boolean>> collectRetention() {
        LocalDate today = LocalDate.now(clock);
        LocalDateTime now = LocalDateTime.now(clock);
        return read(() -> {
            Map<Long, LocalDateTime> visits = trainerStatsService.lastVisits();
            List<Supplier<Boolean>> out = new ArrayList<>();
            for (Member m : queries.activeMembersWithPlan(today)) {
                LocalDateTime last = visits.get(m.getId());
                LocalDate lastDay = last != null ? last.toLocalDate() : m.getJoinedAt();
                if (lastDay == null) continue;
                long away = ChronoUnit.DAYS.between(lastDay, today);
                if (away < RETENTION_DAYS) continue;
                Session next = scheduleRepository.findUpcoming(m.getId(), now, ScheduleStatus.SCHEDULED).stream()
                        .findFirst().map(EmailJobs::session).orElse(null);
                User u = m.getUser();
                String name = u.getFullName();
                out.add(() -> outbox.sendOnce(u, EmailKind.RETENTION, "m" + m.getId() + "-" + lastDay,
                        p -> templates.retention(p, name, away, next)));
            }
            return out;
        });
    }

    // ---------- Huy hiệu ----------
    List<Supplier<Boolean>> collectBadges() {
        LocalDate today = LocalDate.now(clock);
        LocalDateTime since = today.minusDays(1).atStartOfDay();
        LocalDateTime until = today.atStartOfDay();
        List<Member> members = read(() -> queries.activeMembersWithPlan(today));
        List<Supplier<Boolean>> out = new ArrayList<>();
        for (Member m : members) {
            try {
                badgeService.evaluate(m);
            } catch (RuntimeException e) {
                log.warn("Không tính được huy hiệu hội viên {}: {}", m.getId(), e.getMessage());
                continue;
            }
            List<MemberBadge> all = badgeRepository.findByMemberIdOrderByEarnedAtAsc(m.getId());
            List<BadgeRules.Def> fresh = all.stream()
                    .filter(b -> !b.getEarnedAt().isBefore(since) && b.getEarnedAt().isBefore(until))
                    .map(b -> BadgeRules.def(b.getCode())).filter(Objects::nonNull).toList();
            if (fresh.isEmpty()) continue;
            User u = m.getUser();
            String name = u.getFullName();
            int total = all.size();
            out.add(() -> outbox.sendOnce(u, EmailKind.ACHIEVEMENT, "m" + m.getId() + "-" + today.minusDays(1),
                    p -> templates.achievement(p, name, fresh, total)));
        }
        return out;
    }

    // ---------- Tiện ích ----------
    private static boolean usable(Promotion p, LocalDateTime now) {
        return p.isActive() && !p.getStartsAt().isAfter(now) && !p.getEndsAt().isBefore(now)
                && (p.getMaxUses() == null || p.getUsedCount() < p.getMaxUses());
    }

    private static boolean audience(Promotion p, String name) {
        return p.getAudience() == null ? "ALL".equals(name) : name.equals(p.getAudience().name());
    }

    private static long percentValue(Promotion p) {
        long v = p.getDiscountValue() == null ? 0 : p.getDiscountValue();
        if (p.getDiscountType() == null) return 0;
        return switch (p.getDiscountType().name()) {
            case "PERCENT" -> v * 10_000;
            case "AMOUNT" -> v / 100;
            default -> 0;
        };
    }

    private static Offer offer(Promotion p) {
        return EmailTemplates.offerOf(p.getCode(), p.getName(), p.getNameEn(),
                p.getDiscountType() == null ? "NONE" : p.getDiscountType().name(), p.getDiscountValue(), p.getEndsAt());
    }

    private static Session session(WorkoutSchedule s) {
        return new Session(s.getStartTime(), s.getEndTime(), s.getTitle(), en(s.getTitleEn(), s.getTitle()),
                s.getTrainer() == null ? null : s.getTrainer().getUser().getFullName());
    }

    private static String en(String en, String vi) {
        return en == null || en.isBlank() ? vi : en;
    }
}
