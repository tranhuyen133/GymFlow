-- =====================================================================
-- GymFlow · V23 · Nâng cấp Trợ lý AI: lưu trữ nguồn trả lời (provider)
--  * Thêm cột provider cho bảng chat_messages (RULE, OLLAMA).
--  * Mặc định là RULE cho các tin nhắn đã có trong hệ thống.
-- =====================================================================

ALTER TABLE chat_messages
    ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'RULE' AFTER sender;
