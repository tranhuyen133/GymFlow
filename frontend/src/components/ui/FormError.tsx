/** CHỦ FILE: Phương · SCRUM-147, dùng cùng Input (SCRUM-143). */
export interface FormErrorProps { error?: string; fieldId?: string }
export function FormError({ error, fieldId }: FormErrorProps) {
  return error ? <span className="gf-field-error" role="alert" id={fieldId ? `${fieldId}-error` : undefined}>{error}</span> : null;
}
export default FormError;
