-- =====================================================================
-- GymFlow · V5 · Optimistic locking cho bài viết kho kiến thức
-- Tránh ghi đè đồng thời khi nhiều quản trị viên cùng duyệt hoặc HLV sửa trong lúc duyệt
-- =====================================================================
ALTER TABLE articles ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
