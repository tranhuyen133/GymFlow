-- =====================================================================
-- V44 · Dọn dữ liệu bài tập (SCRUM-229)
--  * Gộp bài trùng: ẩn bài bị loại, chuyển tham chiếu sang bài giữ lại.
--  * Chuẩn hoá nhóm cơ (thêm vai giữa), dụng cụ và tên hiển thị.
--  * Không xoá cứng dữ liệu.
-- =====================================================================

-- 1. Bảng tạm ánh xạ bài bị loại -> bài giữ lại
CREATE TEMPORARY TABLE tmp_exercise_merge (
    drop_id BIGINT NOT NULL PRIMARY KEY,
    keep_id BIGINT NOT NULL
);

INSERT INTO tmp_exercise_merge (drop_id, keep_id) VALUES
    (20, 158),   -- Chạy bộ máy -> Chạy bộ trên máy chạy
    (21, 160),   -- Đạp xe tại chỗ -> Đạp xe thể lực
    (73, 162),   -- Chèo thuyền máy -> Chèo thuyền trên máy
    (75, 161),   -- Nhảy dây -> Nhảy dây nhịp điệu
    (131, 147),  -- Dạng đùi máy -> Dạng đùi trên máy
    (130, 148),  -- Khép đùi máy -> Khép đùi trên máy
    (90, 149),   -- Nhún vai thanh đòn -> Nhún vai đòn tạ trước đùi
    (145, 96),   -- Bay vai sau máy cáp -> Bay vai sau cáp (145 đã ẩn)
    (101, 142),  -- Cuốn thanh EZ -> Cuốn tạ đòn thanh EZ
    (102, 143),  -- Nằm duỗi tay sau trán -> Nằm duỗi tay sau thanh EZ
    (109, 144),  -- Kẹp bánh tạ -> Kẹp bánh tạ bằng ngón tay
    (134, 146),  -- Giữ cổ tĩnh trước - sau -> Giữ cơ cổ đẳng trường
    (135, 163),  -- Leo bậc máy -> Máy tập leo thang
    (30, 97),    -- Cuốn tay tạ nhẹ -> Cuốn tạ đơn
    (38, 278),   -- Xoay thân trên khi ngồi -> Xoay cột sống khi ngồi
    (49, 250);   -- Chùng chân tại chỗ -> Split squat tay không

-- 2. Chuyển tham chiếu sang bài giữ lại
UPDATE workout_plan_items i
JOIN tmp_exercise_merge m ON i.exercise_id = m.drop_id
SET i.exercise_id = m.keep_id;

UPDATE workout_log_exercises l
JOIN tmp_exercise_merge m ON l.exercise_id = m.drop_id
SET l.exercise_id = m.keep_id;

INSERT IGNORE INTO member_favorite_exercises (member_id, exercise_id, created_at)
SELECT f.member_id, m.keep_id, f.created_at
FROM member_favorite_exercises f
JOIN tmp_exercise_merge m ON f.exercise_id = m.drop_id;

DELETE f FROM member_favorite_exercises f
JOIN tmp_exercise_merge m ON f.exercise_id = m.drop_id;

-- Bài thay thế: chuyển cả hai chiều, sau đó bỏ cặp tự thân.
INSERT IGNORE INTO exercise_alternatives (exercise_id, alternative_id)
SELECT m.keep_id, a.alternative_id
FROM exercise_alternatives a
JOIN tmp_exercise_merge m ON a.exercise_id = m.drop_id;

INSERT IGNORE INTO exercise_alternatives (exercise_id, alternative_id)
SELECT a.exercise_id, m.keep_id
FROM exercise_alternatives a
JOIN tmp_exercise_merge m ON a.alternative_id = m.drop_id;

DELETE a FROM exercise_alternatives a
JOIN tmp_exercise_merge m ON a.exercise_id = m.drop_id OR a.alternative_id = m.drop_id;

DELETE FROM exercise_alternatives WHERE exercise_id = alternative_id;

-- Dụng cụ: gộp khoá của bài bị loại sang bài giữ lại.
INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_key)
SELECT m.keep_id, ee.equipment_key
FROM exercise_equipment ee
JOIN tmp_exercise_merge m ON ee.exercise_id = m.drop_id;

DELETE ee FROM exercise_equipment ee
JOIN tmp_exercise_merge m ON ee.exercise_id = m.drop_id;

-- 3. Sao chép nội dung tốt hơn trước khi ẩn
UPDATE exercises k
JOIN exercises d ON d.id = 73
SET k.image_key = d.image_key
WHERE k.id = 162 AND (k.image_key IS NULL OR k.image_key = '' OR k.image_key = 'cardio-machine');

UPDATE exercises k
JOIN exercises d ON d.id = 145
SET k.description = COALESCE(NULLIF(d.description, ''), k.description),
    k.description_en = COALESCE(NULLIF(d.description_en, ''), k.description_en)
WHERE k.id = 96;

-- 4. Ẩn bài bị loại
UPDATE exercises SET hidden = 1
WHERE id IN (20,21,30,38,49,73,75,90,101,102,109,130,131,134,135,145);

-- 5. Nhóm cơ: thêm vùng vai giữa
UPDATE exercises SET target_muscles = 'side-deltoids' WHERE id IN (14,95,185,192);
UPDATE exercises SET target_muscles = 'side-deltoids,trapezius' WHERE id IN (92,189);

-- Sửa nhóm cơ / cơ phụ lệch
UPDATE exercises SET muscle_group = 'CORE' WHERE id = 39;
UPDATE exercises SET secondary_muscles = 'Đùi sau, lưng dưới' WHERE id = 28;
UPDATE exercises SET secondary_muscles = NULL, secondary_muscle_keys = NULL WHERE id = 204;

-- 6. Dụng cụ
UPDATE exercises SET equipment = 'Dây nhảy', equipment_keys = 'other' WHERE id = 161;
UPDATE exercises SET equipment_keys = 'dip-bars' WHERE id = 53;
UPDATE exercises SET equipment_keys = 'smith-machine' WHERE id = 122;
UPDATE exercises SET equipment = 'Thanh đòn lục giác', equipment_keys = 'other' WHERE id = 255;

UPDATE exercises SET equipment = 'Không dụng cụ'
WHERE id IN (3,22,31,43,48,49,77,134) AND equipment = 'Không';

-- Ghế: thống nhất nhãn và bổ sung bench cho các bài dùng ghế
UPDATE exercises SET equipment = 'Ghế tập', equipment_keys = 'bodyweight,bench'
WHERE id IN (24,25,26,27,28,37,38,39,41,42,44,46,47);
UPDATE exercises SET equipment = 'Ghế tập' WHERE id IN (82,104);
UPDATE exercises SET equipment = 'Tạ đơn, Ghế tập' WHERE id IN (59,99);
UPDATE exercises SET equipment = 'Thanh đòn, Ghế tập' WHERE id = 107;
UPDATE exercises SET equipment = 'Ghế tập, Thanh EZ', equipment_keys = 'ez-bar,bench' WHERE id = 98;

-- Tạ ấm / thanh EZ
UPDATE exercises SET equipment = 'Tạ ấm' WHERE id = 23;
UPDATE exercises SET equipment = 'Tạ đơn hoặc tạ ấm' WHERE id IN (58,76);
UPDATE exercises SET equipment = 'Thanh EZ' WHERE id = 142;
UPDATE exercises SET equipment = 'Thanh EZ, Ghế tập' WHERE id = 143;
UPDATE exercises SET equipment = 'Tạ đơn' WHERE id = 30;

-- Đồng bộ exercise_equipment cho các bài vừa đổi khoá
DELETE FROM exercise_equipment WHERE exercise_id IN (161,53,122,255);
INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_key) VALUES
    (161, 'other'),
    (53, 'dip-bars'),
    (122, 'smith-machine'),
    (255, 'other');

DELETE FROM exercise_equipment WHERE exercise_id IN (24,25,26,27,28,37,38,39,41,42,44,46,47);
INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_key)
SELECT id, 'bodyweight' FROM exercises WHERE id IN (24,25,26,27,28,37,38,39,41,42,44,46,47)
UNION ALL
SELECT id, 'bench' FROM exercises WHERE id IN (24,25,26,27,28,37,38,39,41,42,44,46,47);

DELETE FROM exercise_equipment WHERE exercise_id = 98;
INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_key) VALUES
    (98, 'ez-bar'),
    (98, 'bench');

-- 7. Tên: bỏ phần tiếng Anh trong ngoặc
UPDATE exercises SET name = TRIM(SUBSTRING_INDEX(name, ' (', 1))
WHERE id IN (3,5,6,8,9,10,11,12,13,15,17,18,22,23,58,62,69,71,88,89,102,117,119,120,121,155,158,159,160,161,162,163,206,270,291);

UPDATE exercises SET name = 'Tư thế plank' WHERE id = 18;

-- Sửa name_en lỗi
UPDATE exercises SET name_en = 'Hug knees to chest' WHERE id = 275;
UPDATE exercises SET name_en = 'Wrist roller' WHERE id = 204;
UPDATE exercises SET name_en = 'Star jump' WHERE id = 283;

DROP TEMPORARY TABLE tmp_exercise_merge;
