/** V56 · Kiểu dữ liệu tự phục vụ: đổi HLV ngay, đối soát chuyển khoản. */
import type { ChangeRequest, PackageRequest } from './types';

export interface TrainerSwitchPreview {
  trainerId: number;
  trainerName: string;
  /** Số buổi PT sắp tới chuyển được sang HLV mới */
  moving: number;
  /** Buổi trùng giờ với lịch của HLV mới */
  conflicts: string[];
  /** true = đổi ngay; false = gửi quản lý xếp lại */
  instant: boolean;
}

export interface TrainerSwitchResult {
  request: ChangeRequest;
  instant: boolean;
  moved: number;
  notes: string[];
}

export interface ReconcileItem {
  request: PackageRequest;
  autoActivatedAt: string;
  reconciledAt: string | null;
  revokedAt: string | null;
  canRevoke: boolean;
}

export interface ReconcileOverview {
  enabled: boolean;
  openCount: number;
  open: ReconcileItem[];
  recent: ReconcileItem[];
}
