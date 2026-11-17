import { getLang } from '../i18n';

/**
 * Tên riêng người Việt ở chế độ EN: giữ nguyên thứ tự tên, chỉ bỏ dấu để đọc/ghi bằng bảng chữ Latin.
 * VD: "Lê Hoàng Phúc" → "Le Hoang Phuc", "Nguyễn Thảo Vy" → "Nguyen Thao Vy".
 */
export function displayPersonName(name: string | null | undefined): string {
  if (!name) return '';
  if (getLang() !== 'en') return name;
  return name.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
