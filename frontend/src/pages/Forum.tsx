import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  FORUM_CATEGORIES, FORUM_CATEGORY_VI,
  type ForumAuthor, type ForumCategory, type ForumPage, type ForumReply, type ForumReport, type ModerationAction,
  type TopicDetail, type TopicForm, type TopicSummary,
} from '../api/forum';
import { useAuth } from '../auth/AuthContext';
import { Brand } from '../components/Brand';
import { Prose } from '../components/Content';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { Alert, Avatar, Badge, Button, Confirm, Empty, ErrorState, Field, Input, LoadingBlock, Modal, Pager, SearchInput, Segmented, Select, Textarea } from '../components/ui';
import { t } from '../i18n';
import { fmtDateTime, relativeTime, roleLabel } from '../lib/format';
import { errMsg, fieldErrs, useAsync, useDebounced } from '../lib/hooks';
import { ThemeToggle } from '../theme/ThemeToggle';
import './forum.css';

/**
 * Diễn đàn thay cho Kho kiến thức. Khách xem ở /forum (thanh điều hướng công khai),
 * người đã đăng nhập xem ở /community trong khung ứng dụng. Ai đăng nhập cũng đăng bài;
 * huấn luyện viên và quản lý ẩn / ghim / khoá và xử lý báo cáo vi phạm.
 */
const basePath = (embedded?: boolean) => (embedded ? '/community' : '/forum');
const PAGE_SIZE = 20;

const TITLE_MIN = 5, TITLE_MAX = 200, BODY_MIN = 10, BODY_MAX = 10000, REPLY_MIN = 2, REPLY_MAX = 5000;

const MOD_DONE: Record<ModerationAction, string> = {
  HIDE: 'Đã ẩn bài viết', SHOW: 'Đã hiện lại bài viết', PIN: 'Đã ghim chủ đề', UNPIN: 'Đã bỏ ghim chủ đề',
  LOCK: 'Đã khoá chủ đề', UNLOCK: 'Đã mở khoá chủ đề',
};

function validateTopic(f: TopicForm) {
  const v: Record<string, string> = {};
  const title = f.title.trim();
  const body = f.body.trim();
  if (!title) v.title = 'Vui lòng nhập tiêu đề';
  else if (title.length < TITLE_MIN || title.length > TITLE_MAX) v.title = 'Tiêu đề từ 5 đến 200 ký tự';
  if (!body) v.body = 'Vui lòng nhập nội dung';
  else if (body.length < BODY_MIN || body.length > BODY_MAX) v.body = 'Nội dung từ 10 đến 10.000 ký tự';
  return v;
}

function validateReply(text: string) {
  const s = text.trim();
  if (!s) return 'Vui lòng nhập nội dung trả lời';
  if (s.length < REPLY_MIN || s.length > REPLY_MAX) return 'Trả lời từ 2 đến 5.000 ký tự';
  return null;
}

// ---------- Khung trang ----------

function PublicNav() {
  const { user } = useAuth();
  return (
    <nav className="landing-nav">
      <Link to="/" aria-label={t('Về trang giới thiệu GymFlow')} title={t('Về trang giới thiệu GymFlow')}><Brand /></Link>
      <div style={{ flex: 1 }} />
      <ThemeToggle />
      {user
        ? <Link className="btn btn-primary btn-sm" to="/community"><Icon name="arrowLeft" /><span>{t('Vào ứng dụng')}</span></Link>
        : <>
            <Link className="btn btn-ghost btn-sm" to="/login"><span>{t('Đăng nhập')}</span></Link>
            <Link className="btn btn-primary btn-sm" to="/register"><span>{t('Đăng ký hội viên')}</span></Link>
          </>}
    </nav>
  );
}

function Frame({ embedded, children }: { embedded?: boolean; children: ReactNode }) {
  if (embedded) return <div className="page forum">{children}</div>;
  return (
    <div className="public">
      <PublicNav />
      <main className="section page forum">{children}</main>
    </div>
  );
}

function AuthorLine({ author, at, edited }: { author: ForumAuthor; at: string; edited?: string | null }) {
  return (
    <div className="row row-wrap forum-author">
      <Avatar name={author.name} size="sm" />
      <b className="small">{author.name}</b>
      {author.role !== 'MEMBER' && <Badge tone={author.role === 'ADMIN' ? 'violet' : 'blue'}>{roleLabel[author.role]}</Badge>}
      <span className="tiny faint" title={fmtDateTime(at)}>{relativeTime(at)}</span>
      {edited && <span className="tiny faint" title={fmtDateTime(edited)}>· {t('đã sửa')}</span>}
    </div>
  );
}

function MemberNote() {
  return (
    <div className="disclaimer small" role="note">
      <Icon name="shield" size={16} />
      <p>{t('Bài viết do thành viên đăng, là chia sẻ cá nhân, không thay cho tư vấn của huấn luyện viên hay nhân viên y tế. Dừng tập nếu thấy đau hoặc không khoẻ.')}</p>
    </div>
  );
}

function JoinPrompt({ text }: { text: string }) {
  const { pathname } = useLocation();
  return (
    <div className="card forum-join row row-wrap between">
      <span className="muted small">{t(text)}</span>
      <div className="row" style={{ gap: 8 }}>
        <Link className="btn btn-secondary btn-sm" to="/login" state={{ from: pathname }}><span>{t('Đăng nhập')}</span></Link>
        <Link className="btn btn-primary btn-sm" to="/register"><span>{t('Đăng ký hội viên')}</span></Link>
      </div>
    </div>
  );
}

// ---------- Hộp thoại ----------

function TopicEditor({ initial, onClose, onSaved }: { initial?: TopicDetail; onClose: () => void; onSaved: (d: TopicDetail) => void }) {
  const [f, setF] = useState<TopicForm>({ title: initial?.title ?? '', category: initial?.category ?? 'GENERAL', body: initial?.body ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof TopicForm>(k: K, val: TopicForm[K]) => {
    setF((p) => ({ ...p, [k]: val }));
    if (errors[k]) setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  };
  const blur = (k: keyof TopicForm) => {
    const msg = validateTopic(f)[k];
    if (msg) setErrors((p) => ({ ...p, [k]: msg }));
  };

  const submit = async () => {
    if (busy) return;
    const v = validateTopic(f);
    setErrors(v); setError(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const body = { title: f.title.trim(), category: f.category, body: f.body.trim() };
      onSaved(initial
        ? await api.put<TopicDetail>(`/forum/topics/${initial.id}`, body)
        : await api.post<TopicDetail>('/forum/topics', body));
    } catch (e) {
      const fields = fieldErrs(e);
      setErrors(fields);
      setError(Object.keys(fields).length ? null : errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? t('Sửa chủ đề') : t('Tạo chủ đề mới')} onClose={onClose} size="medium" footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="primary" icon="check" loading={busy} onClick={() => void submit()}>{initial ? t('Lưu thay đổi') : t('Đăng chủ đề')}</Button>
    </>}>
      <div className="stack">
        {error && <Alert kind="error">{error}</Alert>}
        <Field label={t('Tiêu đề')} required error={errors.title} hint={t('Nói rõ bạn muốn hỏi hay chia sẻ điều gì (5–200 ký tự)')}>
          <Input value={f.title} maxLength={TITLE_MAX} invalid={!!errors.title} placeholder={t('VD: Tập chân 2 buổi mỗi tuần có đủ không?')}
            onChange={(e) => set('title', e.target.value)} onBlur={() => blur('title')} />
        </Field>
        <Field label={t('Nhóm chủ đề')} required>
          <Select value={f.category} onChange={(e) => set('category', e.target.value as ForumCategory)}>
            {FORUM_CATEGORIES.map((c) => <option key={c} value={c}>{t(FORUM_CATEGORY_VI[c])}</option>)}
          </Select>
        </Field>
        <Field label={t('Nội dung')} required error={errors.body} hint={t('Dòng bắt đầu bằng ## là tiêu đề nhỏ, - là gạch đầu dòng')}>
          <Textarea rows={9} value={f.body} maxLength={BODY_MAX} invalid={!!errors.body}
            placeholder={t('Mô tả tình huống, mục tiêu và những gì bạn đã thử…')}
            onChange={(e) => set('body', e.target.value)} onBlur={() => blur('body')} />
        </Field>
        <span className="tiny faint right">{f.body.trim().length.toLocaleString()}/{BODY_MAX.toLocaleString()}</span>
      </div>
    </Modal>
  );
}

/** Hộp thoại nhập lý do – dùng cho Báo cáo vi phạm (mọi người) và Ẩn bài (nhân viên). */
function ReasonDialog({ title, label, hint, confirmText, danger, min, onSubmit, onClose }: {
  title: string; label: string; hint?: string; confirmText: string; danger?: boolean; min: number;
  onSubmit: (reason: string) => Promise<void>; onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const r = reason.trim();
    if (r.length < min) { setErr(t('Vui lòng ghi lý do (ít nhất {n} ký tự)', { n: min })); return; }
    setBusy(true);
    try { await onSubmit(r); onClose(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Modal title={t(title)} onClose={onClose} size="narrow" footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={() => void submit()}>{t(confirmText)}</Button>
    </>}>
      <Field label={t(label)} required error={err ?? undefined} hint={hint ? t(hint) : undefined}>
        <Textarea rows={3} maxLength={255} value={reason} invalid={!!err} onChange={(e) => { setReason(e.target.value); setErr(null); }} />
      </Field>
    </Modal>
  );
}

// ---------- Danh sách chủ đề ----------

export function ForumList({ embedded }: { embedded?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const staff = user?.role === 'ADMIN' || user?.role === 'TRAINER';
  const base = basePath(embedded);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'' | ForumCategory>('');
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<'topics' | 'reports'>('topics');
  const [composing, setComposing] = useState(false);
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useAsync(
    () => api.get<ForumPage<TopicSummary>>('/forum/topics', { q: dq, category: cat, page, size: PAGE_SIZE }), [dq, cat, page]);
  const filtered = dq.trim() !== '' || cat !== '';

  return (
    <Frame embedded={embedded}>
      <div className="row between row-wrap forum-head">
        <div>
          <div className="kicker">{t('Diễn đàn')}</div>
          <h1 className="display-sm">{t('Cùng tập, cùng hỏi, cùng tiến bộ')}</h1>
          <p className="lead">{t('Hỏi đáp và chia sẻ kinh nghiệm tập luyện giữa hội viên, huấn luyện viên và phòng tập.')}</p>
        </div>
        {user && <Button variant="primary" icon="plus" onClick={() => setComposing(true)}>{t('Tạo chủ đề')}</Button>}
      </div>

      {!user && <JoinPrompt text={t('Đăng nhập để đặt câu hỏi và trả lời trong diễn đàn.')} />}

      {staff && (
        <div className="mt-16">
          <Segmented value={tab} onChange={setTab} options={[{ value: 'topics', label: t('Danh sách chủ đề') }, { value: 'reports', label: t('Báo cáo vi phạm') }]} />
        </div>
      )}

      {tab === 'reports' && staff ? <ReportsPanel base={base} /> : (
        <>
          <div className="toolbar mt-16">
            <SearchInput value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder={t('Tìm chủ đề…')} />
          </div>
          <div className="chips" style={{ marginBottom: 18 }}>
            <button className={`chip ${cat === '' ? 'on' : ''}`} onClick={() => { setCat(''); setPage(0); }}>{t('Tất cả')}</button>
            {FORUM_CATEGORIES.map((c) => (
              <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => { setCat(c); setPage(0); }}>{t(FORUM_CATEGORY_VI[c])}</button>
            ))}
          </div>

          {error ? <ErrorState message={error} onRetry={reload} /> : !data ? <LoadingBlock rows={5} /> : data.content.length === 0 ? (
            filtered
              ? <Empty icon="search" title={t('Không tìm thấy chủ đề phù hợp')} desc={t('Thử từ khoá khác hoặc chọn Tất cả.')} />
              : <Empty icon="message" title={t('Chưa có chủ đề nào')} desc={t('Hãy là người mở đầu cuộc trò chuyện.')}
                  action={user ? <Button variant="primary" icon="plus" onClick={() => setComposing(true)}>{t('Tạo chủ đề')}</Button> : undefined} />
          ) : (
            <div className="stack" aria-busy={loading}>
              {data.content.map((x) => (
                <Link key={x.id} to={`${base}/${x.id}`} className={`card hoverable forum-topic ${x.pinned ? 'is-pinned' : ''} ${x.hidden ? 'is-hidden' : ''}`}>
                  <div className="row row-wrap" style={{ gap: 6 }}>
                    {x.pinned && <Badge tone="green">{t('Đã ghim')}</Badge>}
                    <span className="chip">{t(FORUM_CATEGORY_VI[x.category])}</span>
                    {x.locked && <Badge tone="muted">{t('Đã khoá')}</Badge>}
                    {x.hidden && <Badge tone="red">{t('Đã ẩn')}</Badge>}
                  </div>
                  <h3>{t(x.title)}</h3>
                  <p className="small muted">{t(x.excerpt)}</p>
                  <div className="row between row-wrap" style={{ gap: 8 }}>
                    <AuthorLine author={x.author} at={x.createdAt} />
                    <span className="tiny muted row" style={{ gap: 6 }}>
                      <Icon name="message" size={14} />{t('{n} trả lời', { n: x.replyCount })}
                      <span className="faint">· {t('hoạt động {d}', { d: relativeTime(x.lastActivityAt) })}</span>
                    </span>
                  </div>
                </Link>
              ))}
              <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={setPage} />
            </div>
          )}
        </>
      )}

      {composing && (
        <TopicEditor onClose={() => setComposing(false)} onSaved={(d) => {
          setComposing(false);
          toast.success(t('Đã đăng chủ đề'));
          navigate(`${base}/${d.id}`);
        }} />
      )}
    </Frame>
  );
}

function ReportsPanel({ base }: { base: string }) {
  const toast = useToast();
  const { data, error, reload } = useAsync(() => api.get<ForumReport[]>('/forum/reports'), []);
  const [busy, setBusy] = useState<number | null>(null);
  const resolve = async (r: ForumReport) => {
    setBusy(r.id);
    try { await api.put(`/forum/reports/${r.id}/resolve`); toast.success(t('Đã đánh dấu xử lý xong')); await reload(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(null); }
  };
  if (error) return <div className="mt-16"><ErrorState message={error} onRetry={reload} /></div>;
  if (!data) return <div className="mt-16"><LoadingBlock rows={3} /></div>;
  if (data.length === 0) return <Empty icon="checkCircle" title={t('Không có báo cáo nào cần xử lý')} />;
  return (
    <div className="stack mt-16">
      {data.map((r) => (
        <div key={r.id} className="card forum-report">
          <div className="row between row-wrap" style={{ gap: 8 }}>
            <div className="row row-wrap" style={{ gap: 6 }}>
              <Badge tone="amber">{r.replyId ? t('Trả lời') : t('Chủ đề')}</Badge>
              {r.targetHidden && <Badge tone="muted">{t('Đã ẩn')}</Badge>}
              <b className="small">{r.topicTitle}</b>
            </div>
            <span className="tiny faint">{relativeTime(r.createdAt)}</span>
          </div>
          <blockquote className="small muted">{r.excerpt}</blockquote>
          <p className="small">{t('Lý do')}: <span className="muted">{r.reason}</span></p>
          <p className="tiny faint">{t('Người viết: {a} · Người báo cáo: {b}', { a: r.targetAuthor, b: r.reporter })}</p>
          <div className="row row-wrap" style={{ gap: 8 }}>
            <Link className="btn btn-secondary btn-sm" to={`${base}/${r.topicId}${r.replyId ? `#reply-${r.replyId}` : ''}`}><Icon name="eye" /><span>{t('Xem bài')}</span></Link>
            <Button size="sm" icon="check" loading={busy === r.id} onClick={() => void resolve(r)}>{t('Đã xử lý')}</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Trang chủ đề ----------

type Target = { kind: 'topic' | 'reply'; id: number };

export function ForumTopicPage({ embedded }: { embedded?: boolean }) {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const base = basePath(embedded);
  const { data, error, status, reload, setData } = useAsync(() => api.get<TopicDetail>(`/forum/topics/${encodeURIComponent(id)}`), [id]);
  const [editing, setEditing] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [hideTarget, setHideTarget] = useState<Target | null>(null);
  const [reportTarget, setReportTarget] = useState<Target | null>(null);
  const [deleteReply, setDeleteReply] = useState<ForumReply | null>(null);

  const moderateTopic = async (action: ModerationAction, reason?: string) => {
    try {
      setData(await api.put<TopicDetail>(`/forum/topics/${id}/moderation`, { action, reason: reason ?? null }));
      toast.success(MOD_DONE[action]);
    } catch (e) { toast.error(errMsg(e)); throw e; }
  };
  const moderateReply = async (replyId: number, action: ModerationAction, reason?: string) => {
    try {
      await api.put(`/forum/replies/${replyId}/moderation`, { action, reason: reason ?? null });
      toast.success(MOD_DONE[action]);
      await reload();
    } catch (e) { toast.error(errMsg(e)); throw e; }
  };

  const back = (
    <Link className="muted small row" style={{ gap: 6, width: 'fit-content' }} to={base}>
      <Icon name="arrowLeft" size={14} />{t('Tất cả chủ đề')}
    </Link>
  );

  if (error) {
    return (
      <Frame embedded={embedded}>
        {back}
        <div className="mt-24">
          {status === 404
            ? <Empty icon="message" title={t('Không tìm thấy chủ đề')} desc={t('Chủ đề không tồn tại hoặc đã bị ẩn.')} />
            : <ErrorState message={error} onRetry={reload} />}
        </div>
      </Frame>
    );
  }
  if (!data) return <Frame embedded={embedded}>{back}<div className="mt-24"><LoadingBlock rows={6} /></div></Frame>;

  const canReply = !!user && !data.hidden && (!data.locked || data.canModerate);

  return (
    <Frame embedded={embedded}>
      {back}
      <article className="card forum-post mt-16">
        <div className="row row-wrap" style={{ gap: 6 }}>
          {data.pinned && <Badge tone="green">{t('Đã ghim')}</Badge>}
          <span className="chip">{t(FORUM_CATEGORY_VI[data.category])}</span>
          {data.locked && <Badge tone="muted">{t('Đã khoá')}</Badge>}
          {data.hidden && <Badge tone="red">{t('Đã ẩn')}</Badge>}
        </div>
        <h1 className="forum-title">{t(data.title)}</h1>
        <AuthorLine author={data.author} at={data.createdAt} edited={data.updatedAt} />
        {data.hidden && data.hiddenReason && <Alert kind="warning">{t('Chủ đề đang bị ẩn: {r}', { r: data.hiddenReason })}</Alert>}
        <Prose text={t(data.body)} />
        <div className="row row-wrap forum-actions">
          {data.mine && !data.hidden && <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(true)}>{t('Sửa')}</Button>}
          {(data.mine || user?.role === 'ADMIN') && <Button size="sm" variant="ghost" icon="trash" onClick={() => setAskDelete(true)}>{t('Xoá')}</Button>}
          {user && !data.mine && <Button size="sm" variant="ghost" icon="alert" onClick={() => setReportTarget({ kind: 'topic', id: data.id })}>{t('Báo vi phạm')}</Button>}
          {data.canModerate && <>
            <span className="forum-sep" aria-hidden />
            <Button size="sm" variant="ghost" icon="star" onClick={() => void moderateTopic(data.pinned ? 'UNPIN' : 'PIN').catch(() => undefined)}>{data.pinned ? t('Bỏ ghim') : t('Ghim')}</Button>
            <Button size="sm" variant="ghost" icon={data.locked ? 'unlock' : 'lock'} onClick={() => void moderateTopic(data.locked ? 'UNLOCK' : 'LOCK').catch(() => undefined)}>{data.locked ? t('Mở khoá') : t('Khoá')}</Button>
            {data.hidden
              ? <Button size="sm" variant="ghost" icon="eye" onClick={() => void moderateTopic('SHOW').catch(() => undefined)}>{t('Hiện lại')}</Button>
              : <Button size="sm" variant="ghost" icon="eyeOff" onClick={() => setHideTarget({ kind: 'topic', id: data.id })}>{t('Ẩn')}</Button>}
          </>}
        </div>
      </article>

      <div className="mt-16"><MemberNote /></div>

      <section className="mt-24">
        <h2 className="forum-replies-title">{t('{n} trả lời', { n: data.replyCount })}</h2>
        <div className="stack mt-16">
          {data.replies.map((r) => (
            <ReplyItem key={r.id} r={r} canModerate={data.canModerate} isAdmin={user?.role === 'ADMIN'} loggedIn={!!user}
              onUpdated={(nr) => setData((d) => d && { ...d, replies: d.replies.map((x) => (x.id === nr.id ? nr : x)) })}
              onDelete={() => setDeleteReply(r)}
              onReport={() => setReportTarget({ kind: 'reply', id: r.id })}
              onHide={() => setHideTarget({ kind: 'reply', id: r.id })}
              onShow={() => void moderateReply(r.id, 'SHOW').catch(() => undefined)} />
          ))}
        </div>
        <div className="mt-16">
          {canReply
            ? <ReplyComposer topicId={data.id} onPosted={() => void reload()} />
            : !user
              ? <JoinPrompt text={t('Đăng nhập để trả lời chủ đề này.')} />
              : <p className="muted small">{t(data.hidden ? 'Chủ đề đang bị ẩn nên không nhận thêm trả lời.' : 'Chủ đề đã khoá, không nhận thêm trả lời.')}</p>}
        </div>
      </section>

      {editing && <TopicEditor initial={data} onClose={() => setEditing(false)} onSaved={(d) => { setData(d); setEditing(false); toast.success(t('Đã lưu thay đổi')); }} />}
      {askDelete && (
        <Confirm title={t('Xoá chủ đề?')} danger confirmText={t('Xoá chủ đề')}
          message={t('Chủ đề và mọi trả lời sẽ bị xoá vĩnh viễn, không khôi phục được.')}
          onClose={() => setAskDelete(false)}
          onConfirm={async () => {
            try { await api.del(`/forum/topics/${data.id}`); toast.success(t('Đã xoá chủ đề')); navigate(base, { replace: true }); }
            catch (e) { toast.error(errMsg(e)); throw e; }
          }} />
      )}
      {deleteReply && (
        <Confirm title={t('Xoá trả lời?')} danger confirmText={t('Xoá')}
          message={t('Trả lời này sẽ bị xoá vĩnh viễn.')}
          onClose={() => setDeleteReply(null)}
          onConfirm={async () => {
            try { await api.del(`/forum/replies/${deleteReply.id}`); toast.success(t('Đã xoá trả lời')); await reload(); }
            catch (e) { toast.error(errMsg(e)); throw e; }
          }} />
      )}
      {hideTarget && (
        <ReasonDialog title={hideTarget.kind === 'topic' ? t('Ẩn chủ đề') : t('Ẩn trả lời')} label={t('Lý do ẩn')} min={5} danger confirmText={t('Ẩn bài')}
          hint={t('Người viết sẽ thấy lý do này. Bài bị ẩn không hiện với người khác.')}
          onClose={() => setHideTarget(null)}
          onSubmit={(reason) => (hideTarget.kind === 'topic' ? moderateTopic('HIDE', reason) : moderateReply(hideTarget.id, 'HIDE', reason))} />
      )}
      {reportTarget && (
        <ReasonDialog title={t('Báo cáo bài vi phạm')} label={t('Lý do báo cáo')} min={5} confirmText={t('Gửi báo cáo')}
          hint={t('VD: quảng cáo, công kích cá nhân, thông tin sức khoẻ sai lệch nguy hiểm…')}
          onClose={() => setReportTarget(null)}
          onSubmit={async (reason) => {
            await api.post(reportTarget.kind === 'topic' ? `/forum/topics/${reportTarget.id}/report` : `/forum/replies/${reportTarget.id}/report`, { reason });
            toast.success(t('Đã gửi báo cáo. Huấn luyện viên hoặc quản lý sẽ xem xét.'));
          }} />
      )}
    </Frame>
  );
}

function ReplyItem({ r, canModerate, isAdmin, loggedIn, onUpdated, onDelete, onReport, onHide, onShow }: {
  r: ForumReply; canModerate: boolean; isAdmin: boolean; loggedIn: boolean;
  onUpdated: (r: ForumReply) => void; onDelete: () => void; onReport: () => void; onHide: () => void; onShow: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(r.body);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const v = validateReply(text);
    if (v) { setErr(v); return; }
    setBusy(true);
    try {
      onUpdated(await api.put<ForumReply>(`/forum/replies/${r.id}`, { body: text.trim() }));
      setEditing(false);
      toast.success('Đã lưu thay đổi');
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const staffReply = r.author.role !== 'MEMBER';
  return (
    <div id={`reply-${r.id}`} className={`card forum-reply ${staffReply ? 'is-staff' : ''} ${r.hidden ? 'is-hidden' : ''}`}>
      <div className="row between row-wrap" style={{ gap: 8 }}>
        <AuthorLine author={r.author} at={r.createdAt} edited={r.updatedAt} />
        {r.hidden && <Badge tone="red">{t('Đã ẩn')}</Badge>}
      </div>
      {r.hidden && r.hiddenReason && <p className="tiny warn">{t('Lý do ẩn: {r}', { r: r.hiddenReason })}</p>}
      {editing ? (
        <div className="stack-sm">
          <Field label={t('Sửa trả lời')} error={err ?? undefined}>
            <Textarea rows={4} maxLength={REPLY_MAX} value={text} invalid={!!err} onChange={(e) => { setText(e.target.value); setErr(null); }} />
          </Field>
          <div className="row" style={{ gap: 8 }}>
            <Button size="sm" variant="primary" loading={busy} onClick={() => void save()}>{t('Lưu')}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setText(r.body); setErr(null); }}>{t('Huỷ')}</Button>
          </div>
        </div>
      ) : <Prose text={r.body} />}
      {!editing && (
        <div className="row row-wrap forum-actions">
          {r.mine && !r.hidden && <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(true)}>{t('Sửa')}</Button>}
          {(r.mine || isAdmin) && <Button size="sm" variant="ghost" icon="trash" onClick={onDelete}>{t('Xoá')}</Button>}
          {loggedIn && !r.mine && <Button size="sm" variant="ghost" icon="alert" onClick={onReport}>{t('Báo vi phạm')}</Button>}
          {canModerate && (r.hidden
            ? <Button size="sm" variant="ghost" icon="eye" onClick={onShow}>{t('Hiện lại')}</Button>
            : <Button size="sm" variant="ghost" icon="eyeOff" onClick={onHide}>{t('Ẩn')}</Button>)}
        </div>
      )}
    </div>
  );
}

function ReplyComposer({ topicId, onPosted }: { topicId: number; onPosted: () => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy) return;
    const v = validateReply(text);
    if (v) { setErr(v); return; }
    setBusy(true);
    try {
      await api.post<ForumReply>(`/forum/topics/${topicId}/replies`, { body: text.trim() });
      setText('');
      toast.success(t('Đã gửi trả lời'));
      onPosted();
    } catch (e) {
      const f = fieldErrs(e);
      setErr(f.body ?? errMsg(e));
    } finally { setBusy(false); }
  };
  return (
    <div className="card stack-sm">
      <Field label={t('Trả lời của bạn')} error={err ?? undefined}>
        <Textarea rows={4} maxLength={REPLY_MAX} value={text} invalid={!!err} placeholder={t('Chia sẻ kinh nghiệm hoặc góp ý của bạn…')}
          onChange={(e) => { setText(e.target.value); setErr(null); }}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void submit(); }} />
      </Field>
      <div className="row between row-wrap" style={{ gap: 8 }}>
        <span className="tiny faint">{t('Ctrl/⌘ + Enter để gửi')}</span>
        <Button variant="primary" icon="arrowRight" loading={busy} onClick={() => void submit()}>{t('Gửi trả lời')}</Button>
      </div>
    </div>
  );
}
