/**
 * Duyệt đơn hội viên tự đăng ký gói (SUB-08). Thêm khi kiểm thử phân hệ Hội viên.
 * Quy trình: hội viên gửi đơn trong ứng dụng → lễ tân thu đúng số tiền trong đơn → quản lý bấm Duyệt để tạo gói.
 * Backend kiểm tra lại toàn bộ (đơn còn chờ, gói còn bán, chống trùng thời gian); đơn đã xử lý không duyệt lại được.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { PackageRequest, PackageRequestStatus } from '../../api/types';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Empty, ErrorState, Field, Input, LoadingBlock, Modal, PageHead, Pager, Person, SearchInput, Segmented, Stat, StatusBadge, Textarea } from '../../components/ui';
import { durationLabel, fmtDate, fmtDateTime, fmtMoney, packageRequestStatus } from '../../lib/format';
import { errMsg, useAsync, usePaged } from '../../lib/hooks';
import { t, tn } from '../../i18n';

type Filter = 'ALL' | PackageRequestStatus;

export default function PackageRequests() {
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [q, setQ] = useState('');
  const [approving, setApproving] = useState<PackageRequest | null>(null);
  const [rejecting, setRejecting] = useState<PackageRequest | null>(null);
  const { data, error, loading, reload } = useAsync(() => api.get<PackageRequest[]>('/package-requests'), []);

  const count = (s: PackageRequestStatus) => (data ?? []).filter((r) => r.status === s).length;
  const list = useMemo(() => (data ?? [])
    .filter((r) => (filter === 'ALL' || r.status === filter)
      && (!q || `${r.memberName} ${r.memberCode} ${r.memberPhone ?? ''} ${r.planName}`.toLowerCase().includes(q.trim().toLowerCase())))
    // Đơn chờ: cũ nhất lên trước để xử lý theo thứ tự; còn lại: mới nhất lên trước.
    .sort((a, b) => (filter === 'PENDING' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt))), [data, filter, q]);
  const paged = usePaged(list, 'package-requests', `${filter}|${q}`);
  const pendingAmount = (data ?? []).filter((r) => r.status === 'PENDING').reduce((a, r) => a + r.price, 0);
  const done = () => { setApproving(null); setRejecting(null); void reload(); };

  return (
    <div className="page">
      <PageHead eyebrow="Kinh doanh" title="Duyệt đăng ký gói"
        desc="Hội viên tự chọn gói trong ứng dụng. Thu đúng số tiền ghi trong đơn tại quầy rồi bấm Duyệt để kích hoạt gói. Gói nối tiếp gói hiện tại nếu ngày mong muốn đã qua hoặc bị trùng." />

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <Stat icon="clock" label="Chờ xác nhận" value={count('PENDING')} accent="#ffb020" />
        <Stat icon="wallet" label="Cần thu (đơn chờ)" value={fmtMoney(pendingAmount)} accent="#8b7cff" />
        <Stat icon="checkCircle" label="Đã duyệt" value={count('APPROVED')} />
        <Stat icon="ban" label="Từ chối / huỷ" value={count('REJECTED') + count('CANCELLED')} accent="#ff6b61" />
      </div>

      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm hội viên, mã, SĐT, gói…" />
        <div className="spacer" />
        <Segmented<Filter> value={filter} onChange={setFilter} options={[
          { value: 'PENDING', label: t('Chờ xác nhận {n}', { n: count('PENDING') }) },
          { value: 'APPROVED', label: 'Đã duyệt' }, { value: 'REJECTED', label: 'Từ chối' },
          { value: 'CANCELLED', label: 'Hội viên huỷ' }, { value: 'ALL', label: 'Tất cả' },
        ]} />
      </div>

      <Card flush>
        {error ? <div style={{ padding: 20 }}><ErrorState message={error} onRetry={reload} /></div>
          : loading && !data ? <div style={{ padding: 20 }}><LoadingBlock /></div>
          : list.length === 0 ? <Empty icon="clipboard" title={filter === 'PENDING' ? 'Không có đơn nào chờ xác nhận' : 'Không có đơn phù hợp'} /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr>
                  <th>{t('Hội viên')}</th><th>{t('Gói')}</th><th>{t('Số tiền')}</th><th>{t('Bắt đầu')}</th>
                  <th>{t('Gửi lúc')}</th><th>{t('Trạng thái')}</th><th aria-label={t('Thao tác')} />
                </tr></thead>
                <tbody>
                  {paged.items.map((r) => (
                    <tr key={r.id}>
                      <td><Link to={`/members/${r.memberId}`}><Person name={r.memberName} sub={[r.memberCode, r.memberPhone].filter(Boolean).join(' · ')} size="sm" /></Link></td>
                      <td>
                        <b>{r.planName}</b>
                        <div className="tiny faint">{durationLabel(r.durationDays)}</div>
                        {r.status === 'PENDING' && !r.planStillOnSale && <Badge tone="red">{t('Gói đã ngừng bán')}</Badge>}
                        {r.note && <div className="tiny faint">{t('Ghi chú: {note}', { note: r.note })}</div>}
                      </td>
                      <td className="num nowrap">{fmtMoney(r.price)}</td>
                      <td className="small nowrap">{r.desiredStartDate ? fmtDate(r.desiredStartDate) : t('Sớm nhất')}</td>
                      <td className="tiny muted nowrap">{fmtDateTime(r.createdAt)}</td>
                      <td>
                        <StatusBadge map={packageRequestStatus} value={r.status} />
                        {r.decidedAt && r.status !== 'CANCELLED' && <div className="tiny faint mt-4">{r.decidedByName ?? ''} · {fmtDateTime(r.decidedAt)}</div>}
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
              </table>
            </div>
          )}
        {list.length > 0 && <Pager page={paged.page} totalPages={paged.totalPages} total={paged.total} onPage={paged.setPage} size={paged.size} sizes={[10, 20, 50, 100]} onSize={paged.setSize} />}
      </Card>

      {approving && <ApproveModal req={approving} onClose={() => setApproving(null)} onDone={done} />}
      {rejecting && <RejectModal req={rejecting} onClose={() => setRejecting(null)} onDone={done} />}
    </div>
  );
}

function ApproveModal({ req, onClose, onDone }: { req: PackageRequest; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [paid, setPaid] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const noteError = note.length > 255 ? 'Ghi chú tối đa 255 ký tự' : undefined;

  const submit = async () => {
    if (!paid || noteError) return;
    setBusy(true); setServerError('');
    try {
      await api.put(`/package-requests/${req.id}/approve`, { note: note.trim() || null });
      toast.success(t('Đã duyệt và kích hoạt gói cho {name}', { name: req.memberName }));
      onDone();
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={t('Duyệt đơn đăng ký gói')} size="narrow" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="primary" icon="check" loading={busy} disabled={!paid || !!noteError} onClick={submit}>{t('Duyệt và kích hoạt')}</Button>
    </>}>
      <div className="stack">
        <div className="plan-summary">
          <div><span className="tiny muted">{t('Hội viên')}</span><b>{req.memberName}</b><span className="tiny faint">{req.memberCode}</span></div>
          <div><span className="tiny muted">{t('Gói')}</span><b>{req.planName}</b><span className="tiny faint">{durationLabel(req.durationDays)}</span></div>
          <div><span className="tiny muted">{t('Số tiền cần thu')}</span><b className="num">{fmtMoney(req.price)}</b></div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          {req.desiredStartDate
            ? t('Bắt đầu {d} nếu ngày đó còn trống; nếu đã qua hoặc trùng gói khác, gói mới nối tiếp gói hiện tại.', { d: fmtDate(req.desiredStartDate) })
            : t('Gói bắt đầu hôm nay, hoặc nối tiếp ngay sau gói hiện tại của hội viên.')}
        </p>
        <Field htmlFor="approve-note" label={t('Ghi chú')} error={noteError} hint={t('Không bắt buộc · VD: đã thu tiền mặt, số phiếu thu')}>
          <Input id="approve-note" maxLength={255} value={note} invalid={!!noteError} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <label className="check-row">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
          <span className="small">{tn('Tôi xác nhận đã thu đủ {price} của hội viên.', { price: <b>{fmtMoney(req.price)}</b> })}</span>
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
  const error = len === 0 ? 'Vui lòng nhập lý do từ chối' : len < 5 || reason.length > 255 ? 'Lý do từ 5 đến 255 ký tự' : undefined;

  const submit = async () => {
    setTouched(true);
    if (error) return;
    setBusy(true); setServerError('');
    try {
      await api.put(`/package-requests/${req.id}/reject`, { reason: reason.trim() });
      toast.success(t('Đã từ chối đơn của {name}', { name: req.memberName }));
      onDone();
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={t('Từ chối đơn đăng ký gói')} size="narrow" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="danger" icon="x" loading={busy} disabled={touched && !!error} onClick={submit}>{t('Từ chối đơn')}</Button>
    </>}>
      <div className="stack">
        <p className="small" style={{ margin: 0 }}>{tn('Đơn {plan} của {name}. Hội viên sẽ thấy lý do trong mục Gói tập của tôi.', { plan: <b>{req.planName}</b>, name: <b>{req.memberName}</b> })}</p>
        <Field htmlFor="reject-reason" label={t('Lý do')} required error={touched ? error : undefined} hint={t('{n}/255', { n: reason.length })}>
          <Textarea id="reject-reason" maxLength={255} value={reason} invalid={touched && !!error} placeholder={t('VD: chưa thanh toán sau 3 ngày, vui lòng gửi lại đơn khi đến quầy')}
            onChange={(e) => { setReason(e.target.value); setTouched(true); }} onBlur={() => setTouched(true)} />
        </Field>
        {serverError && <Alert kind="error">{serverError}</Alert>}
      </div>
    </Modal>
  );
}
