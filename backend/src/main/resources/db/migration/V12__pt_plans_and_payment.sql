-- =====================================================================
-- GymFlow · V12 · Gói có / không kèm HLV (PT) và thanh toán chuyển khoản QR
--  * membership_plans.includes_trainer: gói có HLV kèm. Hội viên chọn HLV khi gửi đơn, quản lý duyệt đơn thì
--    HLV đó được gán cho hội viên. Gói không kèm HLV: hội viên tự soạn giáo án, tự xếp lịch (AccessService.canSelfCoach).
--    Mặc định FALSE: sau khi chạy, quản lý tự đánh dấu các gói có PT ở Quản lý › Gói tập (không đoán theo tên gói).
--  * package_requests: cách thanh toán (tại quầy / chuyển khoản), mã nội dung chuyển khoản GFxxxxxx (duy nhất),
--    lúc hội viên bấm "Tôi đã chuyển khoản", HLV hội viên chọn. Đơn cũ nhận COUNTER, đúng với cách đã thu trước đây.
--  * payment_settings: đúng 1 dòng (id = 1) chứa thông tin tài khoản nhận tiền và ảnh mã QR ngân hàng.
--    Ảnh lưu trong CSDL giống user_avatars (V6) nên không cần thêm thư mục / volume trên VPS.
--  * Chỉ thêm cột / bảng mới, không sửa dữ liệu cũ.
-- =====================================================================

ALTER TABLE membership_plans
    ADD COLUMN includes_trainer BOOLEAN NOT NULL DEFAULT FALSE AFTER benefits;

ALTER TABLE package_requests
    ADD COLUMN trainer_id     BIGINT      NULL AFTER plan_id,
    ADD COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'COUNTER' AFTER member_note,
    ADD COLUMN payment_code   VARCHAR(20) NULL AFTER payment_method,
    ADD COLUMN member_paid_at DATETIME(6) NULL AFTER payment_code,
    ADD CONSTRAINT fk_preq_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (id) ON DELETE SET NULL,
    ADD CONSTRAINT ck_preq_payment CHECK (payment_method IN ('COUNTER', 'BANK_TRANSFER')),
    ADD CONSTRAINT uq_preq_payment_code UNIQUE (payment_code);

CREATE TABLE payment_settings (
    id              BIGINT       NOT NULL PRIMARY KEY,
    online_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    bank_name       VARCHAR(100),
    account_number  VARCHAR(30),
    account_name    VARCHAR(100),
    qr_content_type VARCHAR(20),
    qr_size_bytes   INT,
    qr_data         MEDIUMBLOB,
    qr_updated_at   DATETIME(6),
    updated_by      BIGINT,
    updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_payset_user FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_payset_single CHECK (id = 1),
    CONSTRAINT ck_payset_qr_type CHECK (qr_content_type IS NULL OR qr_content_type IN ('image/jpeg', 'image/png', 'image/webp')),
    -- Khớp PaymentSettingsService.MAX_QR_BYTES (512 KB)
    CONSTRAINT ck_payset_qr_size CHECK (qr_size_bytes IS NULL OR qr_size_bytes BETWEEN 1 AND 524288)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO payment_settings (id, online_enabled) VALUES (1, FALSE);
