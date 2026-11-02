# CHỦ FILE: Huyền · TASK: SCRUM-184
# Hợp đồng API Lịch tập và Bảng điều khiển (Dashboards)

- **Task**: SCRUM-184, SCRUM-185, SCRUM-186, SCRUM-187 · **Người phụ trách**: Huyền (Trần Thị Khánh Huyền)
- **Code backend**:
  - Web: `backend/src/main/java/com/gymflow/web/ScheduleController.java`, `backend/src/main/java/com/gymflow/web/AdminController.java`
  - Service: `backend/src/main/java/com/gymflow/service/ScheduleService.java`, `backend/src/main/java/com/gymflow/service/DashboardService.java`
  - DTO: `backend/src/main/java/com/gymflow/dto/Dtos.java` (phần Schedule và Dashboards)
  - Domain: `WorkoutSchedule.java`, `WorkoutLog.java`, enum `ScheduleStatus`
- **Code frontend**: `frontend/src/api/types.ts`, `frontend/src/pages/shared/Schedules.tsx`, `frontend/src/pages/admin/AdminDashboard.tsx`, `frontend/src/pages/trainer/TrainerDashboard.tsx`, `frontend/src/pages/member/MemberDashboard.tsx`

Tất cả endpoint đều bắt đầu bằng `/api` và yêu cầu xác thực qua HTTP Header:
```http
Authorization: Bearer <jwt-token>
```

---

## 1. Định dạng Ngày - Giờ (DateTime)

- **Quy ước**: Hệ thống sử dụng múi giờ Việt Nam (`Asia/Ho_Chi_Minh`, GMT+7).
- **Định dạng trao đổi giữa FE và BE**:
  - `LocalDate`: Chuỗi ISO dạng `YYYY-MM-DD` (VD: `2026-11-02`).
  - `LocalDateTime`: Chuỗi ISO không kèm múi giờ dạng `YYYY-MM-DDTHH:mm:ss` (VD: `2026-11-02T09:00:00`).
  - **Lưu ý quan trọng**: Frontend KHÔNG thêm hậu tố `Z` (UTC) và KHÔNG đổi múi giờ khi gửi lên hay nhận về (hàm `toIsoDateTime` và `parseDateTime` trong `frontend/src/lib/format.ts` giữ nguyên giờ local Việt Nam).

---

## 2. Định dạng Lỗi Chuẩn

Khi request không hợp lệ hoặc vi phạm nghiệp vụ, hệ thống trả về mã lỗi HTTP kèm JSON theo cấu trúc:
```json
{
  "timestamp": "2026-11-02T08:00:00",
  "status": 400,
  "message": "Giờ kết thúc phải sau giờ bắt đầu",
  "fieldErrors": {
    "startTime": "Chọn giờ bắt đầu"
  }
}
```

| Mã HTTP | Tình huống |
| --- | --- |
| **400 Bad Request** | Sai định dạng/thiếu trường (`fieldErrors`), hoặc vi phạm luật thời gian, thời lượng, trạng thái buổi tập (`message`). |
| **401 Unauthorized** | Chưa đăng nhập hoặc token không hợp lệ / hết hạn. |
| **403 Forbidden** | Không đúng vai trò hoặc thao tác ngoài phạm vi cho phép (HLV thao tác với hội viên không phụ trách). |
| **404 Not Found** | Không tìm thấy buổi tập, hội viên, HLV hoặc giáo án tương ứng. |
| **409 Conflict** | Trùng lịch tập (hội viên bận, HLV bận, hội viên chưa có gói tập hiệu lực, hoặc buổi tập đã hoàn thành trước đó). |

---

## 3. Lịch tập & Buổi tập (Schedules)

### 3.1 DTOs

#### `ScheduleRequest` (Tạo buổi tập mới, có thể lặp tuần)
| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | --- |
| `memberId` | Long | Có | `@NotNull(message = "Vui lòng chọn hội viên")` |
| `trainerId` | Long | | ID HLV (nếu HLV tạo thì tự động gán mình; ADMIN tạo thì có thể chọn hoặc để null lấy HLV của hội viên) |
| `planId` | Long | | ID giáo án (nếu có, phải thuộc về hội viên này) |
| `title` | string | Có | `@NotBlank`, tối đa 120 ký tự |
| `startTime` | `LocalDateTime` | Có | `@NotNull`, định dạng ISO `YYYY-MM-DDTHH:mm:ss`, không được ở quá khứ |
| `endTime` | `LocalDateTime` | Có | `@NotNull`, định dạng ISO `YYYY-MM-DDTHH:mm:ss`, sau `startTime`, cùng ngày |
| `note` | string | | Tối đa 255 ký tự |
| `repeatWeeks` | Integer | | Số tuần lặp lại (0 – 12 tuần, mặc định 0) |

#### `ScheduleUpdateRequest` (Dời lịch / cập nhật buổi tập)
| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | --- |
| `trainerId` | Long | | ID HLV |
| `planId` | Long | | ID giáo án thuộc hội viên |
| `title` | string | Có | `@NotBlank`, tối đa 120 ký tự |
| `startTime` | `LocalDateTime` | Có | `@NotNull`, sau thời điểm hiện tại nếu dời sang giờ mới |
| `endTime` | `LocalDateTime` | Có | `@NotNull`, sau `startTime`, cùng ngày |
| `note` | string | | Tối đa 255 ký tự |

#### `CompleteRequest` (Ghi nhận hoàn thành buổi tập)
| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | --- |
| `durationMinutes` | Integer | | 1 – 600 phút (nếu không gửi, hệ thống tự tính từ khoảng cách start-end) |
| `calories` | Integer | | 0 – 5000 kcal |
| `rating` | Integer | | 1 – 5 sao |
| `note` | string | | Tối đa 255 ký tự |

#### `WorkoutLogResponse`
```json
{
  "id": 1,
  "completedAt": "2026-11-02T10:30:00",
  "durationMinutes": 60,
  "calories": 420,
  "rating": 5,
  "note": "Tập tốt, đẩy ngực đạt PR 70kg"
}
```

#### `ScheduleResponse`
```json
{
  "id": 12,
  "memberId": 3,
  "memberName": "Lê Thu Hà",
  "trainerId": 2,
  "trainerName": "Trần Văn HLV",
  "planId": 5,
  "planName": "Giáo án Tăng cơ 8 tuần",
  "title": "Tập ngực & tay sau",
  "startTime": "2026-11-02T09:00:00",
  "endTime": "2026-11-02T10:00:00",
  "status": "SCHEDULED",
  "note": "Mang theo khăn và nước",
  "log": null
}
```

#### `ScheduleCreatedResponse`
```json
{
  "created": [
    { "...ScheduleResponse tuần 1..." },
    { "...ScheduleResponse tuần 2..." }
  ],
  "skipped": [
    "16/11 09:00: HLV Trần Văn HLV đã có buổi khác trùng giờ",
    "23/11 09:00: hội viên không có gói tập hiệu lực vào ngày 2026-11-23"
  ]
}
```

---

### 3.2 Danh sách Endpoint Lịch tập

| Method | Path | Vai trò | Request Body | Response | Mã lỗi chính |
| --- | --- | --- | --- | --- | --- |
| **GET** | `/api/schedules` | Mọi vai trò đã đăng nhập *(quyền chi tiết kiểm tra trong service)* | *(Query params)* | `200 OK`<br>`ScheduleResponse[]` | • 400 (khoảng ngày sai, quá 3 tháng)<br>• 401<br>• 403 |
| **POST** | `/api/schedules` | ADMIN, TRAINER *(kiểm tra canCoach)* | `ScheduleRequest` | `201 Created`<br>`ScheduleCreatedResponse` | • 400 (hội viên không active, giờ sai, quá khứ, dài ngoài 15-240p)<br>• 401, 403<br>• 404<br>• 409 (trùng lịch tuần đầu) |
| **PUT** | `/api/schedules/{id}` | ADMIN, TRAINER *(kiểm tra canCoach)* | `ScheduleUpdateRequest` | `200 OK`<br>`ScheduleResponse` | • 400 (buổi không ở SCHEDULED, giờ sai)<br>• 401, 403<br>• 404<br>• 409 (trùng lịch) |
| **PUT** | `/api/schedules/{id}/cancel` | ADMIN, TRAINER *(kiểm tra canCoach)* | *(None)* | `200 OK`<br>`ScheduleResponse` | • 400 (buổi không ở SCHEDULED)<br>• 401, 403<br>• 404 |
| **PUT** | `/api/schedules/{id}/missed` | ADMIN, TRAINER *(kiểm tra canCoach)* | *(None)* | `200 OK`<br>`ScheduleResponse` | • 400 (buổi không ở SCHEDULED hoặc chưa bắt đầu)<br>• 401, 403<br>• 404 |
| **POST** | `/api/schedules/{id}/complete` | Mọi vai trò đã đăng nhập *(kiểm tra canView)* | `CompleteRequest` | `200 OK`<br>`ScheduleResponse` | • 400 (đã huỷ, chưa đến giờ, quá 7 ngày)<br>• 401, 403<br>• 404<br>• 409 (đã hoàn thành trước đó) |

> **Ghi chú đặc biệt**: Endpoint `DELETE /api/weights/{id}` (xoá bản ghi cân nặng, trả về 204 No Content) hiện đang nằm trong class `ScheduleController.java` (dòng 64-68). Endpoint này thuộc nhóm tính năng theo dõi cân nặng/tiến độ nhưng được đặt tại controller này; hệ thống giữ nguyên vị trí, không di chuyển.

---

### 3.3 Chi tiết Nghiệp vụ Lịch tập

#### 1. Phân quyền truy cập `GET /api/schedules`:
- **ADMIN**: Tra cứu được mọi buổi tập trong khoảng thời gian `[from, to]`; có thể lọc theo `memberId` và `trainerId`.
- **TRAINER**:
  - Nếu truyền `memberId`: yêu cầu có quyền xem hội viên (`access.requireView`, hội viên do mình phụ trách).
  - Nếu không truyền `memberId`: tự động ép phạm vi lọc về các buổi do chính HLV đó phụ trách (`scopeTrainer = myTrainerId`).
- **MEMBER**: Tự động ép phạm vi lọc về các buổi tập của chính mình (`scopeMember = myMemberId`), bỏ qua tham số `trainerId`.

#### 2. Quy tắc thời gian buổi tập:
- `endTime` phải sau `startTime`.
- `startTime` và `endTime` phải nằm trong cùng một ngày (`start.toLocalDate().equals(end.toLocalDate())`).
- Thời lượng buổi tập: từ **15 phút** đến **240 phút** (4 tiếng).
- Khi tạo mới: `startTime` không được ở thời điểm quá khứ so với đồng hồ hệ thống.

#### 3. Chống trùng lịch và cơ chế lặp tuần (`repeatWeeks` & `skipped`):
- Để tránh xung đột đồng thời, hệ thống sử dụng khóa bi quan (`PESSIMISTIC_WRITE`) lần lượt trên dòng `Member` rồi dòng `Trainer`.
- **Điều kiện xung đột (`conflict`)**:
  1. Hội viên không có gói tập nào có hiệu lực vào ngày tập (`!hasEffective(memberId, date)`).
  2. Hội viên đã có buổi tập khác trùng giờ (trừ các buổi có trạng thái `CANCELLED`).
  3. HLV đã có buổi tập khác trùng giờ (trừ các buổi có trạng thái `CANCELLED`).
- **Cơ chế lặp tuần**:
  - Tuần đầu tiên (`w = 0`): Nếu có xung đột, hệ thống ném ngay ngoại lệ **`409 Conflict`** và dừng toàn bộ thao tác.
  - Các tuần kế tiếp (`w = 1..repeatWeeks`): Nếu có xung đột (ví dụ: ngày đó hội viên hết hạn gói hoặc HLV bị trùng lịch), hệ thống **bỏ qua tuần đó**, ghi lý do vào danh sách `skipped` (định dạng `dd/MM HH:mm: <lý do>`) và tiếp tục xếp lịch cho các tuần còn lại.

#### 4. Ghi nhận hoàn thành (`POST /api/schedules/{id}/complete`):
- Ai được gọi: Hội viên của buổi tập đó, HLV phụ trách hoặc Quản lý (`access.canView`).
- Chặn hoàn thành nếu:
  - Buổi tập đã bị huỷ (`CANCELLED`) -> 400.
  - Buổi tập đã hoàn thành (`COMPLETED`) -> 409 Conflict.
  - Chưa đến giờ tập (`now < startTime`) -> 400.
  - Quá hạn ghi nhận: Quá **7 ngày** tính từ `endTime` -> 400.

#### 5. Tự động đánh vắng (`autoMarkMissed`):
- Chạy tự động lúc **00:05** hằng ngày (cron `0 5 0 * * *`) và khi ứng dụng khởi động.
- Tự động chuyển các buổi tập có `status = SCHEDULED` và `endTime < 00:00 hôm nay` sang `MISSED` (Vắng).

---

## 4. Bảng điều khiển (Dashboards)

### 4.1 Danh sách Endpoint Dashboard

| Method | Path | Vai trò | Request Body | Response | Mã lỗi chính |
| --- | --- | --- | --- | --- | --- |
| **GET** | `/api/dashboard/admin` | ADMIN | *(None)* | `200 OK` `AdminDashboard` | • 401<br>• 403 (không phải ADMIN) |
| **GET** | `/api/dashboard/trainer` | TRAINER | *(None)* | `200 OK` `TrainerDashboard` | • 401<br>• 403 (không phải TRAINER)<br>• 404 (chưa có hồ sơ HLV) |
| **GET** | `/api/dashboard/member` | MEMBER | *(None)* | `200 OK` `MemberDashboard` | • 401<br>• 403 (không phải MEMBER)<br>• 404 (chưa có hồ sơ hội viên) |

### 4.2 Chi tiết cấu trúc dữ liệu Dashboard

#### 1. `AdminDashboard`
Tổng quan toàn hệ thống cho quản lý:
- Các chỉ số đếm: `totalMembers` (tổng hội viên), `activeMembers` (hội viên đang hoạt động), `newMembersThisMonth` (hội viên mới trong tháng), `membersWithActivePackage` (hội viên có gói tập còn hạn), `expiringSoon` (gói tập sắp hết hạn trong 7 ngày), `revenueThisMonth` (doanh thu tháng này), `revenuePrevMonth` (doanh thu tháng trước), `activeTrainers` (HLV đang hoạt động), `sessionsToday` (số buổi tập hôm nay).
- `revenueByMonth` (`List<LabelValue>`): Doanh thu 6 tháng gần nhất (định dạng nhãn `MM/yyyy`).
- `planDistribution` (`List<LabelValue>`): Phân bổ số hội viên theo từng gói tập đang bán.
- `expiring` (`List<SubscriptionResponse>`): Tối đa 8 gói sắp hết hạn gần nhất.
- `recentActivity` (`List<AuditResponse>`): 8 hoạt động hệ thống gần nhất.

#### 2. `TrainerDashboard`
Tổng quan công việc cho Huấn luyện viên:
- `memberCount`: Số hội viên do HLV phụ trách.
- `sessionsToday`: Số buổi tập trong ngày hôm nay.
- `sessionsThisWeek`: Tổng số buổi tập trong tuần hiện tại (từ Thứ 2 đến Chủ nhật).
- `completedThisWeek` / `missedThisWeek`: Số buổi đã hoàn thành / số buổi vắng trong tuần.
- `completionRate`: Tỷ lệ hoàn thành buổi tập trong tuần (làm tròn 1 chữ số thập phân, `null` nếu chưa có buổi nào).
- `activePlans`: Số giáo án đang áp dụng (`ACTIVE`) do HLV phụ trách.
- `todaySessions` (`List<ScheduleResponse>`): Danh sách các buổi tập trong ngày hôm nay.
- `expiringMembers` (`List<SubscriptionResponse>`): Danh sách hội viên của HLV có gói sắp hết hạn trong 7 ngày tới.
- `weekLoad` (`List<LabelValue>`): Số lượng buổi tập phân bổ theo 7 ngày trong tuần (`T2`, `T3`, `T4`, `T5`, `T6`, `T7`, `CN`).

#### 3. `MemberDashboard`
Tổng quan tiến trình tập luyện cho Hội viên:
- `member`: Thông tin hồ sơ hội viên (`MemberResponse`).
- `currentSubscription`: Gói tập đại diện đang áp dụng (`SubscriptionResponse`, `null` nếu chưa có).
- `nextSession`: Buổi tập sắp tới gần nhất (`ScheduleResponse`, `null` nếu không có lịch sắp tới).
- `weekSessions` (`List<ScheduleResponse>`): Các buổi tập trong tuần này.
- `completedThisMonth`: Số buổi tập đã hoàn thành trong tháng hiện tại.
- `streakWeeks`: Chuỗi số tuần tập luyện liên tiếp (tính đến tuần hiện tại).
- `latestWeight`: Bản ghi cân nặng mới nhất (`WeightResponse`).
- `bmi` / `bmiCategory`: Chỉ số BMI và phân loại thể trạng tương ứng (`Thiếu cân`, `Bình thường`, `Thừa cân`, `Béo phì độ I`, `Béo phì độ II`).
- `currentPlan`: Giáo án đang áp dụng (`WorkoutPlanSummary`, `null` nếu chưa được giao giáo án).
