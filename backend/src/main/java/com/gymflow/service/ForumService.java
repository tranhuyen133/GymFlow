package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.PageResponse;
import com.gymflow.domain.ForumCategory;
import com.gymflow.domain.ForumReply;
import com.gymflow.domain.ForumReport;
import com.gymflow.domain.ForumTopic;
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

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Diễn đàn: ai đăng nhập cũng đăng chủ đề và trả lời; huấn luyện viên và quản lý ẩn / ghim / khoá.
 * Khách xem được chủ đề đang hiển thị, tên người viết rút gọn. Chỉ quản lý xoá hẳn bài của người khác.
 */
@Service
@RequiredArgsConstructor
public class ForumService {

    private static final int TOPIC_COOLDOWN_SECONDS = 60;
    private static final int REPLY_COOLDOWN_SECONDS = 15;
    private static final int EXCERPT_LENGTH = 180;
    private static final Sort LIST_SORT = Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("lastActivityAt"), Sort.Order.desc("id"));

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
        String query = q == null ? "" : q.trim();
        return PageResponse.of(topicRepository.search(isStaff(viewer), category, query, p), t -> summary(t, viewer));
    }

    @Transactional(readOnly = true)
    public TopicDetail topic(AuthUser viewer, Long id) {
        return detail(visibleTopic(viewer, id), viewer);
    }

    // ---------- Chủ đề ----------

    @Transactional
    public TopicDetail create(AuthUser me, TopicRequest req) {
        LocalDateTime now = LocalDateTime.now(clock);
        if (topicRepository.existsByAuthor_IdAndCreatedAtAfter(me.id(), now.minusSeconds(TOPIC_COOLDOWN_SECONDS))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Bạn vừa đăng một chủ đề, vui lòng chờ 1 phút rồi đăng tiếp");
        }
        ForumTopic t = new ForumTopic();
        t.setAuthor(userRepository.getReferenceById(me.id()));
        t.setTitle(req.title().trim());
        t.setCategory(req.category());
        t.setBody(req.body().trim());
        t.setCreatedAt(now);
        t.setLastActivityAt(now);
        topicRepository.save(t);
        return detail(t, me);
    }

    @Transactional
    public TopicDetail update(AuthUser me, Long id, TopicRequest req) {
        ForumTopic t = topicOr404(id);
        if (!isAuthor(me, t.getAuthor())) throw ApiException.forbidden();
        if (t.isHidden()) throw ApiException.badRequest("Chủ đề đang bị ẩn nên không sửa được");
        t.setTitle(req.title().trim());
        t.setCategory(req.category());
        t.setBody(req.body().trim());
        t.setUpdatedAt(LocalDateTime.now(clock));
        return detail(t, me);
    }

    @Transactional
    public void delete(AuthUser me, Long id) {
        ForumTopic t = topicOr404(id);
        if (!me.isAdmin()) {
            if (!isAuthor(me, t.getAuthor())) throw ApiException.forbidden();
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
        String reason = blankToNull(req.reason());
        switch (req.action()) {
            case HIDE -> {
                if (reason == null) throw ApiException.badRequest("Vui lòng ghi lý do ẩn để người viết biết");
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
        ForumTopic t = visibleTopic(me, topicId);
        if (t.isHidden()) throw ApiException.badRequest("Chủ đề đang bị ẩn nên không nhận thêm trả lời");
        if (t.isLocked() && !isStaff(me)) throw ApiException.badRequest("Chủ đề đã khoá, không nhận thêm trả lời");
        LocalDateTime now = LocalDateTime.now(clock);
        if (replyRepository.existsByAuthor_IdAndCreatedAtAfter(me.id(), now.minusSeconds(REPLY_COOLDOWN_SECONDS))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Bạn trả lời hơi nhanh, vui lòng chờ vài giây rồi gửi lại");
        }
        ForumReply r = new ForumReply();
        r.setTopic(t);
        r.setAuthor(userRepository.getReferenceById(me.id()));
        r.setBody(req.body().trim());
        r.setCreatedAt(now);
        replyRepository.save(r);
        t.setLastActivityAt(now);
        recount(t);
        return reply(r, me);
    }

    @Transactional
    public ReplyResponse updateReply(AuthUser me, Long id, ReplyRequest req) {
        ForumReply r = replyOr404(id);
        if (!isAuthor(me, r.getAuthor())) throw ApiException.forbidden();
        if (r.isHidden()) throw ApiException.badRequest("Trả lời đang bị ẩn nên không sửa được");
        r.setBody(req.body().trim());
        r.setUpdatedAt(LocalDateTime.now(clock));
        return reply(r, me);
    }

    @Transactional
    public void deleteReply(AuthUser me, Long id) {
        ForumReply r = replyOr404(id);
        if (!me.isAdmin() && !isAuthor(me, r.getAuthor())) throw ApiException.forbidden();
        ForumTopic t = r.getTopic();
        replyRepository.delete(r);
        recount(t);
        if (me.isAdmin() && !isAuthor(me, r.getAuthor())) auditService.log("FORUM_DELETE", "FORUM_REPLY", id, null);
    }

    @Transactional
    public ReplyResponse moderateReply(AuthUser me, Long id, ModerationRequest req) {
        ForumReply r = replyOr404(id);
        String reason = blankToNull(req.reason());
        switch (req.action()) {
            case HIDE -> {
                if (reason == null) throw ApiException.badRequest("Vui lòng ghi lý do ẩn để người viết biết");
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
        recount(r.getTopic());
        auditService.log("FORUM_" + req.action().name(), "FORUM_REPLY", id, reason);
        return reply(r, me);
    }

    // ---------- Báo cáo vi phạm ----------

    @Transactional
    public void reportTopic(AuthUser me, Long topicId, ReportRequest req) {
        ForumTopic t = visibleTopic(me, topicId);
        if (isAuthor(me, t.getAuthor())) throw ApiException.badRequest("Bạn không thể báo cáo bài của chính mình");
        if (reportRepository.existsByReporter_IdAndTopic_IdAndReplyIsNullAndStatus(me.id(), topicId, ForumReport.OPEN)) return;
        saveReport(me, t, null, req.reason());
    }

    @Transactional
    public void reportReply(AuthUser me, Long replyId, ReportRequest req) {
        ForumReply r = replyOr404(replyId);
        visibleTopic(me, r.getTopic().getId());
        if (isAuthor(me, r.getAuthor())) throw ApiException.badRequest("Bạn không thể báo cáo bài của chính mình");
        if (reportRepository.existsByReporter_IdAndReply_IdAndStatus(me.id(), replyId, ForumReport.OPEN)) return;
        saveReport(me, r.getTopic(), r, req.reason());
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

    // ---------- Nội bộ ----------

    private void saveReport(AuthUser me, ForumTopic t, ForumReply r, String reason) {
        ForumReport rp = new ForumReport();
        rp.setTopic(t);
        rp.setReply(r);
        rp.setReporter(userRepository.getReferenceById(me.id()));
        rp.setReason(reason.trim());
        rp.setCreatedAt(LocalDateTime.now(clock));
        reportRepository.save(rp);
        auditService.log("FORUM_REPORT", r == null ? "FORUM_TOPIC" : "FORUM_REPLY", r == null ? t.getId() : r.getId(), reason.trim());
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

    private TopicSummary summary(ForumTopic t, AuthUser viewer) {
        return new TopicSummary(t.getId(), t.getTitle(), t.getCategory(), excerpt(t.getBody()), author(t.getAuthor(), viewer),
                t.isPinned(), t.isLocked(), t.isHidden(), t.getReplyCount(), t.getCreatedAt(), t.getLastActivityAt());
    }

    private TopicDetail detail(ForumTopic t, AuthUser viewer) {
        boolean staff = isStaff(viewer);
        List<ReplyResponse> replies = replyRepository.findByTopic_IdOrderByCreatedAtAscIdAsc(t.getId()).stream()
                .filter(r -> !r.isHidden() || staff || isAuthor(viewer, r.getAuthor()))
                .map(r -> reply(r, viewer))
                .toList();
        return new TopicDetail(t.getId(), t.getTitle(), t.getCategory(), t.getBody(), author(t.getAuthor(), viewer),
                t.isPinned(), t.isLocked(), t.isHidden(), t.getHiddenReason(), t.getReplyCount(),
                t.getCreatedAt(), t.getUpdatedAt(), replies, isAuthor(viewer, t.getAuthor()), staff);
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

    static String excerpt(String body) {
        String s = body.replaceAll("(?m)^#+\\s*", "").replaceAll("\\s+", " ").trim();
        return s.length() <= EXCERPT_LENGTH ? s : s.substring(0, EXCERPT_LENGTH - 1).trim() + "…";
    }

    private static boolean isStaff(AuthUser u) {
        return u != null && (u.isAdmin() || u.isTrainer());
    }

    private static boolean isAuthor(AuthUser u, User author) {
        return u != null && author != null && u.id().equals(author.getId());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
