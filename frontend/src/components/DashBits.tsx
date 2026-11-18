/**
 * v10 · Hai khối nhỏ cho trang tổng quan và luồng mua gói:
 * - AdminTodo: "Việc cần làm hôm nay" của quản lý – mỗi ô là một con số kèm lối tắt tới đúng trang xử lý.
 * - BuySteps: thanh bước Chọn gói → Xác nhận → Chuyển khoản → Tập, để hội viên biết mình đang ở đâu.
 */
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { AdminDashboard } from '../api/types';
import type { CheckinToday } from '../api/checkinTypes';
import { Icon, type IconName } from './Icon';
import { t } from '../i18n';
import { useAsync } from '../lib/hooks';

interface TodoItem { to: string; icon: IconName; color: string; n: number | null; label: string; hot?: boolean }

export function AdminTodo({ data }: { data: AdminDashboard }) {
  const reconcile = useAsync(() => api.get<{ count: number }>('/payment-reconcile/count'), []);
  const checkins = useAsync(() => api.get<CheckinToday>('/checkins/today'), []);
  const open = reconcile.data?.count ?? null;
  const items: TodoItem[] = [
    { to: '/admin/reconcile', icon: 'wallet', color: 'var(--warning)', n: open, label: 'Đơn chuyển khoản chờ đối soát', hot: (open ?? 0) > 0 },
    { to: '/subscriptions?state=EXPIRING', icon: 'clock', color: 'var(--bad)', n: data.expiringSoon, label: 'Gói hết hạn trong 7 ngày – nhắc gia hạn', hot: data.expiringSoon > 0 },
    { to: '/schedules', icon: 'calendar', color: 'var(--info)', n: data.sessionsToday, label: 'Buổi tập hôm nay' },
    { to: '/admin/checkin', icon: 'checkCircle', color: 'var(--primary-bright)', n: checkins.data?.total ?? null, label: 'Lượt check-in hôm nay – mở quầy' },
  ];
  return (
    <nav className="todo-strip" aria-label={t('Việc cần làm hôm nay')}>
      {items.map((it) => (
        <Link key={it.to} to={it.to} className={`todo-item${it.hot ? ' hot' : it.n === 0 ? ' calm' : ''}`} style={{ ['--c' as string]: it.color }}>
          <span className="todo-ic"><Icon name={it.icon} /></span>
          <span style={{ minWidth: 0 }}>
            <span className="todo-n">{it.n ?? '—'}</span>
            <span className="todo-t" style={{ display: 'block' }}>{t(it.label)}</span>
          </span>
          <Icon name="chevronRight" size={16} className="todo-go" />
        </Link>
      ))}
    </nav>
  );
}

const BUY_STEPS = ['Chọn gói', 'Xác nhận đơn', 'Chuyển khoản', 'Bắt đầu tập'];

/** step: 1–4, bước đang làm. */
export function BuySteps({ step }: { step: number }) {
  return (
    <ol className="buy-steps" aria-label={t('Các bước đăng ký gói')}>
      {BUY_STEPS.map((s, i) => (
        <li key={s} className={i + 1 < step ? 'done' : i + 1 === step ? 'on' : ''} aria-current={i + 1 === step ? 'step' : undefined}>
          <span>{t(s)}</span>
        </li>
      ))}
    </ol>
  );
}
