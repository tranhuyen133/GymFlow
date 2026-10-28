# Phần frontend của Phương — Sprint 1

> **Bản đối chiếu, chưa ghép vào develop.** Theo lựa chọn của Phương ngày 28/10/2026, nhánh `feat/SCRUM-143-ui-kit-public` lưu phần triển khai trên bản khung `2e5e273`. Khi fetch, `origin/develop` đã ở `9ec88df` với cấu trúc và API mới. Các nhận xét scaffold/API còn thiếu bên dưới chỉ áp dụng cho bản khung của nhánh này. Không merge nguyên trạng vào develop; cần chuyển các thay đổi cần giữ sang file mới theo `docs/OWNERS.md` trên develop.

## Danh sách file đã thực hiện

Đường dẫn dưới đây tính từ `frontend/src/`.

| File | Task | Ghi chú |
| --- | --- | --- |
| `styles/tokens.css` | SCRUM-143 | Token màu, font, khoảng cách; kiểu UI kit, trạng thái và theme token. |
| `components/ui/Button.tsx` | SCRUM-143 | Variant, loading, disabled, ref; giữ prop cũ. |
| `components/ui/Input.tsx` | SCRUM-143 | Label, helper, lỗi, ref, liên kết aria. |
| `components/ui/Card.tsx` | SCRUM-143 | Card dùng token, tiêu đề và nội dung. |
| `components/ui/Table.tsx` | SCRUM-143 | Bảng có vùng cuộn ngang. |
| `components/ui/Modal.tsx` | SCRUM-143 | Native dialog, Escape, khoá cuộn, trả focus. |
| `components/ui/FormError.tsx` | SCRUM-147 (phần phụ thuộc) | Lỗi theo token và role alert; chưa hoàn tất toàn bộ task Toast. |
| `components/ui/preview.html`, `components/ui/preview.tsx` | SCRUM-143 | Trang dev để duyệt UI kit và iframe màn hẹp. |
| `pages/public/Landing.tsx` | SCRUM-144 | Trang chủ, các trạng thái bảng giá nhận qua props. |
| `pages/public/Login.tsx` | SCRUM-145 | Form đăng nhập, validation, loading; callback tích hợp. |
| `pages/public/Register.tsx` | SCRUM-145 | Đăng ký, kiểm tra dữ liệu, thước mật khẩu và chính sách. |
| `pages/public/ForgotPassword.tsx` | SCRUM-146 | Form yêu cầu khôi phục, phản hồi không tiết lộ tài khoản. |
| `pages/public/ResetPassword.tsx` | SCRUM-146 | Mã đặt lại, mật khẩu mới, xác nhận và validation. |
| `pages/public/AuthUI.tsx` | SCRUM-145, 146 | Bố cục auth, password field/meter, quản lý form dùng chung. |
| `pages/public/public.css` | SCRUM-144, 145, 146 | Bố cục public và responsive theo token. |
| `pages/public/contracts.ts` | SCRUM-144, 145, 146 | Kiểu đầu vào UI/callback; không phải DTO backend đã chốt. |
| `pages/public/assets.d.ts`, `pages/public/assets/brand-mark.svg` | SCRUM-144, 145 | Asset logo Figma cục bộ và khai báo kiểu. |
| `pages/public/INTEGRATION.md` | SCRUM-143–146 | Phạm vi triển khai, giới hạn, kiểm tra và ghi chú bàn giao. |

Trên develop mới, các điểm đối chiếu tương ứng là `styles.css`, `components/ui.tsx`, `pages/Landing.tsx`, `pages/Login.tsx`, `pages/Register.tsx`, `pages/ForgotPassword.tsx`. Giữ API, routing, i18n và chức năng sẵn có khi tích hợp; không khôi phục các file cũ đã bị nhóm xoá chỉ để giải quyết conflict.

## Đã triển khai

- SCRUM-143: design token từ Figma; Button, Input, Card, Table, Modal. Giữ tên prop cũ; thêm `loading`, `helper`, `ghost` theo hướng tương thích. Input hỗ trợ ref, label, mô tả lỗi; Modal dùng native dialog, Escape, nền inert, khoá cuộn và trả focus.
- SCRUM-145: UI Login/Register, validation, focus trường lỗi đầu tiên, hiện/ẩn mật khẩu, thước đo mật khẩu đăng ký, đồng ý chính sách, loading và ngăn gửi lặp.
- SCRUM-146: UI ForgotPassword/ResetPassword, thông báo chung không tiết lộ email tồn tại, mã 8 ký tự, nhập lại mật khẩu, trạng thái thành công chỉ sau khi callback resolve.
- SCRUM-144: trang chủ responsive và vùng bảng giá có các trạng thái loading/error/empty/data. Chưa có dữ liệu mock tích hợp.
- FormError của SCRUM-147 được hoàn thiện để Input và các form dùng được. Chưa tính toàn bộ SCRUM-147 đã hoàn tất.

## Điểm tích hợp còn chờ chủ file

`api/auth.ts`, `api/plans.ts`, API types, mock và AuthContext hiện vẫn là scaffold. Không sửa các file này và không nhúng HTTP/mock trong page.

Các page nhận callback qua props. Route/container của Tùng cần nối chúng với API; các interface ở `contracts.ts` là đầu vào của UI, **không khẳng định DTO backend đã chốt**. Nếu DTO khác, map tại container/API.

| Page | Props cần cung cấp |
| --- | --- |
| Login | `onSubmit({username, password}): Promise<void>`; container gọi API, cập nhật AuthContext và điều hướng theo role sau thành công. Reject nếu đăng nhập thất bại. |
| Register | `onSubmit({fullName,email,phone?,password,acceptedPolicy}): Promise<void>`; role hội viên phải do server quyết định. |
| ForgotPassword | `onSubmit({email}): Promise<void>`; backend trả kết quả đồng nhất cho email có/không tồn tại. |
| ResetPassword | `onSubmit({token,password}): Promise<void>`; backend kiểm tra hết hạn, dùng một lần, hash mật khẩu và vô hiệu phiên cũ. |
| Landing | `plans?: PublicPlan[]`, `loading?: boolean`, `error?: string`, `onRetry?: () => void`; container lấy dữ liệu qua api/plans.ts, mock thuộc Tùng. |

Không truyền callback thì submit hợp lệ hiển thị chức năng đang hoàn thiện, không báo thành công. Lỗi API có thể reject object `{fieldErrors: Record<string,string>}`; UI chỉ hiển thị lỗi của trường được biết, lỗi tổng dùng nội dung chung.

Ứng dụng hiện chưa bọc AuthProvider. Không coi các task auth hoàn tất end-to-end trước khi tích hợp. Chưa sửa trạng thái Jira.

`frontend/index.html` cần chủ phần khởi động bổ sung `<meta name="viewport" content="width=device-width, initial-scale=1.0">` để kích thước CSS khớp điện thoại thật. Preview có viewport riêng; kiểm tra iframe hẹp không thay thế việc kiểm tra thiết bị thật.

## Thiết kế và duyệt

Nguồn: Figma Gym, màn 36:3767, 36:13816, 36:4056, 36:4356, 36:12600; màu và spacing từ Design System. SVG logo tải về `assets/brand-mark.svg`, không dùng URL tạm lúc runtime. Font Inter có fallback system vì repo chưa có font asset.

Điều chỉnh có chủ ý: đăng nhập hỗ trợ tên đăng nhập theo LoginRequest; khôi phục nhập mã thay cho liên kết email mẫu; chưa đưa nút đăng nhập demo, đổi ngôn ngữ/theme vào UI khi chưa có logic tương ứng; hero dùng lời giới thiệu thay số liệu hội viên giả.

Chạy `npm ci`, `npm run dev` trong `frontend`. Duyệt `/`, `/login`, `/register`, `/forgot-password`, `/reset-password` và `/src/components/ui/preview.html` (UI kit riêng trên Vite dev). `npm run build` kiểm tra TypeScript và build production.

Kiểm thử nên bao gồm: submit rỗng focus trường đầu; mật khẩu không khớp; email sai; chính sách chưa chọn; submit hợp lệ không callback không báo thành công; callback reject/resolve và gửi lặp; modal bằng Tab/Escape; kiểm tra màn rộng/hẹp.

Kết quả kiểm tra ngày 28/10/2026: `npm run build` (TypeScript + Vite) thành công; `git diff --check` sạch. Đã kiểm tra trên trình duyệt: login rỗng focus username, login hợp lệ nhưng chưa nối API hiển thị unavailable; đăng ký rỗng và mật khẩu không khớp focus đúng trường; forgot-password từ chối email sai; reset rỗng focus mã; modal Escape đóng và trả focus nút mở; duyệt đăng ký trong iframe 320px và trang chủ desktop. Chưa kiểm thử callback với backend thật, gửi email, đăng nhập theo role hoặc thiết bị mobile thật.
