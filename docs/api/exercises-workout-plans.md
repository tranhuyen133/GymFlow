# CHỦ FILE: Huyền · TASK: SCRUM-161
# Hợp đồng API Thư viện bài tập và Giáo án tập luyện

- **Task**: SCRUM-161, SCRUM-162, SCRUM-163, SCRUM-164 · **Người phụ trách**: Huyền (Trần Thị Khánh Huyền)
- **Code backend**:
  - Web: `backend/src/main/java/com/gymflow/web/TrainingController.java`
  - Service: `backend/src/main/java/com/gymflow/service/ExerciseService.java`, `backend/src/main/java/com/gymflow/service/WorkoutPlanService.java`
  - DTO: `backend/src/main/java/com/gymflow/dto/Dtos.java` (mục Exercise và Workout plan)
  - Domain: `Exercise.java`, `WorkoutPlan.java`, `WorkoutPlanItem.java`, các enum `MuscleGroup`, `Level`, `ExerciseLocation`, `ExerciseGoal`, `ReviewStatus`, `ContentOrigin`, `PlanStatus`
- **Code frontend**: `frontend/src/api/types.ts`, `frontend/src/pages/shared/Exercises.tsx`, `frontend/src/pages/shared/WorkoutPlans.tsx`, `frontend/src/pages/shared/PlanEditor.tsx`, `frontend/src/pages/member/MyPlan.tsx`

Tất cả endpoint đều bắt đầu bằng `/api` và yêu cầu xác thực qua HTTP Header:
```http
Authorization: Bearer <jwt-token>
```

---

## 1. Định dạng lỗi chuẩn

Khi request không hợp lệ hoặc vi phạm nghiệp vụ, hệ thống trả về mã lỗi HTTP kèm JSON theo cấu trúc:
```json
{
  "timestamp": "2026-11-02T07:30:00",
  "status": 400,
  "message": "Dữ liệu không hợp lệ",
  "fieldErrors": {
    "name": "Vui lòng nhập tên bài tập"
  }
}
```

| Mã HTTP | Tình huống |
| --- | --- |
| **400 Bad Request** | Dữ liệu không hợp lệ (`fieldErrors` chi tiết từng trường) hoặc vi phạm quy tắc nghiệp vụ (`message`). |
| **401 Unauthorized** | Chưa đăng nhập hoặc token hết hạn / không hợp lệ. |
| **403 Forbidden** | Không có quyền thao tác (sai vai trò hoặc HLV không phụ trách hội viên). |
| **404 Not Found** | Không tìm thấy bài tập, giáo án, hội viên hoặc bài tập bị ẩn mà người xem là hội viên. |
| **409 Conflict** | Tên bài tập đã tồn tại, hoặc xoá bài tập đang được dùng trong giáo án (RESTRICT). |

---

## 2. Các kiểu dữ liệu Enum dùng chung

| Enum | Các giá trị hợp lệ | Mô tả |
| --- | --- | --- |
| `MuscleGroup` | `CHEST`, `BACK`, `LEGS`, `SHOULDERS`, `ARMS`, `CORE`, `CARDIO`, `FULL_BODY` | Nhóm cơ chính của bài tập |
| `Level` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` | Cấp độ / độ khó |
| `ExerciseLocation` | `GYM`, `HOME`, `ANY` | Địa điểm tập phù hợp |
| `ExerciseGoal` | `STRENGTH`, `ENDURANCE`, `MOBILITY`, `BALANCE`, `FAT_LOSS` | Mục tiêu luyện tập |
| `ReviewStatus` | `DRAFT`, `PENDING`, `APPROVED`, `NEEDS_REVIEW` | Trạng thái kiểm duyệt bài tập |
| `ContentOrigin` | `SELF_AUTHORED`, `ADAPTED` | Nguồn gốc nội dung |
| `PlanStatus` | `ACTIVE`, `COMPLETED`, `ARCHIVED` | Trạng thái giáo án |

---

## 3. Thư viện bài tập (Exercises)

### 3.1 DTOs

#### `ExerciseRequest` (Body cho tạo và sửa bài tập)
| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | --- |
| `name` | string | Có | `@NotBlank`, ≤ 120 ký tự, không trùng tên khác |
| `muscleGroup` | `MuscleGroup` | Có | `@NotNull` |
| `equipment` | string | | ≤ 60 ký tự |
| `level` | `Level` | Có | `@NotNull` |
| `description` | string | | ≤ 1000 ký tự |
| `instructions` | string | | ≤ 2000 ký tự |
| `videoUrl` | string | | ≤ 255 ký tự, regex: `^$|^https?://.+` |
| `nameEn` | string | | ≤ 120 ký tự |
| `aliases` | string | | ≤ 255 ký tự |
| `secondaryMuscles`| string | | ≤ 255 ký tự |
| `location` | `ExerciseLocation` | | `GYM`, `HOME`, `ANY` |
| `goals` | `List<ExerciseGoal>`| | Danh sách mục tiêu |
| `breathing` | string | | ≤ 500 ký tự |
| `commonMistakes` | string | | ≤ 2000 ký tự |
| `safetyNotes` | string | | ≤ 2000 ký tự |
| `variations` | string | | ≤ 2000 ký tự |
| `suggestedDose` | string | | ≤ 255 ký tự |
| `contentOrigin` | `ContentOrigin` | | `SELF_AUTHORED` hoặc `ADAPTED` |
| `sourceIds` | `List<Long>` | | Danh sách ID nguồn tham khảo (`null` giữ nguyên nguồn cũ khi sửa; rỗng là bỏ hết nguồn) |

#### `HiddenRequest`
| Trường | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | --- |
| `hidden` | boolean | Có | `@NotNull` |

#### `ReviewRequest`
| Trường | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | --- |
| `status` | `ReviewStatus` | Có | `@NotNull` |
| `note` | string | | ≤ 500 ký tự; bắt buộc có khi `status == NEEDS_REVIEW` |

#### `SourceResponse`
```json
{
  "id": 1,
  "code": "EXRX",
  "publisher": "ExRx.net",
  "title": "Exercise Prescription on the Web",
  "url": "https://exrx.net",
  "license": "Fair Use / Reference",
  "licenseUrl": null,
  "licenseVerified": true,
  "attribution": "Dựa trên tài liệu tham khảo ExRx.net",
  "publisherReviewed": "2026-10-20",
  "accessedAt": "2026-10-28"
}
```

#### `ExerciseResponse`
```json
{
  "id": 10,
  "name": "Đẩy ngực tạ đòn",
  "muscleGroup": "CHEST",
  "equipment": "Đòn tạ, ghế phẳng",
  "level": "INTERMEDIATE",
  "description": "Bài tập phát triển cơ ngực toàn diện.",
  "instructions": "Nằm ngửa trên ghế, nắm đòn tạ rộng hơn vai...",
  "videoUrl": "https://youtube.com/watch?v=example",
  "hidden": false,
  "usageCount": 5,
  "createdByName": "Nguyễn Văn HLV",
  "nameEn": "Barbell Bench Press",
  "aliases": "Bench press, Đẩy ngực ngang",
  "secondaryMuscles": "Vai trước, Tay sau",
  "location": "GYM",
  "goals": ["STRENGTH", "HYPERTROPHY"],
  "breathing": "Hít vào khi hạ tạ, thở ra khi đẩy tạ lên.",
  "commonMistakes": "Ưỡn lưng quá mức, khuỷu tay mở quá rộng.",
  "safetyNotes": "Cần có người hỗ trợ khi tập mức tạ nặng.",
  "variations": "Dumbbell Bench Press, Incline Bench Press",
  "suggestedDose": "3-4 hiệp, 8-12 lần",
  "contentOrigin": "SELF_AUTHORED",
  "reviewStatus": "APPROVED",
  "reviewNote": null,
  "reviewedByName": "Quản lý phòng tập",
  "reviewedAt": "2026-10-25T14:30:00",
  "updatedAt": "2026-10-25T14:30:00",
  "sources": []
}
```

### 3.2 Danh sách Endpoint Thư viện bài tập

| Method | Path | Vai trò | Request Body | Response | Mã lỗi chính |
| --- | --- | --- | --- | --- | --- |
| **GET** | `/api/exercises` | Mọi vai trò đã đăng nhập | *(Query params)* | `200 OK`<br>`ExerciseResponse[]` | • 401 |
| **GET** | `/api/exercises/{id}` | Mọi vai trò đã đăng nhập | *(None)* | `200 OK`<br>`ExerciseResponse` | • 401<br>• 404 (Không tồn tại hoặc bài ẩn đối với MEMBER) |
| **GET** | `/api/content-sources` | ADMIN, TRAINER | *(None)* | `200 OK`<br>`SourceResponse[]` | • 401<br>• 403 |
| **POST** | `/api/exercises` | ADMIN, TRAINER | `ExerciseRequest` | `201 Created`<br>`ExerciseResponse` | • 400 (Dữ liệu sai, nguồn không tồn tại)<br>• 401, 403<br>• 409 (Trùng tên bài tập) |
| **PUT** | `/api/exercises/{id}` | ADMIN, TRAINER | `ExerciseRequest` | `200 OK`<br>`ExerciseResponse` | • 400 (Dữ liệu sai, nguồn không tồn tại)<br>• 401, 403<br>• 404<br>• 409 (Trùng tên bài khác) |
| **PUT** | `/api/exercises/{id}/hidden` | ADMIN, TRAINER | `HiddenRequest` | `200 OK`<br>`ExerciseResponse` | • 400 (hidden null)<br>• 401, 403<br>• 404 |
| **PUT** | `/api/exercises/{id}/review` | ADMIN | `ReviewRequest` | `200 OK`<br>`ExerciseResponse` | • 400 (Duyệt APPROVED khi chưa có nguồn, hoặc NEEDS_REVIEW thiếu ghi chú)<br>• 401, 403<br>• 404 |
| **DELETE** | `/api/exercises/{id}` | ADMIN | *(None)* | `204 No Content` | • 401, 403<br>• 404<br>• 409 (RESTRICT: bài tập đang nằm trong giáo án) |

#### Chi tiết tham số `GET /api/exercises`:
- `q` (string, mặc định `""`): Tìm kiếm không phân biệt hoa thường, cắt khoảng trắng, tìm trong `name`, `nameEn`, `aliases`, `equipment`.
- `muscleGroup` (`MuscleGroup`, tùy chọn): Lọc theo nhóm cơ.
- `level` (`Level`, tùy chọn): Lọc theo độ khó.
- `location` (`ExerciseLocation`, tùy chọn): Lọc theo nơi tập (`GYM`, `HOME`, `ANY`). Lưu ý: Bài tập có `location = ANY` sẽ xuất hiện cả khi lọc `GYM` hoặc `HOME`.
- `goal` (`ExerciseGoal`, tùy chọn): Lọc theo mục tiêu tập luyện.
- `reviewStatus` (`ReviewStatus`, tùy chọn): Lọc theo trạng thái duyệt.
- `includeHidden` (boolean, mặc định `false`):
  - Đối với `MEMBER`: luôn không thấy bài ẩn (bỏ qua giá trị `includeHidden`).
  - Đối với `ADMIN` / `TRAINER`: chỉ thấy bài ẩn khi truyền `includeHidden=true`.

---

## 4. Giáo án tập luyện (Workout Plans)

### 4.1 DTOs

#### `PlanItemRequest` (Bài tập con trong giáo án)
| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | --- |
| `exerciseId` | Long | Có | `@NotNull` |
| `dayOfWeek` | Integer | Có | `@NotNull`, từ 1 đến 7 (Thứ 2 = 1, ..., Chủ nhật = 7) |
| `sortOrder` | Integer | | Thứ tự bài trong ngày (nếu null sẽ tự tăng) |
| `sets` | Integer | Có | `@NotNull`, 1 đến 20 hiệp |
| `reps` | string | Có | `@NotBlank`, ≤ 20 ký tự (VD: "8-12", "15") |
| `weightKg` | Double | | ≥ 0 kg |
| `restSeconds` | Integer | | 0 đến 900 giây |
| `durationMinutes` | Integer | | 1 đến 300 phút |
| `note` | string | | ≤ 255 ký tự |

#### `WorkoutPlanRequest` (Tạo và sửa giáo án)
| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | --- |
| `memberId` | Long | Có | `@NotNull` |
| `name` | string | Có | `@NotBlank`, ≤ 120 ký tự |
| `goal` | string | | ≤ 255 ký tự |
| `startDate` | LocalDate | Có | `@NotNull` (`YYYY-MM-DD`) |
| `endDate` | LocalDate | Có | `@NotNull` (`YYYY-MM-DD`), sau `startDate`, dài tối đa 1 năm |
| `note` | string | | ≤ 1000 ký tự |
| `items` | `List<PlanItemRequest>` | Có | `@NotNull`, không rỗng, tối đa 100 bài |

#### `PlanStatusRequest`
| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc |
| --- | --- | :---: | --- |
| `status` | `PlanStatus` | Có | `@NotNull` (`ACTIVE`, `COMPLETED`, `ARCHIVED`) |

#### `PlanItemResponse`
```json
{
  "id": 101,
  "exerciseId": 10,
  "exerciseName": "Đẩy ngực tạ đòn",
  "muscleGroup": "CHEST",
  "equipment": "Đòn tạ, ghế phẳng",
  "dayOfWeek": 1,
  "sortOrder": 0,
  "sets": 4,
  "reps": "8-10",
  "weightKg": 60.0,
  "restSeconds": 90,
  "durationMinutes": null,
  "note": "Khởi động kỹ khớp vai"
}
```

#### `WorkoutPlanSummary`
```json
{
  "id": 5,
  "memberId": 3,
  "memberName": "Lê Thu Hà",
  "trainerId": 2,
  "trainerName": "Trần Văn HLV",
  "name": "Giáo án Tăng cơ 8 tuần",
  "goal": "Tăng 2kg cơ, giảm mỡ",
  "startDate": "2026-11-01",
  "endDate": "2026-12-26",
  "status": "ACTIVE",
  "itemCount": 18,
  "trainingDays": 4,
  "createdAt": "2026-11-01T08:00:00"
}
```

#### `WorkoutPlanResponse`
```json
{
  "summary": { "...(WorkoutPlanSummary)..." },
  "note": "Uống đủ 2.5 lít nước mỗi ngày và ngủ đủ 8 tiếng.",
  "items": [
    { "...(PlanItemResponse)..." }
  ]
}
```

### 4.2 Danh sách Endpoint Giáo án

| Method | Path | Vai trò | Request Body | Response | Mã lỗi chính |
| --- | --- | --- | --- | --- | --- |
| **GET** | `/api/workout-plans` | Mọi vai trò đã đăng nhập | *(Query: `memberId`)* | `200 OK`<br>`WorkoutPlanSummary[]` | • 401<br>• 403 (Không có quyền xem hội viên được chỉ định)<br>• 404 (Không tìm thấy hội viên) |
| **GET** | `/api/workout-plans/me/current` | MEMBER | *(None)* | `200 OK` `WorkoutPlanResponse` hoặc `204 No Content` | • 401<br>• 403 (Người gọi không phải MEMBER)<br>• 404 (Không có hồ sơ hội viên) |
| **GET** | `/api/workout-plans/{id}` | Mọi vai trò đã đăng nhập (kiểm tra `canView`) | *(None)* | `200 OK`<br>`WorkoutPlanResponse` | • 401<br>• 403 (Không có quyền xem giáo án)<br>• 404 (Không tìm thấy giáo án) |
| **POST** | `/api/workout-plans` | ADMIN, TRAINER (kiểm tra `canCoach`) | `WorkoutPlanRequest` | `201 Created`<br>`WorkoutPlanResponse` | • 400 (endDate < startDate, dài > 1 năm, items rỗng, bài tập không tồn tại)<br>• 401<br>• 403 (HLV không phụ trách hội viên)<br>• 404 (Không tìm thấy hội viên hoặc bài tập) |
| **PUT** | `/api/workout-plans/{id}` | ADMIN, TRAINER (kiểm tra `canCoach`) | `WorkoutPlanRequest` | `200 OK`<br>`WorkoutPlanResponse` | • 400 (Đổi memberId, ngày sai, items rỗng)<br>• 401, 403<br>• 404 |
| **PUT** | `/api/workout-plans/{id}/status` | ADMIN, TRAINER (kiểm tra `canCoach`) | `PlanStatusRequest` | `200 OK`<br>`WorkoutPlanSummary` | • 400 (status null)<br>• 401, 403<br>• 404 |
| **DELETE** | `/api/workout-plans/{id}` | ADMIN, TRAINER (kiểm tra `canCoach`) | *(None)* | `204 No Content` | • 401, 403<br>• 404 |

#### Quy tắc nghiệp vụ đặc biệt của Giáo án:
1. **Một giáo án ACTIVE duy nhất**: Khi tạo giáo án mới (`POST`) hoặc cập nhật trạng thái sang `ACTIVE` (`PUT .../status`), hệ thống tự động chuyển tất cả các giáo án `ACTIVE` cũ của hội viên đó sang `ARCHIVED`.
2. **Quyền quản lý (canCoach)**:
   - `ADMIN`: Tạo, sửa, đổi trạng thái, xoá giáo án của bất kỳ hội viên nào.
   - `TRAINER`: Chỉ được thao tác với giáo án của hội viên do chính mình phụ trách (`member.trainer_id`).
   - `MEMBER`: Chỉ có quyền xem giáo án của chính mình (`GET /workout-plans`, `GET /workout-plans/me/current`, `GET /workout-plans/{id}`).
3. **Xoá giáo án**: Khi xoá giáo án, các buổi tập trong lịch (`workout_schedules`) đã tạo dựa trên giáo án này vẫn được giữ lại, trường `plan_id` trong lịch sẽ được cập nhật thành `null`.
