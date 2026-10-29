/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-138 · HẠN: 29/10/2026
 * CẦN LÀM: UI-03. menu.ts ghi sẵn đủ mục menu cho 3 vai trò.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

// TODO(Tùng): Định nghĩa danh sách menu cho 3 vai trò: Admin, Trainer, Member
export interface MenuItem {
  label: string;
  path: string;
}

export const ADMIN_MENU: MenuItem[] = [
  { label: 'Tổng quan', path: '/app/admin' },
  { label: 'Huấn luyện viên', path: '/app/admin/trainers' },
  { label: 'Gói tập', path: '/app/admin/plans' },
  { label: 'Đăng ký gói', path: '/app/admin/subscriptions' },
  { label: 'Báo cáo', path: '/app/admin/reports' },
  { label: 'Tài khoản', path: '/app/admin/accounts' },
  { label: 'Nhật ký hệ thống', path: '/app/admin/audit-logs' },
];

export const TRAINER_MENU: MenuItem[] = [
  { label: 'Tổng quan', path: '/app/trainer' },
  { label: 'Lịch tập', path: '/app/trainer/schedule' },
  { label: 'Hội viên', path: '/app/trainer/members' },
  { label: 'Bài tập', path: '/app/trainer/exercises' },
  { label: 'Bài viết', path: '/app/trainer/articles' },
];

export const MEMBER_MENU: MenuItem[] = [
  { label: 'Tổng quan', path: '/app/member' },
  { label: 'Lịch của tôi', path: '/app/member/schedule' },
  { label: 'Buổi tập hôm nay', path: '/app/member/today' },
  { label: 'Tiến độ', path: '/app/member/progress' },
  { label: 'Gói của tôi', path: '/app/member/subscription' },
];
