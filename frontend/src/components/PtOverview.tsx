/**
 * CHỦ FILE: Kiên (Nguyễn Thế Kiên)
 * V24 · Theo dõi buổi PT: đã dùng, đã xếp lịch, còn lại, hạn dùng buổi.
 * Quản lý thấy mọi hội viên đang có gói PT; HLV chỉ thấy hội viên mình phụ trách (backend lọc).
 */
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { PtOverviewRow } from '../api/types';
import { Badge, Card, Empty, ErrorState, LoadingBlock, Person, Table } from './ui';
import { fmtDate } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { t } from '../i18n';

export function PtOverview({ title = 'Theo dõi buổi PT' }: { title?: string }) {
  const { data, error, loading, reload } = useAsync(() => api.get<PtOverviewRow[]>('/subscriptions/pt-overview'), []);

  return (
    <Card className="mt-24" title={t(title)} icon="badge" flush>
      {error ? <div style={{ padding: 16 }}><ErrorState message={error} onRetry={reload} /></div>
        : loading || !data ? <div style={{ padding: 16 }}><LoadingBlock rows={3} /></div>
          : data.length === 0 ? <Empty icon="badge" title={t('Chưa có hội viên nào đang dùng gói PT')} />
            : (
              <Table caption={t(title)}>
                <thead>
                  <tr>
                    <th>{t('Hội viên')}</th><th>{t('Gói')}</th><th>{t('HLV phụ trách')}</th>
                    <th className="right">{t('Đã dùng')}</th><th className="right">{t('Đã xếp lịch')}</th>
                    <th className="right">{t('Còn lại')}</th><th>{t('Hạn dùng buổi PT')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.subscriptionId}>
                      <td><Link to={`/members/${r.memberId}`}><Person name={r.memberName} sub={r.memberCode} size="sm" /></Link></td>
                      <td>{t(r.planName)}</td>
                      <td>{r.trainerName ?? <span className="muted">{t('Chưa phân công')}</span>}</td>
                      <td className="right num">{r.ptSessionsUsed}</td>
                      <td className="right num">{r.ptSessionsScheduled}</td>
                      <td className="right">
                        {r.ptSessionsRemaining == null || r.ptSessionsTotal == null
                          ? <Badge tone="amber">{t('Chưa khai báo số buổi')}</Badge>
                          : <Badge tone={r.ptSessionsRemaining <= 2 ? 'amber' : 'green'}>{r.ptSessionsRemaining}/{r.ptSessionsTotal}</Badge>}
                      </td>
                      <td className="nowrap">{r.ptValidUntil ? fmtDate(r.ptValidUntil) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
    </Card>
  );
}
