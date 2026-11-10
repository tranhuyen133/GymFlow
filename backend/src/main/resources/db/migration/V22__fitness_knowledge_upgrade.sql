-- =====================================================================
-- GymFlow · V22 · Nâng cấp kho kiến thức: nguồn dataset mở, quản lý media có bản quyền
--  * Thêm cột external_id cho exercises để liên kết và đồng bộ idempotent với dataset.
--  * Tạo bảng exercise_media lưu trữ hình ảnh/GIF/video minh hoạ có thông tin nguồn và bản quyền.
--  * Ghi nhận nguồn tham khảo EXERCISES_DATASET (MIT License, visual assets thuộc Gym Visual).
-- =====================================================================

-- 1. Ghi nhận nguồn dataset mở
INSERT INTO content_sources (code, publisher, title, url, license, license_url, license_verified, attribution, accessed_at)
VALUES ('EXERCISES_DATASET', 'hasaneyldrm (GitHub)', 'Exercise Dataset - Open fitness exercise metadata',
        'https://github.com/hasaneyldrm/exercises-dataset', 'MIT License (Text & Data only; Images excluded under Gym Visual copyright)',
        'https://github.com/hasaneyldrm/exercises-dataset/blob/main/LICENSE', TRUE,
        'Metadata and instructions adapted from exercises-dataset by hasaneyldrm under MIT License. Visual media excluded in compliance with Gym Visual copyright.',
        '2026-11-10')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 2. Thêm cột external_id cho bảng exercises
ALTER TABLE exercises
    ADD COLUMN external_id VARCHAR(40) NULL AFTER id,
    ADD INDEX ix_ex_external_id (external_id);

-- 3. Bảng quản lý media minh hoạ của bài tập (ảnh, GIF, video embed) kèm giấy phép
CREATE TABLE IF NOT EXISTS exercise_media (
    id                 BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    exercise_id        BIGINT       NOT NULL,
    media_type         VARCHAR(20)  NOT NULL,
    url_or_key         VARCHAR(255) NOT NULL,
    caption            VARCHAR(255) NULL,
    license_type       VARCHAR(100) NULL,
    source_attribution VARCHAR(255) NULL,
    is_cover           BOOL         NOT NULL DEFAULT FALSE,
    is_approved        BOOL         NOT NULL DEFAULT FALSE,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_em_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT ck_em_type CHECK (media_type IN ('IMAGE', 'GIF', 'VIDEO_EMBED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
