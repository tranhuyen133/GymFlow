import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-143 · HẠN: 28/10/2026
 * CẦN LÀM: UI kit Table. Sau khi đẩy lên không đổi tên prop.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

export function Table(props: TableProps) {
  // TODO(Phương): Hoàn thiện UI kit Table
  return <table {...props} />;
}

export default Table;
