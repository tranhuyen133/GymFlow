#!/usr/bin/env bash
# Kiểm tra API đăng ký gói SCRUM-159 (SUB-01–03) và SCRUM-160 (SUB-04–07) trên backend chạy dưới máy:
#   bash backend/scripts/api-check/scrum-159-160-dang-ky-goi.sh
# Chỉ chạy với bản local (mặc định http://localhost:8080), KHÔNG chạy vào VPS dùng chung.
# Mật khẩu nhập từ bàn phím, không lưu vào file.
# Script tạo 1 hội viên kiểm thử + 2 gói kiểm thử (không xoá được vì đã có đăng ký). Cuối script
# hội viên chuyển INACTIVE, 2 gói chuyển ngừng bán nên không lẫn vào danh sách đang dùng.
set -u
BASE="${BASE:-http://localhost:8080}"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); printf '  \033[32mĐẠT\033[0m  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  \033[31mLỖI\033[0m  %s (nhận %s)\n' "$1" "$2"; }
expect() { [ "$2" = "$3" ] && ok "$1" || bad "$1 – mong đợi $3" "$2"; }
has()  { printf '%s' "$BODY" | grep -q "$2" && ok "$1" || bad "$1" "$BODY"; }
code() { curl -s -o /tmp/gf_body -w '%{http_code}' "$@"; }
call() { C=$(code "$@"); BODY=$(cat /tmp/gf_body); }
day()  { date -v"$1"d +%F 2>/dev/null || date -d "$1 days" +%F; }
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
TS=$(date +%s); TODAY=$(date +%F)
echo "Hôm nay theo máy: $TODAY (backend phải cùng múi giờ Việt Nam)"

echo "== Chuẩn bị dữ liệu kiểm thử =="
call -X POST "$BASE/api/plans" "${J[@]}" -d "{\"name\":\"KT159 30 ngày $TS\",\"price\":300000,\"durationDays\":30}"
expect "tạo gói 30 ngày" "$C" 201; PA=$(idof "$BODY")
call -X POST "$BASE/api/plans" "${J[@]}" -d "{\"name\":\"KT159 1 ngày $TS\",\"price\":50000,\"durationDays\":1}"
expect "tạo gói 1 ngày" "$C" 201; PB=$(idof "$BODY")
call -X POST "$BASE/api/members" "${J[@]}" -d "{\"email\":\"kt159.$TS@example.com\",\"fullName\":\"Kiểm thử 159 $TS\"}"
expect "tạo hội viên kiểm thử" "$C" 201
MID=$(printf '%s' "$BODY" | sed -n 's/.*"member":{"id":\([0-9]*\).*/\1/p')
[ -z "$PA" ] || [ -z "$PB" ] || [ -z "$MID" ] && { echo "Không tạo được dữ liệu kiểm thử, dừng."; exit 1; }

echo "== SUB-01: xem trước (preview) =="
call "$BASE/api/subscriptions/preview?memberId=$MID&planId=$PA" "${A[@]}"
expect "preview hội viên chưa có gói" "$C" 200
has "bắt đầu hôm nay, kết thúc sau 29 ngày, không nối tiếp" "\"startDate\":\"$TODAY\",\"endDate\":\"$(day +29)\",\"price\":300000,\"chained\":false"

echo "== SUB-02: đăng ký gói =="
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PA}"
expect "POST /subscriptions (để trống ngày bắt đầu)" "$C" 201; S1=$(idof "$BODY")
has "ngày $TODAY → $(day +29)" "\"startDate\":\"$TODAY\",\"endDate\":\"$(day +29)\""
has "pricePaid mặc định = giá gói" '"pricePaid":300000'
has "trạng thái ACTIVE" '"state":"ACTIVE"'

echo "== SUB-03: gia hạn nối tiếp =="
call "$BASE/api/subscriptions/preview?memberId=$MID&planId=$PA" "${A[@]}"
has "preview nối tiếp từ $(day +30)" "\"startDate\":\"$(day +30)\",\"endDate\":\"$(day +59)\",\"price\":300000,\"chained\":true"
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PA,\"pricePaid\":250000,\"note\":\"gia hạn\"}"
expect "POST gia hạn" "$C" 201; S2=$(idof "$BODY")
has "gói gia hạn bắt đầu ngay sau gói cũ" "\"startDate\":\"$(day +30)\",\"endDate\":\"$(day +59)\""
has "giữ số tiền thực thu 250000" '"pricePaid":250000'
has "gói chưa tới ngày là UPCOMING" '"state":"UPCOMING"'

echo "== SUB-04: chặn dữ liệu sai và chồng ngày =="
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PA,\"startDate\":\"$(day +10)\"}"
expect "ngày bắt đầu trùng gói đang có" "$C" 409
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PB,\"startDate\":\"$(day -31)\"}"
expect "ngày bắt đầu lùi quá 30 ngày" "$C" 400
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PA,\"pricePaid\":-1}"
expect "số tiền âm" "$C" 400
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"planId\":$PA}"
expect "thiếu memberId" "$C" 400
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":999999}"
expect "gói không tồn tại" "$C" 404

echo "== SUB-04: 2 yêu cầu gửi cùng lúc không chồng ngày (khoá dòng hội viên) =="
for i in 1 2; do
  curl -s -o /tmp/gf_c$i -w '%{http_code}' -X POST "$BASE/api/subscriptions" "${J[@]}" \
    -d "{\"memberId\":$MID,\"planId\":$PA}" > /tmp/gf_c$i.code &
done
wait
C1=$(cat /tmp/gf_c1.code); C2=$(cat /tmp/gf_c2.code)
case "$C1$C2" in 201201|201409|409201) ok "kết quả hai yêu cầu: $C1 và $C2";; *) bad "kết quả hai yêu cầu (201 hoặc 409)" "$C1 và $C2";; esac
curl -s "$BASE/api/subscriptions?memberId=$MID" "${A[@]}" | tr '}' '\n' | grep '"startDate"' | grep -v '"cancelled":true' \
  | sed -n 's/.*"startDate":"\([0-9-]*\)","endDate":"\([0-9-]*\)".*/\1 \2/p' | sort > /tmp/gf_ranges
PREV=""; OVER=0
while read -r s e; do [ -n "$PREV" ] && [[ ! "$s" > "$PREV" ]] && OVER=1; PREV="$e"; done < /tmp/gf_ranges
[ "$OVER" = 0 ] && ok "không có 2 gói chưa huỷ chồng ngày ($(wc -l < /tmp/gf_ranges | tr -d ' ') gói)" || bad "không chồng ngày" "$(tr '\n' ';' < /tmp/gf_ranges)"

echo "== SUB-05/06: huỷ gói =="
call -X PUT "$BASE/api/subscriptions/$S2/cancel" "${J[@]}" -d '{"reason":"Khách đổi ý"}'
expect "huỷ gói gia hạn" "$C" 200
has "đánh dấu đã huỷ" '"cancelled":true'
has "trạng thái CANCELLED" '"state":"CANCELLED"'
has "lý do được ghi vào ghi chú" 'Huỷ: Khách đổi ý'
call -X PUT "$BASE/api/subscriptions/$S2/cancel" "${J[@]}" -d '{}'
expect "huỷ lần 2" "$C" 400
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PB,\"startDate\":\"$(day -20)\"}"
expect "tạo gói 1 ngày đã qua (để thử huỷ gói hết hạn)" "$C" 201; S3=$(idof "$BODY")
has "gói đã qua là EXPIRED" '"state":"EXPIRED"'
call -X PUT "$BASE/api/subscriptions/$S3/cancel" "${J[@]}" -d '{}'
expect "huỷ gói đã hết hạn" "$C" 400
call -X PUT "$BASE/api/subscriptions/999999/cancel" "${J[@]}" -d '{}'
expect "huỷ đăng ký không tồn tại" "$C" 404

echo "== SUB-07: xem danh sách =="
call "$BASE/api/subscriptions?memberId=$MID" "${A[@]}"
expect "GET /subscriptions?memberId" "$C" 200
call "$BASE/api/subscriptions?state=CANCELLED" "${A[@]}"
has "lọc state=CANCELLED có gói vừa huỷ" "{\"id\":$S2,"
call "$BASE/api/members/$MID/subscriptions" "${A[@]}"
expect "GET /members/{id}/subscriptions (ADMIN)" "$C" 200

echo "== Gói ngừng bán =="
call -X PUT "$BASE/api/plans/$PA/active" "${J[@]}" -d '{"active":false}'
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PA}"
expect "đăng ký gói đã ngừng bán" "$C" 400

echo "== Phân quyền =="
if [ -n "$MEM_EMAIL" ]; then
  MEM=$(login "$MEM_EMAIL" "$MEM_PW")
  if [ -n "$MEM" ]; then
    M=(-H "Authorization: Bearer $MEM")
    expect "MEMBER gọi POST /subscriptions" "$(code -X POST "$BASE/api/subscriptions" "${M[@]}" -H 'Content-Type: application/json' -d "{\"memberId\":$MID,\"planId\":$PB}")" 403
    expect "MEMBER gọi GET /subscriptions" "$(code "$BASE/api/subscriptions" "${M[@]}")" 403
    expect "MEMBER gọi preview" "$(code "$BASE/api/subscriptions/preview?memberId=$MID&planId=$PB" "${M[@]}")" 403
    expect "MEMBER gọi PUT cancel" "$(code -X PUT "$BASE/api/subscriptions/$S1/cancel" "${M[@]}" -H 'Content-Type: application/json' -d '{}')" 403
    expect "MEMBER xem gói của mình /subscriptions/me" "$(code "$BASE/api/subscriptions/me" "${M[@]}")" 200
    expect "MEMBER xem gói của hội viên khác" "$(code "$BASE/api/members/$MID/subscriptions" "${M[@]}")" 403
  else bad "Đăng nhập MEMBER" "thất bại"; fi
else echo "  (bỏ qua)"; fi

echo "== Hội viên ngừng hoạt động =="
call -X PUT "$BASE/api/members/$MID/status" "${J[@]}" -d '{"status":"INACTIVE"}'
expect "chuyển hội viên kiểm thử sang INACTIVE" "$C" 200
call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PB}"
expect "đăng ký cho hội viên ngừng hoạt động" "$C" 400

echo "== Dọn dữ liệu =="
code -X PUT "$BASE/api/plans/$PB/active" "${J[@]}" -d '{"active":false}' > /dev/null
echo "  Còn lại trong CSDL local: hội viên kt159.$TS@example.com (INACTIVE), 2 gói 'KT159 … $TS' (ngừng bán)."

echo; echo "Kết quả: $PASS đạt, $FAIL lỗi · $(date '+%d/%m/%Y %H:%M') · commit @ $(git rev-parse --short HEAD 2>/dev/null)"
[ "$FAIL" = 0 ]
