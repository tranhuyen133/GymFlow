/**
 * Quản lý › Thanh toán (V12): bật / tắt nhận chuyển khoản, sửa tài khoản nhận tiền, tải ảnh mã QR ngân hàng.
 * Chưa nối cổng thanh toán: hội viên chuyển khoản theo QR với nội dung là mã đơn, quản lý đối chiếu rồi duyệt đơn.
 * Ảnh QR chọn xong được căn / cắt vuông trước khi tải lên (QrCropper).
 */
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { PaymentSettings as Settings } from '../../api/types';
import { Icon } from '../../components/Icon';
import { PaymentInfo, PickCard, QrCropper, useQrUrl } from '../../components/PaymentQr';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Confirm, ErrorState, Field, Input, LoadingBlock, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import { fmtDateTime } from '../../lib/format';
import { errMsg, fieldErrs, useAsync } from '../../lib/hooks';

const ACCEPT = /^image\/(png|jpe?g|webp)$/;

export default function PaymentSettings() {
  const toast = useToast();
  const { data, error, loading, reload, setData } = useAsync(() => api.get<Settings>('/payment-settings'), []);
  const [f, setF] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [enabled, setEnabled] = useState(false);
  const [tried, setTried] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cropping, setCropping] = useState<File | null>(null);
  const [removing, setRemoving] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qrUrl = useQrUrl(data?.hasQr ? data.qrUpdatedAt : null);

  useEffect(() => {
    if (!data) return;
    setF({ bankName: data.bankName ?? '', accountNumber: data.accountNumber ?? '', accountName: data.accountName ?? '' });
    setEnabled(data.onlineEnabled);
  }, [data]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <div className="page"><PageHead title="Thanh toán" /><LoadingBlock rows={6} /></div>;

  const acc = f.accountNumber.replace(/\s+/g, '');
  // Chỉ báo lỗi sau lần bấm Lưu đầu tiên, để form không đỏ ngay khi vừa mở
  const rules: Record<string, string | undefined> = {
    bankName: enabled && !f.bankName.trim() ? t('Nhập tên ngân hàng') : undefined,
    accountNumber: enabled && !acc ? t('Nhập số tài khoản') : acc && !/^\d{4,30}$/.test(acc) ? t('Số tài khoản chỉ gồm chữ số') : undefined,
    accountName: enabled && !f.accountName.trim() ? t('Nhập tên chủ tài khoản') : undefined,
  };
  const err = (k: string) => (tried ? rules[k] : undefined) ?? serverErrors[k];
  const set = (k: keyof typeof f, v: string) => { setF((x) => ({ ...x, [k]: v })); if (serverErrors[k]) setServerErrors((x) => ({ ...x, [k]: '' })); };
  const dirty = enabled !== data.onlineEnabled || f.bankName.trim() !== (data.bankName ?? '') || acc !== (data.accountNumber ?? '')
    || f.accountName.trim().toUpperCase() !== (data.accountName ?? '');
  const needQr = enabled && !data.hasQr;

  const save = async () => {
    setTried(true); setServerError('');
    if (Object.values(rules).some(Boolean)) return;
    if (needQr) { setServerError(t('Tải ảnh mã QR lên trước khi bật chuyển khoản.')); return; }
    setBusy(true);
    try {
      const res = await api.put<Settings>('/payment-settings', { onlineEnabled: enabled, bankName: f.bankName.trim(), accountNumber: acc, accountName: f.accountName.trim() });
      setData(res); setTried(false);
      toast.success(t('Đã lưu thông tin thanh toán'));
    } catch (e) { setServerError(errMsg(e)); setServerErrors(fieldErrs(e)); } finally { setBusy(false); }
  };

  const pick = (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!ACCEPT.test(file.type)) { toast.error(t('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP')); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error(t('Ảnh quá lớn, hãy chọn ảnh dưới 15 MB')); return; }
    setCropping(file);
  };

  const upload = async (blob: Blob) => {
    const form = new FormData();
    form.append('file', blob, blob.type === 'image/png' ? 'qr.png' : 'qr.jpg');
    try {
      setData(await api.upload<Settings>('/payment-settings/qr', form));
      setCropping(null);
      if (serverError) setServerError('');
      toast.success(t('Đã cập nhật mã QR'));
    } catch (e) { toast.error(errMsg(e)); }
  };

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); };
  const dropProps = {
    onDragOver: (e: DragEvent) => { e.preventDefault(); setDrag(true); },
    onDragLeave: () => setDrag(false),
    onDrop,
  };

  const preview: Settings = { ...data, bankName: f.bankName.trim() || null, accountNumber: acc || null, accountName: f.accountName.trim().toUpperCase() || null };

  return (
    <div className="page">
      <PageHead eyebrow="Kinh doanh" title="Thanh toán"
        desc="Hội viên chọn trả tại quầy hoặc chuyển khoản theo mã QR khi gửi đơn. Chuyển khoản không tự kích hoạt gói: đối chiếu sao kê theo mã đơn rồi duyệt ở Duyệt đăng ký gói."
        actions={<Link to="/package-requests" className="btn btn-secondary"><span>{t('Duyệt đăng ký gói')}</span></Link>} />

      <div className="grid grid-main" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ gap: 18 }}>
          <Card title="Cách nhận tiền" icon="wallet" actions={data.onlineEnabled ? <Badge tone="green">{t('Đang nhận chuyển khoản')}</Badge> : <Badge tone="muted">{t('Chỉ thu tại quầy')}</Badge>}>
            <div className="pick-grid" role="radiogroup" aria-label={t('Cách nhận tiền')}>
              <PickCard on={!enabled} onClick={() => setEnabled(false)} icon="ticket" title={t('Chỉ tại quầy')} sub={t('Hội viên trả tiền ở quầy lễ tân')} />
              <PickCard on={enabled} onClick={() => setEnabled(true)} icon="card" title={t('Tại quầy + chuyển khoản')} sub={t('Hội viên chọn thêm được chuyển khoản QR')} />
            </div>
          </Card>

          <Card title="Tài khoản nhận tiền" icon="card">
            <div className="stack">
              {serverError && <Alert kind="error">{serverError}</Alert>}
              <div className="form-grid">
                <Field htmlFor="pay-bank" label={t('Ngân hàng')} error={err('bankName')} required={enabled} className="span-2">
                  <Input id="pay-bank" maxLength={100} value={f.bankName} invalid={!!err('bankName')} placeholder={t('VD: Vietcombank – CN Hà Nội')} onChange={(e) => set('bankName', e.target.value)} />
                </Field>
                <Field htmlFor="pay-acc" label={t('Số tài khoản')} error={err('accountNumber')} required={enabled}>
                  <Input id="pay-acc" inputMode="numeric" maxLength={34} value={f.accountNumber} invalid={!!err('accountNumber')} onChange={(e) => set('accountNumber', e.target.value)} />
                </Field>
                <Field htmlFor="pay-name" label={t('Chủ tài khoản')} error={err('accountName')} required={enabled} hint={err('accountName') ? undefined : t('Viết hoa không dấu như trên app ngân hàng')}>
                  <Input id="pay-name" maxLength={100} value={f.accountName} invalid={!!err('accountName')} placeholder="CONG TY GYMFLOW" onChange={(e) => set('accountName', e.target.value)} />
                </Field>
              </div>
              <div className="row between row-wrap" style={{ gap: 10 }}>
                <span className="tiny faint">{t('Cập nhật lần cuối {d}', { d: fmtDateTime(data.updatedAt) })}</span>
                <div className="row" style={{ gap: 8 }}>
                  {dirty && <Button variant="ghost" onClick={() => { setData({ ...data }); setTried(false); setServerError(''); setServerErrors({}); }}>{t('Hoàn tác')}</Button>}
                  <Button variant="primary" icon="check" loading={busy} disabled={!dirty} onClick={() => void save()}>{t('Lưu')}</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <Card title="Mã QR ngân hàng" icon="camera" actions={data.hasQr && <span className="tiny faint">{fmtDateTime(data.qrUpdatedAt)}</span>}>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
            {data.hasQr ? (
              <div className="qr-current" {...dropProps}>
                <div className="qr-frame">{qrUrl ? <img src={qrUrl} alt={t('Mã QR ngân hàng')} /> : <span className="qr-empty">{t('Đang tải mã QR…')}</span>}</div>
                <div className="stack" style={{ gap: 10 }}>
                  <span className="small muted">{t('Kéo ảnh mới vào đây hoặc bấm Đổi ảnh. Bạn sẽ được căn chỉnh, cắt vuông trước khi lưu.')}</span>
                  <div className="row row-wrap" style={{ gap: 8 }}>
                    <Button icon="upload" onClick={() => fileRef.current?.click()}>{t('Đổi ảnh QR')}</Button>
                    <Button variant="ghost" icon="trash" disabled={data.onlineEnabled}
                      title={data.onlineEnabled ? t('Tắt nhận chuyển khoản trước khi xoá mã QR') : undefined} onClick={() => setRemoving(true)}>{t('Xoá')}</Button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" className={`qr-drop ${drag ? 'drag' : ''}`} onClick={() => fileRef.current?.click()} {...dropProps}>
                <span className="pick-ico"><Icon name="upload" size={20} /></span>
                <b>{t('Chọn hoặc kéo ảnh mã QR vào đây')}</b>
                <span className="tiny">{t('Ảnh chụp màn hình QR nhận tiền trong app ngân hàng · JPG, PNG, WebP')}</span>
              </button>
            )}
            {needQr && <p className="tiny" style={{ margin: '10px 0 0', color: 'var(--warning)' }}>{t('Cần có mã QR thì hội viên mới chọn được chuyển khoản.')}</p>}
          </Card>
          <Card title="Hội viên sẽ thấy" icon="eye">
            <PaymentInfo settings={preview} amount={500000} code="GF000123" />
            <p className="tiny faint" style={{ margin: '12px 0 0' }}>{t('Số tiền và mã đơn ở trên chỉ là ví dụ; mỗi đơn có số tiền và mã riêng.')}</p>
          </Card>
        </div>
      </div>

      {cropping && <QrCropper file={cropping} onCancel={() => setCropping(null)} onDone={upload} />}
      {removing && <Confirm danger title="Xoá mã QR?" confirmText="Xoá" message={t('Hội viên sẽ không chọn được chuyển khoản cho tới khi có mã QR mới.')}
        onClose={() => setRemoving(false)}
        onConfirm={async () => { try { setData(await api.del<Settings>('/payment-settings/qr')); toast.success(t('Đã xoá mã QR')); } catch (e) { toast.error(errMsg(e)); throw e; } }} />}
    </div>
  );
}
