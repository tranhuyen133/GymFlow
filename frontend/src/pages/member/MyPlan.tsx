/**
 * V12: hội viên chưa có HLV phụ trách (gói tự tập) tự soạn giáo án từ thư viện bài tập và sửa được giáo án tự soạn.
 * Giáo án do HLV soạn chỉ xem; hội viên có HLV thì không tạo được giáo án riêng (backend chặn).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Member, WorkoutPlan, WorkoutPlanHistory, WorkoutPlanSummary } from '../../api/types';
import { PlanView } from '../../components/PlanView';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Confirm, Empty, ErrorState, LoadingBlock, Modal, PageHead, Select, StatusBadge, Table } from '../../components/ui';
import { t, tn } from '../../i18n';
import { fmtDate, fmtDateTime, planStatus } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';

export default function MyPlan() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.get<WorkoutPlan | undefined>('/workout-plans/me/current'), []);
  const me = useAsync(() => api.get<Member>('/members/me'), []);
  const history = useAsync(() => api.get<WorkoutPlanHistory[]>('/workout-plans/me/history'), []);
  const allPlans = useAsync(
    () => (me.data ? api.get<WorkoutPlanSummary[]>('/workout-plans', { memberId: me.data.id }) : Promise.resolve([] as WorkoutPlanSummary[])),
    [me.data?.id],
  );

  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [confirmSwitch, setConfirmSwitch] = useState<WorkoutPlanSummary | null>(null);

  const self = me.data != null && me.data.trainerId == null;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || me.loading) return <div className="page"><PageHead title={t('Giáo án của tôi')} /><LoadingBlock rows={6} /></div>;

  const reloadAll = () => {
    void reload();
    void history.reload();
    void allPlans.reload();
  };

  const handleSwitch = async () => {
    if (!confirmSwitch) return;
    try {
      await api.post('/workout-plans/switch', { newPlanId: confirmSwitch.id });
      toast.success(t('Đã chuyển sang giáo án {name}', { name: confirmSwitch.name }));
      setConfirmSwitch(null);
      setSwitchModalOpen(false);
      reloadAll();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const newLink = <Link to="/me/plan/new" className="btn btn-primary"><span>{t('Tự soạn giáo án')}</span></Link>;
  const libLink = <Link to="/exercises" className="btn btn-secondary"><span>{t('Thư viện bài tập')}</span></Link>;
  const switchBtn = (allPlans.data ?? []).filter((p) => p.id !== data?.summary.id).length > 0 && (
    <Button variant="secondary" onClick={() => setSwitchModalOpen(true)}>
      {t('Đổi giáo án')}
    </Button>
  );

  const otherPlans = (allPlans.data ?? []).filter((p) => p.id !== data?.summary.id);

  return (
    <div className="page">
      {!data ? (
        <>
          <PageHead eyebrow={t('Tập luyện')} title={t('Giáo án của tôi')} actions={<>{self ? libLink : undefined} {switchBtn}</>} />
          <Card>
            {self
              ? <Empty icon="clipboard" title={t('Bạn chưa có giáo án')}
                  desc={t('Gói của bạn là gói tự tập: chọn bài trong thư viện, chia theo ngày trong tuần rồi tự xếp buổi ở Lịch tập.')}
                  action={newLink} />
              : <Empty icon="clipboard" title={t('Bạn chưa có giáo án')}
                  desc={t('HLV {name} sẽ soạn giáo án phù hợp với mục tiêu của bạn.', { name: me.data?.trainerName ?? '' })} />}
          </Card>
        </>
      ) : (
        <>
          <PageHead eyebrow={t('Tập luyện')} title={data.summary.name}
            desc={data.summary.trainerId == null
              ? t('Tự soạn · {from} → {to} · {n} buổi/tuần', { from: fmtDate(data.summary.startDate), to: fmtDate(data.summary.endDate), n: data.summary.trainingDays })
              : t('HLV {trainer} · {from} → {to} · {n} buổi/tuần', { trainer: data.summary.trainerName ?? '—', from: fmtDate(data.summary.startDate), to: fmtDate(data.summary.endDate), n: data.summary.trainingDays })}
            actions={<>
              <StatusBadge map={planStatus} value={data.summary.status} />
              {switchBtn}
              {data.summary.trainerId == null && self && <Link to={`/me/plan/${data.summary.id}`} className="btn btn-secondary"><span>{t('Sửa giáo án')}</span></Link>}
              {data.summary.trainerId == null && self && newLink}
            </>} />

          {data.summary.trainerId == null && !self && (
            <Alert kind="info">{t('Bạn đã có HLV phụ trách. Giáo án tự soạn này chỉ còn để xem; HLV sẽ soạn giáo án mới cho bạn.')}</Alert>
          )}

          <div className="grid grid-main" style={{ alignItems: 'start' }}>
            <Card title={t('Lịch bài tập theo ngày')} icon="calendar"><PlanView items={data.items} /></Card>
            <Card title={t('Mục tiêu & lưu ý')} icon="target">
              <div className="stack">
                <div><div className="tiny faint">{t('Mục tiêu')}</div><b>{data.summary.goal ?? '—'}</b></div>
                {data.note && <div><div className="tiny faint">{data.summary.trainerId == null ? t('Ghi chú') : t('Lời dặn của HLV')}</div><p className="small muted mt-4" style={{ whiteSpace: 'pre-line' }}>{data.note}</p></div>}
                <div className="divider" />
                <div className="tiny faint">{data.summary.trainerId == null
                  ? t('Tổng cộng {n} bài trong tuần. Vào “Lịch tập” để tự xếp buổi, tập xong thì đánh dấu hoàn thành.', { n: data.summary.itemCount })
                  : t('Tổng cộng {n} bài trong tuần. Sau mỗi buổi, vào “Lịch tập” để đánh dấu hoàn thành.', { n: data.summary.itemCount })}</div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Lịch sử giáo án */}
      <Card title={t('Lịch sử giáo án')} icon="scroll" className="mt-20" flush>
        {history.error ? (
          <div style={{ padding: 16 }}><ErrorState message={history.error} onRetry={history.reload} /></div>
        ) : history.loading && !history.data ? (
          <div style={{ padding: 16 }}><LoadingBlock rows={3} /></div>
        ) : !history.data || history.data.length === 0 ? (
          <Empty icon="clipboard" title={t('Chưa có lịch sử thay đổi giáo án')} desc={t('Mỗi lần bạn đổi giáo án, lịch sử chuyển đổi sẽ được lưu tại đây.')} />
        ) : (
          <Table caption={t('Lịch sử giáo án')}>
            <thead>
              <tr>
                <th>{t('Thời điểm')}</th>
                <th>{t('Giáo án cũ')}</th>
                <th>{t('Giáo án mới áp dụng')}</th>
                <th>{t('Buổi tương lai đã huỷ')}</th>
                <th>{t('Ghi chú')}</th>
              </tr>
            </thead>
            <tbody>
              {history.data.map((h) => (
                <tr key={h.id}>
                  <td className="small nowrap">{fmtDateTime(h.appliedAt)}</td>
                  <td>
                    {h.oldPlanName ? <b>{h.oldPlanName}</b> : <span className="faint">{t('Bắt đầu mới')}</span>}
                  </td>
                  <td>
                    <b className="ok">{h.newPlanName}</b>
                  </td>
                  <td>
                    {h.cancelledFutureSessions > 0 ? (
                      <Badge tone="amber">{t('{n} buổi', { n: h.cancelledFutureSessions })}</Badge>
                    ) : (
                      <span className="tiny faint">{t('Không có')}</span>
                    )}
                  </td>
                  <td className="small muted">{h.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Modal chọn giáo án để đổi */}
      {switchModalOpen && (
        <Modal
          title={t('Đổi sang giáo án khác')}
          onClose={() => setSwitchModalOpen(false)}
          footer={<>
            <Button variant="ghost" onClick={() => setSwitchModalOpen(false)}>{t('Đóng')}</Button>
            <Button
              variant="primary"
              disabled={!selectedPlanId}
              onClick={() => {
                const target = otherPlans.find((p) => String(p.id) === selectedPlanId);
                if (target) setConfirmSwitch(target);
              }}
            >
              {t('Tiếp tục')}
            </Button>
          </>}
        >
          <div className="stack">
            <Alert kind="info">
              {t('Tại một thời điểm, bạn chỉ có tối đa một giáo án đang áp dụng. Giáo án cũ sẽ chuyển sang trạng thái đã kết thúc.')}
            </Alert>
            <div className="form-grid">
              <label style={{ display: 'block', gridColumn: 'span 2' }}>
                <span className="small bold">{t('Chọn giáo án muốn áp dụng:')}</span>
                <Select
                  className="mt-8"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="">{t('-- Chọn giáo án --')}</option>
                  {otherPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.trainingDays} {t('buổi/tuần')} · {fmtDate(p.startDate)} → {fmtDate(p.endDate)})
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Hộp xác nhận trước khi đổi */}
      {confirmSwitch && (
        <Confirm
          title={t('Xác nhận đổi giáo án?')}
          message={tn('Khi đổi sang giáo án "{name}", các buổi tập trong tương lai của giáo án cũ sẽ bị hủy. Các buổi đã tập trong quá khứ vẫn được giữ nguyên. Bạn có chắc chắn muốn đổi?', {
            name: <b>{confirmSwitch.name}</b>,
          })}
          confirmText={t('Đổi giáo án')}
          onConfirm={handleSwitch}
          onClose={() => setConfirmSwitch(null)}
        />
      )}
    </div>
  );
}
