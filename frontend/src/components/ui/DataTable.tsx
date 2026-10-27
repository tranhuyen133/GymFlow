import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-169 · HẠN: 02/11/2026
 * CẦN LÀM: Bảng dữ liệu có phân trang, dùng chung cho mọi màn danh sách.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface DataTableProps<T = unknown> {
  data?: T[];
  columns?: Array<{ header: string; accessor: string | ((row: T) => React.ReactNode) }>;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T = unknown>({ data = [] }: DataTableProps<T>) {
  // TODO(Phương): Bảng dữ liệu có phân trang, dùng chung cho mọi màn danh sách
  return (
    <div>
      <table>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td>Không có dữ liệu</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
