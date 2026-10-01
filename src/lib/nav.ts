import {
  Home, RefreshCw, KeyRound, ScrollText, Combine, Server, Boxes, ShipWheel,
  Leaf, Hexagon, Github, ShoppingCart, Database,
  Workflow, GitCompareArrows, Wrench, BadgeCheck, LayoutDashboard,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Single source of truth for site navigation (sidebar, mobile drawer, home
 * demo catalogue). Groups follow how the CyberArk Secrets Manager docs organise
 * integrations — by HOW a workload gets its secret — not "examples vs
 * integrations":
 *   Identity & access    → authenticators, policy, Secure Workload Access
 *   Kubernetes           → "Secure Kubernetes" (Spring Boot on K8s JWT,
 *                          Secrets Provider, External Secrets Operator, CSI)
 *   CI/CD & automation   → GitHub Actions, Jenkins, Ansible
 *   Credential lifecycle → PAM side: Dual Accounts rotation, Secrets Hub sync
 *   Tools                → explorers and live dashboards
 *
 * `href` marks sibling services outside the SPA — rendered as <a>, not <Link>.
 * `color` is the icon accent; it must reach 3:1 in both themes (DESIGN.md §6).
 * `demo` adds the item to the home catalogue (name, mechanism, i18n desc key).
 */
export interface NavItem {
  to: string
  href?: string
  labelKey: string
  subKey?: string
  Icon: LucideIcon
  color?: string
  demo?: { name: string; secret: string; descKey: string }
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
    key: 'identity',
    labelKey: 'nav.group_identity',
    descKey: 'demos.group_identity',
    items: [
      { to: '/jwt', labelKey: 'nav.jwt', subKey: 'nav.jwt_sub', Icon: KeyRound, color: 'text-domain-idira',
        demo: { name: 'authn-jwt', secret: 'identity handshake', descKey: 'demos.jwt' } },
      { to: '/policy', labelKey: 'nav.policy', subKey: 'nav.policy_sub', Icon: ScrollText, color: 'text-domain-idira',
        demo: { name: 'Policy as Code', secret: 'YAML + git', descKey: 'demos.policy' } },
      { to: '/swa-s3', href: '/swa-s3', labelKey: 'nav.swa', subKey: 'nav.swa_sub', Icon: Database, color: 'text-eso',
        demo: { name: 'SWA → AWS S3', secret: 'SPIFFE/SVID → STS', descKey: 'demos.swa' } },
    ],
  },
  {
    key: 'k8s',
    labelKey: 'nav.group_k8s',
    descKey: 'demos.group_k8s',
    items: [
      { to: '/spring-boot', labelKey: 'nav.springboot', subKey: 'nav.springboot_sub', Icon: Leaf, color: 'text-spring',
        demo: { name: 'Spring Boot', secret: 'direct JWT', descKey: 'demos.spring' } },
      { to: '/dotnet', labelKey: 'nav.dotnet', subKey: 'nav.dotnet_sub', Icon: Hexagon, color: 'text-domain-cp',
        demo: { name: '.NET', secret: 'Secrets Provider sidecar', descKey: 'demos.dotnet' } },
      { to: '/eso-shop', labelKey: 'nav.esoshop', subKey: 'nav.esoshop_sub', Icon: ShoppingCart, color: 'text-eso',
        demo: { name: 'ESO Shop', secret: 'External Secrets Operator', descKey: 'demos.eso' } },
      { to: '/csi', labelKey: 'nav.csidriver', subKey: 'nav.csidriver_sub', Icon: ShipWheel, color: 'text-csi',
        demo: { name: 'CSI Driver', secret: 'tmpfs volume', descKey: 'demos.csi' } },
    ],
  },
  {
    key: 'cicd',
    labelKey: 'nav.group_cicd',
    descKey: 'demos.group_cicd',
    items: [
      { to: '/github-actions', labelKey: 'nav.gha', subKey: 'nav.gha_sub', Icon: Github, color: 'text-gh',
        demo: { name: 'GitHub Actions', secret: 'OIDC', descKey: 'demos.gha' } },
      { to: '/jenkins', labelKey: 'nav.jenkins', subKey: 'nav.jenkins_sub', Icon: Server, color: 'text-spring',
        demo: { name: 'Jenkins', secret: 'plugin JWT', descKey: 'demos.jenkins' } },
      { to: '/ansible', labelKey: 'nav.ansible', subKey: 'nav.ansible_sub', Icon: Boxes, color: 'text-ansible',
        demo: { name: 'Ansible', secret: 'lookup', descKey: 'demos.ansible' } },
    ],
  },
  {
    key: 'lifecycle',
    labelKey: 'nav.group_lifecycle',
    descKey: 'demos.group_lifecycle',
    items: [
      { to: '/dualaccounts', labelKey: 'nav.dualaccounts', subKey: 'nav.dualaccounts_sub', Icon: RefreshCw, color: 'text-domain-idira',
        demo: { name: 'Dual Accounts', secret: 'zero-downtime rotation', descKey: 'demos.dual' } },
      { to: '/secretshub', labelKey: 'nav.secretshub', subKey: 'nav.secretshub_sub', Icon: Combine, color: 'text-domain-cp',
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
      { to: '/jwt-validator', labelKey: 'nav.jwtvalidator', subKey: 'nav.jwtvalidator_sub', Icon: BadgeCheck,       color: 'text-text-2' },
      { to: '/controller', href: '/controller', labelKey: 'nav.controller', subKey: 'nav.controller_sub', Icon: LayoutDashboard, color: 'text-text-2' },
    ],
  },
]

/** Groups that appear in the home demo catalogue (items with `demo`). */
export const DEMO_GROUPS = NAV
  .map(g => ({ ...g, items: g.items.filter(i => i.demo) }))
  .filter(g => g.items.length > 0)
