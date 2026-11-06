/**
 * Giờ mở cửa phòng tập và các phép tính khung giờ theo tuần (ca HLV, giờ tập mong muốn của hội viên).
 * Trùng GymHours.java / WeeklySlots.java ở backend; backend vẫn kiểm tra lại.
 */
import { t } from '../i18n';

export const GYM_OPEN = '05:00';
export const GYM_CLOSE = '22:00';
export const SLOT_MIN_MINUTES = 30;
export const SLOTS_PER_DAY = 3;

export interface WeekSlot { dayOfWeek: number; startTime: string; endTime: string }

export const hm = (v: string) => v.slice(0, 5);
export const toMin = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
export const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Các mốc giờ trong giờ mở cửa, mặc định bước 30 phút: 05:00, 05:30 … 22:00. */
export function timeOptions(step = 30, from = GYM_OPEN, to = GYM_CLOSE): string[] {
  const out: string[] = [];
  for (let m = toMin(from); m <= toMin(to); m += step) out.push(fromMin(m));
  return out;
}

/** Thông báo lỗi đầu tiên (đã dịch) hoặc null nếu cả tuần hợp lệ. */
export function slotError(slots: WeekSlot[], dayName: (d: number) => string, label = 'Ca'): string | null {
  const L = t(label);
  for (let d = 1; d <= 7; d++) {
    const day = dayName(d);
    const list = slots.filter((s) => s.dayOfWeek === d).sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
    if (list.length > SLOTS_PER_DAY) return t('{day}: tối đa {n} khung giờ', { day, n: SLOTS_PER_DAY });
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const a = toMin(s.startTime); const b = toMin(s.endTime);
      if (b <= a) return t('{label} {day}: giờ kết thúc phải sau giờ bắt đầu', { label: L, day });
      if (a < toMin(GYM_OPEN) || b > toMin(GYM_CLOSE)) return t('{label} {day} phải nằm trong giờ mở cửa {open}–{close}', { label: L, day, open: GYM_OPEN, close: GYM_CLOSE });
      if (b - a < SLOT_MIN_MINUTES) return t('{label} {day} dài tối thiểu {n} phút', { label: L, day, n: SLOT_MIN_MINUTES });
      if (i > 0 && a < toMin(list[i - 1].endTime)) return t('Các khung giờ {day} bị chồng nhau', { day });
    }
  }
  return null;
}

/** Gộp các khung giờ chồng hoặc nối nhau trong từng ngày (dùng để xếp ca theo giờ hội viên). */
export function mergeSlots(slots: WeekSlot[]): WeekSlot[] {
  const out: WeekSlot[] = [];
  for (let d = 1; d <= 7; d++) {
    const list = slots.filter((s) => s.dayOfWeek === d)
      .map((s) => [Math.max(toMin(s.startTime), toMin(GYM_OPEN)), Math.min(toMin(s.endTime), toMin(GYM_CLOSE))] as [number, number])
      .filter(([a, b]) => b > a)
      .sort((x, y) => x[0] - y[0]);
    const merged: [number, number][] = [];
    for (const [a, b] of list) {
      const last = merged[merged.length - 1];
      if (last && a <= last[1]) last[1] = Math.max(last[1], b); else merged.push([a, b]);
    }
    merged.forEach(([a, b]) => out.push({ dayOfWeek: d, startTime: fromMin(a), endTime: fromMin(Math.max(b, a + SLOT_MIN_MINUTES)) }));
  }
  return out;
}

/** Khung giờ [a, b] có nằm trọn trong một ca nào của ngày đó không. */
export const covered = (shifts: WeekSlot[], s: WeekSlot) =>
  shifts.some((x) => x.dayOfWeek === s.dayOfWeek && toMin(x.startTime) <= toMin(s.startTime) && toMin(x.endTime) >= toMin(s.endTime));
