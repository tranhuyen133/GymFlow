import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Exercise, Member, MuscleGroup, PlanItem, PlanStatus, WorkoutPlan } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { Icon } from '../../components/Icon';
import { MemberSelect } from '../../components/MemberSelect';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Confirm, Empty, ErrorState, Field, Input, LoadingBlock, Modal, PageHead, Select, StatusBadge, Textarea } from '../../components/ui';
import { t, tn } from '../../i18n';
import { addDays, DAYS, DAY_NAMES, muscleColor, muscleLabel, planStatus, toIsoDate } from '../../lib/format';
import { errMsg, fieldErrs, useAsync } from '../../lib/hooks';
import { checkPlanName, itemProblems, type ItemField } from '../../lib/validation';
import './exercises.css';

type Draft = PlanItem & { key: number };
let keySeq = 1;

/** Ảnh chụp nội dung form để so với bản đã lưu: chỉ hỏi "rời trang?" khi thật sự có thay đổi. */
function snapshot(v: { memberId: string; name: string; goal: string; start: string; end: string; note: string; items: PlanItem[] }) {
  return JSON.stringify({
    m: v.memberId, n: v.name.trim(), g: v.goal.trim(), s: v.start, e: v.end, o: v.note.trim(),
    i: [...v.items].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.sortOrder - b.sortOrder)
      .map((x) => [x.exerciseId, x.dayOfWeek, x.sets, x.reps.trim(), x.weightKg, x.restSeconds, x.durationMinutes, (x.note ?? '').trim()]),
  });
}

export default function PlanEditor() {
  const { id } = useParams();
  const isNew = !id;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  // V12: hội viên tự tập (chưa có HLV) tự soạn giáo án cho chính mình ở /me/plan/new, /me/plan/:id
  const me = useMe();
  const self = me.role === 'MEMBER';
  const back = self ? '/me/plan' : '/workout-plans';

  const plan = useAsync(() => (isNew ? Promise.resolve(null) : api.get<WorkoutPlan>(`/workout-plans/${id}`)), [id]);
  const library = useAsync(() => api.get<Exercise[]>('/exercises'), []);

  const [memberId, setMemberId] = useState(self ? String(me.memberId ?? '') : params.get('memberId') ?? '');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [start, setStart] = useState(toIsoDate(new Date()));
  const [end, setEnd] = useState(toIsoDate(addDays(new Date(), 55)));
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Draft[]>([]);
  const [day, setDay] = useState(1);
  const [pick, setPick] = useState('');
  const [groupFilter, setGroupFilter] = useState<'' | MuscleGroup>('');
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showItemErrors, setShowItemErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [copyTo, setCopyTo] = useState<number | null>(null);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  // Bản đã lưu của giáo án đang sửa; null = đang tải hoặc đang tạo mới
  const [baseline, setBaseline] = useState<string | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    const p = plan.data;
    if (!p) return;
    setMemberId(String(p.summary.memberId)); setName(p.summary.name); setGoal(p.summary.goal ?? '');
    setStart(p.summary.startDate); setEnd(p.summary.endDate); setNote(p.note ?? '');
    setItems(p.items.map((i) => ({ ...i, key: keySeq++ })));
    setDay(p.items[0]?.dayOfWeek ?? 1);
    setBaseline(snapshot({ memberId: String(p.summary.memberId), name: p.summary.name, goal: p.summary.goal ?? '', start: p.summary.startDate, end: p.summary.endDate, note: p.note ?? '', items: p.items }));
  }, [plan.data]);

  const current = snapshot({ memberId, name, goal, start, end, note, items });
  // Tạo mới: chỉ tính là "có thay đổi" khi đã tự nhập tên, ghi chú hoặc thêm bài (hội viên, mục tiêu, ngày được điền sẵn)
  const dirty = isNew ? items.length > 0 || !!name.trim() || !!note.trim() : baseline !== null && current !== baseline;

  const lastSuggestedMemberId = useRef<string | null>(null);

  useEffect(() => {
    // Gợi ý mục tiêu từ hồ sơ hội viên khi tạo mới.
    if (!isNew || !memberId) return;
    if (lastSuggestedMemberId.current === memberId) return;
    if (selectedMember?.goal) {
      lastSuggestedMemberId.current = memberId;
      setGoal(selectedMember.goal);
    }
  }, [memberId, selectedMember, isNew]);

  // Có thay đổi chưa lưu: đóng tab / tải lại → hộp xác nhận của trình duyệt (không tuỳ biến được);
  // bấm link trong ứng dụng → hộp xác nhận của GymFlow, có nút "Lưu rồi rời đi".
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { if (leaving.current) return; e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    const handleClick = (e: MouseEvent) => {
      if (leaving.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest('a');
      const href = a?.getAttribute('href');
      if (!a || !href || a.getAttribute('target') || a.hasAttribute('download')) return;
      if (!href.startsWith('/') || href === window.location.pathname) return; // link ngoài, mailto:, tel:, #… không chặn
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(href);
    };
    document.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', handleClick, true);
    };
  }, [dirty]);

  const go = (to: string) => { leaving.current = true; setLeaveTo(null); navigate(to); };
  const libById = useMemo(() => new Map((library.data ?? []).map((e) => [e.id, e])), [library.data]);
  // Chỉ bài đã được quản lý duyệt và đang hiện mới thêm được vào giáo án (backend cũng chặn)
  const approvedLib = useMemo(() => (library.data ?? []).filter((e) => e.reviewStatus === 'APPROVED' && !e.hidden), [library.data]);
  const waitingCount = (library.data?.length ?? 0) - approvedLib.length;

  const dayItems = items.filter((i) => i.dayOfWeek === day);
  const visibleLib = useMemo(() => approvedLib.filter((e) => !groupFilter || e.muscleGroup === groupFilter), [approvedLib, groupFilter]);
  const problems = useMemo(() => new Map(items.map((i) => [i.key, itemProblems(i)])), [items]);
  const badItems = items.filter((i) => Object.keys(problems.get(i.key) ?? {}).length > 0);
  const errOf = (it: Draft, f: ItemField) => (showItemErrors ? problems.get(it.key)?.[f] : undefined);

  const add = (exId: number) => {
    const ex = library.data?.find((e) => e.id === exId);
    if (!ex) return;
    if (dayItems.some((x) => x.exerciseId === ex.id)) toast.info(t('"{name}" đã có trong {day}, vẫn thêm một lần nữa', { name: ex.name, day: DAYS[day - 1] }));
    const cardio = ex.muscleGroup === 'CARDIO';
    setItems((xs) => [...xs, {
      key: keySeq++, exerciseId: ex.id, exerciseName: ex.name, muscleGroup: ex.muscleGroup, equipment: ex.equipment,
      dayOfWeek: day, sortOrder: xs.filter((x) => x.dayOfWeek === day).length, sets: cardio ? 1 : 3, reps: cardio ? '1' : '10-12',
      weightKg: null, restSeconds: cardio ? null : 60, durationMinutes: cardio ? 15 : null, note: null,
    }]);
    setPick('');
  };
  const update = (key: number, patch: Partial<PlanItem>) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const remove = (key: number) => {
    setItems((xs) => {
      const remaining = xs.filter((x) => x.key !== key);
      const remainingDay = remaining.filter((x) => x.dayOfWeek === day).sort((a, b) => a.sortOrder - b.sortOrder);
      const orderMap = new Map(remainingDay.map((x, idx) => [x.key, idx]));
      return remaining.map((x) => (x.dayOfWeek === day ? { ...x, sortOrder: orderMap.get(x.key) ?? 0 } : x));
    });
  };
  const move = (key: number, dir: -1 | 1) => {
    const list = [...dayItems].sort((a, b) => a.sortOrder - b.sortOrder).map((x) => x.key);
    const i = list.indexOf(key); const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setItems((xs) => xs.map((x) => (x.dayOfWeek === day ? { ...x, sortOrder: list.indexOf(x.key) } : x)));
  };
  const doCopy = (to: number) => {
    setItems((xs) => [...xs.filter((x) => x.dayOfWeek !== to), ...xs.filter((x) => x.dayOfWeek === day).map((x) => ({ ...x, id: undefined, key: keySeq++, dayOfWeek: to }))]);
    toast.info(t('Đã chép {from} sang {to}', { from: DAY_NAMES[day - 1], to: DAY_NAMES[to - 1] }));
  };
  const copyDay = (to: number) => {
    if (to === day) return;
    if (items.some((x) => x.dayOfWeek === to)) setCopyTo(to); else doCopy(to);
  };

  /** Trả về true nếu lưu thành công. */
  const save = async (): Promise<boolean> => {
    setError(null);
    const v: Record<string, string> = {};
    if (!memberId) v.memberId = 'Chọn hội viên';
    const nameErr = checkPlanName(name);
    if (nameErr) v.name = nameErr;
    if (end < start) v.end = 'Ngày kết thúc phải sau ngày bắt đầu';
    setErrors(v);
    if (Object.keys(v).length) { setError(t('Kiểm tra lại các ô được đánh dấu đỏ')); return false; }
    if (items.length === 0) { setError(t('Thêm ít nhất một bài tập')); return false; }
    if (badItems.length) {
      setShowItemErrors(true);
      const first = badItems[0];
      setDay(first.dayOfWeek);
      setError(t('Bài "{name}" ({day}): {msg}', { name: first.exerciseName, day: DAY_NAMES[first.dayOfWeek - 1], msg: t(Object.values(problems.get(first.key) ?? {})[0] ?? '') }));
      return false;
    }
    setBusy(true);
    const body = {
      memberId: Number(memberId), name: name.trim().replace(/\s+/g, ' '), goal: goal.trim() || null, startDate: start, endDate: end, note: note.trim() || null,
      items: [...items].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.sortOrder - b.sortOrder).map((i) => ({
        exerciseId: i.exerciseId, dayOfWeek: i.dayOfWeek, sortOrder: i.sortOrder, sets: i.sets, reps: i.reps.trim(),
        weightKg: i.weightKg, restSeconds: i.restSeconds, durationMinutes: i.durationMinutes, note: i.note?.trim() || null,
      })),
    };
    try {
      const res = isNew ? await api.post<WorkoutPlan>('/workout-plans', body) : await api.put<WorkoutPlan>(`/workout-plans/${id}`, body);
      setBaseline(current);
      toast.success(isNew ? (self ? 'Đã tạo giáo án, giáo án cũ chuyển sang lưu trữ' : 'Đã tạo giáo án, giáo án cũ của hội viên chuyển sang lưu trữ') : 'Đã lưu giáo án');
      if (isNew) { leaving.current = true; navigate(self ? '/me/plan' : `/workout-plans/${res.summary.id}`, { replace: true }); } else void plan.reload();
      return true;
    } catch (e) { setError(errMsg(e)); setErrors(fieldErrs(e)); return false; } finally { setBusy(false); }
  };

  const setStatus = async (s: PlanStatus) => {
    try { await api.put(`/workout-plans/${id}/status`, { status: s }); toast.success('Đã cập nhật trạng thái'); void plan.reload(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  if (plan.error) return <div className="page"><ErrorState message={plan.error} onRetry={plan.reload} /></div>;
  if (!isNew && (plan.loading || !plan.data)) return <div className="page"><LoadingBlock rows={8} /></div>;
  const summary = plan.data?.summary;
  // Giáo án HLV soạn: hội viên chỉ xem ở Giáo án của tôi (backend cũng chặn sửa)
  if (self && summary && summary.trainerId != null) {
    return (
      <div className="page">
        <PageHead eyebrow={t('Tập luyện')} title={summary.name} />
        <Alert kind="info" action={<Link to="/me/plan" className="btn btn-secondary btn-sm"><span>{t('Giáo án của tôi')}</span></Link>}>
          {t('Giáo án này do HLV {name} soạn nên bạn chỉ xem được. Cần đổi bài, hãy nhắn HLV.', { name: summary.trainerName ?? '' })}
        </Alert>
      </div>
    );
  }
  const ownDesc = self ? t('Tự soạn · {member}', { member: summary?.memberName ?? '' }) : null;

  return (
    <div className="page">
      <button
        type="button"
        className="link small row"
        style={{ gap: 6, marginBottom: 14, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
        onClick={() => (dirty ? setLeaveTo(back) : go(back))}
      >
        <Icon name="arrowLeft" size={15} />{self ? t('Giáo án của tôi') : t('Danh sách giáo án')}
      </button>
      <PageHead eyebrow={isNew ? 'Giáo án mới' : t('Giáo án #{id}', { id })} title={isNew ? 'Soạn giáo án' : name || 'Giáo án'}
        desc={summary ? <span className="row" style={{ gap: 8 }}><StatusBadge map={planStatus} value={summary.status} /> {ownDesc ?? (summary.trainerId == null
          ? tn('Hội viên tự soạn · {member}', { member: summary.memberName })
          : tn('HLV {trainer} · {member}', { trainer: summary.trainerName ?? '—', member: summary.memberName }))}</span>
          : self ? 'Chọn bài trong thư viện cho từng ngày trong tuần. Tạo xong, giáo án cũ (nếu có) tự chuyển sang lưu trữ; vào Lịch tập để tự xếp buổi.'
          : 'Chọn bài theo từng ngày trong tuần, đặt số hiệp, số lần, mức tạ và thời gian nghỉ.'}
        actions={<>
          {!isNew && <Button variant="ghost" icon="trash" onClick={() => setRemoving(true)}>Xoá</Button>}
          {summary && summary.status !== 'ACTIVE' && <Button icon="play" onClick={() => void setStatus('ACTIVE')}>Áp dụng lại</Button>}
          {summary && summary.status === 'ACTIVE' && <Button icon="checkCircle" onClick={() => void setStatus('COMPLETED')}>Đánh dấu hoàn thành</Button>}
          {dirty && <Badge tone="amber">Chưa lưu</Badge>}
          <Button variant="primary" icon="check" loading={busy} disabled={!isNew && !dirty} onClick={() => void save()}>{isNew ? 'Tạo giáo án' : 'Lưu thay đổi'}</Button>
        </>} />
      {error && <div style={{ marginBottom: 16 }}><Alert kind="error">{error}</Alert></div>}

      <div className="grid grid-main" style={{ alignItems: 'start' }}>
        <Card title="Bài tập theo ngày" icon="calendar">
          <div className="days-tabs">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const n = items.filter((i) => i.dayOfWeek === d).length;
              return <button key={d} className={`${d === day ? 'on' : ''} ${n ? 'has' : ''}`} onClick={() => setDay(d)}>{DAYS[d - 1]}<small>{n ? t('{n} bài', { n }) : t('Nghỉ')}</small></button>;
            })}
          </div>
          <div className="row between mt-16 row-wrap">
            <b>{DAY_NAMES[day - 1]}</b>
            {dayItems.length > 0 && (
              <Select style={{ width: 'auto', height: 32 }} value="" onChange={(e) => { if (e.target.value) copyDay(Number(e.target.value)); }} aria-label="Chép sang ngày khác">
                <option value="">{t('Chép ngày này sang…')}</option>
                {[1, 2, 3, 4, 5, 6, 7].filter((d) => d !== day).map((d) => <option key={d} value={d}>{DAY_NAMES[d - 1]}</option>)}
              </Select>
            )}
          </div>
          <div className="stack-sm mt-16">
            {dayItems.length === 0 && <Empty icon="dumbbell" title="Ngày nghỉ" desc="Chọn bài ở khung bên phải để thêm vào ngày này." />}
            {dayItems.length > 0 && (
              <div className="item-row tiny faint" style={{ background: 'none', animation: 'none' }}>
                <span>#</span><span>{t('Bài tập')}</span><span>{t('Hiệp')}</span><span>{t('Số lần')}</span><span className="hide-sm">{t('Tạ (kg)')}</span><span className="hide-sm">{t('Nghỉ (s)')}</span><span />
              </div>
            )}
            {[...dayItems].sort((a, b) => a.sortOrder - b.sortOrder).map((it, idx, arr) => {
              const ex = libById.get(it.exerciseId);
              const notApproved = ex && (ex.reviewStatus !== 'APPROVED' || ex.hidden);
              const msgs = showItemErrors ? Object.values(problems.get(it.key) ?? {}) : [];
              return (
                <div key={it.key} className={`item-row ${msgs.length ? 'has-err' : ''}`}>
                  <span className="idx">{idx + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <i style={{ width: 8, height: 8, borderRadius: 2, background: it.muscleGroup ? muscleColor[it.muscleGroup] : 'var(--faint)', flex: 'none' }} />
                      <b className="ellipsis small">{it.exerciseName}</b>
                      {notApproved && <span title={t('Bài này không còn ở trạng thái đã duyệt. Vẫn giữ được trong giáo án, nhưng không thêm mới được.')}><Badge tone="amber">{ex?.hidden ? 'Đã ẩn' : 'Chờ duyệt lại'}</Badge></span>}
                    </div>
                    <input className="input" style={{ height: 28, marginTop: 4, fontSize: 12 }} maxLength={255} placeholder={t('Ghi chú…')} value={it.note ?? ''} onChange={(e) => update(it.key, { note: e.target.value })} />
                    {msgs.length > 0 && <div className="tiny" style={{ color: 'var(--bad)', marginTop: 4 }}>{msgs.map((m) => t(m)).join(' · ')}</div>}
                  </div>
                  <input className={`input ${errOf(it, 'sets') ? 'has-err' : ''}`} type="number" inputMode="numeric" min={1} max={20} step={1} value={Number.isNaN(it.sets) ? '' : it.sets}
                    onChange={(e) => update(it.key, { sets: e.target.value === '' ? NaN : Number(e.target.value) })} aria-label={t('Số hiệp')} aria-invalid={!!errOf(it, 'sets')} />
                  <input className={`input ${errOf(it, 'reps') || errOf(it, 'durationMinutes') ? 'has-err' : ''}`} maxLength={20} value={it.durationMinutes != null ? `${it.durationMinutes}'` : it.reps}
                    onChange={(e) => {
                      const v = e.target.value;
                      // 15' = 15 phút (cardio); số lần giữ "1" để vẫn hợp lệ với backend
                      if (/^\d*'$/.test(v.trim())) update(it.key, { durationMinutes: v.trim() === "'" ? null : Number(v.trim().slice(0, -1)), reps: '1' });
                      else update(it.key, { reps: v, durationMinutes: null });
                    }}
                    aria-label={t('Số lần')} aria-invalid={!!(errOf(it, 'reps') || errOf(it, 'durationMinutes'))} title={t("Nhập 10-12, 45s, hoặc 15' cho số phút")} />
                  <input className={`input hide-sm ${errOf(it, 'weightKg') ? 'has-err' : ''}`} type="number" inputMode="decimal" min={0} max={500} step={0.5} value={it.weightKg ?? ''}
                    onChange={(e) => update(it.key, { weightKg: e.target.value === '' ? null : Number(e.target.value) })} aria-label={t('Mức tạ')} aria-invalid={!!errOf(it, 'weightKg')} />
                  <input className={`input hide-sm ${errOf(it, 'restSeconds') ? 'has-err' : ''}`} type="number" inputMode="numeric" min={0} max={900} step={15} value={it.restSeconds ?? ''}
                    onChange={(e) => update(it.key, { restSeconds: e.target.value === '' ? null : Number(e.target.value) })} aria-label={t('Nghỉ')} aria-invalid={!!errOf(it, 'restSeconds')} />
                  <div className="stack-sm" style={{ gap: 2 }}>
                    <Button size="sm" variant="ghost" icon="chevronDown" style={{ transform: 'rotate(180deg)' }} aria-label="Lên" disabled={idx === 0} onClick={() => move(it.key, -1)} />
                    <Button size="sm" variant="ghost" icon="x" aria-label="Bỏ bài" onClick={() => remove(it.key)} />
                    <Button size="sm" variant="ghost" icon="chevronDown" aria-label="Xuống" disabled={idx === arr.length - 1} onClick={() => move(it.key, 1)} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="stack" style={{ gap: 18 }}>
          <Card title="Thông tin" icon="clipboard">
            <div className="stack">
              {!self && <Field label="Hội viên" required error={errors.memberId}>
                <MemberSelect
                  value={memberId}
                  disabled={!isNew}
                  initialMemberName={plan.data?.summary.memberName}
                  onChange={(newId, m) => {
                    setMemberId(newId);
                    setSelectedMember(m ?? null);
                    if (m?.goal && isNew && lastSuggestedMemberId.current !== newId) {
                      lastSuggestedMemberId.current = newId;
                      setGoal(m.goal);
                    }
                    setErrors((x) => ({ ...x, memberId: '' }));
                  }}
                />
              </Field>}
              <Field label="Tên giáo án" required error={errors.name} hint="Phải có chữ cái, được kèm số. VD: Full body 3 buổi/tuần">
                <Input maxLength={120} value={name} invalid={!!errors.name} placeholder="VD: Full body 3 buổi/tuần"
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((x) => ({ ...x, name: checkPlanName(e.target.value) ?? '' })); }}
                  onBlur={() => setErrors((x) => ({ ...x, name: name.trim() ? checkPlanName(name) ?? '' : x.name ?? '' }))} />
              </Field>
              <Field label="Mục tiêu"><Input maxLength={255} value={goal} onChange={(e) => setGoal(e.target.value)} /></Field>
              <div className="form-grid">
                <Field label="Bắt đầu" required><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
                <Field label="Kết thúc" required error={errors.end}><Input type="date" value={end} min={start} invalid={!!errors.end} onChange={(e) => { setEnd(e.target.value); setErrors((x) => ({ ...x, end: '' })); }} /></Field>
              </div>
              <Field label="Ghi chú chung"><Textarea maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Khởi động, dinh dưỡng, lưu ý chấn thương…" /></Field>
            </div>
          </Card>
          <Card title={t('Thêm bài vào {day}', { day: DAYS[day - 1] })} icon="plus">
            <div className="stack">
              <div className="chips">
                <button className={`chip ${groupFilter === '' ? 'on' : ''}`} onClick={() => setGroupFilter('')}>{t('Tất cả')}</button>
                {(Object.keys(muscleLabel) as MuscleGroup[]).map((g) => <button key={g} className={`chip ${groupFilter === g ? 'on' : ''}`} onClick={() => setGroupFilter(g)}>{muscleLabel[g]}</button>)}
              </div>
              <div className="row">
                <Select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Chọn bài tập" disabled={library.loading}>
                  <option value="">{t('— Chọn bài tập ({n}) —', { n: visibleLib.length })}</option>
                  {visibleLib.map((e) => <option key={e.id} value={e.id}>{e.name} · {muscleLabel[e.muscleGroup]}</option>)}
                </Select>
                <Button variant="primary" icon="plus" disabled={!pick} onClick={() => add(Number(pick))} aria-label="Thêm bài" />
              </div>
              {library.error && <Alert kind="error">{library.error}</Alert>}
              {!library.loading && approvedLib.length === 0 && <Alert kind="warning">{t('Chưa có bài tập nào được duyệt. Nhờ quản lý vào Thư viện bài tập › Hàng chờ duyệt.')}</Alert>}
              <div className="tiny faint">{t("Mẹo: ô “Số lần” nhận 10-12, 8, 45s; nhập 15' để đặt theo phút (cardio).")}</div>
              {waitingCount > 0 && <div className="tiny faint row" style={{ gap: 6 }}><Icon name="info" size={13} />{tn('Chỉ hiện bài đã duyệt. {n} bài khác đang chờ duyệt hoặc đã ẩn.', { n: waitingCount })}</div>}
            </div>
          </Card>
        </div>
      </div>

      {removing && <Confirm danger title="Xoá giáo án?" message="Các buổi tập đã gắn giáo án này vẫn được giữ lại, chỉ bỏ liên kết." confirmText="Xoá" onClose={() => setRemoving(false)}
        onConfirm={async () => { try { await api.del(`/workout-plans/${id}`); toast.success('Đã xoá giáo án'); go(back); } catch (e) { toast.error(errMsg(e)); throw e; } }} />}

      {copyTo !== null && <Confirm title={t('Ghi đè {day}?', { day: DAY_NAMES[copyTo - 1] })} confirmText="Ghi đè"
        message={tn('{day} đang có {n} bài. Các bài đó sẽ được thay bằng bài của {from}.', { day: DAY_NAMES[copyTo - 1], n: items.filter((x) => x.dayOfWeek === copyTo).length, from: DAY_NAMES[day - 1] })}
        onClose={() => setCopyTo(null)} onConfirm={() => doCopy(copyTo)} />}

      {leaveTo !== null && (
        <Modal title={t('Rời trang khi chưa lưu?')} size="narrow" onClose={() => setLeaveTo(null)} footer={<>
          <Button variant="ghost" onClick={() => setLeaveTo(null)}>Ở lại</Button>
          <Button variant="danger" onClick={() => go(leaveTo)}>Bỏ thay đổi</Button>
          <Button variant="primary" icon="check" loading={busy} onClick={async () => { const to = leaveTo; if (await save()) go(to); else setLeaveTo(null); }}>{isNew ? 'Tạo rồi rời đi' : 'Lưu rồi rời đi'}</Button>
        </>}>
          <p className="small muted" style={{ margin: 0 }}>{t('Giáo án có thay đổi chưa lưu. Lưu lại trước khi rời trang hoặc bỏ các thay đổi này.')}</p>
        </Modal>
      )}
    </div>
  );
}
