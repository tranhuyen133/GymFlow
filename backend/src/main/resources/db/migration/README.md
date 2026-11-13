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
| `V25__met_calorie_estimation.sql` | Ước tính calo MET | Bảng met_references, workout_log_exercises; cột calo ước tính ở workout_logs |
| `V26__knowledge_base_revamp.sql` | Tái cấu trúc Kho kiến thức (TASK 01 / SCRUM-229) | Phân loại bài tập (exercise_type, sub_category), hướng dẫn điều chỉnh dụng cụ (adjust_guide, common_mistakes), bảng nối exercise_equipment, bảng yêu thích member_favorite_exercises |
| `V27__calorie_backfill.sql` | Ước tính calo MET | Bổ sung dữ liệu calo và bảng met_references |
| `V28__messaging_enhancements.sql` | Tin nhắn HLV ↔ Hội viên & Admin | Bổ sung updated_at cho conversations, sender_role, attachment_url, deleted_at cho messages, index tối ưu truy vấn |
| `V29__fix_exercise_subcategory.sql` | TASK 01 / SCRUM-229 | Chuẩn hoá sub_category bài tập (LEGS vs GLUTES, BICEPS vs TRICEPS, CARDIO), ẩn bài trùng #145 |
| `V30__exercise_description_en.sql` | Song ngữ bài tập / SCRUM-229 | Thêm cột description_en, chuẩn hoá tên tiếng Việt cho 33 bài tập và cập nhật mô tả tiếng Anh cho 164 bài |
| `V31__exercise_content_en.sql` | Song ngữ nội dung chi tiết / SCRUM-229 | Thêm các cột `*_en` cho hướng dẫn, hít thở, lỗi sai, an toàn, liều tập và nạp bản dịch cho 164 bài |
| `V32__exercise_dataset_gifs.sql` | Kho kiến thức | Ảnh động GIF cho bài tập và bổ sung bài phổ biến |
| `V33__forum_unlock_and_sample_plans.sql` | Diễn đàn / Gói tập | Mở khoá chủ đề chào mừng và thêm gói Gym/Gym + PT mẫu |
| `V34__exercise_en_batch3.sql` | Song ngữ nội dung chi tiết / SCRUM-229 | Bản dịch lỗi thường gặp cho bài tập id 165–190 |
| `V35__exercise_en_batch4.sql` | Song ngữ nội dung chi tiết / SCRUM-229 | Bản dịch lỗi thường gặp cho bài tập id 191–216 |
| `V36__exercise_en_batch5.sql` | Song ngữ nội dung chi tiết / SCRUM-229 | Bản dịch lỗi thường gặp cho bài tập id 217–242 |
| `V37__exercise_en_batch6.sql` | Song ngữ nội dung chi tiết / SCRUM-229 | Bản dịch lỗi thường gặp cho bài tập id 243–268 |
| `V38__exercise_en_batch7.sql` | Song ngữ nội dung chi tiết / SCRUM-229 | Bản dịch lỗi thường gặp cho bài tập id 269–291 |
| `V39__training_section_en.sql` | Song ngữ khu vực Tập luyện / SCRUM-229 | Thêm cột tiếng Anh cho giáo án, bài trong giáo án, buổi tập và lịch sử; backfill nội dung mẫu |
| `V40__equipment_content_en.sql` | Song ngữ dụng cụ / SCRUM-229 | Thêm cột tiếng Anh cho cách sử dụng, điều chỉnh, lỗi thường gặp, an toàn và nạp bản dịch 17 dụng cụ |

Quy tắc:
- Không sửa file đã merge. Tạo migration với số cao hơn migration mới nhất đã áp dụng; bỏ qua được V9–V12 trên một số CSDL demo cũ bằng cấu hình Flyway.
- Không đổi tên file đã merge (Flyway sẽ báo lỗi checksum trên máy đã chạy).
- **Mỗi version chỉ dùng một lần.** Trước khi thêm migration, kiểm tra version lớn nhất hiện có; nếu hai nhánh cùng chọn một số, nhánh merge sau phải đổi sang số tiếp theo.
- Test `FlywayMigrationGuardTest` tự chạy trong `gradle build`/CI để chặn trùng version và tên file sai định dạng.
- Migration phải an toàn khi chạy lại: dùng `CREATE TABLE IF NOT EXISTS`, `INSERT IGNORE`, `ON DUPLICATE KEY UPDATE` hoặc `UPDATE ... WHERE ...` thay vì thao tác phá dữ liệu.
- Không xoá/đổi tên cột đang được code hoặc dữ liệu cũ dùng; bổ sung cột mới qua migration mới.
