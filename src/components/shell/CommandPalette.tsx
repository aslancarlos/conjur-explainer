import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BookOpen, CornerDownLeft, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NAV } from '../../lib/nav'

const TERMS = ['workload', 'host', 'authenticator', 'token', 'policy', 'variable', 'fetchers', 'dynamic', 'rotation', 'secretzero', 'spiffe', 'nhi']
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

interface Entry { id: string; label: string; sub?: string; group: string; to: string; external?: boolean; hash?: string; Icon: LucideIcon; color?: string }

/**
 * ⌘K / Ctrl+K command palette (sinfonia-style top-bar search): jump to any
 * page in the navigation or any glossary term. ARIA combobox + listbox.
 */
export default function CommandPalette() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const entries = useMemo<Entry[]>(() => {
    const seen = new Set<string>()
    const pages = NAV.flatMap(g => g.items.map(it => ({ g, it }))).filter(({ it }) => {
      if (seen.has(it.to)) return false
      seen.add(it.to); return true
    }).map(({ g, it }) => ({
      id: `p-${it.to}`, label: t(it.labelKey), sub: it.subKey ? t(it.subKey) : undefined,
      group: g.labelKey ? t(g.labelKey) : t('nav.home'), to: it.to, external: Boolean(it.href), Icon: it.Icon, color: it.color,
    }))
    const terms = TERMS.map(k => ({
      id: `t-${k}`, label: t(`glossary.terms.${k}.term`), sub: t(`glossary.terms.${k}.def`),
      group: t('nav.c_glossary'), to: '/concepts/glossary', hash: `term-${k}`, Icon: BookOpen, color: 'text-text-2',
    }))
    return [...pages, ...terms]
  }, [t])

  const results = useMemo(() => {
    const n = norm(q.trim())
    if (!n) return entries.filter(e => !e.hash)           // pages only until the user types
    return entries.filter(e => norm(`${e.label} ${e.sub ?? ''} ${e.group}`).includes(n)).slice(0, 30)
  }, [q, entries])

  useEffect(() => { setActive(0) }, [q, open])

  // Global shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(o => !o) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Focus management + scroll lock.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    const trigger = triggerRef.current
    return () => { cancelAnimationFrame(id); document.body.style.overflow = prev; setQ(''); trigger?.focus() }
  }, [open])

  const go = useCallback((e: Entry) => {
    setOpen(false)
    if (e.external) { window.location.assign(e.to); return }
    navigate(e.to)
    if (e.hash) {
      // The glossary page is lazy-loaded: retry until the anchor exists.
      let tries = 0
      const seek = () => {
        const el = document.getElementById(e.hash!)
        if (el) { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); el.focus?.() }
        else if (tries++ < 20) setTimeout(seek, 100)
      }
      setTimeout(seek, 120)
    }
  }, [navigate, reduce])

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
  }

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const kbd = isMac ? '⌘K' : 'Ctrl K'

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
        aria-label={`${t('search.open')} (${kbd})`}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-bg-card text-sm text-text-muted
          hover:bg-bg-muted hover:text-text transition-colors w-9 justify-center md:w-64 md:justify-start md:px-3">
        <Search size={16} aria-hidden="true" className="shrink-0" />
        <span className="hidden md:inline flex-1 truncate text-left">{t('search.trigger')}</span>
        <kbd className="hidden md:inline rounded border border-border bg-bg-muted px-1.5 font-mono text-[11px] text-text-muted">{kbd}</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[70]">
            <motion.div className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} aria-hidden="true"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.15 }} />
            <motion.div role="dialog" aria-modal="true" aria-label={t('search.open')}
              initial={reduce ? false : { opacity: 0, scale: 0.98, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.98 }} transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative mx-auto mt-[10vh] w-[min(40rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl">
              <div className="flex items-center gap-3 border-b border-border px-4">
                <Search size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
                <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKeyDown}
                  role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list"
                  aria-activedescendant={results[active] ? `cmdk-${active}` : undefined}
                  placeholder={t('search.placeholder')} aria-label={t('search.placeholder')}
                  className="h-14 flex-1 bg-transparent text-base text-text placeholder:text-text-muted outline-none" />
                <kbd className="rounded border border-border bg-bg-muted px-1.5 font-mono text-[11px] text-text-muted">esc</kbd>
              </div>
              <ul id="cmdk-list" ref={listRef} role="listbox" aria-label={t('search.results')}
                className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain p-2">
                {results.length === 0 && (
                  <li className="px-3 py-8 text-center text-sm text-text-muted">{t('search.empty', { q })}</li>
                )}
                {results.map((e, i) => (
                  <li key={e.id} id={`cmdk-${i}`} data-idx={i} role="option" aria-selected={i === active}
                    onMouseMove={() => setActive(i)} onClick={() => go(e)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${i === active ? 'bg-bg-muted' : ''}`}>
                    <e.Icon size={17} strokeWidth={1.9} className={`shrink-0 ${e.color ?? 'text-text-2'}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">{e.label}</span>
                      {e.sub && <span className="block truncate text-xs text-text-muted">{e.sub}</span>}
                    </span>
                    <span className="hidden sm:inline shrink-0 text-xs text-text-muted">{e.group}</span>
                    {i === active && <CornerDownLeft size={14} className="shrink-0 text-text-muted" aria-hidden="true" />}
                  </li>
                ))}
              </ul>
              <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-2.5 text-xs text-text-muted">
                <span><kbd className="font-mono">↑↓</kbd> {t('search.hint_move')}</span>
                <span><kbd className="font-mono">↵</kbd> {t('search.hint_open')}</span>
                <span><kbd className="font-mono">esc</kbd> {t('search.hint_close')}</span>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
