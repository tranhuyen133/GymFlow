/**
 * Lưới an toàn cho giao diện tiếng Anh: sau khi React vẽ xong, chữ nào trên trang (nút, nhãn, placeholder, title…)
 * trùng đúng một khoá tiếng Việt trong từ điển mà vẫn còn tiếng Việt thì thay bằng bản tiếng Anh.
 * Chỉ thay khi khớp nguyên văn một khoá – không dịch máy, không đụng nội dung người dùng nhập, vùng lang="vi",
 * data-i18n-skip, pre / code / textarea. Đổi về tiếng Việt thì trả lại chữ gốc (React không tự vẽ lại chữ không đổi).
 */
import { getLang, lookup } from './index';

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const;
const SKIP = '[lang="vi"], [data-i18n-skip], pre, code, textarea, script, style, [contenteditable="true"]';

interface Swap { orig: string; en: string }
const texts = new Map<Text, Swap>();
const attrs = new Map<Element, Map<string, Swap>>();
let observer: MutationObserver | null = null;

function translated(raw: string): string | null {
  const key = raw.trim();
  if (!key) return null;
  const en = lookup(key);
  if (!en || en === key) return null;
  const start = raw.indexOf(key);
  return raw.slice(0, start) + en + raw.slice(start + key.length);
}

function skipped(el: Element | null) {
  return !el || !!el.closest(SKIP);
}

function doText(node: Text) {
  const raw = node.nodeValue ?? '';
  const prev = texts.get(node);
  if (prev && raw === prev.en) return;
  if (skipped(node.parentElement)) return;
  const en = translated(raw);
  if (en == null) { if (prev) texts.delete(node); return; }
  texts.set(node, { orig: raw, en });
  node.nodeValue = en;
}

function doAttrs(el: Element) {
  if (skipped(el)) return;
  for (const a of ATTRS) {
    const raw = el.getAttribute(a);
    if (raw == null) continue;
    const saved = attrs.get(el)?.get(a);
    if (saved && raw === saved.en) continue;
    const en = translated(raw);
    if (en == null) continue;
    let m = attrs.get(el);
    if (!m) { m = new Map(); attrs.set(el, m); }
    m.set(a, { orig: raw, en });
    el.setAttribute(a, en);
  }
}

function scan(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { doText(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (skipped(el)) return;
  doAttrs(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeType === Node.ELEMENT_NODE && (n as Element).matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) doText(n as Text); else doAttrs(n as Element);
  }
}

function start() {
  if (observer || typeof MutationObserver === 'undefined') return;
  scan(document.body);
  observer = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') doText(m.target as Text);
      else if (m.type === 'attributes') doAttrs(m.target as Element);
      else m.addedNodes.forEach(scan);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
}

function stop() {
  observer?.disconnect();
  observer = null;
  texts.forEach((s, node) => { if (node.nodeValue === s.en) node.nodeValue = s.orig; });
  attrs.forEach((m, el) => m.forEach((s, a) => { if (el.getAttribute(a) === s.en) el.setAttribute(a, s.orig); }));
  texts.clear();
  attrs.clear();
}

function sync() {
  if (getLang() === 'en') start(); else stop();
}

/** Gọi một lần lúc khởi động: theo dõi thuộc tính lang của <html> (LangProvider cập nhật sau mỗi lần đổi ngôn ngữ). */
export function installDomTranslate() {
  if (typeof document === 'undefined') return;
  new MutationObserver(() => {
    // Đổi ngôn ngữ: dừng hẳn rồi quét lại để chữ mới vẽ bằng ngôn ngữ mới cũng được kiểm tra
    stop();
    sync();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(sync, 0));
  else setTimeout(sync, 0);
}
