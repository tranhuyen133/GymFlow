import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { ChatMessageItem, MessageKind } from '../../api/types';
import { Icon } from '../../components/Icon';
import { Button, Empty, ErrorState, LoadingBlock, Modal } from '../../components/ui';
import { errMsg } from '../../lib/hooks';
import { t } from '../../i18n';
import { attachmentUrl, downloadAttachment } from './chatApi';
import { extensionOf, formatBytes } from './chatRules';
import './messages.css';

type Tab = Extract<MessageKind, 'IMAGE' | 'VIDEO' | 'FILE'>;

const TABS: { key: Tab; label: string; icon: 'image' | 'video' | 'file' }[] = [
  { key: 'IMAGE', label: 'Ảnh', icon: 'image' },
  { key: 'VIDEO', label: 'Video', icon: 'video' },
  { key: 'FILE', label: 'Tệp', icon: 'file' },
];

const PAGE_SIZE = 30;

/** Thư viện ảnh/video/tệp đã gửi trong một hội thoại (V47). */
export function ConversationMedia({ conversationId, onClose }: { conversationId: number; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('IMAGE');
  const [items, setItems] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [preview, setPreview] = useState<ChatMessageItem | null>(null);

  const load = (kind: Tab) => {
    setLoading(true);
    setError(null);
    api.get<ChatMessageItem[]>(`/conversations/${conversationId}/media`, { kind, size: PAGE_SIZE })
      .then((data) => {
        setItems(data);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(tab);
  }, [conversationId, tab]);

  const loadMore = async () => {
    const last = items[items.length - 1];
    if (!last || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await api.get<ChatMessageItem[]>(`/conversations/${conversationId}/media`, {
        kind: tab, before: last.id, size: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const emptyLabel = tab === 'IMAGE' ? 'Chưa có ảnh nào được gửi' : tab === 'VIDEO' ? 'Chưa có video nào được gửi' : 'Chưa có tệp nào được gửi';

  return (
    <Modal
      title={t('Ảnh, video và tệp đã gửi')}
      size="wide"
      onClose={onClose}
      footer={<div className="row between" style={{ width: '100%' }}><span className="tiny faint">{t('Chỉ hiển thị tệp trong cuộc trò chuyện này')}</span><Button variant="ghost" onClick={onClose}>{t('Đóng')}</Button></div>}
    >
      <div className="media-gallery">
        <div className="media-tabs" role="tablist">
          {TABS.map((x) => (
            <button key={x.key} type="button" role="tab" aria-selected={tab === x.key}
              className={`media-tab ${tab === x.key ? 'on' : ''}`} onClick={() => setTab(x.key)}>
              <Icon name={x.icon} size={15} /><span>{t(x.label)}</span>
            </button>
          ))}
        </div>

        {loading ? <LoadingBlock rows={4} />
          : error ? <ErrorState message={error} onRetry={() => load(tab)} />
            : items.length === 0 ? <Empty icon={tab === 'IMAGE' ? 'image' : tab === 'VIDEO' ? 'video' : 'file'} title={emptyLabel} desc={t('Tệp gửi trong cuộc trò chuyện sẽ xuất hiện ở đây.')} />
              : (
                <>
                  {tab === 'FILE' ? (
                    <div className="media-files">
                      {items.map((m) => (
                        <MediaFileRow key={m.id} m={m} />
                      ))}
                    </div>
                  ) : (
                    <div className={`media-grid ${tab === 'VIDEO' ? 'is-video' : ''}`}>
                      {items.map((m) => (
                        <MediaThumb key={m.id} m={m} kind={tab} onOpen={() => setPreview(m)} />
                      ))}
                    </div>
                  )}
                  {hasMore && (
                    <div className="row center mt-16">
                      <Button variant="secondary" loading={loadingMore} onClick={loadMore}>{t('Tải thêm')}</Button>
                    </div>
                  )}
                </>
              )}
      </div>

      {preview && <MediaPreview m={preview} onClose={() => setPreview(null)} />}
    </Modal>
  );
}

function MediaThumb({ m, kind, onOpen }: { m: ChatMessageItem; kind: 'IMAGE' | 'VIDEO'; onOpen: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    setFailed(false);
    attachmentUrl(m.id).then((u) => { if (alive) setUrl(u); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [m.id]);

  return (
    <button type="button" className={`media-thumb ${url ? '' : 'is-loading'}`} onClick={onOpen}
      aria-label={t(kind === 'IMAGE' ? 'Xem ảnh' : 'Xem video')} title={m.attachmentName ?? undefined}>
      {failed ? <span className="media-thumb-fail"><Icon name="alert" size={18} /></span>
        : !url ? <span className="chat-att-spinner" />
          : kind === 'IMAGE' ? <img src={url} alt={m.attachmentName ?? ''} loading="lazy" />
            : <>
              <video src={url} muted preload="metadata" playsInline />
              <span className="media-thumb-play"><Icon name="play" size={20} /></span>
            </>}
      {m.body && <span className="media-thumb-caption">{m.body}</span>}
    </button>
  );
}

function MediaPreview({ m, onClose }: { m: ChatMessageItem; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const kind = m.kind ?? 'IMAGE';
  const name = m.attachmentName || t('Tệp đính kèm');

  useEffect(() => {
    let alive = true;
    attachmentUrl(m.id).then((u) => { if (alive) setUrl(u); }).catch((e) => { if (alive) setError(errMsg(e)); });
    return () => { alive = false; };
  }, [m.id]);

  const download = async () => {
    setBusy(true);
    try { await downloadAttachment(m.id, name); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={name} size="wide" onClose={onClose}
      footer={<button type="button" className="btn btn-secondary" onClick={download} disabled={busy}><Icon name="download" /><span>{t('Tải xuống')}</span></button>}>
      <div className="chat-att-zoom">
        {error ? <ErrorState message={error} />
          : !url ? <LoadingBlock rows={3} />
            : kind === 'VIDEO' ? <video src={url} controls autoPlay playsInline className="media-preview-video" />
              : <img src={url} alt={name} />}
      </div>
      {m.body && <p className="media-preview-caption">{m.body}</p>}
    </Modal>
  );
}

function MediaFileRow({ m }: { m: ChatMessageItem }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = m.attachmentName || t('Tệp đính kèm');

  const download = async () => {
    setBusy(true);
    try { await downloadAttachment(m.id, name); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="media-file-row">
      <span className="chat-att-ext">{extensionOf(name).toUpperCase().slice(0, 4) || <Icon name="file" size={16} />}</span>
      <span className="chat-att-meta">
        <b title={name}>{name}</b>
        <span>{formatBytes(m.attachmentSize)}{m.body ? ` · ${m.body}` : ''}</span>
        {error && <span className="chat-att-err">{error}</span>}
      </span>
      <button type="button" className="chat-att-dl" onClick={download} disabled={busy} aria-label={t('Tải xuống')} title={t('Tải xuống')}>
        {busy ? <span className="chat-att-spinner sm" /> : <Icon name="download" size={16} />}
      </button>
    </div>
  );
}
