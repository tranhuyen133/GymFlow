package com.gymflow.web;

import com.gymflow.common.PageResponse;
import com.gymflow.domain.ForumCategory;
import com.gymflow.dto.ForumDtos.*;
import com.gymflow.security.CurrentUser;
import com.gymflow.service.ForumService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Diễn đàn")
@RestController
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    // ---------- Công khai (khách xem được, SecurityConfig mở GET) ----------
    @GetMapping("/api/forum/topics")
    public PageResponse<TopicSummary> topics(@RequestParam(required = false) ForumCategory category,
                                             @RequestParam(defaultValue = "") String q,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return forumService.topics(CurrentUser.orNull(), category, q, page, size);
    }

    @GetMapping("/api/forum/topics/{id}")
    public TopicDetail topic(@PathVariable Long id) {
        return forumService.topic(CurrentUser.orNull(), id);
    }

    // ---------- Cần đăng nhập ----------
    @PostMapping("/api/forum/topics")
    @ResponseStatus(HttpStatus.CREATED)
    public TopicDetail createTopic(@Valid @RequestBody TopicRequest req) {
        return forumService.create(CurrentUser.get(), req);
    }

    @PutMapping("/api/forum/topics/{id}")
    public TopicDetail updateTopic(@PathVariable Long id, @Valid @RequestBody TopicRequest req) {
        return forumService.update(CurrentUser.get(), id, req);
    }

    @DeleteMapping("/api/forum/topics/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTopic(@PathVariable Long id) {
        forumService.delete(CurrentUser.get(), id);
    }

    @PostMapping("/api/forum/topics/{id}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public ReplyResponse reply(@PathVariable Long id, @Valid @RequestBody ReplyRequest req) {
        return forumService.reply(CurrentUser.get(), id, req);
    }

    @PutMapping("/api/forum/replies/{id}")
    public ReplyResponse updateReply(@PathVariable Long id, @Valid @RequestBody ReplyRequest req) {
        return forumService.updateReply(CurrentUser.get(), id, req);
    }

    @DeleteMapping("/api/forum/replies/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReply(@PathVariable Long id) {
        forumService.deleteReply(CurrentUser.get(), id);
    }

    @PostMapping("/api/forum/topics/{id}/report")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reportTopic(@PathVariable Long id, @Valid @RequestBody ReportRequest req) {
        forumService.reportTopic(CurrentUser.get(), id, req);
    }

    @PostMapping("/api/forum/replies/{id}/report")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reportReply(@PathVariable Long id, @Valid @RequestBody ReportRequest req) {
        forumService.reportReply(CurrentUser.get(), id, req);
    }

    // ---------- Kiểm duyệt: huấn luyện viên và quản lý ----------
    @PutMapping("/api/forum/topics/{id}/moderation")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public TopicDetail moderateTopic(@PathVariable Long id, @Valid @RequestBody ModerationRequest req) {
        return forumService.moderateTopic(CurrentUser.get(), id, req);
    }

    @PutMapping("/api/forum/replies/{id}/moderation")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public ReplyResponse moderateReply(@PathVariable Long id, @Valid @RequestBody ModerationRequest req) {
        return forumService.moderateReply(CurrentUser.get(), id, req);
    }

    @GetMapping("/api/forum/reports")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public List<ReportResponse> reports() {
        return forumService.openReports();
    }

    @PutMapping("/api/forum/reports/{id}/resolve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public void resolveReport(@PathVariable Long id) {
        forumService.resolveReport(CurrentUser.get(), id);
    }
}
