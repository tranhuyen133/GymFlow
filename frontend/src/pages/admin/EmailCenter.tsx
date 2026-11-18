/**
 * V55 · Quản lý › Email tự động: xem trước từng mẫu (VI/EN, máy tính/điện thoại), gửi thử tới email của mình,
 * chạy ngay một việc gửi, và nhật ký mọi email đã gửi / lỗi / bị người nhận tắt.
 */
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  EMAIL_KIND_DESC, EMAIL_KIND_LABEL,
  type EmailKind, type EmailLogRow, type EmailPreview, type EmailRunResult, type EmailSummary,
} from '../../api/engagementTypes';
import type { Page } from '../../api/types';
import { HelpTip } from '../../components/Help';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Empty, ErrorState, LoadingBlock, PageHead, Pager, Segmented, Table } from '../../components/ui';
import { t } from '../../i18n';
import { fmtDateTime } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';
import '../../components/email.css';

type Tab = 'templates' | 'logs';
const STATUS_TONE = { SENT: 'green', FAILED: 'red', SKIPPED: 'muted' } as const;
const STATUS_LABEL = { SENT: 'Đã gửi', FAILED: 'Lỗi', SKIPPED: 'Người nhận đã tắt' } as const;

export default function EmailCenter() {
  const [tab, setTab] = useState<Tab>('templates');
  const summary = useAsync(() => api.get<EmailSummary>('/admin/emails/summary'), []);
  return (
    <div className="page">
      <PageHead eyebrow={t('Hệ thống')} title={t('Email tự động')}
        desc={t('Email nhắc gia hạn, sinh nhật, lịch tập, tóm tắt tuần, báo cáo sáng HLV, giữ chân và huy hiệu – giao diện cùng phong cách web, song ngữ theo ngôn ngữ người nhận.')} />
      <HelpTip id="email-center" steps={[
        'Mỗi loại email chạy tự động theo giờ ghi trên thẻ. Bấm thẻ để xem trước nội dung bằng tiếng Việt hoặc tiếng Anh.',
        '“Gửi thử tới email của tôi” gửi bản mẫu tới email đăng nhập của bạn để xem trên Gmail thật (điện thoại và máy tính).',
        '“Chạy ngay” gửi luôn cho những người đủ điều kiện hôm nay. Ai đã nhận rồi sẽ không bị gửi lần hai.',
        'Hội viên tắt loại email nào thì nhật ký ghi “Người nhận đã tắt” và không gửi. Email lỗi sẽ được thử lại ở lần chạy sau (tối đa 3 lần).',
      ]} />
      {summary.data && !summary.data.mailConfigured && (
        <Alert kind="warning">{t('Máy chủ chưa cấu hình SMTP nên chưa gửi được email. Xem trước vẫn dùng được.')}</Alert>
      )}
      <div className="mt-16"><Segmented<Tab> value={tab} onChange={setTab} options={[
        { value: 'templates', label: t('Mẫu email') },
        { value: 'logs', label: t('Nhật ký gửi') },
      ]} /></div>
      <div className="mt-16">
        {tab === 'templates'
          ? (summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} />
            : !summary.data ? <LoadingBlock rows={6} /> : <Templates summary={summary.data} onRan={summary.reload} />)
          : <Logs />}
      </div>
    </div>
  );
}

function Templates({ summary, onRan }: { summary: EmailSummary; onRan: () => void }) {
  const toast = useToast();
  const [kind, setKind] = useState<EmailKind>('RENEWAL');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'test' | 'run' | null>(null);

  useEffect(() => {
    let alive = true;
    setPreview(null);
    setPreviewError(null);
    api.get<EmailPreview>(`/admin/emails/preview/${kind}`, { lang })
      .then((p) => { if (alive) setPreview(p); })
      .catch((e) => { if (alive) setPreviewError(errMsg(e)); });
    return () => { alive = false; };
  }, [kind, lang]);

  const sendTest = async () => {
    setBusy('test');
    try {
      await api.post<EmailRunResult>(`/admin/emails/test/${kind}?lang=${lang}`);
      toast.success(t('Đã gửi bản thử tới email của bạn'));
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  const runNow = async () => {
    setBusy('run');
    try {
      const r = await api.post<EmailRunResult>(`/admin/emails/run/${kind}`);
      toast.success(r.sent > 0 ? t('Đã gửi {n} email', { n: r.sent }) : t('Không có ai cần gửi lúc này (hoặc đã nhận rồi)'));
      onRan();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="email-kinds">
        {summary.kinds.map((k) => (
          <button key={k.kind} type="button" className={`email-kind${kind === k.kind ? ' on' : ''}`} onClick={() => setKind(k.kind)}>
            <b>{t(EMAIL_KIND_LABEL[k.kind])}</b>
            <span className="tiny muted">{t(EMAIL_KIND_DESC[k.kind])}</span>
            <span className="tiny faint">{t(k.schedule)}</span>
            <span className="counts">
              <Badge tone="green">{t('{n} đã gửi', { n: k.sent })}</Badge>
              {k.failed > 0 && <Badge tone="red">{t('{n} lỗi', { n: k.failed })}</Badge>}
              {k.skipped > 0 && <Badge tone="muted">{t('{n} đã tắt', { n: k.skipped })}</Badge>}
            </span>
          </button>
        ))}
      </div>
      <p className="tiny faint" style={{ margin: 0 }}>{t('Số liệu 7 ngày gần nhất · gửi từ {from}', { from: summary.from })}</p>

      <Card title={t('Xem trước')} icon="eye" actions={
        <div className="row row-wrap" style={{ gap: 8 }}>
          <Segmented<'vi' | 'en'> value={lang} onChange={setLang} options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} />
          <Segmented<'desktop' | 'mobile'> value={device} onChange={setDevice} options={[{ value: 'desktop', label: t('Máy tính') }, { value: 'mobile', label: t('Điện thoại') }]} />
        </div>
      }>
        <div className="email-preview-wrap">
          <div className="email-preview-bar">
            <div className="email-subject grow">{preview ? preview.subject : '…'}</div>
            <div className="row" style={{ gap: 8 }}>
              <Button icon="send" loading={busy === 'test'} disabled={!summary.mailConfigured} onClick={() => void sendTest()}>{t('Gửi thử tới email của tôi')}</Button>
              {kind !== 'SECURITY' && (
                <Button variant="primary" icon="play" loading={busy === 'run'} disabled={!summary.mailConfigured} onClick={() => void runNow()}>{t('Chạy ngay')}</Button>
              )}
            </div>
          </div>
          {previewError ? <Alert kind="error">{previewError}</Alert> : !preview ? <LoadingBlock rows={8} /> : (
            <iframe title={t('Xem trước email')} className={`email-frame${device === 'mobile' ? ' mobile' : ''}`} srcDoc={preview.html} sandbox="" />
          )}
        </div>
      </Card>
    </div>
  );
}

function Logs() {
  const [kind, setKind] = useState<EmailKind | ''>('');
  const [status, setStatus] = useState<'' | 'SENT' | 'FAILED' | 'SKIPPED'>('');
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useAsync(
    () => api.get<Page<EmailLogRow>>('/admin/emails/logs', { kind, status, page, size: 30 }), [kind, status, page]);

  return (
    <Card flush>
      <div className="row row-wrap" style={{ gap: 10, padding: 14 }}>
        <select className="select" value={kind} onChange={(e) => { setKind(e.target.value as EmailKind | ''); setPage(0); }} aria-label={t('Loại email')}>
          <option value="">{t('Mọi loại email')}</option>
          {(Object.keys(EMAIL_KIND_LABEL) as EmailKind[]).filter((k) => k !== 'SECURITY').map((k) => <option key={k} value={k}>{t(EMAIL_KIND_LABEL[k])}</option>)}
        </select>
        <select className="select" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(0); }} aria-label={t('Trạng thái')}>
          <option value="">{t('Mọi trạng thái')}</option>
          <option value="SENT">{t('Đã gửi')}</option>
          <option value="FAILED">{t('Lỗi')}</option>
          <option value="SKIPPED">{t('Người nhận đã tắt')}</option>
        </select>
        <Button size="sm" variant="ghost" icon="refresh" onClick={() => void reload()}>{t('Tải lại')}</Button>
      </div>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingBlock rows={6} /> : !data || data.content.length === 0 ? (
        <Empty icon="mail" title={t('Chưa có email nào')} desc={t('Email tự động sẽ hiện ở đây sau lần chạy đầu tiên.')} />
      ) : (
        <>
          <div className="table-wrap">
            <Table caption={t('Nhật ký email tự động')}>
              <thead>
                <tr><th>{t('Thời gian')}</th><th>{t('Loại')}</th><th>{t('Người nhận')}</th><th>{t('Tiêu đề')}</th><th>{t('Trạng thái')}</th></tr>
              </thead>
              <tbody>
                {data.content.map((l) => (
                  <tr key={l.id}>
                    <td className="small nowrap">{fmtDateTime(l.sentAt ?? l.createdAt)}</td>
                    <td className="small">{t(EMAIL_KIND_LABEL[l.kind])}</td>
                    <td className="small">{l.toEmail}</td>
                    <td className="small"><div className="ellipsis email-log-subject" title={l.subject}>{l.subject}</div>
                      {l.error && <div className="tiny" style={{ color: 'var(--error)' }}>{l.error}</div>}</td>
                    <td>
                      <Badge tone={STATUS_TONE[l.status]}>{t(STATUS_LABEL[l.status])}</Badge>
                      {l.attempts > 1 && <div className="tiny faint">{t('{n} lần thử', { n: l.attempts })}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={setPage} />
        </>
      )}
    </Card>
  );
}
