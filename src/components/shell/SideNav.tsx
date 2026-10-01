import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { NAV, type NavItem } from '../../lib/nav'

const GROUPS_KEY = 'idira-nav-groups'

function readOpen(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}') } catch { return {} }
}

/**
 * Grouped site navigation (sidebar + mobile drawer).
 * - Each group header is a disclosure button: show / hide its items. Choice is
 *   persisted; the group holding the current page always opens.
 * - Current page: tinted row + left accent bar + aria-current.
 * - `collapsed` (icon rail): no headers, every item visible, labels kept for
 *   screen readers and as tooltips.
 */
export default function SideNav({ collapsed = false, dense = false, idPrefix = 'nav' }: {
  collapsed?: boolean; dense?: boolean; idPrefix?: string
}) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [open, setOpen] = useState<Record<string, boolean>>(readOpen)
  const isOpen = (key: string) => open[key] !== false   // default: expanded

  // Navigating into a hidden group reveals it.
  useEffect(() => {
    const g = NAV.find(gr => gr.items.some(i => i.to === pathname))
    if (g && open[g.key] === false) setOpen(o => ({ ...o, [g.key]: true }))
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try { localStorage.setItem(GROUPS_KEY, JSON.stringify(open)) } catch { /* private mode */ }
  }, [open])

  const toggle = (key: string) => setOpen(o => ({ ...o, [key]: !isOpen(key) }))

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
      {NAV.map((group, gi) => {
        const label = group.labelKey ? t(group.labelKey) : undefined
        const expanded = collapsed || !group.labelKey || isOpen(group.key)
        const listId = `${idPrefix}-grp-${group.key}`
        const hasActive = group.items.some(i => i.to === pathname)
        return (
          <div key={group.key} className={gi === 0 ? '' : dense ? 'pt-2' : 'pt-3'}>
            {label && (collapsed
              ? <div className="mx-3 mb-2 h-px bg-border" aria-hidden="true" />
              : (
                <button type="button" onClick={() => toggle(group.key)}
                  aria-expanded={expanded} aria-controls={listId}
                  className={`flex w-full items-center gap-2 rounded-md px-3 text-left text-xs font-semibold uppercase tracking-wider
                    transition-colors hover:bg-bg-muted/70 hover:text-text ${dense ? 'min-h-8' : 'min-h-11'}
                    ${hasActive && !expanded ? 'text-text' : 'text-text-muted'}`}>
                  <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true"
                    className={`shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
                  <span className="flex-1 truncate">{label}</span>
                  {!expanded && (
                    <span className="rounded-full bg-bg-muted px-1.5 font-mono text-[11px] normal-case tracking-normal text-text-muted tabular-nums">
                      {group.items.length}
                    </span>
                  )}
                </button>
              ))}
            <ul id={listId} hidden={!expanded} className={`space-y-0.5 ${label && !collapsed ? 'mt-0.5' : ''}`}
              aria-label={label}>
              {group.items.map(row)}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
