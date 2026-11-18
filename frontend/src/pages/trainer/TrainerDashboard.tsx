import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Schedule, TrainerDashboard as Data } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { BarChart } from '../../components/charts';
import { DxRail, DxRing, dxCountdown } from '../../components/DashX';
import { Icon } from '../../components/Icon';
import { DayTimeline } from '../../components/motivation';
import { Badge, Card, CountUp, Empty, ErrorState, LoadingBlock, PageHead, Person, Table } from '../../components/ui';
import { QuickActions } from '../../components/Help';
import { fmtDate, fmtTime, parseDateTime } from '../../lib/format';
import { useAsync } from '../../lib/hooks';
import { displayPersonName } from '../../lib/names';
import { SessionModal } from '../shared/Schedules';
import { t } from '../../i18n';
import { PtOverview } from '../../components/PtOverview';

export default function TrainerDashboard() {
  const me = useMe();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(() => api.get<Data>('/dashboard/trainer'), []);
  const [open, setOpen] = useState<Schedule | null>(null);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <div className="page"><PageHead title="Tổng quan" /><LoadingBlock rows={6} /></div>;
  const now = new Date();
  const next = data.todaySessions.find((s) => s.status === 'SCHEDULED' && parseDateTime(s.endTime) > now);
  const assignedMembers = data.assignedMembers ?? [];
  const leftToday = data.todaySessions.filter((s) => s.status === 'SCHEDULED' && parseDateTime(s.endTime) > now).length;
  const weekTotal = data.completedThisWeek + data.missedThisWeek;

  return (
    <div className="page">
      {/* Hero v11: buổi kế tiếp là nhân vật chính (giờ cỡ lớn + đếm ngược); bên phải vòng tỉ lệ đi tập + 3 số nhỏ (thay hàng 4 ô số cũ) */}
      <div className="hero dx-hero">
        <div className="dx-hero-grid">
          <div className="dx-hero-main">
            <div className="row row-wrap" style={{ gap: 8 }}>
              <span className="chip on"><Icon name="target" size={14} /> {t('Huấn luyện viên')}</span>
              <span className="chip">{t('{n} buổi còn lại hôm nay', { n: leftToday })}</span>
            </div>
            <h2 className="dx-title">{t('Hôm nay của {name}', { name: displayPersonName(me.fullName).split(' ').slice(-1)[0] })}</h2>

            {next ? (
              <button type="button" className="dx-next is-xl" onClick={() => setOpen(next)}>
                <span className="dx-next-time num">{fmtTime(next.startTime)}</span>
                <span className="dx-next-body">
                  <span className="dx-pill is-hot">{dxCountdown(next.startTime, next.endTime)}</span>
                  <b className="ellipsis">{displayPersonName(next.memberName)}</b>
                  <span className="tiny muted ellipsis">{t(next.title)} · {fmtTime(next.startTime)}–{fmtTime(next.endTime)}</span>
                </span>
                <span className="btn btn-primary btn-sm"><Icon name="checkCircle" /><span>{t('Mở buổi tập')}</span></span>
              </button>
            ) : (
              <p className="muted">{t('Không còn buổi nào trong hôm nay.')}</p>
            )}

            <div className="row row-wrap" style={{ gap: 10 }}>
              <Link className={`btn ${next ? 'btn-secondary' : 'btn-primary'}`} to="/schedules?new=1"><Icon name="plus" /><span>{t('Xếp lịch')}</span></Link>
              <Link className="btn btn-secondary" to="/workout-plans/new"><Icon name="clipboard" /><span>{t('Soạn giáo án')}</span></Link>
            </div>
          </div>

          <div className="dx-hero-side">
            <DxRing value={data.completedThisWeek} max={Math.max(1, weekTotal)}
              label={data.completionRate == null ? '—' : `${Math.round(data.completionRate)}%`} sub={t('tỉ lệ đi tập')} />
            <div className="dx-minis">
              <Link to="/members"><span className="num"><CountUp value={data.memberCount} /></span><span>{t('Hội viên phụ trách')}</span></Link>
              <Link to="/schedules"><span className="num"><CountUp value={data.sessionsToday} /></span><span>{t('Buổi hôm nay')}</span></Link>
              <div><span className="num"><CountUp value={data.completedThisWeek} /><small>/{weekTotal}</small></span><span>{t('Hoàn thành tuần này')}</span></div>
            </div>
          </div>
        </div>
      </div>

      <QuickActions items={[
        { to: '/schedules?new=1', label: 'Xếp lịch', icon: 'calendar' },
        { to: '/workout-plans/new', label: 'Soạn giáo án', icon: 'clipboard' },
        { to: '/members', label: 'Học viên của tôi', icon: 'users' },
        { to: '/coach-stats', label: 'Thống kê của tôi', icon: 'chart' },
        { to: '/messages', label: 'Tin nhắn', icon: 'message' },
        { to: '/exercises?video=1', label: 'Bài tập có video', icon: 'play' },
        { to: '/schedules', label: 'Lịch tuần', icon: 'clock' },
      ]} />

      <div className="grid grid-main mt-24">
        <Card title="Lịch hôm nay" icon="clock" actions={<Link to="/schedules" className="link small">{t('Mở lịch tuần')}</Link>}>
          {data.todaySessions.length === 0 ? <Empty icon="calendar" title="Hôm nay không có buổi tập" desc="Tranh thủ soạn giáo án mới nhé!" /> : (
            <>
              <div className="dl-wrap"><DayTimeline sessions={data.todaySessions} onOpen={setOpen} /></div>
              <DxRail sessions={data.todaySessions} onOpen={setOpen} />
            </>
          )}
        </Card>
        <Card title="Tuần này" icon="activity"
          actions={<span className="tiny faint">{t('{n} buổi trong tuần', { n: data.sessionsThisWeek })} · {t('{n} buổi vắng', { n: data.missedThisWeek })}</span>}>
          <BarChart data={data.weekLoad} height={190} highlightLast={false} />
          <p className="tiny faint mt-8">{t('{n} giáo án đang áp dụng', { n: data.activePlans })}</p>
        </Card>
      </div>

      <Card className="mt-24" title="Hội viên sắp hết gói" icon="alert" flush>
        {data.expiringMembers.length === 0 ? <Empty icon="checkCircle" title="Không có hội viên nào sắp hết gói" /> : (
          <Table caption="Hội viên sắp hết gói">
            <thead><tr><th>Hội viên</th><th>Gói</th><th>Hết hạn</th><th className="right">Còn lại</th></tr></thead>
            <tbody>
              {data.expiringMembers.map((s) => (
                <tr key={s.id} className="clickable" onClick={() => navigate(`/members/${s.memberId}`)}>
                  <td><Person name={s.memberName} sub={s.memberCode} size="sm" /></td>
                  <td>{t(s.planName)}</td>
                  <td>{fmtDate(s.endDate)}</td>
                  <td className="right"><Badge tone="amber">{t('{n} ngày', { n: s.daysLeft })}</Badge></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Card className="mt-24" title="Hội viên phụ trách & tiến độ" icon="users" flush>
        {assignedMembers.length === 0 ? <Empty icon="users" title="Chưa có hội viên phụ trách" /> : (
          <Table caption="Hội viên phụ trách & tiến độ">
            <thead><tr><th>Hội viên</th><th className="right">Đi tập tuần này</th><th className="right">Chuỗi tuần</th><th>Buổi tiếp theo</th></tr></thead>
            <tbody>
              {assignedMembers.map((m) => (
                <tr key={m.memberId} className="clickable" onClick={() => navigate(`/members/${m.memberId}`)}>
                  <td><Person name={m.fullName} sub={m.code} size="sm" /></td>
                  <td className="right">
                    <Badge tone={m.attendanceThisWeek == null ? 'muted' : m.attendanceThisWeek >= 80 ? 'green' : m.attendanceThisWeek >= 50 ? 'amber' : 'red'}>
                      {m.attendanceThisWeek == null ? '—' : `${m.attendanceThisWeek}%`}
                    </Badge>
                  </td>
                  <td className="right">{t('{n} tuần', { n: m.streakWeeks })}</td>
                  <td>{m.nextSession ? <span className="nowrap">{fmtDate(m.nextSession.startTime)} · {fmtTime(m.nextSession.startTime)}</span> : <span className="muted">{t('Chưa có lịch')}</span>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <PtOverview title="Buổi PT của hội viên" />
      {open && <SessionModal session={open} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); void reload(); }} />}
    </div>
  );
}
