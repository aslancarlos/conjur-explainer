import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CircleCheck, CircleDashed, CircleX, ExternalLink, Loader2, OctagonPause, RefreshCw } from 'lucide-react'
import { SERVICES, checkService, type ServiceResult, type ServiceState } from '../../lib/services'

const POLL_MS = 60_000

// Status = colour + icon + text (never colour alone: DESIGN.md §11).
const STATE: Record<ServiceState, { Icon: typeof CircleCheck; text: string; dot: string }> = {
  checking:    { Icon: CircleDashed,  text: 'text-text-muted',   dot: 'bg-text-muted' },
  ok:          { Icon: CircleCheck,   text: 'text-tone-success', dot: 'bg-tone-success' },
  maintenance: { Icon: OctagonPause,  text: 'text-tone-warning', dot: 'bg-tone-warning' },
  down:        { Icon: CircleX,       text: 'text-tone-danger',  dot: 'bg-tone-danger' },
}

/**
 * Top-bar environment status (sinfonia-style): one pill that summarises every
 * live demo service, and a panel with each service's state, latency and a
 * link to open its console. Polls every 60 s while the tab is visible.
 */
export default function EnvStatus() {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [results, setResults] = useState<Record<string, ServiceResult>>(
    () => Object.fromEntries(SERVICES.map(s => [s.key, { state: 'checking' as const }])))
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const run = useCallback(async () => {
    setBusy(true)
    const entries = await Promise.all(SERVICES.map(async s => [s.key, await checkService(s)] as const))
    setResults(Object.fromEntries(entries))
    setCheckedAt(new Date())
    setBusy(false)
  }, [])

  useEffect(() => {
    run()
    const id = setInterval(() => { if (document.visibilityState === 'visible') run() }, POLL_MS)
    const onVis = () => { if (document.visibilityState === 'visible') run() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [run])

  // Close on outside click / Escape (focus back to the trigger).
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus() } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const list = SERVICES.map(s => ({ s, r: results[s.key] }))
  const okCount = list.filter(x => x.r.state === 'ok').length
  const anyDown = list.some(x => x.r.state === 'down')
  const checking = list.every(x => x.r.state === 'checking')
  const overall: ServiceState = checking ? 'checking' : anyDown ? 'down' : okCount === list.length ? 'ok' : 'maintenance'
  const label = checking
    ? t('env.checking')
    : overall === 'ok'
      ? t('env.all_ok', { n: list.length })
      : t('env.partial', { ok: okCount, n: list.length })
  const time = checkedAt?.toISOString().slice(11, 19)

  return (
    <div ref={rootRef} className="relative">
      <button ref={btnRef} type="button" onClick={() => setOpen(o => !o)}
        aria-expanded={open} aria-controls="env-panel" aria-label={`${t('env.title')}: ${label}`} title={label}
        className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-bg-card px-3 text-xs font-medium text-text-2
          hover:bg-bg-muted hover:text-text transition-colors">
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATE[overall].dot} ${overall === 'checking' ? 'motion-safe:animate-pulse' : ''}`} aria-hidden="true" />
        <span className="hidden 2xl:inline">{label}</span>
        <span className="2xl:hidden tabular-nums">{checking ? '…' : `${okCount}/${list.length}`}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div id="env-panel" role="dialog" aria-label={t('env.title')}
            initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full z-header mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text">{t('env.title')}</p>
                <p className="text-xs text-text-muted">{t('env.subtitle')}</p>
              </div>
              <button type="button" onClick={run} disabled={busy} aria-label={t('env.refresh')} title={t('env.refresh')}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-2 hover:bg-bg-muted hover:text-text disabled:opacity-50 transition-colors">
                {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
              </button>
            </div>
            <ul className="divide-y divide-border" aria-live="polite">
              {list.map(({ s, r }) => {
                const st = STATE[r.state]
                return (
                  <li key={s.key} className="flex items-center gap-3 px-4 py-2.5">
                    <st.Icon size={16} strokeWidth={2.2} className={`shrink-0 ${st.text}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{s.name}</p>
                      <p className="text-xs text-text-muted">
                        <span className={st.text}>{t(`env.state_${r.state}`)}</span>
                        {r.ms !== undefined && <span className="tabular-nums"> · {r.ms} ms</span>}
                        {r.code !== undefined && r.state !== 'ok' && <span className="tabular-nums"> · HTTP {r.code}</span>}
                      </p>
                    </div>
                    {s.open && (
                      <a href={s.open} target="_blank" rel="noreferrer" aria-label={t('env.open', { name: s.name })} title={t('env.open', { name: s.name })}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg-muted hover:text-text transition-colors">
                        <ExternalLink size={15} aria-hidden="true" />
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="border-t border-border px-4 py-2.5 font-mono text-xs text-text-muted">
              {time ? t('env.checked', { time }) : t('env.checking')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
