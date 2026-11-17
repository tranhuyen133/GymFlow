/**
 * Trợ giúp thao tác dùng chung: gợi ý "Cách dùng" thu gọn được trên từng trang, nút Quay lại có đường dự phòng,
 * dải thao tác nhanh. Gợi ý nhớ trạng thái đóng / mở theo từng trang trên máy này.
 */
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { Badge } from './ui';
import { t, tx } from '../i18n';
import './promo.css';

const HELP_KEY = 'gf.help.closed';

function closedSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(HELP_KEY) || '[]') as string[]); } catch { return new Set(); }
}

/** Gợi ý cách dùng trang. id riêng cho từng trang để nhớ người dùng đã thu gọn hay chưa. */
export function HelpTip({ id, title = 'Cách dùng trang này', steps, children }: {
  id?: string; title?: string; steps?: string[]; children?: ReactNode;
}) {
  const key = id ?? title;
  const [open, setOpen] = useState(() => !closedSet().has(key));
  const toggle = (next: boolean) => {
    setOpen(next);
    try {
      const s = closedSet();
      if (next) s.delete(key); else s.add(key);
      localStorage.setItem(HELP_KEY, JSON.stringify([...s]));
    } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ }
  };
  return (
    <details className="help-tip" open={open} onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; if (o !== open) toggle(o); }}>
      <summary><Icon name="info" size={15} /> {t(title)} <Icon name="chevronDown" size={15} className="help-chev" /></summary>
      {steps && steps.length > 0 && <ol>{steps.map((s) => <li key={s}>{t(s)}</li>)}</ol>}
      {children && <div style={{ padding: '0 16px 12px' }}>{tx(children)}</div>}
    </details>
  );
}

/** Quay lại trang trước nếu người dùng đi từ trong app tới; mở thẳng bằng đường dẫn thì về trang dự phòng. */
export function BackButton({ fallback, label = 'Quay lại' }: { fallback: string; label?: string }) {
  const navigate = useNavigate();
  const back = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1); else navigate(fallback);
  };
  return (
    <button type="button" className="btn btn-ghost btn-sm back-btn" onClick={back}>
      <Icon name="arrowLeft" size={15} /><span>{t(label)}</span>
    </button>
  );
}

export interface QuickAction { to: string; label: string; icon: IconName; badge?: number | null }

/** Dải lối tắt tới các việc hay làm nhất của vai trò hiện tại. */
export function QuickActions({ items }: { items: QuickAction[] }) {
  return (
    <nav className="quick-actions" aria-label={t('Thao tác nhanh')}>
      {items.map((a) => (
        <Link key={a.to} to={a.to} className="btn btn-secondary btn-sm">
          <Icon name={a.icon} size={15} /><span>{t(a.label)}</span>
          {a.badge ? <Badge tone="amber">{a.badge}</Badge> : null}
        </Link>
      ))}
    </nav>
  );
}
