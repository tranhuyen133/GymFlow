/**
 * RPT-04 · Xuất CSV mở được bằng Excel mà không lỗi tiếng Việt.
 * - UTF-8 có BOM để Excel nhận đúng bảng mã; xuống dòng CRLF.
 * - Bọc ngoặc kép khi có dấu phẩy, chấm phẩy, ngoặc kép hoặc xuống dòng (kể cả \r).
 * - Chuỗi bắt đầu bằng = + - @ (hoặc tab / \r) được thêm dấu ' phía trước để Excel không chạy như công thức (CSV injection).
 *   Số giữ nguyên, kể cả số âm.
 * - Chuỗi dạng "11/2026", "3/5" Excel tự đổi thành ngày → dùng csvText() cho các cột cần giữ nguyên chữ.
 */
export type CsvValue = string | number | null | undefined;
export type CsvColumn<T> = { header: string; value: (row: T) => CsvValue };

const BOM = '\uFEFF';
const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTE = /[",;\r\n]/;
/** Excel đổi các chuỗi này thành ngày/phân số khi mở file */
const DATE_LIKE = /^\s*\d{1,4}\s*[/-]\s*\d{1,4}(\s*[/-]\s*\d{1,4})?\s*$/;

/** Đánh dấu giá trị phải hiển thị nguyên văn trong Excel (vd. nhãn tháng "11/2026"). */
export function csvText(v: CsvValue): string {
  const s = v == null ? '' : String(v);
  return DATE_LIKE.test(s) ? `${s}\u200B` : s;
}

export function csvCell(v: CsvValue): string {
  if (v == null) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  let s = String(v);
  if (FORMULA_START.test(s)) s = `'${s}`;
  return NEEDS_QUOTE.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Nội dung file CSV (đã gồm BOM). Tách khỏi downloadCsv để test được không cần trình duyệt. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(','), ...rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(','))];
  return BOM + lines.join('\r\n') + '\r\n';
}

/** Tên file an toàn cho mọi hệ điều hành, luôn có đuôi .csv */
export function csvFilename(name: string): string {
  const base = name.replace(/\.csv$/i, '').replace(/[\\/:*?"<>|\u0000-\u001F]+/g, '-').trim() || 'du-lieu';
  return `${base}.csv`;
}

/** Xuất CSV có BOM để Excel đọc đúng tiếng Việt. */
export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const blob = new Blob([toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = csvFilename(filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
