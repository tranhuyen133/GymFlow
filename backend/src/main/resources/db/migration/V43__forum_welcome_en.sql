-- V43__forum_welcome_en.sql
-- Song ngữ cho chủ đề chào mừng Diễn đàn.

ALTER TABLE forum_topics
    ADD COLUMN title_en VARCHAR(200) NULL AFTER title,
    ADD COLUMN body_en TEXT NULL AFTER body;

UPDATE forum_topics SET
    title_en = 'Welcome to GymFlow Forum – read before posting',
    body_en = 'This is where members, trainers and gym managers ask questions and share training experience.

## Community rules
- Respect others; no personal attacks.
- No advertising, selling, or posting other people''s personal information.
- Health-related sharing is personal experience only and does not replace advice from a trainer or healthcare professional.
- If you see a violating post, press "Report" so a trainer or manager can review it.

Trainers and managers can hide violating posts, pin topics, or lock topics.'
WHERE id = 1 AND title = 'Chào mừng đến Diễn đàn GymFlow – đọc trước khi đăng';
