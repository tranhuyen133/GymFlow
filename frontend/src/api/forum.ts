import type { Role } from './types';

/** Kiểu dữ liệu Diễn đàn – khớp ForumDtos.java. Để riêng file để không đụng types.ts dùng chung. */
export type ForumCategory = 'GENERAL' | 'TRAINING' | 'NUTRITION' | 'RECOVERY' | 'GYM';
export type ModerationAction = 'HIDE' | 'SHOW' | 'PIN' | 'UNPIN' | 'LOCK' | 'UNLOCK';

export const FORUM_CATEGORIES: ForumCategory[] = ['GENERAL', 'TRAINING', 'NUTRITION', 'RECOVERY', 'GYM'];

/** Nhãn tiếng Việt; gọi t() lúc hiển thị để đổi theo ngôn ngữ. */
export const FORUM_CATEGORY_VI: Record<ForumCategory, string> = {
  GENERAL: 'Trao đổi chung',
  TRAINING: 'Tập luyện',
  NUTRITION: 'Dinh dưỡng',
  RECOVERY: 'Hồi phục & chấn thương',
  GYM: 'Phòng tập & lịch tập',
};

export interface ForumPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ForumAuthor { id: number; name: string; role: Role }

export interface TopicSummary {
  id: number;
  title: string;
  titleEn?: string | null;
  category: ForumCategory;
  excerpt: string;
  excerptEn?: string | null;
  author: ForumAuthor;
  pinned: boolean;
  locked: boolean;
  hidden: boolean;
  replyCount: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface ForumReply {
  id: number;
  body: string;
  author: ForumAuthor;
  hidden: boolean;
  hiddenReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  mine: boolean;
}

export interface TopicDetail {
  id: number;
  title: string;
  titleEn?: string | null;
  category: ForumCategory;
  body: string;
  bodyEn?: string | null;
  author: ForumAuthor;
  pinned: boolean;
  locked: boolean;
  hidden: boolean;
  hiddenReason: string | null;
  replyCount: number;
  createdAt: string;
  updatedAt: string | null;
  replies: ForumReply[];
  mine: boolean;
  canModerate: boolean;
  /** Máy chủ nhận ra người xem đã đăng nhập. Giao diện còn user mà false = phiên đã hết hạn. */
  viewerSignedIn: boolean;
}

export interface ForumReport {
  id: number;
  topicId: number;
  topicTitle: string;
  replyId: number | null;
  excerpt: string;
  targetAuthor: string;
  targetHidden: boolean;
  reporter: string;
  reason: string;
  createdAt: string;
}

export interface TopicForm { title: string; titleEn?: string; category: ForumCategory; body: string; bodyEn?: string }
