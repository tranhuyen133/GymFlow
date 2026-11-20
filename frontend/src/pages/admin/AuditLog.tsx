/**
 * CHỦ FILE: Linh (Hồ Khánh Linh) · theo docs/OWNERS.md
 * TASK: SCRUM-220 · Màn Nhật ký có lọc
 * Quản trị nhật ký hệ thống: tìm kiếm, lọc theo hành động/ngày, phân trang và xuất CSV.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { AuditEntry, Page } from '../../api/types';
import { Badge, Button, Card, Empty, ErrorState, Input, LoadingBlock, PageHead, Pager, SearchInput, Select } from '../../components/ui';
import { downloadCsv } from '../../lib/csv';
import { actionLabel, fmtDateTime, fmtTime } from '../../lib/format';
import { useAsync, useDebounced } from '../../lib/hooks';
import { t } from '../../i18n';
import { Icon } from '../../components/Icon';
import { auditIcon, dayLabel, groupByDay, ResultCount } from '../../components/AdminBits';

export default function AuditLog() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [action, setAction] = useState(params.get('action') ?? '');
  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');
  const [page, setPage] = useState(0);
  const dq = useDebounced(q);
  const hasFilters = Boolean(q || action || from || to);
  useEffect(() => setPage(0), [dq, action, from, to]);
  const actions = useAsync(() => api.get<string[]>('/audit-logs/actions'), []);
  const { data, error, loading, reload } = useAsync(() => api.get<Page<AuditEntry>>('/audit-logs', { q: dq, action, from, to, page, size: 30 }), [dq, action, from, to, page]);

  const clearFilters = () => {
    setQ('');
    setAction('');
    setFrom('');
    setTo('');
    setParams({}, { replace: true });
  };

  return (
    <div className="page">
      <PageHead eyebrow="Hệ thống" title="Nhật ký hệ thống" desc="Ai làm gì, lúc nào, từ đâu. Nhật ký được ghi trong giao dịch riêng nên vẫn còn kể cả khi thao tác thất bại."
        actions={<Button icon="download" disabled={!data?.content.length} onClick={() => data && downloadCsv('nhat-ky', data.content, [
          { header: t('Thời gian'), value: (a) => a.createdAt }, { header: t('Người thực hiện'), value: (a) => a.actorEmail }, { header: t('Hành động'), value: (a) => actionLabel[a.action] ?? a.action },
          { header: t('Đối tượng'), value: (a) => `${a.targetType ?? ''} ${a.targetId ?? ''}`.trim() }, { header: t('Chi tiết'), value: (a) => a.detail }, { header: t('Kết quả'), value: (a) => t(a.success ? 'Thành công' : 'Thất bại') }, { header: 'IP', value: (a) => a.ip },
        ])}>Xuất trang này</Button>} />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm email, nội dung…" />
        <Select value={action} onChange={(e) => setAction(e.target.value)} aria-label="Hành động">
          <option value="">{t('Mọi hành động')}</option>
          {actions.data?.map((a) => <option key={a} value={a}>{actionLabel[a] ?? a}</option>)}
        </Select>
        <Input type="date" value={from} onChange={(e) => {
          const value = e.target.value;
          setFrom(value);
          if (to && value && value > to) setTo('');
        }} style={{ width: 160 }} aria-label="Từ ngày" />
        <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} style={{ width: 160 }} aria-label="Đến ngày" />
        <Button disabled={!hasFilters} onClick={clearFilters}>Xóa bộ lọc</Button>
        <ResultCount n={data?.totalElements} />
      </div>
      {actions.error && <div role="alert"><ErrorState message={actions.error} onRetry={actions.reload} /></div>}
      {loading && data && <p className="tiny muted" role="status">{t('Đang cập nhật nhật ký…')}</p>}
      <Card flush>
        {error ? <div style={{ padding: 20 }}><ErrorState message={error} onRetry={reload} /></div> : loading && !data ? <div style={{ padding: 20 }}><LoadingBlock /></div>
          : data && data.content.length === 0 ? <Empty icon="scroll" title="Không có bản ghi" /> : data && (
            <>
              {/* v13: nhật ký dạng dòng thời gian – gom theo ngày, biểu tượng theo loại thao tác, dòng thất bại tô đỏ */}
              <div className="al-feed">
                {groupByDay(data.content).map((g) => (
                  <section key={g.day} className="al-day" aria-label={dayLabel(g.day)}>
                    <h3 className="al-day-head"><span>{dayLabel(g.day)}</span><i>{t('{n} thao tác', { n: g.items.length })}</i></h3>
                    <ol className="al-list">
                      {g.items.map((a) => (
                        <li key={a.id} className={`al-item${a.success ? '' : ' is-fail'}`}>
                          <time className="al-time num" dateTime={a.createdAt} title={fmtDateTime(a.createdAt)}>{fmtTime(a.createdAt)}</time>
                          <span className="al-dot" aria-hidden><Icon name={auditIcon(a.action)} size={14} /></span>
                          <div className="al-body">
                            <div className="al-line">
                              <b>{actionLabel[a.action] ?? a.action}</b>
                              {a.targetType && <span className="al-target">{a.targetType} #{a.targetId}</span>}
                              {!a.success && <Badge tone="red">Thất bại</Badge>}
                            </div>
                            {a.detail && <p className="al-detail">{a.detail}</p>}
                            <div className="al-meta">
                              <span>{a.actorEmail ?? <span className="faint">hệ thống</span>}</span>
                              {a.ip && <span className="num">IP {a.ip}</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
              <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={setPage} />
            </>
          )}
      </Card>
    </div>
  );
}
