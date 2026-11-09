import type { ApiErrorBody } from './types';

const TOKEN_KEY = 'gymflow.token';

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  constructor(status: number, message: string, fieldErrors?: Record<string, string> | null) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors ?? {};
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Gọi khi token hết hạn / tài khoản bị khoá (401) để AuthContext đăng xuất. */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query) {
  const url = new URL('/api' + path, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.pathname + url.search;
}

const TIMEOUT_MS = 20_000;

/** Gửi request kèm token, timeout và chuẩn hoá lỗi; trả về Response đã kiểm tra res.ok. */
async function send(method: string, path: string, body: BodyInit | undefined, headers: Record<string, string>, query?: Query): Promise<Response> {
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), { method, headers, body, signal: ctrl.signal });
  } catch (e) {
    throw new ApiError(0, e instanceof DOMException && e.name === 'AbortError'
      ? 'Máy chủ phản hồi quá lâu, vui lòng thử lại.'
      : 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    const err = (data ?? {}) as Partial<ApiErrorBody>;
    if (res.status === 401 && token && !path.startsWith('/auth/login')) onUnauthorized?.();
    // Phản hồi không phải JSON (VD proxy / CORS chặn) → thông báo chung, không hiện chuỗi kỹ thuật cho người dùng.
    throw new ApiError(res.status, err.message || defaultMessage(res.status, data === null && !!text), err.fieldErrors);
  }
  return res;
}

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await send(method, path, body === undefined ? undefined : JSON.stringify(body), headers, query);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? safeJson(text) : null) as T;
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

function defaultMessage(status: number, nonJson = false) {
  if (status === 401) return 'Phiên đăng nhập đã hết hạn';
  if (status === 403) return nonJson ? 'Máy chủ từ chối yêu cầu (cấu hình truy cập). Vui lòng liên hệ quản trị viên.' : 'Bạn không có quyền thực hiện thao tác này';
  if (status === 404) return 'Không tìm thấy dữ liệu';
  if (status === 413) return 'File quá lớn';
  if (status === 429) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút';
  if (status >= 500) return 'Máy chủ gặp lỗi, vui lòng thử lại';
  return 'Có lỗi xảy ra';
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  del: <T = void>(path: string) => request<T>('DELETE', path),
  /** Gửi multipart/form-data; trình duyệt tự đặt Content-Type kèm boundary nên không tự gán. */
  upload: async <T>(path: string, form: FormData): Promise<T> => {
    const res = await send('POST', path, form, { Accept: 'application/json' });
    return safeJson(await res.text()) as T;
  },
  /** Tải file cần token (VD ảnh đại diện) – thẻ <img> không gửi được header Authorization. */
  blob: async (path: string, query?: Query): Promise<Blob> => (await send('GET', path, undefined, {}, query)).blob(),
};
