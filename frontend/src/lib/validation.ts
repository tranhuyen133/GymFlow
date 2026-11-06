/**
 * Kiểm tra dữ liệu ở các form phía hội viên (cân nặng, hồ sơ, đăng ký) để báo lỗi ngay khi nhập.
 * Giới hạn trùng với Dtos.java (WeightRequest, MemberSelfUpdateRequest, UpdateProfileRequest); server vẫn kiểm tra lại.
 * Mỗi hàm check* trả về thông báo lỗi tiếng Việt (Field tự dịch) hoặc undefined nếu hợp lệ.
 */
import { useEffect, useRef, useState } from 'react';
import { todayIso } from './format';

export const LIMITS = {
  weightKg: { min: 20, max: 300 },
  bodyFat: { min: 2, max: 70 },
  heightCm: { min: 80, max: 250 },
} as const;

const DECIMAL_RE = /^\d{1,3}([.,]\d{1,2})?$/;
/** Chữ cái (kể cả tiếng Việt có dấu), khoảng trắng, dấu chấm, nháy đơn, gạch nối. Không cho chữ số. Trùng Dtos.NAME_RULE. */
export const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const PHONE_RE = /^(0|\+84)\d{9,10}$/;

/** "62,5" và "62.5" đều được; chuỗi rỗng trả về null. */
export function toNumber(s: string): number | null {
  const v = s.trim();
  return v === '' ? null : Number(v.replace(',', '.'));
}

/** Số đo: sai định dạng (chữ, số âm, quá 2 chữ số thập phân) → "không hợp lệ"; đúng định dạng nhưng ngoài khoảng → nói rõ giới hạn. */
function measure(s: string, { min, max }: { min: number; max: number }, name: string, unit: string) {
  const v = s.trim();
  if (!DECIMAL_RE.test(v)) return `${name} không hợp lệ`;
  const n = toNumber(v) as number;
  if (n < min) return `${name} phải từ ${min}${unit} trở lên`;
  if (n > max) return `${name} không được vượt quá ${max}${unit}`;
  return undefined;
}

export function checkWeight(s: string) {
  if (!s.trim()) return 'Vui lòng nhập cân nặng';
  return measure(s, LIMITS.weightKg, 'Cân nặng', ' kg');
}

export function checkBodyFat(s: string) {
  return !s.trim() ? undefined : measure(s, LIMITS.bodyFat, '% mỡ cơ thể', '%');
}

export function checkHeight(s: string) {
  return !s.trim() ? undefined : measure(s, LIMITS.heightCm, 'Chiều cao', ' cm');
}

/** Ký tự chắc chắn sai (chữ cái, dấu trừ...) thì báo ngay khi gõ, không đợi ngừng gõ. */
export const NOT_NUMBER = (s: string) => /[^\d.,\s]/.test(s);
export const NOT_PHONE = (s: string) => /[^\d+\s]/.test(s);
export const HAS_DIGIT = (s: string) => /\d/.test(s);

export function checkRecordedDate(s: string) {
  if (!s) return 'Vui lòng chọn ngày';
  return s > todayIso() ? 'Không ghi cho ngày tương lai' : undefined;
}

export function checkFullName(s: string) {
  const v = s.trim();
  if (!v) return 'Vui lòng nhập họ tên';
  if (v.length < 2 || v.length > 100) return 'Họ tên từ 2 đến 100 ký tự';
  return NAME_RE.test(v) ? undefined : 'Họ tên chỉ gồm chữ cái và khoảng trắng';
}

export function checkPhone(s: string) {
  const v = s.trim();
  return !v || PHONE_RE.test(v) ? undefined : 'Số điện thoại không hợp lệ (VD: 0912345678)';
}

export function checkDateOfBirth(s: string) {
  if (!s) return undefined;
  if (s >= todayIso()) return 'Ngày sinh phải ở quá khứ';
  return s > '1900-01-01' ? undefined : 'Ngày sinh không hợp lệ';
}

type Rules<K extends string> = Record<K, (value: string) => string | undefined>;

/**
 * Báo lỗi ngay khi nhập, không đợi bấm Lưu:
 * - ký tự chắc chắn sai (theo `instant`, VD gõ chữ vào ô cân nặng): báo ngay lập tức;
 * - đang gõ số: kiểm tra sau khi ngừng gõ 0,6 giây (gõ "6" để thành "62" thì không bị báo lỗi giữa chừng);
 * - rời ô hoặc ô đang có lỗi: kiểm tra luôn, sửa đúng là lỗi tự mất.
 */
export function useLiveErrors<K extends string>(rules: Rules<K>, instant: Partial<Record<K, (value: string) => boolean>> = {}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const timers = useRef<Partial<Record<K, ReturnType<typeof setTimeout>>>>({});
  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach((x) => clearTimeout(x as ReturnType<typeof setTimeout>));
  }, []);

  const check = (k: K, value: string) => {
    clearTimeout(timers.current[k]);
    const msg = rules[k](value);
    setErrors((p) => {
      if (p[k] === msg) return p;
      const n = { ...p };
      if (msg) n[k] = msg; else delete n[k];
      return n;
    });
  };

  return {
    errors,
    setErrors,
    change: (k: K, value: string) => {
      clearTimeout(timers.current[k]);
      if (errors[k] || instant[k]?.(value)) check(k, value);
      else timers.current[k] = setTimeout(() => check(k, value), 600);
    },
    blur: (k: K, value: string) => check(k, value),
    /** Kiểm tra toàn bộ trước khi lưu; trả về true nếu hợp lệ. */
    validateAll: (values: Record<K, string>) => {
      const v: Record<string, string> = {};
      (Object.keys(rules) as K[]).forEach((k) => { clearTimeout(timers.current[k]); const msg = rules[k](values[k]); if (msg) v[k] = msg; });
      setErrors(v);
      return Object.keys(v).length === 0;
    },
  };
}

// ---------- Giáo án & bài tập (trùng Dtos.TITLE_RULE, REPS_RULE, TEXT_RULE, NAME_EN_RULE) ----------

/** Tên phải có ít nhất một chữ cái; được kèm số và dấu câu thường gặp. "12345" bị từ chối, "Full body 3 buổi/tuần" hợp lệ. */
export const TITLE_RE = /^(?=.*\p{L})[\p{L}\p{M}\d .,:;\/()+&#'’–-]+$/u;
/** Số lần: 10 · 10-12 · 45s */
export const REPS_RE = /^\d{1,3}(\s*-\s*\d{1,3})?\s*[sS]?$/;
/** Ô chữ tự do (dụng cụ, tên khác…): rỗng hoặc có chữ cái, không chỉ toàn số/ký hiệu. */
export const TEXT_RE = /^$|\p{L}/u;
export const NAME_EN_RE = /^$|^[A-Za-z][A-Za-z0-9 ()'’\/,.&+-]*$/;

function checkTitle(s: string, what: string, min: number, max: number, example: string) {
  const v = s.trim().replace(/\s+/g, ' ');
  if (!v) return `Vui lòng nhập tên ${what}`;
  if (v.length < min || v.length > max) return `Tên ${what} từ ${min} đến ${max} ký tự`;
  return TITLE_RE.test(v) ? undefined : `Tên ${what} phải có chữ cái (có thể kèm số), VD: ${example}`;
}
export const checkPlanName = (s: string) => checkTitle(s, 'giáo án', 3, 120, 'Full body 3 buổi/tuần');
export const checkExerciseName = (s: string) => checkTitle(s, 'bài tập', 2, 120, 'Squat thanh đòn');

export type ItemField = 'sets' | 'reps' | 'weightKg' | 'restSeconds' | 'durationMinutes';
type ItemLike = { sets: number; reps: string; weightKg: number | null; restSeconds: number | null; durationMinutes: number | null };

/** Lỗi của một dòng bài trong giáo án; object rỗng = hợp lệ. */
export function itemProblems(i: ItemLike): Partial<Record<ItemField, string>> {
  const p: Partial<Record<ItemField, string>> = {};
  if (!Number.isInteger(i.sets) || i.sets < 1 || i.sets > 20) p.sets = 'Số hiệp từ 1 đến 20';
  if (i.durationMinutes != null) {
    if (!Number.isInteger(i.durationMinutes) || i.durationMinutes < 1 || i.durationMinutes > 300) p.durationMinutes = 'Thời lượng từ 1 đến 300 phút';
  } else {
    const r = i.reps.trim();
    const m = r.match(/^(\d{1,3})(?:\s*-\s*(\d{1,3}))?/);
    if (!r) p.reps = 'Nhập số lần (VD: 10-12)';
    else if (!REPS_RE.test(r)) p.reps = 'Số lần ghi dạng 10, 10-12 hoặc 45s';
    else if (m && Number(m[1]) === 0) p.reps = 'Số lần phải lớn hơn 0';
    else if (m && m[2] && Number(m[2]) <= Number(m[1])) p.reps = 'Khoảng số lần: số đầu phải nhỏ hơn số sau (VD: 8-12)';
  }
  if (i.weightKg != null && (Number.isNaN(i.weightKg) || i.weightKg < 0 || i.weightKg > 500)) p.weightKg = 'Mức tạ từ 0 đến 500 kg';
  if (i.restSeconds != null && (!Number.isInteger(i.restSeconds) || i.restSeconds < 0 || i.restSeconds > 900)) p.restSeconds = 'Nghỉ từ 0 đến 900 giây';
  return p;
}

// ---------- Duyệt bài tập (trùng ExerciseChecklist.java) ----------

export const MIN_DESCRIPTION = 20;
export const MIN_STEPS = 2;
export const countSteps = (s: string | null | undefined) => (s ?? '').split('\n').filter((l) => l.trim()).length;

type Reviewable = {
  description: string | null; instructions: string | null; safetyNotes: string | null;
  location: string | null; goals: readonly string[]; sourceCount: number;
};
export interface CheckItem { id: string; label: string; ok: boolean; hint?: string }

/** Các điều kiện máy kiểm tra được; backend từ chối duyệt nếu còn mục nào chưa đạt. */
export function autoChecks(e: Reviewable): CheckItem[] {
  const desc = (e.description ?? '').trim().length;
  const steps = countSteps(e.instructions);
  return [
    { id: 'source', label: 'Có ít nhất 1 nguồn tham khảo', ok: e.sourceCount > 0, hint: 'Tab "Nguồn và giấy phép"' },
    { id: 'desc', label: `Mô tả ngắn từ ${MIN_DESCRIPTION} ký tự`, ok: desc >= MIN_DESCRIPTION, hint: `hiện ${desc} ký tự` },
    { id: 'steps', label: `Hướng dẫn từ ${MIN_STEPS} bước (mỗi bước một dòng)`, ok: steps >= MIN_STEPS, hint: `hiện ${steps} bước` },
    { id: 'safety', label: 'Có lưu ý an toàn', ok: !!(e.safetyNotes ?? '').trim() },
    { id: 'location', label: 'Đã chọn nơi tập', ok: !!e.location },
    { id: 'goals', label: 'Đã chọn mục tiêu', ok: e.goals.length > 0 },
  ];
}

/** Những việc chỉ người duyệt làm được: mở trang nguồn và đọc đối chiếu. */
export const MANUAL_CHECKS: CheckItem[] = [
  { id: 'match', label: 'Đã mở trang nguồn và nội dung khớp với nguồn', ok: false },
  { id: 'numbers', label: 'Không có số liệu (liều, số lần, calo…) mà nguồn không nêu', ok: false },
  { id: 'own', label: 'Nội dung tự viết lại, không chép nguyên văn nguồn có bản quyền', ok: false },
];

type ExerciseFields = { name: string; nameEn: string; aliases: string; equipment: string; secondaryMuscles: string; videoUrl: string; goals: readonly string[]; sourceIds: readonly number[] };

/** Lỗi theo ô của form bài tập; trùng ràng buộc của Dtos.ExerciseRequest. */
export function exerciseFieldErrors(f: ExerciseFields): Record<string, string> {
  const v: Record<string, string> = {};
  const nameErr = checkExerciseName(f.name);
  if (nameErr) v.name = nameErr;
  if (!NAME_EN_RE.test(f.nameEn.trim())) v.nameEn = 'Tên tiếng Anh chỉ gồm chữ không dấu, số và khoảng trắng, bắt đầu bằng chữ';
  if (!TEXT_RE.test(f.aliases.trim())) v.aliases = 'Tên gọi khác phải có chữ';
  if (!TEXT_RE.test(f.equipment.trim())) v.equipment = 'Dụng cụ phải có chữ, VD: Tạ đơn';
  if (!TEXT_RE.test(f.secondaryMuscles.trim())) v.secondaryMuscles = 'Cơ phụ trợ phải có chữ, VD: Mông, lưng dưới';
  const url = f.videoUrl.trim();
  if (url && !/^https?:\/\/\S+\.\S+$/.test(url)) v.videoUrl = 'Link video phải là địa chỉ web đầy đủ, bắt đầu bằng http(s)://';
  if (f.goals.length > 5) v.goals = 'Tối đa 5 mục tiêu';
  if (f.sourceIds.length > 20) v.sourceIds = 'Tối đa 20 nguồn';
  return v;
}
