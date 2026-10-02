import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import ThemeToggle from '../ThemeToggle'
import EnvStatus from './EnvStatus'
import CommandPalette from './CommandPalette'
import VisitCounter from './VisitCounter'
import LanguageSwitcher from './LanguageSwitcher'
import SideNav from './SideNav'
import logoLight from '../../assets/brand/idira-logo-light.png'
import logoDark from '../../assets/brand/idira-logo-dark.png'

const COLLAPSE_KEY = 'idira-sidebar-collapsed'

function readCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false }
}

/**
 * Official IDIRA lockup ("IDIRA by Palo Alto Networks"), never recoloured:
 * light-background artwork in the light theme, dark-background artwork in the
 * dark theme (official black-ground artwork converted to alpha. Exact, no recolour).
 */
function Brand() {
  return (
    <Link to="/" aria-label="IDIRA by Palo Alto Networks: Home" className="flex items-center shrink-0 rounded-md">
      <img src={logoLight} alt="" width={248} height={70} className="h-9 w-auto dark:hidden" />
      <img src={logoDark} alt="" width={251} height={71} className="hidden h-9 w-auto dark:block" />
    </Link>
  )
}

/**
 * App shell (DESIGN.md §6): theme-aware top bar with the official IDIRA logo +
 * status + language + theme; grouped sidebar on the left (≥ lg, collapsible to icons, persisted);
 * the same navigation as a slide-in drawer below lg.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawer, setDrawer] = useState(false)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') } catch { /* private mode */ }
  }, [collapsed])

  // Drawer: close on navigation, Escape; lock page scroll; manage focus.
  useEffect(() => { setDrawer(false) }, [pathname])
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()
    const trigger = menuBtn.current
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      trigger?.focus()
    }
  }, [drawer])

  const pad = collapsed ? 'lg:pl-16' : 'lg:pl-60'

  return (
    <div className="min-h-screen bg-bg-base text-text">
      {/* ── Top bar ── */}
      <header className="nav-iridescent fixed top-0 inset-x-0 z-50 h-14 bg-bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="h-full px-2 sm:px-4 flex items-center gap-2">
          {/* < lg: opens the drawer · ≥ lg: collapses / expands the sidebar */}
          <button ref={menuBtn} type="button" onClick={() => setDrawer(true)}
            aria-label={t('nav.open_menu')} aria-expanded={drawer} aria-controls="nav-drawer"
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-text-2 hover:bg-bg-muted hover:text-text transition-colors">
            <Menu size={20} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? t('nav.expand') : t('nav.collapse')} aria-pressed={!collapsed}
            title={collapsed ? t('nav.expand') : t('nav.collapse')}
            className="hidden lg:inline-flex h-11 w-11 items-center justify-center rounded-md text-text-2 hover:bg-bg-muted hover:text-text transition-colors">
            {collapsed ? <PanelLeftOpen size={20} aria-hidden="true" /> : <PanelLeftClose size={20} aria-hidden="true" />}
          </button>
          <div className="pl-1"><Brand /></div>
          <span className="hidden xl:block h-7 w-px bg-border" aria-hidden="true" />
          <span className="hidden xl:block text-sm font-semibold leading-tight text-text">{t('shell.site_name')}</span>
          <VisitCounter className="hidden md:flex ml-1" />

          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <EnvStatus />
            <LanguageSwitcher className="hidden sm:flex" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Sidebar (≥ lg) ── */}
      <aside className={`hidden lg:flex fixed top-14 bottom-0 left-0 z-40 flex-col border-r border-border bg-bg-card
        ${collapsed ? 'w-16' : 'w-60'}`}>
        <nav aria-label={t('nav.primary')} className="flex-1 overflow-y-auto overscroll-contain px-2 py-4">
          <SideNav collapsed={collapsed} dense idPrefix="side" />
        </nav>
      </aside>

      {/* ── Drawer (< lg) ── */}
      <AnimatePresence>
        {drawer && (
          <div className="lg:hidden fixed inset-0 z-[60]" id="nav-drawer">
            <motion.button type="button" aria-label={t('nav.close_menu')} tabIndex={-1}
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-black/55"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }} />
            <motion.div role="dialog" aria-modal="true" aria-label={t('nav.primary')}
              className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-bg-card border-r border-border shadow-2xl"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={reduce ? { duration: 0 } : { type: 'tween', duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}>
              <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-3">
                <Brand />
                <button ref={closeBtn} type="button" onClick={() => setDrawer(false)} aria-label={t('nav.close_menu')}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-2 hover:bg-bg-muted hover:text-text transition-colors">
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <nav aria-label={t('nav.primary')} className="flex-1 overflow-y-auto overscroll-contain px-2 py-4">
                <SideNav idPrefix="drawer" />
              </nav>
              <div className="border-t border-border p-3">
                <LanguageSwitcher />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Content column ── */}
      <div className={pad}>
        {children}
      </div>
    </div>
  )
}
