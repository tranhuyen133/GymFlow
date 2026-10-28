/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-140 · HẠN: 29/10/2026
 * GHI CHÚ: File MỚI do Tùng thêm. Dữ liệu giả hội viên, HLV và mock API cho FE chạy trước khi BE xong.
 * Khi backend hoàn thiện, đặt VITE_USE_MOCK=false là có thể xoá toàn bộ thư mục này.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { ApiError } from '../errors';
import type { AuthUser, LoginRequest } from '../types/auth';

export type MockMemberStatus = 'ACTIVE' | 'PAUSED' | 'INACTIVE';
export type MockAccountStatus = 'ACTIVE' | 'LOCKED';
export type MockGender = 'MALE' | 'FEMALE' | 'OTHER';
export type MockSubscriptionState = 'UPCOMING' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED';

export interface MockTrainerShift {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface MockTrainer {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  experienceYears: number;
  certificates: string | null;
  bio: string | null;
  active: boolean;
  accountStatus: MockAccountStatus;
  memberCount: number;
  shifts: MockTrainerShift[];
}

export interface MockMember {
  id: number;
  userId: number;
  code: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: MockGender | null;
  heightCm: number | null;
  goal: string | null;
  address: string | null;
  status: MockMemberStatus;
  accountStatus: MockAccountStatus;
  trainerId: number | null;
  trainerName: string | null;
  joinedAt: string;
  note: string | null;
  currentPlanName: string | null;
  subscriptionState: MockSubscriptionState | null;
  subscriptionEndDate: string | null;
  daysLeft: number | null;
}

export interface MockPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MockAccount {
  email: string;
  password: string;
  user: AuthUser;
}

export const mockTrainers: MockTrainer[] = [
  {
    id: 1,
    userId: 2,
    fullName: 'Nguyễn Minh Quân',
    email: 'quan.nguyen@gymflow.vn',
    phone: '0901 234 567',
    specialty: 'Sức mạnh & tăng cơ',
    experienceYears: 8,
    certificates: 'NASM-CPT, CSCS',
    bio: 'Chuyên huấn luyện sức mạnh nền tảng và tăng cơ an toàn cho người mới.',
    active: true,
    accountStatus: 'ACTIVE',
    memberCount: 4,
    shifts: [
      { id: 1, dayOfWeek: 1, startTime: '06:00:00', endTime: '10:00:00' },
      { id: 2, dayOfWeek: 3, startTime: '06:00:00', endTime: '10:00:00' },
      { id: 3, dayOfWeek: 5, startTime: '17:00:00', endTime: '21:00:00' },
    ],
  },
  {
    id: 2,
    userId: 3,
    fullName: 'Trần Thu Hà',
    email: 'ha.tran@gymflow.vn',
    phone: '0912 345 678',
    specialty: 'Yoga & linh hoạt',
    experienceYears: 6,
    certificates: 'RYT-200',
    bio: 'Hướng dẫn yoga phục hồi, cải thiện tư thế và độ linh hoạt.',
    active: true,
    accountStatus: 'ACTIVE',
    memberCount: 2,
    shifts: [
      { id: 4, dayOfWeek: 2, startTime: '08:00:00', endTime: '12:00:00' },
      { id: 5, dayOfWeek: 4, startTime: '08:00:00', endTime: '12:00:00' },
      { id: 6, dayOfWeek: 6, startTime: '08:00:00', endTime: '11:00:00' },
    ],
  },
  {
    id: 3,
    userId: 4,
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@gymflow.vn',
    phone: '0938 765 432',
    specialty: 'Giảm cân & cardio',
    experienceYears: 5,
    certificates: 'ACE-CPT',
    bio: 'Thiết kế lộ trình giảm cân bền vững kết hợp cardio và kiểm soát dinh dưỡng.',
    active: true,
    accountStatus: 'ACTIVE',
    memberCount: 2,
    shifts: [
      { id: 7, dayOfWeek: 1, startTime: '17:00:00', endTime: '21:00:00' },
      { id: 8, dayOfWeek: 3, startTime: '17:00:00', endTime: '21:00:00' },
      { id: 9, dayOfWeek: 7, startTime: '07:00:00', endTime: '11:00:00' },
    ],
  },
];

export const mockMembers: MockMember[] = [
  {
    id: 1,
    userId: 3,
    code: 'MEM001',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@example.com',
    phone: '0905 111 222',
    dateOfBirth: '1995-03-12',
    gender: 'MALE',
    heightCm: 172,
    goal: 'Tăng cơ, cải thiện sức mạnh',
    address: 'Hà Nội',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE',
    trainerId: 1,
    trainerName: 'Nguyễn Minh Quân',
    joinedAt: '2026-01-15',
    note: 'Đã tập 6 tháng, ưu tiên buổi sáng.',
    currentPlanName: 'Gói 6 tháng',
    subscriptionState: 'ACTIVE',
    subscriptionEndDate: '2026-12-15',
    daysLeft: 48,
  },
  {
    id: 2,
    userId: 5,
    code: 'MEM002',
    fullName: 'Trần Thị Bích',
    email: 'bich.tran@example.com',
    phone: '0906 222 333',
    dateOfBirth: '1998-07-08',
    gender: 'FEMALE',
    heightCm: 160,
    goal: 'Giảm cân, săn chắc',
    address: 'Hà Nội',
    status: 'PAUSED',
    accountStatus: 'ACTIVE',
    trainerId: 1,
    trainerName: 'Nguyễn Minh Quân',
    joinedAt: '2026-03-02',
    note: 'Tạm nghỉ 2 tuần vì lịch công tác.',
    currentPlanName: 'Gói 3 tháng',
    subscriptionState: 'EXPIRING',
    subscriptionEndDate: '2026-11-05',
    daysLeft: 8,
  },
  {
    id: 3,
    userId: 6,
    code: 'MEM003',
    fullName: 'Lê Quang Dũng',
    email: 'dung.le@example.com',
    phone: '0907 333 444',
    dateOfBirth: '1992-11-21',
    gender: 'MALE',
    heightCm: 178,
    goal: 'Duy trì thể lực',
    address: 'Đà Nẵng',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE',
    trainerId: 2,
    trainerName: 'Trần Thu Hà',
    joinedAt: '2026-02-10',
    note: null,
    currentPlanName: 'Gói 12 tháng',
    subscriptionState: 'ACTIVE',
    subscriptionEndDate: '2027-02-10',
    daysLeft: 105,
  },
  {
    id: 4,
    userId: 7,
    code: 'MEM004',
    fullName: 'Phạm Thu Trang',
    email: 'trang.pham@example.com',
    phone: '0908 444 555',
    dateOfBirth: '2000-01-30',
    gender: 'FEMALE',
    heightCm: 158,
    goal: 'Cải thiện tư thế',
    address: 'Hà Nội',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE',
    trainerId: 2,
    trainerName: 'Trần Thu Hà',
    joinedAt: '2026-06-18',
    note: 'Ưu tiên yoga phục hồi.',
    currentPlanName: 'Gói 3 tháng',
    subscriptionState: 'ACTIVE',
    subscriptionEndDate: '2026-12-01',
    daysLeft: 34,
  },
  {
    id: 5,
    userId: 8,
    code: 'MEM005',
    fullName: 'Hoàng Văn Em',
    email: 'em.hoang@example.com',
    phone: '0909 555 666',
    dateOfBirth: '1988-09-09',
    gender: 'MALE',
    heightCm: 170,
    goal: 'Giảm mỡ',
    address: 'Hải Phòng',
    status: 'INACTIVE',
    accountStatus: 'LOCKED',
    trainerId: 3,
    trainerName: 'Lê Hoàng Nam',
    joinedAt: '2025-11-20',
    note: 'Gói đã hết hạn, cần tư vấn gia hạn.',
    currentPlanName: 'Gói 1 tháng',
    subscriptionState: 'EXPIRED',
    subscriptionEndDate: '2026-09-30',
    daysLeft: 0,
  },
  {
    id: 6,
    userId: 9,
    code: 'MEM006',
    fullName: 'Đỗ Thị Giang',
    email: 'giang.do@example.com',
    phone: '0910 666 777',
    dateOfBirth: '1997-05-16',
    gender: 'FEMALE',
    heightCm: 162,
    goal: 'Tăng sức bền',
    address: 'Hà Nội',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE',
    trainerId: 3,
    trainerName: 'Lê Hoàng Nam',
    joinedAt: '2026-04-05',
    note: null,
    currentPlanName: 'Gói 6 tháng',
    subscriptionState: 'ACTIVE',
    subscriptionEndDate: '2026-11-20',
    daysLeft: 23,
  },
  {
    id: 7,
    userId: 10,
    code: 'MEM007',
    fullName: 'Vũ Đức Hải',
    email: 'hai.vu@example.com',
    phone: '0911 777 888',
    dateOfBirth: '1993-12-02',
    gender: 'MALE',
    heightCm: 175,
    goal: 'Tăng cơ',
    address: 'Hà Nội',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE',
    trainerId: 1,
    trainerName: 'Nguyễn Minh Quân',
    joinedAt: '2026-07-22',
    note: 'Buổi tối sau 18h.',
    currentPlanName: 'Gói 3 tháng',
    subscriptionState: 'ACTIVE',
    subscriptionEndDate: '2026-12-22',
    daysLeft: 55,
  },
  {
    id: 8,
    userId: 11,
    code: 'MEM008',
    fullName: 'Bùi Thị Lan',
    email: 'lan.bui@example.com',
    phone: '0912 888 999',
    dateOfBirth: '1999-08-14',
    gender: 'FEMALE',
    heightCm: 165,
    goal: 'Tập luyện cơ bản',
    address: 'Hà Nội',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE',
    trainerId: null,
    trainerName: null,
    joinedAt: '2026-09-01',
    note: 'Chờ phân công HLV.',
    currentPlanName: 'Gói 1 tháng',
    subscriptionState: 'ACTIVE',
    subscriptionEndDate: '2026-11-01',
    daysLeft: 4,
  },
];

/** Tài khoản demo cho chế độ mock. Mật khẩu chung: 123456 */
export const mockAccounts: MockAccount[] = [
  {
    email: 'admin@gymflow.vn',
    password: '123456',
    user: {
      id: 1,
      email: 'admin@gymflow.vn',
      fullName: 'Quản trị viên GymFlow',
      role: 'ADMIN',
    },
  },
  {
    email: 'trainer@gymflow.vn',
    password: '123456',
    user: {
      id: 2,
      email: 'trainer@gymflow.vn',
      fullName: 'Nguyễn Minh Quân',
      role: 'TRAINER',
      trainerId: 1,
    },
  },
  {
    email: 'member@gymflow.vn',
    password: '123456',
    user: {
      id: 3,
      email: 'member@gymflow.vn',
      fullName: 'Nguyễn Văn An',
      role: 'MEMBER',
      memberId: 1,
    },
  },
];

const MOCK_DELAY_MS = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseBody(body: BodyInit | null | undefined): unknown {
  if (typeof body !== 'string') return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function normalizePath(url: string): URL {
  const path = url.startsWith('/api') ? url : `/api${url.startsWith('/') ? '' : '/'}${url}`;
  return new URL(path, 'http://mock.local');
}

function numberParam(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Mock router tối giản. Chỉ phục vụ các endpoint Tùng cần cho SCRUM-139/140/141/142.
 * Endpoint chưa hỗ trợ sẽ trả 404 để dễ phát hiện khi ghép với phần của người khác.
 */
export async function mockRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  await delay(MOCK_DELAY_MS);

  const parsed = normalizePath(url);
  const path = parsed.pathname.replace(/^\/api/, '');
  const method = (options.method ?? 'GET').toUpperCase();
  const body = parseBody(options.body);

  if (method === 'POST' && path === '/auth/login') {
    const input = (body ?? {}) as Partial<LoginRequest> & { username?: string };
    const email = String(input.email ?? input.username ?? '').trim().toLowerCase();
    const password = String(input.password ?? '');
    const account = mockAccounts.find((item) => item.email.toLowerCase() === email);

    if (!account || account.password !== password) {
      throw new ApiError(401, 'Email hoặc mật khẩu không đúng.');
    }

    return {
      token: `mock-token-${account.user.id ?? 0}-${account.user.role}`,
      expiresInMinutes: 480,
      role: account.user.role,
      fullName: account.user.fullName,
      user: account.user,
    } as T;
  }

  if (method === 'POST' && path === '/auth/logout') {
    return undefined as T;
  }

  if (method === 'GET' && path === '/members') {
    const q = (parsed.searchParams.get('q') ?? '').trim().toLowerCase();
    const status = parsed.searchParams.get('status');
    const trainerId = parsed.searchParams.get('trainerId');
    const page = Math.max(0, numberParam(parsed.searchParams.get('page'), 0));
    const size = Math.max(1, numberParam(parsed.searchParams.get('size'), 10));

    const filtered = mockMembers.filter((member) => {
      const matchQ =
        !q ||
        [member.fullName, member.code, member.email, member.phone ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q);
      const matchStatus = !status || member.status === status;
      const matchTrainer = !trainerId || String(member.trainerId ?? '') === trainerId;
      return matchQ && matchStatus && matchTrainer;
    });

    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const content = filtered.slice(page * size, page * size + size);

    return { content, page, size, totalElements, totalPages } as MockPage<MockMember> as T;
  }

  const memberMatch = path.match(/^\/members\/(\d+)$/);
  if (method === 'GET' && memberMatch) {
    const member = mockMembers.find((item) => item.id === Number(memberMatch[1]));
    if (!member) throw new ApiError(404, 'Không tìm thấy hội viên.');
    return member as T;
  }

  if (method === 'GET' && path === '/trainers') {
    return mockTrainers as T;
  }

  const trainerMatch = path.match(/^\/trainers\/(\d+)$/);
  if (method === 'GET' && trainerMatch) {
    const trainer = mockTrainers.find((item) => item.id === Number(trainerMatch[1]));
    if (!trainer) throw new ApiError(404, 'Không tìm thấy huấn luyện viên.');
    return trainer as T;
  }

  throw new ApiError(404, `Mock API chưa hỗ trợ ${method} ${path}.`);
}
