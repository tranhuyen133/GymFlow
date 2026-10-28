/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03. menu.ts ghi sẵn đủ mục menu cho 3 vai trò.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import type { Role } from '../../api/types/auth';

export interface MenuItem {
  label: string;
  path: string;
  shortLabel?: string;
  end?: boolean;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  TRAINER: 'Huấn luyện viên',
  MEMBER: 'Hội viên',
};

export const PROFILE_ITEM: MenuItem = {
  label: 'Hồ sơ cá nhân',
  shortLabel: 'Hồ sơ',
  path: '/app/profile',
  end: true,
};

export const ADMIN_MENU: MenuItem[] = [
  { label: 'Tổng quan', path: '/app/admin', end: true },
  { label: 'Huấn luyện viên', shortLabel: 'HLV', path: '/app/admin/trainers' },
  { label: 'Gói tập', path: '/app/admin/plans' },
  { label: 'Đăng ký gói', shortLabel: 'Đăng ký', path: '/app/admin/subscriptions' },
  { label: 'Báo cáo', path: '/app/admin/reports' },
  { label: 'Tài khoản', path: '/app/admin/accounts' },
  { label: 'Nhật ký hệ thống', shortLabel: 'Nhật ký', path: '/app/admin/audit-logs' },
];

export const TRAINER_MENU: MenuItem[] = [
  { label: 'Tổng quan', path: '/app/trainer', end: true },
  { label: 'Lịch tập', shortLabel: 'Lịch', path: '/app/trainer/schedule' },
  { label: 'Hội viên', path: '/app/trainer/members' },
  { label: 'Bài tập', path: '/app/trainer/exercises' },
  { label: 'Bài viết', path: '/app/trainer/articles' },
];

export const MEMBER_MENU: MenuItem[] = [
  { label: 'Tổng quan', path: '/app/member', end: true },
  { label: 'Lịch của tôi', shortLabel: 'Lịch', path: '/app/member/schedule' },
  { label: 'Buổi tập hôm nay', shortLabel: 'Hôm nay', path: '/app/member/today' },
  { label: 'Tiến độ', path: '/app/member/progress' },
  { label: 'Gói của tôi', shortLabel: 'Gói', path: '/app/member/subscription' },
];

export const MENU_BY_ROLE: Record<Role, MenuItem[]> = {
  ADMIN: ADMIN_MENU,
  TRAINER: TRAINER_MENU,
  MEMBER: MEMBER_MENU,
};

export function getMenuForRole(role: Role | null | undefined): MenuItem[] {
  return role ? MENU_BY_ROLE[role] : [];
}

export function getMenuTitle(role: Role | null | undefined, pathname: string): string {
  const allItems = [...getMenuForRole(role), PROFILE_ITEM];
  const match = allItems
    .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.label ?? 'GymFlow';
}
