import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Member, MemberDetail as Detail, MemberServiceEntitlement, MemberStatus, Subscription } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { Icon } from '../../components/Icon';
import { ProgressPanel } from '../../components/ProgressPanel';
import { SubscriptionForm } from '../../components/SubscriptionForm';
import { CancelSubscriptionModal } from '../../components/CancelSubscriptionModal';
import { useToast } from '../../components/Toast';
import { Alert, Avatar, Badge, Button, Card, Empty, ErrorState, Field, LoadingBlock, Modal, Segmented, Select, Stat, StatusBadge, Table, Textarea } from '../../components/ui';
import { age, fmtDate, fmtMoney, genderLabel, memberStatus, planStatus, subState, todayIso } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';
import { ScheduleForm } from './Schedules';
import { MemberFormModal } from './Members';
import { t } from '../../i18n';

type Tab = 'overview' | 'progress' | 'plans' | 'entitlements';

export default function MemberDetail() {
  const { id } = useParams();
  const memberId = Number(id);
  const me = useMe();
  const admin = me.role === 'ADMIN';
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [modal, setModal] = useState<'edit' | 'subscribe' | 'schedule' | 'status' | null>(null);
  const [cancelling, setCancelling] = useState<Subscription | null>(null);
  const [usingEntitlement, setUsingEntitlement] = useState<MemberServiceEntitlement | null>(null);
  const { data, error, loading, reload } = useAsync(() => api.get<Detail>(`/members/${memberId}`), [memberId]);
  const entitlements = useAsync(() => api.get<MemberServiceEntitlement[]>(`/admin/members/${memberId}/entitlements`), [memberId]);

  if (error) return <div className="page"><ErrorState message={error} onRetry={reload} /><Link to="/members" className="link small mt-16" style={{ display: 'inline-block' }}>← {t('Danh sách hội viên')}</Link></div>;
  if (loading || !data) return <div className="page"><LoadingBlock rows={8} /></div>;
  const m = data.member;
  const rate = data.totalSessions ? Math.round((data.completedSessions / data.totalSessions) * 100) : null;

  return (
    <div className="page">
      <Link to="/members" className="link small row" style={{ gap: 6, marginBottom: 14 }}><Icon name="arrowLeft" size={15} />{t('Danh sách hội viên')}</Link>
      <div className="hero" style={{ marginBottom: 22 }}>
        <div className="row between row-wrap" style={{ position: 'relative', gap: 18 }}>
          <div className="row" style={{ gap: 16 }}>
            <Avatar name={m.fullName} size="lg" />
            <div>
              <h2>{m.fullName}</h2>
              <div className="row row-wrap mt-8" style={{ gap: 8 }}>
                <span className="chip">{m.code}</span>
                <StatusBadge map={memberStatus} value={m.status} />
                {m.subscriptionState && <StatusBadge map={subState} value={m.subscriptionState} />}
                {m.accountStatus === 'LOCKED' && <Badge tone="red">Tài khoản bị khoá</Badge>}
              </div>
            </div>
          </div>
          <div className="row row-wrap">
            <Button icon="calendar" onClick={() => setModal('schedule')}>Xếp lịch</Button>
            <Button icon="clipboard" onClick={() => navigate(`/workout-plans/new?memberId=${m.id}`)}>Soạn giáo án</Button>
            {admin && <Button icon="edit" onClick={() => setModal('edit')}>Sửa</Button>}
            {admin && <Button icon="refresh" onClick={() => setModal('status')}>Trạng thái</Button>}
            {admin && <Button variant="primary" icon="card" onClick={() => setModal('subscribe')}>Đăng ký / gia hạn</Button>}
          </div>
        </div>
      </div>

      <Segmented<Tab> value={tab} onChange={setTab} options={[
        { value: 'overview', label: 'Tổng quan' },
        { value: 'progress', label: 'Tiến độ' },
        { value: 'plans', label: t('Giáo án ({n})', { n: data.plans.length }) },
        { value: 'entitlements', label: t('Quyền lợi dịch vụ ({n})', { n: (entitlements.data ?? []).length }) },
      ]} />

      <div className="mt-16">
        {tab === 'overview' && (
          <div className="stack" style={{ gap: 18 }}>
            <div className="grid grid-4">
              <Stat icon="ticket" label="Gói hiện tại" value={m.daysLeft ?? '—'} unit={m.daysLeft != null ? 'ngày' : undefined} foot={m.currentPlanName ?? 'Chưa có gói'} />
              <Stat icon="checkCircle" label="Buổi hoàn thành" value={data.completedSessions} accent="#3d97ff" foot={t('/{n} buổi đã xếp', { n: data.totalSessions })} />
              <Stat icon="target" label="Tỉ lệ hoàn thành" value={rate ?? '—'} unit={rate != null ? '%' : undefined} accent="#8b7cff" foot="Không tính buổi đã huỷ" />
              <Stat icon="scale" label="Cân nặng gần nhất" value={data.latestWeight?.weightKg ?? '—'} unit={data.latestWeight ? 'kg' : undefined} accent="#ffb020" foot={data.latestWeight ? fmtDate(data.latestWeight.recordedDate) : '—'} />
            </div>
            <div className="grid grid-main">
              <Card title="Lịch sử gói tập" icon="card" flush>
                {data.subscriptions.length === 0 ? <Empty icon="ticket" title="Chưa đăng ký gói nào" action={admin && <Button variant="primary" size="sm" onClick={() => setModal('subscribe')}>Đăng ký ngay</Button>} /> : (
                  <Table caption="Lịch sử gói tập">
                    <thead><tr><th>Gói</th><th>Thời gian</th><th>Số tiền</th><th>Trạng thái</th>{admin && <th />}</tr></thead>
                    <tbody>
                      {data.subscriptions.map((s) => (
                        <tr key={s.id}>
                          <td><b>{s.planName}</b>{s.note && <div className="tiny faint ellipsis" style={{ maxWidth: 220 }}>{s.note}</div>}</td>
                          <td className="nowrap small">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</td>
                          <td className="num">{fmtMoney(s.pricePaid)}</td>
                          <td><StatusBadge map={subState} value={s.state} />{(s.state === 'ACTIVE' || s.state === 'EXPIRING') && <div className="tiny faint mt-4">còn {s.daysLeft} ngày</div>}</td>
                          {admin && <td className="actions">{!s.cancelled && s.state !== 'EXPIRED' && <Button size="sm" variant="ghost" icon="ban" aria-label="Huỷ gói" title="Huỷ gói" onClick={() => setCancelling(s)} />}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
              <Card title="Thông tin" icon="user">
                <dl className="kv small">
                  <dt>Email</dt><dd className="ellipsis">{m.email}</dd>
                  <dt>{t('Điện thoại')}</dt><dd>{m.phone ?? '—'}</dd>
                  <dt>{t('Giới tính')}</dt><dd>{m.gender ? genderLabel[m.gender] : '—'}</dd>
                  <dt>{t('Ngày sinh')}</dt><dd>{fmtDate(m.dateOfBirth)}{age(m.dateOfBirth) != null && <span className="faint"> · {t('{n} tuổi', { n: age(m.dateOfBirth) })}</span>}</dd>
                  <dt>{t('Chiều cao')}</dt><dd>{m.heightCm ? `${m.heightCm} cm` : '—'}</dd>
                  <dt>{t('Mục tiêu')}</dt><dd>{m.goal ?? '—'}</dd>
                  <dt>{t('HLV')}</dt><dd>{m.trainerName ?? <span className="faint">{t('Chưa phân công')}</span>}</dd>
                  <dt>{t('Địa chỉ')}</dt><dd>{m.address ?? '—'}</dd>
                  <dt>{t('Tham gia')}</dt><dd>{fmtDate(m.joinedAt)}</dd>
                  {m.note && <><dt>{t('Ghi chú')}</dt><dd className="warn">{m.note}</dd></>}
                </dl>
              </Card>
            </div>
          </div>
        )}
        {tab === 'progress' && <ProgressPanel memberId={m.id} />}
        {tab === 'plans' && (
          <Card flush>
            {data.plans.length === 0 ? <Empty icon="clipboard" title="Chưa có giáo án" action={<Button variant="primary" size="sm" onClick={() => navigate(`/workout-plans/new?memberId=${m.id}`)}>Soạn giáo án</Button>} /> : (
              <Table caption="Giáo án">
                <thead><tr><th>Giáo án</th><th>HLV</th><th>Thời gian</th><th>Nội dung</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {data.plans.map((p) => (
                    <tr key={p.id} className="clickable" onClick={() => navigate(`/workout-plans/${p.id}`)}>
                      <td><b>{p.name}</b><div className="tiny faint">{p.goal}</div></td>
                      <td>{p.trainerName ?? '—'}</td>
                      <td className="small nowrap">{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</td>
                      <td className="small">{p.trainingDays} ngày/tuần · {p.itemCount} bài</td>
                      <td><StatusBadge map={planStatus} value={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        )}
        {tab === 'entitlements' && (
          <Card flush>
            {entitlements.error && <ErrorState message={entitlements.error} onRetry={entitlements.reload} />}
            {entitlements.loading && !entitlements.data && <LoadingBlock rows={4} />}
            {entitlements.data && entitlements.data.length === 0 && (
              <Empty
                icon="sparkle"
                title={t('Hội viên chưa có quyền lợi dịch vụ')}
                desc={t('Quyền lợi dịch vụ được cấp khi đăng ký gói có tặng kèm dịch vụ, mua lẻ hoặc nhận từ chương trình ưu đãi.')}
              />
            )}
            {entitlements.data && entitlements.data.length > 0 && (
              <Table caption={t('Quyền lợi dịch vụ của hội viên')}>
                <thead>
                  <tr>
                    <th>{t('Dịch vụ')}</th>
                    <th>{t('Nguồn cấp')}</th>
                    <th>{t('Số lượt')}</th>
                    <th>{t('Thời hạn')}</th>
                    <th>{t('Điều kiện')}</th>
                    <th>{t('Trạng thái')}</th>
                    {admin && <th style={{ width: 140 }} />}
                  </tr>
                </thead>
                <tbody>
                  {entitlements.data.map((e) => {
                    const today = todayIso();
                    const isExpired = e.validUntil < today;
                    const isUsedUp = e.remainingQty === 0;
                    const isCancelled = e.status === 'CANCELLED';
                    const canUse = admin && e.status === 'ACTIVE' && !isExpired && !isUsedUp;

                    return (
                      <tr key={e.id}>
                        <td>
                          <b>{e.serviceName}</b>
                        </td>
                        <td>
                          {e.source === 'PLAN' && (
                            <span className="chip on">
                              {t('Gói {name}', { name: e.planName ?? '' })}
                            </span>
                          )}
                          {e.source === 'PURCHASE' && (
                            <span className="chip">{t('Mua lẻ')}</span>
                          )}
                          {e.source === 'PROMOTION' && (
                            <span className="chip on">{t('Ưu đãi')}</span>
                          )}
                        </td>
                        <td>
                          <b>{e.remainingQty}</b> / {e.grantedQty} <span className="small muted">lượt</span>
                        </td>
                        <td className="small nowrap">
                          {fmtDate(e.validFrom)} → {fmtDate(e.validUntil)}
                        </td>
                        <td className="small muted" style={{ maxWidth: 220 }}>
                          {e.conditions || '—'}
                        </td>
                        <td>
                          {isCancelled ? (
                            <Badge tone="red">{t('Đã huỷ')}</Badge>
                          ) : isExpired ? (
                            <Badge tone="amber">{t('Hết hạn')}</Badge>
                          ) : isUsedUp ? (
                            <Badge tone="muted">{t('Đã dùng hết')}</Badge>
                          ) : (
                            <Badge tone="green">{t('Khả dụng')}</Badge>
                          )}
                        </td>
                        {admin && (
                          <td className="actions">
                            {canUse && (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon="check"
                                onClick={() => setUsingEntitlement(e)}
                              >
                                {t('Ghi nhận dùng')}
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        )}
      </div>

      {modal === 'edit' && <MemberFormModal member={m} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
      {modal === 'subscribe' && <SubscriptionForm memberId={m.id} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
      {modal === 'schedule' && <ScheduleForm presetMemberId={m.id} onClose={() => setModal(null)} onSaved={() => { setModal(null); toast.info('Xem lịch trong mục Lịch tập'); }} />}
      {modal === 'status' && <StatusModal member={m} onClose={() => setModal(null)} onSaved={() => { setModal(null); void reload(); }} />}
      {cancelling && <CancelSubscriptionModal sub={cancelling} onClose={() => setCancelling(null)} onDone={() => { setCancelling(null); void reload(); }} />}
      {usingEntitlement && (
        <UseEntitlementModal
          entitlement={usingEntitlement}
          member={m}
          onClose={() => setUsingEntitlement(null)}
          onDone={() => {
            setUsingEntitlement(null);
            void entitlements.reload();
          }}
        />
      )}
    </div>
  );
}

function StatusModal({ member, onClose, onSaved }: { member: Member; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [status, setStatus] = useState<MemberStatus>(member.status);
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Trạng thái hội viên" size="narrow" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Huỷ</Button>
      <Button variant="primary" loading={busy} onClick={async () => {
        setBusy(true);
        try { await api.put(`/members/${member.id}/status`, { status }); toast.success('Đã cập nhật trạng thái'); onSaved(); }
        catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
      }}>Lưu</Button>
    </>}>
      <Field label="Trạng thái" hint="Bảo lưu: tạm dừng tập. Ngừng: không đăng ký gói mới được.">
        <Select value={status} onChange={(e) => setStatus(e.target.value as MemberStatus)}>
          {(Object.keys(memberStatus) as MemberStatus[]).map((s) => <option key={s} value={s}>{memberStatus[s][0]}</option>)}
        </Select>
      </Field>
    </Modal>
  );
}

function UseEntitlementModal({
  entitlement,
  member,
  onClose,
  onDone,
}: {
  entitlement: MemberServiceEntitlement;
  member: Member;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/admin/entitlements/${entitlement.id}/use`, {
        note: note.trim() || null,
      });
      toast.success(t('Đã ghi nhận sử dụng 1 lượt {name}', { name: entitlement.serviceName }));
      onDone();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t('Ghi nhận sử dụng dịch vụ')}
      size="narrow"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button variant="primary" icon="check" loading={busy} onClick={submit}>
            {t('Xác nhận trừ 1 lượt')}
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        {error && <Alert kind="error">{error}</Alert>}

        <div className="small muted">
          <div>
            {t('Hội viên:')} <b>{member.fullName}</b> ({member.code})
          </div>
          <div>
            {t('Dịch vụ:')} <b>{entitlement.serviceName}</b>
          </div>
          <div style={{ marginTop: 4 }}>
            {t('Số lượt hiện tại:')}{' '}
            <b>
              {entitlement.remainingQty} / {entitlement.grantedQty}
            </b>{' '}
            → {t('Sau khi ghi nhận:')} <b>{entitlement.remainingQty - 1} lượt</b>
          </div>
        </div>

        <Field label={t('Ghi chú')} hint={t('Tối đa 255 ký tự · không bắt buộc')}>
          <Textarea
            maxLength={255}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('VD: Lễ tân ca sáng ghi nhận, hội viên mượn tủ số 12')}
          />
        </Field>
      </div>
    </Modal>
  );
}
