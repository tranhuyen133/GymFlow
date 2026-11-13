-- =========================================================================
-- V29__fix_exercise_subcategory.sql
-- Hiệu chỉnh chuẩn hóa sub_category cho các bài tập STRENGTH, CARDIO, WARMUP
-- 1. Đưa các bài squat, lunge, split squat, step-up, leg press, deadlift từ GLUTES về LEGS.
-- 2. Giữ các bài tập trung vào mông (hip thrust, glute bridge, kickback, abduction...) trong GLUTES.
-- 3. Đưa các bài cẳng tay/cuốn tạ từ TRICEPS về BICEPS (bài ARMS kéo/cuốn/cẳng tay).
-- 4. Đảm bảo không có bài STRENGTH nào bị NULL hoặc OTHER_STRENGTH.
-- 5. Ẩn bài tập trùng lặp: ẩn #145 "Bay vai sau máy cáp", giữ #96 "Bay vai sau cáp".
-- 6. Chuẩn hoá các bài CARDIO còn lưu mã CARDIO sang RUNNING, WALKING, CYCLING, ROWING, JUMP_ROPE, STAIR_CLIMBER.
-- =========================================================================

-- 1. Chuyển các bài squat, lunge, split squat, step-up, leg press, deadlift từ GLUTES về LEGS
UPDATE exercises SET
    sub_category = 'LEGS'
WHERE id IN (
    9,   -- Back Squat (Barbell back squat)
    10,  -- Leg Press
    11,  -- Romanian Deadlift
    12,  -- Walking Lunge
    24,  -- Ngồi xuống – đứng lên (Sit-to-stand)
    25,  -- Squat nông có ghế vịn (Mini squat)
    34,  -- Bước lên bậc (Step-up)
    48,  -- Squat tay không (Bodyweight squat)
    49,  -- Chùng chân tại chỗ (Static lunge)
    58,  -- Goblet Squat
    59,  -- Bulgarian Split Squat
    122, -- Squat máy Smith (Smith machine squat)
    123, -- Bước lên bục tạ đơn (Dumbbell step-up)
    124, -- Chùng chân lùi tạ đơn (Dumbbell reverse lunge)
    126  -- Deadlift chân rộng (Sumo deadlift)
) OR (
    exercise_type = 'STRENGTH' AND (
        name LIKE '%Squat%' OR name_en LIKE '%Squat%'
        OR name LIKE '%Lunge%' OR name_en LIKE '%Lunge%'
        OR name LIKE '%Leg Press%' OR name_en LIKE '%Leg Press%'
        OR name LIKE '%Step-up%' OR name_en LIKE '%Step-up%'
        OR name LIKE '%Romanian Deadlift%' OR name_en LIKE '%Romanian deadlift%'
        OR name LIKE '%Sumo deadlift%' OR name_en LIKE '%Sumo deadlift%'
    ) AND sub_category = 'GLUTES'
);

-- 2. Đảm bảo các bài tập trung vào mông (hip thrust, glute bridge, kickback, abduction...) nằm trong GLUTES
UPDATE exercises SET
    sub_category = 'GLUTES'
WHERE id IN (27, 28, 31, 33, 62, 128, 129, 131, 147)
   OR (exercise_type = 'STRENGTH' AND (
       name LIKE '%Dạng đùi%' OR name_en LIKE '%abduct%'
       OR name LIKE '%Hip Thrust%' OR name_en LIKE '%Hip Thrust%'
       OR name LIKE '%Glute Bridge%' OR name_en LIKE '%Glute Bridge%'
       OR name LIKE '%Nâng hông%'
   ));

-- 3. Đưa các bài cẳng tay/cuốn tạ/kẹp tạ nhầm vào TRICEPS về BICEPS (nhóm bài cánh tay trước/kéo)
UPDATE exercises SET
    sub_category = 'BICEPS'
WHERE id IN (107, 108, 109, 144)
   OR (muscle_group = 'ARMS' AND (
       target_muscles LIKE '%forearm%'
       OR name LIKE '%Cuốn cổ tay%' OR name_en LIKE '%wrist curl%'
       OR name LIKE '%Cuốn ngược%' OR name_en LIKE '%reverse%curl%'
       OR name LIKE '%Kẹp bánh tạ%' OR name_en LIKE '%plate pinch%'
   ) AND sub_category = 'TRICEPS');

-- 4. Đảm bảo không bài STRENGTH nào bị NULL, rỗng hoặc OTHER_STRENGTH
UPDATE exercises SET
    sub_category = CASE
        WHEN muscle_group = 'CHEST' THEN 'CHEST'
        WHEN muscle_group = 'BACK' THEN 'BACK'
        WHEN muscle_group = 'SHOULDERS' THEN 'SHOULDERS'
        WHEN muscle_group = 'ARMS' AND (name LIKE '%sau%' OR name_en LIKE '%tricep%' OR target_muscles LIKE '%triceps%') THEN 'TRICEPS'
        WHEN muscle_group = 'ARMS' THEN 'BICEPS'
        WHEN muscle_group = 'CORE' THEN 'CORE'
        WHEN muscle_group = 'LEGS' AND (name LIKE '%mông%' OR name_en LIKE '%glute%' OR target_muscles LIKE '%gluteal%' OR name LIKE '%Dạng đùi%') THEN 'GLUTES'
        WHEN muscle_group = 'LEGS' THEN 'LEGS'
        ELSE 'FULL_BODY'
    END
WHERE exercise_type = 'STRENGTH' AND (sub_category IS NULL OR sub_category = 'OTHER_STRENGTH' OR sub_category = '');

-- 5. Xử lý bài trùng: ẩn #145 "Bay vai sau máy cáp", giữ #96 "Bay vai sau cáp"
UPDATE exercises SET hidden = 1 WHERE id = 145;

-- 6. Chuẩn hoá các bài CARDIO còn lưu mã CARDIO sang sub_category cụ thể
UPDATE exercises SET sub_category = 'RUNNING' WHERE id = 20 OR (exercise_type = 'CARDIO' AND (name LIKE '%chạy%' OR name_en LIKE '%running%') AND sub_category = 'CARDIO');
UPDATE exercises SET sub_category = 'CYCLING' WHERE id IN (21, 138) OR (exercise_type = 'CARDIO' AND (name LIKE '%đạp xe%' OR name_en LIKE '%cycling%' OR name_en LIKE '%bike%') AND sub_category = 'CARDIO');
UPDATE exercises SET sub_category = 'WALKING' WHERE id IN (40, 74) OR (exercise_type = 'CARDIO' AND (name LIKE '%đi bộ%' OR name LIKE '%elip%' OR name_en LIKE '%walking%' OR name_en LIKE '%elliptical%') AND sub_category = 'CARDIO');
UPDATE exercises SET sub_category = 'ROWING' WHERE id = 73 OR (exercise_type = 'CARDIO' AND (name LIKE '%chèo thuyền%' OR name_en LIKE '%rowing%') AND sub_category = 'CARDIO');
UPDATE exercises SET sub_category = 'JUMP_ROPE' WHERE id = 75 OR (exercise_type = 'CARDIO' AND (name LIKE '%nhảy dây%' OR name_en LIKE '%jump rope%') AND sub_category = 'CARDIO');
UPDATE exercises SET sub_category = 'STAIR_CLIMBER' WHERE id = 135 OR (exercise_type = 'CARDIO' AND (name LIKE '%leo bậc%' OR name LIKE '%leo thang%' OR name_en LIKE '%stair%') AND sub_category = 'CARDIO');
