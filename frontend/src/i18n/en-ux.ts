/**
 * Chuỗi tiếng Anh cho trang Chi tiết bài tập (làm lại giao diện) và phần kiểm tra dữ liệu Diễn đàn.
 * Gồm cả thông báo lỗi từ máy chủ (ForumService) vì errMsg() dịch message trả về qua t().
 */
export const EN_UX: Record<string, string> = {
  // Chi tiết bài tập
  'Đổi tư thế': 'Switch pose',
  'Tư thế động tác': 'Exercise pose',
  'Cơ hỗ trợ': 'Supporting muscles',
  'Loại bài': 'Type',
  'Cách hít thở': 'Breathing',
  'Liều tập gợi ý': 'Suggested dose',
  'Lỗi hay gặp cần tránh': 'Common mistakes to avoid',
  'Nguồn tham khảo & bản quyền': 'Sources & licensing',
  'Vui lòng ghi rõ điểm cần sửa (ít nhất 5 ký tự)': 'Please describe what needs fixing (at least 5 characters)',

  // Diễn đàn – giao diện
  'Đăng nhập lại': 'Sign in again',
  'Phiên đăng nhập đã hết hạn nên bạn đang xem như khách. Đăng nhập lại để trả lời.':
    'Your session has expired, so you are viewing as a guest. Sign in again to reply.',
  'Chưa có trả lời nào. Hãy là người đầu tiên chia sẻ.': 'No replies yet. Be the first to share.',
  'Chủ đề đang khoá: bạn trả lời với quyền huấn luyện viên / quản lý.': 'This topic is locked: you are replying as a trainer / manager.',
  'Chủ đề đã khoá, chỉ huấn luyện viên hoặc quản lý trả lời được.': 'This topic is locked; only trainers or managers can reply.',

  // Diễn đàn – kiểm tra dữ liệu (giao diện + máy chủ)
  'Tiêu đề cần có chữ hoặc số': 'The title needs letters or numbers',
  'Nội dung cần có chữ hoặc số': 'The content needs letters or numbers',
  'Trả lời cần có chữ hoặc số': 'The reply needs letters or numbers',
  'Vui lòng ghi lý do': 'Please give a reason',
  'Lý do cần có chữ hoặc số': 'The reason needs letters or numbers',
  'Bạn đã đăng chủ đề cùng tiêu đề trong 24 giờ qua. Hãy mở chủ đề cũ và trả lời tiếp ở đó.':
    'You posted a topic with the same title in the last 24 hours. Open that topic and continue there.',
  'Chỉ người viết mới sửa được chủ đề này': 'Only the author can edit this topic',
  'Chỉ người viết hoặc quản lý mới xoá được chủ đề này': 'Only the author or a manager can delete this topic',
  'Chủ đề đã khoá, chỉ huấn luyện viên hoặc quản lý trả lời được': 'This topic is locked; only trainers or managers can reply',
  'Bạn vừa gửi đúng nội dung này rồi': 'You just sent exactly this reply',
  'Chỉ người viết mới sửa được trả lời này': 'Only the author can edit this reply',
  'Chủ đề đang bị ẩn nên không sửa được trả lời': 'The topic is hidden, so replies cannot be edited',
  'Chủ đề đã khoá nên không sửa được trả lời': 'The topic is locked, so replies cannot be edited',
  'Chỉ người viết hoặc quản lý mới xoá được trả lời này': 'Only the author or a manager can delete this reply',
  'Bài của quản lý chỉ quản lý mới kiểm duyệt được': "Only managers can moderate a manager's post",
};
