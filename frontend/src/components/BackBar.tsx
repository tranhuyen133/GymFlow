/**
 * V56 · Nút "Quay lại" dùng chung:
 * - Trang mở từ chỗ khác (Trợ lý AI, Tiến độ, bài tập cho người mới…) không có mục trên menu: hiện thanh "Quay lại" về đúng trang trước.
 * - Link quay lại cố định sẵn có trên trang chi tiết (class kết thúc bằng "-back", VD exd-back, cd-back): nếu người dùng
 *   đi tới từ một trang trong app thì quay về đúng trang đó (giữ bộ lọc, vị trí cuộn) thay vì luôn về trang danh sách.
 */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { t } from '../i18n';

const SHOW_ON = ['/member/ai-chat', '/exercises/beginner', '/me/progress', '/me/journey', '/me/entitlements', '/getting-started', '/articles', '/me/knowledge'];

/** Trang hiện tại được mở từ một trang khác trong app (không phải gõ địa chỉ / mở tab mới). */
export const canGoBack = () => ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;

export function BackBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[class$="-back"], a[class*="-back "], a[data-back]');
      if (!a || !canGoBack()) return;
      e.preventDefault();
      navigate(-1);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate]);

  if (!SHOW_ON.some((p) => pathname === p || pathname.startsWith(p + '/')) || !canGoBack()) return null;
  return (
    <div className="backbar">
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
        <Icon name="arrowLeft" size={15} /><span>{t('Quay lại')}</span>
      </button>
    </div>
  );
}
