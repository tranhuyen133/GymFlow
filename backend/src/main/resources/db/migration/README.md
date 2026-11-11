# Migration CSDL (Flyway) – chủ file: Kiên

| File | Task | Nội dung |
| --- | --- | --- |
| `V1__init_schema.sql` | SCRUM-130, 131, 132 | users, password_reset_tokens, audit_logs · trainers, trainer_shifts, members, weight_records · membership_plans, member_subscriptions, exercises, workout_plans, workout_plan_items, workout_schedules, workout_logs · view `v_subscription_status` · index (SRS 8.6) |
| `V2__content_library.sql` | SCRUM-204 | Bảng content_sources, exercise_sources, articles, article_sources; thêm cột mô tả và cột duyệt cho exercises |
| `V3__seed_content_library.sql` | SCRUM-204 | Dữ liệu nguồn tham khảo, bài tập và bài viết mẫu, tất cả ở trạng thái chờ duyệt |
| `V8__package_requests.sql` | SUB-08 | Bảng package_requests: hội viên tự gửi đơn đăng ký gói, quản lý duyệt/từ chối; giá chốt lúc gửi đơn |
| `V14__email_verification_and_ai_chat.sql` | AI Chatbot, email OTP | Xác thực email, số lần thử OTP, lịch sử hội thoại theo tài khoản |
| `V19__exercise_library_and_equipment.sql` | Thư viện bài tập, dụng cụ | Bảng equipment, bài tập/ bài viết mới, bài thay thế |
| `V21__equipment_auto_approve_and_integrity.sql` | Kho dụng cụ | Duyệt sẵn dụng cụ hiện có, mặc định APPROVED, bổ sung mã dụng cụ còn thiếu từ bài tập |
| `V24__pt_plan_terms.sql` | Gói PT | Mã gói, điều kiện sử dụng, thời lượng buổi PT, số giờ báo huỷ; ảnh chụp quyền lợi lúc bán ở member_subscriptions và package_requests. Chỉ thêm cột |

Quy tắc:
- Không sửa file đã merge. Tạo migration với số cao hơn migration mới nhất đã áp dụng; bỏ qua được V9–V12 trên một số CSDL demo cũ bằng cấu hình Flyway.
- Không đổi tên file đã merge (Flyway sẽ báo lỗi checksum trên máy đã chạy).
- **Mỗi version chỉ dùng một lần.** Trước khi thêm migration, kiểm tra version lớn nhất hiện có; nếu hai nhánh cùng chọn một số, nhánh merge sau phải đổi sang số tiếp theo.
- Test `FlywayMigrationGuardTest` tự chạy trong `gradle build`/CI để chặn trùng version và tên file sai định dạng.
- Migration phải an toàn khi chạy lại: dùng `CREATE TABLE IF NOT EXISTS`, `INSERT IGNORE`, `ON DUPLICATE KEY UPDATE` hoặc `UPDATE ... WHERE ...` thay vì thao tác phá dữ liệu.
- Không xoá/đổi tên cột đang được code hoặc dữ liệu cũ dùng; bổ sung cột mới qua migration mới.
