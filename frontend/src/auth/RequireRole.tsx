import React from 'react';

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * CẦN LÀM: Chặn route theo vai trò (mục 10.1).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface RequireRoleProps {
  role?: 'ADMIN' | 'TRAINER' | 'MEMBER';
  children: React.ReactNode;
}

export default function RequireRole({ children }: RequireRoleProps) {
  // TODO(Tùng): Kiểm tra quyền đăng nhập và role của user, điều hướng về /login hoặc /403 nếu không hợp lệ
  return <>{children}</>;
}
