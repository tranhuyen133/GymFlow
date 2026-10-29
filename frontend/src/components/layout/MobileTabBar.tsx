import { NavLink } from 'react-router-dom';
import LayoutIcon from './LayoutIcon';
import { menuForRole, shortLabel, type Role } from './menu';

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03 MobileTabBar thanh điều hướng dưới đáy màn hình trên mobile.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

interface MobileTabBarProps {
  role: Role;
  onOpenMenu: () => void;
}

export default function MobileTabBar({ role, onOpenMenu }: MobileTabBarProps) {
  const tabs = menuForRole(role).filter((item) => item.tab).slice(0, 4);

  return (
    <nav className="app-tabbar" aria-label="Điều hướng nhanh">
      {tabs.map((item) => (
        <NavLink key={item.path} to={item.path} end className={({ isActive }) => (isActive ? 'active' : undefined)}>
          <LayoutIcon name={item.icon} />
          <span>{shortLabel(item.label)}</span>
        </NavLink>
      ))}
      <button type="button" onClick={onOpenMenu}>
        <LayoutIcon name="more" />
        <span>Thêm</span>
      </button>
    </nav>
  );
}
