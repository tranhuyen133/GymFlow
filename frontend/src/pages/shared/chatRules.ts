// Quy tắc tin nhắn phía giao diện (khớp với máy chủ). Thuần TypeScript, không import để test bằng node --test.

export type Kind = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';

export interface MsgLike {
  id: number;
  senderUserId: number;
  body: string;
  createdAt: string;
  kind?: Kind;
  recalled?: boolean;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
  attachmentUrl?: string | null;
}

export const MB = 1024 * 1024;
export const RECALL_MS = 15 * 60 * 1000;
export const MAX_CAPTION = 2000;

const RULES: Record<string, { kind: Exclude<Kind, 'TEXT'>; max: number }> = {
  jpg: { kind: 'IMAGE', max: 10 * MB }, jpeg: { kind: 'IMAGE', max: 10 * MB }, png: { kind: 'IMAGE', max: 10 * MB },
  webp: { kind: 'IMAGE', max: 10 * MB }, gif: { kind: 'IMAGE', max: 10 * MB },
  mp4: { kind: 'VIDEO', max: 25 * MB }, m4v: { kind: 'VIDEO', max: 25 * MB }, mov: { kind: 'VIDEO', max: 25 * MB }, webm: { kind: 'VIDEO', max: 25 * MB },
  pdf: { kind: 'FILE', max: 10 * MB }, doc: { kind: 'FILE', max: 10 * MB }, docx: { kind: 'FILE', max: 10 * MB },
  xls: { kind: 'FILE', max: 10 * MB }, xlsx: { kind: 'FILE', max: 10 * MB }, ppt: { kind: 'FILE', max: 10 * MB },
  pptx: { kind: 'FILE', max: 10 * MB }, txt: { kind: 'FILE', max: 10 * MB }, csv: { kind: 'FILE', max: 10 * MB }, zip: { kind: 'FILE', max: 10 * MB },
};

/** Giá trị cho thuộc tính accept của ô chọn tệp. */
export const ACCEPT = Object.keys(RULES).map((e) => '.' + e).join(',');

export function extensionOf(name: string | null | undefined): string {
  const n = (name ?? '').trim();
  const dot = n.lastIndexOf('.');
  return dot < 0 || dot === n.length - 1 ? '' : n.slice(dot + 1).toLowerCase();
}

export type FileCheck = { ok: true; kind: Exclude<Kind, 'TEXT'> } | { ok: false; error: string; vars?: Record<string, string | number> };

/** Kiểm tra sơ bộ trước khi tải lên (máy chủ vẫn kiểm tra lại nội dung tệp). Thông báo là khoá tiếng Việt để dịch. */
export function checkFile(file: { name: string; size: number } | null | undefined): FileCheck {
  if (!file) return { ok: false, error: 'Vui lòng chọn tệp cần gửi' };
  const rule = RULES[extensionOf(file.name)];
  if (!rule) return { ok: false, error: 'Định dạng tệp không được hỗ trợ' };
  if (!file.size || file.size <= 0) return { ok: false, error: 'Tệp rỗng, vui lòng chọn tệp khác' };
  if (file.size > rule.max) {
    const label = rule.kind === 'IMAGE' ? 'Ảnh tối đa {n} MB' : rule.kind === 'VIDEO' ? 'Video tối đa {n} MB' : 'Tệp tối đa {n} MB';
    return { ok: false, error: label, vars: { n: rule.max / MB } };
  }
  return { ok: true, kind: rule.kind };
}

/** 1536 → "1.5 KB"; làm tròn 1 chữ số, bỏ ".0". */
export function formatBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = n / 1024; let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${(Math.round(v * 10) / 10).toString()} ${units[i]}`;
}

/** "2026-11-14T10:05:00.123456" (giờ máy chủ, không múi giờ) → mili giây theo giờ máy. */
export function parseLocal(s: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?/.exec(s ?? '');
  if (!m) return NaN;
  const ms = m[7] ? Number(m[7].slice(0, 3).padEnd(3, '0')) : 0;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0, ms).getTime();
}

/** Thời gian còn lại để thu hồi (ms); 0 nếu không thu hồi được. */
export function recallLeftMs(msg: MsgLike, meId: number, nowMs: number): number {
  if (msg.recalled || msg.senderUserId !== meId) return 0;
  const created = parseLocal(msg.createdAt);
  if (Number.isNaN(created)) return 0;
  const left = created + RECALL_MS - nowMs;
  return left > 0 ? left : 0;
}

export function canRecall(msg: MsgLike, meId: number, nowMs: number): boolean {
  return recallLeftMs(msg, meId, nowMs) > 0;
}

export function kindOf(msg: MsgLike): Kind {
  return msg.kind ?? 'TEXT';
}

/** Dòng xem trước trong danh sách hội thoại: nhãn (khoá dịch) + nội dung. */
export function previewOf(msg: MsgLike | null | undefined, meId: number): { label: string | null; text: string } {
  if (!msg) return { label: 'Chưa có tin nhắn', text: '' };
  if (msg.recalled) return { label: msg.senderUserId === meId ? 'Bạn đã thu hồi một tin nhắn' : 'Tin nhắn đã được thu hồi', text: '' };
  const body = (msg.body ?? '').trim();
  const kind = kindOf(msg);
  const label = kind === 'IMAGE' ? '[Ảnh]' : kind === 'VIDEO' ? '[Video]' : kind === 'FILE' ? '[Tệp]' : null;
  const text = body || (kind === 'FILE' ? msg.attachmentName ?? '' : '');
  return { label, text };
}

/** Thêm tin mới, bỏ trùng theo id, giữ thứ tự id tăng dần. */
export function mergeMessages<T extends MsgLike>(prev: T[], fresh: T[]): T[] {
  if (!fresh.length) return prev;
  const map = new Map<number, T>();
  for (const m of prev) map.set(m.id, m);
  let changed = false;
  for (const m of fresh) { if (!map.has(m.id)) changed = true; map.set(m.id, m); }
  if (!changed && fresh.every((m) => prev.includes(m))) return prev;
  return [...map.values()].sort((a, b) => a.id - b.id);
}

/** Đánh dấu thu hồi theo danh sách id (xoá nội dung / tệp ở phía hiển thị). */
export function applyRecalled<T extends MsgLike>(list: T[], ids: number[]): T[] {
  if (!ids.length) return list;
  const set = new Set(ids);
  let changed = false;
  const out = list.map((m) => {
    if (!set.has(m.id) || m.recalled) return m;
    changed = true;
    return { ...m, recalled: true, body: '', attachmentName: null, attachmentType: null, attachmentUrl: null };
  });
  return changed ? out : list;
}

/** Tách tin theo ngày để hiển thị vạch ngăn "Hôm nay / Hôm qua / dd/MM". */
export function dayKey(createdAt: string): string {
  return (createdAt ?? '').slice(0, 10);
}
