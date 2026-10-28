# Kế hoạch kiểm thử GymFlow (Test Plan)

| | |
| --- | --- |
| Phiên bản | 1.0 · 28/10/2026 |
| Người phụ trách | Hồ Khánh Linh (tester) |
| Task | SCRUM-148 |
| Tài liệu gốc | SRS GymFlow (mục 4 yêu cầu chức năng, mục 5 phi chức năng, mục 7 use case) |

## 1. Mục tiêu
- Xác nhận mọi use case trong SRS chạy đúng luồng chính và luồng lỗi trước buổi demo 13/11/2026.
- Phát hiện lỗi sớm theo từng sprint, ghi vào `docs/test/BUGS.md` để người phụ trách sửa.
- Bảo đảm phân quyền đúng 3 vai trò: **Quản lý (ADMIN)**, **Huấn luyện viên (TRAINER)**, **Hội viên (MEMBER)**.

## 2. Phạm vi

### 2.1 Trong phạm vi
| Nhóm chức năng | Mã yêu cầu | Người làm backend / frontend |
| --- | --- | --- |
| Đăng ký, đăng nhập, quên mật khẩu, đổi mật khẩu | AUTH-01–08 | Dũng, Huyền / Phương |
| Tài khoản, nhật ký hệ thống | USR-01–06 | Dũng / Dũng, Linh |
| Hội viên | MEM-01–07 | Huyền / Tùng |
| Huấn luyện viên, ca làm | TRN-01–05 | Huyền / Linh |
| Gói tập | PLAN-01–05 | Kiên / Tùng, Phương |
| Đăng ký gói, gia hạn, huỷ | SUB-01–07 | Kiên / Tùng, Linh |
| Thư viện bài tập, duyệt bài tập | EX-01–07 | Huyền, Kiên / Phương |
| Giáo án | WP-01–07 | Huyền / Tùng, Phương |
| Xếp lịch, dời, huỷ, đánh vắng | SCH-01–09 | Huyền, Dũng / Tùng |
| Hoàn thành buổi tập | LOG-01–03 | Huyền / Tùng |
| Tiến độ: cân nặng, BMI, chuyên cần | PRG-01–06 | Kiên / Phương |
| Dashboard 3 vai trò | DASH-01–03 | Huyền / Tùng, Phương |
| Kho kiến thức, bài viết | KB-01–07 | Huyền / Phương, Tùng |
| Báo cáo, xuất CSV | RPT-01–04 | Kiên / Tùng |
| Phi chức năng: bảo mật, đồng thời, giao diện | NFR-S, NFR-D02, NFR-U | Cả nhóm |

### 2.2 Ngoài phạm vi
- Kiểm thử tải lớn (trên 50 người dùng cùng lúc) và kiểm thử xâm nhập chuyên sâu.
- Thanh toán trực tuyến (gói được mua tại quầy, quản lý ghi nhận).
- Trình duyệt cũ (Internet Explorer).

## 3. Loại kiểm thử
| Loại | Ai làm | Cách làm | Khi nào |
| --- | --- | --- | --- |
| Unit test backend | Người viết service | JUnit trong `backend/src/test`, chạy bằng `gradle test`, CI tự chạy mỗi PR | Mỗi PR |
| Kiểm thử chức năng (thủ công) | Linh | Chạy theo test case trong `docs/test/UC-*.md` trên giao diện | Cuối mỗi sprint |
| Kiểm thử phân quyền | Linh | Đăng nhập lần lượt 3 vai trò, thử mở trang và gọi API không được phép, phải nhận 403 | Cuối mỗi sprint |
| Kiểm thử đồng thời | Dũng, Kiên | Gửi 2 request cùng lúc (đăng ký gói, xếp lịch), chỉ 1 request thành công (NFR-D02) | Sprint 2, 3 |
| Kiểm thử giao diện | Linh, Phương | Desktop 1440px và mobile 390px; lỗi form có viền đỏ và con trỏ nhảy về ô lỗi | Cuối mỗi sprint |
| Hồi quy | Linh | Chạy lại toàn bộ test case đã đạt (`docs/test/REGRESSION.md`) | 05/11, 10/11, 13/11 |

## 4. Môi trường
| Môi trường | Địa chỉ | Dùng để |
| --- | --- | --- |
| Máy cá nhân (Docker) | Giao diện http://localhost:8081, API http://localhost:8080, Swagger http://localhost:8080/swagger-ui/index.html | Chạy test case hằng ngày |
| VPS | http://160.187.229.73:3000 (nhánh `develop`) | Hồi quy cuối sprint và chạy thử trước demo |

- Trình duyệt: Chrome bản mới nhất (chính), Safari trên iPhone (mobile).
- Dữ liệu: bật `SEED_DEMO_DATA=true`, hệ thống tự tạo tài khoản demo 3 vai trò, HLV, hội viên, gói tập (danh sách trong `backend/src/main/java/com/gymflow/config/DemoAccounts.java`). Dữ liệu bám theo ngày hiện tại nên lịch và gói luôn còn hạn.
- Làm lại từ đầu: `docker compose down -v && docker compose up -d --build` (xoá sạch dữ liệu trên máy cá nhân, **không chạy trên VPS**).

## 5. Tiêu chí

**Bắt đầu kiểm thử một chức năng khi:** code đã merge vào `develop`, CI xanh, chạy được trên máy.

**Một test case Đạt khi:** kết quả thực tế khớp hoàn toàn với cột "Kết quả mong đợi", kể cả nội dung thông báo lỗi.

**Kết thúc kiểm thử (trước demo 13/11) khi:**
- 100% test case mức **Cao** đạt.
- Ít nhất 90% tổng số test case đạt.
- Không còn bug mức **Nghiêm trọng** hoặc **Cao** đang mở.

## 6. Mức độ bug
| Mức | Định nghĩa | Ví dụ | Hạn sửa |
| --- | --- | --- | --- |
| Nghiêm trọng | Sập hệ thống, mất dữ liệu, lộ dữ liệu người khác | HLV xem được hội viên không được phân công | Trong ngày |
| Cao | Chức năng chính không dùng được | Không đăng ký gói được | 1 ngày |
| Trung bình | Chạy được nhưng sai quy tắc hoặc sai số liệu | BMI tính sai, thông báo lỗi sai nội dung | Trong sprint |
| Thấp | Lỗi hiển thị, chính tả | Lệch nút trên mobile | Trước demo |

Ghi bug vào `docs/test/BUGS.md` (hoặc tạo Bug trên Jira), mỗi bug ghi: mã `BUG-xx`, màn hình hoặc API, **file liên quan** (tra `docs/OWNERS.md`), người sửa, các bước tái hiện, mức độ.

## 7. Lịch kiểm thử
| Ngày | Việc | File | Task |
| --- | --- | --- | --- |
| 29/10 | Viết test case UC-01, 02, 03 | `UC-01-03.md` | SCRUM-152 |
| 03/11 | Viết và chạy test case UC-04, 05 | `UC-04-05.md` | SCRUM-174 |
| 05/11 | Hồi quy Sprint 1 | `REGRESSION.md` | SCRUM-175 |
| 09/11 | Test case UC-06, 07 | `UC-06-07.md` | SCRUM-197 |
| 10/11 | Test case UC-09, 10; đối chiếu số liệu dashboard | `UC-09-10.md`, `REGRESSION.md` | SCRUM-198, 199 |
| 11/11 | Test UC-14 + mở file CSV bằng Excel | `UC-14.md` | SCRUM-222 |
| 13/11 | Hồi quy toàn hệ thống trước demo | `REGRESSION.md` | SCRUM-223 |

## 8. Mẫu test case
Mỗi file `UC-*.md` dùng đúng bảng dưới. Mỗi use case viết **ít nhất 1 luồng chính, 2 luồng lỗi và 1 ca phân quyền**.

| Cột | Ghi gì |
| --- | --- |
| Mã | `TC-<UC>-<số>`, ví dụ `TC-01-03` |
| Yêu cầu | Mã trong SRS, ví dụ `AUTH-02` |
| Mức | Cao / Trung bình / Thấp |
| Tiền điều kiện | Trạng thái cần có trước khi test |
| Các bước | Đánh số, mỗi bước một thao tác |
| Dữ liệu | Giá trị nhập cụ thể |
| Kết quả mong đợi | Theo SRS, ghi cụ thể màn hình hiện gì |
| Kết quả thực tế | Điền khi chạy |
| Trạng thái | Đạt / Không đạt / Chặn |
| Bug | `BUG-xx` nếu Không đạt |

### Ví dụ (chức năng đăng nhập, AUTH-02, AUTH-03, AUTH-08)
> Mã UC đặt theo SRS. Linh đối chiếu lại mã UC và nội dung thông báo chính xác trong SRS trước khi chạy.

| Mã | Yêu cầu | Mức | Tiền điều kiện | Các bước | Dữ liệu | Kết quả mong đợi | Thực tế | Trạng thái | Bug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC-xx-01 | AUTH-02 | Cao | Có tài khoản hội viên demo đang mở | 1. Mở trang Đăng nhập 2. Nhập email, mật khẩu 3. Bấm Đăng nhập | Email và mật khẩu hội viên demo | Vào Dashboard hội viên; menu chỉ có mục của hội viên | | | |
| TC-xx-02 | AUTH-02 | Cao | Như trên | 1. Nhập đúng email, sai mật khẩu 2. Bấm Đăng nhập | Mật khẩu `SaiMatKhau1` | Báo lỗi chung "email hoặc mật khẩu không đúng" (không nói rõ sai phần nào); vẫn ở trang Đăng nhập | | | |
| TC-xx-03 | USR-02 | Cao | Quản lý đã khoá tài khoản hội viên ở màn Tài khoản | 1. Hội viên đăng nhập bằng mật khẩu đúng | Hội viên demo | Bị chặn, báo tài khoản đã bị khoá | | | |
| TC-xx-04 | AUTH-08 | Trung bình | Chưa đăng nhập | 1. Nhập sai mật khẩu liên tục nhiều lần | Mật khẩu sai | Từ lần vượt giới hạn: báo thử lại sau, không đăng nhập được kể cả khi nhập đúng cho tới hết thời gian chờ | | | |
| TC-xx-05 | AUTH-07 | Cao | Đăng nhập bằng hội viên | 1. Gõ thẳng địa chỉ trang Tài khoản của quản lý trên thanh địa chỉ | Đường dẫn trang Tài khoản (xem trong `frontend/src/App.tsx`) | Hiện trang 403, không thấy dữ liệu | | | |
| TC-xx-06 | AUTH-03 | Trung bình | Đang đăng nhập | 1. Bấm Đăng xuất 2. Bấm nút Back của trình duyệt | | Quay về trang Đăng nhập, không xem lại được trang cũ | | | |
