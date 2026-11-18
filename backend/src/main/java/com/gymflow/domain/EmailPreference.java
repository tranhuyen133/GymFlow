package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** V55 · Tuỳ chọn nhận email và ngôn ngữ email của một tài khoản. */
@Entity
@Table(name = "email_preferences")
@Getter
@Setter
@NoArgsConstructor
public class EmailPreference {
    @Id
    @Column(name = "user_id")
    private Long userId;

    /** vi | en – theo ngôn ngữ người dùng chọn trên web. */
    @Column(nullable = false, length = 5)
    private String locale = "vi";

    @Column(nullable = false)
    private boolean renewal = true;

    @Column(nullable = false)
    private boolean birthday = true;

    @Column(name = "session_reminder", nullable = false)
    private boolean sessionReminder = true;

    @Column(name = "weekly_digest", nullable = false)
    private boolean weeklyDigest = true;

    @Column(name = "trainer_report", nullable = false)
    private boolean trainerReport = true;

    @Column(nullable = false)
    private boolean retention = true;

    @Column(nullable = false)
    private boolean achievements = true;

    /** Mã bí mật trong liên kết "Tắt loại email này" – mở được mà không cần đăng nhập. */
    @Column(name = "unsubscribe_token", nullable = false, length = 64)
    private String unsubscribeToken;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public boolean english() {
        return "en".equals(locale);
    }

    public boolean allows(EmailKind kind) {
        return switch (kind) {
            case RENEWAL -> renewal;
            case BIRTHDAY -> birthday;
            case SESSION_REMINDER -> sessionReminder;
            case WEEKLY_DIGEST -> weeklyDigest;
            case TRAINER_REPORT -> trainerReport;
            case RETENTION -> retention;
            case ACHIEVEMENT -> achievements;
            case SECURITY -> true;
        };
    }

    public void set(EmailKind kind, boolean on) {
        switch (kind) {
            case RENEWAL -> renewal = on;
            case BIRTHDAY -> birthday = on;
            case SESSION_REMINDER -> sessionReminder = on;
            case WEEKLY_DIGEST -> weeklyDigest = on;
            case TRAINER_REPORT -> trainerReport = on;
            case RETENTION -> retention = on;
            case ACHIEVEMENT -> achievements = on;
            case SECURITY -> { /* luôn bật */ }
        }
    }
}
