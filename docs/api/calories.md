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
- Cân nặng: bản ghi mới nhất có `recorded_date ≤ ngày tập`. Thiếu cân nặng thì
  `calories = null`, `estimateStatus = MISSING_WEIGHT`, không bịa số.
- Lịch sử lưu cân nặng/MET/công thức đã dùng; đổi cân nặng sau này **không** tính lại.

## Dữ liệu lưu

- `workout_logs`: snapshot `weight_kg_used`, `active_minutes`, `intensity`,
  `met_method`, `formula_version`, `estimate_status`, `estimate_quality`,
  `estimated`, `calculated_at`.
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

### Thống kê

`GET /api/members/{id}/calories/summary?period=WEEK|MONTH&anchor=YYYY-MM-DD`

- Tuần bắt đầu Thứ 2, tháng theo lịch, tất cả theo `Asia/Ho_Chi_Minh`.
- Trả `totalCalories`, `totalSessions`, `totalActiveMinutes`,
  `avgCaloriesPerSession`, `buckets` theo ngày, `topDay`, `previous`
  (kỳ trước + `changePercent`).
- Chỉ cộng log `estimated = TRUE` và `estimateStatus = OK`. Log `LEGACY`
  (calo nhập tay trước đây) chỉ hiển thị trong lịch sử, không trộn vào tổng.

`GET /api/members/{id}/calories/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD`

Lịch sử từng buổi + chi tiết bài; dùng để xem khi nhấn biểu đồ/số liệu.

## Ghi chú giao diện

Thống kê calo nằm trong trang **Tiến độ của tôi** (`/me/progress`), gồm:
calo tuần/tháng, số buổi, tổng thời gian, trung bình mỗi buổi, biểu đồ theo ngày,
lịch sử buổi tập và bộ lọc ngày. Luôn hiển thị câu:

> Lượng calo là giá trị ước tính dựa trên dữ liệu vận động và thông tin cá nhân.
> Giá trị thực tế có thể khác nhau giữa từng người.
