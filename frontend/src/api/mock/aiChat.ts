/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền)
 * CẦN LÀM: Dữ liệu giả cho trợ lý AI khi bật USE_MOCK.
 *
 * File riêng, không sửa `api/mock/index.ts` của Tùng.
 */

const FALLBACK = [
  'Mình là trợ lý GymFlow (chế độ dữ liệu giả).',
  'Bạn có thể hỏi về lịch tập, gói tập hoặc buổi tập gần đây.',
].join('\n');

export function mockAiChatReply(message: string): string {
  const question = message.trim().toLowerCase();

  if (question.includes('hôm nay') || question.includes('tập gì')) {
    return [
      'Hôm nay bạn có 1 buổi tập:',
      '- 18:00–19:00 · Tập ngực & tay sau',
      '- HLV: Lê Hoàng Phúc',
      'Giáo án hiện tại: Tăng cơ toàn thân (4 hiệp x 8-10).',
    ].join('\n');
  }

  if (question.includes('gói') || question.includes('bao lâu') || question.includes('hạn')) {
    return [
      'Gói tập hiện tại của bạn: Gói 3 tháng.',
      '- Hết hạn: 30/11/2026',
      '- Còn lại: 13 ngày',
      'Bạn có thể gia hạn tại mục Gói & Dịch vụ.',
    ].join('\n');
  }

  if (question.includes('vắng') || question.includes('tuần này')) {
    return [
      'Tuần này bạn vắng 1 buổi.',
      '- Đã hoàn thành: 2 buổi',
      '- Vắng: 1 buổi (Thứ 4, 12/11)',
      'Cố gắng giữ đều 3 buổi/tuần nhé!',
    ].join('\n');
  }

  return FALLBACK;
}
