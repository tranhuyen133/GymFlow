import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Article, Exercise, MuscleGroup } from '../../api/types';
import { ExerciseMedia, mediaCredit } from '../../components/ExerciseMedia';
import { Icon } from '../../components/Icon';
import { Badge, Empty, ErrorState, LoadingBlock, Modal, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import { MUSCLE_BY_KEY, type MuscleKey } from '../../lib/anatomy';
import { exTitle, exSub } from '../../lib/format';
import { useAsync } from '../../lib/hooks';
import './kb.css';

interface GuideArticleItem {
  slug: string;
  title: string;
  desc: string;
  icon: string;
  badge: string;
}

const GUIDE_ARTICLES: GuideArticleItem[] = [
  {
    slug: 'khoi-dong-truoc-tap',
    title: 'Khởi động 6 phút trước khi tập',
    desc: 'Làm nóng khớp, tăng tuần hoàn máu và chuẩn bị cơ thể trước khi vận động nặng.',
    icon: 'activity',
    badge: 'Khởi động',
  },
  {
    slug: 'cach-dung-may-tap',
    title: 'Cách dùng máy tập chuẩn cho người mới',
    desc: 'Các bước chỉnh ghế, cắm chốt tạ và nguyên tắc chuyển động trên máy an toàn.',
    icon: 'filter',
    badge: 'Máy tập',
  },
  {
    slug: 'chon-muc-ta',
    title: 'Cách chọn mức tạ phù hợp khi mới bắt đầu',
    desc: 'Áp dụng quy tắc RIR 2 lần dự trữ để chọn mức tạ kích thích cơ mà không chấn thương.',
    icon: 'scale',
    badge: 'Mức tạ',
  },
  {
    slug: 'chon-so-hiep-va-so-lan',
    title: 'Cách chọn số hiệp và số lần lặp (Sets & Reps)',
    desc: 'Hiểu đúng công thức hiệp và lần lặp để đạt mục tiêu tăng cơ, giảm mỡ hay tăng sức mạnh.',
    icon: 'repeat',
    badge: 'Sets & Reps',
  },
  {
    slug: 'nghi-giua-hiep',
    title: 'Thời gian nghỉ giữa các hiệp tập chuẩn khoa học',
    desc: 'Nghỉ bao nhiêu giây giữa hiệp để cơ kịp phục hồi năng lượng mà không bị nguội.',
    icon: 'clock',
    badge: 'Nghỉ ngơi',
  },
  {
    slug: 'gian-co-sau-tap',
    title: 'Giãn cơ 5 phút sau buổi tập',
    desc: 'Hạ nhiệt cơ thể, giảm nhức mỏi DOMS và tăng độ dẻo dai cơ bắp sau khi tập.',
    icon: 'heart',
    badge: 'Thả lỏng',
  },
  {
    slug: 'loi-hay-gap-nguoi-moi',
    title: 'Những lỗi phổ biến người mới tập gym cần tránh',
    desc: 'Tránh nâng tạ bằng đà quán tính, nín thở sai cách và bỏ qua nguyên tắc bù nước.',
    icon: 'alert',
    badge: 'Lỗi hay gặp',
  },
];

const MUSCLE_GROUPS: { key: '' | MuscleGroup; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'CHEST', label: 'Ngực' },
  { key: 'BACK', label: 'Lưng & Xô' },
  { key: 'LEGS', label: 'Chân & Mông' },
  { key: 'SHOULDERS', label: 'Vai' },
  { key: 'ARMS', label: 'Tay trước & sau' },
  { key: 'CORE', label: 'Cơ bụng' },
];

export default function BeginnerExercises() {
  const [activeGroup, setActiveGroup] = useState<'' | MuscleGroup>('');
  const [readingSlug, setReadingSlug] = useState<string | null>(null);

  const { data: exercises, error, loading, reload } = useAsync(
    () => api.get<Exercise[]>('/exercises', { level: 'BEGINNER' }),
    []
  );

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter((e) => {
      if (activeGroup && e.muscleGroup !== activeGroup) return false;
      return true;
    });
  }, [exercises, activeGroup]);

  return (
    <div className="page">
      <div className="mb-12">
        <Link to="/exercises" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          <Icon name="arrowLeft" size={14} />
          <span>{t('Quay lại Thư viện bài tập')}</span>
        </Link>
      </div>

      <PageHead
        eyebrow="Dành riêng cho hội viên mới"
        title="Bắt đầu tập gym cùng GymFlow"
        desc="Hướng dẫn kỹ thuật cơ bản, nguyên tắc tập luyện an toàn và kho bài tập chuẩn cấp độ Người mới (Beginner) để bạn tự tin bước vào phòng tập."
      />

      {/* Phần 1: Cẩm nang hướng dẫn nền tảng */}
      <section className="mt-20">
        <div className="row between wrap mb-12" style={{ alignItems: 'baseline' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              <Icon name="scroll" size={18} className="primary mr-6" />
              <span>{t('Cẩm nang nhập môn')}</span>
            </h2>
            <p className="tiny muted mt-2" style={{ margin: 0 }}>
              {t('Các bài viết hướng dẫn khởi động, chỉnh máy tập, chọn tạ và thời gian nghỉ chuẩn khoa học.')}
            </p>
          </div>
        </div>

        <div className="beginner-guide-grid">
          {GUIDE_ARTICLES.map((g) => (
            <div
              key={g.slug}
              className="card p-16 beginner-guide-card"
              onClick={() => setReadingSlug(g.slug)}
              style={{ cursor: 'pointer' }}
            >
              <div className="row between wrap mb-8" style={{ alignItems: 'center' }}>
                <span className="badge badge-sm">{t(g.badge)}</span>
                <span className="tiny faint text-link">{t('Đọc bài')} →</span>
              </div>
              <h3 className="font-bold small mb-6 line-clamp-1" style={{ margin: '0 0 6px' }}>
                {t(g.title)}
              </h3>
              <p className="tiny muted line-clamp-2" style={{ margin: 0 }}>
                {t(g.desc)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Phần 2: Kho bài tập Beginner theo nhóm cơ */}
      <section className="mt-32">
        <div className="row between wrap mb-14" style={{ alignItems: 'center', gap: 12 }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              <Icon name="dumbbell" size={18} className="primary mr-6" />
              <span>{t('Bài tập nền tảng cho người mới')}</span>
              <span className="tiny faint ml-8">({filteredExercises.length})</span>
            </h2>
            <p className="tiny muted mt-2" style={{ margin: 0 }}>
              {t('Bài tập có kỹ thuật đơn giản, biên độ tự nhiên, phù hợp để làm quen form trong 4 tuần đầu.')}
            </p>
          </div>

          <div className="tabs tabs-sm">
            {MUSCLE_GROUPS.map((g) => (
              <button
                key={g.key}
                type="button"
                className={`tab-btn ${activeGroup === g.key ? 'active' : ''}`}
                onClick={() => setActiveGroup(g.key)}
              >
                {t(g.label)}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !exercises ? (
          <LoadingBlock rows={6} />
        ) : filteredExercises.length === 0 ? (
          <Empty
            icon="dumbbell"
            title={t('Chưa có bài tập trong nhóm cơ này')}
            desc={t('Thử chuyển sang nhóm cơ khác bên trên.')}
          />
        ) : (
          <div className="kb-grid mt-12">
            {filteredExercises.map((e) => (
              <article key={e.id} className="kb-card">
                <Link to={`/exercises/${e.id}`} className="kb-cover" aria-label={exTitle(e)}>
                  <ExerciseMedia
                    imageKey={e.imageKey}
                    alt={exTitle(e)}
                    playOnHover
                    tag={t('Người mới')}
                  />
                </Link>
                <div className="kb-body">
                  <div>
                    <h3 className="kb-title">
                      <Link to={`/exercises/${e.id}`} className="plain-link">
                        {exTitle(e)}
                      </Link>
                    </h3>
                    {exSub(e) && <div className="tiny faint" lang="en">{exSub(e)}</div>}
                  </div>

                  {e.description && (
                    <p className="small muted line-clamp-2" style={{ margin: 0 }}>
                      {e.description}
                    </p>
                  )}

                  {e.setsRepsHint && (
                    <div className="tiny faint">
                      <b>{t('Gợi ý:')}</b> {e.setsRepsHint}
                    </div>
                  )}

                  <div className="row between mt-auto pt-8" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                    <div className="chips">
                      {(e.targetMuscles ?? []).slice(0, 2).map((m) => (
                        <span key={m} className="chip chip-primary">
                          {MUSCLE_BY_KEY.get(m as MuscleKey)?.label ?? m}
                        </span>
                      ))}
                    </div>

                    <Link to={`/exercises/${e.id}`} className="btn btn-secondary btn-sm">
                      <span>{t('Xem hướng dẫn')}</span>
                      <Icon name="arrowRight" size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal đọc bài viết hướng dẫn */}
      {readingSlug && (
        <ArticleReaderModal
          slug={readingSlug}
          onClose={() => setReadingSlug(null)}
        />
      )}

      <p className="tiny faint mt-28">{mediaCredit()}</p>
    </div>
  );
}

function ArticleReaderModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data: art, error, loading } = useAsync(
    () => api.get<Article>(`/articles/public/${encodeURIComponent(slug)}`),
    [slug]
  );

  const fallback = GUIDE_ARTICLES.find((g) => g.slug === slug);

  return (
    <Modal title={art?.title || fallback?.title || t('Hướng dẫn tập luyện')} onClose={onClose} size="wide">
      {loading ? (
        <LoadingBlock rows={6} />
      ) : error || !art ? (
        <div>
          <div className="badge badge-sm mb-12">{fallback?.badge}</div>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{fallback?.title}</h2>
          <p className="lead muted">{fallback?.desc}</p>
          <div className="card p-16 mt-16" style={{ background: 'var(--rail)' }}>
            <p className="small faint" style={{ margin: 0 }}>
              {t('Bài viết chi tiết đang được quản lý kiểm duyệt trước khi xuất bản công khai.')}
            </p>
          </div>
        </div>
      ) : (
        <article className="article-reader-content">
          <div className="row between wrap mb-10" style={{ alignItems: 'center' }}>
            <Badge tone="blue">{art.category}</Badge>
            {art.publishedAt && (
              <span className="tiny faint">
                {t('Ngày đăng: {d}', { d: new Date(art.publishedAt).toLocaleDateString('vi-VN') })}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 22, lineHeight: 1.3, marginBottom: 12 }}>{art.title}</h1>
          <p className="lead muted mb-16" style={{ fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: 12 }}>
            {art.summary}
          </p>
          <div className="text-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
            {art.body}
          </div>
        </article>
      )}

      <div className="row end mt-20">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('Đóng')}
        </button>
      </div>
    </Modal>
  );
}
