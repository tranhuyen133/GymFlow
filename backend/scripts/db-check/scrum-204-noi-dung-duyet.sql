-- =====================================================================
-- SCRUM-204 · Kiểm tra migration V2 + V3: nguồn nội dung, bài viết, cột duyệt bài tập
-- Đối chiếu SRS mục 8.6 (exercises – các cột [V2]) và 8.7 (content_sources, articles,
-- exercise_sources, article_sources). V1 không bị sửa: Flyway sẽ báo lệch checksum nếu có.
--
-- Chạy (máy local):
--   docker compose exec -T mysql sh -c 'mysql -t -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < backend/scripts/db-check/scrum-204-noi-dung-duyet.sql
--
-- An toàn: phần thử hành vi chạy trong một giao dịch và ROLLBACK ở cuối; dữ liệu thử có mã TEST-204.
-- Thủ tục tạm gf_t204_try được tạo trước giao dịch và xoá ở cuối script.
-- =====================================================================
SET NAMES utf8mb4;

DROP TEMPORARY TABLE IF EXISTS t204;
CREATE TEMPORARY TABLE t204 (
    n        INT AUTO_INCREMENT PRIMARY KEY,
    nhom     VARCHAR(20),
    kiem_tra VARCHAR(170),
    ket_qua  VARCHAR(4)
-- MEMORY không theo giao dịch: kết quả ghi trong lúc thử vẫn còn sau ROLLBACK
) ENGINE = MEMORY DEFAULT CHARSET = utf8mb4;

-- ---------- Flyway ----------
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'flyway', CONCAT('V', x.v, ' đã chạy thành công'),
       IF(EXISTS (SELECT 1 FROM flyway_schema_history h WHERE h.version = x.v AND h.success = 1), 'PASS', 'FAIL')
FROM (VALUES ROW('1'), ROW('2'), ROW('3')) AS x (v);

-- ---------- Bảng ----------
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'bảng', x.t,
       IF(EXISTS (SELECT 1 FROM information_schema.tables s WHERE s.table_schema = DATABASE() AND s.table_name = x.t), 'PASS', 'FAIL')
FROM (VALUES ROW('content_sources'), ROW('exercise_sources'), ROW('articles'), ROW('article_sources')) AS x (t);

-- ---------- Cột (nn = 'NO' nghĩa là phải NOT NULL; 'ANY' chỉ cần tồn tại) ----------
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'cột', CONCAT(x.t, '.', x.c, IF(x.nn = 'NO', ' (NOT NULL)', '')),
       IF(EXISTS (SELECT 1 FROM information_schema.columns c
                  WHERE c.table_schema = DATABASE() AND c.table_name = x.t AND c.column_name = x.c
                    AND (x.nn = 'ANY' OR c.is_nullable = 'NO')), 'PASS', 'FAIL')
FROM (VALUES
    ROW('content_sources', 'id', 'NO'), ROW('content_sources', 'code', 'NO'), ROW('content_sources', 'publisher', 'NO'),
    ROW('content_sources', 'title', 'NO'), ROW('content_sources', 'url', 'NO'), ROW('content_sources', 'license', 'ANY'),
    ROW('content_sources', 'license_url', 'ANY'), ROW('content_sources', 'license_verified', 'NO'),
    ROW('content_sources', 'attribution', 'ANY'), ROW('content_sources', 'publisher_reviewed', 'ANY'),
    ROW('content_sources', 'accessed_at', 'NO'), ROW('content_sources', 'created_at', 'NO'),
    ROW('exercises', 'name_en', 'ANY'), ROW('exercises', 'aliases', 'ANY'), ROW('exercises', 'secondary_muscles', 'ANY'),
    ROW('exercises', 'location', 'ANY'), ROW('exercises', 'goals', 'ANY'), ROW('exercises', 'breathing', 'ANY'),
    ROW('exercises', 'common_mistakes', 'ANY'), ROW('exercises', 'safety_notes', 'ANY'), ROW('exercises', 'variations', 'ANY'),
    ROW('exercises', 'suggested_dose', 'ANY'), ROW('exercises', 'content_origin', 'NO'), ROW('exercises', 'review_status', 'NO'),
    ROW('exercises', 'review_note', 'ANY'), ROW('exercises', 'reviewed_by', 'ANY'), ROW('exercises', 'reviewed_at', 'ANY'),
    ROW('exercises', 'updated_at', 'ANY'),
    ROW('exercise_sources', 'exercise_id', 'NO'), ROW('exercise_sources', 'source_id', 'NO'),
    ROW('articles', 'id', 'NO'), ROW('articles', 'slug', 'NO'), ROW('articles', 'title', 'NO'), ROW('articles', 'category', 'NO'),
    ROW('articles', 'summary', 'NO'), ROW('articles', 'body', 'NO'), ROW('articles', 'content_origin', 'NO'),
    ROW('articles', 'status', 'NO'), ROW('articles', 'review_note', 'ANY'), ROW('articles', 'author_id', 'ANY'),
    ROW('articles', 'reviewed_by', 'ANY'), ROW('articles', 'reviewed_at', 'ANY'), ROW('articles', 'published_at', 'ANY'),
    ROW('articles', 'created_at', 'NO'), ROW('articles', 'updated_at', 'ANY'),
    ROW('article_sources', 'article_id', 'NO'), ROW('article_sources', 'source_id', 'NO')
) AS x (t, c, nn);

-- ---------- Giá trị mặc định ----------
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'mặc định', CONCAT(x.t, '.', x.c, ' = ', x.d),
       IF(EXISTS (SELECT 1 FROM information_schema.columns c
                  WHERE c.table_schema = DATABASE() AND c.table_name = x.t AND c.column_name = x.c
                    AND TRIM(BOTH '''' FROM c.column_default) = x.d), 'PASS', 'FAIL')
FROM (VALUES
    ROW('exercises', 'review_status', 'PENDING'), ROW('exercises', 'content_origin', 'SELF_AUTHORED'),
    ROW('articles', 'status', 'DRAFT'), ROW('articles', 'content_origin', 'SELF_AUTHORED'),
    ROW('content_sources', 'license_verified', '0')
) AS x (t, c, d);

-- ---------- Khoá ngoại và hành vi khi xoá ----------
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'khoá ngoại', CONCAT(x.fk, ' (', x.t, ' → ', x.ref, ') ON DELETE ', x.rule),
       IF(EXISTS (SELECT 1 FROM information_schema.referential_constraints r
                  WHERE r.constraint_schema = DATABASE() AND r.constraint_name = x.fk AND r.table_name = x.t
                    AND r.referenced_table_name = x.ref AND r.delete_rule = x.rule), 'PASS', 'FAIL')
FROM (VALUES
    ROW('fk_ex_reviewed_by', 'exercises', 'users', 'SET NULL'),
    ROW('fk_exsrc_exercise', 'exercise_sources', 'exercises', 'CASCADE'),
    ROW('fk_exsrc_source', 'exercise_sources', 'content_sources', 'RESTRICT'),
    ROW('fk_article_author', 'articles', 'users', 'SET NULL'),
    ROW('fk_article_reviewer', 'articles', 'users', 'SET NULL'),
    ROW('fk_artsrc_article', 'article_sources', 'articles', 'CASCADE'),
    ROW('fk_artsrc_source', 'article_sources', 'content_sources', 'RESTRICT')
) AS x (fk, t, ref, rule);

-- ---------- UNIQUE / khoá chính ghép ----------
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'unique', CONCAT(x.t, '.', x.k),
       IF(EXISTS (SELECT 1 FROM information_schema.table_constraints tc
                  WHERE tc.table_schema = DATABASE() AND tc.table_name = x.t AND tc.constraint_name = x.k
                    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')), 'PASS', 'FAIL')
FROM (VALUES ROW('content_sources', 'uq_source_code'), ROW('articles', 'uq_article_slug'),
             ROW('exercise_sources', 'PRIMARY'), ROW('article_sources', 'PRIMARY')) AS x (t, k);

INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'unique', CONCAT(x.t, ' PK ghép (', x.cols, ')'),
       IF((SELECT GROUP_CONCAT(k.column_name ORDER BY k.ordinal_position)
           FROM information_schema.key_column_usage k
           WHERE k.table_schema = DATABASE() AND k.table_name = x.t AND k.constraint_name = 'PRIMARY') = x.cols, 'PASS', 'FAIL')
FROM (VALUES ROW('exercise_sources', 'exercise_id,source_id'), ROW('article_sources', 'article_id,source_id')) AS x (t, cols);

-- ---------- CHECK ----------
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'check', CONCAT(x.t, '.', x.k),
       IF(EXISTS (SELECT 1 FROM information_schema.table_constraints tc
                  WHERE tc.table_schema = DATABASE() AND tc.table_name = x.t AND tc.constraint_name = x.k
                    AND tc.constraint_type = 'CHECK'), 'PASS', 'FAIL')
FROM (VALUES
    ROW('content_sources', 'ck_source_url'), ROW('content_sources', 'ck_source_license_url'),
    ROW('exercises', 'ck_ex_location'), ROW('exercises', 'ck_ex_origin'), ROW('exercises', 'ck_ex_review'),
    ROW('articles', 'ck_article_slug'), ROW('articles', 'ck_article_category'), ROW('articles', 'ck_article_origin'),
    ROW('articles', 'ck_article_status'), ROW('articles', 'ck_article_published')
) AS x (t, k);

-- ---------- Index ----------
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'index', CONCAT(x.t, '.', x.i, ' (', x.cols, ')'),
       IF((SELECT GROUP_CONCAT(st.column_name ORDER BY st.seq_in_index)
           FROM information_schema.statistics st
           WHERE st.table_schema = DATABASE() AND st.table_name = x.t AND st.index_name = x.i) = x.cols, 'PASS', 'FAIL')
FROM (VALUES ROW('exercises', 'ix_ex_review', 'review_status'),
             ROW('articles', 'ix_article_status', 'status,published_at')) AS x (t, i, cols);

-- ---------- Dữ liệu V3 ----------
INSERT INTO t204 (nhom, kiem_tra, ket_qua) VALUES
('dữ liệu V3', 'có ít nhất 8 nguồn nội dung',
 IF((SELECT COUNT(*) FROM content_sources) >= 8, 'PASS', 'FAIL')),
('dữ liệu V3', 'mọi link nguồn và link giấy phép đều là https://',
 IF(NOT EXISTS (SELECT 1 FROM content_sources WHERE url NOT LIKE 'https://%' OR (license_url IS NOT NULL AND license_url NOT LIKE 'https://%')), 'PASS', 'FAIL')),
('dữ liệu V3', 'nguồn đã đối chiếu giấy phép đều có câu ghi công',
 IF(NOT EXISTS (SELECT 1 FROM content_sources WHERE license_verified AND (attribution IS NULL OR TRIM(attribution) = '')), 'PASS', 'FAIL')),
('dữ liệu V3', 'không còn dữ liệu TEST-204 từ lần chạy trước',
 IF(NOT EXISTS (SELECT 1 FROM content_sources WHERE code LIKE 'TEST-204%')
    AND NOT EXISTS (SELECT 1 FROM articles WHERE slug LIKE 'test-204%'), 'PASS', 'FAIL'));

-- ---------- Chất lượng dữ liệu (chỉ báo CHÚ Ý, không tính lỗi) ----------
-- Các migration sau V3 (V19, V26, V32) chèn thẳng bài APPROVED / PUBLISHED, không đi qua API duyệt (EX-04, EX-05, KB-05)
-- nên có thể thiếu nguồn hoặc người duyệt. Script chỉ đếm để nhóm biết, không sửa dữ liệu.
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'chất lượng', CONCAT('bài tập APPROVED chưa gắn nguồn: ', COUNT(*), ' bài'), IF(COUNT(*) = 0, 'PASS', 'WARN')
FROM exercises e
WHERE e.review_status = 'APPROVED' AND NOT EXISTS (SELECT 1 FROM exercise_sources s WHERE s.exercise_id = e.id);
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'chất lượng', CONCAT('bài tập APPROVED chưa ghi người / thời điểm duyệt: ', COUNT(*), ' bài'), IF(COUNT(*) = 0, 'PASS', 'WARN')
FROM exercises WHERE review_status = 'APPROVED' AND reviewed_at IS NULL AND reviewed_by IS NULL;
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'chất lượng', CONCAT('bài viết PUBLISHED chưa gắn nguồn: ', COUNT(*), ' bài'), IF(COUNT(*) = 0, 'PASS', 'WARN')
FROM articles a
WHERE a.status = 'PUBLISHED' AND NOT EXISTS (SELECT 1 FROM article_sources s WHERE s.article_id = a.id);

-- ---------- Hành vi: thử ghi dữ liệu sai, CSDL phải chặn ----------
DROP PROCEDURE IF EXISTS gf_t204_try;
DELIMITER //
CREATE PROCEDURE gf_t204_try(IN label VARCHAR(170), IN q TEXT, IN expect_fail BOOLEAN)
BEGIN
    DECLARE failed BOOLEAN DEFAULT FALSE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET failed = TRUE;
    SET @gf_t204_q = q;
    PREPARE gf_t204_s FROM @gf_t204_q;
    EXECUTE gf_t204_s;
    DEALLOCATE PREPARE gf_t204_s;
    INSERT INTO t204 (nhom, kiem_tra, ket_qua) VALUES ('hành vi', label, IF(failed = expect_fail, 'PASS', 'FAIL'));
END//
DELIMITER ;

START TRANSACTION;

CALL gf_t204_try('nguồn hợp lệ https:// → ghi được',
    'INSERT INTO content_sources (code, publisher, title, url, accessed_at) VALUES (''TEST-204-A'', ''Test'', ''Nguồn thử'', ''https://example.org/a'', CURRENT_DATE)', FALSE);
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'hành vi', 'nguồn mới mặc định license_verified = FALSE',
       IF((SELECT license_verified FROM content_sources WHERE code = 'TEST-204-A') = 0, 'PASS', 'FAIL');
CALL gf_t204_try('link nguồn http:// → bị chặn (ck_source_url)',
    'INSERT INTO content_sources (code, publisher, title, url, accessed_at) VALUES (''TEST-204-B'', ''Test'', ''Nguồn thử'', ''http://example.org/b'', CURRENT_DATE)', TRUE);
CALL gf_t204_try('link giấy phép http:// → bị chặn (ck_source_license_url)',
    'INSERT INTO content_sources (code, publisher, title, url, license_url, accessed_at) VALUES (''TEST-204-C'', ''Test'', ''Nguồn thử'', ''https://example.org/c'', ''http://example.org/license'', CURRENT_DATE)', TRUE);
CALL gf_t204_try('trùng mã nguồn → bị chặn (uq_source_code)',
    'INSERT INTO content_sources (code, publisher, title, url, accessed_at) VALUES (''TEST-204-A'', ''Test'', ''Trùng mã'', ''https://example.org/d'', CURRENT_DATE)', TRUE);
CALL gf_t204_try('thiếu ngày truy cập → bị chặn (accessed_at NOT NULL)',
    'INSERT INTO content_sources (code, publisher, title, url) VALUES (''TEST-204-E'', ''Test'', ''Nguồn thử'', ''https://example.org/e'')', TRUE);

SET @ex := (SELECT MIN(id) FROM exercises);
CALL gf_t204_try('bài tập: trạng thái duyệt ngoài 4 giá trị → bị chặn (ck_ex_review)',
    CONCAT('UPDATE exercises SET review_status = ''PUBLISHED'' WHERE id = ', @ex), TRUE);
CALL gf_t204_try('bài tập: nơi tập ngoài GYM/HOME/ANY → bị chặn (ck_ex_location)',
    CONCAT('UPDATE exercises SET location = ''PARK'' WHERE id = ', @ex), TRUE);
CALL gf_t204_try('bài tập: nguồn gốc ngoài SELF_AUTHORED/ADAPTED → bị chặn (ck_ex_origin)',
    CONCAT('UPDATE exercises SET content_origin = ''COPIED'' WHERE id = ', @ex), TRUE);
CALL gf_t204_try('bài tập: chuyển sang NEEDS_REVIEW kèm ghi chú → ghi được',
    CONCAT('UPDATE exercises SET review_status = ''NEEDS_REVIEW'', review_note = ''TEST-204'' WHERE id = ', @ex), FALSE);

SET @src := (SELECT id FROM content_sources WHERE code = 'TEST-204-A');
CALL gf_t204_try('gắn nguồn cho bài tập → ghi được',
    CONCAT('INSERT IGNORE INTO exercise_sources (exercise_id, source_id) VALUES (', @ex, ', ', @src, ')'), FALSE);
CALL gf_t204_try('gắn nguồn không tồn tại → bị chặn (fk_exsrc_source)',
    CONCAT('INSERT INTO exercise_sources (exercise_id, source_id) VALUES (', @ex, ', 999999999)'), TRUE);
CALL gf_t204_try('gắn trùng cùng một nguồn hai lần → bị chặn (PK ghép)',
    CONCAT('INSERT INTO exercise_sources (exercise_id, source_id) VALUES (', @ex, ', ', @src, ')'), TRUE);
CALL gf_t204_try('xoá nguồn đang được bài tập dùng → bị chặn (RESTRICT)',
    CONCAT('DELETE FROM content_sources WHERE id = ', @src), TRUE);

CALL gf_t204_try('bài viết hợp lệ → ghi được, mặc định DRAFT',
    'INSERT INTO articles (slug, title, category, summary, body) VALUES (''test-204-bai-viet'', ''Bài thử'', ''NUTRITION'', ''Tóm tắt'', ''Nội dung'')', FALSE);
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'hành vi', 'bài viết mới có trạng thái DRAFT',
       IF((SELECT status FROM articles WHERE slug = 'test-204-bai-viet') = 'DRAFT', 'PASS', 'FAIL');
CALL gf_t204_try('slug có chữ hoa / khoảng trắng → bị chặn (ck_article_slug)',
    'INSERT INTO articles (slug, title, category, summary, body) VALUES (''Test 204'', ''Bài thử'', ''NUTRITION'', ''Tóm tắt'', ''Nội dung'')', TRUE);
CALL gf_t204_try('chủ đề ngoài 5 chủ đề → bị chặn (ck_article_category)',
    'INSERT INTO articles (slug, title, category, summary, body) VALUES (''test-204-chu-de'', ''Bài thử'', ''FASHION'', ''Tóm tắt'', ''Nội dung'')', TRUE);
CALL gf_t204_try('PUBLISHED mà thiếu ngày xuất bản → bị chặn (ck_article_published)',
    'UPDATE articles SET status = ''PUBLISHED'' WHERE slug = ''test-204-bai-viet''', TRUE);
CALL gf_t204_try('trùng slug → bị chặn (uq_article_slug)',
    'INSERT INTO articles (slug, title, category, summary, body) VALUES (''test-204-bai-viet'', ''Trùng'', ''SLEEP'', ''Tóm tắt'', ''Nội dung'')', TRUE);

SET @art := (SELECT id FROM articles WHERE slug = 'test-204-bai-viet');
INSERT INTO article_sources (article_id, source_id) VALUES (@art, @src);
DELETE FROM articles WHERE id = @art;
INSERT INTO t204 (nhom, kiem_tra, ket_qua)
SELECT 'hành vi', 'xoá bài viết → liên kết nguồn bị xoá theo (CASCADE)',
       IF(NOT EXISTS (SELECT 1 FROM article_sources WHERE article_id = @art), 'PASS', 'FAIL');

ROLLBACK;

DROP PROCEDURE IF EXISTS gf_t204_try;

INSERT INTO t204 (nhom, kiem_tra, ket_qua) VALUES
('dọn dẹp', 'ROLLBACK: không còn dữ liệu TEST-204',
 IF(NOT EXISTS (SELECT 1 FROM content_sources WHERE code LIKE 'TEST-204%')
    AND NOT EXISTS (SELECT 1 FROM articles WHERE slug LIKE 'test-204%')
    AND NOT EXISTS (SELECT 1 FROM exercises WHERE review_note = 'TEST-204'), 'PASS', 'FAIL'));

SELECT nhom, kiem_tra, ket_qua FROM t204 ORDER BY n;
SELECT CONCAT(SUM(ket_qua = 'PASS'), '/', SUM(ket_qua <> 'WARN'),
              IF(SUM(ket_qua = 'FAIL') = 0, ' PASS', ' – CÓ LỖI'),
              IF(SUM(ket_qua = 'WARN') > 0, CONCAT(' · ', SUM(ket_qua = 'WARN'), ' chú ý dữ liệu'), '')) AS `TỔNG SCRUM-204` FROM t204;
DROP TEMPORARY TABLE t204;
