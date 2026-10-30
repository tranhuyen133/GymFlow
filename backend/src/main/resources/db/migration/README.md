# Migration CSDL (Flyway) – chủ file: Kiên

| File | Task | Nội dung |
| --- | --- | --- |
| `V1__init_schema.sql` | SCRUM-130, 131, 132 | users, password_reset_tokens, audit_logs · trainers, trainer_shifts, members, weight_records · membership_plans, member_subscriptions, exercises, workout_plans, workout_plan_items, workout_schedules, workout_logs · view `v_subscription_status` · index (SRS 8.6) |
| `V2__content_library.sql` | SCRUM-204 | Bảng content_sources, exercise_sources, articles, article_sources; thêm cột mô tả và cột duyệt cho exercises |
| `V3__seed_content_library.sql` | SCRUM-204 | Dữ liệu nguồn tham khảo, bài tập và bài viết mẫu, tất cả ở trạng thái chờ duyệt |

Quy tắc:
- Không sửa file đã merge. Cần thay đổi lược đồ thì tạo file mới `V4__...sql`.
- Không đổi tên file đã merge (Flyway sẽ báo lỗi checksum trên máy đã chạy).
