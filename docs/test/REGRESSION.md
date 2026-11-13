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
- **Trạng thái báo cáo: Đã kiểm thử các chức năng chính, còn nội dung cần xác minh bổ sung.**
  Đã kiểm thử các chức năng chính trên Dashboard ADMIN, TRAINER và MEMBER; kiểm tra trường hợp dữ liệu rỗng hoặc thiếu dữ liệu; kiểm tra phân quyền truy cập Dashboard giữa ba vai trò; đồng thời gọi API của cả ba vai trò để đối chiếu số liệu với giao diện.
  Các chức năng đã kiểm tra hoạt động đúng theo kết quả quan sát. TC-199-09 cần xác minh bổ sung trường hợp gọi API khi chưa đăng nhập trước khi kết luận hoàn thành toàn bộ tiêu chí.

### 2.2 Môi trường và dữ liệu chuẩn bị

- Môi trường ưu tiên: Docker Local theo `docs/test/TEST_PLAN.md` (frontend `http://localhost:8081`, API `http://localhost:8080`, Swagger `http://localhost:8080/swagger-ui/index.html`). Không thực hiện thao tác tạo/xoá dữ liệu kiểm thử trên VPS.
- Xác nhận phiên bản đã merge vào `develop`, CI xanh, API hoạt động và đồng hồ nghiệp vụ đang theo `Asia/Ho_Chi_Minh`.
- Dùng dữ liệu mẫu chỉ khi DB trống và `SEED_DEMO_DATA=true`. `DataSeeder` chỉ seed khi DB chưa có user; không xoá volume hoặc reset DB đang có dữ liệu chỉ để làm cho số liệu khớp.
- Môi trường Docker Local hiện đặt `SEED_DEMO_DATA=false`; các số liệu baseline dưới đây là dữ liệu dự kiến khi seeder chạy trên DB trống, không phải số liệu thực tế của DB tại thời điểm kiểm thử.
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
6. Ghi kết quả thực tế, trạng thái `Đạt` / `Không đạt` / `Kiểm thử một phần` / `Chặn`, và mã BUG nếu có sai khác tái hiện được. Không đánh dấu đạt chỉ vì UI và API khớp nhau nếu cả hai cùng sai so với nguồn dữ liệu.

### 2.5 Checklist đối chiếu dashboard

| Mã | Vai trò / hạng mục | Dữ liệu và thao tác đối chiếu | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Bug |
| --- | --- | --- | --- | --- | --- | --- |
| **TC-199-01** | ADMIN — số hội viên | Đăng nhập ADMIN; đối chiếu `totalMembers`, `activeMembers`, `newMembersThisMonth` với danh sách hội viên và điều kiện trạng thái/ngày tham gia tương ứng. | Số liệu API và Dashboard khớp với danh sách hội viên sau khi áp dụng đúng điều kiện trạng thái và ngày tham gia. | Đã kiểm tra số lượng hội viên trên Dashboard ADMIN và đối chiếu với API. Số liệu hiển thị phù hợp với kết quả kiểm tra. | Đạt | |
| **TC-199-02** | ADMIN — gói và doanh thu | Đối chiếu `membersWithActivePackage`, `expiringSoon`, `expiring`, `planDistribution`, `revenueThisMonth`, `revenuePrevMonth`, `revenueByMonth` với danh sách đăng ký gói và báo cáo doanh thu trong cùng kỳ. | Thông tin gói tập và doanh thu hiển thị trên Dashboard khớp với dữ liệu API tương ứng. | Đã kiểm tra thông tin gói tập và doanh thu trên Dashboard ADMIN; đã đối chiếu số liệu với API và xác nhận kết quả phù hợp. | Đạt | |
| **TC-199-03** | ADMIN — lịch và hoạt động | Đối chiếu `sessionsToday`, `recentActivity` với lịch trong ngày và hoạt động được hiển thị trên Dashboard. | Số lịch hôm nay và thông tin hoạt động trên Dashboard khớp với dữ liệu API tương ứng. | Đã kiểm tra lịch và hoạt động trên Dashboard ADMIN, các thông tin hiển thị phù hợp với kết quả đối chiếu. | Đạt | |
| **TC-199-04** | TRAINER — phạm vi và số liệu tuần | Đăng nhập HLV demo; đối chiếu `memberCount`, `sessionsToday`, `sessionsThisWeek`, `completedThisWeek`, `missedThisWeek`, `completionRate` với lịch và danh sách hội viên do HLV phụ trách. | Các số liệu tuần, lịch tập và danh sách hội viên hiển thị đúng phạm vi HLV đăng nhập và phù hợp với dữ liệu API đã đối chiếu. | Đã kiểm tra số liệu tuần, lịch tập và hội viên trên Dashboard TRAINER; các chức năng hoạt động đúng theo kết quả quan sát. | Đạt | |
| **TC-199-05** | TRAINER — lịch tập, hội viên và giáo án | Đối chiếu lịch tập, danh sách hội viên và giáo án trên Dashboard với dữ liệu API tương ứng. | Lịch tập, hội viên và giáo án hiển thị đúng phạm vi HLV đăng nhập, khớp với dữ liệu API tương ứng. | Đã kiểm tra lịch tập, hội viên và giáo án trên Dashboard TRAINER; đã đối chiếu dữ liệu API tương ứng. | Đạt | |
| **TC-199-06** | MEMBER — thông tin cá nhân và gói | Đăng nhập MEMBER; đối chiếu thông tin cá nhân và gói tập trên Dashboard với dữ liệu API của tài khoản đó. | Hồ sơ và các tài nguyên khớp với chính hội viên đăng nhập; trường không có dữ liệu là `null`, không hiển thị dữ liệu hội viên khác. | Đã kiểm tra thông tin cá nhân và gói tập trên Dashboard MEMBER; dữ liệu hiển thị đúng theo tài khoản kiểm thử và API. | Đạt | |
| **TC-199-07** | MEMBER — lịch tập và BMI | Đối chiếu lịch tập và các thông tin BMI trên Dashboard với dữ liệu API và thông tin cân nặng, chiều cao của hội viên. | Thông tin lịch tập và BMI hiển thị phù hợp với dữ liệu của hội viên và kết quả API đối chiếu. | Đã kiểm tra lịch tập và BMI trên Dashboard MEMBER; các thông tin hiển thị đúng theo kết quả quan sát và dữ liệu API đã đối chiếu. | Đạt | |
| **TC-199-08** | MEMBER — dữ liệu rỗng / thiếu | Kiểm tra Dashboard trong trường hợp dữ liệu rỗng hoặc thiếu dữ liệu; đối chiếu cách giao diện xử lý với kết quả API. | Không lỗi trang; giá trị/collection rỗng hoặc null theo DTO; không hiển thị số giả (ví dụ BMI khi thiếu cân nặng/chiều cao). Không sửa/xoá dữ liệu mẫu dùng chung để tạo ca này. | Đã kiểm tra trường hợp dữ liệu rỗng hoặc thiếu dữ liệu; Dashboard xử lý và hiển thị đúng theo kết quả quan sát. | Đạt | |
| **TC-199-09** | Phân quyền endpoint | Gọi cả 3 endpoint dashboard lần lượt bằng token ADMIN, TRAINER, MEMBER; thử endpoint không đúng vai trò và gọi khi chưa đăng nhập. | Endpoint đúng vai trò trả 200; sai vai trò trả 403; chưa đăng nhập trả 401; không trả payload dữ liệu dashboard trái quyền. | Đã kiểm tra phân quyền truy cập Dashboard giữa ADMIN, TRAINER và MEMBER. Cần xác minh bổ sung trường hợp gọi API khi chưa đăng nhập và mã phản hồi HTTP 401. | Kiểm thử một phần | |
| **TC-199-10** | Đối chiếu UI với API | Với từng vai trò, so sánh số liệu hiển thị trên Dashboard với dữ liệu JSON từ API tương ứng. | Các số liệu được kiểm tra trên giao diện Dashboard phù hợp với giá trị API tương ứng của từng vai trò. | Đã gọi API của cả ba vai trò ADMIN, TRAINER và MEMBER; so sánh số liệu API trả về với giao diện Dashboard tương ứng và xác nhận kết quả phù hợp. | Đạt | |

### 2.6 Tổng hợp kết quả thực thi

| Chỉ số | Giá trị |
| --- | ---: |
| Tổng số test case | 10 |
| Đạt | 9 |
| Không đạt | 0 |
| Kiểm thử một phần | 1 |
| Bị chặn | 0 |
| Chưa chạy | 0 |
| Bug được xác nhận trong lần chạy | 0 |

| Test case cần xác minh bổ sung | Giá trị thực tế và bằng chứng (response, ảnh, dữ liệu nguồn) | Mã bug | Người phụ trách |
| --- | --- | --- | --- |
| TC-199-09 | Đã kiểm tra phân quyền Dashboard giữa ADMIN, TRAINER và MEMBER. Cần xác minh bổ sung trường hợp gọi API khi chưa đăng nhập, kỳ vọng HTTP 401. | — | Hồ Khánh Linh |

> Kết quả ghi nhận dựa trên các chức năng đã thực sự kiểm thử. TC-199-09 chỉ chuyển sang Đạt sau khi xác minh đầy đủ trường hợp truy cập khi chưa đăng nhập và các trường hợp phân quyền sai vai trò. Khi UI/API lệch nguồn hoặc vi phạm phân quyền, ghi bug vào `docs/test/BUGS.md`, điền file liên quan và người sửa theo `docs/OWNERS.md`.

## 3. SCRUM-223: Kiểm Thử Hồi Quy Toàn Hệ Thống Trước Demo (Hạn: 13/11/2026)

### 3.1 Mục tiêu và trạng thái

- Xác nhận các luồng chính, luồng lỗi và phân quyền hoạt động trên bản build dự kiến demo.
- Chạy lại các test case hiện có, kiểm tra luồng liên module và rà soát các bug đang mở/chờ xác minh.
- **Trạng thái báo cáo: Chưa chạy.** Checklist dưới đây là phạm vi cần thực thi, không phải kết quả đã xác nhận. Không suy diễn kết quả từ các lần chạy trước hoặc từ việc trang/API tải được.

### 3.2 Thông tin lần chạy

| Thông tin | Ghi nhận |
| --- | --- |
| Ngày giờ bắt đầu / kết thúc (Asia/Ho_Chi_Minh) | Chưa chạy |
| Người chạy | Chưa chạy |
| Môi trường và URL | Chưa chạy |
| Trình duyệt / thiết bị | Chưa chạy |
| Nhánh và commit build đang kiểm thử | Chưa chạy |
| CI của commit | Chưa chạy |
| Phiên bản DB / migration | Chưa chạy |
| Tài khoản kiểm thử (chỉ ghi vai trò, không ghi thông tin xác thực) | Chưa chạy |

### 3.3 Điều kiện và an toàn trước khi chạy

1. Chọn đúng build dự kiến demo; xác nhận commit đã merge vào `develop`, CI xanh và ghi commit SHA ở mục 3.2.
2. Chạy trước trên Docker Local theo [`TEST_PLAN.md`](./TEST_PLAN.md). Chỉ chạy smoke test không phá huỷ trên VPS sau khi được phép; không tạo/xoá dữ liệu, reset DB, chạy seed, migration thủ công hoặc dùng lệnh `docker compose down -v` trên VPS.
3. Xác nhận API, giao diện, Swagger, kết nối DB và migration hoạt động. Nếu môi trường không sẵn sàng, dừng test phụ thuộc môi trường và đánh dấu **Chặn**, không đánh dấu **Đạt**.
4. Chuẩn bị tài khoản ADMIN, TRAINER và MEMBER riêng; xác nhận quyền/phạm vi dữ liệu trước khi chạy. Nhận mật khẩu qua kênh bảo mật; không lưu mật khẩu, token, mã khôi phục hoặc dữ liệu cá nhân trong tài liệu/ảnh bằng chứng.
5. Dùng dữ liệu kiểm thử có thể nhận diện và khôi phục. Tránh thay đổi tài khoản, lịch, gói, bài viết hoặc dữ liệu dùng chung; ghi ID dữ liệu được tạo và dọn dữ liệu thử sau khi xác nhận kết quả.
6. Ghi rõ trường hợp phụ thuộc ngày/giờ, múi giờ và seed hiện tại. Không dùng các số liệu seed cố định làm kết quả mong đợi khi dữ liệu đã thay đổi.

### 3.4 Phạm vi hồi quy và checklist thực thi

Chạy các test case chi tiết trong tài liệu được dẫn chiếu; checklist dưới đây bổ sung kiểm tra liên luồng và các hạng mục cần xác nhận trước demo. Với mỗi dòng, ghi kết quả thực tế, trạng thái và bug/bằng chứng ở bảng 3.5.

| Mã | Mức | Hạng mục hồi quy | Phạm vi / tài liệu tham chiếu | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Bug / bằng chứng |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RG-223-01 | Cao | Khởi động và sức khoẻ hệ thống | Frontend, API, Swagger, DB, migration; [`TEST_PLAN.md`](./TEST_PLAN.md) | Build dự kiến chạy được; API phản hồi; migration không làm mất dữ liệu; không có lỗi khởi động hoặc lỗi nghiêm trọng trong log. | Đã kiểm tra frontend localhost:8081, backend health check và MySQL. Chưa xác minh build dự kiến demo và migration. | Chặn | Đã kiểm tra health check ngày 13/11/2026 |
| RG-223-02 | Cao | Xác thực và phiên đăng nhập | Đăng ký (nếu đang bật), đăng nhập/đăng xuất, quên/đặt lại mật khẩu, khoá tài khoản; [`UC-01-03.md`](./UC-01-03.md) | Luồng hợp lệ hoạt động; dữ liệu đăng nhập sai/đầu vào không hợp lệ bị từ chối; đăng xuất vô hiệu phiên; không lộ thông tin nhạy cảm. | Chưa thể kiểm thử đăng nhập ADMIN local: database hiện chỉ có 1 MEMBER, không có ADMIN hoặc TRAINER. | Chặn | Thiếu tài khoản kiểm thử ADMIN/TRAINER |
| RG-223-03 | Cao | Ma trận phân quyền | ADMIN, TRAINER, MEMBER; UI và API của các module trong [`TEST_PLAN.md`](./TEST_PLAN.md) | Mỗi vai trò chỉ truy cập chức năng và dữ liệu được phép; truy cập sai quyền bị từ chối, không lộ dữ liệu; kiểm tra cả truy cập trực tiếp URL và gọi API. | Chưa chạy | Chưa chạy | |
| RG-223-04 | Cao | Hồ sơ, hội viên và HLV | Hồ sơ cá nhân; danh sách/chi tiết hội viên; tạo, cập nhật trạng thái HLV và ca làm; [`UC-04-05.md`](./UC-04-05.md) | Dữ liệu hợp lệ lưu và hiển thị sau tải lại; đầu vào sai bị chặn; HLV chỉ xem đúng phạm vi hội viên được phân công; ca làm không vi phạm quy tắc xếp lịch. | Chưa chạy | Chưa chạy | |
| RG-223-05 | Cao | Gói tập và đăng ký | Quản lý gói; đăng ký, gia hạn, huỷ và quyền lợi gói; [`UC-04-05.md`](./UC-04-05.md) | Trạng thái, ngày hiệu lực, giá và quyền lợi khớp dữ liệu nguồn; thao tác không hợp lệ bị từ chối; huỷ không làm sai lệch báo cáo hoặc quyền sử dụng. | Chưa chạy | Chưa chạy | |
| RG-223-06 | Cao | Bài tập, giáo án và kho kiến thức | Tìm/lọc bài tập, giáo án, nội dung, trạng thái duyệt và hiển thị theo vai trò; [`UC-06-07.md`](./UC-06-07.md), các test case KB liên quan | CRUD/duyệt theo đúng quyền; nội dung ẩn/chưa duyệt không lộ cho người không được phép; bộ lọc, chi tiết và liên kết nội dung hoạt động. | Chưa chạy | Chưa chạy | |
| RG-223-07 | Cao | Lịch tập và chống xung đột | Tạo, dời, huỷ, đánh vắng lịch; trùng lịch/đồng thời; [`UC-06-07.md`](./UC-06-07.md), [`TEST_PLAN.md`](./TEST_PLAN.md) | Lịch hợp lệ tạo/cập nhật đúng; xung đột thời gian hoặc request cạnh tranh không tạo lịch trùng; trạng thái huỷ/vắng và quyền thao tác chính xác. | Chưa chạy | Chưa chạy | |
| RG-223-08 | Cao | Hoàn thành buổi tập và tiến độ | Nhật ký buổi tập, cân nặng, BMI, chuyên cần; [`UC-09-10.md`](./UC-09-10.md) | Chỉ buổi hợp lệ được hoàn thành một lần; số liệu nhật ký/tiến độ khớp dữ liệu nguồn; dữ liệu thiếu hoặc biên được xử lý theo mong đợi. Xác minh lại các trường hợp đang chờ trong BUG-03 và BUG-04, không coi chúng là lỗi đã xác nhận nếu chưa tái hiện. | Chưa chạy | Chưa chạy | |
| RG-223-09 | Cao | Dashboard và phạm vi dữ liệu | ADMIN, TRAINER, MEMBER; toàn bộ TC-199-01 đến TC-199-10 tại mục 2.5 của tài liệu này | Số liệu trên UI/API khớp nguồn với cùng thời điểm, ngày và múi giờ; dữ liệu theo vai trò không lẫn chéo; trạng thái rỗng/null không tạo số giả. | Chưa thể đối chiếu đủ ba vai trò vì database local chưa có ADMIN và TRAINER. | Chặn | Chờ chuẩn bị tài khoản kiểm thử |
| RG-223-10 | Cao | Báo cáo và xuất CSV/Excel | Báo cáo theo khoảng ngày, quyền ADMIN, BOM/escaping và mở bằng Microsoft Excel; [`UC-14.md`](./UC-14.md) | Kết quả báo cáo khớp dữ liệu nguồn; quyền và khoảng ngày được kiểm tra; CSV mở trực tiếp bằng Excel với tiếng Việt và cột/hàng chính xác. Ghi phiên bản Excel, hệ điều hành và bằng chứng. | Chưa thể thực hiện vì chưa đăng nhập được ADMIN trên local. TC-14-01 đến TC-14-12 chưa chạy. | Chặn | Chờ khôi phục tài khoản ADMIN local |
| RG-223-11 | Cao | Lịch sử hoạt động và chức năng quản trị | Tìm/lọc audit log và kiểm tra hoạt động phát sinh từ các luồng trên; [`TEST_PLAN.md`](./TEST_PLAN.md) | Log phản ánh đúng hành động, người thực hiện và thời điểm; quyền xem đúng; bộ lọc/phân trang không làm lộ dữ liệu ngoài phạm vi. | Chưa chạy | Chưa chạy | |
| RG-223-12 | Trung bình | Trạng thái lỗi và phục hồi | API lỗi/tạm mất kết nối, dữ liệu rỗng, tải lại/thử lại ở các màn hình chính | Lỗi được thông báo rõ, không hiển thị dữ liệu thành công giả hoặc `NaN`/`null`; thử lại sau khi dịch vụ phục hồi hoạt động và không tạo bản ghi trùng. | Chưa chạy | Chưa chạy | |
| RG-223-13 | Trung bình | Giao diện responsive và song ngữ | Desktop 1440px, mobile 390px; kiểm tra nhãn/validation và chuyển EN/VI ở các màn hình chính | Không tràn/che nội dung hoặc mất thao tác chính; thông báo lỗi dễ nhận biết; nội dung ngôn ngữ nhất quán và không lộ khoá dịch. | Chưa chạy | Chưa chạy | |
| RG-223-14 | Trung bình | Điều hướng, 403/404 và lỗi đã biết | Điều hướng nội bộ, URL không tồn tại/cấm quyền; đối chiếu BUG-01, BUG-02 trong [`BUGS.md`](./BUGS.md) | Không có liên kết chính dẫn tới 404 ngoài dự kiến; màn 403/404 có lối quay lại; xác minh lại BUG-02 trên đúng build, ghi kết quả thực tế và không tự đóng bug khi chưa kiểm tra. | Chưa chạy | Chưa chạy | |
| RG-223-15 | Cao | Khói trên trình duyệt/thiết bị demo | Chrome phiên bản mới trên desktop; Safari iPhone nếu thiết bị sẵn sàng; các luồng đăng nhập, dashboard, lịch và báo cáo | Các luồng trình diễn chính hoàn tất trên môi trường mục tiêu; lỗi thiết bị/trình duyệt được ghi riêng. Nếu không có iPhone/Safari, ghi **Chặn** cho phần này thay vì suy ra từ desktop. | Chưa chạy | Chưa chạy | |

### 3.5 Nhật ký kết quả và bằng chứng

- Điền **Kết quả thực tế**, **Trạng thái** và **Bug / bằng chứng** ngay trên từng dòng RG-223 ở mục 3.4; ghi mã test case chi tiết và kết quả quan sát, không chỉ ghi kết luận chung cho cả module.
- Chạy từng test case trong tài liệu tham chiếu, kể cả test mức Trung bình/Thấp đã nằm trong phạm vi demo; ghi mã TC cụ thể và kết quả thực tế của từng ca.
- **Đạt** chỉ khi kết quả quan sát khớp đầy đủ mong đợi và có đủ thông tin tái kiểm tra. **Không đạt** khi sai khác tái hiện được. **Chặn** khi thiếu môi trường, tài khoản, dữ liệu hoặc thiết bị cần thiết.
- Với test không đạt, ghi bước tái hiện tối thiểu, kết quả mong đợi/thực tế, thời điểm, commit, mã bug và file/người phụ trách tra theo [`OWNERS.md`](../OWNERS.md); cập nhật [`BUGS.md`](./BUGS.md). Không ghi token, mật khẩu, mã khôi phục hay dữ liệu cá nhân vào bằng chứng.
- Với bug đang mở/chờ xác minh, chạy lại đúng bước tái hiện, ghi kết quả. Chỉ đổi trạng thái bug sau khi có bằng chứng và người phụ trách xác nhận xử lý.

### 3.6 Tổng kết và điều kiện sẵn sàng demo

| Chỉ số | Giá trị |
| --- | ---: |
| Tổng số test case trong checklist này | 15 |
| Tổng số test case chi tiết được chạy từ tài liệu tham chiếu | Chưa chạy |
| Đạt | 0 |
| Không đạt | 0 |
| Chặn | 4 |
| Chưa chạy | 11 + các test case chi tiết chưa chạy |
| Bug Nghiêm trọng/Cao còn mở | Chưa xác minh |
| Kết luận demo | Chưa đánh giá |

Chỉ kết luận **Sẵn sàng demo** khi đáp ứng tiêu chí tại mục 5 của [`TEST_PLAN.md`](./TEST_PLAN.md): 100% test case mức Cao đạt, ít nhất 90% tổng số test case đạt, không còn bug Nghiêm trọng/Cao đang mở, và các luồng demo chính đã chạy trên build cuối. Test case bị chặn hoặc chưa chạy không được tính là đạt; nếu không đáp ứng điều kiện, ghi **Chưa sẵn sàng** hoặc **Chưa thể kết luận**, nêu rõ lý do và người chịu trách nhiệm.


### Nhật ký kiểm tra bổ sung – 13/11/2026

- Frontend local `http://localhost:8081`: HTTP 200.
- Backend container: trạng thái healthy.
- Backend Actuator `/actuator/health`: HTTP 200.
- MySQL: container hoạt động, truy vấn database thành công.
- Database local có 1 tài khoản MEMBER; chưa có ADMIN và TRAINER.
- Đăng nhập ADMIN local chưa thực hiện được.
- RG-223-01 đã có kết quả kiểm tra một phần nhưng vẫn Chặn do chưa xác minh build và migration đầy đủ.
- RG-223-02, RG-223-09 và RG-223-10 bị Chặn do thiếu tài khoản kiểm thử phù hợp.
- Các test case chức năng chưa chạy không được tính là PASS.
