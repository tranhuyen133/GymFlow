/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * GHI CHÚ: File MỚI do Tùng thêm cho phần xác thực. Khi gộp type dùng chung thì có thể xoá file này.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export type Role = 'ADMIN' | 'TRAINER' | 'MEMBER';

export interface AuthUser {
  id?: number;
  email: string;
  fullName: string;
  role: Role;
  memberId?: number | null;
  trainerId?: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresInMinutes?: number;
  role?: Role;
  fullName?: string;
  user?: AuthUser;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string | null;
  validMinutes?: number;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface MessageResponse {
  message: string;
}
