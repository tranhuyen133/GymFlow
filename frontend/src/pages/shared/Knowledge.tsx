import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import type {
  Article,
  Equipment,
  EquipmentCategory,
  Exercise,
  ExerciseLocation,
  ExerciseType,
  Level,
  MuscleDetail,
  MuscleSummary,
} from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { ExerciseMedia, mediaCredit } from '../../components/ExerciseMedia';
import { MuscleMap, muscleName } from '../../components/MuscleMap';
import { Icon, type IconName } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Badge, Button, Empty, ErrorState, LoadingBlock, Modal, Pager, SearchInput } from '../../components/ui';
import { articleCategoryLabel, fmtDateTime, formatEquipment, levelLabel, locationLabel } from '../../lib/format';
import { errMsg, useAsync, useDebounced, usePaged } from '../../lib/hooks';
import { localizeText } from '../../lib/planText';
import { t, useLang } from '../../i18n';
import { EQUIPMENT, EQUIPMENT_BY_KEY, isGifKey, isMuscleKey, type EquipmentKey, type MuscleKey } from '../../lib/anatomy';
import {
  CARDIO_SUBCATS, CategoryTile, ExerciseCard, MuscleAtlas, SectionHead, STRENGTH_SUBCATS, WARMUP_SUBCATS, type SubCategoryItem,
} from './KnowledgeParts';
import './exercises.css';
import './kb.css';
import './knowledge.css';

export type KnowledgeTab = 'exercises' | 'warmup' | 'cardio' | 'equipment' | 'muscles' | 'guides';

const TAB_CONFIGS: { key: KnowledgeTab; label: string; icon: IconName }[] = [
  { key: 'exercises', label: 'Bài tập sức mạnh', icon: 'dumbbell' },
  { key: 'warmup', label: 'Khởi động', icon: 'repeat' },
  { key: 'cardio', label: 'Cardio', icon: 'heart' },
  { key: 'muscles', label: 'Bản đồ cơ', icon: 'target' },
  { key: 'equipment', label: 'Dụng cụ & Thiết bị', icon: 'layers' },
  { key: 'guides', label: 'Hướng dẫn tập luyện', icon: 'scroll' },
];

const EQUIPMENT_CATEGORIES: { key: EquipmentCategory | ''; label: string }[] = [
  { key: '', label: 'Tất cả dụng cụ' },
  { key: 'FREE_WEIGHT', label: 'Tạ tự do' },
  { key: 'MACHINE', label: 'Máy tập khối tạ' },
  { key: 'CABLE', label: 'Máy kéo cáp' },
  { key: 'BODYWEIGHT', label: 'Trọng lượng cơ thể' },
  { key: 'CARDIO', label: 'Máy tim mạch' },
  { key: 'ACCESSORY', label: 'Phụ kiện tập' },
  { key: 'RECOVERY', label: 'Phục hồi & giãn cơ' },
];

const LOCATIONS = Object.keys(locationLabel) as ExerciseLocation[];

type Sort = 'name' | 'updated' | 'usage';
const SORTS: { value: Sort; label: string }[] = [
  { value: 'name', label: 'Tên A → Z' },
  { value: 'updated', label: 'Mới cập nhật' },
  { value: 'usage', label: 'Dùng nhiều nhất' },
];

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

export default function Knowledge() {
  const { user } = useAuth();
  const { lang } = useLang();
  const isMember = user?.role === 'MEMBER';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TRAINER';
  const toast = useToast();

  const [params, setParams] = useSearchParams();
  const currentTab = (params.get('tab') === 'library' ? 'exercises' : (params.get('tab') as KnowledgeTab)) || 'exercises';

  // State bộ lọc bài tập
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [subCategory, setSubCategory] = useState<string>(() => params.get('sub') ?? '');
  const [level, setLevel] = useState<'' | Level>(() => (params.get('level') as Level) || '');
  const [location, setLocation] = useState<'' | ExerciseLocation>(() => (params.get('location') as ExerciseLocation) || '');
  const [favoriteOnly, setFavoriteOnly] = useState<boolean>(() => params.get('fav') === 'true');
  const [assignedOnly, setAssignedOnly] = useState<boolean>(() => params.get('assigned') === 'true');
  const [showHidden, setShowHidden] = useState(() => params.get('hidden') === 'true');
  const [sort, setSort] = useState<Sort>('name');
  const [muscle, setMuscle] = useState<MuscleKey | null>(() => {
    const m = params.get('muscle');
    return m && isMuscleKey(m) ? m : null;
  });
  const [equip, setEquip] = useState<string>(() => params.get('equipment') ?? '');
  const [mapOpen, setMapOpen] = useState(() => !!params.get('muscle'));
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Dụng cụ tab state
  const [equipmentCategory, setEquipmentCategory] = useState<EquipmentCategory | ''>('');

  // Bản đồ cơ & hướng dẫn
  const [selectedMuscleKey, setSelectedMuscleKey] = useState<MuscleKey | null>(null);
  const [hoverMuscle, setHoverMuscle] = useState<MuscleKey | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const dq = useDebounced(q);

  // Đồng bộ URL params
  useEffect(() => {
    const next = new URLSearchParams();
    next.set('tab', currentTab);
    if (dq) next.set('q', dq);
    if (subCategory) next.set('sub', subCategory);
    if (level) next.set('level', level);
    if (location) next.set('location', location);
    if (favoriteOnly) next.set('fav', 'true');
    if (assignedOnly) next.set('assigned', 'true');
    if (showHidden) next.set('hidden', 'true');
    if (muscle) next.set('muscle', muscle);
    if (equip) next.set('equipment', equip);
    setParams(next, { replace: true });
  }, [currentTab, dq, subCategory, level, location, favoriteOnly, assignedOnly, showHidden, muscle, equip, setParams]);

  const activeExerciseType: ExerciseType | null = useMemo(() => {
    if (currentTab === 'exercises') return 'STRENGTH';
    if (currentTab === 'warmup') return 'WARMUP';
    if (currentTab === 'cardio') return 'CARDIO';
    return null;
  }, [currentTab]);

  const activeSubCats: SubCategoryItem[] = useMemo(() => {
    if (currentTab === 'exercises') return STRENGTH_SUBCATS;
    if (currentTab === 'warmup') return WARMUP_SUBCATS;
    if (currentTab === 'cardio') return CARDIO_SUBCATS;
    return [];
  }, [currentTab]);

  // 1. Toàn bộ bài của tab hiện tại: đếm theo danh mục / vùng cơ và gom nhóm khi xem "Tất cả"
  const { data: allTabExercises, reload: reloadAllTabExercises } = useAsync(
    () => {
      if (!activeExerciseType) return Promise.resolve<Exercise[]>([]);
      return api.get<Exercise[]>('/exercises', { exerciseType: activeExerciseType, includeHidden: isStaff && showHidden });
    },
    [activeExerciseType, isStaff, showHidden]
  );

  // 2. Danh sách đã lọc
  const { data: exercisesData, loading: exercisesLoading, error: exercisesError, reload: reloadFilteredExercises } = useAsync(
    () => {
      if (!activeExerciseType) return Promise.resolve<Exercise[]>([]);
      return api.get<Exercise[]>('/exercises', {
        q: dq || undefined,
        exerciseType: activeExerciseType,
        subCategory: subCategory || undefined,
        muscle: muscle || undefined,
        equipment: equip || undefined,
        level: level || undefined,
        location: location || undefined,
        favoriteOnly: favoriteOnly || undefined,
        assignedOnly: assignedOnly || undefined,
        includeHidden: showHidden,
      });
    },
    [activeExerciseType, dq, subCategory, muscle, equip, level, location, favoriteOnly, assignedOnly, showHidden]
  );

  const reloadExercises = () => {
    void reloadAllTabExercises();
    void reloadFilteredExercises();
  };

  const subCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ex of allTabExercises ?? []) {
      if (ex.subCategory) counts[ex.subCategory] = (counts[ex.subCategory] ?? 0) + 1;
    }
    counts[''] = allTabExercises?.length ?? 0;
    return counts;
  }, [allTabExercises]);

  // Số bài theo vùng cơ chính để tô đậm bản đồ lọc
  const muscleCounts = useMemo(() => {
    const c: Partial<Record<MuscleKey, number>> = {};
    for (const ex of allTabExercises ?? []) {
      for (const m of ex.targetMuscles ?? []) if (isMuscleKey(m)) c[m] = (c[m] ?? 0) + 1;
    }
    return c;
  }, [allTabExercises]);

  const gifCount = useMemo(() => (allTabExercises ?? []).filter((e) => isGifKey(e.imageKey)).length, [allTabExercises]);

  const { data: equipmentData, loading: equipmentLoading } = useAsync(
    () => api.get<Equipment[]>('/equipment', { includeHidden: isStaff && showHidden }),
    [isStaff, showHidden]
  );

  const { data: musclesData } = useAsync(() => api.get<MuscleSummary[]>('/muscles'), []);

  const { data: muscleDetail, loading: muscleDetailLoading } = useAsync(
    () => (selectedMuscleKey ? api.get<MuscleDetail>(`/muscles/${selectedMuscleKey}`) : Promise.resolve(null)),
    [selectedMuscleKey]
  );

  const { data: guidesData, loading: guidesLoading } = useAsync(() => api.get<Article[]>('/articles/public'), []);


  const sortedExercises = useMemo(() => {
    const list = [...(exercisesData ?? [])];
    // Sắp xếp theo tên gốc tiếng Việt để thứ tự ổn định khi đổi ngôn ngữ (SCRUM-229)
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    else if (sort === 'updated') list.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    else if (sort === 'usage') list.sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
    return list;
  }, [exercisesData, sort]);

  const pagedExercises = usePaged(
    sortedExercises,
    'knowledge-exercises-page',
    `${currentTab}|${subCategory}|${dq}|${level}|${location}|${sort}|${muscle ?? ""}|${equip}|${favoriteOnly}|${assignedOnly}|${showHidden}|${lang}`,
    12
  );

  const activeFilterCount = useMemo(() => {
    let cnt = 0;
    if (level) cnt++;
    if (location) cnt++;
    if (sort !== 'name') cnt++;
    if (muscle) cnt++;
    if (equip) cnt++;
    if (favoriteOnly) cnt++;
    if (assignedOnly) cnt++;
    if (showHidden) cnt++;
    return cnt;
  }, [level, location, sort, muscle, equip, favoriteOnly, assignedOnly, showHidden]);

  const handleClearAllFilters = () => {
    setQ('');
    setSubCategory('');
    setLevel('');
    setLocation('');
    setMuscle(null);
    setEquip('');
    setFavoriteOnly(false);
    setAssignedOnly(false);
    setShowHidden(false);
    setSort('name');
  };

  const toggleFavorite = async (e: Exercise, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isMember) return;
    try {
      const res = await api.post<{ isFavorite: boolean; favoriteCount: number; message: string }>(`/exercises/${e.id}/favorite`);
      toast.success(t(res.isFavorite ? 'Đã lưu vào bài tập yêu thích' : 'Đã bỏ lưu khỏi bài tập yêu thích'));
      reloadExercises();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleTabChange = (tab: KnowledgeTab) => {
    setParams({ tab }, { replace: true });
    setSubCategory('');
    setLevel('');
    setLocation('');
    setMuscle(null);
    setEquip('');
    setQ('');
    setFavoriteOnly(false);
    setAssignedOnly(false);
    setSort('name');
    setMapOpen(false);
  };

  const isBrowsingAll = !subCategory && !dq && !muscle && !equip && !level && !location && !favoriteOnly && !assignedOnly;

  const card = (ex: Exercise) => (
    <ExerciseCard key={ex.id} ex={ex} isMember={isMember} onFavorite={toggleFavorite} />
  );

  const chip = (label: string, onClear: () => void, tone = '') => (
    <span className={`kb-filter-chip ${tone}`}>
      {label}
      <button type="button" onClick={onClear} aria-label={t('Bỏ lọc')}><Icon name="x" size={12} /></button>
    </span>
  );

  const muscleLabelOf = (k: MuscleKey) => muscleName(k, lang);
  const isExerciseTab = currentTab === 'exercises' || currentTab === 'warmup' || currentTab === 'cardio';

  return (
    <div className="page kb-page">
      {/* ===== Hero ===== */}
      <header className="kb-hero">
        <div className="kb-hero-text">
          <span className="kb-eyebrow">{isStaff ? t('Trung tâm huấn luyện') : t('Tập đúng · Tập khoẻ')}</span>
          <h1>{t('Kho kiến thức')}</h1>
          <p>{t('Thư viện bài tập có ảnh động minh hoạ, khởi động, cardio, bản đồ cơ thể và hướng dẫn dụng cụ – tất cả ở một nơi.')}</p>
          <div className="kb-stats">
            <div><b>{musclesData?.length ?? "—"}</b><span>{t('nhóm cơ')}</span></div>
            <div><b>{equipmentData?.length ?? '—'}</b><span>{t('dụng cụ')}</span></div>
            <div><b>{guidesData?.length ?? '—'}</b><span>{t('bài hướng dẫn')}</span></div>
            {isExerciseTab && <div><b>{gifCount}</b><span>{t('bài có ảnh động')}</span></div>}
          </div>
        </div>
        <div className="kb-hero-art" aria-hidden>
          <MuscleMap size="md" primary={['chest', 'abs', 'quadriceps', 'front-deltoids']} secondary={['biceps', 'obliques', 'calves']} />
          <span className="kb-pulse" />
        </div>
      </header>

      {/* ===== Tabs ===== */}
      <nav className="kb-tabs" aria-label={t('Danh mục kho kiến thức')}>
        {TAB_CONFIGS.map((tc) => (
          <button key={tc.key} type="button" className={`kb-tab ${currentTab === tc.key ? 'active' : ''}`} onClick={() => handleTabChange(tc.key)}>
            <Icon name={tc.icon} size={16} />
            <span>{t(tc.label)}</span>
          </button>
        ))}
      </nav>

      {/* ===== Bài tập: sức mạnh / khởi động / cardio ===== */}
      {isExerciseTab && (
        <div>
          <div className="kb-cats">
            {activeSubCats.map((sc) => (
              <CategoryTile key={sc.key} item={sc} count={subCategoryCounts[sc.key] ?? 0} active={subCategory === sc.key}
                onClick={() => setSubCategory(sc.key)} />
            ))}
          </div>

          <div className="kb-toolbar">
            <div className="kb-search">
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder={
                  currentTab === 'exercises'
                    ? t('Tìm theo tên bài tập, tên tiếng Anh, dụng cụ...')
                    : currentTab === 'warmup'
                      ? t('Tìm bài khởi động khớp, cơ, kích hoạt...')
                      : t('Tìm bài cardio, HIIT, máy chạy...')
                }
              />
            </div>
            <Button variant={activeFilterCount > 0 ? 'primary' : 'secondary'} size="sm" icon="filter" onClick={() => setFilterModalOpen(true)}>
              {activeFilterCount > 0 ? t('Bộ lọc ({n})', { n: activeFilterCount }) : t('Bộ lọc')}
            </Button>
            <Button variant={mapOpen ? 'primary' : 'secondary'} size="sm" icon="target" onClick={() => setMapOpen(!mapOpen)}>
              {mapOpen ? t('Ẩn bản đồ cơ') : t('Lọc theo bản đồ cơ')}
            </Button>
          </div>

          {activeFilterCount > 0 && (
            <div className="kb-filter-row">
              {muscle && chip(t('Vùng cơ: {m}', { m: muscleLabelOf(muscle) }), () => setMuscle(null))}
              {equip && chip(t('Dụng cụ: {eq}', { eq: formatEquipment(equip) }), () => setEquip(''))}
              {level && chip(t('Cấp độ: {level}', { level: levelLabel[level] ? levelLabel[level][0] : level }), () => setLevel(''))}
              {location && chip(t('Địa điểm: {loc}', { loc: locationLabel[location] }), () => setLocation(''))}
              {favoriteOnly && chip(t('Đã yêu thích'), () => setFavoriteOnly(false))}
              {assignedOnly && chip(t('Được giao'), () => setAssignedOnly(false))}
              {showHidden && chip(t('Bài đang ẩn'), () => setShowHidden(false), 'warn')}
              {sort !== 'name' && chip(t(SORTS.find((s) => s.value === sort)?.label ?? ''), () => setSort('name'))}
              <button type="button" className="kb-clear" onClick={handleClearAllFilters}>{t('Xoá tất cả bộ lọc')}</button>
            </div>
          )}

          {mapOpen && (
            <div className="kb-mapfilter animate-fade-in">
              <MuscleMap size="lg" counts={muscleCounts} selected={muscle} onSelect={(k) => setMuscle(k)} />
              <div className="kb-mapfilter-side">
                <span className="kb-eyebrow">{t('Lọc nhanh')}</span>
                <h3>{muscle ? muscleLabelOf(muscle) : t('Chọn nhóm cơ trên bản đồ để lọc nhanh')}</h3>
                <p className="small muted">{t('Vùng tô đậm có nhiều bài hơn. Vùng mờ chưa có bài trong mục này.')}</p>
                {muscle && <Button variant="ghost" size="sm" onClick={() => setMuscle(null)}>{t('Bỏ chọn vùng cơ')}</Button>}
              </div>
            </div>
          )}

          <div className="kb-count">
            <b>{sortedExercises.length}</b> {t('bài tập')}
          </div>

          {exercisesLoading ? (
            <LoadingBlock rows={6} />
          ) : exercisesError ? (
            <ErrorState message={exercisesError} onRetry={reloadExercises} />
          ) : sortedExercises.length === 0 ? (
            <Empty
              icon="dumbbell"
              title={t('Không tìm thấy bài tập nào')}
              desc={t('Thử thay đổi từ khoá tìm kiếm hoặc bỏ bớt các tiêu chí lọc bên trên.')}
              action={<Button variant="secondary" size="sm" onClick={handleClearAllFilters}>{t('Xoá tất cả bộ lọc')}</Button>}
            />
          ) : isBrowsingAll ? (
            <div className="kb-sections">
              {activeSubCats.filter((sc) => sc.key !== '').map((sc) => {
                const items = sortedExercises.filter((e) => e.subCategory === sc.key);
                if (items.length === 0) return null;
                return (
                  <section key={sc.key}>
                    <SectionHead item={sc} count={items.length} onMore={() => { setSubCategory(sc.key); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                    <div className="kb-ex-grid">{items.slice(0, 4).map(card)}</div>
                  </section>
                );
              })}
            </div>
          ) : (
            <>
              <div className="kb-ex-grid">{pagedExercises.items.map(card)}</div>
              {pagedExercises.totalPages > 1 && (
                <div className="mt-20">
                  <Pager page={pagedExercises.page} totalPages={pagedExercises.totalPages} total={sortedExercises.length} onPage={pagedExercises.setPage} />
                </div>
              )}
            </>
          )}

          <p className="kb-credit">{mediaCredit()}</p>

          {filterModalOpen && (
            <Modal
              title={t('Bộ lọc bài tập')}
              onClose={() => setFilterModalOpen(false)}
              size="narrow"
              footer={
                <div className="row between" style={{ width: '100%' }}>
                  <Button variant="ghost" size="sm" onClick={handleClearAllFilters}>{t('Đặt lại bộ lọc')}</Button>
                  <Button variant="primary" size="sm" onClick={() => setFilterModalOpen(false)}>{t('Áp dụng')}</Button>
                </div>
              }
            >
              <div className="flow" style={{ gap: 14 }}>
                <div>
                  <label className="tiny faint font-bold uppercase mb-4" style={{ display: 'block' }}>{t('Cấp độ')}</label>
                  <div className="kb-seg">
                    {(['', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lv) => (
                      <button key={lv} type="button" className={level === lv ? 'active' : ''} onClick={() => setLevel(lv)}>
                        {lv ? levelLabel[lv][0] : t('Tất cả')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="tiny faint font-bold uppercase mb-4" style={{ display: 'block' }}>{t('Địa điểm tập')}</label>
                  <select className="input input-sm" style={{ width: '100%' }} value={location} onChange={(e) => setLocation(e.target.value as '' | ExerciseLocation)}>
                    <option value="">{t('Mọi địa điểm')}</option>
                    {LOCATIONS.map((loc) => <option key={loc} value={loc}>{locationLabel[loc]}</option>)}
                  </select>
                </div>

                <div>
                  <label className="tiny faint font-bold uppercase mb-4" style={{ display: 'block' }}>{t('Sắp xếp theo')}</label>
                  <select className="input input-sm" style={{ width: '100%' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{t(s.label)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="tiny faint font-bold uppercase mb-4" style={{ display: 'block' }}>{t('Dụng cụ tập')}</label>
                  <select className="input input-sm" style={{ width: '100%' }} value={equip} onChange={(e) => setEquip(e.target.value)}>
                    <option value="">{t('Tất cả dụng cụ')}</option>
                    {EQUIPMENT.map((item) => <option key={item.key} value={item.label}>{lang === 'en' ? item.labelEn : item.label}</option>)}
                  </select>
                </div>

                {isMember && (
                  <div className="flow pt-6" style={{ gap: 8, borderTop: '1px solid var(--hairline-soft)' }}>
                    <label className="checkbox-label small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={favoriteOnly} onChange={(e) => setFavoriteOnly(e.target.checked)} />
                      <Icon name="heart" size={14} className={favoriteOnly ? 'primary' : 'muted'} />
                      <span>{t('Chỉ xem bài tập yêu thích')}</span>
                    </label>
                    <label className="checkbox-label small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={assignedOnly} onChange={(e) => setAssignedOnly(e.target.checked)} />
                      <Icon name="clipboard" size={14} className={assignedOnly ? 'primary' : 'muted'} />
                      <span>{t('Bài được Trainer giao')}</span>
                    </label>
                  </div>
                )}

                {isStaff && (
                  <div className="pt-6" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                    <label className="checkbox-label small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
                      <span>{t('Hiện bài tập đang ẩn')}</span>
                    </label>
                  </div>
                )}
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ===== Bản đồ cơ ===== */}
      {currentTab === 'muscles' && (
        <MuscleAtlas
          muscles={musclesData ?? []}
          selected={selectedMuscleKey}
          onSelect={setSelectedMuscleKey}
          hover={hoverMuscle}
          onHover={setHoverMuscle}
          detail={muscleDetail}
          detailLoading={muscleDetailLoading}
        />
      )}

      {/* ===== Dụng cụ & thiết bị ===== */}
      {currentTab === 'equipment' && (
        <div>
          <div className="kb-pills">
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <button key={cat.key} type="button" className={`kb-pill ${equipmentCategory === cat.key ? 'active' : ''}`} onClick={() => setEquipmentCategory(cat.key)}>
                {t(cat.label)}
              </button>
            ))}
          </div>

          <div className="kb-toolbar">
            <div className="kb-search">
              <SearchInput value={q} onChange={setQ} placeholder={t('Tìm kiếm thiết bị, máy tập, thanh đòn...')} />
            </div>
          </div>

          {equipmentLoading ? (
            <LoadingBlock rows={6} />
          ) : (
            <div className="kb-ex-grid">
              {(equipmentData ?? [])
                .filter((eq) => !equipmentCategory || eq.category === equipmentCategory)
                .filter((eq) => !q.trim() || fold(eq.name).includes(fold(q.trim())) || (eq.shortDesc && fold(eq.shortDesc).includes(fold(q.trim()))))
                .map((eq) => {
                  const eqEn = EQUIPMENT_BY_KEY.get(eq.key as EquipmentKey)?.labelEn;
                  const title = lang === 'en' && eqEn ? eqEn : t(eq.name);
                  const sub = lang === 'en' ? (eq.name !== title ? eq.name : null) : eqEn;
                  const catItem = EQUIPMENT_CATEGORIES.find((c) => c.key === eq.category);
                  const targets = (eq.targetMuscleKeys ?? []).filter(isMuscleKey);
                  return (
                    <Link key={eq.key} to={`/equipment/${eq.key}`} className="kb-ex-card" aria-label={title}>
                      <div className="kb-ex-media">
                        <ExerciseMedia imageKey={eq.imageKey} alt={title} playOnHover
                          fallback={<div className="kb-ex-fallback"><MuscleMap size="sm" primary={targets} /></div>} />
                        <span className="kb-level">{catItem ? t(catItem.label) : eq.category}</span>
                      </div>
                      <div className="kb-ex-body">
                        <h3 className="kb-ex-title line-clamp-1">{title}</h3>
                        {sub && <div className="kb-ex-sub line-clamp-1">{sub}</div>}
                        {eq.shortDesc && <p className="small muted line-clamp-2" style={{ margin: 0 }}>{t(eq.shortDesc)}</p>}
                        <div className="kb-ex-foot">
                          <span className="kb-ex-eq"><Icon name="dumbbell" size={13} />{t('{n} bài tập sử dụng', { n: eq.exerciseCount ?? 0 })}</span>
                          <span className="kb-ex-dose">{t('Xem hướng dẫn')}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ===== Hướng dẫn tập luyện ===== */}
      {currentTab === 'guides' && (
        <div>
          <div className="kb-toolbar">
            <div className="kb-search">
              <SearchInput value={q} onChange={setQ} placeholder={t('Tìm kiếm cẩm nang kỹ thuật, cách dùng máy, an toàn...')} />
            </div>
          </div>

          {guidesLoading ? (
            <LoadingBlock rows={6} />
          ) : (
            <div className="guide-grid-layout">
              {(guidesData ?? [])
                .filter((a) => !q.trim() || fold(t(a.title)).includes(fold(q.trim())) || fold(a.titleEn ?? '').includes(fold(q.trim())) || fold(a.title).includes(fold(q.trim())) || fold(t(a.summary)).includes(fold(q.trim())) || fold(a.summaryEn ?? '').includes(fold(q.trim())) || fold(a.summary).includes(fold(q.trim())))
                .map((art) => (
                  <article key={art.id} className="guide-card" onClick={() => setSelectedArticle(art)}>
                    <div className="row between mb-8">
                      <Badge tone="blue">{t(articleCategoryLabel[art.category] ?? art.category)}</Badge>
                      <span className="tiny faint">{fmtDateTime(art.publishedAt)}</span>
                    </div>
                    <h3 className="font-bold mb-8" style={{ fontSize: 17, lineHeight: 1.3 }}>{localizeText(art.titleEn, art.title)}</h3>
                    <p className="small muted mb-12 line-clamp-3" style={{ margin: 0, flex: 1 }}>{localizeText(art.summaryEn, art.summary)}</p>
                    <div className="row between pt-10" style={{ borderTop: '1px solid var(--hairline-soft)', alignItems: 'center' }}>
                      <span className="tiny faint">{art.authorName || 'GymFlow Team'}</span>
                      <span className="small primary font-bold">{t('Đọc hướng dẫn')} →</span>
                    </div>
                  </article>
                ))}
            </div>
          )}

          {selectedArticle && (
            <Modal title={localizeText(selectedArticle.titleEn, selectedArticle.title)} onClose={() => setSelectedArticle(null)}>
              <div className="flow" style={{ gap: 14 }}>
                <div className="row between" style={{ alignItems: 'center' }}>
                  <Badge tone="blue">{t(articleCategoryLabel[selectedArticle.category] ?? selectedArticle.category)}</Badge>
                  <span className="tiny faint">{fmtDateTime(selectedArticle.publishedAt)}</span>
                </div>
                <p className="font-bold muted" style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>{localizeText(selectedArticle.summaryEn, selectedArticle.summary)}</p>
                <div className="article-body mt-12" style={{ whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: 15 }}>{localizeText(selectedArticle.bodyEn, selectedArticle.body)}</div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}

