-- =====================================================================
-- GymFlow · V15 · Hội thoại và tin nhắn Hội viên ↔ Huấn luyện viên
--  * conversations: cặp member_id và trainer_id là UNIQUE (không tạo trùng).
--    Chat KHÔNG làm thay đổi members.trainer_id.
--  * messages: ON DELETE CASCADE theo hội thoại, lưu người gửi và thời gian đọc (read_at).
-- =====================================================================

CREATE TABLE conversations (
    id              BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id       BIGINT      NOT NULL,
    trainer_id      BIGINT      NOT NULL,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_message_at DATETIME(6) NULL,
    CONSTRAINT fk_conversations_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (id) ON DELETE CASCADE,
    CONSTRAINT uq_conversations_member_trainer UNIQUE (member_id, trainer_id),
    INDEX ix_conversations_member (member_id),
    INDEX ix_conversations_trainer (trainer_id),
    INDEX ix_conversations_last_msg (last_message_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE messages (
    id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT        NOT NULL,
    sender_user_id  BIGINT        NOT NULL,
    body            VARCHAR(2000) NOT NULL,
    created_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    read_at         DATETIME(6)   NULL,
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX ix_messages_conv_created (conversation_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
