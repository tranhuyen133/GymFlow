-- V55 · Email tự động có giao diện (song ngữ theo ngôn ngữ hội viên chọn trên web), tuỳ chọn nhận email,
-- nhật ký gửi (chống gửi trùng, gửi lại khi lỗi) và huy hiệu của hội viên. Chỉ thêm bảng mới.

-- Một dòng cho mỗi tài khoản, tạo khi cần (lần đầu gửi email hoặc mở trang tuỳ chọn). Mặc định nhận mọi loại.
CREATE TABLE IF NOT EXISTS email_preferences (
    user_id            BIGINT      NOT NULL PRIMARY KEY,
    locale             VARCHAR(5)  NOT NULL DEFAULT 'vi',
    renewal            BOOLEAN     NOT NULL DEFAULT TRUE,
    birthday           BOOLEAN     NOT NULL DEFAULT TRUE,
    session_reminder   BOOLEAN     NOT NULL DEFAULT TRUE,
    weekly_digest      BOOLEAN     NOT NULL DEFAULT TRUE,
    trainer_report     BOOLEAN     NOT NULL DEFAULT TRUE,
    retention          BOOLEAN     NOT NULL DEFAULT TRUE,
    achievements       BOOLEAN     NOT NULL DEFAULT TRUE,
    unsubscribe_token  VARCHAR(64) NOT NULL,
    updated_at         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_email_pref_token UNIQUE (unsubscribe_token),
    CONSTRAINT fk_email_pref_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_email_pref_locale CHECK (locale IN ('vi', 'en'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Mỗi email tự động một dòng; (kind, ref_key) duy nhất nên một sự kiện chỉ gửi một lần.
-- ref_key ví dụ: sub-12 (nhắc gia hạn gói #12), m5-2026 (sinh nhật năm 2026), m5-2026-11-18 (nhắc lịch ngày 18/11).
CREATE TABLE IF NOT EXISTS email_logs (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NULL,
    to_email    VARCHAR(120) NOT NULL,
    kind        VARCHAR(30)  NOT NULL,
    ref_key     VARCHAR(100) NOT NULL,
    subject     VARCHAR(200) NOT NULL,
    status      VARCHAR(10)  NOT NULL,
    attempts    INT          NOT NULL DEFAULT 0,
    error       VARCHAR(300) NULL,
    created_at  DATETIME     NOT NULL,
    sent_at     DATETIME     NULL,
    CONSTRAINT uq_email_log_ref UNIQUE (kind, ref_key),
    CONSTRAINT fk_email_log_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_email_log_status CHECK (status IN ('SENT', 'FAILED', 'SKIPPED')),
    INDEX ix_email_log_created (created_at),
    INDEX ix_email_log_status (status, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Huy hiệu hội viên đã đạt; seen_at null = chưa xem (trang Hôm nay hiện hiệu ứng chúc mừng).
CREATE TABLE IF NOT EXISTS member_badges (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id  BIGINT      NOT NULL,
    code       VARCHAR(40) NOT NULL,
    earned_at  DATETIME    NOT NULL,
    seen_at    DATETIME    NULL,
    CONSTRAINT uq_member_badge UNIQUE (member_id, code),
    CONSTRAINT fk_member_badge_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
