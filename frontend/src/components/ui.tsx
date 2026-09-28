import { useEffect, useRef, type ButtonHTMLAttributes, type FormEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertCircle, Check, X } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
  size?: 'small' | 'medium'
  icon?: ReactNode
}

export function Button({ variant = 'primary', size = 'medium', icon, className = '', children, ...props }: ButtonProps) {
  return <button className={`button button-${variant} button-${size} ${className}`} {...props}>
    {icon}{children}
  </button>
}

export function IconButton({ label, className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>
}

export function Field({ label, hint, error, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}) {
  const id = props.id || props.name
  return <div className={`field ${className}`}>
    <label htmlFor={id}>{label}</label>
    <input {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} />
    {hint && !error && <small id={`${id}-hint`} className="field-hint">{hint}</small>}
    {error && <small id={`${id}-error`} className="field-error">{error}</small>}
  </div>
}

export function SelectField({ label, children, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = props.id || props.name
  return <div className={`field ${className}`}>
    <label htmlFor={id}>{label}</label>
    <select {...props} id={id}>{children}</select>
  </div>
}

export function TextareaField({ label, className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = props.id || props.name
  return <div className={`field ${className}`}>
    <label htmlFor={id}>{label}</label>
    <textarea {...props} id={id} />
  </div>
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-header">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
    {action && <div className="page-header-action">{action}</div>}
  </header>
}

export function SectionHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="section-heading">
    <div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>
    {action}
  </div>
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' | 'error' | 'success' }) {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? Check : AlertCircle
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
    <Icon size={17} aria-hidden="true" /><div>{children}</div>
  </div>
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return <div className="loading-block" aria-label="Loading" role="status">
    {Array.from({ length: rows }, (_, index) => <span key={index} />)}
  </div>
}

export function EmptyState({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{detail}</p>
    {action && <div className="empty-action">{action}</div>}
  </div>
}

export function Modal({ open, title, description, onClose, children, size = 'medium' }: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  size?: 'medium' | 'large'
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    document.body.classList.add('modal-open')
    ref.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.classList.remove('modal-open')
    }
  }, [open, onClose])

  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div ref={ref} className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-heading">
        <div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
}

export function Form({ onSubmit, children, className = '' }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode; className?: string }) {
  return <form className={className} onSubmit={onSubmit}>{children}</form>
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="form-actions">{children}</div>
}

export function Currency({ amount, code = 'INR', compact = false }: { amount: number; code?: string; compact?: boolean }) {
  let formatted: string
  try {
    formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: code, notation: compact ? 'compact' : 'standard', maximumFractionDigits: 2 }).format(amount)
  } catch {
    formatted = `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount)} ${code}`
  }
  return <>{formatted}</>
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className={`status-badge status-${tone}`}><span className="status-dot" />{children}</span>
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 3200)
    return () => window.clearTimeout(timeout)
  }, [onClose])
  return <div className="toast" role="status"><Check size={16} />{message}<button onClick={onClose} aria-label="Dismiss"><X size={15} /></button></div>
}