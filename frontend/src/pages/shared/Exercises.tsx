import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '../../api/client';
import type { BulkApproveResult, ContentOrigin, Exercise, ExerciseGoal, ExerciseLocation, Level, MuscleGroup, ReviewStatus, Source } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { HealthDisclaimer, InfoRow, Missing, SourceList } from '../../components/Content';
import { ExerciseMedia, mediaCredit } from '../../components/ExerciseMedia';
import { MuscleMap } from '../../components/MuscleMap';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Confirm, Empty, ErrorState, Field, Input, LoadingBlock, Modal, PageHead, Pager, SearchInput, Segmented, Select, StatusBadge, Textarea } from '../../components/ui';
import { fmtDateTime, goalLabel, levelLabel, locationLabel, muscleLabel, reviewLabel } from '../../lib/format';
import { errMsg, fieldErrs, useAsync, useDebounced, usePaged } from '../../lib/hooks';
import { t } from '../../i18n';
import './exercises.css';
import { EQUIPMENT, EQUIPMENT_BY_KEY, isMuscleKey, MUSCLE_BY_KEY, MUSCLES, type EquipmentKey, type MuscleKey } from '../../lib/anatomy';
import { autoChecks, countSteps, exerciseFieldErrors, MANUAL_CHECKS, MIN_DESCRIPTION, MIN_STEPS } from '../../lib/validation';

const GROUPS = Object.keys(muscleLabel) as MuscleGroup[];
const LOCATIONS = Object.keys(locationLabel) as ExerciseLocation[];
const GOALS = Object.keys(goalLabel) as ExerciseGoal[];
const REVIEWS = Object.keys(reviewLabel) as ReviewStatus[];

type Sort = 'name' | 'updated' | 'usage' | 'review';
const SORTS: { value: Sort; label: string }[] = [
  { value: 'name', label: 'Tên A → Z' },
  { value: 'updated', label: 'Mới cập nhật' },
  { value: 'usage', label: 'Dùng nhiều nhất' },
  { value: 'review', label: 'Cần duyệt trước' },
];
// Thứ tự ưu tiên khi sắp "Cần duyệt trước": bài bị trả về → chờ duyệt → bản nháp → đã duyệt
const REVIEW_ORDER: Record<ReviewStatus, number> = { NEEDS_REVIEW: 0, PENDING: 1, DRAFT: 2, APPROVED: 3 };
const targetOf = (e: Exercise): MuscleKey[] => (e.targetMuscles ?? []).filter(isMuscleKey);
const secondaryOf = (e: Exercise): MuscleKey[] => (e.secondaryMuscleKeys ?? []).filter(isMuscleKey);
const equipOf = (e: Exercise): EquipmentKey[] => (e.equipmentKeys ?? []).filter((k): k is EquipmentKey => EQUIPMENT_BY_KEY.has(k as EquipmentKey));
const muscleName = (k: MuscleKey) => t(MUSCLE_BY_KEY.get(k)?.label ?? k);

const byName = (a: Exercise, b: Exercise) => a.name.localeCompare(b.name, 'vi');
const SORTERS: Record<Sort, (a: Exercise, b: Exercise) => number> = {
  name: byName,
  updated: (a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || byName(a, b),
  usage: (a, b) => b.usageCount - a.usageCount || byName(a, b),
  review: (a, b) => REVIEW_ORDER[a.reviewStatus] - REVIEW_ORDER[b.reviewStatus] || byName(a, b),
};

export default function Exercises() {
  const me = useMe();
  const staff = me.role !== 'MEMBER';
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [group, setGroup] = useState<'' | MuscleGroup>(() => (params.get('group') as MuscleGroup) || '');
  const [level, setLevel] = useState<'' | Level>(() => (params.get('level') as Level) || '');
  const [location, setLocation] = useState<'' | ExerciseLocation>(() => (params.get('location') as ExerciseLocation) || '');
  const [goal, setGoal] = useState<'' | ExerciseGoal>(() => (params.get('goal') as ExerciseGoal) || '');
  const [review, setReview] = useState<'' | ReviewStatus>(() => (params.get('review') as ReviewStatus) || '');
  const [showHidden, setShowHidden] = useState(() => params.get('hidden') === 'true');
  const [sort, setSort] = useState<Sort>('name');
  const [editing, setEditing] = useState<{ exercise?: Exercise; copyOf?: Exercise } | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [removing, setRemoving] = useState<Exercise | null>(null);
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useAsync(
    () => api.get<Exercise[]>('/exercises', { q: dq, muscleGroup: group, level, location, goal, reviewStatus: review, includeHidden: showHidden }),
    [dq, group, level, location, goal, review, showHidden]);
  const counts = useMemo(() => {
    const c: Partial<Record<MuscleGroup, number>> = {};
    data?.forEach((e) => { c[e.muscleGroup] = (c[e.muscleGroup] ?? 0) + 1; });
    return c;
  }, [data]);

  // Bản đồ cơ + dụng cụ lọc ngay trên dữ liệu đã tải (link từ trang Dụng cụ: ?equipment=dumbbell, ?muscle=chest)
  const [muscle, setMuscle] = useState<MuscleKey | null>(() => { const m = params.get('muscle'); return m && isMuscleKey(m) ? m : null; });
  const [equip, setEquip] = useState<'' | EquipmentKey>(() => { const k = params.get('equipment'); return k && EQUIPMENT_BY_KEY.has(k as EquipmentKey) ? k as EquipmentKey : ''; });
  const [withSecondary, setWithSecondary] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);

  // Đồng bộ bộ lọc vào URL để có thể chia sẻ link
  useEffect(() => {
    const next = new URLSearchParams();
    if (dq) next.set('q', dq);
    if (group) next.set('group', group);
    if (level) next.set('level', level);
    if (location) next.set('location', location);
    if (goal) next.set('goal', goal);
    if (review) next.set('review', review);
    if (showHidden) next.set('hidden', 'true');
    if (muscle) next.set('muscle', muscle);
    if (equip) next.set('equipment', equip);
    setParams(next, { replace: true });
  }, [dq, group, level, location, goal, review, showHidden, muscle, equip, setParams]);
  const byEquip = useMemo(() => (data ?? []).filter((e) => !equip || equipOf(e).includes(equip)), [data, equip]);
  const muscleCounts = useMemo(() => {
    const c: Partial<Record<MuscleKey, number>> = {};
    byEquip.forEach((e) => new Set([...targetOf(e), ...(withSecondary ? secondaryOf(e) : [])]).forEach((k) => { c[k] = (c[k] ?? 0) + 1; }));
    return c;
  }, [byEquip, withSecondary]);
  const equipCounts = useMemo(() => {
    const c: Partial<Record<EquipmentKey, number>> = {};
    data?.forEach((e) => equipOf(e).forEach((k) => { c[k] = (c[k] ?? 0) + 1; }));
    return c;
  }, [data]);
  const shown = useMemo(() => (muscle ? byEquip.filter((e) => targetOf(e).includes(muscle) || (withSecondary && secondaryOf(e).includes(muscle))) : byEquip), [byEquip, muscle, withSecondary]);
  const pickMuscle = (k: MuscleKey | null) => { setMuscle(k); if (k) setGroup(''); };
  const pickGroup = (g: '' | MuscleGroup) => { setGroup(g); if (g) setMuscle(null); };
  const muscleInfo = muscle ? MUSCLE_BY_KEY.get(muscle) : null;

  const sorted = useMemo(() => [...shown].sort(SORTERS[sort]), [shown, sort]);
  const paged = usePaged(sorted, 'exercises', `${dq}|${group}|${level}|${location}|${goal}|${review}|${showHidden}|${sort}|${muscle}|${equip}|${withSecondary}`, 12);
  const pendingCount = data?.filter((e) => e.reviewStatus !== 'APPROVED').length ?? 0;
  const viewing = data?.find((e) => e.id === viewingId) ?? null;
  const filtered = !!(q || group || level || location || goal || review || showHidden || muscle || equip);
  const clearFilters = () => { setQ(''); setGroup(''); setLevel(''); setLocation(''); setGoal(''); setReview(''); setShowHidden(false); setMuscle(null); setEquip(''); };
  const isAdmin = me.role === 'ADMIN';

  // Hàng chờ duyệt: danh sách id cố định lúc mở, duyệt xong bài nào tự sang bài kế tiếp
  const [queue, setQueue] = useState<number[] | null>(null);
  const [bulk, setBulk] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const waiting = useMemo(() => [...(data ?? [])].filter((e) => e.reviewStatus !== 'APPROVED').sort(SORTERS.review), [data]);
  const ready = useMemo(() => waiting.filter((e) => e.reviewStatus !== 'DRAFT' && autoChecks(reviewable(e)).every((c) => c.ok)), [waiting]);
  const openQueue = () => { const ids = waiting.map((e) => e.id); if (!ids.length) return; setQueue(ids); setViewingId(ids[0]); };
  const qIndex = queue && viewingId != null ? queue.indexOf(viewingId) : -1;
  const step = (dir: 1 | -1) => {
    if (!queue) return;
    const next = queue[qIndex + dir];
    if (next != null) setViewingId(next);
    else if (dir === 1) { toast.success('Đã xem hết hàng chờ duyệt'); setQueue(null); setViewingId(null); }
  };
  const closeDetail = () => { setViewingId(null); setQueue(null); };

  const toggleHidden = async (e: Exercise) => {
    try { await api.put(`/exercises/${e.id}/hidden`, { hidden: !e.hidden }); toast.success(e.hidden ? 'Đã hiện bài tập' : 'Đã ẩn bài tập'); void reload(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="page">
      <PageHead eyebrow="Huấn luyện" title="Thư viện bài tập"
        desc="Mỗi bài có nguồn tham khảo, giấy phép và trạng thái duyệt. Bài đã nằm trong giáo án chỉ được ẩn, không xoá để giữ nguyên lịch sử."
        actions={<>
          <Link to="/exercises/beginner" className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}>
            <Icon name="sparkle" size={14} className="mr-4" />
            <span>{t('Dành cho người mới')}</span>
          </Link>
          {staff && <Button variant="primary" icon="plus" onClick={() => setEditing({})}>Thêm bài tập</Button>}
        </>} />

      {data && pendingCount > 0 && !isAdmin && (
        <Alert kind="warning" action={staff && sort !== 'review' && <Button size="sm" onClick={() => setSort('review')}>Xem bài cần duyệt</Button>}>
          {t('{n} bài đang chờ quản lý duyệt. Nội dung chỉ mang tính tham khảo, chưa được chuyên gia y tế xác minh.', { n: pendingCount })}
        </Alert>
      )}

      {data && isAdmin && waiting.length > 0 && (
        <Card className="review-bar">
          <div className="review-bar-in">
            <div className="review-bar-ic"><Icon name="shield" /></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b>{t('{n} bài đang chờ bạn duyệt', { n: waiting.length })}</b>
              <div className="tiny muted">
                {t('Cách duyệt: mở hàng chờ → xem từng bài → tick checklist (máy tự kiểm tra phần thiếu, bạn đối chiếu với trang nguồn) → Duyệt hoặc Trả về chỉnh sửa kèm ghi chú.')}
              </div>
              <div className="row row-wrap mt-8" style={{ gap: 6 }}>
                <Badge tone="green">{t('{n} bài đủ thông tin', { n: ready.length })}</Badge>
                {waiting.length - ready.length > 0 && <Badge tone="amber">{t('{n} bài còn thiếu', { n: waiting.length - ready.length })}</Badge>}
              </div>
            </div>
            <div className="row row-wrap" style={{ gap: 8 }}>
              <Button variant="primary" icon="play" onClick={openQueue}>Mở hàng chờ duyệt</Button>
              {ready.length > 0 && <Button icon="checkCircle" onClick={() => setBulk(true)}>{t('Duyệt nhanh {n} bài đủ điều kiện', { n: ready.length })}</Button>}
            </div>
          </div>
        </Card>
      )}
      {skipped.length > 0 && (
        <Alert kind="warning" action={<Button size="sm" variant="ghost" icon="x" aria-label="Đóng" onClick={() => setSkipped([])} />}>
          <b>{t('Bỏ qua {n} bài chưa đủ điều kiện:', { n: skipped.length })}</b>
          <ul className="tiny" style={{ margin: '6px 0 0', paddingLeft: 18 }}>{skipped.map((s) => <li key={s}>{s}</li>)}</ul>
        </Alert>
      )}

      <div className="toolbar mt-16">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm tên Việt/Anh, tên khác, dụng cụ…" />
        <Select value={level} onChange={(e) => setLevel(e.target.value as Level | '')} aria-label="Cấp độ">
          <option value="">{t('Mọi cấp độ')}</option>
          {(Object.keys(levelLabel) as Level[]).map((l) => <option key={l} value={l}>{levelLabel[l][0]}</option>)}
        </Select>
        <Select value={location} onChange={(e) => setLocation(e.target.value as ExerciseLocation | '')} aria-label="Nơi tập">
          <option value="">{t('Mọi nơi tập')}</option>
          {LOCATIONS.filter((l) => l !== 'ANY').map((l) => <option key={l} value={l}>{locationLabel[l]}</option>)}
        </Select>
        <Select value={goal} onChange={(e) => setGoal(e.target.value as ExerciseGoal | '')} aria-label="Mục tiêu">
          <option value="">{t('Mọi mục tiêu')}</option>
          {GOALS.map((g) => <option key={g} value={g}>{goalLabel[g]}</option>)}
        </Select>
        {staff && (
          <Select value={review} onChange={(e) => setReview(e.target.value as ReviewStatus | '')} aria-label="Trạng thái duyệt">
            <option value="">{t('Mọi trạng thái duyệt')}</option>
            {REVIEWS.map((r) => <option key={r} value={r}>{reviewLabel[r][0]}</option>)}
          </Select>
        )}
        <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sắp xếp">
          {SORTS.filter((s) => staff || s.value !== 'review').map((s) => <option key={s.value} value={s.value}>{t(s.label)}</option>)}
        </Select>
        {staff && <label className="check"><input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />{t('Hiện cả bài đã ẩn')}</label>}
        {filtered && <Button variant="ghost" size="sm" icon="x" onClick={clearFilters}>Xoá bộ lọc</Button>}
      </div>
      <div className="chips" style={{ marginBottom: 14 }}>
        <button className={`chip ${group === '' ? 'on' : ''}`} onClick={() => pickGroup('')}>{t('Tất cả')}</button>
        {GROUPS.map((g) => <button key={g} className={`chip ${group === g ? 'on' : ''}`} onClick={() => pickGroup(g)}>{muscleLabel[g]}{group === '' && counts[g] ? ` · ${counts[g]}` : ''}</button>)}
      </div>

      {data && data.length > 0 && (
        <Card className="ex-explore" title="Tìm bài theo vùng cơ" icon="target"
          actions={<Button size="sm" variant="ghost" icon={mapOpen ? 'eyeOff' : 'eye'} onClick={() => setMapOpen((o) => !o)}>{mapOpen ? 'Thu gọn' : 'Mở bản đồ cơ'}</Button>}>
          {mapOpen ? (
            <div className="ex-explore-in">
              <MuscleMap size="lg" counts={muscleCounts} selected={muscle} onSelect={pickMuscle} />
              <div className="ex-explore-side">
                <div className="ex-explore-now">
                  {muscleInfo ? <>
                    <div className="row between" style={{ gap: 8 }}>
                      <b>{t(muscleInfo.label)} <span className="tiny faint">· {muscleInfo.labelEn}</span></b>
                      <Button size="sm" variant="ghost" icon="x" onClick={() => pickMuscle(null)}>Bỏ chọn</Button>
                    </div>
                    <span className="tiny muted">{t(muscleInfo.hint)}</span>
                    <span className="ex-explore-count">{t('{n} bài tập', { n: shown.length })}</span>
                  </> : <>
                    <b>{t('Chọn vùng cơ muốn tập')}</b>
                    <span className="tiny muted">{t('Vùng càng đậm càng có nhiều bài. Bấm lần nữa để bỏ chọn.')}</span>
                  </>}
                  <label className="check tiny"><input type="checkbox" checked={withSecondary} onChange={(ev) => setWithSecondary(ev.target.checked)} />{t('Tính cả bài có vùng này là cơ phụ')}</label>
                </div>

                <div>
                  <span className="tiny muted">{t('Vùng cơ')}</span>
                  <div className="chips mt-8">
                    {MUSCLES.filter((m) => muscleCounts[m.key] || muscle === m.key).map((m) => (
                      <button key={m.key} type="button" className={`chip ${muscle === m.key ? 'on' : ''}`} aria-pressed={muscle === m.key}
                        onClick={() => pickMuscle(muscle === m.key ? null : m.key)}>{t(m.label)} · {muscleCounts[m.key] ?? 0}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="tiny muted">{t('Dụng cụ')}</span>
                  <div className="chips mt-8">
                    <button type="button" className={`chip ${equip === '' ? 'on' : ''}`} onClick={() => setEquip('')}>{t('Mọi dụng cụ')}</button>
                    {EQUIPMENT.filter((x) => equipCounts[x.key] || equip === x.key).map((x) => (
                      <button key={x.key} type="button" className={`chip ${equip === x.key ? 'on' : ''}`} aria-pressed={equip === x.key}
                        onClick={() => setEquip(equip === x.key ? '' : x.key)}>{t(x.label)} · {equipCounts[x.key] ?? 0}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (muscle || equip) ? (
            <div className="row row-wrap" style={{ gap: 6 }}>
              {muscle && <button type="button" className="chip on" onClick={() => pickMuscle(null)}>{muscleName(muscle)} <Icon name="x" size={12} /></button>}
              {equip && <button type="button" className="chip on" onClick={() => setEquip('')}>{t(EQUIPMENT_BY_KEY.get(equip)?.label ?? equip)} <Icon name="x" size={12} /></button>}
            </div>
          ) : null}
        </Card>
      )}

      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingBlock rows={6} /> : data && shown.length === 0 ? (
        <Card><Empty icon="dumbbell" title="Không có bài tập phù hợp" desc={filtered ? 'Thử bỏ bớt bộ lọc hoặc đổi từ khoá.' : undefined}
          action={filtered ? <Button onClick={clearFilters}>Xoá bộ lọc</Button> : undefined} /></Card>
      ) : (
        <>
          <div className="grid grid-3" aria-busy={loading}>
            {paged.items.map((e) => (
              <Card key={e.id} className={`hoverable ex-card ${e.hidden ? 'is-hidden' : ''}`}>
                <button type="button" className="ex-thumb-btn" onClick={() => setViewingId(e.id)} aria-label={t('Xem {name}', { name: e.name })}>
                  <ExerciseMedia imageKey={e.imageKey} alt={e.name} playOnHover className="ex-thumb"
                    tag={targetOf(e).slice(0, 2).map(muscleName).join(' · ') || undefined}
                    fallback={<div className="ex-thumb ex-thumb-map"><MuscleMap size="sm" primary={targetOf(e)} secondary={secondaryOf(e)} /></div>} />
                </button>
                <div className="top">
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <button type="button" className="ex-title" onClick={() => setViewingId(e.id)}>{e.name}</button>
                      {e.nameEn && <div className="tiny faint">{e.nameEn}</div>}
                      <div className="tiny muted">{muscleLabel[e.muscleGroup]} · {e.equipment ?? t('Không dụng cụ')}{e.location && ` · ${locationLabel[e.location]}`}</div>
                    </div>
                  </div>
                  <StatusBadge map={levelLabel} value={e.level} />
                </div>
                {e.description && <p className="small muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.description}</p>}
                <div className="row row-wrap" style={{ gap: 6 }}>
                  <StatusBadge map={reviewLabel} value={e.reviewStatus} />
                  <span className="tiny faint">{e.sources.length > 0 ? t('{n} nguồn', { n: e.sources.length }) : t('Chưa có nguồn')}</span>
                  {e.updatedAt && <span className="tiny faint">· {t('Sửa lần cuối')} {fmtDateTime(e.updatedAt)}</span>}
                </div>
                <div className="row between">
                  <span className="tiny faint">{e.usageCount > 0 ? t('Dùng trong {n} giáo án', { n: e.usageCount }) : t('Chưa dùng')}{e.hidden && ' · '}{e.hidden && <Badge tone="muted">Đã ẩn</Badge>}</span>
                  <div className="row" style={{ gap: 2 }}>
                    <Link to={`/exercises/${e.id}`} className="btn btn-sm btn-ghost" title={t('Xem trang chi tiết')} aria-label={t('Trang chi tiết')}>
                      <Icon name="arrowRight" size={13} />
                    </Link>
                    <Button size="sm" variant="ghost" icon="eye" aria-label="Xem nhanh" title="Xem nhanh" onClick={() => setViewingId(e.id)} />
                    {staff && <Button size="sm" variant="ghost" icon="edit" aria-label="Sửa" title="Sửa" onClick={() => setEditing({ exercise: e })} />}
                    {staff && <Button size="sm" variant="ghost" icon="copy" aria-label="Nhân bản" title="Nhân bản" onClick={() => setEditing({ copyOf: e })} />}
                    {staff && <Button size="sm" variant="ghost" icon={e.hidden ? 'eye' : 'eyeOff'} aria-label={e.hidden ? 'Hiện' : 'Ẩn'} title={e.hidden ? 'Hiện' : 'Ẩn'} onClick={() => void toggleHidden(e)} />}
                    {me.role === 'ADMIN' && e.usageCount === 0 && <Button size="sm" variant="ghost" icon="trash" aria-label="Xoá" title="Xoá" onClick={() => setRemoving(e)} />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card flush className="mt-16">
            <Pager page={paged.page} totalPages={paged.totalPages} total={paged.total} onPage={(p) => { paged.setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              size={paged.size} sizes={[12, 24, 50]} onSize={paged.setSize} />
          </Card>
        </>
      )}

      {viewing && <ExerciseDetail key={viewing.id} exercise={viewing} canReview={isAdmin} onClose={closeDetail}
        queue={queue && qIndex >= 0 ? { index: qIndex, total: queue.length, prev: () => step(-1), next: () => step(1) } : undefined}
        onEdit={staff ? () => { setEditing({ exercise: viewing }); closeDetail(); } : undefined}
        onReviewed={() => { void reload(); if (queue) step(1); }} />}
      {bulk && <Confirm title={t('Duyệt {n} bài?', { n: ready.length })} confirmText="Duyệt tất cả"
        message={<div className="stack-sm">
          <p className="small" style={{ margin: 0 }}>{t('Các bài dưới đây đã đủ phần máy kiểm tra (nguồn, mô tả, các bước, lưu ý an toàn, nơi tập, mục tiêu). Chỉ duyệt nhanh khi bạn đã đối chiếu chúng với trang nguồn.')}</p>
          <ul className="tiny muted" style={{ margin: 0, paddingLeft: 18, maxHeight: 200, overflow: 'auto' }}>{ready.map((e) => <li key={e.id}>{e.name}</li>)}</ul>
        </div>}
        onClose={() => setBulk(false)}
        onConfirm={async () => {
          try {
            const r = await api.post<BulkApproveResult>('/exercises/review/approve-many', { ids: ready.map((e) => e.id).slice(0, 100) });
            toast.success(t('Đã duyệt {n} bài', { n: r.approved }));
            setSkipped(r.skipped);
            void reload();
          } catch (e) { toast.error(errMsg(e)); throw e; }
        }} />}
      {editing && <ExerciseForm exercise={editing.exercise} copyOf={editing.copyOf} isAdmin={me.role === 'ADMIN'} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); void reload(); }} />}
      {removing && <Confirm danger title="Xoá bài tập?" message={t('"{name}" sẽ bị xoá vĩnh viễn.', { name: removing.name })} confirmText="Xoá" onClose={() => setRemoving(null)}
        onConfirm={async () => { try { await api.del(`/exercises/${removing.id}`); toast.success('Đã xoá'); void reload(); } catch (e) { toast.error(errMsg(e)); throw e; } }} />}
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string | null }) {
  return (
    <div>
      <b className="small">{t(title)}</b>
      <div className="small muted mt-8" style={{ whiteSpace: 'pre-line' }}>{text ?? <Missing />}</div>
    </div>
  );
}

const reviewable = (e: Exercise) => ({ ...e, sourceCount: e.sources.length });

type Queue = { index: number; total: number; prev: () => void; next: () => void };

function ExerciseDetail({ exercise: e, canReview, queue, onClose, onEdit, onReviewed }: {
  exercise: Exercise; canReview: boolean; queue?: Queue; onClose: () => void; onEdit?: () => void; onReviewed: () => void;
}) {
  const toast = useToast();
  const [note, setNote] = useState(e.reviewNote ?? '');
  const [busy, setBusy] = useState<ReviewStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const auto = autoChecks(reviewable(e));
  const autoOk = auto.every((c) => c.ok);
  const manualOk = MANUAL_CHECKS.every((c) => ticked[c.id]);
  const missing = auto.filter((c) => !c.ok);

  const decide = async (status: ReviewStatus) => {
    setError(null);
    if (status === 'NEEDS_REVIEW' && !note.trim()) { setError('Ghi rõ nội dung cần chỉnh sửa trước khi trả về.'); return; }
    setBusy(status);
    try {
      await api.put(`/exercises/${e.id}/review`, { status, note });
      toast.success(status === 'APPROVED' ? 'Đã duyệt bài tập' : status === 'NEEDS_REVIEW' ? 'Đã trả về cho người soạn' : 'Đã cập nhật trạng thái duyệt');
      onReviewed();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(null); }
  };
  // Gợi ý ghi chú trả về từ các mục máy kiểm tra chưa đạt
  const suggestNote = () => setNote(missing.map((c) => `- ${t(c.label)}`).join('\n'));

  return (
    <Modal title={e.name} size="medium" onClose={onClose} footer={queue && <>
      <span className="tiny faint modal-foot-hint">{t('Hàng chờ: bài {i}/{n}', { i: queue.index + 1, n: queue.total })}</span>
      <Button variant="ghost" icon="chevronLeft" disabled={queue.index === 0} onClick={queue.prev}>Bài trước</Button>
      <Button icon="chevronRight" onClick={queue.next}>{queue.index === queue.total - 1 ? 'Kết thúc' : 'Bỏ qua, bài sau'}</Button>
    </>}>
      <div className="stack">
        <div className="row row-wrap">
          <StatusBadge map={reviewLabel} value={e.reviewStatus} />
          <Badge tone="green">{muscleLabel[e.muscleGroup]}</Badge>
          <StatusBadge map={levelLabel} value={e.level} />
          {e.location && <span className="chip">{locationLabel[e.location]}</span>}
          {e.goals.map((g) => <span key={g} className="chip">{goalLabel[g]}</span>)}
        </div>
        <div className={`ex-hero ${e.imageKey ? '' : 'no-media'}`}>
          {e.imageKey && (
            <figure className="ex-hero-media">
              <ExerciseMedia imageKey={e.imageKey} alt={e.name} play tag={t('Tư thế đầu ⇄ cuối')} />
              <figcaption className="tiny faint">{mediaCredit()}</figcaption>
            </figure>
          )}
          <div className="ex-hero-map">
            <b className="small">{t('Nhóm cơ tác động')}</b>
            {targetOf(e).length + secondaryOf(e).length > 0
              ? <MuscleMap size="md" primary={targetOf(e)} secondary={secondaryOf(e)} />
              : <p className="tiny faint" style={{ margin: 0 }}>{t('Bài chưa được gắn vùng cơ trên bản đồ.')}</p>}
          </div>
        </div>
        <HealthDisclaimer pending={e.reviewStatus !== 'APPROVED'} />
        {e.description ? <p className="muted">{e.description}</p> : <p className="small"><Missing /></p>}

        <div className="info-grid">
          <InfoRow label="Tên tiếng Anh" value={e.nameEn} />
          <InfoRow label="Tên gọi khác" value={e.aliases} />
          <InfoRow label="Dụng cụ" value={e.equipment ?? (equipOf(e).map((k) => t(EQUIPMENT_BY_KEY.get(k)?.label ?? k)).join(', ') || null)} />
          <InfoRow label="Cơ phụ trợ" value={e.secondaryMuscles} />
        </div>

        <TextBlock title="Hướng dẫn thực hiện" text={e.instructions} />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <TextBlock title="Hơi thở" text={e.breathing} />
          <TextBlock title="Liều gợi ý" text={e.suggestedDose} />
          <TextBlock title="Lỗi thường gặp" text={e.commonMistakes} />
          <TextBlock title="Biến thể" text={e.variations} />
        </div>
        <TextBlock title="Lưu ý an toàn" text={e.safetyNotes} />
        {e.videoUrl && <a className="btn btn-info" href={e.videoUrl} target="_blank" rel="noreferrer noopener"><Icon name="play" /><span>{t('Xem video hướng dẫn')}</span></a>}

        <div>
          <b className="small">{t('Nguồn tham khảo và giấy phép')}</b>
          <div className="mt-8"><SourceList sources={e.sources} origin={e.contentOrigin} /></div>
        </div>

        <div className="tiny faint">
          {e.reviewedByName ? <>{t('Duyệt gần nhất:')} {e.reviewedByName} · {fmtDateTime(e.reviewedAt)}</> : t('Chưa có lượt duyệt nào')}
          {e.updatedAt && <> · {t('Sửa lần cuối')} {fmtDateTime(e.updatedAt)}</>}
        </div>
        {e.reviewNote && <Alert kind={e.reviewStatus === 'NEEDS_REVIEW' ? 'warning' : 'info'}>{t('Ghi chú duyệt:')} {e.reviewNote}</Alert>}

        {canReview && (
          <Card title="Duyệt nội dung" icon="shield">
            <div className="stack-sm">
              {error && <Alert kind="error">{error}</Alert>}
              <p className="tiny muted" style={{ margin: 0 }}>{t('Duyệt nghĩa là quản lý phòng tập chấp nhận hiển thị bài này cho hội viên và cho HLV đưa vào giáo án; không phải chuyên gia y tế xác minh.')}</p>

              <div className="review-checks">
                <div className="review-checks-head"><b className="small">{t('1. Máy kiểm tra')}</b><Badge tone={autoOk ? 'green' : 'amber'}>{autoOk ? 'Đạt' : t('Thiếu {n} mục', { n: missing.length })}</Badge></div>
                {auto.map((c) => (
                  <div key={c.id} className={`review-check ${c.ok ? 'ok' : 'miss'}`}>
                    <Icon name={c.ok ? 'check' : 'alert'} size={14} /><span>{t(c.label)}</span>
                    {!c.ok && c.hint && <span className="tiny faint">· {t(c.hint)}</span>}
                  </div>
                ))}
              </div>

              <div className="review-checks">
                <div className="review-checks-head"><b className="small">{t('2. Bạn tự đối chiếu với trang nguồn')}</b><Badge tone={manualOk ? 'green' : 'muted'}>{t('{a}/{b}', { a: MANUAL_CHECKS.filter((c) => ticked[c.id]).length, b: MANUAL_CHECKS.length })}</Badge></div>
                {MANUAL_CHECKS.map((c) => (
                  <label key={c.id} className="check review-check">
                    <input type="checkbox" checked={!!ticked[c.id]} disabled={!autoOk} onChange={(ev) => setTicked((x) => ({ ...x, [c.id]: ev.target.checked }))} />
                    <span>{t(c.label)}</span>
                  </label>
                ))}
                {e.sources.length > 0 && (
                  <div className="row row-wrap" style={{ gap: 6 }}>
                    {e.sources.map((s) => <a key={s.id} className="chip" href={s.url} target="_blank" rel="noreferrer noopener"><Icon name="arrowRight" size={12} />{s.publisher}</a>)}
                  </div>
                )}
              </div>

              <Field label="Ghi chú (bắt buộc khi trả về chỉnh sửa)">
                <Textarea maxLength={500} rows={2} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder={t('VD: Bước 3 chưa khớp nguồn NHS, bổ sung lưu ý cho người đau lưng')} />
              </Field>
              {!autoOk && !note.trim() && <button type="button" className="link tiny" style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} onClick={suggestNote}>{t('Điền ghi chú từ các mục còn thiếu')}</button>}
              <div className="row row-wrap">
                <Button variant="primary" icon="check" loading={busy === 'APPROVED'} disabled={e.reviewStatus === 'APPROVED' || !autoOk || !manualOk}
                  title={!autoOk ? 'Bài còn thiếu thông tin, hãy trả về chỉnh sửa' : !manualOk ? 'Tick đủ 3 mục đối chiếu trước khi duyệt' : undefined}
                  onClick={() => void decide('APPROVED')}>Duyệt</Button>
                <Button icon="edit" loading={busy === 'NEEDS_REVIEW'} onClick={() => void decide('NEEDS_REVIEW')}>Trả về chỉnh sửa</Button>
                {onEdit && !autoOk && <Button variant="ghost" icon="edit" onClick={onEdit}>Tự sửa bài</Button>}
                {e.reviewStatus !== 'PENDING' && <Button variant="ghost" icon="refresh" loading={busy === 'PENDING'} onClick={() => void decide('PENDING')}>Đưa về chờ duyệt</Button>}
              </div>
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
}


/** Đếm ký tự dưới ô nhập dài; chuyển màu cảnh báo khi còn dưới 10% giới hạn của backend. */
function Count({ value, max }: { value: string; max: number }) {
  return <div className={`char-count ${value.length > max * 0.9 ? 'near' : ''}`} aria-live="polite">{value.length}/{max}</div>;
}

type Tab = 'basic' | 'class' | 'guide' | 'safety' | 'source';
const TABS: { id: Tab; label: string; desc?: string }[] = [
  { id: 'basic', label: 'Thông tin cơ bản' },
  { id: 'class', label: 'Phân loại', desc: 'Dùng cho bộ lọc trong thư viện và khi HLV soạn giáo án.' },
  { id: 'guide', label: 'Hướng dẫn tập' },
  { id: 'safety', label: 'An toàn và liều tập' },
  { id: 'source', label: 'Nguồn và giấy phép' },
];
// Ô nào thuộc tab nào – để nhảy tới đúng tab khi có lỗi (kể cả lỗi theo trường do backend trả về)
const FIELD_TAB: Record<string, Tab> = {
  name: 'basic', nameEn: 'basic', aliases: 'basic', description: 'basic',
  muscleGroup: 'class', secondaryMuscles: 'class', level: 'class', location: 'class', equipment: 'class', goals: 'class',
  targetMuscles: 'class', secondaryMuscleKeys: 'class', equipmentKeys: 'class', imageKey: 'class',
  instructions: 'guide', breathing: 'guide', commonMistakes: 'guide', variations: 'guide', videoUrl: 'guide',
  safetyNotes: 'safety', suggestedDose: 'safety', contentOrigin: 'source', sourceIds: 'source',
};

/** Một tab của form: chỉ tab đang chọn được vẽ, dữ liệu các tab khác vẫn giữ trong state. */
function FormSection({ id, active, children }: { id: Tab; active: Tab; children: ReactNode }) {
  if (id !== active) return null;
  const meta = TABS.find((x) => x.id === id);
  return (
    <section className="form-section" id={`ex-tab-${id}`} role="tabpanel" aria-labelledby={`ex-tabbtn-${id}`}>
      {meta?.desc && <p className="tiny muted" style={{ margin: '0 0 12px' }}>{t(meta.desc)}</p>}
      <div className="form-grid">{children}</div>
    </section>
  );
}

const blank = (s: string) => s.trim();

function getEmbedUrl(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  const yt = s.match(/(?:youtube\.com\/(?:watch\?.*?v=|embed\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = s.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function ExerciseForm({ exercise, copyOf, isAdmin, onClose, onSaved }: { exercise?: Exercise; copyOf?: Exercise; isAdmin: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const sources = useAsync(() => api.get<Source[]>('/content-sources'), []);
  const allExercises = useAsync(() => api.get<Exercise[]>('/exercises'), []);
  const base = exercise ?? copyOf;
  const initial = useMemo(() => ({
    name: copyOf ? `${copyOf.name} (bản sao)`.slice(0, 120) : exercise?.name ?? '',
    nameEn: base?.nameEn ?? '', aliases: base?.aliases ?? '',
    muscleGroup: base?.muscleGroup ?? ('CHEST' as MuscleGroup), secondaryMuscles: base?.secondaryMuscles ?? '',
    equipment: base?.equipment ?? '', level: base?.level ?? ('BEGINNER' as Level),
    location: (base?.location ?? '') as ExerciseLocation | '', goals: base?.goals ?? ([] as ExerciseGoal[]),
    primaryGoal: (base?.primaryGoal ?? (base?.goals?.[0] ?? '')) as ExerciseGoal | '',
    description: base?.description ?? '', instructions: base?.instructions ?? '',
    setupPosition: base?.setupPosition ?? '', steps: base?.steps ?? base?.instructions ?? '',
    breathing: base?.breathing ?? '', commonMistakes: base?.commonMistakes ?? '',
    safetyNotes: base?.safetyNotes ?? '', variations: base?.variations ?? '',
    suggestedDose: base?.suggestedDose ?? '', setsRepsHint: base?.setsRepsHint ?? '',
    videoUrl: base?.videoUrl ?? '', alternativeIds: base?.alternatives?.map((a) => a.id) ?? ([] as number[]),
    contentOrigin: base?.contentOrigin ?? ('SELF_AUTHORED' as ContentOrigin), sourceIds: base?.sources.map((s) => s.id) ?? ([] as number[]),
    targetMuscles: base ? targetOf(base) : ([] as MuscleKey[]), secondaryMuscleKeys: base ? secondaryOf(base) : ([] as MuscleKey[]),
    equipmentKeys: base ? equipOf(base) : ([] as EquipmentKey[]), imageKey: base?.imageKey ?? '',
  }), [base, copyOf, exercise]);
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [sourceQ, setSourceQ] = useState('');
  const [tab, setTab] = useState<Tab>('basic');
  const [mapMode, setMapMode] = useState<'primary' | 'secondary'>('primary');
  const [pickNote, setPickNote] = useState<string | null>(null);
  // Bấm vào vùng cơ: thêm/bỏ ở danh sách theo chế độ đang chọn; một vùng chỉ nằm ở một danh sách.
  // Vùng chính đầu tiên tự đặt "Nhóm cơ chính" cho khớp để bộ lọc cũ vẫn đúng.
  const pickArea = (k: MuscleKey) => {
    setPickNote(null);
    const isP = f.targetMuscles.includes(k), isS = f.secondaryMuscleKeys.includes(k);
    if (mapMode === 'primary') {
      if (isP) { set('targetMuscles', f.targetMuscles.filter((x) => x !== k)); return; }
      if (f.targetMuscles.length >= 6) { setPickNote(t('Tối đa 6 vùng cơ chính.')); return; }
      setF((x) => ({ ...x, targetMuscles: [...x.targetMuscles, k], secondaryMuscleKeys: x.secondaryMuscleKeys.filter((y) => y !== k),
        muscleGroup: x.targetMuscles.length === 0 ? MUSCLE_BY_KEY.get(k)?.group ?? x.muscleGroup : x.muscleGroup }));
    } else {
      if (isS) { set('secondaryMuscleKeys', f.secondaryMuscleKeys.filter((x) => x !== k)); return; }
      if (f.secondaryMuscleKeys.length >= 10) { setPickNote(t('Tối đa 10 vùng cơ phụ.')); return; }
      setF((x) => ({ ...x, secondaryMuscleKeys: [...x.secondaryMuscleKeys, k], targetMuscles: x.targetMuscles.filter((y) => y !== k) }));
    }
  };
  const bodyRef = useRef<HTMLDivElement>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    // Ô đang báo lỗi: sửa đúng là lỗi tự mất
    if (errors[k as string] && typeof v === 'string') {
      const msg = exerciseFieldErrors({ ...f, [k]: v })[k as string];
      setErrors((x) => ({ ...x, [k]: msg ?? '' }));
    }
  };
  const blurCheck = (k: keyof typeof f) => {
    const msg = exerciseFieldErrors(f)[k as string];
    if (msg || errors[k as string]) setErrors((x) => ({ ...x, [k]: msg ?? '' }));
  };
  const readiness = autoChecks({ ...f, location: f.location || null, sourceCount: f.sourceIds.length });
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  // Bản sao luôn coi là "có thay đổi" vì chưa được lưu
  const dirty = !!copyOf || JSON.stringify(f) !== JSON.stringify(initial);
  // Esc khi hộp xác nhận đang mở sẽ chạm cả hai modal: bỏ qua ở form để hộp xác nhận tự đóng
  const requestClose = () => { if (confirmLeave) return; if (dirty && !busy) setConfirmLeave(true); else onClose(); };

  const shownSources = useMemo(() => {
    const list = sources.data ?? [];
    const k = sourceQ.trim().toLowerCase();
    const match = k ? list.filter((s) => `${s.title} ${s.publisher} ${s.code}`.toLowerCase().includes(k)) : list;
    // Nguồn đang chọn lên đầu để thấy ngay những gì đã gắn
    return [...match].sort((a, b) => Number(f.sourceIds.includes(b.id)) - Number(f.sourceIds.includes(a.id)));
  }, [sources.data, sourceQ, f.sourceIds]);

  // Chuyển sang tab chứa ô lỗi đầu tiên rồi đặt con trỏ vào ô đó
  const showFirstError = (errs: Record<string, string>) => {
    const first = Object.keys(errs).find((k) => FIELD_TAB[k]);
    if (first) setTab(FIELD_TAB[first]);
    requestAnimationFrame(() => bodyRef.current?.querySelector<HTMLElement>('.has-err')?.focus());
  };

  const submit = async () => {
    if (busy || !dirty) return;
    const v = exerciseFieldErrors(f);
    setErrors(v); setError(null);
    if (Object.keys(v).length) { showFirstError(v); return; }
    setBusy(true);
    try {
      const body = {
        ...f, name: blank(f.name).replace(/\s+/g, " "), nameEn: blank(f.nameEn), aliases: blank(f.aliases), secondaryMuscles: blank(f.secondaryMuscles),
        equipment: blank(f.equipment), breathing: blank(f.breathing), suggestedDose: blank(f.suggestedDose), videoUrl: blank(f.videoUrl),
        setupPosition: blank(f.setupPosition), steps: blank(f.steps), setsRepsHint: blank(f.setsRepsHint),
        primaryGoal: f.primaryGoal || null, alternativeIds: f.alternativeIds,
        location: f.location || null, imageKey: blank(f.imageKey),
      };
      if (exercise) await api.put(`/exercises/${exercise.id}`, body); else await api.post('/exercises', body);
      toast.success(exercise ? 'Đã lưu bài tập' : 'Đã thêm bài tập – đang chờ duyệt');
      onSaved();
    } catch (e) { const fe = fieldErrs(e); setError(errMsg(e)); setErrors(fe); showFirstError(fe); } finally { setBusy(false); }
  };

  // Ctrl/⌘ + S để lưu nhanh khi đang soạn
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void submitRef.current(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const noSource = f.sourceIds.length === 0;
  const title = exercise ? t('Sửa bài tập: {name}', { name: exercise.name }) : copyOf ? t('Nhân bản bài tập') : t('Thêm bài tập');
  const tabHasError = (id: Tab) => Object.entries(errors).some(([k, m]) => !!m && FIELD_TAB[k] === id);
  const tabIndex = TABS.findIndex((x) => x.id === tab);

  return (
    <>
      <Modal title={title} size="medium" onClose={requestClose} footer={<>
        <span className="tiny faint modal-foot-hint">{dirty ? t('Có thay đổi chưa lưu') : t('Chưa có thay đổi')} · {t('Ctrl/⌘ + S để lưu')}</span>
        {tabIndex > 0 && <Button variant="ghost" icon="chevronLeft" onClick={() => setTab(TABS[tabIndex - 1].id)}>Trước</Button>}
        {tabIndex < TABS.length - 1 && <Button icon="chevronRight" onClick={() => setTab(TABS[tabIndex + 1].id)}>Tiếp</Button>}
        <Button variant="ghost" onClick={requestClose}>Huỷ</Button>
        <Button variant="primary" icon="check" loading={busy} disabled={!dirty} onClick={() => void submit()}>{exercise ? 'Lưu thay đổi' : 'Thêm bài tập'}</Button>
      </>}>
        <div className="stack" ref={bodyRef}>
          <div className="form-tabs" role="tablist" aria-label={t('Các phần của bài tập')}>
            {TABS.map((x, i) => (
              <button key={x.id} type="button" role="tab" id={`ex-tabbtn-${x.id}`} aria-selected={tab === x.id} aria-controls={`ex-tab-${x.id}`}
                className={`form-tab ${tab === x.id ? 'on' : ''}`} onClick={() => setTab(x.id)}>
                <span className="form-tab-no">{i + 1}</span>{t(x.label)}
                {tabHasError(x.id) && <span className="form-tab-dot err" aria-label={t('Có lỗi')} />}
                {!tabHasError(x.id) && x.id === 'source' && noSource && <span className="form-tab-dot warn" aria-label={t('Chưa có nguồn')} />}
              </button>
            ))}
          </div>
          {error && <Alert kind="error">{error}</Alert>}
          {!isAdmin && exercise?.reviewStatus === 'APPROVED' && <Alert kind="info">Sau khi lưu, bài sẽ quay về trạng thái "Chờ duyệt".</Alert>}
          {exercise?.reviewStatus === 'NEEDS_REVIEW' && exercise.reviewNote && <Alert kind="warning">{t('Quản lý yêu cầu chỉnh sửa:')} {exercise.reviewNote}</Alert>}
          {copyOf && <Alert kind="info">{t('Đang tạo bài mới từ "{name}". Hãy đổi tên – tên bài tập không được trùng.', { name: copyOf.name })}</Alert>}
          <details className="ready-box" open={readiness.some((c) => !c.ok)}>
            <summary>
              <Icon name={readiness.every((c) => c.ok) ? 'checkCircle' : 'clipboard'} size={15} />
              <b className="small">{readiness.every((c) => c.ok) ? t('Đủ thông tin để quản lý duyệt') : t('Cần bổ sung để được duyệt ({a}/{b})', { a: readiness.filter((c) => c.ok).length, b: readiness.length })}</b>
            </summary>
            <div className="ready-list">
              {readiness.map((c) => (
                <span key={c.id} className={`review-check ${c.ok ? 'ok' : 'miss'}`}><Icon name={c.ok ? 'check' : 'alert'} size={13} />{t(c.label)}</span>
              ))}
            </div>
          </details>

          <FormSection id="basic" active={tab}>
            <Field label="Tên bài tập" error={errors.name} required>
              <Input maxLength={120} value={f.name} invalid={!!errors.name} onChange={(e) => set('name', e.target.value)} onBlur={() => blurCheck('name')} placeholder="VD: Squat thanh đòn sau" />
            </Field>
            <Field label="Tên tiếng Anh" error={errors.nameEn}><Input maxLength={120} value={f.nameEn} invalid={!!errors.nameEn} onChange={(e) => set('nameEn', e.target.value)} onBlur={() => blurCheck('nameEn')} placeholder="VD: Back squat" /></Field>
            <Field label="Tên gọi khác" error={errors.aliases} hint="Cách nhau bởi dấu phẩy – giúp tìm kiếm" className="span-2"><Input maxLength={255} value={f.aliases} invalid={!!errors.aliases} onChange={(e) => set('aliases', e.target.value)} onBlur={() => blurCheck('aliases')} /></Field>
            <Field label="Mô tả ngắn" className="span-2" hint={t('Tối thiểu {n} ký tự để được duyệt', { n: MIN_DESCRIPTION })}>
              <Textarea maxLength={1000} rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} />
              <Count value={f.description} max={1000} />
            </Field>
          </FormSection>

          <FormSection id="class" active={tab}>
            <Field label="Nhóm cơ chính" required>
              <Select value={f.muscleGroup} onChange={(e) => set('muscleGroup', e.target.value as MuscleGroup)}>{GROUPS.map((g) => <option key={g} value={g}>{muscleLabel[g]}</option>)}</Select>
            </Field>
            <Field label="Cơ phụ trợ" error={errors.secondaryMuscles}><Input maxLength={255} value={f.secondaryMuscles} invalid={!!errors.secondaryMuscles} onBlur={() => blurCheck('secondaryMuscles')} onChange={(e) => set('secondaryMuscles', e.target.value)} placeholder="VD: Mông, lưng dưới" /></Field>
            <Field label="Cấp độ" required>
              <Select value={f.level} onChange={(e) => set('level', e.target.value as Level)}>{(Object.keys(levelLabel) as Level[]).map((l) => <option key={l} value={l}>{levelLabel[l][0]}</option>)}</Select>
            </Field>
            <Field label="Nơi tập">
              <Select value={f.location} onChange={(e) => set('location', e.target.value as ExerciseLocation | '')}>
                <option value="">{t('Chưa xác định')}</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{locationLabel[l]}</option>)}
              </Select>
            </Field>
            <Field label="Dụng cụ" error={errors.equipment} className="span-2"><Input maxLength={60} value={f.equipment} invalid={!!errors.equipment} onBlur={() => blurCheck('equipment')} onChange={(e) => set('equipment', e.target.value)} placeholder="Thanh đòn, tạ đơn…" /></Field>
            <div className="span-2">
              <span className="tiny muted">{t('Mục tiêu')} · {t('chọn một hoặc nhiều')}</span>
              <div className="chips mt-8" role="group" aria-label={t('Mục tiêu')}>
                {GOALS.map((g) => {
                  const on = f.goals.includes(g);
                  return (
                    <button type="button" key={g} className={`chip chip-toggle ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => set('goals', toggle(f.goals, g))}>
                      <Icon name={on ? 'check' : 'plus'} size={12} />{goalLabel[g]}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Mục tiêu chính" className="span-2">
              <Select value={f.primaryGoal} onChange={(e) => set('primaryGoal', e.target.value as ExerciseGoal | '')}>
                <option value="">{t('-- Chọn mục tiêu chính --')}</option>
                {GOALS.map((g) => <option key={g} value={g}>{goalLabel[g]}</option>)}
              </Select>
            </Field>

            <div className="span-2 ex-pick">
              <div className="row between row-wrap" style={{ gap: 8 }}>
                <div>
                  <b className="small">{t('Vùng cơ trên bản đồ')}</b>
                  <div className="tiny muted">{t('Chọn chế độ rồi bấm vào hình. Bấm lại để bỏ. Hội viên dùng bản đồ này để tìm bài.')}</div>
                </div>
                <Segmented value={mapMode} onChange={setMapMode} options={[
                  { value: 'primary', label: t('Cơ chính · {n}/6', { n: f.targetMuscles.length }) },
                  { value: 'secondary', label: t('Cơ phụ · {n}/10', { n: f.secondaryMuscleKeys.length }) },
                ]} />
              </div>
              <div className="ex-pick-in">
                <MuscleMap size="md" primary={f.targetMuscles} secondary={f.secondaryMuscleKeys} onSelect={(k) => k && pickArea(k)} />
                <div className="ex-pick-list">
                  {MUSCLES.map((m) => {
                    const p = f.targetMuscles.includes(m.key), s = f.secondaryMuscleKeys.includes(m.key);
                    return (
                      <button type="button" key={m.key} className={`chip chip-toggle ${p ? 'on' : s ? 'on-soft' : ''}`} aria-pressed={p || s} onClick={() => pickArea(m.key)}
                        title={p ? t('Cơ chính') : s ? t('Cơ phụ') : undefined}>
                        <Icon name={p || s ? 'check' : 'plus'} size={12} />{t(m.label)}{s && <span className="tiny faint"> · {t('phụ')}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              {pickNote && <p className="tiny" style={{ margin: 0, color: 'var(--warning)' }}>{pickNote}</p>}
            </div>

            <div className="span-2">
              <span className="tiny muted">{t('Loại dụng cụ')} · {t('dùng cho trang Dụng cụ và bộ lọc')}</span>
              <div className="chips mt-8" role="group" aria-label={t('Loại dụng cụ')}>
                {EQUIPMENT.map((x) => {
                  const on = f.equipmentKeys.includes(x.key);
                  return (
                    <button type="button" key={x.key} className={`chip chip-toggle ${on ? 'on' : ''}`} aria-pressed={on}
                      disabled={!on && f.equipmentKeys.length >= 6} onClick={() => set('equipmentKeys', toggle(f.equipmentKeys, x.key))}>
                      <Icon name={on ? 'check' : 'plus'} size={12} />{t(x.label)}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Mã ảnh minh hoạ" className="span-2" hint={t('Thư mục ảnh trong /exercise-img/ (VD Barbell_Squat). Để trống thì hiện bản đồ cơ.')}>
              <div className="ex-img-field">
                <Input maxLength={80} value={f.imageKey} placeholder="VD: Barbell_Squat"
                  onChange={(e) => set('imageKey', e.target.value.replace(/[^A-Za-z0-9_-]/g, ''))} />
                <ExerciseMedia key={f.imageKey} imageKey={blank(f.imageKey) || null} alt={f.name || t('Ảnh minh hoạ')} play className="ex-img-preview"
                  fallback={<div className="ex-img-preview ex-media-empty"><Icon name="camera" size={20} /></div>} />
              </div>
            </Field>

            <div className="span-2">
              <span className="tiny muted">{t('Bài tập thay thế tương đương')}</span>
              <div className="chips mt-8" style={{ maxHeight: 140, overflowY: 'auto' }}>
                {(allExercises.data ?? []).filter((ex) => ex.id !== exercise?.id).slice(0, 40).map((ex) => {
                  const on = f.alternativeIds.includes(ex.id);
                  return (
                    <button
                      type="button"
                      key={ex.id}
                      className={`chip chip-toggle ${on ? 'on' : ''}`}
                      onClick={() => set('alternativeIds', toggle(f.alternativeIds, ex.id))}
                    >
                      <Icon name={on ? 'check' : 'plus'} size={12} />
                      {ex.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </FormSection>

          <FormSection id="guide" active={tab}>
            <Field label="Tư thế chuẩn bị" className="span-2" hint="Tư thế đứng/ngồi, vị trí đặt tay chân trước khi nhấc tạ">
              <Textarea maxLength={1000} rows={2} value={f.setupPosition} onChange={(e) => set('setupPosition', e.target.value)} placeholder="Đứng thẳng, chân mở rộng bằng vai..." />
              <Count value={f.setupPosition} max={1000} />
            </Field>
            <Field label="Các bước thực hiện (đánh số)" className="span-2" hint={t('Mỗi bước một dòng, cần ít nhất {n} bước · hiện có {k} bước', { n: MIN_STEPS, k: countSteps(f.steps || f.instructions) })}>
              <Textarea maxLength={2000} rows={5} value={f.steps} onChange={(e) => set('steps', e.target.value)} placeholder="1. Hạ tạ xuống...&#10;2. Đẩy mạnh lên..." />
              <Count value={f.steps} max={2000} />
            </Field>
            <Field label="Hơi thở" className="span-2"><Input maxLength={500} value={f.breathing} onChange={(e) => set('breathing', e.target.value)} placeholder="VD: Hít vào khi hạ người, thở ra khi đứng lên" /></Field>
            <Field label="Lỗi thường gặp">
              <Textarea maxLength={2000} rows={3} value={f.commonMistakes} onChange={(e) => set('commonMistakes', e.target.value)} />
              <Count value={f.commonMistakes} max={2000} />
            </Field>
            <Field label="Biến thể">
              <Textarea maxLength={2000} rows={3} value={f.variations} onChange={(e) => set('variations', e.target.value)} />
              <Count value={f.variations} max={2000} />
            </Field>
            <Field label="Link video (YouTube / Vimeo)" error={errors.videoUrl} className="span-2" hint="Chấp nhận link youtube.com, youtu.be, vimeo.com">
              <Input maxLength={255} value={f.videoUrl} invalid={!!errors.videoUrl} onBlur={() => blurCheck('videoUrl')} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              {getEmbedUrl(f.videoUrl) && (
                <div className="mt-8" style={{ maxWidth: 360 }}>
                  <div className="video-embed-container" style={{ borderRadius: 'var(--r-sm)' }}>
                    <iframe src={getEmbedUrl(f.videoUrl)!} title="Xem trước video" allowFullScreen />
                  </div>
                  <div className="tiny faint mt-4">✓ Xem trước video nhúng</div>
                </div>
              )}
            </Field>
          </FormSection>

          <FormSection id="safety" active={tab}>
            <Field label="Lưu ý an toàn" className="span-2">
              <Textarea maxLength={2000} rows={3} value={f.safetyNotes} onChange={(e) => set('safetyNotes', e.target.value)} />
              <Count value={f.safetyNotes} max={2000} />
            </Field>
            <Field label="Gợi ý số hiệp & số lần (Sets & Reps)" className="span-2" hint="VD: 3 hiệp x 10–12 lần">
              <Input maxLength={100} value={f.setsRepsHint} onChange={(e) => set('setsRepsHint', e.target.value)} placeholder="VD: 3 hiệp x 10–12 lần" />
            </Field>
            <Field label="Liều gợi ý" hint="Chỉ ghi khi có nguồn; để trống sẽ hiện “Chưa có dữ liệu”" className="span-2"><Input maxLength={255} value={f.suggestedDose} onChange={(e) => set('suggestedDose', e.target.value)} /></Field>
          </FormSection>

          <FormSection id="source" active={tab}>
            <Field label="Nguồn gốc nội dung" className="span-2">
              <Select value={f.contentOrigin} onChange={(e) => set('contentOrigin', e.target.value as ContentOrigin)}>
                <option value="SELF_AUTHORED">{t('Tự biên soạn')}</option>
                <option value="ADAPTED">{t('Biên soạn lại từ nguồn mở')}</option>
              </Select>
            </Field>
            <div className="span-2">
              <div className="row between row-wrap" style={{ gap: 8 }}>
                <span className="tiny muted">{t('Nguồn tham khảo (cần ít nhất 1 nguồn để được duyệt)')} · <b>{t('đã chọn {n}', { n: f.sourceIds.length })}</b></span>
                {(sources.data?.length ?? 0) > 6 && <div style={{ minWidth: 220 }}><SearchInput value={sourceQ} onChange={setSourceQ} placeholder="Tìm nguồn…" /></div>}
              </div>
              {noSource && <div className="mt-8"><Alert kind="warning">{t('Chưa gắn nguồn nào – bài sẽ không thể được duyệt.')}</Alert></div>}
              {sources.error ? <Alert kind="error">{sources.error}</Alert> : !sources.data ? <LoadingBlock rows={2} /> : shownSources.length === 0 ? (
                <p className="tiny faint mt-8">{t('Không có nguồn phù hợp')}</p>
              ) : (
                <div className="source-pick mt-8">
                  {shownSources.map((s) => (
                    <label key={s.id} className="check">
                      <input type="checkbox" checked={f.sourceIds.includes(s.id)} onChange={() => set('sourceIds', toggle(f.sourceIds, s.id))} />
                      <span>{s.title} <span className="tiny faint">· {s.publisher}{!s.licenseVerified && ` · ${t('giấy phép chưa xác minh')}`}</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </FormSection>
        </div>
      </Modal>
      {confirmLeave && <Confirm title="Bỏ thay đổi?" message={t('Các thay đổi chưa lưu sẽ bị mất.')} confirmText="Bỏ thay đổi" danger
        onClose={() => setConfirmLeave(false)} onConfirm={() => { setConfirmLeave(false); onClose(); }} />}
    </>
  );
}
