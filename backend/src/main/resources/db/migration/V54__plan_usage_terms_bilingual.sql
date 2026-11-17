-- =====================================================================
-- GymFlow · V53 · Điều kiện sử dụng gói tập song ngữ
--  * Thêm usage_terms_en cho membership_plans (idempotent).
--  * Dịch 11 điều kiện sử dụng mẫu đang có.
-- =====================================================================

SET @has_usage_terms_en := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'membership_plans' AND COLUMN_NAME = 'usage_terms_en'
);
SET @sql := IF(@has_usage_terms_en = 0,
    'ALTER TABLE membership_plans ADD COLUMN usage_terms_en VARCHAR(1000) NULL AFTER usage_terms',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE membership_plans SET usage_terms_en = 'Valid on the activation day. Bring your ID card when collecting the pass.'
WHERE name = 'Vé tập 1 ngày';

UPDATE membership_plans SET usage_terms_en = 'One purchase per member. No pause.'
WHERE name = 'Gói trải nghiệm 2 tuần';

UPDATE membership_plans SET usage_terms_en = 'Outside off-peak hours or at weekends: 30,000đ surcharge per visit.'
WHERE name = 'Gói giờ vàng 1 tháng (9h–16h)';

UPDATE membership_plans SET usage_terms_en = 'Show a valid student card at registration. Pause up to 7 days.'
WHERE name = 'Gói sinh viên 3 tháng';

UPDATE membership_plans SET usage_terms_en = 'Pause up to 60 days with 3 days'' notice. One transfer allowed, 200,000đ fee.'
WHERE name = 'Gói 24 tháng';

UPDATE membership_plans SET usage_terms_en = 'One purchase per member. Reschedule at least 12 hours ahead; late notice counts as a used session.'
WHERE name = 'PT trải nghiệm 3 buổi';

UPDATE membership_plans SET usage_terms_en = 'PT sessions valid for 30 days. Reschedule at least 12 hours ahead.'
WHERE name = 'Gym + PT 8 buổi (1 tháng)';

UPDATE membership_plans SET usage_terms_en = 'PT sessions valid for 45 days. Reschedule at least 12 hours ahead.'
WHERE name = 'Gym + PT 12 buổi (6 tuần)';

UPDATE membership_plans SET usage_terms_en = 'PT sessions valid for 90 days. Reschedule at least 24 hours ahead. Pause up to 14 days.'
WHERE name = 'Gym + PT 24 buổi (3 tháng)';

UPDATE membership_plans SET usage_terms_en = 'PT sessions valid for 120 days. Reschedule at least 24 hours ahead. Pause up to 21 days.'
WHERE name = 'Gym + PT giảm mỡ 36 buổi (4 tháng)';

UPDATE membership_plans SET usage_terms_en = 'A doctor''s clearance is required if you are under treatment. Reschedule at least 24 hours ahead.'
WHERE name = 'PT phục hồi vận động 10 buổi';
