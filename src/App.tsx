import { createBrowserRouter, matchRoutes, Outlet, RouterProvider, ScrollRestoration, useLocation, type RouteObject } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { LazyMotion } from 'framer-motion'
import AppShell from './components/shell/AppShell'
import Footer from './components/Footer'
import Loading from './components/Loading'
import { ensureFullLocale } from './i18n'
import { routeLoaders } from './lib/routeLoaders'
// Home is the most-visited route: keep it eager so the landing paints instantly.
import HomePage from './pages/HomePage'

// Every other route is code-split through the router's `lazy`: the chunk is
// fetched before the navigation commits, so the page swap happens once, with
// the new page already rendered (no spinner flash, and the view transition
// snapshots real content instead of the fallback). The full locale loads in the
// same step, so a page never commits before its strings exist.

/** WCAG focus-on-route-change: after an in-app navigation, move focus to the
 *  main region so screen readers start at the new page (not on first load). */
function FocusMain() {
  const { pathname } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])
  return null
}

function Layout() {
  return (
    <AppShell>
      {/* Restores the scroll position on back/forward, top of page otherwise. */}
      <ScrollRestoration />
      <FocusMain />
      <main id="main" tabIndex={-1} className="vt-page pt-14 outline-none">
        <Outlet />
      </main>
      <Footer />
    </AppShell>
  )
}

const children: RouteObject[] = [
  { index: true, Component: HomePage },
  ...Object.entries(routeLoaders).map(([path, load]): RouteObject => ({
    path,
    lazy: async () => {
      const [Component] = await Promise.all([load(), ensureFullLocale()])
      return { Component }
    },
  })),
]

const routes: RouteObject[] = [{ Component: Layout, hydrateFallbackElement: <Loading />, children }]

/**
 * Resolve the lazy route that matches the first URL before the router starts,
 * so a deep link renders the shell and the page in one paint (React Router SPA
 * guidance). Runs in parallel with the locale chunk in main.tsx.
 */
export async function preloadInitialRoute() {
  const matches = matchRoutes(routes, window.location) ?? []
  await Promise.all(matches.map(async m => {
    const load = m.route.lazy
    if (typeof load !== 'function') return
    Object.assign(m.route, { ...(await load()), lazy: undefined })
  }))
}

let router: ReturnType<typeof createBrowserRouter> | undefined

// Animation features are fetched once, after the first paint; `strict` throws
// if a full `motion.*` component sneaks back in (use `m.*`).
const motionFeatures = () => import('./lib/motionFeatures').then(mod => mod.default)

export default function App() {
  router ??= createBrowserRouter(routes)
  return (
    <LazyMotion features={motionFeatures} strict>
      <RouterProvider router={router} />
    </LazyMotion>
  )
}
