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
  logo?: string         // colour logo/icon SVG (public/icons/tech|nav, free licences, see THIRD_PARTY_NOTICES.md) shown instead of Icon
}

export type SectionKey = 'authn' | 'usecases'
/** Sidebar submenus inside a group (the flat list still drives trails, search and catalogue). */
export const SECTIONS: Record<SectionKey, { labelKey: string; Icon: LucideIcon; logo?: string }> = {
  authn:    { labelKey: 'nav.sec_authn', Icon: Fingerprint, logo: '/icons/nav/sec_authn.svg' },
  usecases: { labelKey: 'nav.sec_usecases', Icon: Layers, logo: '/icons/nav/g_usecases.svg' },
}

export interface NavGroup {
  key: string
  labelKey?: string
  descKey?: string      // one-line group description (home catalogue)
  Icon?: LucideIcon     // sidebar group header icon (fallback)
  logo?: string         // colour icon SVG for the group header (see THIRD_PARTY_NOTICES.md)
  color?: string        // product colour (header + items; DESIGN.md: one hue per product)
  shortKey?: string     // shorter sidebar label for the group header (full name stays in the tooltip)
  zone?: NavZone        // sidebar section the group sits under (overline label)
  flat?: boolean        // sidebar: render items directly under the zone label (no disclosure)
  items: NavItem[]
}

/** Sidebar sections, in display order, each with an overline label. */
export type NavZone = 'start' | 'products' | 'resources'
export const ZONES: Array<{ key: NavZone; labelKey: string }> = [
  { key: 'start',        labelKey: 'nav.zone_start' },
  { key: 'products',     labelKey: 'nav.zone_products' },
  { key: 'resources',    labelKey: 'nav.zone_resources' },
]

export const NAV: NavGroup[] = [
  {
    key: 'home',
    zone: 'start',
    items: [
      { to: '/', labelKey: 'nav.home', logo: '/icons/nav/home.svg', Icon: Home, color: 'text-domain-idira' },
      { to: '/finder', labelKey: 'nav.finder', subKey: 'nav.finder_sub', logo: '/icons/nav/finder.svg', Icon: Compass, color: 'text-domain-idira' },
    ],
  },
  {
    // Learning trail (ConceptLayout follows this order for prev / next).
    key: 'concepts',
    zone: 'start',
    color: 'text-text-2',
    labelKey: 'nav.group_concepts',
    logo: '/icons/nav/g_concepts.svg',
    Icon: GraduationCap,
    items: [
      { to: '/concepts/secrets',            labelKey: 'nav.c_secret',   subKey: 'nav.c_secret_sub',   logo: '/icons/nav/c_secret.svg', Icon: KeyRound,       color: 'text-text-2' },
      { to: '/concepts/machine-identity',   labelKey: 'nav.c_identity', shortKey: 'nav.c_identity_side', subKey: 'nav.c_identity_sub', logo: '/icons/nav/c_identity.svg', Icon: Fingerprint,    color: 'text-text-2' },
      { to: '/concepts/secret-zero',        labelKey: 'nav.c_secretzero', subKey: 'nav.c_secretzero_sub', logo: '/icons/nav/c_secretzero.svg', Icon: ShieldAlert,    color: 'text-tone-danger' },
      { to: '/concepts/secret-vs-identity', labelKey: 'nav.c_compare',  subKey: 'nav.c_compare_sub',  logo: '/icons/nav/c_compare.svg', Icon: ArrowLeftRight, color: 'text-text-2' },
      { to: '/concepts/glossary',           labelKey: 'nav.c_glossary', subKey: 'nav.c_glossary_sub', logo: '/icons/nav/c_glossary.svg', Icon: BookOpen,       color: 'text-text-2' },
    ],
  },
  {
    key: 'secretsmanager',
    zone: 'products',
    color: 'text-domain-idira',
    labelKey: 'nav.group_sm',
    logo: '/icons/nav/g_sm.svg',
    Icon: Vault,
    descKey: 'demos.group_sm',
    items: [
      { to: '/concepts/saas-architecture',  product: 'secretsmanager', labelKey: 'nav.c_saas', subKey: 'nav.c_saas_sub', logo: '/icons/nav/c_saas.svg', Icon: CloudCog, color: 'text-domain-idira', heading: 'nav.h_arch', shortKey: 'nav.c_saas_short' },
      { to: '/concepts/self-hosted-architecture', product: 'secretsmanager', labelKey: 'nav.c_sh', subKey: 'nav.c_sh_sub', logo: '/icons/nav/c_sh.svg', Icon: Network, color: 'text-domain-idira', heading: 'nav.h_arch', shortKey: 'nav.c_sh_short' },
      { to: '/authn', product: 'secretsmanager', labelKey: 'nav.a_hub', shortKey: 'nav.a_hub_side', subKey: 'nav.a_hub_sub', logo: '/icons/nav/authn_hub.svg', Icon: Fingerprint, color: 'text-domain-idira', section: 'authn' },
      { to: '/jwt', product: 'secretsmanager', labelKey: 'nav.jwt', subKey: 'nav.jwt_sub', logo: '/icons/nav/jwt.svg', Icon: KeyRound, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads', shortKey: 'nav.a_jwt',
        demo: { name: 'authn-jwt', secret: 'identity handshake', descKey: 'demos.jwt' } },
      { to: '/authn/api-key', product: 'secretsmanager', labelKey: 'nav.a_apikey', subKey: 'nav.a_apikey_sub', logo: '/icons/nav/apikey.svg', Icon: KeySquare, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/certificate', product: 'secretsmanager', labelKey: 'nav.a_cert', subKey: 'nav.a_cert_sub', logo: '/icons/nav/cert.svg', Icon: BadgeCheck, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/aws-iam', product: 'secretsmanager', labelKey: 'nav.a_aws', subKey: 'nav.a_aws_sub', logo: '/icons/tech/aws.svg', Icon: Cloud, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/azure', product: 'secretsmanager', labelKey: 'nav.a_azure', subKey: 'nav.a_azure_sub', logo: '/icons/tech/azure.svg', Icon: Cloud, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/gcp', product: 'secretsmanager', labelKey: 'nav.a_gcp', subKey: 'nav.a_gcp_sub', logo: '/icons/tech/gcp.svg', Icon: Cloud, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/kubernetes', product: 'secretsmanager', labelKey: 'nav.a_k8s', shortKey: 'nav.a_k8s_side', subKey: 'nav.a_k8s_sub', logo: '/icons/tech/k8s.svg', Icon: ShipWheel, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_workloads' },
      { to: '/authn/users', product: 'secretsmanager', labelKey: 'nav.a_users', subKey: 'nav.a_users_sub', logo: '/icons/nav/users.svg', Icon: Users, color: 'text-domain-idira', section: 'authn', heading: 'nav.h_people' },
      { to: '/policy', product: 'secretsmanager', labelKey: 'nav.policy', subKey: 'nav.policy_sub', logo: '/icons/nav/policy.svg', Icon: ScrollText, color: 'text-domain-idira', heading: 'nav.h_policy',
        demo: { name: 'Policy as Code', secret: 'YAML + git', descKey: 'demos.policy' } },
      { to: '/sm/dynamic-secrets', product: 'secretsmanager', labelKey: 'nav.sm_dynamic', subKey: 'nav.sm_dynamic_sub', logo: '/icons/nav/dynamic.svg', Icon: Timer, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/sm/certificates', product: 'secretsmanager', labelKey: 'nav.sm_certs', subKey: 'nav.sm_certs_sub', logo: '/icons/nav/sm_certs.svg', Icon: FileKey2, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/sm/rotation', product: 'secretsmanager', labelKey: 'nav.sm_rotation', subKey: 'nav.sm_rotation_sub', logo: '/icons/nav/rotation.svg', Icon: RotateCw, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/sm/audit', product: 'secretsmanager', labelKey: 'nav.sm_audit', subKey: 'nav.sm_audit_sub', logo: '/icons/nav/audit.svg', Icon: ClipboardList, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/sm/summon', product: 'secretsmanager', labelKey: 'nav.sm_summon', subKey: 'nav.sm_summon_sub', logo: '/icons/nav/summon.svg', Icon: Terminal, color: 'text-domain-idira', heading: 'nav.h_capabilities' },
      { to: '/ai/mcp-server', product: 'secretsmanager', labelKey: 'nav.ai_mcp', subKey: 'nav.ai_mcp_sub', logo: '/icons/tech/ai_mcp.svg', Icon: Bot, color: 'text-domain-idira', heading: 'nav.h_ai' },
      // Use cases: how workloads consume Secrets Manager (submenu, by platform).
      { to: '/concepts/kubernetes', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.c_k8s', subKey: 'nav.c_k8s_sub', logo: '/icons/tech/k8s.svg', Icon: Container, color: 'text-domain-idira', heading: 'nav.h_k8s', shortKey: 'nav.c_k8s_short' },
      { to: '/spring-boot', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.springboot', subKey: 'nav.springboot_sub', logo: '/icons/tech/app_java.svg', Icon: Leaf, color: 'text-spring', heading: 'nav.h_k8s',
        demo: { name: 'SDK', secret: 'direct JWT', descKey: 'demos.spring' } },
      { to: '/dotnet', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.dotnet', subKey: 'nav.dotnet_sub', logo: '/icons/tech/app_dotnet.svg', Icon: Hexagon, color: 'text-domain-cp', heading: 'nav.h_k8s',
        demo: { name: 'Sidecar', secret: 'Secrets Provider', descKey: 'demos.dotnet' } },
      { to: '/eso-shop', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.esoshop', subKey: 'nav.esoshop_sub', logo: '/icons/nav/eso.svg', Icon: ShoppingCart, color: 'text-eso', heading: 'nav.h_k8s',
        demo: { name: 'External Secrets Operator', secret: 'Kubernetes Secret', descKey: 'demos.eso' } },
      { to: '/csi', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.csidriver', subKey: 'nav.csidriver_sub', logo: '/icons/nav/csi.svg', Icon: ShipWheel, color: 'text-csi', heading: 'nav.h_k8s',
        demo: { name: 'CSI Driver', secret: 'tmpfs volume', descKey: 'demos.csi' } },
      { to: '/k8s/secrets-provider-modes', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.k8s_spmodes', shortKey: 'nav.k8s_spmodes_side', subKey: 'nav.k8s_spmodes_sub', logo: '/icons/nav/spmodes.svg', Icon: Columns3, color: 'text-domain-idira', heading: 'nav.h_k8s' },
      { to: '/k8s/reloader', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.k8s_reloader', subKey: 'nav.k8s_reloader_sub', logo: '/icons/nav/reloader.svg', Icon: RefreshCcw, color: 'text-domain-idira', heading: 'nav.h_k8s' },
      { to: '/k8s/secretless', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.k8s_secretless', subKey: 'nav.k8s_secretless_sub', logo: '/icons/nav/secretless.svg', Icon: EyeOff, color: 'text-domain-idira', heading: 'nav.h_k8s' },
      { to: '/github-actions', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.gha', subKey: 'nav.gha_sub', logo: '/icons/tech/ci_gha.svg', Icon: Github, color: 'text-gh', heading: 'nav.h_cicd',
        demo: { name: 'GitHub Actions', secret: 'OIDC', descKey: 'demos.gha' } },
      { to: '/jenkins', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.jenkins', subKey: 'nav.jenkins_sub', logo: '/icons/tech/ci_jenkins.svg', Icon: Server, color: 'text-spring', heading: 'nav.h_cicd',
        demo: { name: 'Jenkins', secret: 'plugin JWT', descKey: 'demos.jenkins' } },
      { to: '/ansible', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.ansible', subKey: 'nav.ansible_sub', logo: '/icons/tech/ci_ansible.svg', Icon: Boxes, color: 'text-ansible', heading: 'nav.h_cicd',
        demo: { name: 'Ansible', secret: 'lookup', descKey: 'demos.ansible' } },
      { to: '/cicd/terraform', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.ci_terraform', subKey: 'nav.ci_terraform_sub', logo: '/icons/tech/ci_terraform.svg', Icon: Blocks, color: 'text-domain-idira', heading: 'nav.h_cicd' },
      { to: '/cicd/gitlab', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.ci_gitlab', subKey: 'nav.ci_gitlab_sub', logo: '/icons/tech/ci_gitlab.svg', Icon: GitBranch, color: 'text-domain-idira', heading: 'nav.h_cicd' },
      { to: '/cicd/azure-devops', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.ci_azdo', subKey: 'nav.ci_azdo_sub', logo: '/icons/tech/azdo.svg', Icon: InfinityIcon, color: 'text-domain-idira', heading: 'nav.h_cicd' },
      { to: '/cicd/bitbucket', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.ci_bitbucket', subKey: 'nav.ci_bitbucket_sub', logo: '/icons/tech/ci_bitbucket.svg', Icon: GitPullRequest, color: 'text-domain-idira', heading: 'nav.h_cicd' },
      { to: '/cicd/circleci', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.ci_circleci', subKey: 'nav.ci_circleci_sub', logo: '/icons/tech/ci_circleci.svg', Icon: CircleDot, color: 'text-domain-idira', heading: 'nav.h_cicd' },
      { to: '/cicd/octopus', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.ci_octopus', subKey: 'nav.ci_octopus_sub', logo: '/icons/tech/ci_octopus.svg', Icon: Rocket, color: 'text-domain-idira', heading: 'nav.h_cicd' },
      { to: '/platforms/python-aws', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.pf_python', subKey: 'nav.pf_python_sub', logo: '/icons/tech/app_python.svg', Icon: Code, color: 'text-domain-idira', heading: 'nav.h_platforms' },
      { to: '/platforms/cloud-foundry', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.pf_cf', subKey: 'nav.pf_cf_sub', logo: '/icons/tech/op_cf.svg', Icon: CloudUpload, color: 'text-domain-idira', heading: 'nav.h_platforms' },
      { to: '/platforms/puppet', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.pf_puppet', subKey: 'nav.pf_puppet_sub', logo: '/icons/tech/ci_puppet.svg', Icon: Cog, color: 'text-domain-idira', heading: 'nav.h_platforms' },
      { to: '/platforms/mulesoft', section: 'usecases', product: 'secretsmanager', labelKey: 'nav.pf_mulesoft', subKey: 'nav.pf_mulesoft_sub', logo: '/icons/tech/app_mulesoft.svg', Icon: Workflow, color: 'text-domain-idira', heading: 'nav.h_platforms' },
    ],
  },
  {
    key: 'swa',
    zone: 'products',
    color: 'text-tone-live',
    labelKey: 'nav.group_swa',
    logo: '/icons/nav/g_swa.svg',
    Icon: ShieldCheck,
    descKey: 'demos.group_swa',
    items: [
      { to: '/concepts/swa-architecture', product: 'swa', labelKey: 'nav.c_swa', subKey: 'nav.c_swa_sub', logo: '/icons/nav/swa_arch.svg', Icon: ShieldCheck, color: 'text-tone-live' },
      { to: '/svid', product: 'swa', href: '/svid', labelKey: 'nav.svid', subKey: 'nav.svid_sub', logo: '/icons/nav/svid.svg', Icon: FileBadge, color: 'text-tone-live',
        demo: { name: 'SVID Explorer', secret: 'X.509-SVID + JWT-SVID', descKey: 'demos.svid' } },
      { to: '/swa-s3', product: 'swa', href: '/swa-s3', labelKey: 'nav.swa', subKey: 'nav.swa_sub', logo: '/icons/nav/swa_s3.svg', Icon: Database, color: 'text-tone-live',
        demo: { name: 'SWA → AWS S3', secret: 'SPIFFE/SVID → STS', descKey: 'demos.swa' } },
      { to: '/ai/swa-agents', product: 'swa', labelKey: 'nav.ai_swa', shortKey: 'nav.ai_swa_side', subKey: 'nav.ai_swa_sub', logo: '/icons/tech/ai_agents.svg', Icon: Bot, color: 'text-tone-live' },
    ],
  },
  {
    key: 'cp',
    zone: 'products',
    color: 'text-domain-cp',
    labelKey: 'nav.group_cp',
    descKey: 'demos.group_cp',
    logo: '/icons/nav/g_cp.svg',
    Icon: AppWindow,
    items: [
      { to: '/cp', product: 'pam', labelKey: 'nav.cp_hub', shortKey: 'nav.cp_hub_side', subKey: 'nav.cp_hub_sub', logo: '/icons/nav/cp_hub.svg', Icon: LayoutGrid, color: 'text-domain-cp' },
      { to: '/cp/credential-provider', product: 'pam', labelKey: 'nav.cp_cp', subKey: 'nav.cp_cp_sub', logo: '/icons/nav/cp_cp.svg', Icon: HardDrive, color: 'text-domain-cp' },
      { to: '/cp/ascp', product: 'pam', labelKey: 'nav.cp_ascp', subKey: 'nav.cp_ascp_sub', logo: '/icons/tech/op_appservers.svg', Icon: Database, color: 'text-domain-cp' },
      { to: '/cp/ccp', product: 'pam', labelKey: 'nav.cp_ccp', subKey: 'nav.cp_ccp_sub', logo: '/icons/nav/ccp.svg', Icon: Globe, color: 'text-domain-cp' },
      { to: '/cp/zos', product: 'pam', labelKey: 'nav.cp_zos', subKey: 'nav.cp_zos_sub', logo: '/icons/tech/mf_zos.svg', Icon: Cpu, color: 'text-domain-cp' },
      { to: '/dualaccounts', product: 'pam', labelKey: 'nav.dualaccounts', subKey: 'nav.dualaccounts_sub', logo: '/icons/nav/dual.svg', Icon: RefreshCw, color: 'text-domain-cp',
        demo: { name: 'Dual Accounts', secret: 'zero-downtime rotation', descKey: 'demos.dual' } },
    ],
  },
  {
    key: 'secretshub',
    zone: 'products',
    color: 'text-domain-svc',
    labelKey: 'nav.group_shub',
    descKey: 'demos.group_shub',
    logo: '/icons/nav/g_shub.svg',
    Icon: Combine,
    items: [
      { to: '/secretshub', product: 'secretshub', labelKey: 'nav.shub_saas', subKey: 'nav.shub_saas_sub', logo: '/icons/nav/shub_saas.svg', Icon: Cloud, color: 'text-domain-svc',
        demo: { name: 'Secrets Hub', secret: 'PAM → cloud sync', descKey: 'demos.secretshub' } },
      { to: '/secretshub?env=pamsh', product: 'secretshub', labelKey: 'nav.shub_pamsh', subKey: 'nav.shub_pamsh_sub', logo: '/icons/tech/onprem.svg', Icon: Server, color: 'text-domain-svc' },
    ],
  },
  {
    key: 'tools',
    zone: 'resources',
    flat: true,
    color: 'text-text-2',
    labelKey: 'nav.tools',
    logo: '/icons/nav/g_tools.svg',
    Icon: Wrench,
    items: [
      { to: '/compare',       labelKey: 'nav.compare',      subKey: 'nav.compare_sub',      logo: '/icons/nav/compare.svg', Icon: GitCompareArrows, color: 'text-text-2' },
      { to: '/tools',         labelKey: 'nav.livetools',    subKey: 'nav.livetools_sub',    logo: '/icons/nav/livetools.svg', Icon: Wrench,           color: 'text-text-2' },
      { to: '/controller', href: '/controller', labelKey: 'nav.controller', subKey: 'nav.controller_sub', logo: '/icons/nav/controller.svg', Icon: LayoutDashboard, color: 'text-text-2' },
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
