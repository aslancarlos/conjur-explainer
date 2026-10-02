import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import AppShell from './components/shell/AppShell'
import Footer from './components/Footer'
import Loading from './components/Loading'
import PageTransition from './components/PageTransition'
// Home is the most-visited route: keep it eager so the landing paints instantly.
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
const SaasArchitecturePage = lazy(() => import('./pages/concepts/SaasArchitecturePage'))
const SelfHostedArchitecturePage = lazy(() => import('./pages/concepts/SelfHostedArchitecturePage'))
const JwtPage = lazy(() => import('./pages/JwtPage'))
const SecretsHubPage = lazy(() => import('./pages/SecretsHubPage'))
const JenkinsPage = lazy(() => import('./pages/JenkinsPage'))
const AnsiblePage = lazy(() => import('./pages/AnsiblePage'))
const CsiDriverPage = lazy(() => import('./pages/CsiDriverPage'))
const PolicyPage = lazy(() => import('./pages/PolicyPage'))
const concept = (name: 'SecretsConcept' | 'IdentityConcept' | 'CompareConcept' | 'KubernetesConcept' | 'GlossaryConcept') =>
  lazy(() => import('./pages/ConceptPages').then(m => ({ default: m[name] })))
const SecretsConcept = concept('SecretsConcept')
const IdentityConcept = concept('IdentityConcept')
const CompareConcept = concept('CompareConcept')
const KubernetesConcept = concept('KubernetesConcept')
const GlossaryConcept = concept('GlossaryConcept')

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout() {
  return (
    <AppShell>
      <ScrollToTop />
      <main id="main" className="pt-14">
        <Suspense fallback={<Loading />}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Suspense>
      </main>
      <Footer />
    </AppShell>
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
          <Route path="/secretshub"     element={<SecretsHubPage />} />
          <Route path="/jenkins"        element={<JenkinsPage />} />
          <Route path="/ansible"        element={<AnsiblePage />} />
          <Route path="/csi"            element={<CsiDriverPage />} />
          <Route path="/policy"         element={<PolicyPage />} />
          <Route path="/concepts/secrets"            element={<SecretsConcept />} />
          <Route path="/concepts/machine-identity"   element={<IdentityConcept />} />
          <Route path="/concepts/secret-vs-identity" element={<CompareConcept />} />
          <Route path="/concepts/kubernetes"         element={<KubernetesConcept />} />
          <Route path="/concepts/saas-architecture"  element={<SaasArchitecturePage />} />
          <Route path="/concepts/self-hosted-architecture" element={<SelfHostedArchitecturePage />} />
          <Route path="/concepts/glossary"           element={<GlossaryConcept />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
