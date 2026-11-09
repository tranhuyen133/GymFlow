<!--
CHỦ FILE: Linh (Hồ Khánh Linh)
TASK: SCRUM-148 · HẠN: 13/11/2026
CẦN LÀM: Danh sách bug. Ghi: mã, màn hoặc API, file, người sửa.
Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
-->

# Danh Sách Bug (Bug Tracking)

| Mã Bug | Màn hình / API | File liên quan | Người sửa | Trạng thái | Ghi chú |
| ------ | -------------- | -------------- | --------- | ---------- | ------- |
| **BUG-01** | Hướng dẫn đăng nhập demo | `docs/test/UC-01-03.md`, `docs/test/UC-04-05.md`, `docs/test/UC-06-07.md` | Linh | Đã xử lý tài liệu | Đã bỏ mật khẩu demo cũ khỏi tài liệu và thay bằng hướng dẫn nhận mật khẩu qua kênh bảo mật. Thông tin xác thực không được lưu trong repository. Cần chạy lại các ca UI sau khi đăng nhập bằng bộ tài khoản hiện hành. |
| **BUG-02** | Diễn đàn `/forum`, `/community` | `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx` | Tùng | Mở · Trung bình | Trên VPS, đăng nhập bằng tài khoản HLV hoặc hội viên rồi mở `/community`; cả `/community` và `/forum` đều hiện trang 404. Menu điều hướng vẫn có mục diễn đàn; mã nguồn hiện tại khai báo cả hai route. Có thể bản frontend trên VPS chưa đồng bộ với mã nguồn; cần kiểm tra/redeploy và xác nhận lại. |
