import { useEffect } from 'react';
import { api } from '../api/client';
import type { Role } from '../api/types';

const HEARTBEAT_MS = 30_000;

/**
 * Gửi heartbeat để máy chủ biết tài khoản đang hoạt động (V47).
 * Chỉ Hội viên / Huấn luyện viên – Quản trị viên xem tin ở chế độ chỉ đọc.
 * Dừng khi tab bị ẩn và gửi lại ngay khi quay lại tab.
 */
export function usePresenceHeartbeat(role: Role | undefined) {
  useEffect(() => {
    if (role !== 'MEMBER' && role !== 'TRAINER') return;
    const beat = () => {
      if (document.hidden) return;
      api.post('/presence/heartbeat').catch(() => {});
    };
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    const onVisibility = () => { if (!document.hidden) beat(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [role]);
}
