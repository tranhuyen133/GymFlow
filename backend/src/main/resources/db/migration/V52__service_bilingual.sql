-- =====================================================================
-- GymFlow · V52 · Song ngữ Dịch vụ bổ sung
--  * Thêm tên/mô tả/lưu ý khung giờ tiếng Anh cho bảng services.
--  * Idempotent: chỉ thêm cột nếu chưa tồn tại.
--  * Điền bản tiếng Anh cho 11 dịch vụ mẫu; dịch vụ tạo sau do quản lý nhập trên form.
-- =====================================================================

SET @has_name_en := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'name_en'
);
SET @sql := IF(@has_name_en = 0,
    'ALTER TABLE services ADD COLUMN name_en VARCHAR(100) NULL AFTER name',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_description_en := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'description_en'
);
SET @sql := IF(@has_description_en = 0,
    'ALTER TABLE services ADD COLUMN description_en VARCHAR(1000) NULL AFTER description',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_opening_note_en := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'opening_note_en'
);
SET @sql := IF(@has_opening_note_en = 0,
    'ALTER TABLE services ADD COLUMN opening_note_en VARCHAR(255) NULL AFTER opening_note',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE services
SET name_en = 'Dry sauna',
    description_en = 'Sauna room at 80–90°C, up to 15 minutes per session. Drink enough water before and after.',
    opening_note_en = 'Daily 10:00–21:00'
WHERE name = 'Xông hơi khô (Sauna)';

UPDATE services
SET name_en = 'Steam room',
    description_en = 'Herbal steam room to relax and cleanse the skin after training.',
    opening_note_en = 'Daily 10:00–21:00'
WHERE name = 'Xông hơi ướt (Steam)';

UPDATE services
SET name_en = '60-minute sports massage',
    description_en = 'Deep massage of trained muscle groups to reduce soreness (DOMS), performed by a certified therapist.',
    opening_note_en = 'Book at least 3 hours in advance'
WHERE name = 'Massage thể thao 60 phút';

UPDATE services
SET name_en = '30-minute neck & shoulder massage',
    description_en = 'Relieves tension in the neck, shoulders and upper back – ideal for office workers.',
    opening_note_en = 'Book at least 3 hours in advance'
WHERE name = 'Massage cổ vai gáy 30 phút';

UPDATE services
SET name_en = 'Assisted stretching with a trainer (30 minutes)',
    description_en = 'A trainer guides passive stretching to improve hip, shoulder and spine mobility.',
    opening_note_en = 'According to the trainer''s availability'
WHERE name = 'Giãn cơ hỗ trợ cùng HLV (30 phút)';

UPDATE services
SET name_en = 'Ice bath recovery',
    description_en = 'Soak in 10–12°C water for 5–8 minutes after a hard session to reduce inflammation and recover faster.',
    opening_note_en = 'Do not use if you have a fever or cardiovascular condition'
WHERE name = 'Ngâm bồn nước đá phục hồi';

UPDATE services
SET name_en = 'InBody body composition scan',
    description_en = 'Measures body fat %, muscle mass, water and visceral fat with an InBody 570, including a printed result explanation.',
    opening_note_en = 'Fast for 2 hours before the scan'
WHERE name = 'Đo InBody phân tích cơ thể';

UPDATE services
SET name_en = '1:1 nutrition consultation (45 minutes)',
    description_en = 'A specialist builds a meal plan for your goal (fat loss / muscle gain) and calculates calories and macros.',
    opening_note_en = 'Bring your latest InBody result if available'
WHERE name = 'Tư vấn dinh dưỡng 1:1 (45 phút)';

UPDATE services
SET name_en = 'Post-workout whey protein shake',
    description_en = 'A 25 g protein whey shake prepared at the bar (vanilla, chocolate, strawberry).',
    opening_note_en = 'Bar on floor 1'
WHERE name = 'Ly whey protein sau tập';

UPDATE services
SET name_en = 'Monthly personal locker rental',
    description_en = 'Private locker with charging socket, overnight storage, 30 days per rental.',
    opening_note_en = 'Collect the key at reception'
WHERE name = 'Thuê tủ đồ cá nhân theo tháng';

UPDATE services
SET name_en = 'Workout towel & bottled water',
    description_en = 'One clean workout towel and one 500 ml bottle of water.',
    opening_note_en = 'Collect at reception'
WHERE name = 'Khăn tập & nước suối';
