package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "forum_topics")
@Getter
@Setter
@NoArgsConstructor
public class ForumTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "title_en", length = 200)
    private String titleEn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ForumCategory category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "body_en", columnDefinition = "TEXT")
    private String bodyEn;

    @Column(nullable = false)
    private boolean pinned;

    @Column(nullable = false)
    private boolean locked;

    @Column(nullable = false)
    private boolean hidden;

    @Column(name = "hidden_reason")
    private String hiddenReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hidden_by")
    private User hiddenBy;

    @Column(name = "hidden_at")
    private LocalDateTime hiddenAt;

    /** Số trả lời đang hiển thị, tính lại mỗi khi thêm / xoá / ẩn trả lời. */
    @Column(name = "reply_count", nullable = false)
    private int replyCount;

    @Column(name = "last_activity_at", nullable = false)
    private LocalDateTime lastActivityAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Chỉ đặt khi người viết sửa nội dung (không đổi khi có trả lời mới) để giao diện ghi "đã sửa" cho đúng. */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (lastActivityAt == null) lastActivityAt = createdAt;
    }
}
