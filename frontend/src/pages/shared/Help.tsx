/**
 * Trung tâm trợ giúp: câu hỏi thường gặp theo vai trò, giải thích trạng thái, mở lại hướng dẫn tương tác.
 * Chỉ hiện câu hỏi của vai trò đang đăng nhập (quyền thật vẫn do backend kiểm tra).
 * Nội dung bám theo màn hình hiện có – đổi luồng nghiệp vụ thì sửa câu trả lời ở đây.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Role } from '../../api/types';
import { useMe } from '../../auth/AuthContext';
import { Icon } from '../../components/Icon';
import { Button, Card, Empty, PageHead, SearchInput, StatusBadge } from '../../components/ui';
import { t } from '../../i18n';
import { packageRequestStatus, scheduleStatus, subState } from '../../lib/format';
import { readTour, startTour, TOUR_END, type TourState } from '../../lib/tour';
import './help.css';

interface Faq { q: string; a: string; to?: string; roles: Role[]; topic: string }

const ALL: Role[] = ['ADMIN', 'TRAINER', 'MEMBER'];
const M: Role[] = ['MEMBER'];
const STAFF: Role[] = ['ADMIN', 'TRAINER'];
const A: Role[] = ['ADMIN'];

const FAQ: Faq[] = [
  // ---------- Hội viên: Người mới & Bắt đầu ----------
  { topic: 'Người mới', roles: M, to: '/getting-started', q: 'Vì sao đã đăng ký tài khoản mà chưa tập được?',
    a: 'Để đủ điều kiện vào phòng tập, bạn cần đáp ứng đủ 3 điều kiện: (1) Tài khoản đang hoạt động (ACTIVE); (2) Hồ sơ hội viên hoạt động (ACTIVE); và (3) Có ít nhất một gói tập đang trong thời hạn hiệu lực (từ ngày bắt đầu đến ngày kết thúc và chưa bị huỷ). Bạn có thể kiểm tra trực tiếp tại trang "Bắt đầu cùng GymFlow".' },
  { topic: 'Người mới', roles: M, to: '/getting-started', q: '"Chờ xác nhận thanh toán" nghĩa là gì, bao lâu thì được duyệt?',
    a: 'Sau khi bạn bấm "Tôi đã chuyển khoản", đơn đăng ký ở trạng thái chờ duyệt. Quản lý phòng tập sẽ kiểm tra sao kê ngân hàng đối chiếu với mã thanh toán của bạn để duyệt và kích hoạt gói, thông thường diễn ra trong giờ làm việc của phòng tập (trong ngày).' },
  { topic: 'Người mới', roles: M, to: '/getting-started', q: 'Đơn bị từ chối phải làm gì?',
    a: 'Bạn vào trang "Bắt đầu cùng GymFlow" hoặc "Gói tập của tôi" để xem lý do từ chối cụ thể của ban quản lý. Sau đó bạn có thể bấm "Đăng ký lại" để gửi yêu cầu mới với thông tin đã điều chỉnh.' },
  { topic: 'Người mới', roles: M, to: '/getting-started', q: 'Gói chưa đến ngày bắt đầu có được đi tập không?',
    a: 'Không. Gói tập chỉ bắt đầu tính hiệu lực từ ngày bắt đầu (start_date) ghi trên gói. Trước ngày đó, hệ thống sẽ hiển thị trạng thái chờ kích hoạt và bạn chưa thể check-in đi tập.' },
  // ---------- Hội viên: Gói tập & Lịch tập ----------
  { topic: 'Gói tập', roles: M, to: '/me/packages', q: 'Làm thế nào để đăng ký gói tập?',
    a: 'Vào "Gói tập của tôi", chọn một gói đang mở bán rồi bấm "Đăng ký gói này". Chọn ngày bắt đầu (hoặc "Sớm nhất" để nối tiếp gói hiện tại), chọn huấn luyện viên nếu là gói có HLV, chọn trả tại quầy hoặc chuyển khoản QR rồi gửi đơn. Mỗi lần chỉ gửi được một đơn; muốn đổi gói thì huỷ đơn đang chờ.' },
  { topic: 'Gói tập', roles: M, to: '/me/packages', q: 'Vì sao đơn đăng ký gói đang chờ duyệt?',
    a: 'Gói chỉ có hiệu lực sau khi quản lý xác nhận đã nhận tiền. Trả tại quầy: thanh toán ở lễ tân. Chuyển khoản: chuyển đúng số tiền với nội dung được ghi trên đơn rồi bấm "Tôi đã chuyển khoản" để quản lý đối chiếu sao kê.' },
  { topic: 'Lịch tập', roles: M, to: '/me/schedule', q: 'Làm thế nào để xem lịch tập?',
    a: 'Mở "Lịch tập của tôi" để xem các buổi trong tuần, giờ tập và huấn luyện viên. Bấm vào một buổi để xem chi tiết; tập xong thì đánh dấu hoàn thành (chỉ được khi đã đến giờ tập).' },
  { topic: 'Lịch tập', roles: M, to: '/me/schedule', q: 'Làm thế nào để dời hoặc huỷ buổi tập?',
    a: 'Gói tự tập: bạn tự xếp buổi, và có thể dời hoặc huỷ trước giờ tập ngay trên buổi đó. Gói có HLV: lịch do HLV xếp – nếu buổi không có nút "Dời lịch" / "Huỷ buổi", hãy nhắn HLV phụ trách.' },
  { topic: 'Sức khoẻ', roles: M, to: '/me/progress', q: 'Làm thế nào để cập nhật cân nặng?',
    a: 'Vào "Tiến độ" → "Ghi cân nặng". Mỗi ngày một bản ghi, ghi lại cùng ngày sẽ cập nhật số cũ. Muốn tính BMI, nhập chiều cao trong Hồ sơ cá nhân → Hồ sơ tập luyện.' },
  { topic: 'Sức khoẻ', roles: M, to: '/me/journey', q: 'Làm thế nào để xem lịch sử tập luyện?',
    a: '"Tiến độ" có chuyên cần 8 tuần gần nhất, nhật ký cân nặng và huy hiệu. "Hành trình của tôi" tổng hợp quá trình tập theo tháng.' },
  { topic: 'Giáo án', roles: M, to: '/me/plan', q: 'Ai soạn giáo án cho tôi?',
    a: 'Gói có HLV: HLV phụ trách soạn giáo án theo mục tiêu của bạn. Gói tự tập: vào "Giáo án của tôi" → "Tự soạn giáo án", chọn bài trong thư viện hoặc bắt đầu từ một lịch tập mẫu, rồi tự xếp buổi ở Lịch tập.' },
  // ---------- HLV ----------
  { topic: 'Lịch tập', roles: STAFF, to: '/schedules', q: 'Làm thế nào để xếp lịch cho hội viên?',
    a: 'Vào "Lịch tập" và xếp lịch lặp hằng tuần. Hệ thống tự chặn trùng giờ của HLV và hội viên, và chỉ cho xếp khi hội viên còn gói hiệu lực.' },
  { topic: 'Lịch tập', roles: STAFF, to: '/schedules', q: 'Làm thế nào để ghi nhận kết quả buổi tập?',
    a: 'Trong "Lịch tập", bấm vào buổi rồi chọn "Hoàn thành buổi" (nhập thời lượng, calo, cảm nhận) hoặc "Đánh vắng". Buổi bị đánh vắng, hội viên vẫn ghi nhận bù được trong 7 ngày nếu thực tế có tập.' },
  { topic: 'Hội viên', roles: STAFF, to: '/members', q: 'Làm thế nào để xem tiến độ của hội viên?',
    a: 'Vào "Hội viên" và mở hội viên cần xem: hồ sơ, giáo án, cân nặng, BMI và chuyên cần nằm trên cùng một trang.' },
  { topic: 'Giáo án', roles: STAFF, to: '/workout-plans', q: 'Làm thế nào để soạn giáo án nhanh?',
    a: 'Vào "Giáo án" → tạo giáo án mới, chọn bài theo từng ngày trong tuần. Có thể áp một lịch tập mẫu rồi chỉnh lại cho phù hợp hội viên.' },
  // ---------- Quản lý ----------
  { topic: 'Gói tập', roles: A, to: '/package-requests', q: 'Duyệt đơn đăng ký gói như thế nào?',
    a: 'Vào "Duyệt đăng ký gói". Chỉ duyệt khi đã nhận đủ tiền: tại quầy thì thu tiền trước; chuyển khoản thì mở sao kê, tìm đúng số tiền và nội dung trên đơn. Gói có HLV cần chọn HLV phụ trách. Bấm "Duyệt và kích hoạt" – gói của hội viên được kích hoạt ngay. Gói đã ngừng bán thì từ chối đơn.' },
  { topic: 'Gói tập', roles: A, to: '/payment-settings', q: 'Cài mã QR chuyển khoản ở đâu?',
    a: 'Vào "Thanh toán" để tải ảnh mã QR và thông tin tài khoản nhận tiền hiển thị cho hội viên khi chọn chuyển khoản.' },
  { topic: 'Hệ thống', roles: A, to: '/users', q: 'Làm thế nào để khoá một tài khoản?',
    a: 'Vào "Tài khoản & quyền", tìm tài khoản rồi khoá. Tài khoản bị khoá mất quyền truy cập ngay cả khi đang đăng nhập.' },
  { topic: 'Hệ thống', roles: A, to: '/audit-logs', q: 'Xem ai đã thay đổi dữ liệu ở đâu?',
    a: '"Nhật ký hệ thống" ghi lại người thực hiện, thời gian và thao tác quan trọng như duyệt gói, xếp / huỷ lịch, ghi cân nặng.' },
  { topic: 'Nội dung', roles: A, to: '/exercises', q: 'Bài tập mới chưa hiện cho hội viên?',
    a: 'Bài tập mới cần được duyệt trong "Thư viện bài tập" trước khi hội viên thấy được.' },
  // ---------- Chung ----------
  { topic: 'Tài khoản', roles: ALL, to: '/profile', q: 'Làm thế nào để đổi mật khẩu?',
    a: 'Vào "Hồ sơ cá nhân" → mục "Bảo mật" → nhập mật khẩu hiện tại và mật khẩu mới (tối thiểu 8 ký tự, gồm chữ và số). Muốn đổi email đăng nhập, liên hệ quản lý.' },
  { topic: 'Tài khoản', roles: ALL, q: 'Đổi giao diện sáng / tối hoặc ngôn ngữ ở đâu?',
    a: 'Bấm ảnh đại diện ở góc phải trên cùng → "Giao diện & ngôn ngữ".' },
  { topic: 'Xử lý lỗi', roles: ALL, to: '/forgot-password', q: 'Quên mật khẩu thì làm sao?',
    a: 'Ở trang đăng nhập, bấm "Quên mật khẩu" và làm theo hướng dẫn để đặt lại mật khẩu.' },
  { topic: 'Xử lý lỗi', roles: ALL, q: 'Trang báo "không có quyền truy cập"?',
    a: 'Mỗi vai trò chỉ dùng được chức năng của mình; máy chủ cũng kiểm tra quyền ở mọi thao tác. Nếu bạn cần quyền đó cho công việc, hãy liên hệ quản lý.' },
  { topic: 'Xử lý lỗi', roles: ALL, q: 'Bấm lưu nhưng báo lỗi?',
    a: 'Lỗi của từng ô hiện ngay dưới ô đó – sửa theo gợi ý rồi lưu lại. Nếu báo mất kết nối thì thao tác chưa được lưu; kiểm tra mạng rồi thử lại, không cần nhập lại từ đầu.' },
];

// Bỏ dấu để tìm "doi mat khau" vẫn ra "Đổi mật khẩu"
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

export default function Help() {
  const user = useMe();
  const [q, setQ] = useState('');
  const [tour, setTour] = useState<TourState | null>(null);
  const defaultTourKey = user.role === 'MEMBER' ? 'journey' : user.role === 'TRAINER' ? 'trainer' : 'admin';

  useEffect(() => {
    let alive = true;
    void readTour(user.id, defaultTourKey).then((t) => {
      if (alive) setTour(t);
    });
    const on = () => {
      void readTour(user.id, defaultTourKey).then((t) => {
        if (alive) setTour(t);
      });
    };
    window.addEventListener(TOUR_END, on);
    return () => {
      alive = false;
      window.removeEventListener(TOUR_END, on);
    };
  }, [user.id, defaultTourKey]);

  const list = useMemo(() => {
    const mine = FAQ.filter((f) => f.roles.includes(user.role));
    const k = fold(q.trim());
    return k ? mine.filter((f) => fold(`${t(f.q)} ${t(f.a)} ${t(f.topic)}`).includes(k)) : mine;
  }, [q, user.role]);

  const topics = Array.from(new Set(list.map((f) => f.topic)));
  const seesRequests = user.role !== 'TRAINER';

  return (
    <div className="page">
      <PageHead eyebrow={t('Trợ giúp')} title={t('Trung tâm trợ giúp')}
        desc={t('Câu hỏi thường gặp, giải thích các trạng thái và hướng dẫn sử dụng dành cho {role}.', { role: t(user.role === 'ADMIN' ? 'quản lý' : user.role === 'TRAINER' ? 'huấn luyện viên' : 'hội viên') })} />

      <div className="help-grid">
        <Card title={t('Hướng dẫn tương tác')} icon="play">
          <p className="small muted">{t('Đi qua các bước giới thiệu chức năng chính, làm nổi bật trực tiếp trên màn hình.')}</p>
          <p className="tiny faint mt-8">
            {tour?.status === 'done' ? t('Bạn đã xem hết hướng dẫn.')
              : tour?.status === 'paused' ? t('Bạn đang tạm dừng hướng dẫn.')
              : t('Bạn chưa xem hướng dẫn.')}
          </p>
          <div className="row mt-16" style={{ gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" icon="play" onClick={() => startTour({ tourKey: defaultTourKey, step: 0 })}>{t('Tour tổng quan')}</Button>
            {user.role === 'MEMBER' && (
              <>
                <Button variant="secondary" icon="play" onClick={() => startTour({ tourKey: 'journey', step: 0 })}>{t('Tour hành trình đi tập')}</Button>
                <Button variant="ghost" icon="play" onClick={() => startTour({ tourKey: 'pt-intro', step: 0 })}>{t('Tour tìm HLV & tư vấn')}</Button>
              </>
            )}
          </div>
        </Card>

        <Card title={t('Ý nghĩa các trạng thái')} icon="info">
          <div className="help-status">
            {seesRequests && (
              <section>
                <h3>{t('Đơn đăng ký gói')}</h3>
                <dl>
                  <dt><StatusBadge map={packageRequestStatus} value="PENDING" /></dt><dd>{t('Đã gửi, chờ quản lý xác nhận thanh toán. Gói chưa có hiệu lực.')}</dd>
                  <dt><StatusBadge map={packageRequestStatus} value="APPROVED" /></dt><dd>{t('Đã nhận tiền và kích hoạt gói.')}</dd>
                  <dt><StatusBadge map={packageRequestStatus} value="REJECTED" /></dt><dd>{t('Không được duyệt – xem lý do trên đơn, có thể gửi đơn mới.')}</dd>
                  <dt><StatusBadge map={packageRequestStatus} value="CANCELLED" /></dt><dd>{t('Hội viên đã tự huỷ đơn.')}</dd>
                </dl>
              </section>
            )}
            <section>
              <h3>{t('Gói tập')}</h3>
              <dl>
                <dt><StatusBadge map={subState} value="UPCOMING" /></dt><dd>{t('Đã kích hoạt, chưa tới ngày bắt đầu.')}</dd>
                <dt><StatusBadge map={subState} value="ACTIVE" /></dt><dd>{t('Đang dùng được – xếp lịch tập được.')}</dd>
                <dt><StatusBadge map={subState} value="EXPIRING" /></dt><dd>{t('Còn ít ngày – nên gia hạn sớm để không gián đoạn lịch tập.')}</dd>
                <dt><StatusBadge map={subState} value="EXPIRED" /></dt><dd>{t('Đã hết thời hạn – cần đăng ký gói mới mới xếp được lịch.')}</dd>
                <dt><StatusBadge map={subState} value="CANCELLED" /></dt><dd>{t('Gói bị huỷ trước hạn.')}</dd>
              </dl>
            </section>
            <section>
              <h3>{t('Buổi tập')}</h3>
              <dl>
                <dt><StatusBadge map={scheduleStatus} value="SCHEDULED" /></dt><dd>{t('Sắp diễn ra.')}</dd>
                <dt><StatusBadge map={scheduleStatus} value="COMPLETED" /></dt><dd>{t('Đã tập và ghi nhận kết quả.')}</dd>
                <dt><StatusBadge map={scheduleStatus} value="MISSED" /></dt><dd>{t('Buổi đã qua mà chưa ghi nhận. Nếu thực tế có tập, hội viên ghi bù được trong 7 ngày.')}</dd>
                <dt><StatusBadge map={scheduleStatus} value="CANCELLED" /></dt><dd>{t('Đã huỷ, không tính vào chuyên cần.')}</dd>
              </dl>
            </section>
          </div>
        </Card>
      </div>

      <div className="help-search mt-24">
        <h2>{t('Câu hỏi thường gặp')}</h2>
        <SearchInput value={q} onChange={setQ} placeholder="Tìm câu hỏi, VD: đổi mật khẩu" />
      </div>

      {list.length === 0 ? (
        <Empty icon="search" title={t('Không tìm thấy câu hỏi phù hợp')} desc={t('Thử từ khoá khác, hoặc hỏi trực tiếp quản lý phòng tập.')} />
      ) : topics.map((tp) => (
        <section key={tp} className="help-topic">
          <h3 className="help-topic-title">{t(tp)}</h3>
          <div className="faq">
            {list.filter((f) => f.topic === tp).map((f) => (
              <details key={f.q} open={!!q.trim()}>
                <summary>{t(f.q)}<Icon name="chevronDown" /></summary>
                <p className="muted">{t(f.a)}</p>
                {f.to && <p className="help-go"><Link to={f.to} className="small">{t('Mở trang này')} <Icon name="arrowRight" size={14} /></Link></p>}
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
