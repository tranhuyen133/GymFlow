-- Existing accounts remain usable; verification is required only for newly self-registered accounts.
ALTER TABLE users
    ADD COLUMN email_verified_at DATETIME(6) NULL;

UPDATE users
SET email_verified_at = COALESCE(created_at, CURRENT_TIMESTAMP(6));

CREATE TABLE email_verification_tokens (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT       NOT NULL,
    code_hash       VARCHAR(100) NOT NULL,
    expires_at      DATETIME(6)  NOT NULL,
    used_at         DATETIME(6),
    failed_attempts INT          NOT NULL DEFAULT 0,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX ix_email_verification_user_created (user_id, created_at),
    CONSTRAINT ck_email_verification_attempts CHECK (failed_attempts BETWEEN 0 AND 5)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

ALTER TABLE password_reset_tokens
    ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0;

CREATE TABLE chat_conversations (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    title      VARCHAR(120) NOT NULL,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_chat_conversation_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX ix_chat_conversation_user_updated (user_id, updated_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE chat_messages (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT       NOT NULL,
    sender           VARCHAR(10)  NOT NULL,
    content          TEXT         NOT NULL,
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_chat_message_conversation FOREIGN KEY (conversation_id)
        REFERENCES chat_conversations (id) ON DELETE CASCADE,
    CONSTRAINT ck_chat_message_sender CHECK (sender IN ('USER', 'ASSISTANT')),
    INDEX ix_chat_message_conversation_created (conversation_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
