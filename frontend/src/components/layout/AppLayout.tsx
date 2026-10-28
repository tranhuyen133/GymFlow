/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03. Layout dùng chung cho các màn /app/*.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MobileTabBar from './MobileTabBar';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './layout.css';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const media = window.matchMedia('(max-width: 900px)');
    if (!media.matches) {
      setMenuOpen(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (!event.matches) setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    media.addEventListener('change', handleMediaChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      media.removeEventListener('change', handleMediaChange);
    };
  }, [menuOpen]);

  return (
    <div className="gf-app">
      <a className="gf-skip-link" href="#gf-main">
        Bỏ qua điều hướng
      </a>

      <Topbar onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <div className="gf-app-body">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        {menuOpen && (
          <button
            type="button"
            className="gf-scrim"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <main id="gf-main" className="gf-content">
          <Outlet />
        </main>
      </div>

      <MobileTabBar onMore={() => setMenuOpen(true)} />
    </div>
  );
}
