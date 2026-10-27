# Bảng Phân Công Quản Lý File (Code Owners)

| Đường dẫn file | Chủ file | Task & Hạn | Mô tả công việc |
| -------------- | -------- | ---------- | --------------- |
| `compose.yaml` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-124 · 30/10/2026 | Cấu hình docker-compose cho MySQL local/dev |
| `.github/workflows/ci.yml` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-125 · 30/10/2026 | CI workflow kiểm tra build backend và frontend |
| `compose.prod.yaml` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-201 · 11/11/2026 | Compose chạy production + Cloudflare Tunnel + HTTPS (NFR-S09, mục 11.2) |
| `docs/DEMO.md` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-203 · 13/11/2026 | Kịch bản demo với GVHD theo luồng chính |
| `backend/src/main/java/com/gymflow/config/SecurityConfig.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-126 · 29/10/2026 | Cấu hình Spring Security, JWT, phân quyền theo vai trò |
| `backend/src/main/java/com/gymflow/security/JwtService.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-126 · 29/10/2026 | Tạo và kiểm tra JWT HS256, JWT_SECRET ≥ 32 ký tự (AUTH-07, NFR-S01) |
| `backend/src/main/java/com/gymflow/security/JwtAuthFilter.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-126 · 29/10/2026 | Đọc token, nạp lại user mỗi request |
| `backend/src/main/java/com/gymflow/security/AuthRateLimitFilter.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-128 · 02/11/2026 | Giới hạn tần suất gọi API xác thực (AUTH-08, NFR-S05) |
| `backend/src/main/java/com/gymflow/common/ErrorResponse.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-129 · 28/10/2026 | Format lỗi { status, message, fieldErrors } |
| `backend/src/main/java/com/gymflow/common/GlobalExceptionHandler.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-129 · 28/10/2026 | Bắt lỗi toàn cục, ánh xạ tên ràng buộc CSDL sang tiếng Việt (mục 9.1, 13.1) |
| `backend/src/main/java/com/gymflow/domain/User.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-126 · 29/10/2026 | Bảng users (SRS 8.3) |
| `backend/src/main/java/com/gymflow/domain/AuditLog.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-127 · 29/10/2026 | Bảng audit_logs (SRS 8.3) |
| `backend/src/main/java/com/gymflow/repository/UserRepository.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-126 · 29/10/2026 | Repository cho bảng users |
| `backend/src/main/java/com/gymflow/repository/AuditLogRepository.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-127 · 29/10/2026 | Repository cho bảng audit_logs |
| `backend/src/main/java/com/gymflow/dto/AuthDtos.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-127 · 29/10/2026 | LoginRequest, LoginResponse |
| `backend/src/main/java/com/gymflow/service/AuthService.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-127 · 29/10/2026 | Đăng nhập, đăng xuất, ghi audit cả lần thất bại kèm IP (AUTH-02, AUTH-03) |
| `backend/src/main/java/com/gymflow/web/AuthController.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-127 · 29/10/2026 | /api/auth: POST /login, POST /logout. Chỉ 2 endpoint này. |
| `backend/src/main/java/com/gymflow/service/AccessService.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-153 · 02/11/2026 | Kiểm tra phạm vi dữ liệu: HLV chỉ thấy hội viên được phân công, hội viên chỉ thấy dữ liệu của mình (AUTH-07) |
| `backend/src/main/java/com/gymflow/dto/AccountDtos.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-154 · 03/11/2026 | DTOs quản lý tài khoản |
| `backend/src/main/java/com/gymflow/service/AccountService.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-154 · 03/11/2026 | Khoá/mở tài khoản, cấp mật khẩu tạm, thêm Admin, luôn còn ít nhất 1 Admin (USR-01–05, BR-14) |
| `backend/src/main/java/com/gymflow/web/AccountController.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-154 · 03/11/2026 | /api/accounts |
| `backend/src/main/java/com/gymflow/service/ScheduleLockService.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-176 · 06/11/2026 | Khoá dòng hội viên rồi HLV bằng SELECT … FOR UPDATE để chống trùng giờ (SCH-03, BR-05) |
| `backend/src/main/java/com/gymflow/service/MissedSessionJob.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-177 · 09/11/2026 | @Scheduled lúc 00:05 và khi khởi động: tự đánh vắng buổi quá hạn (SCH-08, BR-08) |
| `backend/src/main/java/com/gymflow/web/ScheduleActionController.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-178 · 10/11/2026 | /api/schedules/{id}: dời, huỷ, đánh vắng (SCH-05–07) |
| `backend/src/main/java/com/gymflow/dto/AuditDtos.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-200 · 13/11/2026 | DTOs audit log |
| `backend/src/main/java/com/gymflow/service/AuditLogService.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-200 · 13/11/2026 | Ghi nhật ký trong giao dịch riêng (REQUIRES_NEW) + lọc (USR-06) |
| `backend/src/main/java/com/gymflow/web/AuditLogController.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-200 · 13/11/2026 | /api/audit-logs |
| `backend/src/test/java/com/gymflow/service/SubscriptionConcurrencyTest.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-156 · 04/11/2026 | Review và test: 2 request đăng ký gói cùng lúc thì chỉ 1 thành công (SUB-04, NFR-D02) |
| `backend/src/test/java/com/gymflow/service/ScheduleConcurrencyTest.java` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-179 · 10/11/2026 | Test 2 request xếp lịch cùng lúc (NFR-D02) |
| `frontend/src/api/accounts.ts` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-155 · 05/11/2026 | API tài khoản |
| `frontend/src/api/auditLogs.ts` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-200 · 13/11/2026 | API nhật ký kiểm toán |
| `frontend/src/pages/admin/Accounts.tsx` | Dũng (Đặng Tô Ngọc Dũng) | SCRUM-155 · 05/11/2026 | Màn 4.5 Tài khoản |
| `backend/src/main/java/com/gymflow/dto/MemberDtos.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-134 · 28/10/2026 | DTO + stub endpoint trả dữ liệu giả để FE làm song song |
| `backend/src/main/java/com/gymflow/dto/TrainerDtos.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-134 · 28/10/2026 | DTO huấn luyện viên |
| `backend/src/main/java/com/gymflow/domain/PasswordResetToken.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-135 · 29/10/2026 | Bảng password_reset_tokens (8.3) |
| `backend/src/main/java/com/gymflow/repository/PasswordResetTokenRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-135 · 29/10/2026 | Repository cho bảng password_reset_tokens |
| `backend/src/main/java/com/gymflow/service/AccountRecoveryService.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-135 · 29/10/2026 | Đăng ký, quên mật khẩu, đặt lại, đổi mật khẩu (AUTH-01, AUTH-04–06) |
| `backend/src/main/java/com/gymflow/web/AccountRecoveryController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-135 · 29/10/2026 | /api/auth: /register, /forgot-password, /reset-password, /change-password |
| `backend/src/main/java/com/gymflow/domain/Member.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-136 · 30/10/2026 | Bảng members (8.4) |
| `backend/src/main/java/com/gymflow/repository/MemberRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-136 · 30/10/2026 | Repository cho bảng members |
| `backend/src/main/java/com/gymflow/service/MemberService.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-136 · 30/10/2026 | CRUD hội viên, mã HV, mật khẩu tạm, trạng thái, phân công HLV, tìm, lọc, phân trang (MEM-01–07) |
| `backend/src/main/java/com/gymflow/web/MemberController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-134 · 28/10/2026<br>SCRUM-136 · 30/10/2026 | /api/members (stub 28/10, CRUD 30/10) |
| `backend/src/main/java/com/gymflow/domain/Trainer.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-137 · 02/11/2026 | Bảng trainers |
| `backend/src/main/java/com/gymflow/domain/TrainerShift.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-137 · 02/11/2026 | Bảng trainer_shifts |
| `backend/src/main/java/com/gymflow/repository/TrainerRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-137 · 02/11/2026 | Repository cho bảng trainers |
| `backend/src/main/java/com/gymflow/repository/TrainerShiftRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-137 · 02/11/2026 | Repository cho bảng trainer_shifts |
| `backend/src/main/java/com/gymflow/service/TrainerService.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-137 · 02/11/2026 | HLV và ca làm (TRN-01–05) |
| `backend/src/main/java/com/gymflow/web/TrainerController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-134 · 28/10/2026<br>SCRUM-137 · 02/11/2026 | /api/trainers |
| `backend/src/main/java/com/gymflow/dto/ExerciseDtos.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-161 · 02/11/2026 | DTO + stub, làm ngày đầu sprint 2 |
| `backend/src/main/java/com/gymflow/dto/WorkoutPlanDtos.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-161 · 02/11/2026 | DTO giáo án tập luyện |
| `backend/src/main/java/com/gymflow/domain/Exercise.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-162 · 04/11/2026 | Bảng exercises. Từ 11/11 Kiên thêm cột duyệt |
| `backend/src/main/java/com/gymflow/repository/ExerciseRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-162 · 04/11/2026 | Repository cho bảng exercises |
| `backend/src/main/java/com/gymflow/service/ExerciseService.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-162 · 04/11/2026 | Thư viện bài tập: lọc, ẩn, xoá RESTRICT (EX-01, 02, 06, 07) |
| `backend/src/main/java/com/gymflow/web/ExerciseController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-162 · 04/11/2026 | /api/exercises |
| `backend/src/main/java/com/gymflow/domain/WorkoutPlan.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-163 · 03/11/2026 | Bảng workout_plans |
| `backend/src/main/java/com/gymflow/domain/WorkoutPlanItem.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-163 · 03/11/2026 | Bảng workout_plan_items |
| `backend/src/main/java/com/gymflow/repository/WorkoutPlanRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-163 · 03/11/2026 | Repository cho bảng workout_plans |
| `backend/src/main/java/com/gymflow/repository/WorkoutPlanItemRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-163 · 03/11/2026 | Repository cho bảng workout_plan_items |
| `backend/src/main/java/com/gymflow/service/WorkoutPlanService.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-163 · 03/11/2026<br>SCRUM-164 · 05/11/2026 | CRUD giáo án, bài theo 7 ngày (WP-01, 02). Chỉ 1 giáo án ACTIVE, trạng thái, xoá vẫn giữ buổi tập (WP-04, 05, 07, BR-11) |
| `backend/src/main/java/com/gymflow/web/WorkoutPlanController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-163 · 03/11/2026 | /api/workout-plans |
| `backend/src/main/java/com/gymflow/dto/ScheduleDtos.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-184 · 05/11/2026 | DTO + stub, làm ngày đầu sprint 3 |
| `backend/src/main/java/com/gymflow/dto/DashboardDtos.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-184 · 05/11/2026 | DTO dashboard |
| `backend/src/main/java/com/gymflow/domain/WorkoutSchedule.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-185 · 06/11/2026 | Bảng workout_schedules |
| `backend/src/main/java/com/gymflow/repository/WorkoutScheduleRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-185 · 06/11/2026 | Repository cho bảng workout_schedules |
| `backend/src/main/java/com/gymflow/service/ScheduleService.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-185 · 06/11/2026 | Xếp lịch lặp tối đa 12 tuần, báo lại tuần bị bỏ, kiểm tra gói còn hạn (SCH-01, 02, 04, BR-04, 06, 07) |
| `backend/src/main/java/com/gymflow/web/ScheduleController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-185 · 06/11/2026 | /api/schedules |
| `backend/src/main/java/com/gymflow/domain/WorkoutLog.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-186 · 09/11/2026 | Bảng workout_logs |
| `backend/src/main/java/com/gymflow/repository/WorkoutLogRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-186 · 09/11/2026 | Repository cho bảng workout_logs |
| `backend/src/main/java/com/gymflow/service/WorkoutLogService.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-186 · 09/11/2026 | Hoàn thành buổi (LOG-01, LOG-03) |
| `backend/src/main/java/com/gymflow/web/WorkoutLogController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-186 · 09/11/2026 | /api/workout-logs |
| `backend/src/main/java/com/gymflow/service/DashboardService.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-187 · 10/11/2026 | Dashboard 3 vai trò (DASH-01–03) |
| `backend/src/main/java/com/gymflow/web/DashboardController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-187 · 10/11/2026 | /api/dashboard |
| `backend/src/main/java/com/gymflow/dto/ArticleDtos.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-208 · 11/11/2026 | DTO bài viết kiến thức |
| `backend/src/main/java/com/gymflow/domain/Article.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-209 · 11/11/2026 | Bảng articles |
| `backend/src/main/java/com/gymflow/repository/ArticleRepository.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-209 · 11/11/2026 | Repository cho bảng articles |
| `backend/src/main/java/com/gymflow/service/ArticleService.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-209 · 11/11/2026<br>SCRUM-210 · 12/11/2026 | Danh sách công khai, xem theo slug (KB-01, 02). Soạn → gửi duyệt → xuất bản → trả về → lưu trữ → xoá (KB-03–06) |
| `backend/src/main/java/com/gymflow/web/PublicArticleController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-209 · 11/11/2026 | /api/public/articles |
| `backend/src/main/java/com/gymflow/web/ArticleController.java` | Huyền (Trần Thị Khánh Huyền) | SCRUM-210 · 12/11/2026 | /api/articles |
| `frontend/src/api/members.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-134 · 28/10/2026 | API hội viên |
| `frontend/src/api/trainers.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-134 · 28/10/2026 | API huấn luyện viên |
| `frontend/src/api/exercises.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-161 · 02/11/2026 | API bài tập |
| `frontend/src/api/workoutPlans.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-161 · 02/11/2026 | API giáo án |
| `frontend/src/api/schedules.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-184 · 05/11/2026 | API lịch tập |
| `frontend/src/api/dashboard.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-184 · 05/11/2026 | API bảng điều khiển (dashboard) |
| `frontend/src/api/articles.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-208 · 11/11/2026 | API bài viết kiến thức |
| `frontend/src/api/types/members.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-134 · 28/10/2026 | Type definitions cho hội viên |
| `frontend/src/api/types/trainers.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-134 · 28/10/2026 | Type definitions cho huấn luyện viên |
| `frontend/src/api/types/exercises.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-161 · 02/11/2026 | Type definitions cho bài tập |
| `frontend/src/api/types/workoutPlans.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-161 · 02/11/2026 | Type definitions cho giáo án |
| `frontend/src/api/types/schedules.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-184 · 05/11/2026 | Type definitions cho lịch tập |
| `frontend/src/api/types/dashboard.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-184 · 05/11/2026 | Type definitions cho dashboard |
| `frontend/src/api/types/articles.ts` | Huyền (Trần Thị Khánh Huyền) | SCRUM-208 · 11/11/2026 | Type definitions cho bài viết kiến thức |
| `backend/src/main/resources/db/migration/README.md` | Kiên (Nguyễn Thế Kiên) | SCRUM-130, 131, 132 · 28–30/10/2026<br>SCRUM-204 · 11/11/2026 | V1__khoi_tao.sql; V2__nguon_noi_dung.sql, V3__duyet_bai_tap.sql |
| `backend/src/main/java/com/gymflow/config/DataSeeder.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-133 · 02/11/2026 | Tài khoản demo 3 vai trò, HLV, hội viên, dữ liệu bám theo ngày hiện tại (mục 13.4). Đọc thêm seed/*.json của Linh |
| `backend/src/main/java/com/gymflow/dto/PlanDtos.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-157 · 02/11/2026 | DTO + stub, làm ngày đầu sprint 2 |
| `backend/src/main/java/com/gymflow/dto/SubscriptionDtos.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-157 · 02/11/2026 | DTO gói hội viên, đăng ký |
| `backend/src/main/java/com/gymflow/domain/MembershipPlan.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-158 · 05/11/2026 | Bảng membership_plans |
| `backend/src/main/java/com/gymflow/repository/MembershipPlanRepository.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-158 · 05/11/2026 | Repository cho bảng membership_plans |
| `backend/src/main/java/com/gymflow/service/PlanService.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-158 · 05/11/2026 | CRUD gói tập, ngừng bán, public (PLAN-01–05) |
| `backend/src/main/java/com/gymflow/web/PlanController.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-158 · 05/11/2026 | /api/plans |
| `backend/src/main/java/com/gymflow/web/PublicPlanController.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-158 · 05/11/2026 | /api/public/plans |
| `backend/src/main/java/com/gymflow/domain/MemberSubscription.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-159 · 03/11/2026 | Bảng member_subscriptions |
| `backend/src/main/java/com/gymflow/domain/SubscriptionStatusView.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-159 · 03/11/2026 | Map view v_subscription_status (chỉ đọc) |
| `backend/src/main/java/com/gymflow/repository/MemberSubscriptionRepository.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-159 · 03/11/2026 | Repository cho bảng member_subscriptions |
| `backend/src/main/java/com/gymflow/service/SubscriptionService.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-159 · 03/11/2026<br>SCRUM-160 · 04/11/2026 | Đăng ký gói, gia hạn nối tiếp, preview (SUB-01–03, BR-02, 03). Khoá dòng chống chồng gói, huỷ (SUB-04–07) |
| `backend/src/main/java/com/gymflow/web/SubscriptionController.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-159 · 03/11/2026 | /api/subscriptions |
| `backend/src/test/java/com/gymflow/service/SubscriptionServiceTest.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-160 · 04/11/2026 | Unit test trạng thái gói. Class rỗng |
| `backend/src/main/java/com/gymflow/dto/ProgressDtos.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-180 · 05/11/2026 | DTO + stub, làm ngày đầu sprint 3 |
| `backend/src/main/java/com/gymflow/domain/WeightRecord.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-181 · 06/11/2026 | Bảng weight_records |
| `backend/src/main/java/com/gymflow/repository/WeightRecordRepository.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-181 · 06/11/2026 | Repository cho bảng weight_records |
| `backend/src/main/java/com/gymflow/service/WeightService.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-181 · 06/11/2026 | Ghi, cập nhật cân nặng theo ngày, xoá (PRG-01, 02, BR-10) |
| `backend/src/main/java/com/gymflow/web/WeightController.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-181 · 06/11/2026 | /api/weights |
| `backend/src/main/java/com/gymflow/service/ProgressService.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-182 · 09/11/2026<br>SCRUM-183 · 10/11/2026 | BMI chuẩn châu Á, chuyên cần 8 tuần (PRG-04, 05, mục 13.2). Chuỗi tuần, tổng calo (PRG-06) |
| `backend/src/main/java/com/gymflow/web/ProgressController.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-182 · 09/11/2026 | /api/progress |
| `backend/src/test/java/com/gymflow/service/ProgressServiceTest.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-183 · 10/11/2026 | Unit test progress service. Class rỗng |
| `backend/src/main/java/com/gymflow/domain/ContentSource.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-204 · 11/11/2026 | Bảng content_sources (8.6, 8.7) |
| `backend/src/main/java/com/gymflow/repository/ContentSourceRepository.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-204 · 11/11/2026 | Repository cho bảng content_sources |
| `backend/src/main/java/com/gymflow/dto/ExerciseReviewDtos.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-205 · 12/11/2026 | DTO duyệt bài tập |
| `backend/src/main/java/com/gymflow/service/ExerciseReviewService.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-205 · 12/11/2026 | Duyệt bài tập, gắn nguồn (EX-04, 05) |
| `backend/src/main/java/com/gymflow/web/ExerciseReviewController.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-205 · 12/11/2026 | /api/exercise-reviews |
| `backend/src/main/java/com/gymflow/dto/ReportDtos.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-206 · 13/11/2026 | DTO báo cáo |
| `backend/src/main/java/com/gymflow/service/ReportService.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-206 · 13/11/2026 | Báo cáo theo khoảng ngày (RPT-01, 02) |
| `backend/src/main/java/com/gymflow/service/CsvExportService.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-207 · 13/11/2026 | Xuất CSV có BOM UTF-8, mở được bằng Excel (RPT-04) |
| `backend/src/main/java/com/gymflow/web/ReportController.java` | Kiên (Nguyễn Thế Kiên) | SCRUM-206 · 13/11/2026 | /api/reports |
| `frontend/src/api/plans.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-157 · 02/11/2026 | API gói tập |
| `frontend/src/api/subscriptions.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-157 · 02/11/2026 | API đăng ký gói |
| `frontend/src/api/weights.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-180 · 05/11/2026 | API cân nặng |
| `frontend/src/api/progress.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-180 · 05/11/2026 | API tiến độ |
| `frontend/src/api/exerciseReview.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-205 · 12/11/2026 | API duyệt bài tập |
| `frontend/src/api/reports.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-206 · 13/11/2026 | API báo cáo |
| `frontend/src/api/types/plans.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-157 · 02/11/2026 | Type definitions cho gói tập |
| `frontend/src/api/types/subscriptions.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-157 · 02/11/2026 | Type definitions cho đăng ký gói |
| `frontend/src/api/types/weights.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-180 · 05/11/2026 | Type definitions cho cân nặng |
| `frontend/src/api/types/progress.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-180 · 05/11/2026 | Type definitions cho tiến độ |
| `frontend/src/api/types/exerciseReview.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-205 · 12/11/2026 | Type definitions cho duyệt bài tập |
| `frontend/src/api/types/reports.ts` | Kiên (Nguyễn Thế Kiên) | SCRUM-206 · 13/11/2026 | Type definitions cho báo cáo |
| `frontend/src/styles/tokens.css` | Phương (Bùi Văn Phương) | SCRUM-143 · 28/10/2026<br>SCRUM-218 · 13/11/2026 | Design token theo DESIGN.md mục 2. Rà responsive và tương phản |
| `frontend/src/components/ui/Button.tsx` | Phương (Bùi Văn Phương) | SCRUM-143 · 28/10/2026 | UI kit Button |
| `frontend/src/components/ui/Input.tsx` | Phương (Bùi Văn Phương) | SCRUM-143 · 28/10/2026 | UI kit Input |
| `frontend/src/components/ui/Card.tsx` | Phương (Bùi Văn Phương) | SCRUM-143 · 28/10/2026 | UI kit Card |
| `frontend/src/components/ui/Modal.tsx` | Phương (Bùi Văn Phương) | SCRUM-143 · 28/10/2026 | UI kit Modal |
| `frontend/src/components/ui/Table.tsx` | Phương (Bùi Văn Phương) | SCRUM-143 · 28/10/2026 | UI kit Table |
| `frontend/src/components/ui/index.ts` | Phương (Bùi Văn Phương) | SCRUM-143 · 28/10/2026 | UI kit index |
| `frontend/src/components/ui/Toast.tsx` | Phương (Bùi Văn Phương) | SCRUM-147 · 02/11/2026 | Toast có aria-live |
| `frontend/src/components/ui/FormError.tsx` | Phương (Bùi Văn Phương) | SCRUM-147 · 02/11/2026 | Lỗi form có aria-invalid, focus vào trường lỗi (NFR-U03) |
| `frontend/src/components/ui/DataTable.tsx` | Phương (Bùi Văn Phương) | SCRUM-169 · 02/11/2026 | Bảng dữ liệu có phân trang, dùng chung cho mọi màn danh sách |
| `frontend/src/pages/public/Landing.tsx` | Phương (Bùi Văn Phương) | SCRUM-144 · 30/10/2026<br>SCRUM-168 · 05/11/2026 | Trang chủ + bảng giá gói (màn 1.1, PLAN-05) |
| `frontend/src/pages/public/Login.tsx` | Phương (Bùi Văn Phương) | SCRUM-145 · 29/10/2026 | Màn 1.2 Đăng nhập, có thước đo độ mạnh mật khẩu |
| `frontend/src/pages/public/Register.tsx` | Phương (Bùi Văn Phương) | SCRUM-145 · 29/10/2026 | Màn 1.3 Đăng ký, có thước đo độ mạnh mật khẩu |
| `frontend/src/pages/public/ForgotPassword.tsx` | Phương (Bùi Văn Phương) | SCRUM-146 · 30/10/2026 | Màn 1.4 Quên mật khẩu |
| `frontend/src/pages/public/ResetPassword.tsx` | Phương (Bùi Văn Phương) | SCRUM-146 · 30/10/2026 | Màn 1.4 Đặt lại mật khẩu |
| `frontend/src/pages/trainer/ExerciseLibrary.tsx` | Phương (Bùi Văn Phương) | SCRUM-170 · 03/11/2026 | Màn 3.6 Thư viện bài tập: lọc + chi tiết (EX-01, 03) |
| `frontend/src/pages/member/WorkoutToday.tsx` | Phương (Bùi Văn Phương) | SCRUM-171 · 04/11/2026 | Màn 2.3 Buổi tập hôm nay, mở sẵn ngày hôm nay (WP-06) |
| `frontend/src/pages/member/MySchedule.tsx` | Phương (Bùi Văn Phương) | SCRUM-192 · 06/11/2026 | Màn 2.2 Lịch tập của tôi: desktop dạng lưới, mobile dạng danh sách (SCH-09) |
| `frontend/src/pages/member/MemberDashboard.tsx` | Phương (Bùi Văn Phương) | SCRUM-193 · 09/11/2026 | DASH-03 Dashboard hội viên |
| `frontend/src/pages/member/Progress.tsx` | Phương (Bùi Văn Phương) | SCRUM-194 · 10/11/2026 | Màn 2.4 Tiến độ + form cân nặng (PRG-01) |
| `frontend/src/components/charts/WeightChart.tsx` | Phương (Bùi Văn Phương) | SCRUM-195 · 10/11/2026 | Biểu đồ SVG cân nặng (PRG-03) |
| `frontend/src/components/charts/BmiBar.tsx` | Phương (Bùi Văn Phương) | SCRUM-195 · 10/11/2026 | Thanh BMI chuẩn châu Á (PRG-04) |
| `frontend/src/pages/public/Knowledge.tsx` | Phương (Bùi Văn Phương) | SCRUM-216 · 11/11/2026 | Màn 1.6 Kho kiến thức, lọc theo chủ đề (KB-01) |
| `frontend/src/pages/public/ArticleDetail.tsx` | Phương (Bùi Văn Phương) | SCRUM-217 · 12/11/2026 | Màn 1.7 Chi tiết bài viết + nguồn + cảnh báo miễn trừ (KB-02, KB-07) |
| `docs/test/TEST_PLAN.md` | Linh (Hồ Khánh Linh) | SCRUM-148 · 28/10/2026 | Kế hoạch kiểm thử + mẫu test case: mã, UC, bước, dữ liệu, kết quả mong đợi |
| `docs/test/UC-01-03.md` | Linh (Hồ Khánh Linh) | SCRUM-152 · 29/10/2026 | Test case UC-01, 02, 03 (mục 7.1) |
| `docs/test/UC-04-05.md` | Linh (Hồ Khánh Linh) | SCRUM-174 · 03/11/2026 | Test case UC-04, 05 |
| `docs/test/UC-06-07.md` | Linh (Hồ Khánh Linh) | SCRUM-197 · 09/11/2026 | Test case UC-06, 07 |
| `docs/test/UC-09-10.md` | Linh (Hồ Khánh Linh) | SCRUM-198 · 10/11/2026 | Test case UC-09, 10 |
| `docs/test/UC-14.md` | Linh (Hồ Khánh Linh) | SCRUM-222 · 11/11/2026 | Test case UC-14 kèm kiểm tra CSV mở bằng Excel |
| `docs/test/BUGS.md` | Linh (Hồ Khánh Linh) | SCRUM-148 · 13/11/2026 | Danh sách bug: mã, màn hoặc API, file, người sửa |
| `docs/test/REGRESSION.md` | Linh (Hồ Khánh Linh) | SCRUM-175 · 05/11/2026<br>SCRUM-199 · 10/11/2026<br>SCRUM-223 · 13/11/2026 | Hồi quy S1 (05/11), đối chiếu dashboard (10/11), hồi quy toàn hệ thống (13/11) |
| `backend/src/main/resources/seed/README.md` | Linh (Hồ Khánh Linh) | SCRUM-173 · 05/11/2026<br>SCRUM-221 · 13/11/2026 | exercises.json (10 bài) và articles.json (bài viết có nguồn) |
| `frontend/src/pages/shared/Policy.tsx` | Linh (Hồ Khánh Linh) | SCRUM-149 · 29/10/2026 | Màn 1.5 Chính sách (UI-04) |
| `frontend/src/pages/shared/Forbidden.tsx` | Linh (Hồ Khánh Linh) | SCRUM-149 · 29/10/2026 | Màn 403 Forbidden (UI-04) |
| `frontend/src/pages/shared/NotFound.tsx` | Linh (Hồ Khánh Linh) | SCRUM-149 · 29/10/2026 | Màn 404 Not Found (UI-04) |
| `frontend/src/pages/shared/Profile.tsx` | Linh (Hồ Khánh Linh) | SCRUM-150 · 30/10/2026 | Màn 5.1 Hồ sơ + đổi mật khẩu (AUTH-06) |
| `frontend/src/pages/admin/Trainers.tsx` | Linh (Hồ Khánh Linh) | SCRUM-151 · 02/11/2026 | Màn 4.1 HLV và ca làm |
| `frontend/src/pages/member/MySubscription.tsx` | Linh (Hồ Khánh Linh) | SCRUM-172 · 04/11/2026 | Màn 2.5 Gói của tôi (SUB-07) |
| `frontend/src/components/schedule/CompleteSessionForm.tsx` | Linh (Hồ Khánh Linh) | SCRUM-196 · 06/11/2026 | Form hoàn thành buổi (LOG-01) |
| `frontend/src/pages/admin/AuditLog.tsx` | Linh (Hồ Khánh Linh) | SCRUM-220 · 12/11/2026 | Màn 4.6 Nhật ký có lọc |
| `frontend/src/App.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-139 · 28/10/2026 | Khai báo đủ route trỏ tới tất cả trang, bọc RequireRole |
| `frontend/src/main.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-139 · 28/10/2026 | Khởi chạy app, bọc BrowserRouter, nạp tokens.css |
| `frontend/src/auth/AuthContext.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-139 · 28/10/2026 | Lưu người đăng nhập, trạng thái xác thực |
| `frontend/src/auth/RequireRole.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-139 · 28/10/2026 | Chặn route theo vai trò (mục 10.1) |
| `frontend/src/api/http.ts` | Tùng (Lê Thanh Tùng) | SCRUM-139 · 28/10/2026 | HTTP client gắn JWT, gặp lỗi 401 thì về trang đăng nhập, có cờ bật/tắt mock |
| `frontend/src/api/auth.ts` | Tùng (Lê Thanh Tùng) | SCRUM-139 · 28/10/2026 | login, logout, register, forgotPassword, resetPassword, changePassword |
| `frontend/src/api/mock/index.ts` | Tùng (Lê Thanh Tùng) | SCRUM-140 · 29/10/2026 | Dữ liệu giả hội viên, HLV theo types |
| `frontend/src/components/layout/AppLayout.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-138 · 29/10/2026 | UI-03 Layout dùng chung cho các màn /app/* |
| `frontend/src/components/layout/Sidebar.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-138 · 29/10/2026 | UI-03 Sidebar |
| `frontend/src/components/layout/Topbar.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-138 · 29/10/2026 | UI-03 Topbar |
| `frontend/src/components/layout/MobileTabBar.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-138 · 29/10/2026 | UI-03 MobileTabBar |
| `frontend/src/components/layout/menu.ts` | Tùng (Lê Thanh Tùng) | SCRUM-138 · 29/10/2026 | UI-03 menu.ts ghi sẵn đủ mục menu cho 3 vai trò |
| `frontend/src/pages/trainer/Members.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-141 · 30/10/2026 | Màn 3.2 Danh sách hội viên |
| `frontend/src/pages/trainer/MemberDetail.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-142 · 02/11/2026 | Màn 3.3 Chi tiết hội viên |
| `frontend/src/pages/admin/Plans.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-165 · 05/11/2026 | Màn 4.2 Quản lý gói tập |
| `frontend/src/pages/admin/Subscriptions.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-166 · 03/11/2026 | Màn 4.3 Đăng ký gói, preview, huỷ có lý do |
| `frontend/src/pages/trainer/WorkoutPlanEditor.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-167 · 04/11/2026 | Màn 3.4, 3.5 Trình soạn giáo án 7 ngày |
| `frontend/src/pages/trainer/ScheduleGrid.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-188 · 06/11/2026 | Màn 3.1 Lịch tập dạng lưới tuần |
| `frontend/src/components/schedule/RecurringScheduleForm.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-189 · 09/11/2026 | Form xếp lịch lặp, hiện các tuần bị bỏ (SCH-02) |
| `frontend/src/pages/admin/AdminDashboard.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-190 · 10/11/2026 | DASH-01 Dashboard Admin |
| `frontend/src/pages/trainer/TrainerDashboard.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-191 · 10/11/2026 | DASH-02 Dashboard Huấn luyện viên |
| `frontend/src/pages/admin/Reports.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-212 · 11/11/2026 | Màn 4.4 Báo cáo |
| `frontend/src/pages/trainer/ArticleEditor.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-213 · 12/11/2026 | Màn 3.7 Soạn bài, gửi duyệt, duyệt |
| `frontend/src/components/exercise/ExerciseReviewPanel.tsx` | Tùng (Lê Thanh Tùng) | SCRUM-214 · 13/11/2026 | Khung duyệt bài tập, gắn vào ExerciseLibrary |
