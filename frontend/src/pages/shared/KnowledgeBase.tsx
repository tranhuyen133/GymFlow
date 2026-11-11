import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type {
  Equipment,
  Exercise,
  ExerciseGoal,
  ExerciseLocation,
  ExerciseType,
  CardioIntensity,
  Level,
  MuscleGroup,
  WorkoutPlan,
  FavoriteSummary,
} from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { ExerciseMedia } from '../../components/ExerciseMedia';
import { MuscleMap } from '../../components/MuscleMap';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import {
  Badge,
  Button,
  Card,
  Empty,
  ErrorState,
  LoadingBlock,
  Modal,
  PageHead,
  Pager,
  SearchInput,
  Select,
  StatusBadge,
} from '../../components/ui';
import {
  exSub,
  exTitle,
  formatEquipment,
  goalLabel,
  levelLabel,
  locationLabel,
  muscleLabel,
} from '../../lib/format';
import { errMsg, useAsync, useDebounced, usePaged } from '../../lib/hooks';
import { t } from '../../i18n';
import './kb.css';
import './exercises.css';
import {
  EQUIPMENT,
  EQUIPMENT_BY_KEY,
  isMuscleKey,
  MUSCLE_BY_KEY,
  MUSCLES,
  type EquipmentKey,
  type MuscleKey,
} from '../../lib/anatomy';
import {
  ANATOMY_DETAILS,
  CARDIO_SUB_CATEGORIES,
  EQUIPMENT_SUB_CATEGORIES,
  EXERCISE_SUB_CATEGORIES,
  TRAINING_GUIDES,
  WARMUP_SUB_CATEGORIES,
  type TrainingGuide,
} from './knowledgeData';

export type KnowledgeTab =
  | 'exercises'
  | 'warmup'
  | 'cardio'
  | 'equipment'
  | 'anatomy'
  | 'guides'
  | 'favorites'
  | 'assigned';

interface KnowledgeBaseProps {
  defaultTab?: KnowledgeTab;
}

const EQUIPMENT_CATEGORY_LABELS: Record<string, string> = {
  FREE_WEIGHT: 'Tạ tự do',
  MACHINE: 'Máy tập khối',
  CABLE: 'Máy kéo cáp',
  BODYWEIGHT: 'Trọng lượng cơ thể',
  CARDIO: 'Máy tim mạch',
  ACCESSORY: 'Phụ kiện tập luyện',
  RECOVERY: 'Phục hồi cơ bắp',
};

const targetOf = (e: Exercise): MuscleKey[] => (e.targetMuscles ?? []).filter(isMuscleKey);
const secondaryOf = (e: Exercise): MuscleKey[] => (e.secondaryMuscleKeys ?? []).filter(isMuscleKey);
const equipOf = (e: Exercise): string[] => {
  if (e.equipmentKeys && e.equipmentKeys.length > 0) return e.equipmentKeys;
  if (e.equipment) return e.equipment.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};
const muscleName = (k: MuscleKey) => t(MUSCLE_BY_KEY.get(k)?.label ?? k);
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

type Sort = 'name' | 'updated' | 'usage';

export default function KnowledgeBase({ defaultTab = 'exercises' }: KnowledgeBaseProps) {
  const me = useMe();
  const staff = me.role !== 'MEMBER';
  const isMember = me.role === 'MEMBER';
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // Active Tab: exercises | warmup | cardio | equipment | anatomy | guides | favorites | assigned
  const tabParam = params.get('tab') as KnowledgeTab | null;
  const activeTab: KnowledgeTab = tabParam || defaultTab;

  const setActiveTab = (tab: KnowledgeTab) => {
    params.set('tab', tab);
    setParams(params);
  };

  // Sub-category filters
  const [exerciseSub, setExerciseSub] = useState<string>(() => params.get('sub') ?? 'all');
  const [warmupSub, setWarmupSub] = useState<string>(() => (params.get('tab') === 'warmup' ? params.get('sub') ?? 'all' : 'all'));
  const [cardioSub, setCardioSub] = useState<string>(() => (params.get('tab') === 'cardio' ? params.get('sub') ?? 'all' : 'all'));
  const [cardioIntensity, setCardioIntensity] = useState<'' | CardioIntensity>(() => (params.get('intensity') as CardioIntensity) || '');
  const [equipSub, setEquipSub] = useState<string>(() => params.get('equipSub') ?? 'all');

  // Common filters
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [level, setLevel] = useState<'' | Level>(() => (params.get('level') as Level) || '');
  const [location, setLocation] = useState<'' | ExerciseLocation>(() => (params.get('location') as ExerciseLocation) || '');
  const [goal, setGoal] = useState<'' | ExerciseGoal>(() => (params.get('goal') as ExerciseGoal) || '');
  const [equipFilter, setEquipFilter] = useState<string>(() => params.get('equipment') ?? '');
  const [sort, setSort] = useState<Sort>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSuggest, setShowSuggest] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Anatomy / Map selection
  const [muscle, setMuscle] = useState<MuscleKey | null>(() => {
    const m = params.get('muscle');
    return m && isMuscleKey(m) ? m : null;
  });
  const [withSecondary, setWithSecondary] = useState(false);
  const [anatomyView, setAnatomyView] = useState<'both' | 'front' | 'back'>('both');

  // Selected guide reader modal
  const [readingGuide, setReadingGuide] = useState<TrainingGuide | null>(null);

  // Staff hidden switch
  const [showHidden, setShowHidden] = useState(false);

  // Optimistic favorites state
  const [favExerciseIds, setFavExerciseIds] = useState<Set<number>>(new Set());
  const [favEquipmentKeys, setFavEquipmentKeys] = useState<Set<string>>(new Set());

  const dq = useDebounced(q);

  // Load all exercises
  const exercisesAsync = useAsync(
    () => api.get<Exercise[]>('/exercises', { includeHidden: staff && showHidden }),
    [staff, showHidden]
  );

  // Load all equipment
  const equipmentAsync = useAsync(
    () => api.get<Equipment[]>('/equipment', { includeHidden: staff && showHidden }),
    [staff, showHidden]
  );

  // Load favorites summary for authenticated user
  const favoritesAsync = useAsync(
    () => api.get<FavoriteSummary>('/favorites').catch(() => ({ exerciseIds: [], equipmentKeys: [] })),
    []
  );

  // Load active plan for Member
  const activePlanAsync = useAsync(
    () => (isMember ? api.get<WorkoutPlan | undefined>('/workout-plans/me/current').catch(() => undefined) : Promise.resolve(undefined)),
    [isMember]
  );

  // Populate favorites state once loaded
  useEffect(() => {
    if (favoritesAsync.data) {
      setFavExerciseIds(new Set(favoritesAsync.data.exerciseIds || []));
      setFavEquipmentKeys(new Set(favoritesAsync.data.equipmentKeys || []));
    }
  }, [favoritesAsync.data]);

  // Sync state to URL params
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (activeTab) next.set('tab', activeTab);
    if (dq) next.set('q', dq); else next.delete('q');
    if (level) next.set('level', level); else next.delete('level');
    if (location) next.set('location', location); else next.delete('location');
    if (goal) next.set('goal', goal); else next.delete('goal');
    if (muscle) next.set('muscle', muscle); else next.delete('muscle');
    setParams(next, { replace: true });
  }, [activeTab, dq, level, location, goal, muscle]);

  // Close search suggestions on click outside
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(ev.target as Node)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Toggle Favorite Exercise
  const toggleFavoriteExercise = async (ex: Exercise) => {
    const isFav = favExerciseIds.has(ex.id);
    const nextSet = new Set(favExerciseIds);
    if (isFav) {
      nextSet.delete(ex.id);
      setFavExerciseIds(nextSet);
      try {
        await api.delete(`/favorites/exercises/${ex.id}`);
        toast.info(t('Đã bỏ lưu bài tập {name}', { name: ex.name }));
      } catch (e) {
        nextSet.add(ex.id);
        setFavExerciseIds(nextSet);
        toast.error(errMsg(e));
      }
    } else {
      nextSet.add(ex.id);
      setFavExerciseIds(nextSet);
      try {
        await api.post(`/favorites/exercises/${ex.id}`);
        toast.success(t('Đã lưu bài tập {name} vào danh sách yêu thích', { name: ex.name }));
      } catch (e) {
        nextSet.delete(ex.id);
        setFavExerciseIds(nextSet);
        toast.error(errMsg(e));
      }
    }
  };

  // Toggle Favorite Equipment
  const toggleFavoriteEquipment = async (eq: Equipment) => {
    const isFav = favEquipmentKeys.has(eq.key);
    const nextSet = new Set(favEquipmentKeys);
    if (isFav) {
      nextSet.delete(eq.key);
      setFavEquipmentKeys(nextSet);
      try {
        await api.delete(`/favorites/equipment/${eq.key}`);
        toast.info(t('Đã bỏ lưu dụng cụ {name}', { name: eq.name }));
      } catch (e) {
        nextSet.add(eq.key);
        setFavEquipmentKeys(nextSet);
        toast.error(errMsg(e));
      }
    } else {
      nextSet.add(eq.key);
      setFavEquipmentKeys(nextSet);
      try {
        await api.post(`/favorites/equipment/${eq.key}`);
        toast.success(t('Đã lưu dụng cụ {name} vào danh sách yêu thích', { name: eq.name }));
      } catch (e) {
        nextSet.delete(eq.key);
        setFavEquipmentKeys(nextSet);
        toast.error(errMsg(e));
      }
    }
  };

  // Filtered Exercises for the current scope
  const allExercises = exercisesAsync.data ?? [];
  const allEquipment = equipmentAsync.data ?? [];

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    const norm = fold(q.trim());
    if (!norm || norm.length < 2) return [];
    return allExercises
      .filter((e) => fold(e.name).includes(norm) || (e.nameEn && fold(e.nameEn).includes(norm)) || (e.aliases && fold(e.aliases).includes(norm)))
      .slice(0, 6);
  }, [allExercises, q]);

  // Tab A: Thư viện bài tập chính (MAIN)
  const mainExercises = useMemo(() => {
    let list = allExercises.filter((e) => e.exerciseType === 'MAIN' || (!e.exerciseType && e.muscleGroup !== 'WARMUP' && e.muscleGroup !== 'CARDIO'));
    if (!staff) list = list.filter((e) => e.reviewStatus === 'APPROVED');
    // Sub-category filter
    if (exerciseSub && exerciseSub !== 'all') {
      if (exerciseSub === 'chest') list = list.filter((e) => e.muscleGroup === 'CHEST' || e.subCategory === 'chest');
      else if (exerciseSub === 'back') list = list.filter((e) => e.muscleGroup === 'BACK' || e.subCategory === 'back');
      else if (exerciseSub === 'shoulders') list = list.filter((e) => e.muscleGroup === 'SHOULDERS' || e.subCategory === 'shoulders');
      else if (exerciseSub === 'biceps') list = list.filter((e) => e.subCategory === 'biceps' || targetOf(e).includes('biceps'));
      else if (exerciseSub === 'triceps') list = list.filter((e) => e.subCategory === 'triceps' || targetOf(e).includes('triceps'));
      else if (exerciseSub === 'abs') list = list.filter((e) => e.muscleGroup === 'CORE' || targetOf(e).includes('abs') || targetOf(e).includes('obliques'));
      else if (exerciseSub === 'legs') list = list.filter((e) => e.muscleGroup === 'LEGS' && e.subCategory !== 'glutes');
      else if (exerciseSub === 'glutes') list = list.filter((e) => e.subCategory === 'glutes' || targetOf(e).includes('gluteal'));
      else if (exerciseSub === 'full_body') list = list.filter((e) => e.muscleGroup === 'FULL_BODY');
    }
    // Search query
    if (dq.trim()) {
      const norm = fold(dq.trim());
      list = list.filter((e) => fold(e.name).includes(norm) || (e.nameEn && fold(e.nameEn).includes(norm)) || (e.aliases && fold(e.aliases).includes(norm)) || (e.equipment && fold(e.equipment).includes(norm)));
    }
    // Level
    if (level) list = list.filter((e) => e.level === level);
    // Location
    if (location) list = list.filter((e) => e.location === location || e.location === 'ANY');
    // Goal
    if (goal) list = list.filter((e) => e.goals?.includes(goal) || e.primaryGoal === goal);
    // Equipment
    if (equipFilter) {
      list = list.filter((e) => equipOf(e).includes(equipFilter) || (e.equipment && fold(e.equipment).includes(fold(equipFilter))));
    }
    // Specific muscle on MuscleMap
    if (muscle) {
      list = list.filter((e) => targetOf(e).includes(muscle) || (withSecondary && secondaryOf(e).includes(muscle)));
    }
    return list;
  }, [allExercises, staff, exerciseSub, dq, level, location, goal, equipFilter, muscle, withSecondary]);

  // Tab B: Bài tập khởi động (WARMUP)
  const warmupExercises = useMemo(() => {
    let list = allExercises.filter((e) => e.exerciseType === 'WARMUP' || e.muscleGroup === 'WARMUP');
    if (!staff) list = list.filter((e) => e.reviewStatus === 'APPROVED');
    if (warmupSub && warmupSub !== 'all') {
      list = list.filter((e) => e.subCategory === warmupSub);
    }
    if (dq.trim()) {
      const norm = fold(dq.trim());
      list = list.filter((e) => fold(e.name).includes(norm) || (e.nameEn && fold(e.nameEn).includes(norm)) || (e.aliases && fold(e.aliases).includes(norm)));
    }
    if (level) list = list.filter((e) => e.level === level);
    return list;
  }, [allExercises, staff, warmupSub, dq, level]);

  // Tab C: Bài tập Cardio (CARDIO)
  const cardioExercises = useMemo(() => {
    let list = allExercises.filter((e) => e.exerciseType === 'CARDIO' || e.muscleGroup === 'CARDIO');
    if (!staff) list = list.filter((e) => e.reviewStatus === 'APPROVED');
    if (cardioSub && cardioSub !== 'all') {
      list = list.filter((e) => e.subCategory === cardioSub);
    }
    if (cardioIntensity) {
      list = list.filter((e) => e.cardioIntensity === cardioIntensity);
    }
    if (dq.trim()) {
      const norm = fold(dq.trim());
      list = list.filter((e) => fold(e.name).includes(norm) || (e.nameEn && fold(e.nameEn).includes(norm)) || (e.aliases && fold(e.aliases).includes(norm)));
    }
    if (level) list = list.filter((e) => e.level === level);
    return list;
  }, [allExercises, staff, cardioSub, cardioIntensity, dq, level]);

  // Tab D: Kho dụng cụ và thiết bị
  const filteredEquipment = useMemo(() => {
    let list = allEquipment;
    if (equipSub && equipSub !== 'all') {
      if (equipSub === 'dumbbell') list = list.filter((eq) => eq.key === 'dumbbell');
      else if (equipSub === 'barbell') list = list.filter((eq) => eq.key === 'barbell' || eq.key === 'ez-bar' || eq.key === 'plate');
      else if (equipSub === 'kettlebell') list = list.filter((eq) => eq.key === 'kettlebell');
      else if (equipSub === 'cable') list = list.filter((eq) => eq.key === 'cable');
      else if (equipSub === 'machine-chest') list = list.filter((eq) => eq.key === 'machine-chest' || (eq.category === 'MACHINE' && (eq.targetMuscles?.includes('chest') || eq.name.toLowerCase().includes('ngực'))));
      else if (equipSub === 'machine-back') list = list.filter((eq) => eq.key === 'machine-back' || (eq.category === 'MACHINE' && (eq.targetMuscles?.includes('back') || eq.name.toLowerCase().includes('lưng') || eq.name.toLowerCase().includes('xô'))));
      else if (equipSub === 'machine-shoulder') list = list.filter((eq) => eq.key === 'machine-shoulder' || (eq.category === 'MACHINE' && (eq.targetMuscles?.includes('deltoids') || eq.name.toLowerCase().includes('vai'))));
      else if (equipSub === 'machine-legs') list = list.filter((eq) => eq.key === 'machine-legs' || (eq.category === 'MACHINE' && (eq.targetMuscles?.includes('quadriceps') || eq.targetMuscles?.includes('hamstrings') || eq.name.toLowerCase().includes('chân'))));
      else if (equipSub === 'treadmill') list = list.filter((eq) => eq.key === 'treadmill' || eq.key === 'cardio-machine');
      else if (equipSub === 'bike') list = list.filter((eq) => eq.key === 'bike');
      else if (equipSub === 'band') list = list.filter((eq) => eq.key === 'band');
      else if (equipSub === 'bench') list = list.filter((eq) => eq.key === 'bench' || eq.key === 'dip-bars' || eq.key === 'pullup-bar');
      else if (equipSub === 'other') list = list.filter((eq) => eq.key === 'other' || eq.key === 'ball' || eq.key === 'foam-roller');
    }
    if (dq.trim()) {
      const norm = fold(dq.trim());
      list = list.filter((eq) => fold(eq.name).includes(norm) || (eq.nameEn && fold(eq.nameEn).includes(norm)) || (eq.shortDesc && fold(eq.shortDesc).includes(norm)));
    }
    return list;
  }, [allEquipment, equipSub, dq]);

  // Tab G: Yêu thích (Favorites)
  const favoriteExercises = useMemo(() => {
    return allExercises.filter((e) => favExerciseIds.has(e.id));
  }, [allExercises, favExerciseIds]);

  const favoriteEquipment = useMemo(() => {
    return allEquipment.filter((eq) => favEquipmentKeys.has(eq.key));
  }, [allEquipment, favEquipmentKeys]);

  // Tab H: Bài tập Trainer giao (Assigned)
  const assignedPlan = activePlanAsync.data;
  const assignedExerciseItems = useMemo(() => {
    if (!assignedPlan?.items) return [];
    const exerciseMap = new Map<number, Exercise>(allExercises.map((e) => [e.id, e]));
    return assignedPlan.items.map((it) => ({
      ...it,
      exerciseDetail: exerciseMap.get(it.exerciseId),
    }));
  }, [assignedPlan, allExercises]);

  // Pagination for Exercises tab
  const pagedMain = usePaged(mainExercises, 'kb_main', `${exerciseSub}|${dq}|${level}|${location}|${goal}|${equipFilter}|${muscle}`, 12);
  const pagedWarmup = usePaged(warmupExercises, 'kb_warmup', `${warmupSub}|${dq}|${level}`, 12);
  const pagedCardio = usePaged(cardioExercises, 'kb_cardio', `${cardioSub}|${cardioIntensity}|${dq}|${level}`, 12);

  // Muscle counts for MuscleMap
  const muscleCounts = useMemo(() => {
    const c: Partial<Record<MuscleKey, number>> = {};
    const baseList = staff ? allExercises : allExercises.filter((e) => e.reviewStatus === 'APPROVED');
    baseList.forEach((e) => {
      new Set([...targetOf(e), ...(withSecondary ? secondaryOf(e) : [])]).forEach((k) => {
        c[k] = (c[k] ?? 0) + 1;
      });
    });
    return c;
  }, [allExercises, staff, withSecondary]);

  // Action: Switch to Exercises filtered by a specific muscle from Anatomy
  const filterByMuscle = (mKey: MuscleKey) => {
    setMuscle(mKey);
    setActiveTab('exercises');
    toast.info(t('Đang lọc bài tập tác động đến {muscle}', { muscle: muscleName(mKey) }));
  };

  // Action: Switch to Exercises filtered by a specific equipment
  const filterByEquipmentKey = (eqKey: string) => {
    setEquipFilter(eqKey);
    setActiveTab('exercises');
    const eqLabel = EQUIPMENT_BY_KEY.get(eqKey as any)?.label ?? eqKey;
    toast.info(t('Đang lọc bài tập sử dụng {name}', { name: t(eqLabel) }));
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={t('GymFlow Knowledge Center')}
        title={t('Kho kiến thức')}
        desc={t('Hệ thống kiến thức chuẩn hoá toàn diện: Thư viện bài tập, Khởi động, Cardio, Dụng cụ, Giải phẫu nhóm cơ và Hướng dẫn khoa học.')}
        actions={
          <div className="row wrap gap-8">
            {activeTab === 'exercises' && staff && (
              <Link to="/exercises/manage" className="btn btn-primary btn-sm">
                <Icon name="plus" size={14} className="mr-4" />
                <span>{t('Quản lý bài tập')}</span>
              </Link>
            )}
            {activeTab === 'equipment' && staff && (
              <Link to="/equipment/manage" className="btn btn-primary btn-sm">
                <Icon name="plus" size={14} className="mr-4" />
                <span>{t('Quản lý dụng cụ')}</span>
              </Link>
            )}
          </div>
        }
      />

      {/* TABS CHÍNH CỦA KHO KIẾN THỨC */}
      <nav className="kb-top-tabs" aria-label={t('Danh mục kho kiến thức')}>
        <button
          type="button"
          className={`kb-top-tab ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          <Icon name="dumbbell" size={16} />
          <span>{t('Thư viện bài tập')}</span>
          <span className="tab-badge">{mainExercises.length}</span>
        </button>

        <button
          type="button"
          className={`kb-top-tab ${activeTab === 'warmup' ? 'active' : ''}`}
          onClick={() => setActiveTab('warmup')}
        >
          <Icon name="sparkle" size={16} />
          <span>{t('Khởi động')}</span>
          <span className="tab-badge">{warmupExercises.length}</span>
        </button>

        <button
          type="button"
          className={`kb-top-tab ${activeTab === 'cardio' ? 'active' : ''}`}
          onClick={() => setActiveTab('cardio')}
        >
          <Icon name="flame" size={16} />
          <span>{t('Cardio')}</span>
          <span className="tab-badge">{cardioExercises.length}</span>
        </button>

        <button
          type="button"
          className={`kb-top-tab ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          <Icon name="zap" size={16} />
          <span>{t('Dụng cụ & Thiết bị')}</span>
          <span className="tab-badge">{filteredEquipment.length}</span>
        </button>

        <button
          type="button"
          className={`kb-top-tab ${activeTab === 'anatomy' ? 'active' : ''}`}
          onClick={() => setActiveTab('anatomy')}
        >
          <Icon name="target" size={16} />
          <span>{t('Kiến thức nhóm cơ')}</span>
          <span className="tab-badge">18</span>
        </button>

        <button
          type="button"
          className={`kb-top-tab ${activeTab === 'guides' ? 'active' : ''}`}
          onClick={() => setActiveTab('guides')}
        >
          <Icon name="clipboard" size={16} />
          <span>{t('Hướng dẫn tập luyện')}</span>
          <span className="tab-badge">{TRAINING_GUIDES.length}</span>
        </button>

        <button
          type="button"
          className={`kb-top-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <Icon name="star" size={16} />
          <span>{t('Yêu thích')}</span>
          <span className="tab-badge">{favExerciseIds.size + favEquipmentKeys.size}</span>
        </button>

        {isMember && assignedPlan && (
          <button
            type="button"
            className={`kb-top-tab ${activeTab === 'assigned' ? 'active' : ''}`}
            onClick={() => setActiveTab('assigned')}
          >
            <Icon name="checkCircle" size={16} />
            <span>{t('Trainer giao')}</span>
            <span className="tab-badge">{assignedPlan.items?.length ?? 0}</span>
          </button>
        )}
      </nav>

      {/* ========================================================
          TAB A: THƯ VIỆN BÀI TẬP CHÍNH (MAIN EXERCISES)
         ======================================================== */}
      {activeTab === 'exercises' && (
        <section aria-labelledby="exercises-tab-title">
          {/* Sub-category pills */}
          <div className="kb-sub-strip">
            {EXERCISE_SUB_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`kb-sub-pill ${exerciseSub === cat.key ? 'active' : ''}`}
                onClick={() => setExerciseSub(cat.key)}
              >
                {t(cat.label)}
              </button>
            ))}
          </div>

          {/* Search & filters toolbar */}
          <div className="toolbar mt-12" style={{ alignItems: 'center' }}>
            <div className="ex-search-wrapper" ref={searchRef}>
              <SearchInput
                value={q}
                onChange={(v) => { setQ(v); setShowSuggest(true); }}
                placeholder={t('Tìm tên bài tập tiếng Việt / English, cơ, dụng cụ…')}
              />
              {showSuggest && suggestions.length > 0 && (
                <div className="ex-autocomplete-dropdown">
                  <div className="tiny faint px-10 py-4 font-bold">{t('Gợi ý bài tập ({n})', { n: suggestions.length })}</div>
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="ex-autocomplete-item"
                      onClick={() => {
                        setQ(item.name);
                        setShowSuggest(false);
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="ex-autocomplete-title">{exTitle(item)}</div>
                        {exSub(item) && <div className="ex-autocomplete-sub">{exSub(item)}</div>}
                      </div>
                      <div className="row gap-4 flex-shrink-0">
                        <span className="badge badge-sm">{muscleLabel[item.muscleGroup]}</span>
                        {item.equipment && <span className="tiny faint">{formatEquipment(item.equipment)}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Select value={level} onChange={(e) => setLevel(e.target.value as Level | '')} aria-label={t('Cấp độ')}>
              <option value="">{t('Mọi cấp độ')}</option>
              {(Object.keys(levelLabel) as Level[]).map((l) => (
                <option key={l} value={l}>{levelLabel[l][0]}</option>
              ))}
            </Select>

            <Select value={location} onChange={(e) => setLocation(e.target.value as ExerciseLocation | '')} aria-label={t('Nơi tập')}>
              <option value="">{t('Mọi nơi tập')}</option>
              {Object.keys(locationLabel).filter((l) => l !== 'ANY').map((l) => (
                <option key={l} value={l}>{locationLabel[l as ExerciseLocation]}</option>
              ))}
            </Select>

            <Select value={goal} onChange={(e) => setGoal(e.target.value as ExerciseGoal | '')} aria-label={t('Mục tiêu')}>
              <option value="">{t('Mọi mục tiêu')}</option>
              {Object.keys(goalLabel).map((g) => (
                <option key={g} value={g}>{goalLabel[g as ExerciseGoal]}</option>
              ))}
            </Select>

            <Select value={equipFilter} onChange={(e) => setEquipFilter(e.target.value)} aria-label={t('Thiết bị')}>
              <option value="">{t('Mọi thiết bị')}</option>
              {EQUIPMENT.map((eq) => (
                <option key={eq.key} value={eq.key}>{t(eq.label)}</option>
              ))}
            </Select>

            <div className="ex-view-toggle">
              <button
                type="button"
                className={`ex-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title={t('Xem dạng lưới')}
              >
                <Icon name="grid" size={16} />
              </button>
              <button
                type="button"
                className={`ex-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title={t('Xem dạng danh sách')}
              >
                <Icon name="list" size={16} />
              </button>
            </div>

            {(q || level || location || goal || equipFilter || muscle || exerciseSub !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                icon="x"
                onClick={() => {
                  setQ('');
                  setLevel('');
                  setLocation('');
                  setGoal('');
                  setEquipFilter('');
                  setMuscle(null);
                  setExerciseSub('all');
                }}
              >
                {t('Xoá bộ lọc')}
              </Button>
            )}
          </div>

          {/* Active muscle / equipment tag indicator */}
          {(muscle || equipFilter) && (
            <div className="row gap-8 items-center mt-8 flex-wrap">
              {muscle && (
                <span className="badge badge-primary">
                  {t('Nhóm cơ:')} {muscleName(muscle)}
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs ml-4"
                    onClick={() => setMuscle(null)}
                    title={t('Bỏ chọn')}
                  >
                    <Icon name="x" size={11} />
                  </button>
                </span>
              )}
              {equipFilter && (
                <span className="badge badge-primary">
                  {t('Dụng cụ:')} {t(EQUIPMENT_BY_KEY.get(equipFilter as any)?.label ?? equipFilter)}
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs ml-4"
                    onClick={() => setEquipFilter('')}
                    title={t('Bỏ chọn')}
                  >
                    <Icon name="x" size={11} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Exercise items list / grid */}
          {exercisesAsync.loading ? (
            <LoadingBlock rows={6} className="mt-16" />
          ) : exercisesAsync.error ? (
            <ErrorState message={exercisesAsync.error} onRetry={exercisesAsync.reload} />
          ) : mainExercises.length === 0 ? (
            <Card className="mt-16">
              <Empty
                icon="dumbbell"
                title={t('Không tìm thấy bài tập phù hợp')}
                desc={t('Thử nới lỏng bộ lọc hoặc tìm với từ khoá khác.')}
                action={
                  <Button
                    onClick={() => {
                      setQ('');
                      setLevel('');
                      setLocation('');
                      setGoal('');
                      setMuscle(null);
                      setExerciseSub('all');
                    }}
                  >
                    {t('Hiển thị tất cả bài tập')}
                  </Button>
                }
              />
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-3 mt-16">
              {pagedMain.items.map((ex) => {
                const isFav = favExerciseIds.has(ex.id);
                return (
                  <Card key={ex.id} className="hoverable ex-card">
                    <Link to={`/exercises/${ex.id}`} className="ex-thumb-btn">
                      <ExerciseMedia
                        imageKey={ex.imageKey}
                        alt={exTitle(ex)}
                        playOnHover
                        className="ex-thumb"
                        tag={targetOf(ex).slice(0, 2).map(muscleName).join(' · ') || undefined}
                        fallback={
                          <div className="ex-thumb ex-thumb-map">
                            <MuscleMap size="sm" primary={targetOf(ex)} secondary={secondaryOf(ex)} />
                          </div>
                        }
                      />
                    </Link>

                    <div className="top">
                      <div className="row items-start justify-between flex-1">
                        <div>
                          <Link to={`/exercises/${ex.id}`} className="ex-title">
                            {exTitle(ex)}
                          </Link>
                          {exSub(ex) && <div className="tiny faint">{exSub(ex)}</div>}
                          <div className="tiny muted mt-2">
                            {muscleLabel[ex.muscleGroup]} · {ex.equipment ? formatEquipment(ex.equipment) : t('Không dụng cụ')}
                          </div>
                        </div>

                        {/* Nút yêu thích Star */}
                        <button
                          type="button"
                          className={`kb-action-star ${isFav ? 'active' : ''}`}
                          onClick={() => void toggleFavoriteExercise(ex)}
                          title={isFav ? t('Bỏ yêu thích') : t('Lưu vào yêu thích')}
                          aria-label={t('Yêu thích')}
                        >
                          <Icon name="star" size={18} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    {ex.description && (
                      <p className="small muted text-clamp-2 mt-4">{ex.description}</p>
                    )}

                    <div className="row wrap gap-6 mt-8">
                      <StatusBadge map={levelLabel} value={ex.level} />
                      {ex.location && (
                        <span className="badge badge-sm">{locationLabel[ex.location]}</span>
                      )}
                    </div>

                    {equipOf(ex).length > 0 && (
                      <div className="row wrap gap-4 mt-6">
                        {equipOf(ex).map((eqK) => (
                          <Link
                            key={eqK}
                            to={`/equipment/${eqK}`}
                            className="badge badge-sm"
                            style={{ textDecoration: 'none', background: 'var(--surface-2)', color: 'var(--muted)' }}
                            title={t('Xem chi tiết thiết bị')}
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            <Icon name="dumbbell" size={11} className="mr-4" />
                            <span>{t(EQUIPMENT_BY_KEY.get(eqK as EquipmentKey)?.label ?? eqK)}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="row between items-center mt-12 pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                      <Link to={`/me/schedule?exerciseId=${ex.id}`} className="btn btn-ghost btn-xs text-primary">
                        <Icon name="calendar" size={13} className="mr-4" />
                        <span>{t('Thêm vào lịch')}</span>
                      </Link>

                      <Link to={`/exercises/${ex.id}`} className="btn btn-secondary btn-xs">
                        <span>{t('Chi tiết')}</span>
                        <Icon name="arrowRight" size={12} className="ml-2" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card flush className="overflow-auto mt-16">
              <table className="ex-list-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>{t('Lưu')}</th>
                    <th>{t('Bài tập')}</th>
                    <th>{t('Nhóm cơ')}</th>
                    <th>{t('Dụng cụ')}</th>
                    <th>{t('Cấp độ')}</th>
                    <th>{t('Hành động')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMain.items.map((ex) => {
                    const isFav = favExerciseIds.has(ex.id);
                    return (
                      <tr key={ex.id}>
                        <td>
                          <button
                            type="button"
                            className={`kb-action-star ${isFav ? 'active' : ''}`}
                            onClick={() => void toggleFavoriteExercise(ex)}
                            title={isFav ? t('Bỏ yêu thích') : t('Lưu vào yêu thích')}
                          >
                            <Icon name="star" size={16} fill={isFav ? 'currentColor' : 'none'} />
                          </button>
                        </td>
                        <td>
                          <Link to={`/exercises/${ex.id}`} className="font-semibold text-ink">
                            {exTitle(ex)}
                          </Link>
                          {exSub(ex) && <div className="tiny faint">{exSub(ex)}</div>}
                        </td>
                        <td><span className="badge badge-sm">{muscleLabel[ex.muscleGroup]}</span></td>
                        <td><span className="tiny">{ex.equipment ? formatEquipment(ex.equipment) : t('Không dụng cụ')}</span></td>
                        <td><StatusBadge map={levelLabel} value={ex.level} /></td>
                        <td>
                          <div className="row gap-4">
                            <Link to={`/me/schedule?exerciseId=${ex.id}`} className="btn btn-ghost btn-xs" title={t('Thêm vào lịch')}>
                              <Icon name="calendar" size={14} />
                            </Link>
                            <Link to={`/exercises/${ex.id}`} className="btn btn-ghost btn-xs" title={t('Xem chi tiết')}>
                              <Icon name="arrowRight" size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}

          <div className="mt-16">
            <Pager {...pagedMain} />
          </div>
        </section>
      )}

      {/* ========================================================
          TAB B: BÀI TẬP KHỞI ĐỘNG (WARMUP)
         ======================================================== */}
      {activeTab === 'warmup' && (
        <section aria-labelledby="warmup-tab-title">
          <div className="kb-sub-strip">
            {WARMUP_SUB_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`kb-sub-pill ${warmupSub === cat.key ? 'active' : ''}`}
                onClick={() => setWarmupSub(cat.key)}
              >
                {t(cat.label)}
              </button>
            ))}
          </div>

          <div className="toolbar mt-12">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder={t('Tìm bài khởi động: xoay khớp, dãn cơ, vai, hông…')}
            />
          </div>

          {warmupExercises.length === 0 ? (
            <Card className="mt-16">
              <Empty
                icon="sparkle"
                title={t('Không tìm thấy bài khởi động')}
                desc={t('Thử chọn danh mục khác hoặc xoá từ khoá tìm kiếm.')}
                action={<Button onClick={() => { setWarmupSub('all'); setQ(''); }}>{t('Hiện tất cả bài khởi động')}</Button>}
              />
            </Card>
          ) : (
            <div className="grid grid-3 mt-16">
              {pagedWarmup.items.map((ex) => {
                const isFav = favExerciseIds.has(ex.id);
                return (
                  <Card key={ex.id} className="hoverable ex-card">
                    <Link to={`/exercises/${ex.id}`} className="ex-thumb-btn">
                      <ExerciseMedia
                        imageKey={ex.imageKey}
                        alt={exTitle(ex)}
                        playOnHover
                        className="ex-thumb"
                        fallback={
                          <div className="ex-thumb ex-thumb-map">
                            <MuscleMap size="sm" primary={targetOf(ex)} secondary={secondaryOf(ex)} />
                          </div>
                        }
                      />
                    </Link>

                    <div className="top">
                      <div className="row items-start justify-between flex-1">
                        <div>
                          <Link to={`/exercises/${ex.id}`} className="ex-title">
                            {exTitle(ex)}
                          </Link>
                          {exSub(ex) && <div className="tiny faint">{exSub(ex)}</div>}
                          <div className="tiny text-primary font-semibold mt-2">
                            {t('Khởi động')} · {ex.subCategory ? t(ex.subCategory) : t('Làm nóng khớp')}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`kb-action-star ${isFav ? 'active' : ''}`}
                          onClick={() => void toggleFavoriteExercise(ex)}
                          title={isFav ? t('Bỏ yêu thích') : t('Lưu vào yêu thích')}
                        >
                          <Icon name="star" size={18} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    {ex.description && (
                      <p className="small muted text-clamp-2 mt-4">{ex.description}</p>
                    )}

                    <div className="row wrap gap-6 mt-8">
                      <span className="badge badge-sm badge-primary">{t('Khởi động')}</span>
                      <StatusBadge map={levelLabel} value={ex.level} />
                    </div>

                    <div className="row between items-center mt-12 pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                      <Link to={`/me/schedule?exerciseId=${ex.id}`} className="btn btn-ghost btn-xs text-primary">
                        <Icon name="calendar" size={13} className="mr-4" />
                        <span>{t('Thêm vào lịch')}</span>
                      </Link>

                      <Link to={`/exercises/${ex.id}`} className="btn btn-secondary btn-xs">
                        <span>{t('Chi tiết')}</span>
                        <Icon name="arrowRight" size={12} className="ml-2" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-16">
            <Pager {...pagedWarmup} />
          </div>
        </section>
      )}

      {/* ========================================================
          TAB C: BÀI TẬP CARDIO (CARDIO)
         ======================================================== */}
      {activeTab === 'cardio' && (
        <section aria-labelledby="cardio-tab-title">
          <div className="kb-sub-strip">
            {CARDIO_SUB_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`kb-sub-pill ${cardioSub === cat.key ? 'active' : ''}`}
                onClick={() => setCardioSub(cat.key)}
              >
                {t(cat.label)}
              </button>
            ))}
          </div>

          <div className="toolbar mt-12" style={{ alignItems: 'center' }}>
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder={t('Tìm bài Cardio: chạy bộ, đạp xe, chèo thuyền, HIIT…')}
            />

            <Select
              value={cardioIntensity}
              onChange={(e) => setCardioIntensity(e.target.value as CardioIntensity | '')}
              aria-label={t('Cường độ Cardio')}
            >
              <option value="">{t('Mọi cường độ')}</option>
              <option value="LOW">{t('Cường độ thấp (LISS)')}</option>
              <option value="MEDIUM">{t('Cường độ trung bình (Moderate)')}</option>
              <option value="HIGH">{t('Cường độ cao (HIIT / VO2 Max)')}</option>
            </Select>

            {(q || cardioSub !== 'all' || cardioIntensity) && (
              <Button
                variant="ghost"
                size="sm"
                icon="x"
                onClick={() => {
                  setQ('');
                  setCardioSub('all');
                  setCardioIntensity('');
                }}
              >
                {t('Xoá bộ lọc')}
              </Button>
            )}
          </div>

          {cardioExercises.length === 0 ? (
            <Card className="mt-16">
              <Empty
                icon="flame"
                title={t('Không tìm thấy bài Cardio')}
                desc={t('Thử chọn cường độ khác hoặc xoá từ khoá tìm kiếm.')}
                action={
                  <Button onClick={() => { setCardioSub('all'); setCardioIntensity(''); setQ(''); }}>
                    {t('Hiện tất cả bài Cardio')}
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-3 mt-16">
              {pagedCardio.items.map((ex) => {
                const isFav = favExerciseIds.has(ex.id);
                const intensityTone =
                  ex.cardioIntensity === 'HIGH' ? 'intensity-high' : ex.cardioIntensity === 'MEDIUM' ? 'intensity-medium' : 'intensity-low';
                const intensityLabel =
                  ex.cardioIntensity === 'HIGH' ? t('Cường độ cao') : ex.cardioIntensity === 'MEDIUM' ? t('Trung bình') : t('Cường độ thấp');

                return (
                  <Card key={ex.id} className="hoverable ex-card">
                    <Link to={`/exercises/${ex.id}`} className="ex-thumb-btn">
                      <ExerciseMedia
                        imageKey={ex.imageKey}
                        alt={exTitle(ex)}
                        playOnHover
                        className="ex-thumb"
                        fallback={
                          <div className="ex-thumb ex-thumb-map">
                            <MuscleMap size="sm" primary={targetOf(ex)} secondary={secondaryOf(ex)} />
                          </div>
                        }
                      />
                    </Link>

                    <div className="top">
                      <div className="row items-start justify-between flex-1">
                        <div>
                          <Link to={`/exercises/${ex.id}`} className="ex-title">
                            {exTitle(ex)}
                          </Link>
                          {exSub(ex) && <div className="tiny faint">{exSub(ex)}</div>}
                          <div className="tiny muted mt-2">
                            {t('Cardio')} · {ex.equipment ? formatEquipment(ex.equipment) : t('Không máy')}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`kb-action-star ${isFav ? 'active' : ''}`}
                          onClick={() => void toggleFavoriteExercise(ex)}
                          title={isFav ? t('Bỏ yêu thích') : t('Lưu vào yêu thích')}
                        >
                          <Icon name="star" size={18} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    {ex.description && (
                      <p className="small muted text-clamp-2 mt-4">{ex.description}</p>
                    )}

                    <div className="row wrap gap-6 mt-8">
                      <span className={`cardio-badge ${intensityTone}`}>
                        <Icon name="flame" size={12} />
                        {intensityLabel}
                      </span>
                      <StatusBadge map={levelLabel} value={ex.level} />
                    </div>

                    <div className="row between items-center mt-12 pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                      <Link to={`/me/schedule?exerciseId=${ex.id}`} className="btn btn-ghost btn-xs text-primary">
                        <Icon name="calendar" size={13} className="mr-4" />
                        <span>{t('Thêm vào lịch')}</span>
                      </Link>

                      <Link to={`/exercises/${ex.id}`} className="btn btn-secondary btn-xs">
                        <span>{t('Chi tiết')}</span>
                        <Icon name="arrowRight" size={12} className="ml-2" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-16">
            <Pager {...pagedCardio} />
          </div>
        </section>
      )}

      {/* ========================================================
          TAB D: KHO DỤNG CỤ VÀ THIẾT BỊ (EQUIPMENT)
         ======================================================== */}
      {activeTab === 'equipment' && (
        <section aria-labelledby="equipment-tab-title">
          <div className="kb-sub-strip">
            {EQUIPMENT_SUB_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`kb-sub-pill ${equipSub === cat.key ? 'active' : ''}`}
                onClick={() => setEquipSub(cat.key)}
              >
                {t(cat.label)}
              </button>
            ))}
          </div>

          <div className="toolbar mt-12">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder={t('Tìm dụng cụ: tạ đơn, máy kéo cáp, máy chạy bộ, xe đạp…')}
            />
            {staff && (
              <label className="checkbox-label small row gap-6 items-center">
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                />
                <span>{t('Hiện dụng cụ đang ẩn')}</span>
              </label>
            )}
          </div>

          {filteredEquipment.length === 0 ? (
            <Card className="mt-16">
              <Empty
                icon="zap"
                title={t('Không tìm thấy thiết bị')}
                desc={t('Thử nới lỏng bộ lọc hoặc tìm với từ khoá khác.')}
                action={<Button onClick={() => { setEquipSub('all'); setQ(''); }}>{t('Hiện tất cả dụng cụ')}</Button>}
              />
            </Card>
          ) : (
            <div className="kb-grid mt-16">
              {filteredEquipment.map((eq) => {
                const isFav = favEquipmentKeys.has(eq.key);
                return (
                  <article key={eq.key} className="kb-card">
                    <Link to={`/equipment/${eq.key}`} className="kb-cover">
                      <ExerciseMedia
                        imageKey={eq.imageKey || (eq as any).coverExerciseKey || EQUIPMENT_BY_KEY.get(eq.key as any)?.cover}
                        alt={eq.name}
                        playOnHover
                        className="ex-media"
                        fallback={
                          <div className="ex-media ex-media-empty">
                            <Icon name="zap" size={32} />
                          </div>
                        }
                      />
                    </Link>

                    <div className="kb-body">
                      <div className="row between items-start">
                        <div>
                          <div className="mb-4">
                            <span className="badge badge-sm">{t(EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category)}</span>
                          </div>
                          <h3 className="kb-title">
                            <Link to={`/equipment/${eq.key}`} className="text-ink">
                              {eq.name}
                            </Link>
                          </h3>
                          {eq.nameEn && <div className="tiny faint">{eq.nameEn}</div>}
                        </div>

                        <button
                          type="button"
                          className={`kb-action-star ${isFav ? 'active' : ''}`}
                          onClick={() => void toggleFavoriteEquipment(eq)}
                          title={isFav ? t('Bỏ yêu thích') : t('Lưu vào yêu thích')}
                        >
                          <Icon name="star" size={18} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {eq.shortDesc && <p className="small muted text-clamp-2">{eq.shortDesc}</p>}

                      {/* Snippets for Adjustment and Common Mistakes */}
                      {eq.adjustmentInstructions && (
                        <div className="tiny text-muted mt-2" style={{ borderLeft: '2px solid var(--primary)', paddingLeft: 8 }}>
                          <b>{t('Cách chỉnh:')}</b> {eq.adjustmentInstructions}
                        </div>
                      )}

                      <div className="row between items-center mt-auto pt-10" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-primary"
                          onClick={() => filterByEquipmentKey(eq.key)}
                          title={t('Xem các bài tập dùng thiết bị này')}
                        >
                          <Icon name="dumbbell" size={13} className="mr-4" />
                          <span>{t('{n} bài tập', { n: eq.exerciseCount })}</span>
                        </button>

                        <Link to={`/equipment/${eq.key}`} className="btn btn-secondary btn-xs">
                          <span>{t('Chi tiết')}</span>
                          <Icon name="arrowRight" size={12} className="ml-2" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          TAB E: KIẾN THỨC NHÓM CƠ (ANATOMY)
         ======================================================== */}
      {activeTab === 'anatomy' && (
        <section aria-labelledby="anatomy-tab-title">
          <Card className="p-16 mb-20">
            <div className="row between items-center mb-16 flex-wrap gap-12">
              <div>
                <h3 className="text-lg font-bold">{t('Bản đồ tương tác giải phẫu cơ thể')}</h3>
                <p className="tiny muted">{t('Bấm vào từng vùng cơ trên mô hình để làm nổi bật thông tin hoặc nhấn "Xem bài tập" để lọc thư viện.')}</p>
              </div>

              <div className="row gap-8 items-center flex-wrap">
                {muscle && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMuscle(null)}
                  >
                    {t('Bỏ chọn vùng cơ')}
                  </Button>
                )}
                <div className="row gap-4">
                  <Button
                    size="sm"
                    variant={anatomyView === 'both' ? 'primary' : 'ghost'}
                    onClick={() => setAnatomyView('both')}
                  >
                    {t('Cả hai mặt')}
                  </Button>
                  <Button
                    size="sm"
                    variant={anatomyView === 'front' ? 'primary' : 'ghost'}
                    onClick={() => setAnatomyView('front')}
                  >
                    {t('Mặt trước')}
                  </Button>
                  <Button
                    size="sm"
                    variant={anatomyView === 'back' ? 'primary' : 'ghost'}
                    onClick={() => setAnatomyView('back')}
                  >
                    {t('Mặt sau')}
                  </Button>
                </div>
              </div>
            </div>

            <div style={{ maxWidth: anatomyView === 'both' ? 560 : 320, margin: '0 auto' }}>
              <MuscleMap
                size="lg"
                counts={muscleCounts}
                selected={muscle}
                onSelect={(mKey) => setMuscle(mKey)}
                views={anatomyView}
              />
            </div>

            {/* Visual Heatmap Color Legend */}
            <div className="row center items-center gap-16 mt-16 pt-12 flex-wrap" style={{ borderTop: '1px solid var(--hairline)' }}>
              <div className="tiny font-bold uppercase faint">{t('Chú giải màu sắc:')}</div>
              <div className="row items-center gap-6 tiny text-muted">
                <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--surface-2)', border: '1px solid var(--hairline)' }} />
                <span>{t('Chưa chọn')}</span>
              </div>
              <div className="row items-center gap-6 tiny text-muted">
                <span style={{ width: 14, height: 14, borderRadius: 3, background: 'color-mix(in srgb, var(--primary-bright) 35%, var(--surface-2))' }} />
                <span>{t('Mật độ bài tập ít')}</span>
              </div>
              <div className="row items-center gap-6 tiny text-muted">
                <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--primary-bright)' }} />
                <span>{t('Mật độ bài tập cao')}</span>
              </div>
              <div className="row items-center gap-6 tiny text-muted">
                <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--primary-bright)', outline: '2px solid #fff', outlineOffset: '-1px' }} />
                <span>{t('Vùng cơ đang chọn')}</span>
              </div>
            </div>
          </Card>

          {/* 18 thẻ chi tiết giải phẫu từng nhóm cơ */}
          <div className="anatomy-grid">
            {MUSCLES.map((m) => {
              const detail = ANATOMY_DETAILS[m.key];
              const isSelected = muscle === m.key;
              const count = muscleCounts[m.key] ?? 0;

              return (
                <article
                  key={m.key}
                  className={`anatomy-card ${isSelected ? 'border-primary' : ''}`}
                  style={isSelected ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 2px var(--primary-bright)' } : undefined}
                >
                  <div className="anatomy-head">
                    <div>
                      <h4 className="anatomy-title">{t(m.label)}</h4>
                      <div className="anatomy-sub">{detail?.nameEn || m.labelEn}</div>
                    </div>
                    <span className="badge badge-sm">{muscleLabel[m.group]}</span>
                  </div>

                  <div className="anatomy-sec">
                    <span className="anatomy-label">{t('Vị trí & Chức năng sinh học')}</span>
                    <p className="anatomy-val">{detail?.locationAndFunction || m.hint}</p>
                  </div>

                  <div className="anatomy-sec">
                    <span className="anatomy-label">{t('Nhóm cơ chính & Cơ phụ liên đới')}</span>
                    <p className="anatomy-val">{detail?.primaryAndSecondary || t('Hỗ trợ cân bằng ổ khớp và phát lực.')}</p>
                  </div>

                  {detail?.commonEquipment && (
                    <div className="anatomy-sec">
                      <span className="anatomy-label">{t('Thiết bị thường dùng')}</span>
                      <div className="row wrap gap-4 mt-2">
                        {detail.commonEquipment.map((eqName) => (
                          <span key={eqName} className="badge badge-sm">{eqName}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail?.proTip && (
                    <div className="tiny text-muted mt-2" style={{ borderLeft: '2px solid #f59e0b', paddingLeft: 8 }}>
                      <b>{t('Mẹo tập:')}</b> {detail.proTip}
                    </div>
                  )}

                  <div className="row between items-center mt-auto pt-10" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                    <span className="tiny faint">{t('{n} bài tập tác động', { n: count })}</span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => filterByMuscle(m.key)}
                    >
                      <span>{t('Xem bài tập')}</span>
                      <Icon name="arrowRight" size={13} className="ml-4" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB F: HƯỚNG DẪN TẬP LUYỆN (GUIDES)
         ======================================================== */}
      {activeTab === 'guides' && (
        <section aria-labelledby="guides-tab-title">
          <div className="grid grid-2 gap-16">
            {TRAINING_GUIDES.map((guide) => (
              <article
                key={guide.id}
                className="guide-card"
                onClick={() => setReadingGuide(guide)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setReadingGuide(guide); }}
              >
                <div className="row items-center gap-12">
                  <div className="guide-card-icon">
                    <Icon name={guide.icon as any || 'clipboard'} size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="row between items-center">
                      <span className="badge badge-sm badge-primary">{t(guide.category)}</span>
                      <span className="tiny faint">{guide.readTime}</span>
                    </div>
                    <h3 className="text-base font-bold text-ink mt-2">{guide.title}</h3>
                  </div>
                </div>

                <p className="small muted text-clamp-2 mt-4">{guide.summary}</p>

                <div className="row between items-center mt-auto pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                  <span className="tiny text-primary font-semibold">{t('Xem hướng dẫn từng bước')}</span>
                  <Icon name="arrowRight" size={14} className="text-primary" />
                </div>
              </article>
            ))}
          </div>

          {/* Reader Modal for Guides */}
          {readingGuide && (
            <Modal
              title={readingGuide.title}
              size="large"
              onClose={() => setReadingGuide(null)}
              footer={
                <Button variant="primary" onClick={() => setReadingGuide(null)}>
                  {t('Đã hiểu, đóng hướng dẫn')}
                </Button>
              }
            >
              <div className="guide-reader">
                <div className="guide-callout">
                  <b>{t('Tóm tắt cốt lõi:')}</b> {readingGuide.summary}
                </div>

                <div>
                  <h3>{t('1. Các nguyên tắc khoa học bắt buộc')}</h3>
                  <ul className="stack gap-6 pl-18">
                    {readingGuide.principles.map((pr, i) => (
                      <li key={i}>{pr}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3>{t('2. Hướng dẫn thực hành từng bước')}</h3>
                  <div className="stack gap-8">
                    {readingGuide.stepByStep.map((step, i) => (
                      <div key={i} className="ex-step-item">
                        <span className="ex-step-num">{i + 1}</span>
                        <span className="ex-step-text">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3>{t('3. Lỗi thường gặp & Cách khắc phục')}</h3>
                  <div className="stack gap-10">
                    {readingGuide.mistakesAndFixes.map((mf, i) => (
                      <div key={i} className="p-12 rounded bg-rail border border-hairline-soft">
                        <div className="text-sm font-semibold text-danger">⚠️ {mf.mistake}</div>
                        <div className="text-sm text-ink mt-2">💡 <b>{t('Cách sửa:')}</b> {mf.fix}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3>{t('4. Bảng kiểm Nên & Không nên')}</h3>
                  <div className="dos-donts-grid">
                    <div className="dos-box">
                      <b>✓ {t('Nên làm')}</b>
                      {readingGuide.dos.map((item, i) => (
                        <div key={i}>• {item}</div>
                      ))}
                    </div>
                    <div className="donts-box">
                      <b>✕ {t('Không nên')}</b>
                      {readingGuide.donts.map((item, i) => (
                        <div key={i}>• {item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </section>
      )}

      {/* ========================================================
          TAB G: ĐÃ LƯU YÊU THÍCH (FAVORITES)
         ======================================================== */}
      {activeTab === 'favorites' && (
        <section aria-labelledby="favorites-tab-title">
          <div className="mb-16">
            <h3 className="text-base font-bold">{t('Bài tập đã lưu yêu thích ({n})', { n: favoriteExercises.length })}</h3>
          </div>

          {favoriteExercises.length === 0 ? (
            <Card className="mb-24">
              <Empty
                icon="star"
                title={t('Chưa có bài tập yêu thích nào')}
                desc={t('Bấm vào biểu tượng ngôi sao trên bất kỳ bài tập nào để lưu vào đây để truy cập nhanh.')}
                action={<Button onClick={() => setActiveTab('exercises')}>{t('Khám phá thư viện bài tập')}</Button>}
              />
            </Card>
          ) : (
            <div className="grid grid-3 mb-24">
              {favoriteExercises.map((ex) => (
                <Card key={ex.id} className="hoverable ex-card">
                  <Link to={`/exercises/${ex.id}`} className="ex-thumb-btn">
                    <ExerciseMedia
                      imageKey={ex.imageKey}
                      alt={exTitle(ex)}
                      className="ex-thumb"
                      fallback={
                        <div className="ex-thumb ex-thumb-map">
                          <MuscleMap size="sm" primary={targetOf(ex)} secondary={secondaryOf(ex)} />
                        </div>
                      }
                    />
                  </Link>

                  <div className="top">
                    <div className="row items-start justify-between flex-1">
                      <div>
                        <Link to={`/exercises/${ex.id}`} className="ex-title">
                          {exTitle(ex)}
                        </Link>
                        <div className="tiny muted">{muscleLabel[ex.muscleGroup]}</div>
                      </div>
                      <button
                        type="button"
                        className="kb-action-star active"
                        onClick={() => void toggleFavoriteExercise(ex)}
                        title={t('Bỏ yêu thích')}
                      >
                        <Icon name="star" size={18} fill="currentColor" />
                      </button>
                    </div>
                  </div>

                  <div className="row between items-center mt-12 pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                    <Link to={`/me/schedule?exerciseId=${ex.id}`} className="btn btn-ghost btn-xs text-primary">
                      <Icon name="calendar" size={13} className="mr-4" />
                      <span>{t('Thêm vào lịch')}</span>
                    </Link>
                    <Link to={`/exercises/${ex.id}`} className="btn btn-secondary btn-xs">
                      <span>{t('Chi tiết')}</span>
                      <Icon name="arrowRight" size={12} className="ml-2" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mb-16">
            <h3 className="text-base font-bold">{t('Dụng cụ đã lưu yêu thích ({n})', { n: favoriteEquipment.length })}</h3>
          </div>

          {favoriteEquipment.length === 0 ? (
            <Card>
              <Empty
                icon="zap"
                title={t('Chưa có dụng cụ yêu thích nào')}
                desc={t('Bấm vào biểu tượng ngôi sao trên bất kỳ dụng cụ nào để lưu vào danh sách.')}
                action={<Button onClick={() => setActiveTab('equipment')}>{t('Khám phá kho dụng cụ')}</Button>}
              />
            </Card>
          ) : (
            <div className="kb-grid">
              {favoriteEquipment.map((eq) => (
                <article key={eq.key} className="kb-card">
                  <Link to={`/equipment/${eq.key}`} className="kb-cover">
                    <ExerciseMedia
                      imageKey={eq.imageKey || (eq as any).coverExerciseKey || EQUIPMENT_BY_KEY.get(eq.key as any)?.cover}
                      alt={eq.name}
                      className="ex-media"
                    />
                  </Link>
                  <div className="kb-body">
                    <div className="row between items-start">
                      <div>
                        <div className="mb-4">
                          <span className="badge badge-sm">{t(EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category)}</span>
                        </div>
                        <h4 className="kb-title">
                          <Link to={`/equipment/${eq.key}`} className="text-ink">{eq.name}</Link>
                        </h4>
                        {eq.nameEn && <div className="tiny faint">{eq.nameEn}</div>}
                      </div>
                      <button
                        type="button"
                        className="kb-action-star active"
                        onClick={() => void toggleFavoriteEquipment(eq)}
                        title={t('Bỏ yêu thích')}
                      >
                        <Icon name="star" size={18} fill="currentColor" />
                      </button>
                    </div>
                    {eq.shortDesc && <p className="small muted text-clamp-2">{eq.shortDesc}</p>}
                    <div className="row between items-center mt-auto pt-8">
                      <Link to={`/equipment/${eq.key}`} className="btn btn-secondary btn-xs">
                        <span>{t('Chi tiết')}</span>
                        <Icon name="arrowRight" size={12} className="ml-2" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          TAB H: BÀI TẬP TRAINER GIAO (ASSIGNED)
         ======================================================== */}
      {activeTab === 'assigned' && assignedPlan && (
        <section aria-labelledby="assigned-tab-title">
          <Card className="p-16 mb-20">
            <div className="row between items-center">
              <div>
                <span className="badge badge-primary">{t('Giáo án hiện tại')}</span>
                <h3 className="text-lg font-bold mt-4">{assignedPlan.summary.name}</h3>
                <div className="tiny muted mt-2">
                  {assignedPlan.summary.trainerName && (
                    <span>{t('HLV phụ trách:')} <b>{assignedPlan.summary.trainerName}</b> · </span>
                  )}
                  <span>{t('Mục tiêu:')} {assignedPlan.summary.goal || t('Cải thiện thể lực')}</span>
                </div>
              </div>

              <Link to="/me/plan" className="btn btn-secondary btn-sm">
                <span>{t('Xem toàn bộ giáo án')}</span>
                <Icon name="arrowRight" size={14} className="ml-4" />
              </Link>
            </div>
          </Card>

          <div className="grid grid-3">
            {assignedExerciseItems.map((item, idx) => {
              const ex = item.exerciseDetail;
              return (
                <Card key={idx} className="hoverable ex-card">
                  {ex && (
                    <Link to={`/exercises/${ex.id}`} className="ex-thumb-btn">
                      <ExerciseMedia
                        imageKey={ex.imageKey}
                        alt={exTitle(ex)}
                        className="ex-thumb"
                      />
                    </Link>
                  )}

                  <div className="top">
                    <div>
                      <h4 className="font-bold text-ink">
                        {ex ? exTitle(ex) : item.exerciseName || t('Bài tập #{id}', { id: item.exerciseId })}
                      </h4>
                      <div className="tiny text-primary font-semibold mt-2">
                        {t('Thứ {day}', { day: item.dayOfWeek + 1 })} · {item.sets} {t('hiệp')} x {item.reps} {t('lần')}
                        {item.weightKg ? ` @ ${item.weightKg} kg` : ''}
                      </div>
                    </div>
                  </div>

                  {item.note && (
                    <div className="tiny muted p-8 rounded bg-rail mt-4">
                      💬 <b>{t('Ghi chú của HLV:')}</b> {item.note}
                    </div>
                  )}

                  <div className="row between items-center mt-auto pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                    <Link to={`/me/schedule?exerciseId=${item.exerciseId}`} className="btn btn-primary btn-xs">
                      <Icon name="calendar" size={13} className="mr-4" />
                      <span>{t('Thêm vào lịch')}</span>
                    </Link>

                    {ex && (
                      <Link to={`/exercises/${ex.id}`} className="btn btn-secondary btn-xs">
                        <span>{t('Chi tiết')}</span>
                        <Icon name="arrowRight" size={12} className="ml-2" />
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
