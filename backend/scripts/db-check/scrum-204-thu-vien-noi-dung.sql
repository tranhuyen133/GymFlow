-- =====================================================================
-- SCRUM-204 · Kiểm tra migration V2, V3: nguồn nội dung, bài viết, cột duyệt (SRS 8.6, 8.7)
-- Người phụ trách: Nguyễn Thế Kiên
-- Phần A chỉ đọc information_schema và flyway_schema_history.
-- Phần B chỉ đọc dữ liệu mẫu V3 và các luật duyệt nội dung.
-- Phần C chèn 1 bài tập + 1 bài viết thử trong MỘT transaction rồi ROLLBACK: không để lại dữ liệu
-- (chỉ tiêu tốn vài giá trị AUTO_INCREMENT). Nếu script lỗi giữa chừng, phiên đóng lại cũng tự rollback.
--   mysql -t -u<user> -p <database> < scrum-204-thu-vien-noi-dung.sql
-- =====================================================================

CREATE TEMPORARY TABLE scrum204_result (
    stt      INT AUTO_INCREMENT PRIMARY KEY,
    nhom     VARCHAR(20),
    kiem_tra VARCHAR(120),
    ket_qua  VARCHAR(40)
) ENGINE = MEMORY;   -- MEMORY: không bị ROLLBACK ở phần C xoá mất kết quả

-- ---------------------------------------------------------------- Phần A: lược đồ
INSERT INTO scrum204_result (nhom, kiem_tra, ket_qua)
WITH
cols(tbl, col, nullable) AS (
              SELECT 'content_sources', 'id', 'NO'
    UNION ALL SELECT 'content_sources', 'code', 'NO'
    UNION ALL SELECT 'content_sources', 'publisher', 'NO'
    UNION ALL SELECT 'content_sources', 'title', 'NO'
    UNION ALL SELECT 'content_sources', 'url', 'NO'
    UNION ALL SELECT 'content_sources', 'license', 'YES'
    UNION ALL SELECT 'content_sources', 'license_url', 'YES'
    UNION ALL SELECT 'content_sources', 'license_verified', 'NO'
    UNION ALL SELECT 'content_sources', 'attribution', 'YES'
    UNION ALL SELECT 'content_sources', 'publisher_reviewed', 'YES'
    UNION ALL SELECT 'content_sources', 'accessed_at', 'NO'
    UNION ALL SELECT 'content_sources', 'created_at', 'NO'
    UNION ALL SELECT 'exercises', 'name_en', 'YES'
    UNION ALL SELECT 'exercises', 'aliases', 'YES'
    UNION ALL SELECT 'exercises', 'secondary_muscles', 'YES'
    UNION ALL SELECT 'exercises', 'location', 'YES'
    UNION ALL SELECT 'exercises', 'goals', 'YES'
    UNION ALL SELECT 'exercises', 'breathing', 'YES'
    UNION ALL SELECT 'exercises', 'common_mistakes', 'YES'
    UNION ALL SELECT 'exercises', 'safety_notes', 'YES'
    UNION ALL SELECT 'exercises', 'variations', 'YES'
    UNION ALL SELECT 'exercises', 'suggested_dose', 'YES'
    UNION ALL SELECT 'exercises', 'content_origin', 'NO'
    UNION ALL SELECT 'exercises', 'review_status', 'NO'
    UNION ALL SELECT 'exercises', 'review_note', 'YES'
    UNION ALL SELECT 'exercises', 'reviewed_by', 'YES'
    UNION ALL SELECT 'exercises', 'reviewed_at', 'YES'
    UNION ALL SELECT 'exercises', 'updated_at', 'YES'
    UNION ALL SELECT 'exercise_sources', 'exercise_id', 'NO'
    UNION ALL SELECT 'exercise_sources', 'source_id', 'NO'
    UNION ALL SELECT 'articles', 'id', 'NO'
    UNION ALL SELECT 'articles', 'slug', 'NO'
    UNION ALL SELECT 'articles', 'title', 'NO'
    UNION ALL SELECT 'articles', 'category', 'NO'
    UNION ALL SELECT 'articles', 'summary', 'NO'
    UNION ALL SELECT 'articles', 'body', 'NO'
    UNION ALL SELECT 'articles', 'content_origin', 'NO'
    UNION ALL SELECT 'articles', 'status', 'NO'
    UNION ALL SELECT 'articles', 'review_note', 'YES'
    UNION ALL SELECT 'articles', 'author_id', 'YES'
    UNION ALL SELECT 'articles', 'reviewed_by', 'YES'
    UNION ALL SELECT 'articles', 'reviewed_at', 'YES'
    UNION ALL SELECT 'articles', 'published_at', 'YES'
    UNION ALL SELECT 'articles', 'created_at', 'NO'
    UNION ALL SELECT 'articles', 'updated_at', 'YES'
    UNION ALL SELECT 'article_sources', 'article_id', 'NO'
    UNION ALL SELECT 'article_sources', 'source_id', 'NO'
),
defs(tbl, col, def) AS (
              SELECT 'exercises', 'content_origin', 'SELF_AUTHORED'
    UNION ALL SELECT 'exercises', 'review_status', 'PENDING'
    UNION ALL SELECT 'articles', 'content_origin', 'SELF_AUTHORED'
    UNION ALL SELECT 'articles', 'status', 'DRAFT'
    UNION ALL SELECT 'content_sources', 'license_verified', '0'
),
fks(name, tbl, ref_tbl, on_delete) AS (
              SELECT 'fk_ex_reviewed_by',   'exercises',        'users',           'SET NULL'
    UNION ALL SELECT 'fk_exsrc_exercise',   'exercise_sources', 'exercises',       'CASCADE'
    UNION ALL SELECT 'fk_exsrc_source',     'exercise_sources', 'content_sources', 'RESTRICT'
    UNION ALL SELECT 'fk_article_author',   'articles',         'users',           'SET NULL'
    UNION ALL SELECT 'fk_article_reviewer', 'articles',         'users',           'SET NULL'
    UNION ALL SELECT 'fk_artsrc_article',   'article_sources',  'articles',        'CASCADE'
    UNION ALL SELECT 'fk_artsrc_source',    'article_sources',  'content_sources', 'RESTRICT'
),
cons(name, tbl, kind) AS (
              SELECT 'uq_source_code',      'content_sources', 'UNIQUE'
    UNION ALL SELECT 'uq_article_slug',     'articles',        'UNIQUE'
    UNION ALL SELECT 'ck_source_url',       'content_sources', 'CHECK'
    UNION ALL SELECT 'ck_ex_location',      'exercises',       'CHECK'
    UNION ALL SELECT 'ck_ex_origin',        'exercises',       'CHECK'
    UNION ALL SELECT 'ck_ex_review',        'exercises',       'CHECK'
    UNION ALL SELECT 'ck_article_slug',     'articles',        'CHECK'
    UNION ALL SELECT 'ck_article_category', 'articles',        'CHECK'
    UNION ALL SELECT 'ck_article_origin',   'articles',        'CHECK'
    UNION ALL SELECT 'ck_article_status',   'articles',        'CHECK'
),
-- Giá trị bắt buộc phải xuất hiện trong mệnh đề CHECK
ckv(name, val) AS (
              SELECT 'ck_source_url', 'https://'
    UNION ALL SELECT 'ck_ex_review', 'NEEDS_REVIEW'
    UNION ALL SELECT 'ck_ex_review', 'APPROVED'
    UNION ALL SELECT 'ck_article_status', 'PUBLISHED'
    UNION ALL SELECT 'ck_article_status', 'ARCHIVED'
    UNION ALL SELECT 'ck_article_category', 'RECOVERY'
),
idx(name, tbl) AS (
              SELECT 'ix_ex_review',      'exercises'
    UNION ALL SELECT 'ix_article_status', 'articles'
)
SELECT 'bảng', t.tbl,
       IF(EXISTS (SELECT 1 FROM information_schema.TABLES x
                  WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = t.tbl AND x.ENGINE = 'InnoDB'
                    AND x.TABLE_COLLATION LIKE 'utf8mb4%'), 'PASS', 'FAIL')
FROM (SELECT 'content_sources' AS tbl UNION ALL SELECT 'exercise_sources'
      UNION ALL SELECT 'articles' UNION ALL SELECT 'article_sources') t
UNION ALL
SELECT 'cột', CONCAT(c.tbl, '.', c.col, IF(c.nullable = 'NO', ' (NOT NULL)', '')),
       IF(EXISTS (SELECT 1 FROM information_schema.COLUMNS x
                  WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = c.tbl
                    AND x.COLUMN_NAME = c.col AND x.IS_NULLABLE = c.nullable), 'PASS', 'FAIL')
FROM cols c
UNION ALL
SELECT 'mặc định', CONCAT(d.tbl, '.', d.col, ' = ', d.def),
       IF(EXISTS (SELECT 1 FROM information_schema.COLUMNS x
                  WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = d.tbl
                    AND x.COLUMN_NAME = d.col AND x.COLUMN_DEFAULT = d.def), 'PASS', 'FAIL')
FROM defs d
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
SELECT 'check', CONCAT(v.name, ' có ', v.val),
       IF(EXISTS (SELECT 1 FROM information_schema.CHECK_CONSTRAINTS x
                  WHERE x.CONSTRAINT_SCHEMA = DATABASE() AND x.CONSTRAINT_NAME = v.name
                    AND x.CHECK_CLAUSE LIKE CONCAT('%', v.val, '%')), 'PASS', 'FAIL')
FROM ckv v
UNION ALL
SELECT 'index', CONCAT(i.tbl, '.', i.name),
       IF(EXISTS (SELECT 1 FROM information_schema.STATISTICS x
                  WHERE x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = i.tbl AND x.INDEX_NAME = i.name), 'PASS', 'FAIL')
FROM idx i
UNION ALL
SELECT 'flyway', CONCAT('V', h.v, ' ', h.script, ' đã chạy thành công'),
       IF(EXISTS (SELECT 1 FROM flyway_schema_history x
                  WHERE x.version = h.v AND x.script = h.script AND x.success = 1), 'PASS', 'FAIL')
FROM (          SELECT '1' AS v, 'V1__init_schema.sql' AS script
      UNION ALL SELECT '2', 'V2__content_library.sql'
      UNION ALL SELECT '3', 'V3__seed_content_library.sql') h
UNION ALL
-- "Không sửa V1": V2, V3 phải chạy SAU V1 (thêm file mới chứ không viết lại lược đồ cũ)
SELECT 'flyway', 'thứ tự chạy V1 → V2 → V3, không có bản ghi lỗi',
       IF((SELECT GROUP_CONCAT(version ORDER BY installed_rank) FROM flyway_schema_history
           WHERE version IN ('1', '2', '3')) = '1,2,3'
          AND (SELECT COUNT(*) FROM flyway_schema_history WHERE success = 0) = 0, 'PASS', 'FAIL');

-- ---------------------------------------------------------------- Phần B: dữ liệu mẫu V3 và luật duyệt
INSERT INTO scrum204_result (nhom, kiem_tra, ket_qua)
SELECT 'nguồn', CONCAT('có nguồn ', s.code),
       IF(EXISTS (SELECT 1 FROM content_sources x WHERE x.code = s.code), 'PASS', 'FAIL')
FROM (          SELECT 'NHS_STRENGTH' AS code UNION ALL SELECT 'NHS_BALANCE' UNION ALL SELECT 'NHS_SITTING'
      UNION ALL SELECT 'NHS_FLEX' UNION ALL SELECT 'NHS_WARMUP' UNION ALL SELECT 'NHS_STRETCH'
      UNION ALL SELECT 'NHS_WALKING' UNION ALL SELECT 'NHS_PA_ADULTS' UNION ALL SELECT 'NHS_EATWELL'
      UNION ALL SELECT 'NHS_WATER' UNION ALL SELECT 'NHS_SLEEP' UNION ALL SELECT 'WHO_PA_2020') s
UNION ALL
SELECT 'nguồn', 'nguồn đã xác minh giấy phép đều có link giấy phép và câu ghi công',
       IF((SELECT COUNT(*) FROM content_sources
           WHERE license_verified AND (license_url IS NULL OR attribution IS NULL)) = 0, 'PASS', 'FAIL')
UNION ALL
SELECT 'nguồn', 'WHO_PA_2020 ghi rõ giấy phép CHƯA xác minh',
       IF((SELECT license_verified FROM content_sources WHERE code = 'WHO_PA_2020') = FALSE, 'PASS', 'FAIL')
UNION ALL
SELECT 'nguồn', 'ngày truy cập không ở tương lai',
       IF((SELECT COUNT(*) FROM content_sources WHERE accessed_at > CURRENT_DATE) = 0, 'PASS', 'FAIL')
UNION ALL
SELECT 'bài viết', CONCAT('có bài ', a.slug),
       IF(EXISTS (SELECT 1 FROM articles x WHERE x.slug = a.slug), 'PASS', 'FAIL')
FROM (          SELECT 'dia-an-can-bang' AS slug UNION ALL SELECT 'uong-du-nuoc' UNION ALL SELECT 'ngu-ngon-hon'
      UNION ALL SELECT 'khoi-dong-truoc-tap' UNION ALL SELECT 'gian-co-sau-tap'
      UNION ALL SELECT 'van-dong-bao-nhieu-la-du') a
UNION ALL
SELECT 'bài viết', 'đủ 5 chủ đề (dinh dưỡng, nước, ngủ, vận động, hồi phục)',
       IF((SELECT COUNT(DISTINCT category) FROM articles) = 5, 'PASS', 'FAIL')
UNION ALL
SELECT 'luật duyệt', 'bài tập ADAPTED đều có ít nhất 1 nguồn',
       IF((SELECT COUNT(*) FROM exercises e WHERE e.content_origin = 'ADAPTED'
             AND NOT EXISTS (SELECT 1 FROM exercise_sources x WHERE x.exercise_id = e.id)) = 0, 'PASS', 'FAIL')
UNION ALL
SELECT 'luật duyệt', 'bài viết ADAPTED đều có ít nhất 1 nguồn',
       IF((SELECT COUNT(*) FROM articles a WHERE a.content_origin = 'ADAPTED'
             AND NOT EXISTS (SELECT 1 FROM article_sources x WHERE x.article_id = a.id)) = 0, 'PASS', 'FAIL')
UNION ALL
SELECT 'luật duyệt', 'bài tập APPROVED đều có nguồn và thời điểm duyệt',
       IF((SELECT COUNT(*) FROM exercises e WHERE e.review_status = 'APPROVED'
             AND (e.reviewed_at IS NULL
                  OR NOT EXISTS (SELECT 1 FROM exercise_sources x WHERE x.exercise_id = e.id))) = 0, 'PASS', 'FAIL')
UNION ALL
SELECT 'luật duyệt', 'bài viết PUBLISHED đều có nguồn và ngày xuất bản',
       IF((SELECT COUNT(*) FROM articles a WHERE a.status = 'PUBLISHED'
             AND (a.published_at IS NULL
                  OR NOT EXISTS (SELECT 1 FROM article_sources x WHERE x.article_id = a.id))) = 0, 'PASS', 'FAIL')
UNION ALL
SELECT 'luật duyệt', 'bài tập NEEDS_REVIEW đều có ghi chú cần sửa',
       IF((SELECT COUNT(*) FROM exercises WHERE review_status = 'NEEDS_REVIEW'
             AND (review_note IS NULL OR TRIM(review_note) = '')) = 0, 'PASS', 'FAIL');

-- ---------------------------------------------------------------- Phần C: hành vi (rollback)
START TRANSACTION;

INSERT INTO exercises (name, muscle_group, level, hidden, created_at)
VALUES ('TEST-204 mặc định', 'CORE', 'BEGINNER', FALSE, NOW(6));
SET @e := LAST_INSERT_ID();
INSERT INTO exercise_sources (exercise_id, source_id)
SELECT @e, id FROM content_sources WHERE code = 'NHS_STRENGTH';

INSERT INTO articles (slug, title, category, summary, body)
VALUES ('test-204-mac-dinh', 'TEST-204', 'SLEEP', 'TEST-204', 'TEST-204');
SET @a := LAST_INSERT_ID();

INSERT INTO scrum204_result (nhom, kiem_tra, ket_qua)
SELECT 'hành vi', 'bài tập mới: SELF_AUTHORED, PENDING, chưa có người duyệt',
       IF(content_origin = 'SELF_AUTHORED' AND review_status = 'PENDING' AND reviewed_by IS NULL
          AND reviewed_at IS NULL, 'PASS', CONCAT('FAIL: ', content_origin, '/', review_status))
FROM exercises WHERE id = @e
UNION ALL
SELECT 'hành vi', 'bài viết mới: SELF_AUTHORED, DRAFT, chưa xuất bản',
       IF(content_origin = 'SELF_AUTHORED' AND status = 'DRAFT' AND published_at IS NULL,
          'PASS', CONCAT('FAIL: ', content_origin, '/', status))
FROM articles WHERE id = @a
UNION ALL
SELECT 'hành vi', 'gắn nguồn cho bài tập mới',
       IF((SELECT COUNT(*) FROM exercise_sources WHERE exercise_id = @e) = 1, 'PASS', 'FAIL');

DELETE FROM exercises WHERE id = @e;
INSERT INTO scrum204_result (nhom, kiem_tra, ket_qua)
SELECT 'hành vi', 'xoá bài tập thì liên kết nguồn tự xoá (CASCADE), nguồn vẫn còn',
       IF((SELECT COUNT(*) FROM exercise_sources WHERE exercise_id = @e) = 0
          AND EXISTS (SELECT 1 FROM content_sources WHERE code = 'NHS_STRENGTH'), 'PASS', 'FAIL');

ROLLBACK;

INSERT INTO scrum204_result (nhom, kiem_tra, ket_qua)
SELECT 'dọn dẹp', 'ROLLBACK: không còn dữ liệu TEST-204',
       IF((SELECT COUNT(*) FROM exercises WHERE name LIKE 'TEST-204%') = 0
          AND (SELECT COUNT(*) FROM articles WHERE slug = 'test-204-mac-dinh') = 0, 'PASS', 'FAIL');

-- ---------------------------------------------------------------- Kết quả
SELECT nhom, kiem_tra, ket_qua FROM scrum204_result ORDER BY stt;
SELECT CONCAT(SUM(ket_qua = 'PASS'), '/', COUNT(*), IF(SUM(ket_qua <> 'PASS') = 0, ' PASS', ' FAIL')) AS `TỔNG SCRUM-204`
FROM scrum204_result;

DROP TEMPORARY TABLE scrum204_result;
