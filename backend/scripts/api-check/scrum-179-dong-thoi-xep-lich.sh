#!/usr/bin/env bash
# Kiem tra API SCRUM-179: 2 request xep lich dong thoi cho cung hoi vien + HLV + khung gio.
#   bash backend/scripts/api-check/scrum-179-dong-thoi-xep-lich.sh
# Muc tieu (NFR-D02): chi 1 request thanh cong (201), request con lai bi tu choi 409 Conflict;
# CSDL chi co dung 1 buoi tap cho khung gio do nho khoa bi quan tren dong Member roi Trainer.
# Chi chay voi ban local (mac dinh http://localhost:8080), KHONG chay vao VPS dung chung.
# Mat khau nhap tu ban phim, khong luu vao file. Cuoi script hoi vien kiem thu chuyen INACTIVE.
set -u
BASE="${BASE:-http://localhost:8080}"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); printf '  \033[32mDAT\033[0m  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  \033[31mLOI\033[0m  %s (nhan %s)\n' "$1" "$2"; }
expect() { [ "$2" = "$3" ] && ok "$1" || bad "$1 - mong doi $3" "$2"; }
code() { curl -s -o /tmp/gf_body -w '%{http_code}' "$@"; }
call() { C=$(code "$@"); BODY=$(cat /tmp/gf_body); }
day()  { date -v"$1"d +%F 2>/dev/null || date -d "$1 days" +%F; }

# Chan chay nham vao mot ban khac tren cung may: cong 8080 phai do image backend cua repo nay giu.
IMG="${BACKEND_IMAGE:-$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")-backend}"
if [ -z "${SKIP_IMAGE_CHECK:-}" ] && ! docker ps --format '{{.Image}} {{.Ports}}' | grep -E "^$IMG " | grep -q ':8080->'; then
  echo "Cong 8080 khong phai backend cua repo nay (image $IMG). Dang chay:"
  docker ps --format '  {{.Names}}  {{.Image}}  {{.Ports}}'
  echo "Tat ban dang chiem cong roi chay docker compose up -d trong repo nay."
  exit 2
fi

login() {
  curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}
read -r -p "Email ADMIN: " ADMIN_EMAIL
read -r -s -p "Mat khau ADMIN: " ADMIN_PW; echo

ADMIN=$(login "$ADMIN_EMAIL" "$ADMIN_PW")
[ -z "$ADMIN" ] && { echo "Dang nhap ADMIN that bai, dung."; exit 1; }
A=(-H "Authorization: Bearer $ADMIN")
J=(-H "Authorization: Bearer $ADMIN" -H 'Content-Type: application/json')
TS=$(date +%s)
TOMORROW=$(day +1)
START="${TOMORROW}T08:00:00"
END="${TOMORROW}T09:00:00"
echo "Khung gio kiem thu: $START -> $END (backend phai cung mui gio Viet Nam)"

echo "== Chuan bi du lieu kiem thu =="
call -X POST "$BASE/api/plans" "${J[@]}" -d "{\"name\":\"KT179 30 ngay $TS\",\"price\":300000,\"durationDays\":30}"
expect "tao goi 30 ngay" "$C" 201
PLAN=$(printf '%s' "$BODY" | sed -n 's/^{"id":\([0-9]*\).*/\1/p')

call -X POST "$BASE/api/members" "${J[@]}" -d "{\"email\":\"kt179.$TS@example.com\",\"fullName\":\"Kiem thu 179 $TS\"}"
expect "tao hoi vien kiem thu" "$C" 201
MID=$(printf '%s' "$BODY" | sed -n 's/.*"member":{"id":\([0-9]*\).*/\1/p')

call "$BASE/api/trainers" "${A[@]}"
expect "GET /trainers (ADMIN)" "$C" 200
TID=$(printf '%s' "$BODY" | grep -o '"id":[0-9]*' | head -n 1 | cut -d: -f2)

[ -z "$PLAN" ] || [ -z "$MID" ] || [ -z "$TID" ] && { echo "Khong tao duoc du lieu kiem thu (thieu hoi vien/goi/HLV), dung."; exit 1; }

call -X POST "$BASE/api/subscriptions" "${J[@]}" -d "{\"memberId\":$MID,\"planId\":$PLAN}"
expect "hoi vien co goi hieu luc" "$C" 201

echo "== SCRUM-179: ban 2 request xep lich cung luc =="
PAYLOAD="{\"memberId\":$MID,\"trainerId\":$TID,\"title\":\"KT179 dong thoi $TS\",\"startTime\":\"$START\",\"endTime\":\"$END\"}"
fire() { curl -s -o "/tmp/gf179_$1.body" -w '%{http_code}' -X POST "$BASE/api/schedules" "${J[@]}" -d "$PAYLOAD" > "/tmp/gf179_$1.code"; }
fire 1 & P1=$!
fire 2 & P2=$!
wait "$P1" "$P2"
C1=$(cat /tmp/gf179_1.code); C2=$(cat /tmp/gf179_2.code)
printf '  (request 1: %s, request 2: %s)\n' "$C1" "$C2"

if { [ "$C1" = 201 ] && [ "$C2" = 409 ]; } || { [ "$C1" = 409 ] && [ "$C2" = 201 ]; }; then
  ok "dung 1 request thanh cong (201), request con lai bi chan 409"
else
  bad "phai co dung 1 x 201 va 1 x 409" "$C1/$C2"
fi

echo "== Kiem tra CSDL: chi co 1 buoi tap =="
call -G "$BASE/api/schedules" "${A[@]}" \
  --data-urlencode "from=${TOMORROW}T00:00:00" --data-urlencode "to=${TOMORROW}T23:59:59"
expect "GET /schedules trong ngay" "$C" 200
ROWS=$(printf '%s' "$BODY" | grep -o "KT179 dong thoi $TS" | wc -l | tr -d ' ')
expect "so buoi tap trung gio duoc tao" "$ROWS" 1

echo "== Don du lieu =="
if [ "$C1" = 201 ]; then SID=$(grep -o '"id":[0-9]*' /tmp/gf179_1.body | head -n 1 | cut -d: -f2)
elif [ "$C2" = 201 ]; then SID=$(grep -o '"id":[0-9]*' /tmp/gf179_2.body | head -n 1 | cut -d: -f2)
else SID=""; fi
if [ -n "${SID:-}" ]; then call -X PUT "$BASE/api/schedules/$SID/cancel" "${A[@]}"; fi
call -X PUT "$BASE/api/members/$MID/status" "${J[@]}" -d '{"status":"INACTIVE"}'
expect "chuyen hoi vien kiem thu sang INACTIVE" "$C" 200
if [ -n "$PLAN" ]; then code -X PUT "$BASE/api/plans/$PLAN/active" "${J[@]}" -d '{"active":false}' > /dev/null; fi
echo "  Con lai trong CSDL local: hoi vien kt179.$TS@example.com (INACTIVE), goi 'KT179 30 ngay $TS' (ngung ban)."

echo; echo "Ket qua: $PASS dat, $FAIL loi - $(date '+%d/%m/%Y %H:%M') - commit @ $(git rev-parse --short HEAD 2>/dev/null)"
[ "$FAIL" = 0 ]
