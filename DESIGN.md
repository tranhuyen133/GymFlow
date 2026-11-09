# DESIGN.md – GymFlow

Quy chuẩn giao diện cho người (và AI) chỉnh sửa frontend. Mã nguồn tham chiếu: `frontend/src/styles.css`.

## 1. Hai bề mặt, hai giọng

| | Trang công khai (`/`, `/register`, `/login`, `/policies`) | Khu ứng dụng (sau đăng nhập) |
|---|---|---|
| Mục tiêu | Bán hàng: thuyết phục đăng ký hội viên | Làm việc: tra cứu, nhập liệu nhanh |
| Chữ | Hiển thị **IN HOA, cỡ rất lớn** (`.display`, `.display-sm`), tracking âm | Inter 600/800 chữ thường, cỡ 13–28px |
| Màu | Đơn sắc đen–trắng + **một** màu hành động `#00b24b` | Như bên trái + xanh dương/tím/vàng cho trạng thái |
| Mật độ | Thoáng, mỗi section một ý | Dày thông tin, bảng, thẻ số liệu |
| Chuyển động | Vào trang kiểu lò xo (`--ease-spring`), ticker, thẻ nổi | Tối thiểu, chỉ phản hồi thao tác |

Không dùng `.display` trong khu ứng dụng; không dùng bảng/thẻ số liệu dày đặc trên trang công khai.

## 2. Token

- Nền `--canvas #141415` · bề mặt `--surface-2 #202125` · đường kẻ `--hairline #2d2f33`
- Chữ `--ink #f0f2f5` · phụ `--muted #9aa1b1` · mờ `--faint #5f636c`
- Hành động `--primary #00b24b` / `--primary-bright #00d95b` – chỉ cho CTA chính, số liệu tốt, điểm nhấn
- Bo góc `--r-sm 10` · `--r-md 16` · `--r-lg 20` · góc nghiêng motif `--slant -12deg`

## 3. Motif

- **Vạch nghiêng tốc độ**: khối `skewX(var(--slant))` màu primary, độ mờ 0.05–0.22. Dùng ở hero, auth, kicker, số thứ tự bước.
- **Chữ viền khổng lồ** (`-webkit-text-stroke`, alpha ≤ 0.07) làm nền: `GYMFLOW` ở hero, `MOVE` ở auth. Luôn `aria-hidden`.
- **Ticker** nền xanh liệt kê bộ môn – một dải duy nhất mỗi trang.
- Không dùng ảnh chưa rõ bản quyền. Khi có ảnh thật của phòng tập: full-bleed, đen trắng hoặc tương phản cao, chữ đè trực tiếp.

## 4. Chuyển động

- Vào trang: `riseIn` 0.8s `--ease-spring`, so le 60ms giữa các phần tử.
- Hover thẻ: `translateY(-3..-4px)` với `--ease-spring`; không phóng to quá 1.02.
- Mọi animation bị vô hiệu bởi `prefers-reduced-motion` (khối cuối `styles.css`). Thành phần mới không được tự đặt `animation` bằng `!important`.

## 5. Khả năng truy cập

- Focus luôn thấy được: `:focus-visible` viền 2px; nút/link công khai dùng màu `--primary-bright`, offset 3px.
- Tương phản chữ ≥ 4.5:1 trên nền tối (`--muted` trên `--canvas` đạt ~7:1). Không đặt chữ `--faint` cho nội dung quan trọng.
- Vùng chạm ≥ 44px trên mobile (menu mobile, nút CTA).
- Form: nhãn rõ ràng, lỗi đặt ngay dưới trường, focus vào trường lỗi đầu tiên, `aria-invalid`.

## 6. Breakpoint đã kiểm tra

| Độ rộng | Hành vi |
|---|---|
| ≥ 1181px (1440, 1280) | Hero 2 cột, lưới 4/3 cột, footer 4 cột |
| 901–1180px | Lưới 4 → 2 cột, footer 2 cột |
| ≤ 900px (768) | Menu hamburger, hero 1 cột, lưới 3 → 1 cột, auth ẩn cột minh hoạ |
| ≤ 560px (390) | Ẩn thẻ nổi hero, CTA full-width, footer 1 cột |

## 7. Nội dung

- Giọng văn: ngắn, chủ động, nói với hội viên ("bạn"). Tiêu đề hiển thị ≤ 6 từ.
- Thông tin liên hệ lấy từ `frontend/src/site.ts`; trường rỗng sẽ tự ẩn – không điền số/địa chỉ giả.
- Không đưa nội dung học thuật (nhóm, lớp, giảng viên, môn học) lên giao diện công khai; thông tin đó chỉ nằm trong README.
- Tài khoản demo chỉ hiện khi backend bật `DEMO_QUICK_LOGIN` và tài khoản thật sự tồn tại, luôn ghi rõ "Môi trường demo".

## 8. Chế độ sáng / tối

- Ba lựa chọn: Sáng · Tối · Theo hệ thống (mặc định). Nút ở header trang công khai, góc form đăng nhập/đăng ký và topbar ứng dụng (`src/theme/ThemeToggle.tsx`).
- Lưu ở `localStorage['gf.theme']`; đổi ở một tab thì các tab khác đổi theo. Không gửi lên server nên không ảnh hưởng đăng nhập.
- Script nhỏ đầu `index.html` đặt `data-theme` trên `<html>` trước khi trang vẽ → không nháy nền tối khi tải lại ở chế độ sáng.
- Chỉ đổi **token** trong `:root[data-theme='light']` (`styles.css`). Thành phần mới phải dùng `var(--…)`, không viết mã màu cứng. Màu nhấn của biểu đồ, nhóm cơ, trạng thái giữ nguyên ở cả hai chế độ để người dùng nhận ra.
- Ở chế độ sáng, màu xanh hành động đậm hơn (`#008a3a`) để chữ xanh trên nền trắng vẫn đủ tương phản.
<!-- history SCRUM-170 -->
<!-- history SCRUM-193 -->
<!-- history SCRUM-192 -->

## 9. Gói tập, ca làm, nhập liệu (PR #79)

### Màu theo trạng thái
- Xanh lá `--primary` = làm được / đạt; vàng `--warning` = cần chú ý nhưng vẫn lưu được; đỏ `--bad` = chặn lưu.
- Xanh dương `--secondary` = thông tin, "Bạn đang dùng" (gói hiện tại của hội viên).
- Không dùng màu làm tín hiệu duy nhất – luôn kèm icon hoặc chữ.
- Số tiền, số ngày, giờ: `font-variant-numeric: tabular-nums` để cột số không nhảy.

### Thẻ gói tập (`components/PlanCard.tsx`, `packages.css`)
- Một thẻ dùng chung cho Quản lý › Gói tập, bảng giá trang chủ và Gói tập của hội viên; `compact` cho cột bên (xem trước khi sửa gói).
- Giá lớn + giá quy đổi theo ngày/tháng + nhãn "Tiết kiệm x%" + quyền lợi có dấu tick.
- `best` ("Phổ biến nhất", chọn tự động: tiết kiệm nhất trừ gói dài nhất) = viền sáng `.beam` + nhãn nền `--grad-go`.
- `.beam` chỉ cho **một** thứ nổi bật nhất trên màn; `.beam-hover` khi chỉ muốn hiện lúc rê chuột.
- Vạch nghiêng `--slant` mờ ở góc phải thẻ, đậm lên nhẹ khi rê chuột.

### Chuyển động
- Nhấc thẻ khi rê chuột: `translateY(-3px)` (thẻ thường) / `-6px` (thẻ gói), dùng `--ease-spring`.
- Mờ dần, trượt vào: `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)`.
- Số thay đổi (giá gói, số ngày còn lại): đổi `key` theo giá trị để chạy lại keyframe `priceIn` (trượt từ dưới lên).
- Tất cả là CSS thuần, không thêm thư viện, tắt khi `prefers-reduced-motion: reduce`.

### Hộp xác nhận
- Dùng `Confirm` trong `components/ui.tsx` thay cho `window.confirm` – không dùng hộp thoại của trình duyệt trong ứng dụng.
- Riêng đóng tab / tải lại trang thì trình duyệt tự hỏi qua `beforeunload` (chỉ khi thật sự có thay đổi so với bản đã lưu).

### Khung giờ (`components/WeekSlots.tsx`)
- Chọn khung giờ theo tuần cho ca HLV và giờ tập mong muốn của hội viên.
- Giờ là ô chọn 24h bước 30 phút trong **05:00–22:00** (không dùng `input type="time"` vì một số máy hiện 12h).

### Nhập liệu
- Kiểm tra ở giao diện trùng với backend (`lib/validation.ts` ↔ `Dtos.java`, `lib/hours.ts` ↔ `GymHours.java`); backend vẫn kiểm tra lại.
- Báo lỗi cạnh ô, nói rõ cách sửa kèm ví dụ ("Tên giáo án phải có chữ cái (có thể kèm số), VD: Full body 3 buổi/tuần").
- Tên (giáo án, bài tập, gói) phải có ít nhất một chữ cái; được kèm số.

## 10. Trang chủ thể thao và thẻ số liệu

Hướng tham khảo: Nike, Gymshark. Mạnh, gọn, nhiều khoảng trống, chữ làm chủ.

- **Chữ cực lớn**: tiêu đề hero `.hs-title` cỡ `clamp(52px, 8.6vw, 148px)`, đậm 900, in hoa, dòng sát nhau (`line-height: 0.9`). Dòng đầu nghiêng `skewX(-6deg)`, dòng sau dùng `grad-text`. Tiêu đề khối kêu gọi `.cta-full-title` theo cùng quy tắc.
- **Vạch nghiêng tốc độ**: `.hs-streaks` là 6 vệt sáng chạy chéo theo `--slant`; dải chữ chạy `.ticker-tilt` xoay −1.6°. Không thêm màu mới, chỉ dùng `--primary`, `--primary-bright`, `--grad-go`.
- **Dải số liệu đếm lên** `.stats-band`: số chỉ chạy khi cuộn tới (`CountOnView` → `CountUp`). Chỉ ghi số có thật trong hệ thống: giờ mở cửa (`GYM_OPEN`–`GYM_CLOSE`), số gói đang bán, 150 phút vận động/tuần (WHO), nhắc trước 7 ngày. Không bịa số hội viên hay đánh giá.
- **Thẻ chương trình** `.program-poster`: viền sáng `.beam .beam-slow` luôn bật, số thứ tự rỗng cỡ lớn ở góc dưới, rê chuột thì nhấc thẻ và số nghiêng lên.
- **Khối đăng ký xanh tràn màn hình** `.cta-full`: nền `--grad-go`, chữ và nút màu `#04120a` để đủ tương phản trên nền xanh ở cả theme sáng và tối.
- **Thẻ số liệu (`Stat`)** dùng phong cách thẻ gói: nhãn in hoa, số đậm 900, rê chuột thì nhấc lên và vạch nghiêng đậm dần. `highlight` = số nổi bật nhất của màn (doanh thu tháng ở Tổng quan, chuỗi tuần tập ở Tiến độ): nền xanh loang, số màu gradient, viền sáng. Mỗi màn tối đa một thẻ `highlight`.
- **Thẻ HLV** `.trainer-card`: vạch nghiêng như thẻ gói, số hội viên phụ trách cỡ lớn; HLV phụ trách nhiều hội viên nhất có nhãn "Nhiều hội viên nhất" và viền sáng.
- Nhấc thẻ dùng thuộc tính `translate` (không dùng `transform`) vì `.stat` có animation xuất hiện giữ lại `transform`.
- Mọi chuyển động trên tắt khi bật "giảm chuyển động".

## 11. Động lực tập luyện: vòng hoạt động, huy hiệu, dải giờ

Mỗi nhóm người dùng có một mục tiêu giao diện riêng:
- **Hội viên** cần động lực để quay lại tập, theo kiểu Apple Fitness và Nike Run Club.
- **HLV** cần thấy nhịp làm việc trong ngày, theo kiểu Strava.
- **Quản lý** cần đọc nhanh sức khoẻ phòng tập.

Thành phần chung nằm ở `components/motivation.tsx` và `motivation.css`.

- **Vòng hoạt động** `ActivityRings`: tối đa 3 vòng lồng nhau, màu `--ring-1` (xanh GymFlow), `--ring-2` (`--info`), `--ring-3` (`--warning`).
  - Vòng tự vẽ khi xuất hiện. Vòng đầy thì phát sáng.
  - Vượt mục tiêu thì vòng dừng ở 100%, con số thật ghi bên cạnh.
  - Hội viên, theo tuần hiện tại:
    - số buổi hoàn thành trên số buổi đã xếp;
    - phút vận động, lấy từ nhật ký buổi tập (không có thì tính theo giờ buổi), so với mục tiêu 150 phút của WHO;
    - chuỗi tuần, so với mốc tiếp theo (2, 4, 8, 12, 26, 52 tuần).
  - Quản lý: tỉ lệ hội viên có gói, tỉ lệ hội viên đang hoạt động, doanh thu so với tháng trước. Không tự đặt chỉ tiêu.
- **Huy hiệu** `achievements()`: tính hoàn toàn từ dữ liệu tiến độ có sẵn, không lưu thêm ở backend.
  - Nhóm huy hiệu:
    - số buổi tập: 1, 10, 25, 50, 100;
    - chuỗi tuần: 2, 4, 8, 12;
    - phút tập: 600, 3.000;
    - 10.000 kcal;
    - ghi cân nặng 4 lần;
    - chuyên cần 80% (chỉ tính khi đã có ít nhất 4 tuần được xếp lịch).
  - Huy chương hình lục giác, 4 hạng: đồng, bạc, vàng, xanh GymFlow.
  - Huy hiệu chưa đạt: khoá, màu xám, có thanh tiến độ và ghi "còn bao nhiêu".
  - Tổng quan hội viên chỉ hiện huy hiệu cao nhất và 2 huy hiệu sắp đạt. Trang Tiến độ hiện đủ.
- **Nhịp 8 tuần** `WeekHeat`: 8 ô, đậm dần theo tỉ lệ buổi hoàn thành của tuần. Tuần đi đủ dùng nền `--grad-go`.
- **Dải giờ trong ngày** `DayTimeline` (HLV):
  - Trục từ `GYM_OPEN` đến `GYM_CLOSE`. Mỗi buổi là một khối màu theo trạng thái, giống `.ev` của lịch tuần.
  - Vạch đỏ nhấp nháy là giờ hiện tại. Bấm khối thì mở chi tiết buổi.
- Thẻ "Tỉ lệ đi tập" của HLV dùng `Stat highlight` khi đạt từ 80%.
- Nhấc thẻ dùng `translate`. Mọi chuyển động tắt khi bật "giảm chuyển động".

## 12. Gói có HLV kèm / gói tự tập và thanh toán

**Vai trò HLV phụ thuộc gói.** Mỗi gói có cờ `includes_trainer` (V12, mặc định `FALSE`).
- **Gói có HLV kèm (PT):** hội viên chọn HLV khi gửi đơn. Quản lý duyệt đơn thì HLV đó được giao (`members.trainer_id`, nhật ký `MEMBER_ASSIGN_TRAINER`). Quản lý được đổi HLV lúc duyệt nếu HLV đã kín lịch. HLV soạn giáo án và xếp lịch như trước.
- **Gói tự tập:** hội viên **chưa có HLV phụ trách** tự soạn giáo án từ thư viện bài tập và tự xếp, dời, huỷ buổi tự tập (`trainer_id = NULL`). Quyền kiểm ở `AccessService.canSelfCoach / requireSelfCoach`. Hội viên đã có HLV thì không tự tạo được giáo án hay buổi tập; giáo án và buổi do HLV tạo thì hội viên chỉ xem và đánh dấu hoàn thành. Đánh vắng vẫn chỉ HLV / quản lý làm.

**Thanh toán: chưa nối cổng thanh toán.**
- **Tại quầy (`COUNTER`, mặc định):** như cũ. Lễ tân thu tiền, quản lý duyệt đơn.
- **Chuyển khoản QR (`BANK_TRANSFER`):** chỉ chọn được khi quản lý đã bật ở Quản lý › Thanh toán và đã có số tài khoản cùng ảnh QR. Mỗi đơn có mã `GF` + 6 số (`package_requests.payment_code`, UNIQUE), dùng làm nội dung chuyển khoản. Hội viên bấm "Tôi đã chuyển khoản" (`member_paid_at`), nhưng việc này **không** kích hoạt gói. Quản lý đối chiếu sao kê rồi mới duyệt, nên vẫn chỉ có một cửa duyệt duy nhất.
- **Thông tin nhận tiền:** nằm ở bảng một dòng `payment_settings` (id = 1). Ảnh QR lưu trong CSDL (`MEDIUMBLOB`, ≤ 512 KB, chỉ JPG/PNG/WebP, kiểm tra theo nội dung file như ảnh đại diện) để không phải thêm volume trên VPS. Ảnh tải qua `GET /api/payment-settings/qr` có kèm token, phản hồi đặt `no-store` và `nosniff`. Không xoá được QR khi đang bật chuyển khoản.

**Sau khi deploy:** mọi gói cũ đều là gói tự tập. Quản lý cần đánh dấu lại các gói PT ở Quản lý › Gói tập, và muốn nhận chuyển khoản thì vào Quản lý › Thanh toán để nhập tài khoản, tải QR rồi bật. Hội viên đang có HLV vẫn giữ HLV đó.
