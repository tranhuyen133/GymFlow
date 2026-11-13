import type { ReactNode } from 'react';
import type { MembershipPlan } from '../api/types';
import { getLang, t } from '../i18n';
import { durationLabel, fmtMoney } from '../lib/format';
import { localizeText } from '../lib/planText';
import { Icon } from './Icon';
import './packages.css';

type PlanLike = Pick<MembershipPlan, 'name' | 'nameEn' | 'price' | 'durationDays' | 'description' | 'descriptionEn' | 'benefits' | 'benefitsEn' | 'includesTrainer'> &
  Partial<Pick<MembershipPlan, 'planType' | 'ptSessions' | 'ptValidDays' | 'serviceGrants'>> & { id?: number };

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
  const perks = benefitsOf(getLang() === 'en' && plan.benefitsEn ? { benefits: plan.benefitsEn } : plan);
  return (
    <article className={`plan-card ${best ? 'best beam' : ''} ${compact ? 'compact' : ''} ${className}`}>
      {best && <span className="pc-flag"><Icon name="star" size={12} />{t('Phổ biến nhất')}</span>}
      <div className="pc-head">
        <span className="pc-term">{durationLabel(plan.durationDays)}</span>
        {badge}
      </div>
      <h3 className="pc-name">{localizeText(plan.nameEn, plan.name)}</h3>
      {plan.includesTrainer != null && (
        <span className={`chip ${plan.includesTrainer ? 'on' : ''}`} style={{ alignSelf: 'flex-start', marginTop: 4 }}
          title={plan.includesTrainer ? t('HLV riêng soạn giáo án và xếp lịch cho bạn') : t('Bạn tự soạn giáo án từ thư viện bài tập và tự xếp lịch')}>
          <Icon name={plan.includesTrainer ? 'badge' : 'user'} size={13} />
          {plan.includesTrainer ? t('Có PT') : t('Gói Gym (Tự tập)')}
        </span>
      )}
      {(plan.planType === 'GYM_PT' || plan.includesTrainer) && (
        plan.ptSessions ? (
          <div className="pc-pt-sessions">
            <Icon name="badge" size={14} />
            <span>{t('{n} buổi PT · dùng trong {d} ngày', { n: plan.ptSessions, d: plan.ptValidDays ?? plan.durationDays })}</span>
          </div>
        ) : (
          <div className="pc-pt-warning">
            <Icon name="alert" size={14} />
            <span>{t('Gói PT chưa có số buổi (Đang cập nhật)')}</span>
          </div>
        )
      )}
      <div className="pc-price" aria-label={fmtMoney(plan.price)}>
        <span className="pc-amount" key={plan.price}>{fmtMoney(plan.price)}</span>
      </div>
      <div className="pc-unit">
        <span>{plan.durationDays > 0 && plan.price >= 0 ? unitPrice(plan) : ''}</span>
        {saving != null && saving > 0 && <span className="pc-save">{t('Tiết kiệm {n}%', { n: saving })}</span>}
      </div>
      {plan.description && !compact && <p className="pc-desc">{localizeText(plan.descriptionEn, plan.description)}</p>}
      {perks.length > 0 && (
        <ul className="pc-perks">
          {perks.map((b) => <li key={b}><span className="pc-tick"><Icon name="check" size={12} /></span>{getLang() === 'en' && plan.benefitsEn ? b : t(b)}</li>)}
        </ul>
      )}
      {plan.serviceGrants && plan.serviceGrants.length > 0 && (
        <div className="pc-gifts" style={{ marginTop: 8, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12 }}>
          <div className="row" style={{ gap: 6, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
            <Icon name="sparkle" size={13} />
            <span>{t('Quà tặng kèm theo gói:')}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.4 }}>
            {plan.serviceGrants.map((g, idx) => (
              <li key={idx}>
                {t('Tặng {q} lượt {s} (hạn {d} ngày)', {
                  q: g.quantity,
                  s: g.serviceName ? t(g.serviceName) : t('Dịch vụ'),
                  d: g.validDays,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
      {children}
      {footer && <><div className="pc-grow" /><div className="pc-foot">{footer}</div></>}
    </article>
  );
}
