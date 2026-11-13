import { useMe } from '../../auth/AuthContext';
import { CalorieStats } from '../../components/CalorieStats';
import { ProgressPanel } from '../../components/ProgressPanel';
import { ErrorState, PageHead } from '../../components/ui';
import { t } from '../../i18n';

export default function MyProgress() {
  const me = useMe();
  return (
    <div className="page">
      <PageHead eyebrow={t('Tập luyện')} title={t('Tiến độ của tôi')} desc={t('Ghi cân nặng mỗi tuần để theo dõi xu hướng. BMI tính theo ngưỡng cho người châu Á.')} />
      {me.memberId ? (
        <div className="stack" style={{ gap: 24 }}>
          <ProgressPanel memberId={me.memberId} />
          <CalorieStats memberId={me.memberId} />
        </div>
      ) : <ErrorState message={t('Tài khoản chưa có hồ sơ hội viên')} />}
    </div>
  );
}
