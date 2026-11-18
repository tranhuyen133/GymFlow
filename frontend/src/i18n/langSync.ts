/**
 * V55 · Lưu ngôn ngữ người dùng chọn trên web về máy chủ để email tự động gửi đúng ngôn ngữ.
 * LangProvider phát sự kiện "gf-lang" mỗi khi đổi ngôn ngữ; đổi ở tab khác thì bắt qua sự kiện storage.
 * Vừa đăng nhập (có token mới) cũng gửi lại một lần.
 */
import { api, tokenStore } from '../api/client';
import { LANG_KEY } from '.';

let lastSent: string | null = null;
let lastToken: string | null = null;

function currentLang(): 'vi' | 'en' {
  try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'vi'; } catch { return 'vi'; }
}

function sync(force = false) {
  const token = tokenStore.get();
  if (!token) { lastToken = null; return; }
  const lang = currentLang();
  if (!force && lang === lastSent && token === lastToken) return;
  lastSent = lang;
  lastToken = token;
  void api.put('/me/locale', { locale: lang }).catch(() => { lastSent = null; });
}

export function installLangSync() {
  if (typeof window === 'undefined') return;
  window.addEventListener('gf-lang', () => sync());
  window.addEventListener('storage', (e) => { if (e.key === LANG_KEY) sync(); });
  // Đăng nhập / đổi tài khoản trong cùng tab không có sự kiện riêng: kiểm tra token mỗi 5 giây (chỉ đọc localStorage)
  window.setInterval(() => { if (tokenStore.get() !== lastToken) sync(); }, 5000);
  window.setTimeout(() => sync(), 1500);
}
