import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { localeReady } from './i18n'
import './index.css'
import App from './App'

// English resolves immediately; pt/es wait for their (small, cached) chunk.
localeReady.finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
