import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Conversation, TrainerPublic } from '../../api/types';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Avatar, Badge, Button, Card, Empty, ErrorState, LoadingBlock, PageHead, SearchInput } from '../../components/ui';
import { DAYS } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';
import { t } from '../../i18n';

/** Viết hoa ký tự đầu của một cụm chuyên môn (giảm mỡ → Giảm mỡ). */
function sentenceCase(value: string) {
  const s = value.trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Chuẩn hoá chuỗi chuyên môn: tách theo dấu ngăn cách, viết hoa từng cụm, nối lại. */
function formatSpecialty(raw: string | null | undefined) {
  if (!raw) return '';
  return raw
    .split(/[,/•;]/)
    .map(sentenceCase)
    .filter(Boolean)
    .join(', ');
}

export default function Coaches({ embedded }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.get<TrainerPublic[]>('/trainers/public'), []);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [startingChatId, setStartingChatId] = useState<number | null>(null);

  const specialties = useMemo(() => {
    if (!data) return [];
    const s = new Set<string>();
    data.forEach((tr) => {
      if (tr.specialty) {
        tr.specialty.split(/[,/•;]/).forEach((part) => {
          const item = sentenceCase(part);
          if (item) s.add(item);
        });
      }
    });
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((tr) => {
      const matchSearch =
        !q ||
        tr.fullName.toLowerCase().includes(q) ||
        (tr.specialty && tr.specialty.toLowerCase().includes(q)) ||
        (tr.bio && tr.bio.toLowerCase().includes(q));
      const matchSpecialty =
        !selectedSpecialty ||
        (tr.specialty && tr.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()));
      return matchSearch && matchSpecialty;
    });
  }, [data, search, selectedSpecialty]);

  const handleStartChat = async (trainerId: number) => {
    try {
      setStartingChatId(trainerId);
      const res = await api.post<Conversation>('/conversations', { trainerId });
      navigate(`/messages/${res.id}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setStartingChatId(null);
    }
  };

  const currentDayOfWeek = (() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  })();

  return (
    <div className={embedded ? undefined : 'page'}>
      {!embedded && (
        <PageHead
          eyebrow="Dịch vụ"
          title="Đội ngũ huấn luyện viên"
          desc="Gặp gỡ và trao đổi trực tiếp với các huấn luyện viên chuyên nghiệp để chọn lộ trình phù hợp."
        />
      )}

      <div className="card mb-16" style={{ padding: '16px 20px' }}>
        <div className="row wrap between" style={{ gap: 12 }}>
          <div style={{ flex: '1 1 280px', maxWidth: 400 }}>
            <SearchInput
              placeholder={t('Tìm theo tên, chuyên môn…')}
              value={search}
              onChange={setSearch}
            />
          </div>
          {specialties.length > 0 && (
            <div className="row" style={{ gap: 6, alignItems: 'center', flex: '1 1 auto', minWidth: 0, justifyContent: 'flex-end' }}>
              <span className="tiny muted mr-4" style={{ whiteSpace: 'nowrap', flex: 'none' }}>{t('Chuyên môn:')}</span>
              <div className="row" style={{ gap: 6, flex: '1 1 auto', minWidth: 0, overflowX: 'auto', paddingBottom: 2 }}>
                <button
                  type="button"
                  className={`chip ${!selectedSpecialty ? 'on' : ''}`}
                  style={{ flex: 'none', whiteSpace: 'nowrap' }}
                  onClick={() => setSelectedSpecialty(null)}
                >
                  {t('Tất cả')}
                </button>
                {specialties.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    className={`chip ${selectedSpecialty === sp ? 'on' : ''}`}
                    style={{ flex: 'none', whiteSpace: 'nowrap' }}
                    onClick={() => setSelectedSpecialty(sp === selectedSpecialty ? null : sp)}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <LoadingBlock rows={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <Empty
            icon="badge"
            title={data.length === 0 ? t('Chưa có huấn luyện viên') : t('Không tìm thấy huấn luyện viên phù hợp')}
            desc={data.length > 0 ? t('Thử đổi từ khoá tìm kiếm hoặc xoá bộ lọc chuyên môn.') : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-3">
          {filtered.map((tr) => {
            const shiftDays = new Set(tr.shifts.map((s) => s.dayOfWeek));
            const todayShift = tr.shifts.find((s) => s.dayOfWeek === currentDayOfWeek);
            const statusLabel = todayShift
              ? t('Có ca hôm nay ({start} - {end})', {
                  start: todayShift.startTime.slice(0, 5),
                  end: todayShift.endTime.slice(0, 5),
                })
              : tr.shifts.length > 0
              ? t('Nhận tư vấn ({n} ca/tuần)', { n: tr.shifts.length })
              : t('Liên hệ đặt hẹn');

            return (
              <Card key={tr.id} className="hoverable trainer-card">
                <div className="row between row-wrap" style={{ alignItems: 'flex-start', gap: 8 }}>
                  <div className="row" style={{ gap: 12, flex: '1 1 170px', minWidth: 0 }}>
                    <Avatar name={tr.fullName} src={tr.avatar} size="lg" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b
                        className="ellipsis pointer link-accent"
                        style={{ fontSize: 16, display: 'block' }}
                        onClick={() => navigate(`/coaches/${tr.id}`)}
                      >
                        {tr.fullName}
                      </b>
                      <div className="tiny muted ellipsis mt-2">
                        {formatSpecialty(tr.specialty) || t('Huấn luyện thể hình')}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', flex: 'none' }}>
                    <Badge tone={todayShift ? 'green' : 'blue'}>{statusLabel}</Badge>
                  </div>
                </div>

                <div className="stack-sm mt-16 small">
                  <div className="row" style={{ gap: 8 }}>
                    <Icon name="trophy" size={15} className="ok" />
                    <span>{t('{n} năm kinh nghiệm', { n: tr.experienceYears })}</span>
                  </div>
                  {tr.certificates && (
                    <div className="row" style={{ gap: 8 }}>
                      <Icon name="badge" size={15} className="ok" />
                      <span className="ellipsis" title={tr.certificates}>
                        {tr.certificates}
                      </span>
                    </div>
                  )}
                  {tr.bio && (
                    <p
                      className="tiny muted mt-4"
                      style={{
                        margin: '4px 0 0',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {tr.bio}
                    </p>
                  )}
                </div>

                <div className="row mt-16" style={{ gap: 4 }}>
                  {DAYS.map((d, i) => (
                    <span
                      key={d}
                      className={`chip ${shiftDays.has(i + 1) ? 'on' : ''}`}
                      style={{ padding: '0 7px' }}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                <div className="row between mt-16" style={{ gap: 8, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/coaches/${tr.id}`)}
                  >
                    {t('Xem hồ sơ')}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon="message"
                    disabled={startingChatId === tr.id}
                    onClick={() => handleStartChat(tr.id)}
                  >
                    {startingChatId === tr.id ? t('Đang kết nối…') : t('Nhắn tin tư vấn')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
