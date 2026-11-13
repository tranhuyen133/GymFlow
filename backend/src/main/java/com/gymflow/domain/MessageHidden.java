package com.gymflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

/** "Xoá phía tôi": tin nhắn bị ẩn với một người dùng, người còn lại vẫn thấy. */
@Entity
@Table(name = "message_hidden")
@IdClass(MessageHidden.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class MessageHidden {
    @Id
    @Column(name = "message_id")
    private Long messageId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "hidden_at", nullable = false)
    private LocalDateTime hiddenAt;

    public MessageHidden(Long messageId, Long userId, LocalDateTime hiddenAt) {
        this.messageId = messageId;
        this.userId = userId;
        this.hiddenAt = hiddenAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Key implements Serializable {
        private Long messageId;
        private Long userId;

        public Key(Long messageId, Long userId) {
            this.messageId = messageId;
            this.userId = userId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key k)) return false;
            return Objects.equals(messageId, k.messageId) && Objects.equals(userId, k.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(messageId, userId);
        }
    }
}
