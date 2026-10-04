import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, useRef } from 'react'
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
const ComparePage = lazy(() => import('./pages/ComparePage'))
const LiveToolsSection = lazy(() => import('./components/LiveToolsSection'))
const DualAccountsPage = lazy(() => import('./pages/DualAccountsPage'))
const SaasArchitecturePage = lazy(() => import('./pages/concepts/SaasArchitecturePage'))
const SelfHostedArchitecturePage = lazy(() => import('./pages/concepts/SelfHostedArchitecturePage'))
const SwaArchitecturePage = lazy(() => import('./pages/concepts/SwaArchitecturePage'))
const SecretZeroPage = lazy(() => import('./pages/concepts/SecretZeroPage'))
const CpHubPage = lazy(() => import('./pages/cp/CpHubPage'))
const CredentialProviderPage = lazy(() => import('./pages/cp/CredentialProviderPage'))
const AscpPage = lazy(() => import('./pages/cp/AscpPage'))
const CcpPage = lazy(() => import('./pages/cp/CcpPage'))
const AuthnHubPage = lazy(() => import('./pages/authn/AuthnHubPage'))
const ApiKeyAuthnPage = lazy(() => import('./pages/authn/ApiKeyAuthnPage'))
const CertAuthnPage = lazy(() => import('./pages/authn/CertAuthnPage'))
const AwsIamAuthnPage = lazy(() => import('./pages/authn/AwsIamAuthnPage'))
const AzureAuthnPage = lazy(() => import('./pages/authn/AzureAuthnPage'))
const GcpAuthnPage = lazy(() => import('./pages/authn/GcpAuthnPage'))
const K8sAuthnPage = lazy(() => import('./pages/authn/K8sAuthnPage'))
const UsersAuthnPage = lazy(() => import('./pages/authn/UsersAuthnPage'))
const DynamicSecretsPage = lazy(() => import('./pages/sm/DynamicSecretsPage'))
const CertificatesPage = lazy(() => import('./pages/sm/CertificatesPage'))
const RotationPage = lazy(() => import('./pages/sm/RotationPage'))
const AuditPage = lazy(() => import('./pages/sm/AuditPage'))
const SummonPage = lazy(() => import('./pages/sm/SummonPage'))
const McpServerPage = lazy(() => import('./pages/ai/McpServerPage'))
const SwaAiAgentsPage = lazy(() => import('./pages/ai/SwaAiAgentsPage'))
const SecretsProviderModesPage = lazy(() => import('./pages/k8s/SecretsProviderModesPage'))
const SecretsReloaderPage = lazy(() => import('./pages/k8s/SecretsReloaderPage'))
const SecretlessPage = lazy(() => import('./pages/k8s/SecretlessPage'))
const TerraformPage = lazy(() => import('./pages/cicd/TerraformPage'))
const GitLabPage = lazy(() => import('./pages/cicd/GitLabPage'))
const AzureDevOpsPage = lazy(() => import('./pages/cicd/AzureDevOpsPage'))
const BitbucketPage = lazy(() => import('./pages/cicd/BitbucketPage'))
const CircleCiPage = lazy(() => import('./pages/cicd/CircleCiPage'))
const OctopusPage = lazy(() => import('./pages/cicd/OctopusPage'))
const PythonAwsPage = lazy(() => import('./pages/platforms/PythonAwsPage'))
const CloudFoundryPage = lazy(() => import('./pages/platforms/CloudFoundryPage'))
const PuppetPage = lazy(() => import('./pages/platforms/PuppetPage'))
const MuleSoftPage = lazy(() => import('./pages/platforms/MuleSoftPage'))
const ZosCpPage = lazy(() => import('./pages/cp/ZosCpPage'))
const SolutionFinderPage = lazy(() => import('./pages/SolutionFinderPage'))
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
  const first = useRef(true)
  useEffect(() => {
    window.scrollTo(0, 0)
    // WCAG focus-on-route-change: after an in-app navigation, move focus to the
    // main region so screen readers start at the new page (not on first load).
    if (first.current) { first.current = false; return }
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])
  return null
}

function Layout() {
  return (
    <AppShell>
      <ScrollToTop />
      <main id="main" tabIndex={-1} className="pt-14 outline-none">
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
          <Route path="/compare"        element={<ComparePage />} />
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
          <Route path="/concepts/secret-zero"        element={<SecretZeroPage />} />
          <Route path="/concepts/secret-vs-identity" element={<CompareConcept />} />
          <Route path="/concepts/kubernetes"         element={<KubernetesConcept />} />
          <Route path="/concepts/saas-architecture"  element={<SaasArchitecturePage />} />
          <Route path="/concepts/self-hosted-architecture" element={<SelfHostedArchitecturePage />} />
          <Route path="/concepts/swa-architecture"   element={<SwaArchitecturePage />} />
          <Route path="/cp" element={<CpHubPage />} />
          <Route path="/cp/credential-provider" element={<CredentialProviderPage />} />
          <Route path="/cp/ascp" element={<AscpPage />} />
          <Route path="/cp/ccp" element={<CcpPage />} />
          <Route path="/authn" element={<AuthnHubPage />} />
          <Route path="/authn/api-key" element={<ApiKeyAuthnPage />} />
          <Route path="/authn/certificate" element={<CertAuthnPage />} />
          <Route path="/authn/aws-iam" element={<AwsIamAuthnPage />} />
          <Route path="/authn/azure" element={<AzureAuthnPage />} />
          <Route path="/authn/gcp" element={<GcpAuthnPage />} />
          <Route path="/authn/kubernetes" element={<K8sAuthnPage />} />
          <Route path="/authn/users" element={<UsersAuthnPage />} />
          <Route path="/sm/dynamic-secrets" element={<DynamicSecretsPage />} />
          <Route path="/sm/certificates" element={<CertificatesPage />} />
          <Route path="/sm/rotation" element={<RotationPage />} />
          <Route path="/sm/audit" element={<AuditPage />} />
          <Route path="/sm/summon" element={<SummonPage />} />
          <Route path="/ai/mcp-server" element={<McpServerPage />} />
          <Route path="/ai/swa-agents" element={<SwaAiAgentsPage />} />
          <Route path="/k8s/secrets-provider-modes" element={<SecretsProviderModesPage />} />
          <Route path="/k8s/reloader" element={<SecretsReloaderPage />} />
          <Route path="/k8s/secretless" element={<SecretlessPage />} />
          <Route path="/cicd/terraform" element={<TerraformPage />} />
          <Route path="/cicd/gitlab" element={<GitLabPage />} />
          <Route path="/cicd/azure-devops" element={<AzureDevOpsPage />} />
          <Route path="/cicd/bitbucket" element={<BitbucketPage />} />
          <Route path="/cicd/circleci" element={<CircleCiPage />} />
          <Route path="/cicd/octopus" element={<OctopusPage />} />
          <Route path="/platforms/python-aws" element={<PythonAwsPage />} />
          <Route path="/platforms/cloud-foundry" element={<CloudFoundryPage />} />
          <Route path="/platforms/puppet" element={<PuppetPage />} />
          <Route path="/platforms/mulesoft" element={<MuleSoftPage />} />
          <Route path="/cp/zos" element={<ZosCpPage />} />
          <Route path="/finder" element={<SolutionFinderPage />} />
          <Route path="/concepts/glossary"           element={<GlossaryConcept />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
