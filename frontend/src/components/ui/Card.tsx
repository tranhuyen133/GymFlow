import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-143 · HẠN: 28/10/2026
 * CẦN LÀM: UI kit Card. Sau khi đẩy lên không đổi tên prop.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ title, children, ...props }: CardProps) {
  // TODO(Phương): Hoàn thiện UI kit Card
  return (
    <div {...props}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

export default Card;
