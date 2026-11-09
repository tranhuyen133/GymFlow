/**
 * CHỦ FILE: Linh (Hồ Khánh Linh)
 * TASK: SCRUM-172 · Màn 2.5 Gói của tôi (SUB-07)
 * Bổ sung SUB-08 (kiểm thử phân hệ Hội viên): hội viên tự chọn gói và gửi đơn đăng ký, theo dõi trạng thái,
 * huỷ đơn đang chờ. Gói chỉ có hiệu lực sau khi quản lý xác nhận đã nhận tiền.
 * V12: trả tại quầy hoặc chuyển khoản theo mã QR (nội dung = mã đơn); gói có HLV kèm thì chọn HLV khi gửi đơn.
 */
import { useState } from 'react';
import { api } from '../../api/client';
import type { Member, MembershipPlan, PackageRequest, PaymentMethod, PaymentSettings, Subscription, Trainer } from '../../api/types';
import { Icon } from '../../components/Icon';
import { PaymentInfo } from '../../components/PaymentQr';
import { benefitsOf, PlanCard, pickBest, savings } from '../../components/PlanCard';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Confirm, Empty, ErrorState, Field, Input, LoadingBlock, Meter, Modal, PageHead, Segmented, Select, StatusBadge, Table, Textarea } from '../../components/ui';
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
  const subs = useAsync(() => api.get<Subscription[]>('/subscriptions/me'), []);
  const plans = useAsync(() => api.get<MembershipPlan[]>('/plans'), []);
  const reqs = useAsync(() => api.get<PackageRequest[]>('/package-requests/me'), []);
  const pay = useAsync(() => api.get<PaymentSettings>('/payment-settings'), []);
  const me = useAsync(() => api.get<Member>('/members/me'), []);
  const [picked, setPicked] = useState<MembershipPlan | null>(null);
  const [cancelling, setCancelling] = useState<PackageRequest | null>(null);
  const [paying, setPaying] = useState<PackageRequest | null>(null);

  if (subs.error) return <ErrorState message={subs.error} onRetry={subs.reload} />;
  if (subs.loading || !subs.data) return (
    <div className="page">
      <PageHead title="Gói tập của tôi" />
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
  const reloadAll = () => { void subs.reload(); void reqs.reload(); };

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
        title={t('Gói tập của tôi')}
        desc={t('Chọn gói và gửi đăng ký ngay trên ứng dụng. Gói có hiệu lực sau khi bạn thanh toán tại quầy lễ tân và quản lý xác nhận.')}
      />

      <div className="stack" style={{ gap: 12, marginBottom: 18 }}>
        {pending && pending.paymentMethod === 'BANK_TRANSFER' && (
          <Alert kind="info" action={<div className="row" style={{ gap: 6 }}>
            <Button size="sm" variant="primary" icon="card" onClick={() => setPaying(pending)}>{t('Xem mã QR')}</Button>
            <Button size="sm" variant="ghost" onClick={() => setCancelling(pending)}>{t('Huỷ đơn')}</Button>
          </div>}>
            {pending.memberPaidAt
              ? tn('Bạn đã báo chuyển khoản {price} cho đơn {plan} lúc {at}. Quản lý sẽ đối chiếu tài khoản và kích hoạt gói.', {
                price: <b>{fmtMoney(pending.price)}</b>, plan: <b>{pending.planName}</b>, at: fmtDateTime(pending.memberPaidAt),
              })
              : tn('Đơn {plan} đang chờ thanh toán. Chuyển khoản {price} với nội dung {code}, rồi bấm "Tôi đã chuyển khoản".', {
                plan: <b>{pending.planName}</b>, price: <b>{fmtMoney(pending.price)}</b>, code: <b className="num">{pending.paymentCode}</b>,
              })}
          </Alert>
        )}
        {pending && pending.paymentMethod !== 'BANK_TRANSFER' && (
          <Alert kind="info" action={<Button size="sm" variant="ghost" onClick={() => setCancelling(pending)}>{t('Huỷ đơn')}</Button>}>
            {tn('Đơn đăng ký {plan} ({price}) đang chờ xác nhận. Vui lòng thanh toán tại quầy lễ tân để được kích hoạt gói.', {
              plan: <b>{pending.planName}</b>, price: fmtMoney(pending.price),
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
                    <h2 style={{ margin: 0 }}>{current.planName}</h2>
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
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <Card title={t('Gói sắp bắt đầu')} icon="clock" flush>
              <div className="stack-sm">
                {upcoming.map((s) => (
                  <div key={s.id} className="row between row-wrap" style={{ padding: '10px 16px', gap: 8 }}>
                    <div>
                      <b className="small">{s.planName}</b>
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
                          <b>{r.planName}</b>
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
                <thead><tr><th>{t('Gói')}</th><th>{t('Thời gian')}</th><th>{t('Số tiền')}</th><th>{t('Trạng thái')}</th></tr></thead>
                <tbody>
                  {subs.data.map((s) => (
                    <tr key={s.id}>
                      <td><b>{s.planName}</b>{s.note && <div className="tiny faint">{s.note}</div>}</td>
                      <td className="small nowrap">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</td>
                      <td className="num nowrap">{fmtMoney(s.pricePaid)}</td>
                      <td><StatusBadge map={subState} value={s.state} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <Card title={t('Các gói đang mở bán')} icon="sparkle">
          <div className="plan-stack">
            {plans.error && <ErrorState message={plans.error} onRetry={plans.reload} />}
            {plans.loading && !plans.data && <LoadingBlock rows={3} />}
            {plans.data && onSale.length === 0 && <Empty icon="ticket" title="Chưa có gói nào đang mở bán" />}
            {onSale.map((p) => {
              const mine = current?.planId === p.id;
              return (
                <PlanCard key={p.id} plan={p} compact best={p.id === best} saving={save.get(p.id)} className={mine ? 'current' : ''}
                  badge={mine ? <Badge tone="blue">{t('Bạn đang dùng')}</Badge> : undefined}
                  footer={
                    <Button size="sm" variant={p.id === best ? 'primary' : 'secondary'} block icon={mine ? 'repeat' : 'plus'} disabled={!!pending}
                      title={pending ? t('Bạn đang có một đơn chờ xác nhận') : undefined} onClick={() => setPicked(p)}>
                      {mine ? t('Gia hạn gói này') : t('Đăng ký gói này')}
                    </Button>
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

      {picked && <RegisterPlanModal plan={picked} subs={subs.data} payment={pay.data} currentTrainerId={me.data?.trainerId ?? null}
        onClose={() => setPicked(null)}
        onDone={(created) => { setPicked(null); reloadAll(); if (created.paymentMethod === 'BANK_TRANSFER') setPaying(created); }} />}
      {paying && pay.data && <PayModal req={paying} settings={pay.data} onClose={() => setPaying(null)} onPaid={() => { setPaying(null); reloadAll(); }} />}
      {cancelling && (
        <Confirm title={t('Huỷ đơn đăng ký?')} danger confirmText={t('Huỷ đơn')}
          message={tn('Đơn đăng ký {plan} sẽ bị huỷ. Bạn có thể gửi đơn mới bất cứ lúc nào.', { plan: <b>{cancelling.planName}</b> })}
          onConfirm={cancelRequest} onClose={() => setCancelling(null)} />
      )}
    </div>
  );
}

function RegisterPlanModal({ plan, subs, payment, currentTrainerId, onClose, onDone }: {
  plan: MembershipPlan; subs: Subscription[]; payment: PaymentSettings | null; currentTrainerId: number | null;
  onClose: () => void; onDone: (created: PackageRequest) => void;
}) {
  const toast = useToast();
  const today = todayIso();
  const maxDate = toIsoDate(addDays(new Date(), MAX_START_DAYS));
  const lastEnd = lastEndDate(subs);
  const asapStart = lastEnd ? toIsoDate(addDays(parseDate(lastEnd), 1)) : today;
  const pt = !!plan.includesTrainer;
  const online = !!payment?.onlineEnabled && payment.hasQr;
  const trainers = useAsync(() => (pt ? api.get<Trainer[]>('/trainers') : Promise.resolve([] as Trainer[])), [pt]);
  const activeTrainers = (trainers.data ?? []).filter((tr) => tr.active);
  const [mode, setMode] = useState<'asap' | 'date'>('asap');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('COUNTER');
  const [trainerId, setTrainerId] = useState(currentTrainerId ? String(currentTrainerId) : '');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  const start = mode === 'asap' ? asapStart : date;
  const end = start ? toIsoDate(addDays(parseDate(start), plan.durationDays - 1)) : '';
  const dateError = mode !== 'date' ? undefined
    : !date ? 'Vui lòng chọn ngày bắt đầu'
    : date < today ? 'Ngày bắt đầu không được ở quá khứ'
    : date > maxDate ? `Chỉ chọn trong vòng ${MAX_START_DAYS} ngày tới`
    : overlaps(subs, date, end) ? 'Trùng với gói bạn đang có. Chọn "Sớm nhất" để gói mới nối tiếp gói hiện tại.'
    : undefined;
  const noteError = note.length > 255 ? 'Ghi chú tối đa 255 ký tự' : undefined;
  const trainerError = pt && !trainerId ? 'Chọn huấn luyện viên' : undefined;
  const invalid = !!dateError || !!noteError || !!trainerError || !agree;

  const submit = async () => {
    if (invalid) return;
    setBusy(true); setServerError('');
    try {
      const created = await api.post<PackageRequest>('/package-requests', {
        planId: plan.id, desiredStartDate: mode === 'date' ? date : null, note: note.trim() || null,
        paymentMethod: method, trainerId: pt ? Number(trainerId) : null,
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
      <Button variant="primary" icon="check" loading={busy} disabled={invalid} onClick={submit}>{t('Gửi đơn đăng ký')}</Button>
    </>}>
      <div className="stack">
        <div className="plan-summary">
          <div><span className="tiny muted">{t('Gói')}</span><b>{t(plan.name)}</b></div>
          <div><span className="tiny muted">{t('Thời hạn')}</span><b>{durationLabel(plan.durationDays)}</b></div>
          <div><span className="tiny muted">{t('Số tiền')}</span><b className="num">{fmtMoney(plan.price)}</b></div>
        </div>
        {benefitsOf(plan).length > 0 && (
          <ul className="plan-benefits">{benefitsOf(plan).map((b) => <li key={b}><Icon name="check" size={13} className="ok" />{t(b)}</li>)}</ul>
        )}

        {pt ? (
          <Field htmlFor="preq-trainer" label={t('Huấn luyện viên')} required error={trainerError}
            hint={t('HLV này phụ trách bạn sau khi quản lý duyệt đơn: soạn giáo án và xếp lịch tập.')}>
            <Select id="preq-trainer" value={trainerId} invalid={!!trainerError} onChange={(e) => setTrainerId(e.target.value)}>
              <option value="">{trainers.loading ? t('Đang tải…') : t('Chọn HLV')}</option>
              {activeTrainers.map((tr) => (
                <option key={tr.id} value={tr.id}>{tr.fullName}{tr.specialty ? ` · ${tr.specialty}` : ''}{tr.id === currentTrainerId ? ` (${t('HLV hiện tại')})` : ''}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <Alert kind="info">{t('Gói tự tập: bạn tự soạn giáo án từ thư viện bài tập và tự xếp lịch ở mục Giáo án / Lịch tập. Cần tư vấn thì hỏi HLV ở Diễn đàn.')}</Alert>
        )}

        <Field label={t('Thanh toán')} required hint={online ? undefined : t('Phòng tập hiện chỉ nhận thanh toán tại quầy.')}>
          <Segmented<PaymentMethod> value={method} onChange={(v) => setMethod(v === 'BANK_TRANSFER' && !online ? 'COUNTER' : v)} options={[
            { value: 'COUNTER', label: t('Trả tại quầy') },
            ...(online ? [{ value: 'BANK_TRANSFER' as PaymentMethod, label: t('Chuyển khoản QR') }] : []),
          ]} />
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

        {start && !dateError && (
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
            ? tn('Tôi hiểu gói chỉ có hiệu lực sau khi chuyển khoản {price} đúng nội dung và được quản lý xác nhận đã nhận tiền.', { price: <b>{fmtMoney(plan.price)}</b> })
            : tn('Tôi hiểu gói chỉ có hiệu lực sau khi thanh toán {price} tại quầy lễ tân và được quản lý xác nhận.', { price: <b>{fmtMoney(plan.price)}</b> })}</span>
        </label>
        {serverError && <Alert kind="error">{serverError}</Alert>}
      </div>
    </Modal>
  );
}

/** Mã QR + thông tin chuyển khoản của một đơn; "Tôi đã chuyển khoản" chỉ báo cho quản lý, chưa kích hoạt gói. */
function PayModal({ req, settings, onClose, onPaid }: { req: PackageRequest; settings: PaymentSettings; onClose: () => void; onPaid: () => void }) {
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
  return (
    <Modal title={t('Chuyển khoản cho đơn {code}', { code: req.paymentCode ?? `#${req.id}` })} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Để sau')}</Button>
      {req.memberPaidAt
        ? <Badge tone="green">{t('Đã báo lúc {at}', { at: fmtDateTime(req.memberPaidAt) })}</Badge>
        : <Button variant="primary" icon="check" loading={busy} onClick={() => void markPaid()}>{t('Tôi đã chuyển khoản')}</Button>}
    </>}>
      <div className="stack">
        <div className="plan-summary">
          <div><span className="tiny muted">{t('Gói')}</span><b>{req.planName}</b><span className="tiny faint">{durationLabel(req.durationDays)}</span></div>
          <div><span className="tiny muted">{t('Số tiền')}</span><b className="num">{fmtMoney(req.price)}</b></div>
          {req.trainerName && <div><span className="tiny muted">{t('HLV')}</span><b>{req.trainerName}</b></div>}
        </div>
        {settings.onlineEnabled
          ? <PaymentInfo settings={settings} amount={req.price} code={req.paymentCode} />
          : <Alert kind="warning">{t('Phòng tập vừa tạm dừng nhận chuyển khoản. Vui lòng thanh toán tại quầy, đơn của bạn vẫn giữ nguyên.')}</Alert>}
      </div>
    </Modal>
  );
}
