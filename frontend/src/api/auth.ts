/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * CẦN LÀM: login, logout, register, forgotPassword, resetPassword, changePassword.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { httpClient } from './http';
import type {
  ChangePasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from './types/auth';

function postJson<T>(url: string, body?: unknown): Promise<T> {
  return httpClient<T>(url, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return postJson<LoginResponse>('/auth/login', credentials);
}

export function logout(): Promise<void> {
  return postJson<void>('/auth/logout');
}

export function register(input: RegisterRequest): Promise<MessageResponse> {
  return postJson<MessageResponse>('/auth/register', input);
}

export function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return postJson<ForgotPasswordResponse>('/auth/forgot-password', { email });
}

export function resetPassword(input: ResetPasswordRequest): Promise<MessageResponse> {
  return postJson<MessageResponse>('/auth/reset-password', input);
}

export function changePassword(input: ChangePasswordRequest): Promise<MessageResponse> {
  return postJson<MessageResponse>('/auth/change-password', input);
}

export const authApi = {
  login,
  logout,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
};

export default authApi;
