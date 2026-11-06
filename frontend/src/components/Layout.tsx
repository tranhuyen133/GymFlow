/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138
 * Layout dùng chung cho khu ứng dụng: sidebar desktop, topbar, tab bar mobile.
 */
import { Fragment, useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Notification, Role } from '../api/types';
import { useMe, useAuth } from '../auth/AuthContext';
import { relativeTime, roleLabel } from '../lib/format';
import { Brand } from './Brand';
import { Icon, type IconName } from './Icon';
import { MyAvatar } from './AvatarEditor';
import { Badge, Button, Confirm } from './ui';
import { ThemeToggle } from '../theme/ThemeToggle';
import { locale, t } from '../i18n';

interface NavItem { to: string; label: string; icon: IconName; roles: Role[]; group?: string; tab?: boolean }

export const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Tổng quan', icon: 'dashboard', roles: ['ADMIN', 'TRAINER', 'MEMBER'], tab: true },
  { to: '/me/schedule', label: 'Lịch tập của tôi', icon: 'calendar', roles: ['MEMBER'], tab: true },
  { to: '/me/plan', label: 'Giáo án của tôi', icon: 'clipboard', roles: ['MEMBER'], tab: true },
  { to: '/me/progress', label: 'Tiến độ', icon: 'chart', roles: ['MEMBER'], tab: true },
  { to: '/me/journey', label: 'Hành trình của tôi', icon: 'trophy', roles: ['MEMBER'] },
  { to: '/me/packages', label: 'Gói tập của tôi', icon: 'ticket', roles: ['MEMBER'] },
  { to: '/schedules', label: 'Lịch tập', icon: 'calendar', roles: ['ADMIN', 'TRAINER'], tab: true },
  { to: '/members', label: 'Hội viên', icon: 'users', roles: ['ADMIN', 'TRAINER'], group: 'Huấn luyện', tab: true },
  { to: '/workout-plans', label: 'Giáo án', icon: 'clipboard', roles: ['ADMIN', 'TRAINER'], group: 'Huấn luyện', tab: true },
  { to: '/exercises', label: 'Thư viện bài tập', icon: 'dumbbell', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Huấn luyện' },
  { to: '/community', label: 'Diễn đàn', icon: 'message', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Huấn luyện' },
  { to: '/trainers', label: 'Huấn luyện viên', icon: 'badge', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/plans', label: 'Gói tập', icon: 'ticket', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/subscriptions', label: 'Đăng ký gói', icon: 'card', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/package-requests', label: 'Duyệt đăng ký gói', icon: 'checkCircle', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/reports', label: 'Báo cáo', icon: 'chart', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/users', label: 'Tài khoản & quyền', icon: 'userCog', roles: ['ADMIN'], group: 'Hệ thống' },
  { to: '/audit-logs', label: 'Nhật ký hệ thống', icon: 'scroll', roles: ['ADMIN'], group: 'Hệ thống' },
  { to: '/profile', label: 'Hồ sơ cá nhân', icon: 'user', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Tài khoản' },
  { to: '/', label: 'Trang giới thiệu', icon: 'home', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Tài khoản' },
];

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  return (
    <div className="clock">
      <div className="num">{now.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="tiny muted">{now.toLocaleDateString(locale(), { weekday: 'long', day: '2-digit', month: '2-digit' })}</div>
    </div>
  );
}

function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>(() => JSON.parse(sessionStorage.getItem('gf.seen') ?? '[]'));
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    let alive = true;
    const load = () => api.get<Notification[]>('/notifications').then((x) => alive && setItems(x)).catch(() => undefined);
    void load();
    const t = setInterval(load, 120_000);
    return () => { alive = false; clearInterval(t); };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const unread = items.filter((n) => !seen.includes(n.id)).length;
  const toggle = () => {
    setOpen((o) => !o);
    const ids = items.map((n) => n.id);
    setSeen(ids);
    sessionStorage.setItem('gf.seen', JSON.stringify(ids));
  };
  const icon = (l: Notification['level']): IconName => (l === 'danger' ? 'alert' : l === 'warning' ? 'clock' : 'info');

  return (
    <div className="bell" ref={ref}>
      <Button variant="ghost" icon="bell" aria-label={t('Thông báo ({n} mới)', { n: unread })} onClick={toggle} />
      {unread > 0 && <span className="dot">{unread}</span>}
      {open && (
        <div className="popover" role="menu">
          <div className="row between" style={{ padding: '6px 10px 10px' }}>
            <b>{t('Thông báo')}</b><span className="tiny faint">{t('{n} mục', { n: items.length })}</span>
          </div>
          {items.length === 0 && <div className="empty" style={{ padding: 24 }}><Icon name="checkCircle" /><p className="small">{t('Không có việc gì cần chú ý')}</p></div>}
          {items.map((n) => (
            <div key={n.id} className={`notif ${n.level}`} role="menuitem" tabIndex={0}
              onClick={() => { setOpen(false); if (n.link) navigate(n.link); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && n.link) { setOpen(false); navigate(n.link); } }}>
              <div className="ic"><Icon name={icon(n.level)} /></div>
              <div className="grow">
                <div className="small" style={{ fontWeight: 700 }}>{t(n.title)}</div>
                <div className="tiny muted">{t(n.message)}</div>
                <div className="tiny faint mt-4">{relativeTime(n.at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Đóng khi bấm ra ngoài hoặc nhấn Esc – dùng cho menu tài khoản. */
function useDismiss(open: boolean, ref: RefObject<HTMLElement>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, ref, close]);
}

/** Avatar + menu tài khoản ở góc phải topbar: có ở mọi kích thước màn hình nên luôn tìm được nút Đăng xuất. */
function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const user = useMe();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="account" ref={ref}>
      <button type="button" className="account-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        aria-label={t('Tài khoản: {name}', { name: user.fullName })}>
        <MyAvatar size="sm" />
        <span className="account-name">{user.fullName}</span>
        <Icon name="chevronDown" size={15} className="account-caret" />
      </button>
      {open && (
        <div className="popover account-pop" role="menu">
          <div className="account-head">
            <MyAvatar size="lg" />
            <div style={{ minWidth: 0 }}>
              <b className="ellipsis">{user.fullName}</b>
              <div className="tiny muted ellipsis">{user.email}</div>
              <div className="mt-4"><Badge tone="green">{roleLabel[user.role]}</Badge></div>
            </div>
          </div>
          <Link to="/profile" role="menuitem" className="menu-item"><Icon name="user" />{t('Hồ sơ cá nhân')}</Link>
          {user.role === 'MEMBER' && <Link to="/me/packages" role="menuitem" className="menu-item"><Icon name="ticket" />{t('Gói tập của tôi')}</Link>}
          {user.role === 'MEMBER' && <Link to="/me/progress" role="menuitem" className="menu-item"><Icon name="chart" />{t('Tiến độ')}</Link>}
          <div className="menu-prefs"><span className="tiny muted">{t('Giao diện & ngôn ngữ')}</span><ThemeToggle /></div>
          <button type="button" role="menuitem" className="menu-item danger" onClick={() => { setOpen(false); onLogout(); }}><Icon name="logout" />{t('Đăng xuất')}</button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const user = useMe();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);

  // Drawer mở trên tablet/điện thoại: khoá cuộn trang phía sau, Esc để đóng, đưa focus vào nút đóng
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    closeBtn.current?.focus();
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open]);

  const items = NAV.filter((n) => n.roles.includes(user.role));
  const current = items.find((n) => pathname === n.to || pathname.startsWith(n.to + '/'));
  const tabs = items.filter((n) => n.tab).slice(0, 4);
  const doLogout = () => { logout(); navigate('/login'); };
  let lastGroup: string | undefined;

  return (
    <div className="shell">
      <aside id="app-sidebar" className={`sidebar ${open ? 'open' : ''}`} aria-label={t('Điều hướng chính')}>
        <div className="side-head">
          <Link to="/" title={t('Về trang giới thiệu GymFlow')} aria-label={t('Về trang giới thiệu GymFlow')}><Brand /></Link>
          <button ref={closeBtn} type="button" className="btn btn-ghost btn-icon side-close" aria-label={t('Đóng menu')} onClick={() => setOpen(false)}><Icon name="x" /></button>
        </div>
        <nav className="nav">
          {items.map((n) => {
            const showGroup = n.group && n.group !== lastGroup;
            lastGroup = n.group ?? lastGroup;
            return (
              <Fragment key={n.to}>
                {showGroup && <div className="nav-group">{t(n.group!)}</div>}
                <NavLink to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <Icon name={n.icon} /><span>{t(n.label)}</span>
                </NavLink>
              </Fragment>
            );
          })}
        </nav>
        <div className="side-prefs"><ThemeToggle /></div>
        <div className="side-user">
          <Link to="/profile" className="side-user-link" aria-label={t('Hồ sơ cá nhân')}>
            <MyAvatar />
            <div className="grow" style={{ minWidth: 0 }}>
              <div>{user.fullName}</div>
              <div className="tiny faint">{roleLabel[user.role]}</div>
            </div>
          </Link>
          <Button variant="ghost" size="sm" icon="logout" className="side-logout" aria-label="Đăng xuất" title="Đăng xuất" onClick={() => setAskLogout(true)}>
            <span className="side-logout-text">{t('Đăng xuất')}</span>
          </Button>
        </div>
      </aside>
      {open && <div className="mobile-scrim" onClick={() => setOpen(false)} aria-hidden />}

      <div className="main">
        <header className="topbar">
          <Button className="menu-btn" variant="ghost" icon="menu" aria-label="Mở menu" aria-controls="app-sidebar" aria-expanded={open} onClick={() => setOpen(true)} />
          <div className="crumb"><span className="crumb-root">GymFlow / </span><b>{t(current?.label ?? 'Chi tiết')}</b></div>
          <div className="spacer" />
          <Clock />
          <ThemeToggle className="top-theme" />
          <Notifications />
          <AccountMenu onLogout={() => setAskLogout(true)} />
        </header>
        <main className="content" id="main">
          <Outlet />
        </main>
      </div>

      <nav className="tabbar" aria-label={t('Điều hướng nhanh')}>
        {tabs.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={n.icon} /><span>{t(n.label.replace(' của tôi', ''))}</span>
          </NavLink>
        ))}
        <a href="#menu" aria-controls="app-sidebar" aria-expanded={open} onClick={(e) => { e.preventDefault(); setOpen(true); }}><Icon name="more" /><span>{t('Thêm')}</span></a>
      </nav>

      {askLogout && <Confirm title="Đăng xuất?" message={t('Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng GymFlow.')} confirmText="Đăng xuất"
        onClose={() => setAskLogout(false)} onConfirm={doLogout} />}
    </div>
  );
}
