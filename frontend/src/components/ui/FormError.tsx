import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-147 · HẠN: 02/11/2026
 * CẦN LÀM: Toast + lỗi form có aria-invalid, focus vào trường lỗi (NFR-U03).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface FormErrorProps {
  error?: string;
  fieldId?: string;
}

export function FormError({ error, fieldId }: FormErrorProps) {
  // TODO(Phương): Hiển thị lỗi form có aria-invalid, hỗ trợ focus vào trường lỗi (NFR-U03)
  if (!error) return null;
  return <span id={fieldId ? `${fieldId}-error` : undefined} role="alert" style={{ color: 'red' }}>{error}</span>;
}

export default FormError;
