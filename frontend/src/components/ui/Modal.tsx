import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
/** CHỦ FILE: Phương · SCRUM-143. Native dialog quản lý focus và inert nền. */
export interface ModalProps { isOpen: boolean; onClose: () => void; title?: string; children?: ReactNode }
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; trigger?.focus(); };
  }, [isOpen]);
  return createPortal(<dialog ref={ref} className="gf-modal" aria-labelledby={title ? titleId : undefined}
    aria-label={title ? undefined : 'Hộp thoại'} onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) {
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
    } }}>
    <div className="gf-modal-header">{title && <h2 id={titleId}>{title}</h2>}<Button variant="ghost" onClick={onClose} aria-label="Đóng hộp thoại">Đóng</Button></div>
    {children}
  </dialog>, document.body);
}
export default Modal;
