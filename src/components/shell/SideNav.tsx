import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { navBy, SECTIONS, type NavItem } from '../../lib/nav'

/** Split a group's flat items into runs: plain items, or a run sharing one `section` (submenu). */
function segments(items: NavItem[]) {
  const out: Array<{ section?: NavItem['section']; items: NavItem[] }> = []
  for (const it of items) {
    const last = out[out.length - 1]
    if (last && last.section === it.section) last.items.push(it)
    else out.push({ section: it.section, items: [it] })
  }
  return out
}

/**
 * Grouped site navigation (sidebar + mobile drawer).
 * - Each group header is a disclosure button: show / hide its items. Every
 *   group and submenu starts collapsed on each visit (nothing is persisted);
 *   what the visitor opens stays open while they navigate. A collapsed group
 *   that holds the current page gets a tinted header.
 * - Current page: tinted row + left accent bar + aria-current.
 * - `collapsed` (icon rail): no headers, every item visible, labels kept for
 *   screen readers and as tooltips.
 */
export default function SideNav({ collapsed = false, dense = false, idPrefix = 'nav' }: {
  collapsed?: boolean; dense?: boolean; idPrefix?: string
}) {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  // Items may deep-link a page state (e.g. /secretshub?env=pamsh): such an item is
  // active only with its query; the plain path item yields when a sibling matches.
  const all = navBy('usecase').flatMap(g => g.items)
  const isActive = (to: string) => {
    if (to.includes('?')) return pathname + search === to
    return pathname === to && !all.some(o => o.to.includes('?') && o.to === pathname + search)
  }
  const groups = navBy('usecase')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const isOpen = (key: string) => open[key] === true    // default: collapsed

  const toggle = (key: string) => {
    const opening = !isOpen(key)
    setOpen(o => ({ ...o, [key]: opening }))
    // Bring the items that just appeared into view (a group near the bottom
    // would otherwise open below the fold with no visible change).
    if (opening) {
      const id = key.startsWith('sec-') ? `${idPrefix}-${key}` : `${idPrefix}-grp-${key}`
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
    }
  }

  const row = (item: NavItem, nested = false) => {
    const active = isActive(item.to)
    const label = t(nested && item.shortKey ? item.shortKey : item.labelKey)
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

  const withHeadings = (items: NavItem[], nested = false) => {
    let last: string | undefined
    return items.flatMap(it => {
      const out = []
      if (it.heading && it.heading !== last) {
        out.push(
          <li key={`h-${it.heading}-${it.to}`}
            className={`px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted ${nested ? 'pt-2' : 'pt-3'}`}>
            {t(it.heading)}
          </li>,
        )
      }
      last = it.heading
      out.push(row(it, Boolean(it.heading) || nested))
      return out
    })
  }

  return (
    <div className="space-y-1">
      {groups.map((group, gi) => {
        const label = group.labelKey ? t(group.labelKey) : undefined
        const expanded = collapsed || !group.labelKey || isOpen(group.key)
        const listId = `${idPrefix}-grp-${group.key}`
        const hasActive = group.items.some(i => isActive(i.to))
        return (
          <div key={group.key} className={gi === 0 ? '' : dense ? 'pt-2' : 'pt-3'}>
            {label && (collapsed
              ? <div className="mx-3 mb-2 h-px bg-border" aria-hidden="true" />
              : (
                <button type="button" onClick={() => toggle(group.key)}
                  aria-expanded={expanded} aria-controls={listId}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 text-left transition-colors duration-150
                    hover:bg-bg-muted/70 ${dense ? 'min-h-9' : 'min-h-11'} ${hasActive && !expanded ? 'bg-bg-muted/60' : ''}`}>
                  {group.Icon && <group.Icon size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-domain-idira" />}
                  <span className={`flex-1 text-sm font-semibold leading-tight ${hasActive ? 'text-text' : 'text-text-2'}`}>{label}</span>
                  {!expanded && (
                    <span className="rounded-full bg-bg-muted px-1.5 font-mono text-[11px] text-text-muted tabular-nums">
                      {group.items.length}
                    </span>
                  )}
                  <ChevronDown size={16} strokeWidth={2} aria-hidden="true"
                    className={`shrink-0 text-text-muted transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
                </button>
              ))}
            <ul id={listId} hidden={!expanded} className={`space-y-0.5 ${label && !collapsed ? 'mt-1 ml-[19px] border-l border-border pl-2.5' : ''}`}
              aria-label={label}>
              {segments(group.items).map(seg => {
                if (collapsed) return seg.items.map(i => row(i))
                if (!seg.section) return withHeadings(seg.items)
                // Collapsible submenu: styled as a sub-section header (not a link), chevron
                // down when open, item count when closed, children under a guide line.
                const sec = SECTIONS[seg.section]
                const key = `sec-${seg.section}`
                const subActive = seg.items.some(i => isActive(i.to))
                const subOpen = open[key] === true
                const subId = `${idPrefix}-${key}`
                return (
                  <li key={key} className="pt-2">
                    <button type="button" onClick={() => toggle(key)} aria-expanded={subOpen} aria-controls={subId}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 text-left transition-colors duration-150
                        hover:bg-bg-muted/70
                        ${dense ? 'min-h-9' : 'min-h-11'} ${subActive && !subOpen ? 'bg-bg-muted/60' : ''}`}>
                      <sec.Icon size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-domain-idira" />
                      <span className={`flex-1 text-sm font-semibold leading-tight ${subActive ? 'text-text' : 'text-text-2'}`}>{t(sec.labelKey)}</span>
                      {!subOpen && (
                        <span className="rounded-full bg-bg-muted px-1.5 font-mono text-[11px] text-text-muted tabular-nums">{seg.items.length}</span>
                      )}
                      <ChevronDown size={16} strokeWidth={2} aria-hidden="true"
                        className={`shrink-0 text-text-muted transition-transform duration-200 ${subOpen ? '' : '-rotate-90'}`} />
                    </button>
                    <ul id={subId} hidden={!subOpen} className="mt-1 ml-[15px] space-y-0.5 border-l border-border pl-2">
                      {withHeadings(seg.items, true)}
                    </ul>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
