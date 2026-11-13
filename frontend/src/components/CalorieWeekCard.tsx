import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { CalorieSummary } from '../api/types';
import { t } from '../i18n';
import { fmtNum } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { Icon } from './Icon';
import { Card, CountUp, LoadingBlock } from './ui';
import './calorie-week.css';

/** Thẻ calo tuần này ở Trang chủ hội viên: tổng kcal, số buổi, thời gian, biểu đồ 7 ngày. */
export function CalorieWeekCard({ memberId }: { memberId: number }) {
  const state = useAsync(() => api.get<CalorieSummary>(`/members/${memberId}/calories/summary`, { period: 'WEEK' }), [memberId]);
  const more = <Link to="/profile?tab=progress" className="btn btn-sm btn-ghost">{t('Xem chi tiết')}</Link>;

  if (state.error) {
    return (
      <Card title="Calo đốt tuần này" icon="flame" actions={more}>
        <p className="small muted">{t('Chưa tải được số liệu calo.')} <button type="button" className="link small" onClick={state.reload}>{t('Thử lại')}</button></p>
      </Card>
    );
  }
  if (!state.data) return <Card title="Calo đốt tuần này" icon="flame"><LoadingBlock rows={3} /></Card>;

  const s = state.data;
  const max = Math.max(1, ...s.buckets.map((b) => b.calories));
  const change = s.previous.changePercent;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <Card title="Calo đốt tuần này" icon="flame" actions={more} className="cw-card">
      <div className="cw-body">
        <div className="cw-total">
          <div className="cw-kcal"><CountUp value={s.totalCalories} /><small>kcal</small></div>
          <div className="cw-meta small muted">
            <span><Icon name="checkCircle" size={14} />{t('{n} buổi', { n: s.totalSessions })}</span>
            <span><Icon name="clock" size={14} />{t('{n} phút', { n: fmtNum(s.totalActiveMinutes) })}</span>
            {s.avgCaloriesPerSession != null && <span><Icon name="chart" size={14} />{t('~{n} kcal/buổi', { n: fmtNum(s.avgCaloriesPerSession) })}</span>}
          </div>
          {change != null && (
            <span className={`cw-delta ${change >= 0 ? 'up' : 'down'}`}>
              {change >= 0 ? '▲' : '▼'} {t('{n}% so với tuần trước', { n: Math.abs(change) })}
            </span>
          )}
          {s.unestimatedSessions > 0 && (
            <Link to="/profile?tab=progress" className="cw-warn tiny">
              <Icon name="alert" size={13} />{t('{n} buổi chưa tính được calo – ghi cân nặng để tính', { n: s.unestimatedSessions })}
            </Link>
          )}
        </div>
        <div className="cw-chart" role="img" aria-label={t('Biểu đồ calo theo ngày')}>
          {s.buckets.map((b) => (
            <div key={b.key} className={`cw-bar ${b.from === todayKey ? 'is-today' : ''}`} title={`${b.label}: ${b.calories} kcal`}>
              <span className="cw-n">{b.calories || ''}</span>
              <i style={{ height: `${Math.max(4, (b.calories / max) * 100)}%` }} className={b.calories ? '' : 'zero'} />
              <span className="cw-l">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
      {s.totalSessions === 0 && <p className="tiny faint mt-8">{t('Hoàn thành buổi tập để hệ thống ước tính calo theo MET.')}</p>}
    </Card>
  );
}
