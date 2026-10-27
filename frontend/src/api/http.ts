/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * CẦN LÀM: HTTP client gắn JWT, gặp lỗi 401 thì về trang đăng nhập, có cờ bật/tắt mock.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

// TODO(Tùng): Viết fetch client tự động gắn Authorization header, redirect về /login khi gặp 401, hỗ trợ biến môi trường USE_MOCK
export const USE_MOCK = true;

export async function httpClient<T>(url: string, options?: RequestInit): Promise<T> {
  // TODO(Tùng): Implement HTTP wrapper
  return {} as T;
}
