/**
 * Check-in quầy (quản lý / lễ tân):
 * - Quét thẻ hội viên hoặc gõ mã HV / số điện thoại – cách chính, nhanh nhất. Ô này cũng có trên thanh trên cùng ở mọi trang
 *   (nút "Check-in"), nên không cần giữ trang này mở.
 * - Mã tự check-in của hôm nay: mỗi ngày một mã, in hoặc viết lên bảng ở quầy từ đầu ngày; hội viên tự quét / nhập khi tới.
 * - Danh sách lượt đến hôm nay, huỷ lượt bấm nhầm, bản đồ giờ đông cả tuần.
 */
import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import type { Checkin, CheckinResult, CheckinToday, Crowd, DailyCode } from '../../api/checkinTypes';
import { CrowdFoot, CrowdHeatmap, CrowdChip, QrCode, fmtHour } from '../../components/checkin';
import { DeskCheckinBox, fmtDaily } from '../../components/DeskCheckin';
import { HelpTip } from '../../components/Help';
import { Icon } from '../../components/Icon';
import { MemberSelect } from '../../components/MemberSelect';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, Confirm, Empty, ErrorState, LoadingBlock, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import { fmtDate, fmtTime } from '../../lib/format';
import { displayPersonName } from '../../lib/names';
import { errMsg, useAsync } from '../../lib/hooks';

function DailyCodeBlock({ daily, big }: { daily: DailyCode; big?: boolean }) {
  return (
    <div className="daily-code">
      <div className="kicker">{t('GymFlow · Mã check-in hôm nay')}</div>
      <div className="qr-frame"><QrCode rows={daily.qr} size={big ? 420 : 220} label={t('Mã check-in {code}', { code: daily.code })} /></div>
      <div className="daily-code-num">{fmtDaily(daily.code)}</div>
      <div className="tiny muted">{t('Dùng trong ngày {d}', { d: fmtDate(daily.date) })}</div>
      <ol className="kiosk-steps">
        <li><b>1</b>{t('Mở camera điện thoại, quét mã QR')}</li>
        <li><b>2</b>{t('Hoặc vào GymFlow › Hôm nay › Check-in rồi nhập 6 số')}</li>
        <li><b>3</b>{t('Quên điện thoại? Đọc mã hội viên hoặc số điện thoại cho lễ tân')}</li>
      </ol>
    </div>
  );
}

function CheckinRow({ c, flash, onUndo }: { c: Checkin; flash: boolean; onUndo: () => void }) {
  return (
    <div className={`checkin-row${flash ? ' checkin-flash' : ''}`}>
      <span className="time">{fmtTime(c.checkedInAt)}</span>
      <div className="who">
        <div className="ellipsis" style={{ fontWeight: 700 }}>{displayPersonName(c.memberName)} <span className="muted small">· {c.memberCode}</span></div>
        <div className="tiny muted ellipsis">
          {c.planName ? t(c.planName) : t('Không có gói')}
          {c.sessionTitle && c.sessionStart && <> · {t('Buổi {title} lúc {time}', { title: t(c.sessionTitle), time: fmtTime(c.sessionStart) })}</>}
          {c.method === 'MANUAL' && c.createdByName && <> · {t('check-in tại quầy bởi {name}', { name: displayPersonName(c.createdByName) })}</>}
        </div>
      </div>
      {c.daysLeft != null && c.daysLeft <= 7 && <Badge tone={c.daysLeft === 0 ? 'red' : 'amber'}>{t('Còn {n} ngày', { n: c.daysLeft })}</Badge>}
      <Badge tone={c.method === 'QR' ? 'green' : 'blue'}>{c.method === 'QR' ? t('Tự check-in') : t('Quầy')}</Badge>
      <Button size="sm" variant="ghost" icon="undo" aria-label="Huỷ lượt check-in" title="Huỷ lượt check-in" onClick={onUndo} />
    </div>
  );
}

export default function CheckinKiosk() {
  const toast = useToast();
  const daily = useAsync(() => api.get<DailyCode>('/checkins/daily-code', { origin: window.location.origin }), []);
  const [full, setFull] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<Checkin | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const lastTop = useRef<number | null | undefined>(undefined);
  const today = useAsync(() => api.get<CheckinToday>('/checkins/today'), []);
  const crowd = useAsync(() => api.get<Crowd>('/checkins/crowd'), []);
  const reloadToday = today.reload;
  const reloadCrowd = crowd.reload;
  const reloadDaily = daily.reload;

  useEffect(() => {
    const a = setInterval(() => { if (!document.hidden) void reloadToday(); }, 15_000);
    const b = setInterval(() => { if (!document.hidden) void reloadCrowd(); }, 300_000);
    // Mở trang qua đêm: lấy lại mã khi sang ngày mới
    const c = setInterval(() => { if (!document.hidden && daily.data && daily.data.date !== new Date().toLocaleDateString('sv-SE')) void reloadDaily(); }, 60_000);
    return () => { clearInterval(a); clearInterval(b); clearInterval(c); };
  }, [reloadToday, reloadCrowd, reloadDaily, daily.data]);

  // Lượt mới nhất vừa xuất hiện thì nháy sáng một lần
  useEffect(() => {
    const top = today.data?.items[0]?.id ?? null;
    if (lastTop.current !== undefined && top != null && top !== lastTop.current) setFlash(top);
    lastTop.current = top;
  }, [today.data]);

  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setFull(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('fullscreenchange', onChange); document.removeEventListener('keydown', onKey); };
  }, []);

  const openFull = () => {
    setFull(true);
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => undefined);
  };
  const closeFull = () => {
    setFull(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  };

  const onDesk = (r: CheckinResult) => { if (!r.already) void reloadToday(); };

  const manual = async () => {
    if (!memberId) return;
    setBusy(true);
    try {
      const r = await api.post<CheckinResult>('/checkins/manual', { memberId: Number(memberId) });
      const name = displayPersonName(r.checkin.memberName);
      if (r.already) toast.info(t('{name} đã check-in lúc {time}', { name, time: fmtTime(r.checkin.checkedInAt) }));
      else toast.success(t('Đã check-in cho {name}', { name }));
      setMemberId('');
      void reloadToday();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const doUndo = async () => {
    if (!undo) return;
    try {
      await api.del(`/checkins/${undo.id}`);
      toast.success(t('Đã huỷ lượt check-in của {name}', { name: displayPersonName(undo.memberName) }));
      void reloadToday();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const data = today.data;
  return (
    <div className="page">
      <PageHead title="Check-in quầy"
        desc="Quét thẻ hội viên hoặc gõ mã HV / số điện thoại. Hội viên cũng tự check-in được bằng mã của hôm nay dán ở quầy."
        actions={<>
          <Button icon="download" onClick={() => window.print()} disabled={!daily.data}>{t('In mã hôm nay')}</Button>
          <Button variant="primary" icon="monitor" onClick={openFull} disabled={!daily.data}>{t('Hiện mã toàn màn hình')}</Button>
        </>} />

      <HelpTip id="checkin-desk" steps={[
        'Hội viên tới quầy đưa thẻ hội viên (mục Hôm nay › Thẻ hội viên): quét bằng máy quét hoặc gõ mã HV / số điện thoại rồi Enter.',
        'Ô check-in có sẵn ở nút "Check-in" trên thanh trên cùng, đang ở trang nào cũng dùng được – không cần giữ trang này mở.',
        'Muốn hội viên tự check-in: đầu ngày bấm "In mã hôm nay" rồi dán ở quầy (mỗi ngày một mã, qua nửa đêm đổi mã mới).',
        'Bấm nhầm thì huỷ lượt ở danh sách bên phải. Quét lại trong 3 giờ không bị tính thêm lượt.',
      ]} />

      <div className="kiosk">
        <div className="stack">
          <Card title="Quét thẻ / nhập mã hội viên" icon="checkCircle">
            <DeskCheckinBox autoFocus onDone={onDesk} />
          </Card>
          <Card title="Mã tự check-in hôm nay" icon="ticket">
            {daily.error ? <ErrorState message={daily.error} onRetry={reloadDaily} />
              : daily.data ? <div className="daily-print"><DailyCodeBlock daily={daily.data} /></div> : <LoadingBlock rows={5} />}
          </Card>
          <Card title="Tìm theo tên" icon="user">
            <div className="stack-sm">
              <p className="tiny muted" style={{ margin: 0 }}>{t('Không nhớ mã: tìm theo tên, mã hoặc số điện thoại.')}</p>
              <MemberSelect value={memberId || null} onChange={(id) => setMemberId(id)} />
              <Button variant="secondary" icon="checkCircle" block loading={busy} disabled={!memberId} onClick={() => { void manual(); }}>{t('Check-in cho hội viên này')}</Button>
            </div>
          </Card>
        </div>

        <div className="stack">
          <div className="kiosk-stats">
            <div className="kiosk-stat"><b>{data?.total ?? '—'}</b><span>{t('Lượt đến hôm nay')}</span></div>
            <div className="kiosk-stat"><b>{data?.inGymNow ?? '—'}</b><span>{t('Đang trong phòng (~90 phút)')}</span></div>
            <div className="kiosk-stat"><b>{crowd.data?.peakHour != null ? fmtHour(crowd.data.peakHour) : '—'}</b><span>{t('Giờ đông nhất hôm nay')}</span></div>
          </div>

          <Card title="Lượt check-in hôm nay" icon="clock" actions={<span className="tiny faint">{t('Tự cập nhật mỗi 15 giây')}</span>}>
            {!data ? (today.error ? <ErrorState message={today.error} onRetry={reloadToday} /> : <LoadingBlock rows={4} />)
              : data.items.length === 0 ? <Empty icon="users" title={t('Chưa có ai check-in hôm nay')} desc={t('Lượt mới sẽ hiện ở đây ngay khi quét thẻ hoặc hội viên tự check-in.')} />
                : (
                  <div style={{ maxHeight: 460, overflowY: 'auto' }}>
                    {data.items.map((c) => <CheckinRow key={c.id} c={c} flash={c.id === flash} onUndo={() => setUndo(c)} />)}
                  </div>
                )}
          </Card>

          <Card title="Giờ đông trong tuần" icon="chart" actions={crowd.data ? <CrowdChip level={crowd.data.level} /> : undefined}>
            {crowd.data ? (<><CrowdHeatmap crowd={crowd.data} /><CrowdFoot crowd={crowd.data} /></>)
              : crowd.error ? <ErrorState message={crowd.error} onRetry={reloadCrowd} /> : <LoadingBlock rows={4} />}
          </Card>
        </div>
      </div>

      {full && daily.data && (
        <div className="kiosk-full" role="dialog" aria-modal="true" aria-label={t('Mã check-in hôm nay toàn màn hình')}>
          <DailyCodeBlock daily={daily.data} big />
          <button type="button" className="btn btn-ghost" style={{ position: 'absolute', top: 16, right: 16 }} onClick={closeFull}>
            <Icon name="x" /><span>{t('Thoát (Esc)')}</span>
          </button>
        </div>
      )}

      {undo && (
        <Confirm title={t('Huỷ lượt check-in?')} danger confirmText={t('Huỷ lượt')}
          message={t('Lượt check-in lúc {time} của {name} sẽ bị xoá (dùng khi bấm nhầm).', { time: fmtTime(undo.checkedInAt), name: displayPersonName(undo.memberName) })}
          onClose={() => setUndo(null)} onConfirm={doUndo} />
      )}
    </div>
  );
}
