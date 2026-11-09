import type { ReactNode } from 'react';
import { t } from '../i18n';
import { DAYS, DAY_NAMES } from '../lib/format';
import { fromMin, GYM_CLOSE, GYM_OPEN, hm, SLOTS_PER_DAY, timeOptions, toMin, type WeekSlot } from '../lib/hours';
import { Icon } from './Icon';
import { Button } from './ui';
import './week-slots.css';

// Ô chọn giờ 24h theo bước 30 phút trong giờ mở cửa (input type="time" hiện 12h trên một số máy Windows, dễ nhập nhầm 16:00 thành 04:00)
const STARTS = timeOptions(30, GYM_OPEN, fromMin(toMin(GYM_CLOSE) - 30));
const ENDS = timeOptions(30, fromMin(toMin(GYM_OPEN) + 30), GYM_CLOSE);

/**
 * Sửa khung giờ theo tuần: dùng cho ca làm HLV và giờ tập mong muốn của hội viên.
 * extra(d): nội dung hiện thêm dưới mỗi ngày (VD giờ hội viên muốn tập ở màn ca HLV).
 */
export function WeekSlots({ slots, onChange, defaultLength = 90, extra, emptyLabel = 'Nghỉ', idPrefix }: {
  slots: WeekSlot[]; onChange: (next: WeekSlot[]) => void; defaultLength?: number;
  extra?: (day: number) => ReactNode; emptyLabel?: string; idPrefix: string;
}) {
  const set = (i: number, patch: Partial<WeekSlot>) => onChange(slots.map((x, k) => (k === i ? fixEnd({ ...x, ...patch }) : x)));
  const remove = (i: number) => onChange(slots.filter((_, k) => k !== i));
  const add = (d: number) => {
    const same = slots.filter((s) => s.dayOfWeek === d).sort((a, b) => toMin(a.endTime) - toMin(b.endTime));
    const last = same[same.length - 1];
    let start = last ? Math.ceil((toMin(last.endTime) + 30) / 30) * 30 : 18 * 60;
    if (start > toMin(GYM_CLOSE) - 30) start = toMin(GYM_OPEN);
    onChange([...slots, fixEnd({ dayOfWeek: d, startTime: fromMin(start), endTime: fromMin(start + defaultLength) })]);
  };
  const copyDay = (from: number, to: number[]) => {
    const src = slots.filter((s) => s.dayOfWeek === from);
    onChange([...slots.filter((s) => s.dayOfWeek === from || !to.includes(s.dayOfWeek)), ...to.flatMap((d) => src.map((s) => ({ ...s, dayOfWeek: d })))]);
  };

  return (
    <div className="week-slots">
      {[1, 2, 3, 4, 5, 6, 7].map((d) => {
        const list = slots.map((s, i) => ({ s, i })).filter((x) => x.s.dayOfWeek === d).sort((a, b) => toMin(a.s.startTime) - toMin(b.s.startTime));
        return (
          <div key={d} className={`ws-day ${list.length ? 'has' : ''}`}>
            <div className="ws-head">
              <b className="small">{DAY_NAMES[d - 1]}</b>
              {list.length > 0 && (
                <select className="select select-sm ws-copy" value="" aria-label={t('Chép {day} sang ngày khác', { day: DAYS[d - 1] })}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'week') copyDay(d, [1, 2, 3, 4, 5].filter((x) => x !== d));
                    else if (v === 'all') copyDay(d, [1, 2, 3, 4, 5, 6, 7].filter((x) => x !== d));
                    else if (v) copyDay(d, [Number(v)]);
                  }}>
                  <option value="">{t('Chép sang…')}</option>
                  <option value="week">{t('T2 – T6')}</option>
                  <option value="all">{t('Cả tuần')}</option>
                  {[1, 2, 3, 4, 5, 6, 7].filter((x) => x !== d).map((x) => <option key={x} value={x}>{DAY_NAMES[x - 1]}</option>)}
                </select>
              )}
            </div>
            <div className="ws-slots">
              {list.length === 0 && <span className="tiny faint">{t(emptyLabel)}</span>}
              {list.map(({ s, i }) => (
                <div key={i} className="ws-slot">
                  <Icon name="clock" size={14} />
                  <select className="select select-sm" id={`${idPrefix}-${i}-s`} value={hm(s.startTime)} onChange={(e) => set(i, { startTime: e.target.value })} aria-label={t('Bắt đầu')}>
                    {withCurrent(STARTS, hm(s.startTime)).map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <span className="faint">–</span>
                  <select className="select select-sm" id={`${idPrefix}-${i}-e`} value={hm(s.endTime)} onChange={(e) => set(i, { endTime: e.target.value })} aria-label={t('Kết thúc')}>
                    {withCurrent(ENDS.filter((v) => toMin(v) > toMin(s.startTime)), hm(s.endTime)).map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <span className="tiny faint ws-len">{lengthLabel(s)}</span>
                  <Button size="sm" variant="ghost" icon="x" aria-label="Bỏ khung giờ" onClick={() => remove(i)} />
                </div>
              ))}
              <Button size="sm" variant="ghost" icon="plus" aria-label="Thêm khung giờ" title={list.length >= SLOTS_PER_DAY ? t('Tối đa {n} khung giờ mỗi ngày', { n: SLOTS_PER_DAY }) : undefined}
                disabled={list.length >= SLOTS_PER_DAY} onClick={() => add(d)} />
            </div>
            {extra && <div className="ws-extra">{extra(d)}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** Giữ giờ kết thúc sau giờ bắt đầu và không quá giờ đóng cửa. */
function fixEnd(s: WeekSlot): WeekSlot {
  const a = toMin(s.startTime);
  if (toMin(s.endTime) > a) return s;
  return { ...s, endTime: fromMin(Math.min(a + 60, toMin(GYM_CLOSE))) };
}

/** Dữ liệu cũ có giờ lẻ (VD 05:45) hoặc ngoài giờ mở cửa vẫn hiện đúng trong ô chọn, để người dùng thấy và sửa. */
function withCurrent(list: string[], v: string) {
  return list.includes(v) ? list : [...list, v].sort((a, b) => toMin(a) - toMin(b));
}

function lengthLabel(s: WeekSlot) {
  const m = toMin(s.endTime) - toMin(s.startTime);
  if (m <= 0) return '';
  const h = Math.floor(m / 60);
  return h ? (m % 60 ? `${h}h${String(m % 60).padStart(2, '0')}` : `${h}h`) : `${m}′`;
}
