/**
 * V53 · Trang "Hôm nay" của hội viên: check-in ở quầy, buổi tập và bài tập trong ngày theo giáo án,
 * gói tập, phòng tập đang đông hay vắng, kèm vài gợi ý tính theo luật đơn giản.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { TodayData, TodayExercise } from '../../api/checkinTypes';
import type { Schedule } from '../../api/types';
import { CrowdBars, CrowdChip, CrowdFoot, fmtHour } from '../../components/checkin';
import { Icon, type IconName } from '../../components/Icon';
import { Alert, Badge, Card, Empty, ErrorState, LoadingBlock, Meter, PageHead, Stat, StatusBadge } from '../../components/ui';
import { t, tn } from '../../i18n';
import { DAY_NAMES, exTitle, fmtDate, fmtTime, muscleColor, muscleLabel, parseDate, parseDateTime, scheduleStatus, subState } from '../../lib/format';
import { useAsync } from '../../lib/hooks';
import { SessionModal } from '../shared/Schedules';

function greeting(h: number) {
  if (h < 11) return 'Chào buổi sáng, {name}';
  if (h < 14) return 'Chào buổi trưa, {name}';
  if (h < 18) return 'Chào buổi chiều, {name}';
  return 'Chào buổi tối, {name}';
}

/** Ước lượng thời gian tập: mỗi hiệp ~40 giây + thời gian nghỉ (mặc định 60 giây), bài tính theo phút thì lấy số phút. */
export function estimateMinutes(list: TodayExercise[]) {
  const sec = list.reduce((acc, e) => acc + (e.durationMinutes ? e.durationMinutes * 60 : e.sets * (40 + (e.restSeconds ?? 60))), 0);
  return Math.max(5, Math.round(sec / 60 / 5) * 5);
}

function dose(e: TodayExercise) {
  const parts = [e.durationMinutes ? t('{n} phút', { n: e.durationMinutes }) : `${e.sets} × ${e.reps}`];
  if (e.weightKg) parts.push(`${e.weightKg} kg`);
  if (e.restSeconds) parts.push(t('nghỉ {n}s', { n: e.restSeconds }));
  return parts.join(' · ');
}

export default function Today() {
  const { data, error, loading, reload } = useAsync(() => api.get<TodayData>('/me/today'), []);
  const [open, setOpen] = useState<Schedule | null>(null);

  // Mức đông thay đổi theo giờ: tải lại mỗi phút khi trang đang mở
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) void reload(); }, 60_000);
    return () => clearInterval(id);
  }, [reload]);

  if (!data) {
    if (error) return <ErrorState message={error} onRetry={reload} />;
    return <div className="page"><PageHead title="Hôm nay" />{loading && <LoadingBlock rows={6} />}</div>;
  }

  const now = new Date();
  const firstName = data.fullName.trim().split(/\s+/).slice(-1)[0];
  const sub = data.subscription;
  const canCheckin = !!sub && (sub.state === 'ACTIVE' || sub.state === 'EXPIRING');
  const upcomingToday = data.sessions.filter((s) => s.status === 'SCHEDULED' && parseDateTime(s.endTime) > now);
  const toComplete = data.sessions.find((s) => s.status === 'SCHEDULED' && parseDateTime(s.startTime) <= now);
  const crowd = data.crowd;
  const totalDays = sub ? (parseDate(sub.endDate).getTime() - parseDate(sub.startDate).getTime()) / 86400000 + 1 : 1;

  const tips: { icon: IconName; text: string }[] = [];
  if (!data.checkin && upcomingToday.length > 0) {
    tips.push({ icon: 'clock', text: t('Có buổi {title} lúc {time} – nhớ quét mã check-in ở quầy khi tới.', { title: t(upcomingToday[0].title), time: fmtTime(upcomingToday[0].startTime) }) });
  }
  if (crowd.level === 'BUSY' && crowd.quietHour != null) {
    tips.push({ icon: 'users', text: t('Phòng đang đông. Nếu linh hoạt giờ giấc, đến lúc {h} sẽ thoải mái hơn.', { h: fmtHour(crowd.quietHour) }) });
  } else if (crowd.level === 'QUIET') {
    tips.push({ icon: 'zap', text: t('Phòng đang vắng – lúc thích hợp cho các bài cần máy hoặc khung tạ.') });
  }
  if (data.workout.length > 0) {
    tips.push({ icon: 'target', text: t('Giáo án hôm nay có {n} bài, mất khoảng {m} phút kể cả nghỉ giữa hiệp.', { n: data.workout.length, m: estimateMinutes(data.workout) }) });
  }
  tips.push({ icon: 'heart', text: t('Uống khoảng 400–600 ml nước trong 2 giờ trước khi tập và khởi động 5–10 phút.') });

  return (
    <div className="page">
      <div className="hero">
        <div className="today-hero" style={{ position: 'relative' }}>
          <div>
            <div className="today-date">{DAY_NAMES[data.dayOfWeek - 1]} · {fmtDate(data.date)}</div>
            <h2 className="mt-8">{t(greeting(now.getHours()), { name: firstName })}</h2>
            <p className="muted mt-8">
              {data.sessions.length > 0
                ? t('Hôm nay bạn có {n} buổi tập.', { n: data.sessions.length })
                : data.workout.length > 0
                  ? t('Hôm nay có {n} bài trong giáo án, tự tập lúc nào cũng được.', { n: data.workout.length })
                  : t('Hôm nay không có lịch tập. Nghỉ ngơi hợp lý cũng là một phần của tiến bộ.')}
            </p>
          </div>
          {data.checkin ? (
            <div className="today-checkin done">
              <div className="ic"><Icon name="checkCircle" size={22} /></div>
              <div>
                <b>{t('Đã check-in lúc {time}', { time: fmtTime(data.checkin.checkedInAt) })}</b>
                <div className="tiny muted">{t('Lượt thứ {n} trong tháng này', { n: data.visitsThisMonth })}</div>
              </div>
            </div>
          ) : (
            <div className="today-checkin">
              <div className="ic"><Icon name="camera" size={22} /></div>
              <div className="grow">
                <b>{t('Chưa check-in hôm nay')}</b>
                <div className="tiny muted">{t('Quét mã QR ở quầy lễ tân')}</div>
              </div>
              <Link to="/checkin" className={`btn btn-sm ${canCheckin ? 'btn-primary' : 'btn-secondary'}`}><span>{t('Check-in')}</span></Link>
            </div>
          )}
        </div>
      </div>

      {!canCheckin && (
        <div className="mt-16">
          <Alert kind="warning" action={<Link to="/me/packages" className="btn btn-sm btn-secondary"><span>{t('Xem gói tập')}</span></Link>}>
            {sub && sub.state === 'UPCOMING'
              ? t('Gói {plan} bắt đầu từ {date}, trước ngày đó chưa check-in được.', { plan: t(sub.planName), date: fmtDate(sub.startDate) })
              : t('Bạn cần gói tập còn hiệu lực để check-in tại quầy.')}
          </Alert>
        </div>
      )}
      {sub && sub.state === 'EXPIRING' && (
        <div className="mt-16">
          <Alert kind="warning" action={<Link to="/me/packages" className="btn btn-sm btn-secondary"><span>{t('Gia hạn gói')}</span></Link>}>
            {tn('Gói {plan} còn {days} ngày, hết hạn {date}.', { plan: <b>{t(sub.planName)}</b>, days: sub.daysLeft, date: fmtDate(sub.endDate) })}
          </Alert>
        </div>
      )}
      {toComplete && (
        <div className="mt-16">
          <Alert kind="success" action={<button type="button" className="btn btn-sm btn-primary" onClick={() => setOpen(toComplete)}><span>{t('Đánh dấu hoàn thành')}</span></button>}>
            {tn('Bạn đã tập xong {title}? Ghi lại để giữ chuỗi tuần tập.', { title: <b>{t(toComplete.title)}</b> })}
          </Alert>
        </div>
      )}

      <div className="grid grid-3 mt-24">
        <Stat icon="flame" label="Chuỗi tuần tập" value={data.streakWeeks} unit={t('tuần')} accent="#ff6b61" />
        <Stat icon="checkCircle" label="Buổi hoàn thành tháng này" value={data.completedThisMonth} accent="#3d97ff" />
        <Stat icon="activity" label="Lượt đến phòng tháng này" value={data.visitsThisMonth} accent="#8b7cff" />
      </div>

      <div className="grid grid-main mt-24">
        <div className="stack">
          <Card title="Buổi tập hôm nay" icon="calendar" actions={<Link to="/me/schedule" className="btn btn-sm btn-ghost">{t('Lịch đầy đủ')}</Link>}>
            {data.sessions.length === 0 ? (
              <Empty icon="calendar" title={t('Hôm nay chưa có buổi tập')}
                desc={data.nextSession
                  ? t('Buổi kế tiếp: {d} lúc {time}', { d: DAY_NAMES[(parseDateTime(data.nextSession.startTime).getDay() + 6) % 7], time: fmtTime(data.nextSession.startTime) })
                  : t('Lên lịch tập để không bỏ lỡ buổi nào.')}
                action={<Link to="/me/schedule" className="btn btn-sm btn-secondary">{t('Xem lịch tập')}</Link>} />
            ) : (
              <div className="stack-sm">
                {data.sessions.map((s) => (
                  <button key={s.id} type="button" className="btn btn-secondary" style={{ height: 'auto', padding: '12px 14px', justifyContent: 'flex-start', gap: 14 }} onClick={() => setOpen(s)}>
                    <div style={{ width: 56, textAlign: 'center' }} className="num">{fmtTime(s.startTime)}</div>
                    <div className="grow" style={{ textAlign: 'left' }}>
                      <div>{t(s.title)}</div>
                      <div className="tiny muted">{fmtTime(s.startTime)}–{fmtTime(s.endTime)} · {s.trainerName ?? t('Tự tập')}</div>
                    </div>
                    <StatusBadge map={scheduleStatus} value={s.status} />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card title="Bài tập hôm nay" icon="dumbbell" actions={data.plan ? <Link to="/me/plan" className="btn btn-sm btn-ghost">{t('Cả giáo án')}</Link> : undefined}>
            {!data.plan ? (
              <Empty icon="clipboard" title={t('Chưa có giáo án')} desc={t('Chọn giáo án mẫu hoặc tự soạn để mỗi ngày biết cần tập gì.')}
                action={<Link to="/me/plan" className="btn btn-sm btn-primary">{t('Chọn giáo án')}</Link>} />
            ) : data.workout.length === 0 ? (
              <Empty icon="moon" title={t('Hôm nay là ngày nghỉ theo giáo án')}
                desc={data.nextPlanDay ? t('Buổi tập kế tiếp theo giáo án: {d}', { d: DAY_NAMES[data.nextPlanDay - 1] }) : t('Giáo án chưa có bài nào.')} />
            ) : (
              <div className="stack-sm">
                <div className="row between small muted">
                  <span>{t(data.plan.name)}</span>
                  <span>{t('~{m} phút', { m: estimateMinutes(data.workout) })}</span>
                </div>
                {data.workout.map((e, i) => (
                  <Link key={e.itemId} to={`/exercises/${e.exerciseId}`} className="today-ex">
                    <span className="n" style={{ color: muscleColor[e.muscleGroup] }}>{i + 1}</span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="ellipsis" style={{ fontWeight: 700 }}>{exTitle(e)}</div>
                      <div className="tiny muted row" style={{ gap: 6 }}>
                        <span>{muscleLabel[e.muscleGroup]}</span>
                        {e.hasVideo && <Badge tone="blue"><Icon name="play" size={11} /> {t('Video')}</Badge>}
                      </div>
                    </div>
                    <span className="dose small">{dose(e)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card title="Phòng tập lúc này" icon="users" actions={<CrowdChip level={crowd.level} />}>
            <p className="small muted" style={{ margin: '0 0 6px' }}>
              {crowd.level === 'UNKNOWN' && (crowd.currentHour < crowd.openHour || crowd.currentHour > crowd.closeHour)
                ? t('Ngoài giờ mở cửa ({open} – {close}).', { open: fmtHour(crowd.openHour), close: fmtHour(crowd.closeHour + 1) })
                : t('Khoảng {n} người đã check-in trong 90 phút qua.', { n: crowd.inGymNow })}
            </p>
            <CrowdBars crowd={crowd} />
            <CrowdFoot crowd={crowd} />
          </Card>

          <Card title="Gợi ý cho hôm nay" icon="sparkle">
            {tips.slice(0, 3).map((tip) => (
              <div key={tip.text} className="today-tip"><Icon name={tip.icon} size={16} /><span>{tip.text}</span></div>
            ))}
          </Card>

          <Card title="Gói tập" icon="ticket" actions={<Link to="/me/packages" className="btn btn-sm btn-ghost">{t('Chi tiết')}</Link>}>
            {sub ? (
              <div className="stack-sm">
                <div className="row between"><b>{t(sub.planName)}</b><StatusBadge map={subState} value={sub.state} /></div>
                <Meter value={Math.max(0, totalDays - sub.daysLeft)} max={totalDays} color={sub.state === 'EXPIRING' ? 'var(--warning)' : undefined} />
                <div className="row between tiny muted"><span>{t('Còn {n} ngày', { n: sub.daysLeft })}</span><span>{t('Đến {date}', { date: fmtDate(sub.endDate) })}</span></div>
              </div>
            ) : (
              <Empty icon="ticket" title={t('Chưa có gói tập')} action={<Link to="/me/packages" className="btn btn-sm btn-primary">{t('Xem các gói tập')}</Link>} />
            )}
          </Card>
        </div>
      </div>

      {open && <SessionModal session={open} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); void reload(); }} />}
    </div>
  );
}
