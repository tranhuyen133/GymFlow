/**
 * V56 · Quản lý › Đối soát chuyển khoản. Hội viên bấm "Tôi đã chuyển khoản" là gói chạy ngay;
 * ở đây quản lý mở app ngân hàng, tìm đúng nội dung GF… và số tiền rồi bấm Đã nhận tiền, hoặc Thu hồi nếu không thấy tiền về.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { ReconcileItem, ReconcileOverview } from '../../api/selfServiceTypes';
import { HelpTip } from '../../components/Help';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Empty, ErrorState, Field, LoadingBlock, Modal, PageHead, Table, Textarea } from '../../components/ui';
import { t } from '../../i18n';
import { displayPersonName } from '../../lib/names';
import { fmtDateTime, fmtMoney, relativeTime } from '../../lib/format';
import { localizeText } from '../../lib/planText';
import { errMsg, useAsync } from '../../lib/hooks';

export default function PaymentReconcile() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.get<ReconcileOverview>('/payment-reconcile'), []);
  const [busy, setBusy] = useState<number | null>(null);
  const [revoking, setRevoking] = useState<ReconcileItem | null>(null);

  const confirm = async (it: ReconcileItem) => {
    setBusy(it.request.id);
    try {
      await api.put(`/payment-reconcile/${it.request.id}/confirm`);
      toast.success(t('Đã xác nhận nhận tiền đơn {code}', { code: it.request.paymentCode ?? '' }));
      void reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  return (
    <div className="page">
      <PageHead eyebrow={t('Hội viên & thu tiền')} title={t('Đối soát chuyển khoản')}
        desc={t('Gói được kích hoạt ngay khi hội viên báo đã chuyển khoản. Đối chiếu với app ngân hàng rồi xác nhận, hoặc thu hồi nếu không thấy tiền về.')} />
      <HelpTip id="payment-reconcile" steps={[
        'Mở app ngân hàng, tìm giao dịch có nội dung đúng mã đơn (GF…) và đúng số tiền trong bảng.',
        'Thấy tiền: bấm “Đã nhận tiền”. Đơn chuyển sang mục Đã xử lý, bạn được ghi là người duyệt.',
        'Không thấy tiền sau khi đã chờ: bấm “Thu hồi”, nhập lý do. Gói vừa kích hoạt bị huỷ, lượt ưu đãi được trả lại, hội viên thấy lý do trong mục Đơn đăng ký.',
        'Mỗi hội viên chỉ được một đơn tự kích hoạt chưa đối soát; đơn tiếp theo sẽ chờ bạn duyệt ở mục Duyệt đăng ký gói.',
      ]} />
      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingBlock rows={6} /> : data && (
        <div className="stack mt-16" style={{ gap: 18 }}>
          {!data.enabled && (
            <Alert kind="warning">{t('Máy chủ đang tắt kích hoạt ngay (PAYMENT_INSTANT_ACTIVATION=false): đơn chuyển khoản vẫn chờ duyệt ở mục Duyệt đăng ký gói.')}</Alert>
          )}
          <Card title={t('Chờ đối soát ({n})', { n: data.openCount })} icon="wallet" flush>
            {data.open.length === 0 ? (
              <Empty icon="checkCircle" title={t('Không có giao dịch nào chờ đối soát')} desc={t('Đơn chuyển khoản mới sẽ hiện ở đây ngay khi hội viên bấm “Tôi đã chuyển khoản”.')} />
            ) : (
              <div className="table-wrap">
                <Table caption={t('Chờ đối soát')}>
                  <thead>
                    <tr><th>{t('Nội dung CK')}</th><th>{t('Số tiền')}</th><th>{t('Hội viên')}</th><th>{t('Gói')}</th><th>{t('Kích hoạt lúc')}</th><th aria-label={t('Thao tác')} /></tr>
                  </thead>
                  <tbody>
                    {data.open.map((it) => (
                      <tr key={it.request.id}>
                        <td><b className="num">{it.request.paymentCode}</b></td>
                        <td className="num nowrap"><b>{fmtMoney(it.request.finalPrice ?? it.request.price)}</b></td>
                        <td>
                          <Link to={`/members/${it.request.memberId}`}>{displayPersonName(it.request.memberName)}</Link>
                          <div className="tiny faint">{it.request.memberCode}{it.request.memberPhone ? ` · ${it.request.memberPhone}` : ''}</div>
                        </td>
                        <td className="small">
                          {localizeText(it.request.planNameEn, it.request.planName)}
                          {it.request.requestType === 'UPGRADE' && <> <Badge tone="violet">{t('Nâng cấp PT')}</Badge></>}
                        </td>
                        <td className="small nowrap">{fmtDateTime(it.autoActivatedAt)}<div className="tiny faint">{relativeTime(it.autoActivatedAt)}</div></td>
                        <td className="nowrap">
                          <div className="row" style={{ gap: 6 }}>
                            <Button size="sm" variant="primary" icon="check" loading={busy === it.request.id} onClick={() => void confirm(it)}>{t('Đã nhận tiền')}</Button>
                            <Button size="sm" variant="ghost" icon="x" disabled={!it.canRevoke || busy != null}
                              title={it.canRevoke ? undefined : t('Đơn nâng cấp PT: vào Đăng ký gói để xử lý')} onClick={() => setRevoking(it)}>{t('Thu hồi')}</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>

          {data.recent.length > 0 && (
            <Card title={t('Đã xử lý gần đây')} icon="scroll" flush>
              <div className="table-wrap">
                <Table caption={t('Đã xử lý gần đây')}>
                  <thead><tr><th>{t('Nội dung CK')}</th><th>{t('Số tiền')}</th><th>{t('Hội viên')}</th><th>{t('Kết quả')}</th></tr></thead>
                  <tbody>
                    {data.recent.map((it) => (
                      <tr key={it.request.id}>
                        <td className="num">{it.request.paymentCode}</td>
                        <td className="num nowrap">{fmtMoney(it.request.finalPrice ?? it.request.price)}</td>
                        <td className="small">{displayPersonName(it.request.memberName)} <span className="faint">· {it.request.memberCode}</span></td>
                        <td className="small">
                          {it.revokedAt
                            ? <><Badge tone="red">{t('Đã thu hồi')}</Badge> <span className="faint">{fmtDateTime(it.revokedAt)}</span>{it.request.decisionNote && <div className="tiny faint">{it.request.decisionNote}</div>}</>
                            : <><Badge tone="green">{t('Đã nhận tiền')}</Badge> <span className="faint">{fmtDateTime(it.reconciledAt)}{it.request.decidedByName ? ` · ${it.request.decidedByName}` : ''}</span></>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      )}
      {revoking && <RevokeModal item={revoking} onClose={() => setRevoking(null)} onDone={() => { setRevoking(null); void reload(); }} />}
    </div>
  );
}

function RevokeModal({ item, onClose, onDone }: { item: ReconcileItem; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const r = reason.trim();
  const invalid = r.length < 5 || r.length > 200;
  const submit = async () => {
    if (invalid) { setErr(t('Lý do từ 5 đến 200 ký tự')); return; }
    setBusy(true); setErr('');
    try {
      await api.put(`/payment-reconcile/${item.request.id}/revoke`, { reason: r });
      toast.success(t('Đã thu hồi gói của đơn {code}', { code: item.request.paymentCode ?? '' }));
      onDone();
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Modal title={t('Thu hồi gói – đơn {code}', { code: item.request.paymentCode ?? '' })} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t('Huỷ')}</Button>
      <Button variant="danger" icon="x" loading={busy} onClick={() => void submit()}>{t('Thu hồi gói')}</Button>
    </>}>
      <div className="stack">
        <Alert kind="warning">{t('Gói {plan} của {name} sẽ bị huỷ ngay, quà tặng kèm bị huỷ và lượt ưu đãi được trả lại. Chỉ thu hồi khi chắc chắn chưa nhận được {money}.', {
          plan: localizeText(item.request.planNameEn, item.request.planName), name: displayPersonName(item.request.memberName),
          money: fmtMoney(item.request.finalPrice ?? item.request.price),
        })}</Alert>
        <Field htmlFor="rv-reason" label={t('Lý do (hội viên sẽ thấy)')} required error={err || undefined} hint={t('{n}/200', { n: reason.length })}>
          <Textarea id="rv-reason" maxLength={200} value={reason} placeholder={t('VD: sau 2 ngày chưa thấy giao dịch GF… trong tài khoản')} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
