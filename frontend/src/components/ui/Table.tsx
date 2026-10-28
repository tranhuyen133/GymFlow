import type { TableHTMLAttributes } from 'react';
/** CHỦ FILE: Phương · SCRUM-143. */
export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {}
export function Table({ className = '', ...props }: TableProps) {
  return <div className="gf-table-scroll" role="region" aria-label={props['aria-label'] || 'Bảng dữ liệu'} tabIndex={0}>
    <table {...props} className={`gf-table ${className}`} />
  </div>;
}
export default Table;
