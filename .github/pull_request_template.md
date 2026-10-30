## Task Jira
SCRUM-

## Thay đổi gì
<!-- 1–3 dòng: làm gì, vì sao. Ví dụ: Thêm API khoá tài khoản, chặn khoá Admin cuối cùng (USR-03, BR-14). -->

## Loại thay đổi
- [ ] Tính năng mới
- [ ] Sửa lỗi (ghi mã bug trong docs/test/BUGS.md: BUG-   )
- [ ] Giao diện
- [ ] Tài liệu, cấu hình, CI

## Cách kiểm tra
<!-- Các bước để người review tự thử. Ví dụ:
1. Đăng nhập tài khoản quản lý demo
2. Vào Tài khoản, khoá 1 hội viên
3. Hội viên đó đăng nhập lại thì bị chặn -->
1.

## Ảnh chụp (bắt buộc nếu có sửa giao diện)

## Tự kiểm trước khi xin review
- [ ] PR vào nhánh **develop** (không phải main)
- [ ] Tên nhánh và tiêu đề PR có mã task, ví dụ `SCRUM-136: API hội viên`
- [ ] Chỉ sửa file của mình theo `docs/OWNERS.md` (sửa file người khác thì đã hỏi chủ file)
- [ ] Đã `git pull origin develop` và `git rebase develop` ngay trước khi mở PR
- [ ] Chạy được trên máy: `docker compose up -d --build`, đã thử đúng các bước ở trên
- [ ] CI xanh (backend build + test, frontend build)
- [ ] Không có file `.env`, mật khẩu, token trong PR
- [ ] Đổi DTO (`Dtos.java`) thì đã sửa `frontend/src/api/types.ts` và báo nhóm
- [ ] Đổi CSDL thì tạo file migration mới `V<số>__mo_ta.sql`, không sửa file migration cũ (báo Kiên)

## Người review
<!-- Tag ít nhất 1 người: backend → Dũng/Kiên, frontend → Tùng/Phương -->
