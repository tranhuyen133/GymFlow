package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** V55 · Nhật ký một email tự động. (kind, refKey) duy nhất: mỗi sự kiện chỉ gửi một lần. */
@Entity
@Table(name = "email_logs")
@Getter
@Setter
@NoArgsConstructor
public class EmailLog {
    public static final String SENT = "SENT";
    public static final String FAILED = "FAILED";
    public static final String SKIPPED = "SKIPPED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "to_email", nullable = false, length = 120)
    private String toEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EmailKind kind;

    @Column(name = "ref_key", nullable = false, length = 100)
    private String refKey;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, length = 10)
    private String status;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(length = 300)
    private String error;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
