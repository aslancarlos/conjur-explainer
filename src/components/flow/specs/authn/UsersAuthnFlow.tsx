import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, BookUser, Cloud, ContactRound, UserRound, Users, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * How PEOPLE authenticate to Secrets Manager (not workloads).
 *   SaaS:        Identity (ISPSS, SSO/MFA) issues an ID token; UI/CLI posts it to
 *                authn-oidc/cyberark/conjur; users and roles sync from Identity.
 *   Self-Hosted: OIDC authorization code + PKCE (UI/CLI), LDAP bind (authn-ldap)
 *                and the default authenticator (user name + password or API key).
 * Sources: secrets-manager-saas ccl-access, cli-login, conjur_api_authenticate_user,
 * ccl-authentication; secrets-manager-sh authentication-new, oidc, oidc-for-ui-and-cli,
 * ldap-sync-authn-integration, configure-ldap-authn.
 */
export default function UsersAuthnFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`authn_users.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending')
    const idle = p('st_idle')
    return {
      id: 'authnusers',
      ariaLabel: p('diagram_label'),
      initial: { mfa: 'none', stok: 'none', sync: 'idle', oidc: 'idle', ldap: 'idle', apikey: 'idle' },
      nodes: [
        { id: 'u1', domain: 'cp', Icon: UserRound, title: p('n_user'), sub: p('n_user1_sub') },
        { id: 'idn', domain: 'idira', Icon: BadgeCheck, title: 'Identity (ISPSS)', sub: 'SSO · MFA', rows: [
          { label: 'MFA', k: 'mfa', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_ok'), tone: 'ok' }] },
        ] },
        { id: 'smsaas', domain: 'idira', Icon: Cloud, title: 'Secrets Manager SaaS', sub: 'authn-oidc/cyberark/conjur', rows: [
          { label: p('r_token'), k: 'stok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: '60 min', tone: 'ok' }] },
          { label: p('r_sync'), k: 'sync', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_synced'), tone: 'ok' }] },
        ] },
        { id: 'u2', domain: 'cp', Icon: Users, title: p('n_user'), sub: p('n_user2_sub') },
        { id: 'idp', domain: 'neutral', Icon: ContactRound, title: p('n_idp'), sub: 'Identity · Okta · Keycloak' },
        { id: 'ldap', domain: 'neutral', Icon: BookUser, title: 'LDAP / AD', sub: p('n_ldap_sub') },
        { id: 'smsh', domain: 'idira', Icon: Vault, title: 'Secrets Manager Self-Hosted', sub: p('n_smsh_sub'), rows: [
          { label: 'authn-oidc', k: 'oidc', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_oidc'), tone: 'ok' }] },
          { label: 'authn-ldap', k: 'ldap', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_bind'), tone: 'ok' }] },
          { label: 'authn', k: 'apikey', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_apikey'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'u1-idn': 'identity', 'u1-sm': 'identity', 'idn-sm': 'control', 'u2-idp': 'identity', 'u2-sm': 'identity', 'sm-idp': 'control', 'sm-ldap': 'control' },
      layouts: {
        wide: {
          w: 980, h: 520,
          boxes: {
            u1: { x: 16, y: 56, w: 216, h: 70 }, idn: { x: 320, y: 50, w: 210, h: 90 }, smsaas: { x: 650, y: 40, w: 314, h: 110 },
            u2: { x: 16, y: 330, w: 216, h: 70 }, idp: { x: 320, y: 262, w: 210, h: 70 }, ldap: { x: 320, y: 404, w: 210, h: 70 },
            smsh: { x: 650, y: 290, w: 314, h: 140 },
          },
          zones: [
            { d: 'cp', x: 6, y: 44, w: 236, h: 94 }, { d: 'idira', x: 310, y: 28, w: 664, h: 132 },
            { d: 'cp', x: 6, y: 318, w: 236, h: 94 }, { d: 'neutral', x: 310, y: 250, w: 230, h: 236 },
            { d: 'idira', x: 640, y: 278, w: 334, h: 164 },
          ],
          lanes: [{ x: 16, y: 20, text: 'Secrets Manager SaaS' }, { x: 16, y: 244, text: 'Secrets Manager Self-Hosted' }],
          edges: {
            'u1-idn': 'M 232,91 L 320,91',
            'idn-sm': 'M 530,95 L 650,95',
            'u1-sm': 'M 111,126 C 111,206 806,206 806,150',
            'u2-idp': 'M 232,350 C 276,350 276,297 320,297',
            'u2-sm': 'M 232,368 L 650,368',
            'sm-idp': 'M 650,310 L 530,310',
            'sm-ldap': 'M 650,420 C 600,420 580,440 530,440',
          },
          labels: [
            { x: 263, y: 74, text: 'SSO · MFA', edge: 'u1-idn' },
            { x: 590, y: 76, text: p('l_rolesync'), edge: 'idn-sm' },
            { x: 460, y: 196, text: 'ID token · HTTPS', edge: 'u1-sm' },
            { x: 263, y: 312, text: 'OIDC · PKCE', edge: 'u2-idp' },
            { x: 590, y: 368, text: 'HTTPS', edge: 'u2-sm' },
            { x: 590, y: 292, text: p('l_code'), edge: 'sm-idp' },
            { x: 592, y: 454, text: 'LDAP bind', edge: 'sm-ldap' },
          ],
        },
        narrow: {
          w: 360, h: 1060, title: 14,
          boxes: {
            u1: { x: 70, y: 30, w: 220, h: 70 }, idn: { x: 70, y: 150, w: 220, h: 90 }, smsaas: { x: 40, y: 290, w: 280, h: 110 },
            u2: { x: 70, y: 470, w: 220, h: 70 }, idp: { x: 70, y: 590, w: 220, h: 70 }, ldap: { x: 70, y: 700, w: 220, h: 70 },
            smsh: { x: 40, y: 840, w: 280, h: 140 },
          },
          lanes: [{ x: 16, y: 20, text: 'SaaS' }, { x: 16, y: 460, text: 'Self-Hosted' }],
          edges: {
            'u1-idn': 'M 180,100 L 180,150',
            'idn-sm': 'M 180,240 L 180,290',
            'u1-sm': 'M 290,65 C 350,65 350,320 320,320',
            'u2-idp': 'M 180,540 L 180,590',
            'u2-sm': 'M 70,505 C 14,505 14,900 40,900',
            'sm-idp': 'M 320,860 C 352,860 352,625 290,625',
            'sm-ldap': 'M 180,840 L 180,770',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['u1', 'u2'], end: 0.6, fx: [] },
        { ...step(2), focus: ['u1', 'idn'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'u1-idn', label: p('p_signin') }, { t: 'set', at: 1.3, k: 'mfa', v: 'ok', pop: true }] },
        { ...step(3), focus: ['u1', 'smsaas'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'u1-sm', label: 'ID token' }, { t: 'set', at: 1.5, k: 'stok', v: 'ok', pop: true }] },
        { ...step(4), focus: ['idn', 'smsaas'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'idn-sm', label: p('p_roles') }, { t: 'set', at: 1.3, k: 'sync', v: 'ok', pop: true }] },
        { ...step(5), focus: ['u2', 'idp', 'smsh'], end: 4.0, fx: [
          { t: 'packet', at: 0.3, edge: 'u2-idp', label: p('p_browser') },
          { t: 'packet', at: 1.5, edge: 'u2-sm', label: 'code · PKCE' },
          { t: 'packet', at: 2.6, edge: 'sm-idp', label: p('l_code') }, { t: 'set', at: 3.6, k: 'oidc', v: 'ok', pop: true }] },
        { ...step(6), focus: ['u2', 'smsh', 'ldap'], end: 3.0, fx: [
          { t: 'packet', at: 0.3, edge: 'u2-sm', label: p('p_ldappw') },
          { t: 'packet', at: 1.4, edge: 'sm-ldap', label: 'bind' }, { t: 'set', at: 2.4, k: 'ldap', v: 'ok', pop: true }] },
        { ...step(7), focus: ['u2', 'smsh'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'u2-sm', label: '/authn/{account}/login' }, { t: 'set', at: 1.4, k: 'apikey', v: 'ok', pop: true }] },
        { ...step(8), focus: ['smsaas', 'smsh'], end: 0.8, fx: [] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
