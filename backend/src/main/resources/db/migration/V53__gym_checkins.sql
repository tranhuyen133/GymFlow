-- V53 · Check-in tại quầy: hội viên quét mã QR (đổi mỗi 30 giây) hoặc quản lý check-in hộ.
-- Dữ liệu này dùng cho trang "Hôm nay" của hội viên và biểu đồ giờ đông / giờ vắng. Chỉ thêm bảng mới.
CREATE TABLE IF NOT EXISTS gym_checkins (
    id             BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id      BIGINT      NOT NULL,
    checked_in_at  DATETIME    NOT NULL,
    method         VARCHAR(10) NOT NULL DEFAULT 'QR',
    created_by     BIGINT      NULL,
    CONSTRAINT fk_checkin_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_checkin_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_checkin_method CHECK (method IN ('QR', 'MANUAL')),
    INDEX ix_checkin_time (checked_in_at),
    INDEX ix_checkin_member_time (member_id, checked_in_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
