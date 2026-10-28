/** CHỦ FILE: Phương. Trang duyệt UI kit trên Vite dev; không thêm vào route ứng dụng. */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card, Input, Modal, Table } from './index';
import '../../styles/tokens.css';

function Preview() {
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState('/register');
  const [width, setWidth] = useState('375');
  return <main style={{ maxWidth: 1100, margin: 'auto', padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-6)' }}>
    <h1>GymFlow · UI kit của Phương</h1>
    <p>Trang kiểm tra giao diện cục bộ. Các form chưa kết nối API.</p>
    <Card title="Button"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
      <Button onClick={() => setOpen(true)}>Mở modal</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="danger">Danger</Button><Button variant="ghost">Ghost</Button><Button disabled>Disabled</Button><Button loading>Đang xử lý</Button>
    </div></Card>
    <Card title="Input"><div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <Input label="Tên hội viên" helper="Nhãn liên kết với ô nhập liệu" /><Input label="Email" type="email" error="Email không hợp lệ" /><Input label="Không khả dụng" disabled />
    </div></Card>
    <Table aria-label="Các trạng thái giao diện"><caption>Table dùng chung</caption><thead><tr><th scope="col">Thành phần</th><th scope="col">Kiểm tra</th></tr></thead><tbody><tr><td>Input</td><td>Label, helper, aria-invalid, aria-describedby</td></tr><tr><td>Modal</td><td>Tab, Shift+Tab, Escape, trả focus về nút mở</td></tr></tbody></Table>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Kiểm tra hộp thoại"><p>Tab để di chuyển trong hộp thoại. Escape hoặc Huỷ để đóng.</p><Input label="Nội dung thử" /><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}><Button variant="outline" onClick={() => setOpen(false)}>Huỷ</Button><Button onClick={() => setOpen(false)}>Xác nhận</Button></div></Modal>
    <Card title="Duyệt các màn ở kích thước hẹp"><div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
      <label>Màn hình <select value={screen} onChange={e => setScreen(e.target.value)}>{[['/', 'Trang chủ'], ['/login', 'Đăng nhập'], ['/register', 'Đăng ký'], ['/forgot-password', 'Quên mật khẩu'], ['/reset-password', 'Đặt lại mật khẩu']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Chiều rộng <select value={width} onChange={e => setWidth(e.target.value)}><option>320</option><option>375</option><option>768</option></select> px</label>
    </div><iframe title="Bản xem trước responsive" src={screen} style={{ display: 'block', width: Number(width), maxWidth: '100%', height: 820, border: '1px solid var(--hairline)', borderRadius: 'var(--radius-card)' }} /></Card>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
