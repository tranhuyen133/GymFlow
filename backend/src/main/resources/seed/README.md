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

2. `articles.json` (Hạn: 13/11/2026 - SCRUM-221) - **ĐÃ HOÀN THÀNH**:
   - Chứa 10 bài viết kiến thức mẫu đa dạng các chủ đề (`NUTRITION`, `HYDRATION`, `SLEEP`, `ACTIVITY`, `RECOVERY`).
   - Có đầy đủ thông tin: tiêu đề, đường dẫn (slug), tóm tắt, nội dung chi tiết theo định dạng Markdown, ghi chú rà soát (`reviewNote`) và nguồn tham khảo chuẩn y tế/thể thao (`NHS`, `WHO`).
   - Phân loại rõ xuất xứ: `SELF_AUTHORED` (tự biên soạn) hoặc `ADAPTED` (phóng tác từ tài liệu mở có trích dẫn nguồn).

*DataSeeder đọc 2 file JSON này khi khởi động ứng dụng để nạp kho nội dung mẫu.*
