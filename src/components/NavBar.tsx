import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Shield, ChevronDown, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const LANGS = ['en', 'pt', 'es'] as const

interface DropItem {
  to: string
  href?: string   // set for external services that bypass React Router
  labelKey: string
  subKey: string
  color?: string
}

const PATTERNS: DropItem[] = [
  { to: '/spring-boot',    labelKey: 'nav.springboot',    subKey: 'nav.springboot_sub', color: 'text-spring' },
  { to: '/dotnet',         labelKey: 'nav.dotnet',         subKey: 'nav.dotnet_sub',    color: 'text-dotnet' },
  { to: '/github-actions', labelKey: 'nav.gha',            subKey: 'nav.gha_sub',       color: 'text-gh'     },
  { to: '/eso-shop',       labelKey: 'nav.esoshop',        subKey: 'nav.esoshop_sub',   color: 'text-eso'    },
]

const TOOLS: DropItem[] = [
  { to: '/flow',       labelKey: 'nav.flow',        subKey: 'nav.flow_sub'        },
  { to: '/compare',    labelKey: 'nav.compare',      subKey: 'nav.compare_sub'     },
  { to: '/tools',      labelKey: 'nav.livetools',    subKey: 'nav.livetools_sub'   },
  { to: '/controller', href: '/controller', labelKey: 'nav.controller', subKey: 'nav.controller_sub' },
]

const dropVariants = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1    },
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
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
  }, [location.pathname])

  const toggle = (key: string) =>
    setOpenMenu(prev => (prev === key ? null : key))

  const isActive = (to: string) => location.pathname === to

  return (
    <nav
      ref={navRef}
      className="fixed top-0 inset-x-0 z-50 bg-bg-base/90 backdrop-blur border-b border-border"
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-conjur-cyan font-semibold shrink-0">
          <Shield size={18} />
          <span className="hidden sm:block text-sm font-bold leading-tight">
            Palo Alto Networks <span className="text-slate-400 font-normal">| IDIRA</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 text-sm">

          {/* Integrations dropdown */}
          <div className="relative">
            <button
              onClick={() => toggle('patterns')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                openMenu === 'patterns' || PATTERNS.some(p => isActive(p.to))
                  ? 'text-white bg-white/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('nav.integrations')}
              <ChevronDown
                size={13}
                className={`transition-transform ${openMenu === 'patterns' ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {openMenu === 'patterns' && (
                <motion.div
                  variants={dropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full left-0 mt-2 w-72 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                >
                  {PATTERNS.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${
                        isActive(item.to) ? 'bg-white/5' : ''
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          item.color?.replace('text-', 'bg-') ?? 'bg-slate-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold ${isActive(item.to) ? item.color : 'text-slate-200'}`}>
                          {t(item.labelKey)}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{t(item.subKey)}</div>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tools dropdown */}
          <div className="relative">
            <button
              onClick={() => toggle('tools')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                openMenu === 'tools' || TOOLS.some(p => isActive(p.to))
                  ? 'text-white bg-white/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('nav.tools')}
              <ChevronDown
                size={13}
                className={`transition-transform ${openMenu === 'tools' ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {openMenu === 'tools' && (
                <motion.div
                  variants={dropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full left-0 mt-2 w-64 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                >
                  {TOOLS.map(item => {
                    const cls = `flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${isActive(item.to) ? 'bg-white/5' : ''}`
                    const inner = (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-conjur-cyan/60" />
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${isActive(item.to) ? 'text-conjur-cyan' : 'text-slate-200'}`}>
                            {t(item.labelKey)}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">{t(item.subKey)}</div>
                        </div>
                      </>
                    )
                    return item.href
                      ? <a key={item.to} href={item.href} className={cls}>{inner}</a>
                      : <Link key={item.to} to={item.to} className={cls}>{inner}</Link>
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side: lang switcher + mobile toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            {LANGS.map(lang => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                  current === lang
                    ? 'bg-conjur-cyan/20 text-conjur-cyan border border-conjur-cyan/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(prev => !prev)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-border bg-bg-base"
          >
            <div className="px-4 py-4 space-y-1">
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-2 pb-1">
                {t('nav.integrations')}
              </p>
              {PATTERNS.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(item.to) ? 'bg-white/5' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${item.color?.replace('text-', 'bg-') ?? 'bg-slate-500'}`} />
                  <span className={`text-sm font-medium ${isActive(item.to) ? item.color : 'text-slate-300'}`}>
                    {t(item.labelKey)}
                  </span>
                </Link>
              ))}

              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-2 pt-3 pb-1">
                {t('nav.tools')}
              </p>
              {TOOLS.map(item => {
                const cls = `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.to) ? 'bg-white/5' : 'hover:bg-white/5'}`
                const inner = (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-conjur-cyan/60" />
                    <span className={`text-sm font-medium ${isActive(item.to) ? 'text-conjur-cyan' : 'text-slate-300'}`}>
                      {t(item.labelKey)}
                    </span>
                  </>
                )
                return item.href
                  ? <a key={item.to} href={item.href} className={cls}>{inner}</a>
                  : <Link key={item.to} to={item.to} className={cls}>{inner}</Link>
              })}

              <div className="flex items-center gap-2 px-2 pt-3">
                {LANGS.map(lang => (
                  <button
                    key={lang}
                    onClick={() => i18n.changeLanguage(lang)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      current === lang
                        ? 'bg-conjur-cyan/20 text-conjur-cyan border border-conjur-cyan/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
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
