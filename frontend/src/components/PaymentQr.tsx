/**
 * Khối "chuyển khoản theo mã QR" dùng chung: hội viên xem khi trả tiền gói, quản lý xem trước ở trang Thanh toán.
 * Ảnh QR cần token nên tải bằng api.blob (thẻ <img> không gửi được header Authorization), giống ảnh đại diện.
 * Kèm thẻ lựa chọn (PickCard) và trình cắt ảnh QR (QrCropper) cho trang Thanh toán.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode, type WheelEvent as RWheelEvent } from 'react';
import { api } from '../api/client';
import type { PaymentSettings } from '../api/types';
import { t } from '../i18n';
import { fmtMoney } from '../lib/format';
import { Icon, type IconName } from './Icon';
import { useToast } from './Toast';
import { Button, Modal } from './ui';
import './payment.css';

/** Khớp PaymentSettingsService.MAX_QR_BYTES. */
export const MAX_QR_BYTES = 512 * 1024;

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

/** Thẻ chọn một trong nhiều (cách trả tiền, HLV…): to, có icon / ảnh, dễ bấm trên điện thoại. */
export function PickCard({ on, onClick, icon, avatar, title, sub, disabled }: {
  on: boolean; onClick: () => void; icon?: IconName; avatar?: string; title: ReactNode; sub?: ReactNode; disabled?: boolean;
}) {
  return (
    <button type="button" role="radio" aria-checked={on} className={`pick ${on ? 'on' : ''}`} disabled={disabled} onClick={onClick}>
      {avatar != null ? <span className="pick-avatar">{avatar}</span> : icon && <span className="pick-ico"><Icon name={icon} size={18} /></span>}
      <span className="pick-body">
        <span className="pick-title">{title}</span>
        {sub && <span className="pick-sub">{sub}</span>}
      </span>
      <span className="pick-dot" aria-hidden />
    </button>
  );
}

export const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase() ?? '').join('');

function useCopy() {
  const toast = useToast();
  return async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); toast.success(t('Đã chép {label}', { label: label.toLowerCase() })); }
    catch { toast.error(t('Không chép được, hãy gõ tay')); }
  };
}

function CopyBtn({ value, label, light }: { value: string; label: string; light?: boolean }) {
  const copy = useCopy();
  return (
    <button type="button" className={`pay-copy${light ? ' light' : ''}`} aria-label={t('Chép {label}', { label })} title={t('Chép')} onClick={() => void copy(value, label)}>
      <Icon name="copy" size={14} /><span>{t('Chép')}</span>
    </button>
  );
}

/** Số tài khoản nhóm 4 số cho dễ đọc (chép vẫn lấy chuỗi gốc). */
const groupDigits = (s: string) => s.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');

/** amount / code để trống khi quản lý xem trước (chưa có đơn cụ thể). */
export function PaymentInfo({ settings, amount, code }: { settings: PaymentSettings; amount?: number; code?: string | null }) {
  const qr = useQrUrl(settings.hasQr ? settings.qrUpdatedAt : null);
  return (
    <div className="pay-wrap">
      <div className="pay-box">
        <div className="pay-qr">
          <div className="qr-frame">
            {qr ? <img src={qr} alt={t('Mã QR chuyển khoản {bank}', { bank: settings.bankName ?? '' })} />
              : <span className="qr-empty">{settings.hasQr ? t('Đang tải mã QR…') : t('Chưa có mã QR')}</span>}
          </div>
          <div className="qr-cap"><Icon name="camera" size={13} /> {t('Quét bằng app ngân hàng bất kỳ')}</div>
        </div>

        <div className="pay-side">
          <div className="bank-card">
            <div className="bank-card-top">
              <span className="bank-chip" aria-hidden />
              <span className="bank-name">{settings.bankName || t('Ngân hàng')}</span>
            </div>
            {settings.accountNumber ? (
              <div className="bank-number">
                <span className="mono">{groupDigits(settings.accountNumber)}</span>
                <CopyBtn value={settings.accountNumber} label={t('Số tài khoản')} light />
              </div>
            ) : (
              <div className="bank-number empty">{t('Chưa nhập số tài khoản')}</div>
            )}
            <div className="bank-holder">
              <span className="tiny">{t('Chủ tài khoản')}</span>
              <b>{settings.accountName || '—'}</b>
            </div>
          </div>

          {amount != null && (
            <div className="pay-rows">
              <div className="pay-row">
                <span className="k">{t('Số tiền')}</span>
                <span className="v"><b className="mono pay-amount">{fmtMoney(amount)}</b><CopyBtn value={String(amount)} label={t('Số tiền')} /></span>
              </div>
            </div>
          )}
          {code && (
            <div className="pay-memo">
              <div className="pay-memo-head">
                <span>{t('Nội dung chuyển khoản')}</span>
                <span className="pay-memo-tag">{t('Bắt buộc')}</span>
              </div>
              <div className="pay-memo-body">
                <b className="pay-memo-code">{code}</b>
                <CopyBtn value={code} label={t('Nội dung chuyển khoản')} />
              </div>
              <p className="pay-memo-note">
                <Icon name="alert" size={13} />
                <span>{t('Ghi đúng mã này, không thêm chữ hay dấu cách – quản lý dựa vào mã để nhận ra đơn của bạn.')}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {code && (
        <ol className="pay-steps">
          <li><span>1</span>{t('Mở app ngân hàng, quét mã QR hoặc nhập số tài khoản')}</li>
          <li><span>2</span>{t('Nhập đúng số tiền và nội dung {code}', { code })}</li>
          <li><span>3</span>{t('Bấm "Tôi đã chuyển khoản", quản lý đối chiếu rồi kích hoạt gói')}</li>
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Trình cắt ảnh QR: khung vuông cố định, kéo ảnh để căn, zoom bằng thanh trượt / con lăn, xoay 90°.
// Xuất PNG (giữ nét QR) cạnh tối đa 800 px; vẫn quá 512 KB thì JPEG.
// ---------------------------------------------------------------------------------------------

const OUT_MAX = 800;
const BOX_RATIO = 0.82;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((ok, fail) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => fail(new Error('decode'));
    i.src = src;
  });
}

const toBlob = (c: HTMLCanvasElement, type: string, q?: number) => new Promise<Blob | null>((ok) => c.toBlob(ok, type, q));

export function QrCropper({ file, onCancel, onDone }: { file: File; onCancel: () => void; onDone: (blob: Blob) => Promise<void> | void }) {
  const toast = useToast();
  const stageRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState(0);
  const [zoom, setZoom] = useState(1); // 1 = ảnh phủ kín khung
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const made = useRef<string[]>([]);
  const failRef = useRef(() => {});
  failRef.current = () => { toast.error(t('Không đọc được ảnh này, hãy thử ảnh khác')); onCancel(); };

  // Ảnh gốc → URL tạm
  useEffect(() => {
    const u = URL.createObjectURL(file);
    made.current.push(u);
    setSrc(u);
    return () => { made.current.forEach((x) => URL.revokeObjectURL(x)); made.current = []; };
  }, [file]);

  useEffect(() => {
    if (!src) return;
    let alive = true;
    loadImage(src).then((i) => alive && setImg({ w: i.naturalWidth, h: i.naturalHeight }))
      .catch(() => { failRef.current(); });
    return () => { alive = false; };
  }, [src]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const box = stage * BOX_RATIO;
  const off = (stage - box) / 2;
  const cover = img ? box / Math.min(img.w, img.h) : 1;
  const contain = img ? box / Math.max(img.w, img.h) : 1;
  const minZoom = contain / cover;
  const scale = cover * zoom;

  const clamp = useCallback((x: number, y: number, s: number) => {
    if (!img) return { x, y };
    const fit = (v: number, size: number) => (size >= box ? Math.min(off, Math.max(off + box - size, v)) : off + (box - size) / 2);
    return { x: fit(x, img.w * s), y: fit(y, img.h * s) };
  }, [img, box, off]);

  // Ảnh mới hoặc khung đổi cỡ: căn giữa
  useEffect(() => {
    if (!img || !stage) return;
    setZoom(1);
    setPos(clamp(stage / 2 - (img.w * cover) / 2, stage / 2 - (img.h * cover) / 2, cover));
  }, [img, stage]);

  /** Zoom quanh tâm khung để chỗ đang xem không bị trôi. */
  const zoomTo = (z: number) => {
    const nz = Math.min(4, Math.max(minZoom, z));
    const ns = cover * nz;
    const cx = stage / 2, cy = stage / 2;
    const ix = (cx - pos.x) / scale, iy = (cy - pos.y) / scale;
    setZoom(nz);
    setPos(clamp(cx - ix * ns, cy - iy * ns, ns));
  };

  const onPointerDown = (e: RPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    setDragging(true);
  };
  const onPointerMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPos(clamp(d.x + e.clientX - d.px, d.y + e.clientY - d.py, scale));
  };
  const endDrag = () => { drag.current = null; setDragging(false); };
  const onWheel = (e: RWheelEvent) => { zoomTo(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); };

  /** Xoay 90°: vẽ lại ảnh xoay thành ảnh nguồn mới. */
  const rotate = async () => {
    if (!src) return;
    const i = await loadImage(src);
    const c = document.createElement('canvas');
    c.width = i.naturalHeight; c.height = i.naturalWidth;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.translate(c.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(i, 0, 0);
    const b = await toBlob(c, 'image/png');
    if (!b) return;
    const u = URL.createObjectURL(b);
    made.current.push(u);
    setSrc(u);
  };

  const save = async () => {
    if (!src || !img) return;
    setBusy(true);
    try {
      const i = await loadImage(src);
      const sx = (off - pos.x) / scale, sy = (off - pos.y) / scale, sw = box / scale;
      const size = Math.round(Math.min(OUT_MAX, Math.max(240, sw)));
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.imageSmoothingQuality = 'high';
      const k = size / sw;
      ctx.drawImage(i, -sx * k, -sy * k, img.w * k, img.h * k);
      let out = await toBlob(c, 'image/png');
      if (!out || out.size > MAX_QR_BYTES) out = await toBlob(c, 'image/jpeg', 0.92);
      if (!out || out.size > MAX_QR_BYTES) { toast.error(t('Ảnh mã QR tối đa 512 KB, hãy cắt gọn ảnh rồi thử lại')); return; }
      await onDone(out);
    } catch {
      toast.error(t('Không cắt được ảnh, hãy thử ảnh khác'));
    } finally { setBusy(false); }
  };

  return (
    <Modal title={t('Căn chỉnh mã QR')} size="narrow" onClose={onCancel} footer={<>
      <Button variant="ghost" onClick={onCancel}>{t('Huỷ')}</Button>
      <Button variant="primary" icon="check" loading={busy} disabled={!img} onClick={() => void save()}>{t('Dùng ảnh này')}</Button>
    </>}>
      <div className="stack">
        <p className="small muted" style={{ margin: 0 }}>{t('Kéo ảnh để đưa mã QR vào giữa khung, phóng to để bỏ phần thừa của ảnh chụp màn hình.')}</p>
        <div ref={stageRef} className={`crop-stage ${dragging ? 'dragging' : ''}`}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={onWheel}>
          {src && img && <img src={src} alt="" draggable={false} style={{ width: img.w, height: img.h, transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }} />}
          {stage > 0 && <div className="crop-box" style={{ left: off, top: off, width: box, height: box }} />}
        </div>
        <div className="crop-tools">
          <div className="crop-zoom">
            <Button size="sm" variant="ghost" icon="minus" aria-label={t('Thu nhỏ')} onClick={() => zoomTo(zoom / 1.2)} />
            <input type="range" min={minZoom} max={4} step={0.01} value={zoom} aria-label={t('Thu phóng')} onChange={(e) => zoomTo(Number(e.target.value))} />
            <Button size="sm" variant="ghost" icon="plus" aria-label={t('Phóng to')} onClick={() => zoomTo(zoom * 1.2)} />
          </div>
          <Button size="sm" variant="ghost" icon="refresh" onClick={() => void rotate()}>{t('Xoay')}</Button>
          <Button size="sm" variant="ghost" onClick={() => zoomTo(minZoom)}>{t('Vừa khung')}</Button>
        </div>
      </div>
    </Modal>
  );
}
