<!--
CHỦ FILE: Linh (Hồ Khánh Linh)
TASK: SCRUM-175 · HẠN: 05/11/2026
TASK: SCRUM-199 · HẠN: 10/11/2026
TASK: SCRUM-223 · HẠN: 13/11/2026
CẦN LÀM: Hồi quy S1 (05/11), đối chiếu dashboard (10/11), hồi quy toàn hệ thống (13/11).
Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
-->

# Kế Hoạch & Kết Quả Kiểm Thử Hồi Quy (Regression Testing)

| | |
| --- | --- |
| Người phụ trách | Hồ Khánh Linh (Tester) |
| Tài liệu đối chiếu | `docs/test/TEST_PLAN.md`, `docs/test/UC-01-03.md`, `docs/OWNERS.md` |
| Môi trường | Docker Local (`http://localhost:8081`, API `http://localhost:8080`) & VPS Develop (`http://160.187.229.73:3000`) |
| Cơ sở dữ liệu mẫu | `SEED_DEMO_DATA=true` (dữ liệu bám theo ngày hiện tại) |

---

## 1. SCRUM-175: Báo Cáo Kiểm Thử Hồi Quy Sprint 1 (Ngày chạy: 02/11/2026 – 05/11/2026)

### 1.1 Mục tiêu kiểm thử hồi quy Sprint 1
- Xác nhận toàn bộ các tính năng hoàn thiện trong Sprint 1 (Xác thực, Phân quyền, Hồ sơ, Màn dùng chung, Quản lý HLV) vẫn hoạt động chính xác, ổn định sau khi merge các nhánh tính năng mới của Sprint 2.
- Kiểm tra tính toàn vẹn của dữ liệu và không phát sinh lỗi hồi quy (regression bugs) ảnh hưởng đến luồng chính người dùng.

### 1.2 Tổng hợp kết quả thực thi
| Nhóm chức năng | Tổng số TC | Đạt (Pass) | Không đạt (Fail) | Bị chặn (Blocked) | Tỷ lệ Đạt |
| --- | :---: | :---: | :---: | :---: | :---: |
| **UC-01: Đăng ký hội viên** | 8 | 8 | 0 | 0 | 100% |
| **UC-02: Đăng nhập & Đăng xuất** | 9 | 9 | 0 | 0 | 100% |
| **UC-03: Quên & Đặt lại mật khẩu** | 7 | 7 | 0 | 0 | 100% |
| **Màn hình dùng chung & Quản trị S1** (403, 404, Policy, Profile, Trainers) | 6 | 6 | 0 | 0 | 100% |
| **TỔNG CỘNG SPRINT 1** | **30** | **30** | **0** | **0** | **100%** |

> **Đánh giá tiêu chí kết thúc hồi quy S1 (theo mục 5 TEST_PLAN.md):**
> - 100% test case mức **Cao** đạt (22/22 ca).
> - Tổng tỷ lệ đạt: **100%** (Vượt ngưỡng yêu cầu $\ge 90\%$).
> - Không còn bug Nghiêm trọng hoặc Cao nào còn mở. Đủ điều kiện ổn định để tiếp tục Sprint 2.

---

### 1.3 Bảng chi tiết kết quả chạy lại Test Case Sprint 1

#### A. UC-01: Đăng ký tài khoản hội viên (`/register`)
| Mã TC | Yêu cầu | Mức | Mô tả tóm tắt | Kết quả mong đợi | Kết quả thực tế khi chạy lại | Trạng thái |
| --- | --- | --- | --- | --- | --- | :---: |
| **TC-01-01** | AUTH-01 | Cao | Đăng ký tài khoản hợp lệ | Chuyển sang `/login`, báo tạo thành công, điền sẵn email | Đã chuyển trang `/login`, hiển thị toast xanh thành công, tài khoản tạo đúng role `MEMBER` | **Đạt** |
| **TC-01-02** | NFR-U03 | Trung bình | Để trống form đăng ký | Viền đỏ ô Họ tên, thông báo lỗi, focus vào ô Họ tên, báo tích đồng ý | Viền đỏ ô Họ tên chuẩn, lỗi form hiển thị rõ ràng, con trỏ tự động nhảy về ô Họ tên | **Đạt** |
| **TC-01-03** | AUTH-01 | Cao | Trùng email đã có trong hệ thống | Báo lỗi 409 Conflict, ô email viền đỏ, gợi ý đăng nhập | Hiển thị thông báo "Email đã được sử dụng", viền đỏ ô email, không lưu trùng CSDL | **Đạt** |
| **TC-01-04** | AUTH-01 | Cao | Mật khẩu yếu (< 8 ký tự hoặc chỉ chữ/số) | Thanh đo độ mạnh báo "Yếu", báo lỗi chuẩn mật khẩu, chặn submit | Thanh đo chuyển đỏ báo Yếu, báo lỗi "Tối thiểu 8 ký tự, gồm cả chữ và số" | **Đạt** |
| **TC-01-05** | AUTH-01 | Trung bình | Xác nhận mật khẩu không khớp | Báo lỗi "Mật khẩu nhập lại không khớp" | Ô xác nhận mật khẩu viền đỏ, hiện đúng thông báo lỗi, không gửi request | **Đạt** |
| **TC-01-06** | AUTH-01 | Trung bình | SĐT sai định dạng | Báo lỗi số điện thoại không hợp lệ | Báo lỗi định dạng SĐT (VD: 0912345678) khi nhập chữ hoặc thiếu chữ số | **Đạt** |
| **TC-01-07** | AUTH-07 | Cao | Kiểm tra quyền tài khoản mới tạo | Đăng nhập tài khoản mới, mở link admin bị chặn 403 | Điều hướng đúng vào Dashboard hội viên; gõ trực tiếp URL admin bị component `Only` chặn về 403 | **Đạt** |
| **TC-01-08** | AUTH-01 | Thấp | Tắt đăng ký trực tuyến | Ẩn form, hiện thông báo hướng dẫn liên hệ quầy lễ tân | Hiển thị thông báo đóng đăng ký trực tuyến chuẩn xác | **Đạt** |

#### B. UC-02: Đăng nhập & Đăng xuất (`/login`)
| Mã TC | Yêu cầu | Mức | Mô tả tóm tắt | Kết quả mong đợi | Kết quả thực tế khi chạy lại | Trạng thái |
| --- | --- | --- | --- | --- | --- | :---: |
| **TC-02-01** | AUTH-02 | Cao | Đăng nhập tài khoản Hội viên | Vào Member Dashboard, menu chỉ có mục của hội viên | Điều hướng `/dashboard`, menu hiển thị đúng các chức năng Member | **Đạt** |
| **TC-02-02** | AUTH-02 | Cao | Đăng nhập tài khoản HLV | Vào Trainer Dashboard, menu hiển thị các mục của HLV | Điều hướng đúng Trainer Dashboard, hiển thị quản lý học viên và lịch tập | **Đạt** |
| **TC-02-03** | AUTH-02 | Cao | Đăng nhập tài khoản Quản lý | Vào Admin Dashboard, menu hiển thị toàn quyền quản trị | Đăng nhập admin thành công, thấy đầy đủ menu quản trị hệ thống | **Đạt** |
| **TC-02-04** | AUTH-02 | Cao | Đúng email, sai mật khẩu | Báo lỗi chung "email hoặc mật khẩu không đúng", ghi nhật ký | Hiển thị thông báo lỗi bảo mật chung, không lộ thông tin, ghi audit log | **Đạt** |
| **TC-02-05** | AUTH-02 | Cao | Email không tồn tại | Báo lỗi chung tương tự, không tiết lộ email có tồn tại | Báo "email hoặc mật khẩu không đúng", bảo mật chuẩn chống dò tài khoản | **Đạt** |
| **TC-02-06** | USR-02 | Cao | Đăng nhập tài khoản bị khoá (LOCKED) | Đăng nhập thất bại, báo tài khoản đã bị khoá | Chặn đăng nhập, hiện thông báo liên hệ quản lý để mở khoá | **Đạt** |
| **TC-02-07** | AUTH-08 | Trung bình | Rate limit: nhập sai liên tiếp 5 lần | Chặn 429 Too Many Requests, báo thử lại sau | Kích hoạt rate limit sau 5 lần sai, phản hồi mã 429 và thông báo chờ thử lại | **Đạt** |
| **TC-02-08** | AUTH-07 | Cao | Hội viên truy cập URL Admin | Hiển thị màn hình 403 Forbidden, không lộ dữ liệu | Chặn quyền ngay lập tức, hiển thị trang 403 giao diện đẹp, an toàn | **Đạt** |
| **TC-02-09** | AUTH-03 | Trung bình | Đăng xuất và bấm nút Back trình duyệt | Xoá token, về `/login`, bấm Back không quay lại phiên cũ | Xoá token sạch trong LocalStorage, bấm Back bị redirect về `/login` | **Đạt** |

#### C. UC-03: Quên mật khẩu & Đặt lại mật khẩu (`/forgot-password`)
| Mã TC | Yêu cầu | Mức | Mô tả tóm tắt | Kết quả mong đợi | Kết quả thực tế khi chạy lại | Trạng thái |
| --- | --- | --- | --- | --- | --- | :---: |
| **TC-03-01** | AUTH-04, 05 | Cao | Luồng khôi phục hợp lệ | Nhận mã xác thực 8 ký tự, đặt lại mật khẩu mới thành công | Nhận mã thành công, đổi mật khẩu thành công và đăng nhập được bằng mật khẩu mới | **Đạt** |
| **TC-03-02** | AUTH-04 | Trung bình | Nhập email sai định dạng | Báo lỗi "Email không hợp lệ" ngay dưới ô nhập | Validation tại form chuẩn, viền đỏ ô email và chặn submit | **Đạt** |
| **TC-03-03** | AUTH-04 | Cao | Email không tồn tại trong CSDL | Báo thông báo chung, không tiết lộ email chưa đăng ký | Phản hồi thông báo gửi chung an toàn, bảo vệ danh tính người dùng | **Đạt** |
| **TC-03-04** | AUTH-05 | Cao | Nhập sai mã khôi phục | Báo "Mã khôi phục không hợp lệ hoặc không tồn tại" | Chặn đổi mật khẩu, thông báo lỗi rõ ràng | **Đạt** |
| **TC-03-05** | AUTH-05 | Cao | Mã khôi phục quá hạn 30 phút | Báo mã đã hết hạn, yêu cầu lấy mã mới | Từ chối token hết hạn, báo lỗi đúng thời hạn quy định | **Đạt** |
| **TC-03-06** | AUTH-05 | Cao | Dùng lại mã khôi phục lần 2 | Báo mã đã được sử dụng (single-use token) | Chặn tái sử dụng mã, bảo vệ an toàn tuyệt đối | **Đạt** |
| **TC-03-07** | AUTH-06 | Trung bình | Mật khẩu mới không đạt chuẩn | Báo lỗi độ dài/chữ số, mật khẩu xác nhận không khớp | Form chặn submit, hiển thị lỗi ngay dưới trường nhập | **Đạt** |

#### D. Màn hình dùng chung & Quản trị Sprint 1
| Mã TC | Màn hình / Component | Mức | Mô tả thao tác kiểm thử | Kết quả thực tế khi chạy lại | Trạng thái |
| --- | --- | --- | --- | --- | :---: |
| **TC-REG-01** | Màn 403 Forbidden | Cao | Truy cập URL bị cấm quyền | Hiển thị mã 403, câu giải thích và nút "Về trang tổng quan" hoạt động tốt | **Đạt** |
| **TC-REG-02** | Màn 404 Not Found | Thấp | Gõ URL không tồn tại | Hiển thị mã 404, thông điệp thân thiện và nút quay về an toàn | **Đạt** |
| **TC-REG-03** | Màn Điều khoản & Chính sách | Thấp | Mở `/policies` và chuyển đổi ngôn ngữ EN/VI | Hiển thị chuẩn nội dung Điều khoản sử dụng & Chính sách bảo mật song ngữ | **Đạt** |
| **TC-REG-04** | Màn Hồ sơ cá nhân (`/profile`) | Cao | Cập nhật Họ tên, SĐT, thông tin theo vai trò | Lưu thông tin thành công qua `PUT /auth/me`, cập nhật realtime trên giao diện | **Đạt** |
| **TC-REG-05** | Đổi mật khẩu trong Profile | Cao | Đổi mật khẩu với mật khẩu hiện tại đúng/sai | Kiểm tra mật khẩu cũ chuẩn xác, đổi thành công có thanh đo độ mạnh | **Đạt** |
| **TC-REG-06** | Quản lý Huấn luyện viên (`/trainers`) | Cao | Thêm HLV, xếp ca làm việc, tạm ngừng/kích hoạt | Modal thêm HLV hiện mật khẩu tạm, xếp ca làm việc `ShiftEditor` không bị chồng giờ | **Đạt** |

---

## 2. SCRUM-199: Đối Chiếu Số Liệu Dashboard Giữa 3 Vai Trò (Hạn: 10/11/2026)

### 2.1 Mục tiêu và trạng thái
- Đối chiếu các số liệu trên dashboard ADMIN, TRAINER và MEMBER với API dashboard, lịch tập, hội viên, gói tập, cân nặng và dữ liệu mẫu tương ứng.
- Xác nhận các phép tính, phạm vi dữ liệu theo vai trò, trạng thái dữ liệu rỗng và cập nhật sau khi dữ liệu thay đổi.
- **Trạng thái báo cáo: Chưa chạy.** Các giá trị ở cột kết quả thực tế phải được điền trong lúc thực thi; không coi dữ liệu kỳ vọng là kết quả đã quan sát.

### 2.2 Môi trường và dữ liệu chuẩn bị
- Môi trường ưu tiên: Docker Local theo `docs/test/TEST_PLAN.md` (frontend `http://localhost:8081`, API `http://localhost:8080`, Swagger `http://localhost:8080/swagger-ui/index.html`). Không thực hiện thao tác tạo/xoá dữ liệu kiểm thử trên VPS.
- Xác nhận phiên bản đã merge vào `develop`, CI xanh, API hoạt động và đồng hồ nghiệp vụ đang theo `Asia/Ho_Chi_Minh`.
- Dùng dữ liệu mẫu chỉ khi DB trống và `SEED_DEMO_DATA=true`. `DataSeeder` chỉ seed khi DB chưa có user; không xoá volume hoặc reset DB đang có dữ liệu chỉ để làm cho số liệu khớp.
- Dữ liệu baseline của seeder: 12 hội viên, 3 HLV, 6 gói tập; 1 hội viên ở trạng thái `PAUSED`; các lịch tập, gói, cân nặng và nhật ký được tạo tương đối theo ngày hiện tại. Do đó số buổi hôm nay, doanh thu, gói sắp hết hạn và các chỉ số theo thời gian cần đối chiếu theo DB ở lần chạy, không dùng một con số cố định qua các ngày.
- Tài khoản mẫu: `admin@gymflow.vn`, `trainer@gymflow.vn`, `member@gymflow.vn`. Lấy mật khẩu qua cấu hình/kênh bảo mật hiện hành, không ghi vào báo cáo hoặc repository.
- Chuẩn bị thêm/kiểm tra hồ sơ hội viên do HLV demo phụ trách, lịch của họ trong tuần với trạng thái `COMPLETED`, `MISSED`, `CANCELLED`, `SCHEDULED`, và dữ liệu cân nặng; dùng dữ liệu thật đã seed, không sửa trực tiếp production.

### 2.3 Nguồn đối chiếu và quy tắc tính

| Dashboard | API nguồn | Nguồn đối chiếu | Quy tắc cần xác nhận |
| --- | --- | --- | --- |
| ADMIN | `GET /api/dashboard/admin` | Danh sách hội viên/HLV, đăng ký gói, lịch hôm nay, báo cáo doanh thu, nhật ký hệ thống | `totalMembers` là tổng hội viên; `activeMembers` chỉ trạng thái ACTIVE; `newMembersThisMonth` theo ngày tham gia; `membersWithActivePackage` theo gói hiệu lực hôm nay; gói hết hạn trong 7 ngày; doanh thu theo tháng thu tiền; danh sách biểu đồ gồm 6 tháng; lịch hôm nay không tính buổi huỷ. |
| TRAINER | `GET /api/dashboard/trainer` | Hồ sơ HLV, danh sách hội viên được giao, lịch tuần/hôm nay, giáo án ACTIVE và gói sắp hết hạn của hội viên thuộc HLV | Chỉ tính dữ liệu thuộc HLV đăng nhập; tuần tính từ Thứ 2 đến hết Chủ nhật; loại lịch CANCELLED khỏi số buổi; `completionRate = completed / (completed + missed) × 100`, làm tròn 1 chữ số; lịch SCHEDULED chưa diễn ra không nằm trong mẫu số; `null` nếu chưa có buổi COMPLETED/MISSED. |
| MEMBER | `GET /api/dashboard/member` | Hồ sơ của chính hội viên, gói, lịch, nhật ký hoàn thành, cân nặng và giáo án | Chỉ trả dữ liệu của hội viên đăng nhập; `completedThisMonth` đếm buổi COMPLETED theo tháng hiện tại; `nextSession` là buổi SCHEDULED gần nhất trong tương lai; `weekSessions` thuộc tuần hiện tại; BMI dùng cân nặng mới nhất và chiều cao, làm tròn 1 chữ số; BMI và phân loại là `null` khi thiếu cân nặng hoặc chiều cao. |

### 2.4 Các bước chạy chung
1. Ghi thời điểm kiểm thử, môi trường, commit/nhánh, vai trò đăng nhập và xác nhận nguồn dữ liệu mẫu.
2. Với từng vai trò, mở dashboard và lưu các giá trị hiển thị (ảnh chụp hoặc ghi vào bảng 2.5).
3. Gọi endpoint dashboard tương ứng bằng phiên đăng nhập cùng vai trò; so sánh response với giao diện.
4. Đối chiếu các giá trị với màn hình/module nguồn hoặc dữ liệu kiểm thử đã chuẩn bị; dùng cùng khoảng ngày và múi giờ.
5. Thực hiện kiểm tra phân quyền bằng cách gọi endpoint của vai trò khác. Ghi nhận mã HTTP; mong đợi 403, không trả dữ liệu dashboard ngoài quyền.
6. Ghi kết quả thực tế, trạng thái `Đạt` / `Không đạt` / `Chặn`, và mã BUG nếu có sai khác tái hiện được. Không đánh dấu đạt chỉ vì UI và API khớp nhau nếu cả hai cùng sai so với nguồn dữ liệu.

### 2.5 Checklist đối chiếu dashboard

| Mã | Vai trò / hạng mục | Dữ liệu và thao tác đối chiếu | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Bug |
| --- | --- | --- | --- | --- | --- | --- |
| **TC-199-01** | ADMIN — số hội viên | Đăng nhập ADMIN; đối chiếu `totalMembers`, `activeMembers`, `newMembersThisMonth` với danh sách hội viên và điều kiện trạng thái/ngày tham gia tương ứng. Với DB mới seed, xác nhận baseline 12 hội viên, 11 ACTIVE, 1 PAUSED. | Số trên API và dashboard bằng số đếm nguồn sau khi áp dụng đúng điều kiện; baseline seed mới khớp 12/11/1. | Chưa chạy | Chưa chạy | |
| **TC-199-02** | ADMIN — gói và doanh thu | Đối chiếu `membersWithActivePackage`, `expiringSoon`, `expiring`, `planDistribution`, `revenueThisMonth`, `revenuePrevMonth`, `revenueByMonth` với danh sách đăng ký gói và báo cáo doanh thu trong cùng kỳ. | Gói hiệu lực tính theo ngày hiện tại; danh sách sắp hết hạn tối đa 8 mục và trong 7 ngày; biểu đồ doanh thu có đúng 6 tháng gần nhất, nhãn `MM/yyyy`, số tiền theo ngày thu tiền. Giá trị phụ thuộc ngày seed nên ghi số thực tế, không áp số cố định. | Chưa chạy | Chưa chạy | |
| **TC-199-03** | ADMIN — lịch, HLV và hoạt động | Đối chiếu `activeTrainers`, `sessionsToday`, `recentActivity` với danh sách HLV, lịch trong ngày và 8 audit log mới nhất. | Số HLV là HLV đang hoạt động; số lịch hôm nay bỏ `CANCELLED`; hoạt động hiển thị tối đa 8 bản ghi mới nhất và nội dung/actor/thời gian khớp nguồn. | Chưa chạy | Chưa chạy | |
| **TC-199-04** | TRAINER — phạm vi và số liệu tuần | Đăng nhập HLV demo; đối chiếu `memberCount`, `sessionsToday`, `sessionsThisWeek`, `completedThisWeek`, `missedThisWeek`, `completionRate` với lịch và danh sách hội viên do HLV phụ trách. | Chỉ tính hội viên/lịch của HLV hiện tại; lịch `CANCELLED` bị loại; buổi `SCHEDULED` không ảnh hưởng tỷ lệ; với dữ liệu có 2 COMPLETED và 1 MISSED, tỷ lệ là 66.7%; không có buổi kết thúc thì tỷ lệ là `null`/hiển thị `—`. | Chưa chạy | Chưa chạy | |
| **TC-199-05** | TRAINER — biểu đồ và danh sách | Đối chiếu `weekLoad`, `todaySessions`, `activePlans`, `expiringMembers`, `assignedMembers` với lịch tuần, giáo án ACTIVE, hội viên và gói của họ. | `weekLoad` có đúng 7 nhãn T2–CN và số buổi mỗi ngày; danh sách hôm nay và hội viên/gói thuộc đúng HLV; giáo án chỉ đếm ACTIVE; hội viên phụ trách sắp tăng dần theo tỷ lệ, giá trị null ở cuối. | Chưa chạy | Chưa chạy | |
| **TC-199-06** | MEMBER — thông tin cá nhân và gói | Đăng nhập MEMBER; so sánh `member`, `currentSubscription`, `currentPlan` với hồ sơ, gói hiệu lực và giáo án của tài khoản đó. | Hồ sơ và các tài nguyên khớp chính hội viên đăng nhập; trường không có dữ liệu là `null`, không hiển thị dữ liệu hội viên khác. | Chưa chạy | Chưa chạy | |
| **TC-199-07** | MEMBER — lịch, chuyên cần và BMI | Đối chiếu `nextSession`, `weekSessions`, `completedThisMonth`, `streakWeeks`, `latestWeight`, `bmi`, `bmiCategory` với lịch, cân nặng và hồ sơ chiều cao. Tính BMI độc lập bằng `kg / (cm / 100)^2`. | Buổi tiếp theo là SCHEDULED gần nhất còn trong tương lai; lịch tuần thuộc tuần hiện tại; buổi hoàn thành tháng này đếm theo tháng của ngày bắt đầu; cân nặng là bản ghi mới nhất; BMI khớp phép tính làm tròn 1 chữ số và phân loại theo ngưỡng đã ghi trong `weights-progress.md`. | Chưa chạy | Chưa chạy | |
| **TC-199-08** | MEMBER — dữ liệu rỗng / thiếu | Dùng tài khoản kiểm thử riêng chưa có gói, lịch, giáo án, cân nặng hoặc thiếu chiều cao; mở dashboard và đối chiếu response. | Không lỗi trang; giá trị/collection rỗng hoặc null theo DTO; không hiển thị số giả (ví dụ BMI khi thiếu cân nặng/chiều cao). Không sửa/xoá dữ liệu mẫu dùng chung để tạo ca này. | Chưa chạy | Chưa chạy | |
| **TC-199-09** | Phân quyền endpoint | Gọi cả 3 endpoint dashboard lần lượt bằng token ADMIN, TRAINER, MEMBER; thử endpoint không đúng vai trò và gọi khi chưa đăng nhập. | Endpoint đúng vai trò trả 200; sai vai trò trả 403; chưa đăng nhập trả 401; không trả payload dữ liệu dashboard trái quyền. | Chưa chạy | Chưa chạy | |
| **TC-199-10** | Đối chiếu UI với API | Với từng tài khoản, so sánh toàn bộ chỉ số hiển thị trên dashboard với JSON endpoint, chú ý định dạng tiền, phần trăm, làm tròn và trạng thái loading/error. | UI biểu diễn đúng giá trị API; tiền tệ/đơn vị/nhãn đúng; dữ liệu null hiển thị dấu hoặc trạng thái rỗng phù hợp, không hiển thị `null`, `NaN` hay lỗi định dạng. | Chưa chạy | Chưa chạy | |

### 2.6 Tổng hợp kết quả thực thi

| Chỉ số | Giá trị |
| --- | ---: |
| Tổng số test case | 10 |
| Đạt | 0 |
| Không đạt | 0 |
| Bị chặn | 0 |
| Chưa chạy | 10 |
| Bug được xác nhận trong lần chạy | 0 |

| Test case không đạt / bị chặn | Giá trị thực tế và bằng chứng (response, ảnh, dữ liệu nguồn) | Mã bug | Người phụ trách |
| --- | --- | --- | --- |
| Chưa có | Chưa chạy | — | — |

> Chỉ cập nhật tổng kết và chuyển trạng thái test case sau khi thực chạy. Khi UI/API lệch nguồn hoặc vi phạm phân quyền, ghi bug vào `docs/test/BUGS.md`, điền file liên quan và người sửa theo `docs/OWNERS.md`; không suy đoán bug chỉ từ việc chưa chạy.

---

## 3. SCRUM-223: Kiểm Thử Hồi Quy Toàn Hệ Thống Trước Demo (Hạn: 13/11/2026)
<!-- TODO(Linh): Chạy lại toàn bộ test case toàn hệ thống trước khi nghiệm thu -->
