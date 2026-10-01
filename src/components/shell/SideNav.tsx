import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NAV, type NavItem } from '../../lib/nav'

/**
 * Grouped site navigation (sidebar + mobile drawer). Current page gets a
 * left accent bar, tinted row and aria-current. Collapsed = icons only, with
 * the label kept for screen readers and as a native tooltip.
 */
export default function SideNav({ collapsed = false, dense = false }: { collapsed?: boolean; dense?: boolean }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const row = (item: NavItem) => {
    const active = pathname === item.to
    const label = t(item.labelKey)
    const cls =
      'group relative flex items-center gap-3 rounded-lg transition-colors duration-150 ' +
      (collapsed ? 'h-10 w-10 justify-center mx-auto ' : dense ? 'min-h-9 px-3 py-1.5 ' : 'min-h-11 px-3 py-2 ') +
      (active ? 'bg-bg-muted text-text font-semibold' : 'text-text-2 hover:bg-bg-muted/70 hover:text-text')
    const inner = (
      <>
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-idira-blue" aria-hidden="true" />
        )}
        <item.Icon size={18} strokeWidth={1.9} aria-hidden="true" className={`shrink-0 ${item.color ?? 'text-text-2'}`} />
        <span className={collapsed ? 'sr-only' : 'text-sm leading-tight'}>{label}</span>
      </>
    )
    const common = {
      className: cls,
      title: collapsed ? label : item.subKey ? t(item.subKey) : undefined,
      'aria-current': active ? ('page' as const) : undefined,
    }
    return (
      <li key={item.to}>
        {item.href
          ? <a href={item.href} {...common}>{inner}</a>
          : <Link to={item.to} {...common}>{inner}</Link>}
      </li>
    )
  }

  return (
    <div className="space-y-1">
      {NAV.map((group, gi) => (
        <div key={group.key} className={gi === 0 ? '' : dense ? 'pt-3' : 'pt-4'}>
          {group.labelKey && (collapsed
            ? <div className="mx-3 mb-2 h-px bg-border" aria-hidden="true" />
            : <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t(group.labelKey)}
              </p>)}
          <ul className="space-y-0.5" aria-label={group.labelKey ? t(group.labelKey) : undefined}>
            {group.items.map(row)}
          </ul>
        </div>
      ))}
    </div>
  )
}
