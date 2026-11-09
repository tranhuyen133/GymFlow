import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { MemberServiceEntitlement } from '../../api/types';
import { Icon } from '../../components/Icon';
import { Badge, Button, Card, Empty, ErrorState, LoadingBlock, Modal, PageHead, Table } from '../../components/ui';
import { t } from '../../i18n';
import { fmtDate, fmtDateTime, todayIso } from '../../lib/format';
import { useAsync } from '../../lib/hooks';

export default function MyEntitlements() {
  const { data, error, loading, reload } = useAsync(() => api.get<MemberServiceEntitlement[]>('/me/entitlements'), []);
  const [selectedEntitlement, setSelectedEntitlement] = useState<MemberServiceEntitlement | null>(null);

  const today = todayIso();

  const activeEntitlements = (data ?? []).filter(
    (e) => e.status === 'ACTIVE' && e.validUntil >= today && e.remainingQty > 0
  );
  const totalRemaining = activeEntitlements.reduce((sum, e) => sum + e.remainingQty, 0);

  return (
    <div className="page">
      <PageHead
        eyebrow={t('Dịch vụ')}
        title={t('Quyền lợi & Dịch vụ của tôi')}
        desc={t('Theo dõi số lượt dịch vụ tặng kèm theo gói tập, mua thêm hoặc nhận từ các chương trình ưu đãi.')}
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Link to="/packages" className="btn btn-ghost btn-sm">
              <Icon name="sparkle" size={15} /> {t('Khám phá dịch vụ & gói')}
            </Link>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <LoadingBlock rows={6} />
      ) : data.length === 0 ? (
        <Card>
          <Empty
            icon="sparkle"
            title={t('Chưa có lượt dịch vụ nào')}
            desc={t('Đăng ký gói tập có quà tặng kèm hoặc mua thêm dịch vụ bổ sung để trải nghiệm xông hơi, massage, tư vấn dinh dưỡng…')}
            action={
              <Link to="/packages" className="btn btn-primary">
                <Icon name="sparkle" size={15} /> {t('Khám phá dịch vụ')}
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="stack" style={{ gap: 20 }}>
          <div className="plan-stats">
            <div className="plan-stat">
              <span className="tiny muted">{t('Tổng lượt còn lại')}</span>
              <b style={{ color: 'var(--primary)' }}>{totalRemaining}</b>
            </div>
            <div className="plan-stat">
              <span className="tiny muted">{t('Dịch vụ đang hiệu lực')}</span>
              <b>{activeEntitlements.length}</b>
            </div>
            <div className="plan-stat">
              <span className="tiny muted">{t('Tổng số quyền lợi')}</span>
              <b>{data.length}</b>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 16 }}>
            {data.map((e) => {
              const isExpired = e.validUntil < today;
              const isUsedUp = e.remainingQty === 0;
              const isCancelled = e.status === 'CANCELLED';
              const isInactive = isCancelled || isExpired || isUsedUp;

              const percent = e.grantedQty > 0 ? Math.round(((e.grantedQty - e.remainingQty) / e.grantedQty) * 100) : 100;

              return (
                <Card
                  key={e.id}
                  className={isInactive ? 'inactive' : ''}
                >
                  <div className="stack" style={{ gap: 12 }}>
                    <div className="row between row-wrap" style={{ alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            textDecoration: isInactive ? 'line-through' : undefined,
                            fontSize: 18,
                          }}
                        >
                          {e.serviceName}
                        </h3>
                        <div className="row row-wrap mt-4" style={{ gap: 6 }}>
                          {e.source === 'PLAN' && (
                            <span className="chip on">
                              <Icon name="ticket" size={12} />
                              {t('Tặng kèm gói {plan}', { plan: e.planName ?? '' })}
                            </span>
                          )}
                          {e.source === 'PURCHASE' && (
                            <span className="chip">
                              <Icon name="card" size={12} />
                              {t('Mua lẻ')}
                            </span>
                          )}
                          {e.source === 'PROMOTION' && (
                            <span className="chip on">
                              <Icon name="trophy" size={12} />
                              {t('Ưu đãi')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {isCancelled ? (
                          <Badge tone="red">{t('Đã huỷ theo gói')}</Badge>
                        ) : isExpired ? (
                          <Badge tone="amber">{t('Hết hạn')}</Badge>
                        ) : isUsedUp ? (
                          <Badge tone="muted">{t('Đã dùng hết')}</Badge>
                        ) : (
                          <Badge tone="green">{t('Có thể dùng')}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="stack-sm" style={{ gap: 4 }}>
                      <div className="row between" style={{ fontSize: 13 }}>
                        <span className="muted">{t('Số lượt khả dụng')}</span>
                        <b>
                          {t('Còn {rem} / {tot} lượt', {
                            rem: e.remainingQty,
                            tot: e.grantedQty,
                          })}
                        </b>
                      </div>
                      <div className="meter">
                        <i style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    <div className="small muted" style={{ lineHeight: 1.5 }}>
                      <div>
                        <Icon name="clock" size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                        {t('Hạn dùng:')} <b>{fmtDate(e.validFrom)}</b> → <b>{fmtDate(e.validUntil)}</b>
                      </div>
                      {e.conditions && (
                        <div style={{ marginTop: 2 }}>
                          <Icon name="info" size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                          {t('Điều kiện:')} {e.conditions}
                        </div>
                      )}
                    </div>

                    <div className="row between" style={{ marginTop: 4, alignItems: 'center' }}>
                      <span className="tiny faint">
                        {t('Đã dùng {n} lần', { n: e.usedQty })}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon="scroll"
                        onClick={() => setSelectedEntitlement(e)}
                      >
                        {t('Lịch sử dùng ({n})', { n: e.usages?.length ?? 0 })}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {selectedEntitlement && (
        <EntitlementUsagesModal
          entitlement={selectedEntitlement}
          onClose={() => setSelectedEntitlement(null)}
        />
      )}
    </div>
  );
}

function EntitlementUsagesModal({
  entitlement,
  onClose,
}: {
  entitlement: MemberServiceEntitlement;
  onClose: () => void;
}) {
  const usages = entitlement.usages ?? [];

  return (
    <Modal
      title={t('Lịch sử sử dụng: {service}', { service: entitlement.serviceName })}
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t('Đóng')}
        </Button>
      }
    >
      <div className="stack" style={{ gap: 12 }}>
        <div className="small muted">
          {t('Quyền lợi')} <b>{entitlement.serviceName}</b> · {t('Đã dùng {used}/{total} lượt', { used: entitlement.usedQty, total: entitlement.grantedQty })}
        </div>

        {usages.length === 0 ? (
          <Empty
            icon="scroll"
            title={t('Chưa có lần sử dụng nào')}
            desc={t('Số lượt sẽ được ghi nhận tại quầy lễ tân khi bạn đến sử dụng dịch vụ.')}
          />
        ) : (
          <div className="table-wrap">
            <Table caption={t('Lịch sử sử dụng dịch vụ')}>
              <thead>
                <tr>
                  <th>{t('Thời gian')}</th>
                  <th>{t('Người xác nhận')}</th>
                  <th>{t('Ghi chú')}</th>
                </tr>
              </thead>
              <tbody>
                {usages.map((u) => (
                  <tr key={u.id}>
                    <td className="small nowrap">{fmtDateTime(u.usedAt)}</td>
                    <td>{u.confirmedByName || '—'}</td>
                    <td className="small muted">{u.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </Modal>
  );
}
