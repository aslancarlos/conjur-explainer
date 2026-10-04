import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ensureFullLocale, localeReady } from './i18n'
import './index.css'
import App, { preloadInitialRoute } from './App'

// English core resolves immediately; pt/es wait for their (small) core chunk.
// The first route's chunk loads in parallel, so a deep link paints once (its
// lazy also brings the full locale). The home renders on the core keys and
// fetches the full locale once the browser is idle.
Promise.allSettled([localeReady, preloadInitialRoute()]).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  const loadFull = () => { void ensureFullLocale() }
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(loadFull, { timeout: 5000 })
  else window.setTimeout(loadFull, 2000)
})
