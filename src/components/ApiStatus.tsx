import { useEffect, useState } from 'react'

type Status = 'checking' | 'ok' | 'down'

/**
 * Live status badge for the JWT-validator API. Pings GET /api/health on mount
 * and every 30s, surfacing the real /api liveness in the nav.
 */
export default function ApiStatus() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (active) setStatus(r.ok && j?.status === 'ok' ? 'ok' : 'down')
      } catch {
        if (active) setStatus('down')
      }
    }
    check()
    const id = setInterval(check, 30_000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  const dot =
    status === 'ok' ? 'bg-emerald-400' : status === 'down' ? 'bg-red-400' : 'bg-amber-400'
  const label = status === 'ok' ? 'online' : status === 'down' ? 'offline' : 'checking'

  return (
    <span
      title={`GET /api/health — ${label}`}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 font-mono text-[11px] text-text-muted"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${status === 'ok' ? 'animate-pulse' : ''}`} />
      /api
    </span>
  )
}
