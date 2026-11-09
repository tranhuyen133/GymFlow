import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { AuthMessageResponse } from '../api/types';
import { Icon } from '../components/Icon';
import { Alert, Button, Field, Input } from '../components/ui';
import { errMsg, fieldErrs } from '../lib/hooks';
import { AuthArt } from './Login';
import { ThemeToggle } from '../theme/ThemeToggle';
import { t } from '../i18n';
import { EMAIL_RE } from '../lib/format';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    setError(null); setInfo(null); setFieldErrors({});
    const fields: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) fields.email = 'Email không hợp lệ';
    if (!/^\d{6}$/.test(code)) fields.code = 'Mã OTP gồm 6 chữ số';
    if (Object.keys(fields).length) { setFieldErrors(fields); return; }
    setBusy(true);
    try {
      await api.post<AuthMessageResponse>('/auth/verify-email', { email: email.trim(), code });
      navigate('/login', { replace: true, state: { registered: email.trim() } });
    } catch (e) {
      setError(errMsg(e));
      setFieldErrors(fieldErrs(e));
    } finally { setBusy(false); }
  };

  const resend = async () => {
    setError(null); setInfo(null); setFieldErrors({});
    if (!EMAIL_RE.test(email.trim())) { setFieldErrors({ email: 'Nhập email hợp lệ để gửi mã OTP' }); return; }
    setBusy(true);
    try {
      const result = await api.post<AuthMessageResponse>('/auth/resend-verification', { email: email.trim() });
      setInfo(result.message);
    } catch (e) { setError(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <AuthArt />
      <div className="auth-form">
        <ThemeToggle className="auth-theme" />
        <form className="box stack page" onSubmit={verify} noValidate>
          <Link to="/login" className="link small row" style={{ gap: 6 }}><Icon name="arrowLeft" size={15} />{t('Quay lại đăng nhập')}</Link>
          <div>
            <div className="kicker">Bảo mật tài khoản</div>
            <h2>Xác thực email</h2>
            <p className="muted mt-8">Nhập mã OTP 6 chữ số đã gửi tới email để kích hoạt tài khoản.</p>
          </div>
          {error && <Alert kind="error">{error}</Alert>}
          {info && <Alert kind="info">{info}</Alert>}
          <Field htmlFor="verify-email" label="Email" error={fieldErrors.email} required>
            <Input id="verify-email" name="email" type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} invalid={!!fieldErrors.email} />
          </Field>
          <Field htmlFor="verify-code" label="Mã OTP" error={fieldErrors.code} required>
            <Input id="verify-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" invalid={!!fieldErrors.code} style={{ letterSpacing: 3 }} />
          </Field>
          <Button type="submit" variant="primary" size="lg" block loading={busy}>Xác thực email</Button>
          <Button type="button" variant="ghost" block disabled={busy} onClick={() => void resend()}>Gửi lại mã OTP</Button>
        </form>
      </div>
    </div>
  );
}
