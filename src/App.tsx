import { createBrowserRouter, matchRoutes, Outlet, RouterProvider, ScrollRestoration, useLocation, type RouteObject } from 'react-router-dom'
import { type ComponentType, useEffect, useRef } from 'react'
import AppShell from './components/shell/AppShell'
import Footer from './components/Footer'
import Loading from './components/Loading'
// Home is the most-visited route: keep it eager so the landing paints instantly.
import HomePage from './pages/HomePage'

// Every other route is code-split through the router's `lazy`: the chunk is
// fetched before the navigation commits, so the page swap happens once, with
// the new page already rendered (no spinner flash, and the view transition
// snapshots real content instead of the fallback).
type Module = { default: ComponentType }
const page = (load: () => Promise<Module>) => async () => ({ Component: (await load()).default })
type ConceptName = 'SecretsConcept' | 'IdentityConcept' | 'CompareConcept' | 'KubernetesConcept' | 'GlossaryConcept'
const concept = (name: ConceptName) => async () => ({ Component: (await import('./pages/ConceptPages'))[name] })

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
  { path: 'spring-boot', lazy: page(() => import('./components/SpringBootSection')) },
  { path: 'dotnet', lazy: page(() => import('./components/DotNetSection')) },
  { path: 'github-actions', lazy: page(() => import('./components/GitHubActionsSection')) },
  { path: 'eso-shop', lazy: page(() => import('./components/ESOShopSection')) },
  { path: 'compare', lazy: page(() => import('./pages/ComparePage')) },
  { path: 'tools', lazy: page(() => import('./components/LiveToolsSection')) },
  { path: 'dualaccounts', lazy: page(() => import('./pages/DualAccountsPage')) },
  { path: 'jwt', lazy: page(() => import('./pages/JwtPage')) },
  { path: 'secretshub', lazy: page(() => import('./pages/SecretsHubPage')) },
  { path: 'jenkins', lazy: page(() => import('./pages/JenkinsPage')) },
  { path: 'ansible', lazy: page(() => import('./pages/AnsiblePage')) },
  { path: 'csi', lazy: page(() => import('./pages/CsiDriverPage')) },
  { path: 'policy', lazy: page(() => import('./pages/PolicyPage')) },
  { path: 'concepts/secrets', lazy: concept('SecretsConcept') },
  { path: 'concepts/machine-identity', lazy: concept('IdentityConcept') },
  { path: 'concepts/secret-zero', lazy: page(() => import('./pages/concepts/SecretZeroPage')) },
  { path: 'concepts/secret-vs-identity', lazy: concept('CompareConcept') },
  { path: 'concepts/kubernetes', lazy: concept('KubernetesConcept') },
  { path: 'concepts/saas-architecture', lazy: page(() => import('./pages/concepts/SaasArchitecturePage')) },
  { path: 'concepts/self-hosted-architecture', lazy: page(() => import('./pages/concepts/SelfHostedArchitecturePage')) },
  { path: 'concepts/swa-architecture', lazy: page(() => import('./pages/concepts/SwaArchitecturePage')) },
  { path: 'cp', lazy: page(() => import('./pages/cp/CpHubPage')) },
  { path: 'cp/credential-provider', lazy: page(() => import('./pages/cp/CredentialProviderPage')) },
  { path: 'cp/ascp', lazy: page(() => import('./pages/cp/AscpPage')) },
  { path: 'cp/ccp', lazy: page(() => import('./pages/cp/CcpPage')) },
  { path: 'authn', lazy: page(() => import('./pages/authn/AuthnHubPage')) },
  { path: 'authn/api-key', lazy: page(() => import('./pages/authn/ApiKeyAuthnPage')) },
  { path: 'authn/certificate', lazy: page(() => import('./pages/authn/CertAuthnPage')) },
  { path: 'authn/aws-iam', lazy: page(() => import('./pages/authn/AwsIamAuthnPage')) },
  { path: 'authn/azure', lazy: page(() => import('./pages/authn/AzureAuthnPage')) },
  { path: 'authn/gcp', lazy: page(() => import('./pages/authn/GcpAuthnPage')) },
  { path: 'authn/kubernetes', lazy: page(() => import('./pages/authn/K8sAuthnPage')) },
  { path: 'authn/users', lazy: page(() => import('./pages/authn/UsersAuthnPage')) },
  { path: 'sm/dynamic-secrets', lazy: page(() => import('./pages/sm/DynamicSecretsPage')) },
  { path: 'sm/certificates', lazy: page(() => import('./pages/sm/CertificatesPage')) },
  { path: 'sm/rotation', lazy: page(() => import('./pages/sm/RotationPage')) },
  { path: 'sm/audit', lazy: page(() => import('./pages/sm/AuditPage')) },
  { path: 'sm/summon', lazy: page(() => import('./pages/sm/SummonPage')) },
  { path: 'ai/mcp-server', lazy: page(() => import('./pages/ai/McpServerPage')) },
  { path: 'ai/swa-agents', lazy: page(() => import('./pages/ai/SwaAiAgentsPage')) },
  { path: 'k8s/secrets-provider-modes', lazy: page(() => import('./pages/k8s/SecretsProviderModesPage')) },
  { path: 'k8s/reloader', lazy: page(() => import('./pages/k8s/SecretsReloaderPage')) },
  { path: 'k8s/secretless', lazy: page(() => import('./pages/k8s/SecretlessPage')) },
  { path: 'cicd/terraform', lazy: page(() => import('./pages/cicd/TerraformPage')) },
  { path: 'cicd/gitlab', lazy: page(() => import('./pages/cicd/GitLabPage')) },
  { path: 'cicd/azure-devops', lazy: page(() => import('./pages/cicd/AzureDevOpsPage')) },
  { path: 'cicd/bitbucket', lazy: page(() => import('./pages/cicd/BitbucketPage')) },
  { path: 'cicd/circleci', lazy: page(() => import('./pages/cicd/CircleCiPage')) },
  { path: 'cicd/octopus', lazy: page(() => import('./pages/cicd/OctopusPage')) },
  { path: 'platforms/python-aws', lazy: page(() => import('./pages/platforms/PythonAwsPage')) },
  { path: 'platforms/cloud-foundry', lazy: page(() => import('./pages/platforms/CloudFoundryPage')) },
  { path: 'platforms/puppet', lazy: page(() => import('./pages/platforms/PuppetPage')) },
  { path: 'platforms/mulesoft', lazy: page(() => import('./pages/platforms/MuleSoftPage')) },
  { path: 'cp/zos', lazy: page(() => import('./pages/cp/ZosCpPage')) },
  { path: 'finder', lazy: page(() => import('./pages/SolutionFinderPage')) },
  { path: 'concepts/glossary', lazy: concept('GlossaryConcept') },
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

export default function App() {
  router ??= createBrowserRouter(routes)
  return <RouterProvider router={router} />
}
