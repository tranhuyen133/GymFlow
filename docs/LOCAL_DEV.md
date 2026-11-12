# Chạy và kiểm thử GymFlow trên máy local

## 1. Cách nhanh nhất (Docker)

Yêu cầu: Docker Desktop đang chạy.

```bash
cp .env.example .env    # nếu chưa có .env; sửa JWT_SECRET, mật khẩu MySQL
docker compose up -d --build
docker compose ps
```

Mở:

| Dịch vụ | Địa chỉ |
| --- | --- |
| Giao diện | http://localhost:8081 |
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |
| MySQL | localhost:3307 |

Sau khi container `gymflow-backend` healthy, backend tự chạy **backfill calo MET** cho các buổi tập lịch sử chưa được ước tính.

## 2. Chạy dev (sửa code, tự tải lại)

```powershell
docker compose up -d mysql
powershell -ExecutionPolicy Bypass -File scripts\run-backend.ps1
```

Cửa sổ khác:

```powershell
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173 (Vite proxy `/api` sang `localhost:8080`).

Script `scripts/run-backend.ps1` sẽ đọc `.env`, nạp `SPRING_DATASOURCE_*`, `JWT_SECRET`, `SEED_DEMO_DATA`, `DEMO_*`… và tự tìm Gradle trong `~/.gradle/wrapper/dists` nếu máy chưa cài lệnh `gradle`.

Chạy test backend:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-backend.ps1 test
```

Chạy typecheck/build frontend:

```powershell
cd frontend
npm run typecheck
npm run build
```

## 3. Đăng nhập demo

Bật trong `.env`:

```env
SEED_DEMO_DATA=true
DEMO_QUICK_LOGIN=true
DEMO_PASSWORD=matkhau-demo
```

Tài khoản:

- `admin@gymflow.vn`
- `trainer@gymflow.vn`
- `member@gymflow.vn`

Mật khẩu là `DEMO_PASSWORD`. Ngoài ra seed còn tạo các hội viên `member2@gymflow.vn` … `member12@gymflow.vn`.

## 4. Kiểm thử calo MET

### Hội viên mới / nick của bạn

1. Đăng nhập member.
2. Vào **Tiến độ**, nhập **cân nặng** (bắt buộc để tính calo).
3. Vào **Lịch tập**, mở một buổi đã đến giờ, bấm **Hoàn thành buổi**.
4. Form hoàn thành hiện **Calo ước tính** theo MET; lưu lại.
5. Quay lại **Tiến độ**:
   - Tab **Ngày / Tuần / Tháng**
   - Tổng calo, số buổi, thời gian vận động
   - Biểu đồ theo ngày
   - Bấm vào một ngày/buổi để xem chi tiết MET từng bài.

### Buổi tập cũ đã hoàn thành trước khi có MET

Backend tự backfill khi khởi động. Nếu không muốn restart, Admin gọi:

```http
POST /api/admin/calories/backfill
```

Sau khi nhập cân nặng cho hội viên, Member/HLV/Admin có thể tính lại các buổi đang thiếu dữ liệu:

```http
POST /api/members/{memberId}/calories/recompute
```

Hoặc bấm nút **Tính lại calo** trong trang Tiến độ.

### Kiểm tra trực tiếp DB

```powershell
docker exec -it gymflow-mysql mysql -ugymflow -p gymflow
```

```sql
SELECT COUNT(*) total, SUM(estimated = 1) estimated,
       SUM(estimate_status = 'LEGACY') legacy
FROM workout_logs;

SELECT estimate_status, COUNT(*) FROM workout_logs GROUP BY estimate_status;
```

Kỳ vọng sau backfill: `legacy = 0` (trừ khi tắt backfill hoặc log không còn schedule).

## 5. Lưu ý

- Calo chỉ là **ước tính** từ MET, cân nặng và thời gian vận động; không phải tổng năng lượng tiêu hao cả ngày.
- Thiếu cân nặng → hệ thống không bịa số, ghi `MISSING_WEIGHT` và hiện cảnh báo.
- Calo lịch sử được tính một lần; khi cân nặng thay đổi, các buổi đã ước tính thành công **không tự tính lại**.
- Calo nhập tay cũ được giữ trong `workout_logs.legacy_calories` để truy vết, không dùng cho thống kê.
