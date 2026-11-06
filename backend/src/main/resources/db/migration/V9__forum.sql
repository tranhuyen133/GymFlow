-- =====================================================================
-- GymFlow · V9 · Diễn đàn thảo luận (thay Kho kiến thức trên giao diện)
-- Chỉ thêm bảng mới. Bảng articles và nội dung đã duyệt giữ nguyên, không xoá.
-- Ai đăng nhập cũng đăng chủ đề / trả lời; huấn luyện viên và quản lý ẩn, ghim, khoá.
-- Người dùng báo cáo vi phạm → forum_reports, nhân viên xử lý.
-- =====================================================================
CREATE TABLE IF NOT EXISTS forum_topics (
    id                BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    author_id         BIGINT       NOT NULL,
    title             VARCHAR(200) NOT NULL,
    category          VARCHAR(20)  NOT NULL,
    body              TEXT         NOT NULL,
    pinned            BOOLEAN      NOT NULL DEFAULT FALSE,
    locked            BOOLEAN      NOT NULL DEFAULT FALSE,
    hidden            BOOLEAN      NOT NULL DEFAULT FALSE,
    hidden_reason     VARCHAR(255),
    hidden_by         BIGINT,
    hidden_at         DATETIME(6),
    reply_count       INT          NOT NULL DEFAULT 0,
    last_activity_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6),
    CONSTRAINT fk_ftopic_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ftopic_hidden_by FOREIGN KEY (hidden_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_ftopic_category CHECK (category IN ('GENERAL', 'TRAINING', 'NUTRITION', 'RECOVERY', 'GYM')),
    CONSTRAINT ck_ftopic_replies CHECK (reply_count >= 0),
    INDEX ix_ftopic_list (hidden, pinned, last_activity_at),
    INDEX ix_ftopic_author (author_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS forum_replies (
    id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    topic_id       BIGINT       NOT NULL,
    author_id      BIGINT       NOT NULL,
    body           TEXT         NOT NULL,
    hidden         BOOLEAN      NOT NULL DEFAULT FALSE,
    hidden_reason  VARCHAR(255),
    hidden_by      BIGINT,
    hidden_at      DATETIME(6),
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6),
    CONSTRAINT fk_freply_topic FOREIGN KEY (topic_id) REFERENCES forum_topics (id) ON DELETE CASCADE,
    CONSTRAINT fk_freply_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_freply_hidden_by FOREIGN KEY (hidden_by) REFERENCES users (id) ON DELETE SET NULL,
    INDEX ix_freply_topic (topic_id, created_at),
    INDEX ix_freply_author (author_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS forum_reports (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    topic_id     BIGINT       NOT NULL,
    reply_id     BIGINT,
    reporter_id  BIGINT       NOT NULL,
    reason       VARCHAR(255) NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    resolved_by  BIGINT,
    resolved_at  DATETIME(6),
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_freport_topic FOREIGN KEY (topic_id) REFERENCES forum_topics (id) ON DELETE CASCADE,
    CONSTRAINT fk_freport_reply FOREIGN KEY (reply_id) REFERENCES forum_replies (id) ON DELETE CASCADE,
    CONSTRAINT fk_freport_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_freport_resolved_by FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_freport_status CHECK (status IN ('OPEN', 'RESOLVED')),
    INDEX ix_freport_status (status, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Chủ đề ghim nội quy, đứng tên quản lý đầu tiên. CSDL mới chưa có quản lý (DataSeeder chạy sau) thì bỏ qua.
INSERT INTO forum_topics (author_id, title, category, body, pinned, locked)
SELECT u.id,
       'Chào mừng đến Diễn đàn GymFlow – đọc trước khi đăng',
       'GENERAL',
       'Đây là nơi hội viên, huấn luyện viên và quản lý phòng tập hỏi đáp, chia sẻ kinh nghiệm tập luyện.\n\n## Nội quy\n- Tôn trọng người khác, không công kích cá nhân.\n- Không quảng cáo, không bán hàng, không đăng thông tin cá nhân của người khác.\n- Chia sẻ về sức khoẻ chỉ là kinh nghiệm cá nhân, không thay cho tư vấn của huấn luyện viên hay nhân viên y tế.\n- Thấy bài vi phạm, bấm \"Báo cáo\" để huấn luyện viên hoặc quản lý xem xét.\n\nHuấn luyện viên và quản lý có thể ẩn bài vi phạm, ghim hoặc khoá chủ đề.',
       TRUE,
       TRUE
FROM users u
WHERE u.role = 'ADMIN'
  AND NOT EXISTS (SELECT 1 FROM forum_topics)
ORDER BY u.id
LIMIT 1;
