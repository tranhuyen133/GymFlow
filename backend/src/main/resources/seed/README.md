<!--
CHỦ FILE: Linh (Hồ Khánh Linh)
TASK: SCRUM-173 · HẠN: 05/11/2026
TASK: SCRUM-221 · HẠN: 13/11/2026
CẦN LÀM: SCRUM-173 · 05/11: exercises.json (10 bài, có cách thở, lỗi thường gặp, lưu ý an toàn, nguồn). SCRUM-221 · 13/11: articles.json (bài viết có nguồn, loại SELF_AUTHORED/ADAPTED). Kiên viết code đọc 2 file này.
Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
-->

# Dữ Liệu Khởi Tạo (Seed Data)

1. `exercises.json` (Hạn: 05/11/2026 - SCRUM-173) - **ĐÃ HOÀN THÀNH**:
   - Chứa 10 bài tập mẫu đa dạng nhóm cơ (Ngực, Lưng, Chân, Vai, Tay, Bụng, Toàn thân).
   - Có đầy đủ thông tin: hướng dẫn kỹ thuật chi tiết, cách hít thở, lỗi thường gặp, lưu ý an toàn và nguồn tham khảo chuẩn y tế (NHS OGL v3.0).

2. `articles.json` (Hạn: 13/11/2026 - SCRUM-221) - **ĐÃ NHẬP VÀ SOÁT BÀI MẪU**:
   - Chứa 5 bài viết tiếng Việt về đi bộ, sức mạnh nhẹ, thăng bằng, vận động khi ngồi và độ linh hoạt; mỗi bài có slug, chủ đề, tóm tắt, nội dung, nguồn tham khảo và phân loại `ADAPTED`.
   - Các giá trị `sources` tham chiếu mã nguồn đã được khai báo trong migration `V3`/`V5`; trạng thái ban đầu là `PENDING`, không tự xuất bản nội dung sức khỏe.
   - Đã đối chiếu nội dung với các trang NHS được trỏ bởi mã nguồn; chọn chủ đề khác với các bài kiến thức đã có trong migration để tránh tạo bài trùng nội dung.
   - Nội dung được biên soạn lại, không sao chép nguyên văn. Bài chỉ cung cấp thông tin chung và không thay thế tư vấn y tế.

**Phạm vi SCRUM-221:** nhập và soát nội dung bài viết mẫu có nguồn trong `articles.json`. Việc tự động nạp file này khi ứng dụng khởi động không nằm trong phần hoàn thiện nội dung và cần được xác nhận riêng nếu task yêu cầu tích hợp runtime.
