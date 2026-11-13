import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Exercise } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { HealthDisclaimer, SourceList } from '../../components/Content';
import { ExerciseMedia, GYM_VISUAL_CREDIT, mediaCredit } from '../../components/ExerciseMedia';
import { Icon, type IconName } from '../../components/Icon';
import { MuscleMap } from '../../components/MuscleMap';
import { useToast } from '../../components/Toast';
import { Badge, Button, ErrorState, LoadingBlock, Modal, Textarea } from '../../components/ui';
import { getLang, t } from '../../i18n';
import { EQUIPMENT_BY_KEY, exerciseImage, isGifKey, MUSCLE_BY_KEY, parseMuscles, type EquipmentKey, type MuscleKey } from '../../lib/anatomy';
import { localizeExercise, localizeExerciseContent, hasMissingExerciseEnglish } from '../../lib/exercise';
import { exSub, exTitle, goalLabel, levelLabel, locationLabel } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';
import './kb.css';
import './exercise-detail.css';

/**
 * Chi tiết bài tập. Bố cục: khối đầu (ảnh động / tư thế + thông tin + thao tác), dải thông số,
 * rồi 2 cột: hướng dẫn bên trái, bản đồ cơ + dụng cụ bên phải (dính khi cuộn).
 * Mọi khoảng cách dùng class exd-* trong exercise-detail.css, không dùng class tiện ích không có trong styles.css.
 */
const TYPE_VI: Record<string, string> = { STRENGTH: 'Sức mạnh', WARMUP: 'Khởi động', CARDIO: 'Cardio' };

const muscleText = (k: MuscleKey) => {
  const m = MUSCLE_BY_KEY.get(k);
  if (!m) return k;
  return getLang() === 'en' ? m.labelEn : m.label;
};

const toLines = (raw: string | null | undefined) =>
  (raw ?? '')
    .split('\n')
    .map((s) => s.trim().replace(/^(\d+[.)]|[-•*])\s*/, ''))
    .filter(Boolean);

function Section({ icon, title, tone, children }: { icon: IconName; title: string; tone?: 'warn' | 'danger' | 'calm'; children: ReactNode }) {
  return (
    <section className={`card exd-section ${tone ? `is-${tone}` : ''}`}>
      <h2 className="exd-section-title"><span className="exd-section-icon"><Icon name={icon} size={16} /></span>{t(title)}</h2>
      {children}
    </section>
  );
}

function LineList({ lines }: { lines: string[] }) {
  if (lines.length === 1) return <p className="exd-text">{lines[0]}</p>;
  return <ul className="exd-bullets">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>;
}

export default function ExerciseDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TRAINER';
  const isMember = user?.role === 'MEMBER';

  const [frame, setFrame] = useState<0 | 1>(0);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const { data: ex, error, loading, reload } = useAsync(() => api.get<Exercise>(`/exercises/${encodeURIComponent(id)}`), [id]);

  useEffect(() => { setFrame(0); }, [id]);
  useEffect(() => { if (ex?.isFavorite !== undefined) setIsFavorite(ex.isFavorite); }, [ex?.isFavorite]);

  const primaryMuscles = useMemo(() => parseMuscles(ex?.targetMuscles?.join(',') ?? ''), [ex]);
  const secondaryMuscles = useMemo(() => parseMuscles(ex?.secondaryMuscleKeys?.join(',') ?? ''), [ex]);
  const content = ex ? localizeExerciseContent(ex, getLang()) : null;
  const steps = useMemo(() => toLines(content?.steps || content?.instructions), [content]);

  const handleToggleFavorite = async () => {
    if (!ex || togglingFavorite) return;
    setTogglingFavorite(true);
    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      const res = await api.post<{ isFavorite: boolean }>(`/exercises/${ex.id}/favorite`);
      setIsFavorite(res.isFavorite);
      toast.success(t(res.isFavorite ? 'Đã lưu vào bài tập yêu thích' : 'Đã bỏ lưu khỏi bài tập yêu thích'));
    } catch (e) {
      setIsFavorite(prev);
      toast.error(errMsg(e));
    } finally {
      setTogglingFavorite(false);
    }
  };

  const review = async (status: 'APPROVED' | 'NEEDS_REVIEW') => {
    if (!ex || reviewing) return;
    const note = rejectNote.trim();
    if (status === 'NEEDS_REVIEW' && note.length < 5) { toast.error(t('Vui lòng ghi rõ điểm cần sửa (ít nhất 5 ký tự)')); return; }
    setReviewing(true);
    try {
      await api.put(`/exercises/${ex.id}/review`, { status, note: status === 'APPROVED' ? null : note });
      toast.success(t(status === 'APPROVED' ? 'Đã duyệt bài tập' : 'Đã trả về yêu cầu chỉnh sửa'));
      setRejecting(false);
      setRejectNote('');
      void reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setReviewing(false);
    }
  };

  const toggleHidden = async () => {
    if (!ex) return;
    try {
      await api.put(`/exercises/${ex.id}/hidden`, { hidden: !ex.hidden });
      toast.success(ex.hidden ? t('Đã hiện bài tập') : t('Đã ẩn bài tập'));
      void reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const back = (
    <Link to="/knowledge" className="exd-back"><Icon name="arrowLeft" size={14} /><span>{t('Quay lại Kho kiến thức')}</span></Link>
  );

  if (loading && !ex) return <div className="page exd">{back}<LoadingBlock rows={8} /></div>;
  if (error || !ex) return <div className="page exd">{back}<ErrorState message={error || t('Không tìm thấy bài tập')} onRetry={reload} /></div>;

  const localized = localizeExercise(ex, getLang());
  const gif = isGifKey(ex.imageKey);
  const level = levelLabel[ex.level];
  const goals = ex.primaryGoal ? [ex.primaryGoal] : ex.goals ?? [];
  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: 'trendUp', label: 'Cấp độ', value: level ? level[0] : ex.level },
    ...(ex.exerciseType ? [{ icon: 'layers' as const, label: 'Loại bài', value: t(TYPE_VI[ex.exerciseType] ?? ex.exerciseType) }] : []),
    ...(goals.length ? [{ icon: 'target' as const, label: 'Mục tiêu', value: goals.map((g) => goalLabel[g] ?? g).join(', ') }] : []),
    ...(ex.location ? [{ icon: 'home' as const, label: 'Nơi tập', value: locationLabel[ex.location] ?? ex.location }] : []),
    ...(content?.setsRepsHint ? [{ icon: 'repeat' as const, label: 'Liều gợi ý', value: content.setsRepsHint }] : []),
  ];
  const equipment = (ex.equipmentKeys ?? []).map((k) => {
    const info = EQUIPMENT_BY_KEY.get(k as EquipmentKey);
    return { key: k, label: info ? (getLang() === 'en' ? info.labelEn : info.label) : t(k) };
  });
  const mistakes = toLines(content?.commonMistakes);
  const safety = toLines(content?.safetyNotes);

  return (
    <div className="page exd">
      {back}

      {/* ---------- Khối đầu ---------- */}
      <header className="card exd-hero">
        <div className={`exd-stage ${gif ? 'is-gif' : ''}`}>
          {gif ? (
            <>
              <img src={exerciseImage(ex.imageKey!, 1)} alt={localized.title} width={180} height={180} />
              <a className="exd-credit" href="https://gymvisual.com/" target="_blank" rel="noreferrer">{GYM_VISUAL_CREDIT}</a>
            </>
          ) : ex.imageKey ? (
            <>
              <button type="button" className="exd-pose" onClick={() => setFrame(frame === 0 ? 1 : 0)} aria-label={t('Đổi tư thế')}>
                <img src={exerciseImage(ex.imageKey, frame)} alt={`${localized.title} – ${t(frame === 0 ? 'Bắt đầu' : 'Kết thúc')}`} />
              </button>
              <div className="exd-pose-switch" role="tablist" aria-label={t('Tư thế động tác')}>
                {([0, 1] as const).map((f) => (
                  <button key={f} type="button" role="tab" aria-selected={frame === f} className={frame === f ? 'on' : ''} onClick={() => setFrame(f)}>
                    {t(f === 0 ? 'Bắt đầu' : 'Kết thúc')}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="exd-stage-map"><MuscleMap size="md" primary={primaryMuscles} secondary={secondaryMuscles} hideTip /></div>
          )}
        </div>

        <div className="exd-info">
          <div className="exd-tags">
            {level && <Badge tone={level[1]}>{level[0]}</Badge>}
            {ex.hidden && <Badge tone="amber">{t('Đang ẩn')}</Badge>}
            {ex.reviewStatus === 'PENDING' && <Badge tone="amber">{t('Chờ duyệt')}</Badge>}
            {ex.reviewStatus === 'NEEDS_REVIEW' && <Badge tone="red">{t('Cần chỉnh sửa')}</Badge>}
          </div>
          <h1 className="exd-title">{localized.title}</h1>
          {localized.subtitle && <div className="exd-subtitle" lang="en">{localized.subtitle}</div>}
          {localized.description && <p className="exd-desc">{localized.description}</p>}

          {primaryMuscles.length + secondaryMuscles.length > 0 && (
            <div className="exd-chip-block">
              <span className="exd-label">{t('Nhóm cơ')}</span>
              <div className="exd-chips">
                {primaryMuscles.map((m) => <span key={m} className="exd-chip is-primary">{muscleText(m)}</span>)}
                {secondaryMuscles.map((m) => <span key={m} className="exd-chip">{muscleText(m)}</span>)}
              </div>
            </div>
          )}

          {(isMember || isStaff) && (
            <div className="exd-actions">
              {isMember && (
                <>
                  <Link to={`/me/schedule?exerciseId=${ex.id}`} className="btn btn-primary btn-sm"><Icon name="calendar" /><span>{t('Thêm vào lịch tập')}</span></Link>
                  <Button size="sm" variant={isFavorite ? 'primary' : 'secondary'} icon={isFavorite ? 'heart' : 'star'} loading={togglingFavorite} onClick={() => void handleToggleFavorite()}>
                    {isFavorite ? t('Đã yêu thích') : t('Lưu yêu thích')}
                  </Button>
                  <Link to="/me/plan" className="btn btn-ghost btn-sm"><Icon name="clipboard" /><span>{t('Giáo án của tôi')}</span></Link>
                </>
              )}
              {isAdmin && ex.reviewStatus !== 'APPROVED' && (
                <>
                  <Button size="sm" variant="primary" icon="checkCircle" loading={reviewing} onClick={() => void review('APPROVED')}>{t('Duyệt bài tập')}</Button>
                  <Button size="sm" variant="secondary" icon="alert" onClick={() => setRejecting(true)}>{t('Yêu cầu sửa')}</Button>
                </>
              )}
              {isStaff && (
                <Button size="sm" variant="ghost" icon={ex.hidden ? 'eye' : 'eyeOff'} onClick={() => void toggleHidden()}>{ex.hidden ? t('Hiện bài') : t('Ẩn bài')}</Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ---------- Dải thông số ---------- */}
      <div className="exd-facts">
        {facts.map((f) => (
          <div key={f.label} className="exd-fact">
            <span className="exd-fact-icon"><Icon name={f.icon} size={16} /></span>
            <div className="exd-fact-body">
              <span className="exd-label">{t(f.label)}</span>
              <b title={f.value}>{f.value}</b>
            </div>
          </div>
        ))}
      </div>

      <div className="exd-grid">
        {/* ---------- Cột hướng dẫn ---------- */}
        <div className="exd-main">
          {ex.videoUrl && (
            <Section icon="play" title="Video hướng dẫn kỹ thuật">
              <div className="video-embed-container">
                <iframe src={ex.videoUrl} title={t('Video hướng dẫn: {name}', { name: localized.title })}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
              </div>
            </Section>
          )}

          {content?.setupPosition && (
            <Section icon="user" title="Tư thế chuẩn bị"><LineList lines={toLines(content.setupPosition)} /></Section>
          )}

          {steps.length > 0 && (
            <Section icon="checkCircle" title="Các bước thực hiện">
              <ol className="exd-steps">
                {steps.map((s, i) => (
                  <li key={i}><span className="exd-step-num">{i + 1}</span><span className="exd-step-text">{s}</span></li>
                ))}
              </ol>
            </Section>
          )}

          {(content?.breathing || content?.suggestedDose) && (
            <div className="exd-duo">
              {content?.breathing && (
                <Section icon="activity" title="Cách hít thở" tone="calm"><p className="exd-text">{content.breathing}</p></Section>
              )}
              {content?.suggestedDose && (
                <Section icon="clock" title="Liều tập gợi ý" tone="calm">
                  {content.setsRepsHint && <div className="exd-dose">{content.setsRepsHint}</div>}
                  <p className="exd-text">{content.suggestedDose}</p>
                </Section>
              )}
            </div>
          )}

          {mistakes.length > 0 && <Section icon="alert" title="Lỗi hay gặp cần tránh" tone="warn"><LineList lines={mistakes} /></Section>}
          {safety.length > 0 && <Section icon="shield" title="Lưu ý an toàn" tone="danger"><LineList lines={safety} /></Section>}

          {ex.alternatives && ex.alternatives.length > 0 && (
            <Section icon="refresh" title="Bài tập thay thế tương đương">
              <div className="exd-alts">
                {ex.alternatives.map((alt) => (
                  <Link key={alt.id} to={`/exercises/${alt.id}`} className="exd-alt">
                    <ExerciseMedia imageKey={alt.imageKey} alt={exTitle(alt)} className="exd-alt-media"
                      fallback={<div className="exd-alt-media exd-alt-empty"><Icon name="dumbbell" size={20} /></div>} />
                    <div className="exd-alt-body">
                      <b>{exTitle(alt)}</b>
                      {exSub(alt) && <span className="tiny faint" lang="en">{exSub(alt)}</span>}
                      {levelLabel[alt.level] && <Badge tone={levelLabel[alt.level][1]}>{levelLabel[alt.level][0]}</Badge>}
                    </div>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section icon="scroll" title="Nguồn tham khảo & bản quyền">
            <SourceList sources={ex.sources} origin={ex.contentOrigin} />
            <div className="exd-gap" />
            <HealthDisclaimer pending={ex.reviewStatus === 'PENDING'} showViOnly={hasMissingExerciseEnglish(ex)} />
            <p className="tiny faint exd-media-credit">{mediaCredit()}</p>
          </Section>
        </div>

        {/* ---------- Cột phải ---------- */}
        <aside className="exd-side">
          {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
            <section className="card exd-section">
              <h2 className="exd-section-title"><span className="exd-section-icon"><Icon name="target" size={16} /></span>{t('Bản đồ cơ bắp')}</h2>
              <MuscleMap primary={primaryMuscles} secondary={secondaryMuscles} />
              <div className="exd-legend">
                <span><i className="is-primary" />{t('Cơ chính')}</span>
                <span><i />{t('Cơ hỗ trợ')}</span>
              </div>
            </section>
          )}
          {equipment.length > 0 && (
            <section className="card exd-section">
              <h2 className="exd-section-title"><span className="exd-section-icon"><Icon name="dumbbell" size={16} /></span>{t('Dụng cụ cần dùng')}</h2>
              <div className="exd-equip">
                {equipment.map((e) => (
                  <Link key={e.key} to={`/equipment/${e.key}`} className="exd-equip-item">
                    <Icon name="dumbbell" size={14} /><span>{e.label}</span><Icon name="chevronRight" size={14} />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      {rejecting && (
        <Modal title={t('Yêu cầu chỉnh sửa bài tập')} onClose={() => setRejecting(false)} footer={<>
          <Button variant="ghost" onClick={() => setRejecting(false)}>{t('Huỷ')}</Button>
          <Button variant="danger" loading={reviewing} onClick={() => void review('NEEDS_REVIEW')}>{t('Xác nhận trả về')}</Button>
        </>}>
          <p className="small muted">{t('Vui lòng nêu rõ các điểm cần bổ sung hoặc hiệu chỉnh để huấn luyện viên/tác giả hoàn thiện trước khi phê duyệt.')}</p>
          <div className="exd-gap" />
          <Textarea value={rejectNote} maxLength={500} onChange={(e) => setRejectNote(e.target.value)} placeholder={t('Nhập ghi chú phản hồi…')} rows={4} />
        </Modal>
      )}
    </div>
  );
}
