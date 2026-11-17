/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền)
 * CẦN LÀM: Trang trợ lý AI dành cho hội viên.
 */
import { AiChatPanel } from '../../components/AiChatPanel';
import { Card, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import './AiChat.css';

export default function AiChat() {
  return (
    <div className="page">
      <PageHead
        eyebrow={t('Thành viên')}
        title={t('Trợ lý AI')}
        desc={t('Hỏi về gói tập, giáo án, lịch tập, buổi đã tập và cân nặng của bạn. Câu trả lời chỉ dựa trên dữ liệu GymFlow.')}
      />

      <Card title={t('Trò chuyện')} icon="message">
        <AiChatPanel />
      </Card>
    </div>
  );
}
