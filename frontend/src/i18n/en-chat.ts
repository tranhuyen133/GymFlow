/**
 * Chuỗi tiếng Anh cho V47: trạng thái online, tìm kiếm tin nhắn, thư viện ảnh/video.
 * Chỉ chứa chuỗi mới của các màn tin nhắn để tránh đụng các file từ điển khác.
 */
export const EN_CHAT: Record<string, string> = {
  // Trạng thái online
  'Đang online': 'Online',
  'Chưa hoạt động': 'No activity yet',
  'Vừa hoạt động': 'Active just now',

  // Tìm kiếm tin nhắn
  'Tìm kiếm tin nhắn': 'Search messages',
  'Tìm trong cuộc trò chuyện…': 'Search this conversation…',
  'Đóng tìm kiếm': 'Close search',
  'Nhập từ khoá để tìm trong cuộc trò chuyện này.': 'Type a keyword to search this conversation.',
  'Không tìm thấy tin nhắn': 'No messages found',
  'Thử từ khoá khác hoặc ngắn hơn.': 'Try another or shorter keyword.',
  '{n} kết quả': '{n} results',
  'Bạn': 'You',

  // Thư viện ảnh/video/tệp
  'Ảnh, video và tệp đã gửi': 'Sent photos, videos and files',
  'Chỉ hiển thị tệp trong cuộc trò chuyện này': 'Only files in this conversation are shown',
  'Chưa có ảnh nào được gửi': 'No photos sent yet',
  'Chưa có video nào được gửi': 'No videos sent yet',
  'Chưa có tệp nào được gửi': 'No files sent yet',
  'Tệp gửi trong cuộc trò chuyện sẽ xuất hiện ở đây.': 'Files sent in this conversation will appear here.',
  'Tải thêm': 'Load more',
  'Xem ảnh': 'View photo',
  'Xem video': 'View video',

  // Bổ sung cho lỗi thu hồi
  'Tin nhắn trống': 'Empty message',
};
