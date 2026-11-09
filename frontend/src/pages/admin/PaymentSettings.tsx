/**
 * Quản lý › Thanh toán (V12): bật / tắt nhận chuyển khoản, sửa tài khoản nhận tiền, tải ảnh mã QR ngân hàng.
 * Chưa nối cổng thanh toán: hội viên chuyển khoản theo QR với nội dung là mã đơn, quản lý đối chiếu rồi duyệt đơn.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { PaymentSettings as Settings } from '../../api/types';
import { PaymentInfo } from '../../components/PaymentQr';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Confirm, ErrorState, Field, Input, LoadingBlock, PageHead, Segmented } from '../../components/ui';
import { t } from '../../i18n';
import { fmtDateTime } from '../../lib/format';
import { errMsg, fieldErrs, useAsync } from '../../lib/hooks';

/** Khớp PaymentSettingsService.MAX_QR_BYTES. */
const MAX_QR_BYTES = 512 * 1024;

/** Ảnh chụp màn hình app ngân hàng thường vài MB: thu về cạnh dài 1000 px (PNG giữ nét QR), vẫn lớn thì JPEG. */
async function shrink(file: File): Promise<Blob> {
  if (file.size <= MAX_QR_BYTES) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => fail(new Error('decode'));
      i.src = url;
    });
    const scale = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const encode = (type: string, q?: number) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, q));
    const png = await encode('image/png');
    if (png && png.size <= MAX_QR_BYTES) return png;
    return (await encode('image/jpeg', 0.92)) ?? file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PaymentSettings() {
  const toast = useToast();
  const { data, error, loading, reload, setData } = useAsync(() => api.get<Settings>('/payment-settings'), []);
  const [f, setF] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [enabled, setEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setF({ bankName: data.bankName ?? '', accountNumber: data.accountNumber ?? '', accountName: data.accountName ?? '' });
    setEnabled(data.onlineEnabled);
  }, [data]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <div className="page"><PageHead title="Thanh toán" /><LoadingBlock rows={6} /></div>;

  const set = (k: keyof typeof f, v: string) => { setF((x) => ({ ...x, [k]: v })); if (errors[k]) setErrors((x) => ({ ...x, [k]: '' })); };
  const dirty = enabled !== data.onlineEnabled || f.bankName.trim() !== (data.bankName ?? '') || f.accountNumber.replace(/\s+/g, '') !== (data.accountNumber ?? '')
    || f.accountName.trim().toUpperCase() !== (data.accountName ?? '');

  const save = async () => {
    const v: Record<string, string> = {};
    const acc = f.accountNumber.replace(/\s+/g, '');
    if (acc && !/^\d{4,30}$/.test(acc)) v.accountNumber = t('Số tài khoản chỉ gồm chữ số');
    if (enabled) {
      if (!f.bankName.trim()) v.bankName = t('Nhập tên ngân hàng');
      if (!acc) v.accountNumber = t('Nhập số tài khoản');
      if (!f.accountName.trim()) v.accountName = t('Nhập tên chủ tài khoản');
    }
    setErrors(v); setServerError('');
    if (Object.keys(v).length) return;
    if (enabled && !data.hasQr) { setServerError(t('Tải ảnh mã QR lên trước khi bật chuyển khoản.')); return; }
    setBusy(true);
    try {
      const res = await api.put<Settings>('/payment-settings', { onlineEnabled: enabled, bankName: f.bankName.trim(), accountNumber: acc, accountName: f.accountName.trim() });
      setData(res);
      toast.success(t('Đã lưu thông tin thanh toán'));
    } catch (e) { setServerError(errMsg(e)); setErrors(fieldErrs(e)); } finally { setBusy(false); }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { toast.error(t('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP')); return; }
    setUploading(true);
    try {
      const blob = await shrink(file);
      if (blob.size > MAX_QR_BYTES) { toast.error(t('Ảnh mã QR tối đa 512 KB, hãy cắt gọn ảnh rồi thử lại')); return; }
      const form = new FormData();
      form.append('file', blob, blob === file ? file.name : 'qr.' + (blob.type === 'image/png' ? 'png' : 'jpg'));
      setData(await api.upload<Settings>('/payment-settings/qr', form));
      toast.success(t('Đã cập nhật mã QR'));
    } catch (e) { toast.error(errMsg(e)); } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const preview: Settings = { ...data, bankName: f.bankName.trim() || null, accountNumber: f.accountNumber.replace(/\s+/g, '') || null, accountName: f.accountName.trim().toUpperCase() || null };

  return (
    <div className="page">
      <PageHead eyebrow="Kinh doanh" title="Thanh toán"
        desc="Hội viên chọn trả tại quầy hoặc chuyển khoản theo mã QR khi gửi đơn đăng ký gói. Chuyển khoản không tự kích hoạt gói: đối chiếu tài khoản ngân hàng rồi duyệt đơn ở Duyệt đăng ký gói."
        actions={<Link to="/package-requests" className="btn btn-secondary"><span>{t('Duyệt đăng ký gói')}</span></Link>} />

      <div className="grid grid-main" style={{ alignItems: 'start' }}>
        <Card title="Tài khoản nhận tiền" icon="wallet" actions={data.onlineEnabled ? <Badge tone="green">{t('Đang nhận chuyển khoản')}</Badge> : <Badge tone="muted">{t('Chỉ thu tại quầy')}</Badge>}>
          <div className="stack">
            {serverError && <Alert kind="error">{serverError}</Alert>}
            <Field label={t('Cho hội viên chuyển khoản')} hint={enabled ? t('Hội viên thấy lựa chọn "Chuyển khoản QR" khi gửi đơn.') : t('Hội viên chỉ chọn được "Trả tại quầy".')}>
              <Segmented value={enabled ? 'on' : 'off'} onChange={(v) => setEnabled(v === 'on')} options={[
                { value: 'off', label: t('Tắt') }, { value: 'on', label: t('Bật') },
              ]} />
            </Field>
            <div className="form-grid">
              <Field htmlFor="pay-bank" label={t('Ngân hàng')} error={errors.bankName} required={enabled} className="span-2">
                <Input id="pay-bank" maxLength={100} value={f.bankName} invalid={!!errors.bankName} placeholder={t('VD: Vietcombank – CN Hà Nội')} onChange={(e) => set('bankName', e.target.value)} />
              </Field>
              <Field htmlFor="pay-acc" label={t('Số tài khoản')} error={errors.accountNumber} required={enabled}>
                <Input id="pay-acc" inputMode="numeric" maxLength={34} value={f.accountNumber} invalid={!!errors.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} />
              </Field>
              <Field htmlFor="pay-name" label={t('Chủ tài khoản')} error={errors.accountName} required={enabled} hint={t('Viết hoa không dấu như trên app ngân hàng')}>
                <Input id="pay-name" maxLength={100} value={f.accountName} invalid={!!errors.accountName} placeholder="CONG TY GYMFLOW" onChange={(e) => set('accountName', e.target.value)} />
              </Field>
            </div>
            <div className="row between row-wrap" style={{ gap: 10 }}>
              <span className="tiny faint">{t('Cập nhật lần cuối {d}', { d: fmtDateTime(data.updatedAt) })}</span>
              <Button variant="primary" icon="check" loading={busy} disabled={!dirty} onClick={() => void save()}>{t('Lưu')}</Button>
            </div>
          </div>
        </Card>

        <div className="stack" style={{ gap: 18 }}>
          <Card title="Mã QR ngân hàng" icon="card" actions={data.hasQr && <span className="tiny faint">{fmtDateTime(data.qrUpdatedAt)}</span>}>
            <div className="stack">
              <p className="small muted" style={{ margin: 0 }}>{t('Tải ảnh mã QR nhận tiền từ app ngân hàng (JPG, PNG, WebP). Ảnh lớn được tự thu nhỏ, tối đa 512 KB.')}</p>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void upload(e.target.files?.[0])} />
              <div className="row" style={{ gap: 8 }}>
                <Button icon="upload" loading={uploading} onClick={() => fileRef.current?.click()}>{data.hasQr ? t('Đổi ảnh QR') : t('Tải ảnh QR')}</Button>
                {data.hasQr && <Button variant="ghost" icon="trash" disabled={data.onlineEnabled}
                  title={data.onlineEnabled ? t('Tắt nhận chuyển khoản trước khi xoá mã QR') : undefined} onClick={() => setRemoving(true)}>{t('Xoá')}</Button>}
              </div>
            </div>
          </Card>
          <Card title="Hội viên sẽ thấy" icon="eye">
            <PaymentInfo settings={preview} amount={500000} code="GF000123" />
            <p className="tiny faint mt-8" style={{ margin: '10px 0 0' }}>{t('Số tiền và mã đơn ở trên chỉ là ví dụ; mỗi đơn có số tiền và mã riêng.')}</p>
          </Card>
        </div>
      </div>

      {removing && <Confirm danger title="Xoá mã QR?" confirmText="Xoá" message={t('Hội viên sẽ không chọn được chuyển khoản cho tới khi có mã QR mới.')}
        onClose={() => setRemoving(false)}
        onConfirm={async () => { try { setData(await api.del<Settings>('/payment-settings/qr')); toast.success(t('Đã xoá mã QR')); } catch (e) { toast.error(errMsg(e)); throw e; } }} />}
    </div>
  );
}
