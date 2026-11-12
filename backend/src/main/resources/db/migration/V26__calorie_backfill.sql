-- =====================================================================
-- GymFlow · V26 · Backfill calo MET cho các buổi tập lịch sử
--  * Giữ lại calo nhập tay cũ trong legacy_calories trước khi ghi đè bằng MET.
--  * Đánh dấu công thức/phương pháp backfill để truy vết.
--  * Không tạo bảng mới: tái sử dụng workout_logs + workout_log_exercises của V25.
-- =====================================================================

ALTER TABLE workout_logs
    ADD COLUMN legacy_calories INT NULL AFTER calories,
    ADD CONSTRAINT ck_logs_legacy_calories CHECK (legacy_calories IS NULL OR legacy_calories >= 0),
    ADD INDEX ix_logs_backfill (estimate_status, calculated_at, completed_at);

UPDATE workout_logs
SET legacy_calories = calories
WHERE estimate_status = 'LEGACY'
  AND calories IS NOT NULL
  AND legacy_calories IS NULL;
