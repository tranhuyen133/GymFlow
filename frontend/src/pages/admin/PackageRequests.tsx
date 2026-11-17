/**
 * Duyệt đơn hội viên tự đăng ký gói (SUB-08). Thêm khi kiểm thử phân hệ Hội viên.
 * Quy trình: hội viên gửi đơn trong ứng dụng → lễ tân thu đúng số tiền trong đơn → quản lý bấm Duyệt để tạo gói.
 * V12: đơn trả tại quầy hoặc chuyển khoản (nội dung = mã đơn GFxxxxxx, đối chiếu sao kê rồi duyệt); gói có HLV kèm thì duyệt là giao HLV.
 * Backend kiểm tra lại toàn bộ (đơn còn chờ, gói còn bán, chống trùng thời gian); đơn đã xử lý không duyệt lại được.
 */
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { ChangeDecision, ChangeRequest, PackageRequest, PackageRequestStatus, Trainer } from '../../api/types';
import { changeTypeLabel } from '../../components/SubscriptionChangeModal';
import { initials, PickCard } from '../../components/PaymentQr';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Empty, ErrorState, Field, Input, LoadingBlock, Modal, PageHead, Pager, Person, SearchInput, Segmented, Stat, StatusBadge, Table, Textarea } from '../../components/ui';
import { addDays, durationLabel, fmtDate, fmtDateTime, fmtMoney, packageRequestStatus, parseDate, toIsoDate } from '../../lib/format';
import { displayPersonName } from '../../lib/names';
import { localizeText } from '../../lib/planText';
import { errMsg, useAsync, usePaged } from '../../lib/hooks';
import { t, tn } from '../../i18n';

type Filter = 'ALL' | PackageRequestStatus;

export default function PackageRequests() {
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [q, setQ] = useState('');
  const [approving, setApproving] = useState<PackageRequest | null>(null);
  const [rejecting, setRejecting] = useState<PackageRequest | null>(null);
  const { data, error, loading, reload } = useAsync(() => api.get<PackageRequest[]>('/package-requests'), []);
  // V49 · tab thứ hai: yêu cầu điều chỉnh gói (dời ngày, bảo lưu, đổi HLV) của hội viên
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'changes' ? 'changes' : 'orders';
  const changes = useAsync(() => api.get<ChangeRequest[]>('/subscription-changes'), []);
  const pendingChanges = (changes.data ?? []).filter((c) => c.status === 'PENDING').length;

  const count = (s: PackageRequestStatus) => (data ?? []).filter((r) => r.status === s).length;
  const list = useMemo(() => (data ?? [])
    .filter((r) => (filter === 'ALL' || r.status === filter)
      && (!q || `${r.memberName} ${r.memberCode} ${r.memberPhone ?? ''} ${r.planName} ${r.paymentCode ?? ''} ${r.trainerName ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())))
    // Đơn chờ: cũ nhất lên trước để xử lý theo thứ tự; còn lại: mới nhất lên trước.
    .sort((a, b) => (filter === 'PENDING' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt))), [data, filter, q]);
  const paged = usePaged(list, 'package-requests', `${filter}|${q}`);
  const pendingAmount = (data ?? []).filter((r) => r.status === 'PENDING').reduce((a, r) => a + r.price, 0);
  const done = () => { setApproving(null); setRejecting(null); void reload(); };

  return (
    <div className="page">
      <PageHead eyebrow={t('Kinh doanh')} title={t('Duyệt đăng ký gói')}
        desc={t('Hội viên tự chọn gói trong ứng dụng, trả tại quầy hoặc chuyển khoản theo mã QR. Thu tiền tại quầy hoặc đối chiếu sao kê theo mã đơn (GF…) rồi bấm Duyệt để kích hoạt gói. Gói có HLV kèm: duyệt là giao HLV cho hội viên.')}
        actions={<Link to="/payment-settings" className="btn btn-secondary"><span>{t('Cài đặt thanh toán')}</span></Link>} />

      <div className="mb-20">
        <Segmented value={tab} onChange={(v) => setParams(v === 'orders' ? {} : { tab: v })} options={[
          { value: 'orders', label: t('Đơn đăng ký / nâng cấp {n}', { n: count('PENDING') }) },
          { value: 'changes', label: t('Yêu cầu điều chỉnh {n}', { n: pendingChanges }) },
        ]} />
      </div>

      {tab === 'changes' && <ChangeRequestsPanel data={changes.data} error={changes.error} loading={changes.loading} reload={changes.reload} />}

      {tab === 'orders' && <>
      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <Stat icon="clock" label={t('Chờ xác nhận')} value={count('PENDING')} accent="#ffb020" />
        <Stat icon="wallet" label={t('Cần thu (đơn chờ)')} value={fmtMoney(pendingAmount)} accent="#8b7cff" />
        <Stat icon="checkCircle" label={t('Đã duyệt')} value={count('APPROVED')} />
        <Stat icon="ban" label={t('Từ chối / huỷ')} value={count('REJECTED') + count('CANCELLED')} accent="#ff6b61" />
      </div>

      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder={t('Tìm hội viên, SĐT, gói, mã đơn GF…')} />
        <div className="spacer" />
        <Segmented<Filter> value={filter} onChange={setFilter} options={[
          { value: 'PENDING', label: t('Chờ xác nhận {n}', { n: count('PENDING') }) },
          { value: 'APPROVED', label: t('Đã duyệt') }, { value: 'REJECTED', label: t('Từ chối') },
          { value: 'CANCELLED', label: t('Hội viên huỷ') }, { value: 'ALL', label: t('Tất cả') },
        ]} />
      </div>

      <Card flush>
        {error ? <div style={{ padding: 20 }}><ErrorState message={error} onRetry={reload} /></div>
          : loading && !data ? <div style={{ padding: 20 }}><LoadingBlock /></div>
          : list.length === 0 ? <Empty icon="clipboard" title={filter === 'PENDING' ? t('Không có đơn nào chờ xác nhận') : t('Không có đơn phù hợp')} /> : (
            <Table caption={t('Đơn đăng ký gói')}>
              <thead><tr>
                <th>{t('Hội viên')}</th><th>{t('Gói')}</th><th>{t('Số tiền')}</th><th>{t('Bắt đầu')}</th>
                <th>{t('Gửi lúc')}</th><th>{t('Trạng thái')}</th><th aria-label={t('Thao tác')} />
              </tr></thead>
              <tbody>
                {paged.items.map((r) => (
                  <tr key={r.id}>
                    <td><Link to={`/members/${r.memberId}`}><Person name={r.memberName} sub={[r.memberCode, r.memberPhone].filter(Boolean).join(' · ')} size="sm" /></Link></td>
                    <td>
                      <b>{localizeText(r.planNameEn, r.planName)}</b>
                      {r.requestType === 'UPGRADE' && <> <Badge tone="violet">{t('Nâng cấp PT')}</Badge></>}
                      <div className="tiny faint">{durationLabel(r.durationDays)}</div>
                      {r.requestType === 'UPGRADE' && (
                        <div className="tiny">{t('Từ {plan}', { plan: t(r.upgradeFromPlanName ?? '—') })}</div>
                      )}
                      {r.status === 'PENDING' && !r.planStillOnSale && <Badge tone="red">{t('Gói đã ngừng bán')}</Badge>}
                      {r.trainerName ? <div className="tiny">{t('HLV {name}', { name: displayPersonName(r.trainerName) })}</div>
                        : r.includesTrainer && r.status === 'PENDING' && <Badge tone="amber">{t('Chưa chọn HLV')}</Badge>}
                      {r.note && <div className="tiny faint">{t('Ghi chú: {note}', { note: r.note })}</div>}
                    </td>
                    <td className="nowrap">
                      <div className="num">{fmtMoney(r.price)}</div>
                      {(r.upgradeCredit ?? 0) > 0 && <div className="tiny faint">{t('đã trừ {m} gói cũ', { m: fmtMoney(r.upgradeCredit) })}</div>}
                      {(r.discountAmount ?? 0) > 0 && <div className="tiny faint">{t('ưu đãi −{m}', { m: fmtMoney(r.discountAmount) })}{r.promotionCode ? ` · ${r.promotionCode}` : ''}</div>}
                      {r.paymentMethod === 'BANK_TRANSFER'
                        ? <Badge tone="blue">{t('Chuyển khoản')}</Badge>
                        : <Badge tone="muted">{t('Tại quầy')}</Badge>}
                      {r.paymentCode && <div className="tiny faint num">{r.paymentCode}</div>}
                      {r.paymentMethod === 'BANK_TRANSFER' && r.status === 'PENDING' && (r.memberPaidAt
                        ? <div className="tiny" style={{ color: 'var(--green, #2bd47d)' }}>{t('HV báo đã CK {at}', { at: fmtDateTime(r.memberPaidAt) })}</div>
                        : <div className="tiny faint">{t('HV chưa báo chuyển')}</div>)}
                    </td>
                    <td className="small nowrap">{r.desiredStartDate ? fmtDate(r.desiredStartDate) : t('Sớm nhất')}</td>
                    <td className="tiny muted nowrap">{fmtDateTime(r.createdAt)}</td>
                    <td>
                      <StatusBadge map={packageRequestStatus} value={r.status} />
                      {r.decidedAt && r.status !== 'CANCELLED' && <div className="tiny faint mt-4">{r.decidedByName ? displayPersonName(r.decidedByName) : ''} · {fmtDateTime(r.decidedAt)}</div>}
                      {r.decisionNote && <div className="tiny muted">{r.decisionNote}</div>}
                    </td>
                    <td className="actions nowrap">
                      {r.status === 'PENDING' && <>
                        <Button size="sm" variant="primary" icon="check" disabled={!r.planStillOnSale}
                          title={r.planStillOnSale ? undefined : t('Gói đã ngừng bán, hãy từ chối đơn')} onClick={() => setApproving(r)}>{t('Duyệt')}</Button>
                        <Button size="sm" variant="ghost" icon="x" onClick={() => setRejecting(r)}>{t('Từ chối')}</Button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        {list.length > 0 && <Pager page={paged.page} totalPages={paged.totalPages} total={paged.total} onPage={paged.setPage} size={paged.size} sizes={[10, 20, 50, 100]} onSize={paged.setSize} />}
      </Card>

      </>}

      {approving && <ApproveModal req={approving} onClose={() => setApproving(null)} onDone={done} />}
      {rejecting && <RejectModal req={rejecting} onClose={() => setRejecting(null)} onDone={done} />}
    </div>
  );
}

function ApproveModal({ req, onClose, onDone }: { req: PackageRequest; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const transfer = req.paymentMethod === 'BANK_TRANSFER';
  // Gói có HLV kèm (hoặc đơn cũ đã chọn HLV): duyệt là giao HLV. Quản lý được đổi HLV nếu người hội viên chọn đã kín lịch.
  const pt = !!req.includesTrainer || req.trainerId != null;
  const trainers = useAsync(() => (pt ? api.get<Trainer[]>('/trainers') : Promise.resolve([] as Trainer[])), [pt]);
  const activeTrainers = (trainers.data ?? []).filter((tr) => tr.active);
  const [trainerId, setTrainerId] = useState(req.trainerId != null ? String(req.trainerId) : '');
  const [paid, setPaid] = useState(false);
  const [tried, setTried] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const noteError = note.length > 255 ? t('Ghi chú tối đa 255 ký tự') : undefined;
  const trainerError = tried && pt && !trainerId ? t('Chọn huấn luyện viên') : undefined;
  const chosenInactive = pt && trainers.data && trainerId && !activeTrainers.some((tr) => String(tr.id) === trainerId);

  const submit = async () => {
    setTried(true);
    if (!paid || noteError || (pt && !trainerId) || chosenInactive) return;
    setBusy(true); setServerError('');
    try {
      await api.put(`/package-requests/${req.id}/approve`, { note: note.trim() || null, trainerId: pt ? Number(trainerId) : null });
      toast.success(t('Đã duyệt và kích hoạt gói cho {name}', { name: displayPersonName(req.memberName) }));
      onDone();
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={t('Duyệt đơn đăng ký gói')} size="narrow" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="primary" icon="check" loading={busy} disabled={!paid} onClick={submit}>{t('Duyệt và kích hoạt')}</Button>
    </>}>
      <div className="stack">
        <div className="plan-summary">
          <div><span className="tiny muted">{t('Hội viên')}</span><b>{displayPersonName(req.memberName)}</b><span className="tiny faint">{req.memberCode}</span></div>
          <div><span className="tiny muted">{t('Gói')}</span><b>{t(req.planName)}</b><span className="tiny faint">{durationLabel(req.durationDays)}</span></div>
          <div><span className="tiny muted">{transfer ? t('Số tiền phải nhận') : t('Số tiền cần thu')}</span><b className="num">{fmtMoney(req.price)}</b>
            <span className="tiny faint">{transfer ? t('Chuyển khoản · {code}', { code: req.paymentCode ?? '' }) : t('Tại quầy')}</span></div>
        </div>
        {transfer && (
          <Alert kind={req.memberPaidAt ? 'info' : 'warning'}>
            {req.memberPaidAt
              ? t('Hội viên báo đã chuyển lúc {at}. Mở sao kê, tìm khoản {price} có nội dung {code} rồi mới duyệt.', { at: fmtDateTime(req.memberPaidAt), price: fmtMoney(req.price), code: req.paymentCode ?? '' })
              : t('Hội viên chưa báo đã chuyển. Chỉ duyệt khi sao kê có khoản {price} với nội dung {code}.', { price: fmtMoney(req.price), code: req.paymentCode ?? '' })}
          </Alert>
        )}
        {req.requestType === 'UPGRADE' && (
          <div className="pay-rows">
            <div className="pay-row"><span className="k">{t('Giá gói PT')}</span><span className="v"><b className="num">{fmtMoney(req.originalPrice ?? req.price)}</b></span></div>
            <div className="pay-row"><span className="k">{t('Trừ phần chưa dùng của {plan}', { plan: t(req.upgradeFromPlanName ?? '') })}</span><span className="v"><b className="num ok">−{fmtMoney(req.upgradeCredit ?? 0)}</b></span></div>
            {(req.discountAmount ?? 0) > 0 && <div className="pay-row"><span className="k">{t('Ưu đãi {code}', { code: req.promotionCode ?? req.promotionName ?? '' })}</span><span className="v"><b className="num ok">−{fmtMoney(req.discountAmount)}</b></span></div>}
            <div className="pay-row hl"><span className="k">{t('Cần thu')}</span><span className="v"><b className="num">{fmtMoney(req.price)}</b></span></div>
          </div>
        )}
        <p className="small muted" style={{ margin: 0 }}>
          {req.requestType === 'UPGRADE'
            ? t('Duyệt xong: gói tự tập kết thúc ngày {end}, gói PT chạy từ {d}; HLV nhận ngay hội viên, giáo án đang dùng và các buổi đã xếp còn trống lịch.', {
              d: fmtDate(req.desiredStartDate), end: req.desiredStartDate ? fmtDate(dayBefore(req.desiredStartDate)) : '—' })
            : req.desiredStartDate
            ? t('Bắt đầu {d} nếu ngày đó còn trống; nếu đã qua hoặc trùng gói khác, gói mới nối tiếp gói hiện tại.', { d: fmtDate(req.desiredStartDate) })
            : t('Gói bắt đầu hôm nay, hoặc nối tiếp ngay sau gói hiện tại của hội viên.')}
        </p>
        {pt && (
          <Field label={t('Huấn luyện viên phụ trách')} required error={trainerError ?? (chosenInactive ? t('HLV này đã nghỉ, chọn HLV khác') : undefined)}
            hint={req.trainerName ? t('Hội viên chọn {name}. Duyệt xong HLV này phụ trách giáo án và lịch tập.', { name: displayPersonName(req.trainerName) }) : t('Duyệt xong HLV này phụ trách giáo án và lịch tập.')}>
            {trainers.loading ? <LoadingBlock rows={2} /> : (
              <div className="pick-grid" role="radiogroup" aria-label={t('Huấn luyện viên phụ trách')}>
                {activeTrainers.map((tr) => (
                  <PickCard key={tr.id} on={trainerId === String(tr.id)} onClick={() => setTrainerId(String(tr.id))} avatar={initials(tr.fullName)}
                    title={displayPersonName(tr.fullName)}
                    sub={[tr.id === req.trainerId ? t('hội viên chọn') : null, t('{n} hội viên', { n: tr.memberCount })].filter(Boolean).join(' · ')} />
                ))}
              </div>
            )}
          </Field>
        )}
        <Field htmlFor="approve-note" label={t('Ghi chú')} error={noteError} hint={transfer ? t('Không bắt buộc · VD: mã giao dịch ngân hàng') : t('Không bắt buộc · VD: đã thu tiền mặt, số phiếu thu')}>
          <Input id="approve-note" maxLength={255} value={note} invalid={!!noteError} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <label className="check-row">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
          <span className="small">{transfer
            ? tn('Tôi xác nhận tài khoản đã nhận đủ {price} với nội dung {code}.', { price: <b>{fmtMoney(req.price)}</b>, code: <b>{req.paymentCode}</b> })
            : tn('Tôi xác nhận đã thu đủ {price} của hội viên.', { price: <b>{fmtMoney(req.price)}</b> })}</span>
        </label>
        {serverError && <Alert kind="error">{serverError}</Alert>}
      </div>
    </Modal>
  );
}

function RejectModal({ req, onClose, onDone }: { req: PackageRequest; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const len = reason.trim().length;
  const error = len === 0 ? t('Vui lòng nhập lý do từ chối') : len < 5 || reason.length > 255 ? t('Lý do từ 5 đến 255 ký tự') : undefined;

  const submit = async () => {
    setTouched(true);
    if (error) return;
    setBusy(true); setServerError('');
    try {
      await api.put(`/package-requests/${req.id}/reject`, { reason: reason.trim() });
      toast.success(t('Đã từ chối đơn của {name}', { name: displayPersonName(req.memberName) }));
      onDone();
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={t('Từ chối đơn đăng ký gói')} size="narrow" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="danger" icon="x" loading={busy} disabled={touched && !!error} onClick={submit}>{t('Từ chối đơn')}</Button>
    </>}>
      <div className="stack">
        <p className="small" style={{ margin: 0 }}>{tn('Đơn {plan} của {name}. Hội viên sẽ thấy lý do trong mục Gói tập của tôi.', { plan: <b>{t(req.planName)}</b>, name: <b>{displayPersonName(req.memberName)}</b> })}</p>
        <Field htmlFor="reject-reason" label={t('Lý do')} required error={touched ? error : undefined} hint={t('{n}/255', { n: reason.length })}>
          <Textarea id="reject-reason" maxLength={255} value={reason} invalid={touched && !!error} placeholder={t('VD: chưa thanh toán sau 3 ngày, vui lòng gửi lại đơn khi đến quầy')}
            onChange={(e) => { setReason(e.target.value); setTouched(true); }} onBlur={() => setTouched(true)} />
        </Field>
        {serverError && <Alert kind="error">{serverError}</Alert>}
      </div>
    </Modal>
  );
}

const dayBefore = (d: string) => toIsoDate(addDays(parseDate(d), -1));

type ChangeFilter = 'ALL' | PackageRequestStatus;

/** V49 · Yêu cầu điều chỉnh gói của hội viên. Duyệt là áp ngay (backend kiểm tra lại trùng gói, buổi PT đã trừ, quota bảo lưu). */
function ChangeRequestsPanel({ data, error, loading, reload }: { data: ChangeRequest[] | null | undefined; error: string | null | undefined; loading: boolean; reload: () => void }) {
  const toast = useToast();
  const [filter, setFilter] = useState<ChangeFilter>('PENDING');
  const [approving, setApproving] = useState<ChangeRequest | null>(null);
  const [rejecting, setRejecting] = useState<ChangeRequest | null>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState<ChangeDecision | null>(null);
  const list = (data ?? []).filter((c) => filter === 'ALL' || c.status === filter)
    .sort((a, b) => (filter === 'PENDING' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  const count = (s: PackageRequestStatus) => (data ?? []).filter((c) => c.status === s).length;
  const close = () => { setApproving(null); setRejecting(null); setNote(''); setReason(''); setServerError(''); };

  const approve = async () => {
    if (!approving) return;
    setBusy(true); setServerError('');
    try {
      const res = await api.put<ChangeDecision>(`/subscription-changes/${approving.id}/approve`, { note: note.trim() || null });
      toast.success(t('Đã duyệt yêu cầu của {name}', { name: displayPersonName(approving.memberName) }));
      close(); reload();
      if (res.cancelledSessions > 0 || res.notes.length > 0) setResult(res);
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };
  const reasonLen = reason.trim().length;
  const reasonError = reasonLen < 5 || reason.length > 255 ? t('Lý do từ 5 đến 255 ký tự') : undefined;
  const reject = async () => {
    if (!rejecting || reasonError) return;
    setBusy(true); setServerError('');
    try {
      await api.put(`/subscription-changes/${rejecting.id}/reject`, { reason: reason.trim() });
      toast.success(t('Đã từ chối yêu cầu của {name}', { name: displayPersonName(rejecting.memberName) }));
      close(); reload();
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };

  const change = (c: ChangeRequest) => c.type === 'CHANGE_TRAINER'
    ? <>{c.currentTrainerName ? displayPersonName(c.currentTrainerName) : t('Chưa có HLV')} → <b>{displayPersonName(c.trainerName)}</b></>
    : <>{fmtDate(c.oldStartDate)} → {fmtDate(c.oldEndDate)}<br /><b>{fmtDate(c.newStartDate)} → {fmtDate(c.newEndDate)}</b>
      {c.pauseDays ? <span className="tiny faint"> · +{c.pauseDays} {t('ngày')}</span> : null}</>;

  return (
    <>
      <div className="toolbar">
        <div className="spacer" />
        <Segmented<ChangeFilter> value={filter} onChange={setFilter} options={[
          { value: 'PENDING', label: t('Chờ duyệt {n}', { n: count('PENDING') }) },
          { value: 'APPROVED', label: t('Đã duyệt') }, { value: 'REJECTED', label: t('Từ chối') },
          { value: 'CANCELLED', label: t('Hội viên huỷ') }, { value: 'ALL', label: t('Tất cả') },
        ]} />
      </div>
      <Card flush>
        {error ? <div style={{ padding: 20 }}><ErrorState message={error} onRetry={reload} /></div>
          : loading && !data ? <div style={{ padding: 20 }}><LoadingBlock /></div>
          : list.length === 0 ? <Empty icon="edit" title={filter === 'PENDING' ? t('Không có yêu cầu nào chờ duyệt') : t('Không có yêu cầu phù hợp')} /> : (
            <Table caption={t('Yêu cầu điều chỉnh gói')}>
              <thead><tr><th>{t('Hội viên')}</th><th>{t('Yêu cầu')}</th><th>{t('Thay đổi')}</th><th>{t('Gửi lúc')}</th><th>{t('Trạng thái')}</th><th aria-label={t('Thao tác')} /></tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td><Link to={`/members/${c.memberId}`}><Person name={c.memberName} sub={[c.memberCode, c.memberPhone].filter(Boolean).join(' · ')} size="sm" /></Link></td>
                    <td><b>{t(changeTypeLabel[c.type])}</b><div className="tiny faint">{localizeText(c.planNameEn, c.planName)}</div><div className="tiny muted">{t('Lý do: {r}', { r: c.reason })}</div></td>
                    <td className="small">{change(c)}</td>
                    <td className="tiny muted nowrap">{fmtDateTime(c.createdAt)}</td>
                    <td>
                      <StatusBadge map={packageRequestStatus} value={c.status} />
                      {c.decidedAt && c.status !== 'CANCELLED' && <div className="tiny faint mt-4">{c.decidedByName ? displayPersonName(c.decidedByName) : ''} · {fmtDateTime(c.decidedAt)}</div>}
                      {c.decisionNote && <div className="tiny muted">{c.decisionNote}</div>}
                    </td>
                    <td className="actions nowrap">
                      {c.status === 'PENDING' && <>
                        <Button size="sm" variant="primary" icon="check" onClick={() => setApproving(c)}>{t('Duyệt')}</Button>
                        <Button size="sm" variant="ghost" icon="x" onClick={() => setRejecting(c)}>{t('Từ chối')}</Button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
      </Card>

      {approving && (
        <Modal title={t('Duyệt: {type}', { type: t(changeTypeLabel[approving.type]) })} size="narrow" onClose={close} footer={<>
          <Button variant="ghost" onClick={close}>{t('Huỷ')}</Button>
          <Button variant="primary" icon="check" loading={busy} onClick={() => void approve()}>{t('Duyệt và áp dụng')}</Button>
        </>}>
          <div className="stack">
            <div className="plan-summary">
              <div><span className="tiny muted">{t('Hội viên')}</span><b>{displayPersonName(approving.memberName)}</b><span className="tiny faint">{approving.memberCode}</span></div>
              <div><span className="tiny muted">{t('Gói')}</span><b>{localizeText(approving.planNameEn, approving.planName)}</b></div>
            </div>
            <div className="small">{change(approving)}</div>
            <div className="small muted">{t('Lý do: {r}', { r: approving.reason })}</div>
            <Alert kind="info">{approving.type === 'CHANGE_TRAINER'
              ? t('HLV mới nhận hội viên, giáo án đang dùng và các buổi PT sắp tới (nếu HLV mới trống lịch).')
              : t('Buổi đã xếp nằm ngoài thời gian mới sẽ tự huỷ; gói nối tiếp phía sau tự lùi theo khi bảo lưu.')}</Alert>
            <Field htmlFor="chg-note" label={t('Ghi chú cho hội viên')} hint={t('Không bắt buộc')}>
              <Input id="chg-note" maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            {serverError && <Alert kind="error">{serverError}</Alert>}
          </div>
        </Modal>
      )}
      {rejecting && (
        <Modal title={t('Từ chối yêu cầu điều chỉnh')} size="narrow" onClose={close} footer={<>
          <Button variant="ghost" onClick={close}>{t('Huỷ')}</Button>
          <Button variant="danger" icon="x" loading={busy} disabled={!!reasonError} onClick={() => void reject()}>{t('Từ chối')}</Button>
        </>}>
          <div className="stack">
            <p className="small" style={{ margin: 0 }}>{tn('{type} của {name}. Hội viên sẽ thấy lý do.', { type: <b>{t(changeTypeLabel[rejecting.type])}</b>, name: <b>{displayPersonName(rejecting.memberName)}</b> })}</p>
            <Field htmlFor="chg-reject" label={t('Lý do')} required error={reason ? reasonError : undefined} hint={t('{n}/255', { n: reason.length })}>
              <Textarea id="chg-reject" maxLength={255} value={reason} invalid={!!reason && !!reasonError} placeholder={t('VD: đã bảo lưu đủ 30 ngày trong gói này')}
                onChange={(e) => setReason(e.target.value)} />
            </Field>
            {serverError && <Alert kind="error">{serverError}</Alert>}
          </div>
        </Modal>
      )}
      {result && (
        <Modal title={t('Đã áp dụng điều chỉnh')} size="narrow" onClose={() => setResult(null)} footer={<Button variant="primary" onClick={() => setResult(null)}>{t('Đã hiểu')}</Button>}>
          <div className="stack">
            {result.cancelledSessions > 0 && <Alert kind="warning">{t('{n} buổi tập nằm ngoài thời gian mới đã được huỷ và báo cho hội viên.', { n: result.cancelledSessions })}</Alert>}
            <ul className="small" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>{result.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        </Modal>
      )}
    </>
  );
}
