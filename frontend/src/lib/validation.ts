/**
 * Kiểm tra dữ liệu ở các form phía hội viên (cân nặng, hồ sơ, đăng ký) để báo lỗi ngay khi nhập.
 * Giới hạn trùng với Dtos.java (WeightRequest, MemberSelfUpdateRequest, UpdateProfileRequest); server vẫn kiểm tra lại.
 * Mỗi hàm check* trả về thông báo lỗi tiếng Việt (Field tự dịch) hoặc undefined nếu hợp lệ.
 */
import { useEffect, useRef, useState } from 'react';
import { EMAIL_RE, todayIso } from './format';

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

export const HAS_ACCENT_OR_SPACE = (s: string) => /[^\x21-\x7E]/.test(s);
export const EMAIL_INVALID_MSG = 'Email không hợp lệ (không dùng chữ có dấu hoặc khoảng trắng)';

/** Báo lỗi ngay lập tức khi đang gõ nếu phát hiện chữ có dấu hoặc khoảng trắng. */
export function checkEmailLive(s: string): string | undefined {
  if (HAS_ACCENT_OR_SPACE(s)) return EMAIL_INVALID_MSG;
  return undefined;
}

/** Kiểm tra toàn diện khi rời ô (onBlur) hoặc submit form. */
export function checkEmail(s: string): string | undefined {
  const v = s.trim();
  if (!v) return 'Vui lòng nhập email';
  if (HAS_ACCENT_OR_SPACE(s) || !EMAIL_RE.test(v)) return EMAIL_INVALID_MSG;
  return undefined;
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
