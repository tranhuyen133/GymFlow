import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Exercise, Level } from '../../api/types';
import { mediaCredit } from '../../components/ExerciseMedia';
import { Icon } from '../../components/Icon';
import { MuscleMap } from '../../components/MuscleMap';
import { Badge, ErrorState, LoadingBlock, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import { EQUIPMENT_BY_KEY, MUSCLE_BY_KEY, parseMuscles, type EquipmentKey } from '../../lib/anatomy';
import { useAsync } from '../../lib/hooks';
import './kb.css';

const LEVEL_LABELS: Record<Level, string> = {
  BEGINNER: 'Người mới',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

export default function ExerciseDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const [frame, setFrame] = useState<0 | 1>(0);

  const { data: ex, error, loading, reload } = useAsync(
    () => api.get<Exercise>(`/exercises/${id}`),
    [id]
  );

  const primaryMuscles = useMemo(() => parseMuscles(ex?.targetMuscles?.join(',') ?? ''), [ex]);
  const secondaryMuscles = useMemo(() => parseMuscles(ex?.secondaryMuscleKeys?.join(',') ?? ''), [ex]);

  const stepsList = useMemo(() => {
    const raw = ex?.steps || ex?.instructions;
    if (!raw) return [];
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, ''));
  }, [ex]);

  if (loading) return <div className="page"><LoadingBlock rows={8} /></div>;
  if (error || !ex) return <div className="page"><ErrorState message={error || 'Không tìm thấy bài tập'} onRetry={reload} /></div>;

  return (
    <div className="page">
      <div className="mb-12">
        <Link to="/exercises" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          <Icon name="arrowLeft" size={14} />
          <span>{t('Quay lại Thư viện bài tập')}</span>
        </Link>
      </div>

      <PageHead
        eyebrow={ex.nameEn || t('Chi tiết bài tập')}
        title={ex.name}
        desc={ex.description || ''}
        actions={
          <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
            <Badge tone="blue">{LEVEL_LABELS[ex.level] || ex.level}</Badge>
            {ex.primaryGoal && <Badge tone="muted">{ex.primaryGoal}</Badge>}
            {ex.hidden && <Badge tone="amber">{t('Đang ẩn')}</Badge>}
            {ex.reviewStatus === 'PENDING' && <Badge tone="amber">{t('Chờ duyệt')}</Badge>}
          </div>
        }
      />

      <div className="ex-detail-grid mt-16">
        <div className="ex-detail-main">
          {/* Ảnh minh hoạ tư thế đầu / cuối */}
          {ex.imageKey && (
            <div className="card p-16 mb-16">
              <div className="row between wrap mb-10" style={{ alignItems: 'center' }}>
                <span className="tiny faint uppercase font-bold">{t('Tư thế động tác (Bấm ảnh để chuyển tư thế)')}</span>
                <div className="btn-group">
                  <button
                    type="button"
                    className={`btn btn-sm ${frame === 0 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFrame(0)}
                  >
                    {t('Tư thế 1 (Bắt đầu)')}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${frame === 1 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFrame(1)}
                  >
                    {t('Tư thế 2 (Kết thúc)')}
                  </button>
                </div>
              </div>

              <div
                className="ex-image-interactive"
                onClick={() => setFrame(frame === 0 ? 1 : 0)}
                title={t('Bấm để đổi góc động tác')}
                style={{ cursor: 'pointer', borderRadius: 'var(--r-md)', overflow: 'hidden', background: '#000' }}
              >
                <img
                  src={`/exercise-img/${ex.imageKey}/${frame}.jpg`}
                  alt={`${ex.name} frame ${frame}`}
                  style={{ width: '100%', maxHeight: 440, objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* Video nhúng 16:9 nếu có */}
          {ex.videoUrl && (
            <div className="card p-16 mb-16">
              <div className="tiny faint uppercase font-bold mb-10">
                <Icon name="play" size={14} className="mr-4" />
                <span>{t('Video hướng dẫn kỹ thuật')}</span>
              </div>
              <div className="video-embed-container">
                <iframe
                  src={ex.videoUrl}
                  title={`Video hướng dẫn ${ex.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* Tư thế chuẩn bị */}
          {ex.setupPosition && (
            <section className="card p-20 mb-16">
              <h2 className="section-title mb-10">
                <Icon name="user" size={18} className="primary" />
                <span>{t('Tư thế chuẩn bị')}</span>
              </h2>
              <p className="text-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.6, margin: 0 }}>
                {ex.setupPosition}
              </p>
            </section>
          )}

          {/* Các bước thực hiện */}
          {stepsList.length > 0 && (
            <section className="card p-20 mb-16">
              <h2 className="section-title mb-14">
                <Icon name="checkCircle" size={18} className="primary" />
                <span>{t('Các bước thực hiện')}</span>
              </h2>
              <ol className="ex-numbered-steps">
                {stepsList.map((step, idx) => (
                  <li key={idx} className="ex-step-item">
                    <span className="ex-step-num">{idx + 1}</span>
                    <span className="ex-step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Cách thở */}
          {ex.breathing && (
            <section className="card p-16 mb-16" style={{ background: 'color-mix(in srgb, var(--primary) 8%, var(--surface-2))' }}>
              <div className="row gap-10" style={{ alignItems: 'flex-start' }}>
                <Icon name="activity" size={20} className="primary mt-2" />
                <div>
                  <h3 className="tiny font-bold uppercase mb-4" style={{ color: 'var(--primary-bright)' }}>{t('Cách hít thở đúng')}</h3>
                  <p className="small muted" style={{ margin: 0, lineHeight: 1.5 }}>{ex.breathing}</p>
                </div>
              </div>
            </section>
          )}

          {/* Số hiệp/lần gợi ý */}
          {(ex.setsRepsHint || ex.suggestedDose) && (
            <section className="card p-16 mb-16">
              <div className="row gap-10" style={{ alignItems: 'flex-start' }}>
                <Icon name="clock" size={20} className="primary mt-2" />
                <div>
                  <h3 className="tiny font-bold uppercase mb-4">{t('Liều tập gợi ý (Sets & Reps)')}</h3>
                  <p className="small muted" style={{ margin: 0, lineHeight: 1.5 }}>
                    {ex.setsRepsHint ? <b>{ex.setsRepsHint} — </b> : null}
                    {ex.suggestedDose}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Lỗi hay gặp */}
          {ex.commonMistakes && (
            <section className="card p-20 mb-16" style={{ borderColor: 'color-mix(in srgb, var(--warn) 30%, var(--hairline))' }}>
              <h2 className="section-title mb-10" style={{ color: 'var(--warn-bright)' }}>
                <Icon name="alert" size={18} />
                <span>{t('Lỗi sai phổ biến cần tránh')}</span>
              </h2>
              <p className="text-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.6, margin: 0, color: 'var(--muted)' }}>
                {ex.commonMistakes}
              </p>
            </section>
          )}

          {/* Lưu ý an toàn */}
          {ex.safetyNotes && (
            <section className="card p-20 mb-16" style={{ borderColor: 'color-mix(in srgb, var(--danger) 30%, var(--hairline))' }}>
              <h2 className="section-title mb-10" style={{ color: 'var(--danger-bright)' }}>
                <Icon name="shield" size={18} />
                <span>{t('Lưu ý an toàn')}</span>
              </h2>
              <p className="text-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.6, margin: 0, color: 'var(--muted)' }}>
                {ex.safetyNotes}
              </p>
            </section>
          )}

          {/* Bài tập thay thế */}
          {ex.alternatives && ex.alternatives.length > 0 && (
            <section className="mt-24">
              <h2 className="section-title mb-12">
                <Icon name="refresh" size={18} className="primary" />
                <span>{t('Bài tập thay thế tương đương')}</span>
              </h2>
              <div className="kb-grid">
                {ex.alternatives.map((alt) => (
                  <Link key={alt.id} to={`/exercises/${alt.id}`} className="card kb-card p-12 text-decoration-none">
                    <div className="row gap-12" style={{ alignItems: 'center' }}>
                      {alt.imageKey && (
                        <div style={{ width: 68, height: 50, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                          <img
                            src={`/exercise-img/${alt.imageKey}/0.jpg`}
                            alt={alt.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold small line-clamp-1">{alt.name}</div>
                        {alt.nameEn && <div className="tiny faint line-clamp-1">{alt.nameEn}</div>}
                        <span className="badge badge-sm mt-4">{LEVEL_LABELS[alt.level] || alt.level}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Cột phải: MuscleMap và Dụng cụ */}
        <aside className="ex-detail-side">
          {/* Dụng cụ tập */}
          {ex.equipmentKeys && ex.equipmentKeys.length > 0 && (
            <div className="card p-16 mb-16">
              <div className="tiny faint uppercase font-bold mb-10">{t('Dụng cụ cần dùng')}</div>
              <div className="chips">
                {ex.equipmentKeys.map((k) => {
                  const info = EQUIPMENT_BY_KEY.get(k as EquipmentKey);
                  return (
                    <Link
                      key={k}
                      to={`/equipment/${k}`}
                      className="chip chip-primary"
                      style={{ textDecoration: 'none' }}
                    >
                      <Icon name="dumbbell" size={12} className="mr-4" />
                      <span>{info?.label ?? k}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bản đồ nhóm cơ */}
          {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
            <div className="card p-16 mb-16">
              <div className="tiny faint uppercase font-bold mb-10">{t('Bản đồ cơ bắp')}</div>
              <MuscleMap primary={primaryMuscles} secondary={secondaryMuscles} />

              {primaryMuscles.length > 0 && (
                <div className="mt-12">
                  <div className="tiny faint mb-4">{t('Cơ tác động chính:')}</div>
                  <div className="chips">
                    {primaryMuscles.map((m) => (
                      <span key={m} className="chip chip-primary">{MUSCLE_BY_KEY.get(m)?.label ?? m}</span>
                    ))}
                  </div>
                </div>
              )}

              {secondaryMuscles.length > 0 && (
                <div className="mt-10">
                  <div className="tiny faint mb-4">{t('Cơ hỗ trợ (phụ):')}</div>
                  <div className="chips">
                    {secondaryMuscles.map((m) => (
                      <span key={m} className="chip">{MUSCLE_BY_KEY.get(m)?.label ?? m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      <p className="tiny faint mt-24">{mediaCredit()}</p>
    </div>
  );
}
