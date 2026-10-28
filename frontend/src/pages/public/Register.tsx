import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { AuthShell, Notice, PasswordField, PasswordStrength, emailError, passwordError, usePublicForm } from './AuthUI';
import type { RegisterValues } from './contracts';
/** CHỦ FILE: Phương · SCRUM-145. */
export interface RegisterProps { onSubmit?: (values: RegisterValues) => Promise<void> }
export default function Register({ onSubmit }: RegisterProps) {
  const [values, setValues] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', acceptedPolicy: false });
  const [done, setDone] = useState(false);
  const state = usePublicForm();
  const change = (key: keyof typeof values, value: string | boolean) => setValues(previous => ({ ...previous, [key]: value }));
  return <AuthShell register><header className="gf-form-heading"><span className="gf-kicker">HỘI VIÊN MỚI</span><h1>Đăng ký hội viên</h1><p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></header>
    {done ? <Notice success>Tạo tài khoản thành công. <Link to="/login">Đăng nhập để tiếp tục</Link>.</Notice> :
    <form ref={state.form} className="gf-form" noValidate onSubmit={async event => {
      const valid = await state.submit(event, {
        fullName: values.fullName.trim() ? '' : 'Nhập họ và tên.',
        email: emailError(values.email),
        phone: !values.phone || /^\+?[\d\s()-]{9,20}$/.test(values.phone) ? '' : 'Nhập số điện thoại hợp lệ.',
        password: passwordError(values.password),
        confirmPassword: values.confirmPassword === values.password && values.confirmPassword ? '' : 'Mật khẩu nhập lại chưa khớp.',
        acceptedPolicy: values.acceptedPolicy ? '' : 'Bạn cần đồng ý với điều khoản và chính sách.',
      }, onSubmit && (() => onSubmit({ fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim() || undefined, password: values.password, acceptedPolicy: values.acceptedPolicy })));
      if (valid) { setValues(previous => ({ ...previous, password: '', confirmPassword: '' })); setDone(true); }
    }}>
      <Input label="Họ và tên" name="fullName" autoComplete="name" required maxLength={100} value={values.fullName} onChange={e => change('fullName', e.target.value)} error={state.errors.fullName} />
      <Input label="Email" name="email" type="email" autoComplete="email" required helper="Dùng để đăng nhập và khôi phục mật khẩu" value={values.email} onChange={e => change('email', e.target.value)} error={state.errors.email} />
      <Input label="Số điện thoại" name="phone" type="tel" autoComplete="tel" helper="Không bắt buộc — để liên hệ khi đổi lịch" value={values.phone} onChange={e => change('phone', e.target.value)} error={state.errors.phone} />
      <PasswordField label="Mật khẩu" name="password" autoComplete="new-password" required helper="Tối thiểu 8 ký tự, gồm chữ và số" value={values.password} onChange={e => change('password', e.target.value)} error={state.errors.password} />
      <PasswordStrength value={values.password} />
      <PasswordField label="Nhập lại mật khẩu" name="confirmPassword" autoComplete="new-password" required value={values.confirmPassword} onChange={e => change('confirmPassword', e.target.value)} error={state.errors.confirmPassword} />
      <label className="gf-consent"><input name="acceptedPolicy" type="checkbox" checked={values.acceptedPolicy} onChange={e => change('acceptedPolicy', e.target.checked)} aria-invalid={!!state.errors.acceptedPolicy} aria-describedby={state.errors.acceptedPolicy ? 'policy-error' : undefined} /><span>Tôi đồng ý với <Link to="/policy">Điều khoản sử dụng và Chính sách bảo mật</Link>.</span></label>
      {state.errors.acceptedPolicy && <span id="policy-error" role="alert" className="gf-field-error">{state.errors.acceptedPolicy}</span>}
      {state.message && <Notice>{state.message}</Notice>}
      <Button type="submit" loading={state.pending}>{state.pending ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</Button>
      <p className="gf-helper">Tài khoản tự đăng ký luôn là hội viên. Tài khoản huấn luyện viên và quản lý do phòng tập cấp.</p>
    </form>}
  </AuthShell>;
}
