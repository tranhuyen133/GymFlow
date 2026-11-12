-- =====================================================================
-- GymFlow · V26 · Tái cấu trúc kho kiến thức thể hình (TASK 01 / SCRUM-229)
--  * Chuẩn hoá phân loại bài tập: exercise_type (STRENGTH / WARMUP / CARDIO) & sub_category
--  * Nâng cấp bảng equipment: bổ sung adjust_guide (cách điều chỉnh) và common_mistakes (lỗi thường gặp)
--  * Bảng nối nhiều-nhiều hai chiều: exercise_equipment (bài tập - thiết bị)
--  * Bảng lưu bài tập yêu thích của hội viên: member_favorite_exercises
--  * Backfill dữ liệu hiện có và bổ sung bài tập Khởi động, Cardio, Hướng dẫn tập luyện chuẩn hóa
-- =====================================================================

-- 1. Bổ sung cột phân loại cho bảng exercises
ALTER TABLE exercises
    ADD COLUMN exercise_type VARCHAR(20) NOT NULL DEFAULT 'STRENGTH' AFTER aliases,
    ADD COLUMN sub_category  VARCHAR(60) NULL AFTER exercise_type;

ALTER TABLE exercises
    ADD INDEX ix_ex_type (exercise_type),
    ADD INDEX ix_ex_sub_cat (sub_category);

-- 2. Bổ sung cột điều chỉnh và lỗi thường gặp cho bảng equipment
ALTER TABLE equipment
    ADD COLUMN adjust_guide    TEXT NULL AFTER usage_guide,
    ADD COLUMN common_mistakes TEXT NULL AFTER adjust_guide;

-- 3. Bảng nối nhiều-nhiều hai chiều giữa bài tập và thiết bị
CREATE TABLE IF NOT EXISTS exercise_equipment (
    exercise_id   BIGINT      NOT NULL,
    equipment_key VARCHAR(30) NOT NULL,
    PRIMARY KEY (exercise_id, equipment_key),
    CONSTRAINT fk_ee_exercise  FOREIGN KEY (exercise_id)   REFERENCES exercises (id)   ON DELETE CASCADE,
    CONSTRAINT fk_ee_equipment FOREIGN KEY (equipment_key) REFERENCES equipment (`key`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Bảng lưu bài tập yêu thích của hội viên
CREATE TABLE IF NOT EXISTS member_favorite_exercises (
    id          BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id   BIGINT   NOT NULL,
    exercise_id BIGINT   NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mfe_member_exercise UNIQUE (member_id, exercise_id),
    CONSTRAINT fk_mfe_member   FOREIGN KEY (member_id)   REFERENCES members (id)   ON DELETE CASCADE,
    CONSTRAINT fk_mfe_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Backfill bảng nối exercise_equipment từ equipment_keys hiện có
INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_key)
SELECT e.id, eq.`key`
FROM exercises e
JOIN equipment eq ON FIND_IN_SET(eq.`key`, REPLACE(e.equipment_keys, ' ', '')) > 0;

-- 6. Cập nhật adjust_guide và common_mistakes cho 17 dụng cụ hiện có
UPDATE equipment SET
    adjust_guide = '1. Nâng hoặc hạ giá đỡ thanh đòn (J-hooks) ngang mức xương đòn khi đứng để dễ lấy tạ ra.\n2. Cài thanh chặn an toàn (safety pins) thấp hơn vị trí sâu nhất của đùi khoảng 3–5 cm.\n3. Luôn lắp bánh tạ đều hai bên và khoá chặt bằng chốt kẹp lò xo/kẹp đòn.',
    common_mistakes = 'Không dùng kẹp khoá tạ khiến bánh tạ trượt lệch; đặt giá đòn quá cao phải nhón chân nhấc tạ; không cài thanh an toàn khi tập nặng mà không có người đỡ.'
WHERE `key` = 'barbell';

UPDATE equipment SET
    adjust_guide = '1. Đối với tạ đơn lắp ghép (adjustable dumbbell): vặn chốt hoặc xoay đĩa số theo vạch cân nặng mong muốn, nghe tiếng click khớp trước khi nhấc.\n2. Chọn mức tạ cho phép kiểm soát hoàn toàn 8–12 lần lặp với form chuẩn.',
    common_mistakes = 'Cổ tay bị bẻ gập ra sau chịu lực thay vì giữ cổ tay thẳng; quăng tạ dùng đà thân trên; thả rơi tạ tự do xuống sàn từ trên cao gây nguy hiểm cho người xung quanh.'
WHERE `key` = 'dumbbell';

UPDATE equipment SET
    adjust_guide = '1. Chọn quả tạ có trọng lượng phù hợp mục tiêu (tập vung hông tạ nặng hơn tập đẩy qua đầu).\n2. Quai tạ phải nhẵn, không có gờ sắc nhọn làm rách chai tay.',
    common_mistakes = 'Dùng lưng dưới cong gập để kéo tạ thay vì phát lực từ khớp hông (hip hinge); để tạ đập mạnh vào cẳng tay khi đưa lên tư thế rack position; gập gối quá sâu biến bài swing thành squat.'
WHERE `key` = 'kettlebell';

UPDATE equipment SET
    adjust_guide = '1. Chọn vị trí uốn cong trên thân đòn phù hợp với góc nghiêng tự nhiên của cổ tay khi cầm ngửa hoặc úp.\n2. Gắn kẹp tạ hai bên chắc chắn tương tự thanh đòn thẳng.',
    common_mistakes = 'Vung lắc khuỷu tay ra trước ra sau khi cuốn tạ; mở rộng khuỷu tay quá xa sườn làm mất lực căng bắp tay; dùng mức tạ quá nặng dẫn đến ưỡn người ra sau.'
WHERE `key` = 'ez-bar';

UPDATE equipment SET
    adjust_guide = '1. Chọn bánh tạ có đường kính và tay cầm phù hợp bài tập.\n2. Khi xếp tạ vào giá đỡ, xếp theo thứ tự từ lớn đến nhỏ để dễ lấy.',
    common_mistakes = 'Cúi lưng gù người khi nhấc bánh tạ nặng từ dưới sàn lên; để ngón tay giữa các bánh tạ khi cất vào cọc gây dập ngón; dùng bánh tạ sai kích thước với lỗ đòn.'
WHERE `key` = 'plate';

UPDATE equipment SET
    adjust_guide = '1. Chỉnh độ cao ghế ngồi sao cho trục xoay của máy (khớp tròn có đánh dấu màu) thẳng hàng với khớp vận động (khớp gối/khớp vai/khớp khuỷu).\n2. Điều chỉnh đệm tì lưng/ngực để cơ thể cố định vững chãi.\n3. Cắm chốt tạ ngập sâu vào khối tạ trước khi đẩy.',
    common_mistakes = 'Để chốt tạ cắm lỏng lẻo dễ bung chốt khi đang tập; không chỉnh ghế khiến quỹ đạo ép sai khớp; để khối tạ rơi tự do va đập rầm rầm ở cuối biên độ.'
WHERE `key` = 'machine';

UPDATE equipment SET
    adjust_guide = '1. Cài chốt chặn an toàn hai bên ray trượt ở mức thấp hơn vị trí sâu nhất của động tác 2–3 cm.\n2. Đặt thanh đòn ở độ cao thuận tiện xoay cổ tay mở ngàm khoá.\n3. Định vị bàn chân hơi nhô về trước để bù lại quỹ đạo trượt thẳng đứng cố định.',
    common_mistakes = 'Quên xoay khoá cổ tay khi gặp sự cố; không cài chốt chặn an toàn; đặt chân quá thụt về sau gây áp lực lớn lên khớp gối khi squat.'
WHERE `key` = 'smith-machine';

UPDATE equipment SET
    adjust_guide = '1. Kéo chốt định vị và trượt ròng rọc lên/xuống độ cao mong muốn (cao - ngang ngực - thấp sát sàn) rồi thả chốt cho ngậm chặt vào lỗ khóa.\n2. Gắn phụ kiện tay cầm phù hợp (thanh thẳng, dây thừng triceps, tay đơn D-handle) vào móc khoá an toàn carabiner.\n3. Kiểm tra chốt chọn tạ đã cắm ngập hoàn toàn.',
    common_mistakes = 'Móc khoá carabiner chưa khoá chặt làm tuột tay cầm khi đang kéo; để dây cáp kéo giật đột ngột thân người; đứng quá gần hoặc quá xa khiến dây cáp cạ vào rãnh ròng rọc.'
WHERE `key` = 'cable';

UPDATE equipment SET
    adjust_guide = '1. Chuẩn bị thảm tập có độ bám tốt, không trơn trượt.\n2. Chọn biến thể phù hợp với sức mạnh (kê cao tay nếu chưa chống đẩy được trên sàn).',
    common_mistakes = 'Để võng lưng dưới khi plank hoặc chống đẩy; nín thở khi gồng sức; không khởi động kỹ các khớp trước khi tập.'
WHERE `key` = 'bodyweight';

UPDATE equipment SET
    adjust_guide = '1. Nếu xà có nhiều nấc tay nắm (rộng, hẹp, song song), chọn kiểu nắm phù hợp nhóm cơ mục tiêu.\n2. Nếu cần trợ lực: gắn dây thun kháng lực vào thanh xà hoặc dùng bục kê chân để bước lên.',
    common_mistakes = 'Dùng đà giật người (kipping) không kiểm soát khi chưa đủ sức mạnh cơ bản; không siết bả vai hạ thấp trước khi kéo làm đau vai; buông thả người rơi tự do ở pha hạ.'
WHERE `key` = 'pullup-bar';

UPDATE equipment SET
    adjust_guide = '1. Nếu xà kép có thể chỉnh độ rộng: thu hẹp (bằng vai) để nhấn tay sau, mở rộng hơn để nhấn ngực dưới.\n2. Điều chỉnh bục bước chân để lên xuống an toàn.',
    common_mistakes = 'Hạ người quá sâu khiến vai bị nhô về trước quá mức gây viêm bao khớp vai; co chân giật gập thân người; khoá khớp khuỷu tay quá mạnh ở đỉnh động tác.'
WHERE `key` = 'dip-bars';

UPDATE equipment SET
    adjust_guide = '1. Máy chạy bộ: gắn kẹp dừng khẩn cấp vào áo; chỉnh độ dốc (incline) và tốc độ từ từ.\n2. Xe đạp tập: chỉnh yên xe ngang tầm xương hông khi đứng cạnh xe, khi đạp bàn chân ở điểm thấp nhất đầu gối vẫn hơi chùng nhẹ 5–10 độ.\n3. Máy chèo thuyền: chỉnh đai cố định bàn chân ngang phần rộng nhất của bàn chân, chọn mức cản gió (damper) 4–6.',
    common_mistakes = 'Nhìn xuống chân hoặc bấm điện thoại khi chạy máy; bước ra khỏi thảm chạy khi thảm chưa dừng hẳn; gù lưng khi chèo thuyền; chỉnh yên xe đạp quá thấp làm đau đầu gối.'
WHERE `key` = 'cardio-machine';

UPDATE equipment SET
    adjust_guide = '1. Kéo chốt an toàn và chỉnh độ nghiêng tựa lưng vào rãnh mong muốn (phẳng 0°, dốc lên 30°/45°, thẳng đứng 75°/90°, dốc xuống -15°).\n2. Chỉnh đệm ngồi hơi dốc lên để tránh bị trượt mông khi đẩy tạ dốc.',
    common_mistakes = 'Chốt định vị chưa gài sâu vào rãnh khoá khiến tựa lưng bị sập khi đang nâng tạ; đặt ghế bấp bênh không phẳng sàn; chỉnh góc dốc quá cao (>60°) biến bài ngực thành bài đẩy vai.'
WHERE `key` = 'bench';

UPDATE equipment SET
    adjust_guide = '1. Chọn dây có dải màu hoặc độ dày tương ứng mức kháng lực (Light/Medium/Heavy).\n2. Kiểm tra neo dây chắc chắn vào cột/xà hoặc giẫm chân vuông góc giữa dây.',
    common_mistakes = 'Kéo dãn dây vượt quá 2.5 lần chiều dài ban đầu làm đứt dây bắn vào người; neo dây vào các góc sắc nhọn gây cứa rách dây; thả lỏng để dây bật ngược trở lại.'
WHERE `key` = 'band';

UPDATE equipment SET
    adjust_guide = '1. Bóng Swiss ball: bơm đủ căng, khi ngồi lên đùi song song với mặt sàn.\n2. Bóng tạ Medicine ball: chọn trọng lượng vừa đủ để thực hiện động tác bộc phát với tốc độ cao.',
    common_mistakes = 'Dùng bóng trên bề mặt có dăm gỗ hoặc vật nhọn; bơm bóng quá non làm mất thăng bằng; ném bóng tạ bật ngược thẳng vào mặt.'
WHERE `key` = 'ball';

UPDATE equipment SET
    adjust_guide = '1. Kiểm tra không gian an toàn xung quanh tối thiểu 2 mét khi dùng dây thừng, con lăn hoặc xe trượt.\n2. Chọn phụ kiện phù hợp thể trạng và trình độ tập.',
    common_mistakes = 'Võng lưng sập bụng khi dùng con lăn ab-wheel; dùng đà giật mạnh thân người khi vung dây thừng chiến đấu.'
WHERE `key` = 'other';

UPDATE equipment SET
    adjust_guide = '1. Đặt con lăn trên thảm phẳng.\n2. Dùng lực tay và chân còn lại để giảm tải áp lực dồn lên con lăn nếu cơ quá căng đau.',
    common_mistakes = 'Lăn trực tiếp lên đốt sống thắt lưng trần hoặc khớp gối; lăn quá nhanh lướt qua các điểm căng cứng; nín thở gồng cứng cơ thể khi gặp điểm đau.'
WHERE `key` = 'foam-roller';

-- 7. Backfill exercise_type và sub_category cho 150 bài tập hiện có
UPDATE exercises SET
    exercise_type = 'CARDIO',
    sub_category = 'CARDIO'
WHERE muscle_group = 'CARDIO' OR goals LIKE '%CARDIO%';

UPDATE exercises SET
    exercise_type = 'WARMUP',
    sub_category = 'DYNAMIC_STRETCH'
WHERE name LIKE '%Foam Roller%' OR name LIKE '%SMR%' OR name LIKE '%giãn cơ%' OR name LIKE '%Giãn cơ%';

-- Cập nhật sub_category cho các bài STRENGTH theo muscle_group
UPDATE exercises SET
    exercise_type = 'STRENGTH',
    sub_category = CASE
        WHEN muscle_group = 'CHEST' THEN 'CHEST'
        WHEN muscle_group = 'BACK' THEN 'BACK'
        WHEN muscle_group = 'SHOULDERS' THEN 'SHOULDERS'
        WHEN muscle_group = 'ARMS' AND (name_en LIKE '%bicep%' OR name LIKE '%tay trước%' OR target_muscles LIKE '%biceps%') THEN 'BICEPS'
        WHEN muscle_group = 'ARMS' THEN 'TRICEPS'
        WHEN muscle_group = 'CORE' THEN 'CORE'
        WHEN muscle_group = 'LEGS' AND (name_en LIKE '%glute%' OR name LIKE '%mông%' OR target_muscles LIKE '%gluteal%') THEN 'GLUTES'
        WHEN muscle_group = 'LEGS' THEN 'LEGS'
        WHEN muscle_group = 'FULL_BODY' THEN 'FULL_BODY'
        ELSE 'OTHER_STRENGTH'
    END
WHERE exercise_type = 'STRENGTH' OR exercise_type IS NULL;

-- 8. Bổ sung các bài tập khởi động (WARMUP) và Cardio (CARDIO) chuẩn hoá còn thiếu
INSERT INTO exercises (
    name, name_en, aliases, exercise_type, sub_category, muscle_group, secondary_muscles, target_muscles,
    equipment, equipment_keys, level, location, goals, primary_goal,
    description, instructions, setup_position, steps, breathing, common_mistakes, safety_notes,
    suggested_dose, sets_reps_hint, image_key, content_origin, review_status
) VALUES
-- Khởi động xoay khớp
('Xoay khớp cổ tay và cổ chân', 'Wrist and Ankle Rotations', 'Xoay cổ tay cổ chân, làm ấm khớp', 'WARMUP', 'JOINT_ROTATION', 'FULL_BODY', 'Cẳng tay, bắp chân', 'forearm,calves',
 'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY',
 'Bài tập xoay khớp cơ bản làm tăng tiết hoạt dịch bôi trơn khớp cổ tay và cổ chân trước khi tập luyện thể hình hoặc chạy bộ.',
 'Đứng thẳng, đan hai tay vào nhau xoay tròn cổ tay nhẹ nhàng kết hợp nhón một mũi chân xoay tròn cổ chân theo chiều kim đồng hồ rồi đổi chiều.',
 'Đứng thẳng người, hai chân mở rộng bằng vai, cơ thể thả lỏng thoải mái.',
 '1. Đan các ngón tay hai bàn tay vào nhau trước ngực.\n2. Nhấc gót chân phải, đặt mũi chân chạm sàn làm trục.\n3. Xoay tròn cổ tay kết hợp xoay cổ chân phải theo chiều kim đồng hồ 10–15 vòng.\n4. Đổi chiều xoay ngược lại 10–15 vòng.\n5. Đổi sang cổ chân trái và thực hiện tương tự.',
 'Hít thở đều đặn và tự nhiên theo nhịp xoay.',
 'Xoay giật cục quá nhanh; dùng lực bẻ khớp quá đà; gồng cứng cổ vai khi xoay.',
 'Không xoay quá mạnh nếu đang có chấn thương cổ chân hoặc viêm gân cổ tay.',
 '2 hiệp, mỗi bên 15–20 vòng mỗi chiều', '15–20 vòng/bên', 'bodyweight', 'SELF_AUTHORED', 'APPROVED'),

('Xoay khớp vai toàn diện', 'Arm and Shoulder Circles', 'Xoay khớp vai, làm nóng vai', 'WARMUP', 'SHOULDER_WARMUP', 'SHOULDERS', 'Ngực trên, cơ lưng trên', 'front-deltoids,back-deltoids,trapezius',
 'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY',
 'Động tác làm nóng ổ khớp bả vai và tăng biên độ chuyển động trước các bài đẩy ngực, đẩy vai hoặc hít xà.',
 'Đứng thẳng, hai tay dang ngang vai xoay tròn từ vòng tròn nhỏ đến lớn về phía trước, sau đó đổi chiều quay về sau.',
 'Đứng thẳng, hai chân mở rộng bằng vai, hai cánh tay dang ngang tạo thành đường thẳng song song với sàn.',
 '1. Bắt đầu vẽ các vòng tròn nhỏ bằng hai cánh tay về phía trước.\n2. Tăng dần đường kính vòng tròn cho đến khi mở hết biên độ khớp vai.\n3. Xoay 15–20 vòng về phía trước.\n4. Đảo ngược chiều xoay từ sau ra trước 15–20 vòng nữa.',
 'Hít sâu khi cánh tay mở rộng ra sau, thở ra nhẹ nhàng khi tay vòng ra trước.',
 'Nhún vai rụt cổ khi xoay; ưỡn cong lưng dưới quá mức; xoay quá nhanh làm mất kiểm soát khớp vai.',
 'Nếu thấy tiếng kêu lạo xạo kèm cảm giác đau nhói ở khớp vai, giảm nhỏ biên độ xoay hoặc dừng lại.',
 '2 hiệp x 15–20 vòng mỗi chiều', '15–20 vòng/chiều', 'bodyweight', 'SELF_AUTHORED', 'APPROVED'),

('Khởi động xoay hông tròn', 'Hip Circles Mobility', 'Xoay hông, mở khớp háng', 'WARMUP', 'HIP_WARMUP', 'LEGS', 'Cơ bụng, cơ lưng dưới', 'gluteal,lower-back,abductors',
 'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY',
 'Kích hoạt khớp háng và giải toả căng cứng vùng thắt lưng chậu trước khi squat, deadlift hoặc chạy bộ.',
 'Hai tay chống hông, đứng hai chân rộng bằng vai, đẩy hông xoay tròn một vòng tròn lớn quanh trục thân người.',
 'Đứng thẳng người, chân mở rộng ngang vai, hai bàn tay chống vào hai bên mào chậu hông.',
 '1. Đẩy hông nhẹ nhàng sang bên phải, rồi đẩy ra trước căng nhẹ đùi trước.\n2. Tiếp tục đẩy hông sang bên trái rồi đẩy mông ra sau căng nhẹ đùi sau.\n3. Hoàn thành một vòng xoay tròn mượt mà.\n4. Lặp lại 10–12 vòng theo chiều kim đồng hồ rồi đổi chiều ngược lại.',
 'Hít thở nhịp nhàng theo chuyển động tròn của hông.',
 'Chỉ lắc đầu gối thay vì xoay khớp háng; cúi gập lưng quá nhiều; xoay giật đột ngột.',
 'Giữ bàn chân tiếp xúc phẳng với sàn suốt quá trình xoay hông.',
 '2 hiệp x 10–12 vòng/chiều', '10–12 vòng/chiều', 'bodyweight', 'SELF_AUTHORED', 'APPROVED'),

('Khởi động khớp đầu gối', 'Knee Rotations Warmup', 'Xoay khớp gối, làm ấm đầu gối', 'WARMUP', 'KNEE_WARMUP', 'LEGS', 'Bắp chân, cơ đùi trước', 'quadriceps,calves',
 'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY',
 'Tăng tiết dịch khớp gối, làm ấm sụn bánh chè và gân cơ tứ đầu trước các bài tập thân dưới.',
 'Đứng chụm hai chân, hơi gập gối, đặt hai bàn tay lên trên đầu gối và xoay tròn nhẹ nhàng hai khớp gối cùng chiều.',
 'Hai chân đứng khép sát, gối hơi chùng nhẹ khoảng 20–30 độ, hai lòng bàn tay đặt nhẹ lên trên đĩa bánh chè gối.',
 '1. Dùng tay dẫn hướng xoay tròn nhẹ nhàng hai đầu gối sang phải, ra trước, sang trái rồi về sau.\n2. Thực hiện 10–15 vòng theo chiều kim đồng hồ.\n3. Đảo chiều xoay ngược chiều kim đồng hồ thêm 10–15 vòng nữa.',
 'Hít thở đều đặn và tự nhiên.',
 'Khép đè hai gối ép mạnh vào nhau; gập gối quá sâu gây áp lực lớn lên sụn khớp; xoay giật cục.',
 'Người từng đứt dây chằng hoặc thoái hoá khớp gối chỉ xoay với biên độ nhỏ nhẹ nhàng.',
 '2 hiệp x 10–15 vòng mỗi chiều', '10–15 vòng/chiều', 'bodyweight', 'SELF_AUTHORED', 'APPROVED'),

('Giãn cơ động ngực và lưng (Dynamic Chest Stretch)', 'Dynamic Chest and Upper Back Stretch', 'Giãn cơ ngực động, mở ngực', 'WARMUP', 'DYNAMIC_STRETCH', 'CHEST', 'Lưng trên, vai trước', 'chest,upper-back,front-deltoids',
 'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY',
 'Động tác vung tay mở ngực và ôm thân động, kéo giãn linh hoạt nhóm cơ ngực lớn và cơ lưng trên.',
 'Đứng thẳng, mở rộng hai cánh tay vung ra sau để căng cơ ngực, sau đó bắt chéo hai tay ôm lấy thân trước ngực.',
 'Đứng thẳng, ngực ưỡn nhẹ, hai cánh tay dang ngang ngực cong nhẹ ở khuỷu tay.',
 '1. Chủ động vung hai tay nhịp nhàng ra sau để cảm nhận cơ ngực được kéo căng vừa phải.\n2. Thu hai tay về phía trước bắt chéo ngang ngực (tay này đè lên tay kia) để kéo căng lưng trên.\n3. Lặp lại liên tục với nhịp độ nhịp nhàng, đổi tay trên dưới sau mỗi lần lặp.',
 'Hít sâu khi vung tay mở ngực, thở dứt khoát khi bắt chéo tay trước ngực.',
 'Gù lưng khi ôm thân; vung tay giật quá mạnh làm căng buốt khớp vai.',
 'Giữ thân người ổn định, không đung đưa lắc lư thân trên.',
 '2 hiệp x 12–15 lần', '12–15 lần', 'bodyweight', 'SELF_AUTHORED', 'APPROVED'),

('Kích hoạt cơ mông với Glute Bridge', 'Glute Bridge Activation', 'Cầu mông kích hoạt, đánh thức cơ mông', 'WARMUP', 'MUSCLE_ACTIVATION', 'LEGS', 'Đùi sau, cơ lõi', 'gluteal,hamstring,abs',
 'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'MOBILITY', 'MOBILITY',
 'Bài tập kích hoạt thần kinh cơ mông (glute activation), khắc phục tình trạng ngủ quên cơ mông trước khi Squat hoặc Deadlift.',
 'Nằm ngửa gập gối, hai bàn chân đặt phẳng trên sàn rộng bằng hông, siết chặt cơ mông đẩy hông thẳng lên cao.',
 'Nằm ngửa trên thảm tập, gập hai đầu gối sao cho gót chân cách mông khoảng 1 gang tay, hai tay để dọc sườn.',
 '1. Siết nhẹ cơ bụng để khoá chặt khung chậu, ấn hai gót chân xuống mặt sàn.\n2. Siết mạnh cơ mông đẩy xương chậu thẳng đứng lên cho đến khi đùi và thân trên tạo thành đường thẳng.\n3. Giữ đỉnh co thắt cơ mông trong 2 giây.\n4. Hạ hông có kiểm soát chạm nhẹ sàn rồi tiếp tục lần lặp tiếp theo.',
 'Thở ra khi đẩy hông lên đỉnh, hít vào khi hạ hông xuống.',
 'Dùng lưng dưới cong ưỡn để đẩy hông thay vì cơ mông; nhấc mũi chân hoặc lệch gối sang hai bên.',
 'Tập trung cảm nhận lực siết 100% từ hai bờ mông.',
 '2–3 hiệp x 12–15 lần, giữ 2s đỉnh', '12–15 lần (giữ 2s)', 'bodyweight', 'SELF_AUTHORED', 'APPROVED'),

('Khởi động toàn thân Jumping Jacks nhẹ', 'Gentle Jumping Jacks', 'Nhảy mở chân tay nhẹ nhàng, làm nóng toàn thân', 'WARMUP', 'FULL_BODY_WARMUP', 'FULL_BODY', 'Bắp chân, vai, đùi', 'calves,front-deltoids,quadriceps',
 'Không dụng cụ', 'bodyweight', 'BEGINNER', 'ANY', 'ENDURANCE', 'ENDURANCE',
 'Động tác bật nhảy làm tăng thân nhiệt nhẹ nhàng, kích thích tuần hoàn máu và nhịp tim sẵn sàng cho buổi tập chính.',
 'Đứng thẳng bật nhảy mở rộng hai chân đồng thời hai tay vung lên qua đầu, sau đó bật nhảy thu chân và hạ tay về vị trí ban đầu.',
 'Đứng thẳng, hai chân khép sát, hai tay để xuôi sát hai bên thân.',
 '1. Hơi chùng gối bật nhảy nhẹ nhàng tách hai chân rộng hơn vai.\n2. Đồng thời vung hai cánh tay theo hình vòng cung lên cao gần chạm nhau trên đầu.\n3. Bật nhảy nhịp thứ hai khép hai chân lại và hạ tay về sát hông.\n4. Thực hiện nhịp nhàng liên tục với nhịp tiếp đất êm ái bằng nửa bàn chân trước.',
 'Hít thở đều đặn theo nhịp nhảy 1-2.',
 'Tiếp đất mạnh bằng cả gót chân gây chấn động khớp gối; nín thở khi nhảy.',
 'Người đau khớp gối có thể thay bằng động tác bước chân sang bên (Step Jacks) không nhảy.',
 '2 hiệp x 30–45 giây', '30–45 giây', 'bodyweight', 'SELF_AUTHORED', 'APPROVED'),

-- Bài tập Cardio
('Chạy bộ trên máy chạy (Treadmill Running)', 'Treadmill Running Cardio', 'Chạy máy, chạy bộ tim mạch', 'CARDIO', 'RUNNING', 'CARDIO', 'Đùi trước, đùi sau, bắp chân, cơ mông', 'quadriceps,hamstring,calves,gluteal',
 'Máy chạy bộ', 'cardio-machine', 'BEGINNER', 'GYM', 'FAT_LOSS', 'FAT_LOSS',
 'Bài tập cardio chạy bộ rèn luyện sức bền tim phổi, tăng cường trao đổi chất và đốt cháy calo hiệu quả.',
 'Chạy bộ đều đặn trên thảm chạy máy với tốc độ và độ dốc được cài đặt phù hợp với thể lực.',
 'Đứng trên thành hai bên thảm chạy, kẹp khoá an toàn vào vạt áo. Khởi động máy ở tốc độ đi bộ 3–4 km/h.',
 '1. Bước vào thảm chạy đi bộ làm quen trong 2 phút.\n2. Tăng dần tốc độ lên mức chạy bền mong muốn (ví dụ 7.5–9.5 km/h) và chỉnh độ dốc 1–2% để bù cản gió.\n3. Duy trì dáng chạy thẳng người, tiếp đất bằng nửa trước bàn chân, vung tay nhịp nhàng 90 độ.\n4. Khi kết thúc, giảm dần tốc độ về 3.5 km/h đi bộ thả lỏng 2–3 phút trước khi dừng máy.',
 'Hít sâu 2 bước chạy bằng mũi và thở ra 2 bước qua miệng đều đặn.',
 'Cầm vào thanh vịn tay khi đang chạy; bước chân quá dài cắm gót (overstriding); nhìn xuống chân gây mỏi cổ.',
 'Luôn kẹp dây khoá từ an toàn để máy tự ngắt nếu chẳng may vấp ngã.',
 '20–30 phút chạy liên tục ở vùng nhịp tim Zone 2/3', '20–30 phút', 'cardio-machine', 'SELF_AUTHORED', 'APPROVED'),

('Đi bộ dốc đốt mỡ (Incline Walking)', 'Incline Treadmill Walking', 'Đi bộ leo dốc, đi bộ dốc LISS', 'CARDIO', 'WALKING', 'CARDIO', 'Bắp chân, đùi sau, cơ mông', 'calves,hamstring,gluteal',
 'Máy chạy bộ', 'cardio-machine', 'BEGINNER', 'GYM', 'FAT_LOSS', 'FAT_LOSS',
 'Phương pháp cardio cường độ thấp bền vững (LISS), tối ưu đốt mỡ thừa mà không gây áp lực lớn lên khớp gối.',
 'Cài đặt máy chạy bộ ở độ dốc cao (8–12%) và tốc độ đi bộ nhanh (4.5–5.5 km/h), đi bộ vững chắc không bám tay vịn.',
 'Kẹp khoá an toàn vào áo, đứng trên thảm chạy và bấm khởi động máy.',
 '1. Bắt đầu với độ dốc 0% tốc độ 4 km/h trong 2 phút.\n2. Nâng độ dốc lên mức 8–12% và chỉnh tốc độ 4.5–5.2 km/h.\n3. Bước từng bước chắc chắn, hơi ngả nhẹ thân trên về trước ăn khớp độ dốc, vung tay tự nhiên.\n4. Giữ nhịp tim ở ngưỡng 60–70% nhịp tim tối đa.',
 'Hít thở sâu nhịp nhàng qua mũi và miệng.',
 'Bám chặt hai tay vào bảng điều khiển kéo người về sau làm triệt tiêu tác dụng của độ dốc; sải chân quá dài.',
 'Tập trung chú ý bước chân để không bị trượt lùi ra sau thảm.',
 '25–40 phút mỗi buổi', '25–40 phút', 'cardio-machine', 'SELF_AUTHORED', 'APPROVED'),

('Đạp xe thể lực (Stationary Cycling)', 'Stationary Cycling Cardio', 'Đạp xe trong nhà, xe đạp thể lực', 'CARDIO', 'CYCLING', 'CARDIO', 'Đùi trước, đùi sau, bắp chân', 'quadriceps,hamstring,calves',
 'Xe đạp tập', 'cardio-machine', 'BEGINNER', 'GYM', 'ENDURANCE', 'ENDURANCE',
 'Bài tập tim mạch an toàn tuyệt đối cho khớp gối, tăng cường tuần hoàn chi dưới và đốt cháy mỡ thừa.',
 'Ngồi đạp xe với nhịp guồng chân đều đặn (80–90 RPM), điều chỉnh lực kháng lực theo mục tiêu.',
 'Chỉnh yên xe ngang tầm mào chậu hông khi đứng cạnh xe. Ngồi lên xe, xỏ chân vào đai bàn đạp.',
 '1. Bắt đầu đạp nhẹ nhàng với kháng lực cấp độ 2–3 trong 3 phút.\n2. Tăng kháng lực lên mức 5–8 và duy trì nhịp đạp ổn định 75–85 vòng/phút.\n3. Thân người giữ thẳng hoặc hơi nghiêng về trước, hai vai thả lỏng, không gồng cứng khuỷu tay.\n4. Giảm kháng lực đạp chậm thả lỏng 2 phút cuối.',
 'Duy trì nhịp thở sâu và đều đặn theo nhịp guồng chân.',
 'Chỉnh yên xe quá thấp khiến đầu gối gập gắt gây đau sụn bánh chè; nhấc mông nảy tưng tưng trên yên xe.',
 'Không khoá cứng khớp gối khi chân duỗi ở điểm thấp nhất.',
 '20–35 phút', '20–35 phút', 'cardio-machine', 'SELF_AUTHORED', 'APPROVED'),

('Nhảy dây nhịp điệu (Jump Rope Cardio)', 'Jump Rope Training', 'Nhảy dây thể lực, nhảy dây cardio', 'CARDIO', 'JUMP_ROPE', 'CARDIO', 'Bắp chân, cơ cẳng tay, cơ đùi', 'calves,forearm,quadriceps',
 'Dây kháng lực', 'band', 'INTERMEDIATE', 'ANY', 'FAT_LOSS', 'FAT_LOSS',
 'Bài tập cardio rèn luyện phản xạ, sự khéo léo, độ săn chắc bắp chân và đốt cháy lượng calo vượt trội.',
 'Cầm hai đầu dây nhảy, xoay cổ tay điều khiển dây quay dưới chân và bật nhảy bằng nửa bàn chân trước.',
 'Đo độ dài dây: giẫm một chân vào giữa dây, kéo hai đầu tay cầm lên ngang ngực là vừa chuẩn.',
 '1. Đứng thẳng, hai khuỷu tay khép sát sườn, hai bàn tay ngang hông.\n2. Dùng lực xoay chủ yếu từ cổ tay để vung dây thành vòng cung mượt mà.\n3. Bật nhảy nhẹ nhàng cách mặt sàn chỉ khoảng 2–3 cm vừa đủ cho dây luồn qua.\n4. Tiếp đất êm bằng mũi bàn chân, gối hơi chùng nhẹ hấp thụ phản lực.',
 'Hít thở đều đặn theo từng chu kỳ 2–3 nhịp nhảy.',
 'Nhảy quá cao tốn sức; vung cả cánh tay và bả vai thay vì dùng cổ tay; tiếp đất bằng gót chân.',
 'Chọn sàn gỗ hoặc thảm tập có độ đàn hồi, không nhảy dây trực tiếp trên nền bê tông cứng không có giày.',
 '3–5 hiệp x 2–3 phút nhảy, nghỉ 60s giữa hiệp', '2–3 phút/hiệp', 'bodyweight', 'SELF_AUTHORED', 'APPROVED'),

('Chèo thuyền trên máy (Rowing Machine)', 'Rowing Machine Cardio', 'Kéo máy chèo thuyền, cardio toàn thân', 'CARDIO', 'ROWING', 'CARDIO', 'Lưng trên, đùi trước, đùi sau, cơ lõi', 'upper-back,quadriceps,hamstring,abs',
 'Máy tập tim mạch', 'cardio-machine', 'INTERMEDIATE', 'GYM', 'ENDURANCE', 'ENDURANCE',
 'Cardio toàn thân huy động hơn 85% các nhóm cơ trên cơ thể, kết hợp hoàn hảo giữa sức mạnh và sức bền tim mạch.',
 'Thực hiện chu kỳ chèo thuyền: Đạp chân $\\rightarrow$ Ngả lưng $\\rightarrow$ Kéo tay, sau đó đảo ngược nhả tay $\\rightarrow$ Gập thân $\\rightarrow$ Co chân.',
 'Ngồi lên ghế trượt, đặt chân vào bàn đạp thắt chặt đai giữ. Chỉnh mức cản gió damper ở mức 4–6.',
 '1. Tư thế Catch: Co gối trượt về trước, hai tay duỗi cầm chắc thanh kéo, lưng thẳng.\n2. Pha Drive: Đạp mạnh hai gót chân duỗi đùi (60% lực), hơi ngả nhẹ lưng về góc 11 giờ (20% lực), kéo thanh nắm về sát dưới xương ức (20% lực).\n3. Pha Finish: Giữ chân duỗi, khuỷu tay kéo ra sau, ngực mở.\n4. Pha Recovery: Duỗi thẳng tay $\\rightarrow$ gập hông về góc 1 giờ $\\rightarrow$ co gối trượt nhẹ nhàng về vị trí ban đầu.',
 'Thở ra dứt khoát khi đạp chân kéo tay về sau, hít sâu khi trượt người về trước.',
 'Kéo tay trước khi đạp chân; gù cong cột sống lưng; kéo thanh tạ lên quá cao ngang cổ họng.',
 'Luôn giữ thẳng lưng và siết cơ bụng suốt hành trình kéo.',
 '15–25 phút hoặc 4–5 hiệp x 500m', '15–25 phút', 'cardio-machine', 'SELF_AUTHORED', 'APPROVED'),

('Máy tập leo thang (Stair Climber)', 'Stair Climber Cardio', 'Leo cầu thang máy, cardio mông đùi', 'CARDIO', 'STAIR_CLIMBER', 'CARDIO', 'Cơ mông, đùi trước, bắp chân', 'gluteal,quadriceps,calves',
 'Máy tập tim mạch', 'cardio-machine', 'INTERMEDIATE', 'GYM', 'FAT_LOSS', 'FAT_LOSS',
 'Thiết bị mô phỏng leo bậc thang liên tục, kích hoạt tối đa cơ mông và đùi sau, đốt mỡ cường độ cao.',
 'Bước đều đặn từng bậc thang liên tục trên máy, giữ thân người cân bằng và lưng thẳng tự nhiên.',
 'Bấm khởi động máy ở tốc độ chậm (Level 3–4), đặt hai bàn chân trọn vẹn lên các bậc thang.',
 '1. Bước từng bước nhịp nhàng, đạp dồn trọng tâm qua gót chân để nhấn vào cơ mông.\n2. Hai tay thả lỏng nhẹ hoặc đặt hờ lên thanh vịn chỉ để giữ thăng bằng, không tì dồn lực tay.\n3. Nâng dần tốc độ lên mức Level 6–9 tùy thể lực.\n4. Duy trì lưng thẳng, không cúi gục đầu hoặc gù lưng.',
 'Duy trì nhịp thở sâu và đều đặn theo từng bước leo.',
 'Tì đè toàn bộ trọng lượng lên tay vịn để đỡ mỏi chân; bước nhón bằng đầu ngón chân; sải bước bỏ bậc khi chưa vững.',
 'Nếu thấy mệt mỏi đuối sức, bấm nút Stop giảm tốc độ từ từ, không nhảy vội ra khỏi máy.',
 '15–25 phút', '15–25 phút', 'cardio-machine', 'SELF_AUTHORED', 'APPROVED'),

('HIIT Burpees & Mountain Climbers', 'HIIT Bodyweight Circuit', 'HIIT đốt mỡ toàn thân, cardio ngắt quãng', 'CARDIO', 'HIIT', 'CARDIO', 'Toàn thân, cơ lõi, tim mạch', 'abs,quadriceps,chest,front-deltoids',
 'Không dụng cụ', 'bodyweight', 'ADVANCED', 'ANY', 'FAT_LOSS', 'FAT_LOSS',
 'Tổ hợp cardio cường độ cao ngắt quãng (HIIT) không dụng cụ, kích hoạt hiệu ứng đốt calo sau tập (EPOC) mạnh mẽ.',
 'Thực hiện luân phiên 40 giây bộc phát tối đa giữa Burpees và Mountain Climbers, xen kẽ 20 giây nghỉ chủ động.',
 'Chuẩn bị thảm tập trên sàn thông thoáng, đi giày thể thao có độ bám tốt.',
 '1. 40 giây Burpees: Đứng thẳng $\\rightarrow$ Ngồi xổm chống tay $\\rightarrow$ Bật chân ra sau vào tư thế plank $\\rightarrow$ Chống đẩy 1 nhịp $\\rightarrow$ Bật chân về trước $\\rightarrow$ Bật nhảy cao lên vỗ tay qua đầu.\n2. Nghỉ 20 giây đi lại hít thở sâu.\n3. 40 giây Mountain Climbers: Chống tay tư thế plank cao $\\rightarrow$ Chạy kéo luân phiên gối về sát ngực với tốc độ nhanh nhất có thể.\n4. Nghỉ 20 giây. Lặp lại chu kỳ 4–6 vòng.',
 'Thở mạnh bằng miệng khi bung lực, hít sâu bằng mũi trong 20 giây nghỉ.',
 'Võng lưng dưới khi bật chân ra sau trong burpee; nhổm mông quá cao khi leo núi; nín thở.',
 'Người có tiền sử huyết áp cao hoặc bệnh tim mạch không nên tập bài này ở cường độ tối đa.',
 '4–6 vòng (tổng thời gian 12–18 phút)', '40s tập / 20s nghỉ x 4–6 vòng', 'bodyweight', 'SELF_AUTHORED', 'APPROVED')
ON DUPLICATE KEY UPDATE
    name_en = VALUES(name_en),
    exercise_type = VALUES(exercise_type),
    sub_category = VALUES(sub_category);

-- 9. Xuất bản các bài viết hướng dẫn tập luyện kỹ thuật vào danh mục bài viết
UPDATE articles SET
    status = 'PUBLISHED',
    published_at = NOW()
WHERE slug IN (
    'cach-dung-may-tap',
    'chon-muc-ta',
    'chon-so-hiep-va-so-lan',
    'nghi-giua-hiep',
    'loi-hay-gap-nguoi-moi',
    'khoi-dong-truoc-tap',
    'gian-co-sau-tap',
    'phong-chan-thuong-khi-chay'
);

-- Đồng bộ lại exercise_equipment sau khi bổ sung bài mới
INSERT IGNORE INTO exercise_equipment (exercise_id, equipment_key)
SELECT e.id, eq.`key`
FROM exercises e
JOIN equipment eq ON FIND_IN_SET(eq.`key`, REPLACE(e.equipment_keys, ' ', '')) > 0;
