import { forwardRef, type ButtonHTMLAttributes } from 'react';
/** CHỦ FILE: Phương · SCRUM-143. Giữ tương thích prop công khai. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, disabled, type = 'button', className = '', children, ...props }, ref,
) {
  return <button {...props} ref={ref} type={type} disabled={disabled || loading}
    aria-busy={loading || undefined} className={`gf-button gf-button--${variant} ${className}`}>
    {loading && <span className="gf-spinner" aria-hidden="true" />}{children}
  </button>;
});
export default Button;
