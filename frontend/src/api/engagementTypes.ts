/** V55 · Kiểu dữ liệu cho email tự động, huy hiệu và thống kê HLV (khớp EngagementDtos.java). */

export type EmailKind =
  | 'RENEWAL' | 'BIRTHDAY' | 'SESSION_REMINDER' | 'WEEKLY_DIGEST'
  | 'TRAINER_REPORT' | 'RETENTION' | 'ACHIEVEMENT' | 'SECURITY';

export interface EmailPrefs { locale: 'vi' | 'en'; prefs: Partial<Record<EmailKind, boolean>>; mailConfigured: boolean }

export interface UnsubscribeInfo { maskedEmail: string; fullName: string; locale: 'vi' | 'en'; prefs: Partial<Record<EmailKind, boolean>> }

export interface EmailLogRow {
  id: number; toEmail: string; kind: EmailKind; refKey: string; subject: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED'; attempts: number; error: string | null; createdAt: string; sentAt: string | null;
}

export interface EmailKindSummary { kind: EmailKind; schedule: string; sent: number; failed: number; skipped: number }
export interface EmailSummary { mailConfigured: boolean; from: string; kinds: EmailKindSummary[] }
export interface EmailPreview { kind: EmailKind; locale: string; subject: string; html: string }
export interface EmailRunResult { kind: EmailKind; sent: number }

export interface BadgeItem {
  code: string; icon: string; titleVi: string; titleEn: string; descVi: string; descEn: string;
  goal: number; progress: number; earned: boolean; earnedAt: string | null; isNew: boolean;
}
export interface Records {
  totalWorkouts: number; totalCheckins: number; totalCalories: number; totalMinutes: number;
  currentStreakWeeks: number; longestStreakWeeks: number; bestWeekWorkouts: number;
  maxSessionCalories: number; longestSessionMinutes: number; activeDays: number;
}
export interface BadgesData { badges: BadgeItem[]; records: Records; earnedCount: number }

export interface InactiveMember { memberId: number; fullName: string; code: string; daysAway: number | null; lastVisit: string | null }
export interface WeekPoint { weekStart: string; completed: number; missed: number }
export interface TrainerStats {
  trainerId: number; fullName: string; days: number;
  sessionsTotal: number; completed: number; missed: number; cancelled: number; upcoming: number;
  attendanceRate: number | null; avgRating: number | null; ratingCount: number;
  members: number; activeMembers: number; membersTrained: number;
  inactiveMembers: InactiveMember[]; weeks: WeekPoint[];
}

/** Tên hiển thị từng loại email (khoá tiếng Việt, bản dịch ở en-v8.ts). */
export const EMAIL_KIND_LABEL: Record<EmailKind, string> = {
  RENEWAL: 'Nhắc gia hạn gói',
  BIRTHDAY: 'Ưu đãi sinh nhật',
  SESSION_REMINDER: 'Nhắc lịch tập',
  WEEKLY_DIGEST: 'Tóm tắt tuần',
  TRAINER_REPORT: 'Báo cáo sáng',
  RETENTION: 'Nhắc khi lâu không tới',
  ACHIEVEMENT: 'Huy hiệu mới',
  SECURITY: 'Mã xác thực / đặt lại mật khẩu',
};

export const EMAIL_KIND_DESC: Record<EmailKind, string> = {
  RENEWAL: 'Khi gói còn 7 ngày, kèm ưu đãi gia hạn đang chạy',
  BIRTHDAY: 'Đầu tháng sinh nhật, kèm ưu đãi sinh nhật',
  SESSION_REMINDER: '19:00 hôm trước, lịch tập của ngày mai',
  WEEKLY_DIGEST: 'Sáng thứ Hai: buổi tập, calo, chuỗi tuần, lịch tuần mới',
  TRAINER_REPORT: '07:00 mỗi ngày: lịch dạy, hội viên vắng, hội viên lâu không tới',
  RETENTION: 'Khi 10 ngày chưa tới phòng, kèm gợi ý buổi tập ngắn',
  ACHIEVEMENT: 'Khi bạn đạt huy hiệu mới',
  SECURITY: 'Luôn gửi khi có yêu cầu, không tắt được',
};
