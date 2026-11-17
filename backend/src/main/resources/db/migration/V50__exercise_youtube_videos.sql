-- V50__exercise_youtube_videos.sql
-- Gắn video YouTube hướng dẫn kỹ thuật cho ~40 bài tập phổ biến (bổ sung cho 4 bài của V48).
-- Mỗi video là video công khai trên YouTube do kênh hướng dẫn thể hình đăng (ScottHermanFitness, Well+Good, Bodybuilding.com,
-- Nuffield Health, Bowflex…); chỉ NHÚNG qua youtube-nocookie, không tải về – bản quyền thuộc kênh gốc.
-- Lưu dạng link nhúng giống ExerciseService.sanitizeVideoUrl. Khớp theo name_en (không phân biệt hoa thường) hoặc tên tiếng Việt
-- có chú thích "(English)". Chỉ ghi vào bài CHƯA có video – không đè video HLV đã nhập tay; không có bài thì bỏ qua.

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/ntr64W6ZWB0'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('conventional deadlift', 'deadlift', 'dumbbell deadlift') OR name LIKE '%(Conventional deadlift)%' OR name LIKE '%(Deadlift)%' OR name LIKE '%(Dumbbell deadlift)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/eGo4IYlbE5g'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('pull-up', 'wide grip pull-up') OR name LIKE '%(Pull-up)%' OR name LIKE '%(Wide grip pull-up)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/pSHjTRCQxIw'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('forearm plank', 'plank') OR name LIKE '%(Forearm plank)%' OR name LIKE '%(Plank)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/3VcKaXpzqRo'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('dumbbell lateral raise', 'dumbbell seated lateral raise', 'lateral raise') OR name LIKE '%(Dumbbell lateral raise)%' OR name LIKE '%(Dumbbell seated lateral raise)%' OR name LIKE '%(Lateral Raise)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/ykJmrZ5v0Oo'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('dumbbell alternate biceps curl', 'biceps curl (light weights)', 'dumbbell biceps curl') OR name LIKE '%(Dumbbell alternate biceps curl)%' OR name LIKE '%(Biceps curl (light weights))%' OR name LIKE '%(Dumbbell biceps curl)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/2-LAMcpzODU'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('cable triceps pushdown', 'cable one arm tricep pushdown', 'triceps pushdown') OR name LIKE '%(Cable triceps pushdown)%' OR name LIKE '%(Cable one arm tricep pushdown)%' OR name LIKE '%(Triceps Pushdown)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/IZxyjW7MPJQ'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('leg press') OR name LIKE '%(Leg press)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/D7KaRcUTQeE'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('walking lunge', 'dumbbell lunge', 'barbell lunge') OR name LIKE '%(Walking lunge)%' OR name LIKE '%(Dumbbell lunge)%' OR name LIKE '%(Barbell lunge)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/7j-2w4-P14I'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('romanian deadlift', 'dumbbell romanian deadlift') OR name LIKE '%(Romanian deadlift)%' OR name LIKE '%(Dumbbell romanian deadlift)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/Zp26q4BY5HE'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('barbell hip thrust', 'hip thrust') OR name LIKE '%(Barbell hip thrust)%' OR name LIKE '%(Hip Thrust)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/3gZm9wGTsEo'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('lying leg curl') OR name LIKE '%(Lying leg curl)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/YyvSfVjQeL0'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('leg extension') OR name LIKE '%(Leg extension)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/k67UjgvJdEk'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('standing calf raise', 'barbell standing calf raise', 'calf raise') OR name LIKE '%(Standing calf raise)%' OR name LIKE '%(Barbell standing calf raise)%' OR name LIKE '%(Calf raise)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/8iPEnn-ltC8'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('incline dumbbell press') OR name LIKE '%(Incline dumbbell press)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/taI4XduLpTk'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('cable fly', 'cable crossover') OR name LIKE '%(Cable fly)%' OR name LIKE '%(Cable crossover)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/GZbfZ033f74'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('seated cable row') OR name LIKE '%(Seated cable row)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/hsEKg3M45dc'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('parallel bar dip', 'triceps dip', 'lever overhand triceps dip') OR name LIKE '%(Parallel bar dip)%' OR name LIKE '%(Triceps dip)%' OR name LIKE '%(Lever overhand triceps dip)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/zC3nLlEvin4'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('hammer curl', 'dumbbell cross body hammer curl') OR name LIKE '%(Hammer curl)%' OR name LIKE '%(Dumbbell cross body hammer curl)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/GaK2da6B2zM'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('ez-bar skullcrusher', 'dumbbell lying triceps extension') OR name LIKE '%(EZ-bar skullcrusher)%' OR name LIKE '%(Dumbbell lying triceps extension)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/F3QY5vMz_6I'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('standing overhead press', 'overhead press', 'smith standing military press') OR name LIKE '%(Standing overhead press)%' OR name LIKE '%(Overhead Press)%' OR name LIKE '%(Smith standing military press)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/0JfYxMRsUCQ'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('seated dumbbell shoulder press', 'dumbbell standing overhead press') OR name LIKE '%(Seated dumbbell shoulder press)%' OR name LIKE '%(Dumbbell standing overhead press)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/0Po47vvj9g4'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('cable face pull', 'face pull') OR name LIKE '%(Cable face pull)%' OR name LIKE '%(Face Pull)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/9efgcAjQe7E'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('barbell bent-over row', 'barbell pendlay row') OR name LIKE '%(Barbell bent-over row)%' OR name LIKE '%(Barbell pendlay row)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/pYcpY20QaE8'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('one-arm dumbbell row', 'dumbbell bent over row') OR name LIKE '%(One-arm dumbbell row)%' OR name LIKE '%(Dumbbell bent over row)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/vwl68EF9M2Q'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('hanging leg raise', 'captains chair straight leg raise') OR name LIKE '%(Hanging leg raise)%' OR name LIKE '%(Captains chair straight leg raise)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/wkD8rjkodUI'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('weighted russian twist', 'russian twist') OR name LIKE '%(Weighted russian twist)%' OR name LIKE '%(Russian twist)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/cnyTQDSE884'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('mountain climber') OR name LIKE '%(Mountain climber)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/qLBImHhCXSw'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('burpee', 'jack burpee') OR name LIKE '%(Burpee)%' OR name LIKE '%(Jack burpee)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/MeIiIdhvXT4'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('goblet squat') OR name LIKE '%(Goblet squat)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/2C-uNgKwPLE'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('bulgarian split squat', 'split squats') OR name LIKE '%(Bulgarian split squat)%' OR name LIKE '%(Split squats)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/OUgsJ8-Vi0E'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('glute bridge activation', 'glute bridge march', 'barbell glute bridge') OR name LIKE '%(Glute Bridge Activation)%' OR name LIKE '%(Glute bridge march)%' OR name LIKE '%(Barbell glute bridge)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/bDCeXbMJVNs'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('kettlebell swing') OR name LIKE '%(Kettlebell swing)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/XeN4pEZZJNI'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('side plank') OR name LIKE '%(Side plank)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/-Vyt2QdsR7E'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('overhead triceps extension') OR name LIKE '%(Overhead triceps extension)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/iSSAk4XCsRA'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('gentle jumping jacks', 'jumping jacks') OR name LIKE '%(Gentle Jumping Jacks)%' OR name LIKE '%(Jumping jacks)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/1we3bh9uhqY'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('bicycle crunch') OR name LIKE '%(Bicycle crunch)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/0t4t3IpiEao'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('crunch', 'abdominal crunch') OR name LIKE '%(Crunch)%' OR name LIKE '%(Abdominal crunch)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/6Z15_WdXmVw'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('arnold press', 'dumbbell arnold press') OR name LIKE '%(Arnold press)%' OR name LIKE '%(Dumbbell arnold press)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/uYumuL_G_V0'
WHERE (video_url IS NULL OR video_url = '') AND (LOWER(name_en) IN ('barbell front squat', 'front squat') OR name LIKE '%(Barbell front squat)%' OR name LIKE '%(Front squat)%');

