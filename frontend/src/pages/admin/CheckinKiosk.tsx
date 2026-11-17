/**
 * V53 · Màn hình quầy lễ tân: mã QR check-in đổi mỗi 30 giây (mở toàn màn hình trên máy tính bảng / TV ở quầy),
 * danh sách lượt đến hôm nay tự cập nhật, check-in hộ khi hội viên quên điện thoại, bản đồ giờ đông cả tuần.
 */
import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import type { Checkin, CheckinResult, CheckinToday, Crowd, KioskCode } from '../../api/checkinTypes';
import { CrowdFoot, CrowdHeatmap, CrowdChip, QrCode, fmtHour } from '../../components/checkin';
import { Icon } from '../../components/Icon';
import { MemberSelect } from '../../components/MemberSelect';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Confirm, Empty, ErrorState, LoadingBlock, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import { fmtTime } from '../../lib/format';
import { displayPersonName } from '../../lib/names';
import { errMsg, useAsync } from '../../lib/hooks';

function KioskQr({ kiosk, big }: { kiosk: KioskCode; big?: boolean }) {
  return (
    <div className="kiosk-qr">
      <div className="kicker">{t('GymFlow · Check-in')}</div>
      <div className="qr-frame"><QrCode rows={kiosk.qr} size={big ? 440 : 300} /></div>
      <div className="kiosk-code" aria-label={t('Mã check-in {code}', { code: kiosk.code })}>{kiosk.code.slice(0, 3)} {kiosk.code.slice(3)}</div>
      <div className="kiosk-timer" aria-hidden>
        <i key={kiosk.code} style={{ animationDuration: `${kiosk.secondsLeft}s`, ['--from' as string]: (kiosk.secondsLeft / kiosk.periodSeconds).toFixed(3) }} />
      </div>
      <ol className="kiosk-steps">
        <li><b>1</b>{t('Mở camera điện thoại, quét mã QR')}</li>
        <li><b>2</b>{t('Hoặc vào GymFlow › Hôm nay › Check-in rồi nhập 6 số')}</li>
        <li><b>3</b>{t('Màn hình báo thành công là xong, chúc bạn tập tốt!')}</li>
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
          {c.method === 'MANUAL' && c.createdByName && <> · {t('check-in hộ bởi {name}', { name: displayPersonName(c.createdByName) })}</>}
        </div>
      </div>
      {c.daysLeft != null && c.daysLeft <= 7 && <Badge tone={c.daysLeft === 0 ? 'red' : 'amber'}>{t('Còn {n} ngày', { n: c.daysLeft })}</Badge>}
      <Badge tone={c.method === 'QR' ? 'green' : 'blue'}>{c.method === 'QR' ? 'QR' : t('Quầy')}</Badge>
      <Button size="sm" variant="ghost" icon="undo" aria-label="Huỷ lượt check-in" title="Huỷ lượt check-in" onClick={onUndo} />
    </div>
  );
}

export default function CheckinKiosk() {
  const toast = useToast();
  const [kiosk, setKiosk] = useState<KioskCode | null>(null);
  const [kioskErr, setKioskErr] = useState<string | null>(null);
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

  // Lấy mã mới đúng lúc mã cũ hết hạn (theo đồng hồ máy chủ), lỗi mạng thì thử lại sau 5 giây
  useEffect(() => {
    let alive = true;
    let timer = 0;
    const load = async () => {
      try {
        const k = await api.get<KioskCode>('/checkins/kiosk', { origin: window.location.origin });
        if (!alive) return;
        setKiosk(k);
        setKioskErr(null);
        timer = window.setTimeout(() => { void load(); }, k.secondsLeft * 1000 + 300);
      } catch (e) {
        if (!alive) return;
        setKioskErr(errMsg(e));
        timer = window.setTimeout(() => { void load(); }, 5000);
      }
    };
    void load();
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const a = setInterval(() => { if (!document.hidden) void reloadToday(); }, 10_000);
    const b = setInterval(() => { if (!document.hidden) void reloadCrowd(); }, 300_000);
    return () => { clearInterval(a); clearInterval(b); };
  }, [reloadToday, reloadCrowd]);

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
    // Safari trên iPad/iPhone không có Fullscreen API: vẫn hiện lớp phủ toàn trang
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => undefined);
  };
  const closeFull = () => {
    setFull(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  };

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
      <PageHead title="Check-in quầy" desc="Đặt màn hình này ở quầy lễ tân. Hội viên quét mã QR bằng điện thoại để check-in, mã tự đổi mỗi 30 giây."
        actions={<Button variant="primary" icon="monitor" onClick={openFull} disabled={!kiosk}>{t('Toàn màn hình')}</Button>} />

      <div className="kiosk">
        <div className="stack">
          {kioskErr && <Alert kind="error">{kioskErr}</Alert>}
          {kiosk ? <KioskQr kiosk={kiosk} /> : !kioskErr && <Card><LoadingBlock rows={6} /></Card>}
          <Card title="Check-in hộ" icon="user">
            <div className="stack-sm">
              <p className="tiny muted" style={{ margin: 0 }}>{t('Khi hội viên quên điện thoại: tìm theo tên, mã hoặc số điện thoại.')}</p>
              <MemberSelect value={memberId || null} onChange={(id) => setMemberId(id)} />
              <Button variant="primary" icon="checkCircle" block loading={busy} disabled={!memberId} onClick={() => { void manual(); }}>{t('Check-in cho hội viên này')}</Button>
            </div>
          </Card>
        </div>

        <div className="stack">
          <div className="kiosk-stats">
            <div className="kiosk-stat"><b>{data?.total ?? '—'}</b><span>{t('Lượt đến hôm nay')}</span></div>
            <div className="kiosk-stat"><b>{data?.inGymNow ?? '—'}</b><span>{t('Đang trong phòng (~90 phút)')}</span></div>
            <div className="kiosk-stat"><b>{crowd.data?.peakHour != null ? fmtHour(crowd.data.peakHour) : '—'}</b><span>{t('Giờ đông nhất hôm nay')}</span></div>
          </div>

          <Card title="Lượt check-in hôm nay" icon="clock" actions={<span className="tiny faint">{t('Tự cập nhật mỗi 10 giây')}</span>}>
            {!data ? (today.error ? <ErrorState message={today.error} onRetry={reloadToday} /> : <LoadingBlock rows={4} />)
              : data.items.length === 0 ? <Empty icon="users" title={t('Chưa có ai check-in hôm nay')} desc={t('Lượt mới sẽ hiện ở đây ngay khi hội viên quét mã.')} />
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

      {full && kiosk && (
        <div className="kiosk-full" role="dialog" aria-modal="true" aria-label={t('Mã QR check-in toàn màn hình')}>
          <KioskQr kiosk={kiosk} big />
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
