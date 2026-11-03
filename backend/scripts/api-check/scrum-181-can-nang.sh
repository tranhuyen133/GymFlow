#!/usr/bin/env bash
# Kiểm tra API SCRUM-181: cân nặng ghi, cập nhật theo ngày, xoá (PRG-01, PRG-02, BR-10).
#   bash backend/scripts/api-check/scrum-181-can-nang.sh
# Chỉ chạy với bản local (mặc định http://localhost:8080), KHÔNG chạy vào VPS dùng chung.
# Mật khẩu nhập từ bàn phím, không lưu vào file. Không ghi gì vào hội viên mẫu.
# Tạo 1 hội viên kiểm thử; cuối script hội viên chuyển INACTIVE.
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

echo "== Chuẩn bị dữ liệu kiểm thử =="
mkmember kt181

echo "== PRG-01: ghi cân nặng =="
call "$BASE/api/members/$MID/weights" "${A[@]}"
expect "hội viên mới: danh sách rỗng" "$C|$BODY" "200|[]"
w "$MID" "{\"recordedDate\":\"$(day -14)\",\"weightKg\":72.04,\"bodyFat\":20}"
expect "ghi bản ghi 14 ngày trước" "$C" 200; W1=$(idof "$BODY")
has "làm tròn 1 chữ số: 72.04 → 72.0, % mỡ 20 → 20.0" '"weightKg":72.0,"bodyFat":20.0'
w "$MID" "{\"recordedDate\":\"$(day -7)\",\"weightKg\":70}"
expect "ghi bản ghi 7 ngày trước (không có % mỡ)" "$C" 200; W2=$(idof "$BODY")
isnull "không nhập % mỡ thì để trống" bodyFat
w "$MID" "{\"recordedDate\":\"$TODAY\",\"weightKg\":68.46,\"bodyFat\":18.24,\"note\":\"   \"}"
expect "ghi bản ghi hôm nay" "$C" 200; W3=$(idof "$BODY")
has "68.46 → 68.5, 18.24 → 18.2" '"weightKg":68.5,"bodyFat":18.2'
isnull "ghi chú toàn khoảng trắng lưu thành trống" note

echo "== PRG-02, BR-10: mỗi ngày một bản ghi, ghi lại thì cập nhật =="
w "$MID" "{\"recordedDate\":\"$TODAY\",\"weightKg\":68,\"note\":\"sau tập\"}"
expect "ghi lại cùng ngày" "$C" 200
expect "giữ nguyên id (cập nhật, không tạo mới)" "$(idof "$BODY")" "$W3"
has "ghi đè cân nặng và ghi chú" '"weightKg":68.0,"bodyFat":null,"note":"sau tập"'
call "$BASE/api/members/$MID/weights" "${A[@]}"
expect "GET /members/{id}/weights" "$C" 200
expect "vẫn chỉ 3 bản ghi" "$(printf '%s' "$BODY" | grep -o '"recordedDate"' | wc -l | tr -d ' ')" 3
has "sắp theo ngày tăng dần (cũ trước)" "^\[{\"id\":$W1,\"recordedDate\":\"$(day -14)\""

echo "== Chặn dữ liệu sai =="
w "$MID" "{\"recordedDate\":\"$(day +1)\",\"weightKg\":68}";  expect "ngày tương lai" "$C" 400
w "$MID" "{\"recordedDate\":\"$TODAY\",\"weightKg\":19.9}";   expect "cân nặng < 20 kg" "$C" 400
w "$MID" "{\"recordedDate\":\"$TODAY\",\"weightKg\":300.1}";  expect "cân nặng > 300 kg" "$C" 400
w "$MID" "{\"recordedDate\":\"$TODAY\",\"weightKg\":68,\"bodyFat\":1.9}";  expect "% mỡ < 2" "$C" 400
w "$MID" "{\"recordedDate\":\"$TODAY\",\"weightKg\":68,\"bodyFat\":70.1}"; expect "% mỡ > 70" "$C" 400
w "$MID" '{"weightKg":68}'; expect "thiếu ngày" "$C" 400
w "$MID" "{\"recordedDate\":\"$TODAY\"}"; expect "thiếu cân nặng" "$C" 400
w "$MID" "{\"recordedDate\":\"$TODAY\",\"weightKg\":68,\"note\":\"$(printf 'x%.0s' $(seq 1 256))\"}"; expect "ghi chú quá 255 ký tự" "$C" 400
w 999999 "{\"recordedDate\":\"$TODAY\",\"weightKg\":68}"; expect "hội viên không tồn tại" "$C" 404
w "$MID" "{\"recordedDate\":\"$(day -20)\",\"weightKg\":20}"; expect "biên dưới 20 kg được ghi" "$C" 200; WB=$(idof "$BODY")

echo "== Xoá cân nặng =="
expect "DELETE /weights/{id}" "$(code -X DELETE "$BASE/api/weights/$W2" "${A[@]}")" 204
expect "xoá lần 2" "$(code -X DELETE "$BASE/api/weights/$W2" "${A[@]}")" 404
[ -n "$WB" ] && code -X DELETE "$BASE/api/weights/$WB" "${A[@]}" > /dev/null
call "$BASE/api/members/$MID/weights" "${A[@]}"
expect "còn 2 bản ghi sau khi xoá" "$(printf '%s' "$BODY" | grep -o '"recordedDate"' | wc -l | tr -d ' ')" 2
printf '%s' "$BODY" | grep -q "\"id\":$W2," && bad "bản ghi đã xoá không còn trong danh sách" "$BODY" || ok "bản ghi đã xoá không còn trong danh sách"

echo "== Phân quyền =="
expect "chưa đăng nhập gọi GET weights" "$(code "$BASE/api/members/$MID/weights")" 401
if memberchecks; then
  expect "MEMBER xem cân nặng hội viên khác" "$(code "$BASE/api/members/$MID/weights" "${M[@]}")" 403
  expect "MEMBER ghi cân nặng cho hội viên khác" "$(code -X POST "$BASE/api/members/$MID/weights" "${M[@]}" -H 'Content-Type: application/json' -d "{\"recordedDate\":\"$TODAY\",\"weightKg\":60}")" 403
  expect "MEMBER xoá cân nặng của hội viên khác" "$(code -X DELETE "$BASE/api/weights/$W1" "${M[@]}")" 403
  OWN=$(curl -s "$BASE/api/members/me" "${M[@]}" | sed -n 's/^{"id":\([0-9]*\).*/\1/p')
  if [ -n "$OWN" ]; then expect "MEMBER xem cân nặng của chính mình" "$(code "$BASE/api/members/$OWN/weights" "${M[@]}")" 200
  else bad "lấy id hội viên của MEMBER qua /members/me" "trống"; fi
fi

echo "== Dọn dữ liệu =="
code -X PUT "$BASE/api/members/$MID/status" "${J[@]}" -d '{"status":"INACTIVE"}' > /dev/null
echo "  Còn lại trong CSDL local: hội viên kt181.$TS@example.com (INACTIVE) với 2 bản ghi cân nặng."
finish
