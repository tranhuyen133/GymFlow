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
  { key: 'SHOULDERS', label: 'Vai', muscles: ['front-deltoids', 'side-deltoids', 'back-deltoids'] },
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
const LEVEL_DOTS: Record<string, number> = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };

/** Mô tả ngắn cho đầu mục mỗi nhóm bài (banner nhóm cơ). */
export const SUBCAT_DESC: Record<string, string> = {
  CHEST: 'Ngực trên · giữa · dưới – các bài đẩy, ép và dang tay.',
  BACK: 'Xô, lưng giữa, lưng dưới và cơ thang – các bài kéo, chèo và gập hông.',
  SHOULDERS: 'Vai trước · vai giữa · vai sau – đẩy qua đầu, dang tay và kéo mặt.',
  BICEPS: 'Cơ tay trước và cẳng tay – các biến thể cuốn tạ.',
  TRICEPS: 'Cơ tay sau – duỗi tay, chống đẩy hẹp và nhún xà kép.',
  CORE: 'Bụng thẳng và cơ liên sườn – gập, xoay, giữ thăng bằng thân.',
  LEGS: 'Đùi trước, đùi sau, đùi trong và bắp chân – squat, lunge, đẩy chân.',
  GLUTES: 'Cơ mông lớn và mông nhỡ – đẩy hông, cầu mông, dạng chân.',
  FULL_BODY: 'Bài đa khớp dùng nhiều nhóm cơ cùng lúc, đốt nhiều calo.',
};

/** Nhóm dụng cụ cho bộ lọc nhanh trong một nhóm cơ (khớp khoá EQUIPMENT trong lib/anatomy). */
export const EQUIP_GROUPS: { key: string; label: string; icon: 'dumbbell' | 'layers' | 'user' | 'zap'; keys: string[] }[] = [
  { key: 'barbell', label: 'Tạ đòn', icon: 'zap', keys: ['barbell', 'ez-bar'] },
  { key: 'dumbbell', label: 'Tạ đơn & tạ ấm', icon: 'dumbbell', keys: ['dumbbell', 'kettlebell', 'plate'] },
  { key: 'machine', label: 'Máy & cáp', icon: 'layers', keys: ['machine', 'smith-machine', 'cable'] },
  { key: 'bodyweight', label: 'Không dụng cụ', icon: 'user', keys: ['bodyweight', 'pullup-bar', 'dip-bars', 'band'] },
];

/** Bài thuộc nhóm dụng cụ nào; bài không ghi dụng cụ tính là "Không dụng cụ". */
export function inEquipGroup(ex: Exercise, group: string): boolean {
  const g = EQUIP_GROUPS.find((x) => x.key === group);
  if (!g) return true;
  const keys = ex.equipmentKeys ?? [];
  if (keys.length === 0) return group === 'bodyweight' && !ex.equipment;
  return keys.some((k) => g.keys.includes(k));
}

export function groupStats(items: Exercise[]) {
  return {
    total: items.length,
    home: items.filter((e) => e.location === 'HOME' || e.location === 'ANY').length,
    machine: items.filter((e) => inEquipGroup(e, 'machine')).length,
    beginner: items.filter((e) => e.level === 'BEGINNER').length,
  };
}

/** Banner đầu nhóm cơ: bản đồ cơ mặt trước + sau, mô tả, các chỉ số nhanh. */
export function GroupBanner({ item, items }: { item: SubCategoryItem; items: Exercise[] }) {
  const s = groupStats(items);
  const desc = SUBCAT_DESC[item.key];
  return (
    <section className="kbg-banner" aria-label={t(item.label)}>
      <div className="kbg-banner-map" aria-hidden>
        <MuscleMap size="sm" primary={item.muscles} hideTip />
      </div>
      <div className="kbg-banner-text">
        <span className="kb-eyebrow">{t('Nhóm cơ')}</span>
        <h2>{t(item.label)}</h2>
        {desc && <p>{t(desc)}</p>}
        <div className="kbg-stats">
          <span><b>{s.total}</b>{t('bài tập')}</span>
          <span><Icon name="home" size={13} /><b>{s.home}</b>{t('tập tại nhà')}</span>
          <span><Icon name="layers" size={13} /><b>{s.machine}</b>{t('dùng máy')}</span>
          <span><Icon name="star" size={13} /><b>{s.beginner}</b>{t('cho người mới')}</span>
        </div>
      </div>
    </section>
  );
}

/** Bộ lọc nhanh theo dụng cụ trong nhóm đang xem (có đếm). */
export function EquipTabs({ items, value, onChange }: { items: Exercise[]; value: string; onChange: (v: string) => void }) {
  const groups = EQUIP_GROUPS.map((g) => ({ ...g, n: items.filter((e) => inEquipGroup(e, g.key)).length })).filter((g) => g.n > 0);
  if (groups.length < 2) return null;
  return (
    <div className="kbg-equip" role="group" aria-label={t('Lọc theo dụng cụ')}>
      <button type="button" className={`kbg-tab ${value === '' ? 'active' : ''}`} aria-pressed={value === ''} onClick={() => onChange('')}>
        {t('Mọi dụng cụ')}<i>{items.length}</i>
      </button>
      {groups.map((g) => (
        <button key={g.key} type="button" className={`kbg-tab ${value === g.key ? 'active' : ''}`} aria-pressed={value === g.key}
          onClick={() => onChange(value === g.key ? '' : g.key)}>
          <Icon name={g.icon} size={14} />{t(g.label)}<i>{g.n}</i>
        </button>
      ))}
    </div>
  );
}

/** Dải kéo ngang "Bắt đầu từ đây": bài cấp độ cơ bản của nhóm. */
export function BeginnerStrip({ items, isMember, onFavorite }: {
  items: Exercise[]; isMember: boolean; onFavorite: (ex: Exercise, e: React.MouseEvent) => void;
}) {
  const list = items.filter((e) => e.level === 'BEGINNER').slice(0, 8);
  if (list.length < 2) return null;
  return (
    <section className="kbg-start">
      <div className="kbg-start-head">
        <span className="kbg-start-icon"><Icon name="sparkle" size={16} /></span>
        <div>
          <h3>{t('Bắt đầu từ đây')}</h3>
          <p>{t('Bài cơ bản, dễ học kỹ thuật – hợp với người mới.')}</p>
        </div>
      </div>
      <div className="kbg-start-row">
        {list.map((ex) => <ExerciseCard key={ex.id} ex={ex} isMember={isMember} onFavorite={onFavorite} compact />)}
      </div>
    </section>
  );
}

/** Thanh nhóm cơ dính trên đầu khi xem "Tất cả": nhảy nhanh tới từng nhóm. */
export function GroupNav({ groups, active, onJump }: {
  groups: { item: SubCategoryItem; count: number }[]; active: string | null; onJump: (key: string) => void;
}) {
  if (groups.length < 2) return null;
  return (
    <nav className="kbg-nav" aria-label={t('Nhảy tới nhóm cơ')}>
      {groups.map(({ item, count }) => (
        <button key={item.key} type="button" className={`kbg-nav-item ${active === item.key ? 'active' : ''}`} onClick={() => onJump(item.key)}>
          {t(item.label)}<i>{count}</i>
        </button>
      ))}
    </nav>
  );
}

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

/** Thẻ bài tập: ảnh động (rê chuột để chạy), cấp độ dạng chấm, bản đồ cơ thu nhỏ, dụng cụ, liều gợi ý. */
export function ExerciseCard({ ex, isMember, onFavorite, compact }: {
  ex: Exercise; isMember: boolean; onFavorite: (ex: Exercise, e: React.MouseEvent) => void; compact?: boolean;
}) {
  const lang = getLang();
  const muscles = parseMuscles((ex.targetMuscles ?? []).join(','));
  const secondary = parseMuscles((ex.secondaryMuscleKeys ?? []).join(',')).filter((m) => !muscles.includes(m));
  const sub = ex.subCategory ? SUBCAT_BY_KEY.get(ex.subCategory) : undefined;
  const { title, subtitle } = localizeExercise(ex, lang);
  const dots = LEVEL_DOTS[ex.level] ?? 0;
  const eqLabel = (ex.equipmentKeys ?? [])
    .map((k) => EQUIPMENT_BY_KEY.get(k as EquipmentKey))
    .filter(Boolean)
    .map((e) => (lang === 'en' ? e!.labelEn : e!.label))
    .join(' · ') || (ex.equipment ? formatEquipment(ex.equipment) : '');
  return (
    <Link to={`/exercises/${ex.id}`} className={`kb-ex-card ${compact ? 'is-compact' : ''}`} aria-label={title}>
      <div className="kb-ex-media">
        <ExerciseMedia imageKey={ex.imageKey} alt={title} playOnHover
          fallback={
            <div className="kb-ex-fallback">
              <MuscleMap size="sm" primary={muscles.length ? muscles : sub?.muscles ?? []} />
            </div>
          } />
        <span className={`kb-level ${LEVEL_TONE[ex.level] ?? ''}`} title={levelLabel[ex.level] ? levelLabel[ex.level][0] : ex.level}>
          <span className="kbg-dots" aria-hidden>{[1, 2, 3].map((i) => <i key={i} className={i <= dots ? 'on' : ''} />)}</span>
          {levelLabel[ex.level] ? levelLabel[ex.level][0] : ex.level}
        </span>
        {ex.videoUrl && <span className="kbg-video" title={t('Có video hướng dẫn')}><Icon name="play" size={11} />{t('Video')}</span>}
        {isMember && (
          <button type="button" className={`kb-fav ${ex.isFavorite ? 'is-fav' : ''}`} onClick={(e) => onFavorite(ex, e)}
            title={t(ex.isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào bài tập yêu thích')}
            aria-label={t(ex.isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào bài tập yêu thích')}>
            <Icon name={ex.isFavorite ? 'heart' : 'star'} size={15} />
          </button>
        )}
      </div>
      <div className="kb-ex-body">
        <div className="kbg-title-row">
          <div className="kbg-title-col">
            <h3 className="kb-ex-title line-clamp-2">{title}</h3>
            {subtitle && !compact && <div className="kb-ex-sub line-clamp-1">{subtitle}</div>}
          </div>
          {muscles.length > 0 && !compact && (
            <span className="kbg-mini" aria-hidden><MuscleMap size="xs" views="front" primary={muscles} secondary={secondary} /></span>
          )}
        </div>
        {muscles.length > 0 && !compact && (
          <div className="kb-ex-muscles">
            {muscles.slice(0, 3).map((m) => <span key={m} className="kb-mchip">{muscleName(m, lang)}</span>)}
            {secondary.slice(0, 2).map((m) => <span key={m} className="kb-mchip kbg-soft">{muscleName(m, lang)}</span>)}
          </div>
        )}
        <div className="kb-ex-foot">
          <span className="kb-ex-eq line-clamp-1"><Icon name="dumbbell" size={13} />{eqLabel || t('Không dụng cụ')}</span>
          {ex.setsRepsHint && !compact && <span className="kb-ex-dose">{ex.setsRepsHint}</span>}
        </div>
      </div>
    </Link>
  );
}

/** Tiêu đề một nhóm bài khi xem "Tất cả": bản đồ cơ, tên, số bài, mô tả ngắn và chỉ số nhanh. */
export function SectionHead({ item, count, items, onMore }: { item: SubCategoryItem; count: number; items?: Exercise[]; onMore: () => void }) {
  const s = items ? groupStats(items) : null;
  const desc = SUBCAT_DESC[item.key];
  return (
    <div className="kb-sec-head kbg-sec-head">
      <span className="kb-sec-map kbg-sec-map" aria-hidden><MuscleMap size="xs" views="front" primary={item.muscles} /></span>
      <div className="kbg-sec-text">
        <h3>{t(item.label)} <span>{count}</span></h3>
        {(desc || s) && (
          <div className="kbg-sec-sub">
            {desc && <span className="kbg-sec-desc">{t(desc)}</span>}
            {s && s.home > 0 && <span className="kbg-sec-chip"><Icon name="home" size={12} />{t('{n} tại nhà', { n: s.home })}</span>}
            {s && s.beginner > 0 && <span className="kbg-sec-chip"><Icon name="star" size={12} />{t('{n} cho người mới', { n: s.beginner })}</span>}
          </div>
        )}
      </div>
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
