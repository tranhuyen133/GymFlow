import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-147 · HẠN: 02/11/2026
 * CẦN LÀM: Toast + lỗi form có aria-invalid, focus vào trường lỗi (NFR-U03).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function Toast({ message, type = 'info' }: ToastProps) {
  // TODO(Phương): Toast thông báo có aria-live
  return <div role="status" className={`toast toast-${type}`}>{message}</div>;
}

export default Toast;
