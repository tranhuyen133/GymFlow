# API gói tập và đăng ký gói

Task: SCRUM-157, SCRUM-158, SCRUM-159, SCRUM-160 · Người phụ trách: Kiên
Code: `web/PlanController.java`, `service/PlanService.java`, `service/SubscriptionService.java`, `dto/Dtos.java`

Tất cả đường dẫn bắt đầu bằng `/api`. Trừ `GET /api/plans/public`, mọi API cần header
`Authorization: Bearer <token>` lấy từ `POST /api/auth/login`.

## Định dạng lỗi chung

```json
{ "timestamp": "2026-10-28T21:00:00", "status": 400, "message": "Dữ liệu không hợp lệ",
  "fieldErrors": { "price": "Giá không âm" } }
```

| Mã | Khi nào |
| --- | --- |
| 400 | Dữ liệu sai (`fieldErrors` ghi lỗi từng trường) hoặc vi phạm luật nghiệp vụ (`message`) |
| 401 | Chưa đăng nhập hoặc token hết hạn |
| 403 | Đăng nhập rồi nhưng sai vai trò |
| 404 | Không tìm thấy gói tập / hội viên / đăng ký gói |
| 409 | Trùng tên gói, trùng khoảng ngày, hoặc xoá gói đã có người đăng ký |

---

## Gói tập

### `PlanResponse`

```json
{ "id": 1, "name": "Gói 1 tháng", "description": "...", "price": 500000, "durationDays": 30,
  "benefits": "...", "active": true, "currentSubscriptions": 12 }
```

`currentSubscriptions`: số đăng ký chưa huỷ và chưa hết hạn (`endDate` ≥ hôm nay), gồm cả gói sắp bắt đầu.

### `PlanRequest` (dùng cho tạo và sửa)

| Trường | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | --- | --- |
| `name` | string | có | không rỗng, ≤ 100 ký tự, không trùng tên gói khác (không phân biệt hoa thường) |
| `description` | string | | ≤ 500 |
| `price` | số nguyên (VND) | có | ≥ 0 |
| `durationDays` | số nguyên | có | 1 – 1095 (tối đa 3 năm) |
| `benefits` | string | | ≤ 1000 |

### Danh sách API

| Phương thức | Đường dẫn | Vai trò | Kết quả | Ghi chú |
| --- | --- | --- | --- | --- |
| GET | `/plans/public` | không cần đăng nhập | 200 `PlanResponse[]` | Chỉ gói đang bán, sắp theo giá tăng dần |
| GET | `/plans?includeInactive=false` | mọi vai trò | 200 `PlanResponse[]` | `includeInactive=true` chỉ có tác dụng với ADMIN; vai trò khác vẫn chỉ thấy gói đang bán |
| POST | `/plans` | ADMIN | 201 `PlanResponse` | Gói mới luôn ở trạng thái đang bán. 409 nếu trùng tên |
| PUT | `/plans/{id}` | ADMIN | 200 `PlanResponse` | Sửa giá **không** ảnh hưởng gói đã bán (số tiền thực trả lưu ở `pricePaid`). 404, 409 |
| PUT | `/plans/{id}/active` | ADMIN | 200 `PlanResponse` | Body `{ "active": false }` để ngừng bán, `true` để bán lại |
| DELETE | `/plans/{id}` | ADMIN | 204 | 409 nếu gói đã từng có người đăng ký – khi đó dùng ngừng bán để giữ lịch sử doanh thu |

---

## Đăng ký gói

### `SubscriptionResponse`

```json
{ "id": 7, "memberId": 3, "memberName": "Nguyễn Văn A", "memberCode": "HV0003",
  "planId": 1, "planName": "Gói 1 tháng", "startDate": "2026-10-28", "endDate": "2026-11-26",
  "pricePaid": 500000, "state": "ACTIVE", "daysLeft": 29, "cancelled": false, "cancelledAt": null,
  "note": null, "createdAt": "2026-10-28T21:00:00", "createdByName": "Quản lý" }
```

`state` không lưu trong CSDL mà tính theo ngày hôm nay (giờ Việt Nam), cùng quy tắc với view `v_subscription_status`:

| `state` | Điều kiện (xét theo thứ tự) |
| --- | --- |
| `CANCELLED` | đã huỷ |
| `UPCOMING` | hôm nay < `startDate` |
| `EXPIRED` | hôm nay > `endDate` |
| `EXPIRING` | còn ≤ 7 ngày đến `endDate` (tính cả ngày kết thúc là hôm nay) |
| `ACTIVE` | các trường hợp còn lại |

### `SubscriptionRequest`

| Trường | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `memberId` | số | có | |
| `planId` | số | có | Gói phải đang bán |
| `startDate` | `yyyy-MM-dd` | | Để trống = **gia hạn nối tiếp**: lấy ngày kết thúc xa nhất trong các gói chưa huỷ; nếu ngày đó chưa qua thì bắt đầu ngay ngày hôm sau, nếu đã qua hoặc chưa có gói thì bắt đầu hôm nay. Không được lùi quá 30 ngày so với hôm nay |
| `pricePaid` | số nguyên (VND) | | ≥ 0. Để trống = giá hiện tại của gói |
| `note` | string | | ≤ 255 |

`endDate` luôn do hệ thống tính: `startDate + durationDays − 1`.

### `SubscriptionPreview`

```json
{ "startDate": "2026-11-27", "endDate": "2026-12-26", "price": 500000, "chained": true }
```

`chained = true` nghĩa là ngày bắt đầu được nối tiếp sau gói đang có.

### Danh sách API

| Phương thức | Đường dẫn | Vai trò | Kết quả | Ghi chú |
| --- | --- | --- | --- | --- |
| GET | `/subscriptions?state=&memberId=` | ADMIN | 200 `SubscriptionResponse[]` | Lọc tuỳ chọn theo `state` (giá trị như bảng trên) và `memberId` |
| GET | `/subscriptions/me` | MEMBER | 200 `SubscriptionResponse[]` | Gói của chính hội viên đang đăng nhập, mới nhất trước |
| GET | `/members/{id}/subscriptions` | ADMIN, HLV phụ trách, chính hội viên | 200 `SubscriptionResponse[]` | 403 nếu không có quyền xem hội viên này |
| GET | `/subscriptions/preview?memberId=&planId=&startDate=` | ADMIN | 200 `SubscriptionPreview` | Dùng cho form đăng ký: xem trước ngày và giá trước khi lưu |
| POST | `/subscriptions` | ADMIN | 201 `SubscriptionResponse` | Xem luật bên dưới |
| PUT | `/subscriptions/{id}/cancel` | ADMIN | 200 `SubscriptionResponse` | Body tuỳ chọn `{ "reason": "..." }` (≤ 200), lý do được ghi thêm vào `note` |

### Luật khi đăng ký (`POST /subscriptions`)

1. Hội viên ở trạng thái ngừng hoạt động → 400.
2. Gói đã ngừng bán → 400.
3. `startDate` lùi quá 30 ngày → 400.
4. Khoảng ngày trùng một gói chưa huỷ của cùng hội viên → **409**. Để trống `startDate` để gia hạn nối tiếp.
5. **Chống chồng gói khi gửi đồng thời** (SCRUM-160): trước khi tính ngày, backend khoá dòng hội viên
   (`SELECT … FOR UPDATE`). Hai yêu cầu cùng lúc cho cùng một hội viên sẽ chạy lần lượt; yêu cầu sau
   thấy gói vừa tạo nên được nối tiếp hoặc bị 409, không bao giờ chồng ngày.
6. Ghi nhật ký `SUBSCRIPTION_CREATE`, hoặc `SUBSCRIPTION_RENEW` nếu là gia hạn nối tiếp.

### Luật khi huỷ (`PUT /subscriptions/{id}/cancel`)

- Gói đã huỷ → 400. Gói đã hết hạn → 400.
- Huỷ không xoá bản ghi: giữ lại để tính doanh thu và lịch sử. Ghi nhật ký `SUBSCRIPTION_CANCEL`.

---

## Đã biết

- Gọi `/subscriptions/preview` mà **thiếu** `memberId` hoặc `planId` hiện trả **500** thay vì 400, do
  `GlobalExceptionHandler` chưa bắt `MissingServletRequestParameterException` (cùng lỗi với báo cáo ở SCRUM-206,
  đã báo cho người phụ trách SCRUM-129). Sai định dạng (ví dụ `memberId=abc`) thì đã trả 400 đúng.

## Đã kiểm tra

28/10/2026 trên VPS, nhánh `develop` @ 9ec88df: 17/17 kiểm tra API của SCRUM-157/158/159/160 đạt (gồm phân quyền 403,
dữ liệu sai 400, trùng ngày 409, 2 đăng ký đồng thời không chồng ngày, huỷ lần 2 bị từ chối);
`SubscriptionServiceTest`, `MemberSubscriptionTest`: BUILD SUCCESSFUL.
