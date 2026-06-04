import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import Loading from './components/Loading'
import PageTransition from './components/PageTransition'
// Home is the most-visited route — keep it eager so the landing paints instantly.
import HomePage from './pages/HomePage'

// Every other route is code-split: its JS chunk is fetched on demand, so the
// initial download no longer carries all 14 pages.
const SpringBootSection = lazy(() => import('./components/SpringBootSection'))
const DotNetSection = lazy(() => import('./components/DotNetSection'))
const GitHubActionsSection = lazy(() => import('./components/GitHubActionsSection'))
const ESOShopSection = lazy(() => import('./components/ESOShopSection'))
const IntegrationFlow = lazy(() => import('./components/IntegrationFlow'))
const ComparisonTable = lazy(() => import('./components/ComparisonTable'))
const LiveToolsSection = lazy(() => import('./components/LiveToolsSection'))
const DualAccountsPage = lazy(() => import('./pages/DualAccountsPage'))
const JwtPage = lazy(() => import('./pages/JwtPage'))
const JwtValidatorPage = lazy(() => import('./pages/JwtValidatorPage'))
const SecretsHubPage = lazy(() => import('./pages/SecretsHubPage'))
const JenkinsPage = lazy(() => import('./pages/JenkinsPage'))
const PolicyPage = lazy(() => import('./pages/PolicyPage'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <NavBar />
      <ScrollToTop />
      <main id="main" className="pt-14">
        <Suspense fallback={<Loading />}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"               element={<HomePage />} />
          <Route path="/spring-boot"    element={<SpringBootSection />} />
          <Route path="/dotnet"         element={<DotNetSection />} />
          <Route path="/github-actions" element={<GitHubActionsSection />} />
          <Route path="/eso-shop"       element={<ESOShopSection />} />
          <Route path="/flow"           element={<IntegrationFlow />} />
          <Route path="/compare"        element={<ComparisonTable />} />
          <Route path="/tools"          element={<LiveToolsSection />} />
          <Route path="/dualaccounts"   element={<DualAccountsPage />} />
          <Route path="/jwt"            element={<JwtPage />} />
          <Route path="/jwt-validator"  element={<JwtValidatorPage />} />
          <Route path="/secretshub"     element={<SecretsHubPage />} />
          <Route path="/jenkins"        element={<JenkinsPage />} />
          <Route path="/policy"         element={<PolicyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
