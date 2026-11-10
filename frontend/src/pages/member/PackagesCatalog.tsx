/**
 * CHỦ FILE: Hồ Khánh Linh
 * Màn hình Chọn và so sánh gói tập (SCRUM-226).
 * Phân loại Gói Gym (tự tập) và Gói Gym + PT (có HLV kèm với số buổi rõ ràng).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type {
  Member,
  MembershipPlan,
  PackageRequest,
  PaymentMethod,
  PaymentSettings,
  ServiceItem,
  ServiceRequest,
  Subscription,
} from '../../api/types';
import { Icon } from '../../components/Icon';
import { PaymentInfo, PickCard } from '../../components/PaymentQr';
import { benefitsOf, pickBest, PlanCard, savings, unitPrice } from '../../components/PlanCard';
import { useToast } from '../../components/Toast';
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHead,
  Segmented,
  Table,
  Textarea,
} from '../../components/ui';
import { t, tn } from '../../i18n';
import { durationLabel, fmtDateTime, fmtMoney } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';
import { CATEGORY_LABELS } from '../admin/Services';
import { PayModal, RegisterPlanModal } from './MyPackages';
import '../../components/packages.css';

type FilterTab = 'ALL' | 'GYM' | 'GYM_PT' | 'SERVICE';

export default function PackagesCatalog({ embedded }: { embedded?: boolean } = {}) {
  const toast = useToast();
  const plans = useAsync(() => api.get<MembershipPlan[]>('/plans'), []);
  const subs = useAsync(() => api.get<Subscription[]>('/subscriptions/me'), []);
  const reqs = useAsync(() => api.get<PackageRequest[]>('/package-requests/me'), []);
  const pay = useAsync(() => api.get<PaymentSettings>('/payment-settings'), []);
  const me = useAsync(() => api.get<Member>('/members/me'), []);
  const services = useAsync(() => api.get<ServiceItem[]>('/services'), []);

  const [tab, setTab] = useState<FilterTab>('ALL');
  const [detailPlan, setDetailPlan] = useState<MembershipPlan | null>(null);
  const [registeringPlan, setRegisteringPlan] = useState<MembershipPlan | null>(null);
  const [payingReq, setPayingReq] = useState<PackageRequest | null>(null);
  const [buyingService, setBuyingService] = useState<ServiceItem | null>(null);
  const [payingServiceReq, setPayingServiceReq] = useState<ServiceRequest | null>(null);
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
    <div className={embedded ? undefined : 'page'}>
      {!embedded && (
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
      )}

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
            {
              value: 'SERVICE',
              label: t('Dịch vụ ({n})', {
                n: (services.data ?? []).length,
              }),
            },
          ]}
        />

        {tab !== 'SERVICE' && compareIds.length > 0 && (
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

      {tab === 'SERVICE' ? (
        <div style={{ marginBottom: 40 }}>
          {services.error && <ErrorState message={services.error} onRetry={services.reload} />}
          {services.loading && !services.data && <LoadingBlock rows={4} />}
          {services.data && services.data.length === 0 && (
            <Empty
              icon="sparkle"
              title={t('Chưa có dịch vụ bổ sung')}
              desc={t('Hiện tại phòng tập chưa có dịch vụ nào mở bán lẻ. Vui lòng quay lại sau.')}
            />
          )}
          {services.data && services.data.length > 0 && (
            <div className="grid grid-3" style={{ gap: 20 }}>
              {services.data.map((s) => (
                <Card key={s.id}>
                  <div className="stack" style={{ gap: 12, flex: 1 }}>
                    <div className="row between" style={{ alignItems: 'flex-start' }}>
                      <span className="chip on">{CATEGORY_LABELS[s.category] ?? s.category}</span>
                      {s.requiresBooking && <Badge tone="blue">{t('Cần đặt lịch trước')}</Badge>}
                    </div>

                    <h3 style={{ margin: 0, fontSize: 18 }}>{s.name}</h3>

                    <div className="pc-price" style={{ margin: '4px 0' }}>
                      {s.unitPrice != null ? (
                        <div>
                          <span style={{ fontSize: 22, fontWeight: 800 }}>{fmtMoney(s.unitPrice)}</span>
                          <span className="tiny muted"> / {t('lượt')}</span>
                        </div>
                      ) : (
                        <span className="muted small" style={{ fontWeight: 600 }}>{t('Chỉ tặng kèm theo gói')}</span>
                      )}
                    </div>

                    {s.openingNote && (
                      <div className="tiny muted row" style={{ gap: 4, alignItems: 'center' }}>
                        <Icon name="clock" size={13} />
                        <span>{s.openingNote}</span>
                      </div>
                    )}

                    {s.description && (
                      <p className="small muted" style={{ margin: 0, lineHeight: 1.5, flex: 1 }}>
                        {s.description}
                      </p>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                      {s.unitPrice != null ? (
                        <Button
                          variant="primary"
                          block
                          icon="plus"
                          onClick={() => setBuyingService(s)}
                        >
                          {t('Mua dịch vụ')}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          block
                          onClick={() => setTab('ALL')}
                        >
                          {t('Xem gói tặng kèm')}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}

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

      {/* Modal Mua lẻ dịch vụ */}
      {buyingService && (
        <BuyServiceModal
          service={buyingService}
          payment={pay.data ?? null}
          onClose={() => setBuyingService(null)}
          onDone={(created) => {
            setBuyingService(null);
            if (created.paymentMethod === 'BANK_TRANSFER') {
              setPayingServiceReq(created);
            }
          }}
        />
      )}

      {/* Modal Chuyển khoản dịch vụ */}
      {payingServiceReq && pay.data && (
        <PayServiceModal
          req={payingServiceReq}
          settings={pay.data}
          onClose={() => setPayingServiceReq(null)}
          onPaid={() => setPayingServiceReq(null)}
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

        {plan.serviceGrants && plan.serviceGrants.length > 0 && (
          <Card title={t('Quà tặng dịch vụ kèm theo')} icon="sparkle" flush>
            <ul className="pc-perks" style={{ margin: 0, padding: 14 }}>
              {plan.serviceGrants.map((g, idx) => (
                <li key={idx}>
                  <span className="pc-tick" style={{ color: 'var(--primary)' }}>
                    <Icon name="sparkle" size={12} />
                  </span>
                  <span>
                    <b>{t('Tặng {q} lượt {s}', { q: g.quantity, s: g.serviceName || t('Dịch vụ') })}</b> · {t('hạn {d} ngày', { d: g.validDays })}
                    {g.conditions ? ` (${g.conditions})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

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
              <td><b>{t('Quà tặng dịch vụ')}</b></td>
              {plans.map((p) => {
                const grants = p.serviceGrants ?? [];
                if (grants.length === 0) return <td key={p.id} className="faint">—</td>;
                return (
                  <td key={p.id}>
                    <ul style={{ margin: 0, paddingLeft: 14, fontSize: 12, lineHeight: 1.5 }}>
                      {grants.map((g, idx) => (
                        <li key={idx}>
                          <b>{t('{q} lượt {s}', { q: g.quantity, s: g.serviceName || t('Dịch vụ') })}</b>
                          <div className="tiny faint">{t('Hạn {d} ngày', { d: g.validDays })}</div>
                        </li>
                      ))}
                    </ul>
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

/** Modal Mua lẻ dịch vụ */
function BuyServiceModal({
  service,
  payment,
  onClose,
  onDone,
}: {
  service: ServiceItem;
  payment: PaymentSettings | null;
  onClose: () => void;
  onDone: (created: ServiceRequest) => void;
}) {
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>('COUNTER');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitPrice = service.unitPrice ?? 0;
  const totalPrice = quantity * unitPrice;
  const online = !!payment?.onlineEnabled && payment.hasQr;

  const submit = async () => {
    if (quantity < 1 || quantity > 100) {
      setError(t('Số lượng phải từ 1 đến 100'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<ServiceRequest>('/service-requests', {
        serviceId: service.id,
        quantity,
        paymentMethod: method,
        note: note.trim() || null,
      });
      toast.success(
        method === 'BANK_TRANSFER'
          ? t('Đã gửi yêu cầu mua dịch vụ. Vui lòng chuyển khoản theo mã QR.')
          : t('Đã gửi yêu cầu mua dịch vụ. Vui lòng thanh toán tại quầy lễ tân.')
      );
      onDone(created);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t('Mua lẻ dịch vụ: {name}', { name: service.name })}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button variant="primary" icon="check" loading={busy} onClick={submit}>
            {t('Gửi yêu cầu mua')}
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        {error && <Alert kind="error">{error}</Alert>}

        <div className="plan-summary">
          <div>
            <span className="tiny muted">{t('Dịch vụ')}</span>
            <b>{service.name}</b>
          </div>
          <div>
            <span className="tiny muted">{t('Đơn giá')}</span>
            <b className="num">{fmtMoney(unitPrice)}</b>
          </div>
          <div>
            <span className="tiny muted">{t('Số lượng')}</span>
            <b>{t('{n} lượt', { n: quantity })}</b>
          </div>
          <div>
            <span className="tiny muted">{t('Tổng cộng')}</span>
            <b className="num" style={{ fontSize: 18, color: 'var(--primary)' }}>
              {fmtMoney(totalPrice)}
            </b>
          </div>
        </div>

        <Field label={t('Số lượng muốn mua')} required hint={t('Từ 1 đến 100 lượt')}>
          <Input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value))))}
          />
        </Field>

        <Field label={t('Hình thức thanh toán')} required>
          <div className="pick-grid" role="radiogroup" aria-label={t('Thanh toán')}>
            <PickCard
              on={method === 'COUNTER'}
              onClick={() => setMethod('COUNTER')}
              icon="ticket"
              title={t('Trả tại quầy')}
              sub={t('Tiền mặt hoặc quẹt thẻ ở lễ tân')}
            />
            <PickCard
              on={method === 'BANK_TRANSFER'}
              onClick={() => setMethod('BANK_TRANSFER')}
              disabled={!online}
              icon="card"
              title={t('Chuyển khoản QR')}
              sub={online ? t('Quét mã QR ngay sau khi gửi đơn') : t('Phòng tập chưa nhận chuyển khoản')}
            />
          </div>
        </Field>

        <Field label={t('Ghi chú')} hint={t('Không bắt buộc')}>
          <Textarea
            maxLength={255}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('Ghi chú cho lễ tân (nếu có)')}
          />
        </Field>

        <Alert kind="info">
          {method === 'BANK_TRANSFER'
            ? tn('Quyền lợi dịch vụ có hiệu lực trong 90 ngày sau khi bạn chuyển khoản {price} và quản lý xác nhận.', {
                price: <b>{fmtMoney(totalPrice)}</b>,
              })
            : tn('Quyền lợi dịch vụ có hiệu lực trong 90 ngày sau khi bạn thanh toán {price} tại quầy lễ tân.', {
                price: <b>{fmtMoney(totalPrice)}</b>,
              })}
        </Alert>
      </div>
    </Modal>
  );
}

/** Modal Chuyển khoản QR cho Mua lẻ dịch vụ */
function PayServiceModal({
  req,
  settings,
  onClose,
  onPaid,
}: {
  req: ServiceRequest;
  settings: PaymentSettings;
  onClose: () => void;
  onPaid: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const markPaid = async () => {
    setBusy(true);
    try {
      await api.put(`/service-requests/${req.id}/paid`);
      toast.success(t('Đã báo quản lý. Quyền lợi dịch vụ sẽ được kích hoạt sau khi đối chiếu tài khoản.'));
      onPaid();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const canPay = settings.onlineEnabled && !req.memberPaidAt;

  return (
    <Modal
      title={t('Chuyển khoản mua dịch vụ {code}', { code: req.paymentCode ?? `#${req.id}` })}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {canPay ? t('Để sau') : t('Đóng')}
          </Button>
          {canPay && (
            <Button variant="primary" icon="check" loading={busy} onClick={() => void markPaid()}>
              {t('Tôi đã chuyển khoản')}
            </Button>
          )}
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <div className="plan-summary">
          <div>
            <span className="tiny muted">{t('Dịch vụ')}</span>
            <b>{req.serviceName}</b>
          </div>
          <div>
            <span className="tiny muted">{t('Số lượng')}</span>
            <b>{t('{n} lượt', { n: req.quantity })}</b>
          </div>
          <div>
            <span className="tiny muted">{t('Số tiền')}</span>
            <b className="num">{fmtMoney(req.totalPrice)}</b>
          </div>
        </div>

        {req.memberPaidAt && (
          <div className="pay-status">
            <Icon name="checkCircle" size={18} />
            <span>
              {t('Bạn đã báo chuyển khoản lúc {at}. Quản lý đang đối chiếu, dịch vụ sẽ được kích hoạt sau khi xác nhận.', {
                at: fmtDateTime(req.memberPaidAt),
              })}
            </span>
          </div>
        )}

        {settings.onlineEnabled ? (
          <PaymentInfo settings={settings} amount={req.totalPrice} code={req.paymentCode} />
        ) : (
          <Alert kind="warning">
            {t('Phòng tập vừa tạm dừng nhận chuyển khoản. Vui lòng thanh toán tại quầy, yêu cầu của bạn vẫn được lưu.')}
          </Alert>
        )}
      </div>
    </Modal>
  );
}
