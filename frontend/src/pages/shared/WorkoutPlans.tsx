import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useMe } from '../../auth/AuthContext';
import type { PlanStatus, WorkoutPlanSummary } from '../../api/types';
import { Card, Empty, ErrorState, LoadingBlock, PageHead, Pager, Person, SearchInput, Segmented, StatusBadge, Table, Button } from '../../components/ui';
import { HelpTip } from '../../components/Help';
import { TrainerPlanGrid } from '../../components/TrainerBits';
import { fmtDate, planStatus, relativeTime } from '../../lib/format';
import { displayPersonName } from '../../lib/names';
import { localizePlanName } from '../../lib/planText';
import { useAsync, usePaged } from '../../lib/hooks';
import { t } from '../../i18n';

type Filter = 'ALL' | PlanStatus;

export default function WorkoutPlans() {
  const navigate = useNavigate();
  const coach = useMe().role === 'TRAINER';
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('ACTIVE');
  const { data, error, loading, reload } = useAsync(() => api.get<WorkoutPlanSummary[]>('/workout-plans'), []);
  const list = useMemo(() => (data ?? []).filter((p) => (filter === 'ALL' || p.status === filter)
    && (q === '' || `${p.name} ${p.nameEn ?? ''} ${p.memberName}`.toLowerCase().includes(q.toLowerCase()))), [data, filter, q]);
  const paged = usePaged(list, 'workout-plans', `${filter}|${q}`);

  return (
    <div className="page">
      <PageHead eyebrow={t('Huấn luyện')} title={t('Giáo án')} desc={t('Mỗi hội viên có một giáo án đang áp dụng; giáo án mới sẽ tự chuyển giáo án cũ sang lưu trữ.')}
        actions={<Button variant="primary" icon="plus" onClick={() => navigate('/workout-plans/new')}>{t('Soạn giáo án')}</Button>} />
      <HelpTip id="workout-plans" steps={[
        'Bấm "Soạn giáo án", chọn hội viên, mục tiêu và thời gian áp dụng.',
        'Thêm bài cho từng ngày trong tuần: số hiệp, số lần, mức tạ, thời gian nghỉ. Lọc "Chỉ bài có video" trong thư viện để hội viên dễ làm theo.',
        'Mỗi hội viên chỉ có một giáo án đang áp dụng; giáo án mới tự chuyển giáo án cũ sang lưu trữ.',
        'Sau khi có giáo án, vào Lịch tập để xếp buổi theo giáo án.',
      ]} />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder={t('Tìm theo tên giáo án, hội viên…')} />
        <div className="spacer" />
        <Segmented<Filter> value={filter} onChange={setFilter} options={[
          { value: 'ACTIVE', label: t('Đang áp dụng') }, { value: 'COMPLETED', label: t('Hoàn thành') }, { value: 'ARCHIVED', label: t('Lưu trữ') }, { value: 'ALL', label: t('Tất cả') },
        ]} />
      </div>
      <Card flush>
        {error ? <div style={{ padding: 20 }}><ErrorState message={error} onRetry={reload} /></div> : loading ? <div style={{ padding: 20 }}><LoadingBlock /></div>
          : list.length === 0 ? <Empty icon="clipboard" title={t('Không có giáo án')} desc={t('Bấm “Soạn giáo án” để bắt đầu.')} /> : (
            coach ? <TrainerPlanGrid items={paged.items} /> : (
            <Table caption={t('Giáo án')}>
              <thead><tr><th>{t('Giáo án')}</th><th>{t('Hội viên')}</th><th>{t('HLV')}</th><th>{t('Thời gian')}</th><th>{t('Nội dung')}</th><th>{t('Trạng thái')}</th></tr></thead>
              <tbody>
                {paged.items.map((p) => (
                  <tr key={p.id} className="clickable" onClick={() => navigate(`/workout-plans/${p.id}`)}>
                    <td><b>{localizePlanName(p)}</b><div className="tiny faint">{t('Tạo {d}', { d: relativeTime(p.createdAt) })}</div></td>
                    <td><Person name={p.memberName} size="sm" /></td>
                    <td className="muted">{p.trainerName ? displayPersonName(p.trainerName) : '—'}</td>
                    <td className="small nowrap">{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</td>
                    <td className="small">{t('{d} ngày/tuần · {n} bài', { d: p.trainingDays, n: p.itemCount })}</td>
                    <td><StatusBadge map={planStatus} value={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
            )
          )}
        {list.length > 0 && <Pager page={paged.page} totalPages={paged.totalPages} total={paged.total} onPage={paged.setPage} size={paged.size} sizes={[10, 20, 50]} onSize={paged.setSize} />}
      </Card>
    </div>
  );
}
