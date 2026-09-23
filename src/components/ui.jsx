import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg', footer, header }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className={`anim-pop w-full ${width} bg-white rounded-2xl shadow-xl max-h-[88vh] flex flex-col`} onMouseDown={(e) => e.stopPropagation()}>
        {title && (
          <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-(--color-line)">
            <div>
              <div className="text-lg font-semibold">{title}</div>
              {subtitle && <div className="text-sm text-(--color-ink-soft) mt-0.5">{subtitle}</div>}
            </div>
            <button aria-label="Close" onClick={onClose} className="p-1.5 rounded-lg border border-(--color-line) hover:bg-(--color-paper)">
              <X size={16} />
            </button>
          </div>
        )}
        {header}
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-3 border-t border-(--color-line) flex justify-center gap-2">{footer}</div>}
      </div>
    </div>
  )
}

// All pop-ups render as the same centred card. `width` accepts the old 'w-[Npx]' form.
export function Drawer({ open, onClose, title, subtitle, children, width = 'w-[560px]', header, footer }) {
  const max = width.startsWith('w-') ? 'max-' + width : width
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} width={max} header={header} footer={footer}>
      {children}
    </Modal>
  )
}

export function Popover({ open, onClose, children, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = (e) => ref.current && !ref.current.contains(e.target) && onClose()
    const k = (e) => e.key === 'Escape' && onClose()
    setTimeout(() => document.addEventListener('mousedown', h), 0)
    window.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      window.removeEventListener('keydown', k)
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div ref={ref} className={`absolute z-40 bg-white border border-(--color-line) rounded-xl shadow-lg anim-rise ${className}`}>
      {children}
    </div>
  )
}

export function Btn({ children, variant = 'primary', size = 'md', className = '', ...rest }) {
  const v = {
    primary: 'bg-(--color-teal) text-white hover:bg-[#2fae95] shadow-sm',
    ghost: 'text-(--color-ink-soft) hover:bg-(--color-paper)',
    outline: 'border border-(--color-line) bg-white text-(--color-ink) hover:bg-(--color-paper)',
    amber: 'bg-(--color-amber) text-white hover:brightness-95',
    danger: 'border border-(--color-coral)/30 text-(--color-coral) bg-white hover:bg-(--color-coral-soft)',
  }[variant]
  const s = { sm: 'text-xs px-2.5 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-sm px-5 py-2.5' }[size]
  return (
    <button className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition disabled:opacity-50 ${v} ${s} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Pill({ children, tone = 'teal', className = '' }) {
  const t = {
    teal: 'bg-(--color-teal-soft) text-(--color-teal-dark)',
    amber: 'bg-(--color-amber-soft) text-(--color-amber)',
    coral: 'bg-(--color-coral-soft) text-(--color-coral)',
    blue: 'bg-(--color-blue-soft) text-(--color-blue)',
    grey: 'bg-(--color-paper) text-(--color-ink-soft) border border-(--color-line)',
    outline: 'bg-white text-(--color-ink) border border-(--color-line)',
  }[tone]
  return <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${t} ${className}`}>{children}</span>
}

export function SectionTitle({ children, sub, right }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <div className="text-[15px] font-semibold text-(--color-ink)">{children}</div>
        {sub && <div className="text-xs text-(--color-ink-soft) mt-0.5">{sub}</div>}
      </div>
      {right}
    </div>
  )
}

// Data-source labels were removed from the demo UI; kept as no-ops so call sites stay simple.
export function Illustrative() {
  return null
}

export function SourceTag() {
  return null
}

export function Avatar({ initials, size = 32, tone = 'teal' }) {
  const bg = tone === 'teal' ? 'bg-(--color-teal) text-white' : 'bg-(--color-teal-soft) text-(--color-teal-dark)'
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${bg}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </span>
  )
}

export function fmtDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-GB', opts)
}

export function fmtTime(t) {
  const [h, m] = t.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
