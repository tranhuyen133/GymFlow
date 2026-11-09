-- =====================================================================
-- GymFlow · V20 · Lưu lịch sử áp dụng giáo án theo tài khoản hội viên
-- =====================================================================

CREATE TABLE workout_plan_history (
    id                          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id                   BIGINT       NOT NULL,
    old_plan_id                 BIGINT       NULL,
    old_plan_name               VARCHAR(120) NULL,
    new_plan_id                 BIGINT       NOT NULL,
    new_plan_name               VARCHAR(120) NOT NULL,
    applied_at                  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ended_at                    DATETIME(6)  NULL,
    cancelled_future_sessions   INT          NOT NULL DEFAULT 0,
    note                        VARCHAR(255) NULL,
    CONSTRAINT fk_wph_member   FOREIGN KEY (member_id)   REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_wph_old_plan FOREIGN KEY (old_plan_id) REFERENCES workout_plans (id) ON DELETE SET NULL,
    CONSTRAINT fk_wph_new_plan FOREIGN KEY (new_plan_id) REFERENCES workout_plans (id) ON DELETE CASCADE,
    INDEX ix_wph_member (member_id, applied_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
