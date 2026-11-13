import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Member, Progress, Schedule, Subscription } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { MyAvatar } from '../../components/AvatarEditor';
import { LineChart } from '../../components/charts';
import { Icon, type IconName } from '../../components/Icon';
import { Card, Empty, ErrorState, LoadingBlock, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import { addDays, fmtDate, fmtDateShort, fmtNum, parseDate, parseDateTime, toIsoDate, toIsoDateTime } from '../../lib/format';
import { useAsync } from '../../lib/hooks';

// Backend cho xem lịch tối đa 93 ngày mỗi lần → tải theo từng đoạn 90 ngày từ ngày tham gia (giới hạn 3 năm gần nhất)
const WINDOW_DAYS = 90;
const MAX_WINDOWS = 12;
const SESSION_MILESTONES = [1, 10, 25, 50, 100, 200, 300, 500];

type Kind = 'join' | 'session' | 'weight' | 'plan' | 'streak';
interface Milestone { date: string; kind: Kind; title: string; detail?: string }
const KIND_ICON: Record<Kind, IconName> = { join: 'target', session: 'trophy', weight: 'scale', plan: 'ticket', streak: 'flame' };

async function loadCompleted(joinedAt: string): Promise<Schedule[]> {
  const end = new Date();
  let start = parseDate(joinedAt);
  const earliest = addDays(end, -WINDOW_DAYS * MAX_WINDOWS);
  if (start < earliest) start = earliest;
  const windows: [Date, Date][] = [];
  for (let s = start; s < end; s = addDays(s, WINDOW_DAYS)) windows.push([s, new Date(Math.min(addDays(s, WINDOW_DAYS).getTime(), end.getTime() + 60_000))]);
  const parts = await Promise.all(windows.map(([a, b]) => api.get<Schedule[]>('/schedules', { from: toIsoDateTime(a), to: toIsoDateTime(b) })));
  const seen = new Set<number>();
  return parts.flat()
    .filter((s) => s.status === 'COMPLETED' && !seen.has(s.id) && seen.add(s.id))
    .sort((a, b) => (a.log?.completedAt ?? a.startTime).localeCompare(b.log?.completedAt ?? b.startTime));
}

/** Số tuần liên tiếp dài nhất có ít nhất 1 buổi hoàn thành, kèm tuần kết thúc chuỗi. */
function longestStreak(sessions: Schedule[]): { weeks: number; endWeek: string | null } {
  const weeks = [...new Set(sessions.map((s) => {
    const d = parseDateTime(s.log?.completedAt ?? s.startTime);
    const monday = addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
    return toIsoDate(monday);
  }))].sort();
  let best = 0, run = 0, bestEnd: string | null = null, prev: Date | null = null;
  for (const w of weeks) {
    const d = parseDate(w);
    run = prev && Math.round((d.getTime() - prev.getTime()) / 86_400_000) === 7 ? run + 1 : 1;
    if (run > best) { best = run; bestEnd = w; }
    prev = d;
  }
  return { weeks: best, endWeek: bestEnd };
}

function buildMilestones(member: Member, progress: Progress, sessions: Schedule[], subs: Subscription[]): Milestone[] {
  const out: Milestone[] = [{ date: member.joinedAt, kind: 'join', title: t('Gia nhập GymFlow'), detail: member.code }];
  SESSION_MILESTONES.forEach((n) => {
    const s = sessions[n - 1];
    if (s) out.push({ date: (s.log?.completedAt ?? s.startTime).slice(0, 10), kind: 'session', title: n === 1 ? t('Buổi tập đầu tiên') : t('Hoàn thành {n} buổi tập', { n }), detail: t(s.title) });
  });
  const weights = [...progress.weights].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
  if (weights[0]) out.push({ date: weights[0].recordedDate, kind: 'weight', title: t('Ghi cân nặng lần đầu'), detail: `${fmtNum(weights[0].weightKg, 1)} kg` });
  subs.filter((s) => !s.cancelled).sort((a, b) => a.startDate.localeCompare(b.startDate)).forEach((s, i) => {
    if (parseDate(s.startDate) <= new Date()) out.push({ date: s.startDate, kind: 'plan', title: i === 0 ? t('Bắt đầu gói {name}', { name: t(s.planName) }) : t('Gia hạn gói {name}', { name: t(s.planName) }) });
  });
  const streak = longestStreak(sessions);
  if (streak.weeks >= 2 && streak.endWeek) out.push({ date: streak.endWeek, kind: 'streak', title: t('Chuỗi {n} tuần tập liên tiếp', { n: streak.weeks }), detail: t('Kỷ lục cá nhân') });
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export default function MyJourney({ embedded = false }: { embedded?: boolean } = {}) {
  const me = useMe();
  const data = useAsync(async () => {
    if (!me.memberId) return null;
    const [member, progress, subs] = await Promise.all([
      api.get<Member>('/members/me'),
      api.get<Progress>(`/members/${me.memberId}/progress`),
      api.get<Subscription[]>('/subscriptions/me'),
    ]);
    const sessions = await loadCompleted(member.joinedAt);
    return { member, progress, subs, sessions };
  }, [me.memberId]);

  const view = useMemo(() => {
    if (!data.data) return null;
    const { member, progress, sessions, subs } = data.data;
    const days = Math.max(1, Math.round((Date.now() - parseDate(member.joinedAt).getTime()) / 86_400_000) + 1);
    const weights = [...progress.weights].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
    // Theo tháng: số buổi hoàn thành trong 12 tháng gần nhất
    const months: { key: string; label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`, count: 0 });
    }
    sessions.forEach((s) => { const m = months.find((x) => x.key === (s.log?.completedAt ?? s.startTime).slice(0, 7)); if (m) m.count++; });
    return {
      days, weights, months, milestones: buildMilestones(member, progress, sessions, subs),
      streak: longestStreak(sessions), maxMonth: Math.max(1, ...months.map((m) => m.count)),
    };
  }, [data.data]);

  if (!me.memberId) return <div className={embedded ? 'embedded-view' : 'page'}><ErrorState message={t('Tài khoản chưa có hồ sơ hội viên')} /></div>;

  return (
    <div className={embedded ? 'embedded-view' : 'page'}>
      {!embedded && (
        <PageHead eyebrow={t('Tập luyện')} title={t('Hành trình của tôi')}
          desc={t('Bạn bắt đầu từ đâu, đã đi được bao xa. Mọi con số được tính từ buổi tập đã hoàn thành và cân nặng bạn đã ghi.')} />
      )}

      {data.error ? <ErrorState message={data.error} onRetry={data.reload} /> : !data.data || !view ? <LoadingBlock rows={6} /> : (() => {
        const { member, progress, sessions } = data.data;
        const first = view.weights[0];
        const last = view.weights[view.weights.length - 1];
        const change = first && last && first !== last ? last.weightKg - first.weightKg : null;
        return (
          <>
            <section className="journey-hero">
              <div className="journey-hero-bg" aria-hidden />
              <div className="journey-who">
                <MyAvatar size="lg" />
                <div style={{ minWidth: 0 }}>
                  <div className="eyebrow-sm">{t('Từ {d}', { d: fmtDate(member.joinedAt) })}</div>
                  <div className="journey-day">{t('Ngày thứ')} <b>{fmtNum(view.days)}</b></div>
                </div>
              </div>
              <div className="journey-stats">
                <div><span>{t('Buổi đã tập')}</span><b>{fmtNum(progress.totalSessions)}</b></div>
                <div><span>{t('Phút vận động')}</span><b>{fmtNum(progress.totalMinutes)}</b></div>
                <div><span>{t('Calo đã ghi')}</span><b>{fmtNum(progress.totalCalories)}</b></div>
                <div><span>{t('Chuỗi dài nhất')}</span><b>{view.streak.weeks} <small>{t('tuần')}</small></b></div>
              </div>
            </section>

            {sessions.length === 0 && view.weights.length === 0 ? (
              <Card className="mt-16">
                <Empty icon="target" title={t('Hành trình của bạn bắt đầu từ buổi tập đầu tiên')}
                  desc={t('Khi huấn luyện viên đánh dấu hoàn thành buổi tập hoặc bạn ghi cân nặng, các cột mốc sẽ xuất hiện tại đây.')}
                  action={<Link className="btn btn-primary" to="/me/schedule"><Icon name="calendar" /><span>{t('Xem lịch tập')}</span></Link>} />
              </Card>
            ) : (
              <div className="grid grid-main mt-16" style={{ alignItems: 'start' }}>
                <div className="stack" style={{ gap: 18 }}>
                  <Card title={t('Cân nặng: điểm xuất phát → hiện tại')} icon="scale">
                    {first ? (
                      <>
                        <div className="journey-compare">
                          <div><span>{t('Lần đầu')} · {fmtDate(first.recordedDate)}</span><b>{fmtNum(first.weightKg, 1)} kg</b></div>
                          <Icon name="arrowRight" className="faint" />
                          <div><span>{t('Gần nhất')} · {fmtDate(last.recordedDate)}</span><b>{fmtNum(last.weightKg, 1)} kg</b></div>
                          {change != null && <div className={`journey-delta ${change < 0 ? 'down' : change > 0 ? 'up' : ''}`}>{change > 0 ? '+' : ''}{fmtNum(change, 1)} kg</div>}
                        </div>
                        {view.weights.length > 1 && <LineChart points={view.weights.map((w) => ({ label: fmtDateShort(w.recordedDate), value: w.weightKg }))} format={(n) => `${fmtNum(n, 1)} kg`} height={200} />}
                        <p className="tiny faint mt-8">{t('Thay đổi cân nặng chỉ là một chỉ số; mục tiêu phù hợp nên được trao đổi với huấn luyện viên hoặc nhân viên y tế.')}</p>
                      </>
                    ) : <Empty icon="scale" title="Chưa ghi cân nặng" action={<Link className="btn btn-secondary" to="/profile?tab=progress"><span>{t('Ghi cân nặng')}</span></Link>} />}
                  </Card>
                  <Card title={t('Số buổi tập 12 tháng gần nhất')} icon="chart">
                    <div className="journey-months" role="img" aria-label={t('Biểu đồ số buổi tập theo tháng')}>
                      {view.months.map((m) => (
                        <div key={m.key} className="journey-month" title={t('{n} buổi', { n: m.count })}>
                          <span className="journey-month-n">{m.count || ''}</span>
                          <i style={{ height: `${(m.count / view.maxMonth) * 100}%` }} className={m.count ? '' : 'zero'} />
                          <span className="journey-month-l">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <Card title={t('Cột mốc')} icon="trophy">
                  <ol className="timeline">
                    {view.milestones.map((m, i) => (
                      <li key={`${m.kind}-${m.date}-${i}`} className={`tl-${m.kind}`}>
                        <span className="tl-dot"><Icon name={KIND_ICON[m.kind]} size={14} /></span>
                        <div>
                          <b>{m.title}</b>
                          <div className="tiny muted">{fmtDate(m.date)}{m.detail && ` · ${m.detail}`}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-16"><Link className="btn btn-ghost btn-sm" to="/profile?tab=progress"><Icon name="chart" /><span>{t('Xem chi tiết tiến độ')}</span></Link></div>
                </Card>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
