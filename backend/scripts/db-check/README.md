# Script kiểm tra CSDL – chủ thư mục: Kiên

Các file `.sql` ở đây chỉ **đọc** `information_schema`, không ghi dữ liệu. Mỗi task có một file; mỗi dòng in `PASS`/`FAIL`, dòng cuối là tổng.

| File | Task | Kiểm tra |
| --- | --- | --- |
| `scrum-131-hoi-vien-hlv.sql` | SCRUM-131 | trainers, trainer_shifts, members, weight_records: cột, NOT NULL, khoá ngoại, UNIQUE, CHECK, index (SRS 8.4) |

## Chạy

Sau khi backend đã khởi động một lần (Flyway áp dụng xong migration):

```bash
docker exec -i gymflow-mysql sh -c 'mysql -t -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < backend/scripts/db-check/scrum-131-hoi-vien-hlv.sql
```

Đổi `gymflow-mysql` thành tên container MySQL trên máy bạn nếu khác.
