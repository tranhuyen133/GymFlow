# Migration CSDL (Flyway) – chủ file: Kiên

| File | Task | Nội dung |
| --- | --- | --- |
| `V1__init_schema.sql` | SCRUM-130, 131, 132 | users, password_reset_tokens, audit_logs · trainers, trainer_shifts, members, weight_records · membership_plans, member_subscriptions, exercises, workout_plans, workout_plan_items, workout_schedules, workout_logs · view `v_subscription_status` · index (SRS 8.6) |
| `V2__content_library.sql` | SCRUM-204 | Bảng content_sources, exercise_sources, articles, article_sources; thêm cột mô tả và cột duyệt cho exercises |
| `V3__seed_content_library.sql` | SCRUM-204 | Dữ liệu nguồn tham khảo, bài tập và bài viết mẫu, tất cả ở trạng thái chờ duyệt |
| `V8__package_requests.sql` | SUB-08 | Bảng package_requests: hội viên tự gửi đơn đăng ký gói, quản lý duyệt/từ chối; giá chốt lúc gửi đơn |

Quy tắc:
- Không sửa file đã merge. Cần thay đổi lược đồ thì tạo file mới từ `V9__...sql` trở lên: CSDL trên VPS đã dùng V4–V7 của bản demo cũ, trùng số sẽ làm backend không khởi động (checksum mismatch).
- Không đổi tên file đã merge (Flyway sẽ báo lỗi checksum trên máy đã chạy).
