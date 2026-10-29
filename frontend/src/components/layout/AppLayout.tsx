import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import MobileTabBar from './MobileTabBar';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { roleFromPath, toLayoutUser } from './menu';
import './layout.css';

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03. Layout dùng chung cho các màn /app/*.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export default function AppLayout() {
  const { pathname } = useLocation();
  const auth = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = toLayoutUser(auth?.user)?.role ?? roleFromPath(pathname);

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="app-layout">
      <Sidebar role={role} open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          type="button"
          className="app-scrim"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main">
        <Topbar role={role} onOpenMenu={() => setSidebarOpen(true)} />
        <main className="app-content" id="main">
          <Outlet />
        </main>
      </div>

      <MobileTabBar role={role} onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
}
