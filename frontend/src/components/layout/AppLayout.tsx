import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileTabBar from './MobileTabBar';

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03. Layout dùng chung cho các màn /app/*.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export default function AppLayout() {
  // TODO(Tùng): Bọc layout chung với Topbar, Sidebar (desktop), MobileTabBar (mobile) và Outlet cho trang con
  return (
    <div className="app-layout">
      <Topbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
