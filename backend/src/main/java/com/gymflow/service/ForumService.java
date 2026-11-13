package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.PageResponse;
import com.gymflow.domain.ForumCategory;
import com.gymflow.domain.ForumReply;
import com.gymflow.domain.ForumReport;
import com.gymflow.domain.ForumTopic;
import com.gymflow.domain.Role;
import com.gymflow.domain.User;
import com.gymflow.dto.ForumDtos.*;
import com.gymflow.repository.ForumReplyRepository;
import com.gymflow.repository.ForumReportRepository;
import com.gymflow.repository.ForumTopicRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Diễn đàn: ai đăng nhập cũng đăng chủ đề và trả lời; huấn luyện viên và quản lý ẩn / ghim / khoá.
 * Khách xem được chủ đề đang hiển thị, tên người viết rút gọn. Chỉ quản lý xoá hẳn bài của người khác.
 *
 * Kiểm tra dữ liệu làm ở đây, sau khi đã làm sạch chữ: @Size ở DTO đếm cả khoảng trắng hai đầu
 * nên "   abc   " vẫn lọt 5 ký tự. Ở đây đếm trên chuỗi đã trim, bỏ ký tự điều khiển / ký tự vô hình
 * và bắt buộc có ít nhất một chữ hoặc số (chặn bài chỉ toàn "....." hay emoji lặp).
 */
@Service
@RequiredArgsConstructor
public class ForumService {

    static final int TITLE_MIN = 5, TITLE_MAX = 200, BODY_MIN = 10, BODY_MAX = 10_000;
    static final int REPLY_MIN = 2, REPLY_MAX = 5_000, REASON_MIN = 5, REASON_MAX = 255, QUERY_MAX = 100;
    private static final int TOPIC_COOLDOWN_SECONDS = 60;
    private static final int REPLY_COOLDOWN_SECONDS = 15;
    private static final int DUPLICATE_REPLY_MINUTES = 10;
    private static final int DUPLICATE_TOPIC_HOURS = 24;
    private static final int EXCERPT_LENGTH = 180;
    private static final Sort LIST_SORT = Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("lastActivityAt"), Sort.Order.desc("id"));

    /** Ký tự điều khiển (trừ xuống dòng, tab) và ký tự vô hình hay bị dán kèm từ Messenger / Word. */
    private static final Pattern INVISIBLE = Pattern.compile("[\\p{Cc}&&[^\\n\\t]]|[\\u200B-\\u200F\\u2028\\u2029\\u202A-\\u202E\\u2060-\\u2064\\uFEFF]");
    private static final Pattern TRAILING_SPACES = Pattern.compile("[ \\t]+(?=\\n)");
    private static final Pattern MANY_BLANK_LINES = Pattern.compile("\\n{3,}");
    private static final Pattern HAS_LETTER_OR_DIGIT = Pattern.compile("[\\p{L}\\p{N}]");

    private final ForumTopicRepository topicRepository;
    private final ForumReplyRepository replyRepository;
    private final ForumReportRepository reportRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final Clock clock;

    // ---------- Đọc ----------

    @Transactional(readOnly = true)
    public PageResponse<TopicSummary> topics(AuthUser viewer, ForumCategory category, String q, int page, int size) {
        PageRequest p = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), LIST_SORT);
        return PageResponse.of(topicRepository.search(isStaff(viewer), category, searchTerm(q), p), t -> summary(t, viewer));
    }

    @Transactional(readOnly = true)
    public TopicDetail topic(AuthUser viewer, Long id) {
        return detail(visibleTopic(viewer, id), viewer);
    }

    // ---------- Chủ đề ----------

    @Transactional
    public TopicDetail create(AuthUser me, TopicRequest req) {
        String title = title(req.title());
        String body = body(req.body());
        LocalDateTime now = LocalDateTime.now(clock);
        if (topicRepository.existsByAuthor_IdAndCreatedAtAfter(me.id(), now.minusSeconds(TOPIC_COOLDOWN_SECONDS))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Bạn vừa đăng một chủ đề, vui lòng chờ 1 phút rồi đăng tiếp");
        }
        if (topicRepository.existsByAuthor_IdAndTitleAndCreatedAtAfter(me.id(), title, now.minusHours(DUPLICATE_TOPIC_HOURS))) {
            throw ApiException.conflict("Bạn đã đăng chủ đề cùng tiêu đề trong 24 giờ qua. Hãy mở chủ đề cũ và trả lời tiếp ở đó.");
        }
        ForumTopic t = new ForumTopic();
        t.setAuthor(userRepository.getReferenceById(me.id()));
        t.setTitle(title);
        t.setTitleEn(optionalClean(req.titleEn()));
        t.setCategory(req.category());
        t.setBody(body);
        t.setBodyEn(optionalClean(req.bodyEn()));
        t.setCreatedAt(now);
        t.setLastActivityAt(now);
        topicRepository.save(t);
        return detail(t, me);
    }

    @Transactional
    public TopicDetail update(AuthUser me, Long id, TopicRequest req) {
        ForumTopic t = topicOr404(id);
        if (!isAuthor(me, t.getAuthor())) throw ApiException.forbidden("Chỉ người viết mới sửa được chủ đề này");
        if (t.isHidden()) throw ApiException.badRequest("Chủ đề đang bị ẩn nên không sửa được");
        t.setTitle(title(req.title()));
        t.setTitleEn(optionalClean(req.titleEn()));
        t.setCategory(req.category());
        t.setBody(body(req.body()));
        t.setBodyEn(optionalClean(req.bodyEn()));
        t.setUpdatedAt(LocalDateTime.now(clock));
        return detail(t, me);
    }

    @Transactional
    public void delete(AuthUser me, Long id) {
        ForumTopic t = topicOr404(id);
        if (!me.isAdmin()) {
            if (!isAuthor(me, t.getAuthor())) throw ApiException.forbidden("Chỉ người viết hoặc quản lý mới xoá được chủ đề này");
            if (replyRepository.existsByTopic_IdAndAuthor_IdNot(id, me.id())) {
                throw ApiException.badRequest("Chủ đề đã có người trả lời nên không xoá được. Bạn vẫn có thể sửa nội dung.");
            }
        }
        topicRepository.delete(t);
        auditService.log("FORUM_DELETE", "FORUM_TOPIC", id, t.getTitle());
    }

    @Transactional
    public TopicDetail moderateTopic(AuthUser me, Long id, ModerationRequest req) {
        ForumTopic t = topicOr404(id);
        guardModeration(me, t.getAuthor());
        String reason = null;
        switch (req.action()) {
            case HIDE -> {
                reason = reason(req.reason(), "Vui lòng ghi lý do ẩn để người viết biết");
                t.setHidden(true);
                t.setHiddenReason(reason);
                t.setHiddenBy(userRepository.getReferenceById(me.id()));
                t.setHiddenAt(LocalDateTime.now(clock));
            }
            case SHOW -> {
                t.setHidden(false);
                t.setHiddenReason(null);
                t.setHiddenBy(null);
                t.setHiddenAt(null);
            }
            case PIN -> t.setPinned(true);
            case UNPIN -> t.setPinned(false);
            case LOCK -> t.setLocked(true);
            case UNLOCK -> t.setLocked(false);
        }
        auditService.log("FORUM_" + req.action().name(), "FORUM_TOPIC", id, reason);
        return detail(t, me);
    }

    // ---------- Trả lời ----------

    @Transactional
    public ReplyResponse reply(AuthUser me, Long topicId, ReplyRequest req) {
        String body = replyBody(req.body());
        ForumTopic t = visibleTopic(me, topicId);
        if (t.isHidden()) throw ApiException.badRequest("Chủ đề đang bị ẩn nên không nhận thêm trả lời");
        if (t.isLocked() && !isStaff(me)) {
            throw ApiException.badRequest("Chủ đề đã khoá, chỉ huấn luyện viên hoặc quản lý trả lời được");
        }
        LocalDateTime now = LocalDateTime.now(clock);
        if (replyRepository.existsByTopic_IdAndAuthor_IdAndBodyAndCreatedAtAfter(topicId, me.id(), body, now.minusMinutes(DUPLICATE_REPLY_MINUTES))) {
            throw ApiException.conflict("Bạn vừa gửi đúng nội dung này rồi");
        }
        if (replyRepository.existsByAuthor_IdAndCreatedAtAfter(me.id(), now.minusSeconds(REPLY_COOLDOWN_SECONDS))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Bạn trả lời hơi nhanh, vui lòng chờ vài giây rồi gửi lại");
        }
        ForumReply r = new ForumReply();
        r.setTopic(t);
        r.setAuthor(userRepository.getReferenceById(me.id()));
        r.setBody(body);
        r.setCreatedAt(now);
        replyRepository.save(r);
        t.setLastActivityAt(now);
        recount(t);
        return reply(r, me);
    }

    @Transactional
    public ReplyResponse updateReply(AuthUser me, Long id, ReplyRequest req) {
        ForumReply r = replyOr404(id);
        if (!isAuthor(me, r.getAuthor())) throw ApiException.forbidden("Chỉ người viết mới sửa được trả lời này");
        if (r.isHidden()) throw ApiException.badRequest("Trả lời đang bị ẩn nên không sửa được");
        ForumTopic t = r.getTopic();
        if (t.isHidden()) throw ApiException.badRequest("Chủ đề đang bị ẩn nên không sửa được trả lời");
        if (t.isLocked() && !isStaff(me)) throw ApiException.badRequest("Chủ đề đã khoá nên không sửa được trả lời");
        r.setBody(replyBody(req.body()));
        r.setUpdatedAt(LocalDateTime.now(clock));
        return reply(r, me);
    }

    @Transactional
    public void deleteReply(AuthUser me, Long id) {
        ForumReply r = replyOr404(id);
        if (!me.isAdmin() && !isAuthor(me, r.getAuthor())) throw ApiException.forbidden("Chỉ người viết hoặc quản lý mới xoá được trả lời này");
        ForumTopic t = r.getTopic();
        replyRepository.delete(r);
        replyRepository.flush();
        recount(t);
        if (me.isAdmin() && !isAuthor(me, r.getAuthor())) auditService.log("FORUM_DELETE", "FORUM_REPLY", id, null);
    }

    @Transactional
    public ReplyResponse moderateReply(AuthUser me, Long id, ModerationRequest req) {
        ForumReply r = replyOr404(id);
        guardModeration(me, r.getAuthor());
        String reason = null;
        switch (req.action()) {
            case HIDE -> {
                reason = reason(req.reason(), "Vui lòng ghi lý do ẩn để người viết biết");
                r.setHidden(true);
                r.setHiddenReason(reason);
                r.setHiddenBy(userRepository.getReferenceById(me.id()));
                r.setHiddenAt(LocalDateTime.now(clock));
            }
            case SHOW -> {
                r.setHidden(false);
                r.setHiddenReason(null);
                r.setHiddenBy(null);
                r.setHiddenAt(null);
            }
            default -> throw ApiException.badRequest("Trả lời chỉ ẩn hoặc hiện lại được");
        }
        replyRepository.flush();
        recount(r.getTopic());
        auditService.log("FORUM_" + req.action().name(), "FORUM_REPLY", id, reason);
        return reply(r, me);
    }

    // ---------- Báo cáo vi phạm ----------

    @Transactional
    public void reportTopic(AuthUser me, Long topicId, ReportRequest req) {
        String reason = reason(req.reason(), "Vui lòng ghi lý do báo cáo");
        ForumTopic t = visibleTopic(me, topicId);
        if (isAuthor(me, t.getAuthor())) throw ApiException.badRequest("Bạn không thể báo cáo bài của chính mình");
        if (reportRepository.existsByReporter_IdAndTopic_IdAndReplyIsNullAndStatus(me.id(), topicId, ForumReport.OPEN)) return;
        saveReport(me, t, null, reason);
    }

    @Transactional
    public void reportReply(AuthUser me, Long replyId, ReportRequest req) {
        String reason = reason(req.reason(), "Vui lòng ghi lý do báo cáo");
        ForumReply r = visibleReply(me, replyId);
        if (isAuthor(me, r.getAuthor())) throw ApiException.badRequest("Bạn không thể báo cáo bài của chính mình");
        if (reportRepository.existsByReporter_IdAndReply_IdAndStatus(me.id(), replyId, ForumReport.OPEN)) return;
        saveReport(me, r.getTopic(), r, reason);
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> openReports() {
        return reportRepository.findByStatusOrderByCreatedAtDesc(ForumReport.OPEN).stream().map(rp -> {
            ForumReply r = rp.getReply();
            ForumTopic t = rp.getTopic();
            String body = r != null ? r.getBody() : t.getBody();
            User target = r != null ? r.getAuthor() : t.getAuthor();
            return new ReportResponse(rp.getId(), t.getId(), t.getTitle(), r == null ? null : r.getId(), excerpt(body),
                    target.getFullName(), r != null ? r.isHidden() : t.isHidden(), rp.getReporter().getFullName(),
                    rp.getReason(), rp.getCreatedAt());
        }).toList();
    }

    @Transactional
    public void resolveReport(AuthUser me, Long id) {
        ForumReport rp = reportRepository.findById(id).orElseThrow(() -> ApiException.notFound("báo cáo"));
        if (ForumReport.RESOLVED.equals(rp.getStatus())) return;
        rp.setStatus(ForumReport.RESOLVED);
        rp.setResolvedBy(userRepository.getReferenceById(me.id()));
        rp.setResolvedAt(LocalDateTime.now(clock));
        auditService.log("FORUM_REPORT_RESOLVE", "FORUM_REPORT", id, null);
    }

    // ---------- Làm sạch và kiểm tra chữ ----------

    /** Bỏ ký tự vô hình, chuẩn hoá dấu tiếng Việt (NFC), bỏ khoảng trắng cuối dòng, gộp quá 2 dòng trống. */
    static String clean(String s) {
        if (s == null) return "";
        String v = Normalizer.normalize(s, Normalizer.Form.NFC).replace("\r\n", "\n").replace('\r', '\n');
        v = INVISIBLE.matcher(v).replaceAll("");
        v = TRAILING_SPACES.matcher(v).replaceAll("");
        v = MANY_BLANK_LINES.matcher(v).replaceAll("\n\n");
        return v.strip();
    }

    /** Tiêu đề chỉ một dòng: mọi khoảng trắng liền nhau (kể cả xuống dòng) gộp thành một dấu cách. */
    static String title(String raw) {
        String v = clean(raw).replaceAll("\\s+", " ");
        return checked(v, TITLE_MIN, TITLE_MAX, "Vui lòng nhập tiêu đề", "Tiêu đề từ 5 đến 200 ký tự",
                "Tiêu đề cần có chữ hoặc số");
    }

    static String body(String raw) {
        return checked(clean(raw), BODY_MIN, BODY_MAX, "Vui lòng nhập nội dung", "Nội dung từ 10 đến 10.000 ký tự",
                "Nội dung cần có chữ hoặc số");
    }

    static String replyBody(String raw) {
        return checked(clean(raw), REPLY_MIN, REPLY_MAX, "Vui lòng nhập nội dung trả lời", "Trả lời từ 2 đến 5.000 ký tự",
                "Trả lời cần có chữ hoặc số");
    }

    static String reason(String raw, String emptyMessage) {
        return checked(clean(raw).replaceAll("\\s+", " "), REASON_MIN, REASON_MAX, emptyMessage, "Lý do từ 5 đến 255 ký tự",
                "Lý do cần có chữ hoặc số");
    }

    /** Từ khoá tìm kiếm: làm sạch, cắt 100 ký tự, thoát \ % _ để LIKE hiểu là chữ thường. */
    static String searchTerm(String q) {
        String v = clean(q).replaceAll("\\s+", " ");
        if (v.length() > QUERY_MAX) v = v.substring(0, QUERY_MAX).strip();
        return v.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static String checked(String v, int min, int max, String empty, String range, String noText) {
        if (v.isEmpty()) throw ApiException.badRequest(empty);
        int len = v.codePointCount(0, v.length());
        if (len < min || len > max) throw ApiException.badRequest(range);
        if (!HAS_LETTER_OR_DIGIT.matcher(v).find()) throw ApiException.badRequest(noText);
        return v;
    }

    // ---------- Nội bộ ----------

    /** HLV kiểm duyệt bài hội viên và HLV khác; bài của quản lý chỉ quản lý mới ẩn / khoá được. */
    private static void guardModeration(AuthUser me, User author) {
        if (!isStaff(me)) throw ApiException.forbidden();
        if (!me.isAdmin() && author != null && author.getRole() == Role.ADMIN) {
            throw ApiException.forbidden("Bài của quản lý chỉ quản lý mới kiểm duyệt được");
        }
    }

    private void saveReport(AuthUser me, ForumTopic t, ForumReply r, String reason) {
        ForumReport rp = new ForumReport();
        rp.setTopic(t);
        rp.setReply(r);
        rp.setReporter(userRepository.getReferenceById(me.id()));
        rp.setReason(reason);
        rp.setCreatedAt(LocalDateTime.now(clock));
        reportRepository.save(rp);
        auditService.log("FORUM_REPORT", r == null ? "FORUM_TOPIC" : "FORUM_REPLY", r == null ? t.getId() : r.getId(), reason);
    }

    private void recount(ForumTopic t) {
        t.setReplyCount((int) replyRepository.countByTopic_IdAndHiddenFalse(t.getId()));
    }

    private ForumTopic topicOr404(Long id) {
        return topicRepository.findById(id).orElseThrow(() -> ApiException.notFound("chủ đề"));
    }

    private ForumReply replyOr404(Long id) {
        return replyRepository.findById(id).orElseThrow(() -> ApiException.notFound("trả lời"));
    }

    /** Chủ đề bị ẩn chỉ người viết và nhân viên thấy; người khác nhận 404 như chủ đề không tồn tại. */
    private ForumTopic visibleTopic(AuthUser viewer, Long id) {
        ForumTopic t = topicOr404(id);
        if (t.isHidden() && !isStaff(viewer) && !isAuthor(viewer, t.getAuthor())) throw ApiException.notFound("chủ đề");
        return t;
    }

    /** Trả lời bị ẩn cũng chỉ người viết và nhân viên thấy (giống danh sách trong detail()). */
    private ForumReply visibleReply(AuthUser viewer, Long id) {
        ForumReply r = replyOr404(id);
        visibleTopic(viewer, r.getTopic().getId());
        if (r.isHidden() && !isStaff(viewer) && !isAuthor(viewer, r.getAuthor())) throw ApiException.notFound("trả lời");
        return r;
    }

    private TopicSummary summary(ForumTopic t, AuthUser viewer) {
        return new TopicSummary(t.getId(), t.getTitle(), t.getCategory(), excerpt(t.getBody()), author(t.getAuthor(), viewer),
                t.isPinned(), t.isLocked(), t.isHidden(), t.getReplyCount(), t.getCreatedAt(), t.getLastActivityAt(),
                t.getTitleEn(), t.getBodyEn() == null ? null : excerpt(t.getBodyEn()));
    }

    private TopicDetail detail(ForumTopic t, AuthUser viewer) {
        boolean staff = isStaff(viewer);
        List<ReplyResponse> replies = replyRepository.findByTopic_IdOrderByCreatedAtAscIdAsc(t.getId()).stream()
                .filter(r -> !r.isHidden() || staff || isAuthor(viewer, r.getAuthor()))
                .map(r -> reply(r, viewer))
                .toList();
        return new TopicDetail(t.getId(), t.getTitle(), t.getCategory(), t.getBody(), author(t.getAuthor(), viewer),
                t.isPinned(), t.isLocked(), t.isHidden(), t.getHiddenReason(), t.getReplyCount(),
                t.getCreatedAt(), t.getUpdatedAt(), replies, isAuthor(viewer, t.getAuthor()), staff, viewer != null,
                t.getTitleEn(), t.getBodyEn());
    }

    private ReplyResponse reply(ForumReply r, AuthUser viewer) {
        return new ReplyResponse(r.getId(), r.getBody(), author(r.getAuthor(), viewer), r.isHidden(), r.getHiddenReason(),
                r.getCreatedAt(), r.getUpdatedAt(), isAuthor(viewer, r.getAuthor()));
    }

    private ForumAuthor author(User u, AuthUser viewer) {
        return new ForumAuthor(u.getId(), viewer == null ? shortName(u.getFullName()) : u.getFullName(), u.getRole());
    }

    /** "Nguyễn Thế Kiên" → "Kiên N." – khách chưa đăng nhập không thấy họ tên đầy đủ của hội viên. */
    static String shortName(String fullName) {
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length < 2) return parts[0];
        return parts[parts.length - 1] + " " + parts[0].charAt(0) + ".";
    }

    private static String optionalClean(String raw) {
        return raw == null || raw.isBlank() ? null : clean(raw).trim();
    }

    static String excerpt(String body) {        String s = body.replaceAll("(?m)^#+\\s*", "").replaceAll("\\s+", " ").trim();
        return s.length() <= EXCERPT_LENGTH ? s : s.substring(0, EXCERPT_LENGTH - 1).trim() + "…";
    }

    private static boolean isStaff(AuthUser u) {
        return u != null && (u.isAdmin() || u.isTrainer());
    }

    private static boolean isAuthor(AuthUser u, User author) {
        return u != null && author != null && u.id().equals(author.getId());
    }
}
