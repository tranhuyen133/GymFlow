# Bảng chủ file (Code Owners)

Cập nhật 28/10/2026, theo code trên `develop` sau khi chép bản của Kiên. Mỗi file chỉ chủ file được sửa; cần đổi thì nhắn chủ file.

Viết tắt: **B/** = `backend/src/main/java/com/gymflow/`, **R/** = `backend/src/main/resources/`, **T/** = `backend/src/test/java/com/gymflow/`, **F/** = `frontend/src/`

## File dùng chung
| File | Chủ file | Quy tắc |
| --- | --- | --- |
| `B/dto/Dtos.java` | Dũng | Mọi DTO. Mỗi người chỉ sửa DTO của module mình, `git rebase develop` ngay trước khi mở PR. |
| `B/service/Mappers.java` | Dũng | Chuyển entity sang DTO. Quy tắc như trên. |
| `F/api/types.ts` | Tùng | Kiểu dữ liệu phải khớp `Dtos.java`. Người viết backend của module sửa phần của mình, báo Tùng. |

## Dũng (Đặng Tô Ngọc Dũng)
| File | Task |
| --- | --- |
| `compose.yaml`, `.env.example`, `.gitignore`, `backend/Dockerfile`, `backend/.dockerignore` | SCRUM-124 |
| `.github/workflows/ci.yml` | SCRUM-125 |
| `compose.prod.yaml` | SCRUM-201 |
| `README.md`, `docs/DEMO.md` | SCRUM-203 |
| `backend/build.gradle`, `backend/settings.gradle`, `R/application.yml`, `B/GymflowApplication.java` | SCRUM-126 |
| `B/config/SecurityConfig.java`, `ClockConfig.java`, `OpenApiConfig.java` | SCRUM-126 |
| `B/security/JwtService.java`, `JwtAuthFilter.java`, `AuthUser.java`, `CurrentUser.java` | SCRUM-126 |
| `B/security/AuthRateLimitFilter.java`, `T/security/AuthRateLimitFilterTest.java` | SCRUM-128 |
| `B/common/ApiException.java`, `GlobalExceptionHandler.java`, `PageResponse.java`, `Secrets.java` | SCRUM-129 |
| `B/domain/User.java`, `UserStatus.java`, `Role.java`, `B/repository/UserRepository.java` | SCRUM-126 |
| `B/service/AuthService.java`, `B/web/AuthController.java` | SCRUM-127 (phần đăng ký, quên mật khẩu: Huyền, SCRUM-135) |
| `B/domain/AuditLog.java`, `B/repository/AuditLogRepository.java`, `B/service/AuditService.java` | SCRUM-127, SCRUM-200 |
| `B/service/AccessService.java` | SCRUM-153 |
| `B/service/UserService.java`, `B/web/AdminController.java` | SCRUM-154 |
| `F/pages/admin/Users.tsx` | SCRUM-155 |

## Huyền (Trần Thị Khánh Huyền)
| File | Task |
| --- | --- |
| `B/domain/PasswordResetToken.java`, `B/repository/PasswordResetTokenRepository.java`, `B/service/NotificationService.java` | SCRUM-135 |
| `T/service/AuthServiceRegisterTest.java`, `T/dto/RegisterRequestValidationTest.java` | SCRUM-135 |
| `B/domain/Member.java`, `MemberStatus.java`, `Gender.java`, `B/repository/MemberRepository.java`, `B/service/MemberService.java`, `B/web/MemberController.java` | SCRUM-136 |
| `B/domain/Trainer.java`, `TrainerShift.java`, `B/repository/TrainerRepository.java`, `B/service/TrainerService.java`, `B/web/TrainerController.java` | SCRUM-137 |
| `B/domain/Exercise.java`, `ExerciseGoal.java`, `ExerciseLocation.java`, `MuscleGroup.java`, `Level.java`, `B/repository/ExerciseRepository.java`, `B/service/ExerciseService.java` | SCRUM-162 |
| `B/domain/WorkoutPlan.java`, `WorkoutPlanItem.java`, `PlanStatus.java`, `B/repository/WorkoutPlanRepository.java`, `WorkoutPlanItemRepository.java`, `B/service/WorkoutPlanService.java` | SCRUM-163, 164 |
| `B/web/TrainingController.java` (bài tập, giáo án, buổi tập) | SCRUM-162, 163, 186 |
| `B/domain/WorkoutSchedule.java`, `ScheduleStatus.java`, `B/repository/WorkoutScheduleRepository.java`, `B/service/ScheduleService.java`, `B/web/ScheduleController.java`, `T/service/ScheduleServiceTest.java` | SCRUM-185 (khoá chống trùng giờ: Dũng, SCRUM-176) |
| `B/domain/WorkoutLog.java`, `B/repository/WorkoutLogRepository.java` | SCRUM-186 |
| `B/service/DashboardService.java` | SCRUM-187 |
| `B/domain/Article.java`, `ArticleCategory.java`, `ArticleStatus.java`, `B/repository/ArticleRepository.java`, `B/service/ArticleService.java`, `B/web/KnowledgeController.java` | SCRUM-209, 210 |

## Kiên (Nguyễn Thế Kiên)
| File | Task |
| --- | --- |
| `R/db/migration/V1__init_schema.sql` | SCRUM-130, 131, 132 |
| `R/db/migration/V2__content_library.sql`, `V3__seed_content_library.sql` | SCRUM-204 |
| `B/config/DataSeeder.java`, `DemoAccounts.java` | SCRUM-133 |
| `B/domain/MembershipPlan.java`, `B/repository/MembershipPlanRepository.java`, `B/service/PlanService.java`, `B/web/PlanController.java` | SCRUM-158 |
| `B/domain/MemberSubscription.java`, `SubscriptionState.java`, `B/repository/MemberSubscriptionRepository.java`, `B/service/SubscriptionService.java` | SCRUM-159, 160 |
| `T/domain/MemberSubscriptionTest.java`, `T/service/SubscriptionServiceTest.java` | SCRUM-160 |
| `B/domain/WeightRecord.java`, `B/repository/WeightRecordRepository.java`, `B/service/ProgressService.java`, `T/service/ProgressServiceTest.java` | SCRUM-181, 182, 183 |
| `B/domain/ContentSource.java`, `ContentOrigin.java`, `ReviewStatus.java`, `B/repository/ContentSourceRepository.java`, `T/service/ContentReviewTest.java` | SCRUM-204, 205 |
| `B/service/ReportService.java` | SCRUM-206, 207 |
| `docs/ERD.md` | SCRUM-130 |

## Tùng (Lê Thanh Tùng)
| File | Task |
| --- | --- |
| `frontend/package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `Dockerfile`, `.dockerignore`, `nginx.conf` | SCRUM-139 |
| `F/App.tsx`, `F/main.tsx`, `F/site.ts`, `F/vite-env.d.ts`, `F/auth/**`, `F/api/**`, `F/lib/**`, `F/i18n/**` | SCRUM-139, 140 |
| `F/components/Layout.tsx` | SCRUM-138 |
| `F/pages/shared/Members.tsx` | SCRUM-141 |
| `F/pages/shared/MemberDetail.tsx` | SCRUM-142 |
| `F/pages/admin/Plans.tsx` | SCRUM-165 |
| `F/pages/admin/Subscriptions.tsx`, `F/components/SubscriptionForm.tsx` | SCRUM-166 |
| `F/pages/shared/WorkoutPlans.tsx`, `F/pages/shared/PlanEditor.tsx` | SCRUM-167 |
| `F/pages/shared/Schedules.tsx`, `F/components/WeekCalendar.tsx` | SCRUM-188 |
| `F/pages/admin/AdminDashboard.tsx` | SCRUM-190 |
| `F/pages/trainer/TrainerDashboard.tsx` | SCRUM-191 |
| `F/pages/admin/Reports.tsx` | SCRUM-212 |
| `F/pages/shared/Articles.tsx` | SCRUM-213 |

## Phương (Bùi Văn Phương)
| File | Task |
| --- | --- |
| `DESIGN.md`, `F/styles.css`, `F/theme/**`, `F/components/ui.tsx`, `Brand.tsx`, `Icon.tsx` | SCRUM-143, 218 |
| `F/components/Toast.tsx` | SCRUM-147 |
| `F/pages/Landing.tsx` | SCRUM-144 |
| `F/pages/Login.tsx`, `F/pages/Register.tsx` | SCRUM-145 |
| `F/pages/ForgotPassword.tsx` | SCRUM-146 |
| `F/pages/shared/Exercises.tsx` | SCRUM-170 |
| `F/pages/member/MyPlan.tsx`, `F/components/PlanView.tsx` | SCRUM-171 |
| `F/pages/member/MemberDashboard.tsx` | SCRUM-193 |
| `F/pages/member/MyProgress.tsx`, `F/components/ProgressPanel.tsx`, `F/components/charts.tsx` | SCRUM-194, 195 |
| `F/pages/Knowledge.tsx`, `F/components/Content.tsx` | SCRUM-216, 217 |

## Linh (Hồ Khánh Linh)
| File | Task |
| --- | --- |
| `docs/test/**` (TEST_PLAN, UC-*, BUGS, REGRESSION) | SCRUM-148, 152, 174, 175, 197, 198, 199, 222, 223 |
| `R/seed/**` | SCRUM-173, 221 |
| `F/pages/Policies.tsx`, `F/pages/Errors.tsx` (403, 404) | SCRUM-149 |
| `F/pages/shared/Profile.tsx` | SCRUM-150 |
| `F/pages/admin/Trainers.tsx` | SCRUM-151 |
| `F/pages/member/MyPackages.tsx` | SCRUM-172 |
| `F/pages/admin/AuditLog.tsx` | SCRUM-220 |

## Task chưa có file riêng, cần người phụ trách kiểm tra
| Task | Người | Kiểm tra ở |
| --- | --- | --- |
| SCRUM-176 Khoá chống trùng giờ | Dũng | `ScheduleService.java` |
| SCRUM-177 Tự đánh vắng buổi quá hạn | Dũng | `ScheduleService.java` hoặc tạo `MissedSessionJob.java` |
| SCRUM-178 Dời, huỷ, đánh vắng buổi | Dũng | `ScheduleController.java` |
| SCRUM-205 Duyệt bài tập | Kiên | `ContentReviewTest.java` cho thấy đã có, tìm service tương ứng |
| SCRUM-207 Xuất CSV | Kiên | `ReportService.java` hoặc tạo `CsvExportService.java` |
