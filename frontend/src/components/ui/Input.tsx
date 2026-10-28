import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-143 · HẠN: 28/10/2026
 * CẦN LÀM: UI kit Input. Sau khi đẩy lên không đổi tên prop.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input(props: InputProps) {
  // TODO(Phương): Hoàn thiện UI kit Input có label và error
  return <input {...props} />;
}

export default Input;
