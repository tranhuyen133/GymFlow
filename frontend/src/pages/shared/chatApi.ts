import { ApiError, api, tokenStore } from '../../api/client';
import type { ChatMessageItem } from '../../api/types';

/** Tải tệp lên kèm tiến độ và nút huỷ (fetch không báo tiến độ tải lên, nên dùng XMLHttpRequest). */
export function uploadAttachment(
  conversationId: number,
  file: File,
  caption: string,
  onProgress: (percent: number) => void,
): { promise: Promise<ChatMessageItem>; cancel: () => void } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<ChatMessageItem>((resolve, reject) => {
    const form = new FormData();
    form.append('file', file, file.name);
    if (caption.trim()) form.append('caption', caption.trim());
    xhr.open('POST', `/api/conversations/${conversationId}/attachments`);
    xhr.setRequestHeader('Accept', 'application/json');
    const token = tokenStore.get();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 5 * 60 * 1000;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100))); };
    xhr.onload = () => {
      let data: { message?: string } | null = null;
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { data = null; }
      if (xhr.status >= 200 && xhr.status < 300 && data) { onProgress(100); resolve(data as ChatMessageItem); return; }
      const fallback = xhr.status === 413 ? 'File quá lớn'
        : xhr.status === 429 ? 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút'
          : xhr.status === 401 ? 'Phiên đăng nhập đã hết hạn'
            : xhr.status >= 500 ? 'Máy chủ gặp lỗi, vui lòng thử lại' : 'Có lỗi xảy ra';
      reject(new ApiError(xhr.status, data?.message || fallback));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.'));
    xhr.ontimeout = () => reject(new ApiError(0, 'Máy chủ phản hồi quá lâu, vui lòng thử lại.'));
    xhr.onabort = () => reject(new ApiError(-1, 'Đã huỷ gửi tệp'));
    xhr.send(form);
  });
  return { promise, cancel: () => xhr.abort() };
}

/**
 * Bộ nhớ đệm URL tạm (object URL) của tệp đính kèm – tệp cần token nên không dùng trực tiếp trong thẻ img/video.
 * Giới hạn 40 tệp; cũ nhất bị giải phóng trước để không giữ RAM mãi.
 */
const cache = new Map<number, Promise<string>>();
const MAX_CACHE = 40;

export function attachmentUrl(messageId: number): Promise<string> {
  const hit = cache.get(messageId);
  if (hit) {
    cache.delete(messageId);
    cache.set(messageId, hit);
    return hit;
  }
  const p = api.blob(`/messages/${messageId}/attachment`).then((b) => URL.createObjectURL(b));
  p.catch(() => cache.delete(messageId));
  cache.set(messageId, p);
  while (cache.size > MAX_CACHE) {
    const [oldId, oldP] = cache.entries().next().value as [number, Promise<string>];
    cache.delete(oldId);
    oldP.then((u) => URL.revokeObjectURL(u)).catch(() => {});
  }
  return p;
}

/** Bỏ tệp khỏi bộ nhớ đệm khi tin bị thu hồi / xoá phía mình. */
export function forgetAttachment(messageId: number) {
  const p = cache.get(messageId);
  if (!p) return;
  cache.delete(messageId);
  p.then((u) => URL.revokeObjectURL(u)).catch(() => {});
}

/** Tải tệp xuống máy với tên gốc. */
export async function downloadAttachment(messageId: number, fileName: string) {
  const url = await attachmentUrl(messageId);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'tep-dinh-kem';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
