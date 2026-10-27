import { createContext, useContext } from 'react';

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * CẦN LÀM: Lưu người đăng nhập, trạng thái xác thực.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

// TODO(Tùng): Lưu người đăng nhập, token, role và hàm login/logout trong AuthContext
export interface AuthContextType {
  user: unknown;
  isAuthenticated: boolean;
  login: (token: string, role: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
