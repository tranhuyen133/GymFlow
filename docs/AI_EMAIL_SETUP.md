# Cấu hình AI Chatbot và Email OTP

Tính năng nằm trong backend/frontend hiện có của GymFlow. Không tạo project hoặc lưu API key, mật khẩu SMTP hay OTP dạng rõ trong repository.

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

### AI Chatbot

| Biến | Ý nghĩa |
| --- | --- |
| `AI_BASE_URL` | URL gốc API tương thích OpenAI Chat Completions, mặc định `https://api.openai.com/v1` |
| `AI_MODEL` | Model có quyền truy cập ở provider đã chọn |
| `AI_API_KEY` | API key riêng tư; để trống thì API chat trả lỗi dịch vụ chưa cấu hình |
| `AI_TIMEOUT_SECONDS` | Timeout kết nối/đọc phản hồi, giới hạn tối đa 60 giây |

Chatbot yêu cầu đăng nhập. Lịch sử chỉ trả về hội thoại thuộc tài khoản hiện tại. Bot hướng tới hướng dẫn GymFlow và thông tin tập luyện phổ thông; không có quyền truy vấn dữ liệu gói, quyền lợi hay lịch thực tế.

## 2. Chạy ứng dụng

1. Cài Docker, Node.js và Java 21.
2. Tạo `.env` và cấu hình database/JWT như hướng dẫn hiện có; thêm SMTP/AI nếu cần kiểm thử các tích hợp đó.
3. Từ thư mục gốc, chạy `docker compose up -d --build`.
4. Mở giao diện tại `http://localhost:8081`; backend tại `http://localhost:8080`. Flyway tự chạy migration `V13`.
5. Đăng ký bằng email có thể nhận thư, nhập OTP trong trang xác thực email, sau đó đăng nhập. Chatbot xuất hiện khi đã đăng nhập.

Nếu chỉ kiểm thử chức năng không cần gửi mail/AI, dùng test tự động; cấu hình thiếu SMTP/AI không trả OTP hoặc câu trả lời giả thành công.

## 3. API mới và cập nhật

Các API xác thực là public, trừ khi ghi khác:

| Method | Đường dẫn | Mục đích |
| --- | --- | --- |
| `POST` | `/api/auth/verify-email` | Xác thực email bằng email và OTP |
| `POST` | `/api/auth/resend-verification` | Gửi lại OTP xác thực |
| `POST` | `/api/auth/forgot-password` | Gửi OTP khôi phục; phản hồi chung để tránh dò email |
| `POST` | `/api/auth/reset-password` | Đặt mật khẩu mới bằng email, OTP và mật khẩu mới |

Các API chatbot cần Bearer JWT:

| Method | Đường dẫn | Mục đích |
| --- | --- | --- |
| `GET` | `/api/chat/conversations` | Danh sách hội thoại của tài khoản hiện tại |
| `POST` | `/api/chat/conversations` | Tạo hội thoại |
| `GET` | `/api/chat/conversations/{id}` | Lấy lịch sử hội thoại của chủ sở hữu |
| `POST` | `/api/chat/messages` | Gửi câu hỏi và nhận phản hồi |

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
4. **Chat:** hỏi nội dung liên quan GymFlow và tập luyện; thử câu hỏi rỗng/dài hơn 2.000 ký tự, gửi liên tiếp quá giới hạn, tắt hoặc đặt sai thông tin AI provider để xác nhận lỗi hiển thị rõ.
5. **Phân quyền:** đăng nhập bằng hai tài khoản; lấy ID hội thoại tài khoản A rồi gọi `GET /api/chat/conversations/{id}` và `POST /api/chat/messages` bằng token tài khoản B. Không được đọc/ghi hội thoại đó.
6. **Giao diện:** chạy các bước đăng ký, nhập OTP, quên mật khẩu và chat ở desktop 1440px và mobile 390px.

Việc gửi mail thật và gọi AI thật phụ thuộc cấu hình secret/provider bên ngoài; test tự động không chứng minh các dịch vụ bên ngoài đã được cấu hình.
