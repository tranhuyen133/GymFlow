-- =====================================================================
-- SCRUM-131 · Kiểm tra lược đồ: trainers, trainer_shifts, members, weight_records (SRS 8.4)
-- Người phụ trách: Nguyễn Thế Kiên
-- Chỉ đọc information_schema, không ghi dữ liệu. Chạy sau khi Flyway đã áp dụng V1.
--   mysql -t -u<user> -p <database> < scrum-131-hoi-vien-hlv.sql
-- Mỗi dòng in PASS/FAIL; dòng cuối là tổng số kiểm tra đạt.
-- =====================================================================

WITH
cols(tbl, col, nullable) AS (
              SELECT 'trainers', 'id', 'NO'
    UNION ALL SELECT 'trainers', 'user_id', 'NO'
    UNION ALL SELECT 'trainers', 'specialty', 'YES'
    UNION ALL SELECT 'trainers', 'experience_years', 'NO'
    UNION ALL SELECT 'trainers', 'certificates', 'YES'
    UNION ALL SELECT 'trainers', 'bio', 'YES'
    UNION ALL SELECT 'trainers', 'active', 'NO'
    UNION ALL SELECT 'trainer_shifts', 'id', 'NO'
    UNION ALL SELECT 'trainer_shifts', 'trainer_id', 'NO'
    UNION ALL SELECT 'trainer_shifts', 'day_of_week', 'NO'
    UNION ALL SELECT 'trainer_shifts', 'start_time', 'NO'
    UNION ALL SELECT 'trainer_shifts', 'end_time', 'NO'
    UNION ALL SELECT 'members', 'id', 'NO'
    UNION ALL SELECT 'members', 'user_id', 'NO'
    UNION ALL SELECT 'members', 'code', 'NO'
    UNION ALL SELECT 'members', 'date_of_birth', 'YES'
    UNION ALL SELECT 'members', 'gender', 'YES'
    UNION ALL SELECT 'members', 'height_cm', 'YES'
    UNION ALL SELECT 'members', 'goal', 'YES'
    UNION ALL SELECT 'members', 'address', 'YES'
    UNION ALL SELECT 'members', 'status', 'NO'
    UNION ALL SELECT 'members', 'trainer_id', 'YES'
    UNION ALL SELECT 'members', 'joined_at', 'NO'
    UNION ALL SELECT 'members', 'note', 'YES'
    UNION ALL SELECT 'weight_records', 'id', 'NO'
    UNION ALL SELECT 'weight_records', 'member_id', 'NO'
    UNION ALL SELECT 'weight_records', 'recorded_date', 'NO'
    UNION ALL SELECT 'weight_records', 'weight_kg', 'NO'
    UNION ALL SELECT 'weight_records', 'body_fat', 'YES'
    UNION ALL SELECT 'weight_records', 'note', 'YES'
    UNION ALL SELECT 'weight_records', 'created_at', 'NO'
),
fks(name, tbl, ref_tbl, on_delete) AS (
              SELECT 'fk_trainers_user',   'trainers',       'users',    'CASCADE'
    UNION ALL SELECT 'fk_shifts_trainer',  'trainer_shifts', 'trainers', 'CASCADE'
    UNION ALL SELECT 'fk_members_user',    'members',        'users',    'CASCADE'
    UNION ALL SELECT 'fk_members_trainer', 'members',        'trainers', 'SET NULL'
    UNION ALL SELECT 'fk_weight_member',   'weight_records', 'members',  'CASCADE'
),
cons(name, tbl, kind) AS (
              SELECT 'uq_trainers_user',     'trainers',       'UNIQUE'
    UNION ALL SELECT 'uq_members_user',      'members',        'UNIQUE'
    UNION ALL SELECT 'uq_members_code',      'members',        'UNIQUE'
    UNION ALL SELECT 'uq_weight_member_day', 'weight_records', 'UNIQUE'
    UNION ALL SELECT 'ck_trainers_exp',      'trainers',       'CHECK'
    UNION ALL SELECT 'ck_shift_day',         'trainer_shifts', 'CHECK'
    UNION ALL SELECT 'ck_shift_time',        'trainer_shifts', 'CHECK'
    UNION ALL SELECT 'ck_members_gender',    'members',        'CHECK'
    UNION ALL SELECT 'ck_members_height',    'members',        'CHECK'
    UNION ALL SELECT 'ck_members_status',    'members',        'CHECK'
    UNION ALL SELECT 'ck_members_dob',       'members',        'CHECK'
    UNION ALL SELECT 'ck_weight_range',      'weight_records', 'CHECK'
    UNION ALL SELECT 'ck_body_fat_range',    'weight_records', 'CHECK'
),
idx(name, tbl) AS (
              SELECT 'ix_shifts_trainer',  'trainer_shifts'
    UNION ALL SELECT 'ix_members_trainer', 'members'
    UNION ALL SELECT 'ix_members_status',  'members'
),
checks(nhom, kiem_tra, ket_qua) AS (
    -- 1. Bảng tồn tại và dùng InnoDB (cần cho khoá ngoại và khoá dòng)
    SELECT 'bảng', t.tbl,
           IF(EXISTS (SELECT 1 FROM information_schema.TABLES x
                      WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = t.tbl AND x.ENGINE = 'InnoDB'),
              'PASS', 'FAIL')
    FROM (SELECT DISTINCT tbl FROM cols) t

    -- 2. Cột tồn tại, đúng NULL / NOT NULL như V1
    UNION ALL
    SELECT 'cột', CONCAT(c.tbl, '.', c.col, IF(c.nullable = 'NO', ' (NOT NULL)', '')),
           IF(EXISTS (SELECT 1 FROM information_schema.COLUMNS x
                      WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = c.tbl
                        AND x.COLUMN_NAME = c.col AND x.IS_NULLABLE = c.nullable),
              'PASS', 'FAIL')
    FROM cols c

    -- 3. Khoá ngoại trỏ đúng bảng và đúng hành vi khi xoá
    UNION ALL
    SELECT 'khoá ngoại', CONCAT(f.name, ' → ', f.ref_tbl, ' ON DELETE ', f.on_delete),
           IF(EXISTS (SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS x
                      WHERE x.CONSTRAINT_SCHEMA = DATABASE() AND x.CONSTRAINT_NAME = f.name
                        AND x.TABLE_NAME = f.tbl AND x.REFERENCED_TABLE_NAME = f.ref_tbl
                        AND x.DELETE_RULE = f.on_delete),
              'PASS', 'FAIL')
    FROM fks f

    -- 4. UNIQUE và CHECK (CHECK phải đang được thực thi)
    UNION ALL
    SELECT LOWER(k.kind), CONCAT(k.tbl, '.', k.name),
           IF(EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS x
                      WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = k.tbl
                        AND x.CONSTRAINT_NAME = k.name AND x.CONSTRAINT_TYPE = k.kind
                        AND x.ENFORCED = 'YES'),
              'PASS', 'FAIL')
    FROM cons k

    -- 5. Index phục vụ lọc theo HLV, trạng thái, ca làm theo thứ
    UNION ALL
    SELECT 'index', CONCAT(i.tbl, '.', i.name),
           IF(EXISTS (SELECT 1 FROM information_schema.STATISTICS x
                      WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = i.tbl AND x.INDEX_NAME = i.name),
              'PASS', 'FAIL')
    FROM idx i

    -- 6. Mỗi hội viên chỉ một bản ghi cân nặng mỗi ngày (BR-10): unique gồm đúng 2 cột member_id, recorded_date
    UNION ALL
    SELECT 'nghiệp vụ', 'uq_weight_member_day = (member_id, recorded_date)',
           IF((SELECT GROUP_CONCAT(x.COLUMN_NAME ORDER BY x.SEQ_IN_INDEX)
               FROM information_schema.STATISTICS x
               WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = 'weight_records'
                 AND x.INDEX_NAME = 'uq_weight_member_day') = 'member_id,recorded_date',
              'PASS', 'FAIL')
)
SELECT nhom, kiem_tra, ket_qua FROM checks
UNION ALL
SELECT '==', 'TỔNG SCRUM-131', CONCAT(SUM(ket_qua = 'PASS'), '/', COUNT(*), IF(SUM(ket_qua = 'FAIL') = 0, ' PASS', ' FAIL'))
FROM checks;
