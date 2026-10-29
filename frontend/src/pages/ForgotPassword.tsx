import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { ForgotPasswordResponse, MessageResponse } from '../api/types';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { Alert, Button, Field, Input, PasswordInput } from '../components/ui';
import { errMsg, fieldErrs } from '../lib/hooks';
import { AuthArt } from './Login';
import { ThemeToggle } from '../theme/ThemeToggle';
import { t } from '../i18n';
import { focusFormError, validateReset } from './publicForm';

export default function ForgotPassword() {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const showErrors = (fields: Record<string, string>) => {
    setErrors(fields);
    requestAnimationFrame(() => focusFormError(formRef.current, fields));
  };

  const request = async (e: FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return;
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { showErrors({ email: 'Email không hợp lệ' }); return; }
    inFlight.current = true;
    setBusy(true); setError(null); setErrors({});
    try {
      const res = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email: email.trim() });
      setDemoToken(res.resetToken);
      setMinutes(res.validMinutes);
      setToken(res.resetToken ?? '');
      setPw(''); setPw2('');
      setStep(2);
      toast.info(res.message);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('[name="token"]')?.focus());
    } catch (err) { setError(errMsg(err)); showErrors(fieldErrs(err)); } finally { inFlight.current = false; setBusy(false); }
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return;
    setError(null);
    const v = validateReset(token, pw, pw2);
    showErrors(v);
    if (Object.keys(v).length) return;
    inFlight.current = true;
    setBusy(true); setError(null);
    try {
      const res = await api.post<MessageResponse>('/auth/reset-password', { token: token.trim(), newPassword: pw });
      toast.success(res.message);
      navigate('/login');
    } catch (err) { setError(errMsg(err)); showErrors(fieldErrs(err)); } finally { inFlight.current = false; setBusy(false); }
  };

  return (
    <div className="auth">
      <AuthArt />
      <div className="auth-form">
        <ThemeToggle className="auth-theme" />
        <div className="box stack page">
          <Link to="/login" className="link small row" style={{ gap: 6 }}><Icon name="arrowLeft" size={15} />{t('Quay lại đăng nhập')}</Link>
          <div>
            <h2>{t(step === 1 ? 'Quên mật khẩu' : 'Đặt mật khẩu mới')}</h2>
            <p className="muted mt-8">{step === 1 ? t('Nhập email tài khoản, hệ thống sẽ gửi mã khôi phục.') : t('Mã có hiệu lực trong {n} phút và chỉ dùng được một lần.', { n: minutes })}</p>
          </div>
          {error && <Alert kind="error">{error}</Alert>}
          {step === 1 ? (
            <form ref={formRef} className="stack" onSubmit={request} noValidate>
              <Field htmlFor="recovery-email" label="Email" error={errors.email} required>
                <Input id="recovery-email" name="email" required autoComplete="email" aria-describedby={errors.email ? 'recovery-email-error' : ''} type="email" value={email} invalid={!!errors.email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@gymflow.vn" />
              </Field>
              <Button type="submit" variant="primary" size="lg" block loading={busy}>Gửi mã khôi phục</Button>
            </form>
          ) : (
            <form ref={formRef} className="stack" onSubmit={reset} noValidate>
              {demoToken && <Alert kind="info">{t('Chế độ demo (chưa gửi email thật): mã của bạn là')} <b className="num" style={{ letterSpacing: 2 }}>{demoToken}</b></Alert>}
              <Field htmlFor="recovery-token" label="Mã khôi phục" error={errors.token} required>
                <Input id="recovery-token" name="token" required autoComplete="one-time-code" aria-describedby={errors.token ? 'recovery-token-error' : ''} value={token} invalid={!!errors.token} onChange={(e) => setToken(e.target.value.toUpperCase())} placeholder="VD: K7M2QX9A" style={{ letterSpacing: 2 }} />
              </Field>
              <Field htmlFor="recovery-password" label="Mật khẩu mới" error={errors.newPassword} hint="Tối thiểu 8 ký tự, gồm chữ và số" required>
                <PasswordInput id="recovery-password" name="newPassword" required aria-describedby={errors.newPassword ? 'recovery-password-error' : 'recovery-password-hint'} value={pw} invalid={!!errors.newPassword} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
              </Field>
              <Field htmlFor="recovery-confirm" label="Nhập lại mật khẩu" error={errors.confirm} required>
                <PasswordInput id="recovery-confirm" name="confirm" required aria-describedby={errors.confirm ? 'recovery-confirm-error' : ''} value={pw2} invalid={!!errors.confirm} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
              </Field>
              <Button type="submit" variant="primary" size="lg" block loading={busy}>Đặt lại mật khẩu</Button>
              <Button variant="ghost" disabled={busy} onClick={() => {
                setToken(''); setDemoToken(null); setPw(''); setPw2('');
                setErrors({}); setError(null); setStep(1);
                requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('[name="email"]')?.focus());
              }}>Gửi lại mã</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
