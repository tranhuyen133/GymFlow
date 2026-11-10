# Báo cáo chạy kiểm thử UC-09, UC-10

| | |
| --- | --- |
| Phiên bản | 1.0 · 10/11/2026 |
| Task | SCRUM-198 |
| Tester | Hồ Khánh Linh |
| Test cases | [`UC-09-10.md`](./UC-09-10.md) |
| Trạng thái báo cáo | Chưa chạy kiểm thử; đây là checklist ghi nhận kết quả, không phải kết quả đã xác nhận |

## 1. Môi trường và điều kiện chạy

- [ ] Chạy trên máy cá nhân theo `docs/test/TEST_PLAN.md`; xác nhận frontend, API và Swagger truy cập được.
- [ ] Xác nhận CI xanh và code đã merge vào `develop` trước khi bắt đầu.
- [ ] Dùng tài khoản ADMIN, TRAINER và MEMBER hiện hành; lấy thông tin xác thực qua kênh bảo mật, không ghi mật khẩu vào báo cáo.
- [ ] Chuẩn bị hội viên có cân nặng/chiều cao, lịch tập trong các trạng thái `SCHEDULED`, `COMPLETED`, `CANCELLED`, `MISSED`, và dữ liệu thuộc/không thuộc HLV phụ trách.
- [ ] Ghi lại ngày giờ chạy theo múi giờ `Asia/Ho_Chi_Minh`; các test phụ thuộc ngày hiện tại cần cập nhật ngày dữ liệu trước khi chạy.

## 2. Checklist và kết quả

Điền **Thực tế**, **Kết quả** và **Bug** sau khi chạy. Kết quả chỉ nhận `Đạt`, `Không đạt` hoặc `Chặn`; nếu không đạt, ghi mã bug đã xác nhận trong `docs/test/BUGS.md`.

| Mã | Mức | Hạng mục | Kết quả | Bug / ghi chú |
| --- | --- | --- | --- | --- |
| TC-09-01 | Cao | Hoàn thành buổi hợp lệ và lưu nhật ký | Chưa chạy | |
| TC-09-02 | Cao | Từ chối thời lượng/calo/đánh giá/ghi chú ngoài giới hạn | Chưa chạy | |
| TC-09-03 | Cao | Không hoàn thành lần hai hoặc ghi đè nhật ký | Chưa chạy | |
| TC-09-04 | Trung bình | Từ chối hoàn thành buổi `CANCELLED` hoặc `MISSED` | Chưa chạy | |
| TC-09-05 | Cao | HLV chỉ xem/thao tác trong phạm vi hội viên được phụ trách | Chưa chạy | |
| TC-09-06 | Trung bình | Từ chối hoàn thành buổi đã quá 7 ngày | Chưa chạy | |
| TC-10-01 | Cao | Đối chiếu cân nặng, thay đổi cân nặng, BMI và chuyên cần | Chưa chạy | |
| TC-10-02 | Cao | Tạo bản ghi cân nặng hợp lệ | Chưa chạy | |
| TC-10-03 | Cao | Từ chối ngày tương lai và giá trị cân nặng/% mỡ ngoài giới hạn | Chưa chạy | |
| TC-10-04 | Trung bình | Cập nhật bản ghi cùng ngày, giữ nguyên ID | Chưa chạy | |
| TC-10-05 | Cao | Kiểm tra quyền MEMBER, TRAINER và ADMIN khi xem tiến độ | Chưa chạy | |
| TC-10-06 | Cao | Đối chiếu 8 tuần chuyên cần và chuỗi tuần | Chưa chạy | |
| TC-10-07 | Trung bình | Xoá bản ghi cân nặng và kiểm tra tính lại tiến độ | Chưa chạy | |

## 3. Tổng kết

| Chỉ số | Giá trị |
| --- | --- |
| Tổng số test cases | 13 |
| Đạt | 0 |
| Không đạt | 0 |
| Chặn | 0 |
| Chưa chạy | 13 |
| Bug mới được xác nhận | 0 |

Không đánh dấu test case là đạt hoặc bug là xác nhận cho đến khi thực hiện trên môi trường phù hợp và lưu kết quả thực tế. Các mục BUG-03 và BUG-04 trong [`BUGS.md`](./BUGS.md) hiện là mục chờ xác minh, không phải lỗi đã tái hiện.
