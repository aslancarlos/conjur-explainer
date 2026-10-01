import {
  Home, RefreshCw, KeyRound, ScrollText, Combine, Server, Boxes, ShipWheel,
  Leaf, Hexagon, Github, ShoppingCart, Database,
  Workflow, GitCompareArrows, Wrench, BadgeCheck, LayoutDashboard,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Single source of truth for site navigation (sidebar, mobile drawer).
 * `href` marks sibling services outside the SPA — rendered as <a>, not <Link>.
 * `color` is the page's workload accent (DESIGN.md §3.4), used on the icon only.
 */
export interface NavItem {
  to: string
  href?: string
  labelKey: string
  subKey?: string
  Icon: LucideIcon
  color?: string
}

export interface NavGroup {
  key: string
  labelKey?: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    key: 'home',
    items: [{ to: '/', labelKey: 'nav.home', Icon: Home, color: 'text-domain-idira' }],
  },
  {
    key: 'integrations',
    labelKey: 'nav.integrations',
    items: [
      { to: '/dualaccounts', labelKey: 'nav.dualaccounts', subKey: 'nav.dualaccounts_sub', Icon: RefreshCw, color: 'text-domain-idira' },
      { to: '/jwt',          labelKey: 'nav.jwt',          subKey: 'nav.jwt_sub',          Icon: KeyRound,  color: 'text-domain-idira' },
      { to: '/policy',       labelKey: 'nav.policy',       subKey: 'nav.policy_sub',       Icon: ScrollText, color: 'text-domain-idira' },
      { to: '/secretshub',   labelKey: 'nav.secretshub',   subKey: 'nav.secretshub_sub',   Icon: Combine,   color: 'text-domain-cp' },
      { to: '/jenkins',      labelKey: 'nav.jenkins',      subKey: 'nav.jenkins_sub',      Icon: Server,    color: 'text-spring' },
      { to: '/ansible',      labelKey: 'nav.ansible',      subKey: 'nav.ansible_sub',      Icon: Boxes,     color: 'text-ansible' },
      { to: '/csi',          labelKey: 'nav.csidriver',    subKey: 'nav.csidriver_sub',    Icon: ShipWheel, color: 'text-csi' },
    ],
  },
  {
    key: 'examples',
    labelKey: 'nav.examples',
    items: [
      { to: '/spring-boot',    labelKey: 'nav.springboot', subKey: 'nav.springboot_sub', Icon: Leaf,         color: 'text-spring' },
      { to: '/dotnet',         labelKey: 'nav.dotnet',     subKey: 'nav.dotnet_sub',     Icon: Hexagon,      color: 'text-domain-cp' },
      { to: '/github-actions', labelKey: 'nav.gha',        subKey: 'nav.gha_sub',        Icon: Github,       color: 'text-gh' },
      { to: '/eso-shop',       labelKey: 'nav.esoshop',    subKey: 'nav.esoshop_sub',    Icon: ShoppingCart, color: 'text-eso' },
      { to: '/swa-s3', href: '/swa-s3', labelKey: 'nav.swa', subKey: 'nav.swa_sub',      Icon: Database,     color: 'text-eso' },
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
