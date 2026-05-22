import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import SpringBootSection from './components/SpringBootSection'
import DotNetSection from './components/DotNetSection'
import GitHubActionsSection from './components/GitHubActionsSection'
import ESOShopSection from './components/ESOShopSection'
import IntegrationFlow from './components/IntegrationFlow'
import ComparisonTable from './components/ComparisonTable'
import LiveToolsSection from './components/LiveToolsSection'
import DualAccountsPage from './pages/DualAccountsPage'
import JwtPage from './pages/JwtPage'
import SecretsHubPage from './pages/SecretsHubPage'
import JenkinsPage from './pages/JenkinsPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout() {
  return (
    <div className="min-h-screen bg-bg-base text-slate-200">
      <NavBar />
      <ScrollToTop />
      <main className="pt-14">
        <Outlet />
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
          <Route path="/tools"           element={<LiveToolsSection />} />
          <Route path="/dualaccounts"   element={<DualAccountsPage />} />
          <Route path="/jwt"            element={<JwtPage />} />
          <Route path="/secretshub"    element={<SecretsHubPage />} />
          <Route path="/jenkins"       element={<JenkinsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
