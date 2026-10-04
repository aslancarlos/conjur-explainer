import type { LucideIcon } from 'lucide-react'

/**
 * Two-option segmented control (radiogroup, 44px targets) used by the
 * Kubernetes pages to swap the diagram between two modes, e.g. Kubernetes
 * Secrets vs Push-to-File. Same look as the PlatformSwitch in CpPieces.
 */
export default function ModeSwitch<T extends string>({ label, value, onChange, options }: {
  label: string
  value: T
  onChange: (v: T) => void
  options: Array<{ v: T; label: string; Icon: LucideIcon }>
}) {
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const i = options.findIndex(o => o.v === value)
    const next = (i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length
    onChange(options[next].v)
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey}
      className="inline-flex rounded-xl border border-border bg-bg-card p-1">
      {options.map(o => {
        const on = value === o.v
        return (
          <button key={o.v} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.v)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-200
              ${on ? 'bg-bg-muted text-text shadow-sm' : 'text-text-2 hover:text-text'}`}>
            <o.Icon size={16} aria-hidden="true" className={on ? 'text-domain-k8s' : 'text-text-muted'} />{o.label}
          </button>
        )
      })}
    </div>
  )
}
