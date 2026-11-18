/** V55 · Huy hiệu & kỷ lục cá nhân trên trang Hôm nay, kèm hiệu ứng chúc mừng khi vừa đạt huy hiệu mới. */
import { useState, type CSSProperties } from 'react';
import { api } from '../api/client';
import type { BadgeItem, BadgesData } from '../api/engagementTypes';
import { t, useLang } from '../i18n';
import { fmtDate } from '../lib/format';
import { useAsync } from '../lib/hooks';
import { Icon, type IconName } from './Icon';
import { Button, Card, Modal } from './ui';
import './badges.css';

const ICONS: IconName[] = ['play', 'flame', 'trophy', 'checkCircle', 'zap', 'star', 'sun', 'moon', 'clock'];
const iconOf = (s: string): IconName => (ICONS.includes(s as IconName) ? (s as IconName) : 'trophy');

function BadgeTile({ b, lang, big }: { b: BadgeItem; lang: string; big?: boolean }) {
  const title = lang === 'en' ? b.titleEn : b.titleVi;
  const desc = lang === 'en' ? b.descEn : b.descVi;
  const pct = Math.min(100, Math.round((b.progress / Math.max(1, b.goal)) * 100));
  return (
    <div className={`gf-badge${b.earned ? ' earned' : ''}${big ? ' big' : ''}`} title={desc}>
      <div className="gf-badge-medal"><Icon name={iconOf(b.icon)} size={big ? 30 : 22} /></div>
      <div className="gf-badge-title">{title}</div>
      {b.earned
        ? <div className="tiny muted">{b.earnedAt ? fmtDate(b.earnedAt) : ''}</div>
        : (
          <div className="gf-badge-progress" aria-label={t('Tiến độ {p}%', { p: pct })}>
            <i style={{ width: `${pct}%` }} />
          </div>
        )}
      {big && <div className="tiny muted mt-8">{desc}</div>}
    </div>
  );
}

export function BadgeStrip() {
  const { lang } = useLang();
  const { data, reload } = useAsync(() => api.get<BadgesData>('/me/badges'), []);
  const [all, setAll] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (!data) return null;

  const r = data.records;
  const fresh = data.badges.filter((b) => b.isNew);
  // Đã đạt lên trước (mới nhất trước), rồi tới huy hiệu gần đạt nhất
  const sorted = [...data.badges].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned) return (b.earnedAt ?? '').localeCompare(a.earnedAt ?? '');
    return b.progress / b.goal - a.progress / a.goal;
  });

  const closeCelebration = () => {
    setDismissed(true);
    void api.post('/me/badges/seen').then(() => reload()).catch(() => undefined);
  };

  return (
    <div className="mt-24">
      <Card title={t('Huy hiệu & kỷ lục')} icon="trophy"
        actions={<Button size="sm" variant="ghost" onClick={() => setAll(true)}>{t('Xem tất cả ({n}/{total})', { n: data.earnedCount, total: data.badges.length })}</Button>}>
        <div className="gf-records">
          <div><b>{r.currentStreakWeeks}</b><span>{t('tuần liền đang giữ')}</span></div>
          <div><b>{r.totalWorkouts}</b><span>{t('buổi đã tập')}</span></div>
          <div><b>{r.bestWeekWorkouts}</b><span>{t('buổi – tuần nhiều nhất')}</span></div>
          <div><b>{r.longestStreakWeeks}</b><span>{t('tuần – chuỗi dài nhất')}</span></div>
          <div><b>{r.totalCalories.toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN')}</b><span>{t('kcal đã đốt')}</span></div>
        </div>
        <div className="gf-badge-row">
          {sorted.slice(0, 6).map((b) => <BadgeTile key={b.code} b={b} lang={lang} />)}
        </div>
      </Card>

      {all && (
        <Modal title={t('Bộ sưu tập huy hiệu')} onClose={() => setAll(false)} size="wide">
          <p className="small muted" style={{ marginTop: 0 }}>{t('Đã đạt {n}/{total} huy hiệu. Huy hiệu tính từ buổi tập đã hoàn thành và lượt check-in tại quầy.', { n: data.earnedCount, total: data.badges.length })}</p>
          <div className="gf-badge-grid">
            {sorted.map((b) => <BadgeTile key={b.code} b={b} lang={lang} big />)}
          </div>
        </Modal>
      )}

      {fresh.length > 0 && !dismissed && (
        <Modal title={fresh.length === 1 ? t('Huy hiệu mới!') : t('{n} huy hiệu mới!', { n: fresh.length })} onClose={closeCelebration} size="narrow"
          footer={<Button variant="primary" onClick={closeCelebration}>{t('Tuyệt vời')}</Button>}>
          <div className="gf-celebrate">
            <div className="gf-confetti" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ ['--i' as string]: i } as CSSProperties} />)}</div>
            {fresh.slice(0, 3).map((b) => <BadgeTile key={b.code} b={b} lang={lang} big />)}
            {fresh.length > 3 && <p className="small muted">{t('… và {n} huy hiệu khác', { n: fresh.length - 3 })}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
