/**
 * V53 · Thành phần dùng chung cho check-in: mã QR tự vẽ (SVG), biểu đồ giờ đông trong ngày, bản đồ nhiệt cả tuần.
 * Không cần thư viện: backend gửi sẵn ma trận QR và số liệu theo giờ.
 */
import type { Crowd, CrowdLevel } from '../api/checkinTypes';
import { t } from '../i18n';
import { DAYS } from '../lib/format';
import './checkin.css';

export const crowdLevelLabel: Record<CrowdLevel, string> = {
  QUIET: 'Đang vắng', NORMAL: 'Vừa phải', BUSY: 'Đang đông', UNKNOWN: 'Chưa rõ',
};

export const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function QrCode({ rows, size = 280, label }: { rows: string[]; size?: number; label?: string }) {
  const n = rows.length;
  let d = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < n) {
      if (row[x] !== '1') { x++; continue; }
      let run = 1;
      while (x + run < n && row[x + run] === '1') run++;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  });
  const q = 4;
  return (
    <svg className="qr-svg" viewBox={`${-q} ${-q} ${n + q * 2} ${n + q * 2}`} width={size} height={size}
      role="img" aria-label={label ?? t('Mã QR check-in')} shapeRendering="crispEdges">
      <rect x={-q} y={-q} width={n + q * 2} height={n + q * 2} fill="#fff" />
      <path d={d} fill="#0b0f0c" />
    </svg>
  );
}

export function CrowdChip({ level }: { level: CrowdLevel }) {
  return <span className={`crowd-chip ${level.toLowerCase()}`}><i />{t(crowdLevelLabel[level])}</span>;
}

function weekMax(c: Crowd) {
  let m = 0;
  c.week.forEach((row) => row.forEach((v, h) => { if (h >= c.openHour && h <= c.closeHour) m = Math.max(m, v); }));
  return m;
}

const levelOf = (ratio: number): CrowdLevel => (ratio < 0.34 ? 'QUIET' : ratio < 0.67 ? 'NORMAL' : 'BUSY');

/** Cột theo giờ của hôm nay: màu theo mức đông so với giờ đông nhất trong tuần, giờ hiện tại có viền và nhãn "Bây giờ". */
export function CrowdBars({ crowd, height = 150 }: { crowd: Crowd; height?: number }) {
  const max = Math.max(weekMax(crowd), 0.1);
  return (
    <div className="crowd-bars" style={{ height }} role="img"
      aria-label={t('Mức đông theo giờ hôm nay, giờ đông nhất {h}', { h: crowd.peakHour == null ? '—' : fmtHour(crowd.peakHour) })}>
      {crowd.today.map((hv) => {
        const ratio = hv.value / max;
        const now = hv.hour === crowd.currentHour;
        const past = hv.hour < crowd.currentHour;
        return (
          <div key={hv.hour} className={`crowd-col${now ? ' now' : ''}${past ? ' past' : ''}`}
            title={`${fmtHour(hv.hour)} · ${t('~{n} lượt', { n: hv.value })} · ${t(crowdLevelLabel[hv.value === 0 ? 'QUIET' : levelOf(ratio)])}`}>
            {now && <span className="crowd-now">{t('Bây giờ')}</span>}
            <span className={`crowd-bar ${hv.value === 0 ? 'quiet' : levelOf(ratio).toLowerCase()}`}
              style={{ height: `${Math.max(4, Math.round(ratio * 100))}%` }} />
            <span className="crowd-h">{hv.hour % 3 === 0 ? hv.hour : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Bản đồ nhiệt 7 ngày × giờ mở cửa, ô đậm là giờ đông. */
export function CrowdHeatmap({ crowd }: { crowd: Crowd }) {
  const max = Math.max(weekMax(crowd), 0.1);
  const hours: number[] = [];
  for (let h = crowd.openHour; h <= crowd.closeHour; h++) hours.push(h);
  return (
    <div className="heat" style={{ gridTemplateColumns: `34px repeat(${hours.length}, minmax(0, 1fr))` }}>
      <span />
      {hours.map((h) => <span key={h} className="heat-h">{h % 3 === 0 ? h : ''}</span>)}
      {crowd.week.map((row, d) => (
        <div key={d} className="heat-row" style={{ display: 'contents' }}>
          <span className={`heat-d${d + 1 === crowd.dayOfWeek ? ' today' : ''}`}>{DAYS[d]}</span>
          {hours.map((h) => (
            <span key={h} className={`heat-c${d + 1 === crowd.dayOfWeek && h === crowd.currentHour ? ' now' : ''}`}
              style={{ ['--a' as string]: (row[h] / max).toFixed(2) }}
              title={`${DAYS[d]} ${fmtHour(h)} · ${t('~{n} lượt', { n: row[h] })}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Câu tóm tắt dưới biểu đồ: giờ đông nhất, giờ vắng gợi ý, nguồn số liệu. */
export function CrowdFoot({ crowd }: { crowd: Crowd }) {
  return (
    <div className="crowd-foot">
      {crowd.peakHour != null && <span>{t('Đông nhất')}: <b>{fmtHour(crowd.peakHour)}</b></span>}
      {crowd.quietHour != null && <span>{t('Gợi ý giờ vắng')}: <b>{fmtHour(crowd.quietHour)}</b></span>}
      <span className="faint">
        {crowd.enoughData
          ? (crowd.source === 'CHECKIN'
            ? t('Theo lượt check-in {n} ngày qua', { n: crowd.days })
            : t('Tạm tính theo lịch tập đã đặt {n} ngày qua', { n: crowd.days }))
          : t('Chưa đủ dữ liệu, số liệu sẽ chính xác dần khi hội viên check-in')}
      </span>
    </div>
  );
}
