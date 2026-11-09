/**
 * Hướng dẫn tương tác lần đầu (SCRUM-UX & SCRUM-225):
 * Dẫn người dùng đi theo đúng luồng nghiệp vụ.
 * Lưu tiến độ vào API /me/tours (CSDL), dự phòng localStorage.
 */
import { api } from '../api/client';
import type { Role, TourProgress } from '../api/types';

export interface TourStep {
  /** data-tour của phần tử cần làm nổi bật; bỏ trống = hộp thoại giữa màn hình */
  target?: string;
  /** Bước nằm trong thanh điều hướng: mở drawer trên điện thoại, mở nhóm chứa đường dẫn này */
  nav?: string | true;
  title: string;
  body: string;
}

const WELCOME: TourStep = {
  title: 'Chào mừng bạn đến với GymFlow!',
  body: 'Chúng tôi sẽ hướng dẫn bạn các tính năng chính trong khoảng một phút. Bạn có thể bỏ qua và xem lại bất cứ lúc nào ở mục Trợ giúp.',
};
const NAV_STEP: TourStep = {
  target: 'nav',
  nav: true,
  title: 'Thanh điều hướng',
  body: 'Mọi chức năng nằm ở đây. Nhóm có mũi tên chứa các mục nhỏ bên trong – bấm vào tên nhóm để mở hoặc gập lại.',
};
const ACCOUNT: TourStep = {
  target: 'account',
  title: 'Tài khoản của bạn',
  body: 'Bấm vào ảnh đại diện để mở hồ sơ cá nhân, đổi mật khẩu, đổi giao diện sáng/tối, ngôn ngữ hoặc đăng xuất.',
};
const BELL: TourStep = {
  target: 'bell',
  title: 'Thông báo',
  body: 'Việc cần chú ý (gói sắp hết hạn, đơn chờ duyệt, buổi tập sắp tới) hiện ở đây. Bấm vào một thông báo để đi thẳng tới đúng trang.',
};
const HELP: TourStep = {
  target: 'help',
  title: 'Trợ giúp',
  body: 'Câu hỏi thường gặp, giải thích các trạng thái và nút xem lại hướng dẫn này đều ở mục Trợ giúp.',
};
const DONE_STEP: TourStep = {
  title: 'Bạn đã hoàn thành hướng dẫn cơ bản!',
  body: 'Chúc bạn có những buổi tập hiệu quả cùng GymFlow. Cần tra cứu thêm thì mở mục Trợ giúp.',
};

// Tour chính cho Hội viên: Từ người mới đến sẵn sàng tập
export const JOURNEY_STEPS: TourStep[] = [
  {
    title: 'Hành trình từ người mới đến sẵn sàng tập',
    body: 'Chào mừng bạn đến với GymFlow! Chúng tôi sẽ đồng hành cùng bạn qua từng bước: hoàn thiện hồ sơ, tìm hiểu HLV, chọn gói tập, thanh toán và kích hoạt gói.',
  },
  {
    target: 'account',
    title: 'Bước 1: Hoàn thiện hồ sơ cá nhân',
    body: 'Bấm vào ảnh đại diện góc phải để vào Hồ sơ cá nhân. Điền đầy đủ họ tên, số điện thoại và ngày sinh để đủ điều kiện đăng ký gói.',
  },
  {
    target: 'nav:/coaches',
    nav: '/coaches',
    title: 'Bước 2: Tìm hiểu Huấn luyện viên & Nhắn tin tư vấn',
    body: 'Mục "Huấn luyện viên" giúp bạn xem hồ sơ, chuyên môn, ca trực và nhắn tin trò chuyện miễn phí với HLV để chọn lộ trình tập phù hợp.',
  },
  {
    target: 'nav:/me/packages',
    nav: '/me/packages',
    title: 'Bước 3: Chọn gói tập và gửi đăng ký',
    body: 'Vào "Gói tập của tôi" để xem các gói đang bán. Bạn có thể chọn gói tự tập hoặc gói kèm HLV (PT), chọn ngày bắt đầu và phương thức thanh toán.',
  },
  {
    target: 'nav:/getting-started',
    nav: '/getting-started',
    title: 'Bước 4: Thanh toán & Chờ duyệt đơn',
    body: 'Bạn có thể thanh toán tại quầy lễ tân hoặc quét mã QR chuyển khoản. Quản lý sẽ đối chiếu sao kê và duyệt kích hoạt gói cho bạn.',
  },
  {
    target: 'nav:/getting-started',
    nav: '/getting-started',
    title: 'Bước 5: Kiểm tra trạng thái sẵn sàng tập',
    body: 'Trang "Bắt đầu cùng GymFlow" hiển thị rõ tiến trình 7 bước, lý do cụ thể và thông báo khi bạn đã đủ điều kiện bước vào phòng tập.',
  },
  {
    target: 'nav:/exercises',
    nav: '/exercises',
    title: 'Bước 6: Xem nội quy và bài tập cho người mới',
    body: 'Đọc kỹ Nội quy phòng tập (/policies) và xem Thư viện bài tập mức độ Cơ bản (Beginner) để chuẩn bị cho buổi tập đầu tiên.',
  },
  {
    target: 'nav:/me/schedule',
    nav: '/me/schedule',
    title: 'Bước 7: Lịch tập của bạn',
    body: 'Sau khi gói có hiệu lực, bạn có thể tự xếp lịch hoặc xem lịch do HLV xếp tại "Lịch tập của tôi". Hoàn thành buổi tập nhớ bấm đánh dấu nhé!',
  },
  {
    title: 'Chúc bạn có hành trình tập luyện tuyệt vời!',
    body: 'Bạn đã sẵn sàng! Bất cứ khi nào cần xem lại quy trình, bạn có thể mở trang "Bắt đầu cùng GymFlow" hoặc mục "Trợ giúp".',
  },
];

// Tour giới thiệu HLV & PT cho hội viên chưa có PT
export const PT_INTRO_STEPS: TourStep[] = [
  {
    title: 'Huấn luyện viên cá nhân (PT) là gì?',
    body: 'PT (Personal Trainer) là người hướng dẫn 1-1, thiết kế giáo án riêng theo mục tiêu (giảm mỡ, tăng cơ, cải thiện tư thế) và giám sát từng buổi tập của bạn.',
  },
  {
    title: 'Khác biệt giữa gói có PT và tự tập',
    body: 'Gói tự tập: bạn tự chọn bài và tự xếp lịch. Gói có PT: HLV sẽ soạn giáo án chuyên sâu, xếp lịch và đồng hành sát sao trong phòng tập.',
  },
  {
    target: 'nav:/coaches',
    nav: '/coaches',
    title: 'Xem đội ngũ huấn luyện viên',
    body: 'Mục "Huấn luyện viên" liệt kê danh sách HLV chuyên nghiệp cùng chuyên môn, số năm kinh nghiệm, bằng cấp và lịch ca trực trong tuần.',
  },
  {
    target: 'nav:/messages',
    nav: '/messages',
    title: 'Nhắn tin tư vấn trực tiếp',
    body: 'Mọi hội viên đều có thể nhắn tin tư vấn miễn phí với HLV. Lưu ý: nhắn tin trò chuyện không đồng nghĩa với việc bạn đã mua gói PT.',
  },
  {
    target: 'nav:/me/packages',
    nav: '/me/packages',
    title: 'Đăng ký gói có HLV kèm',
    body: 'Khi đăng ký gói có PT, bạn chọn HLV mong muốn kèm theo đơn. Sau khi quản lý duyệt, HLV đó sẽ chính thức phụ trách bạn.',
  },
  {
    title: 'Bắt đầu kết nối với HLV',
    body: 'Bạn có thể vào mục "Huấn luyện viên" để chọn HLV và gửi tin nhắn tư vấn ngay hôm nay!',
  },
];

const STEPS: Record<Role, TourStep[]> = {
  MEMBER: JOURNEY_STEPS,
  TRAINER: [
    WELCOME,
    { target: 'content', title: 'Trang tổng quan', body: 'Buổi tiếp theo, số buổi trong tuần, giáo án đang áp dụng và các buổi vắng của hội viên hiện ở đây.' },
    NAV_STEP,
    { target: 'nav:/messages', nav: '/messages', title: 'Tin nhắn hội viên', body: 'Trò chuyện và tư vấn cho hội viên. Bạn có thể phân loại theo tab "Đang phụ trách" và "Đang tư vấn".' },
    { target: 'nav:/schedules', nav: '/schedules', title: 'Lịch huấn luyện', body: 'Xếp lịch lặp hằng tuần – hệ thống tự chặn trùng giờ. Bấm vào một buổi để dời, huỷ, đánh vắng hoặc ghi nhận kết quả.' },
    { target: 'nav:/members', nav: '/members', title: 'Hội viên phụ trách', body: 'Mở một hội viên để xem hồ sơ, giáo án, cân nặng và chuyên cần.' },
    { target: 'nav:/workout-plans', nav: '/workout-plans', title: 'Giáo án', body: 'Soạn giáo án theo ngày trong tuần, có thể bắt đầu từ một lịch tập mẫu.' },
    BELL, ACCOUNT, HELP, DONE_STEP,
  ],
  ADMIN: [
    WELCOME,
    { target: 'content', title: 'Trang tổng quan', body: 'Số liệu chính của phòng tập và các việc đang chờ xử lý.' },
    NAV_STEP,
    { target: 'nav:/package-requests', nav: '/package-requests', title: 'Duyệt đăng ký gói', body: 'Đơn đăng ký của hội viên chờ ở đây. Chỉ duyệt sau khi đã nhận đủ tiền – duyệt xong gói mới được kích hoạt.' },
    { target: 'nav:/plans', nav: '/plans', title: 'Gói tập', body: 'Tạo, sửa giá và mở / ngừng bán các gói tập.' },
    { target: 'nav:/users', nav: '/users', title: 'Tài khoản & quyền', body: 'Quản lý tài khoản đăng nhập của hội viên, HLV và quản lý.' },
    { target: 'nav:/reports', nav: '/reports', title: 'Báo cáo', body: 'Doanh thu, hội viên mới và chuyên cần theo thời gian.' },
    BELL, HELP, DONE_STEP,
  ],
};

export const tourSteps = (role: Role, tourKey?: string): TourStep[] => {
  if (role === 'MEMBER') {
    if (tourKey === 'pt-intro') return PT_INTRO_STEPS;
    return JOURNEY_STEPS;
  }
  return STEPS[role] ?? JOURNEY_STEPS;
};

export interface TourState {
  status: 'done' | 'paused' | 'skipped';
  step: number;
}

const localKey = (userId: number, tourKey: string) => `gf.tour.${userId}.${tourKey}`;
const laterKey = (userId: number, tourKey: string) => `gf.tour.later.${userId}.${tourKey}`;

// Đọc tiến độ từ API, dự phòng localStorage
export async function readTour(userId: number, tourKey: string): Promise<TourState | null> {
  try {
    const list = await api.get<TourProgress[]>('/me/tours');
    const item = list.find((t) => t.tourKey === tourKey);
    if (item) {
      const status = item.status.toLowerCase() as 'done' | 'paused' | 'skipped';
      return { status, step: item.step };
    }
  } catch (e) {
    // API lỗi: fallback localStorage
  }

  try {
    const v = JSON.parse(localStorage.getItem(localKey(userId, tourKey)) ?? 'null') as TourState | null;
    return v && (v.status === 'done' || v.status === 'paused' || v.status === 'skipped') ? v : null;
  } catch {
    return null;
  }
}

// Lưu tiến độ vào API và localStorage
export async function saveTour(userId: number, tourKey: string, s: TourState): Promise<void> {
  try {
    localStorage.setItem(localKey(userId, tourKey), JSON.stringify(s));
  } catch {}

  try {
    await api.put(`/me/tours/${tourKey}`, {
      step: s.step,
      status: s.status.toUpperCase(),
    });
  } catch {}
}

/** "Để sau": không tự hiện lại trong phiên này, lần đăng nhập sau sẽ hỏi lại. */
export const postponeTour = (userId: number, tourKey: string) => {
  try {
    sessionStorage.setItem(laterKey(userId, tourKey), '1');
  } catch {}
};

export const isPostponed = (userId: number, tourKey: string) => {
  try {
    return sessionStorage.getItem(laterKey(userId, tourKey)) === '1';
  } catch {
    return false;
  }
};

export const TOUR_START = 'gf:tour-start';
export const TOUR_END = 'gf:tour-end';

export interface StartTourDetail {
  tourKey?: string;
  step?: number;
}

/** Mở hướng dẫn từ bất kỳ đâu. */
export const startTour = (detail?: StartTourDetail | number) => {
  const d = typeof detail === 'number' ? { step: detail } : (detail ?? {});
  window.dispatchEvent(new CustomEvent(TOUR_START, { detail: d }));
};
