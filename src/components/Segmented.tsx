import { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface SegmentedOption<T extends string> {
  v: T
  label: string
  Icon?: LucideIcon
  color?: string
}

/**
 * Segmented radiogroup with roving focus: only the checked option is in the tab
 * order, and the arrow keys (plus Home/End) move both focus and selection.
 */
export default function Segmented<T extends string>({ label, value, onChange, options, size = 'md', className = '' }: {
  label: string; value: T; onChange: (v: T) => void
  options: Array<SegmentedOption<T>>; size?: 'md' | 'sm'; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onKey = (e: React.KeyboardEvent) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const i = options.findIndex(o => o.v === value)
    const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown'
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1
      : (i + (fwd ? 1 : options.length - 1)) % options.length
    onChange(options[n].v)
    requestAnimationFrame(() => ref.current?.querySelectorAll<HTMLButtonElement>('[role=radio]')[n]?.focus())
  }
  return (
    <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={onKey}
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-border bg-bg-card p-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} ${className}`}>
      {options.map(o => {
        const on = value === o.v
        return (
          <button key={o.v} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.v)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-medium transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue
              ${on ? 'bg-bg-muted text-text shadow-sm' : 'text-text-2 hover:text-text'}`}>
            {o.Icon && <o.Icon size={16} aria-hidden="true" className={on ? (o.color ?? 'text-domain-idira') : 'text-text-muted'} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
