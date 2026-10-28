/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03 Sidebar cho desktop.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getMenuForRole, PROFILE_ITEM, ROLE_LABEL } from './menu';

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const items = getMenuForRole(user?.role);

  return (
    <aside
      id="gf-sidebar"
      className={`gf-sidebar ${open ? 'is-open' : ''}`}
      aria-label="Điều hướng chính"
    >
      <div className="gf-brand">
        <span className="gf-brand-mark" aria-hidden="true">
          GF
        </span>
        <span className="gf-brand-name">
          Gym<b>Flow</b>
        </span>
      </div>

      <nav className="gf-nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          >
            <span className="gf-nav-dot" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="gf-sidebar-footer">
        {user && (
          <div className="gf-user-card">
            <span className="gf-avatar" aria-hidden="true">
              {initials(user.fullName)}
            </span>
            <span className="gf-user-meta">
              <strong>{user.fullName}</strong>
              <small>{ROLE_LABEL[user.role]}</small>
            </span>
          </div>
        )}

        <NavLink
          to={PROFILE_ITEM.path}
          end={PROFILE_ITEM.end}
          onClick={onClose}
          className={({ isActive }) => (isActive ? 'is-active' : undefined)}
        >
          <span className="gf-nav-dot" aria-hidden="true" />
          <span>{PROFILE_ITEM.label}</span>
        </NavLink>
      </div>
    </aside>
  );
}
