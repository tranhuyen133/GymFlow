/**
 * v11 · Khối hiển thị cho phần đầu 3 trang tổng quan (bản laptop): vòng tiến độ lớn, dải 7 ngày, đường doanh thu, dòng thời gian trong ngày.
 * Mọi class có tiền tố dx- để không đụng class sẵn có (vd. .bento của trang chủ công khai). Màu lấy từ biến CSS nên tự đổi theo sáng / tối.
 */
import { useId } from 'react';
import type { Schedule } from '../api/types';
import { t } from '../i18n';
import { DAYS, fmtTime, parseDateTime } from '../lib/format';
import { displayPersonName } from '../lib/names';
import { Icon } from './Icon';

/** Vòng tiến độ lớn kiểu đồng hồ thể thao: số ở giữa, nhãn nhỏ bên dưới. */
export function DxRing({ value, max, label, sub }: { value: number; max: number; label: string; sub?: string }) {
  const id = useId().replace(/:/g, '');
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return (
    <div className="dx-ring">
      <svg viewBox="0 0 100 100" aria-hidden>
        <defs>
          <linearGradient id={`dxr${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary-bright)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} className="dx-ring-track" />
        <circle cx="50" cy="50" r={r} className="dx-ring-arc" stroke={`url(#dxr${id})`}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ ['--dx-c' as string]: c }} />
      </svg>
      <div className="dx-ring-center">
        <b className="num">{label}</b>
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

/** Dải 7 ngày của tuần hiện tại: mỗi ngày một chấm theo trạng thái buổi tập. */
export function DxWeek({ sessions }: { sessions: Schedule[] }) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const titles: Record<string, string> = { done: t('Đã tập'), missed: t('Vắng'), planned: t('Có lịch'), rest: t('Nghỉ') };
  return (
    <div className="dx-week" role="list" aria-label={t('Tuần này')}>
      {DAYS.slice(0, 7).map((label, i) => {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        const list = sessions.filter((s) => s.status !== 'CANCELLED' && parseDateTime(s.startTime).toDateString() === d.toDateString());
        const state = list.some((s) => s.status === 'COMPLETED') ? 'done'
          : list.some((s) => s.status === 'MISSED') ? 'missed'
            : list.length ? 'planned' : 'rest';
        const today = d.toDateString() === now.toDateString();
        return (
          <div key={label} role="listitem" className={`dx-day is-${state}${today ? ' is-today' : ''}`} title={titles[state]}>
            <span className="dx-day-label">{label}</span>
            <span className="dx-day-dot">
              {state === 'done' ? <Icon name="check" size={14} /> : state === 'missed' ? <Icon name="x" size={13} /> : d.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Đường vùng nhỏ cho chuỗi số (doanh thu theo tháng). */
export function DxSpark({ values, labels }: { values: number[]; labels?: string[] }) {
  const id = useId().replace(/:/g, '');
  if (values.length < 2) return null;
  const w = 320;
  const h = 80;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 6 - ((v - min) / span) * (h - 16)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <div className="dx-spark">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={`dxs${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#dxs${id})`} />
        <path d={line} className="dx-spark-line" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="dx-spark-dot" style={{ left: `${(lx / w) * 100}%`, top: `${(ly / h) * 100}%` }} />
      {labels && <div className="dx-spark-labels">{labels.map((l, i) => <span key={`${l}${i}`}>{l}</span>)}</div>}
    </div>
  );
}

/** Dòng thời gian trong ngày (HLV): mỗi buổi một mốc, có vạch "Bây giờ" chen đúng chỗ. */
export function DxRail({ sessions, onOpen }: { sessions: Schedule[]; onOpen: (s: Schedule) => void }) {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const sorted = [...sessions].sort((a, b) => parseDateTime(a.startTime).getTime() - parseDateTime(b.startTime).getTime());
  const nowIdx = sorted.findIndex((s) => parseDateTime(s.startTime) > now);
  const nowLine = <li key="now" className="dx-rail-now" aria-label={t('Bây giờ')}><span>{t('Bây giờ')} · {hhmm}</span></li>;
  return (
    <ol className="dx-rail">
      {sorted.map((s, i) => {
        const start = parseDateTime(s.startTime);
        const end = parseDateTime(s.endTime);
        const live = s.status === 'SCHEDULED' && start <= now && now < end;
        const past = !live && (end <= now || s.status !== 'SCHEDULED');
        return [
          i === nowIdx ? nowLine : null,
          <li key={s.id} className={`dx-rail-item is-${s.status.toLowerCase()}${live ? ' is-live' : ''}${past ? ' is-past' : ''}`}>
            <button type="button" onClick={() => onOpen(s)}>
              <span className="dx-rail-time num">{fmtTime(s.startTime)}</span>
              <span className="dx-rail-body">
                <b className="ellipsis">{displayPersonName(s.memberName)}</b>
                <span className="tiny muted ellipsis">{t(s.title)} · {fmtTime(s.startTime)}–{fmtTime(s.endTime)}</span>
              </span>
              {live && <span className="dx-live">{t('Đang diễn ra')}</span>}
              {s.status === 'COMPLETED' && <span className="dx-ok"><Icon name="checkCircle" size={18} /></span>}
              {s.status === 'MISSED' && <span className="dx-miss"><Icon name="x" size={18} /></span>}
            </button>
          </li>,
        ];
      })}
      {nowIdx === -1 && sorted.length > 0 && nowLine}
    </ol>
  );
}

/** "Còn 25 phút" / "Đang diễn ra" / "Còn 2 giờ 10 phút" tính tới giờ bắt đầu. */
export function dxCountdown(startIso: string, endIso: string): string {
  const now = Date.now();
  const s = parseDateTime(startIso).getTime();
  const e = parseDateTime(endIso).getTime();
  if (now >= s && now < e) return t('Đang diễn ra');
  const m = Math.max(0, Math.round((s - now) / 60000));
  if (m < 60) return t('Còn {n} phút', { n: m });
  const h = Math.floor(m / 60);
  return m % 60 ? t('Còn {h} giờ {m} phút', { h, m: m % 60 }) : t('Còn {h} giờ', { h });
}
