import { Children, cloneElement, Fragment, isValidElement, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EN } from './en';
import { EN_EXTRA } from './en-extra';
import { EN_PT } from './en-pt';
import { EXERCISE_CONTENT_EN } from './exercise-content-en';

/**
 * Đa ngôn ngữ tối giản: chuỗi tiếng Việt chính là khoá, bản tiếng Anh nằm trong en.ts.
 * Thiếu bản dịch thì hiện nguyên tiếng Việt (không tự dịch máy).
 * Nội dung sức khỏe chỉ dịch khi có bản tiếng Anh đã được rà soát trong từ điển.
 */
export type Lang = 'vi' | 'en';
export const LANG_KEY = 'gf.lang';

function readLang(): Lang {
  try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'vi'; } catch { return 'vi'; }
}

let current: Lang = readLang();
const missing = new Set<string>();
// EN_PT (V24) đặt trước để không ghi đè bản dịch đã có trong EN / EN_EXTRA.
const DICT: Record<string, string> = { ...EN_PT, ...EN, ...EN_EXTRA, ...EXERCISE_CONTENT_EN };

type Vars = Record<string, string | number | null | undefined>;

export function t(vi: string, vars?: Vars): string {
  let s = vi;
  if (current === 'en') {
    const en = DICT[vi];
    if (en !== undefined) {
      s = en;
    } else {
      const m1 = vi.match(/^Buổi (\d+) – (.+)$/);
      if (m1) {
        s = `Session ${m1[1]} – ${t(m1[2])}`;
      } else {
        const m2 = vi.match(/^Buổi (\d+)$/);
        if (m2) {
          s = `Session ${m2[1]}`;
        } else {
          const mInBody = vi.match(/^(\d+)\s+buổi đo InBody$/i);
          if (mInBody) {
            s = `${mInBody[1]} InBody assessment${mInBody[1] === '1' ? '' : 's'}`;
          } else {
            const mPt = vi.match(/^(\d+)\s+buổi PT$/i);
            if (mPt) {
              s = `${mPt[1]} PT session${mPt[1] === '1' ? '' : 's'}`;
            } else {
              const mFullPt = vi.match(/^Toàn bộ quyền lợi \+ (\d+)\s+buổi PT$/i);
              if (mFullPt) {
                s = `Full benefits + ${mFullPt[1]} PT sessions`;
              } else if (import.meta.env.DEV && vi && !missing.has(vi)) {
                missing.add(vi);
                console.debug('[i18n] thiếu bản dịch:', vi);
              }
            }
          }
        }
      }
    }
  }
  return vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : s;
}

/**
 * Dịch cả câu rồi chèn phần tử JSX vào chỗ {tên}, để câu có chữ đậm/link vẫn dịch nguyên câu
 * (tiếng Anh có thể đổi thứ tự các vế). VD: tn('Gói {plan} còn {n} ngày', { plan: <b>{name}</b>, n: 3 }).
 */
export function tn(vi: string, nodes: Record<string, ReactNode>): ReactNode {
  const parts = t(vi).split(/\{(\w+)\}/g);
  return <>{parts.map((p, i) => (i % 2 === 1 ? <Fragment key={i}>{nodes[p] ?? ''}</Fragment> : p))}</>;
}

/** Dịch chữ giao diện ở mọi cấp JSX; giữ nguyên vùng nội dung được đánh dấu tiếng Việt. */
export function tx(node: ReactNode): ReactNode {
  if (typeof node === 'string') {
    const text = node.trim();
    if (!text) return node;
    const start = node.indexOf(text);
    return `${node.slice(0, start)}${t(text)}${node.slice(start + text.length)}`;
  }
  if (Array.isArray(node)) return Children.map(node, tx);
  if (isValidElement<{ children?: ReactNode; lang?: string }>(node)
    && (node.type === Fragment || typeof node.type === 'string')) {
    const tag = typeof node.type === 'string' ? node.type : '';
    if (node.props.lang === 'vi' || tag === 'pre' || tag === 'code') return node;
    if (node.props.children !== undefined) return cloneElement(node, undefined, tx(node.props.children));
  }
  return node;
}

export const getLang = () => current;
/** Locale cho định dạng ngày/số. */
export const locale = () => (current === 'en' ? 'en-GB' : 'vi-VN');

interface LangValue { lang: Lang; setLang: (l: Lang) => void }
const LangContext = createContext<LangValue | null>(null);

function applyDocument(l: Lang) {
  document.documentElement.lang = l;
}

/**
 * children nên là hàm (xem main.tsx): đổi ngôn ngữ thì hàm được gọi lại, cả cây render lại với chữ mới nhưng KHÔNG bị
 * gỡ ra lắp lại – giữ nguyên dữ liệu đã tải, chữ đang nhập trong form và vị trí cuộn trang.
 * Trước đây dùng key={lang}: mỗi lần đổi ngôn ngữ cả trang dựng lại từ đầu, tải lại dữ liệu, nháy khung chờ và nhảy về đầu trang.
 */
export function LangProvider({ children }: { children: ReactNode | (() => ReactNode) }) {
  const [lang, setLangState] = useState<Lang>(current);

  useEffect(() => { applyDocument(lang); }, [lang]);

  // Đồng bộ khi đổi ở tab khác
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LANG_KEY) return;
      current = readLang();
      setLangState(current);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLang = useCallback((l: Lang) => {
    current = l;
    try { localStorage.setItem(LANG_KEY, l); } catch { /* chế độ riêng tư: chỉ áp dụng trong phiên */ }
    setLangState(l);
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tree = useMemo(() => (typeof children === 'function' ? children() : children), [children, lang]);
  return <LangContext.Provider value={value}>{tree}</LangContext.Provider>;
}

export function useLang() {
  const v = useContext(LangContext);
  if (!v) throw new Error('useLang phải nằm trong LangProvider');
  return v;
}

/** Ghi chú hiển thị ở bản tiếng Anh cho nội dung chưa có bản dịch đã duyệt. */
export function ViOnlyNote() {
  const { lang } = useLang();
  if (lang !== 'en') return null;
  return <p className="tiny muted vi-only" lang="en">This content is shown in Vietnamese only – no reviewed English translation is available yet.</p>;
}
