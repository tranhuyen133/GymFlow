/**
 * CHỦ FILE: Phương. Hợp đồng đầu vào của giao diện; chưa phải DTO backend đã chốt.
 * Tùng/Kiên nối các callback này với api/auth.ts và api/plans.ts ở route.
 * Không chứa HTTP, dữ liệu giả, lưu token hay logic phân quyền.
 */
export interface LoginValues { username: string; password: string }
export interface RegisterValues { fullName: string; email: string; phone?: string; password: string; acceptedPolicy: boolean }
export interface ResetValues { token: string; password: string }
export interface PublicPlan { id: string | number; name: string; price: number; description: string; features: string[] }
export const unavailableMessage = 'Chức năng này đang được hoàn thiện. Vui lòng thử lại sau.';
