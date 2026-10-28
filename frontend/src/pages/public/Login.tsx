import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { AuthShell, Notice, PasswordField, usePublicForm } from './AuthUI';
import type { LoginValues } from './contracts';
/** CHỦ FILE: Phương · SCRUM-145. onSubmit do route nối với api/auth.ts + AuthContext. */
export interface LoginProps { onSubmit?: (values: LoginValues) => Promise<void> }
export default function Login({ onSubmit }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const state = usePublicForm();
  return <AuthShell><header className="gf-form-heading"><span className="gf-kicker">HỘI VIÊN & NHÂN VIÊN</span><h1>Đăng nhập</h1><p>Chào mừng trở lại! Đăng nhập để xem lịch tập và tiến độ của bạn.</p></header>
    <form ref={state.form} className="gf-form" noValidate onSubmit={event => void state.submit(event, { username: username.trim() ? '' : 'Nhập email hoặc tên đăng nhập.', password: password ? '' : 'Nhập mật khẩu.' }, onSubmit && (() => onSubmit({ username: username.trim(), password })))}>
      <Input label="Email hoặc tên đăng nhập" name="username" autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} error={state.errors.username} />
      <PasswordField label="Mật khẩu" name="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} error={state.errors.password} />
      <Link to="/forgot-password" className="gf-form-end">Quên mật khẩu?</Link>
      {state.message && <Notice>{state.message}</Notice>}
      <Button type="submit" loading={state.pending}>{state.pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</Button>
    </form><p className="gf-form-footer">Chưa có tài khoản? <Link to="/register">Đăng ký hội viên</Link></p>
  </AuthShell>;
}
