package com.gymflow.dto;

import com.gymflow.domain.ForumCategory;
import com.gymflow.domain.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** DTO của Diễn đàn. Để riêng file này, không đụng Dtos.java dùng chung. */
public final class ForumDtos {
    private ForumDtos() {
    }

    /** name: khách chưa đăng nhập chỉ thấy tên rút gọn (VD "Kiên N."), không thấy họ tên đầy đủ. */
    public record ForumAuthor(Long id, String name, Role role) {
    }

    public record TopicSummary(Long id, String title, ForumCategory category, String excerpt, ForumAuthor author,
                               boolean pinned, boolean locked, boolean hidden, int replyCount,
                               LocalDateTime createdAt, LocalDateTime lastActivityAt) {
    }

    public record ReplyResponse(Long id, String body, ForumAuthor author, boolean hidden, String hiddenReason,
                                LocalDateTime createdAt, LocalDateTime updatedAt, boolean mine) {
    }

    /** viewerSignedIn: máy chủ nhận ra người xem đã đăng nhập. Giao diện còn tên người dùng mà false = phiên đã hết hạn. */
    public record TopicDetail(Long id, String title, ForumCategory category, String body, ForumAuthor author,
                              boolean pinned, boolean locked, boolean hidden, String hiddenReason, int replyCount,
                              LocalDateTime createdAt, LocalDateTime updatedAt, List<ReplyResponse> replies,
                              boolean mine, boolean canModerate, boolean viewerSignedIn) {
    }

    public record TopicRequest(
            @NotBlank(message = "Vui lòng nhập tiêu đề")
            @Size(min = 5, max = 200, message = "Tiêu đề từ 5 đến 200 ký tự") String title,
            @NotNull(message = "Vui lòng chọn chủ đề") ForumCategory category,
            @NotBlank(message = "Vui lòng nhập nội dung")
            @Size(min = 10, max = 10000, message = "Nội dung từ 10 đến 10.000 ký tự") String body) {
    }

    public record ReplyRequest(
            @NotBlank(message = "Vui lòng nhập nội dung trả lời")
            @Size(min = 2, max = 5000, message = "Trả lời từ 2 đến 5.000 ký tự") String body) {
    }

    public record ReportRequest(
            @NotBlank(message = "Vui lòng ghi lý do báo cáo")
            @Size(min = 5, max = 255, message = "Lý do từ 5 đến 255 ký tự") String reason) {
    }

    public enum ModerationAction { HIDE, SHOW, PIN, UNPIN, LOCK, UNLOCK }

    public record ModerationRequest(
            @NotNull(message = "Thiếu thao tác") ModerationAction action,
            @Size(max = 255, message = "Lý do tối đa 255 ký tự") String reason) {
    }

    public record ReportResponse(Long id, Long topicId, String topicTitle, Long replyId, String excerpt,
                                 String targetAuthor, boolean targetHidden, String reporter, String reason,
                                 LocalDateTime createdAt) {
    }
}
