/**
 * V55 · Trang mở từ liên kết "Tắt loại email này" ở chân email – không cần đăng nhập.
 * Không tự tắt khi vừa mở trang (trình quét liên kết của hộp thư có thể mở trước), người nhận bấm nút mới tắt.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { EMAIL_KIND_LABEL, type EmailKind, type UnsubscribeInfo } from '../api/engagementTypes';
import { BrandMark } from '../components/Brand';
import { EmailToggle } from '../components/EmailPrefsCard';
import { Icon } from '../components/Icon';
import { Alert, Button, LoadingBlock } from '../components/ui';
import { t, useLang } from '../i18n';
import { errMsg } from '../lib/hooks';
import '../components/email.css';

const KINDS: EmailKind[] = ['RENEWAL', 'BIRTHDAY', 'SESSION_REMINDER', 'WEEKLY_DIGEST', 'TRAINER_REPORT', 'RETENTION', 'ACHIEVEMENT'];

export default function EmailUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const kindParam = (params.get('kind') ?? '').toUpperCase() as EmailKind;
  const kind = KINDS.includes(kindParam) ? kindParam : null;
  const { lang, setLang } = useLang();
  const [info, setInfo] = useState<UnsubscribeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!/^[0-9a-f]{64}$/.test(token)) { setError(t('Liên kết không hợp lệ. Hãy mở lại liên kết ở cuối email.')); return; }
    api.get<UnsubscribeInfo>(`/email/unsubscribe/${token}`)
      .then((d) => { setInfo(d); if (d.locale !== lang) setLang(d.locale); })
      .catch((e) => setError(errMsg(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const turnOff = async (k: EmailKind | null) => {
    setBusy(true);
    try {
      const d = await api.post<UnsubscribeInfo>(`/email/unsubscribe/${token}${k ? `?kind=${k}` : ''}`);
      setInfo(d);
      setDone(k ? t('Đã tắt “{name}”. Bạn sẽ không nhận loại email này nữa.', { name: t(EMAIL_KIND_LABEL[k]) }) : t('Đã tắt mọi email tự động. Email mã xác thực / đặt lại mật khẩu vẫn gửi khi bạn yêu cầu.'));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (k: EmailKind, on: boolean) => {
    setBusy(true);
    try {
      setInfo(await api.put<UnsubscribeInfo>(`/email/unsubscribe/${token}`, { prefs: { [k]: on } }));
      setDone(on ? t('Đã bật “{name}”', { name: t(EMAIL_KIND_LABEL[k]) }) : t('Đã tắt “{name}”', { name: t(EMAIL_KIND_LABEL[k]) }));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const kinds = info ? (Object.keys(info.prefs) as EmailKind[]) : [];
  const anyOn = kinds.some((k) => info?.prefs[k]);
  return (
    <div className="unsub-page">
      <div className="unsub-card">
        <div className="unsub-head">
          <Link to="/" aria-label="GymFlow"><BrandMark size={30} /></Link>
          <span className="tiny" style={{ color: '#9aa1b1', textTransform: 'uppercase', letterSpacing: '.8px' }}>{t('Tuỳ chọn email')}</span>
        </div>
        <div className="unsub-bar" />
        <div className="unsub-body">
          {error ? <Alert kind="error">{error}</Alert> : !info ? <LoadingBlock rows={4} /> : (
            <>
              <h1>{info.fullName ? t('Chào {name},', { name: info.fullName }) : t('Tuỳ chọn email')}</h1>
              <p className="muted" style={{ margin: 0 }}>{t('Chọn email GymFlow gửi tới {email}.', { email: info.maskedEmail })}</p>
              {done && <div className="unsub-done"><Icon name="checkCircle" size={18} /><span className="small">{done}</span></div>}
              {kind && info.prefs[kind] && (
                <Button variant="primary" block loading={busy} onClick={() => void turnOff(kind)}>
                  {t('Tắt “{name}”', { name: t(EMAIL_KIND_LABEL[kind]) })}
                </Button>
              )}
              <div className="stack" style={{ gap: 8 }}>
                {kinds.map((k) => <EmailToggle key={k} kind={k} on={!!info.prefs[k]} busy={busy} onChange={(v) => void toggle(k, v)} />)}
              </div>
              {anyOn && <Button variant="ghost" block disabled={busy} onClick={() => void turnOff(null)}>{t('Tắt tất cả email tự động')}</Button>}
              <p className="tiny faint" style={{ margin: 0 }}>{t('Email mã xác thực và đặt lại mật khẩu luôn được gửi khi bạn yêu cầu. Đăng nhập rồi vào Hồ sơ › Bảo mật & Cài đặt để đổi lại bất cứ lúc nào.')}</p>
            </>
          )}
          <Link to="/login" className="btn btn-secondary btn-sm" style={{ justifySelf: 'start' }}><span>{t('Đăng nhập GymFlow')}</span></Link>
        </div>
      </div>
    </div>
  );
}
