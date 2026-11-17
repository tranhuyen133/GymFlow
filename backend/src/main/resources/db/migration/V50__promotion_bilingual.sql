-- =====================================================================
-- GymFlow · V50 · Song ngữ Chương trình ưu đãi & Mã giảm giá
--  * Thêm tên/mô tả tiếng Anh cho promotions và điều kiện tiếng Anh cho quà tặng.
--  * Điền bản tiếng Anh cho 12 chương trình mẫu đã tạo ở V49; chương trình tạo sau
--    do quản lý nhập trực tiếp trên form (Tên EN / Mô tả EN).
-- =====================================================================

ALTER TABLE promotions
    ADD COLUMN name_en VARCHAR(100) NULL AFTER name,
    ADD COLUMN description_en VARCHAR(1000) NULL AFTER description;

ALTER TABLE promotion_grants
    ADD COLUMN conditions_en VARCHAR(255) NULL AFTER conditions;

-- 1. Mừng sinh nhật
UPDATE promotions
SET name_en = 'Birthday treat – 15% off',
    description_en = 'Automatically applied when you register or upgrade a package during your birthday month (based on the date of birth in your profile). Includes 1 neck-and-shoulder massage.'
WHERE name = 'Mừng sinh nhật – giảm 15%';

-- 2. Nâng cấp PT
UPDATE promotions
SET name_en = 'Upgrade to PT – extra 10% off',
    description_en = 'Automatically applied when upgrading from a self-training package to a package with a trainer: an extra 10% off the amount payable after credit. Includes 1 InBody scan for your trainer to build your plan.'
WHERE name = 'Nâng cấp lên PT – giảm thêm 10%';

-- 3. LENPT300
UPDATE promotions
SET name_en = 'Upgrade to PT – 300,000đ off',
    description_en = 'Enter the code when upgrading to a package with a trainer for an instant 300,000đ discount. Limited to 100 uses.'
WHERE code = 'LENPT300';

-- 4. Nhà giáo
UPDATE promotions
SET name_en = 'Vietnamese Teachers'' Day – 20% off',
    description_en = 'Applies to all packages from 15/11 to 22/11/2026.'
WHERE code = 'NHAGIAO2011';

-- 5. Black Friday
UPDATE promotions
SET name_en = 'Black Friday – 30% off',
    description_en = 'Four golden days 27–30/11/2026, 30% off all packages. Limited to 100 uses.'
WHERE code = 'BLACKFRIDAY';

-- 6. Noel
UPDATE promotions
SET name_en = 'Christmas & New Year – 15% off',
    description_en = 'From 20/12/2026 to 03/01/2027, includes 2 post-workout whey shakes.'
WHERE code = 'NOEL2026';

-- 7. Tết
UPDATE promotions
SET name_en = 'Lunar New Year – 500,000đ lucky money',
    description_en = '500,000đ off packages from 2,000,000đ, from 25/01 to 21/02/2027. Includes 1 sports massage.'
WHERE code = 'TET2027';

-- 8. Phụ nữ
UPDATE promotions
SET name_en = 'International Women''s Day – 20% off',
    description_en = 'From 05/03 to 09/03/2027.'
WHERE code = 'PHUNU83';

-- 9. Giải phóng
UPDATE promotions
SET name_en = 'Reunification Day – 20% off',
    description_en = 'From 25/04 to 03/05/2027.'
WHERE code = 'GIAIPHONG';

-- 10. Quốc khánh
UPDATE promotions
SET name_en = 'National Day – 29% off',
    description_en = 'From 30/08 to 03/09/2027. Limited to 100 uses.'
WHERE code = 'QUOCKHANH';

-- 11. Chào hội viên mới
UPDATE promotions
SET name_en = 'New member welcome – 10% off',
    description_en = 'For people who have never purchased a package at GymFlow.'
WHERE code = 'CHAOBANMOI';

-- 12. Gia hạn sớm
UPDATE promotions
SET name_en = 'Early renewal – 15% off',
    description_en = 'For members who already have a package and renew to keep training without a gap.'
WHERE code = 'GIAHAN15';

-- Điều kiện quà tặng mẫu
UPDATE promotion_grants
SET conditions_en = 'Usable within 30 days from the package start date'
WHERE conditions = 'Dùng trong 30 ngày kể từ ngày gói bắt đầu';

UPDATE promotion_grants
SET conditions_en = 'Measure before your first PT session so the trainer can build your plan'
WHERE conditions = 'Đo trước buổi PT đầu tiên để HLV lên giáo án';

UPDATE promotion_grants
SET conditions_en = 'Book at least 3 hours in advance'
WHERE conditions = 'Đặt lịch trước 3 giờ';
