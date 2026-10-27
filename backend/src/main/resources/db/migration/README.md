<!--
CHỦ FILE: Kiên (Nguyễn Thế Kiên)
TASK: SCRUM-130 · HẠN: 28/10/2026
TASK: SCRUM-131 · HẠN: 29/10/2026
TASK: SCRUM-132 · HẠN: 30/10/2026
TASK: SCRUM-204 · HẠN: 11/11/2026
CẦN LÀM: V1__khoi_tao.sql (users, password_reset_tokens, audit_logs; trainers, trainer_shifts, members, weight_records; membership_plans, member_subscriptions, exercises, workout_plans, workout_plan_items, workout_schedules, workout_logs; view v_subscription_status; index theo 8.6). SCRUM-204 · 11/11: V2__nguon_noi_dung.sql, V3__duyet_bai_tap.sql. Không sửa V1 sau khi đã merge.
Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
-->

# Kế hoạch Migration CSDL (Flyway)

<!-- TODO(Kiên): Tạo các file migration theo đúng tiến độ (KHÔNG tạo file SQL rỗng trước): -->

1. `V1__khoi_tao.sql` (Hạn: 28-30/10/2026 - SCRUM-130, 131, 132):
   - Bảng: users, password_reset_tokens, audit_logs
   - Bảng: trainers, trainer_shifts, members, weight_records
   - Bảng: membership_plans, member_subscriptions, exercises, workout_plans, workout_plan_items, workout_schedules, workout_logs
   - View: `v_subscription_status`
   - Index theo SRS mục 8.6
   - *Lưu ý: Không sửa V1 sau khi đã merge.*

2. `V2__nguon_noi_dung.sql` (Hạn: 11/11/2026 - SCRUM-204):
   - Bảng: content_sources

3. `V3__duyet_bai_tap.sql` (Hạn: 11/11/2026 - SCRUM-204):
   - Thêm cột duyệt bài tập và liên kết nguồn nội dung
