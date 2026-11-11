-- =====================================================================
-- GymFlow · V24 · Điều kiện gói PT và ảnh chụp quyền lợi lúc bán
--  * membership_plans: mã gói (không bắt buộc, duy nhất), điều kiện sử dụng, thời lượng một buổi PT,
--    số giờ phải báo trước khi huỷ/dời buổi PT. Tất cả để NULL = chưa khai báo: quản lý tự nhập ở Quản lý › Gói tập,
--    không tự đặt số liệu kinh doanh.
--  * member_subscriptions: chụp lại tên gói, quyền lợi, điều kiện, thời lượng buổi và số giờ báo huỷ lúc bán,
--    để quản lý sửa gói về sau không làm đổi quyền lợi hội viên đã mua. Gói bán trước V24 giữ NULL
--    (không suy ngược từ cấu hình gói hiện tại vì có thể đã bị sửa).
--  * package_requests: chụp thời lượng buổi và số giờ báo huỷ lúc hội viên gửi đơn, giống pt_sessions_snapshot (V16).
--  * Chỉ thêm cột, không sửa hay xoá dữ liệu cũ.
-- =====================================================================

ALTER TABLE membership_plans
    ADD COLUMN code                   VARCHAR(30)   NULL AFTER name,
    ADD COLUMN usage_terms            VARCHAR(1000) NULL AFTER benefits,
    ADD COLUMN pt_session_minutes     INT           NULL AFTER pt_valid_days,
    ADD COLUMN pt_cancel_notice_hours INT           NULL AFTER pt_session_minutes,
    ADD CONSTRAINT uq_plans_code UNIQUE (code),
    ADD CONSTRAINT ck_plans_pt_terms CHECK (
        (plan_type = 'GYM' AND pt_session_minutes IS NULL AND pt_cancel_notice_hours IS NULL)
        OR (plan_type = 'GYM_PT'
            AND (pt_session_minutes IS NULL OR pt_session_minutes BETWEEN 15 AND 240)
            AND (pt_cancel_notice_hours IS NULL OR pt_cancel_notice_hours BETWEEN 0 AND 168))
    );

ALTER TABLE member_subscriptions
    ADD COLUMN plan_name_snapshot              VARCHAR(100)  NULL AFTER plan_id,
    ADD COLUMN benefits_snapshot               VARCHAR(1000) NULL AFTER pt_valid_until,
    ADD COLUMN usage_terms_snapshot            VARCHAR(1000) NULL AFTER benefits_snapshot,
    ADD COLUMN pt_session_minutes_snapshot     INT           NULL AFTER usage_terms_snapshot,
    ADD COLUMN pt_cancel_notice_hours_snapshot INT           NULL AFTER pt_session_minutes_snapshot;

ALTER TABLE package_requests
    ADD COLUMN pt_session_minutes_snapshot     INT NULL AFTER pt_valid_days_snapshot,
    ADD COLUMN pt_cancel_notice_hours_snapshot INT NULL AFTER pt_session_minutes_snapshot;
