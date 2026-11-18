import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { MemberDashboard as Data, Progress, Schedule } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { CalorieWeekCard } from '../../components/CalorieWeekCard';
import { DxRing, DxWeek, dxCountdown } from '../../components/DashX';
import { Icon } from '../../components/Icon';
import { achievements, ActivityRings, BadgeShelf, weekRings } from '../../components/motivation';
import { Alert, Badge, Button, Card, CountUp, Empty, ErrorState, LoadingBlock, Meter, PageHead, Stat, StatusBadge } from '../../components/ui';
import { t, tn } from '../../i18n';
import { DAYS, fmtDate, fmtTime, fmtWeekday, parseDate, parseDateTime, scheduleStatus, subState } from '../../lib/format';
import { displayPersonName } from '../../lib/names';
import { useAsync } from '../../lib/hooks';
import { SessionModal } from '../shared/Schedules';

/** Một bước trong checklist người mới. v10: dùng class thay style viết cứng để đổi được theo nền sáng / tối và điện thoại. */
function OnbStep({ n, title, done, doneLabel, todoLabel, todoTone = 'amber', text, action }: {
  n: number; title: string; done: boolean; doneLabel: string; todoLabel: string; todoTone?: 'amber' | 'muted'; text: string; action?: ReactNode;
}) {
  return (
    <div className={`onb-step${done ? ' done' : ''}`}>
      <div className="onb-step-top">
        <span className="onb-num">{done ? <Icon name="check" size={14} /> : n}</span>
        <b>{title}</b>
        {done ? <Badge tone="green">{doneLabel}</Badge> : <Badge tone={todoTone}>{todoLabel}</Badge>}
      </div>
      <p>{text}</p>
      {!done && action}
    </div>
  );
}

export default function MemberDashboard() {
  const me = useMe();
  const [params] = useSearchParams();
  const showOnboardingParam = params.get('onboarding') === '1';

  const { data, error, loading, reload } = useAsync(() => api.get<Data>('/dashboard/member'), []);
  const progress = useAsync((): Promise<Progress | null> => (me.memberId ? api.get<Progress>(`/members/${me.memberId}/progress`) : Promise.resolve(null)), [me.memberId]);
  const [open, setOpen] = useState<Schedule | null>(null);
  const [dismissChecklist, setDismissChecklist] = useState(false);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <div className="page"><PageHead title="Trang chủ" /><LoadingBlock rows={6} /></div>;

  const sub = data.currentSubscription;
  const firstName = displayPersonName(data.member.fullName).split(' ').slice(-1)[0];
  const totalDays = sub ? (parseDate(sub.endDate).getTime() - parseDate(sub.startDate).getTime()) / 86400000 + 1 : 1;
  const now = new Date();
  const todayKey = now.toDateString();
  const toComplete = data.weekSessions.find((s) => s.status === 'SCHEDULED' && parseDateTime(s.startTime) <= now);
  const next = data.nextSession;
  const nextIsToday = !!next && parseDateTime(next.startTime).toDateString() === todayKey;
  // v11: vòng tuần = buổi đã hoàn thành / buổi có lịch (không tính buổi huỷ)
  const weekPlanned = data.weekSessions.filter((s) => s.status !== 'CANCELLED').length;
  const weekDone = data.weekSessions.filter((s) => s.status === 'COMPLETED').length;

  // Điều kiện người mới: chưa có gói hoặc chưa có giáo án hoặc chưa có lịch tập
  const isBeginner = !sub || !data.currentPlan || data.weekSessions.length === 0;
  const showChecklist = (isBeginner || showOnboardingParam) && !dismissChecklist;

  const step1Done = !!sub && sub.state !== 'EXPIRED';
  const step2Done = !!data.currentPlan;
  const step3Done = data.weekSessions.length > 0 || !!data.nextSession;
  const stepsDone = [step1Done, step2Done, step3Done].filter(Boolean).length;

  return (
    <div className="page">
      {/* Checklist 3 bước cho người mới */}
      {showChecklist && (
        <Card className="mb-20" flush>
          <div className="onb">
            <div className="onb-head">
              <div>
                <h3><Icon name="sparkle" size={20} />{t('Khởi đầu cùng GymFlow (3 bước đơn giản)')}</h3>
                <p className="tiny muted mt-4">{t('Hoàn thiện 3 bước dưới đây để bắt đầu buổi tập đầu tiên tại phòng tập.')}</p>
              </div>
              <div className="onb-progress">
                <Meter value={stepsDone} max={3} />
                <span className="small num">{stepsDone}/3</span>
                {stepsDone === 3 && <Button size="sm" variant="ghost" onClick={() => setDismissChecklist(true)}>{t('Đóng')}</Button>}
              </div>
            </div>

            <div className="onb-steps">
              <OnbStep n={1} title={t('1. Chọn gói tập')} done={step1Done} doneLabel={t('Đã kích hoạt')} todoLabel={t('Chưa hoàn thành')}
                text={step1Done ? t('Gói: {name}', { name: t(sub.planName) }) : t('Chọn gói tự tập hoặc có HLV kèm và thanh toán tại quầy hoặc QR.')}
                action={<Link to="/me/packages" className="btn btn-sm btn-primary"><span>{t('Đăng ký gói ngay')}</span></Link>} />
              <OnbStep n={2} title={t('2. Chọn giáo án')} done={step2Done} doneLabel={t('Đã có giáo án')} todoLabel={t('Chưa hoàn thành')}
                text={step2Done ? t('Giáo án: {name}', { name: t(data.currentPlan!.name) }) : t('Chọn một giáo án mẫu phù hợp mục tiêu hoặc tự soạn giáo án của bạn.')}
                action={<Link to="/me/plan" className="btn btn-sm btn-secondary"><span>{t('Chọn giáo án')}</span></Link>} />
              <OnbStep n={3} title={t('3. Xem lịch tập')} done={step3Done} doneLabel={t('Đã lên lịch')} todoLabel={t('Chưa có lịch')} todoTone="muted"
                text={step3Done
                  ? (data.nextSession ? t('Buổi tới: {d}', { d: fmtWeekday(data.nextSession.startTime) }) : t('{n} buổi trong tuần này', { n: data.weekSessions.length }))
                  : t('Sinh lịch tự động từ giáo án hoặc tự chọn khung giờ tập phù hợp.')}
                action={<Link to="/me/schedule" className="btn btn-sm btn-secondary"><span>{t('Lên lịch tập')}</span></Link>} />
            </div>
          </div>
        </Card>
      )}

      {/* Hero v11: trái = lời chào + thẻ buổi kế tiếp + nút; phải = vòng tuần + dải 7 ngày */}
      <div className="hero dx-hero">
        <div className="dx-hero-grid">
          <div className="dx-hero-main">
            <div className="row row-wrap" style={{ gap: 8 }}>
              <span className="chip on"><Icon name="flame" size={14} /> {t('Chuỗi {n} tuần', { n: data.streakWeeks })}</span>
              {sub && <span className="chip"><Icon name="ticket" size={14} /> {t('{n} ngày còn lại', { n: sub.daysLeft })}</span>}
            </div>
            <h2 className="dx-title">
              {t('Chào {name},', { name: firstName })} <span className="grad-text">{t('sẵn sàng tập chưa?')}</span>
            </h2>

            {next ? (
              <button type="button" className="dx-next" onClick={() => setOpen(next)}>
                <span className="dx-next-time num">{fmtTime(next.startTime)}</span>
                <span className="dx-next-body">
                  <span className={`dx-pill${nextIsToday ? ' is-hot' : ''}`}>{nextIsToday ? dxCountdown(next.startTime, next.endTime) : fmtWeekday(next.startTime)}</span>
                  <b className="ellipsis">{t(next.title)}</b>
                  <span className="tiny muted ellipsis">{fmtTime(next.startTime)}–{fmtTime(next.endTime)} · {next.trainerName ? displayPersonName(next.trainerName) : t('Tự tập')}</span>
                </span>
                <span className="dx-next-go"><Icon name="chevronRight" /></span>
              </button>
            ) : (
              <p className="muted">{t('Bạn chưa có buổi tập sắp tới. Hãy lên lịch tập để duy trì chuỗi tuần nhé.')}</p>
            )}

            <div className="row row-wrap" style={{ gap: 10 }}>
              {toComplete ? (
                <Button variant="primary" icon="checkCircle" onClick={() => setOpen(toComplete)}>{t('Hoàn thành buổi tập')}</Button>
              ) : (
                <Link to="/me/schedule" className="btn btn-primary">
                  <Icon name="calendar" />
                  <span>{data.nextSession ? t('Xem lịch tập') : t('+ Đặt lịch tập')}</span>
                </Link>
              )}
              <Link to="/me/plan" className="btn btn-secondary"><Icon name="clipboard" /><span>{t('Giáo án')}</span></Link>
            </div>
          </div>

          <div className="dx-hero-side">
            <DxRing value={weekDone} max={Math.max(1, weekPlanned)} label={`${weekDone}/${weekPlanned}`} sub={t('buổi tuần này')} />
            <DxWeek sessions={data.weekSessions} />
          </div>
        </div>
      </div>

      {toComplete && (
        <div className="mt-16">
          <Alert kind="success" action={<Button size="sm" variant="primary" onClick={() => setOpen(toComplete)}>{t('Đánh dấu hoàn thành')}</Button>}>
            {tn('Bạn đã tập xong {title} lúc {time}? Ghi lại để giữ chuỗi tuần tập.', { title: <b>{t(toComplete.title)}</b>, time: fmtTime(toComplete.startTime) })}
          </Alert>
        </div>
      )}

      {sub && (sub.state === 'EXPIRING' || sub.state === 'EXPIRED') && (
        <div className="mt-16">
          <Alert kind="warning" action={<Link to="/me/packages" className="btn btn-sm btn-secondary"><span>{t('Gia hạn gói')}</span></Link>}>
            {sub.state === 'EXPIRING'
              ? tn('Gói {plan} còn {days} ngày, hết hạn {date}. Gia hạn ngay để không gián đoạn tập luyện.', { plan: <b>{t(sub.planName)}</b>, days: sub.daysLeft, date: fmtDate(sub.endDate) })
              : t('Gói tập của bạn đã hết hạn ngày {date}.', { date: fmtDate(sub.endDate) })}
          </Alert>
        </div>
      )}

      <div className="grid grid-4 mt-24 dx-stats">
        <Stat icon="ticket" label="Gói hiện tại" value={sub ? <CountUp value={sub.daysLeft} /> : '—'} unit={sub ? t('ngày') : undefined}
          foot={sub ? <>{t(sub.planName)} · <StatusBadge map={subState} value={sub.state} /></> : t('Chưa đăng ký gói')} />
        <Stat icon="checkCircle" label="Buổi hoàn thành tháng này" value={<CountUp value={data.completedThisMonth} />} accent="#3d97ff" foot={t('{n} buổi trong tuần này', { n: data.weekSessions.length })} />
        <Stat icon="scale" label="Cân nặng gần nhất" value={data.latestWeight ? <CountUp value={data.latestWeight.weightKg} /> : '—'} unit={data.latestWeight ? 'kg' : undefined} accent="#8b7cff"
          foot={data.latestWeight ? t('Ngày {d}', { d: fmtDate(data.latestWeight.recordedDate) }) : t('Chưa có số liệu')} />
        <Stat icon="heart" label="BMI" value={data.bmi ?? '—'} accent="#ffb020" foot={data.bmiCategory ? t(data.bmiCategory) : t('Cần chiều cao & cân nặng')} />
      </div>

      {/* Lịch tuần & gói đứng trước vòng / huy hiệu: việc cần làm trước, thành tích sau */}
      <div className="grid grid-main mt-24">
        <Card title="Lịch tuần này" icon="calendar" actions={<Link to="/me/schedule" className="btn btn-sm btn-ghost">{t('Lịch đầy đủ')}</Link>}>
          {data.weekSessions.length === 0 ? (
            <Empty icon="calendar" title={t('Tuần này chưa có buổi tập')}
              desc={t('Lên lịch tập từ giáo án hoặc tự chọn giờ để không bỏ lỡ buổi nào.')}
              action={<Link to="/me/schedule" className="btn btn-sm btn-primary">{t('+ Lên lịch tập')}</Link>} />
          ) : (
            <div className="session-list">
              {data.weekSessions.map((s) => {
                const d = parseDateTime(s.startTime);
                return (
                  <button key={s.id} type="button" className={`session-row${d.toDateString() === todayKey ? ' is-today' : ''}`} onClick={() => setOpen(s)}>
                    <div className="session-date">
                      <div className="tiny faint">{DAYS[(d.getDay() + 6) % 7]}</div>
                      <span className="num">{d.getDate()}</span>
                    </div>
                    <div className="session-main">
                      <div>{t(s.title)}</div>
                      <div className="tiny muted">{fmtTime(s.startTime)}–{fmtTime(s.endTime)} · {s.trainerName ? displayPersonName(s.trainerName) : t('Tự tập')}</div>
                    </div>
                    <StatusBadge map={scheduleStatus} value={s.status} />
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Gói tập & Giáo án" icon="ticket" actions={<Link to="/me/packages" className="btn btn-sm btn-ghost">{t('Chi tiết gói')}</Link>}>
          {sub ? (
            <div className="stack">
              {/* v11: gói hiển thị như thẻ hội viên */}
              <Link to="/me/packages" className={`dx-pass${sub.state === 'EXPIRING' ? ' is-warn' : sub.state === 'EXPIRED' ? ' is-off' : ''}`}>
                <div className="dx-pass-top">
                  <span className="dx-pass-brand">GymFlow</span>
                  <StatusBadge map={subState} value={sub.state} />
                </div>
                <div className="dx-pass-days"><span className="num">{sub.daysLeft}</span><span>{t('ngày còn lại')}</span></div>
                <Meter value={Math.max(0, totalDays - sub.daysLeft)} max={totalDays} color={sub.state === 'EXPIRING' ? 'var(--warning)' : undefined} />
                <div className="dx-pass-foot">
                  <span className="ellipsis">{t(sub.planName)}</span>
                  <span className="num">{fmtDate(sub.startDate)} – {fmtDate(sub.endDate)}</span>
                </div>
              </Link>
              {data.currentPlan ? (
                <div className="stack-sm">
                  <div className="row between">
                    <span className="tiny faint">{t('Giáo án đang áp dụng')}</span>
                    <Link to="/me/plan" className="link tiny">{t('Xem bài tập')}</Link>
                  </div>
                  <b>{t(data.currentPlan.name)}</b>
                  <span className="small muted">{t('{days} ngày/tuần · {items} bài · HLV {trainer}', { days: data.currentPlan.trainingDays, items: data.currentPlan.itemCount, trainer: data.currentPlan.trainerName ? displayPersonName(data.currentPlan.trainerName) : '—' })}</span>
                  <Badge tone="green">{t('Đến {date}', { date: fmtDate(data.currentPlan.endDate) })}</Badge>
                </div>
              ) : (
                <Empty icon="clipboard" title={t('Chưa có giáo án')}
                  desc={t('Chọn giáo án mẫu hoặc tự soạn để lịch tập tự động đồng bộ.')}
                  action={<Link to="/me/plan" className="btn btn-sm btn-secondary">{t('Chọn giáo án')}</Link>} />
              )}
            </div>
          ) : (
            <Empty icon="ticket" title={t('Chưa có gói tập')}
              desc={t('Đăng ký gói tập ngay trên ứng dụng để bắt đầu hành trình.')}
              action={<Link to="/me/packages" className="btn btn-sm btn-primary">{t('Xem các gói tập')}</Link>} />
          )}
        </Card>
      </div>

      {me.memberId && <div className="mt-24"><CalorieWeekCard memberId={me.memberId} /></div>}

      <div className="grid grid-main mt-24">
        <Card title="Vòng tuần này" icon="activity"
          actions={<span className="tiny faint">{t('Mục tiêu {n} phút/tuần theo WHO', { n: 150 })}</span>}>
          <ActivityRings rings={weekRings(data.weekSessions, data.streakWeeks)} />
        </Card>
        <Card title="Huy hiệu đạt được" icon="trophy" actions={<Link to="/profile?tab=journey" className="link small">{t('Xem tất cả')}</Link>}>
          {progress.data ? <BadgeShelf list={achievements(progress.data)} compact />
            : progress.error ? <p className="small muted">{t('Chưa tải được huy hiệu.')}</p>
              : <LoadingBlock rows={3} />}
        </Card>
      </div>

      {open && <SessionModal session={open} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); void reload(); }} />}
    </div>
  );
}
