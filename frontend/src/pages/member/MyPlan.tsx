/**
 * V12: hội viên chưa có HLV phụ trách (gói tự tập) tự soạn giáo án từ thư viện bài tập và sửa được giáo án tự soạn.
 * Giáo án do HLV soạn chỉ xem; hội viên có HLV thì không tạo được giáo án riêng (backend chặn).
 */
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Member, WorkoutPlan } from '../../api/types';
import { PlanView } from '../../components/PlanView';
import { Alert, Card, Empty, ErrorState, LoadingBlock, PageHead, StatusBadge } from '../../components/ui';
import { t } from '../../i18n';
import { fmtDate, planStatus } from '../../lib/format';
import { useAsync } from '../../lib/hooks';

export default function MyPlan() {
  const { data, error, loading, reload } = useAsync(() => api.get<WorkoutPlan | undefined>('/workout-plans/me/current'), []);
  const me = useAsync(() => api.get<Member>('/members/me'), []);
  const self = me.data != null && me.data.trainerId == null;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || me.loading) return <div className="page"><PageHead title={t('Giáo án của tôi')} /><LoadingBlock rows={6} /></div>;

  const newLink = <Link to="/me/plan/new" className="btn btn-primary"><span>{t('Tự soạn giáo án')}</span></Link>;
  const libLink = <Link to="/exercises" className="btn btn-secondary"><span>{t('Thư viện bài tập')}</span></Link>;

  if (!data) {
    return (
      <div className="page">
        <PageHead eyebrow={t('Tập luyện')} title={t('Giáo án của tôi')} actions={self ? libLink : undefined} />
        <Card>
          {self
            ? <Empty icon="clipboard" title={t('Bạn chưa có giáo án')}
                desc={t('Gói của bạn là gói tự tập: chọn bài trong thư viện, chia theo ngày trong tuần rồi tự xếp buổi ở Lịch tập.')}
                action={newLink} />
            : <Empty icon="clipboard" title={t('Bạn chưa có giáo án')}
                desc={t('HLV {name} sẽ soạn giáo án phù hợp với mục tiêu của bạn.', { name: me.data?.trainerName ?? '' })} />}
        </Card>
      </div>
    );
  }
  const s = data.summary;
  const own = s.trainerId == null;
  return (
    <div className="page">
      <PageHead eyebrow={t('Tập luyện')} title={s.name}
        desc={own
          ? t('Tự soạn · {from} → {to} · {n} buổi/tuần', { from: fmtDate(s.startDate), to: fmtDate(s.endDate), n: s.trainingDays })
          : t('HLV {trainer} · {from} → {to} · {n} buổi/tuần', { trainer: s.trainerName ?? '—', from: fmtDate(s.startDate), to: fmtDate(s.endDate), n: s.trainingDays })}
        actions={<>
          <StatusBadge map={planStatus} value={s.status} />
          {own && self && <Link to={`/me/plan/${s.id}`} className="btn btn-secondary"><span>{t('Sửa giáo án')}</span></Link>}
          {own && self && newLink}
        </>} />
      {own && !self && (
        <Alert kind="info">{t('Bạn đã có HLV phụ trách. Giáo án tự soạn này chỉ còn để xem; HLV sẽ soạn giáo án mới cho bạn.')}</Alert>
      )}
      <div className="grid grid-main" style={{ alignItems: 'start' }}>
        <Card title={t('Lịch bài tập theo ngày')} icon="calendar"><PlanView items={data.items} /></Card>
        <Card title={t('Mục tiêu & lưu ý')} icon="target">
          <div className="stack">
            <div><div className="tiny faint">{t('Mục tiêu')}</div><b>{s.goal ?? '—'}</b></div>
            {data.note && <div><div className="tiny faint">{own ? t('Ghi chú') : t('Lời dặn của HLV')}</div><p className="small muted mt-4" style={{ whiteSpace: 'pre-line' }}>{data.note}</p></div>}
            <div className="divider" />
            <div className="tiny faint">{own
              ? t('Tổng cộng {n} bài trong tuần. Vào “Lịch tập” để tự xếp buổi, tập xong thì đánh dấu hoàn thành.', { n: s.itemCount })
              : t('Tổng cộng {n} bài trong tuần. Sau mỗi buổi, vào “Lịch tập” để đánh dấu hoàn thành.', { n: s.itemCount })}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
