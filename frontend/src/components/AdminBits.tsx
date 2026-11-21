/**
 * v13 · Mảnh giao diện dùng chung cho khu quản trị (chỉ hiển thị, không gọi API).
 * - ResultCount: số dòng khớp bộ lọc, đặt cuối thanh lọc.
 * - waitTone: đơn chờ bao lâu → màu viền thẻ hàng chờ (dưới 1 ngày / 1–3 ngày / trên 3 ngày).
 * - auditIcon, groupByDay, dayLabel: nhật ký dạng dòng thời gian.
 */
import type { IconName } from './Icon';
import { t } from '../i18n';
import { addDays, fmtWeekday, isSameDay, parseDate, parseDateTime } from '../lib/format';

export function ResultCount({ n }: { n: number | null | undefined }) {
  if (n == null) return null;
  return <span className="kd-count" role="status" aria-live="polite">{t('{n} kết quả', { n })}</span>;
}

export type WaitTone = 'fresh' | 'warn' | 'late';
export function waitTone(createdAt: string): WaitTone {
  const hours = (Date.now() - parseDateTime(createdAt).getTime()) / 3_600_000;
  return hours >= 72 ? 'late' : hours >= 24 ? 'warn' : 'fresh';
}

export function auditIcon(action: string): IconName {
  if (action.startsWith('LOGIN')) return 'key';
  if (action.includes('UNLOCK')) return 'unlock';
  if (action.includes('PASSWORD') || action.includes('LOCK')) return 'lock';
  if (action.includes('DELETE') || action.includes('REMOVE')) return 'trash';
  if (action.includes('PAYMENT') || action.includes('PAID')) return 'wallet';
  if (action.includes('APPROVE')) return 'checkCircle';
  if (action.includes('REJECT') || action.includes('HIDE') || action.includes('CANCEL') || action.includes('MISSED')) return 'ban';
  if (action.startsWith('SCHEDULE')) return 'calendar';
  if (action.includes('CREATE')) return 'plus';
  if (action.includes('UPDATE') || action.includes('PREFS')) return 'edit';
  return 'scroll';
}

/** Gom các dòng (đã sắp theo thời gian) thành từng nhóm theo ngày, giữ nguyên thứ tự. */
export function groupByDay<T extends { createdAt: string }>(rows: T[]) {
  const out: { day: string; items: T[] }[] = [];
  for (const r of rows) {
    const day = r.createdAt.slice(0, 10);
    const last = out[out.length - 1];
    if (last && last.day === day) last.items.push(r);
    else out.push({ day, items: [r] });
  }
  return out;
}

export function dayLabel(day: string) {
  const d = parseDate(day);
  const now = new Date();
  if (isSameDay(d, now)) return t('Hôm nay');
  if (isSameDay(d, addDays(now, -1))) return t('Hôm qua');
  return fmtWeekday(day);
}
