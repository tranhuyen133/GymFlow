# API cân nặng và tiến độ

Task: SCRUM-180, SCRUM-181, SCRUM-182, SCRUM-183 · Người phụ trách: Kiên
Code: `web/MemberController.java`, `web/ScheduleController.java` (xoá cân nặng), `service/ProgressService.java`, `dto/Dtos.java`

Mọi API cần header `Authorization: Bearer <token>`. Định dạng lỗi chung xem `docs/api/plans-subscriptions.md`.

## Quyền

Cả ba thao tác xem, ghi, xoá dùng chung một luật (`AccessService.canView`):

| Vai trò | Được thao tác với |
| --- | --- |
| ADMIN | mọi hội viên |
| TRAINER | hội viên mình phụ trách (`members.trainer_id`) |
| MEMBER | chỉ chính mình |

Sai quyền → 403. Hội viên không tồn tại → 404.

---

## Cân nặng

### `WeightRequest`

| Trường | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | --- | --- |
| `recordedDate` | `yyyy-MM-dd` | có | không phải ngày tương lai (giờ Việt Nam) |
| `weightKg` | số | có | 20 – 300, lưu làm tròn 1 chữ số thập phân |
| `bodyFat` | số (%) | | 2 – 70, làm tròn 1 chữ số |
| `note` | string | | ≤ 255; chuỗi rỗng hoặc toàn khoảng trắng lưu thành `null` |

### `WeightResponse`

```json
{ "id": 15, "recordedDate": "2026-10-28", "weightKg": 68.4, "bodyFat": 18.2, "note": null }
```

### Danh sách API

| Phương thức | Đường dẫn | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| GET | `/members/{id}/weights` | 200 `WeightResponse[]` | Sắp theo ngày tăng dần (cũ trước) |
| POST | `/members/{id}/weights` | 200 `WeightResponse` | **Ghi hoặc cập nhật**: mỗi hội viên một bản ghi mỗi ngày. Đã có bản ghi ngày đó thì ghi đè cân nặng, % mỡ, ghi chú và giữ nguyên `id` |
| DELETE | `/weights/{id}` | 204 | `id` là id bản ghi cân nặng, không phải id hội viên. Không có → 404 |

Nhật ký: `WEIGHT_CREATE` hoặc `WEIGHT_UPDATE` (chi tiết `ngày: x kg`), `WEIGHT_DELETE`.

Luật một-ngày-một-bản-ghi được giữ ở hai tầng: service tìm theo `(member_id, recorded_date)` trước khi lưu, và CSDL có UNIQUE trên hai cột này (SCRUM-131).

---

## Tiến độ

`GET /members/{id}/progress` → 200 `ProgressResponse`

```json
{ "memberId": 3, "heightCm": 170.0,
  "currentWeight": 68.4, "startWeight": 72.0, "weightChange": -3.6, "bodyFat": 18.2,
  "bmi": 23.7, "bmiCategory": "Thừa cân",
  "weights": [ /* WeightResponse[], như GET /weights */ ],
  "attendance": [ { "weekStart": "2026-09-07", "scheduled": 3, "completed": 2, "missed": 1 } /* … 8 tuần */ ],
  "attendanceRate": 85.7, "streakWeeks": 4,
  "totalSessions": 21, "totalMinutes": 1260, "totalCalories": 8400, "avgRating": 4.2 }
```

| Trường | Cách tính | Khi không có dữ liệu |
| --- | --- | --- |
| `currentWeight` / `startWeight` | bản ghi cân nặng mới nhất / cũ nhất | `null` |
| `weightChange` | `current − start`, làm tròn 1 chữ số; âm là giảm cân | `null` |
| `bodyFat` | % mỡ của bản ghi gần nhất **có ghi % mỡ** | `null` |
| `bmi` | `cân nặng / (chiều cao m)²`, làm tròn 1 chữ số, dùng `currentWeight` | `null` nếu thiếu cân nặng hoặc chiều cao |
| `bmiCategory` | ngưỡng WHO cho người châu Á: < 18,5 Thiếu cân · < 23 Bình thường · < 25 Thừa cân · < 30 Béo phì độ I · còn lại Béo phì độ II | `null` |
| `attendance` | đúng 8 phần tử, mỗi phần tử một tuần bắt đầu từ thứ Hai, tuần hiện tại ở cuối. Buổi đã huỷ không tính vào `scheduled` | tuần không có buổi vẫn có phần tử, các số bằng 0 |
| `attendanceRate` | `completed / (completed + missed) × 100` trong 8 tuần đó, làm tròn 1 chữ số. Buổi chưa diễn ra không làm giảm tỷ lệ | `null` nếu chưa có buổi hoàn thành hoặc vắng |
| `streakWeeks` | số tuần liên tiếp có ít nhất 1 buổi hoàn thành, đếm lùi từ tuần này. Tuần này chưa có buổi hoàn thành thì bắt đầu đếm từ tuần trước (tuần chưa kết thúc không làm đứt chuỗi) | `0` |
| `totalSessions` | số nhật ký buổi tập (`workout_logs`), tính từ trước tới nay | `0` |
| `totalMinutes` / `totalCalories` | tổng thời lượng / calo trong nhật ký, bỏ qua giá trị trống | `0` |
| `avgRating` | trung bình điểm đánh giá buổi tập, làm tròn 1 chữ số | `null` |

Ngày "hôm nay" và tuần hiện tại tính theo giờ Việt Nam (`ClockConfig`).

---

## Đã biết

- `POST /members/{id}/weights` trả **200** cả khi tạo mới lẫn khi cập nhật, vì cùng một API làm cả hai việc. Không trả 201.
- `attendance` chỉ tính 8 tuần gần nhất theo lịch tập (`workout_schedules`). Còn `totalSessions`, `totalMinutes`, `totalCalories` tính theo nhật ký (`workout_logs`) **từ trước tới nay**. Hiện nhật ký chỉ được tạo khi đánh dấu một buổi trong lịch là hoàn thành (`ScheduleService.complete`), nên `totalSessions` thường lớn hơn tổng `completed` của 8 tuần.
