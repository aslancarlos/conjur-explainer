import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { localeReady } from './i18n'
import './index.css'
import App, { preloadInitialRoute } from './App'

// English resolves immediately; pt/es wait for their (small, cached) chunk.
// The first route's chunk loads in parallel, so a deep link paints once.
Promise.allSettled([localeReady, preloadInitialRoute()]).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
