import { useSyncExternalStore } from 'react'

/**
 * Presence and the rotation notice, shared by the top bar ("N online"), the
 * site-wide rotation toast and the Cofre Info page. Backend: vault-control
 * /api/vault/presence (POST heartbeat, GET read only).
 *
 * Each tab is one connection: a random UUID kept in sessionStorage, sent every
 * 20 s while the tab is visible and never while it is hidden, so a visitor who
 * leaves stops counting within 60 s. Nothing else identifies the visitor.
 * While a pair rotation runs, the notice is refreshed every 4 s (GET).
 */

export type RotationStep = 'solicitada' | 'trocando_senha' | 'promovendo' | 'concluida' | 'falhou'

export interface RotationRec {
  rotationId: string
  virtualUserName: string
  target: { id: string; name: string; userName: string }
  other: { id: string; name: string; userName: string }
  from: string
  to: string
  step: RotationStep
  steps: Array<{ step: RotationStep; at: string }>
  errorCode?: string
  reason?: string
  cpmTimeoutSeconds: number
  deadline?: string
  startedAt: string
  finishedAt?: string
  serverTime: string
}

export const ROTATION_STEPS: RotationStep[] = ['solicitada', 'trocando_senha', 'promovendo', 'concluida']
export const rotationEnded = (r: RotationRec) => r.step === 'concluida' || r.step === 'falhou'

interface PresenceState {
  online: number | null        // null: unknown or unreachable (hide the indicator)
  rotation: RotationRec | null
  /** server clock minus browser clock, in ms (for the countdown) */
  skew: number
}

const API = '/api/vault/presence'
const BEAT_MS = 20_000
const FAST_MS = 4_000
const ID_KEY = 'idira-presence-id'

let state: PresenceState = { online: null, rotation: null, skew: 0 }
const listeners = new Set<() => void>()
let timer: number | null = null
let lastBeat = 0
let started = false

function tabId(): string {
  try {
    const have = sessionStorage.getItem(ID_KEY)
    if (have) return have
  } catch { /* storage blocked: a fresh id per load still works */ }
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16))
  try { sessionStorage.setItem(ID_KEY, id) } catch { /* ignore */ }
  return id
}

function set(next: Partial<PresenceState>) {
  state = { ...state, ...next }
  listeners.forEach(l => l())
}

async function tick() {
  if (document.visibilityState !== 'visible') return
  const beat = Date.now() - lastBeat >= BEAT_MS - 1000
  try {
    const r = await fetch(API, beat
      ? { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-Cofre-Info': '1' }, body: JSON.stringify({ id: tabId() }) }
      : { cache: 'no-store' })
    if (beat) lastBeat = Date.now()
    if (r.status === 429) return // budget exceeded: keep the last numbers
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(String(r.status))
    const d = await r.json() as { online?: number; rotation?: RotationRec | null }
    const rot = d.rotation ?? null
    set({
      online: Number.isFinite(d.online) ? (d.online as number) : null,
      rotation: rot,
      skew: rot?.serverTime ? new Date(rot.serverTime).getTime() - Date.now() : state.skew,
    })
  } catch {
    set({ online: null })
  }
}

function schedule() {
  if (timer) window.clearTimeout(timer)
  timer = null
  if (document.visibilityState !== 'visible') return
  const fast = state.rotation && !rotationEnded(state.rotation)
  timer = window.setTimeout(async () => { await tick(); schedule() }, fast ? FAST_MS : BEAT_MS)
}

/** Ask for fresh data now (e.g. right after this tab started a rotation). */
export async function refreshPresence() {
  await tick()
  schedule()
}

function start() {
  if (started || typeof document === 'undefined') return
  started = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshPresence()
    else if (timer) { window.clearTimeout(timer); timer = null }
  })
  refreshPresence()
}

function subscribe(l: () => void) {
  listeners.add(l)
  start()
  return () => { listeners.delete(l) }
}

export function usePresence(): PresenceState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

/** Seconds left until an ISO deadline, by the server clock. */
export function secondsLeft(deadline: string | undefined, skew: number, now = Date.now()): number | null {
  if (!deadline) return null
  return Math.max(0, Math.round((new Date(deadline).getTime() - (now + skew)) / 1000))
}

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
