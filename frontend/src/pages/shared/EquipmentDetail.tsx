import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Equipment, Level } from '../../api/types';
import { ExerciseMedia, mediaCredit } from '../../components/ExerciseMedia';
import { Icon } from '../../components/Icon';
import { MuscleMap } from '../../components/MuscleMap';
import { Badge, Empty, ErrorState, LoadingBlock, PageHead, Pager } from '../../components/ui';
import { t } from '../../i18n';
import { MUSCLE_BY_KEY, parseMuscles, type MuscleKey } from '../../lib/anatomy';
import { useAsync, usePaged } from '../../lib/hooks';
import './kb.css';

const CATEGORY_LABELS: Record<string, string> = {
  FREE_WEIGHT: 'Tạ tự do',
  MACHINE: 'Máy tập khối tạ',
  CABLE: 'Máy kéo cáp',
  BODYWEIGHT: 'Trọng lượng cơ thể',
  CARDIO: 'Máy tim mạch',
  ACCESSORY: 'Phụ kiện tập luyện',
  RECOVERY: 'Phục hồi & giãn cơ',
};

const LEVEL_LABELS: Record<Level, string> = {
  BEGINNER: 'Người mới',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

export default function EquipmentDetail() {
  const { key = '' } = useParams<{ key: string }>();
  const { data: eq, error, loading, reload } = useAsync(() => api.get<Equipment>(`/equipment/${encodeURIComponent(key)}`), [key]);

  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<'' | Level>('');

  const muscles = useMemo(() => parseMuscles(eq?.targetMuscleKeys?.join(',') ?? ''), [eq]);

  const filteredExercises = useMemo(() => {
    if (!eq?.relatedExercises) return [];
    return eq.relatedExercises.filter((e) => {
      if (selectedLevel && e.level !== selectedLevel) return false;
      if (selectedMuscle) {
        const matchesTarget = (e.targetMuscles ?? []).includes(selectedMuscle);
        const matchesSecondary = (e.secondaryMuscleKeys ?? []).includes(selectedMuscle);
        if (!matchesTarget && !matchesSecondary) return false;
      }
      return true;
    });
  }, [eq, selectedLevel, selectedMuscle]);

  const paged = usePaged(filteredExercises, 'equipment-exercises-page', [key, selectedLevel, selectedMuscle], 12);

  if (loading) return <div className="page"><LoadingBlock rows={8} /></div>;
  if (error || !eq) return <div className="page"><ErrorState message={error || 'Không tìm thấy dụng cụ'} onRetry={reload} /></div>;

  return (
    <div className="page">
      <div className="mb-12">
        <Link to="/knowledge?tab=equipment" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          <Icon name="arrowLeft" size={14} />
          <span>{t('Quay lại danh mục dụng cụ')}</span>
        </Link>
      </div>

      <PageHead
        eyebrow={t(CATEGORY_LABELS[eq.category] || eq.category)}
        title={t(eq.name)}
        desc={eq.shortDesc ? t(eq.shortDesc) : ''}
        actions={
          <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
            <Badge tone="blue">{t(CATEGORY_LABELS[eq.category] || eq.category)}</Badge>
            {eq.hidden && <Badge tone="amber">{t('Đang ẩn')}</Badge>}
            <span className="tiny faint" style={{ alignSelf: 'center' }}>
              {t('{n} bài tập sử dụng', { n: eq.exerciseCount ?? 0 })}
            </span>
          </div>
        }
      />

      <div className="eq-detail-grid mt-16">
        <div className="eq-detail-main">
          {eq.usageGuide && (
            <section className="card p-20 mb-16">
              <h2 className="section-title mb-12">
                <Icon name="info" size={18} className="primary" />
                <span>{t('Cách sử dụng')}</span>
              </h2>
              <div className="text-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {eq.usageGuide}
              </div>
            </section>
          )}

          {eq.adjustGuide && (
            <section className="card p-20 mb-16">
              <h2 className="section-title mb-12">
                <Icon name="target" size={18} className="primary" />
                <span>{t('Cách điều chỉnh máy / thiết bị')}</span>
              </h2>
              <div className="text-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {eq.adjustGuide}
              </div>
            </section>
          )}

          {eq.commonMistakes && (
            <section className="card p-20 mb-16" style={{ borderColor: 'color-mix(in srgb, var(--warn) 30%, var(--hairline))' }}>
              <h2 className="section-title mb-12" style={{ color: 'var(--warn-bright)' }}>
                <Icon name="alert" size={18} />
                <span>{t('Lỗi thường gặp')}</span>
              </h2>
              <div className="text-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {eq.commonMistakes}
              </div>
            </section>
          )}

          {eq.safetyNotes && (
            <section className="card p-20 mb-16" style={{ borderColor: 'color-mix(in srgb, var(--warn) 30%, var(--hairline))' }}>
              <h2 className="section-title mb-12" style={{ color: 'var(--warn-bright)' }}>
                <Icon name="alert" size={18} />
                <span>{t('Lưu ý an toàn')}</span>
              </h2>
              <div className="text-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.6, color: 'var(--muted)' }}>
                {eq.safetyNotes}
              </div>
            </section>
          )}

          <section className="mt-24">
            <div className="row between wrap mb-12" style={{ alignItems: 'center', gap: 12 }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                <span>{t('Bài tập sử dụng {name}', { name: t(eq.name) })}</span>
                <span className="tiny faint ml-8">({filteredExercises.length})</span>
              </h2>

              <div className="row wrap" style={{ gap: 8 }}>
                <select
                  className="input input-sm"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as '' | Level)}
                  aria-label={t('Lọc theo cấp độ')}
                >
                  <option value="">{t('Tất cả cấp độ')}</option>
                  <option value="BEGINNER">{t('Người mới')}</option>
                  <option value="INTERMEDIATE">{t('Trung cấp')}</option>
                  <option value="ADVANCED">{t('Nâng cao')}</option>
                </select>

                {muscles.length > 0 && (
                  <select
                    className="input input-sm"
                    value={selectedMuscle}
                    onChange={(e) => setSelectedMuscle(e.target.value)}
                    aria-label={t('Lọc theo nhóm cơ')}
                  >
                    <option value="">{t('Tất cả nhóm cơ')}</option>
                    {muscles.map((m) => (
                      <option key={m} value={m}>{t(MUSCLE_BY_KEY.get(m as MuscleKey)?.label ?? m)}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {filteredExercises.length === 0 ? (
              <Empty
                icon="dumbbell"
                title={t('Chưa có bài tập phù hợp')}
                desc={t('Thử thay đổi bộ lọc cấp độ hoặc nhóm cơ bên trên.')}
              />
            ) : (
              <>
                <div className="kb-grid mt-12">
                  {paged.items.map((e) => (
                    <article key={e.id} className="kb-card">
                      <Link to={`/exercises/${e.id}`} className="kb-cover" aria-label={t(e.name)}>
                        <ExerciseMedia
                          imageKey={e.imageKey}
                          alt={t(e.name)}
                          playOnHover
                          tag={t(LEVEL_LABELS[e.level] || e.level)}
                        />
                      </Link>
                      <div className="kb-body">
                        <div>
                          <h3 className="kb-title">
                            <Link to={`/exercises/${e.id}`} className="plain-link">
                              {t(e.name)}
                            </Link>
                          </h3>
                          {e.nameEn && <div className="tiny faint">{e.nameEn}</div>}
                        </div>

                        {e.description && (
                          <p className="small muted line-clamp-2" style={{ margin: 0 }}>
                            {e.description}
                          </p>
                        )}

                        <div className="row between mt-auto pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                          <span className="badge badge-sm">{t(LEVEL_LABELS[e.level] || e.level)}</span>
                          <Link to={`/exercises/${e.id}`} className="btn btn-secondary btn-sm">
                            <span>{t('Chi tiết')}</span>
                            <Icon name="arrowRight" size={13} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {paged.totalPages > 1 && (
                  <div className="mt-16">
                    <Pager page={paged.page} totalPages={paged.totalPages} total={filteredExercises.length} onPage={paged.setPage} />
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="eq-detail-side">
          {eq.imageKey && (
            <div className="card p-12 mb-16" style={{ overflow: 'hidden' }}>
              <div className="tiny faint uppercase mb-8">{t('Ảnh minh hoạ')}</div>
              <ExerciseMedia imageKey={eq.imageKey} alt={eq.name} playOnHover />
            </div>
          )}

          {muscles.length > 0 && (
            <div className="card p-16 mb-16">
              <div className="tiny faint uppercase mb-8">{t('Vùng cơ tác động chính')}</div>
              <MuscleMap primary={muscles} />
              <div className="chips mt-12">
                {muscles.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`chip ${selectedMuscle === m ? 'active' : ''}`}
                    onClick={() => setSelectedMuscle(selectedMuscle === m ? '' : m)}
                  >
                    {t(MUSCLE_BY_KEY.get(m as MuscleKey)?.label ?? m)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <p className="tiny faint mt-24">{mediaCredit()}</p>
    </div>
  );
}
