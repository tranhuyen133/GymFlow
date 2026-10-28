/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * CẦN LÀM: HTTP client gắn JWT, gặp lỗi 401 thì về trang đăng nhập, có cờ bật/tắt mock.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { ApiError } from './errors';
import type { AuthUser, Role } from './types/auth';

const TOKEN_KEY = 'gymflow.token';
const USER_KEY = 'gymflow.user';
const TIMEOUT_MS = 20_000;
const ROLES: Role[] = ['ADMIN', 'TRAINER', 'MEMBER'];

/** Bật mock bằng VITE_USE_MOCK=true. SCRUM-140 sẽ nối dữ liệu giả vào cờ này. */
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true';

function readStorage(key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  } catch {
    // Trình duyệt chặn localStorage: bỏ qua, phiên đăng nhập chỉ tồn tại trong bộ nhớ.
  }
}

function removeStorage(key: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  } catch {
    // Không có gì cần xử lý.
  }
}

export const tokenStore = {
  get: (): string | null => readStorage(TOKEN_KEY),
  set: (token: string): void => writeStorage(TOKEN_KEY, token),
  clear: (): void => removeStorage(TOKEN_KEY),
};

export const userStore = {
  get: (): AuthUser | null => {
    const raw = readStorage(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<AuthUser> | null;
      if (!parsed || typeof parsed.email !== 'string') return null;
      if (!ROLES.includes(parsed.role as Role)) return null;
      return parsed as AuthUser;
    } catch {
      return null;
    }
  },
  set: (user: AuthUser): void => writeStorage(USER_KEY, JSON.stringify(user)),
  clear: (): void => removeStorage(USER_KEY),
};

export function clearSession(): void {
  tokenStore.clear();
  userStore.clear();
}

let onUnauthorized: (() => void) | null = null;

/** AuthContext đăng ký hàm này để xoá user trong React state khi token hết hạn. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/login') return;
  window.location.assign('/login');
}

function buildUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const clean = url.replace(/^\/+/, '');
  if (clean === 'api' || clean.startsWith('api/')) return `/${clean}`;
  return `/api/${clean}`;
}

function defaultMessage(status: number): string {
  if (status === 401) return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu.';
  if (status === 429) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau.';
  if (status >= 500) return 'Máy chủ gặp lỗi, vui lòng thử lại.';
  return 'Có lỗi xảy ra, vui lòng thử lại.';
}

interface ErrorBody {
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function httpClient<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (USE_MOCK) {
    // SCRUM-140 sẽ thay nhánh này bằng mockRequest. Hiện báo lỗi rõ thay vì gọi nhầm backend.
    throw new ApiError(501, 'Mock API chưa được cài đặt. Đặt VITE_USE_MOCK=false để gọi backend.');
  }

  const token = tokenStore.get();
  const headers = new Headers(options.headers);
  const method = (options.method ?? 'GET').toUpperCase();

  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(buildUrl(url), {
      ...options,
      method,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    throw new ApiError(
      0,
      aborted
        ? 'Máy chủ phản hồi quá lâu, vui lòng thử lại.'
        : 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.',
    );
  } finally {
    window.clearTimeout(timer);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const body = (data && typeof data === 'object' ? data : {}) as ErrorBody;
    const isLoginRequest = url.includes('/auth/login');
    if (response.status === 401 && token && !isLoginRequest) {
      clearSession();
      onUnauthorized?.();
      redirectToLogin();
    }
    throw new ApiError(response.status, body.message || defaultMessage(response.status), body.fieldErrors);
  }

  return data as T;
}

export { ApiError } from './errors';
export { getErrorMessage, isApiError } from './errors';
