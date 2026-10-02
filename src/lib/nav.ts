import {
  Home, BookOpen, ArrowLeftRight, Container, Fingerprint, FileBadge, RefreshCw, KeyRound, ScrollText, Combine, Server, Boxes, ShipWheel,
  Leaf, Hexagon, Github, ShoppingCart, Database,
  Workflow, GitCompareArrows, Wrench, LayoutDashboard, CloudCog, Network, ShieldCheck, Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Single source of truth for site navigation (sidebar, mobile drawer, home
 * demo catalogue). Groups follow how the CyberArk Secrets Manager docs organise
 * integrations (by HOW a workload gets its secret) not "examples vs
 * integrations":
 *   Identity & access    → authenticators, policy, Secure Workload Access
 *   Kubernetes           → "Secure Kubernetes" (Spring Boot on K8s JWT,
 *                          Secrets Provider, External Secrets Operator, CSI)
 *   CI/CD & automation   → GitHub Actions, Jenkins, Ansible
 *   Credential lifecycle → PAM side: Dual Accounts rotation, Secrets Hub sync
 *   Tools                → explorers and live dashboards
 *
 * `href` marks sibling services outside the SPA, rendered as <a>, not <Link>.
 * `color` is the icon accent; it must reach 3:1 in both themes (DESIGN.md §6).
 * `demo` adds the item to the home catalogue (name, mechanism, i18n desc key).
 */
export type ProductKey = 'secretsmanager' | 'swa' | 'secretshub' | 'pam'

export interface NavItem {
  to: string
  product?: ProductKey
  href?: string
  labelKey: string
  subKey?: string
  Icon: LucideIcon
  color?: string
  demo?: { name: string; secret: string; descKey: string }
  section?: SectionKey  // consecutive items with the same section render as a collapsible sidebar submenu
  heading?: string      // i18n key of a small non-interactive sub-heading shown when it changes
  shortKey?: string     // shorter label used under a heading / inside a submenu (sidebar only)
}

export type SectionKey = 'usecases'
/** Sidebar submenus inside a group (the flat list still drives trails, search and catalogue). */
export const SECTIONS: Record<SectionKey, { labelKey: string; Icon: LucideIcon }> = {
  usecases: { labelKey: 'nav.sec_usecases', Icon: Layers },
}

export interface NavGroup {
  key: string
  labelKey?: string
  descKey?: string      // one-line group description (home catalogue)
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    key: 'home',
    items: [{ to: '/', labelKey: 'nav.home', Icon: Home, color: 'text-domain-idira' }],
  },
  {
    // Learning trail (ConceptLayout follows this order for prev / next).
    key: 'concepts',
    labelKey: 'nav.group_concepts',
    items: [
      { to: '/concepts/secrets',            labelKey: 'nav.c_secret',   subKey: 'nav.c_secret_sub',   Icon: KeyRound,       color: 'text-domain-idira' },
      { to: '/concepts/machine-identity',   labelKey: 'nav.c_identity', subKey: 'nav.c_identity_sub', Icon: Fingerprint,    color: 'text-domain-idira' },
      { to: '/concepts/secret-vs-identity', labelKey: 'nav.c_compare',  subKey: 'nav.c_compare_sub',  Icon: ArrowLeftRight, color: 'text-domain-idira' },
      { to: '/concepts/glossary',           labelKey: 'nav.c_glossary', subKey: 'nav.c_glossary_sub', Icon: BookOpen,       color: 'text-domain-idira' },
    ],
  },
  {
    key: 'secretsmanager',
    labelKey: 'nav.group_sm',
    descKey: 'demos.group_sm',
    items: [
      { to: '/concepts/saas-architecture',  product: 'secretsmanager', labelKey: 'nav.c_saas', subKey: 'nav.c_saas_sub', Icon: CloudCog, color: 'text-domain-idira', heading: 'nav.h_arch', shortKey: 'nav.c_saas_short' },
      { to: '/concepts/self-hosted-architecture', product: 'secretsmanager', labelKey: 'nav.c_sh', subKey: 'nav.c_sh_sub', Icon: Network, color: 'text-domain-idira', heading: 'nav.h_arch', shortKey: 'nav.c_sh_short' },
      { to: '/jwt', product: 'secretsmanager', labelKey: 'nav.jwt', subKey: 'nav.jwt_sub', Icon: KeyRound, color: 'text-domain-idira', heading: 'nav.h_authz',
        demo: { name: 'authn-jwt', secret: 'identity handshake', descKey: 'demos.jwt' } },
      { to: '/policy', product: 'secretsmanager', labelKey: 'nav.policy', subKey: 'nav.policy_sub', Icon: ScrollText, color: 'text-domain-idira', heading: 'nav.h_authz',
        demo: { name: 'Policy as Code', secret: 'YAML + git', descKey: 'demos.policy' } },
      { to: '/concepts/kubernetes', product: 'secretsmanager', labelKey: 'nav.c_k8s', subKey: 'nav.c_k8s_sub', Icon: Container, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_k8s', shortKey: 'nav.c_k8s_short' },
      { to: '/spring-boot', product: 'secretsmanager', labelKey: 'nav.springboot', subKey: 'nav.springboot_sub', Icon: Leaf, color: 'text-spring', section: 'usecases', heading: 'nav.h_k8s',
        demo: { name: 'SDK', secret: 'direct JWT', descKey: 'demos.spring' } },
      { to: '/dotnet', product: 'secretsmanager', labelKey: 'nav.dotnet', subKey: 'nav.dotnet_sub', Icon: Hexagon, color: 'text-domain-cp', section: 'usecases', heading: 'nav.h_k8s',
        demo: { name: 'Sidecar', secret: 'Secrets Provider', descKey: 'demos.dotnet' } },
      { to: '/eso-shop', product: 'secretsmanager', labelKey: 'nav.esoshop', subKey: 'nav.esoshop_sub', Icon: ShoppingCart, color: 'text-eso', section: 'usecases', heading: 'nav.h_k8s',
        demo: { name: 'External Secrets Operator', secret: 'Kubernetes Secret', descKey: 'demos.eso' } },
      { to: '/csi', product: 'secretsmanager', labelKey: 'nav.csidriver', subKey: 'nav.csidriver_sub', Icon: ShipWheel, color: 'text-csi', section: 'usecases', heading: 'nav.h_k8s',
        demo: { name: 'CSI Driver', secret: 'tmpfs volume', descKey: 'demos.csi' } },
      { to: '/github-actions', product: 'secretsmanager', labelKey: 'nav.gha', subKey: 'nav.gha_sub', Icon: Github, color: 'text-gh', section: 'usecases', heading: 'nav.h_cicd',
        demo: { name: 'GitHub Actions', secret: 'OIDC', descKey: 'demos.gha' } },
      { to: '/jenkins', product: 'secretsmanager', labelKey: 'nav.jenkins', subKey: 'nav.jenkins_sub', Icon: Server, color: 'text-spring', section: 'usecases', heading: 'nav.h_cicd',
        demo: { name: 'Jenkins', secret: 'plugin JWT', descKey: 'demos.jenkins' } },
      { to: '/ansible', product: 'secretsmanager', labelKey: 'nav.ansible', subKey: 'nav.ansible_sub', Icon: Boxes, color: 'text-ansible', section: 'usecases', heading: 'nav.h_cicd',
        demo: { name: 'Ansible', secret: 'lookup', descKey: 'demos.ansible' } },
    ],
  },
  {
    key: 'swa',
    labelKey: 'nav.group_swa',
    descKey: 'demos.group_swa',
    items: [
      { to: '/concepts/swa-architecture', product: 'swa', labelKey: 'nav.c_swa', subKey: 'nav.c_swa_sub', Icon: ShieldCheck, color: 'text-domain-idira' },
      { to: '/svid', product: 'swa', href: '/svid', labelKey: 'nav.svid', subKey: 'nav.svid_sub', Icon: FileBadge, color: 'text-domain-idira',
        demo: { name: 'SVID Explorer', secret: 'X.509-SVID + JWT-SVID', descKey: 'demos.svid' } },
      { to: '/swa-s3', product: 'swa', href: '/swa-s3', labelKey: 'nav.swa', subKey: 'nav.swa_sub', Icon: Database, color: 'text-eso',
        demo: { name: 'SWA → AWS S3', secret: 'SPIFFE/SVID → STS', descKey: 'demos.swa' } },
    ],
  },
  {
    key: 'lifecycle',
    labelKey: 'nav.group_lifecycle',
    descKey: 'demos.group_lifecycle',
    items: [
      { to: '/dualaccounts', product: 'pam', labelKey: 'nav.dualaccounts', subKey: 'nav.dualaccounts_sub', Icon: RefreshCw, color: 'text-domain-idira',
        demo: { name: 'Dual Accounts', secret: 'zero-downtime rotation', descKey: 'demos.dual' } },
      { to: '/secretshub', product: 'secretshub', labelKey: 'nav.secretshub', subKey: 'nav.secretshub_sub', Icon: Combine, color: 'text-domain-cp',
        demo: { name: 'Secrets Hub', secret: 'PAM → cloud sync', descKey: 'demos.secretshub' } },
    ],
  },
  {
    key: 'tools',
    labelKey: 'nav.tools',
    items: [
      { to: '/flow',          labelKey: 'nav.flow',         subKey: 'nav.flow_sub',         Icon: Workflow,         color: 'text-text-2' },
      { to: '/compare',       labelKey: 'nav.compare',      subKey: 'nav.compare_sub',      Icon: GitCompareArrows, color: 'text-text-2' },
      { to: '/tools',         labelKey: 'nav.livetools',    subKey: 'nav.livetools_sub',    Icon: Wrench,           color: 'text-text-2' },
      { to: '/controller', href: '/controller', labelKey: 'nav.controller', subKey: 'nav.controller_sub', Icon: LayoutDashboard, color: 'text-text-2' },
    ],
  },
]

/**
 * Products, as named in the CyberArk / IDIRA docs spaces. Secure Workload
 * Access is documented inside Secrets Manager SaaS but is its own SPIFFE-based
 * offering; Dual Accounts is a PAM (CPM) capability consumed by Credential
 * Providers and Secrets Manager.
 */
export const PRODUCTS: Array<{ key: ProductKey; labelKey: string; descKey: string }> = [
  { key: 'secretsmanager', labelKey: 'nav.prod_secretsmanager', descKey: 'demos.prod_secretsmanager' },
  { key: 'swa',            labelKey: 'nav.prod_swa',            descKey: 'demos.prod_swa' },
  { key: 'secretshub',     labelKey: 'nav.prod_secretshub',     descKey: 'demos.prod_secretshub' },
  { key: 'pam',            labelKey: 'nav.prod_pam',            descKey: 'demos.prod_pam' },
]

export type NavView = 'usecase' | 'product'

/** The navigation grouped by use case (NAV as authored) or by product. */
export function navBy(view: NavView): NavGroup[] {
  if (view === 'usecase') return NAV
  const all = NAV.flatMap(g => g.items)
  const home = NAV.find(g => g.key === 'home')!
  const concepts = NAV.find(g => g.key === 'concepts')!
  const tools = NAV.find(g => g.key === 'tools')!
  return [
    home,
    concepts,
    ...PRODUCTS.map(p => ({
      key: `p-${p.key}`, labelKey: p.labelKey, descKey: p.descKey,
      items: all.filter(i => i.product === p.key),
    })),
    tools,
  ]
}

/** Groups that appear in the home demo catalogue (items with `demo`). */
export function demoGroups(view: NavView): NavGroup[] {
  return navBy(view)
    .map(g => ({ ...g, items: g.items.filter(i => i.demo) }))
    .filter(g => g.items.length > 0)
}
