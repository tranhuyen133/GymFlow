/**
 * CHỦ FILE: Hồ Khánh Linh
 * Màn hình Chọn và so sánh gói tập (SCRUM-226).
 * Phân loại Gói Gym (tự tập) và Gói Gym + PT (có HLV kèm với số buổi rõ ràng).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Member, MembershipPlan, PackageRequest, PaymentSettings, Subscription } from '../../api/types';
import { Icon } from '../../components/Icon';
import { benefitsOf, pickBest, PlanCard, savings, unitPrice } from '../../components/PlanCard';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Empty, ErrorState, LoadingBlock, Modal, PageHead, Segmented, Table } from '../../components/ui';
import { t, tn } from '../../i18n';
import { durationLabel, fmtMoney } from '../../lib/format';
import { useAsync } from '../../lib/hooks';
import { PayModal, RegisterPlanModal } from './MyPackages';
import '../../components/packages.css';

type FilterTab = 'ALL' | 'GYM' | 'GYM_PT' | 'SERVICE';

export default function PackagesCatalog() {
  const toast = useToast();
  const plans = useAsync(() => api.get<MembershipPlan[]>('/plans'), []);
  const subs = useAsync(() => api.get<Subscription[]>('/subscriptions/me'), []);
  const reqs = useAsync(() => api.get<PackageRequest[]>('/package-requests/me'), []);
  const pay = useAsync(() => api.get<PaymentSettings>('/payment-settings'), []);
  const me = useAsync(() => api.get<Member>('/members/me'), []);

  const [tab, setTab] = useState<FilterTab>('ALL');
  const [detailPlan, setDetailPlan] = useState<MembershipPlan | null>(null);
  const [registeringPlan, setRegisteringPlan] = useState<MembershipPlan | null>(null);
  const [payingReq, setPayingReq] = useState<PackageRequest | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const pending = reqs.data?.find((r) => r.status === 'PENDING') ?? null;
  const currentSub = subs.data?.find((s) => s.state === 'ACTIVE' || s.state === 'EXPIRING');

  const onSalePlans = useMemo(() => {
    return (plans.data ?? []).filter((p) => p.active);
  }, [plans.data]);

  const bestId = useMemo(() => pickBest(onSalePlans), [onSalePlans]);
  const saveMap = useMemo(() => savings(onSalePlans), [onSalePlans]);

  // Tab filter: 'ALL' | 'GYM' | 'GYM_PT'
  // Tab 'SERVICE' dành chỗ sẵn nhưng ẩn khi chưa có dữ liệu dịch vụ
  const filteredPlans = useMemo(() => {
    return onSalePlans.filter((p) => {
      const isPt = p.planType === 'GYM_PT' || p.includesTrainer;
      if (tab === 'GYM') return !isPt;
      if (tab === 'GYM_PT') return isPt;
      return true;
    });
  }, [onSalePlans, tab]);

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.info(t('Chỉ so sánh tối đa 3 gói cùng lúc'));
        return prev;
      }
      return [...prev, id];
    });
  };

  const comparedPlans = useMemo(() => {
    return onSalePlans.filter((p) => compareIds.includes(p.id));
  }, [onSalePlans, compareIds]);

  const reloadAll = () => {
    void subs.reload();
    void reqs.reload();
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={t('Dịch vụ & Gói tập')}
        title={t('Chọn gói tập phù hợp')}
        desc={t('Khám phá các gói tập Gym tự do và gói Gym kèm huấn luyện viên riêng (PT) với số buổi và thời hạn minh bạch.')}
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Link to="/me/packages" className="btn btn-ghost btn-sm">
              <Icon name="ticket" size={15} /> {t('Gói của tôi')}
            </Link>
          </div>
        }
      />

      {pending && (
        <div style={{ marginBottom: 16 }}>
          <Alert kind="info">
            {tn('Bạn đang có đơn đăng ký gói {plan} chờ xử lý. Để chọn gói khác, vui lòng vào trang Gói của tôi để huỷ đơn hiện tại.', {
              plan: <b>{pending.planName}</b>,
            })}
          </Alert>
        </div>
      )}

      {/* Bộ lọc phân loại gói */}
      <div className="row between row-wrap" style={{ gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as FilterTab)}
          options={[
            { value: 'ALL', label: t('Tất cả ({n})', { n: onSalePlans.length }) },
            {
              value: 'GYM',
              label: t('Gói Gym (Tự tập) ({n})', {
                n: onSalePlans.filter((p) => !(p.planType === 'GYM_PT' || p.includesTrainer)).length,
              }),
            },
            {
              value: 'GYM_PT',
              label: t('Gói Gym + PT ({n})', {
                n: onSalePlans.filter((p) => p.planType === 'GYM_PT' || p.includesTrainer).length,
              }),
            },
          ]}
        />

        {compareIds.length > 0 && (
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span className="small muted">
              {t('Đã chọn {n}/3 gói so sánh', { n: compareIds.length })}
            </span>
            <Button
              size="sm"
              variant="primary"
              icon="layers"
              disabled={compareIds.length < 2}
              onClick={() => setShowCompareModal(true)}
            >
              {t('So sánh ngay')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCompareIds([])}>
              {t('Bỏ chọn')}
            </Button>
          </div>
        )}
      </div>

      {/* Grid danh sách gói */}
      {plans.error && <ErrorState message={plans.error} onRetry={plans.reload} />}
      {plans.loading && !plans.data && <LoadingBlock rows={4} />}
      {plans.data && filteredPlans.length === 0 && (
        <Empty icon="ticket" title={t('Không có gói nào phù hợp')} desc={t('Vui lòng chọn bộ lọc khác hoặc quay lại sau.')} />
      )}

      <div className="plan-grid" style={{ marginBottom: 40 }}>
        {filteredPlans.map((p) => {
          const isPt = p.planType === 'GYM_PT' || p.includesTrainer;
          const isLegacyPt = isPt && !p.ptSessions;
          const isMine = currentSub?.planId === p.id;
          const isComparing = compareIds.includes(p.id);

          return (
            <PlanCard
              key={p.id}
              plan={p}
              best={p.id === bestId}
              saving={saveMap.get(p.id)}
              className={isMine ? 'current' : ''}
              badge={isMine ? <Badge tone="blue">{t('Bạn đang dùng')}</Badge> : undefined}
              footer={
                <div className="stack" style={{ gap: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ flex: 1 }}
                      icon="info"
                      onClick={() => setDetailPlan(p)}
                    >
                      {t('Xem chi tiết')}
                    </Button>
                    <Button
                      size="sm"
                      variant={isComparing ? 'primary' : 'secondary'}
                      style={{ flex: 1 }}
                      icon={isComparing ? 'check' : 'layers'}
                      onClick={() => toggleCompare(p.id)}
                    >
                      {isComparing ? t('Đã chọn') : t('So sánh')}
                    </Button>
                  </div>

                  {isLegacyPt ? (
                    <Button size="sm" variant="secondary" block disabled title={t('Gói PT đang được cập nhật số buổi')}>
                      {t('Đang cập nhật')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={p.id === bestId ? 'primary' : 'secondary'}
                      block
                      icon={isMine ? 'repeat' : 'plus'}
                      disabled={!!pending}
                      title={pending ? t('Bạn đang có một đơn chờ xác nhận') : undefined}
                      onClick={() => setRegisteringPlan(p)}
                    >
                      {isMine ? t('Gia hạn gói này') : t('Đăng ký')}
                    </Button>
                  )}
                </div>
              }
            />
          );
        })}
      </div>

      {/* Modal Chi tiết gói */}
      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          isMine={currentSub?.planId === detailPlan.id}
          pending={!!pending}
          onClose={() => setDetailPlan(null)}
          onRegister={() => {
            const p = detailPlan;
            setDetailPlan(null);
            setRegisteringPlan(p);
          }}
        />
      )}

      {/* Modal So sánh các gói đã chọn */}
      {showCompareModal && comparedPlans.length > 0 && (
        <PlanComparisonModal
          plans={comparedPlans}
          pending={!!pending}
          onClose={() => setShowCompareModal(false)}
          onRegister={(p) => {
            setShowCompareModal(false);
            setRegisteringPlan(p);
          }}
        />
      )}

      {/* Modal Đăng ký gói */}
      {registeringPlan && (
        <RegisterPlanModal
          plan={registeringPlan}
          subs={subs.data ?? []}
          payment={pay.data ?? null}
          currentTrainerId={me.data?.trainerId ?? null}
          onClose={() => setRegisteringPlan(null)}
          onDone={(created) => {
            setRegisteringPlan(null);
            reloadAll();
            if (created.paymentMethod === 'BANK_TRANSFER') setPayingReq(created);
          }}
        />
      )}

      {/* Modal Chuyển khoản QR */}
      {payingReq && pay.data && (
        <PayModal
          req={payingReq}
          settings={pay.data}
          onClose={() => setPayingReq(null)}
          onPaid={() => {
            setPayingReq(null);
            reloadAll();
          }}
        />
      )}
    </div>
  );
}

/** Modal Xem chi tiết một gói tập */
function PlanDetailModal({
  plan,
  isMine,
  pending,
  onClose,
  onRegister,
}: {
  plan: MembershipPlan;
  isMine: boolean;
  pending: boolean;
  onClose: () => void;
  onRegister: () => void;
}) {
  const isPt = plan.planType === 'GYM_PT' || plan.includesTrainer;
  const isLegacyPt = isPt && !plan.ptSessions;
  const perks = benefitsOf(plan);

  return (
    <Modal
      title={t(plan.name)}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('Đóng')}
          </Button>
          {isLegacyPt ? (
            <Button variant="secondary" disabled>
              {t('Đang cập nhật số buổi')}
            </Button>
          ) : (
            <Button variant="primary" icon="plus" disabled={pending} onClick={onRegister}>
              {isMine ? t('Gia hạn gói này') : t('Đăng ký gói này')}
            </Button>
          )}
        </>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        <div className="row between row-wrap" style={{ alignItems: 'center', gap: 8 }}>
          <span className={`chip ${isPt ? 'on' : ''}`}>
            <Icon name={isPt ? 'badge' : 'user'} size={14} />
            {isPt ? t('Gói Gym + Huấn luyện viên kèm') : t('Gói Gym (Tự luyện tập)')}
          </span>
          <div className="row" style={{ alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800 }}>{fmtMoney(plan.price)}</span>
            <span className="tiny muted">/ {durationLabel(plan.durationDays)}</span>
          </div>
        </div>

        {isPt && plan.ptSessions ? (
          <div className="pc-pt-sessions" style={{ width: '100%', padding: '10px 14px' }}>
            <Icon name="badge" size={16} />
            <span>
              <b>{t('{n} buổi PT', { n: plan.ptSessions })}</b> · {t('hạn dùng trong {d} ngày', { d: plan.ptValidDays ?? plan.durationDays })}
            </span>
          </div>
        ) : isLegacyPt ? (
          <div className="pc-pt-warning" style={{ width: '100%', padding: '10px 14px' }}>
            <Icon name="alert" size={16} />
            <span>{t('Gói PT đang được cập nhật số buổi tập và hạn sử dụng')}</span>
          </div>
        ) : null}

        {plan.description && <p style={{ margin: 0, lineHeight: 1.6 }}>{t(plan.description)}</p>}

        <Card title={t('Quyền lợi bao gồm')} icon="check" flush>
          {perks.length === 0 ? (
            <div style={{ padding: 14 }} className="small muted">
              {t('Quyền lợi tiêu chuẩn tại phòng tập GymFlow.')}
            </div>
          ) : (
            <ul className="pc-perks" style={{ margin: 0, padding: 14 }}>
              {perks.map((p) => (
                <li key={p}>
                  <span className="pc-tick">
                    <Icon name="check" size={12} />
                  </span>
                  <span>{t(p)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="small muted" style={{ lineHeight: 1.5, background: 'var(--surface-2)', padding: 12, borderRadius: 10 }}>
          {isPt ? (
            <p style={{ margin: 0 }}>
              <Icon name="info" size={13} style={{ display: 'inline', verticalAlign: -2 }} />{' '}
              {t(
                'Gói kèm PT: Huấn luyện viên đồng hành, theo dõi chỉ số, thiết kế lộ trình tập luyện cá nhân hoá. Số buổi PT được trừ tự động khi hoàn thành buổi tập cùng HLV.'
              )}
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              <Icon name="info" size={13} style={{ display: 'inline', verticalAlign: -2 }} />{' '}
              {t(
                'Gói Gym tự tập: Sử dụng toàn bộ trang thiết bị tại phòng tập, tự xây dựng giáo án từ thư viện bài tập và tự xếp lịch tập theo ý muốn.'
              )}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Bảng so sánh tối đa 3 gói tập */
function PlanComparisonModal({
  plans,
  pending,
  onClose,
  onRegister,
}: {
  plans: MembershipPlan[];
  pending: boolean;
  onClose: () => void;
  onRegister: (p: MembershipPlan) => void;
}) {
  return (
    <Modal
      title={t('So sánh các gói tập')}
      size="wide"
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t('Đóng')}
        </Button>
      }
    >
      <div className="table-wrap">
        <Table caption={t('Bảng so sánh gói tập')}>
          <thead>
            <tr>
              <th style={{ width: '22%' }}>{t('Tiêu chí')}</th>
              {plans.map((p) => (
                <th key={p.id} style={{ width: `${78 / plans.length}%` }}>
                  <b>{t(p.name)}</b>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>{t('Loại gói')}</b></td>
              {plans.map((p) => {
                const isPt = p.planType === 'GYM_PT' || p.includesTrainer;
                return (
                  <td key={p.id}>
                    <span className={`chip ${isPt ? 'on' : ''}`}>
                      <Icon name={isPt ? 'badge' : 'user'} size={13} />
                      {isPt ? t('Gym + PT') : t('Gym (Tự tập)')}
                    </span>
                  </td>
                );
              })}
            </tr>

            <tr>
              <td><b>{t('Giá niêm yết')}</b></td>
              {plans.map((p) => (
                <td key={p.id} className="num" style={{ fontSize: 16, fontWeight: 700 }}>
                  {fmtMoney(p.price)}
                </td>
              ))}
            </tr>

            <tr>
              <td><b>{t('Thời hạn')}</b></td>
              {plans.map((p) => (
                <td key={p.id}>{durationLabel(p.durationDays)}</td>
              ))}
            </tr>

            <tr>
              <td><b>{t('Giá quy đổi')}</b></td>
              {plans.map((p) => (
                <td key={p.id} className="small muted">
                  {unitPrice(p)}
                </td>
              ))}
            </tr>

            <tr>
              <td><b>{t('HLV kèm riêng')}</b></td>
              {plans.map((p) => {
                const isPt = p.planType === 'GYM_PT' || p.includesTrainer;
                return (
                  <td key={p.id}>
                    {isPt ? (
                      <span className="ok row" style={{ gap: 4 }}>
                        <Icon name="check" size={14} /> {t('Có HLV')}
                      </span>
                    ) : (
                      <span className="muted">{t('Không có (Tự tập)')}</span>
                    )}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td><b>{t('Số buổi PT')}</b></td>
              {plans.map((p) => {
                const isPt = p.planType === 'GYM_PT' || p.includesTrainer;
                if (!isPt) return <td key={p.id} className="faint">—</td>;
                if (!p.ptSessions) return <td key={p.id} className="warn">{t('Đang cập nhật')}</td>;
                return (
                  <td key={p.id}>
                    <b>{t('{n} buổi', { n: p.ptSessions })}</b>
                  </td>
                );
              })}
            </tr>

            <tr>
              <td><b>{t('Hạn dùng buổi PT')}</b></td>
              {plans.map((p) => {
                const isPt = p.planType === 'GYM_PT' || p.includesTrainer;
                if (!isPt) return <td key={p.id} className="faint">—</td>;
                if (!p.ptValidDays) return <td key={p.id}>{t('Theo thời hạn gói')}</td>;
                return <td key={p.id}>{t('{n} ngày', { n: p.ptValidDays })}</td>;
              })}
            </tr>

            <tr>
              <td><b>{t('Quyền lợi')}</b></td>
              {plans.map((p) => {
                const perks = benefitsOf(p);
                return (
                  <td key={p.id}>
                    {perks.length === 0 ? (
                      <span className="muted small">{t('Tiêu chuẩn')}</span>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.5 }}>
                        {perks.map((b) => (
                          <li key={b}>{t(b)}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td><b>{t('Hành động')}</b></td>
              {plans.map((p) => {
                const isPt = p.planType === 'GYM_PT' || p.includesTrainer;
                const isLegacyPt = isPt && !p.ptSessions;
                return (
                  <td key={p.id}>
                    {isLegacyPt ? (
                      <Button size="sm" variant="secondary" disabled>
                        {t('Đang cập nhật')}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        icon="plus"
                        disabled={pending}
                        onClick={() => onRegister(p)}
                      >
                        {t('Đăng ký')}
                      </Button>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </Table>
      </div>
    </Modal>
  );
}
