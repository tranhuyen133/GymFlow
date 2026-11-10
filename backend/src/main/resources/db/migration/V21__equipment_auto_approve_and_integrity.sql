-- =====================================================================
-- GymFlow · V21 · Kho dụng cụ không cần chờ duyệt + bảo vệ liên kết bài tập
--  * Dụng cụ do quản lý/HLV thêm được hiển thị ngay (APPROVED).
--  * Đổi giá trị mặc định của review_status sang APPROVED cho dữ liệu mới.
--  * Bổ sung placeholder cho mọi mã dụng cụ đang được bài tập tham chiếu
--    nhưng chưa có trong bảng equipment, tránh link bài tập ↔ dụng cụ bị 404.
--  * Chỉ thêm/sửa dữ liệu; không đổi cấu trúc cột hiện có.
-- =====================================================================

-- 1. Duyệt toàn bộ dụng cụ đang có (kể cả dữ liệu seed PENDING của V19).
UPDATE equipment
SET review_status = 'APPROVED'
WHERE review_status <> 'APPROVED';

-- 2. Dữ liệu mới mặc định đã duyệt, không phải chờ ai duyệt nữa.
ALTER TABLE equipment
    ALTER COLUMN review_status SET DEFAULT 'APPROVED';

-- 3. Tách equipment_keys của bài tập và thêm placeholder cho mã còn thiếu.
--    INSERT IGNORE dựa vào PRIMARY KEY (`key`) nên chạy lại nhiều lần vẫn an toàn.
INSERT IGNORE INTO equipment (`key`, name, category, short_desc, sort_order, hidden, review_status, origin)
WITH RECURSIVE split AS (
    SELECT TRIM(SUBSTRING_INDEX(e.equipment_keys, ',', 1)) AS piece,
           SUBSTRING(e.equipment_keys,
                     LENGTH(SUBSTRING_INDEX(e.equipment_keys, ',', 1)) + 2) AS rest
    FROM exercises e
    WHERE e.equipment_keys IS NOT NULL AND TRIM(e.equipment_keys) <> ''
    UNION ALL
    SELECT TRIM(SUBSTRING_INDEX(rest, ',', 1)),
           CASE WHEN LOCATE(',', rest) > 0 THEN SUBSTRING(rest, LOCATE(',', rest) + 1) ELSE '' END
    FROM split
    WHERE rest <> ''
)
SELECT DISTINCT
    LOWER(piece),
    CONCAT('Dụng cụ: ', LOWER(piece)),
    'ACCESSORY',
    'Dụng cụ được bổ sung tự động từ danh mục bài tập để giữ liên kết dữ liệu.',
    9000,
    FALSE,
    'APPROVED',
    'SELF_AUTHORED'
FROM split
WHERE piece <> '' AND CHAR_LENGTH(LOWER(piece)) <= 30;
