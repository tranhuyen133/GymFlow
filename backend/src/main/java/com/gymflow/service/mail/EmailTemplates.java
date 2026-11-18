package com.gymflow.service.mail;

import com.gymflow.domain.EmailKind;
import com.gymflow.domain.EmailPreference;
import com.gymflow.service.BadgeRules;
import com.gymflow.service.mail.EmailLayout.Item;
import com.gymflow.service.mail.EmailLayout.Rendered;
import com.gymflow.service.mail.EmailLayout.Stat;
import com.gymflow.service.mail.EmailLayout.Tone;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * V55 · Nội dung từng loại email, song ngữ theo ngôn ngữ người nhận chọn trên web.
 * Chỉ dựng nội dung – việc chọn ai nhận, khi nào gửi nằm ở EmailJobs.
 */
@Component
@RequiredArgsConstructor
public class EmailTemplates {

    private static final DateTimeFormatter VI_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter EN_DATE = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter VI_DM = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter EN_DM = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");
    private static final String[] VI_DAYS = {"Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"};
    private static final String[] EN_DAYS = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};

    private final EmailPreferenceService preferences;

    // ---------- Dữ liệu vào ----------
    /** Ưu đãi hiển thị trong email: code null = ưu đãi không cần mã (chọn trong danh sách khi đăng ký). */
    public record Offer(String code, String nameVi, String nameEn, String discountVi, String discountEn, LocalDateTime endsAt) {}

    public record Session(LocalDateTime start, LocalDateTime end, String titleVi, String titleEn, String withWhom) {}

    public record Absent(String memberName, String detail, String meta) {}

    public record WeekStats(int workouts, long minutes, long calories, int checkins, int streakWeeks) {}

    // ---------- Email bảo mật ----------
    public Rendered verificationCode(boolean en, String code, int minutes) {
        return EmailLayout.create(en)
                .preheader(tr(en, "Mã có hiệu lực " + minutes + " phút. Không chia sẻ mã này cho ai.",
                        "The code is valid for " + minutes + " minutes. Never share it with anyone."))
                .eyebrow(tr(en, "Xác thực email", "Verify email"))
                .title(tr(en, "Xác thực email của bạn", "Verify your email"))
                .paragraph(tr(en, "Nhập mã dưới đây trên GymFlow để hoàn tất đăng ký tài khoản.",
                        "Enter the code below on GymFlow to finish creating your account."))
                .code(code, tr(en, "Hiệu lực " + minutes + " phút", "Valid for " + minutes + " minutes"))
                .button(tr(en, "Mở GymFlow", "Open GymFlow"), preferences.appUrl("/verify-email"))
                .muted(tr(en, "Nếu bạn không đăng ký GymFlow, hãy bỏ qua email này. Không chia sẻ mã cho bất kỳ ai, kể cả nhân viên GymFlow.",
                        "If you did not sign up for GymFlow, ignore this email. Never share the code with anyone, including GymFlow staff."))
                .reason(tr(en, "Email bảo mật gửi theo yêu cầu từ địa chỉ email này.", "Security email sent at the request of this address."))
                .render(tr(en, code + " là mã xác thực GymFlow của bạn", code + " is your GymFlow verification code"));
    }

    public Rendered passwordResetCode(boolean en, String code, int minutes) {
        return EmailLayout.create(en)
                .preheader(tr(en, "Mã dùng một lần, hiệu lực " + minutes + " phút.", "One-time code, valid for " + minutes + " minutes."))
                .eyebrow(tr(en, "Đặt lại mật khẩu", "Reset password"))
                .title(tr(en, "Đặt lại mật khẩu", "Reset your password"))
                .paragraph(tr(en, "Có yêu cầu đặt lại mật khẩu cho tài khoản GymFlow của bạn. Nhập mã dưới đây để đặt mật khẩu mới.",
                        "Someone asked to reset the password of your GymFlow account. Enter the code below to set a new password."))
                .code(code, tr(en, "Dùng một lần · hiệu lực " + minutes + " phút", "Single use · valid for " + minutes + " minutes"))
                .button(tr(en, "Đặt mật khẩu mới", "Set a new password"), preferences.appUrl("/forgot-password"))
                .callout(Tone.WARNING, tr(en, "Không phải bạn?", "Wasn't you?"),
                        tr(en, "Bỏ qua email này – mật khẩu hiện tại vẫn giữ nguyên. Không chia sẻ mã cho bất kỳ ai.",
                                "Ignore this email – your current password stays the same. Never share the code with anyone."))
                .reason(tr(en, "Email bảo mật gửi theo yêu cầu từ tài khoản của bạn.", "Security email sent at the request of your account."))
                .render(tr(en, "Mã đặt lại mật khẩu GymFlow: " + code, "Your GymFlow password reset code: " + code));
    }

    // ---------- Hội viên ----------
    public Rendered renewal(EmailPreference p, String fullName, String planName, LocalDate endDate, long daysLeft, List<Offer> offers) {
        boolean en = p.english();
        String first = firstName(fullName);
        EmailLayout l = EmailLayout.create(en)
                .preheader(tr(en, "Gia hạn trước " + date(en, endDate) + " để giữ lịch tập và HLV của bạn.",
                        "Renew before " + date(en, endDate) + " to keep your schedule and trainer."))
                .eyebrow(tr(en, "Nhắc gia hạn", "Renewal reminder"))
                .title(tr(en, "Gói tập của " + first + " sắp hết hạn", first + ", your plan ends soon"))
                .paragraph(tr(en, "Gói " + planName + " của bạn còn " + daysLeft + " ngày. Gia hạn sớm để không gián đoạn buổi tập, giữ nguyên lịch và HLV đang theo.",
                        "Your " + planName + " plan has " + daysLeft + " days left. Renew early to keep training without a gap, with the same schedule and trainer."))
                .stats(List.of(new Stat(String.valueOf(daysLeft), tr(en, "ngày còn lại", "days left")),
                        new Stat(dm(en, endDate), tr(en, "ngày hết hạn", "ends on"))));
        if (!offers.isEmpty()) {
            l.list(tr(en, "Ưu đãi khi gia hạn", "Renewal offers"), offers.stream().map(o -> new Item(
                    en ? o.nameEn() : o.nameVi(),
                    o.code() != null
                            ? tr(en, "Nhập mã " + o.code() + " rồi bấm Áp dụng", "Enter code " + o.code() + " and tap Apply")
                            : tr(en, "Chọn ưu đãi này trong danh sách khi gia hạn", "Pick this offer from the list when renewing"),
                    en ? o.discountEn() : o.discountVi())).toList());
        }
        return automated(l, p, EmailKind.RENEWAL)
                .button(tr(en, "Gia hạn ngay", "Renew now"), preferences.appUrl("/me/packages?tab=catalog"))
                .muted(tr(en, "Đã gia hạn rồi? Bỏ qua email này – gói mới sẽ tự bắt đầu khi gói cũ kết thúc.",
                        "Already renewed? Ignore this email – the new plan starts automatically when the current one ends."))
                .render(tr(en, "Gói " + planName + " còn " + daysLeft + " ngày – gia hạn để không gián đoạn",
                        "Your " + planName + " plan ends in " + daysLeft + " days – renew to keep going"));
    }

    public Rendered birthday(EmailPreference p, String fullName, List<Offer> offers) {
        boolean en = p.english();
        String first = firstName(fullName);
        EmailLayout l = EmailLayout.create(en)
                .preheader(tr(en, "Quà sinh nhật từ GymFlow dùng được cả tháng này.", "A birthday gift from GymFlow, valid all month."))
                .eyebrow(tr(en, "Sinh nhật", "Birthday"))
                .title(tr(en, "Chúc mừng sinh nhật, " + first + "! 🎉", "Happy birthday, " + first + "! 🎉"))
                .paragraph(tr(en, "Cả đội GymFlow chúc bạn một tuổi mới khoẻ mạnh, tập đều và chạm được mọi mục tiêu đã đặt.",
                        "Everyone at GymFlow wishes you a healthy new year, steady training and every goal you set."));
        Offer main = offers.isEmpty() ? null : offers.get(0);
        if (main != null && main.code() != null) {
            l.code(main.code(), tr(en, main.discountVi() + " · dùng trong tháng sinh nhật", main.discountEn() + " · valid during your birthday month"));
        } else if (main != null) {
            l.callout(Tone.SUCCESS, en ? main.nameEn() : main.nameVi(),
                    tr(en, "Ưu đãi " + main.discountVi() + " tự hiện trong danh sách khi bạn đăng ký hoặc gia hạn gói trong tháng này – chỉ cần chọn.",
                            "The " + main.discountEn() + " offer shows up in the list when you register or renew this month – just pick it."));
        }
        return automated(l, p, EmailKind.BIRTHDAY)
                .button(tr(en, main != null ? "Nhận ưu đãi" : "Mở GymFlow", main != null ? "Claim your offer" : "Open GymFlow"),
                        preferences.appUrl(main != null ? "/me/packages?tab=catalog" : "/today"))
                .render(tr(en, "Chúc mừng sinh nhật " + first + "! Quà của bạn bên trong 🎂", "Happy birthday " + first + "! Your gift is inside 🎂"));
    }

    public Rendered sessionReminder(EmailPreference p, String fullName, LocalDate day, List<Session> sessions) {
        boolean en = p.english();
        Session firstSession = sessions.get(0);
        EmailLayout l = EmailLayout.create(en)
                .preheader(tr(en, dayName(en, day) + " " + date(en, day) + " · bắt đầu lúc " + firstSession.start().format(HM),
                        dayName(en, day) + " " + date(en, day) + " · starts at " + firstSession.start().format(HM)))
                .eyebrow(tr(en, "Lịch tập ngày mai", "Tomorrow's schedule"))
                .title(tr(en, "Ngày mai bạn có " + sessions.size() + " buổi tập", "You have " + sessions.size() + (sessions.size() == 1 ? " session" : " sessions") + " tomorrow"))
                .paragraph(tr(en, "Chào " + firstName(fullName) + ", đây là lịch " + dayName(en, day).toLowerCase() + " " + date(en, day) + " của bạn:",
                        "Hi " + firstName(fullName) + ", here is your plan for " + dayName(en, day) + ", " + date(en, day) + ":"))
                .list(null, sessions.stream().map(s -> new Item(en ? s.titleEn() : s.titleVi(),
                        s.withWhom() == null ? tr(en, "Tự tập", "Self-guided") : tr(en, "Với HLV " + s.withWhom(), "With coach " + s.withWhom()),
                        s.start().format(HM) + "–" + s.end().format(HM))).toList())
                .callout(Tone.INFO, tr(en, "Khi tới phòng tập", "When you arrive"),
                        tr(en, "Đưa thẻ hội viên (Hôm nay › Thẻ hội viên) cho lễ tân quét để check-in. Nhớ mang nước và khăn.",
                                "Show your member card (Today › Member card) at the desk to check in. Bring water and a towel."));
        return automated(l, p, EmailKind.SESSION_REMINDER)
                .button(tr(en, "Xem lịch tập", "View schedule"), preferences.appUrl("/me/schedule"))
                .muted(tr(en, "Không đi được? Nhắn HLV sớm để xếp lại lịch, tránh bị tính vắng.",
                        "Can't make it? Message your coach early to reschedule so it isn't marked as missed."))
                .render(tr(en, "Ngày mai " + firstSession.start().format(HM) + ": " + firstSession.titleVi()
                                + (sessions.size() > 1 ? " (+" + (sessions.size() - 1) + " buổi)" : ""),
                        "Tomorrow " + firstSession.start().format(HM) + ": " + firstSession.titleEn()
                                + (sessions.size() > 1 ? " (+" + (sessions.size() - 1) + " more)" : "")));
    }

    public Rendered weeklyDigest(EmailPreference p, String fullName, LocalDate weekStart, WeekStats s,
                                 List<BadgeRules.Def> newBadges, List<Session> upcoming) {
        boolean en = p.english();
        LocalDate weekEnd = weekStart.plusDays(6);
        String range = dm(en, weekStart) + " – " + dm(en, weekEnd);
        EmailLayout l = EmailLayout.create(en)
                .preheader(s.workouts() > 0
                        ? tr(en, s.workouts() + " buổi · " + num(en, s.calories()) + " kcal · chuỗi " + s.streakWeeks() + " tuần",
                        s.workouts() + " workouts · " + num(en, s.calories()) + " kcal · " + s.streakWeeks() + "-week streak")
                        : tr(en, "Tuần mới là cơ hội mới – lịch tuần này đã sẵn sàng.", "A new week, a fresh start – your plan is ready."))
                .eyebrow(tr(en, "Tóm tắt tuần", "Weekly summary"))
                .title(tr(en, "Tuần " + range + " của " + firstName(fullName), firstName(fullName) + "'s week, " + range))
                .stats(List.of(new Stat(String.valueOf(s.workouts()), tr(en, "buổi tập", "workouts")),
                        new Stat(num(en, s.minutes()), tr(en, "phút", "minutes")),
                        new Stat(num(en, s.calories()), "kcal")));
        if (s.streakWeeks() >= 2) {
            l.callout(Tone.SUCCESS, tr(en, "Chuỗi " + s.streakWeeks() + " tuần liền 🔥", s.streakWeeks() + "-week streak 🔥"),
                    tr(en, "Giữ nhịp tuần này để kéo dài chuỗi – chỉ cần một buổi.", "Keep it going this week – one session is enough."));
        } else if (s.workouts() == 0) {
            l.callout(Tone.INFO, tr(en, "Tuần trước bạn chưa tập", "No workouts last week"),
                    tr(en, "Không sao cả. Chọn một buổi ngắn 20–30 phút tuần này để lấy lại nhịp.", "That's okay. Pick a short 20–30 minute session this week to get back into it."));
        }
        if (s.checkins() > 0) {
            l.muted(tr(en, "Bạn đã check-in tại quầy " + s.checkins() + " lần trong tuần.", "You checked in at the front desk " + s.checkins() + " times this week."));
        }
        if (!newBadges.isEmpty()) {
            l.list(tr(en, "Huy hiệu mới", "New badges"), newBadges.stream().map(b -> new Item(en ? b.titleEn() : b.titleVi(),
                    en ? b.descEn() : b.descVi(), tr(en, "Mới", "New"))).toList());
        }
        if (!upcoming.isEmpty()) {
            l.list(tr(en, "Lịch tuần này", "This week"), upcoming.stream().limit(6).map(x -> new Item(en ? x.titleEn() : x.titleVi(),
                    dayName(en, x.start().toLocalDate()) + " " + dm(en, x.start().toLocalDate())
                            + (x.withWhom() == null ? "" : tr(en, " · HLV " + x.withWhom(), " · coach " + x.withWhom())),
                    x.start().format(HM))).toList());
        }
        return automated(l, p, EmailKind.WEEKLY_DIGEST)
                .button(tr(en, "Mở trang Hôm nay", "Open Today"), preferences.appUrl("/today"))
                .render(s.workouts() > 0
                        ? tr(en, "Tuần của bạn: " + s.workouts() + " buổi tập, " + num(en, s.calories()) + " kcal",
                        "Your week: " + s.workouts() + " workouts, " + num(en, s.calories()) + " kcal")
                        : tr(en, "Tuần mới, bắt đầu lại nào – lịch tuần này của bạn", "New week, fresh start – your plan for this week"));
    }

    public Rendered retention(EmailPreference p, String fullName, long daysAway, Session next) {
        boolean en = p.english();
        String first = firstName(fullName);
        EmailLayout l = EmailLayout.create(en)
                .preheader(tr(en, "Một buổi 20 phút là đủ để lấy lại nhịp. Gợi ý bên trong.", "A 20-minute session is enough to get back on track. Ideas inside."))
                .eyebrow(tr(en, "Lâu rồi không gặp", "We miss you"))
                .title(tr(en, first + " ơi, lâu rồi không gặp!", "Long time no see, " + first + "!"))
                .paragraph(tr(en, "Đã " + daysAway + " ngày bạn chưa tới phòng tập. Bận rộn là chuyện bình thường – quay lại bằng một buổi thật ngắn sẽ dễ hơn bạn nghĩ.",
                        "It's been " + daysAway + " days since your last visit. Life gets busy – coming back with a very short session is easier than you think."))
                .list(tr(en, "Buổi 20 phút để quay lại", "A 20-minute comeback session"), List.of(
                        new Item(tr(en, "Khởi động", "Warm-up"), tr(en, "Đi bộ nhanh hoặc đạp xe nhẹ, xoay khớp", "Brisk walk or easy bike, joint circles"), tr(en, "5 phút", "5 min")),
                        new Item(tr(en, "Toàn thân nhẹ", "Light full-body"), tr(en, "Squat, chống đẩy tường, kéo cáp – 2 hiệp × 12 lần, tạ nhẹ", "Squats, incline push-ups, cable rows – 2 sets × 12, light weight"), tr(en, "10 phút", "10 min")),
                        new Item(tr(en, "Giãn cơ", "Stretch"), tr(en, "Đùi, hông, vai – giữ mỗi tư thế 30 giây", "Thighs, hips, shoulders – hold each for 30 seconds"), tr(en, "5 phút", "5 min"))));
        if (next != null) {
            l.callout(Tone.INFO, tr(en, "Buổi tiếp theo của bạn", "Your next session"),
                    (en ? next.titleEn() : next.titleVi()) + " · " + dayName(en, next.start().toLocalDate()) + " " + dm(en, next.start().toLocalDate())
                            + " " + next.start().format(HM));
        }
        return automated(l, p, EmailKind.RETENTION)
                .button(tr(en, "Xem gợi ý hôm nay", "See today's plan"), preferences.appUrl("/today"))
                .muted(tr(en, "Cần đổi lịch hoặc bảo lưu gói? Vào Gói tập › Yêu cầu điều chỉnh, quản lý sẽ hỗ trợ.",
                        "Need to reschedule or pause your plan? Go to Plans › Change request and the manager will help."))
                .render(tr(en, first + ", lâu rồi không gặp – 20 phút là đủ để quay lại", first + ", we miss you – 20 minutes is all it takes"));
    }

    public Rendered achievement(EmailPreference p, String fullName, List<BadgeRules.Def> badges, int totalEarned) {
        boolean en = p.english();
        BadgeRules.Def top = badges.get(badges.size() - 1);
        EmailLayout l = EmailLayout.create(en)
                .preheader(tr(en, "Bạn đã có " + totalEarned + " huy hiệu trên GymFlow.", "You now have " + totalEarned + " badges on GymFlow."))
                .eyebrow(tr(en, "Huy hiệu mới", "New badge"))
                .title(tr(en, "Chúc mừng " + firstName(fullName) + " – huy hiệu mới! 🏆", "Congrats " + firstName(fullName) + " – new badge! 🏆"))
                .paragraph(tr(en, "Sự bền bỉ của bạn đã được ghi nhận. Đây là những gì bạn vừa đạt:", "Your consistency is paying off. Here's what you just unlocked:"))
                .list(null, badges.stream().map(b -> new Item(en ? b.titleEn() : b.titleVi(), en ? b.descEn() : b.descVi(), tr(en, "Mới", "New"))).toList())
                .stats(List.of(new Stat(String.valueOf(totalEarned), tr(en, "huy hiệu đã có", "badges earned")),
                        new Stat(String.valueOf(BadgeRules.CATALOG.size() - totalEarned), tr(en, "còn chờ bạn", "still to unlock"))));
        return automated(l, p, EmailKind.ACHIEVEMENT)
                .button(tr(en, "Xem bộ sưu tập", "See your collection"), preferences.appUrl("/today"))
                .render(badges.size() == 1
                        ? tr(en, "Huy hiệu mới: " + top.titleVi(), "New badge: " + top.titleEn())
                        : tr(en, badges.size() + " huy hiệu mới, gồm " + top.titleVi(), badges.size() + " new badges, including " + top.titleEn()));
    }

    // ---------- HLV ----------
    public Rendered trainerReport(EmailPreference p, String fullName, LocalDate day, List<Session> today,
                                  List<Absent> missedYesterday, List<Absent> inactive) {
        boolean en = p.english();
        EmailLayout l = EmailLayout.create(en)
                .preheader(tr(en, today.size() + " buổi hôm nay · " + missedYesterday.size() + " vắng hôm qua · " + inactive.size() + " hội viên cần nhắc",
                        today.size() + " sessions today · " + missedYesterday.size() + " missed yesterday · " + inactive.size() + " members to nudge"))
                .eyebrow(tr(en, "Báo cáo sáng", "Morning report"))
                .title(tr(en, "Chào buổi sáng, " + firstName(fullName), "Good morning, " + firstName(fullName)))
                .paragraph(tr(en, dayName(en, day) + " " + date(en, day) + " – tóm tắt những việc cần chú ý hôm nay.",
                        dayName(en, day) + ", " + date(en, day) + " – what needs your attention today."))
                .stats(List.of(new Stat(String.valueOf(today.size()), tr(en, "buổi hôm nay", "today")),
                        new Stat(String.valueOf(missedYesterday.size()), tr(en, "vắng hôm qua", "missed yesterday")),
                        new Stat(String.valueOf(inactive.size()), tr(en, "sắp bỏ tập", "at risk"))));
        if (!today.isEmpty()) {
            l.list(tr(en, "Lịch dạy hôm nay", "Today's sessions"), today.stream().map(s -> new Item(s.withWhom(), en ? s.titleEn() : s.titleVi(),
                    s.start().format(HM) + "–" + s.end().format(HM))).toList());
        }
        if (!missedYesterday.isEmpty()) {
            l.list(tr(en, "Vắng hôm qua – nên hỏi thăm", "Missed yesterday – check in with them"),
                    missedYesterday.stream().map(a -> new Item(a.memberName(), a.detail(), a.meta())).toList());
        }
        if (!inactive.isEmpty()) {
            l.list(tr(en, "Chưa tới phòng từ 14 ngày", "Not seen for 14+ days"),
                    inactive.stream().limit(10).map(a -> new Item(a.memberName(), a.detail(), a.meta())).toList());
            if (inactive.size() > 10) l.muted(tr(en, "… và " + (inactive.size() - 10) + " hội viên khác.", "… and " + (inactive.size() - 10) + " more."));
        }
        return automated(l, p, EmailKind.TRAINER_REPORT)
                .button(tr(en, "Mở lịch dạy", "Open schedule"), preferences.appUrl("/schedules"))
                .link(tr(en, "Xem thống kê của tôi", "View my stats"), preferences.appUrl("/coach-stats"))
                .render(tr(en, "Hôm nay: " + today.size() + " buổi dạy · " + (missedYesterday.size() + inactive.size()) + " hội viên cần nhắc",
                        "Today: " + today.size() + " sessions · " + (missedYesterday.size() + inactive.size()) + " members to follow up"));
    }

    // ---------- Chung ----------
    private EmailLayout automated(EmailLayout l, EmailPreference p, EmailKind kind) {
        boolean en = p.english();
        return l.reason(tr(en, "Bạn nhận email này vì đang bật “" + kindLabel(kind, false) + "” trong tuỳ chọn email GymFlow.",
                        "You get this email because “" + kindLabel(kind, true) + "” is on in your GymFlow email settings."))
                .footerLink(tr(en, "Tắt loại email này", "Turn off this email"), preferences.manageUrl(p, kind))
                .footerLink(tr(en, "Tuỳ chọn email", "Email settings"), preferences.appUrl("/profile?tab=security"));
    }

    public static String kindLabel(EmailKind kind, boolean en) {
        return switch (kind) {
            case RENEWAL -> en ? "Renewal reminders" : "Nhắc gia hạn gói";
            case BIRTHDAY -> en ? "Birthday offers" : "Ưu đãi sinh nhật";
            case SESSION_REMINDER -> en ? "Session reminders" : "Nhắc lịch tập";
            case WEEKLY_DIGEST -> en ? "Weekly summary" : "Tóm tắt tuần";
            case TRAINER_REPORT -> en ? "Morning report" : "Báo cáo sáng";
            case RETENTION -> en ? "We-miss-you emails" : "Nhắc khi lâu không tới";
            case ACHIEVEMENT -> en ? "New badges" : "Huy hiệu mới";
            case SECURITY -> en ? "Security" : "Bảo mật";
        };
    }

    public static Offer offerOf(String code, String name, String nameEn, String discountType, Long value, LocalDateTime endsAt) {
        long v = value == null ? 0 : value;
        String vi;
        String en;
        if ("PERCENT".equals(discountType)) {
            vi = "Giảm " + v + "%";
            en = v + "% off";
        } else if ("AMOUNT".equals(discountType)) {
            vi = "Giảm " + num(false, v) + " ₫";
            en = num(true, v) + " VND off";
        } else {
            vi = "Quà tặng kèm";
            en = "Free gift";
        }
        return new Offer(code, name, nameEn == null || nameEn.isBlank() ? name : nameEn, vi, en, endsAt);
    }

    static String tr(boolean en, String vi, String english) {
        return en ? english : vi;
    }

    static String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "";
        String[] parts = fullName.trim().split("\\s+");
        return parts[parts.length - 1];
    }

    static String date(boolean en, LocalDate d) {
        return d.format(en ? EN_DATE : VI_DATE);
    }

    static String dm(boolean en, LocalDate d) {
        return d.format(en ? EN_DM : VI_DM);
    }

    static String dayName(boolean en, LocalDate d) {
        return (en ? EN_DAYS : VI_DAYS)[d.getDayOfWeek().getValue() - 1];
    }

    static String num(boolean en, long n) {
        NumberFormat f = NumberFormat.getIntegerInstance(en ? Locale.US : Locale.forLanguageTag("vi-VN"));
        return f.format(n);
    }

    /** Dữ liệu mẫu cho trang xem trước của quản lý. */
    public Rendered sample(EmailKind kind, EmailPreference p) {
        boolean en = p.english();
        LocalDate today = LocalDate.now();
        LocalDateTime nine = today.plusDays(1).atTime(9, 0);
        List<Offer> offers = List.of(offerOf("GIAHAN15", "Gia hạn sớm – giảm 15%", "Early renewal – 15% off", "PERCENT", 15L, nine.plusDays(20)),
                offerOf(null, "Nâng cấp lên PT – giảm thêm 10%", "Upgrade to PT – extra 10% off", "PERCENT", 10L, nine.plusDays(40)));
        List<Session> sessions = List.of(new Session(nine, nine.plusMinutes(60), "Ngực – Tay sau", "Chest – Triceps", "Trần Minh Khoa"),
                new Session(nine.plusHours(9), nine.plusHours(9).plusMinutes(45), "Cardio nhẹ", "Light cardio", null));
        return switch (kind) {
            case RENEWAL -> renewal(p, "Nguyễn Văn An", en ? "Gym 3 months" : "Gym 3 tháng", today.plusDays(7), 7, offers);
            case BIRTHDAY -> birthday(p, "Nguyễn Văn An", List.of(offerOf("SINHNHAT15", "Mừng sinh nhật – giảm 15%", "Birthday treat – 15% off", "PERCENT", 15L, nine.plusDays(25))));
            case SESSION_REMINDER -> sessionReminder(p, "Nguyễn Văn An", today.plusDays(1), sessions);
            case WEEKLY_DIGEST -> weeklyDigest(p, "Nguyễn Văn An", BadgeRules.monday(today).minusWeeks(1), new WeekStats(4, 215, 1860, 4, 5),
                    List.of(BadgeRules.def("WORKOUTS_25")), sessions);
            case TRAINER_REPORT -> trainerReport(p, "Trần Minh Khoa", today, List.of(
                            new Session(today.atTime(7, 0), today.atTime(8, 0), "Chân – Mông", "Legs – Glutes", "Nguyễn Văn An"),
                            new Session(today.atTime(18, 0), today.atTime(19, 0), "Lưng – Tay trước", "Back – Biceps", "Lê Thu Hà")),
                    List.of(new Absent("Phạm Quốc Bảo", en ? "Upper body · 18:00" : "Thân trên · 18:00", en ? "missed" : "vắng")),
                    List.of(new Absent("Đỗ Ngọc Mai", en ? "Last visit 2 Nov" : "Lần cuối 02/11", en ? "15 days" : "15 ngày")));
            case RETENTION -> retention(p, "Nguyễn Văn An", 12, sessions.get(0));
            case ACHIEVEMENT -> achievement(p, "Nguyễn Văn An", List.of(BadgeRules.def("STREAK_4"), BadgeRules.def("WORKOUTS_10")), 5);
            case SECURITY -> verificationCode(en, "482913", 10);
        };
    }

    public static List<EmailKind> previewKinds() {
        return new ArrayList<>(List.of(EmailKind.RENEWAL, EmailKind.BIRTHDAY, EmailKind.SESSION_REMINDER, EmailKind.WEEKLY_DIGEST,
                EmailKind.TRAINER_REPORT, EmailKind.RETENTION, EmailKind.ACHIEVEMENT, EmailKind.SECURITY));
    }
}
