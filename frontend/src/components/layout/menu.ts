/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03. menu.ts ghi sẵn đủ mục menu cho 3 vai trò.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import type { IconName } from './LayoutIcon';

export type Role = 'ADMIN' | 'TRAINER' | 'MEMBER';

export type MenuGroup = 'Kinh doanh' | 'Huấn luyện' | 'Luyện tập' | 'Hệ thống' | 'Tài khoản';

export interface MenuItem {
  label: string;
  path: string;
  icon: IconName;
  group?: MenuGroup;
  tab?: boolean;
}

export interface LayoutUser {
  fullName?: string;
  email?: string;
  role?: Role;
}

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/app/admin',
  TRAINER: '/app/trainer',
  MEMBER: '/app/member',
};

export const ADMIN_MENU: MenuItem[] = [
  { label: 'Tổng quan', path: '/app/admin', icon: 'dashboard', tab: true },
  { label: 'Huấn luyện viên', path: '/app/admin/trainers', icon: 'badge', group: 'Kinh doanh', tab: true },
  { label: 'Gói tập', path: '/app/admin/plans', icon: 'ticket', group: 'Kinh doanh', tab: true },
  { label: 'Đăng ký gói', path: '/app/admin/subscriptions', icon: 'card', group: 'Kinh doanh', tab: true },
  { label: 'Báo cáo', path: '/app/admin/reports', icon: 'chart', group: 'Kinh doanh' },
  { label: 'Tài khoản', path: '/app/admin/accounts', icon: 'userCog', group: 'Hệ thống' },
  { label: 'Nhật ký hệ thống', path: '/app/admin/audit-logs', icon: 'scroll', group: 'Hệ thống' },
  { label: 'Hồ sơ cá nhân', path: '/app/profile', icon: 'user', group: 'Tài khoản' },
];

export const TRAINER_MENU: MenuItem[] = [
  { label: 'Tổng quan', path: '/app/trainer', icon: 'dashboard', tab: true },
  { label: 'Lịch tập', path: '/app/trainer/schedule', icon: 'calendar', group: 'Huấn luyện', tab: true },
  { label: 'Hội viên', path: '/app/trainer/members', icon: 'users', group: 'Huấn luyện', tab: true },
  { label: 'Bài tập', path: '/app/trainer/exercises', icon: 'dumbbell', group: 'Huấn luyện', tab: true },
  { label: 'Bài viết', path: '/app/trainer/articles', icon: 'layers', group: 'Huấn luyện' },
  { label: 'Hồ sơ cá nhân', path: '/app/profile', icon: 'user', group: 'Tài khoản' },
];

export const MEMBER_MENU: MenuItem[] = [
  { label: 'Tổng quan', path: '/app/member', icon: 'dashboard', tab: true },
  { label: 'Lịch của tôi', path: '/app/member/schedule', icon: 'calendar', group: 'Luyện tập', tab: true },
  { label: 'Buổi tập hôm nay', path: '/app/member/today', icon: 'dumbbell', group: 'Luyện tập', tab: true },
  { label: 'Tiến độ', path: '/app/member/progress', icon: 'chart', group: 'Luyện tập', tab: true },
  { label: 'Gói của tôi', path: '/app/member/subscription', icon: 'ticket', group: 'Luyện tập' },
  { label: 'Hồ sơ cá nhân', path: '/app/profile', icon: 'user', group: 'Tài khoản' },
];

const MENUS: Record<Role, MenuItem[]> = {
  ADMIN: ADMIN_MENU,
  TRAINER: TRAINER_MENU,
  MEMBER: MEMBER_MENU,
};

export function menuForRole(role: Role): MenuItem[] {
  return MENUS[role] ?? MEMBER_MENU;
}

/** Suy ra vai trò từ tiền tố đường dẫn /app/* khi AuthContext chưa có dữ liệu. */
export function roleFromPath(pathname: string): Role {
  if (pathname.startsWith('/app/trainer')) return 'TRAINER';
  if (pathname.startsWith('/app/member')) return 'MEMBER';
  return 'ADMIN';
}

/** Lấy mục menu đang mở, ưu tiên đường dẫn dài nhất để /app/admin không nuốt /app/admin/plans. */
export function activeMenuItem(role: Role, pathname: string): MenuItem | undefined {
  return menuForRole(role)
    .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export function roleLabel(role: Role): string {
  if (role === 'ADMIN') return 'Quản trị viên';
  if (role === 'TRAINER') return 'Huấn luyện viên';
  return 'Hội viên';
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'GF';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

/** AuthContext hiện trả unknown; chuyển an toàn sang dữ liệu layout cần dùng. */
export function toLayoutUser(user: unknown): LayoutUser | null {
  if (!user || typeof user !== 'object') return null;
  const value = user as Record<string, unknown>;
  return {
    fullName: typeof value.fullName === 'string' ? value.fullName : undefined,
    email: typeof value.email === 'string' ? value.email : undefined,
    role: value.role === 'ADMIN' || value.role === 'TRAINER' || value.role === 'MEMBER' ? value.role : undefined,
  };
}

/** Nhãn ngắn cho thanh tab mobile. */
export function shortLabel(label: string): string {
  return label.replace(' của tôi', '').replace(' cá nhân', '').replace(' hôm nay', '').replace('Buổi tập', 'Hôm nay');
}
