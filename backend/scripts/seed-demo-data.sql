-- =====================================================================
-- GymFlow · Làm đẹp toàn diện dữ liệu mẫu cho Demo & Thuyết trình
-- 1. Dọn dẹp tài khoản rác (xoá nick test híhi@gmail.com)
-- 2. Chuẩn hoá SĐT, tiểu sử và mật khẩu cho 9 HLV & 12 Hội viên
-- 3. Diễn đàn thảo luận (5 chủ đề hấp dẫn, trao đổi chuyên môn, nhiều bình luận)
-- 4. Tin nhắn tư vấn thể hình & chăm sóc hội viên thực tế
-- 5. Lịch sử Check-in tại quầy 28 ngày qua & hôm nay (chuẩn biểu đồ giờ cao điểm)
-- 6. Đơn đăng ký gói tập & nâng cấp thực tế
-- 7. Kích hoạt bảng V55: Huy hiệu hội viên & Nhật ký Email
-- =====================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. DỌN DẸP TÀI KHOẢN RÁC
-- ---------------------------------------------------------------------
DELETE FROM members WHERE code = 'HV00013' OR user_id = 21;
DELETE FROM users WHERE email = 'híhi@gmail.com' OR id = 21;

-- ---------------------------------------------------------------------
-- 2. CHUẨN HOÁ THÔNG TIN HỘI VIÊN (12 hội viên chính thức)
-- ---------------------------------------------------------------------
UPDATE users SET phone = '0912345678' WHERE email = 'member@gymflow.vn';
UPDATE users SET phone = '0988765432' WHERE email = 'member2@gymflow.vn';
UPDATE users SET phone = '0905123987' WHERE email = 'member3@gymflow.vn';
UPDATE users SET phone = '0934567890' WHERE email = 'member4@gymflow.vn';
UPDATE users SET phone = '0979888123' WHERE email = 'member5@gymflow.vn';
UPDATE users SET phone = '0945678901' WHERE email = 'member6@gymflow.vn';
UPDATE users SET phone = '0962112233' WHERE email = 'member7@gymflow.vn';
UPDATE users SET phone = '0983456789' WHERE email = 'member8@gymflow.vn';
UPDATE users SET phone = '0916789012' WHERE email = 'member9@gymflow.vn';
UPDATE users SET phone = '0908999888' WHERE email = 'member10@gymflow.vn';
UPDATE users SET phone = '0973222333' WHERE email = 'member11@gymflow.vn';
UPDATE users SET phone = '0938444555' WHERE email = 'member12@gymflow.vn';

-- ---------------------------------------------------------------------
-- 3. CHUẨN HOÁ THÔNG TIN HUẤN LUYỆN VIÊN (9 HLV)
-- ---------------------------------------------------------------------
SET @trainer_pwd := (SELECT password_hash FROM users WHERE email = 'trainer@gymflow.vn');

UPDATE users SET phone = '0902111222' WHERE email = 'trainer@gymflow.vn';
UPDATE users SET phone = '0902333444' WHERE email = 'trainer2@gymflow.vn';
UPDATE users SET phone = '0902555666' WHERE email = 'trainer3@gymflow.vn';

UPDATE users SET phone = '0903667788', password_hash = @trainer_pwd WHERE email = 'hlv.minhquan@gymflow.io.vn';
UPDATE users SET phone = '0903889900', password_hash = @trainer_pwd WHERE email = 'hlv.thuha@gymflow.io.vn';
UPDATE users SET phone = '0904123789', password_hash = @trainer_pwd WHERE email = 'hlv.quocbao@gymflow.io.vn';
UPDATE users SET phone = '0904345890', password_hash = @trainer_pwd WHERE email = 'hlv.ngoclan@gymflow.io.vn';
UPDATE users SET phone = '0905567901', password_hash = @trainer_pwd WHERE email = 'hlv.ducanh@gymflow.io.vn';
UPDATE users SET phone = '0905789012', password_hash = @trainer_pwd WHERE email = 'hlv.mailinh@gymflow.io.vn';

-- ---------------------------------------------------------------------
-- 4. TIN NHẮN TƯ VẤN THỂ HÌNH & CHĂM SÓC HỘI VIÊN
-- ---------------------------------------------------------------------
-- Xoá tin nhắn cũ đơn điệu
DELETE FROM messages WHERE body IN ('hi', 'sao ạ', 'kcg', ',..');

-- Đảm bảo có các cuộc trò chuyện cần thiết
SET @m1_uid := (SELECT id FROM users WHERE email = 'member@gymflow.vn');
SET @m2_uid := (SELECT id FROM users WHERE email = 'member2@gymflow.vn');
SET @m3_uid := (SELECT id FROM users WHERE email = 'member3@gymflow.vn');

SET @t1_uid := (SELECT id FROM users WHERE email = 'trainer@gymflow.vn');
SET @t2_uid := (SELECT id FROM users WHERE email = 'trainer2@gymflow.vn');
SET @t3_uid := (SELECT id FROM users WHERE email = 'trainer3@gymflow.vn');

SET @t1_id := (SELECT id FROM trainers WHERE user_id = @t1_uid);
SET @t2_id := (SELECT id FROM trainers WHERE user_id = @t2_uid);
SET @t3_id := (SELECT id FROM trainers WHERE user_id = @t3_uid);

-- Conversation giữa Member 1 (Minh Anh) và HLV 1 (Lê Hoàng Phúc)
INSERT INTO conversations (id, member_id, trainer_id, created_at, updated_at, last_message_at)
VALUES (2, 1, @t1_id, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW(), last_message_at = NOW();

INSERT INTO messages (conversation_id, sender_user_id, sender_role, kind, body, created_at, read_at) VALUES
(2, @m1_uid, 'MEMBER', 'TEXT', 'Chào anh Phúc! Buổi tập tạ hôm qua em thấy cơ đùi sau hơi căng một chút, như vậy có bình thường không anh?', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, @t1_uid, 'TRAINER', 'TEXT', 'Chào Minh Anh! Hoàn toàn bình thường em nhé. Hôm qua em nâng mức tạ bài Romanian Deadlift lên 35kg nên cơ đang thích nghi (hiện tượng DOMS). Tối nay em nhớ ngâm chân nước ấm và giãn cơ nhẹ nhàng 10 phút nha.', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 15 MINUTE, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 20 MINUTE),
(2, @m1_uid, 'MEMBER', 'TEXT', 'Dạ vâng anh, em làm theo thấy đỡ nhiều rồi ạ. Chiều mai mấy giờ em qua tập buổi tiếp theo được anh nhỉ?', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, @t1_uid, 'TRAINER', 'TEXT', 'Lịch của em chiều mai là 17h00 buổi Upper Body (ngực - lưng) nhé. Em nhớ ăn nhẹ một quả chuối hoặc lát bánh mì đen trước khi tập 45 phút để có năng lượng nha!', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 MINUTE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 15 MINUTE),
(2, @m1_uid, 'MEMBER', 'TEXT', 'Dạ vâng em cảm ơn anh, hẹn gặp anh chiều mai 17h ạ! Em sẽ đến đúng giờ.', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 18 MINUTE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 25 MINUTE),
(2, @t1_uid, 'TRAINER', 'TEXT', 'Hôm nay em tập bài Lat Pulldown rất tốt, lưng vào form chuẩn. Về nhà nhớ ăn đủ đạm bữa tối nhé! 💪', DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(2, @m1_uid, 'MEMBER', 'TEXT', 'Dạ em vừa ăn ức gà và salad xong rồi anh ạ. Cảm ơn anh đã chỉnh form kỹ cho em!', DATE_SUB(NOW(), INTERVAL 3 HOUR), NOW());

-- Conversation giữa Member 1 (Minh Anh) và HLV 2 (Nguyễn Thảo Vy - Yoga & Mobility)
INSERT INTO conversations (id, member_id, trainer_id, created_at, updated_at, last_message_at)
VALUES (1, 1, @t2_id, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW(), last_message_at = NOW();

INSERT INTO messages (conversation_id, sender_user_id, sender_role, kind, body, created_at, read_at) VALUES
(1, @m1_uid, 'MEMBER', 'TEXT', 'Chào chị Vy, bài tập giãn cơ lưng Cat-Cow hôm trước chị hướng dẫn em thấy đỡ mỏi hẳn khi ngồi làm việc lâu ở văn phòng ạ.', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, @t2_uid, 'TRAINER', 'TEXT', 'Chào em! Chị rất mừng vì em thấy cải thiện. Em nhớ duy trì 10 nhịp thở sâu mỗi tối trước khi ngủ nhé, giữ lưng uốn nhẹ nhàng tự nhiên.', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 20 MINUTE, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 25 MINUTE),
(1, @m1_uid, 'MEMBER', 'TEXT', 'Dạ vâng chị, tối nay em lại tập tiếp. Chiều thứ 6 em qua lớp Mobility của chị nhé!', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, @t2_uid, 'TRAINER', 'TEXT', 'Okie Minh Anh, hẹn gặp em chiều thứ 6 nhé! 🌸', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 12 MINUTE, NOW());

-- Conversation giữa Member 2 (Trần Quốc Bảo) và HLV 3 (Trần Đức Mạnh - Sức mạnh & Powerlifting)
INSERT INTO conversations (member_id, trainer_id, created_at, updated_at, last_message_at)
SELECT 2, @t3_id, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM conversations WHERE member_id = 2 AND trainer_id = @t3_id);

SET @c3_id := (SELECT id FROM conversations WHERE member_id = 2 AND trainer_id = @t3_id LIMIT 1);

INSERT INTO messages (conversation_id, sender_user_id, sender_role, kind, body, created_at, read_at) VALUES
(@c3_id, @m2_uid, 'MEMBER', 'TEXT', 'Anh Mạnh ơi, mức tạ Deadlift hôm nay em kéo 100kg thấy form lưng khá thẳng, không bị mỏi thắt lưng nữa rồi.', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@c3_id, @t3_uid, 'TRAINER', 'TEXT', 'Tốt lắm Bảo! Anh xem lại clip góc nghiêng của em, đường đi thanh đòn sát cẳng chân rất chuẩn. Tuần tới mình sẽ duy trì mức này thêm 1 tuần để củng cố độ ổn định rồi mới tăng tiếp nhé.', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 15 MINUTE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 20 MINUTE),
(@c3_id, @m2_uid, 'MEMBER', 'TEXT', 'Dạ nhất trí anh, cảm ơn anh đã chỉnh form kỹ cho em!', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 25 MINUTE, NOW()),
(@c3_id, @t3_uid, 'TRAINER', 'TEXT', 'Nghỉ ngơi ăn uống đủ đạm hôm nay nhé, buổi sau ta tiếp tục chinh phục bài Squat! 🔥', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- ---------------------------------------------------------------------
-- 5. DIỄN ĐÀN THẢO LUẬN (FORUM TOPICS & REPLIES)
-- ---------------------------------------------------------------------
-- Xoá các topic mẫu cũ ngoại trừ bài ghim nội quy
DELETE FROM forum_replies WHERE topic_id > 1;
DELETE FROM forum_topics WHERE id > 1;

-- Topic 2: TRAINING (Push - Pull - Legs)
INSERT INTO forum_topics (id, author_id, title, title_en, category, body, body_en, pinned, locked, hidden, reply_count, last_activity_at, created_at)
VALUES (2, @t1_uid, 
'Lịch tập Push - Pull - Legs 3 buổi/tuần cho người bận rộn',
'3-day Push-Pull-Legs routine for busy professionals',
'TRAINING',
'Chào cả nhà! Đối với những bạn làm văn phòng hoặc bận rộn chỉ sắp xếp được 3 buổi/tuần, lịch Push - Pull - Legs là sự lựa chọn tối ưu nhất để phát triển toàn diện cơ bắp mà vẫn đảm bảo thời gian phục hồi.\n\n### Phân bổ gợi ý:\n- **Thứ 2 (Push - Đẩy):** Bench Press (Ngực), Incline Dumbbell Press, Overhead Press (Vai), Triceps Pushdown (Tay sau).\n- **Thứ 4 (Pull - Kéo):** Lat Pulldown (Lưng xô), Seated Cable Row, Face Pull (Vai sau), Barbell Curl (Tay trước).\n- **Thứ 6 (Legs & Core - Chân & Bụng):** Back Squat, Romanian Deadlift, Walking Lunge, Plank.\n\n*Lưu ý:* Luôn khởi động kỹ 10 phút trước khi vào bài chính và duy trì mức tạ tăng tiến đều đặn (Progressive Overload). Chúc cả nhà tập luyện hiệu quả!',
'Hi everyone! For busy professionals who can only manage 3 gym sessions per week, the Push-Pull-Legs split is the most optimal choice for full-body development with adequate recovery.\n\n- Mon (Push): Chest, Shoulders, Triceps\n- Wed (Pull): Back, Rear Delts, Biceps\n- Fri (Legs & Core): Quads, Hamstrings, Abs\n\nAlways warm up properly and focus on progressive overload!',
0, 0, 0, 3, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 3 DAY));

INSERT INTO forum_replies (topic_id, author_id, body, created_at) VALUES
(2, @m1_uid, 'Em theo lịch này của anh Phúc được 2 tuần thấy cơ lưng xô cải thiện rõ rệt, không bị quá tải hay mệt mỏi ngày hôm sau!', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, @t3_uid, 'Lịch này rất tối ưu cho người mới đến trung cấp. Mọi người chú ý kiểm soát pha hạ tạ (eccentric) từ 2-3 giây để tối đa kích thích cơ bắp nhé.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, (SELECT id FROM users WHERE email = 'member6@gymflow.vn'), 'Phòng GymFlow trang bị đầy đủ máy kéo xô và cáp nên tập buổi Pull cực kỳ đã!', DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- Topic 3: TRAINING (Khắc phục lỗi Squat)
INSERT INTO forum_topics (id, author_id, title, title_en, category, body, body_en, pinned, locked, hidden, reply_count, last_activity_at, created_at)
VALUES (3, @m2_uid,
'Khắc phục lỗi võng lưng và mất thăng bằng khi Squat',
'Fixing lower back arch and balance issues during Squats',
'TRAINING',
'Chào mọi người và các HLV, khi em squat xuống sâu ngang đùi thường hay bị nhấc nhẹ gót chân và cảm giác lưng dưới hơi mỏi. Em có quay video thì thấy lưng bị uốn nhẹ ở điểm thấp nhất. Có phải do cổ chân cứng hay cơ mông yếu không ạ? Mọi người có bài tập bổ trợ nào chia sẻ giúp em với ạ.',
'Hi everyone! When squatting to parallel, my heels slightly lift and my lower back feels tight. Is this due to ankle mobility or weak glutes? Any accessory drills recommended?',
0, 0, 0, 2, DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO forum_replies (topic_id, author_id, body, created_at) VALUES
(3, @t1_uid, 'Chào Bảo! Hiện tượng nhấc gót thường do độ linh hoạt cổ chân (dorsiflexion) bị hạn chế. Em nên tập thêm các bài giãn bắp chân và mobility mắt cá chân trước buổi tập. Đồng thời tập thói quen hít sâu gồng cơ bụng (ValSalva maneuver) để khoá chặt cột sống nhé.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, (SELECT id FROM users WHERE email = 'hlv.ducanh@gymflow.io.vn'), 'Em có thể kê thử 2 miếng tạ 1.25kg dưới gót chân tạm thời và chuyển sang tập bài Goblet Squat với tạ đơn trước để cảm nhận trọng tâm rơi đúng giữa bàn chân nhé.', DATE_SUB(NOW(), INTERVAL 5 HOUR));

-- Topic 4: NUTRITION (Thực đơn giảm mỡ khẩu phần Việt)
INSERT INTO forum_topics (id, author_id, title, title_en, category, body, body_en, pinned, locked, hidden, reply_count, last_activity_at, created_at)
VALUES (4, (SELECT id FROM users WHERE email = 'hlv.mailinh@gymflow.io.vn'),
'Thực đơn mẫu 1,800 kcal giảm mỡ dễ làm theo khẩu phần Việt',
'Sample 1,800 kcal fat loss meal plan with Vietnamese dishes',
'NUTRITION',
'Giảm mỡ không nhất thiết phải ăn ức gà luộc nhạt nhẽo mỗi ngày! Dưới đây là thực đơn mẫu ~1,800 kcal (Protein: 135g, Carb: 190g, Fat: 45g) phù hợp với người Việt:\n\n- **Bữa sáng:** 1 tô phở gà bỏ da ít bánh (hoặc 2 lát bánh mì đen + 2 trứng ốp la) + 1 ly cà phê đen không đường.\n- **Bữa trưa:** 1 chén cơm gạo lứt (150g) + 150g ức gà xào nấm/ớt chuông với dầu oliu + 1 đĩa rau luộc to.\n- **Bữa phụ (15h30):** 1 quả táo hoặc chuối + 1 hộp sữa chua không đường.\n- **Bữa tối:** 150g cá hấp xì dầu hoặc tôm rim nhạt + canh rau củ nấu thịt băm + nửa chén cơm.\n\n*Nguyên tắc vàng:* Uống đủ 2 - 2.5 lít nước mỗi ngày và ngủ trước 23h để hạn chế cảm giác thèm ăn vặt.',
'Fat loss doesn’t mean bland boiled chicken every day! Here is a balanced 1,800 kcal meal plan tailored to Vietnamese cuisine with 135g protein.',
0, 0, 0, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY));

INSERT INTO forum_replies (topic_id, author_id, body, created_at) VALUES
(4, @m3_uid, 'Cảm ơn coach Linh! Thực đơn này rất dễ nấu mang đi làm, tuần rồi em giảm được 0.5kg mỡ mà người vẫn nhiều năng lượng, không bị cồn cào ruột.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, (SELECT id FROM users WHERE email = 'member7@gymflow.vn'), 'Cho em hỏi nếu thay cá hấp bằng đậu phụ hoặc trứng thì tính lượng protein thế nào để đủ định mức ạ?', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Topic 5: RECOVERY (Giảm đau DOMS sau ngày chân)
INSERT INTO forum_topics (id, author_id, title, title_en, category, body, body_en, pinned, locked, hidden, reply_count, last_activity_at, created_at)
VALUES (5, (SELECT id FROM users WHERE email = 'member5@gymflow.vn'),
'Bí quyết giảm đau nhức cơ bắp (DOMS) sau ngày tập Chân (Leg Day)',
'Tips to relieve DOMS soreness after Leg Day',
'RECOVERY',
'Chào cả nhà, mỗi lần tập chân xong là 2 ngày tiếp theo em bước cầu thang rất cực vì đùi trước và mông căng cứng. Ngoài việc nghỉ ngơi thì mọi người có mẹo nào giúp cơ bớt nhức và nhanh hồi lại không ạ?',
'Hi everyone, after leg days, descending stairs is quite challenging for 2 days. Apart from rest, any practical tips to relieve DOMS?',
0, 0, 0, 2, DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO forum_replies (topic_id, author_id, body, created_at) VALUES
(5, @t2_uid, 'Chào Linh! Sau buổi tập chân, em dành 10 phút dùng con lăn bọt (foam roller) lăn nhẹ đùi và bắp chuối, tối về tắm nước ấm. Hôm sau nên đi bộ nhẹ nhàng 20 phút (Active Recovery) để tăng tuần hoàn máu đẩy acid lactic ra ngoài nhé.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, (SELECT id FROM users WHERE email = 'member11@gymflow.vn'), 'Mình hay uống bổ sung thêm Magie và nước dừa sau tập, thấy cơ bắp thư giãn nhanh và ngủ ngon hơn hẳn đấy!', DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- Topic 6: GYM (Giờ tập lý tưởng tại GymFlow)
INSERT INTO forum_topics (id, author_id, title, title_en, category, body, body_en, pinned, locked, hidden, reply_count, last_activity_at, created_at)
VALUES (6, 1,
'Kinh nghiệm chọn khung giờ tập vắng và tiện nghi tại GymFlow',
'Best times to work out smoothly at GymFlow',
'GYM',
'Chào quý hội viên! Để buổi tập của các bạn đạt hiệu quả cao nhất mà không phải chờ đợi máy tập, ban quản lý xin chia sẻ biểu đồ mật độ phòng tập:\n\n- **Khung giờ vàng (Rất vắng & Thoải mái):** 09:00 - 11:30 và 13:30 - 16:30. Ánh sáng tự nhiên đẹp, dàn máy tạ trống, âm nhạc thư giãn.\n- **Khung giờ trung bình:** 06:00 - 08:00 sáng.\n- **Khung giờ cao điểm:** 17:30 - 19:30 tối. Các bạn có thể tận dụng quầy tự check-in QR hoặc nhờ lễ tân hỗ trợ để vào phòng nhanh nhất.\n\nChúc mọi người luôn có những giờ phút tập luyện tràn đầy năng lượng tại GymFlow!',
'Dear members, to ensure you make the most of your gym sessions without waiting for machines, here is our crowd density guide.',
0, 0, 0, 2, DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 4 DAY));

INSERT INTO forum_replies (topic_id, author_id, body, created_at) VALUES
(6, (SELECT id FROM users WHERE email = 'member8@gymflow.vn'), 'Mình làm việc tự do nên toàn đi lúc 14h chiều, phòng tập mát mẻ dàn rack và máy tạ đơn tha hồ chọn!', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, (SELECT id FROM users WHERE email = 'member9@gymflow.vn'), 'Khu vực phòng tắm và locker lúc nào cũng sạch sẽ thơm tho, điểm cộng rất lớn cho GymFlow ạ ❤️', DATE_SUB(NOW(), INTERVAL 12 HOUR));

-- ---------------------------------------------------------------------
-- 6. LỊCH SỬ CHECK-IN TẠI QUẦY (GYM_CHECKINS) - 28 NGÀY QUA & HÔM NAY
-- ---------------------------------------------------------------------
DELETE FROM gym_checkins;

-- Sinh dữ liệu check-in trong 28 ngày qua cho 11 hội viên ACTIVE
-- Đảm bảo phân bổ chuẩn: sáng (6h-8h), trưa (12h), chiều tối (17h-20h)
INSERT INTO gym_checkins (member_id, checked_in_at, method, created_by)
SELECT 
    m.id,
    TIMESTAMPADD(MINUTE, (FLOOR(RAND(d.day_offset * 100 + m.id) * 45)),
        TIMESTAMPADD(HOUR, 
            CASE 
                WHEN (m.id + d.day_offset) % 5 = 0 THEN 7
                WHEN (m.id + d.day_offset) % 5 = 1 THEN 8
                WHEN (m.id + d.day_offset) % 5 = 2 THEN 12
                WHEN (m.id + d.day_offset) % 5 = 3 THEN 17
                ELSE 18
            END,
            DATE_SUB(CURDATE(), INTERVAL d.day_offset DAY)
        )
    ),
    IF((m.id + d.day_offset) % 4 = 0, 'MANUAL', 'QR'),
    IF((m.id + d.day_offset) % 4 = 0, 1, NULL)
FROM members m
CROSS JOIN (
    SELECT 1 AS day_offset UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
    UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
    UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16
    UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
    UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
    UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27
) d
WHERE m.status = 'ACTIVE' AND (m.id * 3 + d.day_offset * 7) % 10 < 7;

-- Lượt check-in trong ngày hôm nay (CURDATE) để hiển thị số người đang ở phòng và biểu đồ hôm nay
INSERT INTO gym_checkins (member_id, checked_in_at, method, created_by) VALUES
(1, CONCAT(CURDATE(), ' 06:35:00'), 'QR', NULL),
(2, CONCAT(CURDATE(), ' 07:10:00'), 'QR', NULL),
(3, CONCAT(CURDATE(), ' 08:05:00'), 'MANUAL', 1),
(4, CONCAT(CURDATE(), ' 08:45:00'), 'QR', NULL),
(5, CONCAT(CURDATE(), ' 11:50:00'), 'QR', NULL),
(6, CONCAT(CURDATE(), ' 16:40:00'), 'QR', NULL),
(7, CONCAT(CURDATE(), ' 17:15:00'), 'QR', NULL),
(8, CONCAT(CURDATE(), ' 17:50:00'), 'MANUAL', 1),
(9, CONCAT(CURDATE(), ' 18:20:00'), 'QR', NULL),
(11, CONCAT(CURDATE(), ' 18:55:00'), 'QR', NULL),
(12, CONCAT(CURDATE(), ' 19:25:00'), 'QR', NULL),
(1, CONCAT(CURDATE(), ' 21:45:00'), 'QR', NULL);

-- ---------------------------------------------------------------------
-- 7. ĐƠN ĐĂNG KÝ GÓI & NÂNG CẤP (PACKAGE_REQUESTS)
-- ---------------------------------------------------------------------
-- Thêm đơn đăng ký mới phong phú
INSERT INTO package_requests (
    member_id, plan_id, request_type, trainer_id, promotion_id, plan_name, 
    price, duration_days, original_price, discount_amount, upgrade_credit, final_price,
    payment_method, payment_code, status, member_note, created_at
) VALUES 
(
    2, 3, 'NEW', NULL, 5, 'Gói 6 tháng',
    2500000, 180, 2500000, 750000, 0, 1750000,
    'BANK_TRANSFER', 'GF000003', 'PENDING',
    'Em đăng ký gói 6 tháng áp dụng ưu đãi Black Friday để nối tiếp sau khi hết gói 3 tháng.',
    DATE_SUB(NOW(), INTERVAL 1 DAY)
),
(
    3, 5, 'NEW', @t2_id, 2, 'PT 1 kèm 1 – 12 buổi',
    3600000, 30, 3600000, 360000, 0, 3240000,
    'COUNTER', 'GF000004', 'APPROVED',
    'Em đăng ký gói kèm riêng với HLV Nguyễn Thảo Vy để tập phục hồi cơ lưng.',
    DATE_SUB(NOW(), INTERVAL 2 DAY)
);

UPDATE package_requests SET decided_by = 1, decided_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE payment_code = 'GF000004';

-- ---------------------------------------------------------------------
-- 8. KÍCH HOẠT V55: HUY HIỆU & EMAIL PREFERENCES & EMAIL LOGS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_preferences (
    user_id            BIGINT      NOT NULL PRIMARY KEY,
    locale             VARCHAR(5)  NOT NULL DEFAULT 'vi',
    renewal            BOOLEAN     NOT NULL DEFAULT TRUE,
    birthday           BOOLEAN     NOT NULL DEFAULT TRUE,
    session_reminder   BOOLEAN     NOT NULL DEFAULT TRUE,
    weekly_digest      BOOLEAN     NOT NULL DEFAULT TRUE,
    trainer_report     BOOLEAN     NOT NULL DEFAULT TRUE,
    retention          BOOLEAN     NOT NULL DEFAULT TRUE,
    achievements       BOOLEAN     NOT NULL DEFAULT TRUE,
    unsubscribe_token  VARCHAR(64) NOT NULL,
    updated_at         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_email_pref_token UNIQUE (unsubscribe_token),
    CONSTRAINT fk_email_pref_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_email_pref_locale CHECK (locale IN ('vi', 'en'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS email_logs (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NULL,
    to_email    VARCHAR(120) NOT NULL,
    kind        VARCHAR(30)  NOT NULL,
    ref_key     VARCHAR(100) NOT NULL,
    subject     VARCHAR(200) NOT NULL,
    status      VARCHAR(10)  NOT NULL,
    attempts    INT          NOT NULL DEFAULT 0,
    error       VARCHAR(300) NULL,
    created_at  DATETIME     NOT NULL,
    sent_at     DATETIME     NULL,
    CONSTRAINT uq_email_log_ref UNIQUE (kind, ref_key),
    CONSTRAINT fk_email_log_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_email_log_status CHECK (status IN ('SENT', 'FAILED', 'SKIPPED')),
    INDEX ix_email_log_created (created_at),
    INDEX ix_email_log_status (status, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS member_badges (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id  BIGINT      NOT NULL,
    code       VARCHAR(40) NOT NULL,
    earned_at  DATETIME    NOT NULL,
    seen_at    DATETIME    NULL,
    CONSTRAINT uq_member_badge UNIQUE (member_id, code),
    CONSTRAINT fk_member_badge_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Thêm huy hiệu cho Member 1 và Member 2
INSERT IGNORE INTO member_badges (member_id, code, earned_at, seen_at) VALUES
(1, 'FIRST_WORKOUT', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1, 'SESSIONS_10', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
(1, 'STREAK_3', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 'MORNING_WARRIOR', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
(2, 'FIRST_WORKOUT', DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
(2, 'SESSIONS_10', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 'STREAK_5', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW());

-- Thêm nhật ký gửi email mẫu cho mục Quản lý Email (Email Center)
INSERT IGNORE INTO email_logs (user_id, to_email, kind, ref_key, subject, status, attempts, error, created_at, sent_at) VALUES
(@m1_uid, 'member@gymflow.vn', 'WEEKLY_DIGEST', 'digest-m1-2026-w46', 'GymFlow · Tóm tắt tuần tập luyện 10/11 – 16/11 của bạn', 'SENT', 1, NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(@m2_uid, 'member2@gymflow.vn', 'SESSION_REMINDER', 'reminder-m2-2026-11-21', 'GymFlow · Nhắc lịch tập hôm nay lúc 17:00 cùng HLV Trần Đức Mạnh', 'SENT', 1, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@m3_uid, 'member3@gymflow.vn', 'RENEWAL', 'renewal-sub3-2026-11', 'GymFlow · Gói tập của bạn sẽ hết hạn trong 5 ngày tới', 'SENT', 1, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
((SELECT id FROM users WHERE email = 'member5@gymflow.vn'), 'member5@gymflow.vn', 'BIRTHDAY', 'bday-m5-2026', 'GymFlow · Chúc mừng sinh nhật Hoàng Gia Linh! Tặng bạn ưu đãi 15%', 'SENT', 1, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@t1_uid, 'trainer@gymflow.vn', 'TRAINER_REPORT', 'trainer-t1-2026-11-22', 'GymFlow · Báo cáo ca sáng 22/11: 3 hội viên có lịch tập', 'SENT', 1, NULL, CONCAT(CURDATE(), ' 06:00:00'), CONCAT(CURDATE(), ' 06:00:01'));

COMMIT;
