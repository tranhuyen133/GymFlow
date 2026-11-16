/**
 * V49 · Quản lý sửa thời gian sử dụng gói của hội viên (bù ngày nghỉ, nhập nhầm, dời theo yêu cầu…).
 * Backend chặn: trùng gói khác, bỏ ra ngoài buổi PT đã trừ, quá 3 năm; buổi đã xếp nằm ngoài thời gian mới tự huỷ và báo lại.
 * Mỗi lần sửa lưu lịch sử trước / sau + lý do.
 */
import { useState } from 'react';
import { api } from '../api/client';
import type { AdjustResult, Subscription, SubscriptionAdjustment } from '../api/types';
import { Icon } from './Icon';
import { useToast } from './Toast';
import { Alert, Button, Field, Input, LoadingBlock, Modal, Textarea } from './ui';
import { t } from '../i18n';
import { addDays, fmtDate, fmtDateTime, parseDate, toIsoDate, todayIso } from '../lib/format';
import { errMsg, useAsync } from '../lib/hooks';
import './upgrade.css';

/** Khớp SubscriptionAdjustmentService.MAX_DAYS. */
const MAX_DAYS = 1095;
const days = (a: string, b: string) => Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
const shift = (d: string, n: number) => toIsoDate(addDays(parseDate(d), n));
const sourceLabel: Record<SubscriptionAdjustment['source'], string> = { ADMIN: 'Quản lý sửa', MEMBER_REQUEST: 'Theo yêu cầu hội viên', UPGRADE: 'Nâng cấp gói' };

export function AdjustDatesModal({ sub, onClose, onDone }: { sub: Subscription; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const history = useAsync(() => api.get<SubscriptionAdjustment[]>(`/subscriptions/${sub.id}/adjustments`), [sub.id]);
  const isPt = sub.ptSessionsTotal != null;
  const [start, setStart] = useState(sub.startDate);
  const [end, setEnd] = useState(sub.endDate);
  const [ptUntil, setPtUntil] = useState('');
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState<AdjustResult | null>(null);

  const oneYearAgo = shift(todayIso(), -365);
  const length = start && end ? days(start, end) + 1 : 0;
  const dateError = !start || !end ? t('Chọn đủ ngày bắt đầu và kết thúc')
    : end < start ? t('Ngày kết thúc phải sau ngày bắt đầu')
    : length > MAX_DAYS ? t('Một gói tối đa {n} ngày', { n: MAX_DAYS })
    : start < oneYearAgo ? t('Ngày bắt đầu không lùi quá 1 năm')
    : start === sub.startDate && end === sub.endDate && !ptUntil ? t('Thời gian mới đang giống hệt hiện tại')
    : undefined;
  const ptError = ptUntil && end && ptUntil < start ? t('Hạn buổi PT phải sau ngày bắt đầu') : undefined;
  const r = reason.trim();
  const reasonError = r.length < 5 ? t('Nêu lý do ít nhất 5 ký tự') : r.length > 255 ? t('Lý do tối đa 255 ký tự') : undefined;
  const deltaEnd = end ? days(sub.endDate, end) : 0;
  // Hạn PT tự lùi theo số ngày kết thúc thay đổi nếu quản lý không nhập tay
  const autoPt = isPt && sub.ptValidUntil && !ptUntil && deltaEnd !== 0 ? shift(sub.ptValidUntil, deltaEnd) : null;
  const shortened = end < sub.endDate || start > sub.startDate;

  const quick = (n: number) => { setEnd(shift(end || sub.endDate, n)); };

  const submit = async () => {
    setTried(true);
    if (dateError || ptError || reasonError) return;
    setBusy(true); setServerError('');
    try {
      const res = await api.put<AdjustResult>(`/subscriptions/${sub.id}/dates`, { startDate: start, endDate: end, ptValidUntil: ptUntil || null, reason: r });
      toast.success(t('Đã cập nhật thời gian gói của {name}', { name: sub.memberName }));
      if (res.cancelledSessions > 0 || res.notes.length > 0) setResult(res); else onDone();
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };

  if (result) return (
    <Modal title={t('Đã cập nhật thời gian gói')} size="narrow" onClose={onDone} footer={<Button variant="primary" onClick={onDone}>{t('Đã hiểu')}</Button>}>
      <div className="stack">
        <div className="adj-box after"><span className="tiny muted">{t('Thời gian mới')}</span><b>{fmtDate(result.subscription.startDate)} → {fmtDate(result.subscription.endDate)}</b></div>
        {result.cancelledSessions > 0 && <Alert kind="warning">{t('{n} buổi tập nằm ngoài thời gian mới đã được huỷ và báo cho hội viên.', { n: result.cancelledSessions })}</Alert>}
        {result.notes.length > 0 && <ul className="small" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>{result.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
      </div>
    </Modal>
  );

  return (
    <Modal title={t('Sửa thời gian gói · {name}', { name: sub.memberName })} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="primary" icon="check" loading={busy} onClick={submit}>{t('Lưu thời gian mới')}</Button>
    </>}>
      <div className="stack">
        <div className="small muted">{t(sub.planName)} · {sub.memberCode}</div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <Field htmlFor="adj-start" label={t('Ngày bắt đầu')} required>
            <Input id="adj-start" type="date" min={oneYearAgo} value={start} invalid={tried && !!dateError} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field htmlFor="adj-end" label={t('Ngày kết thúc')} required>
            <Input id="adj-end" type="date" min={start} value={end} invalid={tried && !!dateError} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <div className="row row-wrap" style={{ gap: 6 }}>
          <span className="tiny muted" style={{ alignSelf: 'center' }}>{t('Cộng nhanh vào ngày kết thúc:')}</span>
          {[7, 14, 30].map((n) => <Button key={n} size="sm" variant="secondary" onClick={() => quick(n)}>+{n} {t('ngày')}</Button>)}
          <Button size="sm" variant="ghost" onClick={() => { setStart(sub.startDate); setEnd(sub.endDate); setPtUntil(''); }}>{t('Đặt lại')}</Button>
        </div>
        {(tried || start !== sub.startDate || end !== sub.endDate) && dateError && <Alert kind="error">{dateError}</Alert>}

        {!dateError && (
          <div className="adj-compare">
            <div className="adj-box"><span className="tiny muted">{t('Hiện tại')}</span><b>{fmtDate(sub.startDate)} → {fmtDate(sub.endDate)}</b>
              <div className="tiny faint">{t('{n} ngày', { n: days(sub.startDate, sub.endDate) + 1 })}</div></div>
            <Icon name="arrowRight" size={18} />
            <div className="adj-box after"><span className="tiny muted">{t('Sau khi lưu')}</span><b>{fmtDate(start)} → {fmtDate(end)}</b>
              <div className={`adj-diff${length < days(sub.startDate, sub.endDate) + 1 ? ' neg' : ''}`}>
                {t('{n} ngày', { n: length })} ({length - days(sub.startDate, sub.endDate) - 1 >= 0 ? '+' : ''}{length - days(sub.startDate, sub.endDate) - 1})
              </div></div>
          </div>
        )}

        {isPt && (
          <Field htmlFor="adj-pt" label={t('Hạn dùng buổi PT')} error={ptError}
            hint={autoPt ? t('Bỏ trống: tự lùi theo, thành {d}', { d: fmtDate(autoPt) }) : t('Hiện tại {d} · bỏ trống để giữ nguyên / tự lùi theo ngày kết thúc', { d: fmtDate(sub.ptValidUntil) })}>
            <Input id="adj-pt" type="date" min={start} max={end ? shift(end, 1) : undefined} value={ptUntil} invalid={!!ptError} onChange={(e) => setPtUntil(e.target.value)} />
          </Field>
        )}
        {shortened && !dateError && (
          <Alert kind="warning">{t('Bạn đang rút ngắn gói. Buổi tập đã xếp nằm ngoài thời gian mới sẽ tự huỷ; không được bỏ ra ngoài những buổi PT đã trừ.')}</Alert>
        )}

        <Field htmlFor="adj-reason" label={t('Lý do sửa')} required error={tried || reason ? reasonError : undefined}
          hint={t('{n}/255 · hội viên thấy lý do này trong thông báo', { n: reason.length })}>
          <Textarea id="adj-reason" maxLength={255} value={reason} invalid={!!(tried || reason) && !!reasonError}
            placeholder={t('VD: bù 7 ngày phòng tập đóng cửa sửa chữa')} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {serverError && <Alert kind="error">{serverError}</Alert>}

        <div>
          <div className="small" style={{ fontWeight: 700, marginBottom: 8 }}>{t('Lịch sử điều chỉnh')}</div>
          {history.loading && !history.data ? <LoadingBlock rows={2} />
            : (history.data?.length ?? 0) === 0 ? <div className="tiny faint">{t('Gói này chưa từng được sửa thời gian.')}</div>
            : (
              <ul className="adj-history">
                {history.data!.map((h) => (
                  <li key={h.id}>
                    <b>{t(sourceLabel[h.source])}</b> <span className="tiny faint">· {h.createdByName ?? ''} · {fmtDateTime(h.createdAt)}</span>
                    <div className="tiny">{fmtDate(h.oldStartDate)} → {fmtDate(h.oldEndDate)} <Icon name="arrowRight" size={11} /> <b>{fmtDate(h.newStartDate)} → {fmtDate(h.newEndDate)}</b></div>
                    <div className="tiny muted">{h.reason}</div>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </Modal>
  );
}
