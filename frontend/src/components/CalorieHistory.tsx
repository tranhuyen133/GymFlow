import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { CalorieHistory as History, CalorieWeek } from '../api/types';
import { t } from '../i18n';
import { DAY_NAMES, fmtDateShort, fmtNum, todayIso } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { Icon } from './Icon';
import { ErrorState, LoadingBlock, Segmented } from './ui';
import './calorie-history.css';

const RANGES = [8, 12, 26] as const;
type Range = (typeof RANGES)[number];

/** % thay đổi so với tuần trước; null khi tuần trước không tập (không so được). */
function changePct(now: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((now - prev) / prev) * 100);
}

/**
 * Lịch sử calo: tóm tắt tuần đang xem (so với tuần trước), 3 chỉ số tổng, biểu đồ cột theo tuần có đường trung bình,
 * và bảng từng ngày trong tuần. Kg mỡ là ước tính thô 7.700 kcal ≈ 1 kg.
 */
export function CalorieHistory({ memberId }: { memberId: number }) {
  const [weeks, setWeeks] = useState<Range>(12);
  const [picked, setPicked] = useState<string | null>(null);
  const state = useAsync(() => api.get<History>(`/members/${memberId}/calories/history`, { weeks }), [memberId, weeks]);

  // Đổi khoảng thời gian thì quay về tuần hiện tại
  useEffect(() => { setPicked(null); }, [weeks]);

  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (!state.data) return <LoadingBlock rows={4} />;

  const h = state.data;
  const list = h.weeks;
  const current = list[list.length - 1];
  const selIdx = Math.max(0, list.findIndex((w) => w.weekStart === (picked ?? current.weekStart)));
  const sel: CalorieWeek = list[selIdx] ?? current;
  const prev: CalorieWeek | undefined = list[selIdx - 1];
  const isCurrent = sel === current;
  const max = Math.max(1, ...list.map((w) => w.calories));
  const avgPct = Math.min(100, (h.avgWeeklyCalories / max) * 100);
  const activeWeeks = list.filter((w) => w.sessions > 0).length;
  const perMonthKg = (h.avgWeeklyCalories * 4.345) / h.kcalPerKg;
  const dayMax = Math.max(1, ...sel.days.map((d) => d.calories));
  const today = todayIso();
  const pct = prev ? changePct(sel.calories, prev.calories) : null;
  const weekName = isCurrent ? t('Tuần này') : t('Tuần {a} – {b}', { a: fmtDateShort(sel.weekStart), b: fmtDateShort(sel.weekEnd) });

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

      {/* ---------- Tóm tắt tuần đang xem ---------- */}
      <div className="ch-hero">
        <div className="ch-hero-main">
          <span className="ch-hero-label">{weekName} · {fmtDateShort(sel.weekStart)} – {fmtDateShort(sel.weekEnd)}</span>
          <b className="ch-hero-num">{fmtNum(sel.calories)}<small>kcal</small></b>
          <span className="ch-hero-sub">
            {sel.sessions > 0
              ? t('{s} buổi tập · {m} phút · ≈ {kg} kg mỡ', { s: sel.sessions, m: fmtNum(sel.activeMinutes), kg: fmtNum(sel.fatKg, 2) })
              : t('Chưa có buổi tập nào hoàn thành trong tuần này')}
          </span>
        </div>
        <div className={`ch-compare ${pct == null ? '' : pct >= 0 ? 'up' : 'down'}`}>
          {pct == null ? (
            <span>{prev ? t('Tuần trước chưa tập – chưa so sánh được') : t('Chưa có tuần trước để so sánh')}</span>
          ) : (
            <>
              <b><Icon name={pct >= 0 ? 'trendUp' : 'trendDown'} size={15} />{pct > 0 ? '+' : ''}{pct}%</b>
              <span>{t('so với tuần trước ({n} kcal)', { n: fmtNum(prev!.calories) })}</span>
            </>
          )}
        </div>
      </div>

      {/* ---------- 3 chỉ số tổng ---------- */}
      <div className="ch-kpis">
        <div className="ch-kpi">
          <span>{t('Tổng {n} tuần', { n: list.length })}</span>
          <b>{fmtNum(h.totalCalories)}<small>kcal</small></b>
          <em>{t('{n} buổi tập', { n: h.totalSessions })}</em>
        </div>
        <div className="ch-kpi">
          <span>{t('Trung bình mỗi tuần')}</span>
          <b>{fmtNum(h.avgWeeklyCalories)}<small>kcal</small></b>
          <em>{t('tính cả tuần không tập')}</em>
        </div>
        <div className="ch-kpi is-fat">
          <span>{t('Mỡ tương đương đã đốt')}</span>
          <b>≈ {fmtNum(h.totalFatKg, 2)}<small>kg</small></b>
          <em>{perMonthKg > 0 ? t('Giữ nhịp này ≈ {n} kg/tháng', { n: fmtNum(perMonthKg, 2) }) : t('Tập đều để thấy con số này tăng')}</em>
        </div>
      </div>

      {/* ---------- Biểu đồ theo tuần ---------- */}
      <div className="ch-chart-head">
        <b>{t('Calo theo tuần')}</b>
        <span>{t('Bấm vào một cột để xem từng ngày')}</span>
      </div>
      <div className="ch-chart">
        {h.avgWeeklyCalories > 0 && (
          <div className="ch-avg" style={{ bottom: `${27 + avgPct * 1.2}px` }}>
            <span>{t('TB {n}', { n: fmtNum(h.avgWeeklyCalories) })}</span>
          </div>
        )}
        <div className="ch-weeks" role="list" aria-label={t('Calo theo tuần')}>
          {list.map((w) => {
            const isSel = w.weekStart === sel.weekStart;
            const isNow = w === current;
            return (
              <button key={w.weekStart} type="button" role="listitem" className={`ch-week ${isSel ? 'sel' : ''} ${w.calories ? '' : 'zero'}`}
                onClick={() => setPicked(w.weekStart)} aria-pressed={isSel}
                title={t('Tuần {a} – {b}: {n} kcal · ≈ {kg} kg', { a: fmtDateShort(w.weekStart), b: fmtDateShort(w.weekEnd), n: fmtNum(w.calories), kg: fmtNum(w.fatKg, 2) })}>
                <span className="ch-week-n">{w.calories ? fmtNum(w.calories) : '0'}</span>
                <span className="ch-week-bar"><i style={{ height: `${Math.max(w.calories ? 4 : 1.5, (w.calories / max) * 100)}%` }} /></span>
                <span className="ch-week-l">{isNow ? t('Tuần này') : fmtDateShort(w.weekStart)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Từng ngày trong tuần đang xem ---------- */}
      <div className="ch-detail">
        <div className="ch-detail-head">
          <b>{t('Từng ngày · {w}', { w: weekName })}</b>
          <span>{fmtNum(sel.calories)} kcal · {t('{n} buổi', { n: sel.sessions })}</span>
        </div>
        <ul className="ch-days">
          {sel.days.map((d, i) => {
            const isToday = d.from === today;
            const future = d.from > today;
            return (
              <li key={d.key} className={`ch-day ${d.calories ? 'on' : ''} ${isToday ? 'today' : ''} ${future ? 'future' : ''}`}>
                <span className="ch-day-name">
                  <b>{DAY_NAMES[i]}</b>
                  <small>{d.label}{isToday ? ` · ${t('Hôm nay')}` : ''}</small>
                </span>
                <span className="ch-day-bar"><i style={{ width: `${d.calories ? Math.max(3, (d.calories / dayMax) * 100) : 0}%` }} /></span>
                <span className="ch-day-val">
                  {d.calories > 0 ? (
                    <><b>{fmtNum(d.calories)} kcal</b><small>{t('{s} buổi · {m} phút', { s: d.sessions, m: fmtNum(d.activeMinutes) })}</small></>
                  ) : (
                    <small>{future ? t('Chưa tới') : d.sessions > 0 ? t('{n} buổi · chưa ước tính calo', { n: d.sessions }) : t('Nghỉ')}</small>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="ch-note"><Icon name="info" size={13} />{t(h.disclaimer)}</p>
    </section>
  );
}
