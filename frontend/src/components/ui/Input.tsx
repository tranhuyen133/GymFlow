import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { FormError } from './FormError';
/** CHỦ FILE: Phương · SCRUM-143. */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; helper?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, helper, className = '', 'aria-describedby': describedBy, ...props }, ref,
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const description = [describedBy, helper && `${fieldId}-help`, error && `${fieldId}-error`].filter(Boolean).join(' ');
  return <div className="gf-field">
    {label && <label htmlFor={fieldId}>{label}{props.required && <span aria-hidden="true"> *</span>}</label>}
    <input {...props} ref={ref} id={fieldId} className={`gf-input ${className}`}
      aria-invalid={error ? true : props['aria-invalid']} aria-describedby={description || undefined} />
    {helper && <small id={`${fieldId}-help`} className="gf-helper">{helper}</small>}
    <FormError fieldId={fieldId} error={error} />
  </div>;
});
export default Input;
