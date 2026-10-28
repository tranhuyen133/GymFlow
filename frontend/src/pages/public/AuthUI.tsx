import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import type { InputProps } from '../../components/ui/Input';
import { unavailableMessage } from './contracts';
import brandMark from './assets/brand-mark.svg';
import './public.css';

/** CHỦ FILE: Phương. UI dùng chung của các trang công khai. */
export function Brand() {
  return <Link to="/" className="gf-brand" aria-label="GymFlow — Trang chủ"><span className="gf-brand-mark"><img src={brandMark} alt="" /></span><span>Gym<strong>Flow</strong></span></Link>;
}
export function AuthShell({ children, register = false, compact = false }: { children: ReactNode; register?: boolean; compact?: boolean }) {
  return compact ? <main className="gf-recovery"><Brand /><section className="gf-recovery-card">{children}</section></main>
    : <main className="gf-auth"><aside className="gf-auth-art">
      <Brand /><div className="gf-slashes" aria-hidden="true"><i /><i /><i /></div>
      <div className="gf-auth-story"><h2>{register ? 'BẮT ĐẦU HÔM NAY.' : 'TẬP CÓ KẾ HOẠCH.'}<br /><em>{register ? 'MẠNH HƠN MỖI TUẦN.' : 'TIẾN BỘ ĐO ĐƯỢC.'}</em></h2>
        <ul>{(register ? ['Tạo tài khoản hội viên miễn phí', 'Chọn gói tập phù hợp, kích hoạt tại quầy lễ tân', 'Theo dõi lịch tập, giáo án và tiến độ ngay trên điện thoại'] : ['Lịch tập tuần với huấn luyện viên riêng', 'Cân nặng, BMI và chuyên cần hiển thị rõ ràng', 'Gói tập minh bạch, nhắc gia hạn trước 7 ngày']).map(text => <li key={text}><span aria-hidden="true">✓</span>{text}</li>)}</ul>
      </div><span className="gf-move" aria-hidden="true">MOVE</span><p className="gf-art-hours">Thứ 2 – Thứ 7 · 05:30 – 21:00</p>
    </aside><section className="gf-auth-main"><div className="gf-auth-box"><Link to="/" className="gf-back">← Trang chủ</Link>{children}</div></section></main>;
}
export function PasswordField(props: InputProps) {
  const [visible, setVisible] = useState(false);
  return <div className="gf-password"><Input {...props} type={visible ? 'text' : 'password'} />
    <Button variant="ghost" className="gf-password-toggle" aria-pressed={visible} aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${props.label?.toLowerCase() || 'mật khẩu'}`} onClick={() => setVisible(!visible)}>{visible ? 'Ẩn' : 'Hiện'}</Button>
  </div>;
}
export function PasswordStrength({ value }: { value: string }) {
  const score = value ? Math.min(4, Number(value.length >= 8) + Number(/[a-z]/i.test(value) && /\d/.test(value)) + Number(value.length >= 12) + Number(/[^a-z0-9]/i.test(value))) : 0;
  const label = value ? ['Yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][score] : 'Chưa nhập';
  return <div className="gf-strength"><div role="meter" aria-label="Độ mạnh mật khẩu" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-valuetext={label}>{[1, 2, 3, 4].map(n => <span key={n} className={n <= score ? 'filled' : ''} />)}</div><small>Độ mạnh: {label}</small></div>;
}
export const passwordError = (value: string) => value.length < 8 || !/[a-z]/i.test(value) || !/\d/.test(value) ? 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số.' : '';
export const emailError = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Nhập địa chỉ email hợp lệ.';
export function Notice({ children, success = false }: { children: ReactNode; success?: boolean }) {
  return <div role={success ? 'status' : 'alert'} className={`gf-notice gf-notice--${success ? 'success' : 'error'}`}>{children}</div>;
}
export function usePublicForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const first = Object.keys(errors).find(key => errors[key]);
    if (first) (form.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
  }, [errors]);
  async function submit(event: FormEvent, validation: Record<string, string>, action?: () => Promise<void>) {
    event.preventDefault();
    if (busy.current) return false;
    setErrors(validation); setMessage('');
    if (Object.values(validation).some(Boolean)) return false;
    if (!action) { setMessage(unavailableMessage); return false; }
    busy.current = true; setPending(true);
    try { await action(); return mounted.current; }
    catch (error: unknown) {
      if (mounted.current) {
        // Only structured field errors for known fields are exposed.
        const fields = error && typeof error === 'object' && 'fieldErrors' in error ? error.fieldErrors : null;
        if (fields && typeof fields === 'object') setErrors(Object.fromEntries(Object.entries(fields).filter(([key, value]) => key in validation && typeof value === 'string')));
        setMessage('Không thể hoàn tất yêu cầu. Kiểm tra thông tin hoặc thử lại sau.');
      }
      return false;
    } finally { busy.current = false; if (mounted.current) setPending(false); }
  }
  return { form, errors, message, pending, submit };
}
