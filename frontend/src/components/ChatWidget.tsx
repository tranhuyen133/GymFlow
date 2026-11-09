import { useEffect, useRef, useState, type FormEvent } from 'react';
import { chatApi, type ChatConversation, type ChatMessage } from '../api/chat';
import { Icon } from './Icon';
import { Button, Input } from './ui';
import { errMsg } from '../lib/hooks';
import './chat-widget.css';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try { setConversations(await chatApi.conversations()); }
    catch (e) { setError(errMsg(e)); }
  };

  useEffect(() => {
    if (!open) return;
    void loadConversations();
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

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    setDraft('');
    setError(null);
    const optimistic: ChatMessage = {
      id: Date.now(),
      sender: 'USER',
      content,
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
      const reply = await chatApi.send(activeId, content);
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
        <section className="chat-panel" aria-label="AI Chatbot">
          <header className="chat-header">
            <div>
              <b>Trợ lý GymFlow</b>
              <div className="tiny">Thông tin chung · Không thay thế tư vấn chuyên gia</div>
            </div>
            <div className="row">
              <Button variant="ghost" size="sm" icon="plus" aria-label="Cuộc trò chuyện mới" title="Cuộc trò chuyện mới" onClick={newConversation} />
              <Button variant="ghost" size="sm" icon="x" aria-label="Đóng chatbot" onClick={() => setOpen(false)} />
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
            {messages.length === 0 && <p className="chat-empty">Hỏi mình về cách sử dụng GymFlow hoặc kiến thức tập luyện phổ thông.</p>}
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.sender.toLowerCase()}`}>
                <span>{message.content}</span>
              </div>
            ))}
            {busy && <div className="chat-typing" role="status">Trợ lý đang trả lời…</div>}
            <div ref={bottomRef} />
          </div>
          {error && <div className="chat-error" role="alert">{error}</div>}
          <form className="chat-composer" onSubmit={send}>
            <Input aria-label="Tin nhắn" value={draft} maxLength={2000}
              onChange={(e) => setDraft(e.target.value)} placeholder="Nhập câu hỏi…" disabled={busy} />
            <Button type="submit" variant="primary" icon="arrowRight" aria-label="Gửi tin nhắn" disabled={!draft.trim() || busy} />
          </form>
        </section>
      )}
      <button type="button" className="chat-launcher" aria-expanded={open} aria-label={open ? 'Đóng AI Chatbot' : 'Mở AI Chatbot'}
        onClick={() => setOpen((value) => !value)}>
        <Icon name={open ? 'x' : 'message'} />
        <span>{open ? 'Đóng' : 'AI Chat'}</span>
      </button>
    </div>
  );
}
