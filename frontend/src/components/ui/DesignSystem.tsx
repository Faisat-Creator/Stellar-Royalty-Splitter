import type { ButtonHTMLAttributes, ElementType, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import "./design-system.css";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export function Stack({ gap = "md", className = "", ...props }: HTMLAttributes<HTMLDivElement> & { gap?: "xs" | "sm" | "md" | "lg" | "xl" }) {
  return <div className={`ds-stack ds-stack--${gap} ${className}`.trim()} {...props} />;
}

export function Card({ tone = "default", className = "", ...props }: HTMLAttributes<HTMLDivElement> & { tone?: "default" | "interactive" }) {
  return <section className={`ds-card ds-card--${tone} ${className}`.trim()} {...props} />;
}

export function Badge({ tone = "neutral", children, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone; children: ReactNode }) {
  return <span className={`ds-badge ds-badge--${tone}`} {...props}>{children}</span>;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg" }) {
  return <button className={`ds-button ds-button--${variant} ds-button--${size} ${className}`.trim()} {...props} />;
}

export function Field({ label, hint, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  return <label className="ds-field"><span className="ds-field__label">{label}</span><input className={`ds-input${error ? " ds-input--error" : ""}`} aria-invalid={Boolean(error)} {...props} />{error ? <span className="ds-field__error" role="alert">{error}</span> : hint ? <span className="ds-field__hint">{hint}</span> : null}</label>;
}

export function Alert({ tone = "info", children, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: StatusTone; children: ReactNode }) {
  return <div className={`ds-alert ds-alert--${tone}`} role="status" {...props}>{children}</div>;
}

export function Heading({ level = 2, children, className = "", ...props }: HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 | 5 | 6; children: ReactNode }) {
  const Tag = `h${level}` as ElementType;
  return <Tag className={`ds-heading ds-heading--${level} ${className}`.trim()} {...props}>{children}</Tag>;
}

export function Text({ tone = "primary", size = "md", children, className = "", ...props }: HTMLAttributes<HTMLParagraphElement> & { tone?: "primary" | "secondary" | "muted" | "danger"; size?: "sm" | "md" | "lg"; children: ReactNode }) {
  return <p className={`ds-text ds-text--${tone} ds-text--${size} ${className}`.trim()} {...props}>{children}</p>;
}

export function Divider({ className = "", ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={`ds-divider ${className}`.trim()} {...props} />;
}

export function Spinner({ label = "Loading", size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) {
  return <span className={`ds-spinner ds-spinner--${size}`} role="status" aria-label={label} />;
}

export function Progress({ value, label, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { value: number; label?: string }) {
  const bounded = Math.max(0, Math.min(100, value));
  return <div className={`ds-progress ${className}`.trim()} {...props} aria-label={label ?? `${bounded}% complete`}><span className="ds-progress__bar" style={{ width: `${bounded}%` }} /></div>;
}

export function EmptyState({ title, children, action, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { title: string; action?: ReactNode; children?: ReactNode }) {
  return <div className={`ds-empty-state ${className}`.trim()} {...props}><Heading level={3}>{title}</Heading>{children && <Text tone="secondary">{children}</Text>}{action}</div>;
}

export function IconButton({ label, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button className={`ds-icon-button ${className}`.trim()} aria-label={label} type="button" {...props}>{children}</button>;
}
