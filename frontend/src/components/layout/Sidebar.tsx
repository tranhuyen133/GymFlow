import { Fragment } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import LayoutIcon from './LayoutIcon';
import {
  ROLE_HOME,
  initials,
  menuForRole,
  roleLabel,
  toLayoutUser,
  type Role,
} from './menu';

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03 Sidebar cho desktop.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

interface SidebarProps {
  role: Role;
  open: boolean;
  onNavigate?: () => void;
}

function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="app-brand-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="gf-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00d95b" />
          <stop offset="1" stopColor="#00b24b" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#gf-brand)" />
      <path d="M11 15v10M29 15v10M14.5 12.5v15M25.5 12.5v15M14.5 20h11" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M31 6 25 34" stroke="#fff" strokeOpacity=".18" strokeWidth="4" />
    </svg>
  );
}

export default function Sidebar({ role, open, onNavigate }: SidebarProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const user = toLayoutUser(auth?.user);
  const items = menuForRole(role);
  let lastGroup: string | undefined;

  const handleLogout = () => {
    auth?.logout();
    navigate('/login');
  };

  return (
    <aside className={`app-sidebar ${open ? 'open' : ''}`} aria-label="Điều hướng chính">
      <Link to={ROLE_HOME[role]} className="app-brand" onClick={onNavigate}>
        <BrandMark />
        <span className="app-brand-name">Gym<b>Flow</b></span>
      </Link>

      <nav className="app-nav">
        {items.map((item) => {
          const showGroup = item.group && item.group !== lastGroup;
          lastGroup = item.group ?? lastGroup;
          return (
            <Fragment key={item.path}>
              {showGroup && <div className="app-nav-group">{item.group}</div>}
              <NavLink
                to={item.path}
                end={item.path === ROLE_HOME[role]}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
                onClick={onNavigate}
              >
                <LayoutIcon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            </Fragment>
          );
        })}
      </nav>

      <div className="app-side-user">
        <span className="app-avatar" aria-hidden="true">{initials(user?.fullName ?? roleLabel(role))}</span>
        <div className="app-side-user-info">
          <strong>{user?.fullName ?? roleLabel(role)}</strong>
          <span>{user?.email ?? roleLabel(role)}</span>
        </div>
        <button type="button" className="app-icon-btn" onClick={handleLogout} aria-label="Đăng xuất" title="Đăng xuất">
          <LayoutIcon name="logout" />
        </button>
      </div>
    </aside>
  );
}
