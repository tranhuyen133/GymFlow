# Cấu hình Email OTP và Trợ lý GymFlow

Tính năng nằm trong backend/frontend hiện có của GymFlow. Không tạo project hoặc lưu mật khẩu SMTP/OTP dạng rõ trong repository.

## 1. Cấu hình môi trường

Sao chép `.env.example` thành `.env` ở thư mục gốc. Dùng secret từ nhà cung cấp của bạn; không commit `.env`.

### Email SMTP

Điền các biến sau:

| Biến | Ý nghĩa |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT` | Máy chủ và cổng SMTP của nhà cung cấp |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | Tài khoản SMTP và mật khẩu/app password |
| `SMTP_AUTH`, `SMTP_STARTTLS_ENABLE` | Bật xác thực và STARTTLS theo yêu cầu nhà cung cấp |
| `MAIL_FROM` | Địa chỉ gửi đã được nhà cung cấp cho phép |
| `APP_BASE_URL` | URL giao diện để tạo liên kết xác thực |

Đăng ký tạo tài khoản chưa xác thực và gửi mã 6 số qua email. Mã xác thực có thời hạn; chỉ được dùng một lần, được lưu dạng hash và có giới hạn thử/gửi lại. Đăng nhập chỉ được cấp cho tài khoản đã xác thực. Khôi phục mật khẩu gửi OTP tương tự và chỉ áp dụng cho email đã xác thực.

### Trợ lý GymFlow

Trợ lý **không dùng API key** và không gọi dịch vụ AI bên ngoài. Người dùng chọn một câu trả lời sẵn; backend trả lời từ dữ liệu thật của hệ thống theo vai trò:

| Chủ đề | Vai trò | Nội dung |
| --- | --- | --- |
| `SCHEDULE_TODAY` | Tất cả | Lịch tập hôm nay (hội viên xem của mình; HLV/Admin xem buổi trong ngày) |
| `WHO_TODAY` | HLV, Admin | Danh sách hội viên có buổi tập hôm nay |
| `NEXT_SESSION` | Tất cả | Buổi tập sắp tới gần nhất |
| `MY_PACKAGE` | Hội viên | Gói tập hiện tại và số ngày còn lại |
| `TODAY_EXERCISES` | Hội viên | Bài tập trong giáo án của ngày |
| `HELP` | Tất cả | Hướng dẫn dùng app, liên hệ hỗ trợ, lưu ý an toàn |

Không cần cấu hình biến môi trường AI. Lịch sử hội thoại vẫn được lưu theo tài khoản; mỗi tài khoản chỉ đọc/ghi được hội thoại của chính mình.

## 2. Chạy ứng dụng

1. Cài Docker, Node.js và Java 21.
2. Tạo `.env` và cấu hình database/JWT như hướng dẫn hiện có; thêm SMTP nếu cần kiểm thử email.
3. Từ thư mục gốc, chạy `docker compose up -d --build`.
4. Mở giao diện tại `http://localhost:8081`; backend tại `http://localhost:8080`. Flyway tự chạy migration mới nhất.
5. Đăng ký bằng email có thể nhận thư, nhập OTP trong trang xác thực email, sau đó đăng nhập. Trợ lý xuất hiện khi đã đăng nhập.

## 3. API mới và cập nhật

Các API xác thực là public, trừ khi ghi khác:

| Method | Đường dẫn | Mục đích |
| --- | --- | --- |
| `POST` | `/api/auth/verify-email` | Xác thực email bằng email và OTP |
| `POST` | `/api/auth/resend-verification` | Gửi lại OTP xác thực |
| `POST` | `/api/auth/forgot-password` | Gửi OTP khôi phục; phản hồi chung để tránh dò email |
| `POST` | `/api/auth/reset-password` | Đặt mật khẩu mới bằng email, OTP và mật khẩu mới |

Các API trợ lý cần Bearer JWT:

| Method | Đường dẫn | Mục đích |
| --- | --- | --- |
| `GET` | `/api/chat/suggestions` | Danh sách câu hỏi sẵn theo vai trò |
| `GET` | `/api/chat/conversations` | Danh sách hội thoại của tài khoản hiện tại |
| `POST` | `/api/chat/conversations` | Tạo hội thoại |
| `GET` | `/api/chat/conversations/{id}` | Lấy lịch sử hội thoại của chủ sở hữu |
| `POST` | `/api/chat/messages` | Gửi `{ conversationId, topic }` và nhận câu trả lời tính từ dữ liệu |

## 4. Kiểm thử

Tại thư mục gốc:

```sh
npm --prefix frontend run typecheck
npm --prefix frontend run build
node --test frontend/src/pages/publicForm.test.mjs
gradle -p backend test
```

Kiểm thử thủ công tích hợp:

1. **Đăng ký/xác minh:** đăng ký email mới; kiểm tra hộp thư; nhập OTP hợp lệ. Thử OTP sai, hết hạn và OTP cũ sau khi đã dùng; thử gửi lại trong thời gian cooldown.
2. **Đăng nhập:** thử đăng nhập trước xác minh (bị từ chối), sau xác minh (thành công).
3. **Quên mật khẩu:** thử email không tồn tại (không tiết lộ trạng thái), email chưa xác minh, OTP sai/hết hạn/đã dùng, đặt mật khẩu đúng; sau đó đăng nhập bằng mật khẩu mới.
4. **Trợ lý:** mở chat, kiểm tra danh sách nút theo vai trò; bấm từng nút và đối chiếu dữ liệu lịch/gói/bài tập. Thử gửi topic không hợp lệ hoặc topic không thuộc quyền (ví dụ hội viên gọi `WHO_TODAY`) để xác nhận bị từ chối.
5. **Phân quyền:** đăng nhập bằng hai tài khoản; lấy ID hội thoại tài khoản A rồi gọi `GET /api/chat/conversations/{id}` và `POST /api/chat/messages` bằng token tài khoản B. Không được đọc/ghi hội thoại đó.
6. **Giao diện:** chạy các bước đăng ký, nhập OTP, quên mật khẩu và chat ở desktop 1440px và mobile 390px.

Trợ lý không cần dịch vụ ngoài; nếu dữ liệu lịch/gói đúng thì câu trả lời đúng theo dữ liệu đó.
