#!/usr/bin/env bash
# Kiểm tra API SCRUM-205: duyệt bài tập + gắn nguồn tham khảo (EX-04, EX-05).
#   bash backend/scripts/api-check/scrum-205-duyet-bai-tap.sh
# Chỉ chạy với bản local (mặc định http://localhost:8080), KHÔNG chạy vào VPS dùng chung.
# Mật khẩu nhập từ bàn phím, không lưu vào file. Không sửa bài tập mẫu hay nguồn tham khảo có sẵn.
# Tạo 1 bài tập kiểm thử "KT205 …", cuối script xoá đi.
# Trường hợp HLV sửa bài đã duyệt → quay về chờ duyệt nằm ở unit test ContentReviewTest.
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
ex() { printf '{"name":"KT205 %s %s","muscleGroup":"CORE","level":"BEGINNER","equipment":"Thảm"%s}' "$1" "$TS" "${2:-}"; }
rv() { call -X PUT "$BASE/api/exercises/$1/review" "${J[@]}" -d "$2"; }
nsrc() { printf '%s' "$BODY" | grep -o '"code":"' | wc -l | tr -d ' '; }

echo "== Nguồn tham khảo =="
call "$BASE/api/content-sources" "${A[@]}"
expect "GET /content-sources" "$C" 200
has "có nguồn NHS_STRENGTH của NHS" '"code":"NHS_STRENGTH","publisher":"NHS (nhs.uk)"'
has "nguồn WHO ghi rõ giấy phép chưa xác minh" '"code":"WHO_PA_2020".*"licenseVerified":false'
SRC=$(printf '%s' "$BODY" | sed -n 's/.*{"id":\([0-9]*\),"code":"NHS_STRENGTH".*/\1/p')
[ -z "$SRC" ] && { echo "Không thấy nguồn NHS_STRENGTH (migration V3 chưa chạy?), dừng."; exit 1; }

echo "== Bài tập mới luôn ở trạng thái chờ duyệt =="
call -X POST "$BASE/api/exercises" "${J[@]}" -d "$(ex 'chua nguon')"
expect "POST /exercises" "$C" 201; E1=$(idof "$BODY")
[ -z "$E1" ] && { echo "Không tạo được bài tập kiểm thử, dừng."; exit 1; }
has "bài mới ở trạng thái PENDING" '"reviewStatus":"PENDING"'
has "chưa gắn nguồn" '"sources":\[\]'
has "mặc định nhóm tự biên soạn" '"contentOrigin":"SELF_AUTHORED"'

echo "== EX-04: duyệt bài tập =="
rv "$E1" '{"status":"APPROVED"}'
expect "duyệt bài chưa có nguồn" "$C" 400
has "báo cần ít nhất một nguồn" 'nguồn tham khảo'
call "$BASE/api/exercises/$E1" "${A[@]}"
has "bị từ chối thì vẫn giữ PENDING" '"reviewStatus":"PENDING"'
rv "$E1" '{"status":"NEEDS_REVIEW"}';                 expect "yêu cầu sửa mà không ghi chú" "$C" 400
rv "$E1" '{"status":"NEEDS_REVIEW","note":"   "}';  expect "ghi chú toàn khoảng trắng" "$C" 400
rv "$E1" '{}';                                       expect "thiếu trạng thái duyệt" "$C" 400
rv "$E1" '{"status":"DONE"}';                        expect "trạng thái không hợp lệ" "$C" 400
rv "$E1" "{\"status\":\"DRAFT\",\"note\":\"$(printf 'x%.0s' $(seq 1 501))\"}"; expect "ghi chú quá 500 ký tự" "$C" 400
rv 999999 '{"status":"DRAFT"}';                      expect "bài tập không tồn tại" "$C" 404

echo "== EX-05: gắn nguồn tham khảo =="
call -X POST "$BASE/api/exercises" "${J[@]}" -d "$(ex 'nguon sai' ',"sourceIds":[999999]')"
expect "tạo bài với nguồn không tồn tại" "$C" 400
call -X PUT "$BASE/api/exercises/$E1" "${J[@]}" -d "$(ex 'chua nguon' ",\"sourceIds\":[$SRC,$SRC]")"
expect "PUT /exercises/{id} gắn nguồn" "$C" 200
has "đã gắn NHS_STRENGTH" '"code":"NHS_STRENGTH"'
expect "gửi trùng id nguồn chỉ lưu 1 lần" "$(nsrc)" 1
has "ADMIN sửa bài chờ duyệt thì vẫn PENDING" '"reviewStatus":"PENDING"'

rv "$E1" '{"status":"APPROVED","note":"  "}'
expect "duyệt bài đã có nguồn" "$C" 200
has "trạng thái APPROVED" '"reviewStatus":"APPROVED"'
isnull "ghi chú trống lưu thành null" reviewNote
has "ghi tên người duyệt" '"reviewedByName":"'
has "ghi thời điểm duyệt" '"reviewedAt":"'

call -X PUT "$BASE/api/exercises/$E1" "${J[@]}" -d "$(ex 'chua nguon')"
expect "ADMIN sửa bài đã duyệt (không gửi sourceIds)" "$C" 200
has "ADMIN sửa thì giữ APPROVED" '"reviewStatus":"APPROVED"'
has "không gửi sourceIds thì giữ nguyên nguồn" '"code":"NHS_STRENGTH"'

rv "$E1" '{"status":"NEEDS_REVIEW","note":"Bổ sung lỗi thường gặp"}'
expect "yêu cầu chỉnh sửa có ghi chú" "$C" 200
has "lưu trạng thái và ghi chú" '"reviewStatus":"NEEDS_REVIEW","reviewNote":"Bổ sung lỗi thường gặp"'

call "$BASE/api/exercises?reviewStatus=NEEDS_REVIEW&q=KT205" "${A[@]}"
printf '%s' "$BODY" | grep -q "\"id\":$E1," && ok "lọc reviewStatus=NEEDS_REVIEW thấy bài" || bad "lọc reviewStatus=NEEDS_REVIEW thấy bài" "$BODY"
call "$BASE/api/exercises?reviewStatus=APPROVED&q=KT205" "${A[@]}"
printf '%s' "$BODY" | grep -q "\"id\":$E1," && bad "lọc reviewStatus=APPROVED không thấy bài" "$BODY" || ok "lọc reviewStatus=APPROVED không thấy bài"

call -X PUT "$BASE/api/exercises/$E1" "${J[@]}" -d "$(ex 'chua nguon' ',"sourceIds":[]')"
expect "gửi sourceIds rỗng" "$C" 200
has "danh sách rỗng thì bỏ hết nguồn" '"sources":\[\]'
rv "$E1" '{"status":"APPROVED"}'; expect "bỏ hết nguồn thì không duyệt được nữa" "$C" 400

call "$BASE/api/audit-logs?action=EXERCISE_REVIEW&size=50" "${A[@]}"
has "nhật ký có thao tác duyệt bài kiểm thử" "KT205 chua nguon $TS → NEEDS_REVIEW"

echo "== Phân quyền =="
expect "chưa đăng nhập gọi GET exercises" "$(code "$BASE/api/exercises")" 401
expect "chưa đăng nhập gọi PUT review" "$(code -X PUT "$BASE/api/exercises/$E1/review" -H 'Content-Type: application/json' -d '{"status":"APPROVED"}')" 401
if memberchecks; then
  expect "MEMBER duyệt bài" "$(code -X PUT "$BASE/api/exercises/$E1/review" "${M[@]}" -H 'Content-Type: application/json' -d '{"status":"DRAFT"}')" 403
  expect "MEMBER xem danh sách nguồn" "$(code "$BASE/api/content-sources" "${M[@]}")" 403
  expect "MEMBER tạo bài tập" "$(code -X POST "$BASE/api/exercises" "${M[@]}" -H 'Content-Type: application/json' -d "$(ex 'member')")" 403
  expect "MEMBER vẫn xem được bài chưa duyệt (giao diện gắn nhãn)" "$(code "$BASE/api/exercises/$E1" "${M[@]}")" 200
fi

echo "== Dọn dữ liệu =="
expect "xoá bài tập kiểm thử" "$(code -X DELETE "$BASE/api/exercises/$E1" "${A[@]}")" 204
finish
