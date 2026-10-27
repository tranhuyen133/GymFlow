import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-143 · HẠN: 28/10/2026
 * CẦN LÀM: UI kit Button. Sau khi đẩy lên không đổi tên prop.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export function Button({ children, ...props }: ButtonProps) {
  // TODO(Phương): Hoàn thiện UI kit Button theo design token
  return <button {...props}>{children}</button>;
}

export default Button;
