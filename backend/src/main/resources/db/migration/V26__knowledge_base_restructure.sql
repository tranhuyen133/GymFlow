-- =====================================================================
-- GymFlow · V25 · Tái cấu trúc Kho kiến thức GymFlow
--  * Phân biệt rõ 3 loại bài tập: Bài tập chính (MAIN), Bài tập khởi động (WARMUP), Bài tập Cardio (CARDIO).
--  * Bổ sung phân nhóm chi tiết (sub_category) và cường độ Cardio (cardio_intensity: LOW, MEDIUM, HIGH).
--  * Nâng cấp bảng equipment: tên tiếng Anh (name_en), hướng dẫn điều chỉnh (adjustment_instructions),
--    lỗi thường gặp (common_mistakes).
--  * Bổ sung bảng favorites: lưu bài tập và dụng cụ yêu thích cho Hội viên và Huấn luyện viên.
--  * Chuẩn hóa và phân loại toàn bộ dữ liệu bài tập và thiết bị phòng gym hiện có.
-- =====================================================================

-- 1. Bổ sung các cột cho bảng exercises
ALTER TABLE exercises
    ADD COLUMN exercise_type    VARCHAR(20) NOT NULL DEFAULT 'MAIN' AFTER aliases,
    ADD COLUMN sub_category    VARCHAR(50) NULL AFTER exercise_type,
    ADD COLUMN cardio_intensity VARCHAR(20) NULL AFTER sub_category,
    ADD CONSTRAINT ck_ex_type CHECK (exercise_type IN ('MAIN', 'WARMUP', 'CARDIO')),
    ADD CONSTRAINT ck_ex_cardio_intensity CHECK (cardio_intensity IS NULL OR cardio_intensity IN ('LOW', 'MEDIUM', 'HIGH')),
    ADD INDEX ix_ex_type (exercise_type),
    ADD INDEX ix_ex_sub_category (sub_category);

-- 2. Bổ sung các cột cho bảng equipment
ALTER TABLE equipment
    ADD COLUMN name_en                 VARCHAR(120) NULL AFTER name,
    ADD COLUMN adjustment_instructions TEXT         NULL AFTER usage_guide,
    ADD COLUMN common_mistakes         TEXT         NULL AFTER adjustment_instructions;

-- 3. Tạo bảng lưu trữ mục yêu thích (Favorites)
CREATE TABLE IF NOT EXISTS favorites (
    id          BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT      NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id   VARCHAR(50) NOT NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_fav_type CHECK (target_type IN ('EXERCISE', 'EQUIPMENT')),
    CONSTRAINT uq_fav_user_target UNIQUE (user_id, target_type, target_id),
    INDEX ix_fav_user (user_id),
    INDEX ix_fav_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Chuẩn hóa & cập nhật dữ liệu bảng equipment hiện có
UPDATE equipment
SET name_en = 'Olympic Barbell & Weight Rack',
    adjustment_instructions = '1. Đặt giá đỡ thanh đòn (J-hooks) ngang tầm xương ức hoặc ngực trên để nhấc tạ ra không cần kiễng chân.\n2. Chỉnh thanh an toàn (safety bars) thấp hơn điểm chạm ngực/hông 3-5cm để thoát tạ khẩn cấp.\n3. Luôn kẹp khóa tạ (collars/clips) ở hai đầu trước khi nâng.',
    common_mistakes = 'Đặt giá đỡ quá cao khiến phải nhón chân khi nhấc tạ; không dùng kẹp khóa làm bánh tạ trượt rơi; cong lưng dưới khi lấy đòn ra khỏi giá.'
WHERE `key` = 'barbell';

UPDATE equipment
SET name_en = 'Dumbbells',
    adjustment_instructions = '1. Chọn mức tạ cân bằng hai bên tay.\n2. Khi nằm ghế, đặt tạ đứng trên đùi gần đầu gối trước rồi dùng chân đẩy tạ lên ngực khi ngả lưng.\n3. Khi kết thúc, nâng đầu gối đỡ lấy tạ rồi mượn đà ngồi dậy an toàn.',
    common_mistakes = 'Thả rơi tạ tự do từ trên cao xuống sàn; vặn vẹo thân người để lấy đà khi tạ quá nặng; bẻ gập cổ tay ra sau khi đẩy tạ nặng.'
WHERE `key` = 'dumbbell';

UPDATE equipment
SET name_en = 'Kettlebell',
    adjustment_instructions = '1. Chọn mức tạ theo bài tập: nhẹ cho kích hoạt cơ/xoay thân, vừa/nặng cho vung hông (swing) và squat ôm tạ (goblet squat).\n2. Cầm chắc quai tạ bằng cả bàn tay hoặc luồn ngón tay ôm quai khi giữ tạ trước ngực.',
    common_mistakes = 'Dùng lực cơ tay và vai để kéo tạ lên thay vì phát lực từ bản lề hông (hip hinge); để tạ va đập mạnh vào xương cẳng tay khi lên tạ (clean).'
WHERE `key` = 'kettlebell';

UPDATE equipment
SET name_en = 'Cable Cross & Pulley Station',
    adjustment_instructions = '1. Kéo chốt lò xo bên hông ray trượt để nâng hoặc hạ pully đến độ cao mong muốn (cao, ngang ngực hoặc sát sàn).\n2. Gắn phụ kiện tay cầm phù hợp (thanh thẳng, dây thừng triceps, tay nắm D-handle) bằng móc khóa carabiner chắc chắn.\n3. Cắm chốt ngập sâu vào khối tạ trước khi bắt đầu kéo.',
    common_mistakes = 'Không cắm hết ngập chốt tạ vào khối tạ; để khối tạ rơi tự do va chạm ầm ĩ giữa các lần lặp; giật đà thân người làm mất lực căng liên tục trên cơ.'
WHERE `key` = 'cable';

UPDATE equipment
SET name_en = 'Selectorized Strength Machines',
    adjustment_instructions = '1. Chỉnh độ cao đệm ngồi sao cho khớp vận động (khớp gối, khuỷu tay, vai) thẳng hàng với trục quay màu đỏ/vàng của máy.\n2. Chỉnh đệm đỡ chân hoặc tay vừa vặn, không bị với hoặc chèn ép mạch máu.\n3. Cắm chốt mức tạ chắc chắn.',
    common_mistakes = 'Ngồi sai trục quay của máy gây áp lực lên khớp; khóa cứng khớp gối hoặc khớp khuỷu ở cuối động tác; đung đưa thân trên khi đẩy/kéo.'
WHERE `key` = 'machine';

UPDATE equipment
SET name_en = 'Cardio Endurance Machines',
    adjustment_instructions = '1. Máy chạy: Gắn kẹp khóa an toàn (safety clip) vào vạt áo; chỉnh tốc độ và độ dốc từ từ.\n2. Xe đạp: Chỉnh yên xe ngang tầm xương hông khi đứng cạnh máy; khi đạp chân ở điểm thấp nhất thì đầu gối hơi chùng 10-15 độ.\n3. Máy chèo: Cài dây cố định mu bàn chân chắc chắn, chỉnh lực cản gió/nước (damper) từ 3 đến 5 cho người mới.',
    common_mistakes = 'Cúi đầu nhìn xuống chân khi chạy; vịn chặt tay vào thanh tay vịn máy chạy làm giảm hiệu quả đốt calo; cong lưng khi kéo tay chèo máy rowing.'
WHERE `key` = 'cardio-machine';

UPDATE equipment
SET name_en = 'Resistance Bands',
    adjustment_instructions = '1. Chọn màu dây tương ứng lực kéo (nhẹ: khởi động/vai; trung bình: tay/lưng; nặng: chân/mông).\n2. Neo dây vào điểm cố định vững chắc, không có cạnh sắc nhọn.',
    common_mistakes = 'Kéo giãn dây vượt quá 2.5 lần chiều dài ban đầu; neo vào vật lỏng lẻo; thả dây đột ngột làm dây bật vào người.'
WHERE `key` = 'band';

UPDATE equipment
SET name_en = 'Adjustable Workout Bench',
    adjustment_instructions = '1. Kéo chốt chỉnh góc tựa lưng: 0 độ (ghế phẳng - Flat), 30-45 độ (dốc lên - Incline), hoặc dốc xuống (Decline).\n2. Chỉnh đệm ngồi hơi chếch lên khi tập ghế dốc để tránh trượt người.\n3. Nghe tiếng tách xác nhận chốt đã ăn khớp trước khi nằm.',
    common_mistakes = 'Không cài chắc chốt hãm độ dốc trước khi nằm; kê ghế kênh vênh trên thảm hoặc mặt sàn không bằng phẳng; chân không chạm vững xuống sàn.'
WHERE `key` = 'bench';

UPDATE equipment
SET name_en = 'Pull-up Bar',
    adjustment_instructions = '1. Nếu dùng xà đơn di động hoặc máy trợ lực kéo xà (assisted pull-up machine), chỉnh chốt tạ đối trọng phù hợp.\n2. Dùng bục bước lên để với tới xà, không nhảy với nếu trần thấp.',
    common_mistakes = 'Đung đưa thân người (kipping) khi chưa kiểm soát được cơ xô; rụt cổ gồng vai; không kéo qua cằm hoặc không hạ hết biên độ.'
WHERE `key` = 'pullup-bar';

UPDATE equipment
SET name_en = 'Parallel Dip Bars',
    adjustment_instructions = '1. Nếu xà kép có thể chỉnh độ rộng, chỉnh thanh xà rộng bằng chiều dài cẳng tay tính từ khuỷu đến ngón tay.\n2. Nắm chắc lòng bàn tay vào giữa thanh xà.',
    common_mistakes = 'Hạ người quá sâu (khuỷu tay gập sâu hơn 90 độ) gây chấn thương dây chằng vai; nhún vai về phía tai; vung vẩy hai chân.'
WHERE `key` = 'dip-bars';

UPDATE equipment
SET name_en = 'Smith Machine',
    adjustment_instructions = '1. Chỉnh chốt an toàn cơ học ở hai bên cột ray ở độ cao an toàn nhất.\n2. Xoay cổ tay để móc hoặc mở móc thanh đòn vào các khía răng cưa trên thanh ray.',
    common_mistakes = 'Đặt chân quá xa hoặc quá gần trục trượt thẳng đứng; quên cài chốt chặn an toàn dự phòng khi tập mức tạ nặng một mình.'
WHERE `key` = 'smith-machine';

UPDATE equipment
SET name_en = 'EZ-Curl Bar',
    adjustment_instructions = '1. Cầm tay vào phần uốn cong tự nhiên của thanh đòn (úp hoặc ngửa tay).\n2. Kẹp khóa tạ ở hai đầu trước khi nâng.',
    common_mistakes = 'Đung đưa thân người, ưỡn lưng để lấy đà cuốn tạ; để khuỷu tay trôi tự do ra sau.'
WHERE `key` = 'ez-bar';

UPDATE equipment
SET name_en = 'Olympic Weight Plates',
    adjustment_instructions = '1. Nhấc bánh tạ bằng cách gập hông và gối, giữ lưng thẳng.\n2. Lắp bánh tạ đều hai bên thanh đòn.\n3. Luôn xếp bánh tạ đúng mức cân lên giá sau khi dùng.',
    common_mistakes = 'Cúi gập lưng nhấc bánh tạ 20kg gây đau cột sống; xếp bánh tạ lộn xộn đè lên nhau gây nguy hiểm kẹp tay.'
WHERE `key` = 'plate';

UPDATE equipment
SET name_en = 'Foam Roller',
    adjustment_instructions = '1. Đặt ống lăn dưới vùng cơ cần giải phóng mạc cơ (đùi trước, đùi sau, bắp chân, lưng trên).\n2. Dùng trọng lượng cơ thể và tay/chân còn lại để điều tiết lực tì đè.',
    common_mistakes = 'Lăn trực tiếp lên khớp gối, khớp háng hoặc vùng xương sống thắt lưng dưới; nín thở khi gặp điểm căng đau (trigger point).'
WHERE `key` = 'foam-roller';

UPDATE equipment
SET name_en = 'Exercise & Stability Ball',
    adjustment_instructions = '1. Bơm căng bóng vừa phải.\n2. Khi ngồi trên bóng, khớp háng và gối tạo thành góc 90 độ, hai bàn chân đặt phẳng trên mặt sàn.',
    common_mistakes = 'Đặt bóng gần vật sắc nhọn hoặc nhiệt độ cao; tập động tác giật mạnh làm bóng trượt khỏi vị trí.'
WHERE `key` = 'ball';

UPDATE equipment
SET name_en = 'Bodyweight Training',
    adjustment_instructions = '1. Trải thảm tập yoga hoặc thảm cao su chống trượt.\n2. Đảm bảo khoảng không gian tập rộng tối thiểu 2m x 2m thoáng khí.',
    common_mistakes = 'Võng lưng khi thực hiện chống đẩy hoặc plank; không làm ấm khớp cổ tay cổ chân trước khi tập.'
WHERE `key` = 'bodyweight';

UPDATE equipment
SET name_en = 'Fitness Accessories',
    adjustment_instructions = '1. Kiểm tra độ nguyên vẹn của phụ kiện (dây thừng battle rope, con lăn bụng ab wheel, hộp nhảy plyo box) trước khi sử dụng.',
    common_mistakes = 'Sử dụng phụ kiện bị sờn rách, nứt vỡ hoặc trơn trượt mồ hôi.'
WHERE `key` = 'other';

-- Bổ sung các thiết bị chuyên dụng phục vụ phân loại danh mục D
INSERT INTO equipment (`key`, name, name_en, category, short_desc, usage_guide, adjustment_instructions, common_mistakes, safety_notes, target_muscle_keys, image_key, sort_order, hidden, review_status, origin)
VALUES
('machine-chest', 'Máy tập ngực (Chest Press Machine)', 'Chest Press Machine', 'MACHINE',
 'Máy đẩy ngực ray trượt cố định giúp tác động an toàn, tập trung vào cơ ngực lớn mà không lo rơi tạ.',
 '1. Ngồi áp sát lưng và đầu vào đệm ghế.\n2. Nắm tay cầm ngang ngực, đẩy tạ về phía trước đến khi tay gần thẳng.\n3. Hạ chậm về vị trí ban đầu trong 2-3 giây.',
 'Chỉnh đệm ghế sao cho tay cầm ngang ngực giữa. Chỉnh chốt tầm đẩy để không bị căng vai quá mức khi ở vị trí bắt đầu.',
 'Đẩy bằng vai thay vì ngực; khóa cứng khớp khuỷu; nhấc mông hoặc lưng ra khỏi đệm ghế.',
 'Khởi động khớp vai trước khi đẩy nặng; không thả tạ va đập mạnh giữa các lần.',
 'chest,front-deltoids,triceps', 'Machine_Bench_Press', 51, FALSE, 'APPROVED', 'SELF_AUTHORED'),

('machine-back', 'Máy tập lưng & kéo xô (Lat Pulldown & Row Machine)', 'Lat Pulldown & Cable Row Machine', 'MACHINE',
 'Máy kéo xô thẳng đứng và kéo cáp ngang phát triển toàn diện độ rộng lưng xô và độ dày lưng giữa.',
 '1. Cài đùi chắc chắn dưới đệm giữ.\n2. Cầm thanh kéo rộng hơn vai, kéo xuống ngang xương đòn ngực trên.\n3. Kiểm soát nhả tạ từ từ lên trên.',
 'Chỉnh đệm đùi ép sát mu đùi để thân người không bị nhấc lên khi kéo nặng. Chỉnh chốt khối tạ chắc chắn.',
 'Ngả người ra sau quá nhiều (hơn 30 độ); kéo thanh tạ ra sau gáy; dùng quán tính giật người.',
 'Tuyệt đối không kéo tạ ra sau gáy để tránh chấn thương khớp vai và đốt sống cổ.',
 'upper-back,biceps,trapezius', 'Wide-Grip_Lat_Pulldown', 52, FALSE, 'APPROVED', 'SELF_AUTHORED'),

('machine-shoulder', 'Máy tập vai (Shoulder Press Machine)', 'Shoulder Press Machine', 'MACHINE',
 'Máy đẩy vai thẳng đứng qua đầu, cô lập tối đa cơ vai trước và vai giữa với quỹ đạo cân bằng hai bên.',
 '1. Ngồi thẳng lưng, nắm chắc tay cầm.\n2. Đẩy tay cầm lên trên đỉnh đầu.\n3. Hạ chậm về ngang tai rồi tiếp tục lần lặp tiếp theo.',
 'Chỉnh ghế ngồi sao cho tay cầm ngang tầm tai hoặc cằm khi ở vị trí thấp nhất.',
 'Ưỡn ngực cong lưng dưới quá mức; đẩy lệch một bên tay; khóa khớp khuỷu ở đỉnh.',
 'Người có tiền sử đau vai nên hạ tạ dừng ở ngang tầm tai, không hạ quá sâu.',
 'front-deltoids,triceps,trapezius', 'Machine_Shoulder_Military_Press', 53, FALSE, 'APPROVED', 'SELF_AUTHORED'),

('machine-legs', 'Máy tập chân (Leg Press & Leg Extension Machine)', 'Leg Press & Leg Curl Machine', 'MACHINE',
 'Hệ thống máy đạp đùi 45 độ, máy đá đùi trước và cuốn đùi sau phát triển cơ đùi và hông mạnh mẽ.',
 '1. Đặt lưng và mông dính chặt vào ghế tựa.\n2. Đặt hai bàn chân rộng bằng vai trên bàn đạp.\n3. Mở chốt an toàn, co gối hạ tạ từ từ rồi đạp dứt khoát về vị trí ban đầu.',
 'Chỉnh đệm tựa lưng góc 45 độ; chỉnh con lăn đá đùi nằm ngay trên mắt cá chân; chỉnh đệm đùi sau ôm sát gót chân.',
 'Khóa cứng (bẻ thẳng đơ) khớp gối khi đạp tạ lên đỉnh; nhấc mông khỏi đệm ghế khi hạ tạ sâu.',
 'TUYỆT ĐỐI KHÔNG KHÓA CỨNG KHỚP GỐI khi đạp đùi (Leg Press) để tránh nguy cơ gãy ngược khớp gối nghiêm trọng.',
 'quadriceps,hamstring,gluteal,calves', 'Leg_Press', 54, FALSE, 'APPROVED', 'SELF_AUTHORED'),

('treadmill', 'Máy chạy bộ (Treadmill)', 'Motorized Treadmill', 'CARDIO',
 'Máy chạy bộ điện tích hợp điều chỉnh tốc độ, độ dốc và cảm biến nhịp tim, nâng cao sức bền tim phổi.',
 '1. Đứng hai chân trên thanh gờ hai bên băng tải trước khi bấm khởi động.\n2. Bấm Start ở tốc độ đi bộ 3-4 km/h rồi bước vào băng tải.\n3. Tăng dần tốc độ và độ dốc theo giáo án.',
 'Gắn kẹp dây an toàn (safety key) vào vạt áo. Chỉnh độ dốc từ 1% để giảm chấn động dội ngược lên khớp gối.',
 'Nhìn xuống chân hoặc bấm điện thoại khi chạy; bám chặt hai tay vào tay vịn; nhảy xuống băng tải khi đang chạy nhanh.',
 'Luôn mang giày chạy bộ chuyên dụng có đệm giảm chấn. Rút chìa khóa an toàn ngay khi có sự cố thăng bằng.',
 'calves,quadriceps,hamstring,gluteal', 'Jogging_Treadmill', 61, FALSE, 'APPROVED', 'SELF_AUTHORED'),

('bike', 'Xe đạp tập (Stationary Exercise Bike)', 'Stationary Exercise Bike', 'CARDIO',
 'Xe đạp tập thể lực đứng và ngả lưng, giảm thiểu áp lực trọng lượng cơ thể lên khớp gối và cột sống.',
 '1. Ngồi lên yên, xỏ bàn chân vào quai bàn đạp.\n2. Đạp đều chân nhịp nhàng, siết nhẹ cơ bụng và giữ lưng thẳng tự nhiên.\n3. Chỉnh mức kháng lực bánh đà tăng dần.',
 'Chỉnh độ cao yên xe sao cho khi bàn đạp ở điểm thấp nhất, đầu gối gập nhẹ góc 10-15 độ. Chỉnh tay lái vừa tầm với.',
 'Chỉnh yên quá thấp làm gập gối quá mức gây đau khớp bánh chè; nhún nhảy thân trên khi đạp.',
 'Điều chỉnh quai giữ bàn đạp vừa vặn để tránh trượt chân khi đạp tốc độ cao.',
 'quadriceps,calves,gluteal,hamstring', 'Bicycling_Stationary', 62, FALSE, 'APPROVED', 'SELF_AUTHORED')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    name_en = VALUES(name_en),
    adjustment_instructions = VALUES(adjustment_instructions),
    common_mistakes = VALUES(common_mistakes);

-- 5. Phân loại chuẩn hóa toàn bộ bài tập hiện có vào 3 nhóm: MAIN, WARMUP, CARDIO

-- 5.1. Nhóm bài tập CARDIO
UPDATE exercises
SET exercise_type = 'CARDIO',
    sub_category = CASE
        WHEN LOWER(name) LIKE '%chạy bộ%' OR LOWER(name_en) LIKE '%treadmill%' OR LOWER(name_en) LIKE '%running%' OR LOWER(name_en) LIKE '%jogging%' THEN 'running'
        WHEN LOWER(name) LIKE '%đi bộ%' OR LOWER(name_en) LIKE '%walking%' THEN 'walking'
        WHEN LOWER(name) LIKE '%đạp xe%' OR LOWER(name_en) LIKE '%bike%' OR LOWER(name_en) LIKE '%cycling%' THEN 'cycling'
        WHEN LOWER(name) LIKE '%nhảy dây%' OR LOWER(name_en) LIKE '%jump rope%' OR LOWER(name_en) LIKE '%rope%' THEN 'jump_rope'
        WHEN LOWER(name) LIKE '%chèo thuyền%' OR LOWER(name_en) LIKE '%rowing%' THEN 'rowing'
        WHEN LOWER(name) LIKE '%elip%' OR LOWER(name_en) LIKE '%elliptical%' THEN 'elliptical'
        WHEN LOWER(name) LIKE '%leo bậc%' OR LOWER(name_en) LIKE '%stair%' THEN 'stair_climber'
        ELSE 'hiit'
    END,
    cardio_intensity = CASE
        WHEN LOWER(name) LIKE '%đi bộ%' OR LOWER(name) LIKE '%ngả lưng%' THEN 'LOW'
        WHEN LOWER(name) LIKE '%nhảy dây%' OR LOWER(name) LIKE '%leo bậc%' OR LOWER(name) LIKE '%chèo thuyền%' THEN 'HIGH'
        ELSE 'MEDIUM'
    END
WHERE muscle_group = 'CARDIO'
   OR equipment_keys LIKE '%cardio-machine%'
   OR LOWER(name) LIKE '%chạy bộ%'
   OR LOWER(name) LIKE '%đạp xe%'
   OR LOWER(name) LIKE '%nhảy dây%';

-- 5.2. Nhóm bài tập KHỞI ĐỘNG (WARMUP)
UPDATE exercises
SET exercise_type = 'WARMUP',
    sub_category = CASE
        WHEN LOWER(name) LIKE '%xoay cổ%' OR LOWER(name) LIKE '%giãn cổ%' OR LOWER(name_en) LIKE '%neck%' THEN 'joint_mobility'
        WHEN LOWER(name) LIKE '%xoay thân%' OR LOWER(name) LIKE '%vai%' THEN 'shoulder'
        WHEN LOWER(name) LIKE '%hông%' OR LOWER(name) LIKE '%mông%' THEN 'hip'
        WHEN LOWER(name) LIKE '%gối%' OR LOWER(name) LIKE '%đùi%' OR LOWER(name) LIKE '%bắp chân%' THEN 'knee'
        WHEN LOWER(name) LIKE '%smr%' OR LOWER(name) LIKE '%con lăn%' OR LOWER(name) LIKE '%giãn%' THEN 'dynamic_stretching'
        ELSE 'full_body'
    END
WHERE exercise_type <> 'CARDIO'
  AND (LOWER(name) LIKE '%khởi động%'
   OR LOWER(name) LIKE '%giãn%'
   OR LOWER(name) LIKE '%xoay cổ%'
   OR LOWER(name) LIKE '%xoay thân%'
   OR LOWER(name) LIKE '%-smr%'
   OR LOWER(name_en) LIKE '%stretch%'
   OR LOWER(name_en) LIKE '%smr%');

-- 5.3. Nhóm bài tập CHÍNH (MAIN)
UPDATE exercises
SET exercise_type = 'MAIN',
    sub_category = CASE
        WHEN muscle_group = 'CHEST' OR target_muscles LIKE '%chest%' THEN 'chest'
        WHEN muscle_group = 'BACK' OR target_muscles LIKE '%upper-back%' OR target_muscles LIKE '%lower-back%' OR target_muscles LIKE '%trapezius%' THEN 'back'
        WHEN muscle_group = 'SHOULDERS' OR target_muscles LIKE '%front-deltoids%' OR target_muscles LIKE '%back-deltoids%' THEN 'shoulders'
        WHEN target_muscles LIKE '%biceps%' OR (muscle_group = 'ARMS' AND (LOWER(name) LIKE '%tay trước%' OR LOWER(name) LIKE '%cuốn%' OR LOWER(name_en) LIKE '%curl%')) THEN 'biceps'
        WHEN target_muscles LIKE '%triceps%' OR (muscle_group = 'ARMS' AND (LOWER(name) LIKE '%tay sau%' OR LOWER(name) LIKE '%duỗi%' OR LOWER(name_en) LIKE '%triceps%' OR LOWER(name_en) LIKE '%dip%')) THEN 'triceps'
        WHEN muscle_group = 'CORE' OR target_muscles LIKE '%abs%' OR target_muscles LIKE '%obliques%' THEN 'core'
        WHEN target_muscles LIKE '%gluteal%' OR LOWER(name) LIKE '%mông%' OR LOWER(name_en) LIKE '%glute%' OR LOWER(name_en) LIKE '%bridge%' OR LOWER(name_en) LIKE '%thrust%' THEN 'glutes'
        WHEN muscle_group = 'LEGS' OR target_muscles LIKE '%quadriceps%' OR target_muscles LIKE '%hamstring%' OR target_muscles LIKE '%calves%' THEN 'legs'
        ELSE 'full_body'
    END
WHERE exercise_type = 'MAIN' OR exercise_type IS NULL;

-- 6. Bổ sung các bài tập khởi động và bài tập cardio chuẩn hóa để đầy đủ 100% các mục trong đặc tả
INSERT INTO exercises (name, name_en, aliases, exercise_type, sub_category, cardio_intensity, muscle_group,
                       target_muscles, secondary_muscle_keys, secondary_muscles, equipment, equipment_keys,
                       level, location, goals, primary_goal, description, setup_position, steps, instructions,
                       breathing, common_mistakes, safety_notes, suggested_dose, sets_reps_hint, image_key,
                       content_origin, review_status)
VALUES
('Khởi động xoay các khớp toàn diện', 'Full Body Joint Mobility Routine', 'Xoay cổ, vai, hông, gối, cổ chân',
 'WARMUP', 'joint_mobility', NULL, 'FULL_BODY',
 'neck,front-deltoids,gluteal,quadriceps', 'upper-back,calves', 'Cơ thang, bắp chân', 'Không dụng cụ', 'bodyweight',
 'BEGINNER', 'ANY', 'MOBILITY,ENDURANCE', 'MOBILITY',
 'Chuỗi bài tập xoay khớp từ đầu đến chân giúp tiết dịch nhờn bôi trơn ổ khớp, làm nóng cơ bắp và phòng tránh chấn thương khớp khi nâng tạ.',
 'Đứng thẳng, hai chân rộng bằng vai, thả lỏng hai tay bên sườn.',
 '1. Xoay tròn khớp cổ nhẹ nhàng 5 vòng theo chiều kim đồng hồ, sau đó đổi chiều 5 vòng.\n2. Dang hai tay sang ngang, xoay tròn cánh tay từ nhỏ đến lớn 10 vòng ra trước, 10 vòng ra sau.\n3. Chắp hai tay vào hông, xoay tròn khớp hông rộng vòng 10 lần mỗi bên.\n4. Khép hai gối, hai tay đặt lên đầu gối, xoay tròn khớp gối nhẹ nhàng 10 vòng.\n5. Đứng một chân, nhấc chân kia xoay tròn cổ chân và cổ tay đồng thời 10 vòng mỗi bên.',
 'Thực hiện liên tục các chuyển động xoay khớp theo thứ tự từ trên xuống dưới.',
 'Hít thở đều đặn, nhịp nhàng qua mũi, không nín thở.',
 'Xoay quá nhanh hoặc giật cục; xoay cổ quá ngửa ra sau gây chèn ép đốt sống cổ.',
 'Xoay với biên độ vừa phải, không cố gượng ép khớp khi nghe tiếng lục cục đau rát.',
 '1 vòng toàn bộ các khớp, mỗi khớp 10 lần', '1 lượt x 5 phút', 'Isometric_Neck_Exercise_-_Front_And_Back',
 'SELF_AUTHORED', 'APPROVED'),

('Khởi động khớp vai & xoay tay với dây kháng lực', 'Band Pull-Aparts & Shoulder Warm-up', 'Kéo dây mở vai, kích hoạt bả vai',
 'WARMUP', 'shoulder', NULL, 'SHOULDERS',
 'back-deltoids,trapezius', 'front-deltoids,upper-back', 'Vai trước, lưng trên', 'Dây kháng lực', 'band',
 'BEGINNER', 'ANY', 'STRENGTH,HYPERTROPHY', 'STRENGTH',
 'Kích hoạt nhóm cơ xoay vai (rotator cuff), cơ vai sau và cơ lưng trên, ổn định xương bả vai trước các bài đẩy ngực hoặc đẩy vai nặng.',
 'Đứng thẳng, hai tay cầm hai đầu dây kháng lực đưa thẳng ra trước mặt ngang tầm ngực.',
 '1. Giữ khuỷu tay hơi chùng tự nhiên, siết nhẹ cơ bụng.\n2. Kéo dây sang hai bên bằng cách ép hai xương bả vai lại gần nhau, đưa dây chạm nhẹ vào ngực.\n3. Dừng lại 1 giây ở vị trí mở rộng tối đa, cảm nhận cơ vai sau siết chặt.\n4. Nhả từ từ về vị trí ban đầu có kiểm soát.',
 'Kéo căng dây sang hai bên và ép bả vai lại với nhau.',
 'Thở ra khi kéo căng dây sang hai bên, hít vào khi thu tay về vị trí chuẩn bị.',
 'Nhún vai lên sát tai; ưỡn lưng cong người để mượn lực; chọn dây quá nặng khiến gập khuỷu tay.',
 'Chọn dây kháng lực mức nhẹ nhất để ưu tiên kích hoạt cơ và làm nóng bao khớp.',
 '2 - 3 hiệp, mỗi hiệp 15 - 20 lần lặp', '2-3 hiệp x 15-20 reps', 'Cable_Rear_Delt_Fly',
 'SELF_AUTHORED', 'APPROVED'),

('Khởi động hông bước gập gối xoay thân (World Greatest Stretch)', 'Worlds Greatest Hip & Torso Stretch', 'Giãn cơ hông bước tấn xoay thân',
 'WARMUP', 'hip', NULL, 'LEGS',
 'gluteal,quadriceps,hamstring', 'obliques,upper-back', 'Liên sườn, lưng giữa', 'Không dụng cụ', 'bodyweight',
 'BEGINNER', 'ANY', 'MOBILITY,ENDURANCE', 'MOBILITY',
 'Được mệnh danh là bài giãn cơ động tuyệt vời nhất, giải phóng khớp háng, giãn cơ gập hông và tăng độ linh hoạt xoay lồng ngực.',
 'Bắt đầu ở tư thế chống đẩy cao thân người (plank cao).',
 '1. Bước chân phải lên đặt sát mép ngoài bàn tay phải, hạ thấp hông xuống sàn.\n2. Đưa khuỷu tay phải hạ thấp chạm nhẹ xuống sàn gần mắt cá chân phải.\n3. Vươn cánh tay phải lên cao hướng trần nhà, xoay lồng ngực và mắt nhìn theo bàn tay.\n4. Hạ tay về sàn, đổi bên với chân trái.',
 'Bước tấn chân rộng, hạ khuỷu tay rồi xoay lồng ngực mở rộng lên trần nhà.',
 'Thở ra khi xoay thân mở ngực lên cao, hít vào khi hạ tay xuống sàn.',
 'Gù lưng khi bước chân lên; chân sau chùng gối chạm sàn; xoay người vội vã mất thăng bằng.',
 'Giữ chân sau thẳng căng để kéo giãn tối đa cơ gập hông (hip flexors).',
 '5 lần mỗi bên chân', '1-2 hiệp x 5 lần/bên', 'Bodyweight_Squat',
 'SELF_AUTHORED', 'APPROVED'),

('Kích hoạt cơ mông với dây kháng lực (Banded Monster Walk)', 'Banded Monster Walk', 'Đi ngang kích hoạt cơ mông nhỡ',
 'WARMUP', 'muscle_activation', NULL, 'LEGS',
 'abductors,gluteal', 'quadriceps,hamstring', 'Đùi trước, đùi sau', 'Dây kháng lực mini', 'band',
 'BEGINNER', 'GYM', 'STRENGTH,HYPERTROPHY', 'STRENGTH',
 'Kích hoạt cơ mông nhỡ (gluteus medius) và các cơ ổn định khớp háng, ngăn ngừa sụp gối vào trong (knee valgus) khi tập Squat hoặc Deadlift.',
 'Lồng dây kháng lực vòng quanh đùi (ngay phía trên đầu gối) hoặc quanh cổ chân. Đứng hai chân rộng bằng vai, hạ hông về tư thế nửa squat (quarter squat).',
 '1. Giữ hai đầu gối mở rộng ép căng dây kháng lực, ngực mở thẳng.\n2. Bước chéo chân phải sang phải 1 bước rộng, sau đó bước chân trái theo nhưng vẫn giữ lực căng dây.\n3. Đi ngang 10 bước sang phải, sau đó đổi chiều đi 10 bước sang trái.',
 'Bước ngang từng bước có kiểm soát trong tư thế nửa squat.',
 'Hít thở đều đặn theo từng bước chân.',
 'Để đầu gối bị kéo chụm vào nhau; đứng thẳng người mất tư thế squat; bước chân quá nhanh không có lực ghìm.',
 'Luôn giữ ý thức mở gối hướng theo mũi chân suốt bài tập.',
 '2 hiệp, mỗi hiệp 10 - 15 bước mỗi chiều', '2 hiệp x 10-15 bước', 'Thigh_Abductor',
 'SELF_AUTHORED', 'APPROVED'),

('HIIT Tabata Cardio toàn thân', 'Full Body HIIT Tabata Intervals', 'Tabata Cardio ngắt quãng cường độ cao',
 'CARDIO', 'hiit', 'HIGH', 'FULL_BODY',
 'quadriceps,gluteal,abs', 'calves,shoulders,chest', 'Bắp chân, vai, ngực', 'Không dụng cụ', 'bodyweight',
 'INTERMEDIATE', 'ANY', 'FAT_LOSS,ENDURANCE', 'FAT_LOSS',
 'Tập luyện ngắt quãng cường độ cao (HIIT) theo giao thức Tabata 20 giây dốc sức tối đa - 10 giây nghỉ, kích hoạt hiệu ứng đốt calo sau tập EPOC suốt 24 giờ.',
 'Đứng thẳng sẵn sàng, chuẩn bị đồng hồ bấm giờ 20 giây hoạt động / 10 giây nghỉ.',
 '1. 20 giây: Bật nhảy mở rộng tay chân (Jumping Jacks) tốc độ cao.\n2. Nghỉ 10 giây.\n3. 20 giây: Chống đẩy leo núi (Mountain Climbers) nhanh.\n4. Nghỉ 10 giây.\n5. 20 giây: Ngồi xổm bật nhảy (Jump Squats).\n6. Nghỉ 10 giây.\n7. 20 giây: Chạy nâng cao đùi tại chỗ (High Knees).\n8. Lặp lại chu kỳ 8 hiệp (tổng cộng 4 phút).',
 '20 giây tập hết công suất, 10 giây nghỉ ngơi thả lỏng, lặp lại liên tục.',
 'Thở gấp tự nhiên theo nhịp vận động, không nín thở khi mệt.',
 'Bỏ cuộc giữa chừng trong 20 giây chạy nước rút; hạ gót chân quá mạnh khi tiếp đất; cong lưng khi tập Mountain Climber.',
 'Người có bệnh tim mạch hoặc huyết áp cao cần hỏi ý kiến bác sĩ trước khi tập luyện HIIT cường độ tối đa.',
 '4 - 8 hiệp (4 đến 8 phút dốc sức)', 'Tabata 8 hiệp (4 phút)', 'Mountain_Climbers',
 'SELF_AUTHORED', 'APPROVED')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    exercise_type = VALUES(exercise_type),
    sub_category = VALUES(sub_category),
    cardio_intensity = VALUES(cardio_intensity);
