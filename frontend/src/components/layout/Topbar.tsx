/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03 Topbar hiển thị thông tin người dùng và nút đăng xuất.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getMenuTitle, ROLE_LABEL } from './menu';

export interface TopbarProps {
  onOpenMenu: () => void;
  menuOpen: boolean;
}

export default function Topbar({ onOpenMenu, menuOpen }: TopbarProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = getMenuTitle(user?.role, pathname);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="gf-topbar">
      <button
        type="button"
        className="gf-icon-btn gf-menu-btn"
        onClick={onOpenMenu}
        aria-label="Mở menu"
        aria-expanded={menuOpen}
        aria-controls="gf-sidebar"
      >
        <span className="gf-hamburger" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>

      <div className="gf-topbar-brand">
        Gym<b>Flow</b>
      </div>

      <div className="gf-topbar-title">
        <span className="gf-topbar-eyebrow">GymFlow</span>
        <strong>{title}</strong>
      </div>

      <div className="gf-topbar-actions">
        {user && (
          <div className="gf-topbar-user">
            <strong>{user.fullName}</strong>
            <small>{ROLE_LABEL[user.role]}</small>
          </div>
        )}
        <button type="button" className="gf-logout-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
