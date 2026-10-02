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

export default defineConfig({
  plugins: [react(), devVisits()],
  base: '/',
  build: {
    // Split long-lived vendor libraries into their own chunks so that an app
    // change does not bust the browser cache for React / router / motion / i18n.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('/gsap/')) return 'gsap'
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router'
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
