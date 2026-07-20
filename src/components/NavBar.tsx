import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown, Menu, X,
  RefreshCw, KeyRound, ScrollText, Combine, Server, Boxes, ShipWheel,
  Leaf, Hexagon, Github, ShoppingCart, Database,
  Workflow, GitCompareArrows, Wrench, BadgeCheck, LayoutDashboard,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from './ThemeToggle'
import ApiStatus from './ApiStatus'
import idiraIcon from '../assets/brand/idira-icon-color.png'

const LANGS = ['en', 'pt', 'es'] as const

// Inline SVG flags — crisp and cross-platform (emoji flags don't render on Windows).
// EN = US, PT = Brazil (LATAM audience), ES = Spain.
const FLAGS: Record<(typeof LANGS)[number], ReactNode> = {
  en: (
    <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
      <rect width="20" height="14" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map(i => (
        <rect key={i} y={(i * 14) / 13} width="20" height={14 / 13} fill="#b22234" />
      ))}
      <rect width="8.4" height={(14 / 13) * 7} fill="#3c3b6e" />
    </svg>
  ),
  pt: (
    <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
      <rect width="20" height="14" fill="#009c3b" />
      <polygon points="10,1.5 18,7 10,12.5 2,7" fill="#ffdf00" />
      <circle cx="10" cy="7" r="2.9" fill="#002776" />
    </svg>
  ),
  es: (
    <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
      <rect width="20" height="14" fill="#c60b1e" />
      <rect y="3.5" width="20" height="7" fill="#ffc400" />
    </svg>
  ),
}

interface DropItem {
  to: string
  href?: string   // set for external services that bypass React Router
  labelKey: string
  subKey: string
  color?: string
  Icon: LucideIcon
}

const INTEGRATIONS: DropItem[] = [
  { to: '/dualaccounts', labelKey: 'nav.dualaccounts', subKey: 'nav.dualaccounts_sub', color: 'text-conjur-gold', Icon: RefreshCw },
  { to: '/jwt',          labelKey: 'nav.jwt',           subKey: 'nav.jwt_sub',          color: 'text-gh',          Icon: KeyRound },
  { to: '/policy',       labelKey: 'nav.policy',        subKey: 'nav.policy_sub',       color: 'text-conjur-gold', Icon: ScrollText },
  { to: '/secretshub',   labelKey: 'nav.secretshub',    subKey: 'nav.secretshub_sub',   color: 'text-dotnet',      Icon: Combine },
  { to: '/jenkins',      labelKey: 'nav.jenkins',       subKey: 'nav.jenkins_sub',      color: 'text-spring',      Icon: Server },
  { to: '/ansible',      labelKey: 'nav.ansible',       subKey: 'nav.ansible_sub',      color: 'text-ansible',     Icon: Boxes },
  { to: '/csi',          labelKey: 'nav.csidriver',     subKey: 'nav.csidriver_sub',    color: 'text-csi',         Icon: ShipWheel },
]

const EXAMPLES: DropItem[] = [
  { to: '/spring-boot',    labelKey: 'nav.springboot', subKey: 'nav.springboot_sub', color: 'text-spring', Icon: Leaf },
  { to: '/dotnet',         labelKey: 'nav.dotnet',      subKey: 'nav.dotnet_sub',     color: 'text-dotnet', Icon: Hexagon },
  { to: '/github-actions', labelKey: 'nav.gha',         subKey: 'nav.gha_sub',        color: 'text-gh',     Icon: Github },
  { to: '/eso-shop',       labelKey: 'nav.esoshop',     subKey: 'nav.esoshop_sub',    color: 'text-eso',    Icon: ShoppingCart },
  { to: '/swa-s3',         href: '/swa-s3', labelKey: 'nav.swa', subKey: 'nav.swa_sub', color: 'text-eso',  Icon: Database },
]

const TOOLS: DropItem[] = [
  { to: '/flow',         labelKey: 'nav.flow',         subKey: 'nav.flow_sub',         color: 'text-conjur-cyan', Icon: Workflow },
  { to: '/compare',      labelKey: 'nav.compare',      subKey: 'nav.compare_sub',      color: 'text-conjur-cyan', Icon: GitCompareArrows },
  { to: '/tools',        labelKey: 'nav.livetools',    subKey: 'nav.livetools_sub',    color: 'text-conjur-cyan', Icon: Wrench },
  { to: '/jwt-validator', labelKey: 'nav.jwtvalidator', subKey: 'nav.jwtvalidator_sub', color: 'text-conjur-cyan', Icon: BadgeCheck },
  { to: '/controller',   href: '/controller', labelKey: 'nav.controller',   subKey: 'nav.controller_sub', color: 'text-conjur-cyan', Icon: LayoutDashboard },
]

const dropVariants = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1    },
}

function DropdownMenu({ items, activeColor = 'text-conjur-cyan' }: { items: DropItem[], activeColor?: string }) {
  const { t } = useTranslation()
  const location = useLocation()
  const isActive = (to: string) => location.pathname === to
  return (
    <>
      {items.map(item => {
        const cls = `flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-muted ${isActive(item.to) ? 'bg-bg-muted' : ''}`
        const inner = (
          <>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ${item.color ?? 'text-slate-400'}`}>
              <item.Icon size={16} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className={`text-sm font-semibold ${isActive(item.to) ? (item.color ?? activeColor) : 'text-text'}`}>
                {t(item.labelKey)}
              </div>
              <div className="text-xs text-text-muted mt-0.5 truncate">{t(item.subKey)}</div>
            </div>
          </>
        )
        return item.href
          ? <a key={item.to} href={item.href} className={cls}>{inner}</a>
          : <Link key={item.to} to={item.to} className={cls}>{inner}</Link>
      })}
    </>
  )
}

export default function NavBar() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const current = LANGS.find(l => i18n.language.startsWith(l)) ?? 'en'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    // Escape closes any open dropdown / mobile menu (WCAG 2.1.2, keyboard users).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenMenu(null); setMobileOpen(false) }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
  }, [location.pathname])

  const toggle = (key: string) =>
    setOpenMenu(prev => (prev === key ? null : key))

  const isActive = (to: string) => location.pathname === to

  const mobileItem = (item: DropItem) => {
    const cls = `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.to) ? 'bg-bg-muted' : 'hover:bg-bg-muted'}`
    const inner = (
      <>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 ${item.color ?? 'text-slate-400'}`}>
          <item.Icon size={15} aria-hidden="true" />
        </span>
        <span className={`text-sm font-medium ${isActive(item.to) ? item.color : 'text-text-2'}`}>
          {t(item.labelKey)}
        </span>
      </>
    )
    return item.href
      ? <a key={item.to} href={item.href} className={cls}>{inner}</a>
      : <Link key={item.to} to={item.to} className={cls}>{inner}</Link>
  }

  const desktopMenuBtn = (key: string, items: DropItem[], label: string) => (
    <div className="relative">
      <button
        onClick={() => toggle(key)}
        aria-haspopup="true"
        aria-expanded={openMenu === key}
        aria-controls={`menu-${key}`}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
          openMenu === key || items.some(p => isActive(p.to))
            ? 'text-text bg-bg-muted'
            : 'text-text-muted hover:text-text hover:bg-bg-muted'
        }`}
      >
        {label}
        <ChevronDown size={13} aria-hidden="true" className={`transition-transform ${openMenu === key ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {openMenu === key && (
          <motion.div
            id={`menu-${key}`}
            variants={dropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 w-72 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <DropdownMenu items={items} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <nav
      ref={navRef}
      className="nav-iridescent fixed top-0 inset-x-0 z-50 bg-[#070c1c]/85 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-semibold shrink-0">
          <img
            src={idiraIcon}
            alt="IDIRA"
            width={22}
            height={25}
            className="h-6 w-auto shrink-0"
            style={{ filter: 'drop-shadow(0 0 7px rgba(38,91,255,0.55))' }}
          />
          <span className="hidden sm:block text-sm font-bold leading-tight text-white">
            Palo Alto Networks <span className="idira-shimmer font-extrabold">| IDIRA</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 text-sm">
          {desktopMenuBtn('integrations', INTEGRATIONS, t('nav.integrations'))}
          {desktopMenuBtn('examples', EXAMPLES, t('nav.examples'))}

          {/* Tools dropdown (uses <a> for external items) */}
          <div className="relative">
            <button
              onClick={() => toggle('tools')}
              aria-haspopup="true"
              aria-expanded={openMenu === 'tools'}
              aria-controls="menu-tools"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                openMenu === 'tools' || TOOLS.some(p => isActive(p.to))
                  ? 'text-text bg-bg-muted'
                  : 'text-text-muted hover:text-text hover:bg-bg-muted'
              }`}
            >
              {t('nav.tools')}
              <ChevronDown size={13} aria-hidden="true" className={`transition-transform ${openMenu === 'tools' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openMenu === 'tools' && (
                <motion.div
                  id="menu-tools"
                  variants={dropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full left-0 mt-2 w-72 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                >
                  <DropdownMenu items={TOOLS} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side: api status + theme toggle + lang switcher + mobile toggle */}
        <div className="flex items-center gap-2">
          <ApiStatus />
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-1">
            {LANGS.map(lang => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                aria-label={lang.toUpperCase()}
                className={`flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                  current === lang
                    ? 'bg-conjur-cyan/20 text-conjur-cyan border border-conjur-cyan/30'
                    : 'text-text-muted hover:text-text-2'
                }`}
              >
                <span className="inline-block w-[18px] h-[13px] rounded-[2px] overflow-hidden ring-1 ring-black/20 shrink-0">
                  {FLAGS[lang]}
                </span>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(prev => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 text-text-muted hover:text-text transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-[#070c1c]/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-1">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest px-2 pb-1">
                {t('nav.integrations')}
              </p>
              {INTEGRATIONS.map(mobileItem)}

              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest px-2 pt-3 pb-1">
                {t('nav.examples')}
              </p>
              {EXAMPLES.map(mobileItem)}

              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest px-2 pt-3 pb-1">
                {t('nav.tools')}
              </p>
              {TOOLS.map(mobileItem)}

              <div className="flex items-center gap-2 px-2 pt-3">
                {LANGS.map(lang => (
                  <button
                    key={lang}
                    onClick={() => i18n.changeLanguage(lang)}
                    aria-label={lang.toUpperCase()}
                    className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      current === lang
                        ? 'bg-conjur-cyan/20 text-conjur-cyan border border-conjur-cyan/30'
                        : 'text-text-muted hover:text-text-2'
                    }`}
                  >
                    <span className="inline-block w-[18px] h-[13px] rounded-[2px] overflow-hidden ring-1 ring-black/20 shrink-0">
                      {FLAGS[lang]}
                    </span>
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
