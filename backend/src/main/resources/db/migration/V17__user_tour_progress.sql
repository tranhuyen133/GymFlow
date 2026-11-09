-- =====================================================================
-- GymFlow · V16 · Lưu tiến độ hướng dẫn người dùng theo tài khoản (SCRUM-225)
--  * user_tour_progress: lưu theo từng tour_key của người dùng (thay cho localStorage)
-- =====================================================================

CREATE TABLE user_tour_progress (
    user_id     BIGINT      NOT NULL,
    tour_key    VARCHAR(50) NOT NULL,
    step        INT         NOT NULL DEFAULT 0,
    status      VARCHAR(20) NOT NULL DEFAULT 'PAUSED',
    updated_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, tour_key),
    CONSTRAINT fk_tour_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_tour_progress_status CHECK (status IN ('PAUSED', 'DONE', 'SKIPPED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
