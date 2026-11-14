import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Conversation, MemberDashboard, TrainerPublic } from '../../api/types';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Avatar, Button, Card, Empty, ErrorState, LoadingBlock, PageHead, SearchInput } from '../../components/ui';
import { DAYS } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';
import { t } from '../../i18n';
import { allSpecialties, canMessage, certificateList, fold, isoDay, matchesCoach, specialtyCounts, splitSpecialties, todayShift, weeklyHours } from './coachRules';
import './coaches.css';

/** HLV đang phụ trách hội viên (được gán hoặc HLV của giáo án đang áp dụng); null = chưa biết. */
export function useAssignedTrainers() {
  const dash = useAsync(() => api.get<MemberDashboard>('/dashboard/member'), []);
  return useMemo(() => {
    if (!dash.data) return null;
    const ids = new Set<number>();
    if (dash.data.member.trainerId != null) ids.add(dash.data.member.trainerId);
    if (dash.data.currentPlan?.trainerId != null) ids.add(dash.data.currentPlan.trainerId);
    return ids;
  }, [dash.data]);
}

export default function Coaches({ embedded }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.get<TrainerPublic[]>('/trainers/public'), []);
  const assigned = useAssignedTrainers();
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [startingChatId, setStartingChatId] = useState<number | null>(null);

  const specialties = useMemo(() => allSpecialties(data ?? []), [data]);
  const counts = useMemo(() => specialtyCounts(data ?? []), [data]);
  const filtered = useMemo(() => {
    const list = (data ?? []).filter((tr) => matchesCoach(tr, search, specialty));
    // HLV đang phụ trách lên đầu, sau đó theo kinh nghiệm
    return list.sort((a, b) => Number(assigned?.has(b.id) ?? 0) - Number(assigned?.has(a.id) ?? 0) || b.experienceYears - a.experienceYears);
  }, [data, search, specialty, assigned]);

  const startChat = async (trainerId: number) => {
    if (startingChatId != null) return;
    try {
      setStartingChatId(trainerId);
      const res = await api.post<Conversation>('/conversations', { trainerId });
      navigate(`/messages/${res.id}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setStartingChatId(null);
    }
  };

  const now = new Date();
  const today = isoDay(now);

  return (
    <div className={embedded ? undefined : 'page'}>
      {!embedded && (
        <PageHead eyebrow={t('Dịch vụ')} title={t('Đội ngũ huấn luyện viên')}
          desc={t('Gặp gỡ và trao đổi trực tiếp với các huấn luyện viên chuyên nghiệp để chọn lộ trình phù hợp.')} />
      )}

      <div className="cz-toolbar">
        <div className="cz-toolbar-top">
          <div className="cz-search"><SearchInput placeholder={t('Tìm theo tên, chuyên môn, chứng chỉ…')} value={search} onChange={setSearch} /></div>
          {data && (
            <div className="cz-total">
              <b>{filtered.length}</b><span>/ {data.length} {t('huấn luyện viên')}</span>
            </div>
          )}
        </div>
        {specialties.length > 0 && (
          <div className="cz-filter">
            <span className="cz-filter-label"><Icon name="filter" size={14} />{t('Chuyên môn')}</span>
            <div className="cz-tabs" role="group" aria-label={t('Chuyên môn')}>
              <button type="button" className={`cz-tab ${!specialty ? 'active' : ''}`} aria-pressed={!specialty} onClick={() => setSpecialty(null)}>
                {t('Tất cả')}<i>{data?.length ?? 0}</i>
              </button>
              {specialties.map((sp) => (
                <button key={sp} type="button" className={`cz-tab ${specialty === sp ? 'active' : ''}`} aria-pressed={specialty === sp}
                  onClick={() => setSpecialty(sp === specialty ? null : sp)}>
                  {t(sp)}<i>{counts.get(fold(sp)) ?? 0}</i>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <LoadingBlock rows={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <Empty icon="badge"
            title={data.length === 0 ? t('Chưa có huấn luyện viên') : t('Không tìm thấy huấn luyện viên phù hợp')}
            desc={data.length > 0 ? t('Thử đổi từ khoá tìm kiếm hoặc xoá bộ lọc chuyên môn.') : undefined}
            action={data.length > 0 && (search || specialty)
              ? <Button size="sm" variant="secondary" onClick={() => { setSearch(''); setSpecialty(null); }}>{t('Xoá bộ lọc')}</Button> : undefined} />
        </Card>
      ) : (
        <>

          <div className="cz-grid">
            {filtered.map((tr) => {
              const days = new Set(tr.shifts.map((s) => s.dayOfWeek));
              const shift = todayShift(tr.shifts, now);
              const specs = splitSpecialties(tr.specialty);
              const certs = certificateList(tr.certificates);
              const mine = assigned?.has(tr.id) ?? false;
              const chatOk = canMessage(tr.id, assigned);
              return (
                <article key={tr.id} className={`cz-card ${mine ? 'is-mine' : ''}`}>
                  <div className="cz-head">
                    <Link to={`/coaches/${tr.id}`} className="cz-avatar" aria-label={t('Xem hồ sơ {name}', { name: tr.fullName })}>
                      <Avatar name={tr.fullName} src={tr.avatar} size="lg" />
                      <i className={shift ? 'on' : ''} title={shift ? t('Có ca hôm nay') : t('Hôm nay nghỉ')} />
                    </Link>
                    <div className="cz-id">
                      <Link to={`/coaches/${tr.id}`} className="cz-name">{tr.fullName}</Link>
                      <div className="cz-specs">
                        {specs.length ? specs.slice(0, 3).map((s) => <span key={s} className="cz-spec">{t(s)}</span>)
                          : <span className="cz-spec">{t('Huấn luyện thể hình')}</span>}
                      </div>
                    </div>
                    {mine && <span className="cz-mine"><Icon name="checkCircle" size={13} />{t('HLV của bạn')}</span>}
                  </div>

                  <div className={`cz-today ${shift ? 'on' : ''}`}>
                    <Icon name="clock" size={14} />
                    {shift ? t('Có ca hôm nay {start}–{end}', { start: shift.startTime.slice(0, 5), end: shift.endTime.slice(0, 5) })
                      : tr.shifts.length ? t('Hôm nay nghỉ · {n} ca/tuần', { n: tr.shifts.length }) : t('Chưa có ca cố định – nhắn để hẹn')}
                  </div>

                  <div className="cz-stats">
                    <div><b>{tr.experienceYears}</b><span>{t('năm KN')}</span></div>
                    <div><b>{tr.shifts.length}</b><span>{t('ca/tuần')}</span></div>
                    <div><b>{weeklyHours(tr.shifts)}</b><span>{t('giờ/tuần')}</span></div>
                  </div>

                  {certs.length > 0 && (
                    <div className="cz-certs" title={certs.map((c) => t(c)).join(', ')}>
                      <Icon name="badge" size={14} />
                      {certs.slice(0, 2).map((c) => <span key={c}>{t(c)}</span>)}
                      {certs.length > 2 && <span className="more">+{certs.length - 2}</span>}
                    </div>
                  )}

                  {tr.bio && <p className="cz-bio">{t(tr.bio.trim())}</p>}

                  <div className="cz-week" aria-label={t('Ngày có ca trong tuần')}>
                    {DAYS.map((d, i) => (
                      <span key={d} className={`${days.has(i + 1) ? 'on' : ''} ${today === i + 1 ? 'today' : ''}`}>{d}</span>
                    ))}
                  </div>

                  <div className="cz-actions">
                    <Link to={`/coaches/${tr.id}`} className="btn btn-sm btn-secondary">{t('Xem hồ sơ')}</Link>
                    {chatOk ? (
                      <Button size="sm" variant="primary" icon="message" loading={startingChatId === tr.id}
                        disabled={startingChatId != null && startingChatId !== tr.id} onClick={() => startChat(tr.id)}>
                        {t('Nhắn tin')}
                      </Button>
                    ) : (
                      <Link to="/me/packages?tab=catalog" className="btn btn-sm btn-primary" title={t('Đăng ký gói có PT để được nhắn tin trực tiếp với HLV')}>
                        <Icon name="ticket" size={15} /><span>{t('Tập cùng HLV')}</span>
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {assigned && assigned.size === 0 && (
            <p className="tiny faint mt-16">{t('Bạn có thể nhắn tin trực tiếp với HLV đang phụ trách mình. Đăng ký gói có PT để được ghép HLV.')}</p>
          )}
        </>
      )}
    </div>
  );
}
