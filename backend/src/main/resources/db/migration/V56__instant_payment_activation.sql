-- V56 · Hội viên bấm "Tôi đã chuyển khoản" là gói chạy ngay; quản lý đối soát sau (xác nhận đã nhận tiền hoặc thu hồi gói).
-- auto_activated_at: lúc hệ thống tự kích hoạt · reconciled_at/by: quản lý xác nhận đã nhận tiền · revoked_at: quản lý thu hồi vì không nhận được tiền.
ALTER TABLE package_requests
    ADD COLUMN auto_activated_at DATETIME NULL,
    ADD COLUMN reconciled_at DATETIME NULL,
    ADD COLUMN reconciled_by BIGINT NULL,
    ADD COLUMN revoked_at DATETIME NULL,
    ADD CONSTRAINT fk_preq_reconciled_by FOREIGN KEY (reconciled_by) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX ix_preq_auto_open ON package_requests (auto_activated_at, reconciled_at, revoked_at);
