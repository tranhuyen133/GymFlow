import { useState } from 'react';
import { api } from '../api/client';
import type { Progress, Weight } from '../api/types';
import { t } from '../i18n';
import { fmtDate, fmtDateShort, fmtNum, todayIso } from '../lib/format';
import { errMsg, fieldErrs, useAsync } from '../lib/hooks';
import { checkBodyFat, checkRecordedDate, checkWeight, NOT_NUMBER, toNumber, useLiveErrors } from '../lib/validation';
import { LineChart, Ring, StackedBars } from './charts';
import { Icon } from './Icon';
import { useToast } from './Toast';
import { Button, Card, Confirm, Empty, ErrorState, Field, Input, LoadingBlock, Modal, Stat, Table, Textarea } from './ui';

const BMI_SCALE = [
  { to: 18.5, label: 'Thiếu cân', color: '#3d97ff' },
  { to: 23, label: 'Bình thường', color: '#00d95b' },
  { to: 25, label: 'Thừa cân', color: '#ffb020' },
  { to: 30, label: 'Béo phì I', color: '#ff8a3d' },
  { to: 40, label: 'Béo phì II', color: '#ff3b30' },
];

function BmiBar({ bmi }: { bmi: number }) {
  const min = 14; const max = 40;
  const pos = Math.max(0, Math.min(100, ((bmi - min) / (max - min)) * 100));
  let prev = min;
  return (
    <div>
      <div style={{ position: 'relative', display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden' }}>
        {BMI_SCALE.map((s) => { const w = ((s.to - prev) / (max - min)) * 100; prev = s.to; return <div key={s.label} style={{ width: `${w}%`, background: s.color, opacity: 0.85 }} />; })}
      </div>
      <div style={{ position: 'relative', height: 18 }}>
        <div style={{ position: 'absolute', left: `${pos}%`, transform: 'translateX(-50%)', top: 2, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '8px solid var(--ink)', transition: 'left 1s var(--ease-out)' }} />
      </div>
      <div className="row between tiny faint"><span>14</span><span>18.5</span><span>23</span><span>25</span><span>30</span><span>40</span></div>
    </div>
  );
}

/** Tiến độ của một hội viên: dùng ở trang "Tiến độ" của hội viên và trang chi tiết hội viên của HLV/quản lý. */
export function ProgressPanel({ memberId, canEdit = true }: { memberId: number; canEdit?: boolean }) {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.get<Progress>(`/members/${memberId}/progress`), [memberId]);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Weight | null>(null);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <LoadingBlock rows={5} />;
  const change = data.weightChange;
  const hasCm = data.weights.some((w) => w.waistCm != null || w.chestCm != null || w.armCm != null || w.thighCm != null);
  const waist = data.weights.filter((w) => w.waistCm != null);
  const weeks = data.attendance.map((w) => ({ label: fmtDateShort(w.weekStart), values: [w.completed, w.missed, Math.max(0, w.scheduled - w.completed - w.missed)] }));

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid grid-4">
        <Stat icon="scale" label={t('Cân nặng hiện tại')} value={fmtNum(data.currentWeight, 1)} unit={data.currentWeight != null ? 'kg' : undefined}
          foot={change == null ? t('Chưa có số liệu') : <span className={change <= 0 ? 'trend-up' : 'trend-down'}>{t('{diff} kg từ lần đầu', { diff: `${change > 0 ? '+' : ''}${fmtNum(change, 1)}` })}</span>} />
        <Stat icon="heart" label="BMI" value={fmtNum(data.bmi, 1)} accent="#ffb020" foot={data.bmiCategory ? t(data.bmiCategory) : (data.heightCm ? '—' : t('Cần cập nhật chiều cao'))} />
        <Stat icon="flame" label={t('Chuỗi tuần tập')} value={data.streakWeeks} unit={t('tuần')} accent="#ff6b61" foot={t('{n} buổi · {m} phút', { n: data.totalSessions, m: fmtNum(data.totalMinutes) })} />
        <Stat icon="zap" label={t('Calo đã đốt')} value={fmtNum(data.totalCalories)} unit="kcal" accent="#8b7cff" foot={data.avgRating ? t('Cảm nhận TB {n}/5', { n: data.avgRating }) : t('Chưa có đánh giá')} />
      </div>

      <div className="grid grid-main">
        <Card title={t('Cân nặng theo thời gian')} icon="trendDown" actions={canEdit && <Button size="sm" variant="primary" icon="plus" onClick={() => setAdding(true)}>{t('Ghi cân nặng')}</Button>}>
          {data.weights.length === 0 ? <Empty icon="scale" title={t('Chưa có số liệu cân nặng')} desc={t('Ghi lại mỗi tuần để thấy tiến độ.')} /> : (
            <LineChart points={data.weights.map((w) => ({ label: fmtDateShort(w.recordedDate), value: w.weightKg }))} format={(n) => `${n}`} />
          )}
          {data.weights.some((w) => w.bodyFat != null) && (
            <div className="mt-16">
              <div className="tiny faint" style={{ marginBottom: 6 }}>{t('Tỉ lệ mỡ (%)')}</div>
              <LineChart height={140} color="#ffb020" points={data.weights.filter((w) => w.bodyFat != null).map((w) => ({ label: fmtDateShort(w.recordedDate), value: w.bodyFat as number }))} />
            </div>
          )}
          {waist.length > 1 && (
            <div className="mt-16">
              <div className="tiny faint" style={{ marginBottom: 6 }}>{t('Vòng eo (cm)')}</div>
              <LineChart height={140} color="#3d97ff" points={waist.map((w) => ({ label: fmtDateShort(w.recordedDate), value: w.waistCm as number }))} />
            </div>
          )}
        </Card>
        <Card title={t('Chỉ số cơ thể')} icon="heart">
          <div className="row" style={{ justifyContent: 'center' }}>
            <Ring value={data.attendanceRate ?? 0} label={data.attendanceRate == null ? '—' : `${Math.round(data.attendanceRate)}%`} sub={t('chuyên cần 8 tuần')} size={140} />
          </div>
          <div className="mt-16">
            {data.bmi != null ? <BmiBar bmi={data.bmi} /> : <p className="muted small">{t('Cần chiều cao và cân nặng để tính BMI.')}</p>}
            <p className="tiny faint mt-8">{t('Phân loại BMI theo ngưỡng WHO cho người châu Á (bình thường 18,5 – 22,9).')}</p>
          </div>
          <dl className="kv mt-16 small">
            <dt>{t('Chiều cao')}</dt><dd>{data.heightCm ? `${data.heightCm} cm` : '—'}</dd>
            <dt>{t('Cân lần đầu')}</dt><dd>{data.startWeight ? `${data.startWeight} kg` : '—'}</dd>
            <dt>{t('% mỡ gần nhất')}</dt><dd>{data.bodyFat != null ? `${data.bodyFat}%` : '—'}</dd>
          </dl>
        </Card>
      </div>

      <Card title={t('Chuyên cần 8 tuần gần nhất')} icon="calendar">
        <StackedBars data={weeks} series={[{ name: t('Hoàn thành'), color: '#00d95b' }, { name: t('Vắng'), color: '#ff6b61' }, { name: t('Sắp tới'), color: '#3d97ff' }]} />
      </Card>

      {data.weights.length > 0 && (
        <Card title={t('Nhật ký cân nặng')} icon="scroll" flush>
          <Table caption={t('Nhật ký cân nặng')}>
            <thead><tr><th>{t('Ngày')}</th><th>{t('Cân nặng')}</th><th>{t('% mỡ')}</th>{hasCm && <th>{t('Eo / Ngực / Tay / Đùi (cm)')}</th>}<th>{t('Ghi chú')}</th>{canEdit && <th />}</tr></thead>
            <tbody>
              {[...data.weights].reverse().map((w) => (
                <tr key={w.id}>
                  <td>{fmtDate(w.recordedDate)}</td>
                  <td className="num">{w.weightKg} kg</td>
                  <td>{w.bodyFat != null ? `${w.bodyFat}%` : '—'}</td>
                  {hasCm && <td className="num">{[w.waistCm, w.chestCm, w.armCm, w.thighCm].map((v) => v ?? '–').join(' / ')}</td>}
                  <td className="muted">{w.note ?? ''}</td>
                  {canEdit && <td className="actions"><Button size="sm" variant="ghost" icon="trash" aria-label={t('Xoá')} onClick={() => setRemoving(w)} /></td>}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {adding && <WeightForm memberId={memberId} last={data.weights[data.weights.length - 1]} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void reload(); }} />}
      {removing && <Confirm danger title={t('Xoá bản ghi cân nặng?')} message={t('Bản ghi ngày {date} ({weight} kg) sẽ bị xoá.', { date: fmtDate(removing.recordedDate), weight: removing.weightKg })} confirmText={t('Xoá')}
        onClose={() => setRemoving(null)} onConfirm={async () => {
          try { await api.del(`/weights/${removing.id}`); toast.success(t('Đã xoá')); void reload(); } catch (e) { toast.error(errMsg(e)); throw e; }
        }} />}
    </div>
  );
}

// Số đo vòng (cm): khoảng chỉ để chặn lỗi gõ, khớp Dtos.WeightRequest và CHECK trong V7
const MEASURES: { key: 'waistCm' | 'chestCm' | 'armCm' | 'thighCm'; label: string; min: number; max: number }[] = [
  { key: 'waistCm', label: 'Vòng eo', min: 40, max: 200 },
  { key: 'chestCm', label: 'Vòng ngực', min: 50, max: 200 },
  { key: 'armCm', label: 'Vòng tay', min: 15, max: 80 },
  { key: 'thighCm', label: 'Vòng đùi', min: 25, max: 120 },
];
const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));

function WeightForm({ memberId, last, onClose, onSaved }: { memberId: number; last?: Weight; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [date, setDate] = useState(todayIso());
  const [weight, setWeight] = useState(last ? String(last.weightKg) : '');
  const [fat, setFat] = useState(last?.bodyFat != null ? String(last.bodyFat) : '');
  const [cm, setCm] = useState<Record<string, string>>({});
  const [showCm, setShowCm] = useState(!!last && MEASURES.some((m) => last[m.key] != null));
  const [note, setNote] = useState('');
  const live = useLiveErrors({ recordedDate: checkRecordedDate, weightKg: checkWeight, bodyFat: checkBodyFat }, { weightKg: NOT_NUMBER, bodyFat: NOT_NUMBER });
  const errors = live.errors;
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const ok = live.validateAll({ recordedDate: date, weightKg: weight, bodyFat: fat });
    const cmErr: Record<string, string> = {};
    const measures: Record<string, number | null> = {};
    MEASURES.forEach((m) => {
      const n = num(cm[m.key] ?? '');
      if (n != null && (Number.isNaN(n) || n < m.min || n > m.max)) cmErr[m.key] = t('{label} từ {a} đến {b} cm', { label: t(m.label), a: m.min, b: m.max });
      measures[m.key] = n;
    });
    if (Object.keys(cmErr).length) { live.setErrors((p) => ({ ...p, ...cmErr })); setShowCm(true); }
    if (!ok || Object.keys(cmErr).length) return;
    setBusy(true);
    try {
      await api.post(`/members/${memberId}/weights`, { recordedDate: date, weightKg: toNumber(weight), bodyFat: toNumber(fat), ...measures, note: note.trim() || null });
      toast.success(t('Đã lưu cân nặng'));
      onSaved();
    } catch (e) { toast.error(errMsg(e)); live.setErrors(fieldErrs(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={t('Ghi chỉ số cơ thể')} onClose={onClose} size="narrow" footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="primary" icon="check" loading={busy} disabled={Object.keys(errors).length > 0} onClick={submit}>{t('Lưu')}</Button>
    </>}>
      <div className="stack">
        <p className="small muted"><Icon name="info" size={14} style={{ display: 'inline', verticalAlign: -2 }} /> {t('Mỗi ngày một bản ghi, ghi lại cùng ngày sẽ cập nhật số cũ.')}</p>
        <Field label={t('Ngày')} error={errors.recordedDate} required>
          <Input type="date" max={todayIso()} value={date} invalid={!!errors.recordedDate}
            onChange={(e) => { setDate(e.target.value); live.blur('recordedDate', e.target.value); }} />
        </Field>
        <div className="form-grid">
          <Field htmlFor="weight-kg" label={t('Cân nặng (kg)')} error={errors.weightKg} required>
            <div className="input-suffix" id="weight-kg-wrap">
              <Input id="weight-kg" inputMode="decimal" autoComplete="off" value={weight} invalid={!!errors.weightKg} placeholder="VD: 65.5"
                onChange={(e) => { setWeight(e.target.value); live.change('weightKg', e.target.value); }} onBlur={(e) => live.blur('weightKg', e.target.value)} />
              <span className="unit">kg</span>
            </div>
          </Field>
          <Field htmlFor="weight-fat" label={t('% mỡ cơ thể')} error={errors.bodyFat} hint={t('Không bắt buộc')}>
            <div className="input-suffix" id="weight-fat-wrap">
              <Input id="weight-fat" inputMode="decimal" autoComplete="off" value={fat} invalid={!!errors.bodyFat} placeholder="VD: 22"
                onChange={(e) => { setFat(e.target.value); live.change('bodyFat', e.target.value); }} onBlur={(e) => live.blur('bodyFat', e.target.value)} />
              <span className="unit">%</span>
            </div>
          </Field>
        </div>
        <button type="button" className="link-btn small" aria-expanded={showCm} onClick={() => setShowCm((s) => !s)}>
          <Icon name={showCm ? 'chevronDown' : 'chevronRight'} size={14} />{t('Số đo vòng (cm) – không bắt buộc')}
        </button>
        {showCm && (
          <div className="form-grid">
            {MEASURES.map((m) => (
              <Field key={m.key} htmlFor={`weight-${m.key}`} label={`${t(m.label)} (cm)`} error={errors[m.key]}>
                <Input id={`weight-${m.key}`} inputMode="decimal" autoComplete="off" value={cm[m.key] ?? ''} invalid={!!errors[m.key]}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCm((c) => ({ ...c, [m.key]: v }));
                    live.setErrors((p) => { if (!p[m.key]) return p; const n = { ...p }; delete n[m.key]; return n; });
                  }} />
              </Field>
            ))}
          </div>
        )}
        <Field label={t('Ghi chú')}><Textarea maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('VD: đo buổi sáng, trước ăn')} /></Field>
      </div>
    </Modal>
  );
}
