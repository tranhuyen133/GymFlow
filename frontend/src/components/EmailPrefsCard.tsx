/** V55 · Thẻ "Email từ GymFlow" trong Hồ sơ › Bảo mật & Cài đặt: bật/tắt từng loại email tự động. */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { EMAIL_KIND_DESC, EMAIL_KIND_LABEL, type EmailKind, type EmailPrefs } from '../api/engagementTypes';
import { t, useLang } from '../i18n';
import { errMsg } from '../lib/hooks';
import { useToast } from './Toast';
import { Alert, Badge, Card, LoadingBlock } from './ui';
import './email.css';

export function EmailToggle({ kind, on, busy, onChange }: { kind: EmailKind; on: boolean; busy?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`email-toggle${on ? ' on' : ''}`}>
      <span className="grow">
        <b>{t(EMAIL_KIND_LABEL[kind])}</b>
        <span className="tiny muted">{t(EMAIL_KIND_DESC[kind])}</span>
      </span>
      <input type="checkbox" role="switch" checked={on} disabled={busy} aria-checked={on}
        onChange={(e) => onChange(e.target.checked)} />
      <span className="email-switch" aria-hidden />
    </label>
  );
}

export function EmailPrefsCard() {
  const toast = useToast();
  const { lang } = useLang();
  const [data, setData] = useState<EmailPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<EmailKind | null>(null);

  useEffect(() => {
    let alive = true;
    api.get<EmailPrefs>('/me/email-prefs').then((d) => { if (alive) setData(d); }).catch((e) => { if (alive) setError(errMsg(e)); });
    return () => { alive = false; };
  }, []);

  // Ngôn ngữ email theo ngôn ngữ giao diện: lệch thì cập nhật ngay
  useEffect(() => {
    if (data && data.locale !== lang) {
      void api.put<EmailPrefs>('/me/locale', { locale: lang }).then(setData).catch(() => undefined);
    }
  }, [data, lang]);

  const change = async (kind: EmailKind, on: boolean) => {
    if (!data) return;
    setBusy(kind);
    try {
      setData(await api.put<EmailPrefs>('/me/email-prefs', { prefs: { [kind]: on } }));
      toast.success(on ? t('Đã bật “{name}”', { name: t(EMAIL_KIND_LABEL[kind]) }) : t('Đã tắt “{name}”', { name: t(EMAIL_KIND_LABEL[kind]) }));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const kinds = data ? (Object.keys(data.prefs) as EmailKind[]) : [];
  return (
    <Card title={t('Email từ GymFlow')} icon="mail" actions={data && <Badge tone="muted">{data.locale === 'en' ? 'English' : 'Tiếng Việt'}</Badge>}>
      {error ? <Alert kind="error">{error}</Alert> : !data ? <LoadingBlock rows={3} /> : (
        <div className="stack" style={{ gap: 10 }}>
          {kinds.length === 0 ? (
            <p className="small muted" style={{ margin: 0 }}>{t('Tài khoản quản lý không nhận email tự động. Xem và gửi thử các mẫu email ở mục Email tự động.')}</p>
          ) : kinds.map((k) => <EmailToggle key={k} kind={k} on={!!data.prefs[k]} busy={busy === k} onChange={(v) => void change(k, v)} />)}
          <EmailToggle kind="SECURITY" on busy onChange={() => undefined} />
          <p className="tiny faint" style={{ margin: 0 }}>{t('Email gửi bằng ngôn ngữ bạn đang dùng trên web. Mỗi email đều có liên kết “Tắt loại email này” ở cuối thư.')}</p>
          {!data.mailConfigured && <Alert kind="warning">{t('Máy chủ chưa cấu hình gửi email (SMTP) nên hiện chưa gửi được email nào.')}</Alert>}
        </div>
      )}
    </Card>
  );
}
