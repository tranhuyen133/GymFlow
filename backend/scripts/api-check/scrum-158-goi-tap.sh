#!/usr/bin/env bash
# Kiểm tra API SCRUM-158 (PLAN-01–05) trên backend chạy dưới máy: bash backend/scripts/api-check/scrum-158-goi-tap.sh
# Chỉ chạy với bản local (mặc định http://localhost:8080), KHÔNG chạy vào VPS dùng chung.
# Mật khẩu nhập từ bàn phím, không lưu vào file. Gói test tạo ra sẽ được xoá ở cuối.
set -u
BASE="${BASE:-http://localhost:8080}"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); printf '  \033[32mĐẠT\033[0m  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  \033[31mLỖI\033[0m  %s (nhận %s)\n' "$1" "$2"; }
expect() { [ "$2" = "$3" ] && ok "$1" || bad "$1 – mong đợi $3" "$2"; }
code() { curl -s -o /tmp/gf_body -w '%{http_code}' "$@"; }

# Chặn chạy nhầm vào một bản khác trên cùng máy: cổng 8080 phải do image backend của repo này giữ.
# Image mặc định là "<tên thư mục repo>-backend"; đặt BACKEND_IMAGE nếu khác, SKIP_IMAGE_CHECK=1 để bỏ qua.
IMG="${BACKEND_IMAGE:-$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")-backend}"
if [ -z "${SKIP_IMAGE_CHECK:-}" ] && ! docker ps --format '{{.Image}} {{.Ports}}' | grep -E "^$IMG " | grep -q ':8080->'; then
  echo "Cổng 8080 không phải backend của repo này (image $IMG). Đang chạy:"
  docker ps --format '  {{.Names}}  {{.Image}}  {{.Ports}}'
  echo "Tắt bản đang chiếm cổng rồi chạy docker compose up -d trong repo này."
  exit 2
fi

login() {
  local body
  body=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}")
  printf '%s' "$body" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

read -r -p "Email ADMIN: " ADMIN_EMAIL
read -r -s -p "Mật khẩu ADMIN: " ADMIN_PW; echo
read -r -p "Email MEMBER (Enter để bỏ qua kiểm tra 403): " MEM_EMAIL
if [ -n "$MEM_EMAIL" ]; then read -r -s -p "Mật khẩu MEMBER: " MEM_PW; echo; fi

ADMIN=$(login "$ADMIN_EMAIL" "$ADMIN_PW")
[ -z "$ADMIN" ] && { echo "Đăng nhập ADMIN thất bại, dừng."; exit 1; }
AUTH=(-H "Authorization: Bearer $ADMIN" -H 'Content-Type: application/json')
NAME="Gói kiểm thử 158 $(date +%s)"

echo "== PLAN-05: bảng giá công khai =="
expect "GET /plans/public không cần đăng nhập" "$(code "$BASE/api/plans/public")" 200
expect "GET /plans khi chưa đăng nhập" "$(code "$BASE/api/plans")" 401

echo "== PLAN-01: tạo gói =="
c=$(code -X POST "$BASE/api/plans" "${AUTH[@]}" -d "{\"name\":\"$NAME\",\"price\":350000,\"durationDays\":30,\"benefits\":\"test\"}")
expect "POST /plans hợp lệ" "$c" 201
ID=$(sed -n 's/^{"id":\([0-9]*\).*/\1/p' /tmp/gf_body)
grep -q '"active":true' /tmp/gf_body && ok "gói mới ở trạng thái đang bán" || bad "gói mới ở trạng thái đang bán" "$(cat /tmp/gf_body)"
expect "POST trùng tên (khác hoa thường)" "$(code -X POST "$BASE/api/plans" "${AUTH[@]}" -d "{\"name\":\"$(printf '%s' "$NAME" | tr '[:lower:]' '[:upper:]')\",\"price\":1,\"durationDays\":1}")" 409
expect "POST giá âm" "$(code -X POST "$BASE/api/plans" "${AUTH[@]}" -d '{"name":"x158neg","price":-1,"durationDays":30}')" 400
expect "POST thời hạn 1096 ngày" "$(code -X POST "$BASE/api/plans" "${AUTH[@]}" -d '{"name":"x158long","price":1,"durationDays":1096}')" 400

echo "== PLAN-02: sửa gói =="
c=$(code -X PUT "$BASE/api/plans/$ID" "${AUTH[@]}" -d "{\"name\":\"$NAME\",\"price\":400000,\"durationDays\":60,\"benefits\":\"test\"}")
PUT_BODY=$(cat /tmp/gf_body)
expect "PUT /plans/$ID" "$c" 200
printf '%s' "$PUT_BODY" | grep -q '"price":400000' && ok "giá đã cập nhật" || bad "giá đã cập nhật (HTTP $c)" "$PUT_BODY"
expect "PUT gói không tồn tại" "$(code -X PUT "$BASE/api/plans/999999" "${AUTH[@]}" -d '{"name":"x","price":1,"durationDays":1}')" 404

echo "== PLAN-03: ngừng bán / bán lại =="
expect "PUT /plans/$ID/active false" "$(code -X PUT "$BASE/api/plans/$ID/active" "${AUTH[@]}" -d '{"active":false}')" 200
curl -s "$BASE/api/plans/public" | grep -q "$NAME" && bad "gói ngừng bán ẩn khỏi /public" "vẫn hiện" || ok "gói ngừng bán ẩn khỏi /public"
curl -s "$BASE/api/plans?includeInactive=true" -H "Authorization: Bearer $ADMIN" | grep -q "$NAME" \
  && ok "ADMIN vẫn thấy gói ngừng bán khi includeInactive=true" || bad "ADMIN thấy gói ngừng bán" "không thấy"
expect "PUT /plans/$ID/active true" "$(code -X PUT "$BASE/api/plans/$ID/active" "${AUTH[@]}" -d '{"active":true}')" 200

echo "== Phân quyền =="
if [ -n "$MEM_EMAIL" ]; then
  MEM=$(login "$MEM_EMAIL" "$MEM_PW")
  if [ -n "$MEM" ]; then
    expect "MEMBER gọi POST /plans" "$(code -X POST "$BASE/api/plans" -H "Authorization: Bearer $MEM" -H 'Content-Type: application/json' -d '{"name":"x158mem","price":1,"durationDays":1}')" 403
    curl -s "$BASE/api/plans?includeInactive=true" -H "Authorization: Bearer $MEM" | grep -q '"active":false' \
      && bad "MEMBER không thấy gói ngừng bán" "thấy" || ok "MEMBER không thấy gói ngừng bán dù includeInactive=true"
  else bad "Đăng nhập MEMBER" "thất bại"; fi
else echo "  (bỏ qua)"; fi

echo "== PLAN-04: xoá =="
SOLD=$(curl -s "$BASE/api/plans?includeInactive=true" -H "Authorization: Bearer $ADMIN" \
  | tr '}' '\n' | grep -v '"currentSubscriptions":0' | sed -n 's/.*"id":\([0-9]*\).*/\1/p' | sed -n 1p)
if [ -n "$SOLD" ]; then
  expect "DELETE gói đã có người đăng ký (id $SOLD)" "$(code -X DELETE "$BASE/api/plans/$SOLD" -H "Authorization: Bearer $ADMIN")" 409
else echo "  (không có gói nào đang có đăng ký, bỏ qua kiểm tra 409)"; fi
expect "DELETE gói test chưa bán (dọn dữ liệu)" "$(code -X DELETE "$BASE/api/plans/$ID" -H "Authorization: Bearer $ADMIN")" 204

echo "== Lỗi đã biết (không thuộc file của Kiên) =="
c=$(code "$BASE/api/subscriptions/preview" -H "Authorization: Bearer $ADMIN")
[ "$c" = 400 ] && ok "preview thiếu tham số trả 400" || echo "  GHI NHẬN  preview thiếu tham số trả $c (cần GlobalExceptionHandler bắt MissingServletRequestParameterException)"

echo; echo "Kết quả: $PASS đạt, $FAIL lỗi · $(date '+%d/%m/%Y %H:%M') · commit @ $(git rev-parse --short HEAD 2>/dev/null)"
[ "$FAIL" = 0 ]
