/**
 * Hướng dẫn tương tác lần đầu: làm mờ nền, khoanh vùng phần tử đang giới thiệu, hộp thoại có mũi tên chỉ vào.
 * Bước, nội dung và cách lưu tiến độ ở lib/tour.ts. Không chặn đăng nhập: chỉ tự mở ở trang Tổng quan, có nút "Để sau".
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMe } from '../auth/AuthContext';
import { t } from '../i18n';
import { isPostponed, postponeTour, readTour, saveTour, TOUR_END, TOUR_START, tourSteps } from '../lib/tour';
import { Button } from './ui';
import './tour.css';

type Place = 'right' | 'left' | 'bottom' | 'top' | 'center' | 'sheet';
interface Box { top: number; left: number; width: number; height: number }
interface Pos { top: number; left: number; place: Place; arrow: number }

const PAD = 6;     // vùng sáng rộng hơn phần tử một chút
const GAP = 14;    // khoảng cách vùng sáng – hộp thoại (chỗ cho mũi tên)
const MARGIN = 12; // cách mép màn hình

const isNarrow = () => window.matchMedia('(max-width: 900px)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  const list = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return list.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  }) ?? null;
}

/** Khung phần tử, cắt theo màn hình (vùng nội dung dài hơn màn hình vẫn khoanh gọn). */
function boxOf(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  const top = Math.max(r.top - PAD, 4);
  const left = Math.max(r.left - PAD, 4);
  const bottom = Math.min(r.bottom + PAD, window.innerHeight - 4);
  const right = Math.min(r.right + PAD, window.innerWidth - 4);
  return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

function place(box: Box | null, cw: number, ch: number): Pos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const center: Pos = { place: 'center', top: (vh - ch) / 2, left: (vw - cw) / 2, arrow: 0 };
  if (!box) return center;
  type Side = 'right' | 'left' | 'bottom' | 'top';
  const fits: Record<Side, boolean> = {
    right: box.left + box.width + GAP + cw <= vw - MARGIN,
    left: box.left - GAP - cw >= MARGIN,
    bottom: box.top + box.height + GAP + ch <= vh - MARGIN,
    top: box.top - GAP - ch >= MARGIN,
  };
  const order: Side[] = vw <= 560 ? ['bottom', 'top'] : ['right', 'bottom', 'top', 'left'];
  const p = order.find((o) => fits[o]);
  const cy = box.top + box.height / 2;
  const cx = box.left + box.width / 2;
  if (p === 'right' || p === 'left') {
    const top = clamp(cy - ch / 2, MARGIN, vh - ch - MARGIN);
    return { place: p, top, left: p === 'right' ? box.left + box.width + GAP : box.left - GAP - cw, arrow: clamp(cy - top, 18, ch - 18) };
  }
  if (p === 'bottom' || p === 'top') {
    const left = clamp(cx - cw / 2, MARGIN, vw - cw - MARGIN);
    return { place: p, left, top: p === 'bottom' ? box.top + box.height + GAP : box.top - GAP - ch, arrow: clamp(cx - left, 18, cw - 18) };
  }
  // Không còn chỗ bên cạnh (VD vùng lớn, drawer trên điện thoại): điện thoại đặt sát đáy, màn rộng đặt giữa
  return vw <= 900 ? { place: 'sheet', top: vh - ch - MARGIN, left: (vw - cw) / 2, arrow: 0 } : center;
}

export function Tour({ onNav }: { onNav: (to: string | true | null) => void }) {
  const user = useMe();
  const steps = tourSteps(user.role);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [step, setStep] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [pos, setPos] = useState<Pos>({ place: 'center', top: 0, left: 0, arrow: 0 });
  const card = useRef<HTMLDivElement>(null);
  const autoChecked = useRef(false);
  const cur = step == null ? null : steps[step] ?? null;
  const total = steps.length;

  // Lần đầu vào trang Tổng quan: tự mở màn chào (một lần mỗi lần tải ứng dụng)
  useEffect(() => {
    if (autoChecked.current || pathname !== '/dashboard') return;
    if (readTour(user.id, user.role) || isPostponed(user.id)) { autoChecked.current = true; return; }
    // Đánh dấu trong lúc hẹn giờ (không đánh dấu trước) để StrictMode chạy effect 2 lần vẫn hiện
    const id = window.setTimeout(() => { autoChecked.current = true; setStep(0); }, 700);
    return () => window.clearTimeout(id);
  }, [pathname, user.id, user.role]);

  // Mở lại từ trang Trợ giúp
  useEffect(() => {
    const on = (e: Event) => setStep(clamp(Number((e as CustomEvent<number>).detail) || 0, 0, total - 1));
    window.addEventListener(TOUR_START, on);
    return () => window.removeEventListener(TOUR_START, on);
  }, [total]);

  const close = useCallback((how: 'done' | 'paused' | 'later', at = 0) => {
    if (how === 'later') postponeTour(user.id);
    else saveTour(user.id, user.role, { status: how, step: at });
    setStep(null);
    setBox(null);
    onNav(null);
    window.dispatchEvent(new Event(TOUR_END));
  }, [user.id, user.role, onNav]);

  const next = useCallback(() => setStep((s) => (s == null ? s : Math.min(s + 1, total - 1))), [total]);
  const back = useCallback(() => setStep((s) => (s == null ? s : Math.max(s - 1, 1))), []);

  // Mỗi bước: mở menu nếu cần, cuộn tới phần tử, đo lại khi cuộn / đổi kích thước
  useEffect(() => {
    if (!cur) return;
    onNav(cur.nav ?? null);
    let raf = 0;
    const measure = () => {
      const el = findTarget(cur.target);
      setBox(el ? boxOf(el) : null);
      setView({ w: window.innerWidth, h: window.innerHeight });
    };
    // Drawer trên điện thoại trượt ra mất 0,35s: đợi xong mới đo
    const timer = window.setTimeout(() => {
      const el = findTarget(cur.target);
      if (el) {
        const r = el.getBoundingClientRect();
        // Chỉ cuộn khi phần tử vừa màn hình mà đang bị khuất (vùng nội dung dài thì để nguyên)
        if (r.height < window.innerHeight - 80 && (r.top < 64 || r.bottom > window.innerHeight - 8)) {
          el.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
        }
      }
      measure();
    }, cur.nav && isNarrow() ? 380 : 30);
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [cur, onNav]);

  // Đặt hộp thoại sau khi biết kích thước thật (trước khi vẽ nên không bị nháy)
  useLayoutEffect(() => {
    const c = card.current;
    if (!c || step == null) return;
    setPos(place(box, c.offsetWidth, c.offsetHeight));
  }, [box, step, view]);

  // Đưa focus vào hộp thoại để đọc màn hình đọc ngay nội dung bước mới
  useEffect(() => { if (step != null) card.current?.focus({ preventScroll: true }); }, [step]);

  // Phím tắt: Esc bỏ qua, ← → chuyển bước. Bắt ở pha capture để không kích hoạt phím của trang phía sau.
  useEffect(() => {
    if (step == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (step === 0) close('later'); else close('paused', step); }
      else if (e.key === 'ArrowRight' && step > 0 && step < total - 1) { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' && step > 1) { e.preventDefault(); back(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [step, total, close, next, back]);

  // Giữ Tab trong hộp thoại
  const trap = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !card.current) return;
    const f = Array.from(card.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (f.length === 0) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === card.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  if (step == null || !cur) return null;
  const isLast = step === total - 1;
  const style = { top: pos.top, left: pos.left, '--arrow': `${pos.arrow}px` } as CSSProperties;

  return createPortal(
    <div className="tour">
      {/* Chặn bấm vào trang phía sau trong lúc hướng dẫn */}
      <div className="tour-block" />
      {box ? <div className="tour-spot" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} /> : <div className="tour-scrim" />}
      <div ref={card} className={`tour-card place-${pos.place}`} style={style} role="dialog" aria-modal="true"
        aria-labelledby="tour-title" aria-describedby="tour-body" tabIndex={-1} onKeyDown={trap}>
        {step > 0 && (
          <div className="tour-progress">
            <span className="tiny muted">{t('Bước {n}/{total}', { n: step, total: total - 1 })}</span>
            <span className="tour-dots" aria-hidden>{steps.slice(1).map((_, i) => <i key={i} className={i + 1 <= step ? 'on' : ''} />)}</span>
          </div>
        )}
        <h2 id="tour-title">{t(cur.title)}</h2>
        <p id="tour-body">{t(cur.body)}</p>
        <div className="tour-foot">
          {step === 0 ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => close('later')}>{t('Để sau')}</Button>
              <Button variant="primary" size="sm" icon="play" onClick={next}>{t('Bắt đầu hướng dẫn')}</Button>
            </>
          ) : isLast ? (
            <>
              <Button variant="ghost" size="sm" icon="chevronLeft" onClick={back}>{t('Quay lại')}</Button>
              <span className="spacer" />
              <Button variant="secondary" size="sm" onClick={() => { close('done'); navigate('/help'); }}>{t('Khám phá Trợ giúp')}</Button>
              <Button variant="primary" size="sm" icon="check" onClick={() => close('done')}>{t('Hoàn thành')}</Button>
            </>
          ) : (
            <>
              <button type="button" className="link-btn tiny tour-skip" onClick={() => close('paused', step)}>{t('Bỏ qua')}</button>
              <span className="spacer" />
              {step > 1 && <Button variant="ghost" size="sm" icon="chevronLeft" onClick={back}>{t('Quay lại')}</Button>}
              <Button variant="primary" size="sm" onClick={next}>{t('Tiếp theo')}</Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
