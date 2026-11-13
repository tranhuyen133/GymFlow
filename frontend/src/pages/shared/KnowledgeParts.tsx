/**
 * V30 · Thành phần giao diện Kho kiến thức: thẻ bài tập có ảnh động, ô danh mục có bản đồ cơ thu nhỏ,
 * bản đồ giải phẫu cỡ lớn kiểu atlas (thân trên / cơ lõi / thân dưới / linh hoạt).
 */
import { Link } from 'react-router-dom';
import type { Exercise, MuscleDetail, MuscleSummary } from '../../api/types';
import { ExerciseMedia } from '../../components/ExerciseMedia';
import { Icon } from '../../components/Icon';
import { MuscleMap, muscleName } from '../../components/MuscleMap';
import { LoadingBlock } from '../../components/ui';
import { getLang, t } from '../../i18n';
import { EQUIPMENT_BY_KEY, isMuscleKey, MUSCLE_BY_KEY, parseMuscles, type EquipmentKey, type MuscleKey } from '../../lib/anatomy';
import { localizeExercise } from '../../lib/exercise';
import { exTitle, formatEquipment, levelLabel } from '../../lib/format';

export interface SubCategoryItem { key: string; label: string; muscles: MuscleKey[] }

export const STRENGTH_SUBCATS: SubCategoryItem[] = [
  { key: '', label: 'Tất cả', muscles: [] },
  { key: 'CHEST', label: 'Ngực', muscles: ['chest'] },
  { key: 'BACK', label: 'Lưng', muscles: ['upper-back', 'lower-back', 'trapezius'] },
  { key: 'SHOULDERS', label: 'Vai', muscles: ['front-deltoids', 'back-deltoids'] },
  { key: 'BICEPS', label: 'Tay trước', muscles: ['biceps', 'forearm'] },
  { key: 'TRICEPS', label: 'Tay sau', muscles: ['triceps'] },
  { key: 'CORE', label: 'Bụng', muscles: ['abs', 'obliques'] },
  { key: 'LEGS', label: 'Chân', muscles: ['quadriceps', 'hamstring', 'calves', 'adductor'] },
  { key: 'GLUTES', label: 'Mông', muscles: ['gluteal', 'abductors'] },
  { key: 'FULL_BODY', label: 'Toàn thân', muscles: ['chest', 'upper-back', 'quadriceps', 'gluteal', 'abs', 'front-deltoids'] },
];

export const WARMUP_SUBCATS: SubCategoryItem[] = [
  { key: '', label: 'Tất cả', muscles: [] },
  { key: 'FULL_BODY_WARMUP', label: 'Khởi động chung', muscles: ['quadriceps', 'gluteal', 'front-deltoids', 'abs'] },
  { key: 'SHOULDER_WARMUP', label: 'Kích hoạt vai & ngực', muscles: ['front-deltoids', 'back-deltoids', 'chest'] },
  { key: 'HIP_WARMUP', label: 'Kích hoạt mông & hông', muscles: ['gluteal', 'adductor', 'abductors'] },
  { key: 'KNEE_WARMUP', label: 'Khởi động khớp gối', muscles: ['quadriceps', 'hamstring'] },
  { key: 'JOINT_ROTATION', label: 'Xoay khớp', muscles: ['forearm', 'calves', 'neck'] },
  { key: 'DYNAMIC_STRETCH', label: 'Giãn cơ động', muscles: ['hamstring', 'upper-back', 'obliques'] },
  { key: 'MUSCLE_ACTIVATION', label: 'Kích hoạt cơ bắp', muscles: ['gluteal', 'abs'] },
];

export const CARDIO_SUBCATS: SubCategoryItem[] = [
  { key: '', label: 'Tất cả', muscles: [] },
  { key: 'RUNNING', label: 'Chạy bộ', muscles: ['quadriceps', 'calves', 'hamstring'] },
  { key: 'WALKING', label: 'Đi bộ', muscles: ['quadriceps', 'calves'] },
  { key: 'CYCLING', label: 'Đạp xe', muscles: ['quadriceps', 'gluteal'] },
  { key: 'JUMP_ROPE', label: 'Nhảy dây', muscles: ['calves', 'forearm'] },
  { key: 'ROWING', label: 'Máy chèo thuyền', muscles: ['upper-back', 'quadriceps', 'biceps'] },
  { key: 'STAIR_CLIMBER', label: 'Leo cầu thang', muscles: ['gluteal', 'quadriceps', 'calves'] },
  { key: 'HIIT', label: 'HIIT', muscles: ['quadriceps', 'abs', 'chest', 'front-deltoids'] },
];

export const SUBCAT_BY_KEY = new Map([...STRENGTH_SUBCATS, ...WARMUP_SUBCATS, ...CARDIO_SUBCATS].filter((s) => s.key).map((s) => [s.key, s]));

/** Nhóm vùng cơ theo kiểu atlas giải phẫu. */
export const MUSCLE_SECTIONS: { label: string; keys: MuscleKey[] }[] = [
  { label: 'Thân trên', keys: ['chest', 'front-deltoids', 'back-deltoids', 'biceps', 'triceps', 'forearm', 'trapezius', 'upper-back'] },
  { label: 'Cơ lõi', keys: ['abs', 'obliques', 'lower-back'] },
  { label: 'Thân dưới', keys: ['gluteal', 'quadriceps', 'hamstring', 'adductor', 'abductors', 'calves'] },
  { label: 'Linh hoạt & phục hồi', keys: ['neck'] },
];

const LEVEL_TONE: Record<string, string> = { BEGINNER: 'lv-b', INTERMEDIATE: 'lv-i', ADVANCED: 'lv-a' };

/** Ô danh mục: bản đồ cơ thu nhỏ tô vùng cơ của nhóm + tên + số bài. */
export function CategoryTile({ item, count, active, onClick }: { item: SubCategoryItem; count: number; active: boolean; onClick: () => void }) {
  const disabled = item.key !== '' && count === 0;
  return (
    <button type="button" className={`kb-cat ${active ? 'active' : ''}`} disabled={disabled} onClick={onClick} aria-pressed={active}>
      <span className="kb-cat-map" aria-hidden>
        {item.key === '' ? <Icon name="grid" size={22} /> : <MuscleMap size="xs" primary={item.muscles} />}
      </span>
      <span className="kb-cat-text">
        <b>{t(item.label)}</b>
        <small>{t('{n} bài', { n: count })}</small>
      </span>
    </button>
  );
}

/** Thẻ bài tập: ảnh động (rê chuột để chạy), cấp độ, vùng cơ chính, dụng cụ, liều gợi ý. */
export function ExerciseCard({ ex, isMember, onFavorite }: {
  ex: Exercise; isMember: boolean; onFavorite: (ex: Exercise, e: React.MouseEvent) => void;
}) {
  const lang = getLang();
  const muscles = parseMuscles((ex.targetMuscles ?? []).join(','));
  const sub = ex.subCategory ? SUBCAT_BY_KEY.get(ex.subCategory) : undefined;
  const { title, subtitle } = localizeExercise(ex, lang);
  const eqLabel = (ex.equipmentKeys ?? [])
    .map((k) => EQUIPMENT_BY_KEY.get(k as EquipmentKey))
    .filter(Boolean)
    .map((e) => (lang === 'en' ? e!.labelEn : e!.label))
    .join(' · ') || (ex.equipment ? formatEquipment(ex.equipment) : '');
  return (
    <Link to={`/exercises/${ex.id}`} className="kb-ex-card" aria-label={title}>
      <div className="kb-ex-media">
        <ExerciseMedia imageKey={ex.imageKey} alt={title} playOnHover
          fallback={
            <div className="kb-ex-fallback">
              <MuscleMap size="sm" primary={muscles.length ? muscles : sub?.muscles ?? []} />
            </div>
          } />
        <span className={`kb-level ${LEVEL_TONE[ex.level] ?? ''}`}>{levelLabel[ex.level] ? levelLabel[ex.level][0] : ex.level}</span>
        {isMember && (
          <button type="button" className={`kb-fav ${ex.isFavorite ? 'is-fav' : ''}`} onClick={(e) => onFavorite(ex, e)}
            title={t(ex.isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào bài tập yêu thích')}
            aria-label={t(ex.isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào bài tập yêu thích')}>
            <Icon name={ex.isFavorite ? 'heart' : 'star'} size={15} />
          </button>
        )}
      </div>
      <div className="kb-ex-body">
        <h3 className="kb-ex-title line-clamp-2">{title}</h3>
        {subtitle && <div className="kb-ex-sub line-clamp-1">{subtitle}</div>}
        {muscles.length > 0 && (
          <div className="kb-ex-muscles">
            {muscles.slice(0, 3).map((m) => <span key={m} className="kb-mchip">{muscleName(m, lang)}</span>)}
          </div>
        )}
        <div className="kb-ex-foot">
          <span className="kb-ex-eq line-clamp-1"><Icon name="dumbbell" size={13} />{eqLabel || t('Không dụng cụ')}</span>
          {ex.setsRepsHint && <span className="kb-ex-dose">{ex.setsRepsHint}</span>}
        </div>
      </div>
    </Link>
  );
}

/** Tiêu đề một nhóm bài khi xem "Tất cả". */
export function SectionHead({ item, count, onMore }: { item: SubCategoryItem; count: number; onMore: () => void }) {
  return (
    <div className="kb-sec-head">
      <span className="kb-sec-map" aria-hidden><MuscleMap size="xs" views="front" primary={item.muscles} /></span>
      <h3>{t(item.label)} <span>{count}</span></h3>
      <button type="button" className="kb-more" onClick={onMore}>{t('Xem tất cả')}<Icon name="arrowRight" size={14} /></button>
    </div>
  );
}

/** Atlas giải phẫu: cơ thể cỡ lớn bên trái, danh sách nhóm cơ hoặc chi tiết vùng cơ bên phải. */
export function MuscleAtlas({ muscles, selected, onSelect, hover, onHover, detail, detailLoading }: {
  muscles: MuscleSummary[]; selected: MuscleKey | null; onSelect: (k: MuscleKey | null) => void;
  hover: MuscleKey | null; onHover: (k: MuscleKey | null) => void;
  detail: MuscleDetail | null | undefined; detailLoading: boolean;
}) {
  const lang = getLang();
  const byKey = new Map(muscles.map((m) => [m.key, m]));
  const counts: Partial<Record<MuscleKey, number>> = {};
  for (const m of muscles) if (isMuscleKey(m.key)) counts[m.key] = m.exerciseCount;
  const focus = hover ?? selected;
  const focusInfo = focus ? MUSCLE_BY_KEY.get(focus) : null;

  return (
    <div className="atlas">
      <div className="atlas-stage">
        <div className="atlas-head">
          <span className="kb-eyebrow">{t('Giải phẫu')}</span>
          <h2>{t('Các nhóm cơ trên cơ thể')}</h2>
          <p>{t('Di chuột hoặc chạm vào vùng cơ để xem tên, nhấn để xem bài tập.')}</p>
        </div>
        <MuscleMap size="xl" hideTip counts={counts} selected={selected} onSelect={onSelect} onHover={onHover} />
        <div className={`atlas-hover ${focusInfo ? 'on' : ''}`} aria-live="polite">
          {focusInfo ? (
            <>
              <b>{muscleName(focusInfo.key, lang)}</b>
              <span>{lang === 'en' ? focusInfo.label : focusInfo.labelEn}</span>
              <em>{t('{n} bài', { n: counts[focusInfo.key] ?? 0 })}</em>
            </>
          ) : <span>{t('Chọn một nhóm cơ')}</span>}
        </div>
      </div>

      <aside className="atlas-panel">
        {selected ? (
          <div className="atlas-detail">
            <button type="button" className="kb-back" onClick={() => onSelect(null)}>
              <Icon name="arrowLeft" size={14} /><span>{t('Tất cả nhóm cơ')}</span>
            </button>
            <h3>{muscleName(selected, lang)}</h3>
            <div className="atlas-sub">{lang === 'en' ? MUSCLE_BY_KEY.get(selected)?.label : MUSCLE_BY_KEY.get(selected)?.labelEn}</div>
            {detailLoading || !detail ? <LoadingBlock rows={5} /> : (
              <>
                <p className="atlas-desc">{detail.description || t(detail.hint)}</p>
                <div className="atlas-label">{t('Bài tập tác động chính ({n})', { n: detail.primaryExercises.length })}</div>
                <div className="atlas-ex-list">
                  {detail.primaryExercises.slice(0, 8).map((pe) => {
                    return (
                      <Link key={pe.id} to={`/exercises/${pe.id}`} className="atlas-ex">
                        <ExerciseMedia imageKey={pe.imageKey} alt="" className="atlas-ex-thumb"
                          fallback={<div className="atlas-ex-thumb atlas-ex-blank"><Icon name="dumbbell" size={16} /></div>} />
                        <span className="line-clamp-2">{exTitle(pe)}</span>
                        <Icon name="chevronRight" size={14} />
                      </Link>
                    );
                  })}
                  {detail.primaryExercises.length === 0 && <p className="small muted">{t('Chưa có bài tập cho vùng cơ này.')}</p>}
                </div>
                {detail.secondaryExercises.length > 0 && (
                  <>
                    <div className="atlas-label">{t('Bài tập tác động bổ trợ ({n})', { n: detail.secondaryExercises.length })}</div>
                    <div className="atlas-chips">
                      {detail.secondaryExercises.slice(0, 8).map((se) => {
                        return <Link key={se.id} to={`/exercises/${se.id}`} className="kb-mchip link">{exTitle(se)}</Link>;
                      })}
                    </div>
                  </>
                )}
                {detail.commonEquipment.length > 0 && (
                  <>
                    <div className="atlas-label">{t('Dụng cụ thường dùng')}</div>
                    <div className="atlas-chips">
                      {detail.commonEquipment.map((eq) => {
                        const info = EQUIPMENT_BY_KEY.get(eq.key as EquipmentKey);
                        return <Link key={eq.key} to={`/equipment/${eq.key}`} className="kb-mchip link">{lang === 'en' ? info?.labelEn ?? t(eq.name) : info?.label ?? eq.name}</Link>;
                      })}
                    </div>
                  </>
                )}
                <Link to={`/knowledge?tab=exercises&muscle=${selected}`} className="btn btn-primary btn-sm atlas-cta">
                  <span>{t('Xem toàn bộ bài tập')}</span><Icon name="arrowRight" size={14} />
                </Link>
              </>
            )}
          </div>
        ) : (
          MUSCLE_SECTIONS.map((sec) => (
            <section key={sec.label} className="atlas-group">
              <h4>{t(sec.label)}</h4>
              <div className="atlas-items">
                {sec.keys.map((k) => {
                  const n = byKey.get(k)?.exerciseCount ?? 0;
                  return (
                    <button key={k} type="button" className={`atlas-item ${hover === k ? 'hl' : ''}`} disabled={n === 0}
                      onMouseEnter={() => onHover(k)} onMouseLeave={() => onHover(null)} onClick={() => onSelect(k)}>
                      <span>{muscleName(k, lang)}</span><b>{n}</b>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </aside>
    </div>
  );
}
