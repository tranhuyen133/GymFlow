/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03 MobileTabBar thanh điều hướng dưới đáy màn hình trên mobile.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getMenuForRole } from './menu';

export interface MobileTabBarProps {
  onMore: () => void;
}

export default function MobileTabBar({ onMore }: MobileTabBarProps) {
  const { user } = useAuth();
  const items = getMenuForRole(user?.role).slice(0, 4);

  return (
    <nav className="gf-tabbar" aria-label="Điều hướng nhanh">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) => (isActive ? 'is-active' : undefined)}
        >
          <span className="gf-tab-dot" aria-hidden="true" />
          <span>{item.shortLabel ?? item.label}</span>
        </NavLink>
      ))}

      <button type="button" className="gf-tab-more" onClick={onMore}>
        <span className="gf-tab-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>Thêm</span>
      </button>
    </nav>
  );
}
