/**
 * V13 · Dụng cụ tập: mỗi loại có ảnh minh hoạ, cách dùng an toàn, số bài trong thư viện
 * và lối tắt sang Thư viện bài tập đã lọc sẵn theo dụng cụ đó.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Exercise } from '../../api/types';
import { ExerciseMedia, mediaCredit } from '../../components/ExerciseMedia';
import { Icon } from '../../components/Icon';
import { ErrorState, LoadingBlock, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import { EQUIPMENT, MUSCLE_BY_KEY, type EquipmentKey, type MuscleKey } from '../../lib/anatomy';
import { useAsync } from '../../lib/hooks';
import './kb.css';

export default function Equipment() {
  const { data, error, loading, reload } = useAsync(() => api.get<Exercise[]>('/exercises'), []);
  const stats = useMemo(() => {
    type Stat = { n: number; examples: Exercise[]; muscles: Map<MuscleKey, number> };
    const m = new Map<EquipmentKey, Stat>();
    (data ?? []).forEach((e) => (e.equipmentKeys ?? []).forEach((k) => {
      const s: Stat = m.get(k as EquipmentKey) ?? { n: 0, examples: [], muscles: new Map() };
      s.n += 1;
      s.examples.push(e);
      (e.targetMuscles ?? []).forEach((x) => s.muscles.set(x as MuscleKey, (s.muscles.get(x as MuscleKey) ?? 0) + 1));
      m.set(k as EquipmentKey, s);
    }));
    // Bài có ảnh và đã duyệt lên trước để làm ví dụ
    m.forEach((s) => s.examples.sort((a, b) => Number(!!b.imageKey) - Number(!!a.imageKey) || Number(b.reviewStatus === 'APPROVED') - Number(a.reviewStatus === 'APPROVED')));
    return m;
  }, [data]);

  return (
    <div className="page">
      <PageHead eyebrow="Kho kiến thức" title="Dụng cụ tập"
        desc="Các loại dụng cụ trong phòng tập, cách dùng an toàn và những bài tập dùng đến chúng. Bấm vào một dụng cụ để xem toàn bộ bài." />

      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingBlock rows={6} /> : (
        <>
          <div className="kb-grid">
            {EQUIPMENT.map((x) => {
              const s = stats.get(x.key);
              const top = s ? [...s.muscles.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k) : [];
              return (
                <article key={x.key} className="kb-card">
                  <Link to={`/exercises?equipment=${x.key}`} className="kb-cover" aria-label={t('Xem bài tập dùng {name}', { name: t(x.label) })}>
                    <ExerciseMedia imageKey={x.cover} alt={t(x.label)} playOnHover tag={s ? t('{n} bài', { n: s.n }) : t('Chưa có bài')} />
                  </Link>
                  <div className="kb-body">
                    <div>
                      <h3 className="kb-title">{t(x.label)}</h3>
                      <div className="tiny faint">{x.labelEn}</div>
                    </div>
                    <p className="small muted kb-desc">{t(x.desc)}</p>
                    {top.length > 0 && (
                      <div className="chips">
                        {top.map((k) => <Link key={k} to={`/exercises?equipment=${x.key}&muscle=${k}`} className="chip">{t(MUSCLE_BY_KEY.get(k)?.label ?? k)}</Link>)}
                      </div>
                    )}
                    <ul className="kb-tips">
                      {x.tips.map((tip) => <li key={tip}><Icon name="check" size={13} /><span>{t(tip)}</span></li>)}
                    </ul>
                    {s && s.examples.length > 0 && (
                      <div className="kb-examples tiny muted">
                        <b>{t('Bài tiêu biểu:')}</b> {s.examples.slice(0, 4).map((e) => e.name).join(' · ')}
                      </div>
                    )}
                    <Link to={`/exercises?equipment=${x.key}`} className="btn btn-secondary btn-sm kb-cta">
                      <span>{s ? t('Xem {n} bài tập', { n: s.n }) : t('Mở thư viện bài tập')}</span><Icon name="arrowRight" size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="tiny faint mt-16">{mediaCredit()}</p>
        </>
      )}
    </div>
  );
}
