import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/Icon';
import { t } from '../i18n';

/**
 * Trang 404 / 403. Nút chính đổi theo trạng thái đăng nhập: chưa đăng nhập thì về trang chủ hoặc đăng nhập,
 * không đưa về /dashboard (sẽ bị chuyển sang đăng nhập, người dùng tưởng nút hỏng).
 */
function ErrorPage({ code, title, desc }: { code: string; title: string; desc: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canGoBack = window.history.state?.idx > 0;
  return (
    <div className="page empty" style={{ minHeight: '60vh', justifyContent: 'center' }}>
      <div className="big-code grad-text">{code}</div>
      <h4 style={{ fontSize: 22 }}>{t(title)}</h4>
      <p className="muted">{t(desc)}</p>
      <div className="row row-wrap mt-8" style={{ gap: 10, justifyContent: 'center' }}>
        {user
          ? <Link to="/dashboard" className="btn btn-primary"><Icon name="dashboard" /><span>{t('Về trang tổng quan')}</span></Link>
          : <>
              <Link to="/" className="btn btn-primary"><Icon name="home" /><span>{t('Về trang chủ')}</span></Link>
              <Link to="/login" className="btn btn-secondary"><span>{t('Đăng nhập')}</span></Link>
            </>}
        {canGoBack && (
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}><Icon name="arrowLeft" /><span>{t('Quay lại')}</span></button>
        )}
      </div>
    </div>
  );
}

export const NotFound = () => <ErrorPage code="404" title="Không tìm thấy trang" desc="Đường dẫn không tồn tại hoặc đã bị thay đổi." />;
export const Forbidden = () => <ErrorPage code="403" title="Không có quyền truy cập" desc="Chức năng này không dành cho vai trò của bạn." />;
