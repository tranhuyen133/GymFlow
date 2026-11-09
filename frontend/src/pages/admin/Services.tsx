import { useState } from 'react';
import { api } from '../../api/client';
import type { ServiceCategory, ServiceItem } from '../../api/types';
import { useToast } from '../../components/Toast';
import { Alert, Badge, Button, Card, Empty, ErrorState, Field, Input, LoadingBlock, Modal, PageHead, Table, Textarea } from '../../components/ui';
import { t } from '../../i18n';
import { fmtMoney } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  RELAX: 'Thư giãn',
  RECOVERY: 'Phục hồi',
  AMENITY: 'Tiện ích',
  NUTRITION: 'Dinh dưỡng',
  OTHER: 'Khác',
};

export default function Services() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.get<ServiceItem[]>('/admin/services'), []);
  const [editing, setEditing] = useState<ServiceItem | 'new' | null>(null);

  const toggleActive = async (s: ServiceItem) => {
    try {
      await api.put(`/admin/services/${s.id}/active`, { active: !s.active });
      toast.success(s.active ? t('Đã tạm ngừng dịch vụ') : t('Đã kích hoạt dịch vụ'));
      void reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={t('Kinh doanh')}
        title={t('Dịch vụ bổ sung')}
        desc={t('Quản lý danh mục dịch vụ (sauna, massage, tủ đồ, khăn tập, tư vấn dinh dưỡng…). Dịch vụ có thể bán lẻ hoặc tặng kèm theo gói tập.')}
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>
            {t('Thêm dịch vụ')}
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
            icon="sparkle"
            title={t('Chưa có dịch vụ nào')}
            desc={t('Thêm dịch vụ đầu tiên để bán lẻ hoặc làm quà tặng kèm theo gói tập.')}
            action={
              <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>
                {t('Thêm dịch vụ')}
              </Button>
            }
          />
        </Card>
      ) : (
        <Card flush>
          <div className="table-wrap">
            <Table caption={t('Danh sách dịch vụ bổ sung')}>
              <thead>
                <tr>
                  <th>{t('Tên dịch vụ')}</th>
                  <th>{t('Danh mục')}</th>
                  <th>{t('Giá bán lẻ')}</th>
                  <th>{t('Đặt trước')}</th>
                  <th>{t('Khung giờ phục vụ')}</th>
                  <th>{t('Trạng thái')}</th>
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.name}</b>
                      {s.description && <div className="tiny faint ellipsis" style={{ maxWidth: 280 }}>{s.description}</div>}
                    </td>
                    <td>
                      <span className="chip">{CATEGORY_LABELS[s.category] ?? s.category}</span>
                    </td>
                    <td className="num">
                      {s.unitPrice != null ? fmtMoney(s.unitPrice) : <span className="muted">{t('Chỉ tặng kèm')}</span>}
                    </td>
                    <td>
                      {s.requiresBooking ? (
                        <Badge tone="blue">{t('Cần đặt lịch')}</Badge>
                      ) : (
                        <span className="muted small">{t('Không cần')}</span>
                      )}
                    </td>
                    <td className="small">{s.openingNote || '—'}</td>
                    <td>
                      {s.active ? (
                        <Badge tone="green">{t('Đang hoạt động')}</Badge>
                      ) : (
                        <Badge tone="muted">{t('Tạm ngừng')}</Badge>
                      )}
                    </td>
                    <td className="actions">
                      <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="edit"
                          title={t('Sửa')}
                          onClick={() => setEditing(s)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={s.active ? 'ban' : 'play'}
                          title={s.active ? t('Tạm ngừng') : t('Kích hoạt')}
                          onClick={() => void toggleActive(s)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {editing && (
        <ServiceFormModal
          service={editing === 'new' ? undefined : editing}
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

function ServiceFormModal({
  service,
  onClose,
  onSaved,
}: {
  service?: ServiceItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(service?.name ?? '');
  const [category, setCategory] = useState<ServiceCategory>(service?.category ?? 'RELAX');
  const [description, setDescription] = useState(service?.description ?? '');
  const [unitPrice, setUnitPrice] = useState(service?.unitPrice != null ? String(service.unitPrice) : '');
  const [requiresBooking, setRequiresBooking] = useState(service?.requiresBooking ?? false);
  const [openingNote, setOpeningNote] = useState(service?.openingNote ?? '');
  const [active, setActive] = useState(service?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('Vui lòng nhập tên dịch vụ'));
      return;
    }
    const priceNum = unitPrice.trim() === '' ? null : Number(unitPrice);
    if (priceNum != null && (!Number.isFinite(priceNum) || priceNum < 0)) {
      setError(t('Giá dịch vụ không hợp lệ'));
      return;
    }

    setBusy(true);
    setError(null);
    const body = {
      name: trimmedName,
      category,
      description: description.trim() || null,
      unitPrice: priceNum,
      requiresBooking,
      openingNote: openingNote.trim() || null,
      active,
    };

    try {
      if (service) {
        await api.put(`/admin/services/${service.id}`, body);
      } else {
        await api.post('/admin/services', body);
      }
      toast.success(t('Đã lưu thông tin dịch vụ'));
      onSaved();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={service ? t('Sửa dịch vụ') : t('Thêm dịch vụ mới')}
      size="wide"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button variant="primary" icon="check" loading={busy} onClick={submit}>
            {t('Lưu dịch vụ')}
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        {error && <Alert kind="error">{error}</Alert>}

        <Field label={t('Tên dịch vụ')} required>
          <Input
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('VD: Xông hơi thảo dược, Tủ locker VIP, Tư vấn dinh dưỡng')}
          />
        </Field>

        <div className="row row-wrap" style={{ gap: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label={t('Danh mục')} required>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field
              label={t('Giá bán lẻ (₫/lượt)')}
              hint={unitPrice.trim() === '' ? t('Để trống = Không bán lẻ (chỉ tặng kèm)') : fmtMoney(Number(unitPrice))}
            >
              <Input
                type="number"
                min={0}
                step={5000}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder={t('Để trống nếu chỉ tặng kèm theo gói')}
              />
            </Field>
          </div>
        </div>

        <Field label={t('Mô tả dịch vụ')} hint={t('{n}/1000', { n: description.length })}>
          <Textarea
            maxLength={1000}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('Mô tả chi tiết quyền lợi dịch vụ mang lại cho hội viên')}
          />
        </Field>

        <Field label={t('Lưu ý khung giờ phục vụ')} hint={t('{n}/255', { n: openingNote.length })}>
          <Input
            maxLength={255}
            value={openingNote}
            onChange={(e) => setOpeningNote(e.target.value)}
            placeholder={t('VD: Phục vụ 09:00 - 21:00 hàng ngày, đặt trước 2 tiếng')}
          />
        </Field>

        <div className="stack" style={{ gap: 10 }}>
          <label className="check-row">
            <input
              type="checkbox"
              checked={requiresBooking}
              onChange={(e) => setRequiresBooking(e.target.checked)}
            />
            <span className="small">
              <b>{t('Cần đặt lịch trước')}</b> · {t('Hội viên cần liên hệ lễ tân để xếp lịch trước khi sử dụng')}
            </span>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="small">
              <b>{t('Kích hoạt')}</b> · {t('Dịch vụ hiển thị trên hệ thống và có thể sử dụng')}
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
