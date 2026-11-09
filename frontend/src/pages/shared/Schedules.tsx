/**
 * Lịch tập. V12: hội viên chưa có HLV phụ trách (gói tự tập) tự xếp, dời, huỷ buổi tự tập của mình; buổi có HLV vẫn do HLV / quản lý xếp.
 * CHỦ FILE: Tùng (Lê Thanh Tùng) — SCRUM-188
 * ĐÓNG GÓP: Hồ Khánh Linh — SCRUM-196 · Form hoàn thành buổi
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Member, Schedule, ScheduleCreated, ScheduleStatus, Subscription, TimeSlot, Trainer, WorkoutPlanSummary } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { Icon } from '../../components/Icon';
import { MemberSelect } from '../../components/MemberSelect';
import { useToast } from '../../components/Toast';
import { WeekCalendar } from '../../components/WeekCalendar';
import { Alert, Badge, Button, Confirm, ErrorState, Field, Input, LoadingBlock, Modal, PageHead, Person, Segmented, Select, Stars, StatusBadge, Textarea } from '../../components/ui';
import { t, tn } from '../../i18n';
import { addDays, DAY_NAMES, fmtDate, fmtDateTime, fmtTime, fmtWeekday, parseDateTime, scheduleStatus, startOfWeek, toIsoDate, toIsoDateTime } from '../../lib/format';
import { covered, fromMin, GYM_CLOSE, GYM_OPEN, hm, timeOptions, toMin, type WeekSlot } from '../../lib/hours';
import '../../components/week-slots.css';
import { errMsg, fieldErrs, useAsync } from '../../lib/hooks';

type Filter = 'ALL' | ScheduleStatus;

export default function Schedules() {
  const me = useMe();
  const staff = me.role !== 'MEMBER';
  // Hội viên tự tập (chưa có HLV phụ trách) được tự xếp buổi
  const member = useAsync(() => (staff ? Promise.resolve(null) : api.get<Member>('/members/me')), [staff]);
  const selfTrain = !staff && member.data != null && member.data.trainerId == null;
  const [params, setParams] = useSearchParams();
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const [filter, setFilter] = useState<Filter>('ALL');
  const [trainerId, setTrainerId] = useState<string>('');
  const [open, setOpen] = useState<Schedule | null>(null);
  const [creating, setCreating] = useState(params.get('new') === '1');

  const trainers = useAsync(() => (me.role === 'ADMIN' ? api.get<Trainer[]>('/trainers') : Promise.resolve([] as Trainer[])), [me.role]);
  const { data, error, loading, reload } = useAsync(
    () => api.get<Schedule[]>('/schedules', { from: toIsoDateTime(week), to: toIsoDateTime(addDays(week, 7)), trainerId: trainerId || undefined }),
    [week.getTime(), trainerId],
  );
  const events = useMemo(() => (data ?? []).filter((e) => filter === 'ALL' || e.status === filter), [data, filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { SCHEDULED: 0, COMPLETED: 0, MISSED: 0, CANCELLED: 0 };
    (data ?? []).forEach((e) => { c[e.status]++; });
    return c;
  }, [data]);

  const closeCreate = () => { setCreating(false); if (params.get('new')) { params.delete('new'); setParams(params, { replace: true }); } };
  const label = `${week.getDate()}/${week.getMonth() + 1} – ${addDays(week, 6).getDate()}/${addDays(week, 6).getMonth() + 1}/${addDays(week, 6).getFullYear()}`;

  return (
    <div className="page">
      <PageHead eyebrow={staff ? 'Lịch tập' : 'Lịch của tôi'} title={staff ? 'Lịch tập tuần' : 'Lịch tập của tôi'}
        desc={staff ? 'Xếp lịch lặp hằng tuần, hệ thống tự chặn trùng giờ HLV và hội viên, chỉ cho xếp khi hội viên còn gói hiệu lực.'
          : selfTrain ? 'Gói tự tập: tự xếp buổi theo giáo án của bạn, dời hoặc huỷ trước giờ tập, tập xong thì đánh dấu hoàn thành.'
          : 'Bấm vào buổi tập để xem chi tiết và đánh dấu hoàn thành.'}
        actions={staff ? <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>Xếp lịch</Button>
          : selfTrain && <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>{t('Tự xếp buổi tập')}</Button>} />

      <div className="toolbar">
        <div className="row">
          <Button icon="chevronLeft" aria-label="Tuần trước" onClick={() => setWeek(addDays(week, -7))} />
          <Button onClick={() => setWeek(startOfWeek(new Date()))}>Tuần này</Button>
          <Button icon="chevronRight" aria-label="Tuần sau" onClick={() => setWeek(addDays(week, 7))} />
          <b className="num" style={{ marginLeft: 6 }}>{label}</b>
        </div>
        <div className="spacer" />
        {me.role === 'ADMIN' && (
          <Select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} aria-label="Lọc theo HLV">
            <option value="">{t('Tất cả HLV')}</option>
            {trainers.data?.map((tr) => <option key={tr.id} value={tr.id}>{tr.fullName}</option>)}
          </Select>
        )}
        <Segmented<Filter> value={filter} onChange={setFilter} options={[
          { value: 'ALL', label: t('Tất cả {n}', { n: data?.length ?? '' }) },
          { value: 'SCHEDULED', label: t('Sắp tới {n}', { n: counts.SCHEDULED }) },
          { value: 'COMPLETED', label: t('Hoàn thành {n}', { n: counts.COMPLETED }) },
          { value: 'MISSED', label: t('Vắng {n}', { n: counts.MISSED }) },
          { value: 'CANCELLED', label: t('Đã huỷ {n}', { n: counts.CANCELLED }) },
        ]} />
      </div>

      {error ? <ErrorState message={error} onRetry={reload} /> : (
        <div style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
          <WeekCalendar weekStart={week} events={events} onSelect={setOpen} showMember={staff} />
        </div>
      )}
      <div className="legend mt-16">
        {(['SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED'] as ScheduleStatus[]).map((s) => (
          <span key={s}><i style={{ ['--c' as string]: { SCHEDULED: '#3d97ff', COMPLETED: '#00d95b', MISSED: '#ff6b61', CANCELLED: '#5f636c' }[s] }} />{scheduleStatus[s][0]}</span>
        ))}
      </div>

      {open && <SessionModal session={open} onClose={() => setOpen(null)} onChanged={(d) => { setOpen(null); if (d) setWeek(startOfWeek(d)); void reload(); }} />}
      {creating && (staff || selfTrain) && <ScheduleForm presetMemberId={staff ? undefined : me.memberId ?? undefined} onClose={closeCreate} onSaved={(firstDay) => { closeCreate(); if (firstDay) setWeek(startOfWeek(firstDay)); void reload(); }} />}
    </div>
  );
}

// ================= Chi tiết buổi tập =================
export function SessionModal({ session, onClose, onChanged }: { session: Schedule; onClose: () => void; onChanged: (d?: Date) => void }) {
  const me = useMe();
  const toast = useToast();
  const staff = me.role !== 'MEMBER';
  // Buổi tự tập (không có HLV) thì hội viên tự dời / huỷ; đánh vắng vẫn chỉ HLV / quản lý
  const manage = staff || session.trainerId == null;
  const [mode, setMode] = useState<'view' | 'complete' | 'edit'>('view');
  const [confirm, setConfirm] = useState<'cancel' | 'missed' | null>(null);
  const started = parseDateTime(session.startTime) <= new Date();
  const canComplete = (session.status === 'SCHEDULED' || session.status === 'MISSED') && started;

  const act = async (path: string, msg: string) => {
    try { await api.put(`/schedules/${session.id}/${path}`); toast.success(msg); onChanged(); }
    catch (e) { toast.error(errMsg(e)); throw e; }
  };

  if (mode === 'complete') return <CompleteForm session={session} onClose={() => setMode('view')} onDone={() => onChanged()} />;
  if (mode === 'edit') return <ScheduleForm edit={session} onClose={() => setMode('view')} onSaved={(start) => onChanged(start)} />;

  return (
    <>
      <Modal title={session.title} onClose={onClose} footer={<>
        {manage && session.status === 'SCHEDULED' && <>
          <Button variant="danger" icon="ban" onClick={() => setConfirm('cancel')}>{t('Huỷ buổi')}</Button>
          {staff && started && <Button icon="x" onClick={() => setConfirm('missed')}>{t('Đánh vắng')}</Button>}
          {!started && <Button icon="edit" onClick={() => setMode('edit')}>{t('Dời lịch')}</Button>}
        </>}
        <span className="grow" />
        {canComplete && <Button variant="primary" icon="checkCircle" onClick={() => setMode('complete')}>{t('Hoàn thành buổi')}</Button>}
      </>}>
        <div className="stack">
          <div className="row between row-wrap">
            <div className="row"><Icon name="calendar" className="ok" /><b style={{ textTransform: 'capitalize' }}>{fmtWeekday(session.startTime)}</b><span className="muted">{fmtTime(session.startTime)}–{fmtTime(session.endTime)}</span></div>
            <StatusBadge map={scheduleStatus} value={session.status} />
          </div>
          <dl className="kv">
            <dt>{t('Hội viên')}</dt><dd><Person name={session.memberName} size="sm" /></dd>
            <dt>{t('Huấn luyện viên')}</dt><dd>{session.trainerName ?? <span className="faint">{t('Tự tập')}</span>}</dd>
            <dt>{t('Giáo án')}</dt><dd>{session.planName ?? <span className="faint">{t('Không gắn')}</span>}</dd>
            {session.note && <><dt>{t('Ghi chú')}</dt><dd>{session.note}</dd></>}
          </dl>
          {!started && session.status === 'SCHEDULED' && <Alert kind="info">{t('Chỉ đánh dấu hoàn thành được khi đã đến giờ tập.')}</Alert>}
          {session.status === 'MISSED' && canComplete && <Alert kind="warning">{t('Buổi này đang bị đánh vắng. Nếu bạn đã tập, có thể ghi nhận bù trong vòng 7 ngày.')}</Alert>}
          {session.log && (
            <div className="card" style={{ background: 'var(--rail)' }}>
              <div className="row between"><b className="ok">{t('Đã hoàn thành')}</b><span className="tiny faint">{fmtDateTime(session.log.completedAt)}</span></div>
              <div className="grid grid-3 mt-8 small">
                <div><div className="faint tiny">{t('Thời lượng')}</div><b>{session.log.durationMinutes != null ? t('{n} phút', { n: session.log.durationMinutes }) : '—'}</b></div>
                <div><div className="faint tiny">{t('Calo')}</div><b>{session.log.calories != null ? t('{n} kcal', { n: session.log.calories }) : '—'}</b></div>
                <div><div className="faint tiny">{t('Cảm nhận')}</div><Stars value={session.log.rating} /></div>
              </div>
              {session.log.note && <p className="small muted mt-8">“{session.log.note}”</p>}
            </div>
          )}
        </div>
      </Modal>
      {confirm === 'cancel' && <Confirm danger title={t('Huỷ buổi tập?')} message={t('Buổi tập sẽ chuyển sang trạng thái Đã huỷ và không tính vào chuyên cần.')} confirmText={t('Huỷ buổi')}
        onClose={() => setConfirm(null)} onConfirm={() => act('cancel', t('Đã huỷ buổi tập'))} />}
      {confirm === 'missed' && <Confirm title={t('Đánh vắng buổi này?')} message={t('Hội viên vẫn có thể ghi nhận bù trong 7 ngày nếu thực tế có tập.')} confirmText={t('Đánh vắng')}
        onClose={() => setConfirm(null)} onConfirm={() => act('missed', t('Đã đánh vắng'))} />}
    </>
  );
}

function CompleteForm({ session, onClose, onDone }: { session: Schedule; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const planned = Math.round((parseDateTime(session.endTime).getTime() - parseDateTime(session.startTime).getTime()) / 60000);
  const [duration, setDuration] = useState(String(planned));
  const [calories, setCalories] = useState('');
  const [rating, setRating] = useState(4);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const isPt = session.trainerId != null;
  const subs = useAsync(
    () => (isPt ? api.get<Subscription[]>(`/members/${session.memberId}/subscriptions`) : Promise.resolve([] as Subscription[])),
    [session.memberId, isPt],
  );
  const activePtSub = (subs.data ?? []).find(
    (s) => !s.cancelled && s.ptSessionsTotal != null && (s.state === 'ACTIVE' || s.state === 'EXPIRING'),
  );

  const ratingLabels = ['', t('Rất mệt'), t('Hơi đuối'), t('Ổn'), t('Tốt'), t('Xuất sắc')];

  const submit = async () => {
    const v: Record<string, string> = {};
    const d = Number(duration); const c = calories === '' ? null : Number(calories);
    if (!Number.isInteger(d) || d < 1 || d > 600) v.durationMinutes = t('Từ 1 đến 600 phút');
    if (c != null && (!Number.isInteger(c) || c < 0 || c > 5000)) v.calories = t('Từ 0 đến 5000 kcal');
    setErrors(v); setServerError('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await api.post(`/schedules/${session.id}/complete`, { durationMinutes: d, calories: c, rating, note: note || null });
      toast.success(t('Tuyệt vời! Đã ghi nhận buổi tập 💪'));
      onDone();
    } catch (e) {
      const err = errMsg(e);
      toast.error(err);
      setServerError(err);
      setErrors(fieldErrs(e));
    } finally { setBusy(false); }
  };

  return (
    <Modal title={t('Hoàn thành buổi tập')} onClose={onClose} size="narrow" footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Quay lại')}</Button>
      <Button variant="primary" icon="check" loading={busy} onClick={submit}>{t('Lưu kết quả')}</Button>
    </>}>
      <div className="stack">
        <div className="muted small">{session.title} · {fmtTime(session.startTime)}–{fmtTime(session.endTime)}</div>
        {isPt && (
          activePtSub ? (
            <Alert kind={activePtSub.ptSessionsRemaining && activePtSub.ptSessionsRemaining > 0 ? 'info' : 'warning'}>
              {tn('Hội viên còn {x} buổi PT (đã dùng {used}/{total}){until}. Buổi tập này sẽ được trừ sau khi lưu.', {
                x: <b>{t('{n} buổi', { n: activePtSub.ptSessionsRemaining ?? 0 })}</b>,
                used: activePtSub.ptSessionsUsed ?? 0,
                total: activePtSub.ptSessionsTotal,
                until: activePtSub.ptValidUntil ? t(' · hạn đến {d}', { d: fmtDate(activePtSub.ptValidUntil) }) : '',
              })}
            </Alert>
          ) : subs.loading ? (
            <LoadingBlock rows={1} />
          ) : (
            <Alert kind="warning">
              {t('Hội viên hiện không có gói PT hiệu lực còn buổi.')}
            </Alert>
          )
        )}
        <div className="form-grid">
          <Field label={t('Thời lượng (phút)')} error={errors.durationMinutes} required><Input type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} /></Field>
          <Field label={t('Calo tiêu thụ (kcal)')} error={errors.calories} hint={t('Xem trên đồng hồ / máy tập')}><Input type="number" min={0} max={5000} value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="VD: 420" /></Field>
        </div>
        <Field label={t('Cảm nhận buổi tập')}>
          <div className="row" style={{ gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className="btn btn-ghost btn-icon" aria-label={t('{n}/5 sao', { n })} onClick={() => setRating(n)} style={{ color: n <= rating ? 'var(--warning)' : 'var(--faint)' }}>
                <Icon name="star" fill={n <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
            <span className="small muted">{ratingLabels[rating]}</span>
          </div>
        </Field>
        <Field label={t('Ghi chú')} error={errors.note}><Textarea maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: tăng 2.5kg bench press" /></Field>
        {serverError && <Alert kind="error">{serverError}</Alert>}
      </div>
    </Modal>
  );
}

// ================= Form xếp / dời lịch =================
// Giờ bắt đầu: bước 15 phút trong giờ mở cửa, muộn nhất 21:30 để còn 30 phút tập
const START_TIMES = timeOptions(15, GYM_OPEN, fromMin(toMin(GYM_CLOSE) - 30));
const withCurrent = (list: string[], v: string) => (list.includes(v) ? list : [...list, v].sort((a, b) => toMin(a) - toMin(b)));
export function ScheduleForm({ edit, presetMemberId, onClose, onSaved }: { edit?: Schedule; presetMemberId?: number; onClose: () => void; onSaved: (firstDay?: Date) => void }) {
  const me = useMe();
  const toast = useToast();
  // Hội viên tự xếp buổi tự tập cho chính mình: không chọn hội viên / HLV, không cần đối chiếu giờ HLV
  const self = me.role === 'MEMBER';
  const defaultTitle = self ? 'Buổi tự tập' : 'Buổi tập với HLV';
  const start0 = edit ? parseDateTime(edit.startTime) : (() => { const d = addDays(new Date(), 1); d.setHours(18, 0, 0, 0); return d; })();
  const [memberId, setMemberId] = useState<string>(edit ? String(edit.memberId) : presetMemberId ? String(presetMemberId) : '');
  const [trainerId, setTrainerId] = useState<string>(edit?.trainerId ? String(edit.trainerId) : '');
  const [planId, setPlanId] = useState<string>(edit?.planId ? String(edit.planId) : '');
  const [title, setTitle] = useState(edit?.title ?? defaultTitle);
  const [date, setDate] = useState(toIsoDate(start0));
  const [time, setTime] = useState(`${String(start0.getHours()).padStart(2, '0')}:${String(start0.getMinutes()).padStart(2, '0')}`);
  const [duration, setDuration] = useState(edit ? String(Math.round((parseDateTime(edit.endTime).getTime() - start0.getTime()) / 60000)) : '60');
  const [repeat, setRepeat] = useState('0');
  const [autoFromPlan, setAutoFromPlan] = useState(false);
  const [note, setNote] = useState(edit?.note ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sameDayWarning, setSameDayWarning] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<{ created: number; reasons: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);

  const trainers = useAsync(() => (me.role === 'ADMIN' ? api.get<Trainer[]>('/trainers') : Promise.resolve([] as Trainer[])), []);
  const plans = useAsync(
    async () => {
      if (!memberId) return { memberId: '', list: [] as WorkoutPlanSummary[] };
      const list = await api.get<WorkoutPlanSummary[]>('/workout-plans', { memberId });
      return { memberId, list };
    },
    [memberId],
  );

  useEffect(() => {
    // Mặc định gắn giáo án đang áp dụng và HLV phụ trách của hội viên.
    if (edit) return;
    if (plans.loading || !plans.data || plans.data.memberId !== memberId) return;
    const active = plans.data.list.find((p) => p.status === 'ACTIVE');
    if (active) {
      setPlanId(String(active.id));
      setTitle(`Buổi tập – ${active.name}`.slice(0, 120));
    } else {
      setPlanId('');
      setTitle(defaultTitle);
    }
    if (me.role === 'ADMIN') {
      setTrainerId(selected?.trainerId ? String(selected.trainerId) : '');
    }
  }, [plans.data, plans.loading, memberId, selected?.trainerId, edit, me.role, defaultTitle]);

  // Giờ hội viên muốn tập và ca của HLV phụ trách, để chọn giờ cho khớp cả hai bên
  const prefs = useAsync(() => (memberId && !self ? api.get<TimeSlot[]>(`/members/${memberId}/time-preferences`) : Promise.resolve([] as TimeSlot[])), [memberId, self]);
  const tid = self ? '' : trainerId || (selected?.trainerId ? String(selected.trainerId) : '') || (edit?.trainerId ? String(edit.trainerId) : '') || (me.trainerId ? String(me.trainerId) : '');
  const trainer = useAsync(() => (tid ? api.get<Trainer>(`/trainers/${tid}`).catch(() => null) : Promise.resolve(null)), [tid]);
  const dow = date ? ((new Date(`${date}T00:00:00`).getDay() + 6) % 7) + 1 : 0;
  const dayPrefs = (prefs.data ?? []).filter((p) => p.dayOfWeek === dow).sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  const slot: WeekSlot = { dayOfWeek: dow, startTime: time, endTime: fromMin(toMin(time) + (Number(duration) || 0)) };
  const fitsMember = dayPrefs.length === 0 || covered(dayPrefs, slot);
  const shifts = trainer.data?.shifts ?? [];
  const fitsTrainer = !trainer.data || shifts.length === 0 || covered(shifts, slot);
  const outsideHours = toMin(time) < toMin(GYM_OPEN) || toMin(slot.endTime) > toMin(GYM_CLOSE);
  const pickPref = (p: TimeSlot) => {
    setTime(hm(p.startTime));
    const len = toMin(p.endTime) - toMin(p.startTime);
    // Giữ thời lượng đang chọn nếu vừa trong khung; khung ngắn hơn thì rút lại cho vừa
    if (len < (Number(duration) || 0)) setDuration(String(Math.max(15, Math.min(240, len))));
  };

  const submit = async (forceDuplicate = false) => {
    const v: Record<string, string> = {};
    if (!memberId) v.memberId = 'Chọn hội viên';
    if (!title.trim()) v.title = 'Nhập tiêu đề';
    const d = Number(duration);
    if (!Number.isInteger(d) || d < 15 || d > 240) v.duration = 'Từ 15 đến 240 phút';
    const start = new Date(`${date}T${time}:00`);
    if (Number.isNaN(start.getTime())) v.date = 'Ngày giờ không hợp lệ';
    else if (start < new Date()) v.date = 'Không xếp vào thời điểm đã qua';
    const end = new Date(start.getTime() + d * 60000);
    if (!v.duration && end.getDate() !== start.getDate()) v.duration = 'Buổi tập phải kết thúc trong ngày';
    if (!v.duration && outsideHours) v.time = t('Phòng tập mở cửa {open}–{close}, buổi tập phải nằm trong giờ này', { open: GYM_OPEN, close: GYM_CLOSE });
    setErrors(v); setError(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    setSameDayWarning(null);

    const body = {
      trainerId: trainerId ? Number(trainerId) : null, planId: planId ? Number(planId) : null, title: title.trim(),
      startTime: toIsoDateTime(start), endTime: toIsoDateTime(end), note: note.trim() || null,
      confirmDuplicateDay: forceDuplicate,
    };
    try {
      if (edit) {
        await api.put(`/schedules/${edit.id}`, body);
        toast.success('Đã dời lịch');
        onSaved(start);
      } else if (autoFromPlan && planId) {
        const res = await api.post<ScheduleCreated>('/schedules/generate-from-plan', {
          memberId: Number(memberId),
          planId: Number(planId),
          trainerId: trainerId ? Number(trainerId) : null,
          startDate: date,
          weeks: Math.max(1, (Number(repeat) || 0) + 1),
          defaultStartTime: time,
          durationMinutes: d,
          confirmDuplicateDay: forceDuplicate,
        });
        toast.success(t('Đã tự sinh {n} buổi tập theo giáo án', { n: res.created.length }));
        if (res.skipped.length) { setSkipped({ created: res.created.length, reasons: res.skipped }); setBusy(false); return; }
        onSaved(start);
      } else {
        const res = await api.post<ScheduleCreated>('/schedules', { ...body, memberId: Number(memberId), repeatWeeks: Number(repeat) });
        toast.success(t('Đã xếp {n} buổi tập', { n: res.created.length }));
        if (res.skipped.length) { setSkipped({ created: res.created.length, reasons: res.skipped }); setBusy(false); return; }
        onSaved(start);
      }
    } catch (e) {
      const msg = errMsg(e);
      if (msg.includes('thêm buổi thứ hai') || msg.includes('bạn đã có buổi tập')) {
        setSameDayWarning(msg);
      } else {
        setError(msg);
        setErrors(fieldErrs(e));
      }
    }
    setBusy(false);
  };

  if (skipped) {
    return (
      <Modal title={t('Đã xếp lịch, có tuần bị bỏ qua')} onClose={() => onSaved(new Date(`${date}T${time}:00`))} footer={<Button variant="primary" onClick={() => onSaved(new Date(`${date}T${time}:00`))}>{t('Đã hiểu')}</Button>}>
        <Alert kind="warning">{t('Các tuần sau không xếp được nên hệ thống bỏ qua, các tuần còn lại vẫn được tạo:')}</Alert>
        <p className="small mt-16">{t('Đã tạo {created} buổi, bỏ qua {n} tuần.', { created: skipped.created, n: skipped.reasons.length })}</p>
        <ul className="small muted mt-8">{skipped.reasons.map((s) => <li key={s}>{s}</li>)}</ul>
      </Modal>
    );
  }

  return (
    <>
      <Modal title={edit ? 'Dời lịch buổi tập' : self ? 'Tự xếp buổi tập' : 'Xếp lịch tập'} onClose={onClose} footer={<>
        <Button variant="ghost" onClick={onClose}>Huỷ</Button>
        <Button variant="primary" icon="check" loading={busy} onClick={() => submit(false)}>{edit ? 'Lưu thay đổi' : 'Xếp lịch'}</Button>
      </>}>
        <div className="stack">
          {error && <Alert kind="error">{error}</Alert>}
          <div className="form-grid">
          {self ? null : edit ? (
            <Field label="Hội viên" className="span-2"><Person name={edit.memberName} size="sm" /></Field>
          ) : (
            <Field label="Hội viên" error={errors.memberId} required className="span-2">
              <MemberSelect
                value={memberId}
                invalid={!!errors.memberId}
                onChange={(newId, m) => {
                  setMemberId(newId);
                  setSelected(m ?? null);
                }}
              />
            </Field>
          )}
          {selected && (selected.subscriptionState === 'EXPIRED' || !selected.subscriptionState) && (
            <div className="span-2"><Alert kind="warning">Hội viên này không có gói hiệu lực, hệ thống sẽ từ chối xếp lịch.</Alert></div>
          )}
          {me.role === 'ADMIN' && (
            <Field label="Huấn luyện viên" hint="Để trống = HLV phụ trách của hội viên">
              <Select value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
                <option value="">{t('Mặc định')}</option>
                {trainers.data?.filter((tr) => tr.active).map((tr) => <option key={tr.id} value={tr.id}>{tr.fullName}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Giáo án" className={me.role === 'ADMIN' ? '' : 'span-2'}>
            <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">Không gắn giáo án</option>
              {(plans.data?.memberId === memberId ? plans.data.list : []).map((p) => <option key={p.id} value={p.id}>{p.name}{p.status !== 'ACTIVE' ? ' (lưu trữ)' : ''}</option>)}
            </Select>
          </Field>
          {planId && !edit && (
            <div className="span-2" style={{ background: 'var(--rail)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
              <label className="row" style={{ gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={autoFromPlan}
                  onChange={(e) => setAutoFromPlan(e.target.checked)}
                />
                <span>{t('Tự sinh lịch theo các thứ trong tuần của giáo án')}</span>
              </label>
              {autoFromPlan && (
                <p className="tiny muted mt-4" style={{ margin: '4px 0 0 24px' }}>
                  {t('Hệ thống sẽ tự sinh các buổi tập vào đúng các thứ mà giáo án quy định. Bạn có thể dời từng buổi cụ thể sau khi sinh.')}
                </p>
              )}
            </div>
          )}
          <Field label="Tiêu đề" error={errors.title} required className="span-2"><Input maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Ngày" error={errors.date} required><Input type="date" value={date} min={toIsoDate(new Date())} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Giờ bắt đầu" error={errors.time} required hint={t('Mở cửa {open}–{close}', { open: GYM_OPEN, close: GYM_CLOSE })}>
            <Select value={time} invalid={!!errors.time} onChange={(e) => { setTime(e.target.value); setErrors((x) => ({ ...x, time: '' })); }}>
              {withCurrent(START_TIMES, time).map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Thời lượng (phút)" error={errors.duration} required hint={toMin(time) ? t('Kết thúc lúc {t}', { t: slot.endTime }) : undefined}>
            <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
              {[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m} disabled={toMin(time) + m > toMin(GYM_CLOSE)}>{t('{n} phút', { n: m })}</option>)}
              {![30, 45, 60, 75, 90, 120].includes(Number(duration)) && <option value={duration}>{t('{n} phút', { n: duration })}</option>}
            </Select>
          </Field>
          {memberId && dow > 0 && !self && (
            <div className="span-2 hours-note">
              <Icon name="clock" size={15} />
              <span className="small">{t('Hội viên muốn tập {day}:', { day: DAY_NAMES[dow - 1] })}</span>
              {prefs.loading && !prefs.data ? <span className="tiny faint">…</span>
                : dayPrefs.length === 0 ? <span className="tiny faint">{(prefs.data?.length ?? 0) > 0 ? t('không đăng ký ngày này') : t('chưa đăng ký giờ tập')}</span>
                : dayPrefs.map((p) => {
                  const on = covered([p], slot);
                  return (
                    <button key={p.startTime} type="button" className={`pref-chip ${on ? 'ok' : ''}`} onClick={() => pickPref(p)} title={t('Chọn khung giờ này')}>
                      {on && <Icon name="check" size={12} />}{hm(p.startTime)}–{hm(p.endTime)}
                    </button>
                  );
                })}
            </div>
          )}
          {!outsideHours && (!fitsMember || !fitsTrainer) && (
            <div className="span-2">
              <Alert kind="warning">
                {!fitsMember && <div>{t('Giờ này nằm ngoài khung hội viên đã đăng ký. Nên chọn một khung ở trên hoặc hỏi lại hội viên.')}</div>}
                {!fitsTrainer && <div>{t('Giờ này nằm ngoài ca làm của HLV {name} ({shifts}). Cập nhật ca ở Hồ sơ › Ca làm nếu cần.', {
                  name: trainer.data?.fullName ?? '',
                  shifts: shifts.filter((s) => s.dayOfWeek === dow).map((s) => `${hm(s.startTime)}–${hm(s.endTime)}`).join(', ') || t('nghỉ ngày này'),
                })}</div>}
              </Alert>
            </div>
          )}
          {!edit && (
            <Field label="Lặp lại hằng tuần" hint="Tuần nào trùng giờ / hết gói sẽ được bỏ qua">
              <Select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
                <option value="0">{t('Không lặp')}</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{t('Thêm {n} tuần ({m} buổi)', { n, m: n + 1 })}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Ghi chú" className="span-2"><Textarea maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} placeholder={self ? 'VD: chân, 45 phút' : 'VD: tập trung kỹ thuật squat'} /></Field>
        </div>
        {!edit && Number(repeat) > 0 && <Badge tone="blue">{t('Sẽ tạo tối đa {n} buổi vào {day} hằng tuần', { n: Number(repeat) + 1, day: fmtWeekday(`${date}T${time}:00`).split(',')[0] })}</Badge>}
      </div>
    </Modal>
    {sameDayWarning && (
      <Confirm
        title={t('Cảnh báo trùng buổi tập')}
        message={sameDayWarning}
        confirmText={t('Vẫn thêm')}
        onConfirm={() => {
          setSameDayWarning(null);
          void submit(true);
        }}
        onClose={() => setSameDayWarning(null)}
      />
    )}
  </>
  );
}
