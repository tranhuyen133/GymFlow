/**
 * v15 · Mảnh giao diện cho khu huấn luyện viên (chỉ hiển thị, không gọi API).
 * - TrainerMemberGrid: thẻ học viên thay bảng ở trang Hội viên (chỉ khi HLV xem).
 * - TrainerPlanGrid: thẻ giáo án có thanh thời gian đã qua ở trang Giáo án (chỉ khi HLV xem).
 * - CoachWeekList: danh sách tuần thay biểu đồ cột ở Thống kê HLV (mỗi buổi 1 chấm; tuần nhiều buổi thì 1 vạch chia tỉ lệ).
 */
import { Link } from 'react-router-dom';
import type { Member, WorkoutPlanSummary } from '../api/types';
import type { WeekPoint } from '../api/engagementTypes';
import { Person, StatusBadge } from './ui';
import { fmtDate, fmtDateShort, memberStatus, parseDate, planStatus, relativeTime, subState } from '../lib/format';
import { localizePlanName } from '../lib/planText';
import { t } from '../i18n';

const DAY = 86_400_000;
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY);

export function TrainerMemberGrid({ items }: { items: Member[] }) {
  return (
    <ul className="tm-grid">
      {items.map((m) => {
        const s = m.currentPlanName ? m.subscriptionState : null;
        const tone = !s || s === 'EXPIRED' || s === 'CANCELLED' ? 'is-off' : s === 'EXPIRING' ? 'is-warn' : '';
        const days = (s === 'ACTIVE' || s === 'EXPIRING') && m.daysLeft != null ? t('Còn {n} ngày', { n: m.daysLeft }) : s ? subState[s][0] : null;
        return (
          <li key={m.id}>
            <Link to={`/members/${m.id}`} className={`tm-card ${tone}`}>
              <span className="tm-top">
                <Person name={m.fullName} sub={m.code} />
                <StatusBadge map={memberStatus} value={m.status} />
              </span>
              {m.goal && <span className="tm-goal">{m.goal}</span>}
              <span className="tm-plan">
                {m.currentPlanName
                  ? <><span className="tm-plan-name">{t(m.currentPlanName)}</span>{days && <span className="tm-days">{days}</span>}</>
                  : <span className="tm-plan-name is-none">{t('Chưa có gói')}</span>}
              </span>
              <span className="tm-foot">
                <span>{m.phone ?? m.email}</span>
                <span>{t('Tham gia {d}', { d: fmtDate(m.joinedAt) })}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function planTime(p: WorkoutPlanSummary) {
  const start = parseDate(p.startDate);
  const total = Math.max(1, dayDiff(parseDate(p.endDate), start) + 1);
  const passed = dayDiff(today(), start) + 1;
  if (p.status !== 'ACTIVE' || passed > total) return { pct: 100, done: true, label: <b>{t('Đã kết thúc')}</b> };
  if (passed <= 0) return { pct: 0, done: false, label: <b>{t('Chưa bắt đầu')}</b> };
  return {
    pct: Math.round((passed / total) * 100), done: false,
    label: <><b>{t('Tuần {a}/{b}', { a: Math.ceil(passed / 7), b: Math.ceil(total / 7) })}</b> · {t('còn {n} ngày', { n: total - passed })}</>,
  };
}

export function TrainerPlanGrid({ items }: { items: WorkoutPlanSummary[] }) {
  return (
    <ul className="tp-grid">
      {items.map((p) => {
        const time = planTime(p);
        return (
          <li key={p.id}>
            <Link to={`/workout-plans/${p.id}`} className={`tp-card${time.done ? ' is-done' : ''}`}>
              <span className="tp-head">
                <span>
                  <b className="tp-name">{localizePlanName(p)}</b>
                  <span className="tp-sub">{t('Tạo {d}', { d: relativeTime(p.createdAt) })}</span>
                </span>
                <StatusBadge map={planStatus} value={p.status} />
              </span>
              <Person name={p.memberName} size="sm" />
              <span className="tp-time">
                <span className="tp-track"><i style={{ width: `${time.pct}%` }} /></span>
                <span className="tp-time-row"><span>{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</span><span>{time.label}</span></span>
              </span>
              <span className="tp-foot">
                <span className="tp-tags">
                  <span className="tp-tag">{t('{n} ngày/tuần', { n: p.trainingDays })}</span>
                  <span className="tp-tag">{t('{n} bài', { n: p.itemCount })}</span>
                </span>
                <span className="tiny faint">{t('Mở giáo án →')}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function CoachWeekList({ weeks }: { weeks: WeekPoint[] }) {
  const now = today();
  return (
    <ul className="cw-list">
      {[...weeks].reverse().map((w) => {
        const total = w.completed + w.missed;
        const age = dayDiff(now, parseDate(w.weekStart));
        const state = total === 0 ? ['', t('Chưa có buổi')] : w.missed > 0 ? ['miss', t('Vắng {n}', { n: w.missed })] : ['ok', t('Đủ buổi')];
        return (
          <li key={w.weekStart} className="cw-row" title={t('Tuần {d}: {c} hoàn thành, {m} vắng', { d: fmtDateShort(w.weekStart), c: w.completed, m: w.missed })}>
            <span className="cw-date">{fmtDateShort(w.weekStart)}{age >= 0 && age < 7 && <small>{t('Tuần này')}</small>}</span>
            {total === 0 ? <span className="cw-split"><i className="none" /></span>
              : total <= 12 ? (
                <span className="cw-pips">
                  {Array.from({ length: w.completed }, (_, i) => <i key={`d${i}`} className="cw-pip done" />)}
                  {Array.from({ length: w.missed }, (_, i) => <i key={`m${i}`} className="cw-pip missed" />)}
                </span>
              ) : (
                <span className="cw-split"><i className="done" style={{ flex: w.completed }} /><i className="missed" style={{ flex: w.missed }} /></span>
              )}
            <span className="cw-frac">{w.completed}/{total}</span>
            <span className={`cw-state ${state[0]}`}>{state[1]}</span>
          </li>
        );
      })}
    </ul>
  );
}
