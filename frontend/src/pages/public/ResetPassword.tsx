import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { AuthShell, Notice, PasswordField, PasswordStrength, passwordError, usePublicForm } from './AuthUI';
import type { ResetValues } from './contracts';
/** CHỦ FILE: Phương · SCRUM-146. */
export interface ResetPasswordProps { onSubmit?: (values: ResetValues) => Promise<void> }
export default function ResetPassword({ onSubmit }: ResetPasswordProps) {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const state = usePublicForm();
  return <AuthShell compact><header className="gf-form-heading"><span className="gf-kicker">BẢO MẬT TÀI KHOẢN</span><h1>Đặt mật khẩu mới</h1><p>Nhập mã đặt lại và mật khẩu mới của bạn.</p></header>
    {done ? <Notice success>Đã đổi mật khẩu. <Link to="/login">Đăng nhập lại</Link> để tiếp tục.</Notice> :
    <form ref={state.form} className="gf-form" noValidate onSubmit={async event => {
      const valid = await state.submit(event, { token: token.trim().length === 8 ? '' : 'Nhập mã đặt lại gồm 8 ký tự.', password: passwordError(password), confirmPassword: confirmPassword && confirmPassword === password ? '' : 'Mật khẩu nhập lại chưa khớp.' }, onSubmit && (() => onSubmit({ token: token.trim(), password })));
      if (valid) { setPassword(''); setConfirmPassword(''); setToken(''); setDone(true); }
    }}>
      <Input name="token" label="Mã đặt lại" autoComplete="one-time-code" required maxLength={8} value={token} onChange={e => setToken(e.target.value)} error={state.errors.token} helper="Mã có hiệu lực 30 phút và chỉ sử dụng một lần." />
      <PasswordField name="password" label="Mật khẩu mới" required autoComplete="new-password" helper="Tối thiểu 8 ký tự, gồm chữ và số" value={password} onChange={e => setPassword(e.target.value)} error={state.errors.password} />
      <PasswordStrength value={password} />
      <PasswordField name="confirmPassword" label="Nhập lại mật khẩu mới" required autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} error={state.errors.confirmPassword} />
      {state.message && <Notice>{state.message}</Notice>}
      <Button type="submit" loading={state.pending}>Đặt mật khẩu mới</Button>
    </form>}
    <Link to="/forgot-password">Yêu cầu mã mới</Link><Link to="/login">← Quay lại đăng nhập</Link>
  </AuthShell>;
}
