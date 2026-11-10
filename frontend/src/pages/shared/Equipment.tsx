/**
 * V18 · Dụng cụ tập: phân loại theo nhóm (Tạ tự do, Máy tập, Cáp, Trọng lượng cơ thể, Cardio, Phụ kiện, Phục hồi).
 * Lấy số bài tập từ API /equipment, mở trang chi tiết /equipment/:key.
 * Admin và HLV có thể quản lý nội dung.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Equipment, EquipmentCategory } from '../../api/types';
import { ExerciseMedia, mediaCredit } from '../../components/ExerciseMedia';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Badge, Button, ErrorState, LoadingBlock, Modal, PageHead, SearchInput } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { t } from '../../i18n';
import { MUSCLE_BY_KEY, type MuscleKey } from '../../lib/anatomy';
import { errMsg, useAsync } from '../../lib/hooks';
import './kb.css';

const CATEGORIES: { key: EquipmentCategory; label: string; desc: string }[] = [
  { key: 'FREE_WEIGHT', label: 'Tạ tự do', desc: 'Thanh đòn, tạ đơn, tạ ấm, thanh EZ và bánh tạ phát triển sức mạnh đa khớp.' },
  { key: 'MACHINE', label: 'Máy tập khối tạ', desc: 'Máy có ray trượt cố định và chốt tạ an toàn, tối ưu cho người mới và tập cô lập cơ.' },
  { key: 'CABLE', label: 'Máy kéo cáp', desc: 'Hệ thống ròng rọc tạo lực căng liên tục, linh hoạt điều chỉnh mọi góc kéo.' },
  { key: 'BODYWEIGHT', label: 'Trọng lượng cơ thể', desc: 'Tập luyện với chính trọng lượng bản thân, xà đơn, xà kép và thảm tập.' },
  { key: 'CARDIO', label: 'Máy tim mạch', desc: 'Máy chạy bộ, xe đạp, máy chèo thuyền nâng cao sức bền tim phổi và đốt năng lượng.' },
  { key: 'ACCESSORY', label: 'Phụ kiện tập luyện', desc: 'Ghế tập, dây kháng lực đàn hồi, bóng tạ và dụng cụ thể lực chuyên biệt.' },
  { key: 'RECOVERY', label: 'Phục hồi & giãn cơ', desc: 'Con lăn bọt Foam Roller và phụ kiện giải phóng mạc cơ sau buổi tập.' },
];

export default function EquipmentPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'TRAINER';
  const toast = useToast();

  const [showHidden, setShowHidden] = useState(false);
  const [editing, setEditing] = useState<Equipment | 'new' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, error, loading, reload } = useAsync(
    () => api.get<Equipment[]>('/equipment', { includeHidden: isStaff && showHidden }),
    [isStaff, showHidden]
  );

  const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

  const filteredData = useMemo(() => {
    let list = data ?? [];
    if (selectedCategory) {
      list = list.filter((eq) => eq.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = fold(searchQuery.trim());
      list = list.filter((eq) => fold(eq.name).includes(q) || fold(eq.key).includes(q) || (eq.shortDesc && fold(eq.shortDesc).includes(q)));
    }
    return list;
  }, [data, selectedCategory, searchQuery]);

  const byCategory = useMemo(() => {
    const map = new Map<EquipmentCategory, Equipment[]>();
    CATEGORIES.forEach((c) => map.set(c.key, []));
    filteredData.forEach((eq) => {
      const list = map.get(eq.category) ?? [];
      list.push(eq);
      map.set(eq.category, list);
    });
    return map;
  }, [filteredData]);

  const toggleHidden = async (eq: Equipment) => {
    try {
      await api.put(`/equipment/${eq.key}/hidden`, { hidden: !eq.hidden });
      toast.success(eq.hidden ? t('Đã hiện dụng cụ') : t('Đã ẩn dụng cụ'));
      void reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={t('Kho kiến thức')}
        title={t('Dụng cụ tập')}
        desc={t('Danh mục dụng cụ tại phòng tập, công dụng, cách sử dụng chuẩn và các bài tập đi kèm. Bấm vào từng dụng cụ để xem chi tiết.')}
        actions={isStaff ? (
          <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
            <label className="checkbox-label small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
              <span>{t('Hiện dụng cụ đang ẩn')}</span>
            </label>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setEditing('new')}
            >
              <Icon name="plus" size={14} />
              <span>{t('Thêm dụng cụ')}</span>
            </button>
          </div>
        ) : undefined}
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingBlock rows={6} />
      ) : (
        <>
          <div className="toolbar mt-16" style={{ alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('Tìm kiếm thiết bị theo tên, mô tả…')}
              />
            </div>
            {searchQuery && (
              <Button variant="ghost" size="sm" icon="x" onClick={() => setSearchQuery('')}>
                {t('Xoá tìm kiếm')}
              </Button>
            )}
          </div>

          <div className="chips mt-12 mb-20">
            <button
              type="button"
              className={`chip ${selectedCategory === '' ? 'on' : ''}`}
              onClick={() => setSelectedCategory('')}
            >
              {t('Tất cả ({n})', { n: data?.length ?? 0 })}
            </button>
            {CATEGORIES.map((cat) => {
              const totalInCat = (data ?? []).filter((eq) => eq.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`chip ${selectedCategory === cat.key ? 'on' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.key ? '' : cat.key)}
                >
                  {t(cat.label)} ({totalInCat})
                </button>
              );
            })}
          </div>

          <div className="eq-categories-container">
            {CATEGORIES.filter((cat) => !selectedCategory || cat.key === selectedCategory).map((cat) => {
              const items = byCategory.get(cat.key) ?? [];
              if (items.length === 0 && !isStaff && selectedCategory !== cat.key) return null;

              return (
                <section key={cat.key} className="eq-cat-section mb-28">
                  <div className="eq-cat-header mb-12">
                    <div className="row between wrap" style={{ alignItems: 'baseline' }}>
                      <h2 className="section-title" style={{ margin: 0 }}>
                        <span>{t(cat.label)}</span>
                        <span className="tiny faint ml-8">({items.length})</span>
                      </h2>
                    </div>
                    <p className="tiny muted mt-2" style={{ margin: 0 }}>{t(cat.desc)}</p>
                  </div>

                  {items.length === 0 ? (
                    <div className="card p-12 text-center faint tiny">{t('Chưa có dụng cụ trong nhóm này')}</div>
                  ) : (
                    <div className="kb-grid">
                      {items.map((x) => (
                        <article key={x.key} className="kb-card">
                          <Link
                            to={`/equipment/${x.key}`}
                            className="kb-cover"
                            aria-label={t('Xem chi tiết {name}', { name: t(x.name) })}
                          >
                            <ExerciseMedia
                              imageKey={x.imageKey}
                              alt={t(x.name)}
                              playOnHover
                              tag={t('{n} bài tập', { n: x.exerciseCount ?? 0 })}
                            />
                          </Link>
                          <div className="kb-body">
                            <div className="row between wrap" style={{ gap: 6, alignItems: 'flex-start' }}>
                              <div>
                                <h3 className="kb-title">
                                  <Link to={`/equipment/${x.key}`} className="plain-link">
                                    {t(x.name)}
                                  </Link>
                                </h3>
                                <div className="tiny faint">{x.key}</div>
                              </div>
                              <div className="row" style={{ gap: 4 }}>
                                {x.hidden && <Badge tone="amber">{t('Đang ẩn')}</Badge>}
                              </div>
                            </div>

                            <p className="small muted kb-desc line-clamp-3">{x.shortDesc ? t(x.shortDesc) : ''}</p>

                            {x.targetMuscleKeys && x.targetMuscleKeys.length > 0 && (
                              <div className="chips mt-6 mb-8">
                                {x.targetMuscleKeys.slice(0, 3).map((k) => (
                                  <span key={k} className="chip tiny">
                                    {t(MUSCLE_BY_KEY.get(k as MuscleKey)?.label ?? k)}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="row between mt-auto pt-8 wrap gap-6" style={{ borderTop: '1px solid var(--hairline-soft)' }}>
                              <div className="row gap-4 wrap">
                                <Link to={`/equipment/${x.key}`} className="btn btn-secondary btn-sm kb-cta">
                                  <span>{t('Xem chi tiết')}</span>
                                  <Icon name="arrowRight" size={14} />
                                </Link>
                                <Link
                                  to={`/exercises?equipment=${x.key}`}
                                  className="btn btn-ghost btn-sm"
                                  title={t('Xem bài tập dùng thiết bị này')}
                                >
                                  <Icon name="dumbbell" size={14} className="mr-4" />
                                  <span>{t('{n} bài tập', { n: x.exerciseCount ?? 0 })}</span>
                                </Link>
                              </div>

                              {isStaff && (
                                <div className="row" style={{ gap: 4 }}>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    title={x.hidden ? t('Hiện') : t('Ẩn')}
                                    onClick={() => toggleHidden(x)}
                                  >
                                    <Icon name={x.hidden ? 'eye' : 'eyeOff'} size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    title={t('Sửa')}
                                    onClick={() => setEditing(x)}
                                  >
                                    <Icon name="edit" size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      {editing && (
        <EquipmentModal
          equipment={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void reload(); }}
        />
      )}

      <p className="tiny faint mt-24">{mediaCredit()}</p>
    </div>
  );
}

function EquipmentModal({
  equipment,
  onClose,
  onSaved,
}: {
  equipment: Equipment | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const isNew = !equipment;

  const [key, setKey] = useState(equipment?.key ?? '');
  const [name, setName] = useState(equipment?.name ?? '');
  const [category, setCategory] = useState<EquipmentCategory>(equipment?.category ?? 'FREE_WEIGHT');
  const [shortDesc, setShortDesc] = useState(equipment?.shortDesc ?? '');
  const [usageGuide, setUsageGuide] = useState(equipment?.usageGuide ?? '');
  const [safetyNotes, setSafetyNotes] = useState(equipment?.safetyNotes ?? '');
  const [targetMuscles, setTargetMuscles] = useState(equipment?.targetMuscleKeys?.join(', ') ?? '');
  const [imageKey, setImageKey] = useState(equipment?.imageKey ?? '');
  const [sortOrder, setSortOrder] = useState(equipment?.sortOrder ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error(t('Vui lòng nhập tên dụng cụ')); return; }
    if (isNew && !key.trim()) { toast.error(t('Vui lòng nhập mã định danh (key)')); return; }

    setSaving(true);
    try {
      const payload = {
        key: key.trim().toLowerCase(),
        name: name.trim(),
        category,
        shortDesc: shortDesc.trim() || null,
        usageGuide: usageGuide.trim() || null,
        safetyNotes: safetyNotes.trim() || null,
        targetMuscleKeys: targetMuscles.split(',').map((s) => s.trim()).filter(Boolean),
        imageKey: imageKey.trim() || null,
        sortOrder: Number(sortOrder) || 0,
      };

      if (isNew) {
        await api.post('/equipment', payload);
        toast.success(t('Đã thêm dụng cụ mới'));
      } else {
        await api.put(`/equipment/${equipment.key}`, payload);
        toast.success(t('Đã cập nhật dụng cụ'));
      }
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isNew ? t('Thêm dụng cụ tập mới') : t('Chỉnh sửa dụng cụ: {name}', { name: t(equipment.name) })} onClose={onClose} size="wide">
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="form-group flex-1">
            <label className="label">{t('Mã định danh (key)')}</label>
            <input
              type="text"
              className="input"
              value={key}
              disabled={!isNew}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="vd: smith-machine, ez-bar"
              required
            />
          </div>
          <div className="form-group flex-1">
            <label className="label">{t('Tên hiển thị')}</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="vd: Máy Smith"
              required
            />
          </div>
        </div>

        <div className="row wrap" style={{ gap: 12 }}>
          <div className="form-group flex-1">
            <label className="label">{t('Phân loại danh mục')}</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{t(c.label)}</option>
              ))}
            </select>
          </div>
          <div className="form-group flex-1">
            <label className="label">{t('Thứ tự sắp xếp')}</label>
            <input
              type="number"
              className="input"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">{t('Mô tả ngắn gọn (công dụng)')}</label>
          <input
            type="text"
            className="input"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            placeholder="vd: Thanh đòn dài chuẩn gắn ray trượt hỗ trợ tập an toàn..."
          />
        </div>

        <div className="form-group">
          <label className="label">{t('Hướng dẫn cách sử dụng')}</label>
          <textarea
            className="input"
            rows={4}
            value={usageGuide}
            onChange={(e) => setUsageGuide(e.target.value)}
            placeholder="Các bước căn chỉnh ghế, nắm tay cầm, thực hiện chuyển động..."
          />
        </div>

        <div className="form-group">
          <label className="label">{t('Lưu ý an toàn')}</label>
          <textarea
            className="input"
            rows={3}
            value={safetyNotes}
            onChange={(e) => setSafetyNotes(e.target.value)}
            placeholder="Khuyến cáo an toàn, cài chốt chặn, không thả tạ rơi tự do..."
          />
        </div>

        <div className="row wrap" style={{ gap: 12 }}>
          <div className="form-group flex-1">
            <label className="label">{t('Vùng cơ tác động chính (phân cách bởi dấu phẩy)')}</label>
            <input
              type="text"
              className="input"
              value={targetMuscles}
              onChange={(e) => setTargetMuscles(e.target.value)}
              placeholder="vd: quadriceps, gluteal, chest"
            />
          </div>
          <div className="form-group flex-1">
            <label className="label">{t('Mã ảnh bìa (imageKey)')}</label>
            <input
              type="text"
              className="input"
              value={imageKey}
              onChange={(e) => setImageKey(e.target.value)}
              placeholder="vd: Smith_Machine_Squat"
            />
          </div>
        </div>

        <div className="row end gap-8 mt-16">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            {t('Huỷ')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('Đang lưu…') : isNew ? t('Tạo dụng cụ') : t('Lưu thay đổi')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
