import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { ChatMessageItem, Conversation } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Avatar, Button, Empty, ErrorState, LoadingBlock, SearchInput } from '../../components/ui';
import { fmtTime, relativeTime } from '../../lib/format';
import { errMsg } from '../../lib/hooks';
import { t } from '../../i18n';
import './messages.css';

const SUGGESTIONS = [
  'Tôi muốn tư vấn gói tập phù hợp',
  'Tôi muốn tăng cơ',
  'Tôi muốn giảm mỡ',
  'Tôi muốn tìm hiểu về PT',
  'Tôi muốn tìm hiểu lịch tập',
];

export default function Messages() {
  const { id: paramId } = useParams<{ id?: string }>();
  const activeId = paramId ? Number(paramId) : null;
  const navigate = useNavigate();
  const toast = useToast();
  const user = useMe();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convError, setConvError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'CONSULTING'>('ASSIGNED');
  const [search, setSearch] = useState('');

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Monitor network online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch conversations list
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.get<Conversation[]>('/conversations');
      setConversations(data);
      setConvError(null);
    } catch (e) {
      setConvError(errMsg(e));
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Active conversation object
  const activeConv = useMemo(() => {
    return conversations.find((c) => c.id === activeId) ?? null;
  }, [conversations, activeId]);

  // Load messages when activeId changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let alive = true;
    setLoadingMsgs(true);
    setMsgError(null);
    setFailedMessage(null);

    api
      .get<ChatMessageItem[]>(`/conversations/${activeId}/messages`, { size: 50 })
      .then((data) => {
        if (!alive) return;
        setMessages(data);
        setLoadingMsgs(false);
        // Mark conversation as read
        api.post(`/conversations/${activeId}/read`).catch(() => {});
        // Update local unreadCount
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch((e) => {
        if (!alive) return;
        setMsgError(errMsg(e));
        setLoadingMsgs(false);
      });

    return () => {
      alive = false;
    };
  }, [activeId]);

  // Auto-scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [loadingMsgs, activeId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length]);

  // Polling new messages: every 5 seconds when tab is visible and activeId is open
  useEffect(() => {
    if (!activeId) return;

    const pollNewMessages = async () => {
      if (document.hidden || !navigator.onLine) return;
      try {
        const lastId = messages.length > 0 ? messages[messages.length - 1].id : 0;
        const newMsgs = await api.get<ChatMessageItem[]>(`/conversations/${activeId}/messages/new`, {
          after: lastId,
        });
        if (newMsgs && newMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
          // If any new message is from the other user, mark as read
          const hasFromThem = newMsgs.some((m) => m.senderUserId !== user.id);
          if (hasFromThem) {
            api.post(`/conversations/${activeId}/read`).catch(() => {});
          }
          // Also refresh conversations list to update snippet/lastMessageAt
          void loadConversations();
        }
      } catch (e) {
        // network error during polling
      }
    };

    const interval = setInterval(pollNewMessages, 5000);
    const onVisibility = () => {
      if (!document.hidden) void pollNewMessages();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [activeId, messages, user.id, loadConversations]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (user.role === 'TRAINER') {
      list = list.filter((c) => c.relation === activeTab);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const otherName = user.role === 'MEMBER' ? c.trainerName : c.memberName;
        return otherName.toLowerCase().includes(q);
      });
    }
    return list;
  }, [conversations, user.role, activeTab, search]);

  const assignedCount = useMemo(
    () => conversations.filter((c) => c.relation === 'ASSIGNED').length,
    [conversations]
  );
  const consultingCount = useMemo(
    () => conversations.filter((c) => c.relation === 'CONSULTING').length,
    [conversations]
  );

  // Send message handler
  const handleSend = async (contentToSend?: string) => {
    const text = (contentToSend ?? inputText).trim();
    if (!text || !activeId || sending) return;

    setSending(true);
    setFailedMessage(null);
    try {
      const sentMsg = await api.post<ChatMessageItem>(`/conversations/${activeId}/messages`, {
        body: text,
      });
      setMessages((prev) => [...prev, sentMsg]);
      setInputText('');
      void loadConversations();
      setTimeout(() => textareaRef.current?.focus(), 50);
    } catch (e) {
      setFailedMessage(text);
      toast.error(errMsg(e));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const retrySend = () => {
    if (!failedMessage) return;
    setInputText(failedMessage);
    void handleSend(failedMessage);
  };

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div className="messages-shell">
        {/* Left column: Conversation list */}
        <aside className={`messages-sidebar ${activeId ? 'hidden-mobile' : ''}`}>
          <div className="messages-sidebar-head">
            <div className="row between" style={{ alignItems: 'center' }}>
              <b style={{ fontSize: 17 }}>{t('Tin nhắn')}</b>
              {user.role === 'MEMBER' && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon="plus"
                  onClick={() => navigate('/coaches')}
                >
                  {t('Tìm HLV')}
                </Button>
              )}
            </div>

            {user.role === 'TRAINER' && (
              <div className="messages-tabs">
                <button
                  type="button"
                  className={`messages-tab-btn ${activeTab === 'ASSIGNED' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ASSIGNED')}
                >
                  <span>{t('Đang phụ trách')}</span>
                  <span className="tiny faint">({assignedCount})</span>
                </button>
                <button
                  type="button"
                  className={`messages-tab-btn ${activeTab === 'CONSULTING' ? 'active' : ''}`}
                  onClick={() => setActiveTab('CONSULTING')}
                >
                  <span>{t('Đang tư vấn')}</span>
                  <span className="tiny faint">({consultingCount})</span>
                </button>
              </div>
            )}

            <SearchInput
              placeholder={t('Tìm kiếm theo tên…')}
              value={search}
              onChange={setSearch}
            />
          </div>

          <div className="messages-list">
            {loadingConvs ? (
              <LoadingBlock rows={5} />
            ) : convError ? (
              <ErrorState message={convError} onRetry={loadConversations} />
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: 24 }}>
                <Empty
                  icon="message"
                  title={t('Chưa có tin nhắn')}
                  desc={
                    user.role === 'MEMBER'
                      ? t('Bạn có thể nhắn tin tư vấn với các huấn luyện viên trong mục Huấn luyện viên.')
                      : t('Chưa có hội viên nào trong danh sách này.')
                  }
                />
                {user.role === 'MEMBER' && (
                  <div className="row center mt-16">
                    <Button variant="primary" size="sm" icon="badge" onClick={() => navigate('/coaches')}>
                      {t('Xem đội ngũ HLV')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const otherName = user.role === 'MEMBER' ? c.trainerName : c.memberName;
                const otherAvatar = user.role === 'MEMBER' ? c.trainerAvatar : c.memberAvatar;
                const isSelected = c.id === activeId;
                const timeStr = c.lastMessageAt ? relativeTime(c.lastMessageAt) : '';

                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`conversation-item ${isSelected ? 'active' : ''}`}
                    onClick={() => navigate(`/messages/${c.id}`)}
                  >
                    <Avatar name={otherName} src={otherAvatar} />
                    <div className="conversation-meta">
                      <div className="conversation-top">
                        <span className="conversation-name ellipsis">{otherName}</span>
                        {timeStr && <span className="conversation-time">{timeStr}</span>}
                      </div>
                      <div className="row between" style={{ alignItems: 'center', gap: 6 }}>
                        <span className="conversation-snippet">
                          {c.lastMessage?.body ?? t('Chưa có tin nhắn')}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="conversation-badge">{c.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right column: Chat conversation window */}
        <section className={`messages-main ${!activeId ? 'hidden-mobile' : ''}`}>
          {!isOnline && (
            <div className="messages-banner-offline">
              <Icon name="alert" size={15} />
              <span>{t('Mất kết nối – đang thử lại…')}</span>
            </div>
          )}

          {!activeConv ? (
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                height: '100%',
                padding: 40,
                textAlign: 'center',
              }}
            >
              <div>
                <Icon name="message" size={48} className="faint mb-12" />
                <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{t('Tin nhắn GymFlow')}</h3>
                <p className="small muted" style={{ maxWidth: 360, margin: '0 auto 16px' }}>
                  {t(
                    'Chọn một cuộc trò chuyện từ danh sách bên trái hoặc nhắn tin tư vấn trực tiếp với huấn luyện viên.'
                  )}
                </p>
                {user.role === 'MEMBER' && (
                  <Button variant="primary" icon="badge" onClick={() => navigate('/coaches')}>
                    {t('Xem danh sách huấn luyện viên')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Chat head */}
              <div className="messages-head">
                <div className="row" style={{ gap: 12, alignItems: 'center' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="chevronLeft"
                    className="mobile-only"
                    onClick={() => navigate('/messages')}
                    aria-label={t('Quay lại danh sách')}
                  />
                  <Avatar
                    name={user.role === 'MEMBER' ? activeConv.trainerName : activeConv.memberName}
                    src={user.role === 'MEMBER' ? activeConv.trainerAvatar : activeConv.memberAvatar}
                    size="sm"
                  />
                  <div>
                    <b style={{ fontSize: 15 }}>
                      {user.role === 'MEMBER' ? activeConv.trainerName : activeConv.memberName}
                    </b>
                    <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                      <span className="tiny faint">
                        {activeConv.relation === 'ASSIGNED'
                          ? t('HLV phụ trách')
                          : t('Đang tư vấn')}
                      </span>
                    </div>
                  </div>
                </div>

                {user.role === 'MEMBER' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/coaches/${activeConv.trainerId}`)}
                  >
                    {t('Xem hồ sơ HLV')}
                  </Button>
                )}
              </div>

              {/* Chat body */}
              <div className="messages-body">
                {loadingMsgs ? (
                  <LoadingBlock rows={4} />
                ) : msgError ? (
                  <ErrorState
                    message={msgError}
                    onRetry={() => {
                      setLoadingMsgs(true);
                      api
                        .get<ChatMessageItem[]>(`/conversations/${activeId}/messages`, { size: 50 })
                        .then((data) => {
                          setMessages(data);
                          setMsgError(null);
                        })
                        .catch((e) => setMsgError(errMsg(e)))
                        .finally(() => setLoadingMsgs(false));
                    }}
                  />
                ) : messages.length === 0 ? (
                  <div className="chat-suggestions">
                    <Icon name="message" size={32} className="ok" />
                    <div>
                      <b style={{ fontSize: 15 }}>{t('Bắt đầu cuộc trò chuyện')}</b>
                      <p className="tiny muted mt-4">
                        {t(
                          'Bấm vào một trong các câu hỏi gợi ý bên dưới để gửi tin nhắn nhanh cho huấn luyện viên:'
                        )}
                      </p>
                    </div>
                    <div className="chat-suggestion-chips">
                      {SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          className="chat-suggestion-chip"
                          onClick={() => handleSend(sug)}
                        >
                          <span>{sug}</span>
                          <Icon name="chevronRight" size={14} className="faint" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderUserId === user.id;
                    const time = fmtTime(m.createdAt);

                    return (
                      <div
                        key={m.id}
                        className={`chat-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                      >
                        <div className="chat-bubble">{m.body}</div>
                        <div className="chat-bubble-meta">
                          <span>{time}</span>
                          {isMine && m.readAt && (
                            <span className="chat-read-tick">{t('Đã xem')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer or Admin Read-Only Banner */}
              {user.role === 'ADMIN' ? (
                <div
                  style={{
                    padding: '14px 20px',
                    background: 'var(--surface)',
                    borderTop: '1px solid var(--hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muted)',
                    fontSize: 13,
                    gap: 8,
                  }}
                >
                  <span>🔒</span>
                  <span>{t('Chế độ chỉ đọc dành cho Quản trị viên · Không thể gửi tin nhắn')}</span>
                </div>
              ) : (
                <div className="messages-composer">
                  {failedMessage && (
                    <div className="messages-retry-bar">
                      <span>{t('Gửi tin nhắn thất bại.')}</span>
                      <Button size="sm" variant="danger" icon="refresh" onClick={retrySend}>
                        {t('Gửi lại')}
                      </Button>
                    </div>
                  )}
                  <form
                    className="messages-composer-form"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      void handleSend();
                    }}
                  >
                    <textarea
                      ref={textareaRef}
                      className="messages-textarea"
                      placeholder={t('Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)')}
                      rows={1}
                      value={inputText}
                      maxLength={2000}
                      disabled={sending}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      icon="arrowRight"
                      disabled={!inputText.trim() || sending}
                      aria-label={t('Gửi')}
                    >
                      {sending ? t('Đang gửi…') : t('Gửi')}
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
