/**
 * V55 · Thống kê HLV. HLV xem của chính mình; quản lý xem bảng so sánh mọi HLV rồi bấm vào từng người.
 * Tỉ lệ có mặt = buổi hoàn thành / (hoàn thành + vắng). Điểm = điểm hội viên tự chấm sau buổi (1–5 sao).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { TrainerStats } from '../../api/engagementTypes';
import { useAuth } from '../../auth/AuthContext';
import { HelpTip } from '../../components/Help';
import { CoachWeekList } from '../../components/TrainerBits';
import { Badge, Card, Empty, ErrorState, LoadingBlock, PageHead, Segmented, Stat, Table } from '../../components/ui';
import { t } from '../../i18n';
import { fmtDate } from '../../lib/format';
import { useAsync } from '../../lib/hooks';
import '../../components/coach-stats.css';

type Days = '7' | '30' | '90';

function rateTone(rate: number | null) {
  if (rate == null) return 'muted' as const;
  if (rate >= 85) return 'green' as const;
  if (rate >= 70) return 'amber' as const;
  return 'red' as const;
}

function StatsView({ s }: { s: TrainerStats }) {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid grid-4">
        <Stat icon="checkCircle" label={t('Buổi đã dạy')} value={s.completed} foot={t('{n} buổi trong lịch · {u} sắp tới hôm nay', { n: s.sessionsTotal, u: s.upcoming })} />
        <Stat icon="target" label={t('Tỉ lệ có mặt')} value={s.attendanceRate == null ? '—' : `${s.attendanceRate}%`} foot={t('{n} buổi hội viên vắng', { n: s.missed })} highlight={s.attendanceRate != null && s.attendanceRate >= 85} />
        <Stat icon="star" label={t('Điểm hội viên chấm')} value={s.avgRating == null ? '—' : s.avgRating.toFixed(1)} unit={s.avgRating == null ? undefined : '/5'} foot={t('{n} lượt chấm', { n: s.ratingCount })} />
        <Stat icon="users" label={t('Hội viên đang theo')} value={s.activeMembers} foot={t('{n} được giao · {m} đã tập cùng', { n: s.members, m: s.membersTrained })} />
      </div>

      <div className="grid grid-main" style={{ alignItems: 'start' }}>
        <Card title={t('Theo tuần')} icon="chart">
          {s.weeks.length === 0 ? <Empty title={t('Chưa có dữ liệu')} /> : (
            <div className="cw-wrap"><CoachWeekList weeks={s.weeks} />
            </div>
          )}
          <div className="row tiny muted mt-8" style={{ gap: 14 }}>
            <span><i className="coach-dot done" /> {t('Hoàn thành')}</span>
            <span><i className="coach-dot missed" /> {t('Hội viên vắng')}</span>
          </div>
        </Card>

        <Card title={t('Lâu không tới phòng ({n})', { n: s.inactiveMembers.length })} icon="alert">
          {s.inactiveMembers.length === 0 ? (
            <p className="small muted" style={{ margin: 0 }}>{t('Mọi hội viên đang có gói đều tới phòng trong 14 ngày qua.')}</p>
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              {s.inactiveMembers.slice(0, 12).map((m) => (
                <Link key={m.memberId} to={`/members/${m.memberId}`} className="coach-inactive">
                  <span className="grow"><b>{m.fullName}</b><span className="tiny muted">{m.code} · {m.lastVisit ? t('lần cuối {d}', { d: fmtDate(m.lastVisit) }) : t('chưa tới lần nào')}</span></span>
                  <Badge tone="amber">{t('{n} ngày', { n: m.daysAway ?? 0 })}</Badge>
                </Link>
              ))}
              <p className="tiny faint" style={{ margin: 0 }}>{t('Nhắn hỏi thăm hoặc xếp một buổi ngắn để hội viên quay lại.')}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MyStats({ days }: { days: Days }) {
  const { data, error, loading, reload } = useAsync(() => api.get<TrainerStats>('/coach-stats/me', { days }), [days]);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <LoadingBlock rows={6} />;
  return data ? <StatsView s={data} /> : null;
}

function AllStats({ days }: { days: Days }) {
  const { data, error, loading, reload } = useAsync(() => api.get<TrainerStats[]>('/coach-stats', { days }), [days]);
  const [open, setOpen] = useState<number | null>(null);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <LoadingBlock rows={6} />;
  if (!data || data.length === 0) return <Card><Empty icon="badge" title={t('Chưa có HLV đang hoạt động')} /></Card>;
  const selected = data.find((s) => s.trainerId === open) ?? null;
  return (
    <div className="stack" style={{ gap: 18 }}>
      <Card flush>
        <div className="table-wrap">
          <Table caption={t('So sánh huấn luyện viên')}>
            <thead>
              <tr>
                <th>{t('Huấn luyện viên')}</th><th>{t('Buổi đã dạy')}</th><th>{t('Tỉ lệ có mặt')}</th>
                <th>{t('Điểm hội viên chấm')}</th><th>{t('Hội viên đang theo')}</th><th>{t('Lâu không tới')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.trainerId} className={`clickable${open === s.trainerId ? ' selected' : ''}`} onClick={() => setOpen(open === s.trainerId ? null : s.trainerId)}>
                  <td><b>{s.fullName}</b></td>
                  <td>{s.completed}<span className="tiny faint"> / {s.sessionsTotal}</span></td>
                  <td><Badge tone={rateTone(s.attendanceRate)}>{s.attendanceRate == null ? '—' : `${s.attendanceRate}%`}</Badge></td>
                  <td>{s.avgRating == null ? '—' : `${s.avgRating.toFixed(1)} ★`}<span className="tiny faint"> ({s.ratingCount})</span></td>
                  <td>{s.activeMembers}</td>
                  <td>{s.inactiveMembers.length > 0 ? <Badge tone="amber">{s.inactiveMembers.length}</Badge> : <span className="faint">0</span>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
      {selected ? (
        <>
          <h3 style={{ margin: 0 }}>{selected.fullName}</h3>
          <StatsView s={selected} />
        </>
      ) : <p className="small muted" style={{ margin: 0 }}>{t('Bấm vào một HLV để xem chi tiết theo tuần và danh sách hội viên lâu không tới.')}</p>}
    </div>
  );
}

export default function CoachStats() {
  const { user } = useAuth();
  const [days, setDays] = useState<Days>('30');
  const isAdmin = user?.role === 'ADMIN';
  return (
    <div className="page">
      <PageHead eyebrow={t('Huấn luyện')} title={isAdmin ? t('Thống kê HLV') : t('Thống kê của tôi')}
        desc={isAdmin ? t('So sánh số buổi dạy, tỉ lệ hội viên có mặt và điểm hội viên chấm của các HLV.') : t('Số buổi đã dạy, tỉ lệ hội viên có mặt, điểm hội viên chấm và ai cần được hỏi thăm.')}
        actions={<Segmented<Days> value={days} onChange={setDays} options={[
          { value: '7', label: t('7 ngày') }, { value: '30', label: t('30 ngày') }, { value: '90', label: t('90 ngày') },
        ]} />} />
      <HelpTip id="coach-stats" steps={[
        'Tỉ lệ có mặt = buổi hoàn thành / (hoàn thành + vắng). Buổi quá giờ mà chưa đánh dấu hoàn thành sẽ tự thành “Vắng” lúc 00:05.',
        'Điểm là số sao hội viên tự chấm khi đánh dấu hoàn thành buổi tập.',
        '“Lâu không tới” là hội viên đang có gói nhưng 14 ngày chưa check-in hay tập buổi nào. HLV nhận danh sách này qua email báo cáo sáng lúc 07:00.',
      ]} />
      <div className="mt-16">{isAdmin ? <AllStats days={days} /> : <MyStats days={days} />}</div>
    </div>
  );
}
