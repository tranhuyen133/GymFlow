-- V39__training_section_en.sql
-- Song ngữ cho khu vực Tập luyện: tên/mục tiêu/ghi chú giáo án, ghi chú bài trong giáo án,
-- tiêu đề/ghi chú buổi tập và tên giáo án lưu trong lịch sử.

ALTER TABLE workout_plans
    ADD COLUMN name_en VARCHAR(120) NULL AFTER name,
    ADD COLUMN goal_en VARCHAR(255) NULL AFTER goal,
    ADD COLUMN note_en TEXT NULL AFTER note;

ALTER TABLE workout_plan_items
    ADD COLUMN note_en VARCHAR(255) NULL AFTER note;

ALTER TABLE workout_schedules
    ADD COLUMN title_en VARCHAR(120) NULL AFTER title,
    ADD COLUMN note_en VARCHAR(255) NULL AFTER note;

ALTER TABLE workout_plan_history
    ADD COLUMN old_plan_name_en VARCHAR(120) NULL AFTER old_plan_name,
    ADD COLUMN new_plan_name_en VARCHAR(120) NULL AFTER new_plan_name,
    ADD COLUMN note_en VARCHAR(255) NULL AFTER note;

-- Backfill nội dung mẫu/seed đang có trong DB.
UPDATE workout_plans SET name_en = CASE name
    WHEN 'Giai đoạn nền tảng' THEN 'Foundation Stage'
    WHEN 'Full body 3 buổi/tuần' THEN 'Full Body 3 Sessions/Week'
    WHEN 'Upper / Lower + Cardio' THEN 'Upper / Lower + Cardio'
END
WHERE name_en IS NULL AND name IN ('Giai đoạn nền tảng', 'Full body 3 buổi/tuần', 'Upper / Lower + Cardio');

UPDATE workout_plans SET goal_en = CASE goal
    WHEN 'Làm quen kỹ thuật' THEN 'Technical familiarization'
    WHEN 'Giảm mỡ, săn chắc' THEN 'Fat loss, tone'
    WHEN 'Tăng cơ' THEN 'Muscle gain'
    WHEN 'Cải thiện sức bền' THEN 'Improve endurance'
    WHEN 'Giảm cân' THEN 'Weight loss'
    WHEN 'Duy trì vóc dáng' THEN 'Maintain physique'
END
WHERE goal_en IS NULL AND goal IN ('Làm quen kỹ thuật', 'Giảm mỡ, săn chắc', 'Tăng cơ', 'Cải thiện sức bền', 'Giảm cân', 'Duy trì vóc dáng');

UPDATE workout_plans SET note_en = 'Warm up for 10 minutes before each session and stretch for 5 minutes afterwards.'
WHERE note_en IS NULL AND note = 'Khởi động 10 phút trước mỗi buổi, giãn cơ 5 phút sau buổi.';

UPDATE workout_plan_history SET old_plan_name_en = CASE old_plan_name
    WHEN 'Giai đoạn nền tảng' THEN 'Foundation Stage'
    WHEN 'Full body 3 buổi/tuần' THEN 'Full Body 3 Sessions/Week'
    WHEN 'Upper / Lower + Cardio' THEN 'Upper / Lower + Cardio'
END
WHERE old_plan_name_en IS NULL AND old_plan_name IN ('Giai đoạn nền tảng', 'Full body 3 buổi/tuần', 'Upper / Lower + Cardio');

UPDATE workout_plan_history SET new_plan_name_en = CASE new_plan_name
    WHEN 'Giai đoạn nền tảng' THEN 'Foundation Stage'
    WHEN 'Full body 3 buổi/tuần' THEN 'Full Body 3 Sessions/Week'
    WHEN 'Upper / Lower + Cardio' THEN 'Upper / Lower + Cardio'
END
WHERE new_plan_name_en IS NULL AND new_plan_name IN ('Giai đoạn nền tảng', 'Full body 3 buổi/tuần', 'Upper / Lower + Cardio');

UPDATE workout_schedules SET title_en = CASE title
    WHEN 'Buổi 1 – Giai đoạn nền tảng' THEN 'Session 1 – Foundation Stage'
    WHEN 'Buổi 2 – Giai đoạn nền tảng' THEN 'Session 2 – Foundation Stage'
    WHEN 'Buổi 3 – Giai đoạn nền tảng' THEN 'Session 3 – Foundation Stage'
    WHEN 'Buổi 1 – Full body 3 buổi/tuần' THEN 'Session 1 – Full Body 3 Sessions/Week'
    WHEN 'Buổi 2 – Full body 3 buổi/tuần' THEN 'Session 2 – Full Body 3 Sessions/Week'
    WHEN 'Buổi 3 – Full body 3 buổi/tuần' THEN 'Session 3 – Full Body 3 Sessions/Week'
    WHEN 'Buổi 1 – Upper / Lower + Cardio' THEN 'Session 1 – Upper / Lower + Cardio'
    WHEN 'Buổi 2 – Upper / Lower + Cardio' THEN 'Session 2 – Upper / Lower + Cardio'
    WHEN 'Buổi 3 – Upper / Lower + Cardio' THEN 'Session 3 – Upper / Lower + Cardio'
    WHEN 'Tự tập' THEN 'Self-workout'
    WHEN 'Buổi tập với HLV' THEN 'Session with trainer'
END
WHERE title_en IS NULL;
