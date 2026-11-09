/**
 * Hướng dẫn tương tác lần đầu (SCRUM-UX): các bước theo vai trò + lưu tiến độ.
 * Tiến độ lưu ở localStorage theo tài khoản + vai trò (chỉ trên trình duyệt này) – không cần API/CSDL mới.
 * Chuỗi trong bước là tiếng Việt gốc, dịch bằng t() lúc hiển thị để đổi ngôn ngữ vẫn đúng.
 */
import type { Role } from '../api/types';

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
  target: 'nav', nav: true, title: 'Thanh điều hướng',
  body: 'Mọi chức năng nằm ở đây. Nhóm có mũi tên chứa các mục nhỏ bên trong – bấm vào tên nhóm để mở hoặc gập lại.',
};
const ACCOUNT: TourStep = {
  target: 'account', title: 'Tài khoản của bạn',
  body: 'Bấm vào ảnh đại diện để mở hồ sơ cá nhân, đổi mật khẩu, đổi giao diện sáng/tối, ngôn ngữ hoặc đăng xuất.',
};
const BELL: TourStep = {
  target: 'bell', title: 'Thông báo',
  body: 'Việc cần chú ý (gói sắp hết hạn, đơn chờ duyệt, buổi tập sắp tới) hiện ở đây. Bấm vào một thông báo để đi thẳng tới đúng trang.',
};
const HELP: TourStep = {
  target: 'help', title: 'Trợ giúp',
  body: 'Câu hỏi thường gặp, giải thích các trạng thái và nút xem lại hướng dẫn này đều ở mục Trợ giúp.',
};
const DONE: TourStep = {
  title: 'Bạn đã hoàn thành hướng dẫn cơ bản!',
  body: 'Chúc bạn có những buổi tập hiệu quả cùng GymFlow. Cần tra cứu thêm thì mở mục Trợ giúp.',
};

const STEPS: Record<Role, TourStep[]> = {
  MEMBER: [
    WELCOME,
    { target: 'content', title: 'Trang tổng quan', body: 'Đây là nơi theo dõi gói tập, buổi tập sắp tới và tiến độ của bạn.' },
    NAV_STEP,
    { target: 'nav:/me/schedule', nav: '/me/schedule', title: 'Lịch tập', body: 'Xem các buổi tập, giờ tập và huấn luyện viên. Tập xong thì bấm vào buổi để đánh dấu hoàn thành.' },
    { target: 'nav:/me/packages', nav: '/me/packages', title: 'Gói tập', body: 'Xem gói hiện tại, thời hạn còn lại và gửi đăng ký gói mới. Gói có hiệu lực sau khi quản lý xác nhận thanh toán.' },
    { target: 'nav:/me/progress', nav: '/me/progress', title: 'Sức khoẻ & tiến độ', body: 'Ghi cân nặng, chỉ số cơ thể và xem thay đổi theo thời gian.' },
    { target: 'nav:/exercises', nav: '/exercises', title: 'Kiến thức tập luyện', body: 'Thư viện bài tập có ảnh minh hoạ và nhóm cơ, dụng cụ tập và các lịch tập mẫu.' },
    ACCOUNT, HELP, DONE,
  ],
  TRAINER: [
    WELCOME,
    { target: 'content', title: 'Trang tổng quan', body: 'Buổi tiếp theo, số buổi trong tuần, giáo án đang áp dụng và các buổi vắng của hội viên hiện ở đây.' },
    NAV_STEP,
    { target: 'nav:/schedules', nav: '/schedules', title: 'Lịch huấn luyện', body: 'Xếp lịch lặp hằng tuần – hệ thống tự chặn trùng giờ. Bấm vào một buổi để dời, huỷ, đánh vắng hoặc ghi nhận kết quả.' },
    { target: 'nav:/members', nav: '/members', title: 'Hội viên phụ trách', body: 'Mở một hội viên để xem hồ sơ, giáo án, cân nặng và chuyên cần.' },
    { target: 'nav:/workout-plans', nav: '/workout-plans', title: 'Giáo án', body: 'Soạn giáo án theo ngày trong tuần, có thể bắt đầu từ một lịch tập mẫu.' },
    BELL, ACCOUNT, HELP, DONE,
  ],
  ADMIN: [
    WELCOME,
    { target: 'content', title: 'Trang tổng quan', body: 'Số liệu chính của phòng tập và các việc đang chờ xử lý.' },
    NAV_STEP,
    { target: 'nav:/package-requests', nav: '/package-requests', title: 'Duyệt đăng ký gói', body: 'Đơn đăng ký của hội viên chờ ở đây. Chỉ duyệt sau khi đã nhận đủ tiền – duyệt xong gói mới được kích hoạt.' },
    { target: 'nav:/plans', nav: '/plans', title: 'Gói tập', body: 'Tạo, sửa giá và mở / ngừng bán các gói tập.' },
    { target: 'nav:/users', nav: '/users', title: 'Tài khoản & quyền', body: 'Quản lý tài khoản đăng nhập của hội viên, HLV và quản lý.' },
    { target: 'nav:/reports', nav: '/reports', title: 'Báo cáo', body: 'Doanh thu, hội viên mới và chuyên cần theo thời gian.' },
    BELL, HELP, DONE,
  ],
};

export const tourSteps = (role: Role) => STEPS[role];

export interface TourState { status: 'done' | 'paused'; step: number }

const key = (userId: number, role: Role) => `gf.tour.${userId}.${role}`;
const laterKey = (userId: number) => `gf.tour.later.${userId}`;

export function readTour(userId: number, role: Role): TourState | null {
  try {
    const v = JSON.parse(localStorage.getItem(key(userId, role)) ?? 'null') as TourState | null;
    return v && (v.status === 'done' || v.status === 'paused') ? v : null;
  } catch { return null; }
}
export function saveTour(userId: number, role: Role, s: TourState) {
  try { localStorage.setItem(key(userId, role), JSON.stringify(s)); } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ }
}
/** "Để sau": không tự hiện lại trong phiên này, lần đăng nhập sau sẽ hỏi lại. */
export const postponeTour = (userId: number) => { try { sessionStorage.setItem(laterKey(userId), '1'); } catch { /* bỏ qua */ } };
export const isPostponed = (userId: number) => { try { return sessionStorage.getItem(laterKey(userId)) === '1'; } catch { return false; } };

export const TOUR_START = 'gf:tour-start';
/** Phát ra khi đóng hướng dẫn, để trang Trợ giúp cập nhật dòng trạng thái */
export const TOUR_END = 'gf:tour-end';
/** Mở hướng dẫn từ bất kỳ đâu (VD trang Trợ giúp). step = 0 là màn chào. */
export const startTour = (step = 0) => window.dispatchEvent(new CustomEvent(TOUR_START, { detail: step }));
