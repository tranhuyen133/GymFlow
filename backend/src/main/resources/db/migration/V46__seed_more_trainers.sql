-- =====================================================================
-- GymFlow · V46 · Thêm 6 huấn luyện viên mẫu (kèm ca làm việc trong tuần)
--  * Không chứa mật khẩu: password_hash là chuỗi KHÔNG phải BCrypt nên không đăng nhập được
--    cho tới khi Quản trị viên đặt lại mật khẩu trong mục Tài khoản.
--  * Chạy lại an toàn: chỉ thêm khi email chưa tồn tại; ca chỉ thêm cho HLV chưa có ca nào.
-- =====================================================================

INSERT INTO users (email, password_hash, full_name, phone, role, status, email_verified_at)
SELECT s.email, '!seed-account-reset-password-required', s.full_name, NULL, 'TRAINER', 'ACTIVE', CURRENT_TIMESTAMP(6)
FROM (
    SELECT 'hlv.minhquan@gymflow.io.vn' AS email, 'Phạm Minh Quân' AS full_name
    UNION ALL SELECT 'hlv.thuha@gymflow.io.vn', 'Đặng Thu Hà'
    UNION ALL SELECT 'hlv.quocbao@gymflow.io.vn', 'Vũ Quốc Bảo'
    UNION ALL SELECT 'hlv.ngoclan@gymflow.io.vn', 'Hoàng Ngọc Lan'
    UNION ALL SELECT 'hlv.ducanh@gymflow.io.vn', 'Bùi Đức Anh'
    UNION ALL SELECT 'hlv.mailinh@gymflow.io.vn', 'Trịnh Mai Linh'
) s
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = s.email);

INSERT INTO trainers (user_id, specialty, experience_years, certificates, bio, active)
SELECT u.id, s.specialty, s.years, s.certs, s.bio, TRUE
FROM (
    SELECT 'hlv.minhquan@gymflow.io.vn' AS email, 'Tăng cơ, Thể hình' AS specialty, 7 AS years,
           'NSCA-CSCS, ACE-CPT' AS certs,
           'Chuyên giáo án tăng cơ cho người mới đến trung cấp: chia buổi theo nhóm cơ, tăng tạ có kế hoạch và theo dõi số đo mỗi tháng.' AS bio
    UNION ALL SELECT 'hlv.thuha@gymflow.io.vn', 'Pilates, Phục hồi chức năng', 5,
           'Polestar Pilates, Sơ cứu cơ bản',
           'Tập trung vào tư thế, cơ lõi và phục hồi sau chấn thương nhẹ vùng lưng – gối. Phù hợp dân văn phòng ngồi nhiều.'
    UNION ALL SELECT 'hlv.quocbao@gymflow.io.vn', 'HIIT, Giảm mỡ', 4,
           'ACE-CPT, CrossFit Level 1',
           'Buổi tập ngắn 30–45 phút cường độ cao, kết hợp tạ và cardio để giảm mỡ nhưng vẫn giữ cơ. Luôn có bài thay thế cho người mới.'
    UNION ALL SELECT 'hlv.ngoclan@gymflow.io.vn', 'Yoga, Mobility', 9,
           'RYT-500',
           'Hơn 9 năm dạy yoga: cải thiện độ linh hoạt, hơi thở và giấc ngủ. Có lớp mobility bổ trợ cho người tập tạ.'
    UNION ALL SELECT 'hlv.ducanh@gymflow.io.vn', 'Sức mạnh, Powerlifting', 6,
           'NSCA-CPT, VN Powerlifting Level 1',
           'Hướng dẫn kỹ thuật squat – bench – deadlift an toàn, lập chu kỳ tập theo phần trăm 1RM và chuẩn bị cho giải phong trào.'
    UNION ALL SELECT 'hlv.mailinh@gymflow.io.vn', 'Dinh dưỡng thể thao, Giảm mỡ', 3,
           'ISSA Nutrition Coach, NASM-CPT',
           'Kết hợp tập luyện với thực đơn dễ làm theo khẩu phần Việt, theo dõi cân nặng hằng tuần và điều chỉnh calo hợp lý.'
) s
JOIN users u ON u.email = s.email
WHERE NOT EXISTS (SELECT 1 FROM trainers t WHERE t.user_id = u.id);

INSERT INTO trainer_shifts (trainer_id, day_of_week, start_time, end_time)
SELECT t.id, s.day_of_week, s.start_time, s.end_time
FROM (
    SELECT 'hlv.minhquan@gymflow.io.vn' AS email, 1 AS day_of_week, '06:00:00' AS start_time, '12:00:00' AS end_time
    UNION ALL SELECT 'hlv.minhquan@gymflow.io.vn', 3, '06:00:00', '12:00:00'
    UNION ALL SELECT 'hlv.minhquan@gymflow.io.vn', 5, '06:00:00', '12:00:00'
    UNION ALL SELECT 'hlv.minhquan@gymflow.io.vn', 2, '16:00:00', '21:00:00'
    UNION ALL SELECT 'hlv.minhquan@gymflow.io.vn', 4, '16:00:00', '21:00:00'
    UNION ALL SELECT 'hlv.thuha@gymflow.io.vn', 1, '08:00:00', '12:00:00'
    UNION ALL SELECT 'hlv.thuha@gymflow.io.vn', 2, '08:00:00', '12:00:00'
    UNION ALL SELECT 'hlv.thuha@gymflow.io.vn', 3, '08:00:00', '12:00:00'
    UNION ALL SELECT 'hlv.thuha@gymflow.io.vn', 4, '08:00:00', '12:00:00'
    UNION ALL SELECT 'hlv.thuha@gymflow.io.vn', 5, '08:00:00', '12:00:00'
    UNION ALL SELECT 'hlv.thuha@gymflow.io.vn', 6, '08:00:00', '12:00:00'
    UNION ALL SELECT 'hlv.quocbao@gymflow.io.vn', 1, '17:00:00', '21:30:00'
    UNION ALL SELECT 'hlv.quocbao@gymflow.io.vn', 2, '17:00:00', '21:30:00'
    UNION ALL SELECT 'hlv.quocbao@gymflow.io.vn', 3, '17:00:00', '21:30:00'
    UNION ALL SELECT 'hlv.quocbao@gymflow.io.vn', 4, '17:00:00', '21:30:00'
    UNION ALL SELECT 'hlv.quocbao@gymflow.io.vn', 5, '17:00:00', '21:30:00'
    UNION ALL SELECT 'hlv.ngoclan@gymflow.io.vn', 2, '06:00:00', '10:00:00'
    UNION ALL SELECT 'hlv.ngoclan@gymflow.io.vn', 4, '06:00:00', '10:00:00'
    UNION ALL SELECT 'hlv.ngoclan@gymflow.io.vn', 6, '06:00:00', '10:00:00'
    UNION ALL SELECT 'hlv.ngoclan@gymflow.io.vn', 7, '07:00:00', '11:00:00'
    UNION ALL SELECT 'hlv.ducanh@gymflow.io.vn', 1, '15:00:00', '21:00:00'
    UNION ALL SELECT 'hlv.ducanh@gymflow.io.vn', 3, '15:00:00', '21:00:00'
    UNION ALL SELECT 'hlv.ducanh@gymflow.io.vn', 5, '15:00:00', '21:00:00'
    UNION ALL SELECT 'hlv.ducanh@gymflow.io.vn', 6, '08:00:00', '12:00:00'
    UNION ALL SELECT 'hlv.mailinh@gymflow.io.vn', 2, '09:00:00', '13:00:00'
    UNION ALL SELECT 'hlv.mailinh@gymflow.io.vn', 3, '09:00:00', '13:00:00'
    UNION ALL SELECT 'hlv.mailinh@gymflow.io.vn', 3, '18:00:00', '21:00:00'
    UNION ALL SELECT 'hlv.mailinh@gymflow.io.vn', 4, '09:00:00', '13:00:00'
    UNION ALL SELECT 'hlv.mailinh@gymflow.io.vn', 5, '09:00:00', '13:00:00'
    UNION ALL SELECT 'hlv.mailinh@gymflow.io.vn', 6, '09:00:00', '13:00:00'
) s
JOIN users u ON u.email = s.email
JOIN trainers t ON t.user_id = u.id
WHERE NOT EXISTS (SELECT 1 FROM trainer_shifts x WHERE x.trainer_id = t.id);
