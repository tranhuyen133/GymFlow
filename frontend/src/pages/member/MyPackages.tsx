/**
 * CHỦ FILE: Linh (Hồ Khánh Linh)
 * TASK: SCRUM-172 · HẠN: 04/11/2026
 * CẦN LÀM: Màn 2.5 Gói của tôi (SUB-07).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { api } from '../../api/client';
import type { MembershipPlan, Subscription } from '../../api/types';
import { Icon } from '../../components/Icon';
import { Alert, Card, Empty, ErrorState, LoadingBlock, Meter, PageHead, StatusBadge } from '../../components/ui';
import { durationLabel, fmtDate, fmtMoney, parseDate, subState } from '../../lib/format';
import { useAsync } from '../../lib/hooks';

export default function MyPackages() {
  const subs = useAsync(() => api.get<Subscription[]>('/subscriptions/me'), []);
  const plans = useAsync(() => api.get<MembershipPlan[]>('/plans'), []);

  if (subs.error) return <ErrorState message={subs.error} onRetry={subs.reload} />;
  if (subs.loading || !subs.data) return (
    <div className="page">
      <PageHead title="Gói tập của tôi" />
      <LoadingBlock rows={6} />
    </div>
  );

  const current = subs.data.find((s) => s.state === 'ACTIVE' || s.state === 'EXPIRING');
  const upcoming = subs.data.filter((s) => s.state === 'UPCOMING');
  const history = subs.data.filter((s) => s.state === 'EXPIRED' || s.state === 'CANCELLED');
  const total = current
    ? (parseDate(current.endDate).getTime() - parseDate(current.startDate).getTime()) / 86400000 + 1
    : 1;

  return (
    <div className="page">
      <PageHead
        eyebrow="Thành viên"
        title="Gói tập của tôi"
        desc="Trạng thái gói tính theo ngày hôm nay. Gia hạn tại quầy sẽ được nối tiếp ngay sau gói hiện tại."
      />

      {/* Cảnh báo sắp hết hạn */}
      {current?.state === 'EXPIRING' && upcoming.length === 0 && (
        <div style={{ marginBottom: 18 }}>
          <Alert kind="warning">
            Gói của bạn còn <b>{current.daysLeft} ngày</b>. Gia hạn sớm để không bị gián đoạn lịch tập.
          </Alert>
        </div>
      )}

      {/* Chưa có gói */}
      {!current && upcoming.length === 0 && (
        <div style={{ marginBottom: 18 }}>
          <Alert kind="error">
            Bạn chưa có gói tập hiệu lực, chưa thể xếp lịch tập mới.
          </Alert>
        </div>
      )}

      <div className="grid grid-main" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ gap: 18 }}>

          {/* ── Gói đang hiệu lực ── */}
          {current && (
            <div className="hero">
              <div style={{ position: 'relative' }}>
                <div className="row between">
                  <span className="chip on">
                    <Icon name="ticket" size={14} /> Gói hiện tại
                  </span>
                  <StatusBadge map={subState} value={current.state} />
                </div>
                <h2 className="mt-16">{current.planName}</h2>
                <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <span className="num" style={{ fontSize: 44 }}>{current.daysLeft}</span>
                  <span className="muted">ngày còn lại</span>
                </div>
                <div className="mt-16">
                  <Meter
                    value={total - current.daysLeft}
                    max={total}
                    color={current.state === 'EXPIRING' ? 'var(--warning)' : undefined}
                  />
                </div>
                <div className="row between small muted mt-8">
                  <span>Bắt đầu {fmtDate(current.startDate)}</span>
                  <span>Hết hạn {fmtDate(current.endDate)}</span>
                </div>
                {current.note && (
                  <div className="tiny faint mt-8" style={{ borderTop: '1px solid var(--hairline-soft)', paddingTop: 8 }}>
                    Ghi chú: {current.note}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Gói sắp tới ── */}
          {upcoming.length > 0 && (
            <Card title="Gói sắp bắt đầu" icon="clock" flush>
              <div className="stack-sm">
                {upcoming.map((s) => (
                  <div key={s.id} className="row between" style={{ padding: '10px 16px' }}>
                    <div>
                      <b className="small">{s.planName}</b>
                      <div className="tiny faint">
                        {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span className="num small">{fmtMoney(s.pricePaid)}</span>
                      <StatusBadge map={subState} value={s.state} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Lịch sử đăng ký ── */}
          <Card title="Lịch sử đăng ký" icon="scroll" flush>
            {subs.data.length === 0 ? (
              <Empty icon="ticket" title="Chưa có gói nào" />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Gói</th>
                      <th>Thời gian</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.data.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <b>{s.planName}</b>
                          {s.note && <div className="tiny faint">{s.note}</div>}
                        </td>
                        <td className="small nowrap">
                          {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                        </td>
                        <td className="num">{fmtMoney(s.pricePaid)}</td>
                        <td><StatusBadge map={subState} value={s.state} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ── Sidebar: các gói đang mở bán ── */}
        <Card title="Các gói đang mở bán" icon="sparkle">
          <div className="stack-sm">
            {plans.loading && <LoadingBlock rows={3} />}
            {plans.data?.filter((p) => p.active).length === 0 && (
              <Empty icon="package" title="Chưa có gói nào đang mở bán" />
            )}
            {plans.data?.filter((p) => p.active).map((p) => (
              <div
                key={p.id}
                className="row between"
                style={{ padding: '10px 0', borderBottom: '1px solid var(--hairline-soft)' }}
              >
                <div>
                  <b className="small">{p.name}</b>
                  <div className="tiny faint">
                    {durationLabel(p.durationDays)}
                    {p.benefits ? ` · ${p.benefits}` : ''}
                  </div>
                  {p.description && (
                    <div className="tiny faint" style={{ marginTop: 2 }}>{p.description}</div>
                  )}
                </div>
                <span className="num small">{fmtMoney(p.price)}</span>
              </div>
            ))}
            <p className="tiny faint mt-8">Liên hệ lễ tân để đăng ký hoặc gia hạn.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
