-- =====================================================================
-- GymFlow · V7 · Số đo vòng cơ thể (cm), ghi cùng bản ghi cân nặng theo ngày
--  * Chỉ thêm cột cho phép NULL → bản ghi cũ giữ nguyên, không cần nhập lại.
--  * Khoảng CHECK chỉ để chặn lỗi gõ (VD gõ 800 thay vì 80), không phải chuẩn sức khoẻ;
--    trùng với @DecimalMin/@DecimalMax trong Dtos.WeightRequest.
-- =====================================================================
ALTER TABLE weight_records
    ADD COLUMN waist_cm DECIMAL(4, 1) NULL AFTER body_fat,
    ADD COLUMN chest_cm DECIMAL(4, 1) NULL AFTER waist_cm,
    ADD COLUMN arm_cm   DECIMAL(4, 1) NULL AFTER chest_cm,
    ADD COLUMN thigh_cm DECIMAL(4, 1) NULL AFTER arm_cm,
    ADD CONSTRAINT ck_waist_range CHECK (waist_cm IS NULL OR waist_cm BETWEEN 40 AND 200),
    ADD CONSTRAINT ck_chest_range CHECK (chest_cm IS NULL OR chest_cm BETWEEN 50 AND 200),
    ADD CONSTRAINT ck_arm_range   CHECK (arm_cm IS NULL OR arm_cm BETWEEN 15 AND 80),
    ADD CONSTRAINT ck_thigh_range CHECK (thigh_cm IS NULL OR thigh_cm BETWEEN 25 AND 120);
