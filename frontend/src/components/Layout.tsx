/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138
 * Layout dùng chung cho khu ứng dụng: sidebar desktop (nhóm gập/mở, thu gọn được), topbar, tab bar mobile, hướng dẫn lần đầu.
 */
import { Fragment, useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Notification, OnboardingData, Role } from '../api/types';
import { useMe, useAuth } from '../auth/AuthContext';
import { relativeTime, roleLabel } from '../lib/format';
import { Brand } from './Brand';
import { Icon, type IconName } from './Icon';
import { MyAvatar } from './AvatarEditor';
import { ChatWidget } from './ChatWidget';
import { Badge, Button, Confirm } from './ui';
import { ThemeToggle } from '../theme/ThemeToggle';
import { locale, t } from '../i18n';
import { Tour } from './Tour';
import './nav.css';

interface NavItem { to: string; label: string; icon: IconName; roles: Role[]; group?: string; tab?: boolean }

/**
 * Mục không có group luôn hiện; mục cùng group (đứng liền nhau) gom thành nhóm gập/mở được.
 * Thứ tự ở đây là thứ tự trên menu. tab: hiện ở tab bar điện thoại (4 mục đầu theo vai trò).
 */
export const NAV: NavItem[] = [
  { to: '/getting-started', label: 'Bắt đầu', icon: 'sparkle', roles: ['MEMBER'], tab: true },
  { to: '/dashboard', label: 'Tổng quan', icon: 'dashboard', roles: ['ADMIN', 'TRAINER', 'MEMBER'], tab: true },
  { to: '/messages', label: 'Tin nhắn', icon: 'message', roles: ['TRAINER', 'MEMBER'] },
  { to: '/me/schedule', label: 'Lịch tập của tôi', icon: 'calendar', roles: ['MEMBER'], tab: true },
  { to: '/me/plan', label: 'Giáo án của tôi', icon: 'clipboard', roles: ['MEMBER'], tab: true },
  { to: '/me/packages', label: 'Gói tập của tôi', icon: 'ticket', roles: ['MEMBER'], group: 'Dịch vụ' },
  { to: '/coaches', label: 'Huấn luyện viên', icon: 'badge', roles: ['MEMBER'], group: 'Dịch vụ' },
  { to: '/schedules', label: 'Lịch tập', icon: 'calendar', roles: ['ADMIN', 'TRAINER'], tab: true },
  { to: '/me/progress', label: 'Tiến độ', icon: 'chart', roles: ['MEMBER'], group: 'Sức khoẻ & tiến độ', tab: true },
  { to: '/me/journey', label: 'Hành trình của tôi', icon: 'trophy', roles: ['MEMBER'], group: 'Sức khoẻ & tiến độ' },
  { to: '/members', label: 'Hội viên', icon: 'users', roles: ['ADMIN', 'TRAINER'], group: 'Huấn luyện', tab: true },
  { to: '/workout-plans', label: 'Giáo án', icon: 'clipboard', roles: ['ADMIN', 'TRAINER'], group: 'Huấn luyện', tab: true },
  { to: '/exercises', label: 'Thư viện bài tập', icon: 'dumbbell', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Kiến thức' },
  { to: '/equipment', label: 'Dụng cụ tập', icon: 'zap', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Kiến thức' },
  { to: '/programs', label: 'Lịch tập mẫu', icon: 'layers', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Kiến thức' },
  { to: '/community', label: 'Diễn đàn', icon: 'message', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Kiến thức' },
  { to: '/trainers', label: 'Huấn luyện viên', icon: 'badge', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/plans', label: 'Gói tập', icon: 'ticket', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/subscriptions', label: 'Đăng ký gói', icon: 'card', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/package-requests', label: 'Duyệt đăng ký gói', icon: 'checkCircle', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/payment-settings', label: 'Thanh toán', icon: 'wallet', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/reports', label: 'Báo cáo', icon: 'chart', roles: ['ADMIN'], group: 'Kinh doanh' },
  { to: '/users', label: 'Tài khoản & quyền', icon: 'userCog', roles: ['ADMIN'], group: 'Hệ thống' },
  { to: '/audit-logs', label: 'Nhật ký hệ thống', icon: 'scroll', roles: ['ADMIN'], group: 'Hệ thống' },
  { to: '/profile', label: 'Hồ sơ cá nhân', icon: 'user', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Tài khoản' },
  { to: '/help', label: 'Trợ giúp', icon: 'info', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Tài khoản' },
  { to: '/', label: 'Trang giới thiệu', icon: 'home', roles: ['ADMIN', 'TRAINER', 'MEMBER'], group: 'Tài khoản' },
];

const GROUPS_KEY = 'gf.nav.groups';
const MINI_KEY = 'gf.side.mini';
const readJson = <T,>(k: string, fallback: T): T => { try { return (JSON.parse(localStorage.getItem(k) ?? 'null') as T) ?? fallback; } catch { return fallback; } };
const writeLocal = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ } };

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

function Notifications({ userId }: { userId: number }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  // Nhớ thông báo đã xem theo tài khoản, qua cả lần đăng nhập sau (trước đây chỉ nhớ trong phiên nên mở lại là báo đỏ lại)
  const seenKey = `gf.seen.${userId}`;
  const [seen, setSeen] = useState<string[]>(() => { const v = readJson<unknown>(seenKey, []); return Array.isArray(v) ? (v as string[]) : []; });
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
    writeLocal(seenKey, JSON.stringify(ids));
  };
  const icon = (l: Notification['level']): IconName => (l === 'danger' ? 'alert' : l === 'warning' ? 'clock' : 'info');

  return (
    <div className="bell" ref={ref} data-tour="bell">
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
    <div className="account" ref={ref} data-tour="account">
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
          <Link to="/help" role="menuitem" className="menu-item"><Icon name="info" />{t('Trợ giúp')}</Link>
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
  const [mini, setMini] = useState(() => readJson<boolean>(MINI_KEY, false) === true);
  const [groups, setGroups] = useState<Record<string, boolean>>(() => readJson<Record<string, boolean>>(GROUPS_KEY, {}));
  /** Nhóm đang được hướng dẫn mở tạm (không ghi đè lựa chọn gập/mở của người dùng) */
  const [reveal, setReveal] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [readyToTrain, setReadyToTrain] = useState<boolean | null>(null);
  const tourDrawer = useRef(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);

  // Kiểm tra trạng thái sẵn sàng tập để hiện chấm đỏ nhắc nhở trên mục "Bắt đầu"
  useEffect(() => {
    if (user.role !== 'MEMBER') return;
    let alive = true;
    api.get<OnboardingData>('/me/onboarding')
      .then((res) => { if (alive) setReadyToTrain(res.readyToTrain); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user.role, pathname]);

  // Polling số tin nhắn chưa đọc (60s), dừng khi tab bị ẩn
  useEffect(() => {
    if (user.role !== 'MEMBER' && user.role !== 'TRAINER') return;
    let alive = true;
    const loadUnread = () => {
      if (document.hidden) return;
      api.get<{ unreadCount: number }>('/conversations/unread-count')
        .then((res) => { if (alive) setUnreadMessages(res.unreadCount); })
        .catch(() => {});
    };
    loadUnread();
    const timer = setInterval(loadUnread, 60_000);
    const onVisibility = () => { if (!document.hidden) loadUnread(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user.role, pathname]);

  // Drawer mở trên tablet/điện thoại: khoá cuộn trang phía sau, Esc để đóng, đưa focus vào nút đóng
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    if (!tourDrawer.current) closeBtn.current?.focus(); // drawer do hướng dẫn mở: focus ở lại hộp thoại hướng dẫn
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open]);

  const items = NAV.filter((n) => n.roles.includes(user.role));
  const current = items.find((n) => pathname === n.to || pathname.startsWith(n.to + '/'));
  const tabs = items.filter((n) => n.tab).slice(0, 4);
  const doLogout = () => { logout(); navigate('/login'); };

  // Gom các mục liền nhau cùng group thành một khối
  const sections: { group?: string; items: NavItem[] }[] = [];
  items.forEach((n) => {
    const last = sections[sections.length - 1];
    if (last && last.group === n.group) last.items.push(n);
    else sections.push({ group: n.group, items: [n] });
  });
  // Chưa từng bấm gập/mở: chỉ mở sẵn nhóm chứa trang đang xem
  const isOpen = (g: string, hasActive: boolean) => g === reveal || (groups[g] ?? hasActive);
  const toggleGroup = (g: string, now: boolean) => setGroups((p) => {
    const n = { ...p, [g]: !now };
    writeLocal(GROUPS_KEY, JSON.stringify(n));
    return n;
  });
  const toggleMini = () => setMini((m) => { writeLocal(MINI_KEY, JSON.stringify(!m)); return !m; });

  // Hướng dẫn cần chỉ vào menu: mở nhóm chứa mục đó; trên điện thoại mở drawer
  const onTourNav = useCallback((to: string | true | null) => {
    setReveal(typeof to === 'string' ? NAV.find((n) => n.to === to)?.group ?? null : null);
    const narrow = window.matchMedia('(max-width: 900px)').matches;
    if (to && narrow) { tourDrawer.current = true; setOpen(true); }
    else if (tourDrawer.current) { tourDrawer.current = false; setOpen(false); }
  }, []);

  const link = (n: NavItem) => (
    <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}
      title={mini ? t(n.label) : undefined} data-tour={`nav:${n.to}`}>
      <Icon name={n.icon} /><span>{t(n.label)}</span>
      {n.to === '/messages' && unreadMessages > 0 && <span className="nav-badge">{unreadMessages}</span>}
      {n.to === '/getting-started' && readyToTrain === false && <span className="nav-badge dot-remind" />}
    </NavLink>
  );

  return (
    <div className={`shell ${mini ? 'side-mini' : ''}`}>
      <aside id="app-sidebar" className={`sidebar ${open ? 'open' : ''}`} aria-label={t('Điều hướng chính')}>
        <div className="side-head">
          <Link to="/" title={t('Về trang giới thiệu GymFlow')} aria-label={t('Về trang giới thiệu GymFlow')}><Brand /></Link>
          <button type="button" className="btn btn-ghost btn-icon side-mini-btn" aria-pressed={mini}
            aria-label={mini ? t('Mở rộng menu') : t('Thu gọn menu')} title={mini ? t('Mở rộng menu') : t('Thu gọn menu')} onClick={toggleMini}>
            <Icon name={mini ? 'chevronRight' : 'chevronLeft'} />
          </button>
          <button ref={closeBtn} type="button" className="btn btn-ghost btn-icon side-close" aria-label={t('Đóng menu')} onClick={() => setOpen(false)}><Icon name="x" /></button>
        </div>
        <nav className="nav" data-tour="nav">
          {sections.map((s, i) => {
            if (!s.group) return <Fragment key={`top-${i}`}>{s.items.map(link)}</Fragment>;
            const hasActive = s.items.some((n) => n === current);
            const opened = isOpen(s.group, hasActive);
            const id = `nav-sec-${i}`;
            return (
              <div key={s.group} className="nav-section">
                <button type="button" className={`nav-group-btn ${hasActive ? 'has-active' : ''}`} aria-expanded={opened} aria-controls={id}
                  onClick={() => toggleGroup(s.group!, opened)}>
                  <span>{t(s.group)}</span><Icon name="chevronDown" size={14} />
                </button>
                <div id={id} className={`nav-sub ${opened ? '' : 'collapsed'}`}>{s.items.map(link)}</div>
              </div>
            );
          })}
        </nav>
        <div className="side-prefs"><ThemeToggle /></div>
        <div className="side-user">
          <Link to="/profile" className="side-user-link" aria-label={t('Hồ sơ cá nhân')} title={mini ? user.fullName : undefined}>
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
          <Link to="/help" className="btn btn-ghost btn-icon top-help" aria-label={t('Trợ giúp')} title={t('Trợ giúp')} data-tour="help"><Icon name="info" /></Link>
          <Notifications userId={user.id} />
          <AccountMenu onLogout={() => setAskLogout(true)} />
        </header>
        <main className="content" id="main" data-tour="content">
          <Outlet />
        </main>
      </div>

      <nav className="tabbar" aria-label={t('Điều hướng nhanh')}>
        {tabs.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')} data-tour={`nav:${n.to}`}>
            <Icon name={n.icon} /><span>{t(n.label.replace(' của tôi', ''))}</span>
            {n.to === '/messages' && unreadMessages > 0 && <span className="nav-badge">{unreadMessages}</span>}
            {n.to === '/getting-started' && readyToTrain === false && <span className="nav-badge dot-remind" />}
          </NavLink>
        ))}
        <a href="#menu" aria-controls="app-sidebar" aria-expanded={open} onClick={(e) => { e.preventDefault(); setOpen(true); }}><Icon name="more" /><span>{t('Thêm')}</span></a>
      </nav>

      <Tour onNav={onTourNav} />

      {askLogout && <Confirm title="Đăng xuất?" message={t('Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng GymFlow.')} confirmText="Đăng xuất"
        onClose={() => setAskLogout(false)} onConfirm={doLogout} />}
      <ChatWidget />
    </div>
  );
}
