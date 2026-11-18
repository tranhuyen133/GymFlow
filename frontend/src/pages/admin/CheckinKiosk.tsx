/**
 * Check-in quầy (quản lý / lễ tân):
 * - Quét thẻ hội viên hoặc gõ mã HV / số điện thoại – cách chính, nhanh nhất. Ô này cũng có trên thanh trên cùng ở mọi trang.
 * - V56 · Màn hình mã động: QR + 6 số đổi mỗi 30 giây, mỗi mã chỉ một hội viên dùng được. Muốn tự check-in phải đứng trước
 *   màn hình ở quầy; ảnh chụp mã gửi cho người ở nhà sẽ hết hạn hoặc đã bị dùng. Mở ?screen=1 trên máy tính bảng / TV ở quầy.
 * - Danh sách lượt đến hôm nay (lượt tự check-in nổi bật để lễ tân nhìn mặt đối chiếu), huỷ lượt sai, bản đồ giờ đông.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Checkin, CheckinResult, CheckinToday, Crowd } from '../../api/checkinTypes';
import type { LiveCode } from '../../api/liveCheckin';
import { CrowdFoot, CrowdHeatmap, CrowdChip, QrCode, fmtHour } from '../../components/checkin';
import { DeskCheckinBox, fmtDaily } from '../../components/DeskCheckin';
import { HelpTip } from '../../components/Help';
import { Icon } from '../../components/Icon';
import { MemberSelect } from '../../components/MemberSelect';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, Confirm, Empty, ErrorState, LoadingBlock, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import { fmtTime } from '../../lib/format';
import { displayPersonName } from '../../lib/names';
import { errMsg, useAsync } from '../../lib/hooks';
import '../../components/live-checkin.css';

/** Lấy mã động, tự hỏi lại mỗi 2 giây (mã đổi khi hết 30 giây hoặc ngay khi có người dùng). */
function useLiveCode(onUsed: () => void) {
  const [live, setLive] = useState<LiveCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const last = useRef<string | null>(null);
  const lastDeadline = useRef(0);
  const used = useRef(onUsed);
  used.current = onUsed;

  const load = useCallback(async () => {
    try {
      const l = await api.get<LiveCode>('/checkins/live-code', { origin: window.location.origin });
      // Mã đổi trước hạn = vừa có hội viên dùng mã cũ → cập nhật danh sách ngay
      if (last.current && last.current !== l.code && Date.now() < lastDeadline.current - 1500) used.current();
      last.current = l.code;
      lastDeadline.current = Date.now() + l.secondsLeft * 1000;
      setLive(l);
      setDeadline(lastDeadline.current);
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    void load();
    const a = setInterval(() => { if (!document.hidden) void load(); }, 2000);
    const b = setInterval(() => setNow(Date.now()), 250);
    return () => { clearInterval(a); clearInterval(b); };
  }, [load]);

  const left = live ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
  return { live, error, left, reload: load };
}

function LiveCodeBlock({ live, left, big }: { live: LiveCode; left: number; big?: boolean }) {
  const pct = Math.max(0, Math.min(100, (left / live.ttlSeconds) * 100));
  return (
    <div className={`live-code${big ? ' big' : ''}`}>
      <div className="kicker">{t('GymFlow · Check-in tại phòng tập')}</div>
      <div className="qr-frame"><QrCode rows={live.qr} size={big ? 420 : 230} label={t('Mã check-in {code}', { code: live.code })} /></div>
      <div className="live-code-num num">{fmtDaily(live.code)}</div>
      <div className="live-code-timer" aria-live="polite">
        <div className="live-code-bar"><span style={{ width: `${pct}%` }} /></div>
        <span className="tiny muted">{left > 0 ? t('Mã mới sau {n} giây', { n: left }) : t('Đang đổi mã…')}</span>
      </div>
      <ol className="kiosk-steps">
        <li><b>1</b>{t('Mở camera điện thoại, quét mã QR trên màn hình này')}</li>
        <li><b>2</b>{t('Hoặc vào GymFlow › Check-in rồi nhập 6 số đang hiện')}</li>
        <li><b>3</b>{t('Quên điện thoại? Đọc mã hội viên hoặc số điện thoại cho lễ tân')}</li>
      </ol>
      <p className="tiny faint live-code-note">{t('Mỗi mã chỉ một người dùng và đổi mỗi 30 giây – phải có mặt ở quầy mới check-in được.')}</p>
    </div>
  );
}

function CheckinRow({ c, flash, onUndo }: { c: Checkin; flash: boolean; onUndo: () => void }) {
  return (
    <div className={`checkin-row${flash ? ' checkin-flash' : ''}${c.method === 'QR' ? ' is-self' : ''}`}>
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
      <Badge tone={c.method === 'QR' ? 'green' : 'blue'}>{c.method === 'QR' ? t('Tự quét mã') : t('Quầy')}</Badge>
      <Button size="sm" variant="ghost" icon="undo" aria-label={t('Huỷ lượt check-in')} title={t('Huỷ lượt check-in')} onClick={onUndo} />
    </div>
  );
}

export default function CheckinKiosk() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [full, setFull] = useState(params.get('screen') === '1');
  const [memberId, setMemberId] = useState('');
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<Checkin | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const lastTop = useRef<number | null | undefined>(undefined);
  const today = useAsync(() => api.get<CheckinToday>('/checkins/today'), []);
  const crowd = useAsync(() => api.get<Crowd>('/checkins/crowd'), []);
  const reloadToday = today.reload;
  const reloadCrowd = crowd.reload;
  const live = useLiveCode(() => { void reloadToday(); });

  useEffect(() => {
    const a = setInterval(() => { if (!document.hidden) void reloadToday(); }, 15_000);
    const b = setInterval(() => { if (!document.hidden) void reloadCrowd(); }, 300_000);
    return () => { clearInterval(a); clearInterval(b); };
  }, [reloadToday, reloadCrowd]);

  // Lượt mới nhất vừa xuất hiện thì nháy sáng một lần
  useEffect(() => {
    const top = today.data?.items[0]?.id ?? null;
    if (lastTop.current !== undefined && top != null && top !== lastTop.current) setFlash(top);
    lastTop.current = top;
  }, [today.data]);

  // Mở từ nút "Mở màn hình mã…" trên thanh trên cùng khi đang ở sẵn trang này
  useEffect(() => { if (params.get('screen') === '1') setFull(true); }, [params]);

  const closeFull = useCallback(() => {
    setFull(false);
    if (params.get('screen')) setParams({}, { replace: true });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  }, [params, setParams]);

  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement && !params.get('screen')) setFull(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeFull(); };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('fullscreenchange', onChange); document.removeEventListener('keydown', onKey); };
  }, [closeFull, params]);

  const openFull = () => {
    setFull(true);
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => undefined);
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
  const selfCount = data ? data.items.filter((c) => c.method === 'QR').length : 0;
  return (
    <div className="page">
      <PageHead title="Check-in quầy"
        desc="Quét thẻ hội viên hoặc gõ mã HV / số điện thoại. Hội viên tự check-in bằng mã động trên màn hình quầy – mã đổi mỗi 30 giây nên không gửi cho người ở nhà được."
        actions={<Button variant="primary" icon="monitor" onClick={openFull} disabled={!live.live}>{t('Mở màn hình mã cho hội viên')}</Button>} />

      <HelpTip id="checkin-live" steps={[
        'Đặt một máy tính bảng / TV ở quầy, đăng nhập quản lý, bấm "Mở màn hình mã cho hội viên" (hoặc mở đường dẫn /admin/checkin?screen=1).',
        'Hội viên tới nơi quét QR hoặc nhập 6 số đang hiện. Mỗi mã chỉ một người dùng, dùng xong màn hình đổi mã mới ngay; để yên thì 30 giây đổi một lần.',
        'Ảnh chụp mã gửi cho bạn ở nhà sẽ hết hạn hoặc đã bị dùng, nên check-in "từ nhà" không được tính.',
        'Lượt tự quét mã được tô xanh trong danh sách: thấy tên người không có mặt thì bấm huỷ lượt.',
      ]} />

      <div className="kiosk">
        <div className="stack">
          <Card title="Quét thẻ / nhập mã hội viên" icon="checkCircle">
            <DeskCheckinBox autoFocus onDone={onDesk} />
          </Card>
          <Card title="Mã động cho hội viên tự check-in" icon="ticket">
            {live.error && !live.live ? <ErrorState message={live.error} onRetry={() => { void live.reload(); }} />
              : live.live ? <LiveCodeBlock live={live.live} left={live.left} /> : <LoadingBlock rows={5} />}
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
            <div className="kiosk-stat"><b>{data ? selfCount : '—'}</b><span>{t('Tự quét mã hôm nay')}</span></div>
            <div className="kiosk-stat"><b>{crowd.data?.peakHour != null ? fmtHour(crowd.data.peakHour) : '—'}</b><span>{t('Giờ đông nhất hôm nay')}</span></div>
          </div>

          <Card title="Lượt check-in hôm nay" icon="clock" actions={<span className="tiny faint">{t('Tự cập nhật')}</span>}>
            {!data ? (today.error ? <ErrorState message={today.error} onRetry={reloadToday} /> : <LoadingBlock rows={4} />)
              : data.items.length === 0 ? <Empty icon="users" title={t('Chưa có ai check-in hôm nay')} desc={t('Lượt mới sẽ hiện ở đây ngay khi quét thẻ hoặc hội viên tự quét mã trên màn hình quầy.')} />
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

      {full && (
        <div className="kiosk-full" role="dialog" aria-modal="true" aria-label={t('Màn hình mã check-in cho hội viên')}>
          {live.live ? <LiveCodeBlock live={live.live} left={live.left} big /> : <LoadingBlock rows={6} />}
          <button type="button" className="btn btn-ghost" style={{ position: 'absolute', top: 16, right: 16 }} onClick={closeFull}>
            <Icon name="x" /><span>{t('Thoát (Esc)')}</span>
          </button>
        </div>
      )}

      {undo && (
        <Confirm title={t('Huỷ lượt check-in?')} danger confirmText={t('Huỷ lượt')}
          message={t('Lượt check-in lúc {time} của {name} sẽ bị xoá (bấm nhầm, hoặc người này không có mặt ở phòng tập).', { time: fmtTime(undo.checkedInAt), name: displayPersonName(undo.memberName) })}
          onClose={() => setUndo(null)} onConfirm={doUndo} />
      )}
    </div>
  );
}
