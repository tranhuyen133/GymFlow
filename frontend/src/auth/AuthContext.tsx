/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * CẦN LÀM: Lưu người đăng nhập, trạng thái xác thực.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { clearSession, setUnauthorizedHandler, tokenStore, userStore } from '../api/http';
import type { AuthUser, LoginResponse } from '../api/types/auth';

export type { AuthUser, Role } from '../api/types/auth';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function readInitialUser(): AuthUser | null {
  if (!tokenStore.get()) return null;
  const stored = userStore.get();
  if (!stored) {
    // Token còn nhưng user không đọc được: coi như phiên hỏng, xoá luôn để tránh kẹt.
    clearSession();
    return null;
  }
  return stored;
}

function normalizeUser(response: LoginResponse, email: string): AuthUser {
  if (response.user) return response.user;
  return {
    email,
    fullName: response.fullName || email,
    role: response.role || 'MEMBER',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readInitialUser);

  const logout = useCallback(() => {
    // Gọi logout best-effort rồi xoá phiên ngay để UI không bị treo.
    void authApi.logout().catch(() => undefined);
    tokenStore.clear();
    userStore.clear();
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const nextUser = normalizeUser(response, email);
    tokenStore.set(response.token);
    userStore.set(nextUser);
    setUser(nextUser);
    return nextUser;
  }, []);

  const refresh = useCallback(() => {
    setUser(readInitialUser());
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      userStore.clear();
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, isAuthenticated: !!user, login, logout, refresh }),
    [user, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải nằm trong AuthProvider');
  return context;
};

export default AuthContext;
