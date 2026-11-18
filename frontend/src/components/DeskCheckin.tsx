/**
 * Check-in tại quầy không cần mở trang riêng:
 * - QuickCheckin: nút "Check-in" trên thanh trên cùng (quản lý) – đang ở trang nào cũng quét thẻ / gõ mã hội viên được.
 *   Máy quét mã vạch / QR cắm USB gõ mã rồi Enter như bàn phím, nên chỉ cần để con trỏ trong ô.
 * - DeskCheckinBox: ô quét thẻ dùng chung cho thanh trên cùng và trang Check-in quầy.
 * - MemberCardModal: thẻ hội viên (QR chứa mã HV) để hội viên đưa lễ tân quét.
 * V56: không còn hiện mã theo ngày ở đây – hội viên tự check-in bằng mã động trên màn hình quầy (/admin/checkin?screen=1).
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import type { CheckinResult, MemberCard } from '../api/checkinTypes';
import { QrCode } from './checkin';
import { Icon } from './Icon';
import { Alert, Badge, Button, LoadingBlock, Modal } from './ui';
import { t } from '../i18n';
import { fmtTime } from '../lib/format';
import { displayPersonName } from '../lib/names';
import { errMsg, useAsync } from '../lib/hooks';
import './desk-checkin.css';

export function DeskCheckinBox({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: (r: CheckinResult) => void }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const v = q.trim();
    if (!v || busy) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await api.post<CheckinResult>('/checkins/desk', { query: v });
      setResult(r);
      setQ('');
      onDone?.(r);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
      // Sẵn sàng cho lượt quét kế tiếp
      input.current?.focus();
    }
  };

  const c = result ? result.checkin : null;
  return (
    <form className="desk-box" onSubmit={(e) => { void submit(e); }} noValidate>
      <div className="row" style={{ gap: 6 }}>
        <input ref={input} className="input" autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t('Quét thẻ hoặc gõ mã HV / số điện thoại')} aria-label={t('Mã hội viên hoặc số điện thoại')}
          autoComplete="off" spellCheck={false} />
        <Button type="submit" variant="primary" icon="checkCircle" loading={busy} disabled={!q.trim()}>{t('Check-in')}</Button>
      </div>
      {error && <div className="desk-msg err"><Icon name="alert" size={14} /> {error}</div>}
      {result && c && (
        <div className={`desk-msg ${result.already ? 'warn' : 'ok'}`}>
          <Icon name={result.already ? 'clock' : 'checkCircle'} size={14} />
          <span>
            <b>{displayPersonName(c.memberName)}</b> · {c.memberCode} ·{' '}
            {result.already
              ? t('đã check-in lúc {time}', { time: fmtTime(c.checkedInAt) })
              : t('check-in lúc {time}', { time: fmtTime(c.checkedInAt) })}
            {c.planName && <> · {t(c.planName)}</>}
          </span>
          {c.daysLeft != null && c.daysLeft <= 7 && <Badge tone={c.daysLeft === 0 ? 'red' : 'amber'}>{t('Còn {n} ngày', { n: c.daysLeft })}</Badge>}
        </div>
      )}
    </form>
  );
}

/** Mã 6 số, viết gọn "123 456". */
export const fmtDaily = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`;

export function QuickCheckin() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="bell quick-checkin" ref={ref}>
      <Button variant="ghost" icon="checkCircle" aria-label={t('Check-in nhanh')} title={t('Check-in nhanh')} aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        <span className="quick-checkin-label">{t('Check-in')}</span>
      </Button>
      {open && (
        <div className="popover quick-checkin-pop" role="dialog" aria-label={t('Check-in nhanh')}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <b>{t('Check-in nhanh')}</b>
            <Link to="/admin/checkin" className="tiny link">{t('Mở trang quầy')}</Link>
          </div>
          <DeskCheckinBox autoFocus />
          <div className="quick-checkin-code tiny muted">
            <Icon name="monitor" size={13} />{' '}
            <Link to="/admin/checkin?screen=1" className="link">{t('Mở màn hình mã cho hội viên tự check-in')}</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function MemberCardModal({ onClose }: { onClose: () => void }) {
  const card = useAsync(() => api.get<MemberCard>('/me/checkin-card'), []);
  return (
    <Modal title={t('Thẻ hội viên')} onClose={onClose} footer={<Button variant="ghost" onClick={onClose}>{t('Đóng')}</Button>}>
      {card.error ? <Alert kind="error">{card.error}</Alert> : !card.data ? <LoadingBlock rows={4} /> : (
        <div className="member-card">
          <div className="qr-frame"><QrCode rows={card.data.qr} size={240} label={t('Mã hội viên {code}', { code: card.data.memberCode })} /></div>
          <b className="member-card-name">{displayPersonName(card.data.fullName)}</b>
          <div className="member-card-code num">{card.data.memberCode}</div>
          <p className="tiny muted" style={{ margin: 0, textAlign: 'center' }}>
            {t('Đưa mã này cho lễ tân quét, hoặc đọc mã hội viên / số điện thoại. Không cần nhập mã gì.')}
          </p>
        </div>
      )}
    </Modal>
  );
}
