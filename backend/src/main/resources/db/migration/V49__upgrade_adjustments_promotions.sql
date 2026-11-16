-- V49 · Nâng cấp gói tự tập → gói có PT (bù trừ giá trị còn lại), ưu đãi theo đối tượng (sinh nhật / nâng cấp),
-- hội viên gửi yêu cầu điều chỉnh gói cho quản lý duyệt, lịch sử sửa thời gian gói, dữ liệu mẫu dịch vụ + ưu đãi.
-- Chỉ THÊM cột / bảng / dữ liệu; dữ liệu mẫu dùng WHERE NOT EXISTS nên chạy trên DB đã có dữ liệu thật vẫn an toàn.

-- 1. Ưu đãi theo đối tượng: ALL = mọi người, BIRTHDAY = trong tháng sinh nhật, UPGRADE = chỉ khi nâng cấp lên PT.
ALTER TABLE promotions
    ADD COLUMN audience VARCHAR(20) NOT NULL DEFAULT 'ALL' AFTER stackable,
    ADD CONSTRAINT ck_promo_audience CHECK (audience IN ('ALL', 'BIRTHDAY', 'UPGRADE'));

-- 2. Đơn nâng cấp: chung bảng package_requests (một hội viên chỉ có một đơn chờ, dùng lại luồng thanh toán / duyệt).
--    upgrade_credit = giá trị còn lại của gói tự tập được trừ vào giá gói PT, chốt lúc gửi đơn.
ALTER TABLE package_requests
    ADD COLUMN request_type                 VARCHAR(10) NOT NULL DEFAULT 'NEW' AFTER plan_id,
    ADD COLUMN upgrade_from_subscription_id BIGINT      NULL AFTER request_type,
    ADD COLUMN upgrade_credit               BIGINT      NOT NULL DEFAULT 0 AFTER discount_amount,
    ADD CONSTRAINT fk_preq_upgrade_from FOREIGN KEY (upgrade_from_subscription_id) REFERENCES member_subscriptions (id) ON DELETE SET NULL,
    ADD CONSTRAINT ck_preq_type CHECK (request_type IN ('NEW', 'UPGRADE')),
    ADD CONSTRAINT ck_preq_upgrade_credit CHECK (upgrade_credit >= 0 AND (request_type = 'UPGRADE' OR upgrade_credit = 0));

-- Gói PT sinh ra từ nâng cấp trỏ về gói tự tập cũ (gói cũ được cắt ngắn tới hôm trước ngày nâng cấp).
ALTER TABLE member_subscriptions
    ADD COLUMN upgraded_from_id BIGINT NULL AFTER plan_id,
    ADD CONSTRAINT fk_sub_upgraded_from FOREIGN KEY (upgraded_from_id) REFERENCES member_subscriptions (id) ON DELETE SET NULL;

-- 3. Yêu cầu điều chỉnh gói của hội viên, quản lý duyệt:
--    CHANGE_START   dời ngày bắt đầu gói chưa tới ngày (giữ nguyên số ngày)
--    PAUSE          bảo lưu: cộng thêm 1–30 ngày vào cuối gói (ốm, công tác…)
--    CHANGE_TRAINER đổi HLV phụ trách (chỉ gói có PT)
--    old_*_date chụp lại thời gian gói lúc gửi để quản lý thấy trước / sau.
CREATE TABLE subscription_change_requests (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id       BIGINT       NOT NULL,
    subscription_id BIGINT       NOT NULL,
    change_type     VARCHAR(20)  NOT NULL,
    new_start_date  DATE         NULL,
    pause_days      INT          NULL,
    trainer_id      BIGINT       NULL,
    old_start_date  DATE         NOT NULL,
    old_end_date    DATE         NOT NULL,
    reason          VARCHAR(255) NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    decision_note   VARCHAR(255) NULL,
    decided_by      BIGINT       NULL,
    decided_at      DATETIME(6)  NULL,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_scr_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_scr_subscription FOREIGN KEY (subscription_id) REFERENCES member_subscriptions (id) ON DELETE CASCADE,
    CONSTRAINT fk_scr_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (id) ON DELETE SET NULL,
    CONSTRAINT fk_scr_decided_by FOREIGN KEY (decided_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_scr_type CHECK (change_type IN ('CHANGE_START', 'PAUSE', 'CHANGE_TRAINER')),
    CONSTRAINT ck_scr_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT ck_scr_payload CHECK (
        (change_type = 'CHANGE_START' AND new_start_date IS NOT NULL AND pause_days IS NULL)
        OR (change_type = 'PAUSE' AND pause_days BETWEEN 1 AND 30 AND new_start_date IS NULL)
        OR (change_type = 'CHANGE_TRAINER' AND new_start_date IS NULL AND pause_days IS NULL)),
    CONSTRAINT ck_scr_old_dates CHECK (old_end_date >= old_start_date),
    INDEX ix_scr_member (member_id, status),
    INDEX ix_scr_status (status, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 4. Lịch sử sửa thời gian gói (quản lý sửa trực tiếp, duyệt yêu cầu của hội viên, hoặc cắt gói cũ khi nâng cấp).
CREATE TABLE subscription_adjustments (
    id                 BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    subscription_id    BIGINT       NOT NULL,
    source             VARCHAR(20)  NOT NULL,
    change_request_id  BIGINT       NULL,
    old_start_date     DATE         NOT NULL,
    old_end_date       DATE         NOT NULL,
    new_start_date     DATE         NOT NULL,
    new_end_date       DATE         NOT NULL,
    old_pt_valid_until DATE         NULL,
    new_pt_valid_until DATE         NULL,
    reason             VARCHAR(255) NOT NULL,
    created_by         BIGINT       NULL,
    created_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_sadj_subscription FOREIGN KEY (subscription_id) REFERENCES member_subscriptions (id) ON DELETE CASCADE,
    CONSTRAINT fk_sadj_change_request FOREIGN KEY (change_request_id) REFERENCES subscription_change_requests (id) ON DELETE SET NULL,
    CONSTRAINT fk_sadj_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_sadj_source CHECK (source IN ('ADMIN', 'MEMBER_REQUEST', 'UPGRADE')),
    CONSTRAINT ck_sadj_dates CHECK (new_end_date >= new_start_date AND old_end_date >= old_start_date),
    INDEX ix_sadj_sub (subscription_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 5. Dữ liệu mẫu: dịch vụ bổ sung (mua lẻ / tặng kèm gói / tặng kèm ưu đãi).
INSERT INTO services (name, category, description, unit_price, requires_booking, opening_note, active)
SELECT s.name, s.category, s.description, s.unit_price, s.requires_booking, s.opening_note, TRUE
FROM (
    SELECT 'Xông hơi khô (Sauna)' AS name, 'RELAX' AS category,
           'Phòng sauna 80–90°C, tối đa 15 phút mỗi lượt. Uống đủ nước trước và sau khi xông.' AS description,
           50000 AS unit_price, FALSE AS requires_booking, '10:00–21:00 hằng ngày' AS opening_note
    UNION ALL SELECT 'Xông hơi ướt (Steam)', 'RELAX',
           'Phòng xông hơi nước thảo mộc, giúp thư giãn và làm sạch da sau buổi tập.', 50000, FALSE, '10:00–21:00 hằng ngày'
    UNION ALL SELECT 'Massage thể thao 60 phút', 'RECOVERY',
           'Massage sâu nhóm cơ vừa tập, giảm đau mỏi (DOMS), do kỹ thuật viên có chứng chỉ thực hiện.', 350000, TRUE, 'Đặt lịch trước ít nhất 3 giờ'
    UNION ALL SELECT 'Massage cổ vai gáy 30 phút', 'RECOVERY',
           'Giải toả căng cơ cổ, vai, gáy – hợp với dân văn phòng ngồi nhiều.', 180000, TRUE, 'Đặt lịch trước ít nhất 3 giờ'
    UNION ALL SELECT 'Giãn cơ hỗ trợ cùng HLV (30 phút)', 'RECOVERY',
           'HLV hỗ trợ giãn cơ thụ động, tăng biên độ khớp hông, vai, cột sống.', 150000, TRUE, 'Theo lịch trống của HLV'
    UNION ALL SELECT 'Ngâm bồn nước đá phục hồi', 'RECOVERY',
           'Ngâm nước 10–12°C trong 5–8 phút sau buổi tập nặng để giảm viêm, phục hồi nhanh.', 120000, TRUE, 'Không dùng khi đang cảm sốt hoặc có bệnh tim mạch'
    UNION ALL SELECT 'Đo InBody phân tích cơ thể', 'OTHER',
           'Đo % mỡ, khối cơ, nước, mỡ nội tạng bằng máy InBody 570; có bản in giải thích kết quả.', 100000, TRUE, 'Nhịn ăn 2 giờ trước khi đo'
    UNION ALL SELECT 'Tư vấn dinh dưỡng 1:1 (45 phút)', 'NUTRITION',
           'Chuyên viên lập thực đơn theo mục tiêu (giảm mỡ / tăng cơ), tính calo và macro.', 300000, TRUE, 'Mang kết quả InBody gần nhất nếu có'
    UNION ALL SELECT 'Ly whey protein sau tập', 'NUTRITION',
           'Một ly whey 25 g protein pha sẵn tại quầy bar (vani, socola, dâu).', 45000, FALSE, 'Quầy bar tầng 1'
    UNION ALL SELECT 'Thuê tủ đồ cá nhân theo tháng', 'AMENITY',
           'Tủ khoá riêng có ổ cắm sạc, để đồ qua đêm, 30 ngày mỗi lượt.', 150000, FALSE, 'Nhận chìa khoá tại lễ tân'
    UNION ALL SELECT 'Khăn tập & nước suối', 'AMENITY',
           'Một khăn tập sạch và một chai nước suối 500 ml.', 20000, FALSE, 'Lấy tại lễ tân'
) s
WHERE NOT EXISTS (SELECT 1 FROM services x WHERE x.name = s.name);

-- 6. Dữ liệu mẫu: chương trình ưu đãi – ngày lễ, sinh nhật, nâng cấp lên PT, hội viên mới, gia hạn.
--    code NULL = tự áp dụng khi đủ điều kiện (hệ thống chọn ưu đãi giảm nhiều nhất).
INSERT INTO promotions (code, name, description, discount_type, discount_value, starts_at, ends_at, max_uses,
                        new_members_only, renewal_only, stackable, audience, active)
SELECT p.code, p.name, p.description, p.discount_type, p.discount_value, p.starts_at, p.ends_at, p.max_uses,
       p.new_members_only, p.renewal_only, FALSE, p.audience, TRUE
FROM (
    SELECT NULL AS code, 'Mừng sinh nhật – giảm 15%' AS name,
           'Tự áp dụng khi bạn đăng ký hoặc nâng cấp gói trong tháng sinh nhật (theo ngày sinh trong hồ sơ). Tặng kèm 1 lượt massage cổ vai gáy.' AS description,
           'PERCENT' AS discount_type, 15 AS discount_value,
           TIMESTAMP('2026-01-01 00:00:00') AS starts_at, TIMESTAMP('2030-12-31 23:59:59') AS ends_at, NULL AS max_uses,
           FALSE AS new_members_only, FALSE AS renewal_only, 'BIRTHDAY' AS audience
    UNION ALL SELECT NULL, 'Nâng cấp lên PT – giảm thêm 10%',
           'Tự áp dụng khi nâng cấp từ gói tự tập lên gói có HLV: giảm thêm 10% trên số tiền còn phải trả sau bù trừ. Tặng 1 lượt đo InBody để HLV lên giáo án.',
           'PERCENT', 10, TIMESTAMP('2026-01-01 00:00:00'), TIMESTAMP('2030-12-31 23:59:59'), NULL, FALSE, FALSE, 'UPGRADE'
    UNION ALL SELECT 'LENPT300', 'Lên PT giảm 300.000đ',
           'Nhập mã khi nâng cấp lên gói có HLV, giảm thẳng 300.000đ. Giới hạn 100 lượt.',
           'AMOUNT', 300000, TIMESTAMP('2026-11-01 00:00:00'), TIMESTAMP('2027-06-30 23:59:59'), 100, FALSE, FALSE, 'UPGRADE'
    UNION ALL SELECT 'NHAGIAO2011', 'Tri ân Nhà giáo 20/11 – giảm 20%',
           'Áp dụng mọi gói từ 15/11 đến hết 22/11/2026.',
           'PERCENT', 20, TIMESTAMP('2026-11-15 00:00:00'), TIMESTAMP('2026-11-22 23:59:59'), 200, FALSE, FALSE, 'ALL'
    UNION ALL SELECT 'BLACKFRIDAY', 'Black Friday – giảm 30%',
           'Bốn ngày vàng 27–30/11/2026, giảm 30% mọi gói. Giới hạn 100 lượt.',
           'PERCENT', 30, TIMESTAMP('2026-11-27 00:00:00'), TIMESTAMP('2026-11-30 23:59:59'), 100, FALSE, FALSE, 'ALL'
    UNION ALL SELECT 'NOEL2026', 'Giáng sinh & Năm mới – giảm 15%',
           'Từ 20/12/2026 đến 03/01/2027, tặng kèm 2 ly whey sau tập.',
           'PERCENT', 15, TIMESTAMP('2026-12-20 00:00:00'), TIMESTAMP('2027-01-03 23:59:59'), NULL, FALSE, FALSE, 'ALL'
    UNION ALL SELECT 'TET2027', 'Tết Đinh Mùi – lì xì 500.000đ',
           'Lì xì 500.000đ cho gói từ 2.000.000đ, từ 25/01 đến 21/02/2027. Tặng 1 buổi massage thể thao.',
           'AMOUNT', 500000, TIMESTAMP('2027-01-25 00:00:00'), TIMESTAMP('2027-02-21 23:59:59'), 300, FALSE, FALSE, 'ALL'
    UNION ALL SELECT 'PHUNU83', 'Quốc tế Phụ nữ 8/3 – giảm 20%',
           'Từ 05/03 đến 09/03/2027.',
           'PERCENT', 20, TIMESTAMP('2027-03-05 00:00:00'), TIMESTAMP('2027-03-09 23:59:59'), NULL, FALSE, FALSE, 'ALL'
    UNION ALL SELECT 'GIAIPHONG', 'Lễ 30/4 – 1/5 giảm 20%',
           'Từ 25/04 đến 03/05/2027.',
           'PERCENT', 20, TIMESTAMP('2027-04-25 00:00:00'), TIMESTAMP('2027-05-03 23:59:59'), NULL, FALSE, FALSE, 'ALL'
    UNION ALL SELECT 'QUOCKHANH', 'Quốc khánh 2/9 – giảm 29%',
           'Từ 30/08 đến 03/09/2027. Giới hạn 100 lượt.',
           'PERCENT', 29, TIMESTAMP('2027-08-30 00:00:00'), TIMESTAMP('2027-09-03 23:59:59'), 100, FALSE, FALSE, 'ALL'
    UNION ALL SELECT 'CHAOBANMOI', 'Chào hội viên mới – giảm 10%',
           'Dành cho người chưa từng mua gói tại GymFlow.',
           'PERCENT', 10, TIMESTAMP('2026-11-01 00:00:00'), TIMESTAMP('2027-12-31 23:59:59'), NULL, TRUE, FALSE, 'ALL'
    UNION ALL SELECT 'GIAHAN15', 'Gia hạn sớm – giảm 15%',
           'Dành cho hội viên đã có gói, gia hạn để tập liền mạch.',
           'PERCENT', 15, TIMESTAMP('2026-11-01 00:00:00'), TIMESTAMP('2027-12-31 23:59:59'), NULL, FALSE, TRUE, 'ALL'
) p
WHERE NOT EXISTS (SELECT 1 FROM promotions x WHERE (p.code IS NOT NULL AND x.code = p.code) OR x.name = p.name);

-- Tết chỉ áp dụng cho gói từ 2.000.000đ đang bán.
INSERT INTO promotion_plans (promotion_id, plan_id)
SELECT pr.id, mp.id FROM promotions pr JOIN membership_plans mp ON mp.price >= 2000000 AND mp.active = TRUE
WHERE pr.code = 'TET2027'
  AND NOT EXISTS (SELECT 1 FROM promotion_plans x WHERE x.promotion_id = pr.id AND x.plan_id = mp.id);

-- Quà tặng kèm ưu đãi.
INSERT INTO promotion_grants (promotion_id, service_id, quantity, valid_days, conditions)
SELECT pr.id, sv.id, g.quantity, g.valid_days, g.conditions
FROM (
    SELECT 'Mừng sinh nhật – giảm 15%' AS promo, 'Massage cổ vai gáy 30 phút' AS service, 1 AS quantity, 30 AS valid_days,
           'Dùng trong 30 ngày kể từ ngày gói bắt đầu' AS conditions
    UNION ALL SELECT 'Nâng cấp lên PT – giảm thêm 10%', 'Đo InBody phân tích cơ thể', 1, 30, 'Đo trước buổi PT đầu tiên để HLV lên giáo án'
    UNION ALL SELECT 'Giáng sinh & Năm mới – giảm 15%', 'Ly whey protein sau tập', 2, 30, NULL
    UNION ALL SELECT 'Tết Đinh Mùi – lì xì 500.000đ', 'Massage thể thao 60 phút', 1, 60, 'Đặt lịch trước 3 giờ'
) g
JOIN promotions pr ON pr.name = g.promo
JOIN services sv ON sv.name = g.service
WHERE NOT EXISTS (SELECT 1 FROM promotion_grants x WHERE x.promotion_id = pr.id AND x.service_id = sv.id);

-- Quà tặng kèm một số gói mẫu (V33) nếu gói đó chưa có quà.
INSERT INTO plan_service_grants (plan_id, service_id, quantity, valid_days, conditions)
SELECT mp.id, sv.id, g.quantity, g.valid_days, g.conditions
FROM (
    SELECT 'PT-12' AS plan_code, 'Đo InBody phân tích cơ thể' AS service, 2 AS quantity, 42 AS valid_days, 'Đầu và cuối liệu trình' AS conditions
    UNION ALL SELECT 'PT-24', 'Đo InBody phân tích cơ thể', 3, 90, 'Mỗi tháng một lần'
    UNION ALL SELECT 'PT-24', 'Massage thể thao 60 phút', 1, 90, NULL
    UNION ALL SELECT 'PT-36-FATLOSS', 'Tư vấn dinh dưỡng 1:1 (45 phút)', 2, 120, 'Buổi đầu và giữa liệu trình'
    UNION ALL SELECT 'PT-36-FATLOSS', 'Đo InBody phân tích cơ thể', 4, 120, 'Mỗi tháng một lần'
    UNION ALL SELECT 'GYM-24M', 'Thuê tủ đồ cá nhân theo tháng', 3, 730, NULL
    UNION ALL SELECT 'GYM-24M', 'Xông hơi khô (Sauna)', 10, 730, NULL
) g
JOIN membership_plans mp ON mp.code = g.plan_code
JOIN services sv ON sv.name = g.service
WHERE NOT EXISTS (SELECT 1 FROM plan_service_grants x WHERE x.plan_id = mp.id AND x.service_id = sv.id);
