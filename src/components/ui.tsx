import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { cx } from '../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

export function Button({
  variant = 'secondary', size = 'md', className, children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 disabled:pointer-events-none active:scale-[.98]',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-[15px]',
        variant === 'primary' && 'bg-brand text-brand-ink hover:bg-brand-strong shadow-[0_6px_20px_-8px_var(--brand)]',
        variant === 'secondary' && 'bg-surface-3 text-fg hover:brightness-110',
        variant === 'ghost' && 'text-muted hover:text-fg hover:bg-surface-2',
        variant === 'outline' && 'border border-line text-fg hover:bg-surface-2',
        variant === 'danger' && 'bg-danger text-white hover:brightness-110',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Botão que pede um segundo clique para confirmar ações destrutivas. */
export function ConfirmButton({ onConfirm, confirmLabel = 'Clique de novo para confirmar', children, ...rest }:
  Omit<Parameters<typeof Button>[0], 'onClick'> & { onConfirm: () => void; confirmLabel?: string }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <Button {...rest} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? confirmLabel : children}
    </Button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-surface shadow-card', className)}>{children}</div>
}

export function CardHeader({ eyebrow, title, action, sub }: { eyebrow?: string; title: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
      <div className="min-w-0">
        {eyebrow && <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{eyebrow}</div>}
        <h2 className="mt-0.5 text-lg font-bold tracking-tight">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}

export function PageHeader({ eyebrow, title, sub, action }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-in">
      <div>
        {eyebrow && <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">{eyebrow}</div>}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1.5 text-sm text-muted">{sub}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}

const tones = {
  brand: 'bg-brand-soft text-brand',
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
  muted: 'bg-surface-3 text-muted',
}
export type Tone = keyof typeof tones

export function Badge({ tone = 'muted', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold', tones[tone], className)}>
      {children}
    </span>
  )
}

const fieldBase =
  'w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-fg placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(fieldBase, 'h-11', props.className)} />
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(fieldBase, 'h-11 cursor-pointer', props.className)} />
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cx(fieldBase, 'py-2.5 resize-y', props.className)} />
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  )
}

export function Modal({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('animate-in flex max-h-[92vh] w-full flex-col rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options, className }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string
}) {
  return (
    <div className={cx('inline-flex rounded-xl border border-line bg-surface-2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition',
            value === o.value ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">{icon}</div>
      <div className="font-bold">{title}</div>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const ini = name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-info font-bold text-brand-ink"
    >
      {ini}
    </span>
  )
}

export function Progress({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'danger' | 'warn' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className={cx('h-full rounded-full transition-all duration-500', tone === 'brand' ? 'bg-brand' : tone === 'danger' ? 'bg-danger' : 'bg-warn')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
