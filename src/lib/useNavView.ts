import { useSyncExternalStore } from 'react'
import type { NavView } from './nav'

/**
 * Shared "group navigation by use case | product" preference. One store for
 * the sidebar, the mobile drawer and the home catalogue, so switching in one
 * place updates all of them. Persisted in localStorage('idira-nav-view').
 */
const KEY = 'idira-nav-view'
const listeners = new Set<() => void>()

function read(): NavView {
  try { return localStorage.getItem(KEY) === 'product' ? 'product' : 'usecase' } catch { return 'usecase' }
}

let current: NavView = read()

export function setNavView(v: NavView) {
  current = v
  try { localStorage.setItem(KEY, v) } catch { /* private mode */ }
  listeners.forEach(l => l())
}

export function useNavView(): [NavView, (v: NavView) => void] {
  const view = useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb) } },
    () => current,
    () => 'usecase' as NavView,
  )
  return [view, setNavView]
}
