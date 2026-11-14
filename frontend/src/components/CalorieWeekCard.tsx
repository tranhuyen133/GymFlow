import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { CalorieSummary } from '../api/types';
import { t } from '../i18n';
import { DAYS, fmtNum } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { Icon } from './Icon';
import { CountUp, LoadingBlock } from './ui';
import './calorie-week.css';

function localKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "2026-11-09" → thứ (T2…CN, đã dịch) + "09/11". */
function dayParts(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return { dow: '', date: iso };
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return { dow: DAYS[(d.getDay() + 6) % 7], date: `${m[3]}/${m[2]}` };
}

/** Thẻ calo tuần này ở Trang chủ hội viên: tổng kcal, so với tuần trước, 3 chỉ số nhanh, biểu đồ 7 ngày. */
export function CalorieWeekCard({ memberId }: { memberId: number }) {
  const state = useAsync(() => api.get<CalorieSummary>(`/members/${memberId}/calories/summary`, { period: 'WEEK' }), [memberId]);
  const more = (
    <Link to="/profile?tab=progress" className="cw-more">{t('Xem chi tiết')}<Icon name="chevronRight" size={14} /></Link>
  );
  const head = (range?: string) => (
    <div className="cw-head">
      <div className="cw-title">
        <span className="cw-badge"><Icon name="flame" size={18} /></span>
        <div>
          <span className="cw-eyebrow">{t('Calo đốt tuần này')}</span>
          {range && <span className="cw-range">{range}</span>}
        </div>
      </div>
      {more}
    </div>
  );

  if (state.error) {
    return (
      <section className="cw">
        {head()}
        <p className="small muted">{t('Chưa tải được số liệu calo.')} <button type="button" className="link small" onClick={state.reload}>{t('Thử lại')}</button></p>
      </section>
    );
  }
  if (!state.data) return <section className="cw">{head()}<LoadingBlock rows={3} /></section>;

  const s = state.data;
  const max = Math.max(1, ...s.buckets.map((b) => b.calories));
  const activeDays = s.buckets.filter((b) => b.calories > 0);
  const avg = activeDays.length ? Math.round(s.totalCalories / activeDays.length) : 0;
  const best = activeDays.length ? activeDays.reduce((a, b) => (b.calories > a.calories ? b : a)) : null;
  const change = s.previous.changePercent;
  const todayKey = localKey(new Date());
  const first = s.buckets[0] ? dayParts(s.buckets[0].from).date : '';
  const last = s.buckets.length ? dayParts(s.buckets[s.buckets.length - 1].from).date : '';

  return (
    <section className="cw">
      {head(first && last ? `${first} – ${last}` : undefined)}

      <div className="cw-body">
        <div className="cw-left">
          <div className="cw-kcal">
            <span className="cw-num"><CountUp value={s.totalCalories} /></span>
            <span className="cw-unit">kcal</span>
          </div>
          {change != null ? (
            <span className={`cw-delta ${change >= 0 ? 'up' : 'down'}`}>
              <Icon name={change >= 0 ? 'trendUp' : 'trendDown'} size={14} />
              {t('{n}% so với tuần trước', { n: Math.abs(Math.round(change)) })}
            </span>
          ) : (
            <span className="cw-delta">{t('Tuần đầu tiên có số liệu')}</span>
          )}

          <div className="cw-metrics">
            <div className="cw-metric">
              <Icon name="checkCircle" size={15} />
              <b>{s.totalSessions}</b>
              <span>{t('buổi tập')}</span>
            </div>
            <div className="cw-metric">
              <Icon name="clock" size={15} />
              <b>{fmtNum(Math.round(s.totalActiveMinutes))}</b>
              <span>{t('phút vận động')}</span>
            </div>
            <div className="cw-metric">
              <Icon name="activity" size={15} />
              <b>{s.avgCaloriesPerSession != null ? fmtNum(Math.round(s.avgCaloriesPerSession)) : '—'}</b>
              <span>{t('kcal / buổi')}</span>
            </div>
          </div>
        </div>

        <div className="cw-chart" role="img" aria-label={t('Biểu đồ calo theo ngày')}>
          {avg > 0 && (
            <div className="cw-avg" style={{ bottom: `calc(var(--cw-foot) + var(--cw-plot) * ${(avg / max).toFixed(4)})` }}>
              <span>{t('TB {n}', { n: avg })}</span>
            </div>
          )}
          {s.buckets.map((b) => {
            const p = dayParts(b.from);
            const isToday = b.from?.slice(0, 10) === todayKey;
            const isBest = best?.key === b.key && b.calories > 0;
            return (
              <div key={b.key} className={`cw-col ${isToday ? 'is-today' : ''} ${b.calories ? '' : 'is-zero'}`}
                title={`${p.dow} ${p.date}: ${b.calories} kcal · ${b.sessions} ${t('buổi')}`}>
                <span className="cw-val">{b.calories ? fmtNum(b.calories) : ''}</span>
                <div className="cw-track">
                  <i style={{ height: `${b.calories ? Math.max(6, (b.calories / max) * 100) : 0}%` }}>
                    {isBest && <em><Icon name="flame" size={11} /></em>}
                  </i>
                </div>
                <span className="cw-dow">{p.dow}</span>
                <span className="cw-date">{p.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cw-foot">
        {s.unestimatedSessions > 0 ? (
          <Link to="/profile?tab=progress" className="cw-note warn">
            <Icon name="alert" size={14} />{t('{n} buổi chưa tính được calo – ghi cân nặng để tính', { n: s.unestimatedSessions })}
          </Link>
        ) : s.totalSessions === 0 ? (
          <span className="cw-note"><Icon name="info" size={14} />{t('Hoàn thành buổi tập để hệ thống ước tính calo theo MET.')}</span>
        ) : best ? (
          <span className="cw-note"><Icon name="flame" size={14} />
            {t('Ngày đốt nhiều nhất: {day} · {n} kcal', { day: `${dayParts(best.from).dow} ${dayParts(best.from).date}`, n: fmtNum(best.calories) })}
          </span>
        ) : null}
        <span className="cw-src">{t('Ước tính theo MET · cân nặng gần nhất')}</span>
      </div>
    </section>
  );
}
