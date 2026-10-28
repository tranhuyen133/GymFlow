-- =====================================================================
-- SCRUM-133 · Kiểm tra dữ liệu demo do DataSeeder sinh ra, bám theo ngày sinh dữ liệu
-- Người phụ trách: Nguyễn Thế Kiên
-- Chỉ đọc (SELECT). Chạy trên CSDL vừa được DataSeeder sinh (SEED_DEMO_DATA=true, CSDL trống lúc khởi động).
--   mysql -t -u<user> -p <database> < scrum-133-du-lieu-demo.sql
--
-- DataSeeder tính mọi ngày tương đối với "hôm nay" lúc sinh. Script lấy ngày đó từ users.created_at
-- của admin@gymflow.vn, nên kết quả vẫn đúng nếu chạy vào hôm sau.
-- Lưu ý: users.created_at lấy theo múi giờ của JVM (User.onCreate dùng LocalDateTime.now()), còn DataSeeder
-- dùng Clock giờ Việt Nam. Nếu JVM chạy UTC và dữ liệu được sinh trong khoảng 00:00–07:00 giờ Việt Nam,
-- hai ngày lệch nhau 1 ngày và các kiểm tra "gói" sẽ FAIL dù dữ liệu đúng.
-- =====================================================================

SET @seed_ts := (SELECT created_at FROM users WHERE email = 'admin@gymflow.vn');
SET @seed    := DATE(@seed_ts);
SET @monday  := DATE_SUB(@seed, INTERVAL WEEKDAY(@seed) DAY);

-- Hội viên theo mã HVxxxxx = thứ tự i + 1 trong DataSeeder.MEMBER_NAMES
SET @m_member   := (SELECT m.id FROM members m JOIN users u ON u.id = m.user_id WHERE u.email = 'member@gymflow.vn');
SET @m_expiring := (SELECT id FROM members WHERE code = 'HV00003');   -- i = 2: hết hạn sau 3 ngày
SET @m_exp6     := (SELECT id FROM members WHERE code = 'HV00006');   -- i = 5: hết hạn sau 6 ngày
SET @m_selftrain:= (SELECT id FROM members WHERE code = 'HV00008');   -- i = 7: tự tập, không HLV
SET @m_paused   := (SELECT id FROM members WHERE code = 'HV00010');   -- i = 9: đang bảo lưu
SET @m_renewed  := (SELECT id FROM members WHERE code = 'HV00011');   -- i = 10: đã gia hạn trước
SET @m_expired  := (SELECT id FROM members WHERE code = 'HV00012');   -- i = 11: đã hết hạn

WITH checks(nhom, kiem_tra, ket_qua) AS (
    SELECT 'ngày sinh', CONCAT('tìm được ngày sinh dữ liệu: ', COALESCE(@seed, '—')),
           IF(@seed IS NOT NULL, 'PASS', 'FAIL')

    -- 1. Tài khoản demo (DemoAccounts.java)
    UNION ALL
    SELECT 'tài khoản', CONCAT(a.email, ' = ', a.role, ', ACTIVE'),
           IF(EXISTS (SELECT 1 FROM users u WHERE u.email = a.email AND u.role = a.role AND u.status = 'ACTIVE'),
              'PASS', 'FAIL')
    FROM (          SELECT 'admin@gymflow.vn'   AS email, 'ADMIN'   AS role
          UNION ALL SELECT 'trainer@gymflow.vn',          'TRAINER'
          UNION ALL SELECT 'member@gymflow.vn',           'MEMBER') a
    UNION ALL
    SELECT 'tài khoản', 'member@gymflow.vn có hồ sơ hội viên HV00001',
           IF((SELECT code FROM members WHERE id = @m_member) = 'HV00001', 'PASS', 'FAIL')
    UNION ALL
    SELECT 'tài khoản', 'mỗi HLV có hồ sơ trainers (3 HLV)',
           IF((SELECT COUNT(*) FROM users WHERE role = 'TRAINER') = 3
              AND (SELECT COUNT(*) FROM trainers) = 3, 'PASS', 'FAIL')
    UNION ALL
    SELECT 'tài khoản', 'mỗi tài khoản MEMBER có đúng một hồ sơ hội viên',
           IF((SELECT COUNT(*) FROM users WHERE role = 'MEMBER') = (SELECT COUNT(*) FROM members)
              AND (SELECT COUNT(*) FROM members) >= 12, 'PASS', 'FAIL')
    UNION ALL
    SELECT 'bảo mật', 'mật khẩu lưu bằng BCrypt, không có mật khẩu dạng rõ',
           IF(NOT EXISTS (SELECT 1 FROM users WHERE password_hash NOT LIKE '$2_$%' OR CHAR_LENGTH(password_hash) <> 60),
              'PASS', 'FAIL')

    -- 2. Gói tập bám ngày sinh dữ liệu
    UNION ALL
    SELECT 'gói', 'HV00003: gói cuối kết thúc sau 3 ngày (sắp hết hạn)',
           IF((SELECT MAX(end_date) FROM member_subscriptions WHERE member_id = @m_expiring AND NOT cancelled)
              = DATE_ADD(@seed, INTERVAL 3 DAY), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'gói', 'HV00006: gói cuối kết thúc sau 6 ngày (sắp hết hạn)',
           IF((SELECT MAX(end_date) FROM member_subscriptions WHERE member_id = @m_exp6 AND NOT cancelled)
              = DATE_ADD(@seed, INTERVAL 6 DAY), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'gói', 'HV00012: gói cuối đã hết hạn 12 ngày trước',
           IF((SELECT MAX(end_date) FROM member_subscriptions WHERE member_id = @m_expired AND NOT cancelled)
              = DATE_SUB(@seed, INTERVAL 12 DAY), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'gói', 'HV00011: có gói gia hạn trước, bắt đầu sau 6 ngày',
           IF(EXISTS (SELECT 1 FROM member_subscriptions WHERE member_id = @m_renewed AND NOT cancelled
                        AND start_date = DATE_ADD(@seed, INTERVAL 6 DAY)), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'gói', 'mọi hội viên còn lại có gói hiệu lực hơn 7 ngày nữa',
           IF(NOT EXISTS (SELECT 1 FROM members m
                          WHERE m.id NOT IN (@m_expiring, @m_exp6, @m_renewed, @m_expired)
                            AND (SELECT MAX(s.end_date) FROM member_subscriptions s
                                 WHERE s.member_id = m.id AND NOT s.cancelled) <= DATE_ADD(@seed, INTERVAL 7 DAY)),
              'PASS', 'FAIL')
    UNION ALL
    SELECT 'gói', 'không có 2 gói chưa huỷ chồng ngày của cùng hội viên',
           IF(NOT EXISTS (SELECT 1 FROM member_subscriptions a JOIN member_subscriptions b
                            ON a.member_id = b.member_id AND a.id < b.id
                          WHERE NOT a.cancelled AND NOT b.cancelled
                            AND a.start_date <= b.end_date AND b.start_date <= a.end_date), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'gói', 'endDate = startDate + durationDays − 1 cho mọi gói mẫu',
           IF(NOT EXISTS (SELECT 1 FROM member_subscriptions s JOIN membership_plans p ON p.id = s.plan_id
                          WHERE s.end_date <> DATE_ADD(s.start_date, INTERVAL p.duration_days - 1 DAY)), 'PASS', 'FAIL')

    -- 3. Lịch tập: 8 tuần trước đến 2 tuần sau ngày sinh
    UNION ALL
    SELECT 'lịch', 'lịch sớm nhất không trước thứ Hai của 8 tuần trước',
           IF((SELECT MIN(DATE(start_time)) FROM workout_schedules) >= DATE_SUB(@monday, INTERVAL 8 WEEK), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'lịch', 'lịch muộn nhất không quá 2 tuần sau',
           IF((SELECT MAX(DATE(start_time)) FROM workout_schedules) <= DATE_ADD(@seed, INTERVAL 2 WEEK), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'lịch', 'có buổi sắp tới (SCHEDULED) sau thời điểm sinh',
           IF(EXISTS (SELECT 1 FROM workout_schedules WHERE status = 'SCHEDULED' AND start_time > @seed_ts), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'lịch', 'buổi đã qua lúc sinh không còn ở trạng thái SCHEDULED',
           IF(NOT EXISTS (SELECT 1 FROM workout_schedules WHERE end_time < @seed_ts AND status = 'SCHEDULED'), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'lịch', 'mỗi buổi COMPLETED có đúng một nhật ký tập, buổi khác thì không',
           IF(NOT EXISTS (SELECT 1 FROM workout_schedules s LEFT JOIN workout_logs l ON l.schedule_id = s.id
                          WHERE (s.status = 'COMPLETED') <> (l.id IS NOT NULL)), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'lịch', 'HV00010 đang bảo lưu: PAUSED, không có lịch trong 14 ngày gần đây',
           IF((SELECT status FROM members WHERE id = @m_paused) = 'PAUSED'
              AND NOT EXISTS (SELECT 1 FROM workout_schedules WHERE member_id = @m_paused
                                AND DATE(start_time) > DATE_SUB(@seed, INTERVAL 14 DAY)), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'lịch', 'HV00008 tự tập: không có HLV, lịch không gắn HLV',
           IF((SELECT trainer_id FROM members WHERE id = @m_selftrain) IS NULL
              AND NOT EXISTS (SELECT 1 FROM workout_schedules WHERE member_id = @m_selftrain AND trainer_id IS NOT NULL),
              'PASS', 'FAIL')
    UNION ALL
    SELECT 'lịch', 'lịch chỉ rơi vào ngày gói còn hiệu lực',
           IF(NOT EXISTS (SELECT 1 FROM workout_schedules w
                          WHERE NOT EXISTS (SELECT 1 FROM member_subscriptions s
                                            WHERE s.member_id = w.member_id AND NOT s.cancelled
                                              AND DATE(w.start_time) BETWEEN s.start_date AND s.end_date)), 'PASS', 'FAIL')

    -- 4. Cân nặng hằng tuần
    UNION ALL
    SELECT 'cân nặng', 'mỗi hội viên có bản ghi trong 3 ngày gần ngày sinh',
           IF(NOT EXISTS (SELECT 1 FROM members m
                          WHERE NOT EXISTS (SELECT 1 FROM weight_records r WHERE r.member_id = m.id
                                              AND r.recorded_date BETWEEN DATE_SUB(@seed, INTERVAL 2 DAY) AND @seed)),
              'PASS', 'FAIL')
    UNION ALL
    SELECT 'cân nặng', 'không có bản ghi sau ngày sinh hoặc trước 10 tuần',
           IF(NOT EXISTS (SELECT 1 FROM weight_records
                          WHERE recorded_date > @seed
                             OR recorded_date < DATE_SUB(@seed, INTERVAL 9 WEEK) - INTERVAL 2 DAY), 'PASS', 'FAIL')
    UNION ALL
    SELECT 'cân nặng', 'đủ dữ liệu cho biểu đồ 8 tuần (≥ 8 bản ghi với HV00001)',
           IF((SELECT COUNT(*) FROM weight_records WHERE member_id = @m_member) >= 8, 'PASS', 'FAIL')
)
SELECT nhom, kiem_tra, ket_qua FROM checks
UNION ALL
SELECT '==', 'TỔNG SCRUM-133', CONCAT(SUM(ket_qua = 'PASS'), '/', COUNT(*), IF(SUM(ket_qua = 'FAIL') = 0, ' PASS', ' FAIL'))
FROM checks
UNION ALL
SELECT 'ghi chú', CONCAT('dữ liệu sinh cách đây ', DATEDIFF(CURRENT_DATE, @seed), ' ngày'),
       IF(DATEDIFF(CURRENT_DATE, @seed) = 0, 'mới', 'trạng thái gói trên giao diện đã trôi theo ngày');
