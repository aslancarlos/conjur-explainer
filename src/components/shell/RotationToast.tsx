import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle, Loader2, RotateCw, X, XCircle } from 'lucide-react'
import { Link } from '../../lib/router'
import { mmss, ROTATION_STEPS, rotationEnded, secondsLeft, usePresence, type RotationRec } from '../../lib/presence'

const HIDE_KEY = 'idira-rotation-hidden'
const AUTO_HIDE_MS = 10_000

function hiddenIds(): string[] {
  try { return JSON.parse(sessionStorage.getItem(HIDE_KEY) ?? '[]') as string[] } catch { return [] }
}
function hide(id: string) {
  try { sessionStorage.setItem(HIDE_KEY, JSON.stringify([...hiddenIds().slice(-20), id])) } catch { /* ignore */ }
}

/**
 * Site-wide notice of a Dual Account pair rotation, for every visitor on any
 * page (data from the presence heartbeat). Bottom right, never takes focus,
 * announced politely. Closing hides that rotation in this tab only; a finished
 * rotation hides itself after 10 s. On /vault, where the full progress lives,
 * it shrinks to one line.
 */
export default function RotationToast() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { rotation, skew } = usePresence()
  const [hidden, setHidden] = useState<string[]>(hiddenIds)
  const [, setNow] = useState(0)

  const ended = rotation ? rotationEnded(rotation) : false
  const visible = rotation && !hidden.includes(rotation.rotationId)

  // countdown tick while the Central Policy Manager is working
  useEffect(() => {
    if (!visible || rotation?.step !== 'trocando_senha') return
    const h = window.setInterval(() => setNow(n => n + 1), 1000)
    return () => window.clearInterval(h)
  }, [visible, rotation?.step])

  // a finished rotation stays 10 s, then hides itself
  useEffect(() => {
    const id = rotation?.rotationId
    if (!visible || !ended || !id) return
    const h = window.setTimeout(() => { hide(id); setHidden(hiddenIds()) }, AUTO_HIDE_MS)
    return () => window.clearTimeout(h)
  }, [visible, ended, rotation?.rotationId])

  const close = () => { if (rotation) { hide(rotation.rotationId); setHidden(hiddenIds()) } }

  return (
    <div role="status" aria-live="polite" aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-header flex w-[min(24rem,calc(100vw-2rem))] flex-col items-end">
      {visible && rotation && (
        pathname === '/vault'
          ? <Compact r={rotation} onClose={close} t={t} />
          : <Full r={rotation} skew={skew} onClose={close} t={t} />
      )}
    </div>
  )
}

const state = (r: RotationRec) => (r.step === 'concluida' ? 'done' : r.step === 'falhou' ? 'failed' : 'running')

function StatusIcon({ r, className = '' }: { r: RotationRec; className?: string }) {
  if (r.step === 'concluida') return <CheckCircle2 size={16} aria-hidden="true" className={`shrink-0 ${className}`} />
  if (r.step === 'falhou') return <XCircle size={16} aria-hidden="true" className={`shrink-0 ${className}`} />
  return <RotateCw size={16} aria-hidden="true" className={`shrink-0 animate-spin [animation-duration:2s] ${className}`} />
}

function Full({ r, skew, onClose, t }: { r: RotationRec; skew: number; onClose: () => void; t: TFn }) {
  const st = state(r)
  const stripe = st === 'done' ? 'bg-tone-success' : st === 'failed' ? 'bg-tone-danger' : 'bg-tone-accent'
  const tone = st === 'done' ? 'text-tone-success' : st === 'failed' ? 'text-tone-danger' : 'text-tone-accent'
  const reached = r.steps.map(s => s.step)
  const failedAt = r.step === 'falhou' ? r.steps[r.steps.length - 2]?.step : undefined
  const left = r.step === 'trocando_senha' ? secondsLeft(r.deadline, skew) : null
  const current = ROTATION_STEPS.indexOf(r.step === 'falhou' ? (failedAt as RotationRec['step']) : r.step)
  return (
    <div className="toast-in pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-border bg-bg-card p-4 pl-5 shadow-raised">
      <span className={`absolute inset-y-0 left-0 w-[3px] ${stripe}`} aria-hidden="true" />
      <div className="flex items-start gap-2">
        <StatusIcon r={r} className={`mt-0.5 ${tone}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">{t(`shell.rt_title_${st}`)}</p>
          <p className="mt-0.5 font-mono text-xs text-text-2 [overflow-wrap:anywhere]">
            {r.virtualUserName}: {r.from} <span aria-hidden="true">→</span><span className="sr-only">{t('shell.rt_to')}</span> {r.to}
          </p>
        </div>
        <CloseButton onClose={onClose} t={t} />
      </div>

      <ol className="mt-3 space-y-1.5" aria-label={t('shell.rt_steps')}>
        {ROTATION_STEPS.map((s, i) => {
          const done = reached.includes(s) && (i < current || r.step === 'concluida')
          const isCur = i === current && r.step !== 'concluida'
          const failed = isCur && r.step === 'falhou'
          return (
            <li key={s} className="flex items-center gap-2 text-xs" aria-current={isCur ? 'step' : undefined}>
              {failed ? <XCircle size={14} aria-hidden="true" className="shrink-0 text-tone-danger" />
                : done ? <CheckCircle2 size={14} aria-hidden="true" className="shrink-0 text-tone-success" />
                : isCur ? <Loader2 size={14} aria-hidden="true" className="shrink-0 animate-spin text-tone-accent" />
                : <Circle size={14} aria-hidden="true" className="shrink-0 text-text-muted" />}
              <span className={isCur ? 'font-semibold text-text' : done ? 'text-text-2' : 'text-text-muted'}>
                {t(`shell.rt_step_${s}`, { to: r.to })}
              </span>
              {s === 'trocando_senha' && left !== null && (
                <span className="ml-auto font-mono tabular-nums text-text-2" role="timer" aria-live="off" title={t('shell.rt_deadline_title')}>
                  {mmss(left)}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {st === 'done' && <p className="mt-3 text-xs leading-relaxed text-text-2">{t('shell.rt_done_desc', { to: r.to })}</p>}
      {st === 'failed' && (
        <p className="mt-3 text-xs leading-relaxed text-text-2">
          {t(`shell.rt_err_${r.errorCode ?? 'unknown'}`, { defaultValue: t('shell.rt_err_unknown'), to: r.to })}
        </p>
      )}
      <Link to="/vault" className="mt-3 inline-flex min-h-8 items-center text-xs font-semibold text-tone-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue rounded">
        {t('shell.rt_open')}
      </Link>
    </div>
  )
}

type TFn = (k: string, o?: Record<string, unknown>) => string

function CloseButton({ onClose, t, small = false }: { onClose: () => void; t: TFn; small?: boolean }) {
  return (
    <button type="button" onClick={onClose} aria-label={t('shell.rt_close')} title={t('shell.rt_close')}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg text-text-2 transition-colors duration-150 hover:bg-bg-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue ${small ? 'h-8 w-8 rounded-full' : '-mr-2 -mt-2 h-11 w-11'}`}>
      <X size={16} aria-hidden="true" />
    </button>
  )
}

function Compact({ r, onClose, t }: { r: RotationRec; onClose: () => void; t: TFn }) {
  const tone = r.step === 'concluida' ? 'text-tone-success' : r.step === 'falhou' ? 'text-tone-danger' : 'text-tone-accent'
  return (
    <div className="toast-in pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-bg-card py-1 pl-3 pr-1 text-xs shadow-raised">
      <StatusIcon r={r} className={tone} />
      <span className="whitespace-nowrap font-semibold text-text">{t(`shell.rt_title_${state(r)}`)}</span>
      <CloseButton onClose={onClose} t={t} small />
    </div>
  )
}
