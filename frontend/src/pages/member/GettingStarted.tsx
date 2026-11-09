import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { OnboardingData, OnboardingStep, OnboardingStepStatus } from '../../api/types';
import { Icon, type IconName } from '../../components/Icon';
import { Badge, Button, ErrorState, LoadingBlock, PageHead } from '../../components/ui';
import { relativeTime } from '../../lib/format';
import { errMsg } from '../../lib/hooks';
import { startTour } from '../../lib/tour';
import { t } from '../../i18n';
import './gettingStarted.css';

const STATUS_CONFIG: Record<
  OnboardingStepStatus,
  { label: string; tone: 'green' | 'amber' | 'red' | 'muted'; icon: IconName; cls: string }
> = {
  DONE: { label: 'Đã hoàn thành', tone: 'green', icon: 'check', cls: 'done' },
  IN_PROGRESS: { label: 'Đang xử lý', tone: 'amber', icon: 'clock', cls: 'in_progress' },
  BLOCKED: { label: 'Tạm ngưng / Bị chặn', tone: 'red', icon: 'ban', cls: 'blocked' },
  TODO: { label: 'Chưa hoàn thành', tone: 'muted', icon: 'circle' as IconName, cls: 'todo' },
};

export default function GettingStarted() {
  const navigate = useNavigate();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get<OnboardingData>('/me/onboarding');
      setData(res);
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch ban đầu + refetch khi tab được focus lại + 60s
  useEffect(() => {
    void loadData();

    const onFocus = () => void loadData();
    window.addEventListener('focus', onFocus);

    const timer = setInterval(() => {
      if (!document.hidden) void loadData();
    }, 60_000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="page">
        <PageHead eyebrow="Lộ trình" title="Bắt đầu cùng GymFlow" />
        <LoadingBlock rows={6} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page">
        <PageHead eyebrow="Lộ trình" title="Bắt đầu cùng GymFlow" />
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  if (!data) return null;

  const totalSteps = data.steps.length;
  const doneSteps = data.steps.filter((s) => s.status === 'DONE').length;
  const activeStepObj = data.steps.find((s) => s.key === data.currentStep);
  const activeStepIndex = data.steps.findIndex((s) => s.key === data.currentStep) + 1;

  return (
    <div className="page">
      <PageHead
        eyebrow="Hành trình hội viên"
        title="Bắt đầu cùng GymFlow"
        desc="Theo dõi từng bước chuẩn bị để đủ điều kiện và sẵn sàng bước vào phòng tập."
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Button
              variant="secondary"
              icon="sparkle"
              onClick={() => startTour({ tourKey: 'journey', step: 0 })}
            >
              {t('Xem hướng dẫn lộ trình')}
            </Button>
            <Button
              variant="ghost"
              icon="refresh"
              onClick={loadData}
              aria-label={t('Tải lại')}
            />
          </div>
        }
      />

      {/* Banner Sẵn sàng tập khi readyToTrain = true */}
      {data.readyToTrain && (
        <div className="gs-ready-banner">
          <div className="row" style={{ gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="check" size={24} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 20, color: 'var(--ink)' }}>
                {t('Bạn đã sẵn sàng bắt đầu hành trình tập luyện cùng GymFlow!')}
              </h2>
              <p className="small muted" style={{ margin: 0 }}>
                {data.entitlements
                  ? t('Gói "{plan}" của bạn đang có hiệu lực (còn {days} ngày, hạn đến {date}).', {
                      plan: data.entitlements.planName,
                      days: data.entitlements.daysLeft,
                      date: data.entitlements.endDate,
                    })
                  : t('Tài khoản và gói tập của bạn đã đủ điều kiện để vào phòng tập.')}
              </p>
            </div>
          </div>

          <div className="gs-shortcuts-grid mt-8">
            <Link to="/policies" className="gs-shortcut-card">
              <Icon name="scroll" size={20} className="ok" />
              <div>
                <b>{t('Nội quy phòng tập')}</b>
                <div className="tiny muted">{t('Xem quy định & lưu ý')}</div>
              </div>
            </Link>
            <Link to="/exercises/beginner" className="gs-shortcut-card">
              <Icon name="dumbbell" size={20} className="ok" />
              <div>
                <b>{t('Bắt đầu tập gym')}</b>
                <div className="tiny muted">{t('Cẩm nang & bài tập cho người mới')}</div>
              </div>
            </Link>
            <Link to="/me/schedule" className="gs-shortcut-card">
              <Icon name="calendar" size={20} className="ok" />
              <div>
                <b>{t('Lịch tập của tôi')}</b>
                <div className="tiny muted">{t('Xem và xếp buổi tập')}</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Thẻ tóm tắt tiến trình */}
      <div className="gs-summary-card">
        <div className="row between wrap" style={{ gap: 12, alignItems: 'center' }}>
          <div>
            <span className="tiny faint uppercase">{t('Trạng thái hiện tại')}</span>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              {data.readyToTrain
                ? t('Đã hoàn thành tất cả các bước bắt buộc')
                : t('Bạn đang ở bước {step}/{total} – {title}', {
                    step: activeStepIndex,
                    total: totalSteps,
                    title: activeStepObj?.title ?? '',
                  })}
            </div>
            {!data.readyToTrain && activeStepObj && (
              <p className="small muted mt-4" style={{ margin: '4px 0 0' }}>
                {activeStepObj.reason}
              </p>
            )}
          </div>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span className="small muted">
              {t('{done}/{total} bước hoàn tất', { done: doneSteps, total: totalSteps })}
            </span>
            <Badge tone={data.readyToTrain ? 'green' : 'amber'}>
              {data.readyToTrain ? t('Đủ điều kiện tập') : t('Chưa sẵn sàng tập')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Danh sách 7 bước */}
      <div className="gs-timeline">
        {data.steps.map((st: OnboardingStep, idx: number) => {
          const cfg = STATUS_CONFIG[st.status] ?? STATUS_CONFIG.TODO;
          const isActive = st.key === data.currentStep && !data.readyToTrain;
          const isBlocked = st.status === 'BLOCKED';

          return (
            <div
              key={st.key}
              className={`gs-step-card ${isActive ? 'active-step' : ''} ${isBlocked ? 'blocked-step' : ''}`}
            >
              <div className={`gs-step-icon ${cfg.cls}`}>
                {st.status === 'DONE' ? (
                  <Icon name="check" size={18} />
                ) : st.status === 'IN_PROGRESS' ? (
                  <Icon name="clock" size={18} />
                ) : st.status === 'BLOCKED' ? (
                  <Icon name="ban" size={18} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="gs-step-body">
                <div className="gs-step-head">
                  <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                    <h3 className="gs-step-title">{st.title}</h3>
                    <Badge tone={st.required ? 'muted' : 'blue'}>
                      {st.required ? t('Bắt buộc') : t('Khuyến nghị')}
                    </Badge>
                  </div>
                  <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                    {st.updatedAt && (
                      <span className="tiny faint">{relativeTime(st.updatedAt)}</span>
                    )}
                    <Badge tone={cfg.tone}>{cfg.label}</Badge>
                  </div>
                </div>

                <p className="gs-step-reason">{st.reason}</p>

                {st.nextActionLabel && st.nextActionUrl && st.status !== 'DONE' && (
                  <div className="gs-step-foot">
                    <Button
                      size="sm"
                      variant={isActive ? 'primary' : 'secondary'}
                      icon="arrowRight"
                      onClick={() => navigate(st.nextActionUrl!)}
                    >
                      {st.nextActionLabel}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
