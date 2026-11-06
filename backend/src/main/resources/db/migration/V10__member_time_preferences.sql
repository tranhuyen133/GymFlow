-- =====================================================================
-- GymFlow · V10 · Giờ tập mong muốn của hội viên
-- Hội viên khai khung giờ muốn đến tập theo tuần; HLV dựa vào đó để xếp ca làm và lịch tập.
-- Chỉ thêm bảng mới. Giờ mở cửa 05:00–22:00 (backend kiểm tra, CHECK chặn dữ liệu sai lọt vào).
-- =====================================================================
CREATE TABLE IF NOT EXISTS member_time_preferences (
    id           BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id    BIGINT   NOT NULL,
    day_of_week  SMALLINT NOT NULL,
    start_time   TIME     NOT NULL,
    end_time     TIME     NOT NULL,
    CONSTRAINT fk_mtp_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT ck_mtp_day CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT ck_mtp_time CHECK (end_time > start_time AND start_time >= '05:00:00' AND end_time <= '22:00:00'),
    INDEX ix_mtp_member (member_id, day_of_week)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
