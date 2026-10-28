import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { AuthShell, Notice, emailError, usePublicForm } from './AuthUI';
/** CHỦ FILE: Phương · SCRUM-146. */
export interface ForgotPasswordProps { onSubmit?: (values: { email: string }) => Promise<void> }
export default function ForgotPassword({ onSubmit }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const state = usePublicForm();
  return <AuthShell compact><header className="gf-form-heading"><span className="gf-kicker">KHÔI PHỤC TÀI KHOẢN</span><h1>Quên mật khẩu</h1><p>Nhập email đã đăng ký để yêu cầu mã đặt lại mật khẩu. Mã chỉ sử dụng một lần.</p></header>
    <form ref={state.form} className="gf-form" noValidate onSubmit={async event => {
      setSent(false);
      if (await state.submit(event, { email: emailError(email) }, onSubmit && (() => onSubmit({ email: email.trim() })))) setSent(true);
    }}>
      <Input name="email" label="Email" type="email" autoComplete="email" required value={email} onChange={e => { setEmail(e.target.value); setSent(false); }} error={state.errors.email} />
      {state.message && <Notice>{state.message}</Notice>}
      <Button type="submit" loading={state.pending}>Yêu cầu đặt lại mật khẩu</Button>
      {sent && <Notice success>Nếu email tồn tại, yêu cầu đã được tiếp nhận. Vui lòng kiểm tra hướng dẫn khôi phục tài khoản.</Notice>}
    </form><Link to="/reset-password">Đã có mã đặt lại mật khẩu?</Link><Link to="/login">← Quay lại đăng nhập</Link>
  </AuthShell>;
}
