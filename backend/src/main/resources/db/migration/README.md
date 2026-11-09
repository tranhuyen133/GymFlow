# Migration CSDL (Flyway) – chủ file: Kiên

| File | Task | Nội dung |
| --- | --- | --- |
| `V1__init_schema.sql` | SCRUM-130, 131, 132 | users, password_reset_tokens, audit_logs · trainers, trainer_shifts, members, weight_records · membership_plans, member_subscriptions, exercises, workout_plans, workout_plan_items, workout_schedules, workout_logs · view `v_subscription_status` · index (SRS 8.6) |
| `V2__content_library.sql` | SCRUM-204 | Bảng content_sources, exercise_sources, articles, article_sources; thêm cột mô tả và cột duyệt cho exercises |
| `V3__seed_content_library.sql` | SCRUM-204 | Dữ liệu nguồn tham khảo, bài tập và bài viết mẫu, tất cả ở trạng thái chờ duyệt |
| `V8__package_requests.sql` | SUB-08 | Bảng package_requests: hội viên tự gửi đơn đăng ký gói, quản lý duyệt/từ chối; giá chốt lúc gửi đơn |
| `V14__email_verification_and_ai_chat.sql` | AI Chatbot, email OTP | Xác thực email, số lần thử OTP, lịch sử hội thoại theo tài khoản |

Quy tắc:
- Không sửa file đã merge. Tạo migration với số cao hơn migration mới nhất đã áp dụng; bỏ qua được V9–V12 trên một số CSDL demo cũ bằng cấu hình Flyway.
- Không đổi tên file đã merge (Flyway sẽ báo lỗi checksum trên máy đã chạy).
