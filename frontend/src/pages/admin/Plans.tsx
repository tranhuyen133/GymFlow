import { useMemo, useState } from 'react';
import { api } from '../../api/client';
import type { MembershipPlan, PlanServiceGrant, ServiceItem } from '../../api/types';
import { Icon } from '../../components/Icon';
import { PlanCard, pickBest, savings } from '../../components/PlanCard';
import { useToast } from '../../components/Toast';
import { PickCard } from '../../components/PaymentQr';
import { Alert, Badge, Button, Card, Confirm, Empty, ErrorState, Field, Input, LoadingBlock, Modal, PageHead, Segmented, Textarea } from '../../components/ui';
import { durationLabel, fmtMoney } from '../../lib/format';
import { errMsg, fieldErrs, useAsync } from '../../lib/hooks';
import { TITLE_RE } from '../../lib/validation';
import { t } from '../../i18n';
import { PtOverview } from '../../components/PtOverview';

type View = 'all' | 'active' | 'inactive';

export default function Plans() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.get<MembershipPlan[]>('/plans', { includeInactive: true }), []);
  const [editing, setEditing] = useState<MembershipPlan | 'new' | null>(null);
  const [removing, setRemoving] = useState<MembershipPlan | null>(null);
  const [view, setView] = useState<View>('all');

  const sorted = useMemo(() => [...(data ?? [])].sort((a, b) => Number(b.active) - Number(a.active) || a.durationDays - b.durationDays || a.price - b.price), [data]);
  const onSale = sorted.filter((p) => p.active);
  const save = useMemo(() => savings(onSale), [onSale]);
  const best = useMemo(() => pickBest(onSale), [onSale]);
  const shown = sorted.filter((p) => view === 'all' || (view === 'active' ? p.active : !p.active));
  const users = sorted.reduce((s, p) => s + p.currentSubscriptions, 0);
  const maxUsers = Math.max(1, ...sorted.map((p) => p.currentSubscriptions));
  const top = [...sorted].sort((a, b) => b.currentSubscriptions - a.currentSubscriptions)[0];
  const missingSessionsPlans = sorted.filter((p) => (p.planType === 'GYM_PT' || p.includesTrainer) && !p.ptSessions);

  const toggle = async (p: MembershipPlan) => {
    try { await api.put(`/plans/${p.id}/active`, { active: !p.active }); toast.success(p.active ? 'Đã ngừng bán gói' : 'Đã mở bán lại'); void reload(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="page">
      <PageHead eyebrow="Kinh doanh" title="Gói tập" desc="Đổi giá không ảnh hưởng gói đã bán (số tiền thực thu lưu riêng). Gói đã có người mua chỉ ngừng bán, không xoá."
        actions={<Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Thêm gói</Button>} />
      {error ? <ErrorState message={error} onRetry={reload} /> : loading || !data ? <LoadingBlock rows={6} /> : data.length === 0 ? (
        <Card><Empty icon="ticket" title="Chưa có gói tập" desc="Tạo gói đầu tiên để hội viên đăng ký trên ứng dụng và trang chủ." action={<Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Thêm gói</Button>} /></Card>
      ) : (
        <>
          {missingSessionsPlans.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <Alert kind="warning">
                {t('Có {n} gói PT chưa khai báo số buổi PT ({names}). Vui lòng bấm Sửa để bổ sung số buổi và thời hạn dùng buổi.', {
                  n: missingSessionsPlans.length,
                  names: missingSessionsPlans.map((p) => p.name).join(', ')
                })}
              </Alert>
            </div>
          )}
          <div className="plan-stats">
            <div className="plan-stat"><span className="tiny muted">{t('Đang bán')}</span><b>{onSale.length}</b></div>
            <div className="plan-stat"><span className="tiny muted">{t('Ngừng bán')}</span><b>{sorted.length - onSale.length}</b></div>
            <div className="plan-stat"><span className="tiny muted">{t('Hội viên đang dùng')}</span><b>{users}</b></div>
            <div className="plan-stat"><span className="tiny muted">{t('Bán chạy nhất')}</span><b className="ellipsis" style={{ fontSize: 16, lineHeight: '29px' }}>{top && top.currentSubscriptions > 0 ? t(top.name) : '—'}</b></div>
          </div>
          <div className="row between row-wrap" style={{ marginBottom: 14, gap: 10 }}>
            <Segmented value={view} onChange={(v) => setView(v)} options={[
              { value: 'all', label: t('Tất cả ({n})', { n: sorted.length }) },
              { value: 'active', label: t('Đang bán ({n})', { n: onSale.length }) },
              { value: 'inactive', label: t('Ngừng bán ({n})', { n: sorted.length - onSale.length }) },
            ]} />
            {best != null && <span className="tiny faint">{t('Gói "Phổ biến nhất" được chọn tự động: gói tiết kiệm nhiều nhất, trừ gói dài nhất. Trang chủ hiển thị giống hệt.')}</span>}
          </div>
          {shown.length === 0 ? <Card><Empty icon="ticket" title="Không có gói nào trong mục này" /></Card> : (
            <div className="plan-grid">
              {shown.map((p) => (
                <PlanCard key={p.id} plan={p} best={p.id === best} saving={p.active ? save.get(p.id) : undefined} className={p.active ? '' : 'inactive'}
                  badge={
                    <div className="row" style={{ gap: 4 }}>
                      {p.active ? <Badge tone="green">Đang bán</Badge> : <Badge tone="muted">Ngừng bán</Badge>}
                      {(p.planType === 'GYM_PT' || p.includesTrainer) && !p.ptSessions && (
                        <Badge tone="amber">Thiếu số buổi</Badge>
                      )}
                    </div>
                  }
                  footer={
                    <div className="plan-admin-foot">
                      <div className="stack-sm" style={{ gap: 4, flex: 1, minWidth: 0 }}>
                        <span className="small"><b className="num">{p.currentSubscriptions}</b> <span className="muted">{t('đang dùng')}</span></span>
                        <div className="meter"><i style={{ width: `${(p.currentSubscriptions / maxUsers) * 100}%` }} /></div>
                      </div>
                      <div className="row" style={{ gap: 2 }}>
                        <Button size="sm" variant="ghost" icon="edit" aria-label="Sửa" title="Sửa" onClick={() => setEditing(p)} />
                        <Button size="sm" variant="ghost" icon={p.active ? 'ban' : 'play'} aria-label={p.active ? 'Ngừng bán' : 'Mở bán'} title={p.active ? 'Ngừng bán' : 'Mở bán'} onClick={() => void toggle(p)} />
                        <Button size="sm" variant="ghost" icon="trash" aria-label="Xoá" title={p.currentSubscriptions > 0 ? 'Gói đã có người mua, chỉ ngừng bán được' : 'Xoá'} disabled={p.currentSubscriptions > 0} onClick={() => setRemoving(p)} />
                      </div>
                    </div>
                  } />
              ))}
            </div>
          )}
        </>
      )}
      {data && data.length > 0 && <PtOverview />}
      {editing && <PlanForm plan={editing === 'new' ? undefined : editing} others={sorted.filter((p) => editing === 'new' || p.id !== editing.id)}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void reload(); }} />}
      {removing && <Confirm danger title="Xoá gói tập?" confirmText="Xoá" onClose={() => setRemoving(null)}
        message={t('Chỉ xoá được gói chưa từng bán. Nếu "{name}" đã có người đăng ký, hãy chọn Ngừng bán.', { name: removing.name })}
        onConfirm={async () => { try { await api.del(`/plans/${removing.id}`); toast.success('Đã xoá gói'); void reload(); } catch (e) { toast.error(errMsg(e)); throw e; } }} />}
    </div>
  );
}

const DURATIONS = [30, 90, 180, 365];

function PlanForm({ plan, others, onClose, onSaved }: { plan?: MembershipPlan; others: MembershipPlan[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const services = useAsync(() => api.get<ServiceItem[]>('/admin/services'), []);
  const [f, setF] = useState({ name: plan?.name ?? '', description: plan?.description ?? '', price: String(plan?.price ?? ''), durationDays: String(plan?.durationDays ?? 30), benefits: plan?.benefits ?? '' });
  const [pt, setPt] = useState(plan?.planType === 'GYM_PT' || (plan?.includesTrainer ?? false));
  const [ptSessions, setPtSessions] = useState(plan?.ptSessions != null ? String(plan.ptSessions) : '12');
  const [ptValidDays, setPtValidDays] = useState(plan?.ptValidDays != null ? String(plan.ptValidDays) : String(plan?.durationDays ?? 30));
  const [code, setCode] = useState(plan?.code ?? '');
  const [usageTerms, setUsageTerms] = useState(plan?.usageTerms ?? '');
  const [ptMinutes, setPtMinutes] = useState(plan?.ptSessionMinutes != null ? String(plan.ptSessionMinutes) : '');
  const [ptNotice, setPtNotice] = useState(plan?.ptCancelNoticeHours != null ? String(plan.ptCancelNoticeHours) : '');
  const [serviceGrants, setServiceGrants] = useState<PlanServiceGrant[]>(
    plan?.serviceGrants ? plan.serviceGrants.map((g) => ({ ...g })) : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => { setF((x) => ({ ...x, [k]: v })); if (errors[k]) setErrors((x) => ({ ...x, [k]: '' })); };
  const price = Number(f.price); const days = Number(f.durationDays);
  const preview = {
    name: f.name.trim() || t('Tên gói'),
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    durationDays: days > 0 ? days : 1,
    description: f.description.trim() || null,
    benefits: f.benefits,
    includesTrainer: pt,
    planType: pt ? ('GYM_PT' as const) : ('GYM' as const),
    ptSessions: pt ? Number(ptSessions) : null,
    ptValidDays: pt ? Number(ptValidDays) : null,
    serviceGrants,
  };
  const previewSave = savings([...others.filter((p) => p.active), preview]).get(undefined);

  const addGrant = () => {
    const list = services.data ?? [];
    if (list.length === 0) return;
    setServiceGrants((prev) => [
      ...prev,
      {
        serviceId: list[0].id,
        serviceName: list[0].name,
        quantity: 1,
        validDays: days > 0 ? days : 30,
        conditions: '',
      },
    ]);
  };

  const removeGrant = (idx: number) => {
    setServiceGrants((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateGrant = (idx: number, patch: Partial<PlanServiceGrant>) => {
    setServiceGrants((prev) =>
      prev.map((g, i) => {
        if (i !== idx) return g;
        const next = { ...g, ...patch };
        if (patch.serviceId != null) {
          const found = (services.data ?? []).find((s) => s.id === patch.serviceId);
          if (found) next.serviceName = found.name;
        }
        return next;
      })
    );
  };

  const submit = async () => {
    const v: Record<string, string> = {};
    const name = f.name.trim().replace(/\s+/g, ' ');
    if (!name) v.name = 'Nhập tên gói';
    else if (!TITLE_RE.test(name)) v.name = 'Tên gói phải có chữ cái (có thể kèm số), VD: Gói 3 tháng';
    else if (others.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())) v.name = 'Đã có gói trùng tên';
    if (f.price === '' || !Number.isFinite(price) || price < 0) v.price = 'Giá không hợp lệ';
    if (!Number.isInteger(days) || days < 1 || days > 1095) v.durationDays = 'Từ 1 đến 1095 ngày';
    if (pt) {
      const sess = Number(ptSessions);
      const vdays = Number(ptValidDays);
      if (!Number.isInteger(sess) || sess < 1 || sess > 200) v.ptSessions = 'Số buổi PT từ 1 đến 200';
      if (!Number.isInteger(vdays) || vdays < 1 || vdays > 1095) v.ptValidDays = 'Thời hạn buổi từ 1 đến 1095 ngày';
      if (ptMinutes !== '' && (!Number.isInteger(Number(ptMinutes)) || Number(ptMinutes) < 15 || Number(ptMinutes) > 240)) v.ptSessionMinutes = 'Từ 15 đến 240 phút';
      if (ptNotice !== '' && (!Number.isInteger(Number(ptNotice)) || Number(ptNotice) < 0 || Number(ptNotice) > 168)) v.ptCancelNoticeHours = 'Từ 0 đến 168 giờ';
    }
    if (code.trim() && !/^[A-Za-z0-9_-]{1,30}$/.test(code.trim())) v.code = 'Chữ không dấu, số, - và _ (tối đa 30 ký tự)';
    setErrors(v); setError(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    const body = {
      ...f,
      name,
      description: f.description.trim(),
      benefits: f.benefits.split(/[,\n]/).map((b) => b.trim()).filter(Boolean).join(', '),
      price,
      durationDays: days,
      planType: pt ? 'GYM_PT' : 'GYM',
      includesTrainer: pt,
      ptSessions: pt ? Number(ptSessions) : null,
      ptValidDays: pt ? Number(ptValidDays) : null,
      code: code.trim() ? code.trim().toUpperCase() : null,
      usageTerms: usageTerms.trim() || null,
      ptSessionMinutes: pt && ptMinutes !== '' ? Number(ptMinutes) : null,
      ptCancelNoticeHours: pt && ptNotice !== '' ? Number(ptNotice) : null,
      serviceGrants: serviceGrants.map((g) => ({
        serviceId: g.serviceId,
        quantity: g.quantity,
        validDays: g.validDays,
        conditions: g.conditions?.trim() || null,
      })),
    };
    try {
      if (plan) await api.put(`/plans/${plan.id}`, body); else await api.post('/plans', body);
      toast.success('Đã lưu gói tập'); onSaved();
    } catch (e) { setError(errMsg(e)); setErrors(fieldErrs(e)); } finally { setBusy(false); }
  };
  return (
    <Modal title={plan ? 'Sửa gói tập' : 'Thêm gói tập'} size="wide" onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>Huỷ</Button>
      <Button variant="primary" icon="check" loading={busy} onClick={submit}>Lưu</Button>
    </>}>
      <div className="plan-form">
        <div className="stack">
          {error && <Alert kind="error">{error}</Alert>}
          {plan && plan.currentSubscriptions > 0 && <Alert kind="info">{t('{n} hội viên đang dùng gói này. Giá mới chỉ áp dụng cho lần đăng ký sau.', { n: plan.currentSubscriptions })}</Alert>}
          <div className="form-grid">
            <Field label="Tên gói" error={errors.name} required className="span-2"><Input maxLength={100} value={f.name} invalid={!!errors.name} onChange={(e) => set('name', e.target.value)} placeholder="VD: Gói 3 tháng" /></Field>
            <Field label="Mã gói" error={errors.code} hint={t('Chữ không dấu, số, - và _ (tối đa 30 ký tự)')}>
              <Input maxLength={30} value={code} invalid={!!errors.code} placeholder="VD: PT12-3T"
                onChange={(e) => { setCode(e.target.value); if (errors.code) setErrors((x) => ({ ...x, code: '' })); }} />
            </Field>
            <Field label="Giá (₫)" error={errors.price} required hint={f.price && !errors.price ? fmtMoney(price) : undefined}>
              <Input type="number" inputMode="numeric" min={0} step={10000} value={f.price} invalid={!!errors.price} onChange={(e) => set('price', e.target.value)} />
            </Field>
            <Field label="Thời hạn (ngày)" error={errors.durationDays} required hint={days > 0 ? durationLabel(days) : undefined}>
              <Input type="number" inputMode="numeric" min={1} max={1095} value={f.durationDays} invalid={!!errors.durationDays} onChange={(e) => set('durationDays', e.target.value)} />
            </Field>
            <div className="span-2 chips" role="group" aria-label={t('Chọn nhanh thời hạn')}>
              {DURATIONS.map((d) => <button key={d} type="button" className={`chip ${days === d ? 'on' : ''}`} onClick={() => set('durationDays', String(d))}>{durationLabel(d)}</button>)}
            </div>
            <Field label="Mô tả" className="span-2" hint={t('{n}/500', { n: f.description.length })}><Textarea maxLength={500} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="VD: Phù hợp người mới, tập không giới hạn giờ mở cửa" /></Field>
            <Field label="Phân loại gói" className="span-2">
              <div className="pick-grid" role="radiogroup" aria-label={t('Phân loại gói')}>
                <PickCard on={!pt} onClick={() => setPt(false)} icon="user" title={t('Gói Gym (Tự tập)')} sub={t('Hội viên tự soạn giáo án từ thư viện bài tập và tự xếp lịch')} />
                <PickCard on={pt} onClick={() => setPt(true)} icon="badge" title={t('Gói Gym + PT (Có HLV)')} sub={t('Kèm số buổi HLV 1-1; HLV soạn giáo án, xếp lịch')} />
              </div>
            </Field>
            {pt && (
              <>
                <Field label="Số buổi PT" error={errors.ptSessions} required hint="Từ 1 đến 200 buổi">
                  <Input type="number" inputMode="numeric" min={1} max={200} value={ptSessions} invalid={!!errors.ptSessions}
                    onChange={(e) => { setPtSessions(e.target.value); if (errors.ptSessions) setErrors((x) => ({ ...x, ptSessions: '' })); }} />
                </Field>
                <Field label="Thời hạn dùng buổi PT (ngày)" error={errors.ptValidDays} required hint="Từ 1 đến 1095 ngày">
                  <Input type="number" inputMode="numeric" min={1} max={1095} value={ptValidDays} invalid={!!errors.ptValidDays}
                    onChange={(e) => { setPtValidDays(e.target.value); if (errors.ptValidDays) setErrors((x) => ({ ...x, ptValidDays: '' })); }} />
                </Field>
                <Field label="Thời lượng mỗi buổi PT (phút)" error={errors.ptSessionMinutes} hint={t('Để trống nếu chưa áp dụng')}>
                  <Input type="number" inputMode="numeric" min={15} max={240} value={ptMinutes} invalid={!!errors.ptSessionMinutes}
                    onChange={(e) => { setPtMinutes(e.target.value); if (errors.ptSessionMinutes) setErrors((x) => ({ ...x, ptSessionMinutes: '' })); }} />
                </Field>
                <Field label="Báo huỷ/dời trước (giờ)" error={errors.ptCancelNoticeHours} hint={t('Để trống nếu chưa áp dụng')}>
                  <Input type="number" inputMode="numeric" min={0} max={168} value={ptNotice} invalid={!!errors.ptCancelNoticeHours}
                    onChange={(e) => { setPtNotice(e.target.value); if (errors.ptCancelNoticeHours) setErrors((x) => ({ ...x, ptCancelNoticeHours: '' })); }} />
                </Field>
              </>
            )}
            {plan && plan.includesTrainer && !pt && plan.currentSubscriptions > 0 && (
              <div className="span-2"><Alert kind="warning">{t('Hội viên đang dùng gói này vẫn giữ HLV hiện tại. Đổi HLV ở hồ sơ từng hội viên nếu cần.')}</Alert></div>
            )}
            <Field label="Quyền lợi" hint="Mỗi dòng hoặc dấu phẩy là một quyền lợi" className="span-2"><Textarea maxLength={1000} rows={4} value={f.benefits} onChange={(e) => set('benefits', e.target.value)} placeholder={'Tủ đồ cá nhân\nNước uống miễn phí\n1 buổi PT'} /></Field>
            <Field label="Điều kiện sử dụng" className="span-2" hint={t('{n}/1000', { n: usageTerms.length })}>
              <Textarea maxLength={1000} rows={3} value={usageTerms} onChange={(e) => setUsageTerms(e.target.value)}
                placeholder="VD: Đặt lịch PT trước 24 giờ. Đổi HLV tại quầy lễ tân." />
            </Field>

            {/* Quà tặng dịch vụ kèm theo */}
            <div className="span-2">
              <div className="row between row-wrap" style={{ alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  <Icon name="sparkle" size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                  {t('Quà tặng kèm theo gói')}
                </span>
                <Button size="sm" variant="secondary" icon="plus" onClick={addGrant}>
                  {t('Thêm quà tặng')}
                </Button>
              </div>
              {serviceGrants.length === 0 ? (
                <div className="tiny muted" style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 8 }}>
                  {t('Chưa có dịch vụ tặng kèm theo gói này. Bấm "Thêm quà tặng" để tặng kèm lượt xông hơi, massage, tủ đồ…')}
                </div>
              ) : (
                <div className="stack" style={{ gap: 8 }}>
                  {serviceGrants.map((g, idx) => (
                    <div key={idx} className="row row-wrap" style={{ gap: 8, alignItems: 'center', background: 'var(--surface-2)', padding: 8, borderRadius: 8 }}>
                      <div style={{ flex: 2, minWidth: 140 }}>
                        <select className="input" value={g.serviceId} onChange={(e) => updateGrant(idx, { serviceId: Number(e.target.value) })}>
                          {(services.data ?? []).map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ width: 75 }}>
                        <Input type="number" min={1} value={g.quantity} onChange={(e) => updateGrant(idx, { quantity: Math.max(1, Number(e.target.value)) })} title={t('Số lượt')} placeholder={t('Lượt')} />
                      </div>
                      <div style={{ width: 95 }}>
                        <Input type="number" min={1} value={g.validDays} onChange={(e) => updateGrant(idx, { validDays: Math.max(1, Number(e.target.value)) })} title={t('Hạn dùng (ngày)')} placeholder={t('Số ngày')} />
                      </div>
                      <div style={{ flex: 2, minWidth: 130 }}>
                        <Input value={g.conditions ?? ''} onChange={(e) => updateGrant(idx, { conditions: e.target.value })} placeholder={t('Điều kiện sử dụng')} />
                      </div>
                      <Button size="sm" variant="ghost" icon="trash" title={t('Xoá')} onClick={() => removeGrant(idx)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="plan-preview">
          <span className="tiny muted">{t('Xem trước trên trang chủ')}</span>
          <PlanCard plan={preview} saving={previewSave} badge={plan && !plan.active ? <Badge tone="muted">Ngừng bán</Badge> : undefined} />
        </div>
      </div>
    </Modal>
  );
}
