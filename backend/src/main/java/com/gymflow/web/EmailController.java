package com.gymflow.web;

import com.gymflow.common.ApiException;
import com.gymflow.common.PageResponse;
import com.gymflow.domain.EmailKind;
import com.gymflow.domain.EmailLog;
import com.gymflow.domain.EmailPreference;
import com.gymflow.domain.Role;
import com.gymflow.domain.User;
import com.gymflow.dto.EngagementDtos.*;
import com.gymflow.repository.EmailLogRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.EmailJobs;
import com.gymflow.service.mail.EmailPreferenceService;
import com.gymflow.service.mail.EmailTemplates;
import com.gymflow.service.mail.MailOutbox;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/** V55 · Tuỳ chọn nhận email, trang tắt email từ chân thư (không cần đăng nhập) và màn quản lý email tự động. */
@Tag(name = "Email tự động")
@RestController
@RequiredArgsConstructor
public class EmailController {

    private final EmailPreferenceService preferences;
    private final MailOutbox outbox;
    private final EmailTemplates templates;
    private final EmailJobs jobs;
    private final EmailLogRepository logRepository;
    private final UserRepository userRepository;

    @Value("${app.mail.from:no-reply@gymflow.local}")
    private String from;

    // ---------- Của tôi ----------
    @GetMapping("/api/me/email-prefs")
    public EmailPrefsResponse myPrefs() {
        AuthUser u = CurrentUser.get();
        return view(preferences.forUser(u.id()), u.role());
    }

    @PutMapping("/api/me/email-prefs")
    public EmailPrefsResponse updateMine(@RequestBody EmailPrefsRequest req) {
        AuthUser u = CurrentUser.get();
        EmailPreference p = preferences.forUser(u.id());
        apply(p, u.role(), req == null ? null : req.prefs());
        return view(preferences.save(p), u.role());
    }

    /** Web gọi khi người dùng đổi ngôn ngữ, để email gửi đúng ngôn ngữ đó. */
    @PutMapping("/api/me/locale")
    public EmailPrefsResponse locale(@RequestBody LocaleRequest req) {
        AuthUser u = CurrentUser.get();
        return view(preferences.setLocale(u.id(), req == null ? "vi" : req.locale()), u.role());
    }

    // ---------- Từ chân thư (không cần đăng nhập, xác thực bằng mã bí mật trong liên kết) ----------
    @GetMapping("/api/email/unsubscribe/{token}")
    public UnsubscribeInfo unsubscribeInfo(@PathVariable String token) {
        EmailPreference p = byToken(token);
        return info(p);
    }

    /** Một chạm: kind có giá trị → tắt loại đó; không có → tắt mọi email tự động. Gmail cũng gọi địa chỉ này (List-Unsubscribe-Post). */
    @PostMapping("/api/email/unsubscribe/{token}")
    public UnsubscribeInfo unsubscribe(@PathVariable String token, @RequestParam(required = false) String kind) {
        EmailPreference p = byToken(token);
        User u = owner(p);
        if (kind == null || kind.isBlank()) {
            for (EmailKind k : EmailPreferenceService.kindsFor(u.getRole())) p.set(k, false);
        } else {
            p.set(parse(kind), false);
        }
        return info(preferences.save(p));
    }

    @PutMapping("/api/email/unsubscribe/{token}")
    public UnsubscribeInfo updateByToken(@PathVariable String token, @RequestBody EmailPrefsRequest req) {
        EmailPreference p = byToken(token);
        apply(p, owner(p).getRole(), req == null ? null : req.prefs());
        return info(preferences.save(p));
    }

    // ---------- Quản lý ----------
    @GetMapping("/api/admin/emails/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public EmailSummary summary() {
        Map<String, long[]> counts = new HashMap<>();
        for (Object[] row : logRepository.countSince(LocalDateTime.now().minusDays(7))) {
            long[] c = counts.computeIfAbsent(String.valueOf(row[0]), k -> new long[3]);
            long n = ((Number) row[2]).longValue();
            switch (String.valueOf(row[1])) {
                case EmailLog.SENT -> c[0] += n;
                case EmailLog.FAILED -> c[1] += n;
                default -> c[2] += n;
            }
        }
        List<EmailKindSummary> kinds = new ArrayList<>();
        for (EmailKind k : EmailTemplates.previewKinds()) {
            long[] c = counts.getOrDefault(k.name(), new long[3]);
            kinds.add(new EmailKindSummary(k.name(), EmailJobs.scheduleLabel(k), c[0], c[1], c[2]));
        }
        return new EmailSummary(outbox.configured(), from, kinds);
    }

    @GetMapping("/api/admin/emails/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<EmailLogResponse> logs(@RequestParam(required = false) String kind,
                                               @RequestParam(required = false) String status,
                                               @RequestParam(defaultValue = "") String q,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "30") int size) {
        EmailKind k = kind == null || kind.isBlank() ? null : parse(kind);
        String st = status == null || status.isBlank() ? null : status.trim().toUpperCase(Locale.ROOT);
        return PageResponse.of(logRepository.search(k, st, q.trim(), PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100))),
                l -> new EmailLogResponse(l.getId(), l.getToEmail(), l.getKind().name(), l.getRefKey(), l.getSubject(), l.getStatus(),
                        l.getAttempts(), l.getError(), l.getCreatedAt(), l.getSentAt()));
    }

    @GetMapping("/api/admin/emails/preview/{kind}")
    @PreAuthorize("hasRole('ADMIN')")
    public EmailPreviewResponse preview(@PathVariable String kind, @RequestParam(defaultValue = "vi") String lang) {
        EmailKind k = parse(kind);
        var r = templates.sample(k, sampleFor(lang));
        return new EmailPreviewResponse(k.name(), "en".equals(lang) ? "en" : "vi", r.subject(), r.html());
    }

    /** Gửi bản mẫu tới email của chính quản lý để xem trên Gmail thật. */
    @PostMapping("/api/admin/emails/test/{kind}")
    @PreAuthorize("hasRole('ADMIN')")
    public EmailRunResponse test(@PathVariable String kind, @RequestParam(defaultValue = "vi") String lang) {
        EmailKind k = parse(kind);
        AuthUser me = CurrentUser.get();
        var r = templates.sample(k, sampleFor(lang));
        outbox.sendNow(me.email(), new com.gymflow.service.mail.EmailLayout.Rendered("[Thử] " + r.subject(), r.html(), r.text()));
        return new EmailRunResponse(k.name(), 1);
    }

    @PostMapping("/api/admin/emails/run/{kind}")
    @PreAuthorize("hasRole('ADMIN')")
    public EmailRunResponse run(@PathVariable String kind) {
        EmailKind k = parse(kind);
        if (!k.optional()) throw ApiException.badRequest("Email bảo mật chỉ gửi khi có yêu cầu");
        return new EmailRunResponse(k.name(), jobs.run(k));
    }

    // ---------- helpers ----------
    private EmailPrefsResponse view(EmailPreference p, Role role) {
        Map<String, Boolean> m = new LinkedHashMap<>();
        for (EmailKind k : EmailPreferenceService.kindsFor(role)) m.put(k.name(), p.allows(k));
        return new EmailPrefsResponse(p.getLocale(), m, outbox.configured());
    }

    private UnsubscribeInfo info(EmailPreference p) {
        User u = owner(p);
        Map<String, Boolean> m = new LinkedHashMap<>();
        for (EmailKind k : EmailPreferenceService.kindsFor(u.getRole())) m.put(k.name(), p.allows(k));
        return new UnsubscribeInfo(maskEmail(u.getEmail()), firstName(u.getFullName()), p.getLocale(), m);
    }

    private void apply(EmailPreference p, Role role, Map<String, Boolean> prefs) {
        if (prefs == null) return;
        Set<EmailKind> allowed = EmailPreferenceService.kindsFor(role);
        for (Map.Entry<String, Boolean> e : prefs.entrySet()) {
            EmailKind k = parse(e.getKey());
            if (allowed.contains(k) && e.getValue() != null) p.set(k, e.getValue());
        }
    }

    private EmailPreference byToken(String token) {
        return preferences.byToken(token).orElseThrow(() -> ApiException.notFound("liên kết tuỳ chọn email (liên kết sai hoặc đã cũ)"));
    }

    private User owner(EmailPreference p) {
        return userRepository.findById(p.getUserId()).orElseThrow(() -> ApiException.notFound("tài khoản"));
    }

    private static EmailPreference sampleFor(String lang) {
        EmailPreference p = new EmailPreference();
        p.setUserId(0L);
        p.setLocale("en".equals(lang) ? "en" : "vi");
        p.setUnsubscribeToken("0".repeat(64));
        return p;
    }

    private static EmailKind parse(String kind) {
        try {
            return EmailKind.valueOf(kind.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw ApiException.badRequest("Loại email không hợp lệ: " + kind);
        }
    }

    static String maskEmail(String email) {
        if (email == null) return "";
        int at = email.indexOf('@');
        if (at <= 0) return "***";
        String name = email.substring(0, at);
        String shown = name.length() <= 2 ? name.substring(0, 1) : name.substring(0, 2);
        return shown + "***" + email.substring(at);
    }

    private static String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "";
        String[] parts = fullName.trim().split("\\s+");
        return parts[parts.length - 1];
    }
}
