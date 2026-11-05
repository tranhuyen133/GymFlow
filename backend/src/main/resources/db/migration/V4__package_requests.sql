-- =====================================================================
-- GymFlow · V4 · Hội viên tự đăng ký gói tập (SUB-08)
-- Hội viên gửi đơn chọn gói → quản lý xác nhận đã thu tiền tại quầy → hệ thống tạo member_subscriptions.
-- Giá, tên gói và thời hạn được chốt lúc gửi đơn: quản lý sửa giá sau đó không ảnh hưởng đơn đã gửi.
-- Chỉ thêm bảng mới, không sửa dữ liệu cũ.
-- Mỗi hội viên tối đa 1 đơn PENDING: kiểm tra ở PackageRequestService (khoá dòng hội viên như khi tạo gói).
-- =====================================================================
CREATE TABLE package_requests (
    id                  BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id           BIGINT       NOT NULL,
    plan_id             BIGINT       NOT NULL,
    plan_name           VARCHAR(100) NOT NULL,
    price               BIGINT       NOT NULL,
    duration_days       INT          NOT NULL,
    desired_start_date  DATE,
    member_note         VARCHAR(255),
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    decision_note       VARCHAR(255),
    decided_by          BIGINT,
    decided_at          DATETIME(6),
    subscription_id     BIGINT,
    created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_preq_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_preq_plan FOREIGN KEY (plan_id) REFERENCES membership_plans (id) ON DELETE RESTRICT,
    CONSTRAINT fk_preq_decided_by FOREIGN KEY (decided_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_preq_subscription FOREIGN KEY (subscription_id) REFERENCES member_subscriptions (id) ON DELETE SET NULL,
    CONSTRAINT ck_preq_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT ck_preq_price CHECK (price >= 0),
    CONSTRAINT ck_preq_duration CHECK (duration_days BETWEEN 1 AND 1095),
    INDEX ix_preq_member (member_id, status),
    INDEX ix_preq_status (status, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
