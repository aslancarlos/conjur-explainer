import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from '../../lib/router'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'framer-motion'
import { ChevronDown, Layers } from 'lucide-react'
import { HEADINGS, navBy, SECTIONS, ZONES, type NavGroup, type NavItem } from '../../lib/nav'
import NavGlyph from './NavGlyph'

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

/** Product colour as a hairline ring around the group's icon tile (literal classes so Tailwind keeps them). */
const RING: Record<string, string> = {
  'text-domain-idira': 'ring-[1.5px] ring-domain-idira/70',
  'text-tone-live': 'ring-[1.5px] ring-tone-live/70',
  'text-domain-cp': 'ring-[1.5px] ring-domain-cp/70',
  'text-domain-svc': 'ring-[1.5px] ring-domain-svc/70',
}

const chevron = (open: boolean) => (
  <ChevronDown size={16} strokeWidth={2} aria-hidden="true"
    className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
)

/**
 * Grouped site navigation (sidebar + mobile drawer).
 * - Sections with an overline label (Start here · Products · Resources, see
 *   ZONES in lib/nav). Resources are flat links.
 * - Each other group header is a disclosure button; sub-heading runs of two or
 *   more items are submenus (third level inside a submenu). Every level starts collapsed on each visit (nothing is persisted); what the visitor
 *   opens stays open while they navigate. A collapsed group holding the
 *   current page gets a tinted header.
 * - Product colour: a thin ring around the group's icon tile (no bars, no counts).
 * - Current page: tinted row + left accent bar + aria-current.
 * - `collapsed` (icon rail): no labels or headers, every item visible, section
 *   labels become thin separators; names stay for screen readers and tooltips.
 */
/** Full product/component name; a trailing official acronym "(ASCP)" is shown
 *  muted after it (never instead of it). Wraps to two lines when needed. */
function NavLabel({ text, className = '' }: { text: string; className?: string }) {
  const m = text.match(/^(.*\S)\s+\(([A-Z0-9/.-]{2,8})\)$/)
  return (
    <span className={`min-w-0 flex-1 text-sm leading-5 [overflow-wrap:anywhere] ${className}`}>
      {m ? <>{m[1]} <span className="whitespace-nowrap font-normal text-text-muted">{m[2]}</span></> : text}
    </span>
  )
}

export default function SideNav({ collapsed = false, dense = false, idPrefix = 'nav' }: {
  collapsed?: boolean; dense?: boolean; idPrefix?: string
}) {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  const groups = navBy('usecase')
  // Items may deep-link a page state (e.g. /secretshub?env=pamsh): such an item is
  // active only with its query; the plain path item yields when a sibling matches.
  // Whether some query item matches the current URL is the same for every row:
  // compute it once per render instead of scanning all items per row.
  const here = pathname + search
  const queryHit = groups.some(g => g.items.some(o => o.to.includes('?') && o.to === here))
  const isActive = (to: string) => {
    if (to.includes('?')) return here === to
    return pathname === to && !queryHit
  }
  const reduce = useReducedMotion()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const isOpen = (key: string) => open[key] === true    // default: collapsed
  const rowH = dense ? 'min-h-9' : 'min-h-11'

  const toggle = (key: string, listId: string) => {
    const opening = !isOpen(key)
    setOpen(o => ({ ...o, [key]: opening }))
    // Bring the items that just appeared into view (a group near the bottom
    // would otherwise open below the fold with no visible change).
    if (opening) {
      requestAnimationFrame(() => document.getElementById(listId)?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }))
    }
  }

  /** Disclosure header shared by every level (group, submenu, sub-submenu). */
  const disclosure = (key: string, listId: string, label: string, glyph: ReactNode, active: boolean, weight: string, badge?: ReactNode) => {
    const expanded = isOpen(key)
    return (
      <button type="button" onClick={() => toggle(key, listId)} aria-expanded={expanded} aria-controls={listId}
        className={`flex w-full items-center gap-3 rounded-lg px-3 text-left transition-colors duration-150
          hover:bg-bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue
          ${rowH} ${active && !expanded ? 'bg-bg-muted/60' : ''}`}>
        {glyph}
        <NavLabel text={label} className={`${weight} ${active ? 'text-text' : 'text-text-2'}`} />
        {badge}
        {chevron(expanded)}
      </button>
    )
  }

  const row = (item: NavItem) => {
    const active = isActive(item.to)
    const label = t(item.shortKey ?? item.labelKey)
    const cls =
      'group relative flex items-start gap-3 rounded-lg transition-colors duration-150 ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue ' +
      (collapsed ? 'h-10 w-10 items-center justify-center mx-auto ' : `${rowH} px-3 py-1.5 `) +
      (active ? 'bg-bg-muted text-text font-semibold' : 'text-text-2 hover:bg-bg-muted/70 hover:text-text')
    const inner = (
      <>
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-idira-blue" aria-hidden="true" />
        )}
        <NavGlyph logo={item.logo} Icon={item.Icon} className={item.color ?? 'text-text-2'} />
        {collapsed ? <span className="sr-only">{label}</span> : <NavLabel text={label} />}
      </>
    )
    const tip = t(item.labelKey) !== label ? t(item.labelKey) : item.subKey ? t(item.subKey) : undefined
    const common = {
      className: cls,
      title: collapsed ? label : tip,
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


  /**
   * Items sharing a sub-heading form a collapsible submenu one level down
   * (inside a group: with an icon, like Use cases; inside a submenu: a third
   * level without icon). A heading with a single item adds a click for nothing,
   * so that item is listed directly; items without a heading stay plain rows.
   */
  const byHeading = (scope: string, items: NavItem[], tint: string, nested: boolean) => {
    const runs: Array<{ heading?: string; items: NavItem[] }> = []
    for (const it of items) {
      const last = runs[runs.length - 1]
      if (last && last.heading === it.heading) last.items.push(it)
      else runs.push({ heading: it.heading, items: [it] })
    }
    return runs.flatMap(run => {
      if (!run.heading || run.items.length < 2) return run.items.map(row)
      const key = `sub-${scope}-${run.heading}`
      const listId = `${idPrefix}-${key.replace(/\./g, '-')}`
      const active = run.items.some(i => isActive(i.to))
      const icon = HEADINGS[run.heading]
      const glyph = nested ? null : <NavGlyph logo={icon?.logo} Icon={icon?.Icon ?? Layers} iconSize={16} className={tint} />
      return [
        <li key={key}>
          {disclosure(key, listId, t(run.heading), glyph, active, 'font-medium')}
          <ul id={listId} hidden={!isOpen(key)} aria-label={t(run.heading)}
            className={`mt-0.5 space-y-0.5 border-l border-border pl-2 ${nested ? 'ml-3' : 'ml-[21px]'}`}>
            {run.items.map(row)}
          </ul>
        </li>,
      ]
    })
  }

  const groupBlock = (group: NavGroup) => {
    const label = group.labelKey ? t(group.labelKey) : undefined
    // Plain groups (home) and flat groups (resources) list their items directly.
    if (!label || group.flat || collapsed) {
      return <ul key={group.key} className="space-y-0.5">{group.items.map(row)}</ul>
    }
    const expanded = isOpen(group.key)
    const listId = `${idPrefix}-grp-${group.key}`
    const hasActive = group.items.some(i => isActive(i.to))
    return (
      <div key={group.key}>
        {disclosure(group.key, listId, label,
          <NavGlyph logo={group.logo} Icon={group.Icon} iconSize={16} className={group.color ?? 'text-domain-idira'}
            accent={RING[group.color ?? '']} />,
          hasActive, 'font-semibold')}
        <ul id={listId} hidden={!expanded} aria-label={label}
          className="mt-0.5 mb-1 ml-[21px] space-y-0.5 border-l border-border pl-2">
          {segments(group.items).map(seg => {
            const tint = group.color ?? 'text-domain-idira'
            if (!seg.section) return byHeading(group.key, seg.items, tint, false)
            // Collapsible submenu: a sub-section header (not a link) with a chevron,
            // children under a guide line.
            const sec = SECTIONS[seg.section]
            const key = `sec-${seg.section}`
            const subActive = seg.items.some(i => isActive(i.to))
            const subId = `${idPrefix}-${key}`
            return (
              <li key={key}>
                {disclosure(key, subId, t(sec.labelKey),
                  <NavGlyph logo={sec.logo} Icon={sec.Icon} iconSize={16} className={group.color ?? 'text-domain-idira'} />,
                  subActive, 'font-medium',
                  sec.highlight && (
                    <span className="shrink-0 rounded-full border border-domain-idira/50 bg-domain-idira/15 px-2 text-xs font-semibold leading-5 tabular-nums text-text">
                      {seg.items.length}
                    </span>
                  ))}
                <ul id={subId} hidden={!isOpen(key)} className="mt-0.5 ml-[21px] space-y-0.5 border-l border-border pl-2">
                  {byHeading(seg.section, seg.items, tint, true)}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <div>
      {ZONES.map((zone, zi) => {
        const zg = groups.filter(g => g.zone === zone.key)
        if (!zg.length) return null
        const labelId = `${idPrefix}-zone-${zone.key}`
        return (
          <div key={zone.key} role="group" aria-labelledby={labelId} className={zi === 0 ? '' : 'pt-4'}>
            {collapsed
              ? <>
                  {zi > 0 && <div className="mx-3 mb-3 h-px bg-border" aria-hidden="true" />}
                  <span id={labelId} className="sr-only">{t(zone.labelKey)}</span>
                </>
              : <p id={labelId} className="text-overline px-3 pb-2">
                  {t(zone.labelKey)}
                </p>}
            <div className="space-y-0.5">{zg.map(groupBlock)}</div>
          </div>
        )
      })}
    </div>
  )
}
