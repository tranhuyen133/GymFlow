<!--
CHỦ FILE: Linh (Hồ Khánh Linh)
TASK: SCRUM-148 · HẠN: 13/11/2026
CẦN LÀM: Danh sách bug. Ghi: mã, màn hoặc API, file, người sửa.
Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
-->

# Danh Sách Bug (Bug Tracking)

| Mã Bug | Màn hình / API | File liên quan | Người sửa | Trạng thái | Ghi chú |
| ------ | -------------- | -------------- | --------- | ---------- | ------- |
| **BUG-03** | API hoàn thành buổi tập `POST /api/schedules/{id}/complete` | `backend/src/main/java/com/gymflow/service/ScheduleService.java`, `backend/src/main/java/com/gymflow/web/ScheduleController.java`, `frontend/src/pages/shared/Schedules.tsx` | Huyền | Cần xác minh · Ưu tiên cao nếu tái hiện | **Chưa xác nhận là lỗi; chưa chạy test.** Jira summary nếu tái hiện: “API cho phép hoàn thành buổi tập không ở trạng thái SCHEDULED hoặc đã quá hạn”. Liên quan TC-09-03, TC-09-04, TC-09-06. Tái hiện riêng từng trường hợp: 1) chọn buổi `CANCELLED`, `MISSED`, đã `COMPLETED` hoặc quá 7 ngày; 2) gửi request hoàn thành với payload hợp lệ, ví dụ `durationMinutes=60`; 3) đối chiếu HTTP status, trạng thái buổi và số nhật ký. **Mong đợi:** request bị từ chối, không tạo/cập nhật nhật ký. **Thực tế:** chưa chạy, cần ghi lại response và dữ liệu sau khi chạy. Chỉ chuyển thành bug mở nếu kết quả khác mong đợi. |
| **BUG-04** | API tiến độ & BMI `GET /members/{id}/progress` | `backend/src/main/java/com/gymflow/service/ProgressService.java`, `backend/src/main/java/com/gymflow/web/MemberController.java`, `frontend/src/pages/member/MyProgress.tsx` | Kiên | Cần xác minh · Ưu tiên trung bình nếu tái hiện | **Chưa xác nhận là lỗi; chưa chạy test.** Jira summary nếu tái hiện: “Chỉ số tiến độ/BMI không khớp quy tắc tính hoặc dữ liệu biên”. Liên quan TC-10-01, TC-10-06. Tạo dữ liệu có/không có chiều cao, cân nặng, buổi hoàn thành và buổi vắng trong 8 tuần; gọi API tiến độ và đối chiếu BMI làm tròn 1 chữ số, các trường `null` khi thiếu dữ liệu, tỷ lệ chuyên cần và chuỗi tuần theo `docs/api/weights-progress.md`. **Mong đợi:** mọi giá trị khớp quy tắc API. **Thực tế:** chưa chạy, cần lưu response và phép tính đối chiếu. Chỉ chuyển thành bug mở nếu có sai khác tái hiện được. |
| **BUG-02** | Diễn đàn `/forum`, `/community` | `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx` | Tùng | Mở · Trung bình | Trên VPS, đăng nhập bằng tài khoản HLV hoặc hội viên rồi mở `/community`; cả `/community` và `/forum` đều hiện trang 404. Menu điều hướng vẫn có mục diễn đàn; mã nguồn hiện tại khai báo cả hai route. Có thể bản frontend trên VPS chưa đồng bộ với mã nguồn; cần kiểm tra/redeploy và xác nhận lại. |
| **BUG-01** | Hướng dẫn đăng nhập demo | `docs/test/UC-01-03.md`, `docs/test/UC-04-05.md`, `docs/test/UC-06-07.md` | Linh | Đã xử lý tài liệu | Đã bỏ mật khẩu demo cũ khỏi tài liệu và thay bằng hướng dẫn nhận mật khẩu qua kênh bảo mật. Thông tin xác thực không được lưu trong repository. Cần chạy lại các ca UI sau khi đăng nhập bằng bộ tài khoản hiện hành. |
