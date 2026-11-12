-- =====================================================================
-- GymFlow · V25 · Ước tính calo tiêu hao theo MET
--  * Bảng met_reference: bảng tra MET theo loại hoạt động + cường độ.
--    Nguồn: 2011 Compendium of Physical Activities (Ainsworth và cộng sự,
--    Med Sci Sports Exerc. 43(8):1575-1581). Mỗi dòng ghi mã, phiên bản,
--    URL và trích dẫn để truy vết. Giá trị HIIT là giá trị tham chiếu
--    suy ra từ circuit training/calisthenics, được ghi chú rõ.
--  * workout_logs: bổ sung snapshot cân nặng, thời gian vận động, cường độ,
--    phương pháp, công thức, trạng thái/chất lượng ước tính và thời điểm tính.
--    KHÔNG tính lại dữ liệu lịch sử; các bản ghi cũ giữ LEGACY.
--  * workout_log_exercises: chi tiết từng bài đã thực hiện trong buổi,
--    lưu MET áp dụng và calo ước tính để có thể truy vết.
--  * Tái sử dụng workout_logs làm bản ghi phiên/calo (đã có uq_logs_schedule),
--    không tạo bảng workout_sessions/calorie_estimates trùng lặp.
-- =====================================================================

-- 1. Bảng tham chiếu MET
CREATE TABLE IF NOT EXISTS met_reference (
    id                BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    activity_category VARCHAR(30)  NOT NULL,
    intensity         VARCHAR(20)  NOT NULL,
    met_value         DECIMAL(4,1) NOT NULL,
    source_code       VARCHAR(30)  NOT NULL,
    source_version    VARCHAR(20)  NOT NULL DEFAULT '2011',
    source_url        VARCHAR(255) NULL,
    citation          VARCHAR(255) NOT NULL,
    note              VARCHAR(255) NULL,
    created_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_met_reference UNIQUE (activity_category, intensity, source_version),
    CONSTRAINT ck_met_category CHECK (activity_category IN
        ('RESISTANCE', 'CARDIO', 'RUNNING', 'WALKING', 'CYCLING', 'JUMP_ROPE', 'HIIT', 'OTHER')),
    CONSTRAINT ck_met_intensity CHECK (intensity IN ('LIGHT', 'MODERATE', 'VIGOROUS')),
    CONSTRAINT ck_met_positive CHECK (met_value > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 2. Seed bảng MET tham chiếu (2011 Compendium)
INSERT INTO met_reference (activity_category, intensity, met_value, source_code, source_version, source_url, citation, note)
VALUES
('RESISTANCE', 'LIGHT',    3.5, '02050', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Resistance training (weight lifting), light or moderate effort, general'),
('RESISTANCE', 'MODERATE', 5.0, '02054', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Resistance training, squats/lunges/rows at moderate effort'),
('RESISTANCE', 'VIGOROUS', 6.0, '02052', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Resistance training (weight lifting), vigorous effort'),

('CARDIO', 'LIGHT',    4.0, '02000', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Conditioning exercise, light effort, general'),
('CARDIO', 'MODERATE', 5.0, '02120', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Elliptical/conditioning machine, moderate effort'),
('CARDIO', 'VIGOROUS', 7.0, '02150', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Conditioning exercise, vigorous effort, general'),

('RUNNING', 'LIGHT',    8.3,  '12020', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Running at 8 km/h (5 mph)'),
('RUNNING', 'MODERATE', 9.8,  '12030', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Running at 9.7 km/h (6 mph)'),
('RUNNING', 'VIGOROUS', 11.0, '12050', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Running at 11.3 km/h (7 mph)'),

('WALKING', 'LIGHT',    3.3, '17170', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Walking at 5.3 km/h (3.3 mph)'),
('WALKING', 'MODERATE', 3.8, '17190', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Walking at 5.6 km/h (3.5 mph)'),
('WALKING', 'VIGOROUS', 5.0, '17200', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Walking at 6.4 km/h (4.0 mph)'),

('CYCLING', 'LIGHT',    4.0, '01010', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Bicycling, leisure, <16 km/h (<10 mph)'),
('CYCLING', 'MODERATE', 6.8, '01020', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Bicycling, 16-19 km/h (10-11.9 mph)'),
('CYCLING', 'VIGOROUS', 8.0, '01030', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Bicycling, 19-22 km/h (12-13.9 mph)'),

('JUMP_ROPE', 'LIGHT',    8.8,  '15551', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Rope jumping, slow pace'),
('JUMP_ROPE', 'MODERATE', 11.0, '15550', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Rope jumping, moderate pace, general'),
('JUMP_ROPE', 'VIGOROUS', 12.3, '15553', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Rope jumping, fast pace'),

('HIIT', 'LIGHT',    8.0,  '02020', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Reference value derived from circuit training/calisthenics; HIIT has no single Compendium code.'),
('HIIT', 'MODERATE', 10.0, '02020', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Reference value derived from circuit training/calisthenics; HIIT has no single Compendium code.'),
('HIIT', 'VIGOROUS', 12.0, '02020', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Reference value derived from circuit training/calisthenics; HIIT has no single Compendium code.'),

('OTHER', 'LIGHT',    3.5, '02000', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Other gym/conditioning activity, light effort'),
('OTHER', 'MODERATE', 5.0, '02000', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Other gym/conditioning activity, moderate effort'),
('OTHER', 'VIGOROUS', 7.0, '02000', '2011', 'https://doi.org/10.1249/MSS.0b013e31821ece12',
 'Ainsworth BE et al. 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575-1581.',
 'Other gym/conditioning activity, vigorous effort')
ON DUPLICATE KEY UPDATE met_value = VALUES(met_value), note = VALUES(note);

-- 3. Snapshot ước tính calo trên nhật ký buổi tập (tái sử dụng workout_logs)
ALTER TABLE workout_logs
    ADD COLUMN weight_kg_used      DECIMAL(5,1) NULL AFTER calories,
    ADD COLUMN active_minutes      DECIMAL(6,1) NULL AFTER weight_kg_used,
    ADD COLUMN intensity           VARCHAR(20)  NULL AFTER active_minutes,
    ADD COLUMN met_method          VARCHAR(40)  NULL AFTER intensity,
    ADD COLUMN formula_version     VARCHAR(40)  NULL AFTER met_method,
    ADD COLUMN estimate_status     VARCHAR(20)  NOT NULL DEFAULT 'LEGACY' AFTER formula_version,
    ADD COLUMN estimate_quality    VARCHAR(20)  NULL AFTER estimate_status,
    ADD COLUMN estimated           BOOLEAN      NOT NULL DEFAULT FALSE AFTER estimate_quality,
    ADD COLUMN calculated_at       DATETIME(6)  NULL AFTER estimated,
    ADD CONSTRAINT ck_logs_weight_used CHECK (weight_kg_used IS NULL OR weight_kg_used BETWEEN 20 AND 300),
    ADD CONSTRAINT ck_logs_active_minutes CHECK (active_minutes IS NULL OR active_minutes BETWEEN 0 AND 600),
    ADD CONSTRAINT ck_logs_estimate_status CHECK (estimate_status IN ('OK', 'MISSING_WEIGHT', 'NO_EXERCISE_DATA', 'LEGACY')),
    ADD CONSTRAINT ck_logs_estimate_quality CHECK (estimate_quality IS NULL OR estimate_quality IN ('DETAILED', 'COARSE')),
    ADD INDEX ix_logs_member_estimate (member_id, completed_at, estimated);

-- 4. Chi tiết từng bài trong buổi tập
CREATE TABLE IF NOT EXISTS workout_log_exercises (
    id                    BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    workout_log_id        BIGINT       NOT NULL,
    exercise_id           BIGINT       NULL,
    exercise_name         VARCHAR(120) NOT NULL,
    activity_category     VARCHAR(30)  NOT NULL,
    intensity             VARCHAR(20)  NOT NULL,
    met_value             DECIMAL(4,1) NOT NULL,
    met_source_code       VARCHAR(30)  NULL,
    met_source_version    VARCHAR(20)  NULL,
    sets                  INT          NULL,
    reps                  VARCHAR(20)  NULL,
    work_seconds_per_set  INT          NULL,
    rest_seconds          INT          NULL,
    active_minutes        DECIMAL(6,1) NOT NULL DEFAULT 0,
    calories              INT          NULL,
    data_source           VARCHAR(20)  NOT NULL DEFAULT 'PLAN',
    sort_order            INT          NOT NULL DEFAULT 0,
    created_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_wle_log FOREIGN KEY (workout_log_id) REFERENCES workout_logs (id) ON DELETE CASCADE,
    CONSTRAINT fk_wle_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE SET NULL,
    CONSTRAINT uq_wle_log_order UNIQUE (workout_log_id, sort_order),
    CONSTRAINT ck_wle_category CHECK (activity_category IN
        ('RESISTANCE', 'CARDIO', 'RUNNING', 'WALKING', 'CYCLING', 'JUMP_ROPE', 'HIIT', 'OTHER')),
    CONSTRAINT ck_wle_intensity CHECK (intensity IN ('LIGHT', 'MODERATE', 'VIGOROUS')),
    CONSTRAINT ck_wle_met CHECK (met_value > 0),
    CONSTRAINT ck_wle_active CHECK (active_minutes >= 0),
    CONSTRAINT ck_wle_calories CHECK (calories IS NULL OR calories >= 0),
    CONSTRAINT ck_wle_source CHECK (data_source IN ('PLAN', 'FALLBACK'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 5. Đánh dấu dữ liệu lịch sử là LEGACY, không tính lại calo
UPDATE workout_logs
SET estimate_status = 'LEGACY',
    estimated = FALSE,
    calculated_at = completed_at
WHERE calculated_at IS NULL;
