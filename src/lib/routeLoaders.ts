import type { ComponentType } from 'react'
import { ensureFullLocale } from '../i18n'

type Loader = () => Promise<ComponentType>

/**
 * Code-split pages by route path (no leading slash). Single source of truth:
 * App.tsx builds its lazy routes from this map and the Link wrapper uses it to
 * preload a page on hover/focus. The home (index) is eager and not listed.
 */
export const routeLoaders: Record<string, Loader> = {
  'spring-boot': () => import('../components/SpringBootSection').then(m => m.default),
  'dotnet': () => import('../components/DotNetSection').then(m => m.default),
  'github-actions': () => import('../components/GitHubActionsSection').then(m => m.default),
  'eso-shop': () => import('../components/ESOShopSection').then(m => m.default),
  'compare': () => import('../pages/ComparePage').then(m => m.default),
  'tools': () => import('../components/LiveToolsSection').then(m => m.default),
  'dualaccounts': () => import('../pages/DualAccountsPage').then(m => m.default),
  'jwt': () => import('../pages/JwtPage').then(m => m.default),
  'secretshub': () => import('../pages/SecretsHubPage').then(m => m.default),
  'jenkins': () => import('../pages/JenkinsPage').then(m => m.default),
  'ansible': () => import('../pages/AnsiblePage').then(m => m.default),
  'csi': () => import('../pages/CsiDriverPage').then(m => m.default),
  'policy': () => import('../pages/PolicyPage').then(m => m.default),
  'concepts/secrets': () => import('../pages/ConceptPages').then(m => m.SecretsConcept),
  'concepts/machine-identity': () => import('../pages/ConceptPages').then(m => m.IdentityConcept),
  'concepts/secret-zero': () => import('../pages/concepts/SecretZeroPage').then(m => m.default),
  'concepts/secret-vs-identity': () => import('../pages/ConceptPages').then(m => m.CompareConcept),
  'concepts/kubernetes': () => import('../pages/ConceptPages').then(m => m.KubernetesConcept),
  'concepts/saas-architecture': () => import('../pages/concepts/SaasArchitecturePage').then(m => m.default),
  'concepts/self-hosted-architecture': () => import('../pages/concepts/SelfHostedArchitecturePage').then(m => m.default),
  'concepts/swa-architecture': () => import('../pages/concepts/SwaArchitecturePage').then(m => m.default),
  'cp': () => import('../pages/cp/CpHubPage').then(m => m.default),
  'cp/credential-provider': () => import('../pages/cp/CredentialProviderPage').then(m => m.default),
  'cp/ascp': () => import('../pages/cp/AscpPage').then(m => m.default),
  'cp/ccp': () => import('../pages/cp/CcpPage').then(m => m.default),
  'authn': () => import('../pages/authn/AuthnHubPage').then(m => m.default),
  'authn/api-key': () => import('../pages/authn/ApiKeyAuthnPage').then(m => m.default),
  'authn/certificate': () => import('../pages/authn/CertAuthnPage').then(m => m.default),
  'authn/aws-iam': () => import('../pages/authn/AwsIamAuthnPage').then(m => m.default),
  'authn/azure': () => import('../pages/authn/AzureAuthnPage').then(m => m.default),
  'authn/gcp': () => import('../pages/authn/GcpAuthnPage').then(m => m.default),
  'authn/kubernetes': () => import('../pages/authn/K8sAuthnPage').then(m => m.default),
  'authn/users': () => import('../pages/authn/UsersAuthnPage').then(m => m.default),
  'sm/dynamic-secrets': () => import('../pages/sm/DynamicSecretsPage').then(m => m.default),
  'sm/certificates': () => import('../pages/sm/CertificatesPage').then(m => m.default),
  'sm/rotation': () => import('../pages/sm/RotationPage').then(m => m.default),
  'sm/audit': () => import('../pages/sm/AuditPage').then(m => m.default),
  'sm/summon': () => import('../pages/sm/SummonPage').then(m => m.default),
  'ai/mcp-server': () => import('../pages/ai/McpServerPage').then(m => m.default),
  'ai/swa-agents': () => import('../pages/ai/SwaAiAgentsPage').then(m => m.default),
  'k8s/secrets-provider-modes': () => import('../pages/k8s/SecretsProviderModesPage').then(m => m.default),
  'k8s/reloader': () => import('../pages/k8s/SecretsReloaderPage').then(m => m.default),
  'k8s/secretless': () => import('../pages/k8s/SecretlessPage').then(m => m.default),
  'cicd/terraform': () => import('../pages/cicd/TerraformPage').then(m => m.default),
  'cicd/gitlab': () => import('../pages/cicd/GitLabPage').then(m => m.default),
  'cicd/azure-devops': () => import('../pages/cicd/AzureDevOpsPage').then(m => m.default),
  'cicd/bitbucket': () => import('../pages/cicd/BitbucketPage').then(m => m.default),
  'cicd/circleci': () => import('../pages/cicd/CircleCiPage').then(m => m.default),
  'cicd/octopus': () => import('../pages/cicd/OctopusPage').then(m => m.default),
  'platforms/python-aws': () => import('../pages/platforms/PythonAwsPage').then(m => m.default),
  'platforms/cloud-foundry': () => import('../pages/platforms/CloudFoundryPage').then(m => m.default),
  'platforms/puppet': () => import('../pages/platforms/PuppetPage').then(m => m.default),
  'platforms/mulesoft': () => import('../pages/platforms/MuleSoftPage').then(m => m.default),
  'cp/zos': () => import('../pages/cp/ZosCpPage').then(m => m.default),
  'platform/overview': () => import('../pages/platform/PlatformOverviewPage').then(m => m.default),
  'finder': () => import('../pages/SolutionFinderPage').then(m => m.default),
  'vault': () => import('../pages/CofreInfoPage').then(m => m.default),
  'concepts/glossary': () => import('../pages/ConceptPages').then(m => m.GlossaryConcept),
}

/** Route key for an in-app href: no query, hash, or leading/trailing slash. */
export const routeKey = (href: string) => href.replace(/[?#].*$/, '').replace(/^\/+|\/+$/g, '')

/**
 * Warm the chunk and the full locale of the page behind `href` (user intent:
 * hover or focus on a link). Both are memoized by the module loader / i18n.ts.
 */
export function preloadRoute(href: string) {
  const load = routeLoaders[routeKey(href)]
  if (!load) return
  load().catch(() => undefined)
  void ensureFullLocale()
}
