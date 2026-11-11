import { useMe } from '../../auth/AuthContext';
import { CalorieStats } from '../../components/CalorieStats';
import { ProgressPanel } from '../../components/ProgressPanel';
import { ErrorState, PageHead } from '../../components/ui';

export default function MyProgress() {
  const me = useMe();
  return (
    <div className="page">
      <PageHead eyebrow="Tập luyện" title="Tiến độ của tôi" desc="Ghi cân nặng mỗi tuần để theo dõi xu hướng. BMI tính theo ngưỡng cho người châu Á." />
      {me.memberId ? (
        <div className="stack" style={{ gap: 24 }}>
          <ProgressPanel memberId={me.memberId} />
          <CalorieStats memberId={me.memberId} />
        </div>
      ) : <ErrorState message="Tài khoản chưa có hồ sơ hội viên" />}
    </div>
  );
}
