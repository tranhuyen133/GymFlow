-- =====================================================================
-- GymFlow · V45 · Tin nhắn: gửi ảnh / video / tệp, thu hồi, xoá phía mình
--  * messages.kind: TEXT | IMAGE | VIDEO | FILE (tin cũ = TEXT).
--  * messages.attachment_name / attachment_type / attachment_size: thông tin tệp để hiển thị danh sách
--    mà không phải đọc dữ liệu tệp. Loại tệp do máy chủ nhận diện từ nội dung, không tin trình duyệt.
--  * messages.recalled_at: người gửi thu hồi (trong 15 phút) → hai bên đều thấy "đã thu hồi";
--    nội dung, tên tệp và dữ liệu tệp bị xoá khỏi CSDL, chỉ giữ dòng tin để giữ thứ tự hội thoại.
--  * message_attachments: dữ liệu tệp lưu trong CSDL (giống ảnh đại diện) để không phải thêm volume.
--    Mỗi tin tối đa 1 tệp; xoá tin / hội thoại thì tệp bị xoá theo (ON DELETE CASCADE).
--  * message_hidden: "xoá phía tôi" – chỉ ẩn với người bấm, người kia vẫn thấy.
-- =====================================================================

ALTER TABLE messages
    ADD COLUMN kind            VARCHAR(10)  NOT NULL DEFAULT 'TEXT' AFTER sender_role,
    ADD COLUMN attachment_name VARCHAR(255) NULL AFTER attachment_url,
    ADD COLUMN attachment_type VARCHAR(100) NULL AFTER attachment_name,
    ADD COLUMN attachment_size BIGINT       NULL AFTER attachment_type,
    ADD COLUMN recalled_at     DATETIME(6)  NULL AFTER read_at,
    ADD CONSTRAINT ck_messages_kind CHECK (kind IN ('TEXT', 'IMAGE', 'VIDEO', 'FILE')),
    ADD CONSTRAINT ck_messages_attachment_size CHECK (attachment_size IS NULL OR (attachment_size > 0 AND attachment_size <= 26214400));

CREATE INDEX ix_messages_conv_recalled ON messages (conversation_id, recalled_at);
CREATE INDEX ix_messages_sender_created ON messages (sender_user_id, created_at);

CREATE TABLE message_attachments (
    message_id BIGINT      NOT NULL PRIMARY KEY,
    size_bytes BIGINT      NOT NULL,
    sha256     CHAR(64)    NOT NULL,
    data       LONGBLOB    NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_msg_attachments_message FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
    CONSTRAINT ck_msg_attachments_size CHECK (size_bytes > 0 AND size_bytes <= 26214400)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE message_hidden (
    message_id BIGINT      NOT NULL,
    user_id    BIGINT      NOT NULL,
    hidden_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (message_id, user_id),
    CONSTRAINT fk_msg_hidden_message FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_hidden_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX ix_msg_hidden_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
