import { useMemo, useState } from 'react';
import { api } from '../../api/client';
import type { DiscountType, MembershipPlan, Promotion, PromotionGrant, ServiceItem } from '../../api/types';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Empty, ErrorState, Field, Input, LoadingBlock, Modal, PageHead, Table, Textarea } from '../../components/ui';
import { t } from '../../i18n';
import { fmtDateTime, fmtMoney } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';

export default function Promotions() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.get<Promotion[]>('/admin/promotions'), []);
  const plans = useAsync(() => api.get<MembershipPlan[]>('/plans', { includeInactive: true }), []);
  const services = useAsync(() => api.get<ServiceItem[]>('/admin/services'), []);

  const [editing, setEditing] = useState<Promotion | 'new' | null>(null);

  const planNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (plans.data ?? []).forEach((p) => map.set(p.id, p.name));
    return map;
  }, [plans.data]);

  const toggleActive = async (p: Promotion) => {
    try {
      await api.put(`/admin/promotions/${p.id}/active`, { active: !p.active });
      toast.success(p.active ? t('Đã tạm dừng ưu đãi') : t('Đã kích hoạt ưu đãi'));
      void reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={t('Kinh doanh')}
        title={t('Chương trình ưu đãi & Mã giảm giá')}
        desc={t('Quản lý mã giảm giá, chương trình khuyến mãi tự động áp dụng khi đăng ký gói tập, và các quà tặng kèm.')}
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>
            {t('Thêm ưu đãi')}
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <LoadingBlock rows={6} />
      ) : data.length === 0 ? (
        <Card>
          <Empty
            icon="trophy"
            title={t('Chưa có chương trình ưu đãi nào')}
            desc={t('Tạo mã giảm giá hoặc chương trình tự động áp dụng cho hội viên khi đăng ký gói.')}
            action={
              <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>
                {t('Thêm ưu đãi')}
              </Button>
            }
          />
        </Card>
      ) : (
        <Card flush>
          <div className="table-wrap">
            <Table caption={t('Danh sách chương trình ưu đãi')}>
              <thead>
                <tr>
                  <th>{t('Mã / Tên chương trình')}</th>
                  <th>{t('Mức ưu đãi')}</th>
                  <th>{t('Thời gian hiệu lực')}</th>
                  <th>{t('Lượt sử dụng')}</th>
                  <th>{t('Áp dụng')}</th>
                  <th>{t('Quà tặng kèm')}</th>
                  <th>{t('Trạng thái')}</th>
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {data.map((p) => {
                  const now = new Date().toISOString();
                  const isUpcoming = p.startsAt > now;
                  const isExpired = p.endsAt < now;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                          {p.code ? (
                            <span className="chip on" style={{ fontWeight: 700 }}>
                              {p.code}
                            </span>
                          ) : (
                            <span className="chip">{t('Tự áp dụng')}</span>
                          )}
                          <b>{p.name}</b>
                        </div>
                        {p.description && (
                          <div className="tiny faint ellipsis" style={{ maxWidth: 260, marginTop: 4 }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        {p.discountType === 'PERCENT' && (
                          <span className="ok" style={{ fontWeight: 700 }}>
                            {t('Giảm {n}%', { n: p.discountValue })}
                          </span>
                        )}
                        {p.discountType === 'AMOUNT' && (
                          <span className="ok" style={{ fontWeight: 700 }}>
                            {t('Giảm {amount}', { amount: fmtMoney(p.discountValue) })}
                          </span>
                        )}
                        {p.discountType === 'NONE' && (
                          <span className="muted">{t('Chỉ tặng quà')}</span>
                        )}
                      </td>
                      <td className="small nowrap">
                        {fmtDateTime(p.startsAt)}
                        <br />
                        <span className="faint">→ {fmtDateTime(p.endsAt)}</span>
                      </td>
                      <td>
                        <b>{p.usedCount}</b>
                        <span className="muted"> / {p.maxUses != null ? p.maxUses : '∞'}</span>
                      </td>
                      <td className="small">
                        {p.newMembersOnly && <Badge tone="blue">{t('Hội viên mới')}</Badge>}
                        {p.renewalOnly && <Badge tone="amber">{t('Gia hạn')}</Badge>}
                        {p.planIds && p.planIds.length > 0 ? (
                          <div className="tiny faint mt-4">
                            {p.planIds.map((id) => planNameMap.get(id) || `#${id}`).join(', ')}
                          </div>
                        ) : (
                          <div className="tiny faint mt-4">{t('Mọi gói tập')}</div>
                        )}
                      </td>
                      <td className="small">
                        {p.grants && p.grants.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: 14 }}>
                            {p.grants.map((g, idx) => (
                              <li key={idx}>
                                {t('{q} lượt {name} ({d} ngày)', {
                                  q: g.quantity,
                                  name: g.serviceName || `#${g.serviceId}`,
                                  d: g.validDays,
                                })}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="faint">—</span>
                        )}
                      </td>
                      <td>
                        {!p.active ? (
                          <Badge tone="muted">{t('Tạm dừng')}</Badge>
                        ) : isUpcoming ? (
                          <Badge tone="blue">{t('Sắp diễn ra')}</Badge>
                        ) : isExpired ? (
                          <Badge tone="red">{t('Đã kết thúc')}</Badge>
                        ) : (
                          <Badge tone="green">{t('Đang chạy')}</Badge>
                        )}
                      </td>
                      <td className="actions">
                        <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="edit"
                            title={t('Sửa')}
                            onClick={() => setEditing(p)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={p.active ? 'ban' : 'play'}
                            title={p.active ? t('Tạm dừng') : t('Kích hoạt')}
                            onClick={() => void toggleActive(p)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {editing && (
        <PromotionFormModal
          promo={editing === 'new' ? undefined : editing}
          plans={plans.data ?? []}
          services={services.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

function PromotionFormModal({
  promo,
  plans,
  services,
  onClose,
  onSaved,
}: {
  promo?: Promotion;
  plans: MembershipPlan[];
  services: ServiceItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [code, setCode] = useState(promo?.code ?? '');
  const [name, setName] = useState(promo?.name ?? '');
  const [description, setDescription] = useState(promo?.description ?? '');
  const [discountType, setDiscountType] = useState<DiscountType>(promo?.discountType ?? 'PERCENT');
  const [discountValue, setDiscountValue] = useState(promo?.discountValue != null ? String(promo.discountValue) : '10');

  // Convert LocalDateTime ISO to input datetime-local format
  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    return iso.slice(0, 16);
  };

  const defaultStart = new Date().toISOString().slice(0, 16);
  const defaultEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16);

  const [startsAt, setStartsAt] = useState(promo?.startsAt ? toLocalInput(promo.startsAt) : defaultStart);
  const [endsAt, setEndsAt] = useState(promo?.endsAt ? toLocalInput(promo.endsAt) : defaultEnd);
  const [maxUses, setMaxUses] = useState(promo?.maxUses != null ? String(promo.maxUses) : '');

  const [newMembersOnly, setNewMembersOnly] = useState(promo?.newMembersOnly ?? false);
  const [renewalOnly, setRenewalOnly] = useState(promo?.renewalOnly ?? false);
  const [stackable, setStackable] = useState(promo?.stackable ?? false);
  const [active, setActive] = useState(promo?.active ?? true);

  // Applicable plans (empty array = all plans)
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>(promo?.planIds ?? []);

  // Grants editor
  const [grants, setGrants] = useState<PromotionGrant[]>(
    promo?.grants ? promo.grants.map((g) => ({ ...g })) : []
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addGrant = () => {
    if (services.length === 0) return;
    setGrants((prev) => [
      ...prev,
      {
        serviceId: services[0].id,
        quantity: 1,
        validDays: 30,
        conditions: '',
      },
    ]);
  };

  const removeGrant = (idx: number) => {
    setGrants((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateGrant = (idx: number, patch: Partial<PromotionGrant>) => {
    setGrants((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, ...patch } : g))
    );
  };

  const togglePlan = (id: number) => {
    setSelectedPlanIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('Vui lòng nhập tên chương trình ưu đãi'));
      return;
    }
    const val = discountType === 'NONE' ? 0 : Number(discountValue);
    if (discountType === 'PERCENT' && (val < 1 || val > 100)) {
      setError(t('Phần trăm giảm giá phải từ 1 đến 100%'));
      return;
    }
    if (discountType === 'AMOUNT' && val < 0) {
      setError(t('Số tiền giảm không được âm'));
      return;
    }
    if (!startsAt || !endsAt) {
      setError(t('Vui lòng chọn thời gian bắt đầu và kết thúc'));
      return;
    }
    if (endsAt <= startsAt) {
      setError(t('Thời gian kết thúc phải sau thời gian bắt đầu'));
      return;
    }

    const maxUsesNum = maxUses.trim() === '' ? null : Number(maxUses);
    if (maxUsesNum != null && (!Number.isInteger(maxUsesNum) || maxUsesNum < 1)) {
      setError(t('Số lượt sử dụng tối đa phải từ 1 trở lên'));
      return;
    }

    setBusy(true);
    setError(null);

    const body = {
      code: code.trim().toUpperCase() || null,
      name: trimmedName,
      description: description.trim() || null,
      discountType,
      discountValue: val,
      startsAt: startsAt.length === 16 ? startsAt + ':00' : startsAt,
      endsAt: endsAt.length === 16 ? endsAt + ':00' : endsAt,
      maxUses: maxUsesNum,
      newMembersOnly,
      renewalOnly,
      stackable,
      active,
      planIds: selectedPlanIds.length > 0 ? selectedPlanIds : null,
      grants: grants.map((g) => ({
        serviceId: g.serviceId,
        quantity: g.quantity,
        validDays: g.validDays,
        conditions: g.conditions?.trim() || null,
      })),
    };

    try {
      if (promo) {
        await api.put(`/admin/promotions/${promo.id}`, body);
      } else {
        await api.post('/admin/promotions', body);
      }
      toast.success(t('Đã lưu chương trình ưu đãi'));
      onSaved();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={promo ? t('Sửa chương trình ưu đãi') : t('Thêm chương trình ưu đãi mới')}
      size="wide"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button variant="primary" icon="check" loading={busy} onClick={submit}>
            {t('Lưu ưu đãi')}
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        {error && <Alert kind="error">{error}</Alert>}

        <div className="row row-wrap" style={{ gap: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label={t('Mã ưu đãi (Code)')} hint={t('Để trống = Tự áp dụng toàn hệ thống')}>
              <Input
                maxLength={50}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t('VD: CHAOHE2026, VIPMEMBER')}
              />
            </Field>
          </div>
          <div style={{ flex: 2, minWidth: 260 }}>
            <Field label={t('Tên chương trình')} required>
              <Input
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('VD: Chào hè sôi động, Ưu đãi tân hội viên')}
              />
            </Field>
          </div>
        </div>

        <Field label={t('Mô tả')} hint={t('{n}/1000', { n: description.length })}>
          <Textarea
            maxLength={1000}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('Mô tả ngắn gọn thể lệ ưu đãi để hội viên và lễ tân nắm rõ')}
          />
        </Field>

        <div className="row row-wrap" style={{ gap: 12 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label={t('Hình thức giảm giá')} required>
              <select
                className="input"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              >
                <option value="PERCENT">{t('Theo phần trăm (%)')}</option>
                <option value="AMOUNT">{t('Theo số tiền cụ thể (₫)')}</option>
                <option value="NONE">{t('Không giảm giá (Chỉ tặng quà)')}</option>
              </select>
            </Field>
          </div>
          {discountType !== 'NONE' && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <Field
                label={discountType === 'PERCENT' ? t('Mức giảm (%)') : t('Mức giảm (₫)')}
                required
                hint={discountType === 'AMOUNT' && discountValue ? fmtMoney(Number(discountValue)) : undefined}
              >
                <Input
                  type="number"
                  min={0}
                  max={discountType === 'PERCENT' ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </Field>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label={t('Giới hạn lượt dùng')} hint={t('Để trống = Không giới hạn')}>
              <Input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder={t('VD: 100')}
              />
            </Field>
          </div>
        </div>

        <div className="row row-wrap" style={{ gap: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label={t('Thời gian bắt đầu')} required>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label={t('Thời gian kết thúc')} required>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <label className="check-row">
            <input
              type="checkbox"
              checked={newMembersOnly}
              onChange={(e) => {
                setNewMembersOnly(e.target.checked);
                if (e.target.checked) setRenewalOnly(false);
              }}
            />
            <span className="small">
              <b>{t('Chỉ áp dụng cho hội viên mới')}</b> ({t('Chưa từng đăng ký gói nào trước đây')})
            </span>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={renewalOnly}
              onChange={(e) => {
                setRenewalOnly(e.target.checked);
                if (e.target.checked) setNewMembersOnly(false);
              }}
            />
            <span className="small">
              <b>{t('Chỉ áp dụng khi gia hạn gói')}</b> ({t('Đã từng có ít nhất một gói trước đó')})
            </span>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={stackable}
              onChange={(e) => setStackable(e.target.checked)}
            />
            <span className="small">
              <b>{t('Cho phép cộng dồn')}</b> ({t('Có thể dùng chung với các ưu đãi tự áp dụng')})
            </span>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="small">
              <b>{t('Kích hoạt')}</b>
            </span>
          </label>
        </div>

        {/* Áp dụng gói nào */}
        <Card title={t('Gói tập áp dụng')} icon="ticket" flush>
          <div style={{ padding: 12 }}>
            <p className="tiny muted" style={{ margin: '0 0 10px 0' }}>
              {selectedPlanIds.length === 0
                ? t('Đang áp dụng cho TẤT CẢ các gói tập. Chọn bên dưới nếu chỉ muốn áp dụng cho một số gói.')
                : t('Đã chọn {n} gói áp dụng:', { n: selectedPlanIds.length })}
            </p>
            <div className="row row-wrap" style={{ gap: 8 }}>
              {plans.map((p) => {
                const isSelected = selectedPlanIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`chip ${isSelected ? 'on' : ''}`}
                    onClick={() => togglePlan(p.id)}
                  >
                    <Icon name={isSelected ? 'check' : 'plus'} size={12} />
                    {p.name}
                  </button>
                );
              })}
            </div>
            {selectedPlanIds.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Button size="sm" variant="ghost" onClick={() => setSelectedPlanIds([])}>
                  {t('Áp dụng cho tất cả gói')}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Quà tặng kèm */}
        <Card
          title={t('Quà tặng dịch vụ kèm theo')}
          icon="sparkle"
          flush
          actions={
            <Button size="sm" variant="secondary" icon="plus" onClick={addGrant}>
              {t('Thêm quà tặng')}
            </Button>
          }
        >
          <div style={{ padding: 12 }}>
            {grants.length === 0 ? (
              <p className="tiny muted" style={{ margin: 0 }}>
                {t('Chưa có quà tặng dịch vụ kèm theo ưu đãi này.')}
              </p>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {grants.map((g, idx) => (
                  <div
                    key={idx}
                    className="row row-wrap"
                    style={{
                      gap: 8,
                      alignItems: 'center',
                      background: 'var(--surface-2)',
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ flex: 2, minWidth: 150 }}>
                      <select
                        className="input"
                        value={g.serviceId}
                        onChange={(e) => updateGrant(idx, { serviceId: Number(e.target.value) })}
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ width: 80 }}>
                      <Input
                        type="number"
                        min={1}
                        value={g.quantity}
                        onChange={(e) => updateGrant(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                        title={t('Số lượt tặng')}
                        placeholder={t('Lượt')}
                      />
                    </div>

                    <div style={{ width: 100 }}>
                      <Input
                        type="number"
                        min={1}
                        value={g.validDays}
                        onChange={(e) => updateGrant(idx, { validDays: Math.max(1, Number(e.target.value)) })}
                        title={t('Hạn dùng (ngày)')}
                        placeholder={t('Số ngày')}
                      />
                    </div>

                    <div style={{ flex: 2, minWidth: 140 }}>
                      <Input
                        value={g.conditions ?? ''}
                        onChange={(e) => updateGrant(idx, { conditions: e.target.value })}
                        placeholder={t('Điều kiện (VD: trong giờ vàng)')}
                      />
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      icon="trash"
                      title={t('Xoá quà tặng')}
                      onClick={() => removeGrant(idx)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
}
