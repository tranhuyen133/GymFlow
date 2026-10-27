import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-143 · HẠN: 28/10/2026
 * CẦN LÀM: UI kit Modal. Sau khi đẩy lên không đổi tên prop.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // TODO(Phương): Hoàn thiện UI kit Modal
  if (!isOpen) return null;
  return (
    <div role="dialog">
      <div>
        {title && <h2>{title}</h2>}
        <button onClick={onClose} type="button">Đóng</button>
        {children}
      </div>
    </div>
  );
}

export default Modal;
