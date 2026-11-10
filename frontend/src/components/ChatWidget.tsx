import { useEffect, useRef, useState } from 'react';
import { chatApi, type ChatConversation, type ChatMessage, type ChatSuggestion } from '../api/chat';
import { Icon } from './Icon';
import { Button } from './ui';
import { errMsg } from '../lib/hooks';
import './chat-widget.css';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try { setConversations(await chatApi.conversations()); }
    catch (e) { setError(errMsg(e)); }
  };

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try { setSuggestions(await chatApi.suggestions()); }
    catch (e) { setError(errMsg(e)); }
    finally { setSuggestionsLoading(false); }
  };

  useEffect(() => {
    if (!open) return;
    void loadConversations();
    void loadSuggestions();
  }, [open]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const selectConversation = async (item: ChatConversation) => {
    setError(null);
    setConversationId(item.id);
    try {
      const history = await chatApi.history(item.id);
      setMessages(history.messages);
    } catch (e) { setError(errMsg(e)); }
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
      const reply = await chatApi.send(activeId, suggestion.key);
      setMessages((current) => [...current, reply]);
      await loadConversations();
    } catch (e) {
      setError(errMsg(e));
      if (activeId != null) {
        try {
          const history = await chatApi.history(activeId);
          setMessages(history.messages);
        } catch {
          // Keep the original error visible if history cannot be refreshed.
        }
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="chat-widget">
      {open && (
        <section className="chat-panel" aria-label="Trợ lý GymFlow">
          <header className="chat-header">
            <div>
              <b>Trợ lý GymFlow</b>
              <div className="tiny">Chọn câu hỏi sẵn · Trả lời từ dữ liệu của bạn</div>
            </div>
            <div className="row">
              <Button variant="ghost" size="sm" icon="plus" aria-label="Cuộc trò chuyện mới" title="Cuộc trò chuyện mới" onClick={newConversation} />
              <Button variant="ghost" size="sm" icon="x" aria-label="Đóng trợ lý" onClick={() => setOpen(false)} />
            </div>
          </header>
          {conversations.length > 0 && (
            <div className="chat-history" aria-label="Lịch sử hội thoại">
              {conversations.slice(0, 5).map((item) => (
                <button key={item.id} type="button" className={conversationId === item.id ? 'active' : ''}
                  onClick={() => void selectConversation(item)} title={item.title}>
                  {item.title}
                </button>
              ))}
            </div>
          )}
          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 && <p className="chat-empty">Chọn một câu hỏi bên dưới để xem lịch tập, gói tập và bài tập của bạn.</p>}
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.sender.toLowerCase()}`}>
                <span>{message.content}</span>
              </div>
            ))}
            {busy && <div className="chat-typing" role="status">Đang soạn câu trả lời…</div>}
            <div ref={bottomRef} />
          </div>
          {error && <div className="chat-error" role="alert">{error}</div>}
          <div className="chat-suggestions" aria-label="Câu hỏi sẵn">
            {suggestions.map((suggestion) => (
              <button key={suggestion.key} type="button" className="chat-suggestion"
                onClick={() => void ask(suggestion)} disabled={busy}>
                <Icon name="message" size={12} />
                <span>{suggestion.label}</span>
              </button>
            ))}
            {suggestions.length === 0 && suggestionsLoading && <span className="tiny faint">Đang tải câu hỏi…</span>}
            {suggestions.length === 0 && !suggestionsLoading && !busy && <span className="tiny faint">Chưa tải được câu hỏi.</span>}
          </div>
        </section>
      )}
      <button type="button" className="chat-launcher" aria-expanded={open} aria-label={open ? 'Đóng trợ lý' : 'Mở trợ lý'}
        onClick={() => setOpen((value) => !value)}>
        <Icon name={open ? 'x' : 'message'} />
        <span>{open ? 'Đóng' : 'Trợ lý'}</span>
      </button>
    </div>
  );
}
