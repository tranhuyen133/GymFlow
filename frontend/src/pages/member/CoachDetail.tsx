import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Conversation, TrainerPublic } from '../../api/types';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Avatar, Badge, Button, Card, Empty, ErrorState, LoadingBlock, PageHead } from '../../components/ui';
import { DAYS } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';
import { t } from '../../i18n';

export default function CoachDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: coach, error, loading, reload } = useAsync(
    () => api.get<TrainerPublic>(`/trainers/public/${id}`),
    [id]
  );
  const [startingChat, setStartingChat] = useState(false);

  const handleStartChat = async () => {
    if (!coach) return;
    try {
      setStartingChat(true);
      const res = await api.post<Conversation>('/conversations', { trainerId: coach.id });
      navigate(`/messages/${res.id}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <PageHead eyebrow="Huấn luyện viên" title="Đang tải thông tin…" />
        <LoadingBlock rows={6} />
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="page">
        <PageHead eyebrow="Huấn luyện viên" title="Hồ sơ huấn luyện viên" />
        <ErrorState
          message={error ?? t('Không tìm thấy thông tin huấn luyện viên')}
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mb-16">
        <Button
          variant="ghost"
          size="sm"
          icon="chevronLeft"
          onClick={() => navigate('/coaches')}
        >
          {t('Quay lại danh sách huấn luyện viên')}
        </Button>
      </div>

      <PageHead
        eyebrow="Huấn luyện viên"
        title={coach.fullName}
        desc={coach.specialty ?? t('Huấn luyện viên thể hình chuyên nghiệp')}
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Button
              variant="secondary"
              icon="ticket"
              onClick={() => navigate('/me/packages')}
            >
              {t('Tìm hiểu gói PT')}
            </Button>
            <Button
              variant="primary"
              icon="message"
              disabled={startingChat}
              onClick={handleStartChat}
            >
              {startingChat ? t('Đang kết nối…') : t('Nhắn tin tư vấn')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-3" style={{ gap: 20 }}>
        <div style={{ gridColumn: 'span 2' }}>
          <Card className="mb-20">
            <div className="row" style={{ gap: 20, alignItems: 'center' }}>
              <Avatar name={coach.fullName} src={coach.avatar} size="xl" />
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: '0 0 6px 0', fontSize: 24 }}>{coach.fullName}</h2>
                <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
                  <Badge tone="green">{t('{n} năm kinh nghiệm', { n: coach.experienceYears })}</Badge>
                  {coach.specialty && <Badge tone="blue">{coach.specialty}</Badge>}
                </div>
              </div>
            </div>

            {coach.bio && (
              <div className="mt-20 pt-16" style={{ borderTop: '1px solid var(--hairline)' }}>
                <h3 style={{ fontSize: 16, margin: '0 0 8px 0' }}>{t('Giới thiệu')}</h3>
                <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--muted)', whiteSpace: 'pre-line' }}>
                  {coach.bio}
                </p>
              </div>
            )}

            {coach.certificates && (
              <div className="mt-16 pt-16" style={{ borderTop: '1px solid var(--hairline)' }}>
                <h3 style={{ fontSize: 16, margin: '0 0 8px 0' }}>{t('Bằng cấp & Chứng chỉ')}</h3>
                <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="badge" size={18} className="ok mt-2" />
                  <span style={{ color: 'var(--ink)' }}>{coach.certificates}</span>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3 style={{ fontSize: 16, margin: '0 0 16px 0' }}>{t('Lịch làm việc & Ca trực trong tuần')}</h3>
            {coach.shifts.length === 0 ? (
              <Empty
                icon="clock"
                title={t('Chưa có ca làm việc cố định')}
                desc={t('Huấn luyện viên chưa đăng ký ca cố định. Bạn có thể nhắn tin để trao đổi lịch hẹn cụ thể.')}
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('Thứ')}</th>
                      <th>{t('Giờ bắt đầu')}</th>
                      <th>{t('Giờ kết thúc')}</th>
                      <th>{t('Thời lượng')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coach.shifts.map((sh, idx) => {
                      const dayName = DAYS[sh.dayOfWeek - 1] ?? `Thứ ${sh.dayOfWeek}`;
                      const startMinutes =
                        Number(sh.startTime.slice(0, 2)) * 60 + Number(sh.startTime.slice(3, 5));
                      const endMinutes =
                        Number(sh.endTime.slice(0, 2)) * 60 + Number(sh.endTime.slice(3, 5));
                      const durationHours = ((endMinutes - startMinutes) / 60).toFixed(1);

                      return (
                        <tr key={sh.id ?? idx}>
                          <td>
                            <b>{dayName}</b>
                          </td>
                          <td>{sh.startTime.slice(0, 5)}</td>
                          <td>{sh.endTime.slice(0, 5)}</td>
                          <td className="muted">{t('{h} tiếng', { h: durationHours })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="beam">
            <h3 style={{ fontSize: 16, margin: '0 0 12px 0' }}>{t('Cần tư vấn tập luyện?')}</h3>
            <p className="small muted" style={{ lineHeight: 1.5, margin: '0 0 16px 0' }}>
              {t(
                'Mọi hội viên (kể cả chưa mua gói PT) đều có thể nhắn tin trực tiếp với huấn luyện viên để được hướng dẫn, giải đáp thắc mắc và tư vấn gói tập phù hợp.'
              )}
            </p>
            <div className="stack" style={{ gap: 10 }}>
              <Button
                variant="primary"
                icon="message"
                className="full-width"
                disabled={startingChat}
                onClick={handleStartChat}
              >
                {startingChat ? t('Đang kết nối…') : t('Nhắn tin tư vấn ngay')}
              </Button>
              <Button
                variant="ghost"
                icon="ticket"
                className="full-width"
                onClick={() => navigate('/me/packages')}
              >
                {t('Xem bảng giá gói tập')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
