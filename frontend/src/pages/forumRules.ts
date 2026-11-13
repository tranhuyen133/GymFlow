/**
 * Quy tắc Diễn đàn dùng chung cho giao diện – khớp ForumService.java (làm sạch chữ rồi mới đếm độ dài).
 * File thuần (không import React / i18n) để chạy test bằng node: node --test src/pages/forumRules.test.mjs
 */
export type ForumRole = 'ADMIN' | 'TRAINER' | 'MEMBER';

export const LIMITS = {
  TITLE_MIN: 5, TITLE_MAX: 200, BODY_MIN: 10, BODY_MAX: 10000,
  REPLY_MIN: 2, REPLY_MAX: 5000, REASON_MIN: 5, REASON_MAX: 255,
} as const;

// Ký tự điều khiển (trừ \n, \t) và ký tự vô hình hay dính khi dán từ Messenger / Word.
// eslint-disable-next-line no-control-regex
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\uFEFF]/g;
const HAS_TEXT = /[\p{L}\p{N}]/u;

/** Giống ForumService.clean: NFC, bỏ ký tự vô hình, bỏ khoảng trắng cuối dòng, gộp quá 2 dòng trống, trim. */
export function cleanText(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(INVISIBLE, '')
    .replace(/[ \t]+(?=\n)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Một dòng: mọi khoảng trắng liền nhau gộp thành một dấu cách (tiêu đề, lý do). */
export const cleanLine = (s: string | null | undefined) => cleanText(s).replace(/\s+/g, ' ');

/** Đếm theo ký tự thật (emoji 1 ký tự), khớp codePointCount bên Java. */
export const charCount = (s: string) => Array.from(s).length;

function check(v: string, min: number, max: number, empty: string, range: string, noText: string): string | null {
  if (!v) return empty;
  const n = charCount(v);
  if (n < min || n > max) return range;
  if (!HAS_TEXT.test(v)) return noText;
  return null;
}

export function validateTopic(f: { title: string; body: string }): Record<string, string> {
  const v: Record<string, string> = {};
  const title = check(cleanLine(f.title), LIMITS.TITLE_MIN, LIMITS.TITLE_MAX,
    'Vui lòng nhập tiêu đề', 'Tiêu đề từ 5 đến 200 ký tự', 'Tiêu đề cần có chữ hoặc số');
  const body = check(cleanText(f.body), LIMITS.BODY_MIN, LIMITS.BODY_MAX,
    'Vui lòng nhập nội dung', 'Nội dung từ 10 đến 10.000 ký tự', 'Nội dung cần có chữ hoặc số');
  if (title) v.title = title;
  if (body) v.body = body;
  return v;
}

export const validateReply = (text: string) => check(cleanText(text), LIMITS.REPLY_MIN, LIMITS.REPLY_MAX,
  'Vui lòng nhập nội dung trả lời', 'Trả lời từ 2 đến 5.000 ký tự', 'Trả lời cần có chữ hoặc số');

export const validateReason = (text: string) => check(cleanLine(text), LIMITS.REASON_MIN, LIMITS.REASON_MAX,
  'Vui lòng ghi lý do', 'Lý do từ 5 đến 255 ký tự', 'Lý do cần có chữ hoặc số');

export type ReplyBlock = 'guest' | 'expired' | 'hidden' | 'locked' | null;

/**
 * Ai được trả lời: đã đăng nhập (và máy chủ cũng nhận ra phiên), chủ đề không bị ẩn,
 * chủ đề khoá thì chỉ HLV / quản lý. Trả về lý do bị chặn để hiện đúng thông báo.
 */
export function replyBlock(viewerRole: ForumRole | null | undefined,
  topic: { hidden: boolean; locked: boolean; canModerate: boolean; viewerSignedIn?: boolean }): ReplyBlock {
  if (!viewerRole) return 'guest';
  if (topic.viewerSignedIn === false) return 'expired';
  if (topic.hidden) return 'hidden';
  if (topic.locked && !topic.canModerate) return 'locked';
  return null;
}

/** HLV kiểm duyệt bài hội viên và HLV khác; bài của quản lý chỉ quản lý kiểm duyệt (khớp guardModeration). */
export const canModerateAuthor = (viewerRole: ForumRole | null | undefined, authorRole: ForumRole) =>
  viewerRole === 'ADMIN' || (viewerRole === 'TRAINER' && authorRole !== 'ADMIN');

/** Sửa trả lời của mình: không khi bài bị ẩn, chủ đề bị ẩn, hoặc chủ đề khoá (trừ nhân viên). */
export const canEditReply = (r: { mine: boolean; hidden: boolean },
  topic: { hidden: boolean; locked: boolean; canModerate: boolean }) =>
  r.mine && !r.hidden && !topic.hidden && (!topic.locked || topic.canModerate);
