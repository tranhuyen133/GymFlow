/**
 * V49 · Hội viên điều chỉnh gói: dời ngày bắt đầu (gói chưa chạy), bảo lưu 1–30 ngày → gửi quản lý duyệt.
 * V56 · Đổi HLV (gói có PT) không chờ duyệt: chọn HLV là xem ngay buổi nào chuyển được; HLV mới rảnh mọi buổi thì đổi luôn,
 * có buổi trùng giờ thì gửi quản lý xếp lại.
 */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { ChangeRequest, ChangeRequestType, Subscription, Trainer } from '../api/types';
import type { TrainerSwitchPreview, TrainerSwitchResult } from '../api/selfServiceTypes';
import { Icon } from './Icon';
import { initials, PickCard } from './PaymentQr';
import { useToast } from './Toast';
import { Alert, Button, Field, Input, LoadingBlock, Modal, Textarea } from './ui';
import { t } from '../i18n';
import { displayPersonName } from '../lib/names';
import { addDays, fmtDate, parseDate, toIsoDate, todayIso } from '../lib/format';
import { errMsg, useAsync } from '../lib/hooks';
import './upgrade.css';

/** Khớp SubscriptionAdjustmentService. */
export const MAX_PAUSE_DAYS = 30;
export const MAX_MOVE_START_DAYS = 60;

export const changeTypeLabel: Record<ChangeRequestType, string> = {
  CHANGE_START: 'Dời ngày bắt đầu',
  PAUSE: 'Bảo lưu gói',
  CHANGE_TRAINER: 'Đổi huấn luyện viên',
};

const dayDiff = (a: string, b: string) => Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
const shift = (d: string, n: number) => toIsoDate(addDays(parseDate(d), n));

export default function SubscriptionChangeModal({ sub, onClose, onDone }: { sub: Subscription; onClose: () => void; onDone: (r: ChangeRequest) => void }) {
  const toast = useToast();
  const upcoming = sub.state === 'UPCOMING';
  const isPt = sub.planType === 'GYM_PT' || sub.ptSessionsTotal != null;
  const options = useMemo(() => ([
    isPt ? 'CHANGE_TRAINER' : null,
    upcoming ? 'CHANGE_START' : null,
    'PAUSE',
  ].filter(Boolean) as ChangeRequestType[]), [upcoming, isPt]);
  const [type, setType] = useState<ChangeRequestType>(options[0]);
  const [newStart, setNewStart] = useState('');
  const [pauseDays, setPauseDays] = useState('7');
  const [trainerId, setTrainerId] = useState('');
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [preview, setPreview] = useState<TrainerSwitchPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const trainers = useAsync(() => (isPt ? api.get<Trainer[]>('/trainers') : Promise.resolve([] as Trainer[])), [isPt]);
  const activeTrainers = (trainers.data ?? []).filter((tr) => tr.active && tr.fullName !== sub.trainerName);
  const switching = type === 'CHANGE_TRAINER';

  // Chọn HLV là hỏi máy chủ ngay: buổi nào chuyển được, buổi nào trùng giờ.
  useEffect(() => {
    if (!switching || !trainerId) { setPreview(null); setPreviewError(''); return; }
    let alive = true;
    setPreview(null); setPreviewError('');
    api.get<TrainerSwitchPreview>('/me/trainer-switch/preview', { trainerId, subscriptionId: sub.id })
      .then((p) => { if (alive) setPreview(p); })
      .catch((e) => { if (alive) setPreviewError(errMsg(e)); });
    return () => { alive = false; };
  }, [switching, trainerId, sub.id]);

  const tomorrow = shift(todayIso(), 1);
  const maxStart = shift(todayIso(), MAX_MOVE_START_DAYS);
  const length = dayDiff(sub.startDate, sub.endDate);
  const days = Number(pauseDays);

  let dates: { start: string; end: string } | null = null;
  let typeError: string | undefined;
  if (type === 'CHANGE_START') {
    typeError = !newStart ? t('Chọn ngày bắt đầu mới')
      : newStart < tomorrow ? t('Ngày bắt đầu mới sớm nhất là ngày mai')
      : newStart > maxStart ? t('Chỉ dời trong vòng {n} ngày tới', { n: MAX_MOVE_START_DAYS })
      : newStart === sub.startDate ? t('Ngày mới đang trùng ngày cũ')
      : undefined;
    if (newStart && !typeError) dates = { start: newStart, end: shift(newStart, length) };
  } else if (type === 'PAUSE') {
    typeError = !Number.isInteger(days) || days < 1 || days > MAX_PAUSE_DAYS ? t('Số ngày bảo lưu từ 1 đến {n}', { n: MAX_PAUSE_DAYS }) : undefined;
    if (!typeError) dates = { start: sub.startDate, end: shift(sub.endDate, days) };
  } else {
    typeError = !trainerId ? t('Chọn HLV muốn đổi sang') : previewError || undefined;
  }
  const r = reason.trim();
  // Đổi HLV ngay không bắt buộc lý do; các yêu cầu cần quản lý duyệt vẫn phải có lý do.
  const needReason = !switching || (preview != null && !preview.instant);
  const reasonError = needReason && r.length < 5 ? t('Nêu lý do ít nhất 5 ký tự') : r.length > 255 ? t('Lý do tối đa 255 ký tự') : undefined;

  const submit = async () => {
    setTried(true);
    if (typeError || reasonError || (switching && !preview)) return;
    setBusy(true); setServerError('');
    try {
      if (switching) {
        const res = await api.post<TrainerSwitchResult>('/me/trainer-switch', { subscriptionId: sub.id, trainerId: Number(trainerId), reason: r || null });
        toast.success(res.instant
          ? t('Đã đổi sang HLV {name}. {n} buổi sắp tới đã chuyển theo.', { name: preview!.trainerName, n: res.moved })
          : t('Có buổi trùng giờ với HLV mới, đã gửi quản lý xếp lại.'));
        onDone(res.request);
        return;
      }
      const created = await api.post<ChangeRequest>('/subscription-changes', {
        subscriptionId: sub.id, type, reason: r,
        newStartDate: type === 'CHANGE_START' ? newStart : null,
        pauseDays: type === 'PAUSE' ? days : null,
        trainerId: null,
      });
      toast.success(t('Đã gửi yêu cầu. Quản lý sẽ duyệt và báo lại cho bạn.'));
      onDone(created);
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };

  const submitLabel = !switching ? t('Gửi yêu cầu') : preview && !preview.instant ? t('Gửi quản lý xếp lại') : t('Đổi HLV ngay');

  return (
    <Modal title={t('Điều chỉnh gói {plan}', { plan: t(sub.planName) })} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="primary" icon={switching ? 'users' : 'check'} loading={busy} disabled={switching && !!trainerId && !preview && !previewError} onClick={submit}>{submitLabel}</Button>
    </>}>
      <div className="stack">
        <Field label={t('Bạn muốn')} required>
          <div className={`pick-grid${options.length === 3 ? ' cols-3' : ''}`} role="radiogroup" aria-label={t('Loại điều chỉnh')}>
            {options.map((o) => (
              <PickCard key={o} on={type === o} onClick={() => { setType(o); setTried(false); setServerError(''); }}
                icon={o === 'CHANGE_START' ? 'calendar' : o === 'PAUSE' ? 'clock' : 'users'} title={t(changeTypeLabel[o])}
                sub={o === 'CHANGE_START' ? t('Giữ nguyên số ngày của gói')
                  : o === 'PAUSE' ? t('Cộng thêm ngày vào cuối gói, tối đa {n} ngày', { n: MAX_PAUSE_DAYS })
                  : t('Đổi ngay nếu HLV mới rảnh, không cần chờ duyệt')} />
            ))}
          </div>
        </Field>

        {type === 'CHANGE_START' && (
          <Field htmlFor="chg-start" label={t('Ngày bắt đầu mới')} required error={newStart || tried ? typeError : undefined}
            hint={t('Từ ngày mai đến {d}', { d: fmtDate(maxStart) })}>
            <Input id="chg-start" type="date" min={tomorrow} max={maxStart} value={newStart} invalid={!!(newStart || tried) && !!typeError}
              onChange={(e) => setNewStart(e.target.value)} />
          </Field>
        )}
        {type === 'PAUSE' && (
          <Field htmlFor="chg-pause" label={t('Số ngày bảo lưu')} required error={typeError}
            hint={t('Bảo lưu cộng dồn tối đa {n} ngày cho mỗi gói; gói nối tiếp phía sau tự lùi theo.', { n: MAX_PAUSE_DAYS })}>
            <Input id="chg-pause" type="number" min={1} max={MAX_PAUSE_DAYS} value={pauseDays} invalid={!!typeError}
              onChange={(e) => setPauseDays(e.target.value)} />
          </Field>
        )}
        {switching && (
          <Field label={t('Đổi sang HLV')} required error={tried && !trainerId ? typeError : undefined}
            hint={sub.trainerName ? t('HLV hiện tại: {name}', { name: displayPersonName(sub.trainerName) }) : undefined}>
            {trainers.loading && !trainers.data ? <LoadingBlock rows={2} />
              : activeTrainers.length === 0 ? <div className="pick-empty">{t('Hiện chưa có HLV khác nhận hội viên mới.')}</div>
              : (
                <div className="pick-grid" role="radiogroup" aria-label={t('Đổi sang HLV')}>
                  {activeTrainers.map((tr) => (
                    <PickCard key={tr.id} on={trainerId === String(tr.id)} onClick={() => setTrainerId(String(tr.id))} avatar={initials(tr.fullName)}
                      title={displayPersonName(tr.fullName)} sub={tr.specialty ? t(tr.specialty) : undefined} />
                  ))}
                </div>
              )}
          </Field>
        )}

        {switching && trainerId && (
          previewError ? <Alert kind="error">{previewError}</Alert>
            : !preview ? <LoadingBlock rows={1} />
            : preview.instant ? (
              <div className="adj-compare">
                <div className="adj-box"><span className="tiny muted">{t('HLV hiện tại')}</span><b>{sub.trainerName ?? '—'}</b></div>
                <Icon name="arrowRight" size={18} />
                <div className="adj-box after">
                  <span className="tiny muted">{t('Đổi ngay sang')}</span>
                  <b>{preview.trainerName}</b>
                  <div className="adj-diff">{preview.moving > 0 ? t('{n} buổi sắp tới chuyển theo', { n: preview.moving }) : t('Chưa có buổi PT sắp tới')}</div>
                </div>
              </div>
            ) : (
              <Alert kind="warning">
                <b>{t('HLV {name} đã có lịch trùng {n} buổi của bạn:', { name: preview.trainerName, n: preview.conflicts.length })}</b>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{preview.conflicts.map((c) => <li key={c} className="small">{c}</li>)}</ul>
                <div className="small mt-4">{t('Gửi yêu cầu để quản lý xếp lại giờ rồi đổi giúp bạn, hoặc chọn HLV khác.')}</div>
              </Alert>
            )
        )}

        {dates && (
          <div className="adj-compare">
            <div className="adj-box"><span className="tiny muted">{t('Hiện tại')}</span><b>{fmtDate(sub.startDate)} → {fmtDate(sub.endDate)}</b></div>
            <Icon name="arrowRight" size={18} />
            <div className="adj-box after">
              <span className="tiny muted">{t('Sau khi duyệt')}</span>
              <b>{fmtDate(dates.start)} → {fmtDate(dates.end)}</b>
              <div className="adj-diff">{type === 'PAUSE' ? t('+{n} ngày', { n: days }) : t('Lùi {n} ngày', { n: dayDiff(sub.startDate, dates.start) })}</div>
            </div>
          </div>
        )}

        <Field htmlFor="chg-reason" label={needReason ? t('Lý do') : t('Lý do (không bắt buộc)')} required={needReason} error={tried || reason ? reasonError : undefined}
          hint={needReason ? t('{n}/255 · quản lý dựa vào đây để duyệt', { n: reason.length }) : t('{n}/255 · HLV mới sẽ thấy để chuẩn bị', { n: reason.length })}>
          <Textarea id="chg-reason" maxLength={255} value={reason} invalid={!!(tried || reason) && !!reasonError}
            placeholder={type === 'PAUSE' ? t('VD: đi công tác Đà Nẵng 1 tuần') : switching ? t('VD: muốn tập khung giờ tối') : t('VD: tháng sau mới chuyển về gần phòng tập')}
            onChange={(e) => setReason(e.target.value)} />
        </Field>
        {!switching && <Alert kind="info">{t('Yêu cầu chỉ có hiệu lực khi quản lý duyệt. Buổi tập đã xếp mà nằm ngoài thời gian mới sẽ được huỷ và báo lại cho bạn.')}</Alert>}
        {serverError && <Alert kind="error">{serverError}</Alert>}
      </div>
    </Modal>
  );
}
