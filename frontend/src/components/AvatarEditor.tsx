import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { api } from '../api/client';
import type { Me } from '../api/types';
import { useAuth, useMe } from '../auth/AuthContext';
import { t } from '../i18n';
import { errMsg } from '../lib/hooks';
import { Icon } from './Icon';
import { useToast } from './Toast';
import { Alert, Avatar, Button, Confirm, Modal } from './ui';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT = 8 * 1024 * 1024; // ảnh gốc từ điện thoại; sau khi cắt + nén còn ≤ 512 KB
const MAX_UPLOAD = 512 * 1024;     // khớp AvatarService.MAX_BYTES
const OUT = 512;                   // kích thước ảnh lưu (px)
const VIEW = 240;                  // khung cắt trên màn hình (px) – vừa cả màn hình 320px
const MIN_SIDE = 96;

// ---------- Ảnh đại diện của chính mình: tải 1 lần, dùng chung cho topbar, sidebar, hồ sơ ----------
let cache: { key: string; url: string | null; promise: Promise<string | null> } | null = null;

function loadAvatar(key: string, version: string): Promise<string | null> {
  if (cache?.key === key) return cache.promise;
  if (cache?.url) URL.revokeObjectURL(cache.url);
  const entry: { key: string; url: string | null; promise: Promise<string | null> } = { key, url: null, promise: Promise.resolve(null) };
  entry.promise = api.blob('/auth/me/avatar', { v: version })
    .then((b) => { const u = URL.createObjectURL(b); entry.url = u; return u; })
    .catch(() => null); // lỗi tải ảnh → hiện chữ viết tắt, không chặn giao diện
  cache = entry;
  return entry.promise;
}

/** URL ảnh đại diện của tài khoản đang đăng nhập (null nếu chưa có ảnh hoặc đang tải). */
export function useMyAvatar(): string | null {
  const me = useMe();
  const key = me.avatarUpdatedAt ? `${me.id}:${me.avatarUpdatedAt}` : null;
  const [url, setUrl] = useState<string | null>(() => (key && cache?.key === key ? cache.url : null));
  useEffect(() => {
    if (!key || !me.avatarUpdatedAt) { setUrl(null); return; }
    let alive = true;
    void loadAvatar(key, me.avatarUpdatedAt).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [key, me.avatarUpdatedAt]);
  return key ? url : null;
}

/** Avatar của chính mình, có ảnh thì hiện ảnh, chưa có thì chữ viết tắt. */
export function MyAvatar({ size }: { size?: 'sm' | 'lg' | 'xl' }) {
  const me = useMe();
  return <Avatar name={me.fullName} size={size} src={useMyAvatar()} />;
}

// ---------- Hộp thoại đổi ảnh ----------
interface Crop { x: number; y: number; zoom: number }

function canvasBlob(c: HTMLCanvasElement, type: string, q: number) {
  return new Promise<Blob | null>((res) => c.toBlob(res, type, q));
}

export function AvatarEditor({ onClose }: { onClose: () => void }) {
  const me = useMe();
  const { update } = useAuth();
  const toast = useToast();
  const current = useMyAvatar();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, zoom: 1 });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const srcUrl = useRef<string | null>(null);

  useEffect(() => () => { if (srcUrl.current) URL.revokeObjectURL(srcUrl.current); }, []);

  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const scale = base * crop.zoom;
  const dw = img ? img.naturalWidth * scale : VIEW;
  const dh = img ? img.naturalHeight * scale : VIEW;
  // Ảnh luôn phủ kín khung cắt
  const clamp = (x: number, y: number, w = dw, h = dh) => ({ x: Math.min(0, Math.max(VIEW - w, x)), y: Math.min(0, Math.max(VIEW - h, y)) });

  const pick = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ACCEPT.includes(file.type)) { setError(t('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP')); return; }
    if (file.size > MAX_INPUT) { setError(t('Ảnh gốc tối đa 8 MB')); return; }
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      if (el.naturalWidth < MIN_SIDE || el.naturalHeight < MIN_SIDE) {
        URL.revokeObjectURL(url); setError(t('Ảnh quá nhỏ, cần tối thiểu {n}×{n} px', { n: MIN_SIDE })); return;
      }
      if (srcUrl.current) URL.revokeObjectURL(srcUrl.current);
      srcUrl.current = url;
      const b = VIEW / Math.min(el.naturalWidth, el.naturalHeight);
      setImg(el);
      setCrop({ x: (VIEW - el.naturalWidth * b) / 2, y: (VIEW - el.naturalHeight * b) / 2, zoom: 1 });
    };
    el.onerror = () => { URL.revokeObjectURL(url); setError(t('Không đọc được ảnh, vui lòng chọn ảnh khác')); };
    el.src = url;
  };

  const zoomTo = (z: number) => {
    if (!img) return;
    const zoom = Math.min(3, Math.max(1, z));
    const ns = base * zoom;
    // Giữ nguyên điểm ở tâm khung khi phóng to/thu nhỏ
    const cx = (VIEW / 2 - crop.x) / scale;
    const cy = (VIEW / 2 - crop.y) / scale;
    const p = clamp(VIEW / 2 - cx * ns, VIEW / 2 - cy * ns, img.naturalWidth * ns, img.naturalHeight * ns);
    setCrop({ ...p, zoom });
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: crop.x, y: crop.y };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    setCrop((c) => ({ ...c, ...clamp(d.x + e.clientX - d.px, d.y + e.clientY - d.py) }));
  };
  const onUp = () => { drag.current = null; };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!img) return;
    const step = e.shiftKey ? 20 : 6;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) { e.preventDefault(); setCrop((c) => ({ ...c, ...clamp(c.x + moves[e.key][0], c.y + moves[e.key][1]) })); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomTo(crop.zoom + 0.1); }
    else if (e.key === '-') { e.preventDefault(); zoomTo(crop.zoom - 0.1); }
  };

  const save = async () => {
    if (!img || busy) return;
    setBusy(true); setError(null);
    try {
      const c = document.createElement('canvas');
      c.width = OUT; c.height = OUT;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error(t('Trình duyệt không hỗ trợ xử lý ảnh'));
      ctx.imageSmoothingQuality = 'high';
      // Vẽ lại qua canvas: cắt vuông, thu về 512px và bỏ toàn bộ metadata (EXIF, vị trí GPS…) của ảnh gốc
      ctx.drawImage(img, -crop.x / scale, -crop.y / scale, VIEW / scale, VIEW / scale, 0, 0, OUT, OUT);
      let blob = await canvasBlob(c, 'image/webp', 0.86);
      if (!blob || blob.type !== 'image/webp') blob = await canvasBlob(c, 'image/jpeg', 0.86); // Safari cũ không xuất được WebP
      if (blob && blob.size > MAX_UPLOAD) blob = await canvasBlob(c, 'image/jpeg', 0.72);
      if (!blob) throw new Error(t('Không nén được ảnh'));
      const form = new FormData();
      form.append('file', blob, blob.type === 'image/webp' ? 'avatar.webp' : 'avatar.jpg');
      update(await api.upload<Me>('/auth/me/avatar', form));
      toast.success('Đã cập nhật ảnh đại diện');
      onClose();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  const remove = async () => {
    try { update(await api.del<Me>('/auth/me/avatar')); toast.success('Đã khôi phục ảnh mặc định'); onClose(); }
    catch (e) { toast.error(errMsg(e)); throw e; }
  };

  return (
    <>
      <Modal title="Ảnh đại diện" size="narrow" onClose={() => { if (!busy && !confirmRemove) onClose(); }} footer={<>
        {!img && me.avatarUpdatedAt && <Button variant="ghost" icon="trash" onClick={() => setConfirmRemove(true)} className="modal-foot-hint">Dùng ảnh mặc định</Button>}
        {img && <Button variant="ghost" icon="refresh" onClick={() => fileRef.current?.click()} className="modal-foot-hint">Chọn ảnh khác</Button>}
        <Button variant="ghost" onClick={onClose} disabled={busy}>Huỷ</Button>
        <Button variant="primary" icon="check" loading={busy} disabled={!img} onClick={() => void save()}>Lưu ảnh</Button>
      </>}>
        <div className="stack" style={{ alignItems: 'center' }}>
          {error && <div style={{ alignSelf: 'stretch' }}><Alert kind="error">{error}</Alert></div>}
          <input ref={fileRef} type="file" accept={ACCEPT.join(',')} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          {!img ? (
            <button type="button" className={`avatar-drop ${dragOver ? 'over' : ''}`} onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files?.[0]); }}>
              <Avatar name={me.fullName} size="xl" src={current} />
              <span className="row" style={{ gap: 6, fontWeight: 700 }}><Icon name="upload" size={16} />{t('Chọn ảnh từ thiết bị')}</span>
              <span className="tiny faint">{t('JPG, PNG hoặc WebP · tối đa 8 MB · hoặc kéo thả vào đây')}</span>
            </button>
          ) : (
            <>
              <div className="crop-view" style={{ width: VIEW, height: VIEW }} tabIndex={0} role="application"
                aria-label={t('Khung cắt ảnh: kéo hoặc dùng phím mũi tên để di chuyển, phím + và − để phóng to, thu nhỏ')}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
                onWheel={(e) => zoomTo(crop.zoom - e.deltaY * 0.0015)}>
                <img src={img.src} alt="" draggable={false} style={{ width: dw, height: dh, transform: `translate(${crop.x}px, ${crop.y}px)` }} />
                <div className="crop-mask" aria-hidden />
              </div>
              <label className="crop-zoom">
                <Icon name="minus" size={14} />
                <input type="range" min={1} max={3} step={0.01} value={crop.zoom} onChange={(e) => zoomTo(Number(e.target.value))} aria-label={t('Thu phóng')} />
                <Icon name="plus" size={14} />
              </label>
              <p className="tiny faint" style={{ margin: 0, textAlign: 'center' }}>{t('Kéo ảnh để căn chỉnh. Ảnh được cắt vuông, hiển thị dạng tròn.')}</p>
            </>
          )}
        </div>
      </Modal>
      {confirmRemove && <Confirm title="Dùng ảnh mặc định?" message={t('Ảnh hiện tại sẽ bị xoá, tài khoản hiển thị chữ viết tắt tên.')} confirmText="Xoá ảnh" danger
        onClose={() => setConfirmRemove(false)} onConfirm={remove} />}
    </>
  );
}
