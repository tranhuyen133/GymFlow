-- =====================================================================
-- SCRUM-132 · Kiểm tra lược đồ gói tập và tập luyện + view v_subscription_status (SRS 8.5)
-- Người phụ trách: Nguyễn Thế Kiên
-- Phần A chỉ đọc information_schema.
-- Phần B chèn 6 gói thử trong MỘT transaction rồi ROLLBACK: không để lại dữ liệu
-- (chỉ tiêu tốn vài giá trị AUTO_INCREMENT). Nếu script lỗi giữa chừng, phiên đóng lại cũng tự rollback.
--   mysql -t -u<user> -p <database> < scrum-132-goi-tap-view.sql
-- =====================================================================

CREATE TEMPORARY TABLE scrum132_result (
    stt      INT AUTO_INCREMENT PRIMARY KEY,
    nhom     VARCHAR(20),
    kiem_tra VARCHAR(120),
    ket_qua  VARCHAR(20)
) ENGINE = MEMORY;   -- MEMORY: không bị ROLLBACK ở phần B xoá mất kết quả

-- ---------------------------------------------------------------- Phần A: lược đồ
INSERT INTO scrum132_result (nhom, kiem_tra, ket_qua)
WITH
cols(tbl, col, nullable) AS (
              SELECT 'membership_plans', 'id', 'NO'
    UNION ALL SELECT 'membership_plans', 'name', 'NO'
    UNION ALL SELECT 'membership_plans', 'description', 'YES'
    UNION ALL SELECT 'membership_plans', 'price', 'NO'
    UNION ALL SELECT 'membership_plans', 'duration_days', 'NO'
    UNION ALL SELECT 'membership_plans', 'benefits', 'YES'
    UNION ALL SELECT 'membership_plans', 'active', 'NO'
    UNION ALL SELECT 'membership_plans', 'created_at', 'NO'
    UNION ALL SELECT 'member_subscriptions', 'id', 'NO'
    UNION ALL SELECT 'member_subscriptions', 'member_id', 'NO'
    UNION ALL SELECT 'member_subscriptions', 'plan_id', 'NO'
    UNION ALL SELECT 'member_subscriptions', 'start_date', 'NO'
    UNION ALL SELECT 'member_subscriptions', 'end_date', 'NO'
    UNION ALL SELECT 'member_subscriptions', 'price_paid', 'NO'
    UNION ALL SELECT 'member_subscriptions', 'cancelled', 'NO'
    UNION ALL SELECT 'member_subscriptions', 'cancelled_at', 'YES'
    UNION ALL SELECT 'member_subscriptions', 'note', 'YES'
    UNION ALL SELECT 'member_subscriptions', 'created_by', 'YES'
    UNION ALL SELECT 'member_subscriptions', 'created_at', 'NO'
    UNION ALL SELECT 'exercises', 'id', 'NO'
    UNION ALL SELECT 'exercises', 'name', 'NO'
    UNION ALL SELECT 'exercises', 'muscle_group', 'NO'
    UNION ALL SELECT 'exercises', 'equipment', 'YES'
    UNION ALL SELECT 'exercises', 'level', 'NO'
    UNION ALL SELECT 'exercises', 'description', 'YES'
    UNION ALL SELECT 'exercises', 'instructions', 'YES'
    UNION ALL SELECT 'exercises', 'video_url', 'YES'
    UNION ALL SELECT 'exercises', 'hidden', 'NO'
    UNION ALL SELECT 'exercises', 'created_by', 'YES'
    UNION ALL SELECT 'exercises', 'created_at', 'NO'
    UNION ALL SELECT 'workout_plans', 'id', 'NO'
    UNION ALL SELECT 'workout_plans', 'member_id', 'NO'
    UNION ALL SELECT 'workout_plans', 'trainer_id', 'YES'
    UNION ALL SELECT 'workout_plans', 'name', 'NO'
    UNION ALL SELECT 'workout_plans', 'goal', 'YES'
    UNION ALL SELECT 'workout_plans', 'start_date', 'NO'
    UNION ALL SELECT 'workout_plans', 'end_date', 'NO'
    UNION ALL SELECT 'workout_plans', 'status', 'NO'
    UNION ALL SELECT 'workout_plans', 'note', 'YES'
    UNION ALL SELECT 'workout_plans', 'created_at', 'NO'
    UNION ALL SELECT 'workout_plan_items', 'id', 'NO'
    UNION ALL SELECT 'workout_plan_items', 'plan_id', 'NO'
    UNION ALL SELECT 'workout_plan_items', 'exercise_id', 'NO'
    UNION ALL SELECT 'workout_plan_items', 'day_of_week', 'NO'
    UNION ALL SELECT 'workout_plan_items', 'sort_order', 'NO'
    UNION ALL SELECT 'workout_plan_items', 'sets', 'NO'
    UNION ALL SELECT 'workout_plan_items', 'reps', 'NO'
    UNION ALL SELECT 'workout_plan_items', 'weight_kg', 'YES'
    UNION ALL SELECT 'workout_plan_items', 'rest_seconds', 'YES'
    UNION ALL SELECT 'workout_plan_items', 'duration_minutes', 'YES'
    UNION ALL SELECT 'workout_plan_items', 'note', 'YES'
    UNION ALL SELECT 'workout_schedules', 'id', 'NO'
    UNION ALL SELECT 'workout_schedules', 'member_id', 'NO'
    UNION ALL SELECT 'workout_schedules', 'trainer_id', 'YES'
    UNION ALL SELECT 'workout_schedules', 'plan_id', 'YES'
    UNION ALL SELECT 'workout_schedules', 'title', 'NO'
    UNION ALL SELECT 'workout_schedules', 'start_time', 'NO'
    UNION ALL SELECT 'workout_schedules', 'end_time', 'NO'
    UNION ALL SELECT 'workout_schedules', 'status', 'NO'
    UNION ALL SELECT 'workout_schedules', 'note', 'YES'
    UNION ALL SELECT 'workout_schedules', 'created_at', 'NO'
    UNION ALL SELECT 'workout_logs', 'id', 'NO'
    UNION ALL SELECT 'workout_logs', 'schedule_id', 'YES'
    UNION ALL SELECT 'workout_logs', 'member_id', 'NO'
    UNION ALL SELECT 'workout_logs', 'completed_at', 'NO'
    UNION ALL SELECT 'workout_logs', 'duration_minutes', 'YES'
    UNION ALL SELECT 'workout_logs', 'calories', 'YES'
    UNION ALL SELECT 'workout_logs', 'rating', 'YES'
    UNION ALL SELECT 'workout_logs', 'note', 'YES'
),
fks(name, tbl, ref_tbl, on_delete) AS (
              SELECT 'fk_sub_member',     'member_subscriptions', 'members',           'CASCADE'
    UNION ALL SELECT 'fk_sub_plan',       'member_subscriptions', 'membership_plans',  'RESTRICT'
    UNION ALL SELECT 'fk_sub_created_by', 'member_subscriptions', 'users',             'SET NULL'
    UNION ALL SELECT 'fk_ex_created_by',  'exercises',            'users',             'SET NULL'
    UNION ALL SELECT 'fk_wp_member',      'workout_plans',        'members',           'CASCADE'
    UNION ALL SELECT 'fk_wp_trainer',     'workout_plans',        'trainers',          'SET NULL'
    UNION ALL SELECT 'fk_wpi_plan',       'workout_plan_items',   'workout_plans',     'CASCADE'
    UNION ALL SELECT 'fk_wpi_exercise',   'workout_plan_items',   'exercises',         'RESTRICT'
    UNION ALL SELECT 'fk_ws_member',      'workout_schedules',    'members',           'CASCADE'
    UNION ALL SELECT 'fk_ws_trainer',     'workout_schedules',    'trainers',          'SET NULL'
    UNION ALL SELECT 'fk_ws_plan',        'workout_schedules',    'workout_plans',     'SET NULL'
    UNION ALL SELECT 'fk_logs_schedule',  'workout_logs',         'workout_schedules', 'SET NULL'
    UNION ALL SELECT 'fk_logs_member',    'workout_logs',         'members',           'CASCADE'
),
cons(name, tbl, kind) AS (
              SELECT 'uq_plans_name',     'membership_plans',     'UNIQUE'
    UNION ALL SELECT 'uq_exercises_name', 'exercises',            'UNIQUE'
    UNION ALL SELECT 'uq_logs_schedule',  'workout_logs',         'UNIQUE'
    UNION ALL SELECT 'ck_plans_price',    'membership_plans',     'CHECK'
    UNION ALL SELECT 'ck_plans_duration', 'membership_plans',     'CHECK'
    UNION ALL SELECT 'ck_sub_dates',      'member_subscriptions', 'CHECK'
    UNION ALL SELECT 'ck_sub_price',      'member_subscriptions', 'CHECK'
    UNION ALL SELECT 'ck_ex_group',       'exercises',            'CHECK'
    UNION ALL SELECT 'ck_ex_level',       'exercises',            'CHECK'
    UNION ALL SELECT 'ck_wp_dates',       'workout_plans',        'CHECK'
    UNION ALL SELECT 'ck_wp_status',      'workout_plans',        'CHECK'
    UNION ALL SELECT 'ck_wpi_day',        'workout_plan_items',   'CHECK'
    UNION ALL SELECT 'ck_wpi_sets',       'workout_plan_items',   'CHECK'
    UNION ALL SELECT 'ck_wpi_weight',     'workout_plan_items',   'CHECK'
    UNION ALL SELECT 'ck_wpi_rest',       'workout_plan_items',   'CHECK'
    UNION ALL SELECT 'ck_wpi_duration',   'workout_plan_items',   'CHECK'
    UNION ALL SELECT 'ck_ws_time',        'workout_schedules',    'CHECK'
    UNION ALL SELECT 'ck_ws_status',      'workout_schedules',    'CHECK'
    UNION ALL SELECT 'ck_logs_duration',  'workout_logs',         'CHECK'
    UNION ALL SELECT 'ck_logs_calories',  'workout_logs',         'CHECK'
    UNION ALL SELECT 'ck_logs_rating',    'workout_logs',         'CHECK'
),
idx(name, tbl) AS (
              SELECT 'ix_sub_member',      'member_subscriptions'
    UNION ALL SELECT 'ix_sub_end',         'member_subscriptions'
    UNION ALL SELECT 'ix_wp_member',       'workout_plans'
    UNION ALL SELECT 'ix_wpi_plan',        'workout_plan_items'
    UNION ALL SELECT 'ix_ws_member_time',  'workout_schedules'
    UNION ALL SELECT 'ix_ws_trainer_time', 'workout_schedules'
    UNION ALL SELECT 'ix_ws_status_time',  'workout_schedules'
    UNION ALL SELECT 'ix_logs_member',     'workout_logs'
)
SELECT 'bảng', t.tbl,
       IF(EXISTS (SELECT 1 FROM information_schema.TABLES x
                  WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = t.tbl AND x.ENGINE = 'InnoDB'), 'PASS', 'FAIL')
FROM (SELECT DISTINCT tbl FROM cols) t
UNION ALL
SELECT 'cột', CONCAT(c.tbl, '.', c.col, IF(c.nullable = 'NO', ' (NOT NULL)', '')),
       IF(EXISTS (SELECT 1 FROM information_schema.COLUMNS x
                  WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = c.tbl
                    AND x.COLUMN_NAME = c.col AND x.IS_NULLABLE = c.nullable), 'PASS', 'FAIL')
FROM cols c
UNION ALL
SELECT 'khoá ngoại', CONCAT(f.name, ' → ', f.ref_tbl, ' ON DELETE ', f.on_delete),
       IF(EXISTS (SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS x
                  WHERE x.CONSTRAINT_SCHEMA = DATABASE() AND x.CONSTRAINT_NAME = f.name
                    AND x.TABLE_NAME = f.tbl AND x.REFERENCED_TABLE_NAME = f.ref_tbl
                    AND x.DELETE_RULE = f.on_delete), 'PASS', 'FAIL')
FROM fks f
UNION ALL
SELECT LOWER(k.kind), CONCAT(k.tbl, '.', k.name),
       IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS x
                  WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = k.tbl
                    AND x.CONSTRAINT_NAME = k.name AND x.CONSTRAINT_TYPE = k.kind
                    AND x.ENFORCED = 'YES'), 'PASS', 'FAIL')
FROM cons k
UNION ALL
SELECT 'index', CONCAT(i.tbl, '.', i.name),
       IF(EXISTS (SELECT 1 FROM information_schema.STATISTICS x
                  WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = i.tbl AND x.INDEX_NAME = i.name), 'PASS', 'FAIL')
FROM idx i
UNION ALL
SELECT 'view', 'v_subscription_status tồn tại',
       IF(EXISTS (SELECT 1 FROM information_schema.VIEWS x
                  WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = 'v_subscription_status'), 'PASS', 'FAIL')
UNION ALL
SELECT 'view', 'có cột computed_status, days_left',
       IF((SELECT COUNT(*) FROM information_schema.COLUMNS x
           WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = 'v_subscription_status'
             AND x.COLUMN_NAME IN ('computed_status', 'days_left')) = 2, 'PASS', 'FAIL')
UNION ALL
-- View dùng CURRENT_DATE của MySQL; backend dùng giờ Asia/Ho_Chi_Minh. Hai bên phải cùng một ngày,
-- nếu không thì 00:00–07:00 view sẽ lệch trạng thái so với API.
SELECT 'múi giờ', 'CURRENT_DATE của MySQL = ngày giờ Việt Nam (+07:00)',
       IF(CURRENT_DATE = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00')), 'PASS', 'FAIL');

-- ---------------------------------------------------------------- Phần B: hành vi view (rollback)
SET @m := (SELECT MIN(id) FROM members);

START TRANSACTION;

INSERT INTO membership_plans (name, price, duration_days, active)
SELECT 'TEST-132 view check', 0, 30, FALSE FROM DUAL WHERE @m IS NOT NULL;
SET @p := LAST_INSERT_ID();

-- Ngưỡng "sắp hết hạn" là 7 ngày, giống MemberSubscription.EXPIRING_DAYS
INSERT INTO member_subscriptions (member_id, plan_id, start_date, end_date, price_paid, cancelled, note)
SELECT @m, @p, DATE_ADD(CURRENT_DATE, INTERVAL s DAY), DATE_ADD(CURRENT_DATE, INTERVAL e DAY), 0, c, CONCAT('TEST-132 ', ca)
FROM (          SELECT 'huỷ'              AS ca,  -5 AS s,  20 AS e, TRUE  AS c
      UNION ALL SELECT 'chưa bắt đầu',             3,      30,      FALSE
      UNION ALL SELECT 'hết hạn hôm qua',        -40,      -1,      FALSE
      UNION ALL SELECT 'kết thúc hôm nay',       -10,       0,      FALSE
      UNION ALL SELECT 'còn 7 ngày',             -20,       7,      FALSE
      UNION ALL SELECT 'còn 8 ngày',             -10,       8,      FALSE) d
WHERE @m IS NOT NULL;

INSERT INTO scrum132_result (nhom, kiem_tra, ket_qua)
SELECT 'view', CONCAT(e.ca, ' → ', e.st, ', days_left = ', e.dl),
       IF(v.computed_status = e.st AND v.days_left = e.dl, 'PASS',
          CONCAT('FAIL: ', COALESCE(v.computed_status, 'không có dòng')))
FROM (          SELECT 'huỷ'              AS ca, 'CANCELLED' AS st, 20 AS dl
      UNION ALL SELECT 'chưa bắt đầu',            'UPCOMING',        30
      UNION ALL SELECT 'hết hạn hôm qua',         'EXPIRED',         -1
      UNION ALL SELECT 'kết thúc hôm nay',        'EXPIRING',         0
      UNION ALL SELECT 'còn 7 ngày',              'EXPIRING',         7
      UNION ALL SELECT 'còn 8 ngày',              'ACTIVE',           8) e
LEFT JOIN v_subscription_status v
       ON v.member_id = @m AND v.plan_id = @p AND v.note = CONCAT('TEST-132 ', e.ca);

ROLLBACK;

INSERT INTO scrum132_result (nhom, kiem_tra, ket_qua)
SELECT 'dọn dẹp', 'ROLLBACK: không còn dữ liệu TEST-132',
       IF((SELECT COUNT(*) FROM membership_plans WHERE name = 'TEST-132 view check') = 0
          AND (SELECT COUNT(*) FROM member_subscriptions WHERE note LIKE 'TEST-132 %') = 0, 'PASS', 'FAIL');

-- ---------------------------------------------------------------- Kết quả
SELECT nhom, kiem_tra, ket_qua FROM scrum132_result ORDER BY stt;
SELECT CONCAT(SUM(ket_qua = 'PASS'), '/', COUNT(*), IF(SUM(ket_qua <> 'PASS') = 0, ' PASS', ' FAIL')) AS `TỔNG SCRUM-132`
FROM scrum132_result;

DROP TEMPORARY TABLE scrum132_result;
