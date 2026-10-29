import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import LayoutIcon from './LayoutIcon';
import { activeMenuItem, initials, roleLabel, toLayoutUser, type Role } from './menu';

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03 Topbar hiển thị thông tin người dùng và nút đăng xuất.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

interface TopbarProps {
  role: Role;
  onOpenMenu: () => void;
}

function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="app-clock">
      <strong>{now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>
      <span>{now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
    </div>
  );
}

export default function Topbar({ role, onOpenMenu }: TopbarProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = toLayoutUser(auth?.user);
  const current = activeMenuItem(role, pathname);
  const displayName = user?.fullName ?? roleLabel(role);

  const handleLogout = () => {
    auth?.logout();
    navigate('/login');
  };

  return (
    <header className="app-topbar">
      <button type="button" className="app-icon-btn app-menu-btn" onClick={onOpenMenu} aria-label="Mở menu">
        <LayoutIcon name="menu" />
      </button>

      <div className="app-crumb">
        GymFlow / <b>{current?.label ?? 'Chi tiết'}</b>
      </div>

      <div className="app-topbar-spacer" />
      <Clock />

      <div className="app-user-chip">
        <span className="app-avatar" aria-hidden="true">{initials(displayName)}</span>
        <span className="app-user-name">{displayName}</span>
      </div>

      <button type="button" className="app-icon-btn" onClick={handleLogout} aria-label="Đăng xuất" title="Đăng xuất">
        <LayoutIcon name="logout" />
      </button>
    </header>
  );
}
