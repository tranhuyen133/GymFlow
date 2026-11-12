-- =====================================================================
-- GymFlow · V27 · Nâng cấp hệ thống tin nhắn HLV ↔ Hội viên & Quản trị viên
--  * conversations: bổ sung cột updated_at
--  * messages: bổ sung sender_role, attachment_url, deleted_at (hỗ trợ xoá mềm)
-- =====================================================================

ALTER TABLE conversations
    ADD COLUMN updated_at DATETIME(6) NULL AFTER created_at;

UPDATE conversations
SET updated_at = COALESCE(last_message_at, created_at)
WHERE updated_at IS NULL;

ALTER TABLE messages
    ADD COLUMN sender_role VARCHAR(20) NULL AFTER sender_user_id,
    ADD COLUMN attachment_url VARCHAR(500) NULL AFTER body,
    ADD COLUMN deleted_at DATETIME(6) NULL AFTER read_at;

-- Backfill sender_role từ bảng users
UPDATE messages m
JOIN users u ON m.sender_user_id = u.id
SET m.sender_role = u.role
WHERE m.sender_role IS NULL;

-- Index phục vụ truy vấn tin nhắn chưa xoá mềm
CREATE INDEX ix_messages_deleted ON messages (deleted_at);
CREATE INDEX ix_messages_conv_deleted_created ON messages (conversation_id, deleted_at, created_at);
