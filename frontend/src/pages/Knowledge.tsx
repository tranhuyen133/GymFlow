import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Article, ArticleCategory, ArticleSummary } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Brand } from '../components/Brand';
import { HealthDisclaimer, Prose, SourceList } from '../components/Content';
import { Icon } from '../components/Icon';
import { Button, Empty, ErrorState, LoadingBlock, SearchInput } from '../components/ui';
import { articleCategoryLabel, fmtDateTime } from '../lib/format';
import { useAsync, useDebounced } from '../lib/hooks';
import { ThemeToggle } from '../theme/ThemeToggle';
import { t, ViOnlyNote } from '../i18n';

const CATEGORIES = Object.keys(articleCategoryLabel) as ArticleCategory[];

/** Hội viên đăng nhập xem kho kiến thức trong khung ứng dụng (/me/knowledge); khách xem bản công khai (/knowledge). */
const basePath = (embedded?: boolean) => (embedded ? '/me/knowledge' : '/knowledge');

function PublicNav() {
  const { user } = useAuth();
  // Đã đăng nhập: bấm logo về màn hình chính của ứng dụng, chưa đăng nhập thì về trang chủ.
  const home = user ? '/dashboard' : '/';
  return (
    <nav className="landing-nav">
      <Link to={home} aria-label={user ? t('Về màn hình chính') : `GymFlow – ${t('trang chủ')}`} title={user ? t('Về màn hình chính') : undefined}><Brand /></Link>
      <div style={{ flex: 1 }} />
      <ThemeToggle />
      <Link className="btn btn-ghost btn-sm" to="/knowledge"><Icon name="layers" />{t('Kho kiến thức')}</Link>
      {user
        ? <Link className="btn btn-primary btn-sm" to="/dashboard"><Icon name="arrowLeft" /><span>{t('Về màn hình chính')}</span></Link>
        : <Link className="btn btn-ghost btn-sm" to="/"><Icon name="arrowLeft" />{t('Trang chủ')}</Link>}
    </nav>
  );
}

/** Khung trang: bản công khai có thanh điều hướng riêng; bản trong ứng dụng dùng sidebar của Layout. */
function Frame({ embedded, children }: { embedded?: boolean; children: ReactNode }) {
  if (embedded) return <div className="page legal-page">{children}</div>;
  return (
    <div className="public">
      <PublicNav />
      <main className="section page legal-page">{children}</main>
    </div>
  );
}

/** Nút quay lại: về trang trước nếu có lịch sử trong ứng dụng, không thì về địa chỉ dự phòng. */
function BackButton({ fallback, label }: { fallback: string; label: string }) {
  const navigate = useNavigate();
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback));
  return <Button variant="ghost" size="sm" icon="arrowLeft" onClick={back}>{t(label)}</Button>;
}

/** /knowledge và /me/knowledge – chỉ liệt kê bài đã được quản lý duyệt và xuất bản. */
export function KnowledgeList({ embedded }: { embedded?: boolean }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'' | ArticleCategory>('');
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useAsync(() => api.get<ArticleSummary[]>('/articles/public', { q: dq, category: cat }), [dq, cat]);
  const filtered = dq.trim() !== '' || cat !== '';

  return (
    <Frame embedded={embedded}>
      {embedded && <div style={{ marginBottom: 12 }}><BackButton fallback="/dashboard" label="Quay lại" /></div>}
      <div className="kicker">{t('Kho kiến thức')}</div>
      <h1 className="display-sm">{t('Ăn, ngủ, tập đúng cách')}</h1>
      <p className="lead">{t('Bài viết ngắn về dinh dưỡng, nước uống, giấc ngủ và vận động. Mỗi bài ghi rõ nguồn tham khảo và chỉ xuất hiện sau khi quản lý phòng tập duyệt.')}</p>

      <div className="toolbar mt-24">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm bài viết…" />
      </div>
      <div className="chips" style={{ marginBottom: 18 }}>
        <button className={`chip ${cat === '' ? 'on' : ''}`} onClick={() => setCat('')}>{t('Tất cả')}</button>
        {CATEGORIES.map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{articleCategoryLabel[c]}</button>)}
      </div>

      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingBlock rows={4} /> : data && data.length === 0 ? (
        filtered
          ? <Empty icon="search" title="Không tìm thấy bài viết phù hợp" desc="Thử từ khoá khác hoặc chọn chủ đề Tất cả." />
          : <Empty icon="layers" title="Chưa có bài viết nào được xuất bản" desc="Các bài viết đang được quản lý phòng tập duyệt nội dung và nguồn." />
      ) : (
        <div className="article-grid">
          {data?.map((a) => (
            <Link key={a.id} to={`${basePath(embedded)}/${a.slug}`} className="article-card">
              <span className="kicker">{articleCategoryLabel[a.category]}</span>
              <h2>{a.title}</h2>
              <p className="small muted">{a.summary}</p>
              <span className="link-btn small">{t('Đọc bài')} <Icon name="arrowRight" size={14} /></span>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-24"><HealthDisclaimer /></div>
    </Frame>
  );
}

/** /knowledge/:slug và /me/knowledge/:slug – bài đã xuất bản; bài chưa duyệt trả 404 từ backend. */
export function KnowledgeArticle({ embedded }: { embedded?: boolean }) {
  const { slug = '' } = useParams();
  const { data, error, status, loading, reload } = useAsync(() => api.get<Article>(`/articles/public/${encodeURIComponent(slug)}`), [slug]);

  return (
    <Frame embedded={embedded}>
      {embedded
        ? <BackButton fallback={basePath(embedded)} label="Tất cả bài viết" />
        : <Link className="muted small" to="/knowledge"><Icon name="arrowLeft" size={14} style={{ display: 'inline', verticalAlign: -2 }} /> {t('Tất cả bài viết')}</Link>}
      {error ? (
        status === 404
          ? <div className="mt-24"><Empty icon="layers" title="Không tìm thấy bài viết" desc="Bài viết không tồn tại hoặc chưa được xuất bản." /></div>
          : <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? <LoadingBlock rows={6} /> : (
        <article className="mt-16">
          <div className="kicker">{articleCategoryLabel[data.category]}</div>
          <h1 className="display-sm">{data.title}</h1>
          <p className="lead" lang="vi">{data.summary}</p>
          <ViOnlyNote />
          <p className="tiny faint">{t('Xuất bản {d}', { d: fmtDateTime(data.publishedAt) })}{data.updatedAt && ` · ${t('Cập nhật {d}', { d: fmtDateTime(data.updatedAt) })}`}</p>
          <div className="mt-16"><HealthDisclaimer /></div>
          <div className="mt-24"><Prose text={data.body} /></div>
          <section className="mt-24">
            <h2>{t('Nguồn tham khảo')}</h2>
            <SourceList sources={data.sources} origin={data.contentOrigin} />
          </section>
        </article>
      )}
    </Frame>
  );
}

