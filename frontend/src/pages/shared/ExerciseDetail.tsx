import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Exercise } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { HealthDisclaimer, SourceList } from '../../components/Content';
import { mediaCredit } from '../../components/ExerciseMedia';
import { Icon } from '../../components/Icon';
import { MuscleMap } from '../../components/MuscleMap';
import { useToast } from '../../components/Toast';
import { Badge, Button, ErrorState, LoadingBlock, Modal, PageHead, Textarea } from '../../components/ui';
import { getLang, t } from '../../i18n';
import { EQUIPMENT_BY_KEY, MUSCLE_BY_KEY, parseMuscles, type EquipmentKey } from '../../lib/anatomy';
import { exTitle, exSub, goalLabel, levelLabel } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';
import './kb.css';

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
  const [isFav, setIsFav] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const { data: ex, error, loading, reload } = useAsync(
    () => api.get<Exercise>(`/exercises/${id}`),
    [id]
  );

  useEffect(() => {
    if (ex) setIsFav(Boolean(ex.isFavorite));
  }, [ex]);

  const toggleFavorite = async () => {
    if (!ex) return;
    try {
      const res = await api.post<{ favorite: boolean }>(`/favorites/exercises/${ex.id}`, {});
      setIsFav(res.favorite);
      toast.success(res.favorite ? t('Đã lưu bài tập vào mục yêu thích') : t('Đã bỏ lưu yêu thích'));
    } catch (e) {
      toast.error(errMsg(e));
    if (ex?.isFavorite !== undefined) {
      setIsFavorite(ex.isFavorite);
    }
  }, [ex?.isFavorite]);

  const handleToggleFavorite = async () => {
    if (!ex) return;
    setTogglingFavorite(true);
    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      const res = await api.post<{ isFavorite: boolean; favoriteCount: number; message: string }>(`/exercises/${ex.id}/favorite`);
      setIsFavorite(res.isFavorite);
      toast.success(t(res.isFavorite ? 'Đã lưu vào bài tập yêu thích' : 'Đã bỏ lưu khỏi bài tập yêu thích'));
    } catch (e) {
      setIsFavorite(prev);
      toast.error(errMsg(e));
    } finally {
      setTogglingFavorite(false);
    }
  };

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

  const handleApprove = async () => {
    if (!ex) return;
    setReviewing(true);
    try {
      await api.put(`/exercises/${ex.id}/review`, { status: 'APPROVED', note: null });
      toast.success(t('Đã duyệt bài tập'));
      void reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!ex) return;
    setReviewing(true);
    try {
      await api.put(`/exercises/${ex.id}/review`, { status: 'NEEDS_REVIEW', note: rejectNote || null });
      toast.success(t('Đã trả về yêu cầu chỉnh sửa'));
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

  if (loading) return <div className="page"><LoadingBlock rows={8} /></div>;
  if (error || !ex) return <div className="page"><ErrorState message={error || 'Không tìm thấy bài tập'} onRetry={reload} /></div>;

  return (
    <div className="page">
      <div className="mb-12">
        <Link to="/knowledge" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          <Icon name="arrowLeft" size={14} />
          <span>{t('Quay lại Kho kiến thức')}</span>
        </Link>
      </div>

      <PageHead
        eyebrow={getLang() === 'en' ? (ex.name ? <span lang="vi">{ex.name}</span> : null) : (ex.nameEn || t('Chi tiết bài tập'))}
        title={exTitle(ex)}
        desc={ex.description || ''}
        actions={
          <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
            {ex.exerciseType === 'WARMUP' && <Badge tone="green">{t('Khởi động')}</Badge>}
            {ex.exerciseType === 'CARDIO' && <Badge tone="amber">{t('Cardio')}</Badge>}
            {ex.exerciseType === 'MAIN' && <Badge tone="blue">{t('Bài tập chính')}</Badge>}
            {ex.cardioIntensity && <Badge tone="red">{t('Cường độ {i}', { i: ex.cardioIntensity })}</Badge>}
            <Badge tone="blue">{t(LEVEL_LABELS[ex.level] || ex.level)}</Badge>
            {ex.primaryGoal && <Badge tone="muted">{ex.primaryGoal}</Badge>}
            <Badge tone="blue">{levelLabel[ex.level] ? levelLabel[ex.level][0] : ex.level}</Badge>
            {ex.primaryGoal && <Badge tone="muted">{goalLabel[ex.primaryGoal] || ex.primaryGoal}</Badge>}
            {ex.hidden && <Badge tone="amber">{t('Đang ẩn')}</Badge>}
            {ex.reviewStatus === 'PENDING' && <Badge tone="amber">{t('Chờ duyệt')}</Badge>}

            <Button
              variant={isFav ? 'primary' : 'secondary'}
              size="sm"
              icon="star"
              onClick={toggleFavorite}
            >
              {isFav ? t('Đã yêu thích') : t('Lưu yêu thích')}
            </Button>

            {/* Thao tác dành cho Admin */}
            {isAdmin && ex.reviewStatus !== 'APPROVED' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon="checkCircle"
                  loading={reviewing}
                  onClick={handleApprove}
                >
                  {t('Duyệt bài tập')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="alert"
                  onClick={() => setRejecting(true)}
                >
                  {t('Yêu cầu sửa')}
                </Button>
              </>
            )}

            {/* Thao tác ẩn/hiện dành cho Staff */}
            {isStaff && (
              <Button
                variant="ghost"
                size="sm"
                icon={ex.hidden ? 'eye' : 'eyeOff'}
                onClick={toggleHidden}
              >
                {ex.hidden ? t('Hiện bài') : t('Ẩn bài')}
              </Button>
            )}

            {/* Thao tác dành cho Member */}
            {isMember && (
              <>
                <Button
                  variant={isFavorite ? 'primary' : 'secondary'}
                  size="sm"
                  icon={isFavorite ? 'trophy' : 'sparkle'}
                  loading={togglingFavorite}
                  onClick={handleToggleFavorite}
                >
                  {isFavorite ? t('Đã yêu thích') : t('Lưu yêu thích')}
                </Button>
                <Link to={`/me/schedule?exerciseId=${ex.id}`} className="btn btn-primary btn-sm">
                  <Icon name="calendar" size={14} className="mr-4" />
                  <span>{t('Thêm vào lịch tập')}</span>
                </Link>
                <Link to="/me/plan" className="btn btn-secondary btn-sm">
                  <Icon name="clipboard" size={14} className="mr-4" />
                  <span>{t('Giáo án của tôi')}</span>
                </Link>
              </>
            )}
          </div>
        }
      />

      <div className="ex-detail-grid mt-16">
        <div className="ex-detail-main">
          {/* Ảnh minh hoạ tư thế đầu / cuối nếu có */}
          {ex.imageKey ? (
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
                  alt={`${exTitle(ex)} frame ${frame}`}
                  style={{ width: '100%', maxHeight: 440, objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>
          ) : (
            <div className="card p-20 mb-16 ex-hero-neutral">
              <div className="row gap-16 wrap" style={{ alignItems: 'center' }}>
                <div className="ex-thumb-map" style={{ width: 140, height: 100, flexShrink: 0 }}>
                  <MuscleMap size="sm" primary={primaryMuscles} secondary={secondaryMuscles} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="tiny font-bold uppercase mb-4" style={{ color: 'var(--primary-bright)' }}>
                    {t('Minh họa giải phẫu cơ bắp')}
                  </div>
                  <p className="small muted mb-8" style={{ margin: 0 }}>
                    {t('Bài tập tác động tập trung vào các vùng cơ được tô sáng. Dữ liệu chuẩn hóa tuân thủ bản quyền mở.')}
                  </p>
                  <div className="row gap-6 wrap">
                    {primaryMuscles.map((m) => (
                      <span key={m} className="chip chip-primary tiny">
                        {getLang() === 'en' ? (MUSCLE_BY_KEY.get(m)?.labelEn ?? t(MUSCLE_BY_KEY.get(m)?.label ?? m)) : (MUSCLE_BY_KEY.get(m)?.label ?? m)}
                      </span>
                    ))}
                    {secondaryMuscles.map((m) => (
                      <span key={m} className="chip tiny">
                        {getLang() === 'en' ? (MUSCLE_BY_KEY.get(m)?.labelEn ?? t(MUSCLE_BY_KEY.get(m)?.label ?? m)) : (MUSCLE_BY_KEY.get(m)?.label ?? m)}
                      </span>
                    ))}
                  </div>
                </div>
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
                  title={t('Video hướng dẫn: {name}', { name: exTitle(ex) })}
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
            <section className="mt-24 mb-16">
              <h2 className="section-title mb-12">
                <Icon name="refresh" size={18} className="primary" />
                <span>{t('Bài tập thay thế tương đương')}</span>
              </h2>
              <div className="kb-grid">
                {ex.alternatives.map((alt) => (
                  <Link key={alt.id} to={`/exercises/${alt.id}`} className="card kb-card p-12 text-decoration-none">
                    <div className="row gap-12" style={{ alignItems: 'center' }}>
                      {alt.imageKey ? (
                        <div style={{ width: 68, height: 50, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                          <img
                            src={`/exercise-img/${alt.imageKey}/0.jpg`}
                            alt={exTitle(alt)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div className="ex-list-thumb">
                          <Icon name="dumbbell" size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold small line-clamp-1">{exTitle(alt)}</div>
                        {exSub(alt) && <div className="tiny faint line-clamp-1" lang="vi">{exSub(alt)}</div>}
                        <span className="badge badge-sm mt-4">{levelLabel[alt.level] ? levelLabel[alt.level][0] : alt.level}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Nguồn tham khảo & Giấy phép minh bạch */}
          <section className="card p-20 mb-16">
            <h2 className="section-title mb-12">
              <Icon name="shield" size={18} className="primary" />
              <span>{t('Nguồn tham khảo & Bản quyền nội dung')}</span>
            </h2>
            <SourceList sources={ex.sources} origin={ex.contentOrigin} />
            <div className="mt-14">
              <HealthDisclaimer pending={ex.reviewStatus === 'PENDING'} />
            </div>
          </section>
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
                      <span>{getLang() === 'en' ? (info?.labelEn ?? t(info?.label ?? k)) : (info?.label ?? k)}</span>
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
                      <span key={m} className="chip chip-primary">
                        {getLang() === 'en' ? (MUSCLE_BY_KEY.get(m)?.labelEn ?? t(MUSCLE_BY_KEY.get(m)?.label ?? m)) : (MUSCLE_BY_KEY.get(m)?.label ?? m)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {secondaryMuscles.length > 0 && (
                <div className="mt-10">
                  <div className="tiny faint mb-4">{t('Cơ hỗ trợ (phụ):')}</div>
                  <div className="chips">
                    {secondaryMuscles.map((m) => (
                      <span key={m} className="chip">
                        {getLang() === 'en' ? (MUSCLE_BY_KEY.get(m)?.labelEn ?? t(MUSCLE_BY_KEY.get(m)?.label ?? m)) : (MUSCLE_BY_KEY.get(m)?.label ?? m)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      <p className="tiny faint mt-24">{mediaCredit()}</p>

      {/* Modal Yêu cầu chỉnh sửa */}
      {rejecting && (
        <Modal
          title={t('Yêu cầu chỉnh sửa bài tập')}
          onClose={() => setRejecting(false)}
          footer={
            <div className="row end gap-8">
              <Button variant="ghost" onClick={() => setRejecting(false)}>{t('Hủy')}</Button>
              <Button variant="danger" loading={reviewing} onClick={handleReject}>{t('Xác nhận trả về')}</Button>
            </div>
          }
        >
          <p className="small muted mb-12">
            {t('Vui lòng nêu rõ các điểm cần bổ sung hoặc hiệu chỉnh để huấn luyện viên/tác giả hoàn thiện trước khi phê duyệt.')}
          </p>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder={t('Nhập ghi chú phản hồi…')}
            rows={4}
          />
        </Modal>
      )}
    </div>
  );
}
