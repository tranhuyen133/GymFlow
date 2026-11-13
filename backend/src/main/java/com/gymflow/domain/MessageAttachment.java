package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Dữ liệu tệp đính kèm của một tin nhắn (khoá chính = message_id). Chỉ đọc khi tải tệp. */
@Entity
@Table(name = "message_attachments")
@Getter
@Setter
@NoArgsConstructor
public class MessageAttachment {
    @Id
    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "sha256", nullable = false, length = 64, columnDefinition = "CHAR(64)")
    private String sha256;

    @Column(name = "data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] data;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
