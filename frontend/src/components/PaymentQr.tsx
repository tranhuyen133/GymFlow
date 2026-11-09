/**
 * Khối "chuyển khoản theo mã QR" dùng chung: hội viên xem khi trả tiền gói, quản lý xem trước ở trang Thanh toán.
 * Ảnh QR cần token nên tải bằng api.blob (thẻ <img> không gửi được header Authorization), giống ảnh đại diện.
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { PaymentSettings } from '../api/types';
import { t } from '../i18n';
import { fmtMoney } from '../lib/format';
import { Icon } from './Icon';
import { useToast } from './Toast';
import { Button } from './ui';

/** URL tạm của ảnh QR; đổi `version` (qrUpdatedAt) thì tải lại. null = chưa có ảnh hoặc đang tải. */
export function useQrUrl(version: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!version) { setUrl(null); return; }
    let alive = true;
    let made: string | null = null;
    api.blob('/payment-settings/qr', { v: version })
      .then((b) => { if (!alive) return; made = URL.createObjectURL(b); setUrl(made); })
      .catch(() => alive && setUrl(null));
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [version]);
  return url;
}

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const toast = useToast();
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); toast.success(t('Đã chép {label}', { label: label.toLowerCase() })); }
    catch { toast.error(t('Không chép được, hãy gõ tay')); }
  };
  return (
    <div className="row between" style={{ gap: 10, padding: '8px 0', borderBottom: '1px dashed var(--hairline)' }}>
      <span className="tiny muted">{label}</span>
      <span className="row" style={{ gap: 6, minWidth: 0 }}>
        <b className={mono ? 'num' : ''} style={{ letterSpacing: mono ? '0.04em' : undefined, wordBreak: 'break-all' }}>{value}</b>
        <Button size="sm" variant="ghost" icon="copy" aria-label={t('Chép {label}', { label })} title={t('Chép')} onClick={() => void copy()} />
      </span>
    </div>
  );
}

/** amount / code để trống khi quản lý xem trước (chưa có đơn cụ thể). */
export function PaymentInfo({ settings, amount, code }: { settings: PaymentSettings; amount?: number; code?: string | null }) {
  const qr = useQrUrl(settings.hasQr ? settings.qrUpdatedAt : null);
  return (
    <div className="row row-wrap" style={{ gap: 20, alignItems: 'flex-start' }}>
      <div style={{ width: 200, flex: 'none', borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid var(--hairline)', display: 'grid', placeItems: 'center', aspectRatio: '1 / 1' }}>
        {qr ? <img src={qr} alt={t('Mã QR chuyển khoản {bank}', { bank: settings.bankName ?? '' })} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <span className="tiny faint" style={{ padding: 16, textAlign: 'center' }}>{settings.hasQr ? t('Đang tải mã QR…') : t('Chưa có mã QR')}</span>}
      </div>
      <div className="grow" style={{ minWidth: 220 }}>
        {settings.bankName && <div className="row between" style={{ gap: 10, padding: '8px 0', borderBottom: '1px dashed var(--hairline)' }}><span className="tiny muted">{t('Ngân hàng')}</span><b>{settings.bankName}</b></div>}
        {settings.accountNumber && <CopyRow label={t('Số tài khoản')} value={settings.accountNumber} mono />}
        {settings.accountName && <div className="row between" style={{ gap: 10, padding: '8px 0', borderBottom: '1px dashed var(--hairline)' }}><span className="tiny muted">{t('Chủ tài khoản')}</span><b>{settings.accountName}</b></div>}
        {amount != null && <CopyRow label={t('Số tiền')} value={String(amount)} mono />}
        {amount != null && <div className="tiny faint" style={{ textAlign: 'right', marginTop: 2 }}>{fmtMoney(amount)}</div>}
        {code && <CopyRow label={t('Nội dung chuyển khoản')} value={code} mono />}
        {code && (
          <p className="tiny muted mt-8" style={{ margin: '8px 0 0' }}>
            <Icon name="info" size={13} style={{ display: 'inline', verticalAlign: -2 }} /> {t('Ghi đúng nội dung {code} để quản lý đối chiếu nhanh. Gói được kích hoạt sau khi quản lý xác nhận đã nhận tiền.', { code })}
          </p>
        )}
      </div>
    </div>
  );
}
