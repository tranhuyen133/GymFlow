# GymFlow – Hệ thống quản lý phòng gym và theo dõi quá trình tập luyện

Đồ án môn Phát triển Dự án Phần mềm – Nhóm 03 (HN-KS24-CNTT3)

- **Bản chạy thật:** http://160.187.229.73:3000 (nhánh `develop`)
- **Jira:** project SCRUM · **Chủ file:** xem [docs/OWNERS.md](docs/OWNERS.md) · **CSDL:** [docs/ERD.md](docs/ERD.md) · **Giao diện:** [DESIGN.md](DESIGN.md)

## Công nghệ
| Phần | Công nghệ |
| --- | --- |
| Backend | Java, Spring Boot, Spring Security + JWT, Spring Data JPA, Flyway |
| CSDL | MySQL 8.4 |
| Frontend | React + TypeScript + Vite, chạy sau nginx |
| Triển khai | Docker Compose, VPS Ubuntu, GitHub Actions (CI) |

## Chạy trên máy (Docker, cách nhanh nhất)
Cần Docker Desktop.
```bash
cp .env.example .env        # sửa JWT_SECRET (>= 32 ký tự) và mật khẩu MySQL
docker compose up -d --build
docker compose ps           # đợi backend hiện healthy
```
| Dịch vụ | Địa chỉ |
| --- | --- |
| Giao diện | http://localhost:8081 |
| API backend | http://localhost:8080 |
| MySQL | localhost:3307 |

Tài khoản demo nằm trong `backend/src/main/java/com/gymflow/config/DemoAccounts.java` (bật bằng `SEED_DEMO_DATA=true`).

## Chạy chế độ dev (sửa code, tự tải lại)
```bash
docker compose up -d mysql
cd backend && gradle bootRun                  # cổng 8080
cd frontend && npm install && npm run dev     # cổng 5173
```

## Cập nhật bản trên VPS
Sau khi code mới đã merge vào `develop`:
```bash
ssh root@160.187.229.73
cd /opt/gymflow
git -c safe.directory=/opt/gymflow pull origin develop
docker compose -p gymflow -f compose.yaml -f compose.prod.yaml up -d --build
```
VPS chỉ có khoảng 2 GB RAM. Nếu build bị `Killed`, chạy `docker compose -p gymflow -f compose.yaml -f compose.prod.yaml down` trước rồi `up -d --build`. **Không dùng `down -v`** vì sẽ xoá dữ liệu.

Trước buổi bảo vệ, tắt các cờ demo trong `.env` của VPS (SCRUM-202): `DEMO_QUICK_LOGIN=false`, `RESET_EXPOSE_TOKEN=false`.

## Quy tắc làm việc
1. Mỗi task một nhánh tách từ `develop`: `feat/SCRUM-xxx-mo-ta-ngan`.
2. Commit và tiêu đề PR bắt đầu bằng mã task, ví dụ `SCRUM-136 thêm API hội viên`, để Jira tự gắn vào thẻ.
3. PR vào `develop`, CI xanh mới merge. `main` chỉ nhận PR từ `develop`.
4. Chỉ sửa file của mình theo [docs/OWNERS.md](docs/OWNERS.md). Không đưa `.env` lên git.

## Thành viên
| Người | Phụ trách |
| --- | --- |
| Đặng Tô Ngọc Dũng | Nhóm trưởng, bảo mật, tài khoản, nhật ký, DevOps |
| Trần Thị Khánh Huyền | Backend nghiệp vụ: hội viên, HLV, bài tập, giáo án, lịch, dashboard, bài viết |
| Nguyễn Thế Kiên | CSDL, gói tập, đăng ký gói, tiến độ, báo cáo |
| Lê Thanh Tùng | Khung frontend, màn nội bộ |
| Bùi Văn Phương | UI kit, màn công khai, màn hội viên |
| Hồ Khánh Linh | Kiểm thử, màn chung, nội dung mẫu |
