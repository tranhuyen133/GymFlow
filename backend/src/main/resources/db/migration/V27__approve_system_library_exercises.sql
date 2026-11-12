-- =====================================================================
-- GymFlow · V26 · Duyệt toàn bộ bài tập thư viện chuẩn để phục vụ Member
--  * Toàn bộ bài tập thư viện hệ thống (150 bài seed) được phê duyệt (APPROVED)
--    để Member có thể tìm kiếm, tra cứu và hiển thị đầy đủ trên Thư viện bài tập.
--  * Đổi giá trị mặc định của review_status sang APPROVED cho dữ liệu bài tập hệ thống.
--  * Đảm bảo tính nhất quán giữa kho bài tập và kho dụng cụ.
-- =====================================================================

-- 1. Duyệt toàn bộ bài tập thư viện đang ở trạng thái PENDING
UPDATE exercises
SET review_status = 'APPROVED'
WHERE review_status = 'PENDING';

-- 2. Đổi giá trị mặc định của review_status sang APPROVED
ALTER TABLE exercises
    ALTER COLUMN review_status SET DEFAULT 'APPROVED';
