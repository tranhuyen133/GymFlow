-- =====================================================================
-- GymFlow · V33 · Mở khoá chủ đề chào mừng của diễn đàn, thêm gói tập mẫu Gym và Gym + PT
--  1. V9 tạo chủ đề "Chào mừng…" với locked = TRUE nên hội viên đã đăng nhập không trả lời được bài
--     của quản lý. Mở khoá đúng chủ đề đó (vẫn ghim). Chủ đề khác do quản lý tự khoá thì giữ nguyên.
--  2. Gói "PT 1 kèm 1 – 12 buổi" của dữ liệu mẫu (DataSeeder) bị lưu là GYM nên không trừ buổi PT.
--     Chuyển sang GYM_PT với đúng 12 buổi như tên gói, hạn dùng buổi = thời hạn gói. Chỉ đổi khi gói
--     vẫn đang là GYM và chưa khai báo số buổi; gói hội viên đã mua giữ nguyên (V24 đã chụp quyền lợi).
--  3. Thêm 5 gói Gym + 6 gói Gym + PT mẫu. Thêm theo tên VÀ mã: đã có gói trùng tên hoặc trùng mã thì bỏ qua,
--     không sửa gói quản lý đã tạo. Quản lý sửa giá / ẩn gói ở Quản lý › Gói tập như gói bình thường.
--  * Chạy lại an toàn, không xoá dữ liệu.
-- =====================================================================

-- 1. Mở khoá chủ đề chào mừng
UPDATE forum_topics t
JOIN users u ON u.id = t.author_id AND u.role = 'ADMIN'
SET t.locked = FALSE
WHERE t.title = 'Chào mừng đến Diễn đàn GymFlow – đọc trước khi đăng'
  AND t.locked = TRUE;

-- 2. Sửa loại gói PT của dữ liệu mẫu
UPDATE membership_plans
SET plan_type = 'GYM_PT', includes_trainer = TRUE, pt_sessions = 12, pt_valid_days = duration_days
WHERE name = 'PT 1 kèm 1 – 12 buổi'
  AND plan_type = 'GYM'
  AND pt_sessions IS NULL
  AND duration_days BETWEEN 1 AND 1095;

-- 3. Gói mẫu. Cột: mã, tên, mô tả, giá (VNĐ), số ngày, quyền lợi (phẩy = xuống dòng trên thẻ gói),
--    điều kiện, loại, số buổi PT, hạn dùng buổi, phút / buổi, giờ báo huỷ.
INSERT INTO membership_plans (code, name, description, price, duration_days, benefits, usage_terms,
                              includes_trainer, plan_type, pt_sessions, pt_valid_days, pt_session_minutes, pt_cancel_notice_hours, active)
SELECT s.code, s.name, s.description, s.price, s.duration_days, s.benefits, s.usage_terms,
       s.plan_type = 'GYM_PT', s.plan_type, s.pt_sessions, s.pt_valid_days, s.pt_minutes, s.pt_notice, TRUE
FROM (
    SELECT 'GYM-DAY' AS code, 'Vé tập 1 ngày' AS name,
           'Tập thử trọn một ngày, dùng toàn bộ khu tạ và cardio.' AS description,
           80000 AS price, 1 AS duration_days,
           'Toàn bộ khu tạ và cardio, Tủ đồ trong ngày, Nước uống miễn phí' AS benefits,
           'Dùng trong ngày kích hoạt. Mang CCCD khi nhận vé.' AS usage_terms,
           'GYM' AS plan_type, NULL AS pt_sessions, NULL AS pt_valid_days, NULL AS pt_minutes, NULL AS pt_notice
    UNION ALL SELECT 'GYM-2W', 'Gói trải nghiệm 2 tuần',
           'Làm quen phòng tập trong 14 ngày, kèm 1 buổi hướng dẫn máy.',
           250000, 14,
           'Tập không giới hạn giờ mở cửa, 1 buổi hướng dẫn sử dụng máy, Tủ đồ',
           'Mỗi hội viên mua 1 lần. Không bảo lưu.',
           'GYM', NULL, NULL, NULL, NULL
    UNION ALL SELECT 'GYM-OFFPEAK-1M', 'Gói giờ vàng 1 tháng (9h–16h)',
           'Giá mềm cho người rảnh ban ngày: tập từ 9h đến 16h, thứ Hai đến thứ Sáu.',
           390000, 30,
           'Tập 9h–16h thứ Hai đến thứ Sáu, Tủ đồ, Nước uống miễn phí',
           'Vào ngoài khung giờ hoặc cuối tuần: phụ thu 30.000đ / lượt.',
           'GYM', NULL, NULL, NULL, NULL
    UNION ALL SELECT 'GYM-STUDENT-3M', 'Gói sinh viên 3 tháng',
           'Ưu đãi cho học sinh, sinh viên đang đi học.',
           990000, 90,
           'Tập không giới hạn giờ mở cửa, 1 buổi đo InBody, Tủ đồ',
           'Xuất trình thẻ học sinh / sinh viên còn hạn khi đăng ký. Bảo lưu tối đa 7 ngày.',
           'GYM', NULL, NULL, NULL, NULL
    UNION ALL SELECT 'GYM-24M', 'Gói 24 tháng',
           'Cam kết dài hạn, giá tốt nhất tính theo tháng.',
           7900000, 730,
           'Tập không giới hạn giờ mở cửa, 4 buổi đo InBody, 6 buổi PT, Tủ đồ riêng, Bảo lưu 60 ngày',
           'Bảo lưu tối đa 60 ngày, báo trước 3 ngày. Chuyển nhượng 1 lần, phí 200.000đ.',
           'GYM', NULL, NULL, NULL, NULL

    UNION ALL SELECT 'PT-TRIAL-3', 'PT trải nghiệm 3 buổi',
           'Thử tập 1 kèm 1 với huấn luyện viên: đánh giá thể trạng và lên giáo án khởi đầu.',
           690000, 14,
           '3 buổi PT 1 kèm 1, Đánh giá thể trạng buổi đầu, Giáo án khởi đầu 2 tuần',
           'Mỗi hội viên mua 1 lần. Dời buổi báo trước 12 giờ, báo muộn tính là đã tập.',
           'GYM_PT', 3, 14, 60, 12
    UNION ALL SELECT 'PT-8', 'Gym + PT 8 buổi (1 tháng)',
           'Tập gym cả tháng, 2 buổi PT mỗi tuần để sửa kỹ thuật và theo dõi tiến độ.',
           2900000, 30,
           'Tập gym không giới hạn, 8 buổi PT 1 kèm 1, Giáo án cá nhân, 1 buổi đo InBody',
           'Buổi PT dùng trong 30 ngày. Dời buổi báo trước 12 giờ.',
           'GYM_PT', 8, 30, 60, 12
    UNION ALL SELECT 'PT-12', 'Gym + PT 12 buổi (6 tuần)',
           '3 buổi PT mỗi tuần trong 4 tuần đầu, phần còn lại tự tập theo giáo án.',
           4200000, 45,
           'Tập gym không giới hạn, 12 buổi PT 1 kèm 1, Giáo án cá nhân, Theo dõi dinh dưỡng qua tin nhắn',
           'Buổi PT dùng trong 45 ngày. Dời buổi báo trước 12 giờ.',
           'GYM_PT', 12, 45, 60, 12
    UNION ALL SELECT 'PT-24', 'Gym + PT 24 buổi (3 tháng)',
           'Lộ trình 12 tuần, 2 buổi PT mỗi tuần, đo lại chỉ số mỗi 4 tuần.',
           7800000, 90,
           'Tập gym không giới hạn, 24 buổi PT 1 kèm 1, 3 buổi đo InBody, Giáo án và thực đơn gợi ý',
           'Buổi PT dùng trong 90 ngày. Dời buổi báo trước 24 giờ. Bảo lưu tối đa 14 ngày.',
           'GYM_PT', 24, 90, 60, 24
    UNION ALL SELECT 'PT-36-FATLOSS', 'Gym + PT giảm mỡ 36 buổi (4 tháng)',
           'Chương trình giảm mỡ 16 tuần: 2–3 buổi PT mỗi tuần, kết hợp cardio và theo dõi dinh dưỡng.',
           10800000, 120,
           'Tập gym không giới hạn, 36 buổi PT 1 kèm 1, 4 buổi đo InBody, Thực đơn theo tuần, Nhắn tin hỏi HLV hằng ngày',
           'Buổi PT dùng trong 120 ngày. Dời buổi báo trước 24 giờ. Bảo lưu tối đa 21 ngày.',
           'GYM_PT', 36, 120, 60, 24
    UNION ALL SELECT 'PT-REHAB-10', 'PT phục hồi vận động 10 buổi',
           'Bài mobility và tăng sức mạnh nhẹ sau chấn thương đã được bác sĩ cho tập lại.',
           4500000, 45,
           'Tập gym không giới hạn, 10 buổi PT 1 kèm 1 (45 phút), Đánh giá tầm vận động, Bài tập về nhà',
           'Cần giấy cho phép tập luyện của bác sĩ nếu đang điều trị. Dời buổi báo trước 24 giờ.',
           'GYM_PT', 10, 45, 45, 24
) s
WHERE NOT EXISTS (SELECT 1 FROM membership_plans p WHERE p.name = s.name OR p.code = s.code);
