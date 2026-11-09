-- =====================================================================
-- GymFlow · V16 · Phân loại Gói Gym và Gói Gym + PT, theo dõi số buổi PT
-- =====================================================================

-- 1. membership_plans: Thêm plan_type, pt_sessions, pt_valid_days
ALTER TABLE membership_plans
    ADD COLUMN plan_type      VARCHAR(10) NOT NULL DEFAULT 'GYM' AFTER includes_trainer,
    ADD COLUMN pt_sessions    INT         NULL AFTER plan_type,
    ADD COLUMN pt_valid_days  INT         NULL AFTER pt_sessions,
    ADD CONSTRAINT ck_plans_type CHECK (plan_type IN ('GYM', 'GYM_PT')),
    ADD CONSTRAINT ck_plans_pt_sessions CHECK (
        (plan_type = 'GYM' AND pt_sessions IS NULL AND pt_valid_days IS NULL)
        OR (plan_type = 'GYM_PT' AND (pt_sessions IS NULL OR (pt_sessions BETWEEN 1 AND 200 AND pt_valid_days BETWEEN 1 AND 1095)))
    );

-- Cập nhật dữ liệu cũ: gói includes_trainer = TRUE chuyển thành GYM_PT, giữ pt_sessions NULL để quản lý cập nhật sau
UPDATE membership_plans SET plan_type = 'GYM_PT' WHERE includes_trainer = TRUE;

-- 2. package_requests: Lưu snapshot số buổi PT và hạn dùng tại thời điểm gửi đơn
ALTER TABLE package_requests
    ADD COLUMN pt_sessions_snapshot   INT NULL AFTER duration_days,
    ADD COLUMN pt_valid_days_snapshot INT NULL AFTER pt_sessions_snapshot;

-- 3. member_subscriptions: Ghi nhận tổng số buổi PT và hạn dùng của gói
ALTER TABLE member_subscriptions
    ADD COLUMN pt_sessions_total INT  NULL AFTER price_paid,
    ADD COLUMN pt_valid_until    DATE NULL AFTER pt_sessions_total;

-- 4. pt_session_usages: Lịch sử trừ buổi PT theo từng buổi tập
CREATE TABLE pt_session_usages (
    id              BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    subscription_id BIGINT      NOT NULL,
    schedule_id     BIGINT      NOT NULL,
    trainer_id      BIGINT      NULL,
    used_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_by      BIGINT      NULL,
    CONSTRAINT fk_ptuse_subscription FOREIGN KEY (subscription_id) REFERENCES member_subscriptions (id) ON DELETE CASCADE,
    CONSTRAINT fk_ptuse_schedule     FOREIGN KEY (schedule_id) REFERENCES workout_schedules (id) ON DELETE CASCADE,
    CONSTRAINT fk_ptuse_trainer      FOREIGN KEY (trainer_id) REFERENCES trainers (id) ON DELETE SET NULL,
    CONSTRAINT fk_ptuse_created_by   FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT uq_ptuse_schedule     UNIQUE (schedule_id),
    INDEX ix_ptuse_sub (subscription_id, used_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
