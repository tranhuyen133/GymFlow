import { Children, cloneElement, Fragment, isValidElement, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EN } from './en';

/**
 * Đa ngôn ngữ tối giản: chuỗi tiếng Việt chính là khoá, bản tiếng Anh nằm trong en.ts.
 * Thiếu bản dịch thì hiện nguyên tiếng Việt (không tự dịch máy).
 * Nội dung sức khoẻ (mô tả bài tập, bài viết) KHÔNG đưa vào từ điển: chỉ hiện bản tiếng Việt đã duyệt.
 */
export type Lang = 'vi' | 'en';
export const LANG_KEY = 'gf.lang';

function readLang(): Lang {
  try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'vi'; } catch { return 'vi'; }
}

let current: Lang = readLang();
const missing = new Set<string>();

type Vars = Record<string, string | number | null | undefined>;

export function t(vi: string, vars?: Vars): string {
  let s = vi;
  if (current === 'en') {
    const en = EN[vi];
    if (en !== undefined) s = en;
    else if (import.meta.env.DEV && vi && !missing.has(vi)) { missing.add(vi); console.debug('[i18n] thiếu bản dịch:', vi); }
  }
  return vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : s;
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

export function LangProvider({ children }: { children: ReactNode }) {
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
  // key={lang}: dựng lại cây giao diện để mọi chỗ gọi t() lấy ngôn ngữ mới (phiên đăng nhập vẫn giữ trong localStorage).
  return <LangContext.Provider value={value}><Fragment key={lang}>{children}</Fragment></LangContext.Provider>;
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
