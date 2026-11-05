/**
 * CHỦ FILE: Linh (Hồ Khánh Linh)
 * TASK: SCRUM-172 · Màn 2.5 Gói của tôi (SUB-07)
 * Bổ sung SUB-08 (kiểm thử phân hệ Hội viên): hội viên tự chọn gói và gửi đơn đăng ký, theo dõi trạng thái,
 * huỷ đơn đang chờ. Gói chỉ có hiệu lực sau khi thanh toán tại quầy và quản lý xác nhận (chưa có thanh toán trực tuyến).
 */
import { useState } from 'react';
import { api } from '../../api/client';
import type { MembershipPlan, PackageRequest, Subscription } from '../../api/types';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Alert, Button, Card, Confirm, Empty, ErrorState, Field, Input, LoadingBlock, Meter, Modal, PageHead, Segmented, StatusBadge, Table, Textarea } from '../../components/ui';
import { t, tn } from '../../i18n';
import { addDays, durationLabel, fmtDate, fmtDateTime, fmtMoney, packageRequestStatus, parseDate, subState, toIsoDate, todayIso } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';

/** Khớp PackageRequestService.MAX_DESIRED_START_DAYS. */
const MAX_START_DAYS = 60;

const benefitsOf = (p: MembershipPlan) => (p.benefits ?? '').split(/[,\n]/).map((b) => b.trim()).filter(Boolean);

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
  const [picked, setPicked] = useState<MembershipPlan | null>(null);
  const [cancelling, setCancelling] = useState<PackageRequest | null>(null);

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
  const onSale = plans.data?.filter((p) => p.active) ?? [];
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
        {pending && (
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
            <div className="hero">
              <div style={{ position: 'relative' }}>
                <div className="row between">
                  <span className="chip on"><Icon name="ticket" size={14} /> {t('Gói hiện tại')}</span>
                  <StatusBadge map={subState} value={current.state} />
                </div>
                <h2 className="mt-16">{current.planName}</h2>
                <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <span className="num" style={{ fontSize: 44 }}>{current.daysLeft}</span>
                  <span className="muted">{t('ngày còn lại')}</span>
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
          <div className="stack-sm">
            {plans.error && <ErrorState message={plans.error} onRetry={plans.reload} />}
            {plans.loading && !plans.data && <LoadingBlock rows={3} />}
            {plans.data && onSale.length === 0 && <Empty icon="ticket" title="Chưa có gói nào đang mở bán" />}
            {onSale.map((p) => (
              <div key={p.id} className="plan-pick">
                <div className="row between" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <b>{t(p.name)}</b>
                    <div className="tiny faint">{durationLabel(p.durationDays)}</div>
                  </div>
                  <span className="num nowrap">{fmtMoney(p.price)}</span>
                </div>
                {p.description && <p className="tiny muted" style={{ margin: '6px 0 0' }}>{t(p.description)}</p>}
                {benefitsOf(p).length > 0 && (
                  <ul className="plan-benefits">
                    {benefitsOf(p).map((b) => <li key={b}><Icon name="check" size={13} className="ok" />{t(b)}</li>)}
                  </ul>
                )}
                <Button size="sm" variant="primary" block icon="plus" disabled={!!pending}
                  title={pending ? t('Bạn đang có một đơn chờ xác nhận') : undefined} onClick={() => setPicked(p)}>
                  {t('Đăng ký gói này')}
                </Button>
              </div>
            ))}
            <p className="tiny faint mt-8">
              <Icon name="info" size={13} style={{ display: 'inline', verticalAlign: -2 }} /> {t('Thanh toán tại quầy lễ tân. Mỗi lần chỉ gửi được một đơn; muốn đổi gói hãy huỷ đơn đang chờ.')}
            </p>
          </div>
        </Card>
      </div>

      {picked && <RegisterPlanModal plan={picked} subs={subs.data} onClose={() => setPicked(null)} onDone={() => { setPicked(null); reloadAll(); }} />}
      {cancelling && (
        <Confirm title={t('Huỷ đơn đăng ký?')} danger confirmText={t('Huỷ đơn')}
          message={tn('Đơn đăng ký {plan} sẽ bị huỷ. Bạn có thể gửi đơn mới bất cứ lúc nào.', { plan: <b>{cancelling.planName}</b> })}
          onConfirm={cancelRequest} onClose={() => setCancelling(null)} />
      )}
    </div>
  );
}

function RegisterPlanModal({ plan, subs, onClose, onDone }: { plan: MembershipPlan; subs: Subscription[]; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const today = todayIso();
  const maxDate = toIsoDate(addDays(new Date(), MAX_START_DAYS));
  const lastEnd = lastEndDate(subs);
  const asapStart = lastEnd ? toIsoDate(addDays(parseDate(lastEnd), 1)) : today;
  const [mode, setMode] = useState<'asap' | 'date'>('asap');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
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
  const invalid = !!dateError || !!noteError || !agree;

  const submit = async () => {
    if (invalid) return;
    setBusy(true); setServerError('');
    try {
      await api.post('/package-requests', { planId: plan.id, desiredStartDate: mode === 'date' ? date : null, note: note.trim() || null });
      toast.success(t('Đã gửi đơn đăng ký. Vui lòng thanh toán tại quầy để kích hoạt gói.'));
      onDone();
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
          <span className="small">{tn('Tôi hiểu gói chỉ có hiệu lực sau khi thanh toán {price} tại quầy lễ tân và được quản lý xác nhận.', { price: <b>{fmtMoney(plan.price)}</b> })}</span>
        </label>
        {serverError && <Alert kind="error">{serverError}</Alert>}
      </div>
    </Modal>
  );
}
