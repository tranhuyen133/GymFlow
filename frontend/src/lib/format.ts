import type { ArticleCategory, ArticleStatus, ExerciseGoal, ExerciseLocation, Gender, Level, MemberStatus, MuscleGroup, PackageRequestStatus, PlanStatus, ReviewStatus, Role, ScheduleStatus, SubscriptionState, UserStatus } from '../api/types';
import { getLang, locale, t } from '../i18n';
import { ACTION_EN } from '../i18n/en';
import { localizeExercise } from './exercise';

export type Tone = 'green' | 'blue' | 'violet' | 'amber' | 'red' | 'muted';

export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const roleLabel_VI: Record<Role, string> = { ADMIN: 'Quản lý', TRAINER: 'Huấn luyện viên', MEMBER: 'Hội viên' };
const roleLabel_EN: Record<Role, string> = { ADMIN: 'Manager', TRAINER: 'Trainer', MEMBER: 'Member' };
const genderLabel_VI: Record<Gender, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
const memberStatus_VI: Record<MemberStatus, [string, Tone]> = {
  ACTIVE: ['Hoạt động', 'green'], PAUSED: ['Bảo lưu', 'amber'], INACTIVE: ['Ngừng', 'muted'],
};
const userStatus_VI: Record<UserStatus, [string, Tone]> = { ACTIVE: ['Đang mở', 'green'], LOCKED: ['Đã khoá', 'red'] };
const subState_VI: Record<SubscriptionState, [string, Tone]> = {
  UPCOMING: ['Sắp bắt đầu', 'blue'], ACTIVE: ['Còn hiệu lực', 'green'], EXPIRING: ['Sắp hết hạn', 'amber'],
  EXPIRED: ['Hết hạn', 'red'], CANCELLED: ['Đã huỷ', 'muted'],
};
const packageRequestStatus_VI: Record<PackageRequestStatus, [string, Tone]> = {
  PENDING: ['Chờ xác nhận', 'amber'], APPROVED: ['Đã duyệt', 'green'], REJECTED: ['Bị từ chối', 'red'], CANCELLED: ['Đã huỷ', 'muted'],
};
const scheduleStatus_VI: Record<ScheduleStatus, [string, Tone]> = {
  SCHEDULED: ['Đã lên lịch', 'blue'], COMPLETED: ['Hoàn thành', 'green'], MISSED: ['Vắng', 'red'], CANCELLED: ['Đã huỷ', 'muted'],
};
const planStatus_VI: Record<PlanStatus, [string, Tone]> = {
  ACTIVE: ['Đang áp dụng', 'green'], COMPLETED: ['Hoàn thành', 'blue'], ARCHIVED: ['Lưu trữ', 'muted'],
};
const muscleLabel_VI: Record<MuscleGroup, string> = {
  CHEST: 'Ngực', BACK: 'Lưng', LEGS: 'Chân', SHOULDERS: 'Vai', ARMS: 'Tay', CORE: 'Bụng – core', CARDIO: 'Cardio', FULL_BODY: 'Toàn thân',
};
export const muscleColor: Record<MuscleGroup, string> = {
  CHEST: '#ff6b61', BACK: '#3d97ff', LEGS: '#00d95b', SHOULDERS: '#ffb020', ARMS: '#8b7cff', CORE: '#00c2ff', CARDIO: '#ff4fa3', FULL_BODY: '#c4f04a',
};
const levelLabel_VI: Record<Level, [string, Tone]> = {
  BEGINNER: ['Cơ bản', 'green'], INTERMEDIATE: ['Trung cấp', 'blue'], ADVANCED: ['Nâng cao', 'violet'],
};
const reviewLabel_VI: Record<ReviewStatus, [string, Tone]> = {
  DRAFT: ['Bản nháp', 'muted'], PENDING: ['Chờ duyệt', 'amber'], APPROVED: ['Đã duyệt', 'green'], NEEDS_REVIEW: ['Cần chỉnh sửa', 'red'],
};
const locationLabel_VI: Record<ExerciseLocation, string> = { GYM: 'Phòng tập', HOME: 'Tại nhà', ANY: 'Ở đâu cũng được' };
const goalLabel_VI: Record<ExerciseGoal, string> = {
  STRENGTH: 'Sức mạnh', ENDURANCE: 'Sức bền', MOBILITY: 'Linh hoạt', BALANCE: 'Thăng bằng', FAT_LOSS: 'Giảm mỡ',
  HYPERTROPHY: 'Tăng cơ (phì đại)', TONE: 'Săn chắc',
};
const articleCategoryLabel_VI: Record<ArticleCategory, string> = {
  NUTRITION: 'Dinh dưỡng', HYDRATION: 'Nước uống', SLEEP: 'Giấc ngủ', ACTIVITY: 'Vận động', RECOVERY: 'Hồi phục',
  TRAINING_GUIDE: 'Hướng dẫn tập luyện',
};
const articleStatusLabel_VI: Record<ArticleStatus, [string, Tone]> = {
  DRAFT: ['Bản nháp', 'muted'], PENDING: ['Chờ duyệt', 'amber'], PUBLISHED: ['Đã xuất bản', 'green'], ARCHIVED: ['Đã gỡ', 'muted'],
};
const DAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_NAMES_VI = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];

const actionLabel_VI: Record<string, string> = {
  LOGIN: 'Đăng nhập', LOGIN_FAILED: 'Đăng nhập thất bại', PASSWORD_CHANGE: 'Đổi mật khẩu', PASSWORD_RESET_REQUEST: 'Yêu cầu khôi phục',
  PASSWORD_RESET: 'Đặt lại mật khẩu', PROFILE_UPDATE: 'Sửa hồ sơ', AVATAR_UPDATE: 'Đổi ảnh đại diện', AVATAR_DELETE: 'Xoá ảnh đại diện', USER_CREATE: 'Tạo tài khoản', USER_LOCK: 'Khoá tài khoản',
  USER_UNLOCK: 'Mở khoá tài khoản', USER_RESET_PASSWORD: 'Cấp mật khẩu tạm', MEMBER_CREATE: 'Thêm hội viên', MEMBER_UPDATE: 'Sửa hội viên',
  MEMBER_SELF_UPDATE: 'Hội viên sửa hồ sơ', MEMBER_STATUS: 'Đổi trạng thái hội viên', MEMBER_ASSIGN_TRAINER: 'Phân công HLV',
  TRAINER_CREATE: 'Thêm HLV', TRAINER_UPDATE: 'Sửa HLV', TRAINER_ACTIVATE: 'Kích hoạt HLV', TRAINER_DEACTIVATE: 'Ngừng HLV', TRAINER_SHIFTS: 'Cập nhật ca làm',
  MEMBER_TIME_PREFS: 'Hội viên cập nhật giờ tập', EXERCISE_REVIEW_BULK: 'Duyệt loạt bài tập',
  PLAN_CREATE: 'Thêm gói tập', PLAN_UPDATE: 'Sửa gói tập', PLAN_ACTIVATE: 'Mở bán gói', PLAN_DEACTIVATE: 'Ngừng bán gói', PLAN_DELETE: 'Xoá gói tập',
  SUBSCRIPTION_CREATE: 'Đăng ký gói', SUBSCRIPTION_RENEW: 'Gia hạn gói', SUBSCRIPTION_CANCEL: 'Huỷ gói',
  PACKAGE_REQUEST_CREATE: 'Hội viên gửi đơn đăng ký gói', PACKAGE_REQUEST_CANCEL: 'Hội viên huỷ đơn đăng ký gói',
  PACKAGE_REQUEST_APPROVE: 'Duyệt đơn đăng ký gói', PACKAGE_REQUEST_REJECT: 'Từ chối đơn đăng ký gói',
  PACKAGE_REQUEST_PAID: 'Hội viên báo đã chuyển khoản', PAYMENT_SETTINGS_UPDATE: 'Cập nhật tài khoản nhận tiền',
  PAYMENT_QR_UPDATE: 'Cập nhật mã QR ngân hàng', PAYMENT_QR_DELETE: 'Xoá mã QR ngân hàng',
  EXERCISE_CREATE: 'Thêm bài tập', EXERCISE_UPDATE: 'Sửa bài tập', EXERCISE_HIDE: 'Ẩn bài tập', EXERCISE_SHOW: 'Hiện bài tập', EXERCISE_DELETE: 'Xoá bài tập', EXERCISE_REVIEW: 'Duyệt bài tập',
  ARTICLE_CREATE: 'Soạn bài viết', ARTICLE_UPDATE: 'Sửa bài viết', ARTICLE_SUBMIT: 'Gửi duyệt bài viết', ARTICLE_APPROVE: 'Xuất bản bài viết',
  ARTICLE_REJECT: 'Trả bài viết về nháp', ARTICLE_ARCHIVE: 'Gỡ bài viết', ARTICLE_RESTORE: 'Khôi phục bài viết', ARTICLE_DELETE: 'Xoá bài viết',
  WORKOUT_PLAN_CREATE: 'Tạo giáo án', WORKOUT_PLAN_UPDATE: 'Sửa giáo án', WORKOUT_PLAN_STATUS: 'Đổi trạng thái giáo án', WORKOUT_PLAN_DELETE: 'Xoá giáo án',
  SCHEDULE_CREATE: 'Xếp lịch', SCHEDULE_UPDATE: 'Dời lịch', SCHEDULE_CANCEL: 'Huỷ buổi', SCHEDULE_MISSED: 'Đánh vắng', SCHEDULE_COMPLETE: 'Hoàn thành buổi',
  SCHEDULE_AUTO_MISSED: 'Tự đánh vắng', WEIGHT_CREATE: 'Ghi cân nặng', WEIGHT_UPDATE: 'Sửa cân nặng', WEIGHT_DELETE: 'Xoá cân nặng', SYSTEM_SEED: 'Khởi tạo dữ liệu',
  FORUM_HIDE: 'Ẩn bài diễn đàn', FORUM_SHOW: 'Hiện lại bài diễn đàn', FORUM_PIN: 'Ghim chủ đề', FORUM_UNPIN: 'Bỏ ghim chủ đề', FORUM_LOCK: 'Khoá chủ đề',
  FORUM_UNLOCK: 'Mở khoá chủ đề', FORUM_DELETE: 'Xoá bài diễn đàn', FORUM_REPORT: 'Báo cáo bài vi phạm', FORUM_REPORT_RESOLVE: 'Xử lý báo cáo vi phạm',
};

// ---------- Ngày giờ (backend trả giờ địa phương không kèm múi giờ) ----------
const pad = (n: number) => String(n).padStart(2, '0');
export const parseDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const parseDateTime = (s: string) => {
  const [date, time = '00:00:00'] = s.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm, ss] = time.split(':').map((x) => Number(x.slice(0, 2)));
  return new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
};
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toIsoDateTime = (d: Date) => `${toIsoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
export const todayIso = () => toIsoDate(new Date());
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const startOfWeek = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const dow = (x.getDay() + 6) % 7; return addDays(x, -dow); };
export const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const fmtDate = (s: string | null | undefined) => (s ? parseDate(s).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
export const fmtDateShort = (s: string) => parseDate(s).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' });
export const fmtTime = (s: string) => { const d = parseDateTime(s); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const fmtDateTime = (s: string | null | undefined) => {
  if (!s) return '—';
  const d = parseDateTime(s);
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${d.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
};
export const fmtWeekday = (s: string) => parseDateTime(s).toLocaleDateString(locale(), { weekday: 'long', day: '2-digit', month: '2-digit' });
export const relativeTime = (s: string) => {
  const diff = (Date.now() - parseDateTime(s).getTime()) / 1000;
  if (diff < 60) return t('vừa xong');
  if (diff < 3600) return t('{n} phút trước', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('{n} giờ trước', { n: Math.floor(diff / 3600) });
  if (diff < 86400 * 30) return t('{n} ngày trước', { n: Math.floor(diff / 86400) });
  return fmtDateTime(s);
};
export const age = (dob: string | null) => {
  if (!dob) return null;
  const d = parseDate(dob); const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a;
};

// ---------- Số ----------
export const fmtMoney = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString(locale()) + ' ₫');
export const fmtMoneyShort = (n: number) => {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + t(' tỷ');
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + t(' tr');
  if (Math.abs(n) >= 1e3) return Math.round(n / 1e3) + 'k';
  return String(n);
};
export const fmtNum = (n: number | null | undefined, digits = 0) => (n == null ? '—' : n.toLocaleString(locale(), { maximumFractionDigits: digits, minimumFractionDigits: 0 }));
export const pctChange = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 1000) / 10);
export const durationLabel = (days: number) => (days % 365 === 0 ? t('{n} năm', { n: days / 365 }) : days % 30 === 0 ? t('{n} tháng', { n: days / 30 }) : t('{n} ngày', { n: days }));
export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts.length > 1 ? parts[parts.length - 2][0] : '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};
export const hueOf = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

// ---------- Nhãn theo ngôn ngữ: đọc lúc hiển thị nên đổi ngôn ngữ là đổi theo ----------
function translated<T extends object>(raw: T): T {
  return new Proxy(raw, {
    get(target, prop, recv) {
      const v = Reflect.get(target, prop, recv) as unknown;
      if (typeof v === 'string') return t(v);
      if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'string') return [t(v[0]), v[1]];
      return v;
    },
  });
}
export const roleLabel: Record<Role, string> = new Proxy(roleLabel_VI, {
  get(target, prop: Role) {
    if (getLang() === 'en') return roleLabel_EN[prop] ?? target[prop];
    return target[prop];
  },
});
export const genderLabel = translated(genderLabel_VI);
export const memberStatus = translated(memberStatus_VI);
export const userStatus = translated(userStatus_VI);
export const subState = translated(subState_VI);
export const packageRequestStatus = translated(packageRequestStatus_VI);
export const scheduleStatus = translated(scheduleStatus_VI);
export const planStatus = translated(planStatus_VI);
export const muscleLabel = translated(muscleLabel_VI);
export const levelLabel = translated(levelLabel_VI);
export const reviewLabel = translated(reviewLabel_VI);
export const locationLabel = translated(locationLabel_VI);
export const goalLabel = translated(goalLabel_VI);
export const articleCategoryLabel = translated(articleCategoryLabel_VI);
export const articleStatusLabel = translated(articleStatusLabel_VI);
export const DAYS = translated(DAYS_VI);
export const DAY_NAMES = translated(DAY_NAMES_VI);
export const actionLabel: Record<string, string> = new Proxy(actionLabel_VI, {
  get(target, prop: string) {
    if (getLang() === 'en') return ACTION_EN[prop] ?? target[prop] ?? prop;
    return target[prop] ?? prop;
  },
});

/** Định dạng dụng cụ tập song ngữ: tra nguyên cụm hoặc tách phẩy dịch từng món */
export function formatEquipment(eq: string | null | undefined): string {
  if (!eq) return '';
  const trimmed = eq.trim();
  if (!trimmed) return '';
  const direct = t(trimmed);
  if (direct !== trimmed) return direct;
  return trimmed
    .split(',')
    .map((s) => t(s.trim()))
    .join(', ');
}

/** Tên chính của bài tập song ngữ: EN ưu tiên nameEn; VI giữ name */
export function exTitle(e: { name: string; nameEn?: string | null } | null | undefined): string {
  if (!e) return '';
  return localizeExercise(e, getLang()).title;
}

/** Tên phụ của bài tập: EN không hiện; VI hiện nameEn khi khác tên chính */
export function exSub(e: { name: string; nameEn?: string | null } | null | undefined): string | null {
  if (!e) return null;
  return localizeExercise(e, getLang()).subtitle;
}


