import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../api/client';
import type { CalorieHistory as History, CalorieWeek } from '../api/types';
import { t } from '../i18n';
import { DAYS, fmtDateShort, fmtNum, todayIso } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { Icon } from './Icon';
import { ErrorState, LoadingBlock, Segmented } from './ui';
import './calorie-history.css';

const RANGES = [8, 12, 26] as const;
type Range = (typeof RANGES)[number];

/** Lịch sử calo theo tuần và từng ngày, kèm số kg mỡ tương đương (ước tính thô 7.700 kcal ≈ 1 kg). */
export function CalorieHistory({ memberId }: { memberId: number }) {
  const [weeks, setWeeks] = useState<Range>(12);
  const [picked, setPicked] = useState<string | null>(null);
  const state = useAsync(() => api.get<History>(`/members/${memberId}/calories/history`, { weeks }), [memberId, weeks]);

  // Mặc định chọn tuần hiện tại (cuối danh sách)
  useEffect(() => { setPicked(null); }, [weeks]);

  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (!state.data) return <LoadingBlock rows={4} />;

  const h = state.data;
  const list = h.weeks;
  const current = list[list.length - 1];
  const sel: CalorieWeek = list.find((w) => w.weekStart === picked) ?? current;
  const max = Math.max(1, ...list.map((w) => w.calories));
  const best = list.reduce<CalorieWeek | null>((b, w) => (w.calories > (b?.calories ?? 0) ? w : b), null);
  const activeWeeks = list.filter((w) => w.sessions > 0).length;
  const perMonthKg = (h.avgWeeklyCalories * 4.345) / h.kcalPerKg;
  const dayMax = Math.max(1, ...sel.days.map((d) => d.calories));
  const today = todayIso();

  return (
    <section className="ch" aria-label={t('Lịch sử calo')}>
      <header className="ch-head">
        <div className="ch-title">
          <span className="ch-badge"><Icon name="flame" size={18} /></span>
          <div>
            <span className="ch-eyebrow">{t('Lịch sử calo')}</span>
            <span className="ch-range">{t('{n} tuần gần nhất · {a} tuần có tập', { n: list.length, a: activeWeeks })}</span>
          </div>
        </div>
        <Segmented value={String(weeks)} onChange={(v) => setWeeks(Number(v) as Range)}
          options={RANGES.map((r) => ({ value: String(r), label: t('{n} tuần', { n: r }) }))} />
      </header>

      <div className="ch-kpis">
        <div className="ch-kpi is-main">
          <span>{t('Tổng đã đốt')}</span>
          <b>{fmtNum(h.totalCalories)}<small>kcal</small></b>
          <em>{t('{n} buổi tập', { n: h.totalSessions })}</em>
        </div>
        <div className="ch-kpi">
          <span>{t('Trung bình mỗi tuần')}</span>
          <b>{fmtNum(h.avgWeeklyCalories)}<small>kcal</small></b>
          <em>{best && best.calories > 0 ? t('Cao nhất: tuần {d} · {n} kcal', { d: fmtDateShort(best.weekStart), n: fmtNum(best.calories) }) : t('Chưa có tuần nào')}</em>
        </div>
        <div className="ch-kpi is-fat">
          <span>{t('Tương đương mỡ')}</span>
          <b>≈ {fmtNum(h.totalFatKg, 2)}<small>kg</small></b>
          <em>{perMonthKg > 0 ? t('Giữ nhịp này ≈ {n} kg/tháng', { n: fmtNum(perMonthKg, 2) }) : t('Tập đều để thấy con số này tăng')}</em>
        </div>
      </div>

      <div className="ch-weeks" role="list" aria-label={t('Calo theo tuần')}>
        {list.map((w) => {
          const isSel = w.weekStart === sel.weekStart;
          const isNow = w === current;
          return (
            <button key={w.weekStart} type="button" role="listitem" className={`ch-week ${isSel ? 'sel' : ''} ${w.calories ? '' : 'zero'}`}
              onClick={() => setPicked(w.weekStart)} aria-pressed={isSel}
              title={t('Tuần {a} – {b}: {n} kcal · ≈ {kg} kg', { a: fmtDateShort(w.weekStart), b: fmtDateShort(w.weekEnd), n: fmtNum(w.calories), kg: fmtNum(w.fatKg, 2) })}>
              <span className="ch-week-n">{w.calories ? fmtNum(w.calories) : ''}</span>
              <span className="ch-week-bar"><i style={{ height: `${Math.max(w.calories ? 6 : 2, (w.calories / max) * 100)}%` }} /></span>
              <span className="ch-week-l">{isNow ? t('Tuần này') : fmtDateShort(w.weekStart)}</span>
            </button>
          );
        })}
      </div>

      <div className="ch-detail">
        <div className="ch-detail-head">
          <div>
            <b>{sel === current ? t('Tuần này') : t('Tuần {a} – {b}', { a: fmtDateShort(sel.weekStart), b: fmtDateShort(sel.weekEnd) })}</b>
            {sel === current && <span className="ch-range">{fmtDateShort(sel.weekStart)} – {fmtDateShort(sel.weekEnd)}</span>}
          </div>
          <div className="ch-chips">
            <span><Icon name="flame" size={13} />{fmtNum(sel.calories)} kcal</span>
            <span><Icon name="trophy" size={13} />{t('{n} buổi', { n: sel.sessions })}</span>
            <span><Icon name="clock" size={13} />{t('{n} phút', { n: fmtNum(sel.activeMinutes) })}</span>
            <span className="is-fat"><Icon name="trendDown" size={13} />≈ {fmtNum(sel.fatKg, 2)} kg</span>
          </div>
        </div>
        <div className="ch-days">
          {sel.days.map((d, i) => {
            const pct = d.calories / dayMax;
            const isToday = d.from === today;
            return (
              <div key={d.key} className={`ch-day ${d.calories ? 'on' : ''} ${isToday ? 'today' : ''}`}
                title={d.calories ? t('{d}: {n} kcal · {s} buổi', { d: d.label, n: d.calories, s: d.sessions }) : d.label}>
                <span className="ch-day-w">{DAYS[i]}</span>
                <span className="ch-day-ring" style={{ '--p': Math.round(pct * 100) } as CSSProperties}>
                  <b>{d.calories ? fmtNum(d.calories) : '–'}</b>
                </span>
                <span className="ch-day-d">{d.label}</span>
                {d.sessions > 0 && <span className="ch-day-s">{Array.from({ length: Math.min(3, d.sessions) }, (_, k) => <i key={k} />)}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <p className="ch-note"><Icon name="info" size={13} />{t(h.disclaimer)}</p>
    </section>
  );
}
