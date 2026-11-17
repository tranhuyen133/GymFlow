/**
 * V53 · Hội viên check-in: mở từ mã QR ở quầy (đường dẫn có ?c=123456 nên tự gửi ngay),
 * hoặc quét bằng camera trong trang (trình duyệt hỗ trợ BarcodeDetector), hoặc nhập tay 6 số đang hiện ở quầy.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { CheckinResult } from '../../api/checkinTypes';
import { Icon } from '../../components/Icon';
import { Alert, Button, Card, PageHead } from '../../components/ui';
import { t } from '../../i18n';
import { fmtTime } from '../../lib/format';
import { errMsg } from '../../lib/hooks';
import '../../components/checkin.css';

interface DetectedCode { rawValue: string }
interface Detector { detect: (source: HTMLVideoElement) => Promise<DetectedCode[]> }
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

const detectorCtor = () => (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
const canScan = () => typeof window !== 'undefined' && !!detectorCtor() && !!navigator.mediaDevices?.getUserMedia;

/** Lấy mã 6 số từ nội dung QR: đường dẫn …/checkin?c=123456 hoặc chính 6 số. */
export function extractCode(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{6}$/.test(s)) return s;
  try {
    const c = new URL(s).searchParams.get('c');
    return c && /^\d{6}$/.test(c) ? c : null;
  } catch {
    return null;
  }
}

function CameraScan({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const done = useRef(onCode);
  done.current = onCode;

  useEffect(() => {
    let alive = true;
    let timer = 0;
    let stream: MediaStream | null = null;
    const Ctor = detectorCtor();
    void (async () => {
      try {
        if (!Ctor) throw new Error('unsupported');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!alive || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const det = new Ctor({ formats: ['qr_code'] });
        const tick = async () => {
          if (!alive || !video.current) return;
          try {
            const found = await det.detect(video.current);
            const code = found.map((f) => extractCode(f.rawValue)).find(Boolean);
            if (code) { done.current(code); return; }
          } catch { /* khung hình chưa sẵn sàng, thử lại */ }
          timer = window.setTimeout(() => { void tick(); }, 250);
        };
        void tick();
      } catch {
        if (alive) setErr(t('Không mở được camera. Hãy cho phép truy cập camera hoặc nhập mã 6 số bên dưới.'));
      }
    })();
    return () => {
      alive = false;
      clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  return err ? <Alert kind="warning">{err}</Alert> : <video ref={video} className="scan-video" muted playsInline aria-label={t('Camera đang quét mã QR')} />;
}

export default function CheckinScan() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const started = useRef(false);

  const submit = async (c: string) => {
    setBusy(true);
    setError(null);
    setScanning(false);
    try {
      setResult(await api.post<CheckinResult>('/checkins', { code: c }));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  // Mở từ mã QR: gửi mã ngay một lần rồi xoá khỏi thanh địa chỉ (tránh gửi lại khi tải lại trang)
  useEffect(() => {
    const c = params.get('c');
    if (started.current || !c) return;
    started.current = true;
    setParams({}, { replace: true });
    void submit(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError(t('Mã check-in gồm 6 chữ số')); return; }
    void submit(code);
  };

  if (result) {
    const c = result.checkin;
    return (
      <div className="page scan-page">
        <Card>
          <div className="scan-result">
            <div className={`scan-tick${result.already ? ' warn' : ''}`}><Icon name={result.already ? 'clock' : 'checkCircle'} size={44} /></div>
            <h2 style={{ margin: 0 }}>{result.already ? t('Bạn đã check-in rồi') : t('Check-in thành công!')}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {result.already
                ? t('Lượt check-in lúc {time} vẫn còn hiệu lực, không cần quét lại.', { time: fmtTime(c.checkedInAt) })
                : t('Chúc {name} buổi tập hiệu quả. Lượt thứ {n} trong tháng này.', { name: c.memberName.trim().split(/\s+/).slice(-1)[0], n: result.visitsThisMonth })}
            </p>
            {c.sessionTitle && c.sessionStart && (
              <div className="chip on"><Icon name="calendar" size={14} /> {t('Buổi {title} lúc {time}', { title: t(c.sessionTitle), time: fmtTime(c.sessionStart) })}</div>
            )}
            {c.planName && (
              <div className="tiny muted">{t('Gói {plan} · còn {n} ngày', { plan: t(c.planName), n: c.daysLeft ?? 0 })}</div>
            )}
            <Link to="/today" className="btn btn-primary mt-8"><Icon name="sun" /><span>{t('Xem việc hôm nay')}</span></Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page scan-page">
      <PageHead title="Check-in tại quầy" desc="Quét mã QR đang hiện ở quầy lễ tân, hoặc nhập 6 số dưới mã." />
      <Card>
        <div className="stack">
          {busy && !scanning && <Alert kind="info">{t('Đang check-in…')}</Alert>}
          {error && <Alert kind="error">{error}</Alert>}
          {scanning ? (
            <>
              <CameraScan onCode={(c) => { void submit(c); }} />
              <Button variant="ghost" onClick={() => setScanning(false)}>{t('Tắt camera')}</Button>
            </>
          ) : canScan() ? (
            <Button variant="primary" size="lg" icon="camera" block onClick={() => { setError(null); setScanning(true); }}>{t('Quét mã bằng camera')}</Button>
          ) : (
            <p className="small muted" style={{ margin: 0 }}>
              {t('Trên iPhone: mở app Camera, hướng vào mã QR ở quầy rồi bấm vào đường dẫn hiện ra. Hoặc nhập 6 số dưới mã:')}
            </p>
          )}
          <form onSubmit={onSubmit} className="stack-sm" noValidate>
            <label htmlFor="checkin-code" className="small muted">{t('Mã 6 số trên màn hình quầy')}</label>
            <input id="checkin-code" className="input code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <Button type="submit" variant={canScan() ? 'secondary' : 'primary'} block loading={busy} disabled={code.length !== 6}>{t('Check-in')}</Button>
          </form>
          <p className="tiny faint" style={{ margin: 0 }}>{t('Mã đổi mỗi 30 giây. Cần có gói tập còn hiệu lực hôm nay.')}</p>
        </div>
      </Card>
    </div>
  );
}
