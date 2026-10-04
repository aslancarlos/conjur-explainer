import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

// Local dev only: serve a sample of the access counter that production
// publishes at /stats/visits.json (see k8s/site-stats/) and a fake like counter.
const devVisits = (): Plugin => ({
  name: 'dev-visits',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/stats/visits.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(readFileSync('k8s/site-stats/sample-visits.json'))
    })
    // like counter (site-likes) simulated in memory
    let likes = 42
    server.middlewares.use('/api/likes', (req, res) => {
      if (req.method === 'POST') likes += 1
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ likes, accepted: req.method === 'POST' }))
    })
  },
})

// Top-level locale namespaces (or dotted sub-keys) that the shell and the home
// render. `import x from './locales/en.json?core'` yields only these, so the
// entry chunk does not carry every page's copy; src/i18n.ts merges the full
// file in before any other route commits. Keep in sync with the keys used by
// main.tsx, App.tsx, components/shell/*, Footer, Loading, ThemeToggle,
// pages/HomePage.tsx (and the IdentityFlows/FlowPlayer it lazy-loads), lib/nav.ts.
const CORE_LOCALE_KEYS = [
  'nav', 'shell', 'glossary', 'search', 'env', 'demos', 'hero', 'concepts', 'footer',
  'flowlive', 'idflow', 'player',
  'dual.ctl_next', 'dual.ctl_pause', 'dual.ctl_play', 'dual.ctl_prev', 'dual.ctl_restart',
  'dual.step_of', 'dual.timeline_label',
]

const localeCore = (): Plugin => ({
  name: 'locale-core',
  enforce: 'pre',
  load(id) {
    if (!id.endsWith('.json?core')) return
    const file = id.slice(0, -'?core'.length)
    this.addWatchFile(file)
    const full = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    const core: Record<string, unknown> = {}
    for (const key of CORE_LOCALE_KEYS) {
      const [ns, sub] = key.split('.', 2)
      const src = full[ns]
      if (src === undefined) continue
      if (!sub) { core[ns] = src; continue }
      const val = (src as Record<string, unknown>)[sub]
      if (val !== undefined) ((core[ns] ??= {}) as Record<string, unknown>)[sub] = val
    }
    // Plain JSON: Vite's json plugin turns it into the ES module.
    return JSON.stringify(core)
  },
})

export default defineConfig({
  plugins: [react(), devVisits(), localeCore()],
  base: '/',
  // Build timestamp for the sidebar "last updated" line (src/lib/release.ts).
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString()) },
  build: {
    // Split long-lived vendor libraries into their own chunks so that an app
    // change does not bust the browser cache for React / router / motion / i18n.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // framer-motion / motion-dom are left out too: the `m` components stay
          // eager, the animation features (LazyMotion in App.tsx) split off lazily.
          if (/\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return
          if (id.includes('/gsap/')) return 'gsap'
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router'
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'
          // lucide-react is left out on purpose: icons tree-shake into the chunks that use them.
          if (id.includes('lucide-react')) return
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
