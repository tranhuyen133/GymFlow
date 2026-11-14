// Quy tắc hiển thị trang Huấn luyện viên. Thuần TypeScript, không import để test bằng node --test.

export interface ShiftLike { dayOfWeek: number; startTime: string; endTime: string }

/** Viết hoa ký tự đầu của một cụm chuyên môn (giảm mỡ → Giảm mỡ). */
export function sentenceCase(value: string): string {
  const s = value.trim().replace(/\s+/g, ' ');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Tách chuỗi chuyên môn thành các cụm, bỏ trùng (không phân biệt hoa thường), giữ thứ tự. */
export function splitSpecialties(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,/•;|]/)) {
    const item = sentenceCase(part);
    const key = item.toLocaleLowerCase('vi');
    if (item && !seen.has(key)) { seen.add(key); out.push(item); }
  }
  return out;
}

/** Danh sách chuyên môn cho bộ lọc: gộp mọi HLV, bỏ trùng, sắp theo tiếng Việt. */
export function allSpecialties(list: { specialty: string | null }[]): string[] {
  const map = new Map<string, string>();
  for (const tr of list) for (const sp of splitSpecialties(tr.specialty)) {
    const key = sp.toLocaleLowerCase('vi');
    if (!map.has(key)) map.set(key, sp);
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, 'vi'));
}

/** Số HLV theo từng chuyên môn (mỗi HLV tính 1 lần cho mỗi chuyên môn), dùng cho nhãn đếm ở bộ lọc. */
export function specialtyCounts(list: { specialty: string | null }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tr of list) {
    const seen = new Set<string>();
    for (const sp of splitSpecialties(tr.specialty)) {
      const key = fold(sp);
      if (seen.has(key)) continue;
      seen.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/** Bỏ dấu tiếng Việt + chữ thường để tìm "giam mo" vẫn ra "Giảm mỡ". */
export function fold(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

export function matchesCoach(
  tr: { fullName: string; specialty: string | null; bio: string | null; certificates: string | null },
  query: string,
  specialty: string | null,
): boolean {
  const q = fold(query).replace(/\s+/g, ' ');
  const hay = fold([tr.fullName, tr.specialty, tr.bio, tr.certificates].filter(Boolean).join(' '));
  const okQuery = !q || q.split(' ').every((w) => hay.includes(w));
  const okSpec = !specialty || splitSpecialties(tr.specialty).some((s) => fold(s) === fold(specialty));
  return okQuery && okSpec;
}

function minutesOf(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? '');
  if (!m) return null;
  const h = Number(m[1]); const mi = Number(m[2]);
  return h > 23 || mi > 59 ? null : h * 60 + mi;
}

/** Số giờ của ca (1 chữ số thập phân). Ca qua nửa đêm (22:00 → 02:00) vẫn tính đúng; sai định dạng → null. */
export function shiftHours(start: string, end: string): number | null {
  const a = minutesOf(start); const b = minutesOf(end);
  if (a == null || b == null || a === b) return null;
  const diff = b > a ? b - a : b + 1440 - a;
  return Math.round(diff / 6) / 10;
}

/** Thứ trong tuần theo quy ước backend: 1 = Thứ Hai … 7 = Chủ nhật. */
export function isoDay(d: Date): number {
  const n = d.getDay();
  return n === 0 ? 7 : n;
}

/** Ca hôm nay (sớm nhất) của HLV, nếu có. */
export function todayShift<T extends ShiftLike>(shifts: T[], now: Date): T | null {
  const day = isoDay(now);
  return shifts.filter((s) => s.dayOfWeek === day).sort((x, y) => x.startTime.localeCompare(y.startTime))[0] ?? null;
}

/** Tổng số giờ trực trong tuần (bỏ qua ca sai định dạng). */
export function weeklyHours(shifts: ShiftLike[]): number {
  const total = shifts.reduce((sum, s) => sum + (shiftHours(s.startTime, s.endTime) ?? 0), 0);
  return Math.round(total * 10) / 10;
}

/** Ca theo từng thứ (1..7), mỗi thứ sắp theo giờ bắt đầu. */
export function shiftsByDay<T extends ShiftLike>(shifts: T[]): T[][] {
  const days: T[][] = [[], [], [], [], [], [], []];
  for (const s of shifts) if (s.dayOfWeek >= 1 && s.dayOfWeek <= 7) days[s.dayOfWeek - 1].push(s);
  days.forEach((d) => d.sort((x, y) => x.startTime.localeCompare(y.startTime)));
  return days;
}

/** Đếm chứng chỉ từ chuỗi "NASM-CPT, Sơ cứu cơ bản". */
export function certificateList(raw: string | null | undefined): string[] {
  return (raw ?? '').split(/[,;•|\n]/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Hội viên chỉ nhắn được với HLV đang phụ trách (HLV được gán hoặc HLV của giáo án đang áp dụng) –
 * khớp đúng quy tắc của máy chủ để không hiện nút bấm rồi báo lỗi.
 * assigned = null nghĩa là chưa biết (chưa tải được) → vẫn cho bấm, máy chủ sẽ kiểm tra.
 */
export function canMessage(trainerId: number, assigned: Set<number> | null): boolean {
  return assigned == null || assigned.has(trainerId);
}
