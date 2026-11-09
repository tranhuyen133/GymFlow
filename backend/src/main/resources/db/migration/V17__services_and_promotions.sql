-- =====================================================================
-- GymFlow · V17 · Dịch vụ bổ sung, quà tặng kèm gói, chương trình ưu đãi
-- =====================================================================

-- 1. services: Danh mục dịch vụ bổ sung (massage, sauna, tủ đồ, khăn tập, tư vấn dinh dưỡng...)
CREATE TABLE services (
    id               BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100)  NOT NULL UNIQUE,
    category         VARCHAR(30)   NOT NULL,
    description      VARCHAR(1000) NULL,
    unit_price       BIGINT        NULL,
    requires_booking BOOLEAN       NOT NULL DEFAULT FALSE,
    opening_note     VARCHAR(255)  NULL,
    active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT ck_services_category CHECK (category IN ('RELAX', 'RECOVERY', 'AMENITY', 'NUTRITION', 'OTHER')),
    CONSTRAINT ck_services_unit_price CHECK (unit_price IS NULL OR unit_price >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 2. plan_service_grants: Lượt dịch vụ tặng kèm theo từng gói tập
CREATE TABLE plan_service_grants (
    plan_id    BIGINT       NOT NULL,
    service_id BIGINT       NOT NULL,
    quantity   INT          NOT NULL,
    valid_days INT          NOT NULL,
    conditions VARCHAR(255) NULL,
    PRIMARY KEY (plan_id, service_id),
    CONSTRAINT fk_psg_plan FOREIGN KEY (plan_id) REFERENCES membership_plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_psg_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
    CONSTRAINT ck_psg_quantity CHECK (quantity > 0),
    CONSTRAINT ck_psg_valid_days CHECK (valid_days > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 3. promotions: Chương trình ưu đãi & mã giảm giá
CREATE TABLE promotions (
    id               BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code             VARCHAR(50)   NULL UNIQUE,
    name             VARCHAR(100)  NOT NULL,
    description      VARCHAR(1000) NULL,
    discount_type    VARCHAR(20)   NOT NULL,
    discount_value   BIGINT        NOT NULL DEFAULT 0,
    starts_at        DATETIME(6)   NOT NULL,
    ends_at          DATETIME(6)   NOT NULL,
    max_uses         INT           NULL,
    used_count       INT           NOT NULL DEFAULT 0,
    new_members_only BOOLEAN       NOT NULL DEFAULT FALSE,
    renewal_only     BOOLEAN       NOT NULL DEFAULT FALSE,
    stackable        BOOLEAN       NOT NULL DEFAULT FALSE,
    active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT ck_promo_discount_type CHECK (discount_type IN ('PERCENT', 'AMOUNT', 'NONE')),
    CONSTRAINT ck_promo_discount_percent CHECK (discount_type != 'PERCENT' OR (discount_value BETWEEN 1 AND 100)),
    CONSTRAINT ck_promo_discount_value CHECK (discount_value >= 0),
    CONSTRAINT ck_promo_dates CHECK (ends_at >= starts_at),
    CONSTRAINT ck_promo_max_uses CHECK (max_uses IS NULL OR (max_uses > 0 AND used_count <= max_uses))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 4. promotion_plans: Gói áp dụng ưu đãi (trống = áp dụng mọi gói)
CREATE TABLE promotion_plans (
    promotion_id BIGINT NOT NULL,
    plan_id      BIGINT NOT NULL,
    PRIMARY KEY (promotion_id, plan_id),
    CONSTRAINT fk_pp_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE CASCADE,
    CONSTRAINT fk_pp_plan FOREIGN KEY (plan_id) REFERENCES membership_plans (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 5. promotion_grants: Quà tặng kèm của chương trình ưu đãi
CREATE TABLE promotion_grants (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    promotion_id BIGINT       NOT NULL,
    service_id   BIGINT       NOT NULL,
    quantity     INT          NOT NULL,
    valid_days   INT          NOT NULL,
    conditions   VARCHAR(255) NULL,
    CONSTRAINT fk_pg_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE CASCADE,
    CONSTRAINT fk_pg_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
    CONSTRAINT ck_pg_quantity CHECK (quantity > 0),
    CONSTRAINT ck_pg_valid_days CHECK (valid_days > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 6. package_requests: Thêm thông tin ưu đãi & tính giá minh bạch
ALTER TABLE package_requests
    ADD COLUMN promotion_id    BIGINT NULL AFTER trainer_id,
    ADD COLUMN original_price  BIGINT NOT NULL DEFAULT 0 AFTER duration_days,
    ADD COLUMN discount_amount BIGINT NOT NULL DEFAULT 0 AFTER original_price,
    ADD COLUMN final_price     BIGINT NOT NULL DEFAULT 0 AFTER discount_amount,
    ADD CONSTRAINT fk_preq_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE SET NULL;

UPDATE package_requests
    SET original_price = price, final_price = price, discount_amount = 0;

-- 7. member_service_entitlements: Quyền lợi lượt dịch vụ của hội viên
CREATE TABLE member_service_entitlements (
    id                    BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id             BIGINT       NOT NULL,
    service_id            BIGINT       NOT NULL,
    source                VARCHAR(20)  NOT NULL,
    subscription_id       BIGINT       NULL,
    package_request_id    BIGINT       NULL,
    service_name_snapshot VARCHAR(100) NOT NULL,
    granted_qty           INT          NOT NULL,
    used_qty              INT          NOT NULL DEFAULT 0,
    valid_from            DATE         NOT NULL,
    valid_until           DATE         NOT NULL,
    conditions_snapshot   VARCHAR(255) NULL,
    status                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_mse_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_mse_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT,
    CONSTRAINT fk_mse_subscription FOREIGN KEY (subscription_id) REFERENCES member_subscriptions (id) ON DELETE SET NULL,
    CONSTRAINT fk_mse_package_request FOREIGN KEY (package_request_id) REFERENCES package_requests (id) ON DELETE SET NULL,
    CONSTRAINT ck_mse_source CHECK (source IN ('PLAN', 'PURCHASE', 'PROMOTION')),
    CONSTRAINT ck_mse_status CHECK (status IN ('ACTIVE', 'CANCELLED')),
    CONSTRAINT ck_mse_qty CHECK (used_qty BETWEEN 0 AND granted_qty),
    CONSTRAINT ck_mse_dates CHECK (valid_until >= valid_from),
    INDEX ix_mse_member (member_id, status),
    INDEX ix_mse_sub (subscription_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 8. service_usages: Lịch sử ghi nhận sử dụng lượt dịch vụ
CREATE TABLE service_usages (
    id             BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    entitlement_id BIGINT        NOT NULL,
    used_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    confirmed_by   BIGINT        NOT NULL,
    note           VARCHAR(255)  NULL,
    CONSTRAINT fk_su_entitlement FOREIGN KEY (entitlement_id) REFERENCES member_service_entitlements (id) ON DELETE CASCADE,
    CONSTRAINT fk_su_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX ix_su_entitlement (entitlement_id, used_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 9. service_requests: Đơn mua lẻ dịch vụ bổ sung
CREATE TABLE service_requests (
    id             BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id      BIGINT       NOT NULL,
    service_id     BIGINT       NOT NULL,
    service_name   VARCHAR(100) NOT NULL,
    quantity       INT          NOT NULL,
    unit_price     BIGINT       NOT NULL,
    total_price    BIGINT       NOT NULL,
    payment_method VARCHAR(20)  NOT NULL DEFAULT 'COUNTER',
    payment_code   VARCHAR(20)  NULL,
    member_paid_at DATETIME(6)  NULL,
    member_note    VARCHAR(255) NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    decision_note  VARCHAR(255) NULL,
    decided_by     BIGINT       NULL,
    decided_at     DATETIME(6)  NULL,
    entitlement_id BIGINT       NULL,
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_sreq_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_sreq_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sreq_decided_by FOREIGN KEY (decided_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_sreq_entitlement FOREIGN KEY (entitlement_id) REFERENCES member_service_entitlements (id) ON DELETE SET NULL,
    CONSTRAINT ck_sreq_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT ck_sreq_payment CHECK (payment_method IN ('COUNTER', 'BANK_TRANSFER')),
    CONSTRAINT ck_sreq_quantity CHECK (quantity > 0),
    CONSTRAINT ck_sreq_price CHECK (unit_price >= 0 AND total_price >= 0),
    CONSTRAINT uq_sreq_payment_code UNIQUE (payment_code),
    INDEX ix_sreq_member (member_id, status),
    INDEX ix_sreq_status (status, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
