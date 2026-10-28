import type { HTMLAttributes } from 'react';
/** CHỦ FILE: Phương · SCRUM-143. */
export interface CardProps extends HTMLAttributes<HTMLDivElement> { title?: string }
export function Card({ title, children, className = '', ...props }: CardProps) {
  return <div {...props} className={`gf-card ${className}`}>{title && <h3>{title}</h3>}{children}</div>;
}
export default Card;
