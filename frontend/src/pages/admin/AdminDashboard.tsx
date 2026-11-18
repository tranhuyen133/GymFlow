import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { AdminDashboard as Data } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { BarChart, Donut } from '../../components/charts';
import { DxSpark } from '../../components/DashX';
import { Icon } from '../../components/Icon';
import { ActivityRings } from '../../components/motivation';
import { Badge, Card, CountUp, Empty, ErrorState, LoadingBlock, PageHead, Person, Table } from '../../components/ui';
import { QuickActions } from '../../components/Help';
import { AdminTodo } from '../../components/DashBits';
import { t } from '../../i18n';
import { actionLabel, fmtDate, fmtMoney, fmtMoneyShort, pctChange, relativeTime } from '../../lib/format';
import { displayPersonName } from '../../lib/names';
import { localizeText } from '../../lib/planText';
import { useAsync } from '../../lib/hooks';

const monthLabel = (label: string) => {
  const [m, y] = label.split('/');
  return m && y ? `T${m}/${y.slice(-2)}` : label;
};

export default function AdminDashboard() {
  const me = useMe();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(() => api.get<Data>('/dashboard/admin'), []);
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <div className="page"><PageHead title={t('Tổng quan')} /><LoadingBlock rows={6} /></div>;

  const growth = pctChange(data.revenueThisMonth, data.revenuePrevMonth);
  const coverage = data.totalMembers ? Math.round((data.membersWithActivePackage / data.totalMembers) * 100) : 0;
  const months = data.revenueByMonth;

  return (
    <div className="page">
      {/* Hero v11 "bảng điều hành": doanh thu tháng là số chính + đường 6 tháng; bên phải 3 chỉ số bấm được (thay hàng 4 ô số cũ) */}
      <div className="hero dx-hero">
        <div className="dx-hero-grid">
          <div className="dx-hero-main">
            <span className="dx-eyebrow">{t(greet)}, {displayPersonName(me.fullName).split(' ').slice(-1)[0]}</span>
            <span className="dx-kicker"><Icon name="wallet" size={14} /> {t('Doanh thu tháng')}</span>
            <div className="dx-money">
              <span className="num"><CountUp value={data.revenueThisMonth} format={fmtMoneyShort} /></span>
              <span className={`dx-delta ${growth >= 0 ? 'is-up' : 'is-down'}`}>
                <Icon name={growth >= 0 ? 'trendUp' : 'trendDown'} size={14} /> {growth >= 0 ? '+' : ''}{growth}%
              </span>
            </div>
            <span className="tiny faint">{t('Doanh thu tháng này: {a} · tháng trước: {b}', { a: fmtMoney(data.revenueThisMonth), b: fmtMoney(data.revenuePrevMonth) })}</span>
            <DxSpark values={months.map((r) => r.value)} labels={months.map((r) => monthLabel(r.label))} />
            <div className="row row-wrap" style={{ gap: 10 }}>
              <Link className="btn btn-primary" to="/members?new=1"><Icon name="plus" /><span>{t('Thêm hội viên')}</span></Link>
              <Link className="btn btn-secondary" to="/reports"><Icon name="chart" /><span>{t('Báo cáo')}</span></Link>
            </div>
          </div>

          <div className="dx-hero-side dx-kpis">
            <Link to="/members" className="dx-kpi">
              <span className="dx-kpi-label"><Icon name="users" size={15} />{t('Hội viên')}</span>
              <span className="dx-kpi-value num"><CountUp value={data.totalMembers} /></span>
              <span className="tiny faint"><b className="trend-up">+{data.newMembersThisMonth}</b> {t('tháng này')} · {t('{n} đang hoạt động', { n: data.activeMembers })}</span>
            </Link>
            <Link to="/subscriptions" className="dx-kpi">
              <span className="dx-kpi-label"><Icon name="ticket" size={15} />{t('Có gói hiệu lực')}</span>
              <span className="dx-kpi-value num"><CountUp value={coverage} /><small>%</small></span>
              <span className="dx-bar"><i style={{ width: `${coverage}%` }} /></span>
              <span className="tiny faint">{t('{a}/{b} hội viên', { a: data.membersWithActivePackage, b: data.totalMembers })}</span>
            </Link>
            <Link to="/subscriptions?state=EXPIRING" className={`dx-kpi${data.expiringSoon > 0 ? ' is-warn' : ''}`}>
              <span className="dx-kpi-label"><Icon name="clock" size={15} />{t('Sắp hết hạn (7 ngày)')}</span>
              <span className="dx-kpi-value num"><CountUp value={data.expiringSoon} /></span>
              <span className="tiny faint">{t('{n} buổi tập hôm nay · {m} HLV', { n: data.sessionsToday, m: data.activeTrainers })}</span>
            </Link>
          </div>
        </div>
      </div>

      <AdminTodo data={data} />

      <QuickActions items={[
        { to: '/package-requests', label: 'Duyệt đăng ký gói', icon: 'checkCircle' },
        { to: '/subscriptions', label: 'Đăng ký gói', icon: 'ticket' },
        { to: '/members?new=1', label: 'Thêm hội viên', icon: 'plus' },
        { to: '/promotions', label: 'Ưu đãi & Giảm giá', icon: 'star' },
        { to: '/payment-settings', label: 'Thanh toán', icon: 'wallet' },
        { to: '/schedules', label: 'Lịch tập tuần', icon: 'calendar' },
        { to: '/reports', label: 'Báo cáo', icon: 'chart' },
        { to: '/coach-stats', label: 'Thống kê HLV', icon: 'trophy' },
        { to: '/admin/emails', label: 'Email tự động', icon: 'mail' },
        { to: '/admin/reconcile', label: 'Đối soát chuyển khoản', icon: 'wallet' },
      ]} />

      <div className="grid grid-main mt-24">
        <Card title={t('Doanh thu 6 tháng')} icon="chart" actions={<span className="tiny faint">{t('Theo ngày thu tiền')}</span>}>
          <BarChart data={months.map((r) => ({ label: monthLabel(r.label), value: r.value }))} format={fmtMoneyShort} />
        </Card>
        <Card title={t('Gói đang hiệu lực')} icon="layers">
          {data.planDistribution.length ? (
            <Donut data={data.planDistribution.map((d) => ({ ...d, label: t(d.label) }))} sub={t('hội viên')} />
          ) : (
            <Empty title={t('Chưa có gói hiệu lực')} />
          )}
        </Card>
      </div>

      {/* Sức khoẻ phòng tập: 3 vòng tính từ số liệu thật của hôm nay (không đặt chỉ tiêu tự nghĩ ra) */}
      <Card className="mt-24" title={t('Sức khoẻ phòng tập')} icon="activity"
        actions={<span className="tiny faint">{t('Vòng đầy = 100%')}</span>}>
        <ActivityRings size={150} celebrate={false} rings={[
          { key: 'cover', label: t('Hội viên có gói'), value: data.membersWithActivePackage, max: Math.max(1, data.totalMembers), color: 'var(--ring-1)', text: `${coverage}%` },
          { key: 'active', label: t('Đang hoạt động'), value: data.activeMembers, max: Math.max(1, data.totalMembers), color: 'var(--ring-2)', text: `${data.activeMembers}/${data.totalMembers}` },
          { key: 'rev', label: t('Doanh thu so tháng trước'), value: data.revenueThisMonth, max: Math.max(1, data.revenuePrevMonth), color: 'var(--ring-3)', text: data.revenuePrevMonth ? `${Math.round((data.revenueThisMonth / data.revenuePrevMonth) * 100)}%` : '—' },
        ]} />
      </Card>

      <div className="grid grid-2 mt-24">
        <Card title={t('Gói sắp hết hạn')} icon="alert" flush actions={<Link to="/subscriptions?state=EXPIRING" className="link small">{t('Xem tất cả')}</Link>}>
          {data.expiring.length === 0 ? <Empty icon="checkCircle" title={t('Không có gói nào sắp hết hạn')} /> : (
            <Table caption={t('Gói sắp hết hạn')}>
              <thead><tr><th>{t('Hội viên')}</th><th>{t('Gói')}</th><th>{t('Hết hạn')}</th><th className="right">{t('Còn')}</th></tr></thead>
              <tbody>
                {data.expiring.map((s) => (
                  <tr key={s.id} className="clickable" onClick={() => navigate(`/members/${s.memberId}`)}>
                    <td><Person name={s.memberName} sub={s.memberCode} size="sm" /></td>
                    <td>{localizeText(s.planNameEn, s.planName)}</td>
                    <td className="nowrap">{fmtDate(s.endDate)}</td>
                    <td className="right"><Badge tone={s.daysLeft <= 3 ? 'red' : 'amber'}>{t('{n} ngày', { n: s.daysLeft })}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card title={t('Hoạt động gần đây')} icon="activity" actions={<Link to="/audit-logs" className="link small">{t('Nhật ký')}</Link>}>
          <ol className="dx-feed">
            {data.recentActivity.map((a) => (
              <li key={a.id} className={a.success ? 'is-ok' : 'is-bad'}>
                <span className="dx-feed-dot"><Icon name={a.success ? 'check' : 'x'} size={12} /></span>
                <div className="grow">
                  <div className="small"><b>{actionLabel[a.action] ?? a.action}</b>{a.detail && <span className="muted"> · {a.detail}</span>}</div>
                  <div className="tiny faint">{a.actorEmail ?? t('hệ thống')} · {relativeTime(a.createdAt)}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
