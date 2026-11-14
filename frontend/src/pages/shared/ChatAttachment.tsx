import { useEffect, useState } from 'react';
import type { ChatMessageItem } from '../../api/types';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/ui';
import { errMsg } from '../../lib/hooks';
import { t } from '../../i18n';
import { attachmentUrl, downloadAttachment } from './chatApi';
import { extensionOf, formatBytes, kindOf } from './chatRules';

/** Hiển thị tệp trong bong bóng chat: ảnh (bấm phóng to), video (phát tại chỗ), tệp (thẻ tải xuống). */
export function ChatAttachment({ m }: { m: ChatMessageItem }) {
  const kind = kindOf(m);
  const media = kind === 'IMAGE' || kind === 'VIDEO';
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = m.attachmentName || t('Tệp đính kèm');

  useEffect(() => {
    if (!media) return;
    let alive = true;
    setError(null);
    attachmentUrl(m.id).then((u) => { if (alive) setUrl(u); }).catch((e) => { if (alive) setError(errMsg(e)); });
    return () => { alive = false; };
  }, [m.id, media]);

  const download = async () => {
    setBusy(true);
    try { await downloadAttachment(m.id, name); setError(null); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };

  if (media && error) {
    return <div className="chat-att-error"><Icon name="alert" size={14} />{t('Không tải được tệp')} – {error}</div>;
  }

  if (kind === 'IMAGE') {
    return (
      <>
        <button type="button" className={`chat-att-image ${url ? '' : 'is-loading'}`} onClick={() => url && setZoom(true)} aria-label={t('Xem ảnh lớn')}>
          {url ? <img src={url} alt={name} loading="lazy" /> : <span className="chat-att-spinner" />}
        </button>
        {zoom && url && (
          <Modal title={name} onClose={() => setZoom(false)} size="wide"
            footer={<button type="button" className="btn btn-secondary" onClick={download} disabled={busy}><Icon name="download" /><span>{t('Tải xuống')}</span></button>}>
            <div className="chat-att-zoom"><img src={url} alt={name} /></div>
          </Modal>
        )}
      </>
    );
  }

  if (kind === 'VIDEO') {
    return (
      <div className={`chat-att-video ${url ? '' : 'is-loading'}`}>
        {url ? <video src={url} controls preload="metadata" playsInline /> : <span className="chat-att-spinner" />}
      </div>
    );
  }

  return (
    <div className="chat-att-file">
      <span className="chat-att-ext">{extensionOf(name).toUpperCase().slice(0, 4) || <Icon name="file" size={16} />}</span>
      <span className="chat-att-meta">
        <b title={name}>{name}</b>
        <span>{formatBytes(m.attachmentSize)}</span>
        {error && <span className="chat-att-err">{error}</span>}
      </span>
      <button type="button" className="chat-att-dl" onClick={download} disabled={busy} aria-label={t('Tải xuống')} title={t('Tải xuống')}>
        {busy ? <span className="chat-att-spinner sm" /> : <Icon name="download" size={16} />}
      </button>
    </div>
  );
}
