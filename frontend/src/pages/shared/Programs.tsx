/**
 * V13 · Lịch tập mẫu phổ biến. Xem lịch theo tuần, nhóm cơ được tập, từng bài kèm ảnh; bấm
 * "Dùng làm giáo án" để mở trình soạn giáo án đã điền sẵn (chỉ bài đã duyệt được thêm vào).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Exercise, Level, Member } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { ExerciseMedia } from '../../components/ExerciseMedia';
import { Icon } from '../../components/Icon';
import { MuscleMap } from '../../components/MuscleMap';
import { Alert, Badge, Button, ErrorState, LoadingBlock, Modal, PageHead, Segmented, StatusBadge } from '../../components/ui';
import { t, getLang } from '../../i18n';
import { DAYS, DAY_NAMES, levelLabel } from '../../lib/format';
import { useAsync } from '../../lib/hooks';
import { PROGRAMS, programFocus, resolveItem, type Program, type ProgramItem } from '../../lib/programs';
import './kb.css';

type LevelFilter = '' | Level;

export default function Programs({ embedded = false }: { embedded?: boolean } = {}) {
  const me = useMe();
  const navigate = useNavigate();
  const lib = useAsync(() => api.get<Exercise[]>('/exercises'), []);
  const member = useAsync(() => (me.role === 'MEMBER' ? api.get<Member>('/members/me') : Promise.resolve(null)), [me.role]);
  const [level, setLevel] = useState<LevelFilter>('');
  const [open, setOpen] = useState<Program | null>(null);

  const approved = useMemo(() => {
    const map = new Map<string, Exercise>();
    (lib.data ?? []).forEach((e) => {
      if (e.reviewStatus === 'APPROVED' && !e.hidden) {
        map.set(e.name.toLowerCase(), e);
        if (e.nameEn) map.set(e.nameEn.toLowerCase(), e);
      }
    });
    return map;
  }, [lib.data]);
  const anyByName = useMemo(() => {
    const map = new Map<string, Exercise>();
    (lib.data ?? []).forEach((e) => {
      map.set(e.name.toLowerCase(), e);
      if (e.nameEn) map.set(e.nameEn.toLowerCase(), e);
    });
    return map;
  }, [lib.data]);
  const shown = PROGRAMS.filter((p) => !level || p.level === level);

  // Hội viên có HLV phụ trách thì giáo án do HLV soạn: chỉ xem lịch mẫu và gợi ý cho HLV
  const lockedByTrainer = me.role === 'MEMBER' && member.data?.trainerId != null;
  const use = (p: Program) => navigate(`${me.role === 'MEMBER' ? '/me/plan/new' : '/workout-plans/new'}?template=${p.slug}`);
  const ready = (p: Program) => {
    const all = p.days.flatMap((d) => d.items);
    return { total: all.length, ok: all.filter((it) => resolveItem(it, approved)).length };
  };

  return (
    <div className={embedded ? 'embedded-view' : 'page'}>
      {!embedded ? (
        <PageHead eyebrow={t('Kho kiến thức')} title={t('Lịch tập mẫu')}
          desc={t('Các kiểu chia buổi phổ biến trong phòng gym. Dùng làm khung để soạn giáo án nhanh rồi chỉnh số hiệp, số lần, mức tạ theo từng người.')}
          actions={<Segmented<LevelFilter> value={level} onChange={setLevel} options={[
            { value: '', label: t('Tất cả') }, { value: 'BEGINNER', label: levelLabel.BEGINNER[0] },
            { value: 'INTERMEDIATE', label: levelLabel.INTERMEDIATE[0] }, { value: 'ADVANCED', label: levelLabel.ADVANCED[0] },
          ]} />} />
      ) : (
        <div className="row row-wrap items-center justify-between gap-12 mb-16">
          <p className="small muted" style={{ margin: 0 }}>
            {t('Các kiểu chia buổi phổ biến trong phòng gym. Chọn một lịch phù hợp để làm khung soạn giáo án nhanh.')}
          </p>
          <Segmented<LevelFilter> value={level} onChange={setLevel} options={[
            { value: '', label: t('Tất cả') }, { value: 'BEGINNER', label: levelLabel.BEGINNER[0] },
            { value: 'INTERMEDIATE', label: levelLabel.INTERMEDIATE[0] }, { value: 'ADVANCED', label: levelLabel.ADVANCED[0] },
          ]} />
        </div>
      )}

      {lockedByTrainer && <Alert kind="info">{t('Bạn đang có HLV phụ trách nên giáo án do HLV soạn. Bạn vẫn xem được các lịch mẫu và có thể gợi ý HLV dùng lịch mình thích.')}</Alert>}
      {lib.error && <ErrorState message={lib.error} onRetry={lib.reload} />}
      {lib.loading && !lib.data ? <LoadingBlock rows={6} /> : (
        <div className="kb-grid kb-grid-2 mt-16">
          {shown.map((p) => {
            const r = ready(p);
            return (
              <article key={p.slug} className="kb-card prog-card">
                <div className="prog-head">
                  <div style={{ minWidth: 0 }}>
                    <h3 className="kb-title">{t(p.name)}</h3>
                    <div className="tiny faint">{t(p.short)}</div>
                  </div>
                  <StatusBadge map={levelLabel} value={p.level} />
                </div>
                <div className="prog-mid">
                  <div className="stack-sm" style={{ minWidth: 0 }}>
                    <div className="row row-wrap" style={{ gap: 6 }}>
                      <Badge tone="blue">{t('{n} buổi/tuần', { n: p.days.length })}</Badge>
                      <Badge tone="violet">{t('{n} tuần', { n: p.weeks })}</Badge>
                      <Badge tone="green">{t(p.goal)}</Badge>
                    </div>
                    <p className="small muted" style={{ margin: 0 }}>{t(p.who)}</p>
                    <WeekStrip p={p} />
                  </div>
                  <MuscleMap size="sm" counts={programFocus(p)} />
                </div>
                <div className="prog-foot">
                  <span className="tiny faint">{lib.data ? t('{a}/{b} bài đã có trong thư viện (đã duyệt)', { a: r.ok, b: r.total }) : ''}</span>
                  <div className="row" style={{ gap: 6 }}>
                    <Button size="sm" variant="ghost" icon="eye" onClick={() => setOpen(p)}>{t('Xem chi tiết')}</Button>
                    {!lockedByTrainer && <Button size="sm" variant="primary" icon="layers" disabled={r.ok === 0} onClick={() => use(p)}>{t('Dùng làm giáo án')}</Button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && (
        <Modal title={t(open.name)} size="wide" onClose={() => setOpen(null)} footer={<>
          <span className="tiny faint modal-foot-hint">{t('Bài chưa duyệt sẽ được bỏ qua khi tạo giáo án.')}</span>
          <Button variant="ghost" onClick={() => setOpen(null)}>{t('Đóng')}</Button>
          {!lockedByTrainer && <Button variant="primary" icon="layers" disabled={ready(open).ok === 0} onClick={() => use(open)}>{t('Dùng làm giáo án')}</Button>}
        </>}>
          <div className="stack">
            <div className="prog-detail-top">
              <div className="stack-sm">
                <div className="row row-wrap" style={{ gap: 6 }}>
                  <StatusBadge map={levelLabel} value={open.level} />
                  <Badge tone="blue">{t('{n} buổi/tuần', { n: open.days.length })}</Badge>
                  <Badge tone="violet">{t('{n} tuần', { n: open.weeks })}</Badge>
                </div>
                <p className="small muted" style={{ margin: 0 }}>{t(open.who)}</p>
                <ul className="kb-tips">{open.tips.map((x) => <li key={x}><Icon name="info" size={13} /><span>{t(x)}</span></li>)}</ul>
                <WeekStrip p={open} />
              </div>
              <MuscleMap size="md" counts={programFocus(open)} />
            </div>

            {open.days.map((d) => (
              <section key={d.dow} className="prog-day">
                <div className="prog-day-head">
                  <span className="prog-dow">{DAYS[d.dow - 1]}</span>
                  <b>{t(d.title)}</b>
                  <span className="tiny faint">· {DAY_NAMES[d.dow - 1]}</span>
                </div>
                <div className="prog-items">
                  {d.items.map((it, i) => <ProgramRow key={i} it={it} approved={approved} any={anyByName} />)}
                </div>
              </section>
            ))}
            <p className="tiny faint" style={{ margin: 0 }}>{t('Lịch mẫu do GymFlow biên soạn dựa trên các kiểu chia buổi phổ biến; số hiệp và số lần chỉ là điểm khởi đầu. Người có bệnh nền, chấn thương hoặc đang mang thai cần hỏi ý kiến bác sĩ trước khi tập.')}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function WeekStrip({ p }: { p: Program }) {
  const byDow = new Map(p.days.map((d) => [d.dow, d]));
  return (
    <div className="week-strip" aria-label={t('Lịch trong tuần')}>
      {[1, 2, 3, 4, 5, 6, 7].map((d) => {
        const day = byDow.get(d);
        return (
          <div key={d} className={`ws-cell ${day ? 'on' : ''}`} title={day ? t(day.title) : t('Nghỉ')}>
            <b>{DAYS[d - 1]}</b>
            <span>{day ? t(day.title) : t('Nghỉ')}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgramRow({ it, approved, any }: { it: ProgramItem; approved: Map<string, Exercise>; any: Map<string, Exercise> }) {
  const ok = resolveItem(it, approved);
  const ex = ok ?? resolveItem(it, any);
  const dose = it.minutes ? t('{n} phút', { n: it.minutes }) : `${it.sets} × ${it.reps ?? ''}`;
  const exName = ex ? (getLang() === 'en' && ex.nameEn ? ex.nameEn : t(ex.name)) : t(it.ex[0]);
  return (
    <div className={`prog-row ${ok ? '' : 'missing'}`}>
      <ExerciseMedia imageKey={ex?.imageKey} alt={ex?.name ?? it.ex[0]} playOnHover className="prog-thumb"
        fallback={<div className="prog-thumb ex-media-empty"><Icon name="dumbbell" size={16} /></div>} />
      <div style={{ minWidth: 0 }}>
        <b className="small ellipsis" style={{ display: 'block' }}>{exName}</b>
        <span className="tiny faint">
          {it.ex.length > 1 && t('Thay bằng: {list}', { list: it.ex.filter((n) => n !== ex?.name).map((n) => t(n)).join(', ') })}
          {it.note && <>{it.ex.length > 1 && ' · '}{t(it.note)}</>}
        </span>
      </div>
      <span className="prog-dose">{dose}</span>
      <span className="tiny faint hide-sm">{it.rest ? t('nghỉ {n}s', { n: it.rest }) : ''}</span>
      {!ok && <Badge tone="amber">{ex ? t('Chờ duyệt') : t('Chưa có')}</Badge>}
    </div>
  );
}
