import { useState } from 'react';
import { api } from '../api/client';
import type { CalorieBackfillResult, CalorieSession, CalorieSummary } from '../api/types';
import { getLang, t } from '../i18n';
import { localizeText } from '../lib/planText';
import { addDays, fmtDate, fmtDateTime, fmtNum, parseDate, toIsoDate } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { Icon } from './Icon';
import { Alert, Badge, Button, Card, Empty, ErrorState, LoadingBlock, Modal, Segmented, Stat, Table } from './ui';

const INTENSITY_LABEL: Record<string, string> = { LIGHT: 'Nhẹ', MODERATE: 'Vừa', VIGOROUS: 'Cao' };

/** Khu vực thống kê calo tiêu hao theo MET cho hội viên. */
export function CalorieStats({ memberId }: { memberId: number }) {
  const [period, setPeriod] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [detail, setDetail] = useState<CalorieSession | null>(null);
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeError, setRecomputeError] = useState<string | null>(null);
  const state = useAsync(async () => {
    const summary = await api.get<CalorieSummary>(`/members/${memberId}/calories/summary`, { period });
    const to = toIsoDate(addDays(parseDate(summary.to), -1));
    const sessions = await api.get<CalorieSession[]>(`/members/${memberId}/calories/sessions`, { from: summary.from, to });
    return { summary, sessions };
  }, [memberId, period]);

  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (!state.data) return <LoadingBlock rows={4} />;

  const { summary, sessions } = state.data;
  const max = Math.max(1, ...summary.buckets.map((b) => b.calories));
  const filtered = dayFilter ? sessions.filter((s) => s.completedAt.slice(0, 10) === dayFilter) : sessions;
  const label = period === 'DAY' ? t('Calo ngày này') : period === 'WEEK' ? t('Calo tuần này') : t('Calo tháng này');

  const recompute = async () => {
    setRecomputing(true);
    setRecomputeError(null);
    try {
      const res = await api.post<CalorieBackfillResult>(`/members/${memberId}/calories/recompute`, {});
      if (res.failed > 0) setRecomputeError(t('Có {n} buổi chưa tính lại được. Vui lòng thử lại sau.', { n: res.failed }));
      await state.reload();
    } catch (e) {
      setRecomputeError(e instanceof Error ? e.message : t('Không tính lại được calo. Vui lòng thử lại.'));
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Card title={t('Thống kê calo tiêu hao')} icon="flame"
        actions={<Segmented value={period} onChange={(v) => { setPeriod(v); setDayFilter(null); setRecomputeError(null); }} options={[
          { value: 'DAY', label: t('Ngày') }, { value: 'WEEK', label: t('Tuần') }, { value: 'MONTH', label: t('Tháng') },
        ]} />}>
        {summary.unestimatedSessions > 0 && (
          <Alert kind="warning"
            action={<Button size="sm" loading={recomputing} onClick={recompute}>{t('Tính lại calo')}</Button>}>
            {t('{n} buổi chưa ước tính được vì thiếu cân nặng hoặc dữ liệu vận động. Hãy ghi cân nặng rồi bấm tính lại.', { n: summary.unestimatedSessions })}
          </Alert>
        )}
        {recomputeError && <Alert kind="error">{recomputeError}</Alert>}
        <div className="grid grid-4">
          <Stat icon="flame" label={label} value={fmtNum(summary.totalCalories)} unit="kcal" accent="#ff6b61"
            foot={summary.previous.changePercent == null ? t('Chưa có kỳ trước') : t('{n}% so với kỳ trước', { n: summary.previous.changePercent })} />
          <Stat icon="trophy" label={t('Số buổi hoàn thành')} value={fmtNum(summary.totalSessions)} unit={t('buổi')} />
          <Stat icon="clock" label={t('Thời gian vận động')} value={fmtNum(summary.totalActiveMinutes)} unit={t('phút')} />
          <Stat icon="chart" label={t('Trung bình mỗi buổi')} value={summary.avgCaloriesPerSession == null ? '—' : fmtNum(summary.avgCaloriesPerSession)} unit="kcal" />
        </div>

        <div className="mt-16">
          <div className="row between">
            <b className="small">{t('Calo theo ngày')}</b>
            {summary.topDay && <span className="tiny faint">{t('Nhiều nhất: {d} · {n} kcal', { d: fmtDate(summary.topDay.date), n: summary.topDay.calories })}</span>}
          </div>
          <div className="journey-months" role="img" aria-label={t('Biểu đồ calo theo ngày')}>
            {summary.buckets.map((b) => (
              <button key={b.key} type="button" className="journey-month" title={`${b.label}: ${b.calories} kcal`}
                onClick={() => setDayFilter(dayFilter === b.from ? null : b.from)}
                style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}>
                <span className="journey-month-n">{b.calories || ''}</span>
                <i style={{ height: `${(b.calories / max) * 100}%` }} className={b.calories ? '' : 'zero'} />
                <span className="journey-month-l">{b.label}</span>
              </button>
            ))}
          </div>
          {dayFilter && <button type="button" className="btn btn-ghost btn-sm mt-8" onClick={() => setDayFilter(null)}>
            <Icon name="x" size={14} />{t('Bỏ lọc ngày {d}', { d: fmtDate(dayFilter) })}
          </button>}
        </div>
      </Card>

      <Card title={t('Lịch sử buổi tập')} icon="scroll" flush>
        {filtered.length === 0 ? <Empty icon="calendar" title={t('Chưa có buổi tập nào trong kỳ này')}
          desc={t('Hoàn thành buổi tập để hệ thống ước tính calo theo MET.')} /> : (
          <Table caption={t('Lịch sử calo buổi tập')}>
            <thead><tr><th>{t('Ngày')}</th><th>{t('Buổi tập')}</th><th>{t('Thời gian')}</th><th>Calo</th><th>{t('Trạng thái')}</th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.logId} onClick={() => setDetail(s)} style={{ cursor: 'pointer' }}>
                  <td>{fmtDate(s.completedAt.slice(0, 10))}</td>
                  <td>{localizeText(s.titleEn, s.title)}</td>
                  <td className="num">{s.durationMinutes != null ? `${s.durationMinutes} ${t('phút')}` : '—'}</td>
                  <td className="num">{s.calories != null ? `${s.calories} kcal` : '—'}</td>
                  <td>{s.estimateStatus === 'OK'
                    ? <Badge tone="green">{s.estimateQuality === 'COARSE' ? t('Ước tính thô') : t('Theo MET')}</Badge>
                    : s.estimateStatus === 'LEGACY' ? <Badge tone="amber">{t('Nhập tay (cũ)')}</Badge>
                      : <Badge tone="amber">{t('Thiếu dữ liệu')}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <p className="tiny faint" style={{ padding: '10px 14px' }}>{summary.disclaimer}</p>
      </Card>

      {detail && (
        <Modal title={localizeText(detail.titleEn, detail.title)} onClose={() => setDetail(null)} size="medium">
          <div className="stack">
            <div className="grid grid-3 small">
              <div><div className="faint tiny">{t('Thời điểm')}</div><b>{fmtDateTime(detail.completedAt)}</b></div>
              <div><div className="faint tiny">{t('Calo ước tính')}</div><b>{detail.calories != null ? `${detail.calories} kcal` : '—'}</b></div>
              <div><div className="faint tiny">{t('Cân nặng dùng')}</div><b>{detail.weightKgUsed != null ? `${detail.weightKgUsed} kg` : '—'}</b></div>
              <div><div className="faint tiny">{t('Thời gian vận động')}</div><b>{detail.activeMinutes != null ? `${detail.activeMinutes} ${t('phút')}` : '—'}</b></div>
              <div><div className="faint tiny">{t('Cường độ')}</div><b>{detail.intensity ? t(INTENSITY_LABEL[detail.intensity]) : '—'}</b></div>
              <div><div className="faint tiny">{t('Công thức')}</div><b>{detail.formulaVersion ?? '—'}</b></div>
            </div>
            {detail.exercises.length > 0 && (
              <Table caption={t('Chi tiết bài tập')}>
                <thead><tr><th>{t('Bài tập')}</th><th>MET</th><th>{t('Hiệp')}</th><th>{t('Vận động')}</th><th>Calo</th></tr></thead>
                <tbody>
                  {detail.exercises.map((e, i) => (
                    <tr key={`${e.exerciseName}-${i}`}>
                      <td>{getLang() === 'en' && e.exerciseNameEn ? e.exerciseNameEn : e.exerciseName}</td>
                      <td className="num">{e.metValue}</td>
                      <td>{e.sets != null ? `${e.sets}${e.reps ? ` × ${e.reps}` : ''}` : '—'}</td>
                      <td className="num">{e.activeMinutes} {t('phút')}</td>
                      <td className="num">{e.calories != null ? `${e.calories} kcal` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            <p className="tiny faint">{summary.disclaimer}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
