/**
 * Chọn ưu đãi khi đăng ký / nâng cấp gói. Mặc định "Không dùng ưu đãi": hệ thống không tự áp gì,
 * hội viên tự chọn một ưu đãi đủ điều kiện trong danh sách hoặc nhập mã rồi bấm Áp dụng.
 */
import { Icon } from './Icon';
import { Button, Input } from './ui';
import { t } from '../i18n';
import { localizeText } from '../lib/planText';
import { fmtMoney } from '../lib/format';
import type { PromotionValidationResponse } from '../api/types';
import './promo.css';

export type PromoChoice = { kind: 'none' } | { kind: 'offer'; id: number } | { kind: 'code'; code: string };

/** Mã đã gõ nhưng chưa bấm Áp dụng – chặn gửi đơn để không ai tưởng mã đã được tính. */
export const codeNotApplied = (choice: PromoChoice, draft: string) =>
  choice.kind === 'code' && draft.trim().toUpperCase() !== choice.code;

export function offerLabel(o: PromotionValidationResponse) {
  if (o.discountType === 'PERCENT' && o.discountValue) return t('Giảm {n}%', { n: o.discountValue });
  if (o.discountAmount > 0) return t('Giảm {m}', { m: fmtMoney(o.discountAmount) });
  return t('Quà tặng kèm');
}

export function PromoPicker({ offers, loading, choice, onChoice, draft, onDraft, codeResult, codeProblem }: {
  offers: PromotionValidationResponse[]; loading?: boolean;
  choice: PromoChoice; onChoice: (c: PromoChoice) => void;
  draft: string; onDraft: (v: string) => void;
  /** Kết quả kiểm tra mã đã áp dụng (null khi chưa áp mã). */
  codeResult?: { discountAmount: number; name?: string | null } | null;
  codeProblem?: string | null;
}) {
  const apply = () => { const c = draft.trim().toUpperCase(); if (c) onChoice({ kind: 'code', code: c }); };
  const pending = codeNotApplied(choice, draft);
  return (
    <div className="promo-pick" role="radiogroup" aria-label={t('Ưu đãi')}>
      <label className={`promo-opt${choice.kind === 'none' ? ' on' : ''}`}>
        <input type="radio" name="promo" checked={choice.kind === 'none'} onChange={() => onChoice({ kind: 'none' })} />
        <span className="promo-txt"><b>{t('Không dùng ưu đãi')}</b><small>{t('Thanh toán theo giá gốc')}</small></span>
      </label>
      {loading && <div className="promo-opt promo-loading tiny muted">{t('Đang tìm ưu đãi bạn dùng được…')}</div>}
      {offers.map((o) => {
        const on = choice.kind === 'offer' && choice.id === o.promotionId;
        return (
          <label key={o.promotionId} className={`promo-opt${on ? ' on' : ''}`}>
            <input type="radio" name="promo" checked={on} onChange={() => o.promotionId != null && onChoice({ kind: 'offer', id: o.promotionId })} />
            <span className="promo-txt">
              <b>{localizeText(o.promotionNameEn, o.promotionName) || t('Ưu đãi')}</b>
              <small>{offerLabel(o)}{(o.gifts ?? []).length > 0 ? ` · ${t('kèm quà tặng')}` : ''}</small>
            </span>
            {o.discountAmount > 0 && <b className="num promo-amt">−{fmtMoney(o.discountAmount)}</b>}
          </label>
        );
      })}
      {!loading && offers.length === 0 && (
        <div className="promo-empty tiny muted"><Icon name="info" size={13} /> {t('Hiện chưa có ưu đãi tự động nào áp dụng cho bạn với gói này.')}</div>
      )}
      <label className={`promo-opt${choice.kind === 'code' ? ' on' : ''}`}>
        <input type="radio" name="promo" checked={choice.kind === 'code'}
          onChange={() => onChoice({ kind: 'code', code: '' })} />
        <span className="promo-txt"><b>{t('Tôi có mã ưu đãi')}</b><small>{t('Nhập mã rồi bấm Áp dụng')}</small></span>
        {choice.kind === 'code' && codeResult && !codeProblem && codeResult.discountAmount > 0 && (
          <b className="num promo-amt">−{fmtMoney(codeResult.discountAmount)}</b>
        )}
      </label>
      {choice.kind === 'code' && (
        <div className="promo-code">
          <div className="row" style={{ gap: 6 }}>
            <Input value={draft} placeholder={t('Nhập mã ưu đãi')} aria-label={t('Mã ưu đãi')} autoFocus
              onChange={(e) => onDraft(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }} />
            <Button size="sm" variant="secondary" onClick={apply} disabled={!draft.trim()}>{t('Áp dụng')}</Button>
          </div>
          {pending && draft.trim() && <div className="promo-note warn">{t('Bạn đã nhập mã nhưng chưa bấm Áp dụng')}</div>}
          {!pending && choice.code && codeProblem && <div className="promo-note err">{t(codeProblem)}</div>}
          {!pending && choice.code && !codeProblem && codeResult && (
            <div className="promo-note ok">
              <Icon name="check" size={13} /> {t('Đã áp dụng mã {code}', { code: choice.code })}
              {codeResult.name ? ` · ${codeResult.name}` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
