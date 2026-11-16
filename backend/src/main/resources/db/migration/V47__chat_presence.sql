-- =====================================================================
-- GymFlow · V47 · Trạng thái online khi nhắn tin Hội viên ↔ HLV
--  * users.last_seen_at: lần cuối tài khoản còn hoạt động (heartbeat từ trình duyệt).
--  * Không lưu cờ "online" riêng: máy chủ tính online = last_seen_at trong 60 giây gần nhất,
--    nên tắt trình duyệt / mất mạng thì trạng thái tự chuyển offline.
-- =====================================================================

ALTER TABLE users
    ADD COLUMN last_seen_at DATETIME(6) NULL AFTER last_login_at;

CREATE INDEX ix_users_last_seen ON users (last_seen_at);
