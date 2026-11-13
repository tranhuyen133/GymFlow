import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { ChatMessageItem } from '../api/types';
import { Avatar, Button, Empty, ErrorState, LoadingBlock, Modal } from './ui';
import { fmtTime } from '../lib/format';
import { errMsg } from '../lib/hooks';
import { t } from '../i18n';
import '../pages/shared/messages.css';
import { ChatAttachment } from '../pages/shared/ChatAttachment';
import { kindOf } from '../pages/shared/chatRules';

interface Props {
  conversationId: number;
  memberName: string;
  trainerName: string;
  memberAvatar?: string | null;
  trainerAvatar?: string | null;
  onClose: () => void;
}

export function ConversationHistoryModal({
  conversationId,
  memberName,
  trainerName,
  memberAvatar,
  trainerAvatar,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    setLoading(true);
    api
      .get<ChatMessageItem[]>(`/conversations/${conversationId}/messages`, { size: 50 })
      .then((data) => {
        setMessages(data);
        setError(null);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  // Polling every 5s while modal is open
  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return;
      try {
        const lastId = messages.length > 0 ? messages[messages.length - 1].id : 0;
        const fresh = await api.get<ChatMessageItem[]>(`/conversations/${conversationId}/messages/new`, {
          after: lastId,
        });
        if (fresh && fresh.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const added = fresh.filter((m) => !ids.has(m.id));
            return added.length > 0 ? [...prev, ...added] : prev;
          });
        }
      } catch {
        // ignore polling error
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [conversationId, messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  return (
    <Modal
      title={
        <div className="row" style={{ alignItems: 'center', gap: 10 }}>
          <span>{t('Hội thoại:')}</span>
          <b style={{ color: 'var(--ink)' }}>{memberName}</b>
          <span className="tiny faint">↔</span>
          <b style={{ color: 'var(--primary)' }}>{trainerName}</b>
        </div>
      }
      size="wide"
      onClose={onClose}
      footer={
        <div className="row between" style={{ width: '100%', alignItems: 'center' }}>
          <span className="tiny faint">
            {t('Chế độ chỉ đọc dành cho Quản trị viên · Nhật ký xem đã được ghi lại')}
          </span>
          <Button variant="ghost" onClick={onClose}>
            {t('Đóng')}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', minHeight: 380 }}>
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-sm)',
            fontSize: 12,
            color: 'var(--muted)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            🔒 {t('Quản trị viên đang xem ở chế độ chỉ đọc. Không thể gửi tin nhắn thay mặt người tham gia.')}
          </span>
          <span className="tiny faint">{t('Tự cập nhật mỗi 5 giây')}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
          {loading ? (
            <LoadingBlock rows={6} />
          ) : error ? (
            <ErrorState message={error} onRetry={loadMessages} />
          ) : messages.length === 0 ? (
            <Empty icon="message" title={t('Chưa có tin nhắn')} desc={t('Chưa có tin nhắn nào trong cuộc trò chuyện này.')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((m) => {
                const isTrainer = m.senderRole === 'TRAINER';
                const senderName = m.senderName;
                const avatar = isTrainer ? trainerAvatar : memberAvatar;
                const time = fmtTime(m.createdAt);

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: isTrainer ? 'row-reverse' : 'row',
                      gap: 10,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Avatar name={senderName} src={avatar} size="sm" />
                    <div
                      style={{
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isTrainer ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div className="row" style={{ gap: 6, fontSize: 11, marginBottom: 2 }}>
                        <b style={{ color: isTrainer ? 'var(--primary)' : 'var(--ink)' }}>{senderName}</b>
                        <span className="tiny faint">({isTrainer ? t('HLV') : t('Hội viên')})</span>
                      </div>
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 14,
                          fontSize: 13,
                          lineHeight: 1.5,
                          background: isTrainer ? 'var(--primary)' : 'var(--surface-2)',
                          color: isTrainer ? '#fff' : 'var(--ink)',
                          border: isTrainer ? 'none' : '1px solid var(--hairline)',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {m.recalled ? <i style={{ opacity: 0.75 }}>{t('Tin nhắn đã được thu hồi')}</i> : <>
                          {kindOf(m) !== 'TEXT' && <ChatAttachment m={m} />}
                          {m.body && <div>{m.body}</div>}
                        </>}
                      </div>
                      <div className="row" style={{ gap: 6, fontSize: 10, color: 'var(--faint)', marginTop: 2 }}>
                        <span>{time}</span>
                        {m.readAt && <span style={{ color: 'var(--primary-bright, #00d95b)' }}>{t('Đã đọc')}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
