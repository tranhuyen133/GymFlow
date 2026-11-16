-- V48__exercise_example_videos.sql
-- Gắn video YouTube minh hoạ cho vài bài tập phổ biến (ví dụ theo góp ý của GVHD, không phải toàn bộ thư viện).
-- Lưu dạng link nhúng youtube-nocookie như ExerciseService.sanitizeVideoUrl; trang chi tiết bài tập tự hiện khung video.
-- Chỉ ghi vào bài chưa có video, nên không đè video HLV đã nhập tay. Không tìm thấy bài thì bỏ qua.

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/vcBig73ojpE'
WHERE video_url IS NULL AND (name_en IN ('Bench Press', 'Barbell Bench Press') OR name LIKE '%(Bench Press)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/IODxDxX7oi4'
WHERE video_url IS NULL AND (name_en IN ('Push-up', 'Push Up', 'Push-Up', 'Pushups') OR name = 'Hít đất (Push-up)');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/S0H0JxLAOAY'
WHERE video_url IS NULL AND (name_en IN ('Back Squat', 'Barbell Squat', 'Barbell Back Squat') OR name LIKE '%(Back Squat)%');

UPDATE exercises SET video_url = 'https://www.youtube-nocookie.com/embed/AOpi-p0cJkc'
WHERE video_url IS NULL AND (name_en IN ('Lat Pulldown', 'Wide-Grip Lat Pulldown') OR name LIKE '%(Lat Pulldown)%');
