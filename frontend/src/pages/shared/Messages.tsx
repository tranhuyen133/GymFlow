import { ClipboardEvent, DragEvent, FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { ChatMessageItem, Conversation, RecallSync } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Avatar, Button, Confirm, Empty, ErrorState, LoadingBlock, SearchInput } from '../../components/ui';
import { fmtTime, relativeTime } from '../../lib/format';
import { errMsg } from '../../lib/hooks';
import { t } from '../../i18n';
import { ChatAttachment } from './ChatAttachment';
import { forgetAttachment, uploadAttachment } from './chatApi';
import { ACCEPT, applyRecalled, canRecall, checkFile, formatBytes, kindOf, MAX_CAPTION, mergeMessages, previewOf } from './chatRules';
import './messages.css';

const SUGGESTIONS = [
  'Tôi muốn tư vấn gói tập phù hợp',
  'Tôi muốn tăng cơ',
  'Tôi muốn giảm mỡ',
  'Tôi muốn tìm hiểu về PT',
  'Tôi muốn tìm hiểu lịch tập',
];

interface PendingFile { file: File; kind: 'IMAGE' | 'VIDEO' | 'FILE'; preview: string | null }

/** Dòng xem trước tin cuối trong danh sách hội thoại. */
export function MessagePreview({ m, meId }: { m: ChatMessageItem | null | undefined; meId: number }) {
  const p = previewOf(m, meId);
  return <>{p.label && <i className="conversation-tag">{t(p.label)}</i>}{p.label && p.text ? ' ' : ''}{p.text}</>;
}

export default function Messages() {
  const { id: paramId } = useParams<{ id?: string }>();
  const activeId = paramId && /^\d+$/.test(paramId) ? Number(paramId) : null;
  const navigate = useNavigate();
  const toast = useToast();
  const user = useMe();
  const isAdmin = user.role === 'ADMIN';

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

  const [pending, setPending] = useState<PendingFile | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'recall' | 'hide'; m: ChatMessageItem } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const recallSince = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // Đồng hồ để ẩn nút "Thu hồi" khi quá 15 phút
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(timer);
  }, []);

  // Đóng menu tin nhắn khi bấm ra ngoài / Esc
  useEffect(() => {
    if (menuFor == null) return;
    const close = (e: Event) => {
      if (e instanceof window.KeyboardEvent ? e.key === 'Escape' : !(e.target as HTMLElement).closest?.('.chat-menu, .chat-more')) setMenuFor(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close as EventListener);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close as EventListener);
    };
  }, [menuFor]);

  // Giải phóng ảnh xem trước khi đổi / bỏ tệp
  useEffect(() => () => { if (pending?.preview) URL.revokeObjectURL(pending.preview); }, [pending]);

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
  }, [loadConversations, isAdmin]);

  const activeConv = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  const loadMessages = useCallback(async (id: number) => {
    const data = await api.get<ChatMessageItem[]>(`/conversations/${id}/messages`, { size: 50 });
    setMessages(data);
    setMsgError(null);
    api.post(`/conversations/${id}/read`).catch(() => {});
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    // Lấy giờ máy chủ làm mốc theo dõi thu hồi
    api.get<RecallSync>(`/conversations/${id}/recalled`).then((r) => { recallSince.current = r.serverTime; }).catch(() => {});
  }, []);

  useEffect(() => {
    setFailedMessage(null);
    setMenuFor(null);
    setPending(null);
    recallSince.current = null;
    if (!activeId) { setMessages([]); return; }
    let alive = true;
    setLoadingMsgs(true);
    setMsgError(null);
    loadMessages(activeId)
      .catch((e) => { if (alive) setMsgError(errMsg(e)); })
      .finally(() => { if (alive) setLoadingMsgs(false); });
    return () => { alive = false; };
  }, [activeId, loadMessages]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };
  useEffect(() => { scrollToBottom(false); }, [loadingMsgs, activeId]);
  const lastId = messages.length ? messages[messages.length - 1].id : 0;
  useEffect(() => { if (lastId) scrollToBottom(true); }, [lastId]);

  // Thăm dò 5 giây/lần: tin mới + tin vừa bị thu hồi
  useEffect(() => {
    if (!activeId) return;
    const poll = async () => {
      if (document.hidden || !navigator.onLine) return;
      try {
        const newMsgs = await api.get<ChatMessageItem[]>(`/conversations/${activeId}/messages/new`, { after: lastId });
        if (newMsgs.length > 0) {
          setMessages((prev) => mergeMessages(prev, newMsgs));
          if (newMsgs.some((m) => m.senderUserId !== user.id) && !isAdmin) api.post(`/conversations/${activeId}/read`).catch(() => {});
          if (!isAdmin) void loadConversations();
        }
        if (recallSince.current) {
          const r = await api.get<RecallSync>(`/conversations/${activeId}/recalled`, { since: recallSince.current });
          recallSince.current = r.serverTime;
          if (r.recalledIds.length) {
            r.recalledIds.forEach(forgetAttachment);
            setMessages((prev) => applyRecalled(prev, r.recalledIds));
            if (!isAdmin) void loadConversations();
          }
        }
      } catch {
        // lỗi mạng khi thăm dò: bỏ qua, lần sau thử lại
      }
    };
    const interval = setInterval(poll, 5000);
    const onVisibility = () => { if (!document.hidden) void poll(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [activeId, lastId, user.id, isAdmin, loadConversations]);

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (user.role === 'TRAINER') list = list.filter((c) => c.relation === activeTab);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => (user.role === 'MEMBER' ? c.trainerName : c.memberName).toLowerCase().includes(q));
    return list;
  }, [conversations, user.role, activeTab, search]);

  const assignedCount = useMemo(() => conversations.filter((c) => c.relation === 'ASSIGNED').length, [conversations]);
  const consultingCount = useMemo(() => conversations.filter((c) => c.relation === 'CONSULTING').length, [conversations]);

  // ---------- Tệp đính kèm ----------
  const pickFile = (file: File | null | undefined) => {
    if (!file || sending) return;
    const check = checkFile(file);
    if (!check.ok) {
      toast.error(t(check.error, check.vars));
      return;
    }
    const preview = check.kind === 'FILE' ? null : URL.createObjectURL(file);
    setPending({ file, kind: check.kind, preview });
    setTimeout(() => textareaRef.current?.focus(), 30);
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(e.clipboardData.files ?? [])[0];
    if (file) { e.preventDefault(); pickFile(file); }
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (isAdmin || !activeConv) return;
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 1) toast.info(t('Mỗi lần chỉ gửi được 1 tệp – đã chọn tệp đầu tiên'));
    pickFile(files[0]);
  };

  // ---------- Gửi ----------
  const handleSend = async (contentToSend?: string) => {
    const text = (contentToSend ?? inputText).trim();
    if (!activeId || sending) return;
    if (text.length > MAX_CAPTION) { toast.error(t('Tin nhắn tối đa 2000 ký tự')); return; }

    if (pending && contentToSend === undefined) {
      setSending(true);
      setProgress(0);
      const job = uploadAttachment(activeId, pending.file, text, setProgress);
      cancelRef.current = job.cancel;
      try {
        const sent = await job.promise;
        setMessages((prev) => mergeMessages(prev, [sent]));
        setPending(null);
        setInputText('');
        void loadConversations();
      } catch (e) {
        if (!(e instanceof ApiError && e.status === -1)) toast.error(errMsg(e));
      } finally {
        cancelRef.current = null;
        setProgress(null);
        setSending(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
      return;
    }

    if (!text) return;
    setSending(true);
    setFailedMessage(null);
    try {
      const sentMsg = await api.post<ChatMessageItem>(`/conversations/${activeId}/messages`, { body: text });
      setMessages((prev) => mergeMessages(prev, [sentMsg]));
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
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void handleSend();
    }
  };

  const retrySend = () => {
    if (!failedMessage) return;
    setInputText(failedMessage);
    void handleSend(failedMessage);
  };

  // ---------- Thu hồi / xoá phía tôi ----------
  const doRecall = async (m: ChatMessageItem) => {
    try {
      const updated = await api.post<ChatMessageItem>(`/messages/${m.id}/recall`);
      forgetAttachment(m.id);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
      void loadConversations();
      toast.success(t('Đã thu hồi tin nhắn'));
    } catch (e) {
      toast.error(errMsg(e));
      throw e;
    }
  };

  const doHide = async (m: ChatMessageItem) => {
    try {
      await api.del(`/messages/${m.id}`);
      forgetAttachment(m.id);
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
      void loadConversations();
      toast.success(t('Đã xoá tin nhắn ở phía bạn'));
    } catch (e) {
      toast.error(errMsg(e));
      throw e;
    }
  };

  const copyText = async (m: ChatMessageItem) => {
    setMenuFor(null);
    try {
      await navigator.clipboard.writeText(m.body);
      toast.success(t('Đã sao chép'));
    } catch {
      toast.error(t('Không sao chép được'));
    }
  };

  const otherName = activeConv ? (user.role === 'MEMBER' ? activeConv.trainerName : activeConv.memberName) : '';
  const canSend = !!activeConv && !sending && (!!pending || !!inputText.trim());

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div className="messages-shell">
        <aside className={`messages-sidebar ${activeId ? 'hidden-mobile' : ''}`}>
          <div className="messages-sidebar-head">
            <div className="row between" style={{ alignItems: 'center' }}>
              <b style={{ fontSize: 17 }}>{t('Tin nhắn')}</b>
              {user.role === 'MEMBER' && (
                <Button size="sm" variant="ghost" icon="plus" onClick={() => navigate('/coaches')}>{t('Tìm HLV')}</Button>
              )}
            </div>

            {user.role === 'TRAINER' && (
              <div className="messages-tabs">
                <button type="button" className={`messages-tab-btn ${activeTab === 'ASSIGNED' ? 'active' : ''}`} onClick={() => setActiveTab('ASSIGNED')}>
                  <span>{t('Đang phụ trách')}</span>
                  <span className="tiny faint">({assignedCount})</span>
                </button>
                <button type="button" className={`messages-tab-btn ${activeTab === 'CONSULTING' ? 'active' : ''}`} onClick={() => setActiveTab('CONSULTING')}>
                  <span>{t('Đang tư vấn')}</span>
                  <span className="tiny faint">({consultingCount})</span>
                </button>
              </div>
            )}

            <SearchInput placeholder={t('Tìm kiếm theo tên…')} value={search} onChange={setSearch} />
          </div>

          <div className="messages-list">
            {loadingConvs ? (
              <LoadingBlock rows={5} />
            ) : convError ? (
              <ErrorState message={convError} onRetry={loadConversations} />
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: 24 }}>
                <Empty icon="message" title={t('Chưa có tin nhắn')}
                  desc={user.role === 'MEMBER'
                    ? t('Bạn có thể nhắn tin tư vấn với các huấn luyện viên trong mục Huấn luyện viên.')
                    : t('Chưa có hội viên nào trong danh sách này.')} />
                {user.role === 'MEMBER' && (
                  <div className="row center mt-16">
                    <Button variant="primary" size="sm" icon="badge" onClick={() => navigate('/coaches')}>{t('Xem đội ngũ HLV')}</Button>
                  </div>
                )}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const name = user.role === 'MEMBER' ? c.trainerName : c.memberName;
                const avatar = user.role === 'MEMBER' ? c.trainerAvatar : c.memberAvatar;
                const timeStr = c.lastMessageAt ? relativeTime(c.lastMessageAt) : '';
                return (
                  <button key={c.id} type="button" className={`conversation-item ${c.id === activeId ? 'active' : ''}`} onClick={() => navigate(`/messages/${c.id}`)}>
                    <Avatar name={name} src={avatar} />
                    <div className="conversation-meta">
                      <div className="conversation-top">
                        <span className="conversation-name ellipsis">{name}</span>
                        {timeStr && <span className="conversation-time">{timeStr}</span>}
                      </div>
                      <div className="row between" style={{ alignItems: 'center', gap: 6 }}>
                        <span className="conversation-snippet"><MessagePreview m={c.lastMessage} meId={user.id} /></span>
                        {c.unreadCount > 0 && <span className="conversation-badge">{c.unreadCount}</span>}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className={`messages-main ${!activeId ? 'hidden-mobile' : ''} ${dragOver ? 'is-drag' : ''}`}
          onDragOver={(e) => { if (!isAdmin && activeConv && e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragOver(true); } }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
          onDrop={onDrop}>
          {!isOnline && (
            <div className="messages-banner-offline">
              <Icon name="alert" size={15} />
              <span>{t('Mất kết nối – đang thử lại…')}</span>
            </div>
          )}
          {dragOver && <div className="messages-drop"><Icon name="upload" size={28} /><b>{t('Thả tệp vào đây để gửi')}</b><span>{t('Ảnh, video hoặc tệp tài liệu')}</span></div>}

          {!activeConv ? (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
              <div>
                <Icon name="message" size={48} className="faint mb-12" />
                <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{t('Tin nhắn GymFlow')}</h3>
                <p className="small muted" style={{ maxWidth: 360, margin: '0 auto 16px' }}>
                  {t('Chọn một cuộc trò chuyện từ danh sách bên trái hoặc nhắn tin tư vấn trực tiếp với huấn luyện viên.')}
                </p>
                {user.role === 'MEMBER' && (
                  <Button variant="primary" icon="badge" onClick={() => navigate('/coaches')}>{t('Xem danh sách huấn luyện viên')}</Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="messages-head">
                <div className="row" style={{ gap: 12, alignItems: 'center' }}>
                  <Button variant="ghost" size="sm" icon="chevronLeft" className="mobile-only" onClick={() => navigate('/messages')} aria-label={t('Quay lại danh sách')} />
                  <Avatar name={otherName} src={user.role === 'MEMBER' ? activeConv.trainerAvatar : activeConv.memberAvatar} size="sm" />
                  <div>
                    <b style={{ fontSize: 15 }}>{otherName}</b>
                    <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                      <span className="tiny faint">{activeConv.relation === 'ASSIGNED' ? t('HLV phụ trách') : t('Đang tư vấn')}</span>
                    </div>
                  </div>
                </div>
                {user.role === 'MEMBER' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/coaches/${activeConv.trainerId}`)}>{t('Xem hồ sơ HLV')}</Button>
                )}
              </div>

              <div className="messages-body">
                {loadingMsgs ? (
                  <LoadingBlock rows={4} />
                ) : msgError ? (
                  <ErrorState message={msgError} onRetry={() => {
                    setLoadingMsgs(true);
                    loadMessages(activeConv.id).catch((e) => setMsgError(errMsg(e))).finally(() => setLoadingMsgs(false));
                  }} />
                ) : messages.length === 0 ? (
                  <div className="chat-suggestions">
                    <Icon name="message" size={32} className="ok" />
                    <div>
                      <b style={{ fontSize: 15 }}>{t('Bắt đầu cuộc trò chuyện')}</b>
                      <p className="tiny muted mt-4">{t('Bấm vào một trong các câu hỏi gợi ý bên dưới để gửi tin nhắn nhanh cho huấn luyện viên:')}</p>
                    </div>
                    <div className="chat-suggestion-chips">
                      {SUGGESTIONS.map((sug) => (
                        <button key={sug} type="button" className="chat-suggestion-chip" disabled={sending} onClick={() => handleSend(t(sug))}>
                          <span>{t(sug)}</span>
                          <Icon name="chevronRight" size={14} className="faint" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderUserId === user.id;
                    const kind = kindOf(m);
                    const recallable = !isAdmin && canRecall(m, user.id, now);
                    const hasText = !m.recalled && !!m.body;
                    return (
                      <div key={m.id} className={`chat-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
                        <div className="chat-bubble-line">
                          {m.recalled ? (
                            <div className="chat-bubble is-recalled"><Icon name="undo" size={13} />{isMine ? t('Bạn đã thu hồi một tin nhắn') : t('Tin nhắn đã được thu hồi')}</div>
                          ) : (
                            <div className={`chat-bubble ${kind !== 'TEXT' ? `has-att is-${kind.toLowerCase()}` : ''}`}>
                              {kind !== 'TEXT' && <ChatAttachment m={m} />}
                              {hasText && <div className="chat-text">{m.body}</div>}
                            </div>
                          )}
                          {!isAdmin && !m.recalled && (
                            <div className="chat-actions">
                              <button type="button" className={`chat-more ${menuFor === m.id ? 'on' : ''}`} aria-label={t('Tuỳ chọn tin nhắn')} aria-haspopup="menu"
                                aria-expanded={menuFor === m.id} onClick={() => setMenuFor(menuFor === m.id ? null : m.id)}>
                                <Icon name="more" size={16} />
                              </button>
                              {menuFor === m.id && (
                                <div className="chat-menu" role="menu">
                                  {hasText && <button type="button" role="menuitem" onClick={() => copyText(m)}><Icon name="copy" size={15} />{t('Sao chép')}</button>}
                                  {recallable && <button type="button" role="menuitem" onClick={() => { setMenuFor(null); setConfirm({ type: 'recall', m }); }}><Icon name="undo" size={15} />{t('Thu hồi')}</button>}
                                  <button type="button" role="menuitem" className="danger" onClick={() => { setMenuFor(null); setConfirm({ type: 'hide', m }); }}><Icon name="trash" size={15} />{t('Xoá phía tôi')}</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="chat-bubble-meta">
                          <span>{fmtTime(m.createdAt)}</span>
                          {isAdmin && <span>· {m.senderName}</span>}
                          {isMine && m.readAt && !m.recalled && <span className="chat-read-tick">{t('Đã xem')}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {isAdmin ? (
                <div className="messages-readonly">
                  <Icon name="lock" size={14} />
                  <span>{t('Chế độ chỉ đọc dành cho Quản trị viên · Không thể gửi tin nhắn')}</span>
                </div>
              ) : (
                <div className="messages-composer">
                  {failedMessage && (
                    <div className="messages-retry-bar">
                      <span>{t('Gửi tin nhắn thất bại.')}</span>
                      <Button size="sm" variant="danger" icon="refresh" onClick={retrySend}>{t('Gửi lại')}</Button>
                    </div>
                  )}
                  {pending && (
                    <div className="composer-file">
                      {pending.kind === 'IMAGE' && pending.preview ? <img src={pending.preview} alt="" />
                        : pending.kind === 'VIDEO' && pending.preview ? <video src={pending.preview} muted />
                          : <span className="composer-file-ic"><Icon name="file" size={18} /></span>}
                      <span className="composer-file-meta">
                        <b title={pending.file.name}>{pending.file.name}</b>
                        <span>{formatBytes(pending.file.size)} · {pending.kind === 'IMAGE' ? t('Ảnh') : pending.kind === 'VIDEO' ? t('Video') : t('Tệp')}</span>
                        {progress != null && <span className="composer-progress"><i style={{ width: `${progress}%` }} /></span>}
                      </span>
                      {progress != null ? (
                        <button type="button" className="composer-file-x" onClick={() => cancelRef.current?.()} aria-label={t('Huỷ gửi')} title={t('Huỷ gửi')}><Icon name="x" size={16} /></button>
                      ) : (
                        <button type="button" className="composer-file-x" onClick={() => setPending(null)} aria-label={t('Bỏ tệp')} title={t('Bỏ tệp')}><Icon name="x" size={16} /></button>
                      )}
                    </div>
                  )}
                  <form className="messages-composer-form" onSubmit={(e: FormEvent) => { e.preventDefault(); void handleSend(); }}>
                    <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
                    <Button variant="ghost" icon="paperclip" disabled={sending} onClick={() => fileRef.current?.click()}
                      aria-label={t('Đính kèm ảnh, video hoặc tệp')} title={t('Đính kèm ảnh, video hoặc tệp')} />
                    <textarea
                      ref={textareaRef}
                      className="messages-textarea"
                      placeholder={pending ? t('Thêm chú thích (không bắt buộc)…') : t('Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)')}
                      rows={1}
                      value={inputText}
                      maxLength={MAX_CAPTION}
                      disabled={sending}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onPaste={onPaste}
                    />
                    <Button type="submit" variant="primary" icon="send" disabled={!canSend} aria-label={t('Gửi')}>
                      {sending ? (progress != null ? `${progress}%` : t('Đang gửi…')) : t('Gửi')}
                    </Button>
                  </form>
                  {inputText.length > MAX_CAPTION - 200 && <span className="tiny faint right">{inputText.length}/{MAX_CAPTION}</span>}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {confirm && (
        <Confirm
          title={confirm.type === 'recall' ? 'Thu hồi tin nhắn?' : 'Xoá tin nhắn ở phía bạn?'}
          message={confirm.type === 'recall'
            ? t('Tin nhắn và tệp đính kèm sẽ bị xoá với cả hai bên. Hai bên sẽ thấy dòng "Tin nhắn đã được thu hồi".')
            : t('Tin nhắn chỉ bị ẩn với bạn; người kia vẫn thấy. Thao tác này không hoàn tác được.')}
          confirmText={confirm.type === 'recall' ? 'Thu hồi' : 'Xoá phía tôi'}
          danger
          onConfirm={() => (confirm.type === 'recall' ? doRecall(confirm.m) : doHide(confirm.m))}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
