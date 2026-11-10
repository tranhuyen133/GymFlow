import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [params] = useSearchParams();
  const showOnboardingParam = params.get('onboarding') === '1';

  const { data, error, loading, reload } = useAsync(() => api.get<Data>('/dashboard/member'), []);
  const progress = useAsync((): Promise<Progress | null> => (me.memberId ? api.get<Progress>(`/members/${me.memberId}/progress`) : Promise.resolve(null)), [me.memberId]);
  const [open, setOpen] = useState<Schedule | null>(null);
  const [dismissChecklist, setDismissChecklist] = useState(false);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <div className="page"><PageHead title="Trang chủ" /><LoadingBlock rows={6} /></div>;

  const sub = data.currentSubscription;
  const firstName = data.member.fullName.split(' ').slice(-1)[0];
  const totalDays = sub ? (parseDate(sub.endDate).getTime() - parseDate(sub.startDate).getTime()) / 86400000 + 1 : 1;
  const now = new Date();
  const toComplete = data.weekSessions.find((s) => s.status === 'SCHEDULED' && parseDateTime(s.startTime) <= now);

  // Điều kiện người mới: chưa có gói hoặc chưa có giáo án hoặc chưa có lịch tập
  const isBeginner = !sub || !data.currentPlan || data.weekSessions.length === 0;
  const showChecklist = (isBeginner || showOnboardingParam) && !dismissChecklist;

  const step1Done = !!sub && sub.state !== 'EXPIRED';
  const step2Done = !!data.currentPlan;
  const step3Done = data.weekSessions.length > 0 || !!data.nextSession;

  return (
    <div className="page">
      {/* Checklist 3 bước cho người mới (BƯỚC 4) */}
      {showChecklist && (
        <Card className="mb-20" flush>
          <div style={{ padding: '18px 22px' }}>
            <div className="row between row-wrap" style={{ gap: 12, marginBottom: 14 }}>
              <div>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <Icon name="sparkle" size={20} style={{ color: 'var(--primary-bright)' }} />
                  <h3 style={{ margin: 0, fontSize: 17 }}>{t('Khởi đầu cùng GymFlow (3 bước đơn giản)')}</h3>
                </div>
                <p className="tiny muted mt-4">
                  {t('Hoàn thiện 3 bước dưới đây để bắt đầu buổi tập đầu tiên tại phòng tập.')}
                </p>
              </div>
              {step1Done && step2Done && step3Done && (
                <Button size="sm" variant="ghost" onClick={() => setDismissChecklist(true)}>
                  {t('Đóng')}
                </Button>
              )}
            </div>

            <div className="grid grid-3" style={{ gap: 12 }}>
              {/* Bước 1: Gói tập */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: step1Done ? 'rgba(0, 178, 75, 0.08)' : 'var(--surface-2)',
                border: `1px solid ${step1Done ? 'rgba(0, 178, 75, 0.3)' : 'var(--hairline)'}`,
                display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div className="row between">
                  <span className="small bold">{t('1. Chọn gói tập')}</span>
                  {step1Done ? (
                    <Badge tone="green"><Icon name="checkCircle" size={13} /> {t('Đã kích hoạt')}</Badge>
                  ) : (
                    <Badge tone="amber">{t('Chưa hoàn thành')}</Badge>
                  )}
                </div>
                <p className="tiny muted" style={{ margin: 0, flex: 1 }}>
                  {step1Done
                    ? t('Gói: {name}', { name: t(sub.planName) })
                    : t('Chọn gói tự tập hoặc có HLV kèm và thanh toán tại quầy hoặc QR.')}
                </p>
                {!step1Done && (
                  <Link to="/me/packages" className="btn btn-sm btn-primary">
                    <span>{t('Đăng ký gói ngay')}</span>
                  </Link>
                )}
              </div>

              {/* Bước 2: Giáo án */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: step2Done ? 'rgba(0, 178, 75, 0.08)' : 'var(--surface-2)',
                border: `1px solid ${step2Done ? 'rgba(0, 178, 75, 0.3)' : 'var(--hairline)'}`,
                display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div className="row between">
                  <span className="small bold">{t('2. Chọn giáo án')}</span>
                  {step2Done ? (
                    <Badge tone="green"><Icon name="checkCircle" size={13} /> {t('Đã có giáo án')}</Badge>
                  ) : (
                    <Badge tone="amber">{t('Chưa hoàn thành')}</Badge>
                  )}
                </div>
                <p className="tiny muted" style={{ margin: 0, flex: 1 }}>
                  {step2Done
                    ? t('Giáo án: {name}', { name: t(data.currentPlan!.name) })
                    : t('Chọn một giáo án mẫu phù hợp mục tiêu hoặc tự soạn giáo án của bạn.')}
                </p>
                {!step2Done && (
                  <Link to="/me/plan" className="btn btn-sm btn-secondary">
                    <span>{t('Chọn giáo án')}</span>
                  </Link>
                )}
              </div>

              {/* Bước 3: Lịch tập */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: step3Done ? 'rgba(0, 178, 75, 0.08)' : 'var(--surface-2)',
                border: `1px solid ${step3Done ? 'rgba(0, 178, 75, 0.3)' : 'var(--hairline)'}`,
                display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div className="row between">
                  <span className="small bold">{t('3. Xem lịch tập')}</span>
                  {step3Done ? (
                    <Badge tone="green"><Icon name="checkCircle" size={13} /> {t('Đã lên lịch')}</Badge>
                  ) : (
                    <Badge tone="muted">{t('Chưa có lịch')}</Badge>
                  )}
                </div>
                <p className="tiny muted" style={{ margin: 0, flex: 1 }}>
                  {step3Done
                    ? (data.nextSession
                        ? t('Buổi tới: {d}', { d: fmtWeekday(data.nextSession.startTime) })
                        : t('{n} buổi trong tuần này', { n: data.weekSessions.length }))
                    : t('Sinh lịch tự động từ giáo án hoặc tự chọn khung giờ tập phù hợp.')}
                </p>
                {!step3Done && (
                  <Link to="/me/schedule" className="btn btn-sm btn-secondary">
                    <span>{t('Lên lịch tập')}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Hero Banner */}
      <div className="hero">
        <div className="row between row-wrap" style={{ position: 'relative', gap: 20 }}>
          <div>
            <div className="chip on"><Icon name="flame" size={14} /> {t('Chuỗi {n} tuần', { n: data.streakWeeks })}</div>
            <h2 className="mt-8">{t('Chào {name}, sẵn sàng tập chưa?', { name: firstName })}</h2>
            <p className="muted mt-8">
              {data.nextSession
                ? tn('Buổi tiếp theo: {time} · {title}', { time: <b style={{ color: 'var(--ink)' }}>{fmtWeekday(data.nextSession.startTime)} {t('lúc')} {fmtTime(data.nextSession.startTime)}</b>, title: t(data.nextSession.title) })
                : t('Bạn chưa có buổi tập sắp tới. Hãy lên lịch tập để duy trì chuỗi tuần nhé.')}
            </p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            {/* 1 hành động chính nổi bật */}
            {toComplete ? (
              <Button variant="primary" icon="checkCircle" onClick={() => setOpen(toComplete)}>
                {t('Hoàn thành buổi tập')}
              </Button>
            ) : (
              <Link to="/me/schedule" className="btn btn-primary">
                <Icon name="calendar" />
                <span>{data.nextSession ? t('Xem lịch tập') : t('+ Đặt lịch tập')}</span>
              </Link>
            )}
            <Link to="/me/plan" className="btn btn-secondary">
              <Icon name="clipboard" />
              <span>{t('Giáo án')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Thông báo buổi tập cần hoàn thành */}
      {toComplete && (
        <div className="mt-16">
          <Alert kind="success" action={<Button size="sm" variant="primary" onClick={() => setOpen(toComplete)}>{t('Đánh dấu hoàn thành')}</Button>}>
            {tn('Bạn đã tập xong {title} lúc {time}? Ghi lại để giữ chuỗi tuần tập.', { title: <b>{t(toComplete.title)}</b>, time: fmtTime(toComplete.startTime) })}
          </Alert>
        </div>
      )}

      {/* Cảnh báo gói sắp hết hạn */}
      {sub && (sub.state === 'EXPIRING' || sub.state === 'EXPIRED') && (
        <div className="mt-16">
          <Alert kind="warning" action={<Link to="/me/packages" className="btn btn-sm btn-secondary"><span>{t('Gia hạn gói')}</span></Link>}>
            {sub.state === 'EXPIRING'
              ? tn('Gói {plan} còn {days} ngày, hết hạn {date}. Gia hạn ngay để không gián đoạn tập luyện.', { plan: <b>{t(sub.planName)}</b>, days: sub.daysLeft, date: fmtDate(sub.endDate) })
              : t('Gói tập của bạn đã hết hạn ngày {date}.', { date: fmtDate(sub.endDate) })}
          </Alert>
        </div>
      )}

      {/* 4 Thẻ chỉ số nhanh */}
      <div className="grid grid-4 mt-24">
        <Stat icon="ticket" label="Gói hiện tại" value={sub ? <CountUp value={sub.daysLeft} /> : '—'} unit={sub ? t('ngày') : undefined}
          foot={sub ? <>{t(sub.planName)} · <StatusBadge map={subState} value={sub.state} /></> : t('Chưa đăng ký gói')} />
        <Stat icon="checkCircle" label="Buổi hoàn thành tháng này" value={<CountUp value={data.completedThisMonth} />} accent="#3d97ff" foot={t('{n} buổi trong tuần này', { n: data.weekSessions.length })} />
        <Stat icon="scale" label="Cân nặng gần nhất" value={data.latestWeight ? <CountUp value={data.latestWeight.weightKg} /> : '—'} unit={data.latestWeight ? 'kg' : undefined} accent="#8b7cff"
          foot={data.latestWeight ? t('Ngày {d}', { d: fmtDate(data.latestWeight.recordedDate) }) : t('Chưa có số liệu')} />
        <Stat icon="heart" label="BMI" value={data.bmi ?? '—'} accent="#ffb020" foot={data.bmiCategory ? t(data.bmiCategory) : t('Cần chiều cao & cân nặng')} />
      </div>

      {/* Vòng hoạt động & Huy hiệu */}
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

      {/* Lịch tập tuần này & Trạng thái gói */}
      <div className="grid grid-main mt-24">
        <Card title="Lịch tuần này" icon="calendar" actions={<Link to="/me/schedule" className="btn btn-sm btn-ghost">{t('Lịch đầy đủ')}</Link>}>
          {data.weekSessions.length === 0 ? (
            <Empty
              icon="calendar"
              title={t('Tuần này chưa có buổi tập')}
              desc={t('Lên lịch tập từ giáo án hoặc tự chọn giờ để không bỏ lỡ buổi nào.')}
              action={<Link to="/me/schedule" className="btn btn-sm btn-primary">{t('+ Lên lịch tập')}</Link>}
            />
          ) : (
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
                      <div>{t(s.title)}</div>
                      <div className="tiny muted">{fmtTime(s.startTime)}–{fmtTime(s.endTime)} · {s.trainerName ?? t('Tự tập')}</div>
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
              <div className="row between"><b style={{ fontSize: 18 }}>{t(sub.planName)}</b><StatusBadge map={subState} value={sub.state} /></div>
              <Meter value={Math.max(0, totalDays - sub.daysLeft)} max={totalDays} color={sub.state === 'EXPIRING' ? 'var(--warning)' : undefined} />
              <div className="row between small muted"><span>{fmtDate(sub.startDate)}</span><span>{fmtDate(sub.endDate)}</span></div>
              <div className="divider" />
              {data.currentPlan ? (
                <div className="stack-sm">
                  <div className="row between">
                    <span className="tiny faint">{t('Giáo án đang áp dụng')}</span>
                    <Link to="/me/plan" className="link tiny">{t('Xem bài tập')}</Link>
                  </div>
                  <b>{t(data.currentPlan.name)}</b>
                  <span className="small muted">{t('{days} ngày/tuần · {items} bài · HLV {trainer}', { days: data.currentPlan.trainingDays, items: data.currentPlan.itemCount, trainer: data.currentPlan.trainerName ?? '—' })}</span>
                  <Badge tone="green">{t('Đến {date}', { date: fmtDate(data.currentPlan.endDate) })}</Badge>
                </div>
              ) : (
                <Empty
                  icon="clipboard"
                  title={t('Chưa có giáo án')}
                  desc={t('Chọn giáo án mẫu hoặc tự soạn để lịch tập tự động đồng bộ.')}
                  action={<Link to="/me/plan" className="btn btn-sm btn-secondary">{t('Chọn giáo án')}</Link>}
                />
              )}
            </div>
          ) : (
            <Empty
              icon="ticket"
              title={t('Chưa có gói tập')}
              desc={t('Đăng ký gói tập ngay trên ứng dụng để bắt đầu hành trình.')}
              action={<Link to="/me/packages" className="btn btn-sm btn-primary">{t('Xem các gói tập')}</Link>}
            />
          )}
        </Card>
      </div>

      {open && <SessionModal session={open} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); void reload(); }} />}
    </div>
  );
}
