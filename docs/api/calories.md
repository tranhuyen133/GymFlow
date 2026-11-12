# Calo tiêu hao theo MET

## Công thức

```
Calories = MET × 3.5 × Weight(kg) / 200 × Duration(minutes)
```

- Nguồn MET: **2011 Compendium of Physical Activities** (Ainsworth và cộng sự,
  Med Sci Sports Exerc. 43(8):1575–1581). Bảng tra nằm trong `met_reference`,
  mỗi dòng có `source_code`, `source_version`, `source_url`, `citation`.
- Với bài kháng lực, `Duration` là **thời gian vận động**, không gồm nghỉ:
  `sets × giây/hiệp / 60`. Mỗi lần lặp ước tính 3 giây; `"45s"` là bài tính theo giây;
  `"8-12"` lấy trung bình 10 lần.
- Cardio/chạy/đi bộ/đạp xe/nhảy dây/HIIT dùng `duration_minutes` của bài trong giáo án.
- Không có bài tập/không đủ dữ liệu: fallback `OTHER` cường độ vừa cho toàn buổi,
  đánh dấu `estimateQuality = COARSE`.
- Cân nặng: bản ghi mới nhất có `recorded_date ≤ ngày tập`. Với backfill lịch sử,
  nếu không có bản ghi trước ngày tập thì lấy bản ghi gần nhất còn lại và ghi rõ
  nguồn `WEIGHT_RECORD_NEAREST@...`. Không có cân nặng nào thì `calories = null`,
  `estimateStatus = MISSING_WEIGHT`, không bịa số.
- Lịch sử lưu cân nặng/MET/công thức đã dùng; đổi cân nặng sau này **không** tính lại
  các buổi đã ước tính thành công. Buổi đang thiếu dữ liệu có thể được tính lại thủ công
  sau khi nhập cân nặng.

## Dữ liệu lưu

- `workout_logs`: snapshot `weight_kg_used`, `active_minutes`, `intensity`,
  `met_method`, `formula_version`, `estimate_status`, `estimate_quality`,
  `estimated`, `calculated_at`, `legacy_calories` (calo nhập tay cũ, chỉ để truy vết).
- `workout_log_exercises`: chi tiết từng bài (MET, cường độ, sets, reps,
  thời gian vận động, calo, nguồn `PLAN`/`FALLBACK`).
- `met_reference`: bảng tra MET có trích dẫn.
- `workout_logs.schedule_id` đã UNIQUE + khoá bi quan khi hoàn thành ⇒ một buổi
  chỉ ghi nhận một lần. Buổi `CANCELLED` không được ghi nhận.

## API

### Xem trước calo

`GET /api/schedules/{id}/calorie-preview?intensity=LIGHT|MODERATE|VIGOROUS`

Trả về cân nặng dùng, danh sách bài + MET + thời gian vận động + calo, tổng calo,
`estimateStatus`, `estimateQuality`, disclaimer.

### Hoàn thành buổi tập

`POST /api/schedules/{id}/complete`

```json
{ "durationMinutes": 60, "intensity": "MODERATE", "rating": 5, "note": "..." }
```

Không còn nhận `calories` nhập tay. Backend tự ước tính và trả về
`ScheduleResponse.log` với `calories`, `weightKgUsed`, `activeMinutes`,
`intensity`, `formulaVersion`, `estimateStatus`, `estimateQuality`, `estimated`.

### Backfill và tính lại

`POST /api/admin/calories/backfill` (Admin)

Tính MET cho toàn bộ log `LEGACY` chưa từng được xử lý. Idempotent: chạy lại không
nhân đôi, không đụng log đã `OK`. Backend cũng tự chạy bước này khi khởi động
(có thể tắt bằng `CALORIE_BACKFILL_ENABLED=false`).

`POST /api/members/{id}/calories/recompute` (Member tự xem, HLV phụ trách, Admin)

Tính lại các buổi đang `LEGACY`, `MISSING_WEIGHT` hoặc `NO_EXERCISE_DATA` của một
hội viên, dùng khi hội viên vừa nhập cân nặng.

### Thống kê

`GET /api/members/{id}/calories/summary?period=DAY|WEEK|MONTH&anchor=YYYY-MM-DD`

- Ngày theo lịch; tuần bắt đầu Thứ 2; tháng theo lịch; tất cả theo `Asia/Ho_Chi_Minh`.
- Trả `totalCalories`, `totalSessions`, `estimatedSessions`, `unestimatedSessions`,
  `totalActiveMinutes`, `avgCaloriesPerSession`, `buckets` theo ngày, `topDay`,
  `previous` (kỳ trước + `changePercent`).
- `totalSessions` đếm mọi buổi đã hoàn thành; calo và trung bình chỉ tính log
  `estimated = TRUE` và `estimateStatus = OK`. Log chưa ước tính được vẫn hiện trong
  lịch sử và được đếm vào `unestimatedSessions`, không bịa calo.

`GET /api/members/{id}/calories/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD`

Lịch sử từng buổi + chi tiết bài; dùng để xem khi nhấn biểu đồ/số liệu.

## Ghi chú giao diện

Thống kê calo nằm trong trang **Tiến độ của tôi** (`/me/progress`), gồm:
calo ngày/tuần/tháng, số buổi, tổng thời gian, trung bình mỗi buổi, biểu đồ theo ngày,
lịch sử buổi tập, bộ lọc ngày, cảnh báo buổi chưa ước tính và nút **Tính lại calo**.
Luôn hiển thị câu:

> Lượng calo là giá trị ước tính dựa trên dữ liệu vận động và thông tin cá nhân.
> Giá trị thực tế có thể khác nhau giữa từng người.
