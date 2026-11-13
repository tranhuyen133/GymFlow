-- V41__membership_plans_en.sql
-- Song ngữ tên/mô tả/quyền lợi gói tập cho khu vực Gói đề xuất nâng cấp.

ALTER TABLE membership_plans
    ADD COLUMN name_en VARCHAR(100) NULL AFTER name,
    ADD COLUMN description_en TEXT NULL AFTER description,
    ADD COLUMN benefits_en TEXT NULL AFTER benefits;

UPDATE membership_plans SET
    name_en = '1-Month Plan',
    description_en = 'Unlimited training during opening hours',
    benefits_en = 'Locker, free drinking water'
WHERE id = 1;

UPDATE membership_plans SET
    name_en = '3-Month Plan',
    description_en = 'Save 10% vs. the monthly plan',
    benefits_en = 'Locker, 1 InBody scan'
WHERE id = 2;

UPDATE membership_plans SET
    name_en = '6-Month Plan',
    description_en = 'Save 17%',
    benefits_en = 'Locker, 2 InBody scans, 1 PT session'
WHERE id = 3;

UPDATE membership_plans SET
    name_en = '12-Month Plan',
    description_en = 'Save 25%, 30-day membership freeze',
    benefits_en = 'All benefits + 4 PT sessions'
WHERE id = 4;

UPDATE membership_plans SET
    name_en = '1-on-1 PT – 12 Sessions',
    description_en = '12 sessions with a personal trainer',
    benefits_en = 'Personal training program, nutrition tracking'
WHERE id = 5;

UPDATE membership_plans SET
    name_en = 'Student Plan (Legacy)',
    description_en = 'Discontinued last quarter',
    benefits_en = NULL
WHERE id = 6;

UPDATE membership_plans SET
    name_en = '1-Day Gym Pass',
    description_en = 'Full-day trial with access to all free-weight and cardio areas.',
    benefits_en = 'Full free-weight and cardio areas, Day locker, Free drinking water'
WHERE id = 7;

UPDATE membership_plans SET
    name_en = '2-Week Trial Plan',
    description_en = 'Get to know the gym over 14 days, including one machine orientation session.',
    benefits_en = 'Unlimited training during opening hours, 1 machine orientation session, Locker'
WHERE id = 8;

UPDATE membership_plans SET
    name_en = '1-Month Off-Peak Plan (9am–4pm)',
    description_en = 'Budget-friendly for daytime schedules: train 9am to 4pm, Monday to Friday.',
    benefits_en = 'Train 9am–4pm Monday to Friday, Locker, Free drinking water'
WHERE id = 9;

UPDATE membership_plans SET
    name_en = '3-Month Student Plan',
    description_en = 'Discount for current high school and university students.',
    benefits_en = 'Unlimited training during opening hours, 1 InBody scan, Locker'
WHERE id = 10;

UPDATE membership_plans SET
    name_en = '24-Month Plan',
    description_en = 'Long-term commitment at the best monthly rate.',
    benefits_en = 'Unlimited training during opening hours, 4 InBody scans, 6 PT sessions, Private locker, 60-day membership freeze'
WHERE id = 11;

UPDATE membership_plans SET
    name_en = '3-Session PT Trial',
    description_en = 'Try 1-on-1 training with a coach: fitness assessment and a starter program.',
    benefits_en = '3 one-on-one PT sessions, First-session fitness assessment, 2-week starter program'
WHERE id = 12;

UPDATE membership_plans SET
    name_en = 'Gym + PT 8 Sessions (1 Month)',
    description_en = 'A full month of gym access with 2 PT sessions per week to refine technique and track progress.',
    benefits_en = 'Unlimited gym access, 8 one-on-one PT sessions, Personal training program, 1 InBody scan'
WHERE id = 13;

UPDATE membership_plans SET
    name_en = 'Gym + PT 12 Sessions (6 Weeks)',
    description_en = '3 PT sessions per week for the first 4 weeks, then self-guided training on your program.',
    benefits_en = 'Unlimited gym access, 12 one-on-one PT sessions, Personal training program, Nutrition coaching via messaging'
WHERE id = 14;

UPDATE membership_plans SET
    name_en = 'Gym + PT 24 Sessions (3 Months)',
    description_en = '12-week roadmap with 2 PT sessions per week and measurements every 4 weeks.',
    benefits_en = 'Unlimited gym access, 24 one-on-one PT sessions, 3 InBody scans, Training program and sample meal plan'
WHERE id = 15;

UPDATE membership_plans SET
    name_en = 'Gym + PT Fat Loss 36 Sessions (4 Months)',
    description_en = '16-week fat-loss program: 2–3 PT sessions per week with cardio and nutrition tracking.',
    benefits_en = 'Unlimited gym access, 36 one-on-one PT sessions, 4 InBody scans, Weekly meal plan, Daily messaging with your coach'
WHERE id = 16;

UPDATE membership_plans SET
    name_en = '10-Session Movement Rehab PT',
    description_en = 'Mobility and light strength work after an injury, once your doctor has cleared you to train.',
    benefits_en = 'Unlimited gym access, 10 one-on-one PT sessions (45 minutes), Range-of-motion assessment, Home exercises'
WHERE id = 17;
