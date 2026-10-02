import {
  ShieldAlert, Home, Compass, BookOpen, ArrowLeftRight, Container, Fingerprint, FileBadge, RefreshCw, KeyRound, ScrollText, Combine, Server, Boxes, ShipWheel,
  Leaf, Hexagon, Github, ShoppingCart, Database,
  GitCompareArrows, Wrench, LayoutDashboard, CloudCog, Network, ShieldCheck, Layers, GraduationCap, Vault, KeySquare, BadgeCheck, Cloud, Users, AppWindow, LayoutGrid, HardDrive, Globe,
  Timer, FileKey2, RotateCw, ClipboardList, Terminal, Bot, Columns3, RefreshCcw, EyeOff, Blocks, GitBranch, Infinity as InfinityIcon, GitPullRequest, CircleDot, Rocket, Code, CloudUpload, Cog, Workflow, Cpu,
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

export type SectionKey = 'authn' | 'usecases'
/** Sidebar submenus inside a group (the flat list still drives trails, search and catalogue). */
export const SECTIONS: Record<SectionKey, { labelKey: string; Icon: LucideIcon }> = {
  authn:    { labelKey: 'nav.sec_authn', Icon: Fingerprint },
  usecases: { labelKey: 'nav.sec_usecases', Icon: Layers },
}

export interface NavGroup {
  key: string
  labelKey?: string
  descKey?: string      // one-line group description (home catalogue)
  Icon?: LucideIcon     // sidebar group header icon
  color?: string        // product colour (header + items; DESIGN.md: one hue per product)
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    key: 'home',
    items: [
      { to: '/', labelKey: 'nav.home', Icon: Home, color: 'text-domain-idira' },
      { to: '/finder', labelKey: 'nav.finder', subKey: 'nav.finder_sub', Icon: Compass, color: 'text-domain-idira' },
    ],
  },
  {
    // Learning trail (ConceptLayout follows this order for prev / next).
    key: 'concepts',
    color: 'text-text-2',
    labelKey: 'nav.group_concepts',
    Icon: GraduationCap,
    items: [
      { to: '/concepts/secrets',            labelKey: 'nav.c_secret',   subKey: 'nav.c_secret_sub',   Icon: KeyRound,       color: 'text-text-2' },
      { to: '/concepts/machine-identity',   labelKey: 'nav.c_identity', subKey: 'nav.c_identity_sub', Icon: Fingerprint,    color: 'text-text-2' },
      { to: '/concepts/secret-zero',        labelKey: 'nav.c_secretzero', subKey: 'nav.c_secretzero_sub', Icon: ShieldAlert,    color: 'text-tone-danger' },
      { to: '/concepts/secret-vs-identity', labelKey: 'nav.c_compare',  subKey: 'nav.c_compare_sub',  Icon: ArrowLeftRight, color: 'text-text-2' },
      { to: '/concepts/glossary',           labelKey: 'nav.c_glossary', subKey: 'nav.c_glossary_sub', Icon: BookOpen,       color: 'text-text-2' },
    ],
  },
  {
    key: 'secretsmanager',
    color: 'text-domain-idira',
    labelKey: 'nav.group_sm',
    Icon: Vault,
    descKey: 'demos.group_sm',
    items: [
      { to: '/concepts/saas-architecture',  product: 'secretsmanager', labelKey: 'nav.c_saas', subKey: 'nav.c_saas_sub', Icon: CloudCog, color: 'text-domain-idira', heading: 'nav.h_arch', shortKey: 'nav.c_saas_short' },
      { to: '/concepts/self-hosted-architecture', product: 'secretsmanager', labelKey: 'nav.c_sh', subKey: 'nav.c_sh_sub', Icon: Network, color: 'text-domain-idira', heading: 'nav.h_arch', shortKey: 'nav.c_sh_short' },
      { to: '/authn', product: 'secretsmanager', labelKey: 'nav.a_hub', subKey: 'nav.a_hub_sub', Icon: Fingerprint, color: 'text-domain-idira', section: 'authn' },
      { to: '/jwt', product: 'secretsmanager', labelKey: 'nav.jwt', subKey: 'nav.jwt_sub', Icon: KeyRound, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads', shortKey: 'nav.a_jwt',
        demo: { name: 'authn-jwt', secret: 'identity handshake', descKey: 'demos.jwt' } },
      { to: '/authn/api-key', product: 'secretsmanager', labelKey: 'nav.a_apikey', subKey: 'nav.a_apikey_sub', Icon: KeySquare, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/certificate', product: 'secretsmanager', labelKey: 'nav.a_cert', subKey: 'nav.a_cert_sub', Icon: BadgeCheck, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/aws-iam', product: 'secretsmanager', labelKey: 'nav.a_aws', subKey: 'nav.a_aws_sub', Icon: Cloud, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/azure', product: 'secretsmanager', labelKey: 'nav.a_azure', subKey: 'nav.a_azure_sub', Icon: Cloud, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/gcp', product: 'secretsmanager', labelKey: 'nav.a_gcp', subKey: 'nav.a_gcp_sub', Icon: Cloud, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/kubernetes', product: 'secretsmanager', labelKey: 'nav.a_k8s', subKey: 'nav.a_k8s_sub', Icon: ShipWheel, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/users', product: 'secretsmanager', labelKey: 'nav.a_users', subKey: 'nav.a_users_sub', Icon: Users, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_people' },
      { to: '/policy', product: 'secretsmanager', labelKey: 'nav.policy', subKey: 'nav.policy_sub', Icon: ScrollText, color: 'text-domain-idira', heading: 'nav.h_policy',
        demo: { name: 'Policy as Code', secret: 'YAML + git', descKey: 'demos.policy' } },
      { to: '/sm/dynamic-secrets', product: 'secretsmanager', labelKey: 'nav.sm_dynamic', subKey: 'nav.sm_dynamic_sub', Icon: Timer, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/sm/certificates', product: 'secretsmanager', labelKey: 'nav.sm_certs', subKey: 'nav.sm_certs_sub', Icon: FileKey2, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/sm/rotation', product: 'secretsmanager', labelKey: 'nav.sm_rotation', subKey: 'nav.sm_rotation_sub', Icon: RotateCw, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/sm/audit', product: 'secretsmanager', labelKey: 'nav.sm_audit', subKey: 'nav.sm_audit_sub', Icon: ClipboardList, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/sm/summon', product: 'secretsmanager', labelKey: 'nav.sm_summon', subKey: 'nav.sm_summon_sub', Icon: Terminal, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/ai/mcp-server', product: 'secretsmanager', labelKey: 'nav.ai_mcp', subKey: 'nav.ai_mcp_sub', Icon: Bot, color: 'text-domain-idira', heading: 'nav.h_ai' },
      { to: '/concepts/kubernetes', product: 'secretsmanager', labelKey: 'nav.c_k8s', subKey: 'nav.c_k8s_sub', Icon: Container, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_k8s', shortKey: 'nav.c_k8s_short' },
      { to: '/spring-boot', product: 'secretsmanager', labelKey: 'nav.springboot', subKey: 'nav.springboot_sub', Icon: Leaf, color: 'text-spring', section: 'usecases', heading: 'nav.h_k8s',
        demo: { name: 'SDK', secret: 'direct JWT', descKey: 'demos.spring' } },
      { to: '/dotnet', product: 'secretsmanager', labelKey: 'nav.dotnet', subKey: 'nav.dotnet_sub', Icon: Hexagon, color: 'text-domain-cp', section: 'usecases', heading: 'nav.h_k8s',
        demo: { name: 'Sidecar', secret: 'Secrets Provider', descKey: 'demos.dotnet' } },
      { to: '/eso-shop', product: 'secretsmanager', labelKey: 'nav.esoshop', subKey: 'nav.esoshop_sub', Icon: ShoppingCart, color: 'text-eso', section: 'usecases', heading: 'nav.h_k8s',
        demo: { name: 'External Secrets Operator', secret: 'Kubernetes Secret', descKey: 'demos.eso' } },
      { to: '/csi', product: 'secretsmanager', labelKey: 'nav.csidriver', subKey: 'nav.csidriver_sub', Icon: ShipWheel, color: 'text-csi', section: 'usecases', heading: 'nav.h_k8s',
        demo: { name: 'CSI Driver', secret: 'tmpfs volume', descKey: 'demos.csi' } },
      { to: '/k8s/secrets-provider-modes', product: 'secretsmanager', labelKey: 'nav.k8s_spmodes', subKey: 'nav.k8s_spmodes_sub', Icon: Columns3, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_k8s' },
      { to: '/k8s/reloader', product: 'secretsmanager', labelKey: 'nav.k8s_reloader', subKey: 'nav.k8s_reloader_sub', Icon: RefreshCcw, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_k8s' },
      { to: '/k8s/secretless', product: 'secretsmanager', labelKey: 'nav.k8s_secretless', subKey: 'nav.k8s_secretless_sub', Icon: EyeOff, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_k8s' },
      { to: '/github-actions', product: 'secretsmanager', labelKey: 'nav.gha', subKey: 'nav.gha_sub', Icon: Github, color: 'text-gh', section: 'usecases', heading: 'nav.h_cicd',
        demo: { name: 'GitHub Actions', secret: 'OIDC', descKey: 'demos.gha' } },
      { to: '/jenkins', product: 'secretsmanager', labelKey: 'nav.jenkins', subKey: 'nav.jenkins_sub', Icon: Server, color: 'text-spring', section: 'usecases', heading: 'nav.h_cicd',
        demo: { name: 'Jenkins', secret: 'plugin JWT', descKey: 'demos.jenkins' } },
      { to: '/ansible', product: 'secretsmanager', labelKey: 'nav.ansible', subKey: 'nav.ansible_sub', Icon: Boxes, color: 'text-ansible', section: 'usecases', heading: 'nav.h_cicd',
        demo: { name: 'Ansible', secret: 'lookup', descKey: 'demos.ansible' } },
      { to: '/cicd/terraform', product: 'secretsmanager', labelKey: 'nav.ci_terraform', subKey: 'nav.ci_terraform_sub', Icon: Blocks, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_cicd' },
      { to: '/cicd/gitlab', product: 'secretsmanager', labelKey: 'nav.ci_gitlab', subKey: 'nav.ci_gitlab_sub', Icon: GitBranch, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_cicd' },
      { to: '/cicd/azure-devops', product: 'secretsmanager', labelKey: 'nav.ci_azdo', subKey: 'nav.ci_azdo_sub', Icon: InfinityIcon, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_cicd' },
      { to: '/cicd/bitbucket', product: 'secretsmanager', labelKey: 'nav.ci_bitbucket', subKey: 'nav.ci_bitbucket_sub', Icon: GitPullRequest, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_cicd' },
      { to: '/cicd/circleci', product: 'secretsmanager', labelKey: 'nav.ci_circleci', subKey: 'nav.ci_circleci_sub', Icon: CircleDot, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_cicd' },
      { to: '/cicd/octopus', product: 'secretsmanager', labelKey: 'nav.ci_octopus', subKey: 'nav.ci_octopus_sub', Icon: Rocket, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_cicd' },
      { to: '/platforms/python-aws', product: 'secretsmanager', labelKey: 'nav.pf_python', subKey: 'nav.pf_python_sub', Icon: Code, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_platforms' },
      { to: '/platforms/cloud-foundry', product: 'secretsmanager', labelKey: 'nav.pf_cf', subKey: 'nav.pf_cf_sub', Icon: CloudUpload, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_platforms' },
      { to: '/platforms/puppet', product: 'secretsmanager', labelKey: 'nav.pf_puppet', subKey: 'nav.pf_puppet_sub', Icon: Cog, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_platforms' },
      { to: '/platforms/mulesoft', product: 'secretsmanager', labelKey: 'nav.pf_mulesoft', subKey: 'nav.pf_mulesoft_sub', Icon: Workflow, color: 'text-domain-idira', section: 'usecases', heading: 'nav.h_platforms' },
    ],
  },
  {
    key: 'swa',
    color: 'text-tone-live',
    labelKey: 'nav.group_swa',
    Icon: ShieldCheck,
    descKey: 'demos.group_swa',
    items: [
      { to: '/concepts/swa-architecture', product: 'swa', labelKey: 'nav.c_swa', subKey: 'nav.c_swa_sub', Icon: ShieldCheck, color: 'text-tone-live' },
      { to: '/svid', product: 'swa', href: '/svid', labelKey: 'nav.svid', subKey: 'nav.svid_sub', Icon: FileBadge, color: 'text-tone-live',
        demo: { name: 'SVID Explorer', secret: 'X.509-SVID + JWT-SVID', descKey: 'demos.svid' } },
      { to: '/swa-s3', product: 'swa', href: '/swa-s3', labelKey: 'nav.swa', subKey: 'nav.swa_sub', Icon: Database, color: 'text-tone-live',
        demo: { name: 'SWA → AWS S3', secret: 'SPIFFE/SVID → STS', descKey: 'demos.swa' } },
      { to: '/ai/swa-agents', product: 'swa', labelKey: 'nav.ai_swa', subKey: 'nav.ai_swa_sub', Icon: Bot, color: 'text-tone-live' },
    ],
  },
  {
    key: 'cp',
    color: 'text-domain-cp',
    labelKey: 'nav.group_cp',
    descKey: 'demos.group_cp',
    Icon: AppWindow,
    items: [
      { to: '/cp', product: 'pam', labelKey: 'nav.cp_hub', subKey: 'nav.cp_hub_sub', Icon: LayoutGrid, color: 'text-domain-cp' },
      { to: '/cp/credential-provider', product: 'pam', labelKey: 'nav.cp_cp', subKey: 'nav.cp_cp_sub', Icon: HardDrive, color: 'text-domain-cp' },
      { to: '/cp/ascp', product: 'pam', labelKey: 'nav.cp_ascp', subKey: 'nav.cp_ascp_sub', Icon: Database, color: 'text-domain-cp' },
      { to: '/cp/ccp', product: 'pam', labelKey: 'nav.cp_ccp', subKey: 'nav.cp_ccp_sub', Icon: Globe, color: 'text-domain-cp' },
      { to: '/cp/zos', product: 'pam', labelKey: 'nav.cp_zos', subKey: 'nav.cp_zos_sub', Icon: Cpu, color: 'text-domain-cp' },
      { to: '/dualaccounts', product: 'pam', labelKey: 'nav.dualaccounts', subKey: 'nav.dualaccounts_sub', Icon: RefreshCw, color: 'text-domain-cp',
        demo: { name: 'Dual Accounts', secret: 'zero-downtime rotation', descKey: 'demos.dual' } },
    ],
  },
  {
    key: 'secretshub',
    color: 'text-domain-svc',
    labelKey: 'nav.group_shub',
    descKey: 'demos.group_shub',
    Icon: Combine,
    items: [
      { to: '/secretshub', product: 'secretshub', labelKey: 'nav.shub_saas', subKey: 'nav.shub_saas_sub', Icon: Cloud, color: 'text-domain-svc',
        demo: { name: 'Secrets Hub', secret: 'PAM → cloud sync', descKey: 'demos.secretshub' } },
      { to: '/secretshub?env=pamsh', product: 'secretshub', labelKey: 'nav.shub_pamsh', subKey: 'nav.shub_pamsh_sub', Icon: Server, color: 'text-domain-svc' },
    ],
  },
  {
    key: 'tools',
    color: 'text-text-2',
    labelKey: 'nav.tools',
    Icon: Wrench,
    items: [
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
