/** Helpers cho SCRUM-144, 145, 146. Không thay thế validation hoặc phân quyền phía server. */
import type { Role } from '../api/types';

export function publicPlanAction(role?: Role) {
  if (!role) return { to: '/register', label: 'Đăng ký để chọn gói' };
  if (role === 'MEMBER') return { to: '/me/packages', label: 'Xem gói của tôi' };
  return { to: '/dashboard', label: 'Vào trang của tôi' };
}

export function focusFormError(form: HTMLFormElement | null, errors: Record<string, string>) {
  if (!form) return;
  // Duyệt theo thứ tự trên form, bỏ qua các tên trường lạ do API trả về.
  const control = Array.from(form.elements).find((element) =>
    element instanceof HTMLElement && errors[element.getAttribute('name') ?? ''] && !element.hasAttribute('disabled'));
  if (control instanceof HTMLElement) control.focus();
}

export function validateReset(token: string, password: string, confirm: string) {
  const errors: Record<string, string> = {};
  if (token.trim().length !== 8) errors.token = 'Nhập mã khôi phục gồm 8 ký tự';
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(password)) errors.newPassword = 'Tối thiểu 8 ký tự, gồm cả chữ và số';
  if (!confirm || password !== confirm) errors.confirm = 'Mật khẩu nhập lại không khớp';
  return errors;
}
