import type { ReactNode } from 'react';
import type { MembershipPlan } from '../api/types';
import { t } from '../i18n';
import { durationLabel, fmtMoney } from '../lib/format';
import { Icon } from './Icon';
import './packages.css';

type PlanLike = Pick<MembershipPlan, 'name' | 'price' | 'durationDays' | 'description' | 'benefits'> & { id?: number };

export const benefitsOf = (p: Pick<MembershipPlan, 'benefits'>) => (p.benefits ?? '').split(/[,\n]/).map((b) => b.trim()).filter(Boolean);

/** Giá quy đổi: gói từ 2 tháng tính theo tháng, gói ngắn tính theo ngày. */
export function unitPrice(p: Pick<MembershipPlan, 'price' | 'durationDays'>) {
  if (p.durationDays >= 60) return t('≈ {v}/tháng', { v: fmtMoney(Math.round((p.price / p.durationDays) * 30 / 1000) * 1000) });
  return t('≈ {v}/ngày', { v: fmtMoney(Math.round(p.price / p.durationDays / 100) * 100) });
}

/**
 * % tiết kiệm của từng gói so với gói có giá/ngày cao nhất (thường là gói ngắn nhất).
 * Chỉ hiện khi tiết kiệm từ 5% để không ghi những con số lẻ không có ý nghĩa.
 */
export function savings(plans: PlanLike[]): Map<number | undefined, number> {
  const perDay = (p: PlanLike) => p.price / Math.max(1, p.durationDays);
  const ref = Math.max(0, ...plans.filter((p) => p.price > 0).map(perDay));
  const out = new Map<number | undefined, number>();
  if (!ref) return out;
  plans.forEach((p) => {
    const pct = Math.round((1 - perDay(p) / ref) * 100);
    if (pct >= 5) out.set(p.id, pct);
  });
  return out;
}

/** Gói "phổ biến": gói tiết kiệm nhiều nhất nhưng không phải gói dài nhất (cần ít nhất 3 gói). */
export function pickBest(plans: PlanLike[]): number | undefined {
  if (plans.length < 3) return undefined;
  const save = savings(plans);
  const longest = Math.max(...plans.map((p) => p.durationDays));
  const candidates = plans.filter((p) => p.durationDays < longest && save.has(p.id));
  if (!candidates.length) return plans[1]?.id;
  return candidates.sort((a, b) => (save.get(b.id) ?? 0) - (save.get(a.id) ?? 0))[0].id;
}

/**
 * Thẻ gói tập dùng chung cho Quản lý › Gói tập, bảng giá trang chủ và Gói tập của hội viên.
 * best: viền sáng chạy quanh thẻ (beam) + nhãn; giá đổi thì số trượt lên (key theo giá).
 */
export function PlanCard({ plan, best, saving, badge, compact, className = '', footer, children }: {
  plan: PlanLike; best?: boolean; saving?: number; badge?: ReactNode; compact?: boolean; className?: string;
  footer?: ReactNode; children?: ReactNode;
}) {
  const perks = benefitsOf(plan);
  return (
    <article className={`plan-card ${best ? 'best beam' : ''} ${compact ? 'compact' : ''} ${className}`}>
      {best && <span className="pc-flag"><Icon name="star" size={12} />{t('Phổ biến nhất')}</span>}
      <div className="pc-head">
        <span className="pc-term">{durationLabel(plan.durationDays)}</span>
        {badge}
      </div>
      <h3 className="pc-name">{t(plan.name)}</h3>
      <div className="pc-price" aria-label={fmtMoney(plan.price)}>
        <span className="pc-amount" key={plan.price}>{fmtMoney(plan.price)}</span>
      </div>
      <div className="pc-unit">
        <span>{plan.durationDays > 0 && plan.price >= 0 ? unitPrice(plan) : ''}</span>
        {saving != null && saving > 0 && <span className="pc-save">{t('Tiết kiệm {n}%', { n: saving })}</span>}
      </div>
      {plan.description && !compact && <p className="pc-desc">{t(plan.description)}</p>}
      {perks.length > 0 && (
        <ul className="pc-perks">
          {perks.map((b) => <li key={b}><span className="pc-tick"><Icon name="check" size={12} /></span>{t(b)}</li>)}
        </ul>
      )}
      {children}
      {footer && <><div className="pc-grow" /><div className="pc-foot">{footer}</div></>}
    </article>
  );
}
