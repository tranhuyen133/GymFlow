import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { Brand } from './AuthUI';
import type { PublicPlan } from './contracts';
/**
 * CHỦ FILE: Phương · SCRUM-144.
 * Dữ liệu giá do api/plans.ts (Kiên), mock do api/mock/ (Tùng) cung cấp qua props.
 * Không nhúng giá giả trong màn hình.
 */
export interface LandingProps { plans?: PublicPlan[]; loading?: boolean; error?: string; onRetry?: () => void }
export default function Landing({ plans, loading = false, error, onRetry }: LandingProps) {
  return <><a className="gf-skip" href="#main-content">Đến nội dung chính</a>
    <header className="gf-site-header"><Brand /><nav aria-label="Điều hướng chính"><a href="#programs">Chương trình</a><a href="#benefits">Quyền lợi</a><a href="#pricing">Bảng giá</a><Link to="/knowledge">Kiến thức</Link></nav><div className="gf-actions"><Link className="gf-button gf-button--outline" to="/login">Đăng nhập</Link><Link className="gf-button gf-button--primary" to="/register">Đăng ký hội viên</Link></div></header>
    <main id="main-content"><section className="gf-section gf-hero"><div><span className="gf-kicker">PHÒNG TẬP · HUẤN LUYỆN VIÊN · TIẾN ĐỘ</span><h1>TẬP ĐÚNG.<br /><em>TIẾN BỘ THẬT.</em></h1><p>Lịch tập, giáo án và tiến độ của bạn ở cùng một nơi. Có kế hoạch cho từng buổi tập, nhìn thấy mình mạnh lên mỗi tuần.</p><div className="gf-actions"><Link to="/register" className="gf-button gf-button--primary">Đăng ký hội viên</Link><a href="#pricing" className="gf-button gf-button--secondary">Xem bảng giá</a></div></div>
      <div className="gf-hero-panel"><div className="gf-slashes" aria-hidden="true"><i /><i /><i /></div><Card title="Lịch tập của bạn"><p>Sắp xếp tuần tập cùng huấn luyện viên.</p></Card><Card title="Giáo án cá nhân"><p>Biết hôm nay tập gì, theo đúng mục tiêu.</p></Card><Card title="Tiến bộ theo thời gian"><p>Theo dõi cân nặng, BMI và chuyên cần.</p></Card></div>
    </section><div className="gf-sport-strip">THỂ HÌNH · GIẢM MỠ · SỨC MẠNH · YOGA · PHỤC HỒI · PT 1 KÈM 1</div>
    <section id="programs" className="gf-section"><span className="gf-kicker">CHƯƠNG TRÌNH TẬP</span><h2>CHỌN MỤC TIÊU. CHÚNG TÔI LO LỘ TRÌNH.</h2><div className="gf-grid">{[
      ['Thể hình & giảm mỡ', 'Giáo án theo tuần, kết hợp tập và hồi phục phù hợp với thể trạng.'],
      ['Sức mạnh', 'Squat, bench, deadlift đúng kỹ thuật. Tăng tải có kiểm soát theo từng tuần.'],
      ['Yoga & phục hồi', 'Mobility, giãn cơ và phục hồi. Cân bằng năng lượng cho ngày tập tiếp theo.'],
      ['PT 1 kèm 1', 'Huấn luyện viên riêng giúp bạn tập đúng và bám sát từng buổi tập.'],
    ].map(([title, description], index) => <Card key={title}><span className="gf-number">0{index + 1}</span><h3>{title}</h3><p>{description}</p></Card>)}</div></section>
    <section id="benefits" className="gf-section"><span className="gf-kicker">QUYỀN LỢI HỘI VIÊN</span><h2>MỌI BUỔI TẬP ĐỀU ĐƯỢC GHI LẠI.</h2><div className="gf-grid gf-feature-grid">{[
      ['Lịch tập của riêng bạn', 'Xem thời gian, địa điểm và huấn luyện viên phụ trách ngay trên điện thoại.'],
      ['Giáo án cá nhân hoá', 'Biết rõ bài tập, số hiệp, số lần và mục tiêu mỗi ngày.'],
      ['Tiến độ cơ thể', 'Theo dõi cân nặng, BMI và chuyên cần theo thời gian.'],
      ['Gói tập minh bạch', 'Biết thời hạn, quyền lợi và số buổi tập của bạn.'],
      ['Nhắc lịch kịp thời', 'Theo dõi lịch tập hôm nay và thời hạn gói tập.'],
      ['Ghi nhận mỗi buổi tập', 'Xem lại buổi tập và cùng huấn luyện viên điều chỉnh kế hoạch.'],
    ].map(([title, description]) => <div key={title}><h3>{title}</h3><p>{description}</p></div>)}</div></section>
    <section className="gf-section"><span className="gf-kicker">THAM GIA</span><h2>BA BƯỚC ĐỂ BẮT ĐẦU.</h2><div className="gf-grid gf-feature-grid gf-steps">{['Tạo tài khoản', 'Chọn gói tại quầy', 'Bắt đầu tập'].map((title, i) => <div key={title}><span className="gf-number">0{i + 1}</span><h3>{title}</h3></div>)}</div></section>
    <section id="pricing" className="gf-section"><span className="gf-kicker">BẢNG GIÁ</span><h2>GÓI TẬP MINH BẠCH.</h2><p>Giá đã gồm VAT. Gói được kích hoạt sau khi thanh toán tại quầy lễ tân.</p>
      <div className="gf-pricing gf-grid" aria-busy={loading}>
        {loading ? <p role="status">Đang tải bảng giá…</p> : error ? <div role="alert"><p>{error}</p>{onRetry && <Button onClick={onRetry} variant="outline">Thử lại</Button>}</div> :
          plans === undefined ? <p role="status">Bảng giá đang được cập nhật. Vui lòng liên hệ quầy lễ tân để biết chi tiết.</p> :
          plans.length === 0 ? <p>Hiện chưa có gói tập được công bố.</p> :
          plans.map(plan => <Card key={plan.id} className="gf-plan" title={plan.name}><strong className="gf-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.price)}</strong><p>{plan.description}</p><ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul><Link className="gf-button gf-button--primary" to="/register">Đăng ký để chọn gói</Link></Card>)}
      </div><div className="gf-cta"><div><h2>SẴN SÀNG CHO BUỔI TẬP ĐẦU TIÊN?</h2><p>Tạo tài khoản miễn phí, ghé quầy chọn gói và bắt đầu trong tuần này.</p></div><Link className="gf-button gf-button--primary" to="/register">Đăng ký hội viên</Link></div>
    </section></main><footer className="gf-site-footer"><div><Brand /><p>Tập có kế hoạch. Tiến bộ đo được.</p></div><div><h3>Tài khoản</h3><Link to="/register">Đăng ký hội viên</Link><Link to="/login">Đăng nhập</Link><Link to="/forgot-password">Quên mật khẩu</Link></div><div><h3>Thông tin</h3><Link to="/knowledge">Kho kiến thức</Link><Link to="/policy">Điều khoản & chính sách</Link></div></footer>
  </>;
}
