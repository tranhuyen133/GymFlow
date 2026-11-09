/**
 * Bản đồ cơ thể mặt trước + mặt sau. Dùng để:
 *  - lọc thư viện / trình soạn giáo án theo vùng cơ (onSelect + counts tô đậm theo số bài),
 *  - minh hoạ cơ chính (primary) và cơ phụ (secondary) của một bài tập.
 */
import { useState, type KeyboardEvent } from 'react';
import { t } from '../i18n';
import { MUSCLE_BY_KEY, type MuscleKey } from '../lib/anatomy';
import { BACK, FRONT, type BodyPart, type BodyShape } from './bodyShapes';
import './muscle-map.css';

const asMuscle = (p: BodyPart): MuscleKey | null => (p === 'head' || p === 'knees' ? null : p === 'soleus' ? 'calves' : p);

export function MuscleMap({ primary = [], secondary = [], selected = null, counts, onSelect, size = 'md', views = 'both', className = '' }: {
  primary?: MuscleKey[]; secondary?: MuscleKey[]; selected?: MuscleKey | null;
  /** Số bài theo vùng cơ: vùng nhiều bài tô đậm hơn, vùng 0 bài mờ và không bấm được. */
  counts?: Partial<Record<MuscleKey, number>>;
  onSelect?: (k: MuscleKey | null) => void;
  size?: 'sm' | 'md' | 'lg'; views?: 'both' | 'front' | 'back'; className?: string;
}) {
  const [hover, setHover] = useState<MuscleKey | null>(null);
  const max = counts ? Math.max(1, ...Object.values(counts).map((n) => n ?? 0)) : 1;
  const interactive = !!onSelect;

  const level = (k: MuscleKey) => {
    if (!counts) return 0;
    const n = counts[k] ?? 0;
    return n === 0 ? 0 : Math.max(1, Math.ceil((n / max) * 4));
  };

  const pick = (k: MuscleKey) => {
    if (!onSelect) return;
    if (counts && !(counts[k] ?? 0) && selected !== k) return;
    onSelect(selected === k ? null : k);
  };
  const onKey = (k: MuscleKey) => (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(k); } };

  const render = (shapes: BodyShape[], label: string) => (
    <figure className="mm-fig">
      <svg viewBox="-10 -10 1020 2230" className="mm-svg" role={interactive ? 'group' : 'img'} aria-label={label}>
        {shapes.map(({ part, points }) => {
          const m = asMuscle(part);
          if (!m) return points.map((p) => <polygon key={part + p} points={p} className="mm-part mm-static" />);
          const cls = ['mm-part',
            primary.includes(m) ? 'primary' : secondary.includes(m) ? 'secondary' : '',
            selected === m ? 'selected' : '', hover === m ? 'hover' : '',
            counts ? `lv${level(m)}` : '', interactive ? 'clickable' : ''].filter(Boolean).join(' ');
          const info = MUSCLE_BY_KEY.get(m);
          const disabled = !!counts && !(counts[m] ?? 0) && selected !== m;
          return (
            <g key={part} className={cls} data-disabled={disabled || undefined}
              tabIndex={interactive && !disabled ? 0 : undefined} role={interactive ? 'button' : undefined}
              aria-pressed={interactive ? selected === m : undefined}
              aria-label={interactive ? `${t(info?.label ?? m)}${counts ? ` · ${t('{n} bài', { n: counts[m] ?? 0 })}` : ''}` : undefined}
              onClick={() => pick(m)} onKeyDown={onKey(m)}
              onMouseEnter={() => setHover(m)} onMouseLeave={() => setHover((h) => (h === m ? null : h))}>
              {points.map((p) => <polygon key={p} points={p} />)}
            </g>
          );
        })}
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );

  const shown = hover ?? selected;
  const info = shown ? MUSCLE_BY_KEY.get(shown) : null;
  return (
    <div className={`mm mm-${size} ${className}`}>
      <div className="mm-bodies">
        {views !== 'back' && render(FRONT, t('Mặt trước'))}
        {views !== 'front' && render(BACK, t('Mặt sau'))}
      </div>
      {interactive && (
        <div className="mm-tip" aria-live="polite">
          {info ? <>
            <b>{t(info.label)}</b>
            {counts && <span className="mm-count">{t('{n} bài', { n: counts[info.key] ?? 0 })}</span>}
            <span className="tiny muted">{t(info.hint)}</span>
          </> : <span className="tiny muted">{t('Chạm vào một vùng cơ để xem các bài tập')}</span>}
        </div>
      )}
      {!interactive && (primary.length > 0 || secondary.length > 0) && (
        <div className="mm-legend">
          {primary.length > 0 && <span><i className="dot primary" />{primary.map((k) => t(MUSCLE_BY_KEY.get(k)?.label ?? k)).join(', ')}</span>}
          {secondary.length > 0 && <span><i className="dot secondary" />{secondary.map((k) => t(MUSCLE_BY_KEY.get(k)?.label ?? k)).join(', ')}</span>}
        </div>
      )}
    </div>
  );
}
