/**
 * CHỦ FILE: Linh (Hồ Khánh Linh)
 * TASK: SCRUM-172 · Màn 2.5 Gói của tôi (SUB-07)
 * Bổ sung SUB-08 (kiểm thử phân hệ Hội viên): hội viên tự chọn gói và gửi đơn đăng ký, theo dõi trạng thái,
 * huỷ đơn đang chờ. Gói chỉ có hiệu lực sau khi quản lý xác nhận đã nhận tiền.
 * V12: trả tại quầy hoặc chuyển khoản theo mã QR (nội dung = mã đơn); gói có HLV kèm thì chọn HLV khi gửi đơn.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import PackagesCatalog from './PackagesCatalog';
import MyEntitlements from './MyEntitlements';
import Coaches from './Coaches';
import type {
  Member,
  MembershipPlan,
  PackageRequest,
  PaymentMethod,
  PaymentSettings,
  PromotionValidationResponse,
  PtSessionUsage,
  Subscription,
  Trainer,
} from '../../api/types';
import { Icon } from '../../components/Icon';
import { initials, PaymentInfo, PickCard } from '../../components/PaymentQr';
import { benefitsOf, PlanCard, pickBest, savings } from '../../components/PlanCard';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Confirm, Empty, ErrorState, Field, Input, LoadingBlock, Meter, Modal, PageHead, Segmented, StatusBadge, Table, Textarea } from '../../components/ui';
import { t, tn } from '../../i18n';
import { addDays, durationLabel, fmtDate, fmtDateTime, fmtMoney, packageRequestStatus, parseDate, subState, toIsoDate, todayIso } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';

/** Khớp PackageRequestService.MAX_DESIRED_START_DAYS. */
const MAX_START_DAYS = 60;


/** Ngày cuối cùng còn gói (không tính gói đã huỷ / đã hết hạn) – gói mới nối tiếp sau ngày này. */
function lastEndDate(subs: Subscription[]) {
  const today = todayIso();
  return subs.filter((s) => !s.cancelled && s.endDate >= today).map((s) => s.endDate).sort().pop() ?? null;
}

function overlaps(subs: Subscription[], start: string, end: string) {
  return subs.some((s) => !s.cancelled && s.startDate <= end && s.endDate >= start);
}

export default function MyPackages() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const activeTab = (params.get('tab') as 'my' | 'catalog' | 'entitlements' | 'coaches') || 'my';
  const setTab = (t: string) => setParams({ tab: t });

  const subs = useAsync(() => api.get<Subscription[]>('/subscriptions/me'), []);
  const plans = useAsync(() => api.get<MembershipPlan[]>('/plans/upgrades'), []);
  const reqs = useAsync(() => api.get<PackageRequest[]>('/package-requests/me'), []);
  const pay = useAsync(() => api.get<PaymentSettings>('/payment-settings'), []);
  const me = useAsync(() => api.get<Member>('/members/me'), []);
  const [picked, setPicked] = useState<MembershipPlan | null>(null);
  const [cancelling, setCancelling] = useState<PackageRequest | null>(null);
  const [paying, setPaying] = useState<PackageRequest | null>(null);
  const [viewUsagesSubId, setViewUsagesSubId] = useState<number | null>(null);

  if (subs.error) return <ErrorState message={subs.error} onRetry={subs.reload} />;
  if (subs.loading || !subs.data) return (
    <div className="page">
      <PageHead title={t('Gói tập & Dịch vụ')} />
      <LoadingBlock rows={6} />
    </div>
  );

  const current = subs.data.find((s) => s.state === 'ACTIVE' || s.state === 'EXPIRING');
  const upcoming = subs.data.filter((s) => s.state === 'UPCOMING');
  const pending = reqs.data?.find((r) => r.status === 'PENDING') ?? null;
  const onSale = [...(plans.data?.filter((p) => p.active) ?? [])].sort((a, b) => a.durationDays - b.durationDays || a.price - b.price);
  const save = savings(onSale);
  const best = pickBest(onSale);
  const total = current
    ? (parseDate(current.endDate).getTime() - parseDate(current.startDate).getTime()) / 86400000 + 1
    : 1;
  const reloadAll = () => { void subs.reload(); void reqs.reload(); void plans.reload(); };

  const cancelRequest = async () => {
    if (!cancelling) return;
    try {
      await api.put(`/package-requests/${cancelling.id}/cancel`);
      toast.success(t('Đã huỷ đơn đăng ký'));
      reloadAll();
    } catch (e) { toast.error(errMsg(e)); }
    setCancelling(null);
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={t('Thành viên')}
        title={t('Gói tập & Dịch vụ')}
        desc={t('Quản lý gói tập hiện tại, đăng ký gói mới, kiểm tra lượt quà tặng và kết nối với huấn luyện viên.')}
      />

      <div className="mb-20">
        <Segmented
          value={activeTab}
          onChange={setTab}
          options={[
            { value: 'my', label: t('Gói của tôi') },
            { value: 'catalog', label: t('Tất cả gói tập') },
            { value: 'entitlements', label: t('Lượt quà tặng') },
            { value: 'coaches', label: t('Huấn luyện viên') },
          ]}
        />
      </div>

      {activeTab === 'catalog' && <PackagesCatalog embedded />}
      {activeTab === 'entitlements' && <MyEntitlements embedded />}
      {activeTab === 'coaches' && <Coaches embedded />}

      {activeTab === 'my' && (
        <>

      <div className="stack" style={{ gap: 12, marginBottom: 18 }}>
        {pending && pending.paymentMethod === 'BANK_TRANSFER' && (
          <Alert kind="info" action={<div className="row" style={{ gap: 6 }}>
            <Button size="sm" variant="primary" icon="card" onClick={() => setPaying(pending)}>{t('Xem mã QR')}</Button>
            <Button size="sm" variant="ghost" onClick={() => setCancelling(pending)}>{t('Huỷ đơn')}</Button>
          </div>}>
            {pending.memberPaidAt
              ? tn('Bạn đã báo chuyển khoản {price} cho đơn {plan} lúc {at}. Quản lý sẽ đối chiếu tài khoản và kích hoạt gói.', {
                price: <b>{fmtMoney(pending.price)}</b>, plan: <b>{t(pending.planName)}</b>, at: fmtDateTime(pending.memberPaidAt),
              })
              : tn('Đơn {plan} đang chờ thanh toán. Chuyển khoản {price} với nội dung {code}, rồi bấm "Tôi đã chuyển khoản".', {
                plan: <b>{t(pending.planName)}</b>, price: <b>{fmtMoney(pending.price)}</b>, code: <b className="num">{pending.paymentCode}</b>,
              })}
          </Alert>
        )}
        {pending && pending.paymentMethod !== 'BANK_TRANSFER' && (
          <Alert kind="info" action={<Button size="sm" variant="ghost" onClick={() => setCancelling(pending)}>{t('Huỷ đơn')}</Button>}>
            {tn('Đơn đăng ký {plan} ({price}) đang chờ xác nhận. Vui lòng thanh toán tại quầy lễ tân để được kích hoạt gói.', {
              plan: <b>{t(pending.planName)}</b>, price: fmtMoney(pending.price),
            })}
          </Alert>
        )}
        {current?.state === 'EXPIRING' && upcoming.length === 0 && !pending && (
          <Alert kind="warning">
            {tn('Gói của bạn còn {days}. Gia hạn sớm để không bị gián đoạn lịch tập.', {
              days: <b>{t('{n} ngày', { n: current.daysLeft })}</b>,
            })}
          </Alert>
        )}
        {!current && upcoming.length === 0 && !pending && (
          <Alert kind="error">{t('Bạn chưa có gói tập hiệu lực. Chọn một gói đang mở bán để gửi đăng ký.')}</Alert>
        )}
      </div>

      <div className="grid grid-main" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ gap: 18 }}>

          {current && (
            <div className="hero pkg-hero">
              <div style={{ position: 'relative' }}>
                <div className="row between">
                  <span className="chip on"><Icon name="ticket" size={14} /> {t('Gói hiện tại')}</span>
                  <StatusBadge map={subState} value={current.state} />
                </div>
                <div className="row row-wrap mt-16" style={{ gap: 20, alignItems: 'center' }}>
                  <div className="pkg-ring" style={{ ['--p' as string]: Math.round((current.daysLeft / total) * 100), ['--c' as string]: current.state === 'EXPIRING' ? 'var(--warning)' : undefined }}
                    role="img" aria-label={t('Còn {n}% thời hạn', { n: Math.round((current.daysLeft / total) * 100) })}>
                    <span>{Math.round((current.daysLeft / total) * 100)}%</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: 0 }}>{t(current.planName)}</h2>
                    <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                      <span className="pkg-days" key={current.daysLeft}>{current.daysLeft}</span>
                      <span className="muted">{t('ngày còn lại')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-16">
                  <Meter value={total - current.daysLeft} max={total} color={current.state === 'EXPIRING' ? 'var(--warning)' : undefined} />
                </div>
                <div className="row between small muted mt-8">
                  <span>{t('Bắt đầu {d}', { d: fmtDate(current.startDate) })}</span>
                  <span>{t('Hết hạn {d}', { d: fmtDate(current.endDate) })}</span>
                </div>
                {current.ptSessionsTotal != null && (
                  <div className="pkg-pt-box mt-16" style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
                    <div className="row between row-wrap" style={{ gap: 8, marginBottom: 8 }}>
                      <span className="small">
                        <Icon name="badge" size={15} style={{ verticalAlign: -2, marginRight: 4 }} />
                        <b>{t('Còn {x}/{n} buổi PT', { x: current.ptSessionsRemaining ?? 0, n: current.ptSessionsTotal })}</b>
                        {current.ptValidUntil && (
                          <span className="muted"> · {t('hạn đến {d}', { d: fmtDate(current.ptValidUntil) })}</span>
                        )}
                      </span>
                      <Button size="sm" variant="ghost" icon="scroll" onClick={() => setViewUsagesSubId(current.id)}>
                        {t('Lịch sử dùng')}
                      </Button>
                    </div>
                    <Meter value={current.ptSessionsUsed ?? 0} max={current.ptSessionsTotal} color="var(--primary)" />
                    <div className="tiny muted mt-8">
                      {[
                        current.trainerName ? t('HLV phụ trách: {name}', { name: current.trainerName }) : t('Chưa phân công HLV'),
                        current.ptSessionMinutes ? t('{n} phút mỗi buổi', { n: current.ptSessionMinutes }) : null,
                        current.ptCancelNoticeHours != null ? t('Huỷ hoặc dời buổi PT trước ít nhất {n} giờ', { n: current.ptCancelNoticeHours }) : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                )}
                {current.ptSessionsTotal == null && (
                  <div className="row between row-wrap mt-16" style={{ gap: 8, padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
                    <span className="small muted">
                      {current.planType === 'GYM_PT'
                        ? t('Gói có PT nhưng chưa khai báo số buổi. Vui lòng liên hệ quầy lễ tân.')
                        : t('Gói hiện tại không kèm buổi tập với huấn luyện viên (PT).')}
                    </span>
                    {current.planType !== 'GYM_PT' && (
                      <Button size="sm" variant="ghost" icon="badge" onClick={() => setTab('catalog')}>{t('Xem các gói có PT')}</Button>
                    )}
                  </div>
                )}
                {(current.benefits || current.usageTerms) && (
                  <div className="small mt-16 stack-sm" style={{ gap: 4 }}>
                    {current.benefits && <div><b>{t('Quyền lợi đã mua')}:</b> <span className="muted">{current.benefits}</span></div>}
                    {current.usageTerms && <div><b>{t('Điều kiện sử dụng')}:</b> <span className="muted">{current.usageTerms}</span></div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <Card title={t('Gói sắp bắt đầu')} icon="clock" flush>
              <div className="stack-sm">
                {upcoming.map((s) => (
                  <div key={s.id} className="row between row-wrap" style={{ padding: '10px 16px', gap: 8 }}>
                    <div>
                      <b className="small">{t(s.planName)}</b>
                      <div className="tiny faint">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</div>
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

          <Card title={t('Đơn đăng ký của tôi')} icon="clipboard" flush>
            {reqs.error ? <div style={{ padding: 16 }}><ErrorState message={reqs.error} onRetry={reqs.reload} /></div>
              : !reqs.data ? <div style={{ padding: 16 }}><LoadingBlock rows={2} /></div>
              : reqs.data.length === 0 ? <Empty icon="clipboard" title="Chưa có đơn đăng ký nào" desc="Chọn gói ở mục Các gói đang mở bán để gửi đơn." />
              : (
                <Table caption={t('Đơn đăng ký của tôi')}>
                  <thead>
                    <tr><th>{t('Gói')}</th><th>{t('Số tiền')}</th><th>{t('Gửi lúc')}</th><th>{t('Trạng thái')}</th><th aria-label={t('Thao tác')} /></tr>
                  </thead>
                  <tbody>
                    {reqs.data.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <b>{t(r.planName)}</b>
                          <div className="tiny faint">
                            {durationLabel(r.durationDays)} · {r.desiredStartDate ? t('Bắt đầu mong muốn {d}', { d: fmtDate(r.desiredStartDate) }) : t('Bắt đầu sớm nhất')}
                          </div>
                          {r.note && <div className="tiny faint">{t('Ghi chú: {note}', { note: r.note })}</div>}
                          <div className="tiny faint">
                            {r.paymentMethod === 'BANK_TRANSFER' ? t('Chuyển khoản · {code}', { code: r.paymentCode ?? '' }) : t('Trả tại quầy')}
                            {r.trainerName && <> · {t('HLV {name}', { name: r.trainerName })}</>}
                          </div>
                        </td>
                        <td className="num nowrap">{fmtMoney(r.price)}</td>
                        <td className="small nowrap">{fmtDateTime(r.createdAt)}</td>
                        <td>
                          <StatusBadge map={packageRequestStatus} value={r.status} />
                          {r.status === 'REJECTED' && r.decisionNote && <div className="tiny" style={{ color: 'var(--danger)', marginTop: 4 }}>{t('Lý do: {r}', { r: r.decisionNote })}</div>}
                          {r.status === 'APPROVED' && <div className="tiny faint mt-4">{t('Duyệt {d}', { d: fmtDateTime(r.decidedAt) })}</div>}
                          {r.status === 'PENDING' && !r.planStillOnSale && <div className="tiny" style={{ color: 'var(--warning)', marginTop: 4 }}>{t('Gói đã ngừng kinh doanh')}</div>}
                        </td>
                        <td className="nowrap">
                          {r.status === 'PENDING' && r.paymentMethod === 'BANK_TRANSFER' && <Button size="sm" variant="ghost" icon="card" onClick={() => setPaying(r)}>{t('Mã QR')}</Button>}
                          {r.status === 'PENDING' && <Button size="sm" variant="ghost" icon="x" onClick={() => setCancelling(r)}>{t('Huỷ đơn')}</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
          </Card>

          <Card title={t('Lịch sử gói tập')} icon="scroll" flush>
            {subs.data.length === 0 ? (
              <Empty icon="ticket" title="Chưa có gói nào" desc="Gói đã được kích hoạt sẽ hiện ở đây." />
            ) : (
              <Table caption={t('Lịch sử gói tập')}>
                <thead><tr><th>{t('Gói')}</th><th>{t('Thời gian')}</th><th>{t('Số tiền')}</th><th>{t('Trạng thái')}</th><th aria-label={t('Chi tiết')} /></tr></thead>
                <tbody>
                  {subs.data.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <b>{t(s.planName)}</b>{s.note && <div className="tiny faint">{s.note}</div>}
                        {s.ptSessionsTotal != null && (
                          <div className="tiny faint">
                            {t('PT: còn {rem}/{tot} buổi', { rem: s.ptSessionsRemaining ?? 0, tot: s.ptSessionsTotal })}
                            {s.ptValidUntil && ` · ${t('hạn {d}', { d: fmtDate(s.ptValidUntil) })}`}
                          </div>
                        )}
                      </td>
                      <td className="small nowrap">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</td>
                      <td className="num nowrap">{fmtMoney(s.pricePaid)}</td>
                      <td><StatusBadge map={subState} value={s.state} /></td>
                      <td className="nowrap">
                        {s.ptSessionsTotal != null && (
                          <Button size="sm" variant="ghost" icon="scroll" onClick={() => setViewUsagesSubId(s.id)}>
                            {t('Lịch sử PT')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <Card
          title={current ? t('Gói đề xuất nâng cấp') : t('Các gói đang mở bán')}
          icon="sparkle"
          actions={<Button size="sm" variant="ghost" onClick={() => setTab('catalog')}>{t('Xem tất cả gói tập')}</Button>}
        >
          <div className="plan-stack">
            {plans.error && <ErrorState message={plans.error} onRetry={plans.reload} />}
            {plans.loading && !plans.data && <LoadingBlock rows={3} />}
            {plans.data && onSale.length === 0 && (
              current ? (
                <div className="stack" style={{ gap: 12 }}>
                  <Alert kind="info">
                    {t('Bạn đang dùng gói cao nhất.')}
                  </Alert>
                  <div>
                    <Button size="sm" variant="secondary" onClick={() => setTab('catalog')}>
                      {t('Xem tất cả gói tập')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Empty icon="ticket" title="Chưa có gói nào đang mở bán" />
              )
            )}
            {onSale.map((p) => {
              const mine = current?.planId === p.id;
              const isLegacyPt = (p.planType === 'GYM_PT' || p.includesTrainer) && !p.ptSessions;
              return (
                <PlanCard key={p.id} plan={p} compact best={p.id === best} saving={save.get(p.id)} className={mine ? 'current' : ''}
                  badge={mine ? <Badge tone="blue">{t('Bạn đang dùng')}</Badge> : undefined}
                  footer={
                    isLegacyPt ? (
                      <Button size="sm" variant="secondary" block disabled title={t('Gói PT đang được cập nhật số buổi')}>
                        {t('Đang cập nhật')}
                      </Button>
                    ) : (
                      <Button size="sm" variant={p.id === best ? 'primary' : 'secondary'} block icon={mine ? 'repeat' : 'plus'} disabled={!!pending}
                        title={pending ? t('Bạn đang có một đơn chờ xác nhận') : undefined} onClick={() => setPicked(p)}>
                        {mine ? t('Gia hạn gói này') : (current ? t('Nâng cấp gói này') : t('Đăng ký gói này'))}
                      </Button>
                    )
                  } />
              );
            })}
            <p className="tiny faint mt-8">
              <Icon name="info" size={13} style={{ display: 'inline', verticalAlign: -2 }} /> {pay.data?.onlineEnabled
                ? t('Trả tại quầy lễ tân hoặc chuyển khoản theo mã QR. Mỗi lần chỉ gửi được một đơn; muốn đổi gói hãy huỷ đơn đang chờ.')
                : t('Thanh toán tại quầy lễ tân. Mỗi lần chỉ gửi được một đơn; muốn đổi gói hãy huỷ đơn đang chờ.')}
            </p>
          </div>
        </Card>
      </div>
      </>
      )}

      {picked && <RegisterPlanModal plan={picked} subs={subs.data} payment={pay.data} currentTrainerId={me.data?.trainerId ?? null}
        onClose={() => setPicked(null)}
        onDone={(created) => { setPicked(null); reloadAll(); if (created.paymentMethod === 'BANK_TRANSFER') setPaying(created); }} />}
      {paying && pay.data && <PayModal req={paying} settings={pay.data} onClose={() => setPaying(null)} onPaid={() => { setPaying(null); reloadAll(); }} />}
      {viewUsagesSubId && <PtUsagesModal subscriptionId={viewUsagesSubId} onClose={() => setViewUsagesSubId(null)} />}
      {cancelling && (
        <Confirm title={t('Huỷ đơn đăng ký?')} danger confirmText={t('Huỷ đơn')}
          message={tn('Đơn đăng ký {plan} sẽ bị huỷ. Bạn có thể gửi đơn mới bất cứ lúc nào.', { plan: <b>{t(cancelling.planName)}</b> })}
          onConfirm={cancelRequest} onClose={() => setCancelling(null)} />
      )}
    </div>
  );
}

export function RegisterPlanModal({ plan, subs, payment, currentTrainerId, onClose, onDone }: {
  plan: MembershipPlan; subs: Subscription[]; payment: PaymentSettings | null; currentTrainerId: number | null;
  onClose: () => void; onDone: (created: PackageRequest) => void;
}) {
  const toast = useToast();
  const today = todayIso();
  const maxDate = toIsoDate(addDays(new Date(), MAX_START_DAYS));
  const lastEnd = lastEndDate(subs);
  const asapStart = lastEnd ? toIsoDate(addDays(parseDate(lastEnd), 1)) : today;
  const pt = !!plan.includesTrainer;
  const isLegacyPt = pt && !plan.ptSessions;
  const online = !!payment?.onlineEnabled && payment.hasQr;
  const trainers = useAsync(() => (pt ? api.get<Trainer[]>('/trainers') : Promise.resolve([] as Trainer[])), [pt]);
  const activeTrainers = (trainers.data ?? []).filter((tr) => tr.active);
  const [mode, setMode] = useState<'asap' | 'date'>('asap');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('COUNTER');
  const [trainerId, setTrainerId] = useState(currentTrainerId ? String(currentTrainerId) : '');
  const [promoCode, setPromoCode] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoResult, setPromoResult] = useState<PromotionValidationResponse | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  // Tự động kiểm tra xem có ưu đãi toàn hệ thống áp dụng cho gói này không
  useEffect(() => {
    let unmounted = false;
    api.post<PromotionValidationResponse>('/promotions/validate', { planId: plan.id })
      .then((res) => {
        if (!unmounted && res.valid) {
          setPromoResult(res);
        }
      })
      .catch(() => {});
    return () => { unmounted = true; };
  }, [plan.id]);

  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    setValidatingPromo(true);
    setPromoError(null);
    try {
      const res = await api.post<PromotionValidationResponse>('/promotions/validate', {
        code: code || null,
        planId: plan.id,
      });
      if (res.valid) {
        setPromoResult(res);
        setPromoError(null);
        if (res.promotionCode) {
          toast.success(t('Đã áp dụng mã ưu đãi: {name}', { name: res.promotionName || res.promotionCode }));
        }
      } else {
        setPromoResult(null);
        setPromoError(res.reason || t('Mã ưu đãi không hợp lệ'));
      }
    } catch (e) {
      setPromoResult(null);
      setPromoError(errMsg(e));
    } finally {
      setValidatingPromo(false);
    }
  };

  const removePromo = async () => {
    setPromoCode('');
    setPromoError(null);
    setValidatingPromo(true);
    try {
      const res = await api.post<PromotionValidationResponse>('/promotions/validate', { planId: plan.id });
      setPromoResult(res.valid ? res : null);
    } catch {
      setPromoResult(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const finalAmount = promoResult?.valid ? promoResult.finalPrice : plan.price;
  const discountAmount = promoResult?.valid ? promoResult.discountAmount : 0;

  const start = mode === 'asap' ? asapStart : date;
  const end = start ? toIsoDate(addDays(parseDate(start), plan.durationDays - 1)) : '';
  const dateRule = mode !== 'date' ? undefined
    : !date ? 'Vui lòng chọn ngày bắt đầu'
    : date < today ? 'Ngày bắt đầu không được ở quá khứ'
    : date > maxDate ? `Chỉ chọn trong vòng ${MAX_START_DAYS} ngày tới`
    : overlaps(subs, date, end) ? 'Trùng với gói bạn đang có. Chọn "Sớm nhất" để gói mới nối tiếp gói hiện tại.'
    : undefined;
  const noteError = note.length > 255 ? 'Ghi chú tối đa 255 ký tự' : undefined;
  const trainerRule = pt && !trainerId ? 'Chọn huấn luyện viên phụ trách bạn' : undefined;
  // Ngày đã chọn mà sai thì báo ngay (người dùng vừa thao tác); ô còn trống chỉ báo sau khi bấm Gửi
  const dateError = date || tried ? dateRule : undefined;
  const trainerError = tried ? trainerRule : undefined;
  const invalid = !!dateRule || !!noteError || !!trainerRule || !agree;

  const submit = async () => {
    setTried(true);
    if (invalid || isLegacyPt) return;
    setBusy(true); setServerError('');
    try {
      const created = await api.post<PackageRequest>('/package-requests', {
        planId: plan.id, desiredStartDate: mode === 'date' ? date : null, note: note.trim() || null,
        paymentMethod: method, trainerId: pt ? Number(trainerId) : null,
        promotionCode: promoResult?.valid && promoResult.promotionCode ? promoResult.promotionCode : (promoCode.trim().toUpperCase() || null),
      });
      toast.success(method === 'BANK_TRANSFER'
        ? t('Đã gửi đơn. Quét mã QR để chuyển khoản, nội dung {code}.', { code: created.paymentCode ?? '' })
        : t('Đã gửi đơn đăng ký. Vui lòng thanh toán tại quầy để kích hoạt gói.'));
      onDone(created);
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={t('Đăng ký {plan}', { plan: t(plan.name) })} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="primary" icon="check" loading={busy} disabled={!agree || isLegacyPt} onClick={submit}>{t('Gửi đơn đăng ký')}</Button>
    </>}>
      <div className="stack">
        <div className="plan-summary">
          <div><span className="tiny muted">{t('Gói')}</span><b>{t(plan.name)}</b></div>
          <div><span className="tiny muted">{t('Loại gói')}</span><b>{pt ? t('Gói Gym + PT') : t('Gói Gym')}</b></div>
          <div><span className="tiny muted">{t('Thời hạn')}</span><b>{durationLabel(plan.durationDays)}</b></div>
          <div>
            <span className="tiny muted">{discountAmount > 0 ? t('Giá gốc') : t('Số tiền')}</span>
            <b className="num" style={{ textDecoration: discountAmount > 0 ? 'line-through' : undefined }}>{fmtMoney(plan.price)}</b>
          </div>
          {discountAmount > 0 && (
            <div>
              <span className="tiny muted">{t('Ưu đãi')}</span>
              <b className="num ok">-{fmtMoney(discountAmount)}</b>
            </div>
          )}
          {discountAmount > 0 && (
            <div>
              <span className="tiny muted">{t('Thanh toán')}</span>
              <b className="num" style={{ color: 'var(--primary)', fontSize: 16 }}>{fmtMoney(finalAmount)}</b>
            </div>
          )}
          {pt && plan.ptSessions != null && (
            <div>
              <span className="tiny muted">{t('Số buổi PT')}</span>
              <b>{t('{n} buổi', { n: plan.ptSessions })}</b>
              {plan.ptValidDays != null && <span className="tiny faint"> · {t('hạn {n} ngày', { n: plan.ptValidDays })}</span>}
            </div>
          )}
        </div>
        {isLegacyPt && (
          <Alert kind="warning">{t('Gói PT này đang chờ quản trị viên cập nhật số buổi và hạn dùng. Bạn chưa thể gửi đơn đăng ký cho gói này.')}</Alert>
        )}

        {/* Quà tặng kèm theo gói */}
        {plan.serviceGrants && plan.serviceGrants.length > 0 && (
          <div className="pc-gifts" style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
            <div className="row" style={{ gap: 6, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
              <Icon name="sparkle" size={14} />
              <span>{t('Quà tặng kèm theo gói:')}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
              {plan.serviceGrants.map((g, idx) => (
                <li key={idx}>
                  {t('Tặng {q} lượt {s} (hạn {d} ngày)', {
                    q: g.quantity,
                    s: g.serviceName || t('Dịch vụ'),
                    d: g.validDays,
                  })}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quà tặng kèm theo chương trình ưu đãi */}
        {promoResult?.valid && promoResult.gifts && promoResult.gifts.length > 0 && (
          <div className="pc-gifts" style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
            <div className="row" style={{ gap: 6, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
              <Icon name="trophy" size={14} />
              <span>{t('Quà tặng từ ưu đãi ({name}):', { name: promoResult.promotionName || promoResult.promotionCode || '' })}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
              {promoResult.gifts.map((g, idx) => (
                <li key={idx}>
                  {t('Tặng {q} lượt {s} (hạn {d} ngày)', {
                    q: g.quantity,
                    s: g.serviceName || t('Dịch vụ'),
                    d: g.validDays,
                  })}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Nhập mã ưu đãi */}
        <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            <Icon name="trophy" size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
            {t('Mã ưu đãi / Giảm giá')}
          </span>
          <div className="row" style={{ gap: 8 }}>
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder={t('Nhập mã giảm giá (nếu có)')}
              style={{ flex: 1 }}
            />
            <Button
              size="sm"
              variant="secondary"
              loading={validatingPromo}
              onClick={applyPromo}
            >
              {t('Áp dụng')}
            </Button>
            {promoResult?.promotionCode && (
              <Button size="sm" variant="ghost" onClick={removePromo}>
                {t('Bỏ mã')}
              </Button>
            )}
          </div>
          {promoError && (
            <div className="tiny" style={{ color: 'var(--danger)', marginTop: 6 }}>
              {promoError}
            </div>
          )}
          {promoResult?.valid && (
            <div className="tiny ok mt-4 row" style={{ gap: 4, alignItems: 'center' }}>
              <Icon name="check" size={12} />
              <span>
                {t('Đang áp dụng: {name}', { name: promoResult.promotionName || promoResult.promotionCode || '' })}
                {promoResult.discountAmount > 0 && ` (giảm ${fmtMoney(promoResult.discountAmount)})`}
              </span>
            </div>
          )}
        </div>

        {benefitsOf(plan).length > 0 && (
          <ul className="plan-benefits">{benefitsOf(plan).map((b) => <li key={b}><Icon name="check" size={13} className="ok" />{t(b)}</li>)}</ul>
        )}

        {pt ? (
          <Field label={t('Huấn luyện viên')} required error={trainerError}
            hint={trainerError ? undefined : t('HLV này phụ trách bạn sau khi quản lý duyệt đơn: soạn giáo án và xếp lịch tập.')}>
            {trainers.loading ? <LoadingBlock rows={2} />
              : activeTrainers.length === 0 ? <div className="pick-empty">{t('Hiện chưa có HLV nhận hội viên mới, vui lòng hỏi lễ tân.')}</div>
              : (
                <div className="pick-grid" role="radiogroup" aria-label={t('Huấn luyện viên')}>
                  {activeTrainers.map((tr) => (
                    <PickCard key={tr.id} on={trainerId === String(tr.id)} onClick={() => setTrainerId(String(tr.id))} avatar={initials(tr.fullName)}
                      title={<>{tr.fullName}{tr.id === currentTrainerId && <span className="tiny faint" style={{ fontWeight: 600 }}> · {t('HLV hiện tại')}</span>}</>}
                      sub={[tr.specialty, tr.experienceYears > 0 ? t('{n} năm kinh nghiệm', { n: tr.experienceYears }) : null].filter(Boolean).join(' · ') || undefined} />
                  ))}
                </div>
              )}
          </Field>
        ) : (
          <div className="pick-note"><span className="pick-ico"><Icon name="user" size={15} /></span>
            <span>{t('Gói tự tập: bạn tự soạn giáo án từ thư viện bài tập và tự xếp lịch ở mục Giáo án / Lịch tập. Cần tư vấn thì hỏi HLV ở Diễn đàn.')}</span>
          </div>
        )}

        <Field label={t('Thanh toán')} required>
          <div className="pick-grid" role="radiogroup" aria-label={t('Thanh toán')}>
            <PickCard on={method === 'COUNTER'} onClick={() => setMethod('COUNTER')} icon="ticket" title={t('Trả tại quầy')} sub={t('Tiền mặt hoặc quẹt thẻ ở lễ tân')} />
            <PickCard on={method === 'BANK_TRANSFER'} onClick={() => setMethod('BANK_TRANSFER')} disabled={!online} icon="card" title={t('Chuyển khoản QR')}
              sub={online ? t('Quét mã QR ngay sau khi gửi đơn') : t('Phòng tập chưa nhận chuyển khoản')} />
          </div>
        </Field>

        <Field label={t('Ngày bắt đầu')} required>
          <Segmented value={mode} onChange={(v) => setMode(v)} options={[
            { value: 'asap', label: t('Sớm nhất') },
            { value: 'date', label: t('Chọn ngày') },
          ]} />
        </Field>
        {mode === 'date' && (
          <Field htmlFor="preq-date" label={t('Ngày muốn bắt đầu')} error={dateError} required hint={t('Trong vòng {n} ngày tới', { n: MAX_START_DAYS })}>
            <Input id="preq-date" type="date" min={today} max={maxDate} value={date} invalid={!!dateError} onChange={(e) => setDate(e.target.value)} />
          </Field>
        )}
        <Field htmlFor="preq-note" label={t('Ghi chú cho lễ tân')} error={noteError} hint={t('Không bắt buộc · {n}/255', { n: note.length })}>
          <Textarea id="preq-note" maxLength={255} value={note} invalid={!!noteError} placeholder={t('VD: tôi sẽ qua quầy chiều thứ Sáu')} onChange={(e) => setNote(e.target.value)} />
        </Field>

        {start && !dateRule && (
          <Alert kind="info">
            {tn('Dự kiến hiệu lực {from} → {to}{chain}. Ngày chính xác được chốt khi quản lý xác nhận.', {
              from: <b>{fmtDate(start)}</b>, to: <b>{fmtDate(end)}</b>,
              chain: mode === 'asap' && lastEnd ? t(' (nối tiếp gói hiện tại)') : '',
            })}
          </Alert>
        )}
        <label className="check-row">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span className="small">{method === 'BANK_TRANSFER'
            ? tn('Tôi hiểu gói chỉ có hiệu lực sau khi chuyển khoản {price} đúng nội dung và được quản lý xác nhận đã nhận tiền.', { price: <b>{fmtMoney(finalAmount)}</b> })
            : tn('Tôi hiểu gói chỉ có hiệu lực sau khi thanh toán {price} tại quầy lễ tân và được quản lý xác nhận.', { price: <b>{fmtMoney(finalAmount)}</b> })}</span>
        </label>
        {serverError && <Alert kind="error">{serverError}</Alert>}
      </div>
    </Modal>
  );
}

/** Mã QR + thông tin chuyển khoản của một đơn; "Tôi đã chuyển khoản" chỉ báo cho quản lý, chưa kích hoạt gói. */
export function PayModal({ req, settings, onClose, onPaid }: { req: PackageRequest; settings: PaymentSettings; onClose: () => void; onPaid: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const markPaid = async () => {
    setBusy(true);
    try {
      await api.put(`/package-requests/${req.id}/paid`);
      toast.success(t('Đã báo quản lý. Gói được kích hoạt sau khi đối chiếu tài khoản.'));
      onPaid();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const canPay = settings.onlineEnabled && !req.memberPaidAt;
  const payAmount = req.finalPrice ?? req.price;

  return (
    <Modal title={t('Chuyển khoản cho đơn {code}', { code: req.paymentCode ?? `#${req.id}` })} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{canPay ? t('Để sau') : t('Đóng')}</Button>
      {canPay && <Button variant="primary" icon="check" loading={busy} onClick={() => void markPaid()}>{t('Tôi đã chuyển khoản')}</Button>}
    </>}>
      <div className="stack">
        <div className="plan-summary">
          <div><span className="tiny muted">{t('Gói')}</span><b>{t(req.planName)}</b><span className="tiny faint">{durationLabel(req.durationDays)}</span></div>
          {req.discountAmount && req.discountAmount > 0 ? (
            <>
              <div><span className="tiny muted">{t('Giá gốc')}</span><b className="num" style={{ textDecoration: 'line-through' }}>{fmtMoney(req.originalPrice ?? req.price)}</b></div>
              <div><span className="tiny muted">{t('Ưu đãi')}</span><b className="num ok">-{fmtMoney(req.discountAmount)}</b></div>
              <div><span className="tiny muted">{t('Thanh toán')}</span><b className="num" style={{ color: 'var(--primary)', fontSize: 16 }}>{fmtMoney(payAmount)}</b></div>
            </>
          ) : (
            <div><span className="tiny muted">{t('Số tiền')}</span><b className="num">{fmtMoney(payAmount)}</b></div>
          )}
          <div><span className="tiny muted">{t('HLV')}</span><b>{req.trainerName ?? t('Tự tập')}</b></div>
        </div>
        {req.memberPaidAt && (
          <div className="pay-status"><Icon name="checkCircle" size={18} />
            <span>{t('Bạn đã báo chuyển khoản lúc {at}. Quản lý đang đối chiếu, gói sẽ được kích hoạt sau khi xác nhận.', { at: fmtDateTime(req.memberPaidAt) })}</span>
          </div>
        )}
        {settings.onlineEnabled
          ? <PaymentInfo settings={settings} amount={payAmount} code={req.paymentCode} />
          : <Alert kind="warning">{t('Phòng tập vừa tạm dừng nhận chuyển khoản. Vui lòng thanh toán tại quầy, đơn của bạn vẫn giữ nguyên.')}</Alert>}
      </div>
    </Modal>
  );
}

export function PtUsagesModal({ subscriptionId, onClose }: { subscriptionId: number; onClose: () => void }) {
  const usages = useAsync(() => api.get<PtSessionUsage[]>(`/subscriptions/${subscriptionId}/pt-usages`), [subscriptionId]);

  return (
    <Modal title={t('Lịch sử sử dụng buổi PT')} onClose={onClose} footer={<Button variant="ghost" onClick={onClose}>{t('Đóng')}</Button>}>
      <div className="stack">
        {usages.error && <ErrorState message={usages.error} onRetry={usages.reload} />}
        {usages.loading && !usages.data && <LoadingBlock rows={3} />}
        {usages.data && usages.data.length === 0 && (
          <Empty icon="scroll" title={t('Chưa có buổi nào được trừ')} desc={t('Số buổi PT sẽ được trừ tự động khi HLV hoàn thành buổi tập.')} />
        )}
        {usages.data && usages.data.length > 0 && (
          <Table caption={t('Lịch sử trừ buổi PT')}>
            <thead>
              <tr>
                <th>{t('Thời gian')}</th>
                <th>{t('Buổi tập')}</th>
                <th>{t('Huấn luyện viên')}</th>
                <th>{t('Người ghi nhận')}</th>
              </tr>
            </thead>
            <tbody>
              {usages.data.map((u) => (
                <tr key={u.id}>
                  <td className="small nowrap">{fmtDateTime(u.usedAt)}</td>
                  <td><b>{u.scheduleTitle || t('Buổi #{id}', { id: u.scheduleId })}</b></td>
                  <td>{u.trainerName || '—'}</td>
                  <td className="small muted">{u.createdByName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </Modal>
  );
}
