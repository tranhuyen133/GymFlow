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
import { ExerciseMedia } from '../../components/ExerciseMedia';
import { MuscleMap } from '../../components/MuscleMap';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import {
  Badge,
  Button,
  Empty,
  ErrorState,
  LoadingBlock,
  Modal,
  PageHead,
  Pager,
  SearchInput,
} from '../../components/ui';
import {
  fmtDateTime,
  levelLabel,
  locationLabel,
} from '../../lib/format';
import { errMsg, useAsync, useDebounced, usePaged } from '../../lib/hooks';
import { t } from '../../i18n';
import './exercises.css';
import './kb.css';
import './knowledge.css';
import {
  isMuscleKey,
  MUSCLE_BY_KEY,
  type MuscleKey
} from '../../lib/anatomy';

export type KnowledgeTab = 'exercises' | 'warmup' | 'cardio' | 'equipment' | 'muscles' | 'guides';

const TAB_CONFIGS: { key: KnowledgeTab; label: string; icon: any }[] = [
  { key: 'exercises', label: 'Thư viện bài tập', icon: 'dumbbell' },
  { key: 'warmup', label: 'Khởi động', icon: 'repeat' },
  { key: 'cardio', label: 'Cardio', icon: 'activity' },
  { key: 'equipment', label: 'Dụng cụ & Thiết bị', icon: 'zap' },
  { key: 'muscles', label: 'Kiến thức nhóm cơ', icon: 'target' },
  { key: 'guides', label: 'Hướng dẫn tập luyện', icon: 'info' },
];

const STRENGTH_SUBCATS = ['Tất cả', 'Ngực', 'Lưng', 'Vai', 'Tay trước', 'Tay sau', 'Bụng', 'Chân', 'Mông', 'Toàn thân'];
const WARMUP_SUBCATS = ['Tất cả', 'Khởi động toàn thân', 'Khởi động vai', 'Khởi động hông', 'Khởi động đầu gối', 'Xoay khớp', 'Dynamic Stretching', 'Kích hoạt nhóm cơ'];
const CARDIO_SUBCATS = ['Tất cả', 'Chạy bộ', 'Đi bộ', 'Đạp xe', 'Nhảy dây', 'Máy chèo thuyền', 'Elliptical', 'Stair Climber', 'HIIT', 'Cường độ thấp', 'Cường độ cao'];

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
  const isMember = user?.role === 'MEMBER';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TRAINER';
  const toast = useToast();

  const [params, setParams] = useSearchParams();
  const currentTab = (params.get('tab') as KnowledgeTab) || 'exercises';

  // State bộ lọc bài tập
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [subCategory, setSubCategory] = useState<string>(() => params.get('sub') ?? 'Tất cả');
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
  const [mapOpen, setMapOpen] = useState(false);

  // Dụng cụ tab state
  const [equipmentCategory, setEquipmentCategory] = useState<EquipmentCategory | ''>('');

  // Modals & Details
  const [selectedMuscleKey, setSelectedMuscleKey] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const dq = useDebounced(q);

  // Đồng bộ URL params
  useEffect(() => {
    const next = new URLSearchParams();
    next.set('tab', currentTab);
    if (dq) next.set('q', dq);
    if (subCategory && subCategory !== 'Tất cả') next.set('sub', subCategory);
    if (level) next.set('level', level);
    if (location) next.set('location', location);
    if (favoriteOnly) next.set('fav', 'true');
    if (assignedOnly) next.set('assigned', 'true');
    if (showHidden) next.set('hidden', 'true');
    if (muscle) next.set('muscle', muscle);
    if (equip) next.set('equipment', equip);
    setParams(next, { replace: true });
  }, [currentTab, dq, subCategory, level, location, favoriteOnly, assignedOnly, showHidden, muscle, equip, setParams]);

  // Xác định exerciseType theo tab
  const activeExerciseType: ExerciseType | null = useMemo(() => {
    if (currentTab === 'exercises') return 'STRENGTH';
    if (currentTab === 'warmup') return 'WARMUP';
    if (currentTab === 'cardio') return 'CARDIO';
    return null;
  }, [currentTab]);

  // Load danh sách bài tập cho Tab A, B, C
  const { data: exercisesData, loading: exercisesLoading, error: exercisesError, reload: reloadExercises } = useAsync(
    () => {
      if (!activeExerciseType) return Promise.resolve<Exercise[]>([]);
      return api.get<Exercise[]>('/exercises', {
        q: dq,
        exerciseType: activeExerciseType,
        subCategory: subCategory !== 'Tất cả' ? subCategory : undefined,
        muscle: muscle || undefined,
        equipment: equip || undefined,
        level: level || undefined,
        location: location || undefined,
        favoriteOnly: favoriteOnly || undefined,
        assignedOnly: assignedOnly || undefined,
        includeHidden: showHidden
      });
    },
    [activeExerciseType, dq, subCategory, muscle, equip, level, location, favoriteOnly, assignedOnly, showHidden]
  );

  // Load danh mục thiết bị cho Tab D & filter options
  const { data: equipmentData, loading: equipmentLoading } = useAsync(
    () => api.get<Equipment[]>('/equipment', { includeHidden: isStaff && showHidden }),
    [isStaff, showHidden]
  );

  // Load nhóm cơ cho Tab E
  const { data: musclesData } = useAsync(
    () => api.get<MuscleSummary[]>('/muscles'),
    []
  );

  // Load chi tiết nhóm cơ khi chọn
  const { data: muscleDetail, loading: muscleDetailLoading } = useAsync(
    () => selectedMuscleKey ? api.get<MuscleDetail>(`/muscles/${selectedMuscleKey}`) : Promise.resolve(null),
    [selectedMuscleKey]
  );

  // Load bài viết hướng dẫn cho Tab F
  const { data: guidesData, loading: guidesLoading } = useAsync(
    () => api.get<Article[]>('/articles/public'),
    []
  );

  // Phân trang bài tập
  const sortedExercises = useMemo(() => {
    const list = [...(exercisesData ?? [])];
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    if (sort === 'updated') list.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    if (sort === 'usage') list.sort((a, b) => b.usageCount - a.usageCount);
    return list;
  }, [exercisesData, sort]);

  const pagedExercises = usePaged(sortedExercises, 'knowledge-exercises-page', [currentTab, subCategory, dq, level, location, sort], 12);

  // Thao tác yêu thích bài tập
  const toggleFavorite = async (e: Exercise, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isMember) return;
    try {
      const res = await api.post<{ isFavorite: boolean; favoriteCount: number; message: string }>(`/exercises/${e.id}/favorite`);
      toast.success(t(res.isFavorite ? 'Đã lưu vào bài tập yêu thích' : 'Đã bỏ lưu khỏi bài tập yêu thích'));
      void reloadExercises();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  // Chuyển tab
  const handleTabChange = (tab: KnowledgeTab) => {
    setParams({ tab }, { replace: true });
    setSubCategory('Tất cả');
    setQ('');
    setFavoriteOnly(false);
    setAssignedOnly(false);
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={t('Trung tâm huấn luyện')}
        title={t('Kho kiến thức')}
        desc={t('Hệ thống thư viện bài tập, giáo án khởi động, cardio, hướng dẫn sử dụng thiết bị và bản đồ giải phẫu cơ bắp toàn diện.')}
      />

      {/* Thanh 6 Tab điều hướng */}
      <nav className="knowledge-tabs" aria-label={t('Danh mục kho kiến thức')}>
        {TAB_CONFIGS.map((tConfig) => (
          <button
            key={tConfig.key}
            type="button"
            className={`knowledge-tab-btn ${currentTab === tConfig.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tConfig.key)}
          >
            <Icon name={tConfig.icon} size={16} />
            <span>{t(tConfig.label)}</span>
          </button>
        ))}
      </nav>

      {/* ========================================================================= */}
      {/* TAB A, B, C: BÀI TẬP (STRENGTH / WARMUP / CARDIO)                          */}
      {/* ========================================================================= */}
      {(currentTab === 'exercises' || currentTab === 'warmup' || currentTab === 'cardio') && (
        <div>
          {/* Subcategory Strip */}
          <div className="knowledge-sub-strip">
            {(currentTab === 'exercises' ? STRENGTH_SUBCATS : currentTab === 'warmup' ? WARMUP_SUBCATS : CARDIO_SUBCATS).map((sub) => (
              <button
                key={sub}
                type="button"
                className={`sub-pill ${subCategory === sub ? 'active' : ''}`}
                onClick={() => setSubCategory(sub)}
              >
                {t(sub)}
              </button>
            ))}
          </div>

          {/* Hàng tìm kiếm và lọc */}
          <div className="card p-16 mb-16">
            <div className="row wrap between" style={{ gap: 12, alignItems: 'center' }}>
              <div style={{ flex: '1 1 280px', minWidth: 240 }}>
                <SearchInput
                  value={q}
                  onChange={setQ}
                  placeholder={t('Tìm theo tên bài tập, tên tiếng Anh, dụng cụ...')}
                />
              </div>

              <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
                <select
                  className="input input-sm"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as '' | Level)}
                  aria-label={t('Cấp độ')}
                >
                  <option value="">{t('Tất cả cấp độ')}</option>
                  <option value="BEGINNER">{t('Người mới')}</option>
                  <option value="INTERMEDIATE">{t('Trung cấp')}</option>
                  <option value="ADVANCED">{t('Nâng cao')}</option>
                </select>

                <select
                  className="input input-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value as '' | ExerciseLocation)}
                  aria-label={t('Địa điểm')}
                >
                  <option value="">{t('Mọi địa điểm')}</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{t(locationLabel[loc])}</option>
                  ))}
                </select>

                <select
                  className="input input-sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  aria-label={t('Sắp xếp')}
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>{t(s.label)}</option>
                  ))}
                </select>

                <Button
                  variant={mapOpen ? 'primary' : 'secondary'}
                  size="sm"
                  icon="target"
                  onClick={() => setMapOpen(!mapOpen)}
                >
                  {mapOpen ? t('Ẩn bản đồ cơ') : t('Bản đồ cơ')}
                </Button>
              </div>
            </div>

            {/* Bộ lọc đặc quyền cho Member & Staff */}
            <div className="row wrap mt-12 pt-12" style={{ gap: 12, borderTop: '1px solid var(--hairline-soft)', alignItems: 'center' }}>
              {isMember && (
                <>
                  <label className="checkbox-label small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={favoriteOnly}
                      onChange={(e) => setFavoriteOnly(e.target.checked)}
                    />
                    <Icon name="trophy" size={14} className={favoriteOnly ? 'primary' : 'muted'} />
                    <span>{t('Chỉ xem bài tập yêu thích')}</span>
                  </label>

                  <label className="checkbox-label small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={assignedOnly}
                      onChange={(e) => setAssignedOnly(e.target.checked)}
                    />
                    <Icon name="clipboard" size={14} className={assignedOnly ? 'primary' : 'muted'} />
                    <span>{t('Bài được Trainer giao')}</span>
                  </label>
                </>
              )}

              {isStaff && (
                <label className="checkbox-label small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showHidden}
                    onChange={(e) => setShowHidden(e.target.checked)}
                  />
                  <span>{t('Hiện bài tập đang ẩn')}</span>
                </label>
              )}

              {muscle && (
                <span className="badge badge-sm badge-blue">
                  {t('Vùng cơ: {m}', { m: MUSCLE_BY_KEY.get(muscle)?.label ?? muscle })}
                  <button type="button" onClick={() => setMuscle(null)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </span>
              )}

              {equip && (
                <span className="badge badge-sm badge-blue">
                  {t('Dụng cụ: {eq}', { eq: equip })}
                  <button type="button" onClick={() => setEquip('')} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </span>
              )}
            </div>
          </div>

          {/* Bản đồ cơ giải phẫu thu gọn / mở rộng */}
          {mapOpen && (
            <div className="card p-16 mb-16 animate-fade-in">
              <div className="row between wrap mb-10" style={{ alignItems: 'center' }}>
                <span className="tiny faint uppercase font-bold">{t('Chọn nhóm cơ trên bản đồ để lọc nhanh')}</span>
                {muscle && (
                  <Button variant="ghost" size="sm" onClick={() => setMuscle(null)}>
                    {t('Bỏ chọn vùng cơ')}
                  </Button>
                )}
              </div>
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <MuscleMap
                  selected={muscle}
                  onSelect={(k) => setMuscle(k === muscle ? null : k)}
                />
              </div>
            </div>
          )}

          {/* Lưới bài tập */}
          {exercisesLoading ? (
            <LoadingBlock rows={6} />
          ) : exercisesError ? (
            <ErrorState message={exercisesError} onRetry={reloadExercises} />
          ) : pagedExercises.items.length === 0 ? (
            <Empty
              icon="dumbbell"
              title={t('Không tìm thấy bài tập nào')}
              desc={t('Thử thay đổi từ khoá tìm kiếm hoặc bỏ bớt các tiêu chí lọc bên trên.')}
              action={
                <Button variant="secondary" size="sm" onClick={() => { setQ(''); setSubCategory('Tất cả'); setMuscle(null); setEquip(''); setLevel(''); setFavoriteOnly(false); setAssignedOnly(false); }}>
                  {t('Xoá tất cả bộ lọc')}
                </Button>
              }
            />
          ) : (
            <>
              <div className="kb-grid">
                {pagedExercises.items.map((ex) => (
                  <article key={ex.id} className="kb-card">
                    <Link to={`/exercises/${ex.id}`} className="kb-cover" aria-label={t(ex.name)}>
                      <ExerciseMedia
                        imageKey={ex.imageKey}
                        alt={t(ex.name)}
                        playOnHover
                        tag={levelLabel[ex.level] ? t(levelLabel[ex.level][0]) : ex.level}
                      />
                    </Link>

                    <div className="kb-body">
                      <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <h3 className="kb-title">
                            <Link to={`/exercises/${ex.id}`} className="plain-link">
                              {t(ex.name)}
                            </Link>
                          </h3>
                          {ex.nameEn && <div className="tiny faint">{ex.nameEn}</div>}
                        </div>

                        {/* Nút yêu thích dành cho Member */}
                        {isMember && (
                          <button
                            type="button"
                            className={`fav-toggle-btn ${ex.isFavorite ? 'is-fav' : ''}`}
                            onClick={(e) => toggleFavorite(ex, e)}
                            title={t(ex.isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào bài tập yêu thích')}
                          >
                            <Icon name="trophy" size={15} />
                          </button>
                        )}
                      </div>

                      {ex.subCategory && (
                        <div>
                          <span className="badge badge-sm" style={{ background: 'var(--rail)', color: 'var(--muted)' }}>
                            {t(ex.subCategory)}
                          </span>
                        </div>
                      )}

                      {ex.description && (
                        <p className="small muted line-clamp-2" style={{ margin: 0 }}>
                          {ex.description}
                        </p>
                      )}

                      <div className="row between mt-auto pt-8" style={{ borderTop: '1px solid var(--hairline-soft)', alignItems: 'center' }}>
                        <div className="row wrap" style={{ gap: 4 }}>
                          {ex.equipment && (
                            <span className="tiny faint">
                              {ex.equipment}
                            </span>
                          )}
                        </div>

                        <Link to={`/exercises/${ex.id}`} className="btn btn-secondary btn-sm">
                          <span>{t('Chi tiết')}</span>
                          <Icon name="arrowRight" size={13} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {pagedExercises.totalPages > 1 && (
                <div className="mt-20">
                  <Pager page={pagedExercises.page} totalPages={pagedExercises.totalPages} total={sortedExercises.length} onPage={pagedExercises.setPage} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB D: DỤNG CỤ & THIẾT BỊ                                                  */}
      {/* ========================================================================= */}
      {currentTab === 'equipment' && (
        <div>
          <div className="knowledge-sub-strip">
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`sub-pill ${equipmentCategory === cat.key ? 'active' : ''}`}
                onClick={() => setEquipmentCategory(cat.key)}
              >
                {t(cat.label)}
              </button>
            ))}
          </div>

          <div className="card p-16 mb-16">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder={t('Tìm kiếm thiết bị, máy tập, thanh đòn...')}
            />
          </div>

          {equipmentLoading ? (
            <LoadingBlock rows={6} />
          ) : (
            <div className="kb-grid">
              {(equipmentData ?? [])
                .filter((eq) => !equipmentCategory || eq.category === equipmentCategory)
                .filter((eq) => !q.trim() || fold(eq.name).includes(fold(q.trim())) || (eq.shortDesc && fold(eq.shortDesc).includes(fold(q.trim()))))
                .map((eq) => (
                  <article key={eq.key} className="kb-card">
                    <Link to={`/equipment/${eq.key}`} className="kb-cover" aria-label={t(eq.name)}>
                      <ExerciseMedia
                        imageKey={eq.imageKey}
                        alt={t(eq.name)}
                        playOnHover
                      />
                    </Link>

                    <div className="kb-body">
                      <div>
                        <h3 className="kb-title">
                          <Link to={`/equipment/${eq.key}`} className="plain-link">
                            {t(eq.name)}
                          </Link>
                        </h3>
                        <span className="tiny faint">{eq.exerciseCount ?? 0} {t('bài tập sử dụng')}</span>
                      </div>

                      {eq.shortDesc && (
                        <p className="small muted line-clamp-2" style={{ margin: 0 }}>
                          {eq.shortDesc}
                        </p>
                      )}

                      <div className="row between mt-auto pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                        <Badge tone="blue">{t(eq.category)}</Badge>
                        <Link to={`/equipment/${eq.key}`} className="btn btn-secondary btn-sm">
                          <span>{t('Xem hướng dẫn')}</span>
                          <Icon name="arrowRight" size={13} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB E: KIẾN THỨC NHÓM CƠ                                                  */}
      {/* ========================================================================= */}
      {currentTab === 'muscles' && (
        <div>
          <div className="card p-20 mb-20">
            <h2 className="section-title mb-12">
              <Icon name="target" size={18} className="primary" />
              <span>{t('Bản đồ giải phẫu hệ cơ bắp')}</span>
            </h2>
            <p className="muted small mb-16">
              {t('Chọn bất kỳ nhóm cơ nào trên mô hình hoặc danh sách bên dưới để khám phá vị trí giải phẫu, chức năng vận động và các bài tập phát triển tối ưu.')}
            </p>
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <MuscleMap
                selected={selectedMuscleKey as MuscleKey}
                onSelect={(k) => setSelectedMuscleKey(k)}
              />
            </div>
          </div>

          <div className="muscle-grid-layout">
            {(musclesData ?? []).map((m) => (
              <div
                key={m.key}
                className="muscle-card"
                onClick={() => setSelectedMuscleKey(m.key)}
              >
                <div className="row between mb-8" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="font-bold" style={{ margin: 0, fontSize: 16 }}>{t(m.name)}</h3>
                    <span className="tiny faint">{m.nameEn}</span>
                  </div>
                  <Badge tone="blue">{t(m.view === 'front' ? 'Mặt trước' : m.view === 'back' ? 'Mặt sau' : 'Hai mặt')}</Badge>
                </div>

                <p className="small muted mb-12 line-clamp-2" style={{ margin: 0 }}>
                  {m.hint}
                </p>

                <div className="row between pt-8" style={{ borderTop: '1px solid var(--hairline-soft)', alignItems: 'center' }}>
                  <span className="tiny font-bold primary">{m.exerciseCount} {t('bài tập')}</span>
                  <span className="small faint">
                    {t('Xem giải phẫu')} →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal chi tiết nhóm cơ */}
          {selectedMuscleKey && (
            <Modal
              title={muscleDetail ? `${muscleDetail.name} (${muscleDetail.nameEn})` : t('Đang tải...')}
              onClose={() => setSelectedMuscleKey(null)}
            >
              {muscleDetailLoading || !muscleDetail ? (
                <LoadingBlock rows={6} />
              ) : (
                <div className="flow" style={{ gap: 16 }}>
                  <div>
                    <h4 className="tiny faint uppercase font-bold mb-6">{t('Vị trí & Chức năng giải phẫu')}</h4>
                    <p style={{ lineHeight: 1.6, margin: 0 }}>{muscleDetail.description}</p>
                  </div>

                  <div>
                    <h4 className="tiny faint uppercase font-bold mb-8">
                      {t('Bài tập tác động chính ({n})', { n: muscleDetail.primaryExercises.length })}
                    </h4>
                    <div className="row wrap" style={{ gap: 8 }}>
                      {muscleDetail.primaryExercises.slice(0, 6).map((pe) => (
                        <Link
                          key={pe.id}
                          to={`/exercises/${pe.id}`}
                          className="chip chip-primary"
                          style={{ textDecoration: 'none' }}
                        >
                          <Icon name="dumbbell" size={13} className="mr-4" />
                          <span>{pe.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {muscleDetail.secondaryExercises.length > 0 && (
                    <div>
                      <h4 className="tiny faint uppercase font-bold mb-8">
                        {t('Bài tập tác động bổ trợ ({n})', { n: muscleDetail.secondaryExercises.length })}
                      </h4>
                      <div className="row wrap" style={{ gap: 8 }}>
                        {muscleDetail.secondaryExercises.slice(0, 6).map((se) => (
                          <Link
                            key={se.id}
                            to={`/exercises/${se.id}`}
                            className="chip"
                            style={{ textDecoration: 'none' }}
                          >
                            <span>{se.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {muscleDetail.commonEquipment.length > 0 && (
                    <div>
                      <h4 className="tiny faint uppercase font-bold mb-8">{t('Dụng cụ thường dùng')}</h4>
                      <div className="row wrap" style={{ gap: 8 }}>
                        {muscleDetail.commonEquipment.map((eq) => (
                          <Link
                            key={eq.key}
                            to={`/equipment/${eq.key}`}
                            className="chip"
                            style={{ textDecoration: 'none' }}
                          >
                            <Icon name="zap" size={13} className="mr-4" />
                            <span>{eq.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Modal>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F: HƯỚNG DẪN TẬP LUYỆN                                                */}
      {/* ========================================================================= */}
      {currentTab === 'guides' && (
        <div>
          <div className="card p-16 mb-16">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder={t('Tìm kiếm cẩm nang kỹ thuật, cách dùng máy, an toàn...')}
            />
          </div>

          {guidesLoading ? (
            <LoadingBlock rows={6} />
          ) : (
            <div className="guide-grid-layout">
              {(guidesData ?? [])
                .filter((a) => !q.trim() || fold(a.title).includes(fold(q.trim())) || fold(a.summary).includes(fold(q.trim())))
                .map((art) => (
                  <article
                    key={art.id}
                    className="guide-card"
                    onClick={() => setSelectedArticle(art)}
                  >
                    <div className="row between mb-8">
                      <Badge tone="blue">{t(art.category)}</Badge>
                      <span className="tiny faint">{fmtDateTime(art.publishedAt)}</span>
                    </div>

                    <h3 className="font-bold mb-8" style={{ fontSize: 17, lineHeight: 1.3 }}>
                      {t(art.title)}
                    </h3>

                    <p className="small muted mb-12 line-clamp-3" style={{ margin: 0, flex: 1 }}>
                      {art.summary}
                    </p>

                    <div className="row between pt-10" style={{ borderTop: '1px solid var(--hairline-soft)', alignItems: 'center' }}>
                      <span className="tiny faint">{art.authorName || 'GymFlow Team'}</span>
                      <span className="small primary font-bold">{t('Đọc hướng dẫn')} →</span>
                    </div>
                  </article>
                ))}
            </div>
          )}

          {/* Modal đọc bài viết hướng dẫn */}
          {selectedArticle && (
            <Modal
              title={selectedArticle.title}
              onClose={() => setSelectedArticle(null)}
            >
              <div className="flow" style={{ gap: 14 }}>
                <div className="row between" style={{ alignItems: 'center' }}>
                  <Badge tone="blue">{t(selectedArticle.category)}</Badge>
                  <span className="tiny faint">{fmtDateTime(selectedArticle.publishedAt)}</span>
                </div>
                <p className="font-bold muted" style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>
                  {selectedArticle.summary}
                </p>
                <div
                  className="article-body mt-12"
                  style={{ whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: 15 }}
                >
                  {selectedArticle.body}
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}