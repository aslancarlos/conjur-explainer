import { useTranslation } from 'react-i18next'
import { Boxes, Layers } from 'lucide-react'
import { useNavView } from '../../lib/useNavView'
import type { NavView } from '../../lib/nav'

/** Segmented "Use case | Product" switch (sidebar, drawer, home catalogue). */
export default function NavViewToggle({ size = 'sm', className = '' }: { size?: 'sm' | 'md'; className?: string }) {
  const { t } = useTranslation()
  const [view, setView] = useNavView()
  const opts: Array<{ v: NavView; label: string; Icon: typeof Layers }> = [
    { v: 'usecase', label: t('nav.view_usecase'), Icon: Layers },
    { v: 'product', label: t('nav.view_product'), Icon: Boxes },
  ]
  const h = size === 'md' ? 'min-h-11 px-4 text-sm' : 'min-h-8 px-2 text-xs whitespace-nowrap'
  return (
    <div role="group" aria-label={t('nav.view_label')}
      className={`inline-flex w-full rounded-lg border border-border bg-bg-muted p-0.5 ${className}`}>
      {opts.map(o => (
        <button key={o.v} type="button" onClick={() => setView(o.v)} aria-pressed={view === o.v}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md font-semibold transition-colors duration-150 ${h} ${
            view === o.v ? 'bg-bg-card text-text shadow-sm ring-1 ring-border' : 'text-text-muted hover:text-text'}`}>
          {size === 'md' && <o.Icon size={14} strokeWidth={2} aria-hidden="true" />}
          {o.label}
        </button>
      ))}
    </div>
  )
}
