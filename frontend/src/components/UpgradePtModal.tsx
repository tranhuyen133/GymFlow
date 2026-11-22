/**
 * V49 · Nâng cấp gói tự tập → gói có PT.
 * Tiền còn lại của gói tự tập (theo số ngày chưa dùng) được trừ thẳng vào giá gói PT; gói PT chạy sớm nhất từ ngày mai.
 * Mọi con số lấy từ GET /package-requests/upgrade-quote nên giống hệt lúc quản lý duyệt.
 */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { MembershipPlan, PackageRequest, PaymentMethod, PaymentSettings, PromotionValidationResponse, Trainer, UpgradeQuote } from '../api/types';
import { Icon } from './Icon';
import { initials, PickCard } from './PaymentQr';
import { codeNotApplied, PromoPicker, type PromoChoice } from './PromoPicker';
import { useToast } from './Toast';
import { Alert, Button, Field, Input, LoadingBlock, Modal, Textarea } from './ui';
import { t, tn } from '../i18n';
import { displayPersonName } from '../lib/names';
import { localizeText } from '../lib/planText';
import { addDays, durationLabel, fmtDate, fmtMoney, parseDate, toIsoDate } from '../lib/format';
import { errMsg, useAsync } from '../lib/hooks';
import './upgrade.css';

export const isPtPlan = (p: MembershipPlan) => (p.planType === 'GYM_PT' || !!p.includesTrainer) && p.ptSessions != null && p.ptSessions > 0;

export default function UpgradePtModal({ initialPlanId, payment, onClose, onDone }: {
  initialPlanId?: number | null; payment: PaymentSettings | null;
  onClose: () => void; onDone: (created: PackageRequest) => void;
}) {
  const toast = useToast();
  const plans = useAsync(() => api.get<MembershipPlan[]>('/plans'), []);
  const trainers = useAsync(() => api.get<Trainer[]>('/trainers'), []);
  const ptPlans = useMemo(() => (plans.data ?? []).filter((p) => p.active && isPtPlan(p))
    .sort((a, b) => a.durationDays - b.durationDays || a.price - b.price), [plans.data]);
  const activeTrainers = (trainers.data ?? []).filter((tr) => tr.active);
  const online = !!payment?.onlineEnabled && payment.hasQr;

  const [planId, setPlanId] = useState<number | null>(initialPlanId ?? null);
  const [start, setStart] = useState('');
  const [choice, setChoice] = useState<PromoChoice>({ kind: 'none' });
  const [draft, setDraft] = useState('');
  const [offers, setOffers] = useState<PromotionValidationResponse[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [trainerId, setTrainerId] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('COUNTER');
  const [note, setNote] = useState('');
  const [agree, setAgree] = useState(false);
  const [quote, setQuote] = useState<UpgradeQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (planId == null && ptPlans.length > 0) setPlanId(ptPlans[0].id);
  }, [planId, ptPlans]);

  const appliedCode = choice.kind === 'code' ? choice.code : '';
  const offerId = choice.kind === 'offer' ? choice.id : null;

  // Ưu đãi không cần mã phụ thuộc số tiền sau bù trừ → tải lại khi đổi gói / ngày. Ưu đãi đang chọn không còn hợp lệ thì bỏ chọn.
  useEffect(() => {
    if (planId == null) return;
    let stale = false;
    setLoadingOffers(true);
    const timer = setTimeout(() => {
      api.get<PromotionValidationResponse[]>('/package-requests/upgrade-offers', { planId, startDate: start || undefined })
        .then((list) => {
          if (stale) return;
          setOffers(list);
          setChoice((c) => (c.kind === 'offer' && !list.some((o) => o.promotionId === c.id) ? { kind: 'none' } : c));
        })
        .catch(() => { if (!stale) setOffers([]); })
        .finally(() => { if (!stale) setLoadingOffers(false); });
    }, 200);
    return () => { stale = true; clearTimeout(timer); };
  }, [planId, start]);

  // Báo giá chạy lại mỗi khi đổi gói / ngày / ưu đãi; huỷ kết quả cũ nếu người dùng bấm nhanh.
  useEffect(() => {
    let stale = false;
    setLoadingQuote(true);
    const timer = setTimeout(() => {
      api.get<UpgradeQuote>('/package-requests/upgrade-quote', {
        planId: planId ?? undefined, startDate: start || undefined,
        code: appliedCode || undefined, promotionId: offerId ?? undefined,
      })
        .then((q) => {
          if (stale) return;
          setQuote(q);
          if (!start && q.startDate) setStart(q.startDate);
          if (!trainerId && q.currentTrainerId) setTrainerId(String(q.currentTrainerId));
        })
        .catch((e) => { if (!stale) setServerError(errMsg(e)); })
        .finally(() => { if (!stale) setLoadingQuote(false); });
    }, 200);
    return () => { stale = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, start, appliedCode, offerId]);

  const plan = ptPlans.find((p) => p.id === planId) ?? null;
  const tomorrow = toIsoDate(addDays(new Date(), 1));
  const minStart = quote?.minStart ?? tomorrow;
  const maxStart = quote?.maxStart ?? tomorrow;
  const blocked = quote && !quote.eligible && quote.reason && quote.fromSubscriptionId == null ? quote.reason : null;
  const startError = !start ? t('Chọn ngày bắt đầu gói PT')
    : start < minStart ? t('Gói PT bắt đầu sớm nhất từ ngày mai ({d})', { d: fmtDate(minStart) })
    : start > maxStart ? t('Chọn ngày trong khoảng {a} – {b}', { a: fmtDate(minStart), b: fmtDate(maxStart) })
    : undefined;
  const trainerError = !trainerId ? t('Chọn huấn luyện viên phụ trách bạn') : undefined;
  const noteError = note.length > 255 ? t('Ghi chú tối đa 255 ký tự') : undefined;
  const promoProblem = (appliedCode || offerId != null) && quote?.promotionReason ? quote.promotionReason : null;
  const promoPending = codeNotApplied(choice, draft) || (choice.kind === 'code' && !appliedCode);
  const canSubmit = !!quote?.eligible && !startError && !trainerError && !noteError && !promoProblem && !promoPending && agree && !loadingQuote;

  const submit = async () => {
    if (!canSubmit || !plan) return;
    setBusy(true); setServerError('');
    try {
      const created = await api.post<PackageRequest>('/package-requests/upgrade', {
        planId: plan.id, startDate: start, trainerId: Number(trainerId), paymentMethod: method,
        promotionCode: appliedCode || null, promotionId: offerId, note: note.trim() || null,
      });
      toast.success(method === 'BANK_TRANSFER'
        ? t('Đã gửi đơn nâng cấp. Quét mã QR để chuyển khoản, nội dung {code}.', { code: created.paymentCode ?? '' })
        : t('Đã gửi đơn nâng cấp. Vui lòng thanh toán tại quầy để kích hoạt gói PT.'));
      onDone(created);
    } catch (e) { setServerError(errMsg(e)); } finally { setBusy(false); }
  };

  const usedDays = quote ? quote.totalDays - quote.remainingDays : 0;

  return (
    <Modal size="wide" title={t('Nâng cấp lên gói có PT')} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="primary" icon="zap" loading={busy} disabled={!canSubmit} onClick={submit}>
        {quote?.eligible ? t('Gửi đơn · {price}', { price: fmtMoney(quote.finalPrice) }) : t('Gửi đơn nâng cấp')}
      </Button>
    </>}>
      {plans.loading && !plans.data ? <LoadingBlock rows={4} /> : blocked ? <Alert kind="warning">{blocked}</Alert> : ptPlans.length === 0 ? (
        <Alert kind="info">{t('Hiện chưa có gói PT nào đang mở bán. Vui lòng hỏi lễ tân.')}</Alert>
      ) : (
        <div className="upg">
          <div className="upg-main stack">
            {quote?.fromPlanName && (
              <div className="upg-path">
                <div className="upg-node">
                  <span className="tiny muted">{t('Đang dùng')}</span>
                  <b>{t(quote.fromPlanName)}</b>
                  <span className="tiny faint">{fmtDate(quote.fromStartDate)} → {fmtDate(quote.fromEndDate)}</span>
                </div>
                <span className="upg-arrow"><Icon name="arrowRight" size={18} /></span>
                <div className="upg-node on">
                  <span className="tiny muted">{t('Nâng lên')}</span>
                  <b>{plan ? localizeText(plan.nameEn, plan.name) : '—'}</b>
                  <span className="tiny faint">{quote.startDate ? `${fmtDate(quote.startDate)} → ${fmtDate(quote.endDate)}` : ''}</span>
                </div>
              </div>
            )}

            <Field label={t('Chọn gói PT')} required>
              <div className="upg-plans" role="radiogroup" aria-label={t('Chọn gói PT')}>
                {ptPlans.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={p.id === planId}
                    className={`upg-plan${p.id === planId ? ' on' : ''}`} onClick={() => setPlanId(p.id)}>
                    <b>{localizeText(p.nameEn, p.name)}</b>
                    <span className="tiny muted">{durationLabel(p.durationDays)} · {t('{n} buổi PT', { n: p.ptSessions ?? 0 })}</span>
                    <span className="num upg-plan-price">{fmtMoney(p.price)}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field htmlFor="upg-start" label={t('Gói PT bắt đầu từ')} required error={start ? startError : undefined}
              hint={t('Sớm nhất ngày mai · muộn nhất {d}', { d: fmtDate(maxStart) })}>
              <Input id="upg-start" type="date" min={minStart} max={maxStart} value={start} invalid={!!(start && startError)}
                onChange={(e) => setStart(e.target.value)} />
            </Field>

            <Field label={t('Ưu đãi')} hint={t('Không tự áp ưu đãi: bạn chọn một ưu đãi hoặc nhập mã. Mỗi đơn dùng một ưu đãi.')}>
              <PromoPicker offers={offers} loading={loadingOffers} choice={choice}
                onChoice={(c) => { setChoice(c); if (c.kind !== 'code') setDraft(''); }}
                draft={draft} onDraft={setDraft} codeProblem={appliedCode ? promoProblem : null}
                codeResult={appliedCode && quote && !quote.promotionReason
                  ? { discountAmount: quote.discountAmount, name: quote.promotionName } : null} />
              {offerId != null && promoProblem && <div className="promo-note err">{t(promoProblem)}</div>}
            </Field>

            <Field label={t('Huấn luyện viên')} required error={trainerError && agree ? trainerError : undefined}
              hint={t('HLV nhận bạn ngay khi quản lý duyệt: thấy lịch tập, giáo án và các buổi bạn đã tự xếp.')}>
              {trainers.loading && !trainers.data ? <LoadingBlock rows={2} />
                : activeTrainers.length === 0 ? <div className="pick-empty">{t('Hiện chưa có HLV nhận hội viên mới, vui lòng hỏi lễ tân.')}</div>
                : (
                  <div className="pick-grid" role="radiogroup" aria-label={t('Huấn luyện viên')}>
                    {activeTrainers.map((tr) => (
                      <PickCard key={tr.id} on={trainerId === String(tr.id)} onClick={() => setTrainerId(String(tr.id))} avatar={initials(tr.fullName)}
                        title={<>{displayPersonName(tr.fullName)}{tr.id === quote?.currentTrainerId && <span className="tiny faint" style={{ fontWeight: 600 }}> · {t('HLV hiện tại')}</span>}</>}
                        sub={[tr.specialty ? t(tr.specialty) : null, tr.experienceYears > 0 ? t('{n} năm kinh nghiệm', { n: tr.experienceYears }) : null].filter(Boolean).join(' · ') || undefined} />
                    ))}
                  </div>
                )}
            </Field>

            <Field label={t('Thanh toán')} required>
              <div className="pick-grid" role="radiogroup" aria-label={t('Thanh toán')}>
                <PickCard on={method === 'COUNTER'} onClick={() => setMethod('COUNTER')} icon="ticket" title={t('Trả tại quầy')} sub={t('Tiền mặt hoặc quẹt thẻ ở lễ tân')} />
                <PickCard on={method === 'BANK_TRANSFER'} onClick={() => setMethod('BANK_TRANSFER')} disabled={!online} icon="card" title={t('Chuyển khoản QR')}
                  sub={online ? t('Quét mã QR ngay sau khi gửi đơn') : t('Phòng tập chưa nhận chuyển khoản')} />
              </div>
            </Field>

            <Field htmlFor="upg-note" label={t('Ghi chú cho lễ tân')} error={noteError} hint={t('Không bắt buộc · {n}/255', { n: note.length })}>
              <Textarea id="upg-note" maxLength={255} value={note} invalid={!!noteError} placeholder={t('VD: tôi muốn tập buổi tối các ngày 2-4-6')}
                onChange={(e) => setNote(e.target.value)} />
            </Field>
          </div>

          <aside className="upg-receipt" aria-live="polite">
            <div className="upg-receipt-head">
              <Icon name="wallet" size={16} /> <b>{t('Chi phí nâng cấp')}</b>
              {loadingQuote && <span className="upg-spin" aria-hidden />}
            </div>
            {quote && (
              <>
                <div className="upg-line"><span>{t('Giá gói PT')}</span><b className="num">{fmtMoney(quote.planPrice)}</b></div>
                <div className="upg-line ok">
                  <span>
                    {t('Trừ phần gói cũ chưa dùng')}
                    <small>{t('{r}/{n} ngày còn lại · đã trả {p}', { r: quote.remainingDays, n: quote.totalDays, p: fmtMoney(quote.fromPricePaid) })}</small>
                  </span>
                  <b className="num">−{fmtMoney(quote.credit)}</b>
                </div>
                {quote.discountAmount > 0 && (
                  <div className="upg-line ok">
                    <span>
                      {t('Ưu đãi')} {quote.promotionCode && <code>{quote.promotionCode}</code>}
                      <small>{quote.promotionName}</small>
                    </span>
                    <b className="num">−{fmtMoney(quote.discountAmount)}</b>
                  </div>
                )}
                <div className="upg-total"><span>{t('Cần thanh toán')}</span><b className="num">{fmtMoney(quote.finalPrice)}</b></div>
                {quote.planPrice > 0 && (
                  <div className="upg-save">
                    {t('Tiết kiệm {m} so với mua mới', { m: fmtMoney(quote.planPrice - quote.finalPrice) })}
                  </div>
                )}
                <ul className="upg-facts">
                  {quote.startDate && <li><Icon name="calendar" size={13} />{t('PT chạy từ {a} đến {b}', { a: fmtDate(quote.startDate), b: fmtDate(quote.endDate) })}</li>}
                  {quote.ptSessions != null && <li><Icon name="badge" size={13} />{t('{n} buổi PT', { n: quote.ptSessions })}{quote.ptValidUntil ? ` · ${t('dùng đến {d}', { d: fmtDate(quote.ptValidUntil) })}` : ''}</li>}
                  {quote.fromEndDate && quote.startDate && <li><Icon name="clock" size={13} />{t('Gói tự tập dừng ngày {d} ({u} ngày đã dùng)', { d: fmtDate(toIsoDate(addDays(parseDate(quote.startDate), -1))), u: usedDays })}</li>}
                  {(quote.gifts ?? []).map((g, i) => <li key={i}><Icon name="sparkle" size={13} />{t('Tặng {q} lượt {s}', { q: g.quantity, s: g.serviceName || t('Dịch vụ') })}</li>)}
                </ul>
              </>
            )}
            {quote && !quote.eligible && quote.reason && <Alert kind="warning">{quote.reason}</Alert>}
          </aside>
        </div>
      )}
      {!blocked && ptPlans.length > 0 && (
        <div className="stack" style={{ marginTop: 14 }}>
          <label className="check-row">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span className="small">{tn('Tôi hiểu gói PT có hiệu lực sau khi thanh toán {price} và được quản lý xác nhận; gói tự tập kết thúc trước ngày gói PT bắt đầu.', {
              price: <b>{fmtMoney(quote?.finalPrice ?? 0)}</b>,
            })}</span>
          </label>
          {promoPending && <div className="promo-note warn">{t('Bấm Áp dụng mã hoặc chọn "Không dùng ưu đãi" để gửi đơn')}</div>}
          {serverError && <Alert kind="error">{serverError}</Alert>}
        </div>
      )}
    </Modal>
  );
}
