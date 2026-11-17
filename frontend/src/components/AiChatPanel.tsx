/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền)
 * CẦN LÀM: Khung chat dùng chung cho trang Trợ lý AI và widget nổi.
 */
import { useEffect, useRef, useState } from 'react';
import { sendChat } from '../api/aiChat';
import { Alert, Button } from './ui';
import { t } from '../i18n';
import { errMsg } from '../lib/hooks';

const SUGGESTIONS = [
  'Hôm nay mình tập gì?',
  'Gói tập của mình còn bao lâu?',
  'Tuần này mình vắng mấy buổi?',
];

const MAX_LENGTH = 500;

interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export function AiChatPanel({ className = '' }: { className?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, busy]);

  const send = async (raw: string) => {
    const message = raw.trim();
    if (!message || busy) return;

    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${++seq.current}`, role: 'USER', content: message }]);
    setBusy(true);
    try {
      const reply = await sendChat(message);
      setMessages((prev) => [...prev, { id: `a-${++seq.current}`, role: 'ASSISTANT', content: reply }]);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`ai-chat ${className}`}>
      <div className="ai-chat-suggestions" aria-label={t('Câu hỏi gợi ý')}>
        {SUGGESTIONS.map((question) => (
          <Button key={question} size="sm" variant="secondary" disabled={busy} onClick={() => void send(question)}>
            {t(question)}
          </Button>
        ))}
      </div>

      <div className="ai-chat-window" aria-live="polite">
        {messages.length === 0 && !busy && (
          <p className="ai-chat-empty">
            {t('Chọn một câu hỏi gợi ý bên trên hoặc gõ câu hỏi của bạn để bắt đầu.')}
          </p>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`ai-chat-row ${message.role === 'USER' ? 'user' : 'assistant'}`}>
            <div className="ai-chat-bubble">{message.content}</div>
          </div>
        ))}

        {busy && (
          <div className="ai-chat-row assistant">
            <div className="ai-chat-bubble ai-chat-typing" role="status">{t('Đang trả lời...')}</div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      <form
        className="ai-chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <div className="ai-chat-input-wrap">
          <input
            className="input"
            type="text"
            maxLength={MAX_LENGTH}
            value={input}
            disabled={busy}
            placeholder={t('Nhập câu hỏi của bạn…')}
            aria-label={t('Nhập câu hỏi')}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <span className={`ai-chat-counter${input.length >= MAX_LENGTH ? ' limit' : ''}`}>
            {input.length}/{MAX_LENGTH}
          </span>
        </div>
        <Button type="submit" variant="primary" icon="send" loading={busy} disabled={busy || !input.trim()}>
          {t('Gửi')}
        </Button>
      </form>
    </div>
  );
}
