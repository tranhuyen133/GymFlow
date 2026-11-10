import { useEffect, useRef, useState, type FormEvent } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { chatApi, type ChatConversation, type ChatMessage, type ChatSuggestion } from '../api/chat';
import { Icon } from './Icon';
import { Button } from './ui';
import { errMsg } from '../lib/hooks';
import { t } from '../i18n';
import './chat-widget.css';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [freeTextEnabled, setFreeTextEnabled] = useState(true);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      setConversations(await chatApi.conversations());
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await chatApi.suggestions();
      if (Array.isArray(res)) {
        setSuggestions(res);
        setFreeTextEnabled(true);
      } else if (res && typeof res === 'object') {
        setSuggestions(Array.isArray(res.suggestions) ? res.suggestions : []);
        setFreeTextEnabled(res.freeTextEnabled !== false);
      }
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadConversations();
    void loadSuggestions();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const selectConversation = async (item: ChatConversation) => {
    setError(null);
    setConversationId(item.id);
    try {
      const history = await chatApi.history(item.id);
      setMessages(history.messages);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const newConversation = () => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  };

  const ask = async (suggestion: ChatSuggestion) => {
    if (busy) return;
    setError(null);
    const optimistic: ChatMessage = {
      id: Date.now(),
      sender: 'USER',
      content: suggestion.label,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setBusy(true);
    let activeId = conversationId;
    try {
      if (activeId == null) {
        const created = await chatApi.createConversation();
        activeId = created.id;
        setConversationId(activeId);
      }
      const reply = await chatApi.sendTopic(activeId, suggestion.key);
      setMessages((current) => [...current, reply]);
      await loadConversations();
    } catch (e) {
      setError(errMsg(e));
      if (activeId != null) {
        try {
          const history = await chatApi.history(activeId);
          setMessages(history.messages);
        } catch {
          // Keep the original error visible
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const submitText = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || busy) return;
    setInputText('');
    setError(null);
    const optimistic: ChatMessage = {
      id: Date.now(),
      sender: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setBusy(true);
    let activeId = conversationId;
    try {
      if (activeId == null) {
        const created = await chatApi.createConversation();
        activeId = created.id;
        setConversationId(activeId);
      }
      const reply = await chatApi.sendText(activeId, text);
      setMessages((current) => [...current, reply]);
      await loadConversations();
    } catch {
      setError(t('Trợ lý AI đang bận hoặc quá thời gian phản hồi. Bạn vui lòng thử lại hoặc chọn một trong các câu hỏi gợi ý bên dưới.'));
      if (activeId != null) {
        try {
          const history = await chatApi.history(activeId);
          setMessages(history.messages);
        } catch {
          // Giữ lỗi hiển thị nếu không tải lại được lịch sử
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <section className="chat-panel" aria-label={t('Trợ lý GymFlow')}>
          <header className="chat-header">
            <div>
              <b>{t('Trợ lý GymFlow')}</b>
              <div className="tiny">
                {freeTextEnabled ? t('Hỏi tự do hoặc chọn câu hỏi sẵn · Trả lời từ dữ liệu của bạn') : t('Chọn câu hỏi sẵn · Trả lời từ dữ liệu của bạn')}
              </div>
            </div>
            <div className="row">
              <Button variant="ghost" size="sm" icon="plus" aria-label={t('Cuộc trò chuyện mới')} title={t('Cuộc trò chuyện mới')} onClick={newConversation} />
              <Button variant="ghost" size="sm" icon="x" aria-label={t('Đóng trợ lý')} onClick={() => setOpen(false)} />
            </div>
          </header>

          {conversations.length > 0 && (
            <div className="chat-history" aria-label={t('Lịch sử hội thoại')}>
              {conversations.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={conversationId === item.id ? 'active' : ''}
                  onClick={() => void selectConversation(item)}
                  title={item.title}
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 && (
              <p className="chat-empty">
                {freeTextEnabled
                  ? t('Gõ câu hỏi bên dưới hoặc chọn gợi ý nhanh để tra cứu lịch tập, gói tập và bài tập của bạn.')
                  : t('Chọn một câu hỏi bên dưới để xem lịch tập, gói tập và bài tập của bạn.')}
              </p>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.sender.toLowerCase()}`}>
                {renderRichContent(message.content)}
              </div>
            ))}
            {busy && <div className="chat-typing" role="status">{t('Trợ lý đang suy nghĩ và soạn câu trả lời…')}</div>}
            <div ref={bottomRef} />
          </div>

          {error && <div className="chat-error" role="alert">{error}</div>}

          <div className="chat-suggestions" aria-label={t('Câu hỏi sẵn')}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.key}
                type="button"
                className="chat-suggestion"
                onClick={() => void ask(suggestion)}
                disabled={busy}
              >
                <Icon name="message" size={12} />
                <span>{t(suggestion.label)}</span>
              </button>
            ))}
            {suggestions.length === 0 && suggestionsLoading && <span className="tiny faint">{t('Đang tải câu hỏi…')}</span>}
            {suggestions.length === 0 && !suggestionsLoading && !busy && <span className="tiny faint">{t('Chưa tải được câu hỏi.')}</span>}
          </div>

          {freeTextEnabled && (
            <form className="chat-input-row" onSubmit={(e) => void submitText(e)}>
              <input
                type="text"
                className="chat-input"
                placeholder={t('Nhập câu hỏi (vd: Lịch hôm nay, gói tập...)')}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={busy}
                maxLength={500}
                aria-label={t('Nhập câu hỏi')}
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={busy || !inputText.trim()}
                aria-label={t('Gửi câu hỏi')}
                title={t('Gửi câu hỏi')}
              >
                <Icon name="send" size={16} />
              </button>
            </form>
          )}

          <div className="chat-disclaimer">
            {t('Trợ lý trả lời dựa trên dữ liệu GymFlow, có thể chưa chính xác tuyệt đối.')}
          </div>
        </section>
      )}
      <button
        type="button"
        className="chat-launcher"
        aria-expanded={open}
        aria-label={open ? t('Đóng trợ lý') : t('Mở trợ lý')}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={open ? 'x' : 'message'} />
        <span>{open ? t('Đóng') : t('Trợ lý')}</span>
      </button>
    </div>
  );
}

function renderRichContent(content: string) {
  if (!content) return null;
  // Loại bỏ các đường dẫn kỹ thuật trong ngoặc đơn (ví dụ: (/schedules), (`/schedules`), (/programs)) để văn bản sạch, chuẩn docs tự nhiên
  const cleanedContent = content.replace(/\s*\(`?\/[a-zA-Z0-9_\-/]+`?(?:(?:\s+hoặc\s+|\s*,\s*|\s*\/\s*)`?\/[a-zA-Z0-9_\-/]+`?)*\)/g, '');
  const rawHtml = marked.parse(cleanedContent, { async: false }) as string;
  const cleanHtml = DOMPurify.sanitize(rawHtml);
  return (
    <div
      className="chat-rich-text"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
