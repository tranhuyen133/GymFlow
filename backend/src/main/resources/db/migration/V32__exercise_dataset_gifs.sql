-- =====================================================================
-- GymFlow · V32 · Kho kiến thức: ảnh động GIF cho bài tập + bổ sung bài phổ biến
--  * image_key dạng gv-<id>: ảnh 180×180 (/exercise-gif/<id>.jpg) và GIF (/exercise-gif/<id>.gif)
--    lấy từ hasaneyldrm/exercises-dataset; media © Gym visual — https://gymvisual.com/ (giữ nguyên 180×180, ghi nguồn).
--  * Bài đã có: chỉ đổi image_key sang GIF (gắn theo cả tên trước và sau V30). Bài mới: tên, mô tả, các bước
--    tiếng Việt do nhóm biên soạn theo hướng dẫn của dataset (ADAPTED); cột _en (V30, V31) lấy từ bản tiếng Anh
--    của dataset (MIT). common_mistakes_en để NULL – giao diện EN tự dùng bản tiếng Việt.
--  * Chỉ thêm dòng / đổi image_key; bỏ qua bài đã tồn tại theo name, name_en hoặc external_id.
-- =====================================================================

INSERT INTO content_sources (code, publisher, title, url, license, license_url, license_verified, attribution, accessed_at)
VALUES ('GYM_VISUAL', 'Gym visual', 'Ảnh động minh hoạ bài tập 180×180 (qua exercises-dataset)', 'https://gymvisual.com/',
        'Media © Gym visual, phân phối lại trong exercises-dataset; giữ kích thước 180×180 và ghi nguồn', 'https://gymvisual.com/content/3-terms-and-conditions-of-use', FALSE,
        '© Gym visual — https://gymvisual.com/', '2026-11-13')
ON DUPLICATE KEY UPDATE code = content_sources.code;

SET @safe = 'Dừng tập ngay nếu thấy đau, chóng mặt, khó thở bất thường hoặc không khoẻ. Người có bệnh lý, chấn thương, mới phẫu thuật, đang mang thai hoặc mới sinh nên hỏi ý kiến nhân viên y tế trước khi tập.';
SET @dose_strength = 'Chưa có liều cá nhân hoá. Khuyến nghị chung cho người lớn 19–64 tuổi: tập tăng sức mạnh cho các nhóm cơ lớn ít nhất 2 ngày/tuần. Số hiệp, số lần, mức tạ do HLV quyết định.';
SET @dose_cardio = 'Tính vào mục tiêu tuần của người lớn 19–64 tuổi: ít nhất 150 phút cường độ vừa hoặc 75 phút cường độ mạnh, chia đều trong tuần.';
SET @dose_warmup = 'Làm 5–10 phút trước buổi tập chính hoặc sau buổi tập để thả lỏng.';
SET @safe_en = 'Stop immediately if you feel pain, dizziness, unusual shortness of breath, or unwell. People with medical conditions, injuries, recent surgery, pregnancy, or recent childbirth should consult a healthcare professional before training.';
SET @dose_strength_en = 'No personalized dose yet. General recommendation for adults 19–64: strength training for the major muscle groups at least 2 days/week. Sets, reps, and load are decided by the trainer.';
SET @dose_cardio_en = 'Counts toward the weekly goal for adults 19–64: at least 150 minutes of moderate or 75 minutes of vigorous activity, spread across the week.';
SET @dose_warmup_en = 'Do 5–10 minutes before your main workout or afterwards to cool down.';

-- ---------------- 1. Bài đã có: đổi sang ảnh động GIF ----------------
UPDATE exercises SET image_key = 'gv-0025' WHERE name = 'Bench Press';
UPDATE exercises SET image_key = 'gv-0314' WHERE name = 'Incline Dumbbell Press';
UPDATE exercises SET image_key = 'gv-0662' WHERE name = 'Hít đất (Push-up)';
UPDATE exercises SET image_key = 'gv-0227' WHERE name = 'Cable Fly';
UPDATE exercises SET image_key = 'gv-0032' WHERE name = 'Deadlift';
UPDATE exercises SET image_key = 'gv-2330' WHERE name = 'Lat Pulldown';
UPDATE exercises SET image_key = 'gv-0861' WHERE name = 'Seated Cable Row';
UPDATE exercises SET image_key = 'gv-0652' WHERE name = 'Hít xà (Pull-up)';
UPDATE exercises SET image_key = 'gv-0043' WHERE name = 'Back Squat';
UPDATE exercises SET image_key = 'gv-0739' WHERE name = 'Leg Press';
UPDATE exercises SET image_key = 'gv-0085' WHERE name = 'Romanian Deadlift';
UPDATE exercises SET image_key = 'gv-1460' WHERE name = 'Walking Lunge';
UPDATE exercises SET image_key = 'gv-0334' WHERE name = 'Lateral Raise';
UPDATE exercises SET image_key = 'gv-0031' WHERE name = 'Barbell Curl';
UPDATE exercises SET image_key = 'gv-0201' WHERE name = 'Triceps Pushdown';
UPDATE exercises SET image_key = 'gv-0472' WHERE name = 'Hanging Leg Raise';
UPDATE exercises SET image_key = 'gv-1160' WHERE name = 'Burpee';
UPDATE exercises SET image_key = 'gv-0549' WHERE name = 'Kettlebell Swing';
UPDATE exercises SET image_key = 'gv-1373' WHERE name = 'Nhón gót';
UPDATE exercises SET image_key = 'gv-1377' WHERE name = 'Giãn bắp chân vào tường';
UPDATE exercises SET image_key = 'gv-1403' WHERE name = 'Giãn cổ nghiêng';
UPDATE exercises SET image_key = 'gv-0289' WHERE name = 'Đẩy ngực tạ đơn';
UPDATE exercises SET image_key = 'gv-0577' WHERE name = 'Đẩy ngực máy';
UPDATE exercises SET image_key = 'gv-0596' WHERE name = 'Ép ngực máy';
UPDATE exercises SET image_key = 'gv-0251' WHERE name = 'Chống xà kép';
UPDATE exercises SET image_key = 'gv-0027' WHERE name = 'Gập người kéo thanh đòn';
UPDATE exercises SET image_key = 'gv-0292' WHERE name = 'Kéo tạ đơn một tay';
UPDATE exercises SET image_key = 'gv-0499' WHERE name = 'Kéo xà thấp';
UPDATE exercises SET image_key = 'gv-0489' WHERE name = 'Ưỡn lưng trên ghế La Mã';
UPDATE exercises SET image_key = 'gv-1760' WHERE name = 'Goblet Squat';
UPDATE exercises SET image_key = 'gv-0410' WHERE name = 'Bulgarian Split Squat';
UPDATE exercises SET image_key = 'gv-0585' WHERE name = 'Đá đùi máy';
UPDATE exercises SET image_key = 'gv-0586' WHERE name = 'Cuốn đùi sau máy';
UPDATE exercises SET image_key = 'gv-0605' WHERE name = 'Nhón gót đứng trên máy';
UPDATE exercises SET image_key = 'gv-0405' WHERE name = 'Đẩy vai tạ đơn ngồi';
UPDATE exercises SET image_key = 'gv-0380' WHERE name = 'Bay vai sau tạ đơn';
UPDATE exercises SET image_key = 'gv-0310' WHERE name = 'Nâng tạ trước mặt';
UPDATE exercises SET image_key = 'gv-0313' WHERE name = 'Cuốn tạ búa';
UPDATE exercises SET image_key = 'gv-0430' WHERE name = 'Duỗi tay sau qua đầu';
UPDATE exercises SET image_key = 'gv-0276' WHERE name = 'Dead Bug';
UPDATE exercises SET image_key = 'gv-3544' WHERE name = 'Plank nghiêng';
UPDATE exercises SET image_key = 'gv-0243' WHERE name = 'Gập bụng xoay với cáp';
UPDATE exercises SET image_key = 'gv-2612' WHERE name = 'Nhảy dây';
UPDATE exercises SET image_key = 'gv-2133' WHERE name = 'Xách tạ đi bộ';
UPDATE exercises SET image_key = 'gv-0630' WHERE name = 'Leo núi tại chỗ';
UPDATE exercises SET image_key = 'gv-2141' WHERE name = 'Máy elip';
UPDATE exercises SET image_key = 'gv-0047' WHERE name = 'Đẩy ngực dốc thanh đòn';
UPDATE exercises SET image_key = 'gv-0033' WHERE name = 'Đẩy ngực dốc xuống';
UPDATE exercises SET image_key = 'gv-0308' WHERE name = 'Ép ngực tạ đơn';
UPDATE exercises SET image_key = 'gv-0179' WHERE name = 'Ép ngực cáp từ dưới lên';
UPDATE exercises SET image_key = 'gv-0493' WHERE name = 'Hít đất chống tay cao';
UPDATE exercises SET image_key = 'gv-1326' WHERE name = 'Hít xà tay ngửa';
UPDATE exercises SET image_key = 'gv-0818' WHERE name = 'Kéo xô tay hẹp';
UPDATE exercises SET image_key = 'gv-0238' WHERE name = 'Kéo cáp tay thẳng';
UPDATE exercises SET image_key = 'gv-0606' WHERE name = 'Kéo T-bar';
UPDATE exercises SET image_key = 'gv-1350' WHERE name = 'Kéo lưng máy';
UPDATE exercises SET image_key = 'gv-0044' WHERE name = 'Good Morning';
UPDATE exercises SET image_key = 'gv-0095' WHERE name = 'Nhún vai thanh đòn';
UPDATE exercises SET image_key = 'gv-0406' WHERE name = 'Nhún vai tạ đơn';
UPDATE exercises SET image_key = 'gv-0120' WHERE name = 'Kéo thanh đòn lên ngực';
UPDATE exercises SET image_key = 'gv-2137' WHERE name = 'Arnold Press';
UPDATE exercises SET image_key = 'gv-0603' WHERE name = 'Đẩy vai máy';
UPDATE exercises SET image_key = 'gv-0178' WHERE name = 'Dang vai cáp một tay';
UPDATE exercises SET image_key = 'gv-0215' WHERE name = 'Bay vai sau cáp';
UPDATE exercises SET image_key = 'gv-0294' WHERE name = 'Cuốn tạ đơn';
UPDATE exercises SET image_key = 'gv-0294' WHERE name = 'Cuốn tay tạ nhẹ';
UPDATE exercises SET image_key = 'gv-0070' WHERE name = 'Cuốn tạ ghế Scott';
UPDATE exercises SET image_key = 'gv-0297' WHERE name = 'Cuốn tạ tập trung';
UPDATE exercises SET image_key = 'gv-0868' WHERE name = 'Cuốn cáp đứng';
UPDATE exercises SET image_key = 'gv-0447' WHERE name = 'Cuốn thanh EZ';
UPDATE exercises SET image_key = 'gv-0447' WHERE name = 'Cuốn tạ đòn thanh EZ';
UPDATE exercises SET image_key = 'gv-0060' WHERE name = 'Skull Crusher';
UPDATE exercises SET image_key = 'gv-0060' WHERE name = 'Nằm duỗi tay sau thanh EZ';
UPDATE exercises SET image_key = 'gv-0030' WHERE name = 'Đẩy ngực tay hẹp';
UPDATE exercises SET image_key = 'gv-0129' WHERE name = 'Chống tay sau ghế';
UPDATE exercises SET image_key = 'gv-0200' WHERE name = 'Ép tay sau dây thừng';
UPDATE exercises SET image_key = 'gv-0126' WHERE name = 'Cuốn cổ tay ngửa';
UPDATE exercises SET image_key = 'gv-0080' WHERE name = 'Cuốn ngược thanh đòn';
UPDATE exercises SET image_key = 'gv-0274' WHERE name = 'Gập bụng';
UPDATE exercises SET image_key = 'gv-0175' WHERE name = 'Gập bụng cáp quỳ';
UPDATE exercises SET image_key = 'gv-0857' WHERE name = 'Lăn bánh xe tập bụng';
UPDATE exercises SET image_key = 'gv-0620' WHERE name = 'Nâng chân nằm';
UPDATE exercises SET image_key = 'gv-0872' WHERE name = 'Gập bụng ngược';
UPDATE exercises SET image_key = 'gv-0003' WHERE name = 'Gập bụng đạp xe';
UPDATE exercises SET image_key = 'gv-1452' WHERE name = 'Gập bụng máy';
UPDATE exercises SET image_key = 'gv-0687' WHERE name = 'Russian Twist';
UPDATE exercises SET image_key = 'gv-0407' WHERE name = 'Nghiêng người tạ đơn';
UPDATE exercises SET image_key = 'gv-0042' WHERE name = 'Front Squat';
UPDATE exercises SET image_key = 'gv-0743' WHERE name = 'Hack Squat';
UPDATE exercises SET image_key = 'gv-0770' WHERE name = 'Squat máy Smith';
UPDATE exercises SET image_key = 'gv-0431' WHERE name = 'Bước lên bục tạ đơn';
UPDATE exercises SET image_key = 'gv-0381' WHERE name = 'Chùng chân lùi tạ đơn';
UPDATE exercises SET image_key = 'gv-0599' WHERE name = 'Cuốn đùi sau ngồi';
UPDATE exercises SET image_key = 'gv-0117' WHERE name = 'Deadlift chân rộng';
UPDATE exercises SET image_key = 'gv-0432' WHERE name = 'Deadlift chân thẳng tạ đơn';
UPDATE exercises SET image_key = 'gv-3013' WHERE name = 'Nâng hông nằm';
UPDATE exercises SET image_key = 'gv-3013' WHERE name = 'Kích hoạt cơ mông với Glute Bridge';
UPDATE exercises SET image_key = 'gv-3645' WHERE name = 'Nâng hông một chân';
UPDATE exercises SET image_key = 'gv-0598' WHERE name = 'Khép đùi máy';
UPDATE exercises SET image_key = 'gv-0598' WHERE name = 'Khép đùi trên máy';
UPDATE exercises SET image_key = 'gv-0597' WHERE name = 'Dạng đùi máy';
UPDATE exercises SET image_key = 'gv-0597' WHERE name = 'Dạng đùi trên máy';
UPDATE exercises SET image_key = 'gv-0594' WHERE name = 'Nhón gót ngồi';
UPDATE exercises SET image_key = 'gv-1391' WHERE name = 'Nhón gót trên máy đạp đùi';
UPDATE exercises SET image_key = 'gv-0095' WHERE name = 'Nhún vai đòn tạ trước đùi';
UPDATE exercises SET image_key = 'gv-0685' WHERE name = 'Chạy bộ máy';
UPDATE exercises SET image_key = 'gv-0685' WHERE name = 'Chạy bộ trên máy chạy (Treadmill Running)';
UPDATE exercises SET image_key = 'gv-3666' WHERE name = 'Đi bộ dốc đốt mỡ (Incline Walking)';
UPDATE exercises SET image_key = 'gv-2138' WHERE name = 'Đạp xe tại chỗ';
UPDATE exercises SET image_key = 'gv-2138' WHERE name = 'Đạp xe thể lực (Stationary Cycling)';
UPDATE exercises SET image_key = 'gv-2612' WHERE name = 'Nhảy dây nhịp điệu (Jump Rope Cardio)';
UPDATE exercises SET image_key = 'gv-2311' WHERE name = 'Leo bậc máy';
UPDATE exercises SET image_key = 'gv-2311' WHERE name = 'Máy tập leo thang (Stair Climber)';
UPDATE exercises SET image_key = 'gv-3224' WHERE name = 'Khởi động toàn thân Jumping Jacks nhẹ';
UPDATE exercises SET image_key = 'gv-1160' WHERE name = 'HIIT Burpees & Mountain Climbers';
UPDATE exercises SET image_key = 'gv-0257' WHERE name = 'Khởi động khớp đầu gối';
UPDATE exercises SET image_key = 'gv-1428' WHERE name = 'Xoay khớp cổ tay và cổ chân';
UPDATE exercises SET image_key = 'gv-0025' WHERE name = 'Đẩy ngực ngang thanh đòn';
UPDATE exercises SET image_key = 'gv-0314' WHERE name = 'Đẩy ngực dốc lên tạ đơn';
UPDATE exercises SET image_key = 'gv-0227' WHERE name = 'Ép ngực với dây cáp';
UPDATE exercises SET image_key = 'gv-0032' WHERE name = 'Kéo tạ đòn chuẩn (Deadlift)';
UPDATE exercises SET image_key = 'gv-2330' WHERE name = 'Kéo xô máy (Lat Pulldown)';
UPDATE exercises SET image_key = 'gv-0861' WHERE name = 'Kéo cáp ngồi chèo thuyền';
UPDATE exercises SET image_key = 'gv-0043' WHERE name = 'Gánh đòn tạ sau (Back Squat)';
UPDATE exercises SET image_key = 'gv-0739' WHERE name = 'Đạp đùi trên máy (Leg Press)';
UPDATE exercises SET image_key = 'gv-0085' WHERE name = 'Deadlift kiểu Romania (RDL)';
UPDATE exercises SET image_key = 'gv-1460' WHERE name = 'Chùng chân bước tới (Walking Lunge)';
UPDATE exercises SET image_key = 'gv-0334' WHERE name = 'Dang tạ đơn sang hai bên';
UPDATE exercises SET image_key = 'gv-0031' WHERE name = 'Cuốn tay trước thanh đòn';
UPDATE exercises SET image_key = 'gv-0201' WHERE name = 'Ép cáp tay sau (Triceps Pushdown)';
UPDATE exercises SET image_key = 'gv-0472' WHERE name = 'Treo người nâng chân tập bụng';
UPDATE exercises SET image_key = 'gv-1160' WHERE name = 'Bật nhảy kết hợp hít đất (Burpee)';
UPDATE exercises SET image_key = 'gv-0549' WHERE name = 'Vung tạ ấm (Kettlebell Swing)';
UPDATE exercises SET image_key = 'gv-1760' WHERE name = 'Squat ôm tạ trước ngực (Goblet Squat)';
UPDATE exercises SET image_key = 'gv-0410' WHERE name = 'Squat một chân kiểu Bulgaria';
UPDATE exercises SET image_key = 'gv-0276' WHERE name = 'Tư thế bọ nằm ngửa (Dead Bug)';
UPDATE exercises SET image_key = 'gv-0044' WHERE name = 'Cúi người gánh tạ (Good Morning)';
UPDATE exercises SET image_key = 'gv-2137' WHERE name = 'Đẩy vai xoay tạ Arnold';
UPDATE exercises SET image_key = 'gv-0060' WHERE name = 'Nằm duỗi tay sau trán (Skull Crusher)';
UPDATE exercises SET image_key = 'gv-0687' WHERE name = 'Ngồi xoay hông kiểu Nga (Russian Twist)';
UPDATE exercises SET image_key = 'gv-0042' WHERE name = 'Gánh đòn tạ trước (Front Squat)';
UPDATE exercises SET image_key = 'gv-0743' WHERE name = 'Squat trượt máy (Hack Squat)';
UPDATE exercises SET image_key = 'gv-1160' WHERE name = 'Tổ hợp HIIT Burpee & Leo núi';

-- ---------------- 2. Bài mới ----------------
INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0319', 'Ép ngực dốc tạ đơn', 'Dumbbell incline fly', 'Incline dumbbell fly, bay ngực trên', 'STRENGTH', 'CHEST', 'CHEST', 'Vai trước', 'chest', 'front-deltoids',
    'Tạ đơn, Ghế tập', 'dumbbell,bench', 'BEGINNER', 'GYM', 'HYPERTROPHY,STRENGTH', 'HYPERTROPHY', 'Bài cô lập ngực trên trên ghế dốc 30–45 độ, hai tay mở khép theo vòng cung.', 'Targets the pectorals; also works the shoulders. Equipment: dumbbell.',
    '1. Chỉnh ghế dốc 30–45 độ, nằm ngửa, hai tạ đưa thẳng trên ngực, lòng bàn tay hướng vào nhau.\n2. Hơi gập khuỷu và giữ nguyên góc này suốt bài.\n3. Mở hai tay sang ngang theo vòng cung tới khi ngực căng vừa phải.\n4. Khép tay về trên ngực, siết ngực trên rồi lặp lại.',
    '1. Chỉnh ghế dốc 30–45 độ, nằm ngửa, hai tạ đưa thẳng trên ngực, lòng bàn tay hướng vào nhau.\n2. Hơi gập khuỷu và giữ nguyên góc này suốt bài.\n3. Mở hai tay sang ngang theo vòng cung tới khi ngực căng vừa phải.\n4. Khép tay về trên ngực, siết ngực trên rồi lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Duỗi thẳng khuỷu; hạ tay quá sâu dưới vai; dùng tạ quá nặng.', @safe, @dose_strength, '3 x 10–12', 'gv-0319', 'ADAPTED', 'APPROVED',
    '1. Set an incline bench to a 45-degree angle.\n2. Sit on the bench with a dumbbell in each hand, palms facing each other.\n3. Lie back on the bench and press the dumbbells up to the starting position, directly above your chest.\n4. Lower the dumbbells out to the sides in a wide arc until you feel a stretch in your chest.\n5. Pause for a moment, then squeeze your chest muscles to bring the dumbbells back up to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Set an incline bench to a 45-degree angle.\n2. Sit on the bench with a dumbbell in each hand, palms facing each other.\n3. Lie back on the bench and press the dumbbells up to the starting position, directly above your chest.\n4. Lower the dumbbells out to the sides in a wide arc until you feel a stretch in your chest.\n5. Pause for a moment, then squeeze your chest muscles to bring the dumbbells back up to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Ép ngực dốc tạ đơn' OR name_en = 'Dumbbell incline fly' OR external_id = '0319');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0748', 'Đẩy ngực máy Smith', 'Smith bench press', 'Smith machine bench press', 'STRENGTH', 'CHEST', 'CHEST', 'Vai trước, Tay sau', 'chest', 'front-deltoids,triceps',
    'Máy Smith, Ghế tập', 'smith-machine,bench', 'BEGINNER', 'GYM', 'STRENGTH,HYPERTROPHY', 'STRENGTH', 'Đẩy ngực với thanh đòn chạy trên ray cố định, dễ giữ quỹ đạo và an toàn khi tập một mình.', 'Targets the pectorals; also works the triceps, shoulders. Equipment: smith machine.',
    '1. Đặt ghế phẳng giữa máy Smith sao cho thanh nằm ngay trên ngực giữa.\n2. Nắm thanh rộng hơn vai, xoay cổ tay mở móc khoá.\n3. Hạ thanh chậm xuống chạm nhẹ ngực, khuỷu chếch khoảng 45 độ.\n4. Đẩy thanh lên tới khi tay gần duỗi, xoay cổ tay khoá móc khi xong hiệp.',
    '1. Đặt ghế phẳng giữa máy Smith sao cho thanh nằm ngay trên ngực giữa.\n2. Nắm thanh rộng hơn vai, xoay cổ tay mở móc khoá.\n3. Hạ thanh chậm xuống chạm nhẹ ngực, khuỷu chếch khoảng 45 độ.\n4. Đẩy thanh lên tới khi tay gần duỗi, xoay cổ tay khoá móc khi xong hiệp.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Đặt ghế lệch làm thanh rơi vào cổ; nảy thanh khỏi ngực; quên cài chốt an toàn.', @safe, @dose_strength, '4 x 8–10', 'gv-0748', 'ADAPTED', 'APPROVED',
    '1. Adjust the height of the smith machine bar to chest level.\n2. Lie flat on the bench with your feet firmly planted on the ground.\n3. Grip the bar with an overhand grip slightly wider than shoulder-width apart.\n4. Unrack the bar and lower it towards your chest, keeping your elbows tucked in.\n5. Pause for a moment when the bar touches your chest.\n6. Push the bar back up to the starting position, fully extending your arms.\n7. Repeat for the desired number of repetitions.',
    '1. Adjust the height of the smith machine bar to chest level.\n2. Lie flat on the bench with your feet firmly planted on the ground.\n3. Grip the bar with an overhand grip slightly wider than shoulder-width apart.\n4. Unrack the bar and lower it towards your chest, keeping your elbows tucked in.\n5. Pause for a moment when the bar touches your chest.\n6. Push the bar back up to the starting position, fully extending your arms.\n7. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 8–10'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Đẩy ngực máy Smith' OR name_en = 'Smith bench press' OR external_id = '0748');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0279', 'Hít đất chân cao', 'Decline push-up', 'Decline push-up', 'STRENGTH', 'CHEST', 'CHEST', 'Vai trước, Tay sau, Bụng', 'chest', 'front-deltoids,triceps,abs',
    'Không dụng cụ, Ghế tập', 'bodyweight,bench', 'INTERMEDIATE', 'ANY', 'STRENGTH,ENDURANCE', 'STRENGTH', 'Hít đất với chân đặt lên ghế, nhấn vào ngực trên và vai trước, khó hơn hít đất thường.', 'Targets the pectorals; also works the triceps, shoulders. Equipment: body weight.',
    '1. Đặt mũi chân lên ghế, hai tay chống sàn rộng hơn vai một chút.\n2. Siết bụng, mông để thân thẳng từ đầu tới gót.\n3. Hạ ngực xuống gần sàn, khuỷu chếch về sau.\n4. Đẩy người lên tới khi tay gần duỗi rồi lặp lại.',
    '1. Đặt mũi chân lên ghế, hai tay chống sàn rộng hơn vai một chút.\n2. Siết bụng, mông để thân thẳng từ đầu tới gót.\n3. Hạ ngực xuống gần sàn, khuỷu chếch về sau.\n4. Đẩy người lên tới khi tay gần duỗi rồi lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Võng lưng; đầu cúi gập; hạ nửa biên độ.', @safe, @dose_strength, '3 x 8–15', 'gv-0279', 'ADAPTED', 'APPROVED',
    '1. Place your hands on the ground slightly wider than shoulder-width apart, with your feet elevated on a stable surface.\n2. Keep your body in a straight line from head to toe, engaging your core muscles.\n3. Lower your chest towards the ground by bending your elbows, keeping them close to your body.\n4. Push through your palms to extend your arms and return to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Place your hands on the ground slightly wider than shoulder-width apart, with your feet elevated on a stable surface.\n2. Keep your body in a straight line from head to toe, engaging your core muscles.\n3. Lower your chest towards the ground by bending your elbows, keeping them close to your body.\n4. Push through your palms to extend your arms and return to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hít đất chân cao' OR name_en = 'Decline push-up' OR external_id = '0279');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1311', 'Hít đất tay rộng', 'Wide hand push up', 'Wide-hand push-up', 'STRENGTH', 'CHEST', 'CHEST', 'Vai trước, Tay sau', 'chest', 'front-deltoids,triceps',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'STRENGTH,ENDURANCE', 'STRENGTH', 'Hít đất với hai tay đặt rộng hơn vai nhiều, tăng phần việc cho cơ ngực.', 'Targets the pectorals; also works the triceps, shoulders. Equipment: body weight.',
    '1. Chống hai tay rộng gấp rưỡi vai, mũi chân chạm sàn, thân thẳng.\n2. Siết bụng và mông.\n3. Hạ ngực xuống gần sàn, khuỷu mở sang hai bên vừa phải.\n4. Đẩy người lên lại, giữ thân thẳng.',
    '1. Chống hai tay rộng gấp rưỡi vai, mũi chân chạm sàn, thân thẳng.\n2. Siết bụng và mông.\n3. Hạ ngực xuống gần sàn, khuỷu mở sang hai bên vừa phải.\n4. Đẩy người lên lại, giữ thân thẳng.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Tay đặt quá rộng gây đau vai; võng hông; nhún vai.', @safe, @dose_strength, '3 x 10–15', 'gv-1311', 'ADAPTED', 'APPROVED',
    '1. Start in a high plank position with your hands wider than shoulder-width apart.\n2. Keep your body in a straight line from head to toe.\n3. Lower your chest towards the ground by bending your elbows, keeping them close to your sides.\n4. Push through your palms to extend your arms and return to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Start in a high plank position with your hands wider than shoulder-width apart.\n2. Keep your body in a straight line from head to toe.\n3. Lower your chest towards the ground by bending your elbows, keeping them close to your sides.\n4. Push through your palms to extend your arms and return to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hít đất tay rộng' OR name_en = 'Wide hand push up' OR external_id = '1311');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1273', 'Hít đất vỗ tay', 'Clap push up', 'Clap push-up, plyometric push-up', 'STRENGTH', 'CHEST', 'CHEST', 'Vai trước, Tay sau, Bụng', 'chest', 'front-deltoids,triceps,abs',
    'Không dụng cụ', 'bodyweight', 'ADVANCED', 'ANY', 'STRENGTH', 'STRENGTH', 'Bài hít đất bùng nổ: đẩy mạnh để người bật lên và vỗ tay trước khi tiếp đất.', 'Targets the pectorals; also works the triceps, shoulders. Equipment: body weight.',
    '1. Vào tư thế hít đất, tay rộng hơn vai một chút.\n2. Hạ ngực xuống gần sàn.\n3. Đẩy thật mạnh để hai tay rời sàn, vỗ tay nhanh trước ngực.\n4. Tiếp đất mềm với khuỷu hơi gập rồi chuyển ngay sang lần tiếp theo.',
    '1. Vào tư thế hít đất, tay rộng hơn vai một chút.\n2. Hạ ngực xuống gần sàn.\n3. Đẩy thật mạnh để hai tay rời sàn, vỗ tay nhanh trước ngực.\n4. Tiếp đất mềm với khuỷu hơi gập rồi chuyển ngay sang lần tiếp theo.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Tiếp đất với tay duỗi cứng; võng hông; làm khi chưa vững hít đất thường.', @safe, @dose_strength, '3 x 5–8', 'gv-1273', 'ADAPTED', 'APPROVED',
    '1. Start in a high plank position with your hands slightly wider than shoulder-width apart.\n2. Lower your body towards the ground by bending your elbows, keeping your core engaged.\n3. Push through your palms explosively to propel your body off the ground.\n4. While in mid-air, clap your hands together before landing back in the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Start in a high plank position with your hands slightly wider than shoulder-width apart.\n2. Lower your body towards the ground by bending your elbows, keeping your core engaged.\n3. Push through your palms explosively to propel your body off the ground.\n4. While in mid-air, clap your hands together before landing back in the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 5–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hít đất vỗ tay' OR name_en = 'Clap push up' OR external_id = '1273');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0375', 'Pullover tạ đơn', 'Dumbbell pullover', 'Dumbbell pullover', 'STRENGTH', 'CHEST', 'CHEST', 'Tay sau, Vai trước', 'chest,upper-back', 'triceps,front-deltoids',
    'Tạ đơn, Ghế tập', 'dumbbell,bench', 'INTERMEDIATE', 'GYM', 'HYPERTROPHY,MOBILITY', 'HYPERTROPHY', 'Nằm trên ghế đưa tạ từ trên ngực ra sau đầu theo vòng cung, kéo giãn ngực và xô.', 'Targets the pectorals; also works the latissimus dorsi, triceps. Equipment: dumbbell.',
    '1. Nằm ngửa trên ghế, hai tay ôm một tạ đơn thẳng trên ngực.\n2. Hơi gập khuỷu, hạ tạ ra sau đầu theo vòng cung tới khi ngực và xô căng.\n3. Kéo tạ trở lại trên ngực bằng ngực và xô.\n4. Giữ hông và lưng ổn định trong suốt bài.',
    '1. Nằm ngửa trên ghế, hai tay ôm một tạ đơn thẳng trên ngực.\n2. Hơi gập khuỷu, hạ tạ ra sau đầu theo vòng cung tới khi ngực và xô căng.\n3. Kéo tạ trở lại trên ngực bằng ngực và xô.\n4. Giữ hông và lưng ổn định trong suốt bài.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Hạ tạ quá sâu làm đau vai; gập duỗi khuỷu liên tục; ưỡn lưng quá mức.', @safe, @dose_strength, '3 x 10–12', 'gv-0375', 'ADAPTED', 'APPROVED',
    '1. Lie flat on a bench with your head at one end and your feet on the floor.\n2. Hold a dumbbell with both hands and extend your arms straight above your chest.\n3. Keeping a slight bend in your elbows, slowly lower the dumbbell behind your head until you feel a stretch in your chest and shoulders.\n4. Pause for a moment, then raise the dumbbell back to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Lie flat on a bench with your head at one end and your feet on the floor.\n2. Hold a dumbbell with both hands and extend your arms straight above your chest.\n3. Keeping a slight bend in your elbows, slowly lower the dumbbell behind your head until you feel a stretch in your chest and shoulders.\n4. Pause for a moment, then raise the dumbbell back to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pullover tạ đơn' OR name_en = 'Dumbbell pullover' OR external_id = '0375');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1299', 'Đẩy ngực dốc trên máy', 'Lever incline chest press', 'Machine incline chest press', 'STRENGTH', 'CHEST', 'CHEST', 'Vai trước, Tay sau', 'chest', 'front-deltoids,triceps',
    'Máy tập', 'machine', 'BEGINNER', 'GYM', 'STRENGTH,HYPERTROPHY', 'STRENGTH', 'Đẩy ngực trên máy có lưng ghế dốc, nhấn vào ngực trên với quỹ đạo cố định.', 'Targets the pectorals; also works the shoulders, triceps. Equipment: leverage machine.',
    '1. Chỉnh ghế để tay cầm ngang ngực trên.\n2. Ngồi tựa lưng, siết bả vai về sau.\n3. Đẩy tay cầm ra trước tới khi tay gần duỗi.\n4. Trả về chậm, không để khối tạ chạm nhau.',
    '1. Chỉnh ghế để tay cầm ngang ngực trên.\n2. Ngồi tựa lưng, siết bả vai về sau.\n3. Đẩy tay cầm ra trước tới khi tay gần duỗi.\n4. Trả về chậm, không để khối tạ chạm nhau.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhún vai; nhấc lưng khỏi ghế; trả tạ quá nhanh.', @safe, @dose_strength, '3 x 10–12', 'gv-1299', 'ADAPTED', 'APPROVED',
    '1. Adjust the seat and backrest of the leverage machine to a comfortable position.\n2. Sit on the machine with your back against the backrest and your feet flat on the floor.\n3. Grasp the handles with an overhand grip and position your hands slightly wider than shoulder-width apart.\n4. Push the handles forward and away from your body until your arms are fully extended.\n5. Pause for a moment, then slowly bend your elbows and lower the handles back towards your chest.\n6. Repeat for the desired number of repetitions.',
    '1. Adjust the seat and backrest of the leverage machine to a comfortable position.\n2. Sit on the machine with your back against the backrest and your feet flat on the floor.\n3. Grasp the handles with an overhand grip and position your hands slightly wider than shoulder-width apart.\n4. Push the handles forward and away from your body until your arms are fully extended.\n5. Pause for a moment, then slowly bend your elbows and lower the handles back towards your chest.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Đẩy ngực dốc trên máy' OR name_en = 'Lever incline chest press' OR external_id = '1299');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3017', 'Pendlay row', 'Barbell pendlay row', 'Pendlay row, kéo đòn từ sàn', 'STRENGTH', 'BACK', 'BACK', 'Vai sau, Tay trước, Lưng dưới', 'upper-back', 'back-deltoids,biceps,lower-back',
    'Thanh đòn', 'barbell', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Biến thể kéo thanh đòn gập người, lưng gần song song sàn, mỗi lần đặt thanh xuống sàn.', 'Targets the upper back; also works the biceps, forearms. Equipment: barbell.',
    '1. Đứng rộng bằng hông, gập hông tới khi lưng gần song song sàn, lưng thẳng.\n2. Nắm thanh rộng hơn vai một chút.\n3. Kéo bùng nổ thanh lên chạm bụng trên, siết bả vai.\n4. Đặt thanh trở lại sàn rồi chỉnh tư thế trước lần sau.',
    '1. Đứng rộng bằng hông, gập hông tới khi lưng gần song song sàn, lưng thẳng.\n2. Nắm thanh rộng hơn vai một chút.\n3. Kéo bùng nổ thanh lên chạm bụng trên, siết bả vai.\n4. Đặt thanh trở lại sàn rồi chỉnh tư thế trước lần sau.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Cong lưng; dùng đà nhấc người lên; kéo thanh về ngực thay vì bụng.', @safe, @dose_strength, '4 x 5–8', 'gv-3017', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and your knees slightly bent.\n2. Bend forward at the hips, keeping your back straight and your chest up.\n3. Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.\n4. Pull the barbell towards your upper abdomen, squeezing your shoulder blades together.\n5. Lower the barbell back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and your knees slightly bent.\n2. Bend forward at the hips, keeping your back straight and your chest up.\n3. Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.\n4. Pull the barbell towards your upper abdomen, squeezing your shoulder blades together.\n5. Lower the barbell back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 5–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pendlay row' OR name_en = 'Barbell pendlay row' OR external_id = '3017');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1429', 'Hít xà tay rộng', 'Wide grip pull-up', 'Wide-grip pull-up', 'STRENGTH', 'BACK', 'BACK', 'Tay trước, Vai sau', 'upper-back', 'biceps,back-deltoids',
    'Xà đơn', 'pullup-bar', 'ADVANCED', 'ANY', 'STRENGTH', 'STRENGTH', 'Hít xà với tay nắm rộng hơn vai nhiều, nhấn mạnh vào cơ xô.', 'Targets the lats; also works the biceps, forearms. Equipment: body weight.',
    '1. Nắm xà rộng gấp rưỡi vai, lòng bàn tay hướng ra trước, treo người.\n2. Kéo bả vai xuống và siết bụng.\n3. Kéo người lên tới khi cằm qua xà, ngực hướng về xà.\n4. Hạ chậm về tư thế treo duỗi tay.',
    '1. Nắm xà rộng gấp rưỡi vai, lòng bàn tay hướng ra trước, treo người.\n2. Kéo bả vai xuống và siết bụng.\n3. Kéo người lên tới khi cằm qua xà, ngực hướng về xà.\n4. Hạ chậm về tư thế treo duỗi tay.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Đu người lấy đà; kéo nửa biên độ; rụt cổ.', @safe, @dose_strength, '4 x 5–8', 'gv-1429', 'ADAPTED', 'APPROVED',
    '1. Hang from a pull-up bar with your palms facing away from you and your hands wider than shoulder-width apart.\n2. Engage your core and squeeze your shoulder blades together.\n3. Pull your body up towards the bar until your chin is above the bar.\n4. Lower your body back down to the starting position with control.\n5. Repeat for the desired number of repetitions.',
    '1. Hang from a pull-up bar with your palms facing away from you and your hands wider than shoulder-width apart.\n2. Engage your core and squeeze your shoulder blades together.\n3. Pull your body up towards the bar until your chin is above the bar.\n4. Lower your body back down to the starting position with control.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 5–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hít xà tay rộng' OR name_en = 'Wide grip pull-up' OR external_id = '1429');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0293', 'Gập người kéo tạ đơn hai tay', 'Dumbbell bent over row', 'Dumbbell bent-over row', 'STRENGTH', 'BACK', 'BACK', 'Tay trước, Vai sau, Lưng dưới', 'upper-back', 'biceps,back-deltoids,lower-back',
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'STRENGTH,HYPERTROPHY', 'STRENGTH', 'Gập người kéo hai tạ đơn cùng lúc về hông, tập dày lưng giữa.', 'Targets the upper back; also works the biceps, forearms. Equipment: dumbbell.',
    '1. Cầm hai tạ, gập hông tới khi thân nghiêng khoảng 45 độ, lưng thẳng, gối hơi chùng.\n2. Để tạ buông thẳng dưới vai.\n3. Kéo tạ về hai bên hông, siết bả vai.\n4. Hạ chậm về vị trí đầu.',
    '1. Cầm hai tạ, gập hông tới khi thân nghiêng khoảng 45 độ, lưng thẳng, gối hơi chùng.\n2. Để tạ buông thẳng dưới vai.\n3. Kéo tạ về hai bên hông, siết bả vai.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Cong lưng; giật người lên; kéo bằng tay thay vì khuỷu.', @safe, @dose_strength, '3 x 8–12', 'gv-0293', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, knees slightly bent, and hold a dumbbell in each hand with your palms facing your body.\n2. Bend forward at the hips, keeping your back straight and your core engaged.\n3. Let your arms hang straight down towards the floor, with your elbows slightly bent.\n4. Pull the dumbbells up towards your chest, squeezing your shoulder blades together.\n5. Pause for a moment at the top, then slowly lower the dumbbells back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, knees slightly bent, and hold a dumbbell in each hand with your palms facing your body.\n2. Bend forward at the hips, keeping your back straight and your core engaged.\n3. Let your arms hang straight down towards the floor, with your elbows slightly bent.\n4. Pull the dumbbells up towards your chest, squeezing your shoulder blades together.\n5. Pause for a moment at the top, then slowly lower the dumbbells back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Gập người kéo tạ đơn hai tay' OR name_en = 'Dumbbell bent over row' OR external_id = '0293');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0327', 'Kéo tạ đơn nằm sấp ghế dốc', 'Dumbbell incline row', 'Chest-supported dumbbell row', 'STRENGTH', 'BACK', 'BACK', 'Vai sau, Tay trước', 'upper-back', 'back-deltoids,biceps',
    'Tạ đơn, Ghế tập', 'dumbbell,bench', 'BEGINNER', 'GYM', 'STRENGTH,HYPERTROPHY', 'STRENGTH', 'Nằm sấp trên ghế dốc để kéo tạ, giảm tải cho lưng dưới.', 'Targets the upper back; also works the biceps, shoulders. Equipment: dumbbell.',
    '1. Chỉnh ghế dốc khoảng 30–45 độ, nằm sấp, ngực tựa đệm.\n2. Hai tay cầm tạ buông thẳng xuống.\n3. Kéo tạ lên sát hai bên sườn, siết bả vai.\n4. Hạ chậm về vị trí đầu.',
    '1. Chỉnh ghế dốc khoảng 30–45 độ, nằm sấp, ngực tựa đệm.\n2. Hai tay cầm tạ buông thẳng xuống.\n3. Kéo tạ lên sát hai bên sườn, siết bả vai.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhấc ngực khỏi ghế; nhún vai; kéo quá nhanh.', @safe, @dose_strength, '3 x 10–12', 'gv-0327', 'ADAPTED', 'APPROVED',
    '1. Set up an incline bench at a 45-degree angle.\n2. Grab a dumbbell in each hand and sit on the bench with your chest against the incline.\n3. Extend your arms fully, allowing the dumbbells to hang straight down from your shoulders.\n4. Pull the dumbbells up towards your chest, squeezing your shoulder blades together.\n5. Pause for a moment at the top, then slowly lower the dumbbells back to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Set up an incline bench at a 45-degree angle.\n2. Grab a dumbbell in each hand and sit on the bench with your chest against the incline.\n3. Extend your arms fully, allowing the dumbbells to hang straight down from your shoulders.\n4. Pull the dumbbells up towards your chest, squeezing your shoulder blades together.\n5. Pause for a moment at the top, then slowly lower the dumbbells back to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Kéo tạ đơn nằm sấp ghế dốc' OR name_en = 'Dumbbell incline row' OR external_id = '0327');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0017', 'Hít xà có máy hỗ trợ', 'Assisted pull-up', 'Assisted pull-up', 'STRENGTH', 'BACK', 'BACK', 'Tay trước, Cẳng tay', 'upper-back', 'biceps,forearm',
    'Máy tập', 'machine', 'BEGINNER', 'GYM', 'STRENGTH', 'STRENGTH', 'Hít xà trên máy có bệ đỡ đầu gối giảm bớt trọng lượng cơ thể, hợp người mới.', 'Targets the lats; also works the biceps, forearms. Equipment: leverage machine.',
    '1. Chọn mức đỡ, quỳ hoặc đứng lên bệ, nắm tay cầm rộng hơn vai.\n2. Kéo bả vai xuống, siết bụng.\n3. Kéo người lên tới khi cằm qua tay cầm.\n4. Hạ chậm tới khi tay duỗi.',
    '1. Chọn mức đỡ, quỳ hoặc đứng lên bệ, nắm tay cầm rộng hơn vai.\n2. Kéo bả vai xuống, siết bụng.\n3. Kéo người lên tới khi cằm qua tay cầm.\n4. Hạ chậm tới khi tay duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Chọn mức đỡ quá nhiều nên không tiến bộ; đu người; hạ nhanh.', @safe, @dose_strength, '3 x 8–12', 'gv-0017', 'ADAPTED', 'APPROVED',
    '1. Adjust the machine to your desired weight and height settings.\n2. Grasp the handles with an overhand grip, slightly wider than shoulder-width apart.\n3. Hang with your arms fully extended and your feet off the ground.\n4. Engage your back muscles and pull your body up towards the handles, keeping your elbows close to your body.\n5. Continue pulling until your chin is above the handles.\n6. Pause for a moment at the top, then slowly lower your body back down to the starting position.\n7. Repeat for the desired number of repetitions.',
    '1. Adjust the machine to your desired weight and height settings.\n2. Grasp the handles with an overhand grip, slightly wider than shoulder-width apart.\n3. Hang with your arms fully extended and your feet off the ground.\n4. Engage your back muscles and pull your body up towards the handles, keeping your elbows close to your body.\n5. Continue pulling until your chin is above the handles.\n6. Pause for a moment at the top, then slowly lower your body back down to the starting position.\n7. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hít xà có máy hỗ trợ' OR name_en = 'Assisted pull-up' OR external_id = '0017');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0673', 'Kéo xô tay ngửa trên máy', 'Reverse grip machine lat pulldown', 'Reverse-grip lat pulldown', 'STRENGTH', 'BACK', 'BACK', 'Tay trước', 'upper-back', 'biceps',
    'Máy tập', 'machine', 'BEGINNER', 'GYM', 'STRENGTH,HYPERTROPHY', 'STRENGTH', 'Kéo xô với lòng bàn tay hướng về mặt, tay trước hỗ trợ nhiều hơn.', 'Targets the lats; also works the biceps, forearms. Equipment: leverage machine.',
    '1. Ngồi vào máy, chỉnh đệm giữ đùi.\n2. Nắm tay cầm ngửa, rộng bằng vai.\n3. Kéo xuống trước ngực trên, khuỷu đi sát thân.\n4. Trả lên chậm tới khi tay gần duỗi.',
    '1. Ngồi vào máy, chỉnh đệm giữ đùi.\n2. Nắm tay cầm ngửa, rộng bằng vai.\n3. Kéo xuống trước ngực trên, khuỷu đi sát thân.\n4. Trả lên chậm tới khi tay gần duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Ngả người quá nhiều; nhún vai; giật tạ.', @safe, @dose_strength, '3 x 10–12', 'gv-0673', 'ADAPTED', 'APPROVED',
    '1. Adjust the seat height and position yourself on the machine with your knees under the pads and your feet flat on the ground.\n2. Grasp the handles with an underhand grip, slightly wider than shoulder-width apart.\n3. Sit upright with your chest out and shoulders back, maintaining a slight arch in your lower back.\n4. Pull the handles down towards your chest, squeezing your shoulder blades together.\n5. Pause for a moment at the bottom of the movement, then slowly release the handles back to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Adjust the seat height and position yourself on the machine with your knees under the pads and your feet flat on the ground.\n2. Grasp the handles with an underhand grip, slightly wider than shoulder-width apart.\n3. Sit upright with your chest out and shoulders back, maintaining a slight arch in your lower back.\n4. Pull the handles down towards your chest, squeezing your shoulder blades together.\n5. Pause for a moment at the bottom of the movement, then slowly release the handles back to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Kéo xô tay ngửa trên máy' OR name_en = 'Reverse grip machine lat pulldown' OR external_id = '0673');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0521', 'Renegade row tạ ấm', 'Kettlebell alternating renegade row', 'Kettlebell renegade row', 'STRENGTH', 'BACK', 'BACK', 'Bụng, Liên sườn, Tay sau', 'upper-back', 'abs,obliques,triceps',
    'Tạ ấm', 'kettlebell', 'INTERMEDIATE', 'ANY', 'STRENGTH,BALANCE', 'STRENGTH', 'Giữ tư thế plank trên hai tạ ấm và kéo luân phiên từng tay, tập lưng và cơ lõi.', 'Targets the upper back; also works the core, shoulders. Equipment: kettlebell.',
    '1. Vào tư thế plank cao, hai tay nắm quai hai tạ ấm, chân mở rộng hơn hông.\n2. Siết bụng, mông giữ hông vuông với sàn.\n3. Kéo một tạ lên sát sườn rồi đặt xuống.\n4. Đổi tay và lặp lại luân phiên.',
    '1. Vào tư thế plank cao, hai tay nắm quai hai tạ ấm, chân mở rộng hơn hông.\n2. Siết bụng, mông giữ hông vuông với sàn.\n3. Kéo một tạ lên sát sườn rồi đặt xuống.\n4. Đổi tay và lặp lại luân phiên.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Xoay hông theo tay kéo; võng lưng; tạ lăn do đặt không vững.', @safe, @dose_strength, '3 x 6–10 mỗi bên', 'gv-0521', 'ADAPTED', 'APPROVED',
    '1. Start in a high plank position with your hands gripping the kettlebells and your feet hip-width apart.\n2. Engage your core and keep your body in a straight line from head to heels.\n3. Pull one kettlebell up towards your chest, keeping your elbow close to your body.\n4. Lower the kettlebell back down to the starting position and repeat with the other arm.\n5. Continue alternating arms for the desired number of repetitions.',
    '1. Start in a high plank position with your hands gripping the kettlebells and your feet hip-width apart.\n2. Engage your core and keep your body in a straight line from head to heels.\n3. Pull one kettlebell up towards your chest, keeping your elbow close to your body.\n4. Lower the kettlebell back down to the starting position and repeat with the other arm.\n5. Continue alternating arms for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 6–10 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Renegade row tạ ấm' OR name_en = 'Kettlebell alternating renegade row' OR external_id = '0521');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0631', 'Muscle-up', 'Muscle up', 'Muscle up, lên xà', 'STRENGTH', 'BACK', 'BACK', 'Ngực, Tay trước, Bụng', 'upper-back,triceps', 'chest,biceps,abs',
    'Xà đơn', 'pullup-bar', 'ADVANCED', 'ANY', 'STRENGTH', 'STRENGTH', 'Động tác nâng cao kết hợp kéo xà bùng nổ và chống đẩy lên trên xà.', 'Targets the lats; also works the biceps, triceps, shoulders, chest. Equipment: body weight.',
    '1. Treo người, nắm xà rộng bằng vai, có thể dùng cách nắm chắc cổ tay.\n2. Kéo bùng nổ đưa ngực về phía xà.\n3. Xoay cổ tay và đẩy người qua xà khi ngực vượt xà.\n4. Chống đẩy tới khi tay duỗi rồi hạ có kiểm soát.',
    '1. Treo người, nắm xà rộng bằng vai, có thể dùng cách nắm chắc cổ tay.\n2. Kéo bùng nổ đưa ngực về phía xà.\n3. Xoay cổ tay và đẩy người qua xà khi ngực vượt xà.\n4. Chống đẩy tới khi tay duỗi rồi hạ có kiểm soát.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Tập khi chưa hít xà và chống xà vững; dùng quá nhiều đà; tiếp xuống bằng cách thả rơi.', @safe, @dose_strength, '3 x 3–5', 'gv-0631', 'ADAPTED', 'APPROVED',
    '1. Start by hanging from a pull-up bar with your palms facing away from you and your arms fully extended.\n2. Engage your core and pull your body up towards the bar, leading with your chest.\n3. As you reach the top of the movement, transition your grip so that your palms are facing towards you.\n4. Continue pulling yourself up until your chest is above the bar and your arms are fully flexed.\n5. Reverse the movement by slowly lowering yourself back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Start by hanging from a pull-up bar with your palms facing away from you and your arms fully extended.\n2. Engage your core and pull your body up towards the bar, leading with your chest.\n3. As you reach the top of the movement, transition your grip so that your palms are facing towards you.\n4. Continue pulling yourself up until your chest is above the bar and your arms are fully flexed.\n5. Reverse the movement by slowly lowering yourself back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 3–5'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Muscle-up' OR name_en = 'Muscle up' OR external_id = '0631');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0074', 'Rack pull', 'Barbell rack pull', 'Rack pull, deadlift từ giá', 'STRENGTH', 'BACK', 'BACK', 'Mông, Đùi sau, Cẳng tay', 'lower-back,trapezius', 'gluteal,hamstring,forearm',
    'Thanh đòn', 'barbell', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Deadlift biên độ ngắn với thanh đặt trên giá ngang gối, tập lưng trên và sức nắm.', 'Targets the glutes; also works the hamstrings, lower back. Equipment: barbell.',
    '1. Đặt thanh trên chốt giá ngang hoặc ngay dưới gối.\n2. Đứng sát thanh, gập hông nắm thanh, lưng thẳng.\n3. Đẩy hông về trước kéo thanh lên tới khi đứng thẳng.\n4. Hạ thanh có kiểm soát về giá.',
    '1. Đặt thanh trên chốt giá ngang hoặc ngay dưới gối.\n2. Đứng sát thanh, gập hông nắm thanh, lưng thẳng.\n3. Đẩy hông về trước kéo thanh lên tới khi đứng thẳng.\n4. Hạ thanh có kiểm soát về giá.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Ngửa người ra sau ở đỉnh; cong lưng; giật thanh.', @safe, @dose_strength, '4 x 5', 'gv-0074', 'ADAPTED', 'APPROVED',
    '1. Set up a barbell on a rack at knee height.\n2. Stand with your feet shoulder-width apart, toes pointing slightly outwards.\n3. Bend at the hips and knees to lower yourself down and grip the barbell with an overhand grip, hands shoulder-width apart.\n4. Engage your core and lift the barbell by extending your hips and knees, pulling your shoulders back and squeezing your glutes at the top.\n5. Lower the barbell back down to the starting position by bending at the hips and knees.\n6. Repeat for the desired number of repetitions.',
    '1. Set up a barbell on a rack at knee height.\n2. Stand with your feet shoulder-width apart, toes pointing slightly outwards.\n3. Bend at the hips and knees to lower yourself down and grip the barbell with an overhand grip, hands shoulder-width apart.\n4. Engage your core and lift the barbell by extending your hips and knees, pulling your shoulders back and squeezing your glutes at the top.\n5. Lower the barbell back down to the starting position by bending at the hips and knees.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 5'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Rack pull' OR name_en = 'Barbell rack pull' OR external_id = '0074');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0091', 'Đẩy vai thanh đòn ngồi', 'Barbell seated overhead press', 'Seated barbell overhead press', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Tay sau, Cơ thang', 'front-deltoids', 'triceps,trapezius',
    'Thanh đòn, Ghế tập', 'barbell,bench', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Đẩy thanh đòn qua đầu ở tư thế ngồi, lưng có tựa giúp giữ thân ổn định.', 'Targets the delts; also works the triceps, upper back. Equipment: barbell.',
    '1. Ngồi thẳng trên ghế có tựa, thanh đặt trên giá ngang vai.\n2. Nắm thanh rộng hơn vai một chút, đưa thanh xuống trước ngực trên.\n3. Đẩy thanh thẳng lên tới khi tay gần duỗi.\n4. Hạ chậm về ngang cằm.',
    '1. Ngồi thẳng trên ghế có tựa, thanh đặt trên giá ngang vai.\n2. Nắm thanh rộng hơn vai một chút, đưa thanh xuống trước ngực trên.\n3. Đẩy thanh thẳng lên tới khi tay gần duỗi.\n4. Hạ chậm về ngang cằm.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Ưỡn lưng quá mức; hạ thanh ra sau gáy; khoá khuỷu mạnh.', @safe, @dose_strength, '4 x 6–10', 'gv-0091', 'ADAPTED', 'APPROVED',
    '1. Sit on a bench with your back straight and feet flat on the ground.\n2. Hold the barbell with an overhand grip, slightly wider than shoulder-width apart.\n3. Lift the barbell off the rack and bring it to shoulder level, with your elbows bent and palms facing forward.\n4. Press the barbell overhead by extending your arms fully.\n5. Pause for a moment at the top, then slowly lower the barbell back to shoulder level.\n6. Repeat for the desired number of repetitions.',
    '1. Sit on a bench with your back straight and feet flat on the ground.\n2. Hold the barbell with an overhand grip, slightly wider than shoulder-width apart.\n3. Lift the barbell off the rack and bring it to shoulder level, with your elbows bent and palms facing forward.\n4. Press the barbell overhead by extending your arms fully.\n5. Pause for a moment at the top, then slowly lower the barbell back to shoulder level.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 6–10'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Đẩy vai thanh đòn ngồi' OR name_en = 'Barbell seated overhead press' OR external_id = '0091');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0041', 'Nâng thanh đòn trước mặt', 'Barbell front raise', 'Barbell front raise', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Ngực, Cơ thang', 'front-deltoids', 'chest,trapezius',
    'Thanh đòn', 'barbell', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Bài cô lập vai trước, nâng thanh đòn thẳng tay lên ngang vai.', 'Targets the delts; also works the biceps, triceps. Equipment: barbell.',
    '1. Đứng thẳng, nắm thanh rộng bằng vai, thanh trước đùi.\n2. Siết bụng, hơi gập khuỷu.\n3. Nâng thanh lên trước mặt tới ngang vai.\n4. Hạ chậm về trước đùi.',
    '1. Đứng thẳng, nắm thanh rộng bằng vai, thanh trước đùi.\n2. Siết bụng, hơi gập khuỷu.\n3. Nâng thanh lên trước mặt tới ngang vai.\n4. Hạ chậm về trước đùi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Đung đưa người; nâng quá cao; dùng tạ quá nặng.', @safe, @dose_strength, '3 x 10–12', 'gv-0041', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and hold a barbell in front of your thighs with an overhand grip.\n2. Keep your arms straight and lift the barbell forward and upward until it reaches shoulder level.\n3. Pause for a moment at the top, then slowly lower the barbell back down to the starting position.\n4. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and hold a barbell in front of your thighs with an overhand grip.\n2. Keep your arms straight and lift the barbell forward and upward until it reaches shoulder level.\n3. Pause for a moment at the top, then slowly lower the barbell back down to the starting position.\n4. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nâng thanh đòn trước mặt' OR name_en = 'Barbell front raise' OR external_id = '0041');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0426', 'Đẩy vai tạ đơn đứng', 'Dumbbell standing overhead press', 'Standing dumbbell shoulder press', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Tay sau, Cơ thang, Bụng', 'front-deltoids', 'triceps,trapezius,abs',
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'STRENGTH', 'STRENGTH', 'Đẩy hai tạ đơn qua đầu ở tư thế đứng, cơ lõi phải giữ thân vững.', 'Targets the delts; also works the triceps, upper back. Equipment: dumbbell.',
    '1. Đứng rộng bằng hông, hai tạ ngang vai, lòng bàn tay hướng ra trước.\n2. Siết bụng và mông.\n3. Đẩy tạ lên qua đầu tới khi tay gần duỗi.\n4. Hạ chậm về ngang vai.',
    '1. Đứng rộng bằng hông, hai tạ ngang vai, lòng bàn tay hướng ra trước.\n2. Siết bụng và mông.\n3. Đẩy tạ lên qua đầu tới khi tay gần duỗi.\n4. Hạ chậm về ngang vai.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Ưỡn lưng; đẩy tạ chéo ra trước; nhún vai.', @safe, @dose_strength, '3 x 8–12', 'gv-0426', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand at shoulder level with your palms facing forward.\n2. Press the dumbbells upward until your arms are fully extended overhead.\n3. Pause for a moment at the top, then slowly lower the dumbbells back down to shoulder level.\n4. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand at shoulder level with your palms facing forward.\n2. Press the dumbbells upward until your arms are fully extended overhead.\n3. Pause for a moment at the top, then slowly lower the dumbbells back down to shoulder level.\n4. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Đẩy vai tạ đơn đứng' OR name_en = 'Dumbbell standing overhead press' OR external_id = '0426');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0162', 'Nâng cáp trước mặt', 'Cable front raise', 'Cable front raise', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Ngực', 'front-deltoids', 'chest',
    'Máy cáp', 'cable', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Nâng tay cầm cáp từ dưới lên trước mặt, lực căng đều suốt biên độ.', 'Targets the delts; also works the triceps, forearms. Equipment: cable.',
    '1. Đặt ròng rọc thấp, đứng quay lưng về máy, tay cầm giữa hai chân.\n2. Hơi gập khuỷu, siết bụng.\n3. Nâng tay cầm lên trước mặt tới ngang vai.\n4. Hạ chậm về vị trí đầu.',
    '1. Đặt ròng rọc thấp, đứng quay lưng về máy, tay cầm giữa hai chân.\n2. Hơi gập khuỷu, siết bụng.\n3. Nâng tay cầm lên trước mặt tới ngang vai.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Ngả người; giật dây; nâng quá đầu.', @safe, @dose_strength, '3 x 12–15', 'gv-0162', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and grasp the cable handle with an overhand grip.\n2. Keep your back straight and your core engaged.\n3. Raise the cable handle in front of you, keeping your arms straight and your palms facing down.\n4. Continue lifting until your arms are parallel to the floor.\n5. Pause for a moment at the top, then slowly lower the cable handle back to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and grasp the cable handle with an overhand grip.\n2. Keep your back straight and your core engaged.\n3. Raise the cable handle in front of you, keeping your arms straight and your palms facing down.\n4. Continue lifting until your arms are parallel to the floor.\n5. Pause for a moment at the top, then slowly lower the cable handle back to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nâng cáp trước mặt' OR name_en = 'Cable front raise' OR external_id = '0162');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0584', 'Dang vai trên máy', 'Lever lateral raise', 'Machine lateral raise', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Cơ thang', 'front-deltoids', 'trapezius',
    'Máy tập', 'machine', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Dang vai trên máy có đệm tì cánh tay, cô lập vai giữa.', 'Targets the delts; also works the traps, upper back. Equipment: leverage machine.',
    '1. Chỉnh ghế để khớp vai thẳng trục máy, tì cánh tay vào đệm.\n2. Ngồi thẳng, siết bụng.\n3. Dang tay sang ngang tới ngang vai.\n4. Hạ chậm về vị trí đầu.',
    '1. Chỉnh ghế để khớp vai thẳng trục máy, tì cánh tay vào đệm.\n2. Ngồi thẳng, siết bụng.\n3. Dang tay sang ngang tới ngang vai.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhún vai; ngồi lệch trục máy; thả tạ rơi.', @safe, @dose_strength, '3 x 12–15', 'gv-0584', 'ADAPTED', 'APPROVED',
    '1. Adjust the seat height and position yourself on the machine with your back against the pad.\n2. Grasp the handles with an overhand grip and keep your arms straight.\n3. Exhale and raise your arms out to the sides until they are parallel to the floor.\n4. Pause for a moment at the top, then inhale and slowly lower your arms back to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Adjust the seat height and position yourself on the machine with your back against the pad.\n2. Grasp the handles with an overhand grip and keep your arms straight.\n3. Exhale and raise your arms out to the sides until they are parallel to the floor.\n4. Pause for a moment at the top, then inhale and slowly lower your arms back to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dang vai trên máy' OR name_en = 'Lever lateral raise' OR external_id = '0584');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0602', 'Bay vai sau trên máy', 'Lever seated reverse fly', 'Reverse pec deck, machine rear delt fly', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Lưng trên & xô, Cơ thang', 'back-deltoids', 'upper-back,trapezius',
    'Máy tập', 'machine', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Ngồi quay mặt vào máy ép ngực, mở tay ra sau để tập vai sau.', 'Targets the delts; also works the trapezius, rhomboids. Equipment: leverage machine.',
    '1. Ngồi quay mặt vào lưng ghế, ngực tựa đệm.\n2. Nắm tay cầm ngang vai, hơi gập khuỷu.\n3. Mở hai tay ra sau theo vòng cung, siết vai sau.\n4. Trả về chậm.',
    '1. Ngồi quay mặt vào lưng ghế, ngực tựa đệm.\n2. Nắm tay cầm ngang vai, hơi gập khuỷu.\n3. Mở hai tay ra sau theo vòng cung, siết vai sau.\n4. Trả về chậm.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo bằng lưng thay vì vai sau; nhún vai; tạ quá nặng.', @safe, @dose_strength, '3 x 12–15', 'gv-0602', 'ADAPTED', 'APPROVED',
    '1. Adjust the seat height and position yourself on the machine with your chest against the pad and your feet flat on the floor.\n2. Grasp the handles with an overhand grip and keep your arms slightly bent.\n3. Exhale and squeeze your shoulder blades together as you pull the handles back and outward, away from your body.\n4. Pause for a moment at the peak contraction, then inhale and slowly return to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Adjust the seat height and position yourself on the machine with your chest against the pad and your feet flat on the floor.\n2. Grasp the handles with an overhand grip and keep your arms slightly bent.\n3. Exhale and squeeze your shoulder blades together as you pull the handles back and outward, away from your body.\n4. Pause for a moment at the peak contraction, then inhale and slowly return to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bay vai sau trên máy' OR name_en = 'Lever seated reverse fly' OR external_id = '0602');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0774', 'Đẩy vai máy Smith', 'Smith standing military press', 'Smith machine overhead press', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Tay sau, Cơ thang', 'front-deltoids', 'triceps,trapezius',
    'Máy Smith', 'smith-machine', 'BEGINNER', 'GYM', 'STRENGTH', 'STRENGTH', 'Đẩy vai đứng trên máy Smith, quỹ đạo cố định nên dễ tập nặng an toàn.', 'Targets the delts; also works the triceps, upper back. Equipment: smith machine.',
    '1. Chỉnh thanh ngang vai, đứng ngay dưới thanh.\n2. Nắm thanh rộng hơn vai, mở móc khoá.\n3. Đẩy thanh thẳng lên tới khi tay gần duỗi.\n4. Hạ chậm về ngang cằm rồi lặp lại.',
    '1. Chỉnh thanh ngang vai, đứng ngay dưới thanh.\n2. Nắm thanh rộng hơn vai, mở móc khoá.\n3. Đẩy thanh thẳng lên tới khi tay gần duỗi.\n4. Hạ chậm về ngang cằm rồi lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Đứng quá xa thanh; ưỡn lưng; quên khoá móc khi xong.', @safe, @dose_strength, '3 x 8–12', 'gv-0774', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and your knees slightly bent.\n2. Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.\n3. Lift the barbell off the rack and bring it down to shoulder level, with your palms facing forward.\n4. Press the barbell upward until your arms are fully extended overhead.\n5. Pause for a moment at the top, then slowly lower the barbell back down to shoulder level.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and your knees slightly bent.\n2. Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.\n3. Lift the barbell off the rack and bring it down to shoulder level, with your palms facing forward.\n4. Press the barbell upward until your arms are fully extended overhead.\n5. Pause for a moment at the top, then slowly lower the barbell back down to shoulder level.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Đẩy vai máy Smith' OR name_en = 'Smith standing military press' OR external_id = '0774');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1700', 'Push press tạ đơn', 'Dumbbell push press', 'Dumbbell push press', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Tay sau, Đùi trước, Mông', 'front-deltoids', 'triceps,quadriceps,gluteal',
    'Tạ đơn', 'dumbbell', 'INTERMEDIATE', 'ANY', 'STRENGTH', 'STRENGTH', 'Đẩy vai có trợ lực từ chân: khuỵu nhẹ rồi bật lên để đẩy tạ qua đầu.', 'Targets the delts; also works the triceps, core. Equipment: dumbbell.',
    '1. Đứng rộng bằng hông, hai tạ ngang vai.\n2. Khuỵu gối nhẹ, giữ thân thẳng.\n3. Bật mạnh chân và đồng thời đẩy tạ lên qua đầu.\n4. Hạ tạ về vai có kiểm soát.',
    '1. Đứng rộng bằng hông, hai tạ ngang vai.\n2. Khuỵu gối nhẹ, giữ thân thẳng.\n3. Bật mạnh chân và đồng thời đẩy tạ lên qua đầu.\n4. Hạ tạ về vai có kiểm soát.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Khuỵu quá sâu như squat; ưỡn lưng; hạ tạ quá nhanh.', @safe, @dose_strength, '4 x 6–8', 'gv-1700', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand at shoulder level.\n2. Bend your knees slightly and dip your body down, then explosively extend your legs and press the dumbbells overhead.\n3. Lock out your arms at the top of the movement, then lower the dumbbells back to shoulder level.\n4. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand at shoulder level.\n2. Bend your knees slightly and dip your body down, then explosively extend your legs and press the dumbbells overhead.\n3. Lock out your arms at the top of the movement, then lower the dumbbells back to shoulder level.\n4. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 6–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Push press tạ đơn' OR name_en = 'Dumbbell push press' OR external_id = '1700');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0437', 'Kéo tạ đơn lên ngực', 'Dumbbell upright row', 'Dumbbell upright row', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Tay trước', 'front-deltoids,trapezius', 'biceps',
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'HYPERTROPHY', 'HYPERTROPHY', 'Kéo hai tạ đơn thẳng lên dọc thân tới ngang ngực, tập vai và cơ thang.', 'Targets the delts; also works the traps, biceps. Equipment: dumbbell.',
    '1. Đứng thẳng, hai tạ trước đùi.\n2. Kéo tạ lên sát thân, khuỷu dẫn đường và cao hơn cổ tay.\n3. Dừng khi khuỷu ngang vai.\n4. Hạ chậm về trước đùi.',
    '1. Đứng thẳng, hai tạ trước đùi.\n2. Kéo tạ lên sát thân, khuỷu dẫn đường và cao hơn cổ tay.\n3. Dừng khi khuỷu ngang vai.\n4. Hạ chậm về trước đùi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo quá cao gây đau vai; đung đưa người; cổ tay gập.', @safe, @dose_strength, '3 x 10–12', 'gv-0437', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand with an overhand grip.\n2. Let the dumbbells hang in front of your thighs, with your arms fully extended.\n3. Keeping your back straight and your core engaged, exhale and lift the dumbbells straight up towards your chin, leading with your elbows.\n4. Pause for a moment at the top, then inhale and slowly lower the dumbbells back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand with an overhand grip.\n2. Let the dumbbells hang in front of your thighs, with your arms fully extended.\n3. Keeping your back straight and your core engaged, exhale and lift the dumbbells straight up towards your chin, leading with your elbows.\n4. Pause for a moment at the top, then inhale and slowly lower the dumbbells back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Kéo tạ đơn lên ngực' OR name_en = 'Dumbbell upright row' OR external_id = '0437');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0553', 'Đẩy vai tạ ấm', 'Kettlebell two arm military press', 'Kettlebell overhead press', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Tay sau, Bụng', 'front-deltoids', 'triceps,abs',
    'Tạ ấm', 'kettlebell', 'INTERMEDIATE', 'ANY', 'STRENGTH', 'STRENGTH', 'Đẩy hai tạ ấm từ tư thế giữ ngang vai lên qua đầu.', 'Targets the delts; also works the triceps, upper back. Equipment: kettlebell.',
    '1. Giữ hai tạ ấm ở vai, tạ nằm trên cẳng tay, cổ tay thẳng.\n2. Siết bụng, mông.\n3. Đẩy tạ lên qua đầu tới khi tay duỗi.\n4. Hạ về vai có kiểm soát.',
    '1. Giữ hai tạ ấm ở vai, tạ nằm trên cẳng tay, cổ tay thẳng.\n2. Siết bụng, mông.\n3. Đẩy tạ lên qua đầu tới khi tay duỗi.\n4. Hạ về vai có kiểm soát.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Bẻ cổ tay; ưỡn lưng; đẩy tạ ra trước mặt.', @safe, @dose_strength, '3 x 6–10', 'gv-0553', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a kettlebell in each hand at shoulder level with your palms facing forward.\n2. Engage your core and press the kettlebells overhead, fully extending your arms.\n3. Pause for a moment at the top, then slowly lower the kettlebells back to the starting position.\n4. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, holding a kettlebell in each hand at shoulder level with your palms facing forward.\n2. Engage your core and press the kettlebells overhead, fully extending your arms.\n3. Pause for a moment at the top, then slowly lower the kettlebells back to the starting position.\n4. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 6–10'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Đẩy vai tạ ấm' OR name_en = 'Kettlebell two arm military press' OR external_id = '0553');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0471', 'Hít đất trồng chuối', 'Handstand push-up', 'Handstand push-up', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Cơ thang, Bụng', 'front-deltoids,triceps', 'trapezius,abs',
    'Không dụng cụ', 'bodyweight', 'ADVANCED', 'ANY', 'STRENGTH', 'STRENGTH', 'Bài nâng cao: trồng chuối dựa tường, hạ đầu xuống gần sàn rồi đẩy lên.', 'Targets the triceps; also works the shoulders, chest, core. Equipment: body weight.',
    '1. Chống tay cách tường khoảng một gang, đá chân lên tựa tường.\n2. Siết bụng, giữ thân thẳng.\n3. Gập khuỷu hạ đầu xuống gần sàn.\n4. Đẩy người lên tới khi tay duỗi.',
    '1. Chống tay cách tường khoảng một gang, đá chân lên tựa tường.\n2. Siết bụng, giữ thân thẳng.\n3. Gập khuỷu hạ đầu xuống gần sàn.\n4. Đẩy người lên tới khi tay duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Tập khi vai chưa đủ khoẻ; đập đầu xuống sàn; võng lưng.', @safe, @dose_strength, '3 x 3–6', 'gv-0471', 'ADAPTED', 'APPROVED',
    '1. Find a wall and face away from it, standing a few feet away.\n2. Place your hands on the ground shoulder-width apart and kick your feet up against the wall, coming into a handstand position.\n3. Bend your elbows and lower your head towards the ground, keeping your body in a straight line.\n4. Push through your hands and extend your arms to return to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Find a wall and face away from it, standing a few feet away.\n2. Place your hands on the ground shoulder-width apart and kick your feet up against the wall, coming into a handstand position.\n3. Bend your elbows and lower your head towards the ground, keeping your body in a straight line.\n4. Push through your hands and extend your arms to return to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 3–6'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hít đất trồng chuối' OR name_en = 'Handstand push-up' OR external_id = '0471');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0396', 'Dang vai tạ đơn ngồi', 'Dumbbell seated lateral raise', 'Seated dumbbell lateral raise', 'STRENGTH', 'SHOULDERS', 'SHOULDERS', 'Cơ thang', 'front-deltoids', 'trapezius',
    'Tạ đơn, Ghế tập', 'dumbbell,bench', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Dang tay sang ngang khi ngồi, hạn chế dùng đà người.', 'Targets the delts; also works the traps, upper back. Equipment: dumbbell.',
    '1. Ngồi thẳng ở mép ghế, hai tạ buông hai bên.\n2. Hơi gập khuỷu, siết bụng.\n3. Dang tạ sang ngang tới ngang vai.\n4. Hạ chậm về hai bên.',
    '1. Ngồi thẳng ở mép ghế, hai tạ buông hai bên.\n2. Hơi gập khuỷu, siết bụng.\n3. Dang tạ sang ngang tới ngang vai.\n4. Hạ chậm về hai bên.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhún vai; nâng quá cao; vung tạ.', @safe, @dose_strength, '3 x 12–15', 'gv-0396', 'ADAPTED', 'APPROVED',
    '1. Sit on a bench with your feet flat on the ground and a dumbbell in each hand, resting on your thighs.\n2. Keep your back straight and core engaged.\n3. Raise the dumbbells to your sides with a slight bend in your elbows, until your arms are parallel to the ground.\n4. Pause for a moment at the top, then slowly lower the dumbbells back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Sit on a bench with your feet flat on the ground and a dumbbell in each hand, resting on your thighs.\n2. Keep your back straight and core engaged.\n3. Raise the dumbbells to your sides with a slight bend in your elbows, until your arms are parallel to the ground.\n4. Pause for a moment at the top, then slowly lower the dumbbells back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dang vai tạ đơn ngồi' OR name_en = 'Dumbbell seated lateral raise' OR external_id = '0396');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0285', 'Cuốn tạ đơn luân phiên', 'Dumbbell alternate biceps curl', 'Alternate dumbbell curl', 'STRENGTH', 'BICEPS', 'ARMS', 'Cẳng tay', 'biceps', 'forearm',
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'HYPERTROPHY,STRENGTH', 'HYPERTROPHY', 'Cuốn tạ đơn lần lượt từng tay, dễ tập trung vào từng bên tay trước.', 'Targets the biceps; also works the forearms. Equipment: dumbbell.',
    '1. Đứng thẳng, hai tạ buông hai bên, lòng bàn tay hướng vào đùi.\n2. Cuốn một tạ lên, xoay lòng bàn tay ngửa lên trên.\n3. Siết tay trước ở đỉnh, khuỷu giữ sát sườn.\n4. Hạ chậm rồi đổi tay.',
    '1. Đứng thẳng, hai tạ buông hai bên, lòng bàn tay hướng vào đùi.\n2. Cuốn một tạ lên, xoay lòng bàn tay ngửa lên trên.\n3. Siết tay trước ở đỉnh, khuỷu giữ sát sườn.\n4. Hạ chậm rồi đổi tay.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Vung thân lấy đà; khuỷu đưa ra trước; hạ quá nhanh.', @safe, @dose_strength, '3 x 10–12 mỗi tay', 'gv-0285', 'ADAPTED', 'APPROVED',
    '1. Stand up straight with a dumbbell in each hand, palms facing forward and arms fully extended.\n2. Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.\n3. Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.\n4. Hold the contracted position for a brief pause as you squeeze your biceps.\n5. Inhale and slowly begin to lower the dumbbells back to the starting position.\n6. Repeat for the desired number of repetitions, alternating arms.',
    '1. Stand up straight with a dumbbell in each hand, palms facing forward and arms fully extended.\n2. Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.\n3. Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.\n4. Hold the contracted position for a brief pause as you squeeze your biceps.\n5. Inhale and slowly begin to lower the dumbbells back to the starting position.\n6. Repeat for the desired number of repetitions, alternating arms.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12 per arm'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn tạ đơn luân phiên' OR name_en = 'Dumbbell alternate biceps curl' OR external_id = '0285');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0315', 'Cuốn tạ đơn ghế dốc', 'Dumbbell incline biceps curl', 'Incline dumbbell curl', 'STRENGTH', 'BICEPS', 'ARMS', 'Cẳng tay', 'biceps', 'forearm',
    'Tạ đơn, Ghế tập', 'dumbbell,bench', 'INTERMEDIATE', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Ngồi tựa ghế dốc để tay buông ra sau thân, kéo giãn tay trước nhiều hơn.', 'Targets the biceps; also works the forearms. Equipment: dumbbell.',
    '1. Chỉnh ghế dốc khoảng 45–60 độ, ngồi tựa lưng, hai tay buông thẳng.\n2. Giữ cánh tay vuông góc sàn.\n3. Cuốn tạ lên tới khi tay trước siết hết.\n4. Hạ chậm tới khi tay gần duỗi.',
    '1. Chỉnh ghế dốc khoảng 45–60 độ, ngồi tựa lưng, hai tay buông thẳng.\n2. Giữ cánh tay vuông góc sàn.\n3. Cuốn tạ lên tới khi tay trước siết hết.\n4. Hạ chậm tới khi tay gần duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhấc vai khỏi ghế; khuỷu đưa ra trước; tạ quá nặng.', @safe, @dose_strength, '3 x 10–12', 'gv-0315', 'ADAPTED', 'APPROVED',
    '1. Sit on an incline bench with a dumbbell in each hand, palms facing forward, and arms fully extended.\n2. Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.\n3. Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.\n4. Hold the contracted position for a brief pause as you squeeze your biceps.\n5. Inhale and slowly begin to lower the dumbbells back to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Sit on an incline bench with a dumbbell in each hand, palms facing forward, and arms fully extended.\n2. Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.\n3. Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.\n4. Hold the contracted position for a brief pause as you squeeze your biceps.\n5. Inhale and slowly begin to lower the dumbbells back to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn tạ đơn ghế dốc' OR name_en = 'Dumbbell incline biceps curl' OR external_id = '0315');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0298', 'Cuốn búa chéo người', 'Dumbbell cross body hammer curl', 'Cross-body hammer curl', 'STRENGTH', 'BICEPS', 'ARMS', NULL, 'biceps,forearm', NULL,
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'HYPERTROPHY', 'HYPERTROPHY', 'Cuốn tạ cầm dọc chéo qua thân về phía vai đối diện, tập cơ cánh tay và cẳng tay.', 'Targets the biceps; also works the forearms. Equipment: dumbbell.',
    '1. Đứng thẳng, hai tạ cầm dọc, lòng bàn tay hướng vào thân.\n2. Cuốn một tạ chéo qua trước ngực về phía vai đối diện.\n3. Siết ở đỉnh.\n4. Hạ chậm rồi đổi tay.',
    '1. Đứng thẳng, hai tạ cầm dọc, lòng bàn tay hướng vào thân.\n2. Cuốn một tạ chéo qua trước ngực về phía vai đối diện.\n3. Siết ở đỉnh.\n4. Hạ chậm rồi đổi tay.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Xoay vai theo tạ; vung tạ; hạ không hết biên độ.', @safe, @dose_strength, '3 x 10–12 mỗi tay', 'gv-0298', 'ADAPTED', 'APPROVED',
    '1. Stand up straight with a dumbbell in each hand, palms facing your body.\n2. Keep your elbows close to your torso and your upper arms stationary.\n3. Exhale and curl the weights while contracting your biceps, bringing the dumbbells across your body towards your opposite shoulder.\n4. Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.\n5. Hold the contracted position for a brief pause as you squeeze your biceps.\n6. Inhale and slowly begin to lower the dumbbells back to the starting position.\n7. Repeat for the desired number of repetitions.',
    '1. Stand up straight with a dumbbell in each hand, palms facing your body.\n2. Keep your elbows close to your torso and your upper arms stationary.\n3. Exhale and curl the weights while contracting your biceps, bringing the dumbbells across your body towards your opposite shoulder.\n4. Continue to raise the dumbbells until your biceps are fully contracted and the dumbbells are at shoulder level.\n5. Hold the contracted position for a brief pause as you squeeze your biceps.\n6. Inhale and slowly begin to lower the dumbbells back to the starting position.\n7. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12 per arm'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn búa chéo người' OR name_en = 'Dumbbell cross body hammer curl' OR external_id = '0298');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0439', 'Cuốn Zottman', 'Dumbbell zottman curl', 'Zottman curl', 'STRENGTH', 'BICEPS', 'ARMS', NULL, 'biceps,forearm', NULL,
    'Tạ đơn', 'dumbbell', 'INTERMEDIATE', 'ANY', 'HYPERTROPHY,STRENGTH', 'HYPERTROPHY', 'Cuốn lên với lòng bàn tay ngửa, xoay úp ở đỉnh rồi hạ chậm, tập cả tay trước và cẳng tay.', 'Targets the biceps; also works the forearms. Equipment: dumbbell.',
    '1. Đứng thẳng, hai tạ buông, lòng bàn tay hướng ra trước.\n2. Cuốn tạ lên tới vai.\n3. Ở đỉnh, xoay cổ tay để lòng bàn tay úp xuống.\n4. Hạ chậm với tay úp, xoay ngửa lại ở dưới rồi lặp lại.',
    '1. Đứng thẳng, hai tạ buông, lòng bàn tay hướng ra trước.\n2. Cuốn tạ lên tới vai.\n3. Ở đỉnh, xoay cổ tay để lòng bàn tay úp xuống.\n4. Hạ chậm với tay úp, xoay ngửa lại ở dưới rồi lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Hạ nhanh; xoay cổ tay giật; dùng tạ quá nặng.', @safe, @dose_strength, '3 x 8–10', 'gv-0439', 'ADAPTED', 'APPROVED',
    '1. Stand up straight with a dumbbell in each hand, palms facing your body.\n2. Keep your elbows close to your torso and rotate your palms to face forward.\n3. Curl the dumbbells up to your shoulders while keeping your upper arms stationary.\n4. At the top of the movement, rotate your wrists so that your palms are facing away from your body.\n5. Slowly lower the dumbbells back to the starting position, rotating your palms back to facing your body.\n6. Repeat for the desired number of repetitions.',
    '1. Stand up straight with a dumbbell in each hand, palms facing your body.\n2. Keep your elbows close to your torso and rotate your palms to face forward.\n3. Curl the dumbbells up to your shoulders while keeping your upper arms stationary.\n4. At the top of the movement, rotate your wrists so that your palms are facing away from your body.\n5. Slowly lower the dumbbells back to the starting position, rotating your palms back to facing your body.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–10'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn Zottman' OR name_en = 'Dumbbell zottman curl' OR external_id = '0439');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0454', 'Spider curl thanh EZ', 'Ez barbell spider curl', 'EZ-bar spider curl', 'STRENGTH', 'BICEPS', 'ARMS', 'Cẳng tay', 'biceps', 'forearm',
    'Thanh EZ, Ghế tập', 'ez-bar,bench', 'INTERMEDIATE', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Nằm sấp trên ghế dốc, tay buông thẳng xuống và cuốn thanh EZ, loại bỏ hoàn toàn đà người.', 'Targets the biceps; also works the forearms. Equipment: ez barbell.',
    '1. Nằm sấp trên ghế dốc, ngực tựa đệm, tay buông thẳng xuống sàn.\n2. Nắm thanh EZ ở đoạn uốn.\n3. Cuốn thanh lên, siết tay trước.\n4. Hạ chậm tới khi tay gần duỗi.',
    '1. Nằm sấp trên ghế dốc, ngực tựa đệm, tay buông thẳng xuống sàn.\n2. Nắm thanh EZ ở đoạn uốn.\n3. Cuốn thanh lên, siết tay trước.\n4. Hạ chậm tới khi tay gần duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhấc ngực khỏi ghế; khuỷu đưa ra sau; hạ nửa chừng.', @safe, @dose_strength, '3 x 10–12', 'gv-0454', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and hold the ez barbell with an underhand grip, palms facing up.\n2. Rest your upper arms on a preacher bench or stability ball, allowing your elbows to hang down.\n3. Keeping your upper arms stationary, exhale and curl the barbell up towards your shoulders.\n4. Pause for a moment at the top, squeezing your biceps.\n5. Inhale and slowly lower the barbell back to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and hold the ez barbell with an underhand grip, palms facing up.\n2. Rest your upper arms on a preacher bench or stability ball, allowing your elbows to hang down.\n3. Keeping your upper arms stationary, exhale and curl the barbell up towards your shoulders.\n4. Pause for a moment at the top, squeezing your biceps.\n5. Inhale and slowly lower the barbell back to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Spider curl thanh EZ' OR name_en = 'Ez barbell spider curl' OR external_id = '0454');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0195', 'Cuốn cáp ghế Scott', 'Cable preacher curl', 'Cable preacher curl', 'STRENGTH', 'BICEPS', 'ARMS', 'Cẳng tay', 'biceps', 'forearm',
    'Máy cáp, Ghế tập', 'cable,bench', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Cuốn tay trước với cáp trên ghế tì tay Scott, lực căng đều kể cả ở cuối biên độ.', 'Targets the biceps; also works the forearms. Equipment: cable.',
    '1. Đặt ghế Scott trước ròng rọc thấp, tì mặt sau cánh tay lên đệm.\n2. Nắm thanh cáp ngửa tay.\n3. Cuốn lên tới khi siết tay trước.\n4. Hạ chậm tới khi tay gần duỗi.',
    '1. Đặt ghế Scott trước ròng rọc thấp, tì mặt sau cánh tay lên đệm.\n2. Nắm thanh cáp ngửa tay.\n3. Cuốn lên tới khi siết tay trước.\n4. Hạ chậm tới khi tay gần duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhấc khuỷu khỏi đệm; duỗi khoá khuỷu mạnh; giật dây.', @safe, @dose_strength, '3 x 10–12', 'gv-0195', 'ADAPTED', 'APPROVED',
    '1. Adjust the cable machine so that the preacher curl pad is at chest height.\n2. Sit on the preacher curl bench and place your upper arms on the pad, gripping the cable attachment with an underhand grip.\n3. Keep your back straight and your elbows tucked in at your sides.\n4. Slowly curl the cable attachment up towards your shoulders, squeezing your biceps at the top of the movement.\n5. Pause for a moment, then slowly lower the cable attachment back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Adjust the cable machine so that the preacher curl pad is at chest height.\n2. Sit on the preacher curl bench and place your upper arms on the pad, gripping the cable attachment with an underhand grip.\n3. Keep your back straight and your elbows tucked in at your sides.\n4. Slowly curl the cable attachment up towards your shoulders, squeezing your biceps at the top of the movement.\n5. Pause for a moment, then slowly lower the cable attachment back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn cáp ghế Scott' OR name_en = 'Cable preacher curl' OR external_id = '0195');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1636', 'Cuốn cáp trên cao', 'Cable overhead curl', 'Overhead cable curl', 'STRENGTH', 'BICEPS', 'ARMS', NULL, 'biceps', NULL,
    'Máy cáp', 'cable', 'INTERMEDIATE', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Đứng giữa hai ròng rọc cao, cuốn hai tay về phía tai như tư thế khoe cơ tay.', 'Targets the biceps; also works the forearms, shoulders. Equipment: cable.',
    '1. Đặt hai ròng rọc ở trên cao, đứng giữa, hai tay dang ngang nắm tay cầm.\n2. Giữ cánh tay song song sàn.\n3. Cuốn tay cầm về phía hai bên đầu.\n4. Duỗi chậm về vị trí đầu.',
    '1. Đặt hai ròng rọc ở trên cao, đứng giữa, hai tay dang ngang nắm tay cầm.\n2. Giữ cánh tay song song sàn.\n3. Cuốn tay cầm về phía hai bên đầu.\n4. Duỗi chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Hạ cánh tay xuống; ngả người; giật dây.', @safe, @dose_strength, '3 x 12–15', 'gv-1636', 'ADAPTED', 'APPROVED',
    '1. Attach a straight bar to a high pulley cable machine.\n2. Stand facing the machine with your feet shoulder-width apart.\n3. Grasp the bar with an underhand grip, hands shoulder-width apart.\n4. Keep your elbows close to your sides and your upper arms stationary.\n5. Exhale and curl the bar down towards your forehead, keeping your upper arms stationary.\n6. Pause for a moment at the bottom of the movement, squeezing your biceps.\n7. Inhale and slowly return the bar to the starting position, fully extending your arms.\n8. Repeat for the desired number of repetitions.',
    '1. Attach a straight bar to a high pulley cable machine.\n2. Stand facing the machine with your feet shoulder-width apart.\n3. Grasp the bar with an underhand grip, hands shoulder-width apart.\n4. Keep your elbows close to your sides and your upper arms stationary.\n5. Exhale and curl the bar down towards your forehead, keeping your upper arms stationary.\n6. Pause for a moment at the bottom of the movement, squeezing your biceps.\n7. Inhale and slowly return the bar to the starting position, fully extending your arms.\n8. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn cáp trên cao' OR name_en = 'Cable overhead curl' OR external_id = '1636');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0038', 'Drag curl thanh đòn', 'Barbell drag curl', 'Barbell drag curl', 'STRENGTH', 'BICEPS', 'ARMS', 'Cẳng tay, Vai sau', 'biceps', 'forearm,back-deltoids',
    'Thanh đòn', 'barbell', 'INTERMEDIATE', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Kéo thanh đòn trượt sát thân lên, khuỷu lùi ra sau, nhấn vào phần dài của tay trước.', 'Targets the biceps; also works the forearms. Equipment: barbell.',
    '1. Đứng thẳng, nắm thanh ngửa tay rộng bằng vai.\n2. Kéo thanh lên sát thân, đồng thời đưa khuỷu ra sau.\n3. Dừng khi thanh ngang bụng trên.\n4. Hạ chậm theo đường cũ.',
    '1. Đứng thẳng, nắm thanh ngửa tay rộng bằng vai.\n2. Kéo thanh lên sát thân, đồng thời đưa khuỷu ra sau.\n3. Dừng khi thanh ngang bụng trên.\n4. Hạ chậm theo đường cũ.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Đẩy khuỷu ra trước như cuốn thường; vung người; nhún vai.', @safe, @dose_strength, '3 x 8–12', 'gv-0038', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and hold a barbell with an underhand grip, palms facing up.\n2. Let the barbell hang at arm''s length in front of your thighs.\n3. Keeping your upper arms stationary, curl the barbell up towards your chest by contracting your biceps.\n4. Pause for a moment at the top, then slowly lower the barbell back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and hold a barbell with an underhand grip, palms facing up.\n2. Let the barbell hang at arm''s length in front of your thighs.\n3. Keeping your upper arms stationary, curl the barbell up towards your chest by contracting your biceps.\n4. Pause for a moment at the top, then slowly lower the barbell back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Drag curl thanh đòn' OR name_en = 'Barbell drag curl' OR external_id = '0038');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0592', 'Cuốn tay trước trên máy', 'Lever preacher curl', 'Machine preacher curl', 'STRENGTH', 'BICEPS', 'ARMS', 'Cẳng tay', 'biceps', 'forearm',
    'Máy tập', 'machine', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Cuốn tay trước trên máy có đệm tì cánh tay, quỹ đạo cố định, hợp người mới.', 'Targets the biceps; also works the forearms. Equipment: leverage machine.',
    '1. Chỉnh ghế để nách sát mép đệm, khuỷu thẳng trục máy.\n2. Nắm tay cầm ngửa tay.\n3. Cuốn lên tới khi siết tay trước.\n4. Hạ chậm tới khi tay gần duỗi.',
    '1. Chỉnh ghế để nách sát mép đệm, khuỷu thẳng trục máy.\n2. Nắm tay cầm ngửa tay.\n3. Cuốn lên tới khi siết tay trước.\n4. Hạ chậm tới khi tay gần duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Ghế quá thấp; nhấc vai; thả tạ rơi.', @safe, @dose_strength, '3 x 10–12', 'gv-0592', 'ADAPTED', 'APPROVED',
    '1. Adjust the seat height and position yourself on the leverage machine.\n2. Place your upper arms on the pad and grip the handles with an underhand grip.\n3. Keep your back straight and your elbows positioned on the pad.\n4. Exhale and curl your forearms towards your upper arms, contracting your biceps.\n5. Pause for a moment at the top of the movement, squeezing your biceps.\n6. Inhale and slowly lower the handles back to the starting position.\n7. Repeat for the desired number of repetitions.',
    '1. Adjust the seat height and position yourself on the leverage machine.\n2. Place your upper arms on the pad and grip the handles with an underhand grip.\n3. Keep your back straight and your elbows positioned on the pad.\n4. Exhale and curl your forearms towards your upper arms, contracting your biceps.\n5. Pause for a moment at the top of the movement, squeezing your biceps.\n6. Inhale and slowly lower the handles back to the starting position.\n7. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn tay trước trên máy' OR name_en = 'Lever preacher curl' OR external_id = '0592');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0082', 'Cuốn cổ tay sấp thanh đòn', 'Barbell reverse wrist curl', 'Barbell reverse wrist curl', 'STRENGTH', 'BICEPS', 'ARMS', NULL, 'forearm', NULL,
    'Thanh đòn, Ghế tập', 'barbell,bench', 'BEGINNER', 'GYM', 'STRENGTH', 'STRENGTH', 'Tì cẳng tay lên ghế, lòng bàn tay úp, nâng mu bàn tay lên để tập mặt trên cẳng tay.', 'Targets the forearms; also works the biceps, brachialis. Equipment: barbell.',
    '1. Ngồi, tì cẳng tay lên đùi hoặc ghế, cổ tay ra ngoài mép.\n2. Nắm thanh với lòng bàn tay úp.\n3. Nâng mu bàn tay lên càng cao càng tốt.\n4. Hạ chậm về vị trí đầu.',
    '1. Ngồi, tì cẳng tay lên đùi hoặc ghế, cổ tay ra ngoài mép.\n2. Nắm thanh với lòng bàn tay úp.\n3. Nâng mu bàn tay lên càng cao càng tốt.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhấc cẳng tay khỏi đệm; tạ quá nặng; giật.', @safe, @dose_strength, '3 x 15–20', 'gv-0082', 'ADAPTED', 'APPROVED',
    '1. Sit on a bench with your feet flat on the ground and hold a barbell with an overhand grip, palms facing down.\n2. Rest your forearms on your thighs, allowing your wrists to hang off the edge.\n3. Slowly curl your wrists upward, bringing the barbell towards your body.\n4. Pause for a moment at the top, then slowly lower the barbell back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Sit on a bench with your feet flat on the ground and hold a barbell with an overhand grip, palms facing down.\n2. Rest your forearms on your thighs, allowing your wrists to hang off the edge.\n3. Slowly curl your wrists upward, bringing the barbell towards your body.\n4. Pause for a moment at the top, then slowly lower the barbell back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 15–20'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn cổ tay sấp thanh đòn' OR name_en = 'Barbell reverse wrist curl' OR external_id = '0082');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0364', 'Cuốn cổ tay tạ đơn', 'Dumbbell one arm wrist curl', 'Dumbbell wrist curl', 'STRENGTH', 'BICEPS', 'ARMS', NULL, 'forearm', NULL,
    'Tạ đơn, Ghế tập', 'dumbbell,bench', 'BEGINNER', 'ANY', 'STRENGTH', 'STRENGTH', 'Cuốn cổ tay từng bên với tạ đơn, lòng bàn tay ngửa, tập mặt trong cẳng tay.', 'Targets the forearms; also works the biceps, brachialis. Equipment: dumbbell.',
    '1. Ngồi, tì cẳng tay lên đùi, lòng bàn tay ngửa, cổ tay ra ngoài đầu gối.\n2. Để tạ hạ xuống theo các ngón tay.\n3. Cuốn cổ tay lên hết mức.\n4. Hạ chậm rồi lặp lại, xong đổi tay.',
    '1. Ngồi, tì cẳng tay lên đùi, lòng bàn tay ngửa, cổ tay ra ngoài đầu gối.\n2. Để tạ hạ xuống theo các ngón tay.\n3. Cuốn cổ tay lên hết mức.\n4. Hạ chậm rồi lặp lại, xong đổi tay.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Dùng cả cánh tay nhấc; tạ quá nặng; biên độ ngắn.', @safe, @dose_strength, '3 x 15–20 mỗi tay', 'gv-0364', 'ADAPTED', 'APPROVED',
    '1. Sit on a bench or chair with your feet flat on the ground.\n2. Hold a dumbbell in one hand with an underhand grip, resting your forearm on your thigh.\n3. Allow your wrist to extend, letting the dumbbell roll down towards your fingers.\n4. Slowly curl your wrist back up, bringing the dumbbell towards your forearm.\n5. Repeat for the desired number of repetitions, then switch to the other hand.',
    '1. Sit on a bench or chair with your feet flat on the ground.\n2. Hold a dumbbell in one hand with an underhand grip, resting your forearm on your thigh.\n3. Allow your wrist to extend, letting the dumbbell roll down towards your fingers.\n4. Slowly curl your wrist back up, bringing the dumbbell towards your forearm.\n5. Repeat for the desired number of repetitions, then switch to the other hand.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 15–20 per arm'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn cổ tay tạ đơn' OR name_en = 'Dumbbell one arm wrist curl' OR external_id = '0364');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0859', 'Cuộn dây tạ cổ tay', 'Wrist rollerer', 'Wrist roller', 'STRENGTH', 'BICEPS', 'ARMS', 'Vai trước', 'forearm', 'front-deltoids',
    'Khác', 'other', 'BEGINNER', 'GYM', 'STRENGTH', 'STRENGTH', 'Cuộn sợi dây treo tạ quanh thanh cầm bằng cổ tay, tăng sức nắm và sức bền cẳng tay.', 'Targets the forearms; also works the biceps, triceps. Equipment: weighted.',
    '1. Đứng thẳng, hai tay cầm thanh cuộn, đưa ra trước ngang vai.\n2. Xoay luân phiên hai cổ tay để cuộn dây kéo tạ lên.\n3. Khi tạ chạm thanh, xoay ngược để hạ chậm xuống.\n4. Giữ vai thả lỏng suốt bài.',
    '1. Đứng thẳng, hai tay cầm thanh cuộn, đưa ra trước ngang vai.\n2. Xoay luân phiên hai cổ tay để cuộn dây kéo tạ lên.\n3. Khi tạ chạm thanh, xoay ngược để hạ chậm xuống.\n4. Giữ vai thả lỏng suốt bài.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Hạ tay xuống thấp; nhún vai; thả tạ rơi.', @safe, @dose_strength, '3 lượt cuộn lên – xuống', 'gv-0859', 'ADAPTED', 'APPROVED',
    '1. Attach a weight to one end of a rope or bar.\n2. Hold the other end of the rope or bar with both hands, palms facing down.\n3. Stand with your feet shoulder-width apart and your arms fully extended in front of you.\n4. Slowly roll the weight up towards your hands by flexing your wrists.\n5. Pause for a moment at the top, then slowly lower the weight back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Attach a weight to one end of a rope or bar.\n2. Hold the other end of the rope or bar with both hands, palms facing down.\n3. Stand with your feet shoulder-width apart and your arms fully extended in front of you.\n4. Slowly roll the weight up towards your hands by flexing your wrists.\n5. Pause for a moment at the top, then slowly lower the weight back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 up-and-down rolls'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuộn dây tạ cổ tay' OR name_en = 'Wrist rollerer' OR external_id = '0859');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0283', 'Hít đất kim cương', 'Diamond push-up', 'Diamond push-up', 'STRENGTH', 'TRICEPS', 'ARMS', 'Ngực, Vai trước', 'triceps', 'chest,front-deltoids',
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'STRENGTH,ENDURANCE', 'STRENGTH', 'Hít đất với hai bàn tay chụm thành hình kim cương dưới ngực, tập mạnh tay sau.', 'Targets the triceps; also works the chest, shoulders. Equipment: body weight.',
    '1. Chống hai tay dưới ngực, ngón cái và ngón trỏ chạm nhau tạo hình kim cương.\n2. Duỗi chân ra sau, thân thẳng.\n3. Hạ ngực xuống gần tay, khuỷu đi sát thân.\n4. Đẩy lên tới khi tay duỗi.',
    '1. Chống hai tay dưới ngực, ngón cái và ngón trỏ chạm nhau tạo hình kim cương.\n2. Duỗi chân ra sau, thân thẳng.\n3. Hạ ngực xuống gần tay, khuỷu đi sát thân.\n4. Đẩy lên tới khi tay duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Khuỷu bè ra; võng hông; hạ nửa biên độ.', @safe, @dose_strength, '3 x 8–12', 'gv-0283', 'ADAPTED', 'APPROVED',
    '1. Start in a high plank position with your hands close together, forming a diamond shape with your thumbs and index fingers.\n2. Keep your body in a straight line from head to toe, engaging your core and glutes.\n3. Lower your chest towards the diamond shape formed by your hands, keeping your elbows close to your body.\n4. Pause for a moment at the bottom, then push yourself back up to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Start in a high plank position with your hands close together, forming a diamond shape with your thumbs and index fingers.\n2. Keep your body in a straight line from head to toe, engaging your core and glutes.\n3. Lower your chest towards the diamond shape formed by your hands, keeping your elbows close to your body.\n4. Pause for a moment at the bottom, then push yourself back up to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hít đất kim cương' OR name_en = 'Diamond push-up' OR external_id = '0283');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0333', 'Duỗi tay sau tạ đơn (kickback)', 'Dumbbell kickback', 'Dumbbell kickback', 'STRENGTH', 'TRICEPS', 'ARMS', NULL, 'triceps', NULL,
    'Tạ đơn, Ghế tập', 'dumbbell,bench', 'BEGINNER', 'ANY', 'HYPERTROPHY', 'HYPERTROPHY', 'Gập người, giữ cánh tay song song thân và duỗi cẳng tay ra sau, cô lập tay sau.', 'Targets the triceps; also works the shoulders. Equipment: dumbbell.',
    '1. Chống một tay và một gối lên ghế, tay kia cầm tạ.\n2. Kéo cánh tay sát thân, song song sàn, khuỷu gập 90 độ.\n3. Duỗi cẳng tay ra sau tới khi tay thẳng, siết tay sau.\n4. Gập lại chậm về 90 độ.',
    '1. Chống một tay và một gối lên ghế, tay kia cầm tạ.\n2. Kéo cánh tay sát thân, song song sàn, khuỷu gập 90 độ.\n3. Duỗi cẳng tay ra sau tới khi tay thẳng, siết tay sau.\n4. Gập lại chậm về 90 độ.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Hạ cánh tay xuống; vung tạ; xoay vai.', @safe, @dose_strength, '3 x 12–15 mỗi tay', 'gv-0333', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and hold a dumbbell in each hand.\n2. Bend your knees slightly and hinge forward at the hips, keeping your back straight.\n3. Bring your upper arms close to your sides, with your elbows bent at a 90-degree angle.\n4. Extend your arms straight back, squeezing your triceps at the top of the movement.\n5. Pause for a moment, then slowly lower the dumbbells back to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and hold a dumbbell in each hand.\n2. Bend your knees slightly and hinge forward at the hips, keeping your back straight.\n3. Bring your upper arms close to your sides, with your elbows bent at a 90-degree angle.\n4. Extend your arms straight back, squeezing your triceps at the top of the movement.\n5. Pause for a moment, then slowly lower the dumbbells back to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15 per arm'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Duỗi tay sau tạ đơn (kickback)' OR name_en = 'Dumbbell kickback' OR external_id = '0333');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0860', 'Kickback cáp', 'Cable kickback', 'Cable triceps kickback', 'STRENGTH', 'TRICEPS', 'ARMS', NULL, 'triceps', NULL,
    'Máy cáp', 'cable', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Duỗi tay sau ra sau với cáp thấp, giữ lực căng liên tục.', 'Targets the triceps; also works the shoulders. Equipment: cable.',
    '1. Đặt ròng rọc thấp, gập người khoảng 45 độ, một tay cầm tay cầm.\n2. Giữ cánh tay sát thân song song sàn.\n3. Duỗi cẳng tay ra sau tới khi thẳng.\n4. Trả về chậm.',
    '1. Đặt ròng rọc thấp, gập người khoảng 45 độ, một tay cầm tay cầm.\n2. Giữ cánh tay sát thân song song sàn.\n3. Duỗi cẳng tay ra sau tới khi thẳng.\n4. Trả về chậm.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Đung đưa cánh tay; đứng quá gần máy; giật dây.', @safe, @dose_strength, '3 x 12–15 mỗi tay', 'gv-0860', 'ADAPTED', 'APPROVED',
    '1. Stand facing a cable machine with your feet shoulder-width apart.\n2. Hold the cable handle with your right hand and step back to create tension in the cable.\n3. Bend your knees slightly and hinge forward at the hips, keeping your back straight.\n4. Keep your upper arm close to your body and your elbow bent at a 90-degree angle.\n5. Extend your forearm backward, straightening your arm fully.\n6. Pause for a moment, then slowly return to the starting position.\n7. Repeat for the desired number of repetitions, then switch sides.',
    '1. Stand facing a cable machine with your feet shoulder-width apart.\n2. Hold the cable handle with your right hand and step back to create tension in the cable.\n3. Bend your knees slightly and hinge forward at the hips, keeping your back straight.\n4. Keep your upper arm close to your body and your elbow bent at a 90-degree angle.\n5. Extend your forearm backward, straightening your arm fully.\n6. Pause for a moment, then slowly return to the starting position.\n7. Repeat for the desired number of repetitions, then switch sides.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15 per arm'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Kickback cáp' OR name_en = 'Cable kickback' OR external_id = '0860');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0207', 'Ép cáp tay ngửa', 'Cable reverse-grip pushdown', 'Reverse-grip triceps pushdown', 'STRENGTH', 'TRICEPS', 'ARMS', 'Cẳng tay', 'triceps', 'forearm',
    'Máy cáp', 'cable', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Ép cáp xuống với lòng bàn tay ngửa, nhấn vào đầu trong của tay sau.', 'Targets the triceps; also works the forearms. Equipment: cable.',
    '1. Đứng trước ròng rọc cao, nắm thanh ngửa tay rộng bằng vai.\n2. Khuỷu sát sườn, cẳng tay gần song song sàn.\n3. Ép thanh xuống tới khi tay duỗi hết.\n4. Trả lên chậm tới ngang ngực.',
    '1. Đứng trước ròng rọc cao, nắm thanh ngửa tay rộng bằng vai.\n2. Khuỷu sát sườn, cẳng tay gần song song sàn.\n3. Ép thanh xuống tới khi tay duỗi hết.\n4. Trả lên chậm tới ngang ngực.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Khuỷu rời thân; ngả người đè tạ; tạ quá nặng.', @safe, @dose_strength, '3 x 12–15', 'gv-0207', 'ADAPTED', 'APPROVED',
    '1. Attach a straight bar to a high pulley cable machine.\n2. Stand facing the machine with your feet shoulder-width apart.\n3. Grasp the bar with an underhand grip, palms facing up, and your hands shoulder-width apart.\n4. Keep your elbows close to your sides and your upper arms stationary throughout the exercise.\n5. Using your triceps, push the bar down until your arms are fully extended and your triceps are contracted.\n6. Pause for a moment, then slowly return the bar to the starting position.\n7. Repeat for the desired number of repetitions.',
    '1. Attach a straight bar to a high pulley cable machine.\n2. Stand facing the machine with your feet shoulder-width apart.\n3. Grasp the bar with an underhand grip, palms facing up, and your hands shoulder-width apart.\n4. Keep your elbows close to your sides and your upper arms stationary throughout the exercise.\n5. Using your triceps, push the bar down until your arms are fully extended and your triceps are contracted.\n6. Pause for a moment, then slowly return the bar to the starting position.\n7. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Ép cáp tay ngửa' OR name_en = 'Cable reverse-grip pushdown' OR external_id = '0207');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0814', 'Chống xà kép tay sau', 'Triceps dip', 'Triceps dip', 'STRENGTH', 'TRICEPS', 'ARMS', 'Ngực, Vai trước', 'triceps', 'chest,front-deltoids',
    'Xà kép', 'dip-bars', 'INTERMEDIATE', 'ANY', 'STRENGTH', 'STRENGTH', 'Chống xà kép với thân thẳng đứng để dồn lực vào tay sau.', 'Targets the triceps; also works the chest, shoulders. Equipment: body weight.',
    '1. Chống thẳng tay trên hai thanh xà, thân thẳng đứng.\n2. Gập khuỷu hạ người xuống tới khi cánh tay gần song song sàn.\n3. Giữ khuỷu đi về sau, không bè.\n4. Đẩy người lên tới khi tay duỗi.',
    '1. Chống thẳng tay trên hai thanh xà, thân thẳng đứng.\n2. Gập khuỷu hạ người xuống tới khi cánh tay gần song song sàn.\n3. Giữ khuỷu đi về sau, không bè.\n4. Đẩy người lên tới khi tay duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Hạ quá sâu gây đau vai; nghiêng người nhiều; đu chân.', @safe, @dose_strength, '3 x 6–12', 'gv-0814', 'ADAPTED', 'APPROVED',
    '1. Sit on the edge of a bench or chair with your hands gripping the edge, fingers pointing forward.\n2. Slide your butt off the bench, supporting your weight with your hands.\n3. Bend your elbows and lower your body towards the ground, keeping your back close to the bench.\n4. Pause for a moment at the bottom, then push yourself back up to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Sit on the edge of a bench or chair with your hands gripping the edge, fingers pointing forward.\n2. Slide your butt off the bench, supporting your weight with your hands.\n3. Bend your elbows and lower your body towards the ground, keeping your back close to the bench.\n4. Pause for a moment at the bottom, then push yourself back up to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 6–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chống xà kép tay sau' OR name_en = 'Triceps dip' OR external_id = '0814');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0351', 'Duỗi tay sau nằm tạ đơn', 'Dumbbell lying triceps extension', 'Lying dumbbell triceps extension', 'STRENGTH', 'TRICEPS', 'ARMS', NULL, 'triceps', NULL,
    'Tạ đơn, Ghế tập', 'dumbbell,bench', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Nằm trên ghế, hạ hai tạ đơn về hai bên đầu rồi duỗi thẳng tay, cô lập tay sau.', 'Targets the triceps; also works the shoulders. Equipment: dumbbell.',
    '1. Nằm ngửa, hai tạ đưa thẳng trên ngực, lòng bàn tay hướng vào nhau.\n2. Giữ cánh tay đứng yên, gập khuỷu hạ tạ về hai bên tai.\n3. Duỗi tay đưa tạ trở lại trên ngực.\n4. Lặp lại chậm rãi.',
    '1. Nằm ngửa, hai tạ đưa thẳng trên ngực, lòng bàn tay hướng vào nhau.\n2. Giữ cánh tay đứng yên, gập khuỷu hạ tạ về hai bên tai.\n3. Duỗi tay đưa tạ trở lại trên ngực.\n4. Lặp lại chậm rãi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Khuỷu bè ra; cánh tay đung đưa; hạ quá nhanh gần mặt.', @safe, @dose_strength, '3 x 10–12', 'gv-0351', 'ADAPTED', 'APPROVED',
    '1. Lie flat on a bench with a dumbbell in each hand, palms facing each other.\n2. Extend your arms straight up over your chest, keeping your elbows close to your body.\n3. Lower the dumbbells down towards your forehead, bending your elbows.\n4. Pause for a moment, then extend your arms back up to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Lie flat on a bench with a dumbbell in each hand, palms facing each other.\n2. Extend your arms straight up over your chest, keeping your elbows close to your body.\n3. Lower the dumbbells down towards your forehead, bending your elbows.\n4. Pause for a moment, then extend your arms back up to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Duỗi tay sau nằm tạ đơn' OR name_en = 'Dumbbell lying triceps extension' OR external_id = '0351');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0052', 'JM press', 'Barbell jm bench press', 'JM press, đẩy tay sau thanh đòn', 'STRENGTH', 'TRICEPS', 'ARMS', 'Ngực', 'triceps', 'chest',
    'Thanh đòn, Ghế tập', 'barbell,bench', 'ADVANCED', 'GYM', 'STRENGTH', 'STRENGTH', 'Kết hợp đẩy ngực tay hẹp và duỗi tay sau, phát triển sức mạnh tay sau cho bài đẩy.', 'Targets the triceps; also works the chest, shoulders. Equipment: barbell.',
    '1. Nằm ngửa, nắm thanh rộng bằng vai, thanh trên ngực.\n2. Hạ thanh về phía cằm trên bằng cách gập khuỷu, khuỷu hướng về chân.\n3. Dừng khi cẳng tay gần chạm bắp tay.\n4. Đẩy thanh trở lại vị trí đầu.',
    '1. Nằm ngửa, nắm thanh rộng bằng vai, thanh trên ngực.\n2. Hạ thanh về phía cằm trên bằng cách gập khuỷu, khuỷu hướng về chân.\n3. Dừng khi cẳng tay gần chạm bắp tay.\n4. Đẩy thanh trở lại vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Hạ thanh vào mặt; khuỷu bè; tập khi chưa quen kỹ thuật.', @safe, @dose_strength, '3 x 6–8', 'gv-0052', 'ADAPTED', 'APPROVED',
    '1. Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.\n2. Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.\n3. Lower the barbell to your chest, keeping your elbows tucked in close to your body.\n4. Push the barbell back up to the starting position, fully extending your arms.\n5. Repeat for the desired number of repetitions.',
    '1. Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.\n2. Grasp the barbell with an overhand grip, slightly wider than shoulder-width apart.\n3. Lower the barbell to your chest, keeping your elbows tucked in close to your body.\n4. Push the barbell back up to the starting position, fully extending your arms.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 6–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'JM press' OR name_en = 'Barbell jm bench press' OR external_id = '0052');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0436', 'Tate press', 'Dumbbell tate press', 'Dumbbell Tate press', 'STRENGTH', 'TRICEPS', 'ARMS', 'Ngực', 'triceps', 'chest',
    'Tạ đơn, Ghế tập', 'dumbbell,bench', 'INTERMEDIATE', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Nằm ghế, đưa hai đầu tạ chạm ngực bằng cách gập khuỷu ra ngoài, tập tay sau.', 'Targets the triceps; also works the shoulders. Equipment: dumbbell.',
    '1. Nằm ngửa, hai tạ đưa thẳng trên ngực, lòng bàn tay hướng về chân.\n2. Gập khuỷu sang hai bên để đầu tạ hạ chạm nhẹ ngực.\n3. Duỗi tay đẩy tạ trở lên.\n4. Giữ cánh tay ổn định.',
    '1. Nằm ngửa, hai tạ đưa thẳng trên ngực, lòng bàn tay hướng về chân.\n2. Gập khuỷu sang hai bên để đầu tạ hạ chạm nhẹ ngực.\n3. Duỗi tay đẩy tạ trở lên.\n4. Giữ cánh tay ổn định.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Tạ quá nặng; thả tạ đập vào ngực; vai nhấc khỏi ghế.', @safe, @dose_strength, '3 x 10–12', 'gv-0436', 'ADAPTED', 'APPROVED',
    '1. Sit on a flat bench with a dumbbell in each hand, palms facing each other.\n2. Raise the dumbbells to shoulder height, then rotate your wrists so that your palms are facing away from you.\n3. Press the dumbbells up until your arms are fully extended, then lower them back down to shoulder height.\n4. Rotate your wrists back to the starting position and repeat for the desired number of repetitions.',
    '1. Sit on a flat bench with a dumbbell in each hand, palms facing each other.\n2. Raise the dumbbells to shoulder height, then rotate your wrists so that your palms are facing away from you.\n3. Press the dumbbells up until your arms are fully extended, then lower them back down to shoulder height.\n4. Rotate your wrists back to the starting position and repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Tate press' OR name_en = 'Dumbbell tate press' OR external_id = '0436');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0607', 'Duỗi tay sau trên máy', 'Lever triceps extension', 'Machine triceps extension', 'STRENGTH', 'TRICEPS', 'ARMS', NULL, 'triceps', NULL,
    'Máy tập', 'machine', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Duỗi tay sau trên máy có đệm tì cánh tay, quỹ đạo cố định.', 'Targets the triceps; also works the shoulders. Equipment: leverage machine.',
    '1. Chỉnh ghế để khuỷu thẳng trục xoay của máy.\n2. Tì cánh tay lên đệm, nắm tay cầm.\n3. Duỗi tay tới khi thẳng, siết tay sau.\n4. Trả về chậm.',
    '1. Chỉnh ghế để khuỷu thẳng trục xoay của máy.\n2. Tì cánh tay lên đệm, nắm tay cầm.\n3. Duỗi tay tới khi thẳng, siết tay sau.\n4. Trả về chậm.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhấc khuỷu khỏi đệm; khoá khuỷu mạnh; thả tạ rơi.', @safe, @dose_strength, '3 x 12–15', 'gv-0607', 'ADAPTED', 'APPROVED',
    '1. Adjust the seat height and position yourself on the machine with your back against the pad.\n2. Grasp the handles with an overhand grip and fully extend your arms in front of you.\n3. Keeping your upper arms stationary, slowly lower the handles towards your forehead by bending your elbows.\n4. Pause for a moment at the bottom, then push the handles back up to the starting position by extending your arms.\n5. Repeat for the desired number of repetitions.',
    '1. Adjust the seat height and position yourself on the machine with your back against the pad.\n2. Grasp the handles with an overhand grip and fully extend your arms in front of you.\n3. Keeping your upper arms stationary, slowly lower the handles towards your forehead by bending your elbows.\n4. Pause for a moment at the bottom, then push the handles back up to the starting position by extending your arms.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Duỗi tay sau trên máy' OR name_en = 'Lever triceps extension' OR external_id = '0607');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0259', 'Hít đất tay hẹp', 'Close-grip push-up', 'Close-grip push-up', 'STRENGTH', 'TRICEPS', 'ARMS', 'Ngực, Vai trước', 'triceps', 'chest,front-deltoids',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'STRENGTH,ENDURANCE', 'STRENGTH', 'Hít đất với hai tay đặt rộng bằng vai hoặc hẹp hơn, khuỷu sát thân.', 'Targets the triceps; also works the chest, shoulders. Equipment: body weight.',
    '1. Chống hai tay dưới vai, hẹp hơn hít đất thường.\n2. Thân thẳng từ đầu tới gót.\n3. Hạ người, khuỷu đi sát sườn.\n4. Đẩy lên tới khi tay duỗi.',
    '1. Chống hai tay dưới vai, hẹp hơn hít đất thường.\n2. Thân thẳng từ đầu tới gót.\n3. Hạ người, khuỷu đi sát sườn.\n4. Đẩy lên tới khi tay duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Khuỷu bè; võng hông; cúi đầu.', @safe, @dose_strength, '3 x 10–15', 'gv-0259', 'ADAPTED', 'APPROVED',
    '1. Start in a high plank position with your hands placed close together, directly under your shoulders.\n2. Engage your core and lower your body towards the ground, keeping your elbows close to your sides.\n3. Push through your palms to extend your arms and return to the starting position.\n4. Repeat for the desired number of repetitions.',
    '1. Start in a high plank position with your hands placed close together, directly under your shoulders.\n2. Engage your core and lower your body towards the ground, keeping your elbows close to your sides.\n3. Push through your palms to extend your arms and return to the starting position.\n4. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hít đất tay hẹp' OR name_en = 'Close-grip push-up' OR external_id = '0259');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1723', 'Ép cáp tay sau một tay', 'Cable one arm tricep pushdown', 'Single-arm cable pushdown', 'STRENGTH', 'TRICEPS', 'ARMS', NULL, 'triceps', NULL,
    'Máy cáp', 'cable', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Ép cáp từng tay một để cân bằng sức mạnh hai bên tay sau.', 'Targets the triceps; also works the forearms. Equipment: cable.',
    '1. Đứng trước ròng rọc cao, một tay nắm tay cầm đơn.\n2. Khuỷu sát sườn.\n3. Ép tay cầm xuống tới khi tay duỗi hết.\n4. Trả lên chậm rồi đổi tay sau khi xong hiệp.',
    '1. Đứng trước ròng rọc cao, một tay nắm tay cầm đơn.\n2. Khuỷu sát sườn.\n3. Ép tay cầm xuống tới khi tay duỗi hết.\n4. Trả lên chậm rồi đổi tay sau khi xong hiệp.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Khuỷu rời thân; xoay người; giật dây.', @safe, @dose_strength, '3 x 12–15 mỗi tay', 'gv-1723', 'ADAPTED', 'APPROVED',
    '1. Stand facing a cable machine with a straight bar attachment at chest height.\n2. Grasp the bar with an overhand grip and step back to create tension in the cable.\n3. Position your feet shoulder-width apart and slightly bend your knees.\n4. Keep your back straight and core engaged throughout the exercise.\n5. Start with your arm fully extended and perpendicular to the floor.\n6. Keeping your upper arm stationary, exhale and push the bar down until your arm is fully extended.\n7. Pause for a moment, then inhale and slowly return to the starting position.\n8. Repeat for the desired number of repetitions, then switch arms.',
    '1. Stand facing a cable machine with a straight bar attachment at chest height.\n2. Grasp the bar with an overhand grip and step back to create tension in the cable.\n3. Position your feet shoulder-width apart and slightly bend your knees.\n4. Keep your back straight and core engaged throughout the exercise.\n5. Start with your arm fully extended and perpendicular to the floor.\n6. Keeping your upper arm stationary, exhale and push the bar down until your arm is fully extended.\n7. Pause for a moment, then inhale and slowly return to the starting position.\n8. Repeat for the desired number of repetitions, then switch arms.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15 per arm'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Ép cáp tay sau một tay' OR name_en = 'Cable one arm tricep pushdown' OR external_id = '1723');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0591', 'Chống đẩy tay sau trên máy', 'Lever overhand triceps dip', 'Machine triceps dip', 'STRENGTH', 'TRICEPS', 'ARMS', 'Ngực', 'triceps', 'chest',
    'Máy tập', 'machine', 'BEGINNER', 'GYM', 'STRENGTH,HYPERTROPHY', 'STRENGTH', 'Phiên bản chống xà trên máy ngồi, dễ chỉnh mức tạ, hợp người mới.', 'Targets the triceps; also works the chest, shoulders. Equipment: leverage machine.',
    '1. Ngồi vào máy, chỉnh ghế để tay cầm ngang hông.\n2. Nắm tay cầm, lưng tựa thẳng.\n3. Đẩy tay cầm xuống tới khi tay duỗi.\n4. Trả lên chậm.',
    '1. Ngồi vào máy, chỉnh ghế để tay cầm ngang hông.\n2. Nắm tay cầm, lưng tựa thẳng.\n3. Đẩy tay cầm xuống tới khi tay duỗi.\n4. Trả lên chậm.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhún vai; nghiêng người về trước; tạ quá nặng.', @safe, @dose_strength, '3 x 10–12', 'gv-0591', 'ADAPTED', 'APPROVED',
    '1. Adjust the machine to the appropriate height and secure your body in position.\n2. Grasp the handles with an overhand grip and position your body so that your arms are fully extended.\n3. Lower your body by bending your elbows, keeping your upper arms close to your sides.\n4. Continue lowering until your upper arms are parallel to the floor.\n5. Pause for a moment, then push yourself back up to the starting position by extending your elbows.\n6. Repeat for the desired number of repetitions.',
    '1. Adjust the machine to the appropriate height and secure your body in position.\n2. Grasp the handles with an overhand grip and position your body so that your arms are fully extended.\n3. Lower your body by bending your elbows, keeping your upper arms close to your sides.\n4. Continue lowering until your upper arms are parallel to the floor.\n5. Pause for a moment, then push yourself back up to the starting position by extending your elbows.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chống đẩy tay sau trên máy' OR name_en = 'Lever overhand triceps dip' OR external_id = '0591');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0001', 'Gập bụng 3/4', '3/4 sit-up', '3/4 sit-up', 'STRENGTH', 'CORE', 'CORE', 'Lưng dưới', 'abs', 'lower-back',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'STRENGTH,TONE', 'STRENGTH', 'Gập thân lên khoảng 45 độ rồi hạ chậm, tập bụng mà không cần ngồi dậy hết.', 'Targets the abs; also works the hip flexors, lower back. Equipment: body weight.',
    '1. Nằm ngửa, gập gối, bàn chân đặt sàn, hai tay đặt sau đầu.\n2. Siết bụng, cuộn thân trên lên tới khi thân nghiêng khoảng 45 độ.\n3. Dừng một nhịp ở đỉnh.\n4. Hạ chậm về sàn.',
    '1. Nằm ngửa, gập gối, bàn chân đặt sàn, hai tay đặt sau đầu.\n2. Siết bụng, cuộn thân trên lên tới khi thân nghiêng khoảng 45 độ.\n3. Dừng một nhịp ở đỉnh.\n4. Hạ chậm về sàn.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo cổ bằng tay; dùng đà; hạ rơi xuống sàn.', @safe, @dose_strength, '3 x 12–15', 'gv-0001', 'ADAPTED', 'APPROVED',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Place your hands behind your head with your elbows pointing outwards.\n3. Engaging your abs, slowly lift your upper body off the ground, curling forward until your torso is at a 45-degree angle.\n4. Pause for a moment at the top, then slowly lower your upper body back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Place your hands behind your head with your elbows pointing outwards.\n3. Engaging your abs, slowly lift your upper body off the ground, curling forward until your torso is at a 45-degree angle.\n4. Pause for a moment at the top, then slowly lower your upper body back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Gập bụng 3/4' OR name_en = '3/4 sit-up' OR external_id = '0001');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0006', 'Chạm gót luân phiên', 'Alternate heel touchers', 'Alternate heel touchers', 'STRENGTH', 'CORE', 'CORE', 'Bụng', 'obliques', 'abs',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'TONE,ENDURANCE', 'TONE', 'Nằm ngửa nhấc nhẹ vai, nghiêng thân sang hai bên để tay chạm gót, tập cơ liên sườn.', 'Targets the abs; also works the obliques. Equipment: body weight.',
    '1. Nằm ngửa, gập gối, bàn chân rộng hơn hông.\n2. Nhấc nhẹ đầu và vai khỏi sàn, hai tay duỗi dọc thân.\n3. Nghiêng thân sang phải để tay phải chạm gót phải.\n4. Trở về giữa rồi nghiêng sang trái.',
    '1. Nằm ngửa, gập gối, bàn chân rộng hơn hông.\n2. Nhấc nhẹ đầu và vai khỏi sàn, hai tay duỗi dọc thân.\n3. Nghiêng thân sang phải để tay phải chạm gót phải.\n4. Trở về giữa rồi nghiêng sang trái.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Hạ vai xuống sàn giữa các lần; kéo cổ; làm quá nhanh.', @safe, @dose_strength, '3 x 20 lần chạm', 'gv-0006', 'ADAPTED', 'APPROVED',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Extend your arms straight out to the sides, parallel to the ground.\n3. Engaging your abs, lift your shoulders off the ground and reach your right hand towards your right heel.\n4. Return to the starting position and repeat on the left side, reaching your left hand towards your left heel.\n5. Continue alternating sides for the desired number of repetitions.',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Extend your arms straight out to the sides, parallel to the ground.\n3. Engaging your abs, lift your shoulders off the ground and reach your right hand towards your right heel.\n4. Return to the starting position and repeat on the left side, reaching your left hand towards your left heel.\n5. Continue alternating sides for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 20 taps'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chạm gót luân phiên' OR name_en = 'Alternate heel touchers' OR external_id = '0006');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0262', 'Gập bụng chéo', 'Cross body crunch', 'Cross-body crunch', 'STRENGTH', 'CORE', 'CORE', NULL, 'abs,obliques', NULL,
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'TONE', 'TONE', 'Gập bụng đưa khuỷu chéo về phía gối đối diện, kết hợp bụng thẳng và liên sườn.', 'Targets the abs; also works the obliques. Equipment: body weight.',
    '1. Nằm ngửa, gập gối, tay đặt sau đầu.\n2. Cuộn thân lên, xoay khuỷu phải về phía gối trái.\n3. Siết bụng ở điểm gần nhất.\n4. Hạ chậm rồi đổi bên.',
    '1. Nằm ngửa, gập gối, tay đặt sau đầu.\n2. Cuộn thân lên, xoay khuỷu phải về phía gối trái.\n3. Siết bụng ở điểm gần nhất.\n4. Hạ chậm rồi đổi bên.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo đầu bằng tay; chỉ xoay khuỷu mà không xoay thân; dùng đà.', @safe, @dose_strength, '3 x 12 mỗi bên', 'gv-0262', 'ADAPTED', 'APPROVED',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Place your hands behind your head with your elbows pointing outwards.\n3. Engaging your abs, lift your upper body off the ground and twist to bring your right elbow towards your left knee.\n4. Pause for a moment at the top, then slowly lower your upper body back down to the starting position.\n5. Repeat on the other side, bringing your left elbow towards your right knee.\n6. Repeat for the desired number of repetitions.',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Place your hands behind your head with your elbows pointing outwards.\n3. Engaging your abs, lift your upper body off the ground and twist to bring your right elbow towards your left knee.\n4. Pause for a moment at the top, then slowly lower your upper body back down to the starting position.\n5. Repeat on the other side, bringing your left elbow towards your right knee.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Gập bụng chéo' OR name_en = 'Cross body crunch' OR external_id = '0262');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0277', 'Gập bụng ghế dốc', 'Decline crunch', 'Decline crunch', 'STRENGTH', 'CORE', 'CORE', NULL, 'abs', NULL,
    'Ghế tập', 'bench', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Gập bụng trên ghế dốc xuống, tăng độ khó so với gập bụng sàn.', 'Targets the abs; also works the hip flexors. Equipment: body weight.',
    '1. Móc chân vào đệm, nằm ngửa trên ghế dốc xuống.\n2. Tay đặt chéo ngực hoặc sau đầu.\n3. Cuộn thân trên lên, siết bụng.\n4. Hạ chậm, không để lưng chạm hẳn ghế.',
    '1. Móc chân vào đệm, nằm ngửa trên ghế dốc xuống.\n2. Tay đặt chéo ngực hoặc sau đầu.\n3. Cuộn thân trên lên, siết bụng.\n4. Hạ chậm, không để lưng chạm hẳn ghế.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo cổ; bật lên bằng đà; ghế quá dốc khi mới tập.', @safe, @dose_strength, '3 x 12–15', 'gv-0277', 'ADAPTED', 'APPROVED',
    '1. Lie on a decline bench with your feet secured and your knees bent at a 90-degree angle.\n2. Place your hands behind your head or across your chest.\n3. Engage your abs and lift your upper body towards your knees, curling your torso.\n4. Pause for a moment at the top, then slowly lower your upper body back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Lie on a decline bench with your feet secured and your knees bent at a 90-degree angle.\n2. Place your hands behind your head or across your chest.\n3. Engage your abs and lift your upper body towards your knees, curling your torso.\n4. Pause for a moment at the top, then slowly lower your upper body back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Gập bụng ghế dốc' OR name_en = 'Decline crunch' OR external_id = '0277');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0282', 'Ngồi dậy ghế dốc', 'Decline sit-up', 'Decline sit-up', 'STRENGTH', 'CORE', 'CORE', 'Liên sườn', 'abs', 'obliques',
    'Ghế tập', 'bench', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Ngồi dậy hết biên độ trên ghế dốc xuống, tập bụng và cơ gập hông.', 'Targets the abs; also works the hip flexors, lower back. Equipment: body weight.',
    '1. Móc chân vào đệm ghế dốc, nằm ngửa.\n2. Tay chéo ngực.\n3. Ngồi dậy tới khi thân gần thẳng đứng.\n4. Hạ chậm về vị trí đầu.',
    '1. Móc chân vào đệm ghế dốc, nằm ngửa.\n2. Tay chéo ngực.\n3. Ngồi dậy tới khi thân gần thẳng đứng.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Giật người; cong lưng dưới; thả rơi người.', @safe, @dose_strength, '3 x 10–12', 'gv-0282', 'ADAPTED', 'APPROVED',
    '1. Lie on a decline bench with your feet secured and your knees bent.\n2. Place your hands behind your head or across your chest.\n3. Engage your abs and lift your upper body off the bench, curling forward towards your knees.\n4. Pause for a moment at the top, then slowly lower your upper body back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Lie on a decline bench with your feet secured and your knees bent.\n2. Place your hands behind your head or across your chest.\n3. Engage your abs and lift your upper body off the bench, curling forward towards your knees.\n4. Pause for a moment at the top, then slowly lower your upper body back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Ngồi dậy ghế dốc' OR name_en = 'Decline sit-up' OR external_id = '0282');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0464', 'Plank xoay hông', 'Front plank with twist', 'Plank with hip twist', 'STRENGTH', 'CORE', 'CORE', 'Vai trước', 'obliques,abs', 'front-deltoids',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'TONE,ENDURANCE', 'TONE', 'Từ tư thế plank cẳng tay, xoay hông chạm nhẹ xuống sàn hai bên.', 'Targets the abs; also works the obliques, shoulders. Equipment: body weight.',
    '1. Vào tư thế plank chống cẳng tay, thân thẳng.\n2. Xoay hông sang phải, hạ hông gần sàn.\n3. Trở về giữa.\n4. Xoay sang trái và lặp lại.',
    '1. Vào tư thế plank chống cẳng tay, thân thẳng.\n2. Xoay hông sang phải, hạ hông gần sàn.\n3. Trở về giữa.\n4. Xoay sang trái và lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Võng lưng; nhô mông cao; xoay quá nhanh.', @safe, @dose_strength, '3 x 10 mỗi bên', 'gv-0464', 'ADAPTED', 'APPROVED',
    '1. Start in a high plank position with your hands directly under your shoulders and your body in a straight line from head to toe.\n2. Engage your core and glutes to maintain a stable position.\n3. Rotate your torso to the right, lifting your right arm and extending it towards the ceiling.\n4. Keep your hips and legs stable as you twist.\n5. Hold for a moment, then return to the starting position.\n6. Repeat the twist on the left side.\n7. Continue alternating sides for the desired number of repetitions.',
    '1. Start in a high plank position with your hands directly under your shoulders and your body in a straight line from head to toe.\n2. Engage your core and glutes to maintain a stable position.\n3. Rotate your torso to the right, lifting your right arm and extending it towards the ceiling.\n4. Keep your hips and legs stable as you twist.\n5. Hold for a moment, then return to the starting position.\n6. Repeat the twist on the left side.\n7. Continue alternating sides for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Plank xoay hông' OR name_en = 'Front plank with twist' OR external_id = '0464');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1761', 'Treo người nâng gối chéo', 'Hanging oblique knee raise', 'Hanging oblique knee raise', 'STRENGTH', 'CORE', 'CORE', 'Cẳng tay', 'obliques,abs', 'forearm',
    'Xà đơn', 'pullup-bar', 'INTERMEDIATE', 'ANY', 'STRENGTH', 'STRENGTH', 'Treo xà và nâng gối chéo về một bên, tập mạnh cơ liên sườn.', 'Targets the abs; also works the obliques. Equipment: body weight.',
    '1. Treo người trên xà, tay rộng bằng vai.\n2. Siết bụng, không đu người.\n3. Nâng gối lên và xoay chéo về phía vai phải.\n4. Hạ chậm, rồi nâng về bên trái.',
    '1. Treo người trên xà, tay rộng bằng vai.\n2. Siết bụng, không đu người.\n3. Nâng gối lên và xoay chéo về phía vai phải.\n4. Hạ chậm, rồi nâng về bên trái.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Đu người lấy đà; nâng gối thấp; buông người rơi.', @safe, @dose_strength, '3 x 8–12 mỗi bên', 'gv-1761', 'ADAPTED', 'APPROVED',
    '1. Hang from a pull-up bar with your arms fully extended and your palms facing away from you.\n2. Engage your core and lift your knees towards your chest, twisting your torso to the side as you do so.\n3. Pause for a moment at the top, then slowly lower your legs back down to the starting position.\n4. Repeat on the other side, twisting your torso in the opposite direction.\n5. Continue alternating sides for the desired number of repetitions.',
    '1. Hang from a pull-up bar with your arms fully extended and your palms facing away from you.\n2. Engage your core and lift your knees towards your chest, twisting your torso to the side as you do so.\n3. Pause for a moment at the top, then slowly lower your legs back down to the starting position.\n4. Repeat on the other side, twisting your torso in the opposite direction.\n5. Continue alternating sides for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–12 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Treo người nâng gối chéo' OR name_en = 'Hanging oblique knee raise' OR external_id = '1761');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0507', 'Gập bụng dao gập', 'Jackknife sit-up', 'Jackknife sit-up, V-up', 'STRENGTH', 'CORE', 'CORE', 'Liên sườn', 'abs', 'obliques',
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'STRENGTH', 'STRENGTH', 'Nâng đồng thời tay và chân thẳng để chạm nhau trên bụng như con dao gập.', 'Targets the abs; also works the hip flexors. Equipment: body weight.',
    '1. Nằm ngửa, tay duỗi qua đầu, chân thẳng.\n2. Siết bụng, nâng đồng thời thân trên và hai chân.\n3. Đưa tay chạm mũi chân ở đỉnh.\n4. Hạ chậm về vị trí đầu.',
    '1. Nằm ngửa, tay duỗi qua đầu, chân thẳng.\n2. Siết bụng, nâng đồng thời thân trên và hai chân.\n3. Đưa tay chạm mũi chân ở đỉnh.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gập gối nhiều; dùng đà; võng lưng dưới khi hạ.', @safe, @dose_strength, '3 x 10–12', 'gv-0507', 'ADAPTED', 'APPROVED',
    '1. Lie flat on your back with your legs extended and your arms overhead.\n2. Engage your core and lift your legs and upper body simultaneously, reaching your hands towards your toes.\n3. Pause for a moment at the top, then slowly lower your legs and upper body back down to the starting position.\n4. Repeat for the desired number of repetitions.',
    '1. Lie flat on your back with your legs extended and your arms overhead.\n2. Engage your core and lift your legs and upper body simultaneously, reaching your hands towards your toes.\n3. Pause for a moment at the top, then slowly lower your legs and upper body back down to the starting position.\n4. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Gập bụng dao gập' OR name_en = 'Jackknife sit-up' OR external_id = '0507');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0554', 'Cối xay gió tạ ấm', 'Kettlebell windmill', 'Kettlebell windmill', 'STRENGTH', 'CORE', 'CORE', 'Vai trước, Đùi sau, Mông', 'obliques', 'front-deltoids,hamstring,gluteal',
    'Tạ ấm', 'kettlebell', 'ADVANCED', 'ANY', 'MOBILITY,STRENGTH', 'MOBILITY', 'Giữ tạ ấm trên đầu và gập hông nghiêng thân xuống, tập cơ lõi, vai và độ linh hoạt hông.', 'Targets the abs; also works the obliques, shoulders. Equipment: kettlebell.',
    '1. Đẩy tạ ấm lên trên đầu bằng một tay, mắt nhìn tạ.\n2. Xoay hai bàn chân khoảng 45 độ về phía tay không cầm tạ.\n3. Đẩy hông sang bên tay cầm tạ, hạ tay kia dọc chân xuống sàn.\n4. Trở về đứng thẳng, tay cầm tạ luôn duỗi.',
    '1. Đẩy tạ ấm lên trên đầu bằng một tay, mắt nhìn tạ.\n2. Xoay hai bàn chân khoảng 45 độ về phía tay không cầm tạ.\n3. Đẩy hông sang bên tay cầm tạ, hạ tay kia dọc chân xuống sàn.\n4. Trở về đứng thẳng, tay cầm tạ luôn duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gập khuỷu tay cầm tạ; mắt rời tạ; cong lưng.', @safe, @dose_strength, '3 x 5 mỗi bên', 'gv-0554', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a kettlebell in your right hand overhead.\n2. Rotate your left foot outwards about 45 degrees and keep your right foot pointing forward.\n3. Bend your torso to the left side, keeping your right arm extended overhead and your eyes on the kettlebell.\n4. Lower your torso as far as you can while keeping your right arm straight and your left arm extended to the side.\n5. Pause for a moment, then return to the starting position by pushing through your right foot and engaging your obliques.\n6. Repeat for the desired number of repetitions, then switch sides.',
    '1. Stand with your feet shoulder-width apart, holding a kettlebell in your right hand overhead.\n2. Rotate your left foot outwards about 45 degrees and keep your right foot pointing forward.\n3. Bend your torso to the left side, keeping your right arm extended overhead and your eyes on the kettlebell.\n4. Lower your torso as far as you can while keeping your right arm straight and your left arm extended to the side.\n5. Pause for a moment, then return to the starting position by pushing through your right foot and engaging your obliques.\n6. Repeat for the desired number of repetitions, then switch sides.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 5 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cối xay gió tạ ấm' OR name_en = 'Kettlebell windmill' OR external_id = '0554');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0562', 'Landmine xoay 180', 'Landmine 180', 'Landmine 180', 'STRENGTH', 'CORE', 'CORE', 'Vai trước', 'obliques,abs', 'front-deltoids',
    'Thanh đòn', 'barbell', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Cầm đầu thanh đòn gắn landmine và xoay thân vẽ vòng cung từ hông này sang hông kia.', 'Targets the abs; also works the obliques, quadriceps. Equipment: barbell.',
    '1. Đứng rộng bằng vai, hai tay cầm đầu thanh trước ngực, tay duỗi.\n2. Xoay thân đưa thanh xuống phía hông phải.\n3. Xoay ngược đưa thanh qua trước mặt về hông trái.\n4. Tiếp tục luân phiên có kiểm soát.',
    '1. Đứng rộng bằng vai, hai tay cầm đầu thanh trước ngực, tay duỗi.\n2. Xoay thân đưa thanh xuống phía hông phải.\n3. Xoay ngược đưa thanh qua trước mặt về hông trái.\n4. Tiếp tục luân phiên có kiểm soát.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gập tay nhiều; xoay bằng tay thay vì thân; quá nhanh mất kiểm soát.', @safe, @dose_strength, '3 x 8 mỗi bên', 'gv-0562', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and hold the barbell with both hands in front of your chest.\n2. Bend your knees slightly and rotate your torso to the right, swinging the barbell down towards your right hip.\n3. As you reach the bottom of the movement, quickly reverse the motion and rotate your torso to the left, swinging the barbell up and across your body towards your left shoulder.\n4. Continue this twisting motion, alternating sides, for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and hold the barbell with both hands in front of your chest.\n2. Bend your knees slightly and rotate your torso to the right, swinging the barbell down towards your right hip.\n3. As you reach the bottom of the movement, quickly reverse the motion and rotate your torso to the left, swinging the barbell up and across your body towards your left shoulder.\n4. Continue this twisting motion, alternating sides, for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Landmine xoay 180' OR name_en = 'Landmine 180' OR external_id = '0562');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0635', 'Gập bụng liên sườn', 'Oblique crunches floor', 'Oblique crunch', 'STRENGTH', 'CORE', 'CORE', 'Bụng', 'obliques', 'abs',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'TONE', 'TONE', 'Nằm nghiêng gập thân trên sang bên, tập riêng cơ liên sườn.', 'Targets the abs; also works the obliques. Equipment: body weight.',
    '1. Nằm nghiêng một bên, gối hơi gập.\n2. Tay trên đặt sau đầu.\n3. Gập thân sang bên, kéo khuỷu về hông.\n4. Hạ chậm rồi đổi bên sau khi xong hiệp.',
    '1. Nằm nghiêng một bên, gối hơi gập.\n2. Tay trên đặt sau đầu.\n3. Gập thân sang bên, kéo khuỷu về hông.\n4. Hạ chậm rồi đổi bên sau khi xong hiệp.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo cổ; xoay thân ra trước; làm quá nhanh.', @safe, @dose_strength, '3 x 12–15 mỗi bên', 'gv-0635', 'ADAPTED', 'APPROVED',
    '1. Lie on your back with your knees bent and feet flat on the floor.\n2. Place your hands behind your head or cross them over your chest.\n3. Engage your abs and lift your shoulder blades off the floor, rotating your torso to one side.\n4. Pause for a moment, then lower your shoulder blades back down to the floor.\n5. Repeat on the other side, alternating sides with each repetition.',
    '1. Lie on your back with your knees bent and feet flat on the floor.\n2. Place your hands behind your head or cross them over your chest.\n3. Engage your abs and lift your shoulder blades off the floor, rotating your torso to one side.\n4. Pause for a moment, then lower your shoulder blades back down to the floor.\n5. Repeat on the other side, alternating sides with each repetition.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Gập bụng liên sườn' OR name_en = 'Oblique crunches floor' OR external_id = '0635');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3699', 'Plank chạm vai', 'Shoulder tap', 'Shoulder tap plank', 'STRENGTH', 'CORE', 'CORE', 'Vai trước, Tay sau', 'abs,obliques', 'front-deltoids,triceps',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'BALANCE,ENDURANCE', 'BALANCE', 'Giữ plank cao và luân phiên nhấc tay chạm vai đối diện mà không xoay hông.', 'Targets the abs; also works the shoulders, triceps. Equipment: body weight.',
    '1. Vào plank cao, tay dưới vai, chân rộng bằng hông.\n2. Siết bụng, mông.\n3. Nhấc tay phải chạm vai trái rồi đặt xuống.\n4. Đổi tay, giữ hông không lắc.',
    '1. Vào plank cao, tay dưới vai, chân rộng bằng hông.\n2. Siết bụng, mông.\n3. Nhấc tay phải chạm vai trái rồi đặt xuống.\n4. Đổi tay, giữ hông không lắc.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Lắc hông; nhô mông; làm quá nhanh.', @safe, @dose_strength, '3 x 20 lần chạm', 'gv-3699', 'ADAPTED', 'APPROVED',
    '1. Start in a high plank position with your hands directly under your shoulders and your body in a straight line.\n2. Engage your core and lift your right hand off the ground, reaching across to tap your left shoulder.\n3. Place your right hand back on the ground and repeat with your left hand tapping your right shoulder.\n4. Continue alternating shoulder taps while keeping your hips and torso stable.\n5. Repeat for the desired number of repetitions.',
    '1. Start in a high plank position with your hands directly under your shoulders and your body in a straight line.\n2. Engage your core and lift your right hand off the ground, reaching across to tap your left shoulder.\n3. Place your right hand back on the ground and repeat with your left hand tapping your right shoulder.\n4. Continue alternating shoulder taps while keeping your hips and torso stable.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 20 taps'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Plank chạm vai' OR name_en = 'Shoulder tap' OR external_id = '3699');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0871', 'Gập bụng co gối', 'Tuck crunch', 'Tuck crunch', 'STRENGTH', 'CORE', 'CORE', NULL, 'abs', NULL,
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'TONE', 'TONE', 'Đồng thời co gối và cuộn thân trên lại gần nhau, tập bụng toàn phần.', 'Targets the abs; also works the hip flexors. Equipment: body weight.',
    '1. Nằm ngửa, chân co lên, gối vuông góc.\n2. Tay đặt sau đầu.\n3. Cuộn thân lên và kéo gối về ngực cùng lúc.\n4. Duỗi về vị trí đầu.',
    '1. Nằm ngửa, chân co lên, gối vuông góc.\n2. Tay đặt sau đầu.\n3. Cuộn thân lên và kéo gối về ngực cùng lúc.\n4. Duỗi về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo cổ; võng lưng khi duỗi; dùng đà.', @safe, @dose_strength, '3 x 15', 'gv-0871', 'ADAPTED', 'APPROVED',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Place your hands behind your head with your elbows pointing outwards.\n3. Engaging your abs, lift your shoulder blades off the ground and bring your knees towards your chest, simultaneously curling your upper body towards your knees.\n4. Pause for a moment at the top, then slowly lower your shoulder blades and extend your legs back to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Place your hands behind your head with your elbows pointing outwards.\n3. Engaging your abs, lift your shoulder blades off the ground and bring your knees towards your chest, simultaneously curling your upper body towards your knees.\n4. Pause for a moment at the top, then slowly lower your shoulder blades and extend your legs back to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Gập bụng co gối' OR name_en = 'Tuck crunch' OR external_id = '0871');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3420', 'Ngồi chữ V', 'V-sit on floor', 'V-sit hold', 'STRENGTH', 'CORE', 'CORE', 'Đùi trước', 'abs', 'quadriceps',
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'STRENGTH,BALANCE', 'STRENGTH', 'Ngồi giữ thăng bằng trên mông với thân và chân tạo hình chữ V.', 'Targets the abs; also works the hip flexors. Equipment: body weight.',
    '1. Ngồi trên sàn, gập gối.\n2. Ngả nhẹ thân ra sau và nhấc hai chân khỏi sàn.\n3. Duỗi chân dần để tạo hình chữ V, tay duỗi ra trước.\n4. Giữ tư thế, thở đều.',
    '1. Ngồi trên sàn, gập gối.\n2. Ngả nhẹ thân ra sau và nhấc hai chân khỏi sàn.\n3. Duỗi chân dần để tạo hình chữ V, tay duỗi ra trước.\n4. Giữ tư thế, thở đều.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Cong lưng; nín thở; rụt cổ.', @safe, @dose_strength, '3 x giữ 20–30 giây', 'gv-3420', 'ADAPTED', 'APPROVED',
    '1. Sit on the floor with your legs extended in front of you.\n2. Lean back slightly and lift your legs off the ground, keeping them straight.\n3. Simultaneously, lift your upper body off the ground and reach your arms towards your legs.\n4. Hold this position for a few seconds, then slowly lower your upper body and legs back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Sit on the floor with your legs extended in front of you.\n2. Lean back slightly and lift your legs off the ground, keeping them straight.\n3. Simultaneously, lift your upper body off the ground and reach your arms towards your legs.\n4. Hold this position for a few seconds, then slowly lower your upper body and legs back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x hold 20–30 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Ngồi chữ V' OR name_en = 'V-sit on floor' OR external_id = '3420');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0846', 'Russian twist ôm tạ', 'Weighted russian twist', 'Weighted Russian twist', 'STRENGTH', 'CORE', 'CORE', 'Bụng', 'obliques', 'abs',
    'Bánh tạ', 'plate', 'INTERMEDIATE', 'ANY', 'STRENGTH', 'STRENGTH', 'Xoay thân sang hai bên khi ôm bánh tạ, tăng độ khó cho cơ liên sườn.', 'Targets the abs; also works the obliques, lower back. Equipment: weighted.',
    '1. Ngồi gập gối, ngả thân khoảng 45 độ, hai tay ôm bánh tạ trước ngực.\n2. Nhấc nhẹ chân khỏi sàn nếu đủ sức.\n3. Xoay thân đưa tạ sang bên phải.\n4. Xoay sang trái và lặp lại.',
    '1. Ngồi gập gối, ngả thân khoảng 45 độ, hai tay ôm bánh tạ trước ngực.\n2. Nhấc nhẹ chân khỏi sàn nếu đủ sức.\n3. Xoay thân đưa tạ sang bên phải.\n4. Xoay sang trái và lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Chỉ đưa tay mà không xoay thân; cong lưng; tạ quá nặng.', @safe, @dose_strength, '3 x 12 mỗi bên', 'gv-0846', 'ADAPTED', 'APPROVED',
    '1. Sit on the ground with your knees bent and your feet flat on the floor.\n2. Hold a weight or medicine ball with both hands in front of your chest.\n3. Lean back slightly, keeping your back straight and your core engaged.\n4. Slowly twist your torso to the right, bringing the weight or medicine ball towards the floor on your right side.\n5. Pause for a moment, then twist your torso to the left, bringing the weight or medicine ball towards the floor on your left side.\n6. Continue alternating sides for the desired number of repetitions.',
    '1. Sit on the ground with your knees bent and your feet flat on the floor.\n2. Hold a weight or medicine ball with both hands in front of your chest.\n3. Lean back slightly, keeping your back straight and your core engaged.\n4. Slowly twist your torso to the right, bringing the weight or medicine ball towards the floor on your right side.\n5. Pause for a moment, then twist your torso to the left, bringing the weight or medicine ball towards the floor on your left side.\n6. Continue alternating sides for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Russian twist ôm tạ' OR name_en = 'Weighted russian twist' OR external_id = '0846');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3419', 'L-sit', 'L-sit on floor', 'L-sit hold', 'STRENGTH', 'CORE', 'CORE', 'Tay sau, Đùi trước', 'abs', 'triceps,quadriceps',
    'Không dụng cụ', 'bodyweight', 'ADVANCED', 'ANY', 'STRENGTH', 'STRENGTH', 'Chống hai tay nâng người khỏi sàn, chân duỗi thẳng ra trước tạo hình chữ L.', 'Targets the abs; also works the hip flexors. Equipment: body weight.',
    '1. Ngồi duỗi chân, hai tay chống sàn cạnh hông.\n2. Đẩy tay xuống, nhấc mông khỏi sàn.\n3. Nâng hai chân thẳng song song sàn.\n4. Giữ tư thế, vai đẩy xuống.',
    '1. Ngồi duỗi chân, hai tay chống sàn cạnh hông.\n2. Đẩy tay xuống, nhấc mông khỏi sàn.\n3. Nâng hai chân thẳng song song sàn.\n4. Giữ tư thế, vai đẩy xuống.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhún vai; gập gối; nín thở.', @safe, @dose_strength, '3 x giữ 10–20 giây', 'gv-3419', 'ADAPTED', 'APPROVED',
    '1. Sit on the floor with your legs extended in front of you.\n2. Place your hands on the floor beside your hips, fingers pointing forward.\n3. Engage your core and lift your legs off the ground, keeping them straight.\n4. Try to bring your legs parallel to the floor, forming an ''L'' shape with your body.\n5. Hold this position for as long as you can.\n6. Slowly lower your legs back down to the starting position.\n7. Repeat for the desired number of repetitions.',
    '1. Sit on the floor with your legs extended in front of you.\n2. Place your hands on the floor beside your hips, fingers pointing forward.\n3. Engage your core and lift your legs off the ground, keeping them straight.\n4. Try to bring your legs parallel to the floor, forming an ''L'' shape with your body.\n5. Hold this position for as long as you can.\n6. Slowly lower your legs back down to the starting position.\n7. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x hold 10–20 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'L-sit' OR name_en = 'L-sit on floor' OR external_id = '3419');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '2963', 'Nâng chân ghế đội trưởng', 'Captains chair straight leg raise', 'Captain''s chair leg raise', 'STRENGTH', 'CORE', 'CORE', 'Liên sườn', 'abs', 'obliques',
    'Máy tập', 'machine', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Tì cẳng tay trên khung ghế đội trưởng và nâng hai chân thẳng, tập bụng dưới.', 'Targets the abs; also works the hip flexors. Equipment: body weight.',
    '1. Đứng lên khung, lưng tựa đệm, tì cẳng tay lên tay đỡ.\n2. Siết bụng, chân buông thẳng.\n3. Nâng hai chân thẳng lên tới ngang hông.\n4. Hạ chậm, không đung đưa.',
    '1. Đứng lên khung, lưng tựa đệm, tì cẳng tay lên tay đỡ.\n2. Siết bụng, chân buông thẳng.\n3. Nâng hai chân thẳng lên tới ngang hông.\n4. Hạ chậm, không đung đưa.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Đu chân lấy đà; ưỡn lưng rời đệm; hạ chân rơi.', @safe, @dose_strength, '3 x 10–15', 'gv-2963', 'ADAPTED', 'APPROVED',
    '1. Sit on the captain''s chair with your back against the backrest and your forearms resting on the arm pads.\n2. Keep your upper body stable and your back straight.\n3. Engage your abs and lift your legs up in front of you, keeping them straight.\n4. Continue lifting until your legs are parallel to the ground or as high as you can comfortably go.\n5. Pause for a moment at the top, then slowly lower your legs back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Sit on the captain''s chair with your back against the backrest and your forearms resting on the arm pads.\n2. Keep your upper body stable and your back straight.\n3. Engage your abs and lift your legs up in front of you, keeping them straight.\n4. Continue lifting until your legs are parallel to the ground or as high as you can comfortably go.\n5. Pause for a moment at the top, then slowly lower your legs back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nâng chân ghế đội trưởng' OR name_en = 'Captains chair straight leg raise' OR external_id = '2963');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0046', 'Hack squat thanh đòn', 'Barbell hack squat', 'Barbell hack squat', 'STRENGTH', 'LEGS', 'LEGS', 'Mông, Đùi sau, Cẳng tay', 'quadriceps', 'gluteal,hamstring,forearm',
    'Thanh đòn', 'barbell', 'ADVANCED', 'GYM', 'STRENGTH', 'STRENGTH', 'Squat với thanh đòn cầm sau đùi, thân thẳng đứng, nhấn mạnh vào đùi trước.', 'Targets the glutes; also works the quadriceps, hamstrings, calves. Equipment: barbell.',
    '1. Đứng trước thanh đòn đặt sàn sau gót, ngồi xuống nắm thanh sau lưng.\n2. Giữ ngực mở, lưng thẳng.\n3. Đứng lên kéo thanh dọc mặt sau đùi.\n4. Hạ chậm về vị trí đầu.',
    '1. Đứng trước thanh đòn đặt sàn sau gót, ngồi xuống nắm thanh sau lưng.\n2. Giữ ngực mở, lưng thẳng.\n3. Đứng lên kéo thanh dọc mặt sau đùi.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Cong lưng; thanh cọ mạnh vào bắp chân; tạ quá nặng.', @safe, @dose_strength, '4 x 6–8', 'gv-0046', 'ADAPTED', 'APPROVED',
    '1. Start by standing with your feet shoulder-width apart and your toes slightly turned out.\n2. Hold the barbell behind your legs, resting it on your upper thighs.\n3. Lower your body by bending at the knees and hips, keeping your back straight and your chest up.\n4. Continue lowering until your thighs are parallel to the ground, or as low as you can comfortably go.\n5. Pause for a moment, then push through your heels to return to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Start by standing with your feet shoulder-width apart and your toes slightly turned out.\n2. Hold the barbell behind your legs, resting it on your upper thighs.\n3. Lower your body by bending at the knees and hips, keeping your back straight and your chest up.\n4. Continue lowering until your thighs are parallel to the ground, or as low as you can comfortably go.\n5. Pause for a moment, then push through your heels to return to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 6–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hack squat thanh đòn' OR name_en = 'Barbell hack squat' OR external_id = '0046');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0069', 'Squat thanh đòn qua đầu', 'Barbell overhead squat', 'Overhead squat', 'STRENGTH', 'LEGS', 'LEGS', 'Vai trước, Bụng, Lưng trên & xô', 'quadriceps,gluteal', 'front-deltoids,abs,upper-back',
    'Thanh đòn', 'barbell', 'ADVANCED', 'GYM', 'STRENGTH,MOBILITY', 'STRENGTH', 'Squat sâu khi giữ thanh đòn thẳng tay trên đầu, đòi hỏi độ linh hoạt và ổn định cao.', 'Targets the quads; also works the glutes, hamstrings, calves, core. Equipment: barbell.',
    '1. Giữ thanh trên đầu với tay nắm rộng, khuỷu khoá.\n2. Đứng rộng hơn vai, mũi chân hơi mở.\n3. Ngồi xuống sâu, giữ thanh ngay trên giữa bàn chân.\n4. Đứng lên, tay luôn duỗi.',
    '1. Giữ thanh trên đầu với tay nắm rộng, khuỷu khoá.\n2. Đứng rộng hơn vai, mũi chân hơi mở.\n3. Ngồi xuống sâu, giữ thanh ngay trên giữa bàn chân.\n4. Đứng lên, tay luôn duỗi.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Thanh trôi ra trước; gót nhấc; tập nặng khi chưa đủ linh hoạt.', @safe, @dose_strength, '4 x 3–5', 'gv-0069', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and toes slightly turned out.\n2. Hold the barbell with a wide grip, positioning it overhead with your arms fully extended.\n3. Engage your core and lower your body down into a squat position, keeping your chest up and knees tracking over your toes.\n4. Pause for a moment at the bottom, then push through your heels to return to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and toes slightly turned out.\n2. Hold the barbell with a wide grip, positioning it overhead with your arms fully extended.\n3. Engage your core and lower your body down into a squat position, keeping your chest up and knees tracking over your toes.\n4. Pause for a moment at the bottom, then push through your heels to return to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 3–5'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Squat thanh đòn qua đầu' OR name_en = 'Barbell overhead squat' OR external_id = '0069');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0127', 'Zercher squat', 'Barbell zercher squat', 'Zercher squat', 'STRENGTH', 'LEGS', 'LEGS', 'Bụng, Lưng trên & xô, Tay trước', 'quadriceps,gluteal', 'abs,upper-back,biceps',
    'Thanh đòn', 'barbell', 'ADVANCED', 'GYM', 'STRENGTH', 'STRENGTH', 'Squat với thanh đòn ôm trong khuỷu tay trước bụng, tăng việc cho cơ lõi và lưng trên.', 'Targets the glutes; also works the quadriceps, hamstrings, calves, core. Equipment: barbell.',
    '1. Đặt thanh trên giá ngang bụng, ôm thanh vào nếp khuỷu.\n2. Lùi ra, đứng rộng bằng vai.\n3. Ngồi xuống giữ ngực mở.\n4. Đứng lên bằng cách đạp cả bàn chân.',
    '1. Đặt thanh trên giá ngang bụng, ôm thanh vào nếp khuỷu.\n2. Lùi ra, đứng rộng bằng vai.\n3. Ngồi xuống giữ ngực mở.\n4. Đứng lên bằng cách đạp cả bàn chân.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Cong lưng trên; khuỷu đau do không lót; nghiêng người quá nhiều.', @safe, @dose_strength, '4 x 5–8', 'gv-0127', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and toes slightly turned out.\n2. Hold the barbell in the crooks of your elbows, with your hands gripping the bar for stability.\n3. Engage your core and keep your chest lifted as you lower your hips back and down into a squat position.\n4. Keep your knees in line with your toes and your weight in your heels.\n5. Pause for a moment at the bottom of the squat, then push through your heels to return to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and toes slightly turned out.\n2. Hold the barbell in the crooks of your elbows, with your hands gripping the bar for stability.\n3. Engage your core and keep your chest lifted as you lower your hips back and down into a squat position.\n4. Keep your knees in line with your toes and your weight in your heels.\n5. Pause for a moment at the bottom of the squat, then push through your heels to return to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 5–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Zercher squat' OR name_en = 'Barbell zercher squat' OR external_id = '0127');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0054', 'Chùng chân thanh đòn', 'Barbell lunge', 'Barbell lunge', 'STRENGTH', 'LEGS', 'LEGS', 'Đùi sau, Bắp chân, Bụng', 'quadriceps,gluteal', 'hamstring,calves,abs',
    'Thanh đòn', 'barbell', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Bước chùng chân về trước với thanh đòn trên vai.', 'Targets the glutes; also works the quadriceps, hamstrings, calves. Equipment: barbell.',
    '1. Đặt thanh trên lưng trên, đứng thẳng.\n2. Bước một chân lên trước.\n3. Hạ người tới khi hai gối khoảng 90 độ.\n4. Đẩy chân trước về vị trí đầu rồi đổi chân.',
    '1. Đặt thanh trên lưng trên, đứng thẳng.\n2. Bước một chân lên trước.\n3. Hạ người tới khi hai gối khoảng 90 độ.\n4. Đẩy chân trước về vị trí đầu rồi đổi chân.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gối trước đổ vào trong; bước quá ngắn; nghiêng thân.', @safe, @dose_strength, '3 x 8 mỗi chân', 'gv-0054', 'ADAPTED', 'APPROVED',
    '1. Start by standing with your feet shoulder-width apart and a barbell resting on your upper back.\n2. Take a step forward with your right foot, keeping your torso upright.\n3. Lower your body by bending your right knee until your thigh is parallel to the ground.\n4. Push through your right heel to return to the starting position.\n5. Repeat with your left leg, alternating legs for the desired number of repetitions.',
    '1. Start by standing with your feet shoulder-width apart and a barbell resting on your upper back.\n2. Take a step forward with your right foot, keeping your torso upright.\n3. Lower your body by bending your right knee until your thigh is parallel to the ground.\n4. Push through your right heel to return to the starting position.\n5. Repeat with your left leg, alternating legs for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chùng chân thanh đòn' OR name_en = 'Barbell lunge' OR external_id = '0054');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1410', 'Chùng chân ngang thanh đòn', 'Barbell lateral lunge', 'Barbell lateral lunge', 'STRENGTH', 'LEGS', 'LEGS', 'Mông, Đùi sau', 'quadriceps,adductor', 'gluteal,hamstring',
    'Thanh đòn', 'barbell', 'INTERMEDIATE', 'GYM', 'STRENGTH,MOBILITY', 'STRENGTH', 'Bước ngang và ngồi xuống một bên với thanh đòn, tập đùi trước và đùi trong.', 'Targets the glutes; also works the quadriceps, hamstrings, calves. Equipment: barbell.',
    '1. Đặt thanh trên lưng trên, đứng chụm chân.\n2. Bước rộng sang một bên, đẩy hông ra sau ngồi xuống chân bước.\n3. Chân còn lại duỗi thẳng.\n4. Đẩy về vị trí đầu rồi đổi bên.',
    '1. Đặt thanh trên lưng trên, đứng chụm chân.\n2. Bước rộng sang một bên, đẩy hông ra sau ngồi xuống chân bước.\n3. Chân còn lại duỗi thẳng.\n4. Đẩy về vị trí đầu rồi đổi bên.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gối đổ vào trong; gót nhấc; cong lưng.', @safe, @dose_strength, '3 x 8 mỗi bên', 'gv-1410', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a barbell across your upper back.\n2. Take a big step to the side with your right foot, keeping your left foot planted.\n3. Bend your right knee and lower your body down into a lunge position, keeping your left leg straight.\n4. Push off with your right foot and return to the starting position.\n5. Repeat on the other side, stepping with your left foot.',
    '1. Stand with your feet shoulder-width apart, holding a barbell across your upper back.\n2. Take a big step to the side with your right foot, keeping your left foot planted.\n3. Bend your right knee and lower your body down into a lunge position, keeping your left leg straight.\n4. Push off with your right foot and return to the starting position.\n5. Repeat on the other side, stepping with your left foot.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chùng chân ngang thanh đòn' OR name_en = 'Barbell lateral lunge' OR external_id = '1410');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0336', 'Chùng chân tạ đơn', 'Dumbbell lunge', 'Dumbbell lunge', 'STRENGTH', 'LEGS', 'LEGS', 'Đùi sau, Bắp chân', 'quadriceps,gluteal', 'hamstring,calves',
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'STRENGTH,TONE', 'STRENGTH', 'Chùng chân về trước với hai tạ đơn hai bên, phổ biến để tập đùi và mông.', 'Targets the glutes; also works the quadriceps, hamstrings, calves. Equipment: dumbbell.',
    '1. Đứng thẳng, hai tạ buông hai bên.\n2. Bước một chân lên trước.\n3. Hạ người tới khi gối sau gần chạm sàn.\n4. Đẩy chân trước về vị trí đầu rồi đổi chân.',
    '1. Đứng thẳng, hai tạ buông hai bên.\n2. Bước một chân lên trước.\n3. Hạ người tới khi gối sau gần chạm sàn.\n4. Đẩy chân trước về vị trí đầu rồi đổi chân.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gối trước vượt quá xa mũi chân; mất thăng bằng; thân đổ về trước.', @safe, @dose_strength, '3 x 10 mỗi chân', 'gv-0336', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand.\n2. Take a step forward with your right foot, lowering your body into a lunge position.\n3. Keep your back straight and your chest up as you lower your body.\n4. Push through your right heel to return to the starting position.\n5. Repeat with your left leg.\n6. Alternate legs for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand.\n2. Take a step forward with your right foot, lowering your body into a lunge position.\n3. Keep your back straight and your chest up as you lower your body.\n4. Push through your right heel to return to the starting position.\n5. Repeat with your left leg.\n6. Alternate legs for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chùng chân tạ đơn' OR name_en = 'Dumbbell lunge' OR external_id = '0336');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0413', 'Squat tạ đơn', 'Dumbbell squat', 'Dumbbell squat', 'STRENGTH', 'LEGS', 'LEGS', 'Đùi sau, Bắp chân', 'quadriceps,gluteal', 'hamstring,calves',
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'STRENGTH,TONE', 'STRENGTH', 'Squat với hai tạ đơn hai bên thân, dễ học trước khi chuyển sang thanh đòn.', 'Targets the glutes; also works the quadriceps, hamstrings, calves. Equipment: dumbbell.',
    '1. Đứng rộng bằng vai, hai tạ buông hai bên.\n2. Đẩy hông ra sau, gập gối ngồi xuống.\n3. Hạ tới khi đùi gần song song sàn.\n4. Đạp cả bàn chân đứng lên.',
    '1. Đứng rộng bằng vai, hai tạ buông hai bên.\n2. Đẩy hông ra sau, gập gối ngồi xuống.\n3. Hạ tới khi đùi gần song song sàn.\n4. Đạp cả bàn chân đứng lên.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gối chụm vào; gót nhấc; cong lưng.', @safe, @dose_strength, '3 x 10–12', 'gv-0413', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand at your sides.\n2. Keeping your chest up and core engaged, lower your body down by bending at the knees and hips, as if sitting back into a chair.\n3. Continue lowering until your thighs are parallel to the ground, or as low as you can comfortably go.\n4. Pause for a moment at the bottom, then push through your heels to return to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand at your sides.\n2. Keeping your chest up and core engaged, lower your body down by bending at the knees and hips, as if sitting back into a chair.\n3. Continue lowering until your thighs are parallel to the ground, or as low as you can comfortably go.\n4. Pause for a moment at the bottom, then push through your heels to return to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Squat tạ đơn' OR name_en = 'Dumbbell squat' OR external_id = '0413');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1459', 'Romanian deadlift tạ đơn', 'Dumbbell romanian deadlift', 'Dumbbell Romanian deadlift', 'STRENGTH', 'LEGS', 'LEGS', 'Lưng dưới, Cẳng tay', 'hamstring,gluteal', 'lower-back,forearm',
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'STRENGTH', 'STRENGTH', 'Gập hông với hai tạ đơn trượt dọc chân, tập đùi sau và mông.', 'Targets the glutes; also works the hamstrings, lower back. Equipment: dumbbell.',
    '1. Đứng rộng bằng hông, hai tạ trước đùi.\n2. Hơi chùng gối, đẩy hông ra sau.\n3. Hạ tạ dọc chân tới giữa cẳng chân, lưng thẳng.\n4. Siết mông đẩy hông về trước để đứng lên.',
    '1. Đứng rộng bằng hông, hai tạ trước đùi.\n2. Hơi chùng gối, đẩy hông ra sau.\n3. Hạ tạ dọc chân tới giữa cẳng chân, lưng thẳng.\n4. Siết mông đẩy hông về trước để đứng lên.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Cong lưng; gập gối nhiều như squat; tạ xa chân.', @safe, @dose_strength, '3 x 10–12', 'gv-1459', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand with an overhand grip.\n2. Keeping your back straight and your core engaged, hinge at the hips and lower the dumbbells towards the ground, allowing your knees to bend slightly.\n3. Lower the dumbbells until you feel a stretch in your hamstrings, then push through your heels and engage your glutes to return to the starting position.\n4. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in each hand with an overhand grip.\n2. Keeping your back straight and your core engaged, hinge at the hips and lower the dumbbells towards the ground, allowing your knees to bend slightly.\n3. Lower the dumbbells until you feel a stretch in your hamstrings, then push through your heels and engage your glutes to return to the starting position.\n4. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Romanian deadlift tạ đơn' OR name_en = 'Dumbbell romanian deadlift' OR external_id = '1459');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1757', 'Deadlift một chân tạ đơn', 'Dumbbell single leg deadlift', 'Single-leg dumbbell deadlift', 'STRENGTH', 'LEGS', 'LEGS', 'Lưng dưới, Bụng', 'hamstring,gluteal', 'lower-back,abs',
    'Tạ đơn', 'dumbbell', 'INTERMEDIATE', 'ANY', 'STRENGTH,BALANCE', 'STRENGTH', 'Gập hông trên một chân, tập đùi sau, mông và thăng bằng.', 'Targets the glutes; also works the hamstrings, lower back. Equipment: dumbbell.',
    '1. Đứng trên một chân, tay đối diện cầm tạ.\n2. Gập hông, chân kia duỗi ra sau thành một đường với thân.\n3. Hạ tạ xuống gần sàn, hông giữ vuông.\n4. Trở về đứng thẳng.',
    '1. Đứng trên một chân, tay đối diện cầm tạ.\n2. Gập hông, chân kia duỗi ra sau thành một đường với thân.\n3. Hạ tạ xuống gần sàn, hông giữ vuông.\n4. Trở về đứng thẳng.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Xoay hông mở ra; cong lưng; mất thăng bằng do làm nhanh.', @safe, @dose_strength, '3 x 8 mỗi chân', 'gv-1757', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet hip-width apart, holding a dumbbell in your right hand.\n2. Shift your weight onto your left leg and lift your right foot slightly off the ground.\n3. Keeping your back straight, hinge forward at the hips and lower the dumbbell towards the ground.\n4. At the same time, extend your right leg straight behind you, maintaining a slight bend in your left knee.\n5. Lower the dumbbell until your torso and right leg are parallel to the ground.\n6. Pause for a moment, then engage your glutes and hamstrings to return to the starting position.\n7. Repeat for the desired number of repetitions, then switch sides.',
    '1. Stand with your feet hip-width apart, holding a dumbbell in your right hand.\n2. Shift your weight onto your left leg and lift your right foot slightly off the ground.\n3. Keeping your back straight, hinge forward at the hips and lower the dumbbell towards the ground.\n4. At the same time, extend your right leg straight behind you, maintaining a slight bend in your left knee.\n5. Lower the dumbbell until your torso and right leg are parallel to the ground.\n6. Pause for a moment, then engage your glutes and hamstrings to return to the starting position.\n7. Repeat for the desired number of repetitions, then switch sides.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Deadlift một chân tạ đơn' OR name_en = 'Dumbbell single leg deadlift' OR external_id = '1757');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0514', 'Squat bật nhảy', 'Jump squat', 'Jump squat', 'STRENGTH', 'LEGS', 'LEGS', 'Bắp chân, Đùi sau', 'quadriceps,gluteal', 'calves,hamstring',
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'ENDURANCE,FAT_LOSS', 'ENDURANCE', 'Squat rồi bật nhảy lên cao, tăng sức bật và tiêu hao năng lượng.', 'Targets the glutes; also works the quadriceps, hamstrings, calves. Equipment: body weight.',
    '1. Đứng rộng bằng vai.\n2. Ngồi xuống squat, tay đưa ra sau.\n3. Bật mạnh lên cao, vung tay lên.\n4. Tiếp đất mềm bằng nửa trước bàn chân và chuyển ngay vào lần sau.',
    '1. Đứng rộng bằng vai.\n2. Ngồi xuống squat, tay đưa ra sau.\n3. Bật mạnh lên cao, vung tay lên.\n4. Tiếp đất mềm bằng nửa trước bàn chân và chuyển ngay vào lần sau.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Tiếp đất gối duỗi cứng; gối chụm; ngồi quá nông.', @safe, @dose_strength, '3 x 10–12', 'gv-0514', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart.\n2. Lower your body into a squat position by bending your knees and pushing your hips back.\n3. Jump explosively off the ground, extending your hips, knees, and ankles.\n4. While in mid-air, quickly bring your arms forward for balance.\n5. Land softly on the balls of your feet and immediately go into the next repetition.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart.\n2. Lower your body into a squat position by bending your knees and pushing your hips back.\n3. Jump explosively off the ground, extending your hips, knees, and ankles.\n4. While in mid-air, quickly bring your arms forward for balance.\n5. Land softly on the balls of your feet and immediately go into the next repetition.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Squat bật nhảy' OR name_en = 'Jump squat' OR external_id = '0514');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1476', 'Pistol squat', 'One leg squat', 'Single-leg squat, pistol squat', 'STRENGTH', 'LEGS', 'LEGS', 'Bụng, Bắp chân', 'quadriceps,gluteal', 'abs,calves',
    'Không dụng cụ', 'bodyweight', 'ADVANCED', 'ANY', 'STRENGTH,BALANCE', 'STRENGTH', 'Squat sâu trên một chân, chân kia duỗi ra trước, đòi hỏi sức mạnh và thăng bằng.', 'Targets the glutes; also works the quadriceps, hamstrings, calves. Equipment: body weight.',
    '1. Đứng trên một chân, chân kia duỗi ra trước.\n2. Tay đưa ra trước giữ thăng bằng.\n3. Ngồi xuống chậm sâu nhất có thể.\n4. Đạp chân trụ đứng lên.',
    '1. Đứng trên một chân, chân kia duỗi ra trước.\n2. Tay đưa ra trước giữ thăng bằng.\n3. Ngồi xuống chậm sâu nhất có thể.\n4. Đạp chân trụ đứng lên.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gót nhấc; gối đổ vào; ngã ngồi rơi.', @safe, @dose_strength, '3 x 3–6 mỗi chân', 'gv-1476', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart.\n2. Extend one leg forward, keeping it off the ground.\n3. Bend your standing leg and lower your body down as if sitting back into a chair.\n4. Keep your chest up and your back straight.\n5. Push through your heel to return to the starting position.\n6. Repeat with the other leg.',
    '1. Stand with your feet shoulder-width apart.\n2. Extend one leg forward, keeping it off the ground.\n3. Bend your standing leg and lower your body down as if sitting back into a chair.\n4. Keep your chest up and your back straight.\n5. Push through your heel to return to the starting position.\n6. Repeat with the other leg.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 3–6 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pistol squat' OR name_en = 'One leg squat' OR external_id = '1476');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1489', 'Sissy squat', 'Sissy squat', 'Sissy squat', 'STRENGTH', 'LEGS', 'LEGS', 'Bụng', 'quadriceps', 'abs',
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'HYPERTROPHY', 'HYPERTROPHY', 'Ngả thân ra sau, đẩy gối về trước để hạ người, cô lập đùi trước.', 'Targets the quads; also works the calves, glutes. Equipment: body weight.',
    '1. Đứng rộng bằng hông, một tay vịn vật chắc.\n2. Nhón gót, đẩy gối về trước và ngả thân ra sau.\n3. Hạ người tới mức đùi trước căng.\n4. Siết đùi trước đưa người trở lên.',
    '1. Đứng rộng bằng hông, một tay vịn vật chắc.\n2. Nhón gót, đẩy gối về trước và ngả thân ra sau.\n3. Hạ người tới mức đùi trước căng.\n4. Siết đùi trước đưa người trở lên.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gập hông; hạ quá sâu khi gối yếu; không vịn khi mới tập.', @safe, @dose_strength, '3 x 10–12', 'gv-1489', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and your toes pointing slightly outward.\n2. Hold onto a stable object for balance if needed.\n3. Slowly lower your body by bending your knees and leaning back, keeping your torso upright.\n4. Continue lowering until your thighs are parallel to the ground or as far as you can comfortably go.\n5. Pause for a moment, then push through your heels to return to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and your toes pointing slightly outward.\n2. Hold onto a stable object for balance if needed.\n3. Slowly lower your body by bending your knees and leaning back, keeping your torso upright.\n4. Continue lowering until your thighs are parallel to the ground or as far as you can comfortably go.\n5. Pause for a moment, then push through your heels to return to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Sissy squat' OR name_en = 'Sissy squat' OR external_id = '1489');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0795', 'Cuốn đùi sau đứng một chân', 'Standing single leg curl', 'Standing single-leg curl', 'STRENGTH', 'LEGS', 'LEGS', 'Bắp chân', 'hamstring', 'calves',
    'Máy tập', 'machine', 'BEGINNER', 'GYM', 'HYPERTROPHY', 'HYPERTROPHY', 'Cuốn đùi sau từng chân trên máy đứng, cô lập đùi sau.', 'Targets the hamstrings; also works the glutes. Equipment: body weight.',
    '1. Đứng vào máy, đệm tì ngay trên gót.\n2. Tay nắm tay cầm, hông tựa đệm.\n3. Cuốn gót về phía mông.\n4. Hạ chậm rồi đổi chân sau khi xong hiệp.',
    '1. Đứng vào máy, đệm tì ngay trên gót.\n2. Tay nắm tay cầm, hông tựa đệm.\n3. Cuốn gót về phía mông.\n4. Hạ chậm rồi đổi chân sau khi xong hiệp.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nhấc hông; giật chân; thả tạ rơi.', @safe, @dose_strength, '3 x 10–12 mỗi chân', 'gv-0795', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet hip-width apart and your hands on your hips.\n2. Shift your weight onto your left leg and lift your right foot off the ground, bending your knee.\n3. Slowly curl your right heel towards your glutes, squeezing your hamstring.\n4. Pause for a moment at the top, then slowly lower your right foot back down to the starting position.\n5. Repeat for the desired number of repetitions, then switch legs.',
    '1. Stand with your feet hip-width apart and your hands on your hips.\n2. Shift your weight onto your left leg and lift your right foot off the ground, bending your knee.\n3. Slowly curl your right heel towards your glutes, squeezing your hamstring.\n4. Pause for a moment at the top, then slowly lower your right foot back down to the starting position.\n5. Repeat for the desired number of repetitions, then switch legs.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cuốn đùi sau đứng một chân' OR name_en = 'Standing single leg curl' OR external_id = '0795');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3193', 'Glute-ham raise', 'Glute-ham raise', 'Glute ham raise', 'STRENGTH', 'LEGS', 'LEGS', 'Lưng dưới, Bắp chân', 'hamstring,gluteal', 'lower-back,calves',
    'Máy tập', 'machine', 'ADVANCED', 'GYM', 'STRENGTH', 'STRENGTH', 'Bài đùi sau nâng cao trên máy GHD, dùng đùi sau kéo thân lên.', 'Targets the hamstrings; also works the glutes, lower back. Equipment: body weight.',
    '1. Móc gót vào đệm, gối tì đệm, thân thẳng.\n2. Hạ thân về trước có kiểm soát.\n3. Siết đùi sau và mông kéo thân trở lên.\n4. Giữ hông thẳng suốt bài.',
    '1. Móc gót vào đệm, gối tì đệm, thân thẳng.\n2. Hạ thân về trước có kiểm soát.\n3. Siết đùi sau và mông kéo thân trở lên.\n4. Giữ hông thẳng suốt bài.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gập hông; hạ quá nhanh; tập khi đùi sau yếu.', @safe, @dose_strength, '3 x 5–8', 'gv-3193', 'ADAPTED', 'APPROVED',
    '1. Adjust the glute-ham raise machine to fit your body.\n2. Position yourself face down on the machine with your ankles secured.\n3. Place your hands on your chest or cross them over your chest.\n4. Engage your hamstrings and glutes to lift your upper body up towards the ceiling.\n5. Continue lifting until your body is in a straight line from your head to your heels.\n6. Pause for a moment at the top, then slowly lower your body back down to the starting position.\n7. Repeat for the desired number of repetitions.',
    '1. Adjust the glute-ham raise machine to fit your body.\n2. Position yourself face down on the machine with your ankles secured.\n3. Place your hands on your chest or cross them over your chest.\n4. Engage your hamstrings and glutes to lift your upper body up towards the ceiling.\n5. Continue lifting until your body is in a straight line from your head to your heels.\n6. Pause for a moment at the top, then slowly lower your body back down to the starting position.\n7. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 5–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Glute-ham raise' OR name_en = 'Glute-ham raise' OR external_id = '3193');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3769', 'Squat bắt chéo chân', 'Curtsey squat', 'Curtsy squat', 'STRENGTH', 'GLUTES', 'LEGS', 'Đùi trong, Hông ngoài', 'gluteal,quadriceps', 'adductor,abductors',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'TONE,BALANCE', 'TONE', 'Bước chéo một chân ra sau như động tác chào kiểu cổ điển rồi ngồi xuống, tập mông bên.', 'Targets the glutes; also works the quadriceps, hamstrings, calves. Equipment: body weight.',
    '1. Đứng rộng bằng hông.\n2. Bước chân phải chéo ra sau chân trái.\n3. Ngồi xuống tới khi đùi trước gần song song sàn.\n4. Đẩy về vị trí đầu rồi đổi chân.',
    '1. Đứng rộng bằng hông.\n2. Bước chân phải chéo ra sau chân trái.\n3. Ngồi xuống tới khi đùi trước gần song song sàn.\n4. Đẩy về vị trí đầu rồi đổi chân.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gối trước đổ vào; thân xoay; bước quá chéo.', @safe, @dose_strength, '3 x 10 mỗi chân', 'gv-3769', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart.\n2. Take a step diagonally behind and across your body with your right foot, crossing it behind your left leg.\n3. Bend both knees as if you were curtsying, lowering your body towards the ground.\n4. Keep your torso upright and your weight on your front foot.\n5. Push through your front foot to return to the starting position.\n6. Repeat on the other side, stepping diagonally behind and across your body with your left foot.',
    '1. Stand with your feet shoulder-width apart.\n2. Take a step diagonally behind and across your body with your right foot, crossing it behind your left leg.\n3. Bend both knees as if you were curtsying, lowering your body towards the ground.\n4. Keep your torso upright and your weight on your front foot.\n5. Push through your front foot to return to the starting position.\n6. Repeat on the other side, stepping diagonally behind and across your body with your left foot.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Squat bắt chéo chân' OR name_en = 'Curtsey squat' OR external_id = '3769');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0124', 'Squat chân rộng thanh đòn', 'Barbell wide squat', 'Wide-stance barbell squat', 'STRENGTH', 'GLUTES', 'LEGS', 'Đùi trước, Đùi sau', 'gluteal,adductor', 'quadriceps,hamstring',
    'Thanh đòn', 'barbell', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Squat với chân đứng rộng, mũi chân mở, tập mông và đùi trong.', 'Targets the quads; also works the glutes, hamstrings, calves. Equipment: barbell.',
    '1. Đặt thanh trên lưng trên, đứng rộng gấp rưỡi vai, mũi chân mở.\n2. Đẩy gối theo hướng mũi chân.\n3. Ngồi xuống tới khi đùi song song sàn.\n4. Đạp chân đứng lên.',
    '1. Đặt thanh trên lưng trên, đứng rộng gấp rưỡi vai, mũi chân mở.\n2. Đẩy gối theo hướng mũi chân.\n3. Ngồi xuống tới khi đùi song song sàn.\n4. Đạp chân đứng lên.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gối chụm; nghiêng thân quá nhiều; gót nhấc.', @safe, @dose_strength, '4 x 8–10', 'gv-0124', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet wider than shoulder-width apart, toes pointing slightly outward.\n2. Hold the barbell across your upper back, resting it on your traps or rear delts.\n3. Engage your core and keep your chest up as you lower your body down into a squat, pushing your hips back and bending your knees.\n4. Lower until your thighs are parallel to the ground, or as low as you can comfortably go.\n5. Pause for a moment at the bottom, then push through your heels to return to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet wider than shoulder-width apart, toes pointing slightly outward.\n2. Hold the barbell across your upper back, resting it on your traps or rear delts.\n3. Engage your core and keep your chest up as you lower your body down into a squat, pushing your hips back and bending your knees.\n4. Lower until your thighs are parallel to the ground, or as low as you can comfortably go.\n5. Pause for a moment at the bottom, then push through your heels to return to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 8–10'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Squat chân rộng thanh đòn' OR name_en = 'Barbell wide squat' OR external_id = '0124');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '2368', 'Split squat tay không', 'Split squats', 'Split squat', 'STRENGTH', 'LEGS', 'LEGS', 'Đùi sau', 'quadriceps,gluteal', 'hamstring',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'STRENGTH,BALANCE', 'STRENGTH', 'Đứng một chân trước một chân sau và hạ người tại chỗ, bài nền tảng cho chùng chân.', 'Targets the quads; also works the glutes, hamstrings, calves. Equipment: body weight.',
    '1. Đứng tách chân trước sau khoảng một bước dài.\n2. Thân thẳng, tay chống hông.\n3. Hạ gối sau xuống gần sàn.\n4. Đẩy lên rồi đổi chân sau khi xong hiệp.',
    '1. Đứng tách chân trước sau khoảng một bước dài.\n2. Thân thẳng, tay chống hông.\n3. Hạ gối sau xuống gần sàn.\n4. Đẩy lên rồi đổi chân sau khi xong hiệp.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gối trước đổ vào; nghiêng thân; đứng quá hẹp.', @safe, @dose_strength, '3 x 10 mỗi chân', 'gv-2368', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart.\n2. Take a step forward with one foot and place it about two feet in front of the other foot.\n3. Lower your body by bending your knees and hips, keeping your back straight.\n4. Continue lowering until your front thigh is parallel to the ground, and your back knee is hovering just above the ground.\n5. Pause for a moment, then push through your front heel to return to the starting position.\n6. Repeat for the desired number of repetitions, then switch legs and repeat.',
    '1. Stand with your feet shoulder-width apart.\n2. Take a step forward with one foot and place it about two feet in front of the other foot.\n3. Lower your body by bending your knees and hips, keeping your back straight.\n4. Continue lowering until your front thigh is parallel to the ground, and your back knee is hovering just above the ground.\n5. Pause for a moment, then push through your front heel to return to the starting position.\n6. Repeat for the desired number of repetitions, then switch legs and repeat.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Split squat tay không' OR name_en = 'Split squats' OR external_id = '2368');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '2459', 'Lật lốp xe', 'Tire flip', 'Tire flip', 'STRENGTH', 'FULL_BODY', 'FULL_BODY', 'Đùi sau, Ngực, Cơ thang', 'quadriceps,gluteal,lower-back', 'hamstring,chest,trapezius',
    'Khác', 'other', 'ADVANCED', 'GYM', 'STRENGTH,FAT_LOSS', 'STRENGTH', 'Lật lốp xe lớn bằng sức đẩy hông và tay, bài toàn thân bùng nổ.', 'Targets the glutes; also works the hamstrings, quadriceps, core. Equipment: tire.',
    '1. Ngồi thấp trước lốp, ngực tì lốp, tay luồn dưới mép lốp.\n2. Đẩy hông về trước nâng lốp lên.\n3. Khi lốp đứng, đổi tay và đẩy lốp lật xuống.\n4. Bước lại vị trí và lặp lại.',
    '1. Ngồi thấp trước lốp, ngực tì lốp, tay luồn dưới mép lốp.\n2. Đẩy hông về trước nâng lốp lên.\n3. Khi lốp đứng, đổi tay và đẩy lốp lật xuống.\n4. Bước lại vị trí và lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo bằng lưng cong; đứng quá xa lốp; lốp quá nặng.', @safe, @dose_strength, '4 x 4–6', 'gv-2459', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, facing the tire.\n2. Bend your knees and hinge at the hips, lowering into a squat position.\n3. Reach down and grab the bottom edge of the tire with both hands, fingers facing towards you.\n4. Engage your glutes and leg muscles, and explosively drive through your legs to lift the tire off the ground.\n5. As the tire flips over, use your upper body strength to guide it and maintain control.\n6. Once the tire is fully flipped, quickly step back and reset your stance.\n7. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, facing the tire.\n2. Bend your knees and hinge at the hips, lowering into a squat position.\n3. Reach down and grab the bottom edge of the tire with both hands, fingers facing towards you.\n4. Engage your glutes and leg muscles, and explosively drive through your legs to lift the tire off the ground.\n5. As the tire flips over, use your upper body strength to guide it and maintain control.\n6. Once the tire is fully flipped, quickly step back and reset your stance.\n7. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 4–6'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Lật lốp xe' OR name_en = 'Tire flip' OR external_id = '2459');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0648', 'Power clean', 'Power clean', 'Power clean', 'STRENGTH', 'FULL_BODY', 'FULL_BODY', 'Đùi sau, Vai trước, Lưng dưới', 'quadriceps,gluteal,trapezius', 'hamstring,front-deltoids,lower-back',
    'Thanh đòn', 'barbell', 'ADVANCED', 'GYM', 'STRENGTH', 'STRENGTH', 'Kéo bùng nổ thanh đòn từ sàn và đón thanh trên vai, bài cử tạ phát triển sức mạnh toàn thân.', 'Targets the hamstrings; also works the glutes, quadriceps, calves. Equipment: barbell.',
    '1. Đứng rộng bằng hông, nắm thanh rộng hơn chân, lưng thẳng.\n2. Kéo thanh lên qua gối, rồi duỗi bùng nổ hông, gối, cổ chân.\n3. Kéo thanh lên cao và luồn khuỷu nhanh ra trước để đón thanh trên vai.\n4. Đứng thẳng rồi hạ thanh về sàn có kiểm soát.',
    '1. Đứng rộng bằng hông, nắm thanh rộng hơn chân, lưng thẳng.\n2. Kéo thanh lên qua gối, rồi duỗi bùng nổ hông, gối, cổ chân.\n3. Kéo thanh lên cao và luồn khuỷu nhanh ra trước để đón thanh trên vai.\n4. Đứng thẳng rồi hạ thanh về sàn có kiểm soát.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo bằng tay; cong lưng; tập nặng khi chưa có HLV hướng dẫn.', @safe, @dose_strength, '5 x 3', 'gv-0648', 'ADAPTED', 'APPROVED',
    '1. Start with the barbell on the ground in front of you, with your feet shoulder-width apart.\n2. Bend down and grip the barbell with an overhand grip, slightly wider than shoulder-width apart.\n3. Keep your back straight and chest up as you lift the barbell off the ground, extending your hips and knees.\n4. As the barbell reaches your mid-thigh, explosively pull it upwards, shrugging your shoulders and pulling your elbows high and to the sides.\n5. As the barbell reaches its highest point, quickly drop underneath it, rotating your elbows around and catching the barbell on your shoulders in a front squat position.\n6. Stand up with the barbell, fully extending your hips and knees.\n7. Lower the barbell back down to the starting position, keeping control of the weight throughout the movement.\n8. Repeat for the desired number of repetitions.',
    '1. Start with the barbell on the ground in front of you, with your feet shoulder-width apart.\n2. Bend down and grip the barbell with an overhand grip, slightly wider than shoulder-width apart.\n3. Keep your back straight and chest up as you lift the barbell off the ground, extending your hips and knees.\n4. As the barbell reaches your mid-thigh, explosively pull it upwards, shrugging your shoulders and pulling your elbows high and to the sides.\n5. As the barbell reaches its highest point, quickly drop underneath it, rotating your elbows around and catching the barbell on your shoulders in a front squat position.\n6. Stand up with the barbell, fully extending your hips and knees.\n7. Lower the barbell back down to the starting position, keeping control of the weight throughout the movement.\n8. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '5 x 3'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Power clean' OR name_en = 'Power clean' OR external_id = '0648');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0028', 'Clean and press', 'Barbell clean and press', 'Barbell clean and press', 'STRENGTH', 'FULL_BODY', 'FULL_BODY', 'Cơ thang, Tay sau, Đùi sau', 'quadriceps,front-deltoids,gluteal', 'trapezius,triceps,hamstring',
    'Thanh đòn', 'barbell', 'ADVANCED', 'GYM', 'STRENGTH', 'STRENGTH', 'Kéo thanh đòn từ sàn lên vai rồi đẩy qua đầu, kết hợp sức mạnh chân và vai.', 'Targets the quads; also works the hamstrings, glutes, shoulders, triceps. Equipment: barbell.',
    '1. Đứng rộng bằng hông, nắm thanh, lưng thẳng.\n2. Kéo bùng nổ đưa thanh lên vai.\n3. Đẩy thanh thẳng lên qua đầu.\n4. Hạ thanh về vai rồi về sàn có kiểm soát.',
    '1. Đứng rộng bằng hông, nắm thanh, lưng thẳng.\n2. Kéo bùng nổ đưa thanh lên vai.\n3. Đẩy thanh thẳng lên qua đầu.\n4. Hạ thanh về vai rồi về sàn có kiểm soát.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Ưỡn lưng khi đẩy; kéo bằng tay; thả thanh rơi.', @safe, @dose_strength, '4 x 4–6', 'gv-0028', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and the barbell on the floor in front of you.\n2. Bend your knees and hinge at the hips to lower down and grip the barbell with an overhand grip, hands slightly wider than shoulder-width apart.\n3. Drive through your heels and extend your hips and knees to lift the barbell off the floor, keeping it close to your body.\n4. As the barbell reaches your thighs, explosively extend your hips, shrug your shoulders, and pull the barbell up towards your chest.\n5. As the barbell reaches chest height, quickly drop under it and catch it at shoulder level, with your elbows pointing forward and your palms facing up.\n6. From the catch position, press the barbell overhead by extending your arms and pushing the barbell straight up.\n7. Lower the barbell back down to the starting position and repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and the barbell on the floor in front of you.\n2. Bend your knees and hinge at the hips to lower down and grip the barbell with an overhand grip, hands slightly wider than shoulder-width apart.\n3. Drive through your heels and extend your hips and knees to lift the barbell off the floor, keeping it close to your body.\n4. As the barbell reaches your thighs, explosively extend your hips, shrug your shoulders, and pull the barbell up towards your chest.\n5. As the barbell reaches chest height, quickly drop under it and catch it at shoulder level, with your elbows pointing forward and your palms facing up.\n6. From the catch position, press the barbell overhead by extending your arms and pushing the barbell straight up.\n7. Lower the barbell back down to the starting position and repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 4–6'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Clean and press' OR name_en = 'Barbell clean and press' OR external_id = '0028');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3888', 'Snatch tạ đơn một tay', 'Dumbbell one arm snatch', 'Single-arm dumbbell snatch', 'STRENGTH', 'FULL_BODY', 'FULL_BODY', 'Đùi trước, Đùi sau, Cơ thang', 'gluteal,front-deltoids', 'quadriceps,hamstring,trapezius',
    'Tạ đơn', 'dumbbell', 'INTERMEDIATE', 'ANY', 'STRENGTH,FAT_LOSS', 'STRENGTH', 'Đưa tạ đơn từ sàn lên thẳng tay trên đầu bằng một động tác bùng nổ.', 'Targets the glutes; also works the hamstrings, quadriceps, core. Equipment: dumbbell.',
    '1. Đứng rộng bằng vai, tạ giữa hai chân.\n2. Ngồi xuống nắm tạ một tay, lưng thẳng.\n3. Duỗi bùng nổ hông và gối, kéo tạ sát thân lên qua đầu.\n4. Hạ tạ về sàn có kiểm soát rồi lặp lại.',
    '1. Đứng rộng bằng vai, tạ giữa hai chân.\n2. Ngồi xuống nắm tạ một tay, lưng thẳng.\n3. Duỗi bùng nổ hông và gối, kéo tạ sát thân lên qua đầu.\n4. Hạ tạ về sàn có kiểm soát rồi lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Kéo bằng tay; cong lưng; tạ xa thân.', @safe, @dose_strength, '3 x 6 mỗi tay', 'gv-3888', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in one hand with an overhand grip.\n2. Bend your knees slightly and hinge forward at the hips, keeping your back straight and chest up.\n3. Lower the dumbbell towards the ground, keeping it close to your body.\n4. Explosively extend your hips, knees, and ankles, driving the dumbbell upwards in a straight line.\n5. As the dumbbell reaches shoulder height, quickly rotate your hand and punch it overhead, fully extending your arm.\n6. Catch the dumbbell overhead with a slight bend in your knees and hips.\n7. Lower the dumbbell back down to the starting position in a controlled manner.\n8. Repeat for the desired number of repetitions, then switch to the other arm.',
    '1. Stand with your feet shoulder-width apart, holding a dumbbell in one hand with an overhand grip.\n2. Bend your knees slightly and hinge forward at the hips, keeping your back straight and chest up.\n3. Lower the dumbbell towards the ground, keeping it close to your body.\n4. Explosively extend your hips, knees, and ankles, driving the dumbbell upwards in a straight line.\n5. As the dumbbell reaches shoulder height, quickly rotate your hand and punch it overhead, fully extending your arm.\n6. Catch the dumbbell overhead with a slight bend in your knees and hips.\n7. Lower the dumbbell back down to the starting position in a controlled manner.\n8. Repeat for the desired number of repetitions, then switch to the other arm.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 6 per arm'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Snatch tạ đơn một tay' OR name_en = 'Dumbbell one arm snatch' OR external_id = '3888');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0811', 'Deadlift thanh lục giác', 'Trap bar deadlift', 'Trap bar deadlift, hex bar deadlift', 'STRENGTH', 'LEGS', 'LEGS', 'Lưng dưới, Cơ thang, Cẳng tay', 'quadriceps,gluteal,hamstring', 'lower-back,trapezius,forearm',
    'Thanh đòn', 'barbell', 'BEGINNER', 'GYM', 'STRENGTH', 'STRENGTH', 'Deadlift trong thanh lục giác, tay cầm hai bên thân nên lưng thẳng đứng hơn, dễ học hơn deadlift thường.', 'Targets the glutes; also works the hamstrings, quadriceps, lower back. Equipment: trap bar.',
    '1. Đứng giữa thanh lục giác, chân rộng bằng hông.\n2. Ngồi xuống nắm hai tay cầm, ngực mở.\n3. Đạp chân đứng lên tới khi hông và gối duỗi.\n4. Hạ thanh về sàn có kiểm soát.',
    '1. Đứng giữa thanh lục giác, chân rộng bằng hông.\n2. Ngồi xuống nắm hai tay cầm, ngực mở.\n3. Đạp chân đứng lên tới khi hông và gối duỗi.\n4. Hạ thanh về sàn có kiểm soát.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Cong lưng; ngửa người ở đỉnh; giật thanh.', @safe, @dose_strength, '4 x 5–8', 'gv-0811', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and the trap bar on the ground in front of you.\n2. Bend at the hips and knees to lower yourself down and grip the handles of the trap bar with an overhand grip.\n3. Keep your back straight and chest up as you begin to lift the trap bar off the ground by extending your hips and knees.\n4. As you lift, focus on driving through your heels and squeezing your glutes at the top of the movement.\n5. Lower the trap bar back down to the ground by bending at the hips and knees, keeping your back straight throughout the movement.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and the trap bar on the ground in front of you.\n2. Bend at the hips and knees to lower yourself down and grip the handles of the trap bar with an overhand grip.\n3. Keep your back straight and chest up as you begin to lift the trap bar off the ground by extending your hips and knees.\n4. As you lift, focus on driving through your heels and squeezing your glutes at the top of the movement.\n5. Lower the trap bar back down to the ground by bending at the hips and knees, keeping your back straight throughout the movement.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 5–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Deadlift thanh lục giác' OR name_en = 'Trap bar deadlift' OR external_id = '0811');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0300', 'Deadlift tạ đơn', 'Dumbbell deadlift', 'Dumbbell deadlift', 'STRENGTH', 'LEGS', 'LEGS', 'Đùi trước, Lưng dưới, Cẳng tay', 'gluteal,hamstring', 'quadriceps,lower-back,forearm',
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'STRENGTH', 'STRENGTH', 'Deadlift với hai tạ đơn, nhẹ và dễ học, hợp người mới hoặc tập tại nhà.', 'Targets the glutes; also works the hamstrings, lower back. Equipment: dumbbell.',
    '1. Đứng rộng bằng hông, hai tạ trước chân.\n2. Đẩy hông ra sau, gập gối nắm tạ, lưng thẳng.\n3. Đạp chân, đẩy hông về trước để đứng thẳng.\n4. Hạ tạ về sàn có kiểm soát.',
    '1. Đứng rộng bằng hông, hai tạ trước chân.\n2. Đẩy hông ra sau, gập gối nắm tạ, lưng thẳng.\n3. Đạp chân, đẩy hông về trước để đứng thẳng.\n4. Hạ tạ về sàn có kiểm soát.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Cong lưng; tạ xa chân; ngửa người ở đỉnh.', @safe, @dose_strength, '3 x 8–10', 'gv-0300', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, toes pointing forward.\n2. Hold a dumbbell in each hand, palms facing your body, arms extended downwards.\n3. Bend at your hips and knees, lowering the dumbbells towards the ground while keeping your back straight.\n4. Push through your heels and extend your hips and knees, lifting the dumbbells back up to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, toes pointing forward.\n2. Hold a dumbbell in each hand, palms facing your body, arms extended downwards.\n3. Bend at your hips and knees, lowering the dumbbells towards the ground while keeping your back straight.\n4. Push through your heels and extend your hips and knees, lifting the dumbbells back up to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 8–10'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Deadlift tạ đơn' OR name_en = 'Dumbbell deadlift' OR external_id = '0300');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0593', 'Reverse hyper trên máy', 'Lever reverse hyperextension', 'Reverse hyperextension machine', 'STRENGTH', 'GLUTES', 'LEGS', 'Lưng dưới', 'gluteal,hamstring', 'lower-back',
    'Máy tập', 'machine', 'INTERMEDIATE', 'GYM', 'STRENGTH', 'STRENGTH', 'Nằm sấp trên máy, đưa chân ra sau lên cao, tập mông và lưng dưới.', 'Targets the glutes; also works the hamstrings, lower back. Equipment: leverage machine.',
    '1. Nằm sấp trên đệm, hông ở mép, tay nắm tay cầm.\n2. Móc gót vào đệm đẩy của máy.\n3. Siết mông nâng chân lên ngang thân.\n4. Hạ chậm về vị trí đầu.',
    '1. Nằm sấp trên đệm, hông ở mép, tay nắm tay cầm.\n2. Móc gót vào đệm đẩy của máy.\n3. Siết mông nâng chân lên ngang thân.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Vung chân lấy đà; ưỡn lưng quá mức; tạ quá nặng.', @safe, @dose_strength, '3 x 12–15', 'gv-0593', 'ADAPTED', 'APPROVED',
    '1. Adjust the leverage machine to fit your body and secure your feet in the foot pads.\n2. Lie face down on the machine with your upper body hanging off the edge and your hips resting on the pad.\n3. Cross your arms over your chest or place them behind your head.\n4. Engage your glutes and hamstrings to lift your legs upward until they are parallel to the ground.\n5. Pause for a moment at the top, then slowly lower your legs back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Adjust the leverage machine to fit your body and secure your feet in the foot pads.\n2. Lie face down on the machine with your upper body hanging off the edge and your hips resting on the pad.\n3. Cross your arms over your chest or place them behind your head.\n4. Engage your glutes and hamstrings to lift your legs upward until they are parallel to the ground.\n5. Pause for a moment at the top, then slowly lower your legs back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Reverse hyper trên máy' OR name_en = 'Lever reverse hyperextension' OR external_id = '0593');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0228', 'Đá chân sau với cáp', 'Cable standing hip extension', 'Cable glute kickback', 'STRENGTH', 'GLUTES', 'LEGS', 'Đùi sau', 'gluteal', 'hamstring',
    'Máy cáp', 'cable', 'BEGINNER', 'GYM', 'TONE,HYPERTROPHY', 'TONE', 'Móc dây cáp vào cổ chân và đá chân ra sau, cô lập cơ mông.', 'Targets the glutes; also works the hamstrings, quadriceps. Equipment: cable.',
    '1. Gắn dây đai cổ chân vào ròng rọc thấp, đứng đối diện máy.\n2. Tay vịn máy, hơi gập người.\n3. Siết mông đá chân ra sau.\n4. Đưa chân về chậm rồi đổi chân sau khi xong hiệp.',
    '1. Gắn dây đai cổ chân vào ròng rọc thấp, đứng đối diện máy.\n2. Tay vịn máy, hơi gập người.\n3. Siết mông đá chân ra sau.\n4. Đưa chân về chậm rồi đổi chân sau khi xong hiệp.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Ưỡn lưng; vung chân; xoay hông mở ra.', @safe, @dose_strength, '3 x 12–15 mỗi chân', 'gv-0228', 'ADAPTED', 'APPROVED',
    '1. Attach a cable to a low pulley and stand facing away from the machine.\n2. Place the cable around your ankle and stand with your feet shoulder-width apart.\n3. Keep your core engaged and your back straight throughout the exercise.\n4. Slowly extend your leg straight back, squeezing your glutes at the top of the movement.\n5. Pause for a moment, then return to the starting position.\n6. Repeat for the desired number of repetitions.\n7. Switch sides and repeat with the other leg.',
    '1. Attach a cable to a low pulley and stand facing away from the machine.\n2. Place the cable around your ankle and stand with your feet shoulder-width apart.\n3. Keep your core engaged and your back straight throughout the exercise.\n4. Slowly extend your leg straight back, squeezing your glutes at the top of the movement.\n5. Pause for a moment, then return to the starting position.\n6. Repeat for the desired number of repetitions.\n7. Switch sides and repeat with the other leg.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Đá chân sau với cáp' OR name_en = 'Cable standing hip extension' OR external_id = '0228');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0710', 'Nằm nghiêng nâng chân', 'Side hip abduction', 'Side-lying hip abduction', 'STRENGTH', 'GLUTES', 'LEGS', NULL, 'abductors,gluteal', NULL,
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'HOME', 'TONE', 'TONE', 'Nằm nghiêng nâng chân trên lên cao, tập hông ngoài và mông nhỏ.', 'Targets the abductors; also works the glutes, quadriceps. Equipment: body weight.',
    '1. Nằm nghiêng, đầu gối lên cánh tay, hai chân duỗi chồng lên nhau.\n2. Siết bụng giữ thân thẳng.\n3. Nâng chân trên lên khoảng 45 độ.\n4. Hạ chậm về vị trí đầu.',
    '1. Nằm nghiêng, đầu gối lên cánh tay, hai chân duỗi chồng lên nhau.\n2. Siết bụng giữ thân thẳng.\n3. Nâng chân trên lên khoảng 45 độ.\n4. Hạ chậm về vị trí đầu.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Xoay hông ra sau; nâng quá cao; làm nhanh.', @safe, @dose_strength, '3 x 15 mỗi bên', 'gv-0710', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and your hands on your hips.\n2. Shift your weight to one leg and lift the opposite leg out to the side, keeping it straight.\n3. Pause for a moment at the top, then slowly lower your leg back down to the starting position.\n4. Repeat on the other side.\n5. Continue alternating sides for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and your hands on your hips.\n2. Shift your weight to one leg and lift the opposite leg out to the side, keeping it straight.\n3. Pause for a moment at the top, then slowly lower your leg back down to the starting position.\n4. Repeat on the other side.\n5. Continue alternating sides for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 15 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nằm nghiêng nâng chân' OR name_en = 'Side hip abduction' OR external_id = '0710');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3561', 'Glute bridge bước chân', 'Glute bridge march', 'Glute bridge march', 'STRENGTH', 'GLUTES', 'LEGS', 'Đùi sau, Bụng', 'gluteal', 'hamstring,abs',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'HOME', 'TONE,BALANCE', 'TONE', 'Giữ tư thế nâng hông và lần lượt nhấc từng chân như bước đi, tập mông và cơ lõi.', 'Targets the glutes; also works the hamstrings, quadriceps. Equipment: body weight.',
    '1. Nằm ngửa, gập gối, nâng hông lên tạo đường thẳng từ vai tới gối.\n2. Giữ hông cao và ngang.\n3. Nhấc một chân, đưa gối về ngực rồi đặt xuống.\n4. Đổi chân, giữ hông không tụt.',
    '1. Nằm ngửa, gập gối, nâng hông lên tạo đường thẳng từ vai tới gối.\n2. Giữ hông cao và ngang.\n3. Nhấc một chân, đưa gối về ngực rồi đặt xuống.\n4. Đổi chân, giữ hông không tụt.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Hông tụt khi nhấc chân; ưỡn lưng; làm nhanh.', @safe, @dose_strength, '3 x 10 mỗi chân', 'gv-3561', 'ADAPTED', 'APPROVED',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Engage your glutes and lift your hips off the ground, forming a straight line from your knees to your shoulders.\n3. While keeping your hips lifted, lift one foot off the ground and bring your knee towards your chest.\n4. Lower your foot back to the ground and repeat the movement with the other leg.\n5. Continue alternating legs in a marching motion while maintaining the bridge position.\n6. Repeat for the desired number of repetitions.',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Engage your glutes and lift your hips off the ground, forming a straight line from your knees to your shoulders.\n3. While keeping your hips lifted, lift one foot off the ground and bring your knee towards your chest.\n4. Lower your foot back to the ground and repeat the movement with the other leg.\n5. Continue alternating legs in a marching motion while maintaining the bridge position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Glute bridge bước chân' OR name_en = 'Glute bridge march' OR external_id = '3561');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1409', 'Glute bridge thanh đòn', 'Barbell glute bridge', 'Barbell glute bridge', 'STRENGTH', 'GLUTES', 'LEGS', 'Đùi sau', 'gluteal', 'hamstring',
    'Thanh đòn', 'barbell', 'INTERMEDIATE', 'GYM', 'STRENGTH,HYPERTROPHY', 'STRENGTH', 'Nâng hông trên sàn với thanh đòn đặt ngang hông, tập mông nặng.', 'Targets the glutes; also works the hamstrings, lower back. Equipment: barbell.',
    '1. Ngồi trên sàn, lăn thanh đòn có lót đệm lên hông.\n2. Nằm ngửa, gập gối, bàn chân đặt sàn.\n3. Siết mông nâng hông lên tới khi thân thẳng từ vai tới gối.\n4. Hạ chậm về sàn.',
    '1. Ngồi trên sàn, lăn thanh đòn có lót đệm lên hông.\n2. Nằm ngửa, gập gối, bàn chân đặt sàn.\n3. Siết mông nâng hông lên tới khi thân thẳng từ vai tới gối.\n4. Hạ chậm về sàn.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Ưỡn lưng thay vì đẩy hông; gót nhấc; không lót đệm.', @safe, @dose_strength, '4 x 8–12', 'gv-1409', 'ADAPTED', 'APPROVED',
    '1. Start by lying flat on your back on the ground with your knees bent and feet flat on the floor.\n2. Place a barbell across your hips, holding it securely with both hands.\n3. Engage your glutes and core muscles, then lift your hips off the ground until your body forms a straight line from your knees to your shoulders.\n4. Pause for a moment at the top, squeezing your glutes.\n5. Slowly lower your hips back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Start by lying flat on your back on the ground with your knees bent and feet flat on the floor.\n2. Place a barbell across your hips, holding it securely with both hands.\n3. Engage your glutes and core muscles, then lift your hips off the ground until your body forms a straight line from your knees to your shoulders.\n4. Pause for a moment at the top, squeezing your glutes.\n5. Slowly lower your hips back down to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 8–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Glute bridge thanh đòn' OR name_en = 'Barbell glute bridge' OR external_id = '1409');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0168', 'Khép đùi với cáp', 'Cable hip adduction', 'Cable hip adduction', 'STRENGTH', 'LEGS', 'LEGS', NULL, 'adductor', NULL,
    'Máy cáp', 'cable', 'BEGINNER', 'GYM', 'TONE', 'TONE', 'Móc cáp vào cổ chân và kéo chân vào trong, tập đùi trong.', 'Targets the adductors; also works the glutes, quadriceps. Equipment: cable.',
    '1. Gắn dây đai cổ chân vào ròng rọc thấp, đứng nghiêng với máy.\n2. Chân gần máy được kéo ra ngoài.\n3. Kéo chân vào trong, bắt chéo nhẹ trước chân trụ.\n4. Đưa về chậm.',
    '1. Gắn dây đai cổ chân vào ròng rọc thấp, đứng nghiêng với máy.\n2. Chân gần máy được kéo ra ngoài.\n3. Kéo chân vào trong, bắt chéo nhẹ trước chân trụ.\n4. Đưa về chậm.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nghiêng người; vung chân; tạ quá nặng.', @safe, @dose_strength, '3 x 12–15 mỗi chân', 'gv-0168', 'ADAPTED', 'APPROVED',
    '1. Attach the ankle cuff to your ankle and stand facing the cable machine.\n2. Position yourself far enough away from the machine so that there is tension on the cable.\n3. Place your hands on the machine for support.\n4. Keeping your leg straight, slowly move your leg across your body towards the midline.\n5. Pause for a moment at the end of the movement, then slowly return to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Attach the ankle cuff to your ankle and stand facing the cable machine.\n2. Position yourself far enough away from the machine so that there is tension on the cable.\n3. Place your hands on the machine for support.\n4. Keeping your leg straight, slowly move your leg across your body towards the midline.\n5. Pause for a moment at the end of the movement, then slowly return to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12–15 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Khép đùi với cáp' OR name_en = 'Cable hip adduction' OR external_id = '0168');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3582', 'Chùng chân bật nhảy', 'Lunge with jump', 'Jumping lunge', 'STRENGTH', 'LEGS', 'LEGS', 'Bắp chân, Đùi sau', 'quadriceps,gluteal', 'calves,hamstring',
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'ENDURANCE,FAT_LOSS', 'ENDURANCE', 'Chùng chân rồi bật nhảy đổi chân giữa không trung, bài sức bật và đốt năng lượng.', 'Targets the glutes; also works the quadriceps, hamstrings, calves. Equipment: body weight.',
    '1. Vào tư thế chùng chân, một chân trước một chân sau.\n2. Bật nhảy lên mạnh.\n3. Đổi chân giữa không trung.\n4. Tiếp đất mềm vào tư thế chùng chân và lặp lại.',
    '1. Vào tư thế chùng chân, một chân trước một chân sau.\n2. Bật nhảy lên mạnh.\n3. Đổi chân giữa không trung.\n4. Tiếp đất mềm vào tư thế chùng chân và lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Tiếp đất nặng; gối trước đổ vào; thân đổ về trước.', @safe, @dose_strength, '3 x 10 mỗi chân', 'gv-3582', 'ADAPTED', 'APPROVED',
    '1. Start by standing with your feet shoulder-width apart.\n2. Take a step forward with your right foot, lowering your body into a lunge position.\n3. Push off with your right foot and jump into the air, switching the position of your feet mid-air.\n4. Land softly with your left foot forward and immediately lower your body into a lunge position.\n5. Continue alternating between lunges and jumps for the desired number of repetitions.',
    '1. Start by standing with your feet shoulder-width apart.\n2. Take a step forward with your right foot, lowering your body into a lunge position.\n3. Push off with your right foot and jump into the air, switching the position of your feet mid-air.\n4. Land softly with your left foot forward and immediately lower your body into a lunge position.\n5. Continue alternating between lunges and jumps for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chùng chân bật nhảy' OR name_en = 'Lunge with jump' OR external_id = '3582');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1372', 'Nhón gót thanh đòn', 'Barbell standing calf raise', 'Barbell standing calf raise', 'STRENGTH', 'LEGS', 'LEGS', NULL, 'calves', NULL,
    'Thanh đòn', 'barbell', 'BEGINNER', 'GYM', 'STRENGTH', 'STRENGTH', 'Nhón gót đứng với thanh đòn trên vai, tập bắp chân.', 'Targets the calves; also works the hamstrings, glutes. Equipment: barbell.',
    '1. Đặt thanh trên lưng trên, đứng thẳng, mũi chân trên bục thấp nếu có.\n2. Hạ gót xuống thấp.\n3. Nhón gót lên cao nhất có thể.\n4. Dừng một nhịp rồi hạ chậm.',
    '1. Đặt thanh trên lưng trên, đứng thẳng, mũi chân trên bục thấp nếu có.\n2. Hạ gót xuống thấp.\n3. Nhón gót lên cao nhất có thể.\n4. Dừng một nhịp rồi hạ chậm.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nảy gót; gập gối; biên độ ngắn.', @safe, @dose_strength, '4 x 12–15', 'gv-1372', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and place a barbell across your upper back.\n2. Raise your heels off the ground as high as possible, using only your toes.\n3. Pause for a moment at the top, then slowly lower your heels back down to the starting position.\n4. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and place a barbell across your upper back.\n2. Raise your heels off the ground as high as possible, using only your toes.\n3. Pause for a moment at the top, then slowly lower your heels back down to the starting position.\n4. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 12–15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nhón gót thanh đòn' OR name_en = 'Barbell standing calf raise' OR external_id = '1372');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0284', 'Nhón gót kiểu donkey', 'Donkey calf raise', 'Donkey calf raise', 'STRENGTH', 'LEGS', 'LEGS', NULL, 'calves', NULL,
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'HYPERTROPHY', 'HYPERTROPHY', 'Gập hông tì tay vào vật chắc và nhón gót, kéo giãn bắp chân nhiều hơn.', 'Targets the calves; also works the hamstrings, glutes. Equipment: body weight.',
    '1. Đứng trên bục, mũi chân ở mép, gập hông tì tay vào ghế.\n2. Hạ gót xuống thấp.\n3. Nhón gót lên cao.\n4. Hạ chậm rồi lặp lại.',
    '1. Đứng trên bục, mũi chân ở mép, gập hông tì tay vào ghế.\n2. Hạ gót xuống thấp.\n3. Nhón gót lên cao.\n4. Hạ chậm rồi lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Gập gối; nảy gót; biên độ ngắn.', @safe, @dose_strength, '4 x 15', 'gv-0284', 'ADAPTED', 'APPROVED',
    '1. Stand with your toes on an elevated surface, such as a step or block.\n2. Place your hands on a stable support, such as a wall or railing, for balance.\n3. Raise your heels as high as possible, lifting your body weight onto the balls of your feet.\n4. Pause for a moment at the top, then slowly lower your heels back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Stand with your toes on an elevated surface, such as a step or block.\n2. Place your hands on a stable support, such as a wall or railing, for balance.\n3. Raise your heels as high as possible, lifting your body weight onto the balls of your feet.\n4. Pause for a moment at the top, then slowly lower your heels back down to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 15'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nhón gót kiểu donkey' OR name_en = 'Donkey calf raise' OR external_id = '0284');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0409', 'Nhón gót một chân tạ đơn', 'Dumbbell single leg calf raise', 'Single-leg dumbbell calf raise', 'STRENGTH', 'LEGS', 'LEGS', NULL, 'calves', NULL,
    'Tạ đơn', 'dumbbell', 'BEGINNER', 'ANY', 'STRENGTH,BALANCE', 'STRENGTH', 'Nhón gót trên một chân cầm tạ đơn, tăng độ khó cho bắp chân.', 'Targets the calves; also works the ankles. Equipment: dumbbell.',
    '1. Đứng một chân trên bục, tay cùng bên cầm tạ, tay kia vịn tường.\n2. Hạ gót xuống thấp.\n3. Nhón gót lên cao nhất.\n4. Hạ chậm, xong hiệp thì đổi chân.',
    '1. Đứng một chân trên bục, tay cùng bên cầm tạ, tay kia vịn tường.\n2. Hạ gót xuống thấp.\n3. Nhón gót lên cao nhất.\n4. Hạ chậm, xong hiệp thì đổi chân.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Nảy gót; vịn quá nhiều; gập gối.', @safe, @dose_strength, '3 x 12 mỗi chân', 'gv-0409', 'ADAPTED', 'APPROVED',
    '1. Stand on the edge of a step or platform with your heels hanging off and your toes on the step.\n2. Hold a dumbbell in one hand and place your other hand on a wall or railing for support.\n3. Raise your heel as high as possible, lifting your body up onto your toes.\n4. Pause for a moment at the top, then slowly lower your heel back down below the step.\n5. Repeat for the desired number of repetitions, then switch to the other leg.',
    '1. Stand on the edge of a step or platform with your heels hanging off and your toes on the step.\n2. Hold a dumbbell in one hand and place your other hand on a wall or railing for support.\n3. Raise your heel as high as possible, lifting your body up onto your toes.\n4. Pause for a moment at the top, then slowly lower your heel back down below the step.\n5. Repeat for the desired number of repetitions, then switch to the other leg.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 12 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nhón gót một chân tạ đơn' OR name_en = 'Dumbbell single leg calf raise' OR external_id = '0409');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3305', 'Thruster thanh đòn', 'Barbell thruster', 'Barbell thruster', 'STRENGTH', 'FULL_BODY', 'FULL_BODY', 'Mông, Tay sau, Bụng', 'quadriceps,front-deltoids', 'gluteal,triceps,abs',
    'Thanh đòn', 'barbell', 'INTERMEDIATE', 'GYM', 'STRENGTH,FAT_LOSS', 'STRENGTH', 'Kết hợp front squat và đẩy vai trong một động tác liền mạch, tập toàn thân.', 'Targets the delts; also works the quadriceps, glutes, hamstrings, core. Equipment: barbell.',
    '1. Giữ thanh trước vai như front squat, khuỷu cao.\n2. Ngồi xuống squat, ngực mở.\n3. Đứng lên bùng nổ và dùng đà đẩy thanh lên qua đầu.\n4. Hạ thanh về vai rồi vào lần squat tiếp theo.',
    '1. Giữ thanh trước vai như front squat, khuỷu cao.\n2. Ngồi xuống squat, ngực mở.\n3. Đứng lên bùng nổ và dùng đà đẩy thanh lên qua đầu.\n4. Hạ thanh về vai rồi vào lần squat tiếp theo.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Khuỷu tụt khi squat; ưỡn lưng khi đẩy; ngắt quãng giữa squat và đẩy.', @safe, @dose_strength, '4 x 6–8', 'gv-3305', 'ADAPTED', 'APPROVED',
    '1. Start by standing with your feet shoulder-width apart, holding a barbell at shoulder height with an overhand grip.\n2. Lower into a squat position by bending your knees and pushing your hips back.\n3. As you reach the bottom of the squat, explosively drive through your heels to stand up, simultaneously pressing the barbell overhead.\n4. Lower the barbell back to shoulder height as you lower back into the squat position.\n5. Repeat for the desired number of repetitions.',
    '1. Start by standing with your feet shoulder-width apart, holding a barbell at shoulder height with an overhand grip.\n2. Lower into a squat position by bending your knees and pushing your hips back.\n3. As you reach the bottom of the squat, explosively drive through your heels to stand up, simultaneously pressing the barbell overhead.\n4. Lower the barbell back to shoulder height as you lower back into the squat position.\n5. Repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '4 x 6–8'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Thruster thanh đòn' OR name_en = 'Barbell thruster' OR external_id = '3305');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1354', 'Đập bóng tạ', 'Medicine ball overhead slam', 'Medicine ball slam', 'STRENGTH', 'FULL_BODY', 'FULL_BODY', 'Vai trước, Mông, Tay sau', 'abs,upper-back', 'front-deltoids,gluteal,triceps',
    'Bóng tập', 'ball', 'BEGINNER', 'ANY', 'FAT_LOSS,STRENGTH', 'FAT_LOSS', 'Nâng bóng tạ qua đầu rồi đập mạnh xuống sàn, bài toàn thân bùng nổ và đốt năng lượng.', 'Targets the upper back; also works the shoulders, core. Equipment: medicine ball.',
    '1. Đứng rộng bằng vai, hai tay cầm bóng tạ trước ngực.\n2. Nâng bóng lên cao qua đầu, nhón nhẹ.\n3. Siết bụng đập bóng mạnh xuống sàn trước mặt.\n4. Ngồi xuống nhặt bóng với lưng thẳng rồi lặp lại.',
    '1. Đứng rộng bằng vai, hai tay cầm bóng tạ trước ngực.\n2. Nâng bóng lên cao qua đầu, nhón nhẹ.\n3. Siết bụng đập bóng mạnh xuống sàn trước mặt.\n4. Ngồi xuống nhặt bóng với lưng thẳng rồi lặp lại.',
    'Thở ra khi gắng sức (đẩy, kéo, nâng), hít vào khi trở về; không nín thở.', 'Dùng bóng nảy cao vào mặt; cong lưng khi nhặt; chỉ dùng tay.', @safe, @dose_strength, '3 x 10–12', 'gv-1354', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart, holding a medicine ball with both hands above your head.\n2. Engage your core and keep your back straight.\n3. Bend your knees slightly and forcefully slam the medicine ball down to the ground in front of you.\n4. As you slam the ball down, use your entire body to generate power, including your shoulders and core.\n5. Catch the ball on the bounce and repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart, holding a medicine ball with both hands above your head.\n2. Engage your core and keep your back straight.\n3. Bend your knees slightly and forcefully slam the medicine ball down to the ground in front of you.\n4. As you slam the ball down, use your entire body to generate power, including your shoulders and core.\n5. Catch the ball on the bounce and repeat for the desired number of repetitions.',
    'Exhale on the effort (push, pull, lift), inhale on the return; do not hold your breath.', @safe_en, @dose_strength_en, '3 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Đập bóng tạ' OR name_en = 'Medicine ball overhead slam' OR external_id = '1354');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1604', 'World''s greatest stretch', 'World greatest stretch', 'World''s greatest stretch, giãn cơ toàn thân', 'WARMUP', 'DYNAMIC_STRETCH', 'FULL_BODY', 'Đùi trước, Liên sườn, Đùi trong', 'gluteal,hamstring,upper-back', 'quadriceps,obliques,adductor',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Chuỗi giãn cơ động kết hợp chùng chân sâu, xoay thân và vươn tay, mở hông và cột sống trước buổi tập.', 'Targets the hamstrings; also works the glutes, quadriceps, calves. Equipment: body weight.',
    '1. Bước chân phải lên trước vào tư thế chùng chân sâu, tay trái chống sàn.\n2. Đặt khuỷu phải xuống gần mu bàn chân phải.\n3. Xoay thân, vươn tay phải lên trần nhà, mắt nhìn theo tay.\n4. Trở về và đổi bên.',
    '1. Bước chân phải lên trước vào tư thế chùng chân sâu, tay trái chống sàn.\n2. Đặt khuỷu phải xuống gần mu bàn chân phải.\n3. Xoay thân, vươn tay phải lên trần nhà, mắt nhìn theo tay.\n4. Trở về và đổi bên.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Làm vội; gối sau chạm sàn mạnh; nín thở.', @safe, @dose_warmup, '2 x 5 mỗi bên', 'gv-1604', 'ADAPTED', 'APPROVED',
    '1. Start in a lunge position with your right foot forward and your left foot back.\n2. Place your hands on the ground on either side of your right foot.\n3. Lower your left knee to the ground and extend your right leg, keeping your right foot flat on the ground.\n4. Rotate your torso to the right, reaching your right arm up towards the ceiling.\n5. Hold this position for a few seconds, then return to the starting position.\n6. Switch sides and repeat the stretch with your left foot forward.',
    '1. Start in a lunge position with your right foot forward and your left foot back.\n2. Place your hands on the ground on either side of your right foot.\n3. Lower your left knee to the ground and extend your right leg, keeping your right foot flat on the ground.\n4. Rotate your torso to the right, reaching your right arm up towards the ceiling.\n5. Hold this position for a few seconds, then return to the starting position.\n6. Switch sides and repeat the stretch with your left foot forward.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x 5 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'World''s greatest stretch' OR name_en = 'World greatest stretch' OR external_id = '1604');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1471', 'Sâu đo (Inchworm)', 'Inchworm', 'Inchworm', 'WARMUP', 'DYNAMIC_STRETCH', 'FULL_BODY', 'Vai trước, Ngực', 'hamstring,abs', 'front-deltoids,chest',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Từ tư thế đứng gập người, bò tay ra tới plank rồi đi chân về, làm ấm đùi sau, vai và cơ lõi.', 'Targets the abs; also works the shoulders, hamstrings. Equipment: body weight.',
    '1. Đứng thẳng, gập người đặt tay xuống sàn trước chân.\n2. Bò tay ra trước tới tư thế plank cao.\n3. Giữ một nhịp, siết bụng.\n4. Bước chân lại gần tay rồi đứng lên.',
    '1. Đứng thẳng, gập người đặt tay xuống sàn trước chân.\n2. Bò tay ra trước tới tư thế plank cao.\n3. Giữ một nhịp, siết bụng.\n4. Bước chân lại gần tay rồi đứng lên.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Võng hông ở plank; gập gối quá nhiều; làm quá nhanh.', @safe, @dose_warmup, '2 x 6', 'gv-1471', 'ADAPTED', 'APPROVED',
    '1. Start in a standing position with your feet hip-width apart.\n2. Bend forward at the waist and place your hands on the ground in front of you.\n3. Walk your hands forward until you are in a high plank position, with your body in a straight line from head to toe.\n4. Pause for a moment, then walk your hands back towards your feet, keeping your legs as straight as possible.\n5. Once your hands reach your feet, stand back up to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Start in a standing position with your feet hip-width apart.\n2. Bend forward at the waist and place your hands on the ground in front of you.\n3. Walk your hands forward until you are in a high plank position, with your body in a straight line from head to toe.\n4. Pause for a moment, then walk your hands back towards your feet, keeping your legs as straight as possible.\n5. Once your hands reach your feet, stand back up to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x 6'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Sâu đo (Inchworm)' OR name_en = 'Inchworm' OR external_id = '1471');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0643', 'Giãn tay sau qua đầu', 'Overhead triceps stretch', 'Overhead triceps stretch', 'WARMUP', 'DYNAMIC_STRETCH', 'ARMS', 'Vai sau', 'triceps', 'back-deltoids',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Kéo giãn tay sau và vai bằng cách đưa tay qua đầu, gập khuỷu và kéo nhẹ.', 'Targets the triceps; also works the shoulders. Equipment: body weight.',
    '1. Đứng hoặc ngồi thẳng.\n2. Đưa một tay qua đầu, gập khuỷu để bàn tay chạm sau lưng.\n3. Tay kia kéo nhẹ khuỷu về phía đầu.\n4. Giữ rồi đổi bên.',
    '1. Đứng hoặc ngồi thẳng.\n2. Đưa một tay qua đầu, gập khuỷu để bàn tay chạm sau lưng.\n3. Tay kia kéo nhẹ khuỷu về phía đầu.\n4. Giữ rồi đổi bên.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Kéo quá mạnh; cúi đầu; nín thở.', @safe, @dose_warmup, '2 x giữ 20–30 giây mỗi bên', 'gv-0643', 'ADAPTED', 'APPROVED',
    '1. Stand or sit upright with your feet shoulder-width apart.\n2. Extend one arm overhead, bending at the elbow so that your hand reaches towards the opposite shoulder blade.\n3. With your other hand, gently pull the elbow of the extended arm towards the opposite side of your head, feeling a stretch in your triceps.\n4. Hold the stretch for 15-30 seconds, then release.\n5. Repeat on the other side.',
    '1. Stand or sit upright with your feet shoulder-width apart.\n2. Extend one arm overhead, bending at the elbow so that your hand reaches towards the opposite shoulder blade.\n3. With your other hand, gently pull the elbow of the extended arm towards the opposite side of your head, feeling a stretch in your triceps.\n4. Hold the stretch for 15-30 seconds, then release.\n5. Repeat on the other side.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x hold 20–30 seconds per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Giãn tay sau qua đầu' OR name_en = 'Overhead triceps stretch' OR external_id = '0643');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0669', 'Giãn vai sau', 'Rear deltoid stretch', 'Cross-body shoulder stretch', 'WARMUP', 'SHOULDER_WARMUP', 'SHOULDERS', 'Lưng trên & xô', 'back-deltoids', 'upper-back',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Kéo cánh tay ngang qua ngực để giãn vai sau và lưng trên.', 'Targets the delts; also works the trapezius, rhomboids. Equipment: body weight.',
    '1. Đứng thẳng, đưa tay phải ngang qua ngực.\n2. Tay trái đặt trên khuỷu tay phải.\n3. Kéo nhẹ tay phải về phía vai trái.\n4. Giữ rồi đổi bên.',
    '1. Đứng thẳng, đưa tay phải ngang qua ngực.\n2. Tay trái đặt trên khuỷu tay phải.\n3. Kéo nhẹ tay phải về phía vai trái.\n4. Giữ rồi đổi bên.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Nhún vai; xoay thân; kéo quá mạnh.', @safe, @dose_warmup, '2 x giữ 20–30 giây mỗi bên', 'gv-0669', 'ADAPTED', 'APPROVED',
    '1. Stand tall with your feet shoulder-width apart.\n2. Extend your right arm across your chest, placing your left hand on your right elbow.\n3. Gently pull your right arm towards your left shoulder, feeling a stretch in your right shoulder.\n4. Hold the stretch for 15-30 seconds, then release.\n5. Repeat on the other side.',
    '1. Stand tall with your feet shoulder-width apart.\n2. Extend your right arm across your chest, placing your left hand on your right elbow.\n3. Gently pull your right arm towards your left shoulder, feeling a stretch in your right shoulder.\n4. Hold the stretch for 15-30 seconds, then release.\n5. Repeat on the other side.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x hold 20–30 seconds per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Giãn vai sau' OR name_en = 'Rear deltoid stretch' OR external_id = '0669');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1405', 'Giãn ngực và lưng trên', 'Back pec stretch', 'Back and chest stretch', 'WARMUP', 'SHOULDER_WARMUP', 'BACK', 'Vai trước', 'upper-back,chest', 'front-deltoids',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Đan tay, xoay lòng bàn tay ra ngoài và vươn tay, giãn lưng trên và ngực.', 'Targets the lats; also works the shoulders, chest. Equipment: body weight.',
    '1. Đứng thẳng, hai tay duỗi ra trước ngang vai.\n2. Đan các ngón tay, xoay lòng bàn tay ra ngoài.\n3. Đẩy tay ra xa và nâng dần lên, cảm nhận lưng trên căng.\n4. Giữ rồi thả lỏng.',
    '1. Đứng thẳng, hai tay duỗi ra trước ngang vai.\n2. Đan các ngón tay, xoay lòng bàn tay ra ngoài.\n3. Đẩy tay ra xa và nâng dần lên, cảm nhận lưng trên căng.\n4. Giữ rồi thả lỏng.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Ưỡn lưng; nhún vai; nín thở.', @safe, @dose_warmup, '2 x giữ 20 giây', 'gv-1405', 'ADAPTED', 'APPROVED',
    '1. Stand tall with your feet shoulder-width apart.\n2. Extend your arms straight out in front of you, parallel to the ground.\n3. Cross your arms in front of your body, with your right arm over your left arm.\n4. Interlock your fingers and rotate your palms away from your body.\n5. Slowly raise your arms up and away from your body, feeling a stretch in your back and chest.\n6. Hold the stretch for 15-30 seconds, then release.\n7. Repeat on the opposite side.',
    '1. Stand tall with your feet shoulder-width apart.\n2. Extend your arms straight out in front of you, parallel to the ground.\n3. Cross your arms in front of your body, with your right arm over your left arm.\n4. Interlock your fingers and rotate your palms away from your body.\n5. Slowly raise your arms up and away from your body, feeling a stretch in your back and chest.\n6. Hold the stretch for 15-30 seconds, then release.\n7. Repeat on the opposite side.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x hold 20 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Giãn ngực và lưng trên' OR name_en = 'Back pec stretch' OR external_id = '1405');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1368', 'Xoay cổ chân', 'Ankle circles', 'Ankle circles', 'WARMUP', 'JOINT_ROTATION', 'LEGS', NULL, 'calves', NULL,
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Xoay tròn cổ chân để làm ấm khớp trước khi chạy hoặc tập chân.', 'Targets the calves; also works the ankle stabilizers. Equipment: body weight.',
    '1. Ngồi hoặc đứng vịn tường, nhấc một chân lên.\n2. Xoay tròn bàn chân theo chiều kim đồng hồ.\n3. Đổi chiều xoay.\n4. Đổi sang chân kia.',
    '1. Ngồi hoặc đứng vịn tường, nhấc một chân lên.\n2. Xoay tròn bàn chân theo chiều kim đồng hồ.\n3. Đổi chiều xoay.\n4. Đổi sang chân kia.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Xoay quá nhanh; biên độ nhỏ; chỉ cử động ngón chân.', @safe, @dose_warmup, '2 x 10 vòng mỗi chiều mỗi chân', 'gv-1368', 'ADAPTED', 'APPROVED',
    '1. Sit on the ground with your legs extended in front of you.\n2. Lift one leg off the ground and rotate your ankle in a circular motion.\n3. Perform the desired number of circles in one direction, then switch to the other direction.\n4. Repeat with the other leg.',
    '1. Sit on the ground with your legs extended in front of you.\n2. Lift one leg off the ground and rotate your ankle in a circular motion.\n3. Perform the desired number of circles in one direction, then switch to the other direction.\n4. Repeat with the other leg.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x 10 circles each direction per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Xoay cổ chân' OR name_en = 'Ankle circles' OR external_id = '1368');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1418', 'Ôm gối vào ngực', 'Hug keens to chest', 'Knee hug', 'WARMUP', 'HIP_WARMUP', 'LEGS', 'Đùi sau', 'gluteal,lower-back', 'hamstring',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Đứng kéo một gối lên ôm vào ngực, làm ấm khớp hông và giãn mông.', 'Targets the glutes; also works the hamstrings, quadriceps. Equipment: body weight.',
    '1. Đứng thẳng.\n2. Nâng gối phải lên, hai tay ôm cẳng chân kéo gối về ngực.\n3. Nhón nhẹ chân trụ, giữ một nhịp.\n4. Đặt xuống và đổi chân.',
    '1. Đứng thẳng.\n2. Nâng gối phải lên, hai tay ôm cẳng chân kéo gối về ngực.\n3. Nhón nhẹ chân trụ, giữ một nhịp.\n4. Đặt xuống và đổi chân.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Cúi người xuống gối; mất thăng bằng; làm vội.', @safe, @dose_warmup, '2 x 8 mỗi chân', 'gv-1418', 'ADAPTED', 'APPROVED',
    '1. Start by standing with your feet shoulder-width apart.\n2. Bend your knees and lower your body down into a squat position.\n3. As you squat down, bring your knees up towards your chest and hug them with your arms.\n4. Hold this position for a moment, then slowly return to the starting position.\n5. Repeat for the desired number of repetitions.',
    '1. Start by standing with your feet shoulder-width apart.\n2. Bend your knees and lower your body down into a squat position.\n3. As you squat down, bring your knees up towards your chest and hug them with your arms.\n4. Hold this position for a moment, then slowly return to the starting position.\n5. Repeat for the desired number of repetitions.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x 8 per leg'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Ôm gối vào ngực' OR name_en = 'Hug keens to chest' OR external_id = '1418');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1494', 'Tư thế cánh bướm', 'Butterfly yoga pose', 'Butterfly stretch', 'WARMUP', 'HIP_WARMUP', 'LEGS', 'Mông', 'adductor', 'gluteal',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Ngồi áp hai lòng bàn chân vào nhau và hạ gối xuống, giãn đùi trong và mở hông.', 'Targets the adductors; also works the hamstrings, groin. Equipment: body weight.',
    '1. Ngồi thẳng lưng, áp hai lòng bàn chân vào nhau.\n2. Kéo gót về gần người vừa sức.\n3. Hai tay giữ bàn chân, khuỷu ấn nhẹ lên đùi.\n4. Giữ và hít thở đều.',
    '1. Ngồi thẳng lưng, áp hai lòng bàn chân vào nhau.\n2. Kéo gót về gần người vừa sức.\n3. Hai tay giữ bàn chân, khuỷu ấn nhẹ lên đùi.\n4. Giữ và hít thở đều.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Cong lưng; ấn gối quá mạnh; nảy gối.', @safe, @dose_warmup, '2 x giữ 30 giây', 'gv-1494', 'ADAPTED', 'APPROVED',
    '1. Sit on the floor with your legs extended in front of you.\n2. Bend your knees and bring the soles of your feet together, allowing your knees to fall out to the sides.\n3. Hold onto your ankles or feet with your hands.\n4. Sit up tall and lengthen your spine.\n5. Gently press your knees down towards the floor, feeling a stretch in your inner thighs.\n6. Hold this position for a few breaths.\n7. To release, slowly bring your knees back up and extend your legs.',
    '1. Sit on the floor with your legs extended in front of you.\n2. Bend your knees and bring the soles of your feet together, allowing your knees to fall out to the sides.\n3. Hold onto your ankles or feet with your hands.\n4. Sit up tall and lengthen your spine.\n5. Gently press your knees down towards the floor, feeling a stretch in your inner thighs.\n6. Hold this position for a few breaths.\n7. To release, slowly bring your knees back up and extend your legs.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x hold 30 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Tư thế cánh bướm' OR name_en = 'Butterfly yoga pose' OR external_id = '1494');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3147', 'Nghiêng khung chậu', 'Pelvic tilt', 'Pelvic tilt', 'WARMUP', 'MUSCLE_ACTIVATION', 'CORE', 'Lưng dưới', 'abs', 'lower-back',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'HOME', 'MOBILITY', 'MOBILITY', 'Nằm ngửa ép lưng dưới xuống sàn bằng cơ bụng, kích hoạt cơ lõi và giảm căng lưng dưới.', 'Targets the abs; also works the lower back. Equipment: body weight.',
    '1. Nằm ngửa, gập gối, bàn chân đặt sàn.\n2. Hai tay để dọc thân.\n3. Siết bụng, nghiêng khung chậu để lưng dưới ép xuống sàn.\n4. Giữ vài giây rồi thả lỏng.',
    '1. Nằm ngửa, gập gối, bàn chân đặt sàn.\n2. Hai tay để dọc thân.\n3. Siết bụng, nghiêng khung chậu để lưng dưới ép xuống sàn.\n4. Giữ vài giây rồi thả lỏng.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Nâng mông khỏi sàn; nín thở; dùng chân đẩy.', @safe, @dose_warmup, '2 x 10–12', 'gv-3147', 'ADAPTED', 'APPROVED',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Place your hands by your sides.\n3. Engage your abs and tilt your pelvis upward, pressing your lower back into the ground.\n4. Hold this position for a few seconds, focusing on contracting your abs.\n5. Release the tilt and return to the starting position.\n6. Repeat for the desired number of repetitions.',
    '1. Lie flat on your back with your knees bent and feet flat on the ground.\n2. Place your hands by your sides.\n3. Engage your abs and tilt your pelvis upward, pressing your lower back into the ground.\n4. Hold this position for a few seconds, focusing on contracting your abs.\n5. Release the tilt and return to the starting position.\n6. Repeat for the desired number of repetitions.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nghiêng khung chậu' OR name_en = 'Pelvic tilt' OR external_id = '3147');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '2329', 'Xoay cột sống khi ngồi', 'Spine twist', 'Seated spine twist', 'WARMUP', 'DYNAMIC_STRETCH', 'CORE', 'Bụng, Lưng dưới', 'obliques', 'abs,lower-back',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Ngồi xoay thân luân phiên sang hai bên, làm linh hoạt cột sống và cơ liên sườn.', 'Targets the abs; also works the obliques, lower back. Equipment: body weight.',
    '1. Ngồi trên sàn, gập gối, bàn chân đặt sàn.\n2. Hai tay đặt sau đầu, khuỷu mở.\n3. Xoay thân sang phải, đưa khuỷu về phía gối đối diện.\n4. Trở về giữa rồi xoay sang trái.',
    '1. Ngồi trên sàn, gập gối, bàn chân đặt sàn.\n2. Hai tay đặt sau đầu, khuỷu mở.\n3. Xoay thân sang phải, đưa khuỷu về phía gối đối diện.\n4. Trở về giữa rồi xoay sang trái.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Cong lưng; kéo cổ; xoay giật.', @safe, @dose_warmup, '2 x 8 mỗi bên', 'gv-2329', 'ADAPTED', 'APPROVED',
    '1. Sit on the ground with your legs extended in front of you.\n2. Bend your knees and place your feet flat on the ground, hip-width apart.\n3. Place your hands behind your head with your elbows pointing outwards.\n4. Engage your abs and slowly twist your torso to the right, bringing your right elbow towards your left knee.\n5. Pause for a moment at the end of the twist, then slowly return to the starting position.\n6. Repeat the twist to the left side, bringing your left elbow towards your right knee.\n7. Continue alternating sides for the desired number of repetitions.',
    '1. Sit on the ground with your legs extended in front of you.\n2. Bend your knees and place your feet flat on the ground, hip-width apart.\n3. Place your hands behind your head with your elbows pointing outwards.\n4. Engage your abs and slowly twist your torso to the right, bringing your right elbow towards your left knee.\n5. Pause for a moment at the end of the twist, then slowly return to the starting position.\n6. Repeat the twist to the left side, bringing your left elbow towards your right knee.\n7. Continue alternating sides for the desired number of repetitions.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x 8 per side'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Xoay cột sống khi ngồi' OR name_en = 'Spine twist' OR external_id = '2329');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '1685', 'Squat vươn tay qua đầu', 'Squat to overhead reach', 'Squat to overhead reach', 'WARMUP', 'FULL_BODY_WARMUP', 'FULL_BODY', 'Vai trước, Lưng trên & xô', 'quadriceps,gluteal', 'front-deltoids,upper-back',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY', 'Ngồi squat rồi đứng lên vươn hai tay qua đầu, làm ấm chân, vai và cột sống.', 'Targets the quads; also works the glutes, hamstrings, core. Equipment: body weight.',
    '1. Đứng rộng bằng vai, mũi chân hơi mở.\n2. Ngồi xuống squat, tay đưa ra trước.\n3. Đứng lên và vươn hai tay qua đầu.\n4. Hạ tay rồi vào lần squat tiếp theo.',
    '1. Đứng rộng bằng vai, mũi chân hơi mở.\n2. Ngồi xuống squat, tay đưa ra trước.\n3. Đứng lên và vươn hai tay qua đầu.\n4. Hạ tay rồi vào lần squat tiếp theo.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Gót nhấc; cong lưng; vươn tay ưỡn lưng.', @safe, @dose_warmup, '2 x 10', 'gv-1685', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and toes slightly turned out.\n2. Lower your body down into a squat position by bending your knees and pushing your hips back.\n3. As you come up from the squat, extend your arms overhead, reaching towards the ceiling.\n4. Return to the starting position by lowering your arms and bending your knees to squat down again.\n5. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and toes slightly turned out.\n2. Lower your body down into a squat position by bending your knees and pushing your hips back.\n3. As you come up from the squat, extend your arms overhead, reaching towards the ceiling.\n4. Return to the starting position by lowering your arms and bending your knees to squat down again.\n5. Repeat for the desired number of repetitions.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x 10'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Squat vươn tay qua đầu' OR name_en = 'Squat to overhead reach' OR external_id = '1685');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3636', 'Nâng cao gối vào tường', 'High knee against wall', 'Wall high knees', 'WARMUP', 'FULL_BODY_WARMUP', 'CARDIO', 'Bắp chân', 'quadriceps,abs', 'calves',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'HOME', 'ENDURANCE', 'ENDURANCE', 'Chống tay vào tường và nâng cao gối luân phiên nhanh, làm nóng cơ thể và tăng nhịp tim.', 'Targets the cardiovascular system; also works the quadriceps, hamstrings, glutes, calves. Equipment: body weight.',
    '1. Đứng đối diện tường, hai tay chống tường.\n2. Siết bụng, thân hơi nghiêng.\n3. Nâng gối phải về ngực rồi đổi nhanh sang gối trái.\n4. Giữ nhịp nhanh như chạy tại chỗ.',
    '1. Đứng đối diện tường, hai tay chống tường.\n2. Siết bụng, thân hơi nghiêng.\n3. Nâng gối phải về ngực rồi đổi nhanh sang gối trái.\n4. Giữ nhịp nhanh như chạy tại chỗ.',
    'Hít thở chậm và đều theo nhịp động tác.', 'Gục người vào tường; nâng gối thấp; tiếp đất nặng.', @safe, @dose_warmup, '2 x 30 giây', 'gv-3636', 'ADAPTED', 'APPROVED',
    '1. Stand facing a wall with your feet hip-width apart.\n2. Place your hands on the wall for support.\n3. Engage your core and lift your right knee up towards your chest, while keeping your left foot on the ground.\n4. Quickly switch legs, bringing your left knee up towards your chest and lowering your right foot back down.\n5. Continue alternating legs in a running motion, bringing your knees up as high as possible.\n6. Maintain a fast pace and keep your upper body stable throughout the exercise.\n7. Repeat for the desired duration or number of repetitions.',
    '1. Stand facing a wall with your feet hip-width apart.\n2. Place your hands on the wall for support.\n3. Engage your core and lift your right knee up towards your chest, while keeping your left foot on the ground.\n4. Quickly switch legs, bringing your left knee up towards your chest and lowering your right foot back down.\n5. Continue alternating legs in a running motion, bringing your knees up as high as possible.\n6. Maintain a fast pace and keep your upper body stable throughout the exercise.\n7. Repeat for the desired duration or number of repetitions.',
    'Breathe slowly and evenly with the rhythm of the movement.', @safe_en, @dose_warmup_en, '2 x 30 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nâng cao gối vào tường' OR name_en = 'High knee against wall' OR external_id = '3636');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3360', 'Bò gấu', 'Bear crawl', 'Bear crawl', 'CARDIO', 'HIIT', 'CARDIO', 'Đùi trước, Tay sau', 'abs,front-deltoids', 'quadriceps,triceps',
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'ENDURANCE,FAT_LOSS', 'ENDURANCE', 'Bò trên tay và mũi chân với gối cách sàn, tập cơ lõi, vai và sức bền.', 'Targets the cardiovascular system; also works the core, shoulders, triceps. Equipment: body weight.',
    '1. Quỳ chống tay dưới vai, gối dưới hông, nhấc gối cách sàn vài cm.\n2. Siết bụng, lưng phẳng.\n3. Bước tay phải và chân trái lên trước cùng lúc.\n4. Đổi bên và tiếp tục bò.',
    '1. Quỳ chống tay dưới vai, gối dưới hông, nhấc gối cách sàn vài cm.\n2. Siết bụng, lưng phẳng.\n3. Bước tay phải và chân trái lên trước cùng lúc.\n4. Đổi bên và tiếp tục bò.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Nhô mông cao; lắc hông; gối chạm sàn.', @safe, @dose_cardio, '4 x 20–30 giây', 'gv-3360', 'ADAPTED', 'APPROVED',
    '1. Start on all fours with your hands directly under your shoulders and your knees directly under your hips.\n2. Lift your knees slightly off the ground, keeping your back flat and your core engaged.\n3. Move your right hand and left foot forward simultaneously, followed by your left hand and right foot.\n4. Continue crawling forward, alternating your hand and foot movements.\n5. Maintain a steady pace and keep your core tight throughout the exercise.\n6. Continue for the desired distance or time.',
    '1. Start on all fours with your hands directly under your shoulders and your knees directly under your hips.\n2. Lift your knees slightly off the ground, keeping your back flat and your core engaged.\n3. Move your right hand and left foot forward simultaneously, followed by your left hand and right foot.\n4. Continue crawling forward, alternating your hand and foot movements.\n5. Maintain a steady pace and keep your core tight throughout the exercise.\n6. Continue for the desired distance or time.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '4 x 20–30 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bò gấu' OR name_en = 'Bear crawl' OR external_id = '3360');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0501', 'Burpee bật sao', 'Jack burpee', 'Jack burpee', 'CARDIO', 'HIIT', 'CARDIO', 'Bụng, Vai trước, Bắp chân', 'quadriceps,chest', 'abs,front-deltoids,calves',
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'FAT_LOSS,ENDURANCE', 'FAT_LOSS', 'Kết hợp burpee với một lần bật nhảy dang tay chân, tăng nhịp tim mạnh.', 'Targets the cardiovascular system; also works the quadriceps, hamstrings, calves, shoulders, triceps, core. Equipment: body weight.',
    '1. Đứng thẳng, ngồi xuống đặt tay xuống sàn.\n2. Bật chân ra sau vào tư thế plank.\n3. Bật chân về và đứng lên.\n4. Bật nhảy dang tay chân như nhảy sao rồi lặp lại.',
    '1. Đứng thẳng, ngồi xuống đặt tay xuống sàn.\n2. Bật chân ra sau vào tư thế plank.\n3. Bật chân về và đứng lên.\n4. Bật nhảy dang tay chân như nhảy sao rồi lặp lại.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Võng hông ở plank; tiếp đất nặng; mất kỹ thuật khi mệt.', @safe, @dose_cardio, '4 x 8–10', 'gv-0501', 'ADAPTED', 'APPROVED',
    '1. Start in a standing position with your feet shoulder-width apart.\n2. Lower your body into a squat position, placing your hands on the ground in front of you.\n3. Kick your feet back, landing in a push-up position.\n4. Perform a push-up, lowering your chest to the ground and then pushing back up.\n5. Jump your feet forward, landing in a squat position.\n6. Jump up explosively, reaching your arms overhead.\n7. Land softly and immediately lower back into the squat position to begin the next repetition.',
    '1. Start in a standing position with your feet shoulder-width apart.\n2. Lower your body into a squat position, placing your hands on the ground in front of you.\n3. Kick your feet back, landing in a push-up position.\n4. Perform a push-up, lowering your chest to the ground and then pushing back up.\n5. Jump your feet forward, landing in a squat position.\n6. Jump up explosively, reaching your arms overhead.\n7. Land softly and immediately lower back into the squat position to begin the next repetition.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '4 x 8–10'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Burpee bật sao' OR name_en = 'Jack burpee' OR external_id = '0501');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3223', 'Bật nhảy hình sao', 'Star jump (male)', 'Star jump', 'CARDIO', 'HIIT', 'CARDIO', 'Mông, Vai trước', 'quadriceps,calves', 'gluteal,front-deltoids',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'FAT_LOSS,ENDURANCE', 'FAT_LOSS', 'Ngồi thấp rồi bật nhảy dang rộng tay chân thành hình ngôi sao.', 'Targets the cardiovascular system; also works the quadriceps, hamstrings, calves. Equipment: body weight.',
    '1. Đứng chụm chân, ngồi nhẹ xuống.\n2. Bật nhảy lên, dang rộng tay chân.\n3. Khép tay chân lại trước khi tiếp đất.\n4. Tiếp đất mềm và lặp lại.',
    '1. Đứng chụm chân, ngồi nhẹ xuống.\n2. Bật nhảy lên, dang rộng tay chân.\n3. Khép tay chân lại trước khi tiếp đất.\n4. Tiếp đất mềm và lặp lại.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Tiếp đất gối thẳng; gối chụm; nín thở.', @safe, @dose_cardio, '4 x 10–12', 'gv-3223', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart and your arms by your sides.\n2. Bend your knees slightly and jump up explosively.\n3. As you jump, spread your legs and extend your arms out to the sides, forming a star shape with your body.\n4. Land softly on the balls of your feet with your knees slightly bent.\n5. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart and your arms by your sides.\n2. Bend your knees slightly and jump up explosively.\n3. As you jump, spread your legs and extend your arms out to the sides, forming a star shape with your body.\n4. Land softly on the balls of your feet with your knees slightly bent.\n5. Repeat for the desired number of repetitions.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '4 x 10–12'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bật nhảy hình sao' OR name_en = 'Star jump (male)' OR external_id = '3223');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3361', 'Bật nhảy trượt băng', 'Skater hops', 'Skater hops', 'CARDIO', 'HIIT', 'CARDIO', 'Hông ngoài, Bắp chân', 'gluteal,quadriceps', 'abductors,calves',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'FAT_LOSS,BALANCE', 'FAT_LOSS', 'Bật nhảy sang ngang từ chân này sang chân kia như vận động viên trượt băng.', 'Targets the cardiovascular system; also works the quadriceps, hamstrings, glutes, calves. Equipment: body weight.',
    '1. Đứng trên chân phải, gối hơi gập.\n2. Bật sang trái, tiếp đất bằng chân trái.\n3. Đưa chân phải chéo ra sau, mũi chân chạm nhẹ sàn.\n4. Bật ngược sang phải và tiếp tục.',
    '1. Đứng trên chân phải, gối hơi gập.\n2. Bật sang trái, tiếp đất bằng chân trái.\n3. Đưa chân phải chéo ra sau, mũi chân chạm nhẹ sàn.\n4. Bật ngược sang phải và tiếp tục.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Tiếp đất gối thẳng; gối đổ vào; bật quá xa khi mới tập.', @safe, @dose_cardio, '4 x 30 giây', 'gv-3361', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart.\n2. Bend your knees slightly and jump to the right, landing on your right foot.\n3. As you land, swing your left leg behind your right leg and tap the ground with your left toes.\n4. Immediately jump to the left, landing on your left foot.\n5. As you land, swing your right leg behind your left leg and tap the ground with your right toes.\n6. Continue alternating sides, jumping and tapping the ground with each leg.\n7. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart.\n2. Bend your knees slightly and jump to the right, landing on your right foot.\n3. As you land, swing your left leg behind your right leg and tap the ground with your left toes.\n4. Immediately jump to the left, landing on your left foot.\n5. As you land, swing your right leg behind your left leg and tap the ground with your right toes.\n6. Continue alternating sides, jumping and tapping the ground with each leg.\n7. Repeat for the desired number of repetitions.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '4 x 30 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bật nhảy trượt băng' OR name_en = 'Skater hops' OR external_id = '3361');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3671', 'Bước trượt tuyết', 'Ski step', 'Ski step', 'CARDIO', 'HIIT', 'CARDIO', 'Bắp chân, Hông ngoài', 'quadriceps,gluteal', 'calves,abductors',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'FAT_LOSS', 'FAT_LOSS', 'Nhảy nhẹ sang hai bên mô phỏng động tác trượt tuyết, làm nóng và đốt năng lượng.', 'Targets the cardiovascular system; also works the quadriceps, hamstrings, glutes, calves. Equipment: body weight.',
    '1. Đứng rộng bằng vai, gối hơi gập.\n2. Nhảy sang phải, tiếp đất chân phải, chân trái vung ra sau.\n3. Nhảy ngay sang trái theo cách tương tự.\n4. Giữ nhịp đều.',
    '1. Đứng rộng bằng vai, gối hơi gập.\n2. Nhảy sang phải, tiếp đất chân phải, chân trái vung ra sau.\n3. Nhảy ngay sang trái theo cách tương tự.\n4. Giữ nhịp đều.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Thân đổ quá nhiều; tiếp đất nặng; nín thở.', @safe, @dose_cardio, '4 x 30 giây', 'gv-3671', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart.\n2. Bend your knees slightly and keep your back straight.\n3. Jump to the right, landing on your right foot while swinging your left leg behind your right leg.\n4. Immediately jump to the left, landing on your left foot while swinging your right leg behind your left leg.\n5. Continue alternating jumps from side to side, mimicking a skiing motion.\n6. Repeat for the desired number of repetitions.',
    '1. Stand with your feet shoulder-width apart.\n2. Bend your knees slightly and keep your back straight.\n3. Jump to the right, landing on your right foot while swinging your left leg behind your right leg.\n4. Immediately jump to the left, landing on your left foot while swinging your right leg behind your left leg.\n5. Continue alternating jumps from side to side, mimicking a skiing motion.\n6. Repeat for the desired number of repetitions.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '4 x 30 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bước trượt tuyết' OR name_en = 'Ski step' OR external_id = '3671');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3672', 'Bước lùi tới', 'Back and forth step', 'Back and forth step', 'CARDIO', 'HIIT', 'CARDIO', 'Bắp chân', 'quadriceps,gluteal', 'calves',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'HOME', 'ENDURANCE', 'ENDURANCE', 'Bước chùng chân tới rồi lùi về luân phiên với nhịp đều, bài cardio nhẹ tại nhà.', 'Targets the cardiovascular system; also works the quadriceps, hamstrings, glutes, calves. Equipment: body weight.',
    '1. Đứng rộng bằng vai.\n2. Bước chân phải lên trước vào tư thế chùng chân nhẹ.\n3. Đẩy về vị trí đầu.\n4. Đổi chân và giữ nhịp đều.',
    '1. Đứng rộng bằng vai.\n2. Bước chân phải lên trước vào tư thế chùng chân nhẹ.\n3. Đẩy về vị trí đầu.\n4. Đổi chân và giữ nhịp đều.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Bước quá dài; gối đổ vào; làm quá nhanh mất kiểm soát.', @safe, @dose_cardio, '3 x 45 giây', 'gv-3672', 'ADAPTED', 'APPROVED',
    '1. Stand with your feet shoulder-width apart.\n2. Step forward with your right foot, bending your knee and lowering your body into a lunge position.\n3. Push off with your right foot and step back to the starting position.\n4. Repeat the movement with your left foot, alternating legs with each step.\n5. Continue stepping back and forth, maintaining a steady pace.\n6. Repeat for the desired duration or number of repetitions.',
    '1. Stand with your feet shoulder-width apart.\n2. Step forward with your right foot, bending your knee and lowering your body into a lunge position.\n3. Push off with your right foot and step back to the starting position.\n4. Repeat the movement with your left foot, alternating legs with each step.\n5. Continue stepping back and forth, maintaining a steady pace.\n6. Repeat for the desired duration or number of repetitions.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '3 x 45 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bước lùi tới' OR name_en = 'Back and forth step' OR external_id = '3672');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3656', 'Chạy bước ngắn', 'Short stride run', 'Short stride run', 'CARDIO', 'RUNNING', 'CARDIO', 'Đùi sau, Mông', 'quadriceps,calves', 'hamstring,gluteal',
    'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'ENDURANCE', 'ENDURANCE', 'Chạy với bước ngắn, nhịp nhanh, giảm lực tiếp đất lên gối.', 'Targets the cardiovascular system; also works the quadriceps, hamstrings, calves. Equipment: body weight.',
    '1. Đứng thẳng, thân hơi đổ về trước.\n2. Chạy với bước ngắn, chân tiếp đất dưới thân.\n3. Đánh tay nhịp nhàng theo bước chân.\n4. Giữ nhịp thở đều.',
    '1. Đứng thẳng, thân hơi đổ về trước.\n2. Chạy với bước ngắn, chân tiếp đất dưới thân.\n3. Đánh tay nhịp nhàng theo bước chân.\n4. Giữ nhịp thở đều.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Bước quá dài đáp gót mạnh; gồng vai; nín thở.', @safe, @dose_cardio, '10–20 phút', 'gv-3656', 'ADAPTED', 'APPROVED',
    '1. Find an open space or a treadmill to perform the exercise.\n2. Stand tall with your feet hip-width apart.\n3. Start jogging in place, lifting your knees high and pumping your arms.\n4. After a few seconds, start taking short strides forward, maintaining a quick pace.\n5. Continue running with short strides for the desired duration or distance.',
    '1. Find an open space or a treadmill to perform the exercise.\n2. Stand tall with your feet hip-width apart.\n3. Start jogging in place, lifting your knees high and pumping your arms.\n4. After a few seconds, start taking short strides forward, maintaining a quick pace.\n5. Continue running with short strides for the desired duration or distance.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '10–20 minutes'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chạy bước ngắn' OR name_en = 'Short stride run' OR external_id = '3656');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '3638', 'Chống đẩy chuyển chạy', 'Push to run', 'Push-up to run', 'CARDIO', 'HIIT', 'CARDIO', 'Đùi trước, Tay sau, Vai trước', 'chest,abs', 'quadriceps,triceps,front-deltoids',
    'Không dụng cụ', 'bodyweight', 'INTERMEDIATE', 'ANY', 'FAT_LOSS,ENDURANCE', 'FAT_LOSS', 'Một lần hít đất rồi chạy gối nhanh ở tư thế plank, kết hợp sức mạnh và tim mạch.', 'Targets the cardiovascular system; also works the quadriceps, hamstrings, calves. Equipment: body weight.',
    '1. Vào tư thế hít đất.\n2. Hít đất một lần.\n3. Đưa nhanh gối luân phiên về ngực như leo núi.\n4. Lặp lại chuỗi trong thời gian quy định.',
    '1. Vào tư thế hít đất.\n2. Hít đất một lần.\n3. Đưa nhanh gối luân phiên về ngực như leo núi.\n4. Lặp lại chuỗi trong thời gian quy định.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Võng hông; nhô mông; mất kỹ thuật khi mệt.', @safe, @dose_cardio, '4 x 30 giây', 'gv-3638', 'ADAPTED', 'APPROVED',
    '1. Start in a push-up position with your hands shoulder-width apart and your body in a straight line.\n2. Lower your chest towards the ground by bending your elbows, keeping your body straight.\n3. Push through your hands to extend your arms and return to the starting position.\n4. Quickly bring one knee towards your chest, then quickly switch and bring the other knee towards your chest.\n5. Continue alternating knees as fast as you can while maintaining good form.\n6. Continue for the desired duration or number of repetitions.',
    '1. Start in a push-up position with your hands shoulder-width apart and your body in a straight line.\n2. Lower your chest towards the ground by bending your elbows, keeping your body straight.\n3. Push through your hands to extend your arms and return to the starting position.\n4. Quickly bring one knee towards your chest, then quickly switch and bring the other knee towards your chest.\n5. Continue alternating knees as fast as you can while maintaining good form.\n6. Continue for the desired duration or number of repetitions.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '4 x 30 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chống đẩy chuyển chạy' OR name_en = 'Push to run' OR external_id = '3638');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '0858', 'Chạy nước rút', 'Wind sprints', 'Wind sprints', 'CARDIO', 'RUNNING', 'CARDIO', 'Bắp chân, Mông, Bụng', 'quadriceps,hamstring', 'calves,gluteal,abs',
    'Không dụng cụ', 'bodyweight', 'ADVANCED', 'ANY', 'FAT_LOSS,ENDURANCE', 'FAT_LOSS', 'Chạy hết sức trong quãng ngắn rồi nghỉ, tăng sức bền yếm khí và đốt năng lượng.', 'Targets the abs; also works the quadriceps, hamstrings, calves. Equipment: body weight.',
    '1. Chọn đường chạy bằng phẳng, khởi động kỹ trước.\n2. Đứng tư thế xuất phát.\n3. Chạy hết sức, đánh tay mạnh, nâng gối cao.\n4. Đi bộ hoặc nghỉ hồi sức rồi lặp lại.',
    '1. Chọn đường chạy bằng phẳng, khởi động kỹ trước.\n2. Đứng tư thế xuất phát.\n3. Chạy hết sức, đánh tay mạnh, nâng gối cao.\n4. Đi bộ hoặc nghỉ hồi sức rồi lặp lại.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Không khởi động; chạy nước rút khi mệt quá; tiếp đất gót mạnh.', @safe, @dose_cardio, '6–8 x 20–30 giây, nghỉ 60–90 giây', 'gv-0858', 'ADAPTED', 'APPROVED',
    '1. Find an open space or a track to perform the exercise.\n2. Start by standing with your feet shoulder-width apart.\n3. Begin running as fast as you can, pumping your arms and driving your knees up.\n4. Continue sprinting for a specific distance or time period.\n5. Rest and repeat for the desired number of repetitions.',
    '1. Find an open space or a track to perform the exercise.\n2. Start by standing with your feet shoulder-width apart.\n3. Begin running as fast as you can, pumping your arms and driving your knees up.\n4. Continue sprinting for a specific distance or time period.\n5. Rest and repeat for the desired number of repetitions.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '6–8 x 20–30 seconds, rest 60–90 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chạy nước rút' OR name_en = 'Wind sprints' OR external_id = '0858');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '2139', 'Đạp xe tay', 'Hands bike', 'Hand bike, arm ergometer', 'CARDIO', 'CYCLING', 'CARDIO', 'Tay trước, Tay sau', 'front-deltoids,upper-back', 'biceps,triceps',
    'Máy tim mạch', 'cardio-machine', 'BEGINNER', 'GYM', 'ENDURANCE', 'ENDURANCE', 'Quay bàn đạp bằng tay trên máy, tập tim mạch cho thân trên, hợp người đang hạn chế vận động chân.', 'Targets the pectorals; also works the triceps, shoulders. Equipment: upper body ergometer.',
    '1. Ngồi thẳng, chỉnh ghế để tay cầm ngang vai.\n2. Nắm hai tay cầm.\n3. Quay đều theo vòng tròn, giữ thân ổn định.\n4. Đổi chiều quay sau vài phút.',
    '1. Ngồi thẳng, chỉnh ghế để tay cầm ngang vai.\n2. Nắm hai tay cầm.\n3. Quay đều theo vòng tròn, giữ thân ổn định.\n4. Đổi chiều quay sau vài phút.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Gồng vai; ngả người; quay quá nặng ngay từ đầu.', @safe, @dose_cardio, '10–15 phút', 'gv-2139', 'ADAPTED', 'APPROVED',
    '1. Adjust the seat height and handlebar position to a comfortable level.\n2. Sit on the ergometer with your back straight and feet on the pedals.\n3. Grasp the handles with your hands and position your arms at a 90-degree angle.\n4. Start pedaling with your hands, pushing and pulling the handles in a controlled motion.\n5. Continue pedaling for the desired duration or number of repetitions.',
    '1. Adjust the seat height and handlebar position to a comfortable level.\n2. Sit on the ergometer with your back straight and feet on the pedals.\n3. Grasp the handles with your hands and position your arms at a 90-degree angle.\n4. Start pedaling with your hands, pushing and pulling the handles in a controlled motion.\n5. Continue pedaling for the desired duration or number of repetitions.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '10–15 minutes'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Đạp xe tay' OR name_en = 'Hands bike' OR external_id = '2139');

INSERT INTO exercises (external_id, name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
    equipment, equipment_keys, level, location, goals, primary_goal, description, description_en, instructions, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status,
    instructions_en, steps_en, breathing_en, safety_notes_en, suggested_dose_en, sets_reps_hint_en)
SELECT '2142', 'Máy kéo trượt tuyết (SkiErg)', 'Ski ergometer', 'Ski ergometer', 'CARDIO', 'ROWING', 'CARDIO', 'Bụng, Mông', 'upper-back,triceps', 'abs,gluteal',
    'Máy tim mạch', 'cardio-machine', 'INTERMEDIATE', 'GYM', 'ENDURANCE,FAT_LOSS', 'ENDURANCE', 'Kéo hai tay cầm từ trên xuống mô phỏng chống gậy trượt tuyết, tập tim mạch thân trên và cơ lõi.', 'Targets the triceps; also works the shoulders, forearms. Equipment: skierg machine.',
    '1. Đứng đối diện máy, hai tay nắm tay cầm trên cao.\n2. Gập hông và kéo tay cầm xuống về phía đùi.\n3. Siết bụng ở cuối động tác.\n4. Đứng thẳng lên đưa tay trở lại trên cao.',
    '1. Đứng đối diện máy, hai tay nắm tay cầm trên cao.\n2. Gập hông và kéo tay cầm xuống về phía đùi.\n3. Siết bụng ở cuối động tác.\n4. Đứng thẳng lên đưa tay trở lại trên cao.',
    'Thở đều; ở cường độ vừa vẫn nói được vài từ, cường độ mạnh chỉ nói được ngắt quãng.', 'Kéo chỉ bằng tay; cong lưng; gập gối quá nhiều.', @safe, @dose_cardio, '10–15 phút hoặc 8 x 30 giây', 'gv-2142', 'ADAPTED', 'APPROVED',
    '1. Adjust the seat height and footrests to a comfortable position.\n2. Grasp the handles with an overhand grip, palms facing down.\n3. Sit up straight with your feet flat on the footrests.\n4. Extend your arms straight out in front of you, keeping your elbows slightly bent.\n5. Engage your triceps and push the handles down towards your thighs.\n6. Pause for a moment at the bottom, then slowly return to the starting position.\n7. Repeat for the desired number of repetitions.',
    '1. Adjust the seat height and footrests to a comfortable position.\n2. Grasp the handles with an overhand grip, palms facing down.\n3. Sit up straight with your feet flat on the footrests.\n4. Extend your arms straight out in front of you, keeping your elbows slightly bent.\n5. Engage your triceps and push the handles down towards your thighs.\n6. Pause for a moment at the bottom, then slowly return to the starting position.\n7. Repeat for the desired number of repetitions.',
    'Breathe steadily; at moderate intensity you can still say a few words, at vigorous intensity only broken phrases.', @safe_en, @dose_cardio_en, '10–15 minutes or 8 x 30 seconds'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Máy kéo trượt tuyết (SkiErg)' OR name_en = 'Ski ergometer' OR external_id = '2142');

-- ---------------- 3. Liên kết dụng cụ và nguồn ----------------
INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_key)
SELECT e.id, eq.`key` FROM exercises e
JOIN equipment eq ON FIND_IN_SET(eq.`key`, REPLACE(e.equipment_keys, ' ', '')) > 0
WHERE e.image_key LIKE 'gv-%';

INSERT IGNORE INTO exercise_sources (exercise_id, source_id)
SELECT e.id, cs.id FROM exercises e JOIN content_sources cs ON cs.code = 'GYM_VISUAL'
WHERE e.image_key LIKE 'gv-%';

INSERT IGNORE INTO exercise_sources (exercise_id, source_id)
SELECT e.id, cs.id FROM exercises e JOIN content_sources cs ON cs.code = 'EXERCISES_DATASET'
WHERE e.image_key LIKE 'gv-%' AND e.content_origin = 'ADAPTED' AND e.external_id IS NOT NULL;
