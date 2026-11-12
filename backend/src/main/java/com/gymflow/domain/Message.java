package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_user_id", nullable = false)
    private User senderUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", length = 20)
    private Role senderRole;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public Message(Conversation conversation, User senderUser, String body) {
        this(conversation, senderUser, senderUser != null ? senderUser.getRole() : null, body, null);
    }

    public Message(Conversation conversation, User senderUser, Role senderRole, String body, String attachmentUrl) {
        this.conversation = conversation;
        this.senderUser = senderUser;
        this.senderRole = senderRole;
        this.body = body;
        this.attachmentUrl = attachmentUrl;
        this.createdAt = LocalDateTime.now();
    }
}
