import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { MemberDashboard as Data, Progress, Schedule } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { Icon } from '../../components/Icon';
import { achievements, ActivityRings, BadgeShelf, weekRings } from '../../components/motivation';
import { Alert, Badge, Button, Card, CountUp, Empty, ErrorState, LoadingBlock, Meter, PageHead, Stat, StatusBadge } from '../../components/ui';
import { t, tn } from '../../i18n';
import { DAYS, fmtDate, fmtTime, fmtWeekday, parseDate, parseDateTime, scheduleStatus, subState } from '../../lib/format';
import { useAsync } from '../../lib/hooks';
import { SessionModal } from '../shared/Schedules';

export default function MemberDashboard() {
  const me = useMe();
  const { data, error, loading, reload } = useAsync(() => api.get<Data>('/dashboard/member'), []);
  // Tiến độ dùng cho huy hiệu; lỗi ở đây không chặn cả trang Tổng quan
  const progress = useAsync((): Promise<Progress | null> => (me.memberId ? api.get<Progress>(`/members/${me.memberId}/progress`) : Promise.resolve(null)), [me.memberId]);
  const [open, setOpen] = useState<Schedule | null>(null);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <div className="page"><PageHead title="Tổng quan" /><LoadingBlock rows={6} /></div>;

  const sub = data.currentSubscription;
  const firstName = data.member.fullName.split(' ').slice(-1)[0];
  const totalDays = sub ? (parseDate(sub.endDate).getTime() - parseDate(sub.startDate).getTime()) / 86400000 + 1 : 1;
  const now = new Date();
  const toComplete = data.weekSessions.find((s) => s.status === 'SCHEDULED' && parseDateTime(s.startTime) <= now);

  return (
    <div className="page">
      <div className="hero">
        <div className="row between row-wrap" style={{ position: 'relative', gap: 20 }}>
          <div>
            <div className="chip on"><Icon name="flame" size={14} /> {t('Chuỗi {n} tuần', { n: data.streakWeeks })}</div>
            <h2 className="mt-8">{t('Chào {name}, sẵn sàng tập chưa?', { name: firstName })}</h2>
            <p className="muted mt-8">
              {data.nextSession
                ? tn('Buổi tiếp theo: {time} · {title}', { time: <b style={{ color: 'var(--ink)' }}>{fmtWeekday(data.nextSession.startTime)} {t('lúc')} {fmtTime(data.nextSession.startTime)}</b>, title: data.nextSession.title })
                : t('Bạn chưa có buổi tập sắp tới. Liên hệ HLV để xếp lịch nhé.')}
            </p>
          </div>
          <div className="row">
            <Link to="/me/plan" className="btn btn-secondary"><Icon name="clipboard" /><span>{t('Giáo án')}</span></Link>
            <Link to="/me/progress" className="btn btn-primary"><Icon name="scale" /><span>{t('Ghi cân nặng')}</span></Link>
          </div>
        </div>
      </div>

      {toComplete && (
        <div className="mt-16">
          <Alert kind="success" action={<Button size="sm" variant="primary" onClick={() => setOpen(toComplete)}>{t('Đánh dấu hoàn thành')}</Button>}>
            {tn('Bạn đã tập xong {title} lúc {time}? Ghi lại để giữ chuỗi tuần tập.', { title: <b>{toComplete.title}</b>, time: fmtTime(toComplete.startTime) })}
          </Alert>
        </div>
      )}
      {sub && (sub.state === 'EXPIRING' || sub.state === 'EXPIRED') && (
        <div className="mt-16">
          <Alert kind="warning" action={<Link to="/me/packages" className="btn btn-sm btn-secondary"><span>{t('Xem gói')}</span></Link>}>
            {sub.state === 'EXPIRING'
              ? tn('Gói {plan} còn {days} ngày, hết hạn {date}. Gia hạn tại quầy để không gián đoạn.', { plan: <b>{sub.planName}</b>, days: sub.daysLeft, date: fmtDate(sub.endDate) })
              : t('Gói tập của bạn đã hết hạn ngày {date}.', { date: fmtDate(sub.endDate) })}
          </Alert>
        </div>
      )}

      <div className="grid grid-4 mt-24">
        <Stat icon="ticket" label="Gói hiện tại" value={sub ? <CountUp value={sub.daysLeft} /> : '—'} unit={sub ? t('ngày') : undefined}
          foot={sub ? <>{sub.planName} · <StatusBadge map={subState} value={sub.state} /></> : t('Chưa đăng ký gói')} />
        <Stat icon="checkCircle" label="Buổi hoàn thành tháng này" value={<CountUp value={data.completedThisMonth} />} accent="#3d97ff" foot={t('{n} buổi trong tuần này', { n: data.weekSessions.length })} />
        <Stat icon="scale" label="Cân nặng gần nhất" value={data.latestWeight ? <CountUp value={data.latestWeight.weightKg} /> : '—'} unit={data.latestWeight ? 'kg' : undefined} accent="#8b7cff"
          foot={data.latestWeight ? t('Ngày {d}', { d: fmtDate(data.latestWeight.recordedDate) }) : t('Chưa có số liệu')} />
        <Stat icon="heart" label="BMI" value={data.bmi ?? '—'} accent="#ffb020" foot={data.bmiCategory ? t(data.bmiCategory) : t('Cần chiều cao & cân nặng')} />
      </div>

      <div className="grid grid-main mt-24">
        <Card title="Vòng tuần này" icon="activity"
          actions={<span className="tiny faint">{t('Mục tiêu {n} phút/tuần theo WHO', { n: 150 })}</span>}>
          <ActivityRings rings={weekRings(data.weekSessions, data.streakWeeks)} />
        </Card>
        <Card title="Huy hiệu" icon="trophy" actions={<Link to="/me/progress" className="link small">{t('Xem tất cả')}</Link>}>
          {progress.data ? <BadgeShelf list={achievements(progress.data)} compact />
            : progress.error ? <p className="small muted">{t('Chưa tải được huy hiệu.')}</p>
              : <LoadingBlock rows={3} />}
        </Card>
      </div>

      <div className="grid grid-main mt-24">
        <Card title="Tuần này" icon="calendar" actions={<Link to="/me/schedule" className="link small">{t('Lịch đầy đủ')}</Link>}>
          {data.weekSessions.length === 0 ? <Empty icon="calendar" title={t('Tuần này chưa có buổi tập')} /> : (
            <div className="stack-sm">
              {data.weekSessions.map((s) => {
                const d = parseDateTime(s.startTime);
                return (
                  <button key={s.id} className="btn btn-secondary" style={{ height: 'auto', padding: '12px 14px', justifyContent: 'flex-start', gap: 14 }} onClick={() => setOpen(s)}>
                    <div style={{ width: 44, textAlign: 'center' }}>
                      <div className="tiny faint">{DAYS[(d.getDay() + 6) % 7]}</div>
                      <div className="num" style={{ fontSize: 20 }}>{d.getDate()}</div>
                    </div>
                    <div className="grow" style={{ textAlign: 'left' }}>
                      <div>{s.title}</div>
                      <div className="tiny muted">{fmtTime(s.startTime)}–{fmtTime(s.endTime)} · {s.trainerName ?? t('Tự tập')}</div>
                    </div>
                    <StatusBadge map={scheduleStatus} value={s.status} />
                  </button>
                );
              })}
            </div>
          )}
        </Card>
        <Card title="Gói tập" icon="ticket">
          {sub ? (
            <div className="stack">
              <div className="row between"><b style={{ fontSize: 18 }}>{sub.planName}</b><StatusBadge map={subState} value={sub.state} /></div>
              <Meter value={Math.max(0, totalDays - sub.daysLeft)} max={totalDays} color={sub.state === 'EXPIRING' ? 'var(--warning)' : undefined} />
              <div className="row between small muted"><span>{fmtDate(sub.startDate)}</span><span>{fmtDate(sub.endDate)}</span></div>
              <div className="divider" />
              {data.currentPlan ? (
                <div className="stack-sm">
                  <span className="tiny faint">{t('Giáo án đang áp dụng')}</span>
                  <b>{data.currentPlan.name}</b>
                  <span className="small muted">{t('{days} ngày/tuần · {items} bài · HLV {trainer}', { days: data.currentPlan.trainingDays, items: data.currentPlan.itemCount, trainer: data.currentPlan.trainerName ?? '—' })}</span>
                  <Badge tone="green">{t('Đến {date}', { date: fmtDate(data.currentPlan.endDate) })}</Badge>
                </div>
              ) : <span className="muted small">{t('Chưa có giáo án. HLV sẽ soạn cho bạn.')}</span>}
            </div>
          ) : <Empty icon="ticket" title={t('Chưa có gói tập')} desc={t('Đăng ký gói tại quầy lễ tân.')} />}
        </Card>
      </div>
      {open && <SessionModal session={open} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); void reload(); }} />}
    </div>
  );
}
