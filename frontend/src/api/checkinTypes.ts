/** V53 · Check-in tại quầy, mức đông phòng tập, trang "Hôm nay". Đối chiếu backend dto/CheckinDtos.java. */
import type { MuscleGroup, Schedule, Subscription, WorkoutPlanSummary } from './types';

export type CheckinMethod = 'QR' | 'MANUAL';
export type CrowdLevel = 'QUIET' | 'NORMAL' | 'BUSY' | 'UNKNOWN';

/** Mã check-in của hôm nay (mỗi ngày một mã, in dán ở quầy). */
export interface DailyCode {
  code: string;
  /** YYYY-MM-DD */
  date: string;
  url: string;
  /** Mỗi chuỗi là một hàng của mã QR: '1' ô đen, '0' ô trắng. */
  qr: string[];
}

/** Thẻ hội viên: QR chứa mã hội viên để lễ tân quét. */
export interface MemberCard {
  memberCode: string;
  fullName: string;
  qr: string[];
}

export interface Checkin {
  id: number;
  memberId: number;
  memberCode: string;
  memberName: string;
  checkedInAt: string;
  method: CheckinMethod;
  createdByName: string | null;
  planName: string | null;
  daysLeft: number | null;
  sessionTitle: string | null;
  sessionStart: string | null;
}

export interface CheckinResult {
  checkin: Checkin;
  already: boolean;
  visitsThisMonth: number;
}

export interface HourValue { hour: number; value: number }

export interface CheckinToday {
  total: number;
  inGymNow: number;
  items: Checkin[];
  byHour: HourValue[];
}

export interface Crowd {
  source: 'CHECKIN' | 'SCHEDULE';
  days: number;
  /** 1 = Thứ Hai … 7 = Chủ nhật */
  dayOfWeek: number;
  currentHour: number;
  openHour: number;
  closeHour: number;
  today: HourValue[];
  /** 7 hàng (T2 → CN) × 24 giờ */
  week: number[][];
  level: CrowdLevel;
  inGymNow: number;
  peakHour: number | null;
  quietHour: number | null;
  enoughData: boolean;
}

export interface TodayExercise {
  itemId: number;
  exerciseId: number;
  name: string;
  nameEn: string | null;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: string;
  weightKg: number | null;
  restSeconds: number | null;
  durationMinutes: number | null;
  note: string | null;
  hasVideo: boolean;
  imageKey: string | null;
}

export interface TodayData {
  fullName: string;
  date: string;
  dayOfWeek: number;
  checkin: Checkin | null;
  visitsThisMonth: number;
  sessions: Schedule[];
  nextSession: Schedule | null;
  subscription: Subscription | null;
  plan: WorkoutPlanSummary | null;
  workout: TodayExercise[];
  nextPlanDay: number | null;
  streakWeeks: number;
  completedThisMonth: number;
  crowd: Crowd;
}
