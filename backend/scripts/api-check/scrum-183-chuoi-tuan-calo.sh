#!/usr/bin/env bash
# Kiểm tra API SCRUM-183: chuỗi tuần tập, tổng phút, tổng calo, đánh giá trung bình (PRG-06).
#   bash backend/scripts/api-check/scrum-183-chuoi-tuan-calo.sh
# Cách đếm chuỗi qua nhiều tuần có unit test (ProgressServiceTest.streakWeeks); script này kiểm tra API nối đúng.
# Chỉ chạy với bản local (mặc định http://localhost:8080), KHÔNG chạy vào VPS dùng chung.
# Mật khẩu nhập từ bàn phím, không lưu vào file. Không ghi gì vào hội viên mẫu.
# Tạo 1 hội viên + 1 gói + 1 buổi tập kiểm thử; cuối script hội viên chuyển INACTIVE, gói ngừng bán.
# Phải đợi khoảng 2 phút tới giờ bắt đầu buổi tập.
# Phần dùng chung, chép vào đầu mỗi script kiểm tra API (không chạy riêng file này).
set -u
BASE="${BASE:-http://localhost:8080}"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); printf '  \033[32mĐẠT\033[0m  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  \033[31mLỖI\033[0m  %s (nhận %s)\n' "$1" "$2"; }
expect() { [ "$2" = "$3" ] && ok "$1" || bad "$1 – mong đợi $3" "$2"; }
has()  { printf '%s' "$BODY" | grep -q "$2" && ok "$1" || bad "$1" "$BODY"; }
isnull() { printf '%s' "$BODY" | grep -q "\"$2\":[0-9\"-]" && bad "$1" "$BODY" || ok "$1"; }
code() { curl -s -o /tmp/gf_body -w '%{http_code}' "$@"; }
call() { C=$(code "$@"); BODY=$(cat /tmp/gf_body); }
day()  { date -v"$1"d +%F 2>/dev/null || date -d "$1 days" +%F; }
at()   { date -r "$1" +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -d "@$1" +%Y-%m-%dT%H:%M:%S; }
idof() { printf '%s' "$1" | sed -n 's/^{"id":\([0-9]*\).*/\1/p'; }

# Chặn chạy nhầm vào một bản khác trên cùng máy: cổng 8080 phải do image backend của repo này giữ.
IMG="${BACKEND_IMAGE:-$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")-backend}"
if [ -z "${SKIP_IMAGE_CHECK:-}" ] && ! docker ps --format '{{.Image}} {{.Ports}}' | grep -E "^$IMG " | grep -q ':8080->'; then
  echo "Cổng 8080 không phải backend của repo này (image $IMG). Đang chạy:"
  docker ps --format '  {{.Names}}  {{.Image}}  {{.Ports}}'
  echo "Tắt bản đang chiếm cổng rồi chạy docker compose up -d trong repo này."
  exit 2
fi

login() {
  curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}
read -r -p "Email ADMIN: " ADMIN_EMAIL
read -r -s -p "Mật khẩu ADMIN: " ADMIN_PW; echo
read -r -p "Email MEMBER (Enter để bỏ qua kiểm tra 403): " MEM_EMAIL
if [ -n "$MEM_EMAIL" ]; then read -r -s -p "Mật khẩu MEMBER: " MEM_PW; echo; fi
ADMIN=$(login "$ADMIN_EMAIL" "$ADMIN_PW")
[ -z "$ADMIN" ] && { echo "Đăng nhập ADMIN thất bại, dừng."; exit 1; }
A=(-H "Authorization: Bearer $ADMIN")
J=(-H "Authorization: Bearer $ADMIN" -H 'Content-Type: application/json')
MEM=""; if [ -n "$MEM_EMAIL" ]; then MEM=$(login "$MEM_EMAIL" "$MEM_PW"); fi
M=(-H "Authorization: Bearer $MEM")
TS=$(date +%s); TODAY=$(date +%F)
echo "Hôm nay theo máy: $TODAY (backend phải cùng múi giờ Việt Nam)"

# Tạo hội viên kiểm thử: mkmember <tiền tố> [<trường JSON thêm, bắt đầu bằng dấu phẩy>] → MID
mkmember() {
  call -X POST "$BASE/api/members" "${J[@]}" -d "{\"email\":\"$1.$TS@example.com\",\"fullName\":\"Kiểm thử $1 $TS\"${2:-}}"
  expect "tạo hội viên kiểm thử $1.$TS@example.com" "$C" 201
  MID=$(printf '%s' "$BODY" | sed -n 's/.*"member":{"id":\([0-9]*\).*/\1/p')
  [ -z "$MID" ] && { echo "Không tạo được hội viên kiểm thử, dừng."; exit 1; }
}
# Tạo gói kiểm thử: mkplan <tên> <số ngày> <giá> → in id
mkplan() {
  call -X POST "$BASE/api/plans" "${J[@]}" -d "{\"name\":\"$1 $TS\",\"price\":$3,\"durationDays\":$2}"
  [ "$C" = 201 ] || { echo "Không tạo được gói kiểm thử ($C), dừng." >&2; exit 1; }
  idof "$BODY"
}
memberchecks() { [ -n "$MEM_EMAIL" ] || { echo "  (bỏ qua, không nhập tài khoản MEMBER)"; return 1; }
                 [ -n "$MEM" ] || { bad "Đăng nhập MEMBER" "thất bại"; return 1; }; }
finish() {
  echo; echo "Kết quả: $PASS đạt, $FAIL lỗi · $(date '+%d/%m/%Y %H:%M') · commit @ $(git rev-parse --short HEAD 2>/dev/null)"
  [ "$FAIL" = 0 ]
}
w() { call -X POST "$BASE/api/members/$1/weights" "${J[@]}" -d "$2"; }
prog() { call "$BASE/api/members/$1/progress" "${A[@]}"; }
# Đăng ký gói, xếp 1 buổi 45 phút bắt đầu sau ~2 phút, đợi tới giờ rồi ghi nhận hoàn thành → SID
session() {
  PA=$(mkplan "KT$1 30 ngày" 30 1); [ -z "$PA" ] && return 1
  call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PA}"
  expect "đăng ký gói cho hội viên kiểm thử" "$C" 201
  ST=$(( ( $(date +%s) / 60 + 2 ) * 60 )); EN=$(( ST + 45 * 60 ))
  if [ "$(at "$ST" | cut -c1-10)" != "$(at "$EN" | cut -c1-10)" ]; then
    echo "  (gần nửa đêm, buổi 45 phút sẽ sang ngày khác; chạy lại sau 00:00)"; return 1
  fi
  call -X POST "$BASE/api/schedules" "${J[@]}" -d "{\"memberId\":$MID,\"title\":\"KT$1\",\"startTime\":\"$(at "$ST")\",\"endTime\":\"$(at "$EN")\"}"
  expect "xếp 1 buổi bắt đầu lúc $(at "$ST" | cut -c12-16)" "$C" 201
  SID=$(printf '%s' "$BODY" | sed -n 's/.*"created":\[{"id":\([0-9]*\).*/\1/p')
  [ -z "$SID" ] && return 1
  WAIT=$(( ST - $(date +%s) + 5 )); [ "$WAIT" -gt 0 ] && { echo "  … đợi $WAIT giây tới giờ bắt đầu"; sleep "$WAIT"; }
  call -X POST "$BASE/api/schedules/$SID/complete" "${J[@]}" -d '{"durationMinutes":45,"calories":350,"rating":4}'
  expect "ghi nhận hoàn thành buổi" "$C" 200
}

echo "== Chuẩn bị dữ liệu kiểm thử =="
mkmember kt183

echo "== Khi chưa có buổi tập =="
prog "$MID"
expect "GET /members/{id}/progress" "$C" 200
has "chuỗi 0 tuần, tổng 0 buổi, 0 phút, 0 kcal" '"streakWeeks":0,"totalSessions":0,"totalMinutes":0,"totalCalories":0'
isnull "chưa có đánh giá → avgRating trống" avgRating

echo "== Sau 1 buổi hoàn thành =="
if session 183; then
  prog "$MID"
  has "chuỗi 1 tuần (tuần này có buổi hoàn thành)" '"streakWeeks":1'
  has "tổng 1 buổi, 45 phút, 350 kcal, đánh giá 4.0" '"totalSessions":1,"totalMinutes":45,"totalCalories":350,"avgRating":4.0'
  call -X POST "$BASE/api/schedules/$SID/complete" "${J[@]}" -d '{"durationMinutes":30,"calories":100}'
  expect "ghi nhận lần 2 cùng buổi" "$C" 409
  prog "$MID"
  has "ghi nhận lần 2 không cộng dồn" '"totalSessions":1,"totalMinutes":45,"totalCalories":350'
fi

echo "== Phân quyền =="
if memberchecks && [ -n "${SID:-}" ]; then
  expect "MEMBER ghi nhận buổi của hội viên khác" "$(code -X POST "$BASE/api/schedules/$SID/complete" "${M[@]}" -H 'Content-Type: application/json' -d '{}')" 403
fi

echo "== Dọn dữ liệu =="
code -X PUT "$BASE/api/members/$MID/status" "${J[@]}" -d '{"status":"INACTIVE"}' > /dev/null
[ -n "${PA:-}" ] && code -X PUT "$BASE/api/plans/$PA/active" "${J[@]}" -d '{"active":false}' > /dev/null
echo "  Còn lại trong CSDL local: hội viên kt183.$TS@example.com (INACTIVE), gói 'KT183 30 ngày $TS' (ngừng bán)."
finish
