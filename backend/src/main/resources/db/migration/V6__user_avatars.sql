-- =====================================================================
-- GymFlow · V6 · Ảnh đại diện tài khoản (MySQL 8.4)
--  * Ảnh nằm ở bảng riêng để các truy vấn users (đăng nhập, danh sách, JWT filter) không phải đọc BLOB.
--  * users.avatar_updated_at: NULL = chưa có ảnh; khác NULL dùng làm "phiên bản" để frontend biết khi nào tải lại.
--  * Frontend đã cắt vuông + nén về 512×512 trước khi gửi; backend vẫn kiểm tra lại định dạng (magic bytes) và dung lượng.
--  * Chỉ thêm bảng/cột mới, không sửa dữ liệu cũ. Xoá tài khoản thì ảnh tự xoá theo (ON DELETE CASCADE).
-- =====================================================================

ALTER TABLE users
    ADD COLUMN avatar_updated_at DATETIME(6) NULL AFTER last_login_at;

CREATE TABLE user_avatars (
    user_id      BIGINT      NOT NULL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL,
    size_bytes   INT         NOT NULL,
    data         MEDIUMBLOB  NOT NULL,
    updated_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_avatar_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_avatar_type CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
    -- Khớp AvatarService.MAX_BYTES (512 KB)
    CONSTRAINT ck_avatar_size CHECK (size_bytes BETWEEN 1 AND 524288)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
