-- =====================================================================
-- GymFlow · V18 · Nâng cấp thư viện bài tập, bảng dụng cụ và hướng dẫn người mới
--  * Bảng equipment: danh mục dụng cụ tập gym, chia nhóm category, hướng dẫn cách dùng và an toàn.
--  * Khởi tạo 17 loại dụng cụ ở trạng thái CHỜ DUYỆT (PENDING).
--  * Bổ sung cột cho exercises: setup_position, steps, sets_reps_hint, primary_goal.
--  * Bảng exercise_alternatives: các bài tập thay thế tương đương.
--  * Thêm bài tập cho các nhóm cơ ít bài (vai sau, cơ cổ, cẳng tay, đùi trong, hông ngoài, cơ thang, lưng dưới).
--  * Thêm bài viết hướng dẫn tập gym cho người mới vào bảng articles ở trạng thái CHỜ DUYỆT.
-- =====================================================================

-- 1. Bảng dụng cụ tập luyện
CREATE TABLE IF NOT EXISTS equipment (
    `key` VARCHAR(30) NOT NULL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(20) NOT NULL,
    short_desc VARCHAR(255) NULL,
    usage_guide TEXT NULL,
    safety_notes TEXT NULL,
    target_muscle_keys VARCHAR(255) NULL,
    image_key VARCHAR(100) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    hidden BOOL NOT NULL DEFAULT FALSE,
    review_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    origin VARCHAR(20) NOT NULL DEFAULT 'SELF_AUTHORED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT ck_equipment_cat CHECK (category IN ('FREE_WEIGHT', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'CARDIO', 'ACCESSORY', 'RECOVERY')),
    CONSTRAINT ck_equipment_status CHECK (review_status IN ('PENDING', 'APPROVED', 'NEEDS_REVIEW'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Khởi tạo 17 dụng cụ (mọi key hiện có trong exercises.equipment_keys + 5 key mới)
INSERT INTO equipment (`key`, name, category, short_desc, usage_guide, safety_notes, target_muscle_keys, image_key, sort_order, hidden, review_status, origin)
VALUES
('barbell', 'Thanh đòn & giá tạ', 'FREE_WEIGHT',
 'Thanh dài tiêu chuẩn lắp bánh tạ hai đầu, dùng cho các bài đa khớp lớn như Squat, Deadlift, Bench Press.',
 '1. Đặt thanh đòn trên giá ở độ cao ngang ngực hoặc xương đòn.\n2. Cầm thanh đối xứng bằng cách căn chỉnh ngón tay theo các vạch khía chuẩn.\n3. Luôn siết chặt cơ bụng và giữ thẳng lưng trước khi nhấc tạ ra khỏi giá đỡ.',
 'Luôn dùng kẹp khoá tạ ở cả hai đầu thanh đòn. Khi tập mức tạ nặng, bắt buộc phải có giá đỡ an toàn (safety bars) hoặc người hỗ trợ phía sau.',
 'chest,upper-back,lower-back,quadriceps,gluteal,hamstring', 'Barbell_Squat', 10, FALSE, 'PENDING', 'SELF_AUTHORED'),

('dumbbell', 'Tạ đơn (Dumbbell)', 'FREE_WEIGHT',
 'Tạ tay cầm đơn độc lập hai bên, giúp phát triển cơ bắp cân đối và mở rộng biên độ chuyển động tự nhiên của khớp.',
 '1. Chọn mức cân phù hợp, cầm chắc tay vào chính giữa thanh nắm.\n2. Duy trì cổ tay thẳng, không để cổ tay bị gập bẻ ra sau khi đẩy tạ.\n3. Khi nằm ghế, đưa tạ lên đùi trước rồi dùng đùi hỗ trợ đưa tạ lên ngực khi ngả lưng.',
 'Không thả rơi tạ xuống sàn từ trên cao để tránh chấn thương khớp và hư hại sàn tập. Khi kết thúc hiệp nằm, hạ tạ về hai bên đùi rồi ngồi dậy từ từ.',
 'chest,front-deltoids,back-deltoids,biceps,triceps,upper-back', 'Dumbbell_Bench_Press', 20, FALSE, 'PENDING', 'SELF_AUTHORED'),

('kettlebell', 'Tạ ấm (Kettlebell)', 'FREE_WEIGHT',
 'Tạ đúc hình cầu có quai cầm phía trên, trọng tâm lệch tạo lực quán tính cho các bài vung hông, squat ôm tạ và rèn thể lực.',
 '1. Nắm chắc quai tạ, hai chân đứng rộng hơn vai một chút.\n2. Phát lực chủ yếu từ cơ hông và mông (hip hinge) khi vung tạ, không dùng lưng dưới để kéo tạ lên.\n3. Giữ thẳng cột sống và siết chặt cơ bụng suốt chuyển động.',
 'Kiểm tra quai tạ không dính mồ hôi trơn trượt. Đảm bảo khoảng không gian xung quanh hoàn toàn thông thoáng trước khi vung tạ.',
 'gluteal,hamstring,lower-back,quadriceps,forearm', 'Goblet_Squat', 30, FALSE, 'PENDING', 'SELF_AUTHORED'),

('ez-bar', 'Thanh đòn ziczac (EZ Bar)', 'FREE_WEIGHT',
 'Thanh đòn uốn lượn hình chữ W, giảm đáng kể áp lực lên khớp cổ tay khi thực hiện cuốn tay trước hoặc duỗi tay sau.',
 '1. Đặt bàn tay vào các đoạn uốn cong phù hợp với góc nghiêng tự nhiên của cổ tay.\n2. Giữ khuỷu tay cố định sát hai bên sườn khi cuốn tạ, không đung đưa thân trên.',
 'Luôn kẹp khoá tạ hai đầu. Tránh nhấc khuỷu tay lên quá cao ở đỉnh động tác làm mất lực căng cơ bắp tay.',
 'biceps,triceps,forearm', 'EZ-Bar_Curl', 40, FALSE, 'PENDING', 'SELF_AUTHORED'),

('plate', 'Bánh tạ (Weight Plate)', 'FREE_WEIGHT',
 'Bánh tạ tròn bằng gang hoặc bọc cao su, ngoài lắp vào đòn còn dùng tập kẹp ngón tay, ôm gập bụng và xoay người liên sườn.',
 '1. Cầm chắc mép bánh tạ bằng lòng bàn tay hoặc xỏ ngón tay vào lỗ cầm nếu có.\n2. Dùng lực chân và hông khi nhấc bánh tạ nặng từ sàn lên, không cúi gập lưng.',
 'Cẩn thận tránh kẹp ngón tay khi xếp hoặc dỡ bánh tạ khỏi giá đỡ và thanh đòn. Luôn cất bánh tạ về đúng vị trí cân nặng sau khi dùng.',
 'forearm,abs,obliques', 'Plate_Pinch', 50, FALSE, 'PENDING', 'SELF_AUTHORED'),

('machine', 'Máy tập khối tạ (Selectorized Machine)', 'MACHINE',
 'Máy tập có khối tạ chọn bằng chốt cắm và đường ray cố định, an toàn cao, rất phù hợp cho người mới và tập cô lập cơ bắp.',
 '1. Điều chỉnh độ cao ghế ngồi và đệm tì sao cho khớp vận động thẳng hàng với trục quay của máy.\n2. Cắm chốt mức tạ ngập sâu vào khối tạ trước khi bắt đầu.\n3. Thực hiện động tác nhịp nhàng, kiểm soát tốc độ cả pha đẩy và pha hạ tạ.',
 'Không để các tấm tạ va đập mạnh vào nhau khi kết thúc lần lặp. Lau sạch mồ hôi trên đệm máy sau khi tập.',
 'quadriceps,hamstring,chest,upper-back,front-deltoids', 'Leg_Press', 60, FALSE, 'PENDING', 'SELF_AUTHORED'),

('smith-machine', 'Máy Smith (Smith Machine)', 'MACHINE',
 'Khung thanh đòn gắn trên hai ray trượt thẳng đứng có móc khoá an toàn ở mọi độ cao, hỗ trợ tự tập nặng an toàn.',
 '1. Xoay nhẹ cổ tay để mở móc khoá trước khi thực hiện động tác.\n2. Đặt chân hơi nhô về phía trước so với thanh đòn để phù hợp quỹ đạo trượt thẳng đứng.\n3. Khi kết thúc hoặc mỏi cơ, xoay cổ tay để móc thanh đòn vào ngàm khoá gần nhất.',
 'Luôn cài chốt chặn an toàn phụ ở vị trí thấp hơn biên độ sâu nhất của động tác trước khi bắt đầu bài tập nặng.',
 'quadriceps,gluteal,chest,front-deltoids', 'Smith_Machine_Squat', 70, FALSE, 'PENDING', 'SELF_AUTHORED'),

('cable', 'Máy kéo cáp (Cable Machine)', 'CABLE',
 'Hệ thống ròng rọc và dây cáp cung cấp lực cản liên tục theo mọi hướng và góc độ, đổi phụ kiện tay cầm linh hoạt.',
 '1. Điều chỉnh ròng rọc lên hoặc xuống độ cao mục tiêu và kiểm tra chốt định vị đã khoá.\n2. Gắn phụ kiện tay cầm phù hợp (thanh thẳng, dây thừng, tay đơn) vào móc khoá an toàn.\n3. Đứng vững chãi, siết cơ lõi để giữ thăng bằng chống lại lực kéo liên tục của dây cáp.',
 'Kiểm tra chốt chọn tạ đã cắm ngập hoàn toàn. Không thả tay để tạ kéo giật đột ngột trở về tháp tạ.',
 'chest,upper-back,triceps,biceps,back-deltoids,obliques', 'Seated_Cable_Rows', 80, FALSE, 'PENDING', 'SELF_AUTHORED'),

('bodyweight', 'Trọng lượng cơ thể (Bodyweight)', 'BODYWEIGHT',
 'Tập luyện bằng chính trọng lượng bản thân, tiện lợi, rèn luyện sự dẻo dai, thăng bằng và sức mạnh cơ lõi vững chắc.',
 '1. Bố trí thảm tập trên sàn bằng phẳng, không trơn trượt.\n2. Tập trung siết chặt cơ bụng và duy trì thân người thẳng hàng từ đầu tới gót chân.',
 'Khởi động kỹ cổ tay, khớp gối và vai trước khi tập. Ưu tiên kỹ thuật chuẩn xác trước khi tăng số lần lặp.',
 'chest,quadriceps,abs,gluteal,triceps', 'Pushups', 90, FALSE, 'PENDING', 'SELF_AUTHORED'),

('pullup-bar', 'Xà đơn (Pull-up Bar)', 'BODYWEIGHT',
 'Thanh xà ngang gắn tường hoặc khung treo người, dùng cho các bài hít xà lưng xô và treo người nâng chân tập bụng.',
 '1. Nắm thanh xà rộng hơn vai (tay sấp) hoặc bằng vai (tay ngửa), lòng bàn tay nắm chắc.\n2. Treo người ổn định, chủ động siết bả vai xuống trước khi dùng lực kéo thân người lên cằm qua xà.\n3. Hạ người có kiểm soát về tư thế treo ban đầu.',
 'Kiểm tra thanh xà chắc chắn trước khi treo toàn bộ trọng lượng. Người mới nên dùng dây thun kháng lực hỗ trợ hoặc máy trợ lực.',
 'upper-back,biceps,forearm,abs', 'Pullups', 100, FALSE, 'PENDING', 'SELF_AUTHORED'),

('dip-bars', 'Xà kép (Dip Station)', 'BODYWEIGHT',
 'Hai thanh xà song song dùng để chống đẩy thân người trên cao, phát triển mạnh mẽ cơ ngực dưới và cơ tay sau.',
 '1. Chống hai bàn tay lên thanh xà, nhấc toàn bộ thân người lên, khuỷu tay gần duỗi thẳng.\n2. Hơi nghiêng thân về trước (để nhấn vào ngực) hoặc giữ thân thẳng đứng (để nhấn vào tay sau).\n3. Hạ thấp người có kiểm soát tới khi cánh tay vuông góc 90 độ rồi đẩy dứt khoát lên.',
 'Không hạ người quá sâu làm căng giãn quá mức bao khớp vai. Người có tiền sử chấn thương vai nên dùng đệm trợ lực.',
 'chest,triceps,front-deltoids', 'Bench_Dips', 110, FALSE, 'PENDING', 'SELF_AUTHORED'),

('cardio-machine', 'Máy tập tim mạch (Cardio Machines)', 'CARDIO',
 'Gồm máy chạy bộ, xe đạp tập, máy chèo thuyền, máy elip nhằm nâng cao sức bền tim phổi và đốt cháy năng lượng.',
 '1. Điều chỉnh yên xe hoặc bàn đạp sao cho tư thế thoải mái, chân không bị khoá khớp gối khi đạp hết tầm.\n2. Bắt đầu với tốc độ nhẹ nhàng trong 3–5 phút để cơ thể làm quen trước khi tăng cường độ.',
 'Luôn kẹp dây dừng khẩn cấp vào vạt áo khi chạy máy chạy bộ. Giảm tốc độ từ từ trước khi bước ra khỏi thảm chạy.',
 'quadriceps,hamstring,calves,gluteal', 'Rowing_Stationary', 120, FALSE, 'PENDING', 'SELF_AUTHORED'),

('bench', 'Ghế tập thể hình (Workout Bench)', 'ACCESSORY',
 'Ghế phẳng hoặc ghế dốc chỉnh nhiều nấc (incline/decline), là điểm tựa nền tảng cho các bài đẩy ngực và kéo tạ.',
 '1. Kéo chốt an toàn và chỉnh độ nghiêng tựa lưng vào đúng rãnh khoá mong muốn.\n2. Nằm hoặc ngồi ổn định, đặt hai bàn chân phẳng trên sàn làm điểm tựa vững chãi.',
 'Kiểm tra chốt khoá góc dốc đã ăn khớp trước khi mang tạ nặng lên ghế. Đặt ghế trên mặt sàn chống trượt.',
 'chest,front-deltoids,triceps,upper-back', 'Incline_Dumbbell_Press', 130, FALSE, 'PENDING', 'SELF_AUTHORED'),

('band', 'Dây kháng lực (Resistance Bands)', 'ACCESSORY',
 'Dây cao su đàn hồi nhiều mức kháng lực, tối ưu cho khởi động làm ấm khớp, kích hoạt cơ và hỗ trợ phục hồi chức năng.',
 '1. Neo dây vào điểm tựa chắc chắn hoặc giẫm chặt chân lên dây.\n2. Kéo dây có kiểm soát, tận dụng lực căng đàn hồi ở cả pha co và pha duỗi cơ.',
 'Kiểm tra dây không bị nứt hoặc rách trước khi kéo. Không kéo giãn dây quá 2.5 lần chiều dài tự nhiên.',
 'front-deltoids,gluteal,abductors,upper-back', 'Face_Pull', 140, FALSE, 'PENDING', 'SELF_AUTHORED'),

('ball', 'Bóng tập (Exercise & Medicine Ball)', 'ACCESSORY',
 'Bóng cao su lớn (Swiss ball) và bóng tạ ném (Medicine ball), giúp nâng cao thăng bằng và sức mạnh bộc phát cơ bụng.',
 '1. Chọn bóng kích thước phù hợp (khi ngồi góc đùi và cẳng chân vuông góc khoảng 90 độ).\n2. Giữ thăng bằng tốt và kiểm soát chuyển động nhịp nhàng.',
 'Tránh để bóng tiếp xúc với vật sắc nhọn hoặc bề mặt gồ ghề dễ làm xước thủng bóng.',
 'abs,obliques,gluteal,quadriceps', 'Weighted_Crunches', 150, FALSE, 'PENDING', 'SELF_AUTHORED'),

('other', 'Dụng cụ tập khác (Accessories & Turf)', 'ACCESSORY',
 'Dụng cụ thể lực chuyên biệt như con lăn bụng ab-wheel, dây thừng chiến đấu, xe trượt đẩy (sled) và thảm tập.',
 '1. Đọc kỹ hướng dẫn sử dụng cho từng dụng cụ chuyên biệt.\n2. Thực hiện với tốc độ vừa phải để kiểm soát kỹ thuật trước khi tăng tốc độ hoặc khối lượng tạ.',
 'Đảm bảo cự ly an toàn xung quanh khi vung dây thừng hoặc đẩy xe trượt trên đường tập.',
 'quadriceps,forearm,abs,gluteal', 'Farmers_Walk', 160, FALSE, 'PENDING', 'SELF_AUTHORED'),

('foam-roller', 'Con lăn bọt giãn cơ (Foam Roller)', 'RECOVERY',
 'Ống lăn bọt xốp dùng để tự giải phóng mạc cơ (SMR), thư giãn điểm căng cứng và đẩy nhanh hồi phục sau buổi tập.',
 '1. Đặt vùng cơ cần thư giãn lên trên con lăn bọt.\n2. Dùng sức nặng cơ thể đè nhẹ và lăn từ từ dọc theo chiều thớ cơ với nhịp chậm 30–60 giây mỗi nhóm cơ.',
 'Không lăn trực tiếp lên các khớp xương hoặc vùng cột sống thắt lưng không có đệm cơ bảo vệ. Dừng lại nếu thấy đau buốt nhói.',
 'quadriceps,hamstring,calves,lower-back,upper-back,gluteal', 'Hamstring-SMR', 170, FALSE, 'PENDING', 'SELF_AUTHORED')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Cập nhật bảng exercises: thêm cột mới và backfill
ALTER TABLE exercises
    ADD COLUMN setup_position TEXT NULL AFTER instructions,
    ADD COLUMN steps          TEXT NULL AFTER setup_position,
    ADD COLUMN sets_reps_hint VARCHAR(100) NULL AFTER suggested_dose,
    ADD COLUMN primary_goal   VARCHAR(20) NULL AFTER goals;

-- Điền các cột đang trống từ dữ liệu sẵn có, không ghi đè dữ liệu cũ
UPDATE exercises SET steps = instructions WHERE steps IS NULL AND instructions IS NOT NULL;
UPDATE exercises SET primary_goal = SUBSTRING_INDEX(goals, ',', 1) WHERE primary_goal IS NULL AND goals IS NOT NULL AND goals != '';

-- 3. Bảng bài tập thay thế tương đương
CREATE TABLE IF NOT EXISTS exercise_alternatives (
    exercise_id BIGINT NOT NULL,
    alternative_id BIGINT NOT NULL,
    PRIMARY KEY (exercise_id, alternative_id),
    CONSTRAINT fk_ea_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT fk_ea_alternative FOREIGN KEY (alternative_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT ck_ea_diff CHECK (exercise_id <> alternative_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Bổ sung bài tập mới cho các nhóm cơ ít bài (cơ cổ, vai sau, cẳng tay, đùi trong, hông ngoài, lưng dưới, cơ thang)
-- Tên bài tập và bảng so sánh dùng collation utf8mb4_0900_as_ci
SET @safe_note = 'Dừng tập ngay nếu thấy đau buốt, chóng mặt hoặc khó thở bất thường. Người có tiền sử chấn thương cột sống hoặc khớp nên hỏi ý kiến bác sĩ hoặc HLV trước khi thực hiện.';
SET @dose_gen = 'Gợi ý chung: 3 hiệp x 10–12 lần lặp mỗi buổi, nghỉ 60–90 giây giữa các hiệp. Mức tạ do HLV điều chỉnh phù hợp với thể trạng.';

INSERT INTO exercises (name, name_en, aliases, muscle_group, secondary_muscles, target_muscles, secondary_muscle_keys,
                       equipment, equipment_keys, level, location, goals, primary_goal,
                       description, instructions, setup_position, steps, breathing, common_mistakes, safety_notes,
                       variations, suggested_dose, sets_reps_hint, image_key, content_origin, review_status)
VALUES
('Lăn bắp chân với Foam Roller', 'Foam roll calves', 'Calves SMR, massage bắp chân', 'LEGS', 'Gân gót chân', 'calves', NULL,
 'Con lăn bọt', 'foam-roller', 'BEGINNER', 'ANY', 'ENDURANCE', 'ENDURANCE',
 'Động tác giải phóng mạc cơ bắp chân bằng con lăn xốp, giúp giảm căng cứng bắp chân và cải thiện độ linh hoạt cổ chân.',
 'Ngồi trên sàn, đặt bắp chân lên con lăn, hai tay chống phía sau nâng nhẹ mông và lăn dọc từ gót lên dưới khoeo gối.',
 'Ngồi trên thảm tập, chân duỗi thẳng về trước. Đặt con lăn bọt vuông góc ngay dưới bắp chân của một hoặc hai chân, hai tay chống chắc chắn phía sau hông.',
 '1. Dùng hai tay chống sàn nâng nhẹ hông lên khỏi mặt đất để dồn trọng lượng vào bắp chân.\n2. Lăn từ từ dọc bắp chân từ trên gót chân lên dưới khoeo gối.\n3. Khi gặp điểm căng cứng đặc biệt, giữ yên tại điểm đó 20–30 giây và hít thở sâu.\n4. Đổi chân và lặp lại động tác.',
 'Hít thở đều đặn và chậm rãi, tránh nín thở khi con lăn ấn vào điểm đau.',
 'Lăn quá nhanh lướt qua điểm căng; lăn trực tiếp đè vào khoeo gối; gồng cứng cổ vai khi chống tay.',
 @safe_note, 'Lăn từng chân một để tăng áp lực; xoay nhẹ mũi chân vào trong và ra ngoài để lăn các mặt của bắp chân.',
 'Lăn 30–60 giây mỗi bên chân sau buổi tập hoặc ngày phục hồi.', '30–60 giây/bên', 'Calves-SMR', 'SELF_AUTHORED', 'PENDING'),

('Lăn đùi sau với Foam Roller', 'Foam roll hamstrings', 'Hamstring SMR, giải cơ đùi sau', 'LEGS', 'Mông', 'hamstring', 'gluteal',
 'Con lăn bọt', 'foam-roller', 'BEGINNER', 'ANY', 'ENDURANCE', 'ENDURANCE',
 'Kỹ thuật lăn bọt xốp hỗ trợ phục hồi nhóm cơ gân kheo (đùi sau), giảm co thắt và tăng biên độ gập hông.',
 'Ngồi trên sàn, đặt con lăn dưới đùi sau, chống tay nâng hông và lăn từ trên khoeo gối lên tới dưới xương ụ ngồi.',
 'Ngồi trên sàn, hai tay chống phía sau lưng. Đặt con lăn bọt ngay dưới phần đùi sau, hai chân duỗi thẳng tự nhiên.',
 '1. Dùng hai bàn tay chống sàn nhấc mông lên cách mặt sàn khoảng 5–10 cm.\n2. Lăn người chầm chậm về phía trước và sau để con lăn di chuyển từ phía trên khớp gối đến sát chân mông.\n3. Dừng lại và thở sâu ở những vùng cơ bị bó cứng nhiều.\n4. Thực hiện trong 45–60 giây.',
 'Duy trì nhịp thở tự nhiên, thả lỏng toàn bộ nhóm cơ đùi sau trong lúc lăn.',
 'Dồn lực đè thẳng vào mặt sau khớp gối; lưng bị gù cong gập cổ; chống tay quá xa gây mỏi vai.',
 @safe_note, 'Bắt chéo một chân lên trên chân kia để tăng áp lực mát-xa sâu hơn.',
 'Lăn từ 45–60 giây mỗi chân sau các buổi tập chân hoặc chạy bộ.', '45–60 giây/bên', 'Hamstring-SMR', 'SELF_AUTHORED', 'PENDING'),

('Lăn lưng dưới với Foam Roller', 'Foam roll lower back', 'Lower back SMR, lăn mạc cơ lưng', 'BACK', 'Mông, cơ dựng sống', 'lower-back', 'gluteal',
 'Con lăn bọt', 'foam-roller', 'BEGINNER', 'ANY', 'ENDURANCE', 'ENDURANCE',
 'Phương pháp thư giãn cơ lưng dưới nhẹ nhàng bằng con lăn xốp, giải toả áp lực cơ cạnh cột sống thắt lưng.',
 'Nằm ngửa nhẹ nhàng, đặt con lăn dưới phần lưng dưới nghiêng sang một bên thắt lưng, co gối và lăn nhẹ đoạn ngắn.',
 'Nằm ngửa trên thảm, co hai đầu gối, bàn chân đặt phẳng trên sàn. Đặt con lăn bọt dưới eo lưng nhưng nghiêng nhẹ người sang một bên để lăn vào phần cơ cạnh cột sống.',
 '1. Hai bàn chân giữ chắc trên sàn, dùng chân đẩy người di chuyển nhẹ nhàng trên con lăn.\n2. Chỉ lăn trong phạm vi ngắn ở phần đệm cơ thịt cạnh thắt lưng, tuyệt đối không đè thẳng lên đốt sống trần.\n3. Lăn nhẹ nhàng khoảng 30–45 giây mỗi bên thân.',
 'Hít vào nhẹ nhàng bằng mũi và thở ra chậm qua miệng, giữ cơ thể thả lỏng tối đa.',
 'Đè con lăn vuông góc thẳng vào giữa đốt sống thắt lưng không có đệm cơ; ưỡn cong lưng quá đà; lăn quá mạnh.',
 CONCAT('Người bị thoát vị đĩa đệm cấp tính không nên tự lăn lưng dưới khi chưa có chỉ định y tế. ', @safe_note),
 'Lăn vùng mông và cơ mông nhỡ thay thế để gián tiếp giải toả áp lực cho lưng dưới.',
 'Lăn 30–45 giây mỗi bên với nhịp độ rất chậm và có kiểm soát.', '30–45 giây/bên', 'Lower_Back-SMR', 'SELF_AUTHORED', 'PENDING'),

('Cuốn tạ đòn thanh EZ', 'EZ-bar curl', 'Cuốn tay trước thanh ziczac', 'ARMS', 'Cẳng tay', 'biceps', 'forearm',
 'Thanh đòn ziczac', 'ez-bar', 'BEGINNER', 'GYM', 'STRENGTH,HYPERTROPHY', 'HYPERTROPHY',
 'Bài tập phát triển cơ tay trước kinh điển với thanh đòn uốn lượn, bảo vệ cổ tay tối ưu cho người mới bắt đầu.',
 'Đứng thẳng, hai tay nắm thanh EZ ở phần uốn cong rộng bằng vai, cuốn tạ lên sát ngực rồi hạ chậm có kiểm soát.',
 'Đứng thẳng người, hai chân mở rộng bằng vai tạo thế đứng vững chãi. Cầm thanh đòn EZ ở vị trí uốn nghiêng hướng vào trong, cánh tay duỗi thẳng xuống đùi, lòng bàn tay hướng về phía trước.',
 '1. Hít sâu, giữ hai khuỷu tay cố định sát vào hai bên mạng sườn.\n2. Co cơ bắp tay trước, gập khuỷu tay cuốn thanh đòn lên theo vòng cung về phía trước ngực trên.\n3. Siết chặt bắp tay ở điểm cao nhất trong 1 giây.\n4. Thở ra và từ từ hạ thanh đòn về vị trí ban đầu trong 2–3 giây.',
 'Hít vào khi bắt đầu và hạ thanh đòn xuống, thở ra dứt khoát khi cuốn tạ lên đỉnh.',
 'Đung đưa thân trên lấy đà; dịch chuyển khuỷu tay ra trước quá nhiều; cổ tay bị cong gập không vững.',
 @safe_note, 'Cuốn tạ thanh EZ trên ghế dốc Scott (Preacher Curl); cuốn tạ tay hẹp.',
 @dose_gen, '3 hiệp x 10–12 lần', 'EZ-Bar_Curl', 'SELF_AUTHORED', 'PENDING'),

('Nằm duỗi tay sau thanh EZ', 'EZ-bar skullcrusher', 'Lying triceps extension, skull crusher', 'ARMS', 'Cẳng tay, ngực', 'triceps', 'forearm',
 'Thanh đòn ziczac, ghế phẳng', 'ez-bar,bench', 'INTERMEDIATE', 'GYM', 'STRENGTH,HYPERTROPHY', 'HYPERTROPHY',
 'Bài tập cô lập cơ tay sau hiệu quả cao trên ghế phẳng, nhấn mạnh vào đầu dài cơ tam đầu cánh tay.',
 'Nằm ngửa trên ghế phẳng, cầm thanh EZ giơ thẳng đứng trên ngực, gập khuỷu tay hạ thanh về phía trán rồi duỗi thẳng lại.',
 'Nằm ngửa thẳng lưng trên ghế tập phẳng, hai chân đặt chắc chắn trên sàn. Cầm thanh đòn EZ ở tay cầm hẹp phía trong, nâng đòn thẳng đứng lên trên ngực, khuỷu tay hơi khép lại.',
 '1. Cố định bắp tay trên nghiêng nhẹ về phía đầu khoảng 5–10 độ để duy trì sức căng liên tục.\n2. Từ từ gập khớp khuỷu tay, hạ thanh đòn theo vòng cung xuống sát vùng trán hoặc đỉnh đầu.\n3. Cảm nhận cơ tay sau căng hết cỡ ở điểm đáy.\n4. Dùng lực cơ tay sau đẩy mạnh thanh đòn trở lại vị trí ban đầu và siết cơ triceps.',
 'Hít vào khi hạ đòn tạ xuống sát trán, thở ra mạnh mẽ khi duỗi thẳng tay đẩy tạ lên.',
 'Khuỷu tay bạnh rộng sang hai bên; dịch chuyển toàn bộ cánh tay làm mất lực cô lập; thả tạ rơi tự do xuống trán.',
 CONCAT('Bắt buộc phải có người đỡ tạ (spotter) hoặc dùng mức tạ vừa sức để tránh rơi tạ trúng mặt. ', @safe_note),
 'Thực hiện với tạ đơn (Dumbbell Skullcrusher) hoặc nằm trên ghế dốc.',
 @dose_gen, '3 hiệp x 8–10 lần', 'EZ-Bar_Skullcrusher', 'SELF_AUTHORED', 'PENDING'),

('Kẹp bánh tạ bằng ngón tay', 'Plate pinch', 'Pinch grip hold, kẹp tạ ngón tay', 'ARMS', 'Cẳng tay, sức nắm', 'forearm', NULL,
 'Bánh tạ', 'plate', 'BEGINNER', 'GYM', 'STRENGTH', 'STRENGTH',
 'Bài tập rèn luyện sức mạnh ngón tay và cơ cẳng tay chuyên sâu bằng cách dùng đầu ngón tay kẹp chặt bánh tạ đứng thẳng.',
 'Dùng các đầu ngón tay và ngón cái kẹp chặt một hoặc hai bánh tạ trơn, nhấc lên và giữ yên lâu nhất có thể.',
 'Đứng thẳng người cạnh bánh tạ đặt thẳng đứng. Đặt ngón tay cái ở một mặt và các ngón tay còn lại ở mặt đối diện của bánh tạ.',
 '1. Bóp chặt các ngón tay vào mặt bánh tạ, siết cơ cẳng tay.\n2. Dùng lực nâng bánh tạ lên ngang đùi, thân người giữ thẳng đứng và cân bằng.\n3. Giữ yên tư thế kẹp tạ trong khoảng 20–45 giây hoặc tới khi ngón tay bắt đầu mỏi tuột.\n4. Đặt tạ xuống nhẹ nhàng và đổi bên nếu tập từng tay.',
 'Duy trì nhịp thở đều đặn và tự nhiên trong suốt thời gian giữ tạ.',
 'Bấm móng tay thay vì đệm thịt ngón tay; cúi gập lưng khi giữ tạ; thả rơi tạ xuống chân.',
 CONCAT('Chú ý đứng cách xa mũi bàn chân để tránh trường hợp bánh tạ trượt rơi trúng chân. ', @safe_note),
 'Kẹp hai bánh tạ mỏng úp mặt trơn vào nhau (Two-plate pinch) để tăng thử thách.',
 '3–4 hiệp giữ từ 20–40 giây mỗi hiệp.', '3–4 hiệp x 30 giây', 'Plate_Pinch', 'SELF_AUTHORED', 'PENDING'),

('Bay vai sau máy cáp', 'Cable rear delt fly', 'Kéo cáp vai sau, cable face fly', 'SHOULDERS', 'Lưng trên, cơ thang', 'back-deltoids', 'upper-back,trapezius',
 'Máy cáp', 'cable', 'INTERMEDIATE', 'GYM', 'HYPERTROPHY,STRENGTH', 'HYPERTROPHY',
 'Bài tập cô lập cơ vai sau với lực căng liên tục từ dây cáp chéo, giúp cải thiện tư thế vai gù về trước.',
 'Đứng giữa hai ròng rọc cáp cao ngang vai, hai tay nắm chéo dây cáp, mở rộng hai tay sang ngang ra sau để ép vai sau.',
 'Điều chỉnh hai ròng rọc cáp ở độ cao ngang tầm mắt hoặc ngang vai. Không cần gắn tay cầm, nắm trực tiếp vào quả cầu bọc đầu dây cáp: tay phải cầm dây bên trái, tay trái cầm dây bên phải.',
 '1. Bước lùi một bước nhỏ vào chính giữa máy, đứng vững, hơi gập nhẹ khuỷu tay.\n2. Mở rộng hai cánh tay sang ngang và ra sau theo quỹ đạo vòng cung ngang ngực.\n3. Siết chặt vùng cơ vai sau ở cuối chuyển động trong 1 giây.\n4. Từ từ khép hai tay lại về vị trí bắt chéo ban đầu.',
 'Thở ra khi mở rộng hai tay ra sau, hít vào khi trả tay về phía trước.',
 'Nhún cơ cầu vai lên tai; ưỡn ngực giật người ra sau lấy đà; duỗi khoá cứng khớp khuỷu tay.',
 @safe_note, 'Bay vai sau tạ đơn nằm trên ghế dốc (Incline Dumbbell Rear Delt Fly); ép vai sau trên máy Reverse Pec Deck.',
 @dose_gen, '3 hiệp x 12–15 lần', 'Cable_Rear_Delt_Fly', 'SELF_AUTHORED', 'PENDING'),

('Giữ cơ cổ đẳng trường', 'Isometric neck exercise', 'Tập cổ tĩnh, giữ cổ kháng lực', 'SHOULDERS', 'Cơ thang trên', 'neck', 'trapezius',
 'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'REHABILITATION,STRENGTH', 'STRENGTH',
 'Bài tập rèn luyện sức bền và sự ổn định của nhóm cơ cổ bằng lực kháng tĩnh từ bàn tay, an toàn cho cột sống cổ.',
 'Ngồi hoặc đứng thẳng, đặt lòng bàn tay lên trán, gáy hoặc thái dương, dùng tay ấn nhẹ trong khi cổ giữ thẳng cố định.',
 'Ngồi thẳng lưng trên ghế tựa hoặc đứng thẳng, giữ đầu và ánh mắt nhìn thẳng về phía trước, vai thả lỏng tự nhiên.',
 '1. Đặt lòng bàn tay lên trán. Nhẹ nhàng dùng tay ấn đầu ra sau, đồng thời cơ cổ siết nhẹ để giữ đầu cố định không chuyển động.\n2. Duy trì lực kháng cự đều đặn trong 8–10 giây.\n3. Đổi vị trí tay ra sau gáy, ấn ra trước và giữ cổ tĩnh 8–10 giây.\n4. Lặp lại tương tự cho hai bên thái dương (trái và phải).',
 'Hít thở nhẹ nhàng và đều đặn, tuyệt đối không gồng nín thở.',
 'Dùng lực tay ấn quá mạnh gây đau nhức đốt sống cổ; bẻ vẹo cổ sang bên thay vì giữ tĩnh.',
 CONCAT('Người bị thoái hoá đốt sống cổ nặng hoặc đang đau cấp tính nên tham khảo chuyên gia trước khi tập. ', @safe_note),
 'Dùng bóng nhỏ mềm tì vào tường thay cho bàn tay.',
 'Mỗi hướng giữ 8–10 giây, lặp lại 3–4 vòng.', '3 vòng x 10 giây/hướng', 'Isometric_Neck_Exercise_-_Front_And_Back', 'SELF_AUTHORED', 'PENDING'),

('Dạng đùi trên máy', 'Machine hip abductor', 'Máy banh chân, seated hip abductor', 'LEGS', 'Mông, cơ mông nhỡ', 'abductors', 'gluteal',
 'Máy tập', 'machine', 'BEGINNER', 'GYM', 'HYPERTROPHY,TONE', 'TONE',
 'Bài tập cô lập nhóm cơ hông ngoài và cơ mông nhỡ trên máy chuyên dụng, tăng độ săn chắc và ổn định khung xương chậu.',
 'Ngồi thẳng lưng vào ghế máy, hai đầu gối ép sát đệm bên ngoài, dùng lực cơ mông mở rộng hai chân sang hai bên.',
 'Ngồi tựa sát lưng vào đệm ghế máy dạng đùi, hai bàn chân đặt trên bàn đạp. Điều chỉnh hai đệm tiếp xúc nằm ở mặt ngoài khớp gối.',
 '1. Cắm chốt mức tạ vừa phải, siết cơ bụng và bám tay vào thanh nắm hai bên ghế.\n2. Dùng lực từ cơ mông và hông ngoài đẩy hai đệm mở rộng chân sang hai bên xa nhất có thể.\n3. Giữ lại ở điểm mở rộng nhất trong 1 giây để cảm nhận cơ siết.\n4. Từ từ khép chân lại vị trí ban đầu trong 2–3 giây.',
 'Thở ra khi mở rộng chân sang hai bên, hít vào khi từ từ khép chân lại.',
 'Dùng quán tính giật chân mở rộng; nhấc mông khỏi mặt ghế ngồi; để tạ va đập ầm ầm giữa các lần lặp.',
 @safe_note, 'Dạng đùi với dây thun kháng lực (Band Clamshell); bước ngang với dây thun.',
 @dose_gen, '3 hiệp x 15–20 lần', 'Thigh_Abductor', 'SELF_AUTHORED', 'PENDING'),

('Khép đùi trên máy', 'Machine hip adductor', 'Máy ép đùi trong, seated hip adductor', 'LEGS', 'Đùi trước', 'adductor', 'quadriceps',
 'Máy tập', 'machine', 'BEGINNER', 'GYM', 'HYPERTROPHY,TONE', 'TONE',
 'Bài tập phát triển và làm săn chắc nhóm cơ khép đùi trong, tăng cường sự liên kết khớp háng và hỗ trợ squat sâu.',
 'Ngồi vào máy, hai chân mở rộng tựa vào đệm trong, dùng lực cơ đùi trong ép chặt hai chân về phía giữa.',
 'Ngồi thẳng lưng trên ghế máy, tựa đầu và lưng sát đệm. Điều chỉnh đệm tiếp xúc xoay vào mặt trong khớp gối và mở rộng máy ở góc thoải mái.',
 '1. Nắm chắc tay cầm bên hông ghế để cố định thân người.\n2. Kích hoạt nhóm cơ đùi trong, ép chặt hai đầu gối về phía nhau tới khi đệm chạm sát.\n3. Giữ siết cơ đùi trong 1 nhịp ở điểm giữa.\n4. Chống lại lực kéo, mở chân trở lại vị trí ban đầu một cách chậm rãi.',
 'Thở ra khi ép hai đùi vào nhau, hít vào khi mở chân ra.',
 'Mở góc chân quá rộng vượt ngưỡng linh hoạt gây căng rách cơ háng; thả rơi chân khi mở về.',
 @safe_note, 'Khép đùi nằm nghiêng nâng chân trên sàn; Sumo Squat chân rộng.',
 @dose_gen, '3 hiệp x 12–15 lần', 'Thigh_Adductor', 'SELF_AUTHORED', 'PENDING'),

('Nhún vai đòn tạ trước đùi', 'Barbell shrug standing', 'Nhún cơ cầu vai đòn tạ', 'BACK', 'Cẳng tay, cổ', 'trapezius', 'forearm,neck',
 'Thanh đòn', 'barbell', 'BEGINNER', 'GYM', 'STRENGTH,HYPERTROPHY', 'HYPERTROPHY',
 'Bài tập phát triển độ dày và sức mạnh cơ cầu vai (cơ thang trên) với thanh đòn tạ đặt phía trước thân người.',
 'Đứng thẳng cầm thanh đòn trước đùi, nhún hai vai thẳng đứng lên phía tai, giữ một nhịp rồi hạ xuống hết tầm.',
 'Đứng thẳng, chân mở rộng bằng hông. Cầm thanh đòn ngang đùi với khoảng cách hai tay rộng bằng vai, lòng bàn tay hướng về phía thân người, cánh tay buông thẳng hoàn toàn.',
 '1. Giữ khuỷu tay thẳng và cổ định vị trung tính, mắt nhìn thẳng.\n2. Dùng lực cơ cầu vai nhún hai bả vai thẳng đứng lên cao nhất có thể về phía tai.\n3. Giữ siết chặt cơ thang ở vị trí đỉnh trong 1–2 giây.\n4. Hạ vai chậm rãi xuống hết tầm chuyển động để cơ thang được kéo giãn hoàn toàn.',
 'Thở ra khi nhún vai lên cao, hít sâu khi hạ vai xuống.',
 'Xoay tròn khớp vai khi nhún (rất nguy hiểm cho bao khớp vai); gập khuỷu tay kéo tạ; cúi ngửa đầu quá mức.',
 @safe_note, 'Nhún vai với tạ đơn hai bên sườn (Dumbbell Shrug); nhún vai sau lưng với máy Smith.',
 @dose_gen, '3–4 hiệp x 10–12 lần', 'Barbell_Shrug', 'SELF_AUTHORED', 'PENDING'),

('Gập bụng ôm bóng tạ', 'Weighted crunch with ball', 'Gập bụng tạ, medicine ball crunch', 'CORE', 'Liên sườn', 'abs', 'obliques',
 'Bóng tập', 'ball', 'INTERMEDIATE', 'ANY', 'STRENGTH,HYPERTROPHY', 'STRENGTH',
 'Bài tập tăng cường sức mạnh cơ bụng thẳng bằng cách ôm thêm bóng tạ trước ngực khi gập người.',
 'Nằm ngửa co gối, hai tay ôm bóng tạ trước ngực, siết cơ bụng cuộn thân trên lên khỏi sàn rồi hạ có kiểm soát.',
 'Nằm ngửa trên thảm tập, gập đầu gối 90 độ, hai bàn chân áp sát mặt sàn. Dùng hai tay ôm chặt quả bóng tạ đặt ngay trước xương ức.',
 '1. Siết chặt cơ bụng và ấn nhẹ lưng dưới sát xuống sàn tập.\n2. Cuộn phần lưng trên và bả vai rời khỏi mặt sàn khoảng 30 độ, đưa bóng tạ hướng về phía đầu gối.\n3. Giữ siết chặt cơ bụng ở điểm cao nhất trong 1 giây.\n4. Hạ thân trên từ từ trở lại sàn, không thả lỏng cơ bụng hoàn toàn.',
 'Thở ra mạnh mẽ khi gập người lên, hít sâu khi hạ người xuống sàn.',
 'Dùng tay kéo giật bóng tạ về phía trước; dùng đà của cổ thay vì cơ bụng; nhấc toàn bộ lưng dưới khỏi sàn.',
 @safe_note, 'Gập bụng không tạ cơ bản; gập bụng giơ bóng thẳng tay trên trần.',
 @dose_gen, '3 hiệp x 12–15 lần', 'Weighted_Crunches', 'SELF_AUTHORED', 'PENDING')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 5. Khởi tạo liên kết các bài tập thay thế tương đương
-- Dùng tên bài chuẩn xác để liên kết giữa bài đòn tạ và bài tạ đơn/máy tập
INSERT IGNORE INTO exercise_alternatives (exercise_id, alternative_id)
SELECT e1.id, e2.id
FROM exercises e1, exercises e2
WHERE (
    (e1.name = 'Bench Press' AND e2.name = 'Đẩy ngực tạ đơn') OR
    (e1.name = 'Đẩy ngực tạ đơn' AND e2.name = 'Bench Press') OR
    (e1.name = 'Back Squat' AND e2.name = 'Leg Press') OR
    (e1.name = 'Leg Press' AND e2.name = 'Back Squat') OR
    (e1.name = 'Hít xà (Pull-up)' AND e2.name = 'Lat Pulldown') OR
    (e1.name = 'Lat Pulldown' AND e2.name = 'Hít xà (Pull-up)') OR
    (e1.name = 'Barbell Curl' AND e2.name = 'Cuốn tạ đòn thanh EZ') OR
    (e1.name = 'Cuốn tạ đòn thanh EZ' AND e2.name = 'Barbell Curl') OR
    (e1.name = 'Cuốn tạ đòn thanh EZ' AND e2.name = 'Cuốn tạ búa') OR
    (e1.name = 'Overhead Press' AND e2.name = 'Đẩy vai tạ đơn ngồi') OR
    (e1.name = 'Đẩy vai tạ đơn ngồi' AND e2.name = 'Overhead Press') OR
    (e1.name = 'Deadlift' AND e2.name = 'Romanian Deadlift') OR
    (e1.name = 'Romanian Deadlift' AND e2.name = 'Deadlift') OR
    (e1.name = 'Triceps Pushdown' AND e2.name = 'Nằm duỗi tay sau thanh EZ') OR
    (e1.name = 'Chống xà kép' AND e2.name = 'Hít đất (Push-up)') OR
    (e1.name = 'Plank' AND e2.name = 'Dead Bug') OR
    (e1.name = 'Dạng đùi trên máy' AND e2.name = 'Đi ngang') OR
    (e1.name = 'Khép đùi trên máy' AND e2.name = 'Goblet Squat')
) AND e1.id <> e2.id;

-- 6. Bổ sung bài viết hướng dẫn người mới bắt đầu vào bảng articles (trạng thái CHỜ DUYỆT)
INSERT INTO articles (slug, title, category, summary, body, content_origin, status, review_note)
VALUES
('cach-dung-may-tap', 'Cách dùng máy tập phòng gym chuẩn cho người mới', 'ACTIVITY',
 'Hướng dẫn các bước chỉnh máy tập, chọn chốt tạ và các lưu ý an toàn cơ bản nhất khi mới bước chân vào phòng gym.',
 '### 1. Tại sao người mới nên bắt đầu với máy tập khối tạ?
Khi mới bắt đầu, hệ thần kinh và cơ bắp của bạn chưa quen với việc giữ thăng bằng thanh đòn hay tạ đơn tự do. Máy tập khối tạ (Selectorized Machine) có đường ray cố định, giúp bạn cô lập nhóm cơ mục tiêu chuẩn xác và hạn chế tối đa nguy cơ chấn thương.

### 2. Ba bước chuẩn bị trên mọi máy tập
1. **Chỉnh độ cao ghế ngồi và đệm tựa**: Khớp xương bạn cần vận động (như khớp gối hoặc khớp vai) phải nằm thẳng hàng với trục quay tròn màu đỏ/vàng của máy.
2. **Kiểm tra chốt chọn mức tạ**: Chốt cắm kim loại phải được cắm ngập hoàn toàn vào rãnh tạ, không cắm lơ lửng lưng chừng.
3. **Thử biên độ chuyển động**: Hãy kéo hoặc đẩy thử 1 lần với mức tạ nhẹ nhất để chắc chắn biên độ không gây cấn hoặc đau khớp.

### 3. Nguyên tắc chuyển động an toàn
- Thực hiện động tác nhịp nhàng: 1 giây cho pha dùng lực (đẩy/kéo) và 2–3 giây cho pha hạ tạ về.
- Tuyệt đối không để các tấm tạ va đập vào nhau kêu thành tiếng ở cuối hiệp tập.',
 'SELF_AUTHORED', 'PENDING', 'Bài viết tự biên soạn cho người mới bắt đầu làm quen máy tập.'),

('chon-muc-ta', 'Cách chọn mức tạ phù hợp khi mới bắt đầu tập gym', 'ACTIVITY',
 'Không nên nâng tạ quá nặng cũng như không nên chọn tạ quá nhẹ. Hướng dẫn chọn mức tạ chuẩn khoa học theo thang cảm nhận sức.',
 '### 1. Sai lầm phổ biến về mức tạ
Nhiều người mới thường mắc hai thái cực: hoặc là chọn tạ quá nặng dẫn đến sai lệch form và chấn thương, hoặc là chọn tạ quá nhẹ đến mức sau 15 lần lặp vẫn không hề cảm thấy mỏi cơ. Cả hai cách này đều làm chậm tiến độ tập luyện của bạn.

### 2. Quy tắc 2 lần lặp dự trữ (RIR 2)
Mức tạ chuẩn nhất cho người mới là mức tạ mà khi bạn hoàn thành số lần lặp mục tiêu (ví dụ 10 lần), bạn cảm thấy mình chỉ còn đủ sức làm thêm được đúng **1 đến 2 lần nữa** với kỹ thuật hoàn hảo nếu bị ép buộc.

### 3. Quy trình thử mức tạ buổi đầu tiên
- Bắt đầu với mức tạ nhẹ nhất hoặc thanh đòn không tải để học thuần thục kỹ thuật.
- Tăng dần từng mức tạ nhỏ (1–2 kg mỗi bên).
- Khi bạn thấy tốc độ đẩy bắt đầu chậm lại ở 2 lần cuối nhưng form vẫn thẳng và chuẩn, đó chính là mức tạ tập luyện hiện tại của bạn.',
 'SELF_AUTHORED', 'PENDING', 'Bài viết tự biên soạn hướng dẫn cách thử mức tạ an toàn.'),

('chon-so-hiep-va-so-lan', 'Cách chọn số hiệp và số lần lặp (Sets & Reps) chuẩn mục tiêu', 'ACTIVITY',
 'Hiểu rõ ý nghĩa của Sets và Reps để không bị bối rối trước giáo án tập luyện và đạt đúng mục tiêu thể hình mong muốn.',
 '### 1. Khái niệm Sets và Reps là gì?
- **Rep (Repetition)**: Là một lần lặp hoàn chỉnh của động tác (ví dụ: 1 lần ngồi xuống đứng lên của bài Squat).
- **Set**: Là một hiệp tập bao gồm một chuỗi các reps liên tục trước khi bạn được nghỉ ngơi.

### 2. Hướng dẫn chọn theo mục tiêu
- **Tăng sức bền và săn chắc cơ bắp**: 2–3 hiệp, mỗi hiệp 12–15 lần lặp với mức tạ nhẹ đến vừa.
- **Tăng kích thước cơ bắp (Phì đại cơ - Hypertrophy)**: 3–4 hiệp, mỗi hiệp 8–12 lần lặp với mức tạ vừa phải.
- **Tăng sức mạnh tối đa (Strength)**: 3–5 hiệp, mỗi hiệp 4–6 lần lặp với mức tạ nặng (chỉ áp dụng khi đã nắm vững kỹ thuật).

### 3. Khuyến nghị cho người mới trong 4 tuần đầu
Trong tháng đầu tiên, hãy duy trì công thức vàng: **3 hiệp x 10–12 lần lặp** cho mọi bài tập đa khớp chính để xây dựng nền tảng vững chắc.',
 'SELF_AUTHORED', 'PENDING', 'Bài viết tự biên soạn giải thích sets và reps.'),

('nghi-giua-hiep', 'Thời gian nghỉ giữa các hiệp tập bao nhiêu là hợp lý?', 'ACTIVITY',
 'Nghỉ quá ngắn khiến cơ chưa kịp nạp năng lượng, nghỉ quá lâu làm cơ bị nguội. Thời gian nghỉ chuẩn theo từng loại bài tập.',
 '### 1. Tầm quan trọng của thời gian nghỉ
Thời gian nghỉ giữa hiệp là khoảng thời gian để cơ thể tái tạo nguồn năng lượng ATP và đào thải các chất chuyển hoá gây mỏi cơ. Nếu bạn bấm điện thoại quá lâu khiến cơ bị nguội lạnh, nguy cơ chấn thương ở hiệp tiếp theo sẽ tăng cao.

### 2. Thời gian nghỉ chuẩn khoa học
- **Bài tập đa khớp nặng (Squat, Deadlift, Bench Press)**: Nghỉ từ **2 đến 3 phút**. Hệ thần kinh và tim mạch cần đủ thời gian hồi phục để đảm bảo an toàn cho hiệp kế tiếp.
- **Bài tập cô lập và máy tập (Bicep Curl, Lateral Raise, Leg Extension)**: Nghỉ từ **60 đến 90 giây**.
- **Bài tập cơ bụng và Cardio cường độ nhẹ**: Nghỉ từ **30 đến 45 giây**.

### 3. Dấu hiệu nhận biết bạn đã sẵn sàng cho hiệp tiếp theo
Bạn đã sẵn sàng khi nhịp tim và nhịp thở trở lại tương đối ổn định, cơ bắp không còn cảm giác nóng ran nhức mỏi dữ dội và tinh thần hoàn toàn tập trung.',
 'SELF_AUTHORED', 'PENDING', 'Bài viết tự biên soạn về thời gian nghỉ giữa hiệp.'),

('loi-hay-gap-nguoi-moi', 'Những lỗi phổ biến người mới tập gym cần tránh', 'ACTIVITY',
 'Tổng hợp các sai lầm kinh điển từ việc bỏ qua khởi động, nâng tạ bằng quán tính đến nín thở sai cách mà người mới hay mắc.',
 '### 1. Bỏ qua bước khởi động làm nóng cơ thể
Nhiều người bước vào phòng tập là lao ngay vào nâng tạ nặng. Khởi động từ 5–8 phút với các bài xoay khớp và kích hoạt cơ nhẹ nhàng giúp tăng nhiệt độ cơ thể, bôi trơn khớp xương và giảm 80% nguy cơ căng cơ.

### 2. Nâng tạ bằng đà quán tính (Ego Lifting)
Dùng mức tạ quá nặng và lắc lư toàn bộ thân người để nâng tạ lên là nguyên nhân hàng đầu gây chấn thương lưng dưới và rách cơ. Hãy luôn nhớ: cơ bắp phát triển nhờ lực căng chịu tải (Time under tension), không phải nhờ trọng lượng ghi trên bánh tạ.

### 3. Nín thở khi gắng sức
Nín thở quá lâu khi đẩy tạ làm tăng vọt áp lực nội sọ và huyết áp, dễ dẫn đến choáng váng hoặc ngất xỉu. Nguyên tắc vàng: **Hít vào khi hạ tạ (pha giãn cơ) và thở ra dứt khoát khi dùng sức đẩy tạ lên (pha co cơ)**.

### 4. Không uống đủ nước trong buổi tập
Mất chỉ 2% lượng nước của cơ thể đã làm giảm tới 15% hiệu suất vận động. Hãy nhấp từng ngụm nước nhỏ sau mỗi hiệp tập.',
 'SELF_AUTHORED', 'PENDING', 'Bài viết tự biên soạn tổng hợp các lỗi thường gặp của người mới.')
ON DUPLICATE KEY UPDATE slug = articles.slug;
