import type { Progress, Schedule, WeekAttendance } from '../api/types';
import { t } from '../i18n';
import { fmtDateShort, fmtNum, fmtTime, parseDateTime } from '../lib/format';
import { GYM_CLOSE, GYM_OPEN, toMin } from '../lib/hours';
import { Icon, type IconName } from './Icon';
import './motivation.css';

/*
 * Động lực tập luyện cho hội viên (vòng hoạt động kiểu Apple Fitness, huy hiệu kiểu Nike Run Club)
 * và nhịp làm việc cho HLV (dải giờ trong ngày kiểu Strava). Chỉ dùng dữ liệu có sẵn từ API:
 * buổi tập, nhật ký buổi tập (phút, calo), chuỗi tuần, cân nặng, chuyên cần 8 tuần. Không lưu thêm gì ở backend.
 */

/** Mức khuyến nghị của WHO cho người lớn: tối thiểu 150 phút vận động vừa phải mỗi tuần. */
export const WHO_WEEKLY_MINUTES = 150;
const STREAK_STEPS = [2, 4, 8, 12, 26, 52];

/** Mốc chuỗi tuần tiếp theo cần đạt (2, 4, 8, 12, 26, 52 tuần). */
export const nextStreakGoal = (weeks: number) => STREAK_STEPS.find((s) => s > weeks) ?? weeks + 4;

// ---------- Vòng hoạt động ----------
export interface RingSpec { key: string; label: string; value: number; max: number; color: string; text: string }

const RADII = [52, 39, 26];

/** Ba vòng lồng nhau. Vòng đầy thì phát sáng; vượt mục tiêu vẫn dừng ở 100% (con số ghi rõ bên cạnh).
 *  celebrate: hiện dòng "Đã khép n vòng" (dùng cho vòng tuần của hội viên). */
export function ActivityRings({ rings, size = 168, celebrate = true }: { rings: RingSpec[]; size?: number; celebrate?: boolean }) {
  const done = rings.filter((r) => r.max > 0 && r.value >= r.max).length;
  return (
    <div className="act-rings">
      <svg viewBox="0 0 120 120" width={size} height={size} role="img"
        aria-label={rings.map((r) => `${r.label}: ${r.text}`).join(', ')}>
        {rings.slice(0, 3).map((r, i) => {
          const rad = RADII[i]; const c = 2 * Math.PI * rad;
          const pct = r.max > 0 ? Math.min(1, r.value / r.max) : 0;
          return (
            <g key={r.key} style={{ ['--c' as string]: r.color, ['--d' as string]: `${0.15 + i * 0.15}s` }} className={pct >= 1 ? 'full' : ''}>
              <circle className="ar-track" cx="60" cy="60" r={rad} />
              <circle className="ar-arc" cx="60" cy="60" r={rad} strokeDasharray={c}
                style={{ ['--off' as string]: `${c * (1 - pct)}`, ['--len' as string]: `${c}` }} transform="rotate(-90 60 60)" />
            </g>
          );
        })}
      </svg>
      <ul className="ar-legend">
        {rings.map((r) => (
          <li key={r.key} style={{ ['--c' as string]: r.color }}>
            <i />
            <span className="ar-label">{r.label}</span>
            <b className="num">{r.text}</b>
          </li>
        ))}
        {celebrate && done > 0 && <li className="ar-done"><Icon name="sparkle" size={14} />{done === rings.length ? t('Đủ cả {n} vòng tuần này!', { n: rings.length }) : t('Đã khép {n} vòng', { n: done })}</li>}
      </ul>
    </div>
  );
}

/** Vòng của hội viên trong tuần hiện tại, tính từ các buổi trong tuần (đã hoàn thành + nhật ký phút tập). */
export function weekRings(weekSessions: Schedule[], streakWeeks: number): RingSpec[] {
  const counted = weekSessions.filter((s) => s.status !== 'CANCELLED');
  const completed = counted.filter((s) => s.status === 'COMPLETED');
  const minutes = completed.reduce((a, s) => a + (s.log?.durationMinutes
    ?? Math.max(0, (parseDateTime(s.endTime).getTime() - parseDateTime(s.startTime).getTime()) / 60000)), 0);
  const goal = nextStreakGoal(streakWeeks);
  return [
    { key: 'sessions', label: t('Buổi tập'), value: completed.length, max: Math.max(1, counted.length), color: 'var(--ring-1)', text: `${completed.length}/${counted.length}` },
    { key: 'minutes', label: t('Phút vận động'), value: minutes, max: WHO_WEEKLY_MINUTES, color: 'var(--ring-2)', text: `${Math.round(minutes)}/${WHO_WEEKLY_MINUTES}` },
    { key: 'streak', label: t('Chuỗi tuần'), value: streakWeeks, max: goal, color: 'var(--ring-3)', text: `${streakWeeks}/${goal}` },
  ];
}

// ---------- Huy hiệu ----------
export interface Achievement {
  id: string; icon: IconName; title: string; desc: string; tier: 1 | 2 | 3 | 4;
  value: number; goal: number; earned: boolean;
}

/** Danh sách huy hiệu tính từ tiến độ thật của hội viên. Mỗi huy hiệu ghi rõ điều kiện đạt. */
export function achievements(p: Progress): Achievement[] {
  const sessions: [number, IconName, string, 1 | 2 | 3 | 4][] = [
    [1, 'play', 'Buổi đầu tiên', 1], [10, 'dumbbell', '10 buổi tập', 1], [25, 'flame', '25 buổi tập', 2],
    [50, 'trophy', '50 buổi tập', 3], [100, 'star', '100 buổi tập', 4],
  ];
  const streaks: [number, IconName, string, 1 | 2 | 3 | 4][] = [
    [2, 'zap', 'Giữ nhịp 2 tuần', 1], [4, 'flame', 'Bền bỉ 4 tuần', 2], [8, 'shield', 'Kỷ luật 8 tuần', 3], [12, 'trophy', 'Thép 12 tuần', 4],
  ];
  const out: Achievement[] = [
    ...sessions.map(([goal, icon, title, tier]) => ({
      id: `s${goal}`, icon, title: t(title), tier, value: p.totalSessions, goal, earned: p.totalSessions >= goal,
      desc: t('Hoàn thành {n} buổi tập', { n: goal }),
    })),
    ...streaks.map(([goal, icon, title, tier]) => ({
      id: `w${goal}`, icon, title: t(title), tier, value: p.streakWeeks, goal, earned: p.streakWeeks >= goal,
      desc: t('Tập đều {n} tuần liên tiếp', { n: goal }),
    })),
    { id: 'm600', icon: 'clock', title: t('10 giờ trên sàn tập'), tier: 2, value: p.totalMinutes, goal: 600, earned: p.totalMinutes >= 600, desc: t('Tổng 600 phút tập đã ghi') },
    { id: 'm3000', icon: 'clock', title: t('50 giờ trên sàn tập'), tier: 3, value: p.totalMinutes, goal: 3000, earned: p.totalMinutes >= 3000, desc: t('Tổng 3.000 phút tập đã ghi') },
    { id: 'k10000', icon: 'flame', title: t('10.000 kcal'), tier: 3, value: p.totalCalories, goal: 10000, earned: p.totalCalories >= 10000, desc: t('Tổng calo ghi sau các buổi tập') },
    { id: 'wt4', icon: 'scale', title: t('Theo dõi đều'), tier: 1, value: p.weights.length, goal: 4, earned: p.weights.length >= 4, desc: t('Ghi cân nặng ít nhất 4 lần') },
  ];
  // Chuyên cần chỉ tính khi đã có ít nhất 4 tuần được xếp lịch, tránh "80%" sau 1 buổi
  const weeksWithPlan = p.attendance.filter((w) => w.scheduled > 0).length;
  const rate = p.attendanceRate ?? 0;
  out.push({ id: 'att80', icon: 'checkCircle', title: t('Chuyên cần 80%'), tier: 2, value: weeksWithPlan >= 4 ? Math.round(rate) : 0, goal: 80,
    earned: weeksWithPlan >= 4 && rate >= 80, desc: t('Đi đủ 80% buổi đã xếp trong 8 tuần (cần ít nhất 4 tuần có lịch)') });
  return out;
}

/** Huy hiệu sắp đạt: chưa có, xếp theo % hoàn thành giảm dần. */
export const upcoming = (list: Achievement[], n = 2) =>
  list.filter((a) => !a.earned && a.value > 0).sort((a, b) => b.value / b.goal - a.value / a.goal).slice(0, n);

function Medal({ a }: { a: Achievement }) {
  return (
    <span className={`medal tier-${a.tier} ${a.earned ? 'earned' : 'locked'}`} aria-hidden>
      <Icon name={a.earned ? a.icon : 'lock'} size={20} />
    </span>
  );
}

/** Kệ huy hiệu. compact: chỉ huy hiệu cao nhất đã đạt + 2 huy hiệu sắp đạt (dùng ở Tổng quan hội viên). */
export function BadgeShelf({ list, compact }: { list: Achievement[]; compact?: boolean }) {
  const earned = list.filter((a) => a.earned);
  const shown = compact
    ? [...earned.sort((a, b) => b.tier - a.tier || b.goal - a.goal).slice(0, 1), ...upcoming(list)]
    : list;
  if (compact && shown.length === 0) {
    return <p className="small muted">{t('Hoàn thành buổi tập đầu tiên để mở huy hiệu đầu tiên.')}</p>;
  }
  return (
    <div className={`badge-shelf ${compact ? 'compact' : ''}`}>
      {!compact && <p className="tiny faint bs-count">{t('Đã mở {a}/{b} huy hiệu', { a: earned.length, b: list.length })}</p>}
      <ul>
        {shown.map((a) => {
          const pct = Math.min(100, Math.round((a.value / a.goal) * 100));
          return (
            <li key={a.id} className={`bs-item ${a.earned ? 'earned' : 'locked'}`} title={a.desc}>
              <Medal a={a} />
              <div className="bs-text">
                <b>{a.title}</b>
                <span className="tiny muted">{a.earned ? a.desc : t('{v}/{g} · còn {r}', { v: fmtNum(a.value), g: fmtNum(a.goal), r: fmtNum(Math.max(0, a.goal - a.value)) })}</span>
                {!a.earned && <span className="bs-meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></span>}
              </div>
              {a.earned && <span className="bs-check" aria-label={t('Đã đạt')}><Icon name="check" size={12} /></span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------- Nhịp 8 tuần (kiểu ô lịch đóng góp) ----------
export function WeekHeat({ weeks }: { weeks: WeekAttendance[] }) {
  if (weeks.length === 0) return <p className="small muted">{t('Chưa có lịch tập')}</p>;
  return (
    <div className="week-heat" role="list" aria-label={t('Nhịp tập 8 tuần')}>
      {weeks.map((w) => {
        const rate = w.scheduled > 0 ? w.completed / w.scheduled : 0;
        const lv = w.scheduled === 0 ? 0 : rate >= 1 ? 4 : rate >= 0.75 ? 3 : rate >= 0.5 ? 2 : w.completed > 0 ? 1 : 0;
        return (
          <div key={w.weekStart} role="listitem" className={`wh-cell lv-${lv}`}
            title={t('Tuần {d}: {c}/{s} buổi', { d: fmtDateShort(w.weekStart), c: w.completed, s: w.scheduled })}>
            <b className="num">{w.completed}</b>
            <span>{fmtDateShort(w.weekStart)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Dải giờ trong ngày của HLV ----------
/** Các buổi hôm nay đặt trên trục giờ mở cửa, có vạch "bây giờ". Bấm vào buổi để mở chi tiết. */
export function DayTimeline({ sessions, onOpen }: { sessions: Schedule[]; onOpen: (s: Schedule) => void }) {
  const open = toMin(GYM_OPEN); const close = toMin(GYM_CLOSE); const span = close - open;
  const pos = (d: Date) => Math.max(0, Math.min(100, ((d.getHours() * 60 + d.getMinutes() - open) / span) * 100));
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const ticks: number[] = [];
  for (let m = open; m <= close; m += 180) ticks.push(m);
  return (
    <div className="day-line">
      <div className="dl-track">
        {ticks.map((m) => (
          <span key={m} className="dl-tick" style={{ left: `${((m - open) / span) * 100}%` }}>{String(Math.floor(m / 60)).padStart(2, '0')}:00</span>
        ))}
        {sessions.map((s) => {
          const a = parseDateTime(s.startTime); const b = parseDateTime(s.endTime);
          const left = pos(a); const width = Math.max(2.5, pos(b) - left);
          return (
            <button key={s.id} type="button" className={`dl-block ${s.status}`} style={{ left: `${left}%`, width: `${width}%` }}
              onClick={() => onOpen(s)} title={`${fmtTime(s.startTime)}–${fmtTime(s.endTime)} · ${s.memberName} · ${s.title}`}>
              <span>{s.memberName.split(' ').slice(-1)[0]}</span>
            </button>
          );
        })}
        {nowMin >= open && nowMin <= close && <span className="dl-now" style={{ left: `${((nowMin - open) / span) * 100}%` }} aria-label={t('Bây giờ')} />}
      </div>
    </div>
  );
}
