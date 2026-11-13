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
import { Icon, type IconName } from '../../components/Icon';
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
  articleCategoryLabel,
  exSub,
  exTitle,
  fmtDateTime,
  formatEquipment,
  levelLabel,
  locationLabel,
  muscleLabel,
} from '../../lib/format';
import { errMsg, useAsync, useDebounced, usePaged } from '../../lib/hooks';
import { localizeExercise } from '../../lib/exercise';
import { getLang, t, useLang } from '../../i18n';
import './exercises.css';
import './kb.css';
import './knowledge.css';
import {
  EQUIPMENT,
  EQUIPMENT_BY_KEY,
  isMuscleKey,
  MUSCLE_BY_KEY,
  type EquipmentKey,
  type MuscleKey,
} from '../../lib/anatomy';

export type KnowledgeTab = 'exercises' | 'warmup' | 'cardio' | 'equipment' | 'muscles' | 'guides';

const TAB_CONFIGS: { key: KnowledgeTab; label: string; icon: IconName }[] = [
  { key: 'exercises', label: 'Thư viện bài tập', icon: 'dumbbell' },
  { key: 'warmup', label: 'Khởi động', icon: 'repeat' },
  { key: 'cardio', label: 'Cardio', icon: 'activity' },
  { key: 'equipment', label: 'Dụng cụ & Thiết bị', icon: 'zap' },
  { key: 'muscles', label: 'Kiến thức nhóm cơ', icon: 'target' },
  { key: 'guides', label: 'Hướng dẫn tập luyện', icon: 'info' },
];

interface SubCategoryItem {
  key: string;
  label: string;
}

const STRENGTH_SUBCATS: SubCategoryItem[] = [
  { key: '', label: 'Tất cả' },
  { key: 'CHEST', label: 'Ngực' },
  { key: 'BACK', label: 'Lưng' },
  { key: 'SHOULDERS', label: 'Vai' },
  { key: 'BICEPS', label: 'Tay trước' },
  { key: 'TRICEPS', label: 'Tay sau' },
  { key: 'CORE', label: 'Bụng' },
  { key: 'LEGS', label: 'Chân' },
  { key: 'GLUTES', label: 'Mông' },
  { key: 'FULL_BODY', label: 'Toàn thân' },
];

const WARMUP_SUBCATS: SubCategoryItem[] = [
  { key: '', label: 'Tất cả' },
  { key: 'FULL_BODY_WARMUP', label: 'Khởi động chung' },
  { key: 'SHOULDER_WARMUP', label: 'Kích hoạt vai & ngực' },
  { key: 'HIP_WARMUP', label: 'Kích hoạt mông & hông' },
  { key: 'KNEE_WARMUP', label: 'Khởi động khớp gối' },
  { key: 'JOINT_ROTATION', label: 'Xoay khớp' },
  { key: 'DYNAMIC_STRETCH', label: 'Giãn cơ động' },
  { key: 'MUSCLE_ACTIVATION', label: 'Kích hoạt cơ bắp' },
];

const CARDIO_SUBCATS: SubCategoryItem[] = [
  { key: '', label: 'Tất cả' },
  { key: 'RUNNING', label: 'Chạy bộ' },
  { key: 'WALKING', label: 'Đi bộ' },
  { key: 'CYCLING', label: 'Đạp xe' },
  { key: 'JUMP_ROPE', label: 'Nhảy dây' },
  { key: 'ROWING', label: 'Máy chèo thuyền' },
  { key: 'STAIR_CLIMBER', label: 'Leo cầu thang' },
  { key: 'HIIT', label: 'HIIT' },
];

const SUBCAT_LABEL: Record<string, string> = {
  // Strength
  CHEST: 'Ngực',
  BACK: 'Lưng',
  SHOULDERS: 'Vai',
  BICEPS: 'Tay trước',
  TRICEPS: 'Tay sau',
  CORE: 'Bụng',
  LEGS: 'Chân',
  GLUTES: 'Mông',
  FULL_BODY: 'Toàn thân',
  // Warmup
  FULL_BODY_WARMUP: 'Khởi động chung',
  SHOULDER_WARMUP: 'Kích hoạt vai & ngực',
  HIP_WARMUP: 'Kích hoạt mông & hông',
  KNEE_WARMUP: 'Khởi động khớp gối',
  JOINT_ROTATION: 'Xoay khớp',
  DYNAMIC_STRETCH: 'Giãn cơ động',
  MUSCLE_ACTIVATION: 'Kích hoạt cơ bắp',
  // Cardio
  RUNNING: 'Chạy bộ',
  WALKING: 'Đi bộ',
  CYCLING: 'Đạp xe',
  JUMP_ROPE: 'Nhảy dây',
  ROWING: 'Máy chèo thuyền',
  STAIR_CLIMBER: 'Leo cầu thang',
  HIIT: 'HIIT',
};

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

function getMuscleIcon(subOrGroup?: string): IconName {
  if (!subOrGroup) return 'dumbbell';
  const s = subOrGroup.toUpperCase();
  if (s === 'CORE') return 'shield';
  if (s === 'BACK') return 'target';
  if (s === 'LEGS' || s === 'GLUTES') return 'flame';
  if (s === 'RUNNING' || s === 'CYCLING' || s === 'ROWING' || s === 'HIIT' || s === 'JUMP_ROPE' || s === 'STAIR_CLIMBER' || s.includes('CARDIO')) return 'activity';
  if (s.includes('WARMUP') || s.includes('ROTATION') || s.includes('STRETCH') || s.includes('ACTIVATION')) return 'zap';
  return 'dumbbell';
}

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
  const [mapOpen, setMapOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

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

  // Xác định exerciseType theo tab
  const activeExerciseType: ExerciseType | null = useMemo(() => {
    if (currentTab === 'exercises') return 'STRENGTH';
    if (currentTab === 'warmup') return 'WARMUP';
    if (currentTab === 'cardio') return 'CARDIO';
    return null;
  }, [currentTab]);

  // Danh sách chip danh mục con cho tab hiện tại
  const activeSubCats: SubCategoryItem[] = useMemo(() => {
    if (currentTab === 'exercises') return STRENGTH_SUBCATS;
    if (currentTab === 'warmup') return WARMUP_SUBCATS;
    if (currentTab === 'cardio') return CARDIO_SUBCATS;
    return [];
  }, [currentTab]);

  // 1. Tải toàn bộ bài tập của tab hiện tại để tính số lượng bài theo từng chip và nhóm section khi chọn "Tất cả"
  const { data: allTabExercises, reload: reloadAllTabExercises } = useAsync(
    () => {
      if (!activeExerciseType) return Promise.resolve<Exercise[]>([]);
      return api.get<Exercise[]>('/exercises', {
        exerciseType: activeExerciseType,
        includeHidden: isStaff && showHidden,
      });
    },
    [activeExerciseType, isStaff, showHidden]
  );

  // 2. Tải danh sách bài tập đã lọc (khi có lọc subCategory, q, muscle, equip, v.v.)
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

  // Tính số lượng bài tập cho từng chip danh mục con
  const subCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const ex of allTabExercises ?? []) {
      total++;
      if (ex.subCategory) {
        counts[ex.subCategory] = (counts[ex.subCategory] ?? 0) + 1;
      }
    }
    counts[''] = total;
    return counts;
  }, [allTabExercises]);

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

  // Sắp xếp bài tập theo tên đang hiển thị
  const sortedExercises = useMemo(() => {
    const list = [...(exercisesData ?? [])];
    if (sort === 'name') {
      list.sort((a, b) => localizeExercise(a, lang).title.localeCompare(localizeExercise(b, lang).title, lang));
    } else if (sort === 'updated') {
      list.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    } else if (sort === 'usage') {
      list.sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
    }
    return list;
  }, [exercisesData, sort, lang]);

  // Đổi bất kỳ bộ lọc nào hoặc đổi ngôn ngữ đều về trang 1
  const pagedExercises = usePaged(
    sortedExercises,
    'knowledge-exercises-page',
    [currentTab, subCategory, dq, level, location, sort, muscle, equip, favoriteOnly, assignedOnly, showHidden, lang],
    12
  );

  // Đếm số lượng bộ lọc đang áp dụng
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

  // Xoá tất cả bộ lọc
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

  // Thao tác yêu thích bài tập
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

  // Chuyển tab
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
  };

  // Khi chọn "Tất cả": hiển thị dạng gom nhóm section theo từng nhóm cơ nếu không có tìm kiếm hay bộ lọc chi tiết
  const isBrowsingAll = !subCategory && !dq && !muscle && !equip && !level && !location && !favoriteOnly && !assignedOnly;

  // Render Card thống nhất
  const renderExerciseCard = (ex: Exercise) => {
    const { title, description, subtitle } = localizeExercise(ex, lang);
    return (
    <Link
      key={ex.id}
      to={`/exercises/${ex.id}`}
      className="kb-card ex-interactive-card"
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
      aria-label={title}
    >
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <ExerciseMedia
          imageKey={ex.imageKey}
          alt={title}
          playOnHover
          fallback={
            <div
              className="ex-media-empty"
              style={{
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--surface-2)) 0%, var(--surface-2) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                color: 'var(--muted)',
                aspectRatio: '16 / 10',
              }}
            >
              <Icon name={getMuscleIcon(ex.subCategory || ex.muscleGroup)} size={30} />
              <span className="tiny font-bold uppercase" style={{ letterSpacing: '0.04em', opacity: 0.85 }}>
                {t((ex.subCategory && SUBCAT_LABEL[ex.subCategory]) ?? ex.subCategory ?? muscleLabel[ex.muscleGroup])}
              </span>
            </div>
          }
        />
        {/* Badge cấp độ tách riêng khỏi ExerciseMedia */}
        <span
          className="badge badge-sm"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 2,
            background: 'rgba(0, 0, 0, 0.72)',
            color: '#fff',
            backdropFilter: 'blur(4px)',
            fontWeight: 600,
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {levelLabel[ex.level] ? levelLabel[ex.level][0] : ex.level}
        </span>
      </div>

      <div className="kb-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="kb-title line-clamp-1" style={{ margin: 0 }}>
              {title}
            </h3>
            {subtitle && <div className="tiny faint line-clamp-1" lang="vi">{subtitle}</div>}
          </div>

          {isMember && (
            <button
              type="button"
              className={`fav-toggle-btn ${ex.isFavorite ? 'is-fav' : ''}`}
              onClick={(e) => toggleFavorite(ex, e)}
              title={t(ex.isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào bài tập yêu thích')}
              aria-label={t(ex.isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào bài tập yêu thích')}
            >
              <Icon name="trophy" size={15} />
            </button>
          )}
        </div>

        {ex.subCategory && (
          <div>
            <span className="badge badge-sm" style={{ background: 'var(--rail)', color: 'var(--ink)' }}>
              {t(SUBCAT_LABEL[ex.subCategory] ?? ex.subCategory)}
            </span>
          </div>
        )}

        {description && (
          <p className="small muted line-clamp-2" style={{ margin: 0, lineHeight: 1.45 }}>
            {description}
          </p>
        )}

        <div className="row between mt-auto pt-8" style={{ borderTop: '1px solid var(--hairline-soft)', alignItems: 'center' }}>
          <div className="row wrap" style={{ gap: 4 }}>
            {ex.equipment && (
              <span className="tiny faint">
                {formatEquipment(ex.equipment)}
              </span>
            )}
          </div>
          <span className="tiny faint primary font-bold" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <Icon name="arrowRight" size={13} />
          </span>
        </div>
      </div>
    </Link>
    );
  };

  const eyebrow = isStaff ? t('Trung tâm huấn luyện') : undefined;

  return (
    <div className="page">
      <PageHead
        eyebrow={eyebrow}
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
          {/* Hàng chip nhóm cơ (cuộn ngang trên mobile) */}
          <div className="knowledge-sub-strip">
            {activeSubCats.map((sc) => {
              const count = subCategoryCounts[sc.key] ?? 0;
              const isZero = sc.key !== '' && count === 0;
              return (
                <button
                  key={sc.key}
                  type="button"
                  className={`sub-pill ${subCategory === sc.key ? 'active' : ''}`}
                  style={isZero ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                  disabled={isZero}
                  onClick={() => setSubCategory(sc.key)}
                >
                  {sc.key === '' ? `${t(sc.label)} (${count})` : `${t(sc.label)} (${count})`}
                </button>
              );
            })}
          </div>

          {/* Một hàng gồm: Ô tìm kiếm, nút "Bộ lọc" và nút "Bản đồ cơ" */}
          <div className="card p-14 mb-16">
            <div className="row wrap between" style={{ gap: 10, alignItems: 'center' }}>
              <div style={{ flex: '1 1 240px' }}>
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

              <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
                <Button
                  variant={activeFilterCount > 0 ? 'primary' : 'secondary'}
                  size="sm"
                  icon="filter"
                  onClick={() => setFilterModalOpen(true)}
                >
                  {activeFilterCount > 0 ? t('Bộ lọc ({n})', { n: activeFilterCount }) : t('Bộ lọc')}
                </Button>

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

            {/* Các bộ lọc đang bật hiện thành chip có nút × bên dưới thanh tìm kiếm */}
            {activeFilterCount > 0 && (
              <div className="row wrap gap-6 mt-12 pt-10" style={{ borderTop: '1px solid var(--hairline-soft)', alignItems: 'center' }}>
                {muscle && (
                  <span className="badge badge-sm badge-blue">
                    {t('Vùng cơ: {m}', {
                      m: getLang() === 'en'
                        ? (MUSCLE_BY_KEY.get(muscle)?.labelEn ?? t(MUSCLE_BY_KEY.get(muscle)?.label ?? muscle))
                        : (MUSCLE_BY_KEY.get(muscle)?.label ?? muscle)
                    })}
                    <button type="button" onClick={() => setMuscle(null)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                  </span>
                )}

                {equip && (
                  <span className="badge badge-sm badge-blue">
                    {t('Dụng cụ: {eq}', { eq: formatEquipment(equip) })}
                    <button type="button" onClick={() => setEquip('')} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                  </span>
                )}

                {level && (
                  <span className="badge badge-sm badge-blue">
                    {t('Cấp độ: {level}', { level: levelLabel[level] ? levelLabel[level][0] : level })}
                    <button type="button" onClick={() => setLevel('')} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                  </span>
                )}

                {location && (
                  <span className="badge badge-sm badge-blue">
                    {t('Địa điểm: {loc}', { loc: locationLabel[location] })}
                    <button type="button" onClick={() => setLocation('')} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                  </span>
                )}

                {favoriteOnly && (
                  <span className="badge badge-sm badge-blue">
                    {t('Đã yêu thích')}
                    <button type="button" onClick={() => setFavoriteOnly(false)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                  </span>
                )}

                {assignedOnly && (
                  <span className="badge badge-sm badge-blue">
                    {t('Được giao')}
                    <button type="button" onClick={() => setAssignedOnly(false)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                  </span>
                )}

                {showHidden && (
                  <span className="badge badge-sm badge-amber">
                    {t('Bài đang ẩn')}
                    <button type="button" onClick={() => setShowHidden(false)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                  </span>
                )}

                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-muted"
                  onClick={handleClearAllFilters}
                  style={{ fontSize: 12, padding: '2px 6px' }}
                >
                  {t('Xoá tất cả bộ lọc')}
                </button>
              </div>
            )}
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

          {/* Tổng số bài tập */}
          <div className="tiny faint font-bold mb-12">
            {sortedExercises.length} {t('bài tập')}
          </div>

          {/* Lưới bài tập */}
          {exercisesLoading ? (
            <LoadingBlock rows={6} />
          ) : exercisesError ? (
            <ErrorState message={exercisesError} onRetry={reloadExercises} />
          ) : sortedExercises.length === 0 ? (
            <Empty
              icon="dumbbell"
              title={t('Không tìm thấy bài tập nào')}
              desc={t('Thử thay đổi từ khoá tìm kiếm hoặc bỏ bớt các tiêu chí lọc bên trên.')}
              action={
                <Button variant="secondary" size="sm" onClick={handleClearAllFilters}>
                  {t('Xoá tất cả bộ lọc')}
                </Button>
              }
            />
          ) : isBrowsingAll ? (
            /* Khi chọn "Tất cả": Nhóm bài theo từng nhóm cơ có bài */
            <div className="flow" style={{ gap: 28 }}>
              {activeSubCats
                .filter((sc) => sc.key !== '')
                .map((sc) => {
                  const groupItems = (sortedExercises ?? []).filter((e) => e.subCategory === sc.key);
                  if (groupItems.length === 0) return null;
                  return (
                    <section key={sc.key} className="mb-10">
                      <div className="row between mb-12" style={{ alignItems: 'center' }}>
                        <h3 className="section-title" style={{ margin: 0, fontSize: 18 }}>
                          <Icon name={getMuscleIcon(sc.key)} size={18} className="primary mr-6" />
                          <span>{t(sc.label)}</span>
                          <span className="tiny faint ml-6">({groupItems.length})</span>
                        </h3>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSubCategory(sc.key);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <span>{t('Xem tất cả')}</span>
                          <span className="ml-4">→</span>
                        </button>
                      </div>
                      <div className="kb-grid">
                        {groupItems.slice(0, 4).map(renderExerciseCard)}
                      </div>
                    </section>
                  );
                })}
            </div>
          ) : (
            /* Khi chọn một chip hoặc đang tìm kiếm/lọc: Hiển thị lưới đầy đủ kèm phân trang */
            <>
              <div className="kb-grid">
                {pagedExercises.items.map(renderExerciseCard)}
              </div>

              {pagedExercises.totalPages > 1 && (
                <div className="mt-20">
                  <Pager
                    page={pagedExercises.page}
                    totalPages={pagedExercises.totalPages}
                    total={sortedExercises.length}
                    onPage={pagedExercises.setPage}
                  />
                </div>
              )}
            </>
          )}

          {/* Modal Bộ lọc bài tập */}
          {filterModalOpen && (
            <Modal
              title={t('Bộ lọc bài tập')}
              onClose={() => setFilterModalOpen(false)}
              size="narrow"
              footer={
                <div className="row between" style={{ width: '100%' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFilters}
                  >
                    {t('Đặt lại bộ lọc')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setFilterModalOpen(false)}
                  >
                    {t('Áp dụng')}
                  </Button>
                </div>
              }
            >
              <div className="flow" style={{ gap: 14 }}>
                <div>
                  <label className="tiny faint font-bold uppercase mb-4" style={{ display: 'block' }}>{t('Cấp độ')}</label>
                  <select
                    className="input input-sm"
                    style={{ width: '100%' }}
                    value={level}
                    onChange={(e) => setLevel(e.target.value as '' | Level)}
                  >
                    <option value="">{t('Tất cả cấp độ')}</option>
                    <option value="BEGINNER">{levelLabel.BEGINNER[0]}</option>
                    <option value="INTERMEDIATE">{levelLabel.INTERMEDIATE[0]}</option>
                    <option value="ADVANCED">{levelLabel.ADVANCED[0]}</option>
                  </select>
                </div>

                <div>
                  <label className="tiny faint font-bold uppercase mb-4" style={{ display: 'block' }}>{t('Địa điểm tập')}</label>
                  <select
                    className="input input-sm"
                    style={{ width: '100%' }}
                    value={location}
                    onChange={(e) => setLocation(e.target.value as '' | ExerciseLocation)}
                  >
                    <option value="">{t('Mọi địa điểm')}</option>
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{locationLabel[loc]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="tiny faint font-bold uppercase mb-4" style={{ display: 'block' }}>{t('Sắp xếp theo')}</label>
                  <select
                    className="input input-sm"
                    style={{ width: '100%' }}
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>{t(s.label)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="tiny faint font-bold uppercase mb-4" style={{ display: 'block' }}>{t('Dụng cụ tập')}</label>
                  <select
                    className="input input-sm"
                    style={{ width: '100%' }}
                    value={equip}
                    onChange={(e) => setEquip(e.target.value)}
                  >
                    <option value="">{t('Tất cả dụng cụ')}</option>
                    {EQUIPMENT.map((item) => (
                      <option key={item.key} value={item.label}>
                        {getLang() === 'en' ? item.labelEn : item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isMember && (
                  <div className="flow pt-6" style={{ gap: 8, borderTop: '1px solid var(--hairline-soft)' }}>
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
                  </div>
                )}

                {isStaff && (
                  <div className="pt-6" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                    <label className="checkbox-label small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={showHidden}
                        onChange={(e) => setShowHidden(e.target.checked)}
                      />
                      <span>{t('Hiện bài tập đang ẩn')}</span>
                    </label>
                  </div>
                )}
              </div>
            </Modal>
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
                .map((eq) => {
                  const eqEn = EQUIPMENT_BY_KEY.get(eq.key as EquipmentKey)?.labelEn;
                  const title = getLang() === 'en' && eqEn ? eqEn : t(eq.name);
                  const sub = getLang() === 'en' ? (eq.name !== title ? eq.name : null) : eqEn;
                  const catItem = EQUIPMENT_CATEGORIES.find((c) => c.key === eq.category);
                  return (
                    <article key={eq.key} className="kb-card">
                      <Link to={`/equipment/${eq.key}`} className="kb-cover" aria-label={title}>
                        <ExerciseMedia
                          imageKey={eq.imageKey}
                          alt={title}
                          playOnHover
                        />
                      </Link>

                      <div className="kb-body">
                        <div>
                          <h3 className="kb-title">
                            <Link to={`/equipment/${eq.key}`} className="plain-link">
                              {title}
                            </Link>
                          </h3>
                          {sub && <div className="tiny faint">{sub}</div>}
                          <span className="tiny faint">{eq.exerciseCount ?? 0} {t('bài tập sử dụng')}</span>
                        </div>

                        {eq.shortDesc && (
                          <p className="small muted line-clamp-2" style={{ margin: 0 }}>
                            {t(eq.shortDesc)}
                          </p>
                        )}

                        <div className="row between mt-auto pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                          <Badge tone="blue">{catItem ? t(catItem.label) : eq.category}</Badge>
                          <Link to={`/equipment/${eq.key}`} className="btn btn-secondary btn-sm">
                            <span>{t('Xem hướng dẫn')}</span>
                            <Icon name="arrowRight" size={13} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
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
            {(musclesData ?? []).map((m) => {
              const title = getLang() === 'en' ? (m.nameEn || t(m.name)) : t(m.name);
              const sub = getLang() === 'en' ? (m.name !== title ? m.name : '') : m.nameEn;
              return (
                <div
                  key={m.key}
                  className="muscle-card"
                  onClick={() => setSelectedMuscleKey(m.key)}
                >
                  <div className="row between mb-8" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <h3 className="font-bold" style={{ margin: 0, fontSize: 16 }}>{title}</h3>
                      {sub && <span className="tiny faint">{sub}</span>}
                    </div>
                    <Badge tone="blue">{t(m.view === 'front' ? 'Mặt trước' : m.view === 'back' ? 'Mặt sau' : 'Hai mặt')}</Badge>
                  </div>

                  <p className="small muted mb-12 line-clamp-2" style={{ margin: 0 }}>
                    {t(m.hint)}
                  </p>

                  <div className="row between pt-8" style={{ borderTop: '1px solid var(--hairline-soft)', alignItems: 'center' }}>
                    <span className="tiny font-bold primary">{m.exerciseCount} {t('bài tập')}</span>
                    <span className="small faint">
                      {t('Xem giải phẫu')} →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal chi tiết nhóm cơ */}
          {selectedMuscleKey && (
            <Modal
              title={
                muscleDetail
                  ? getLang() === 'en'
                    ? `${muscleDetail.nameEn || muscleDetail.name} (${muscleDetail.name})`
                    : `${muscleDetail.name} (${muscleDetail.nameEn})`
                  : t('Đang tải...')
              }
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
                          <span>{exTitle(pe)}</span>
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
                            <span>{exTitle(se)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {muscleDetail.commonEquipment.length > 0 && (
                    <div>
                      <h4 className="tiny faint uppercase font-bold mb-8">{t('Dụng cụ thường dùng')}</h4>
                      <div className="row wrap" style={{ gap: 8 }}>
                        {muscleDetail.commonEquipment.map((eq) => {
                          const eqInfo = EQUIPMENT_BY_KEY.get(eq.key as EquipmentKey);
                          const label = getLang() === 'en' ? (eqInfo?.labelEn ?? t(eq.name)) : (eqInfo?.label ?? t(eq.name));
                          return (
                            <Link
                              key={eq.key}
                              to={`/equipment/${eq.key}`}
                              className="chip"
                              style={{ textDecoration: 'none' }}
                            >
                              <Icon name="zap" size={13} className="mr-4" />
                              <span>{label}</span>
                            </Link>
                          );
                        })}
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
                .filter((a) => !q.trim() || fold(t(a.title)).includes(fold(q.trim())) || fold(a.title).includes(fold(q.trim())) || fold(t(a.summary)).includes(fold(q.trim())) || fold(a.summary).includes(fold(q.trim())))
                .map((art) => (
                  <article
                    key={art.id}
                    className="guide-card"
                    onClick={() => setSelectedArticle(art)}
                  >
                    <div className="row between mb-8">
                      <Badge tone="blue">{t(articleCategoryLabel[art.category] ?? art.category)}</Badge>
                      <span className="tiny faint">{fmtDateTime(art.publishedAt)}</span>
                    </div>

                    <h3 className="font-bold mb-8" style={{ fontSize: 17, lineHeight: 1.3 }}>
                      {t(art.title)}
                    </h3>

                    <p className="small muted mb-12 line-clamp-3" style={{ margin: 0, flex: 1 }}>
                      {t(art.summary)}
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
              title={t(selectedArticle.title)}
              onClose={() => setSelectedArticle(null)}
            >
              <div className="flow" style={{ gap: 14 }}>
                <div className="row between" style={{ alignItems: 'center' }}>
                  <Badge tone="blue">{t(articleCategoryLabel[selectedArticle.category] ?? selectedArticle.category)}</Badge>
                  <span className="tiny faint">{fmtDateTime(selectedArticle.publishedAt)}</span>
                </div>
                <p className="font-bold muted" style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>
                  {t(selectedArticle.summary)}
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
