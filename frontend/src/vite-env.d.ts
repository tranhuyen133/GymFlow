/// <reference types="vite/client" />

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * GHI CHÚ: File MỚI do Tùng thêm để khai báo biến môi trường Vite.
 */

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
