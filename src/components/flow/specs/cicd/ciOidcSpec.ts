import type { TFunction } from 'i18next'
import type { LucideIcon } from 'lucide-react'
import { UserCheck, Vault } from 'lucide-react'
import type { FlowSpec } from '../../FlowPlayer'

/**
 * Shared shape of the CI/CD integrations that trade the platform's native
 * OIDC token for secrets through the JWT authenticator (Bitbucket pipe,
 * CircleCI orb, Octopus step template):
 *
 *   OIDC issuer -> job (JWT) -> Secrets Manager authn-jwt -> JWKS check
 *   -> claim mapped to a workload in identity-path -> access token
 *   -> secrets -> handed to the next step (file / env / output variables).
 *
 * All copy lives in `${ns}.flow.*`; only product literals (authenticator
 * path, claim, endpoint pills) come from the config.
 */
export interface CiOidcConfig {
  id: string
  ns: string
  IdpIcon: LucideIcon
  JobIcon: LucideIcon
  OutIcon: LucideIcon
  TargetIcon: LucideIcon
  smSub: string          // e.g. authn-jwt/bitbucket
  hostSub: string        // e.g. data/bitbucket-pipes/{repositoryUuid}
  claim: string          // token-app-property, shown on the host row
  labels: { idp: string; jwks: string; authn: string }
}

export function buildCiOidcSpec(t: TFunction, c: CiOidcConfig): FlowSpec {
  const p = (k: string) => t(`${c.ns}.flow.${k}`)
  const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
  const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
  return {
    id: c.id,
    ariaLabel: p('diagram_label'),
    initial: { jwt: 'none', tok: 'none', sec: 'none', sig: 'idle', issued: 'idle', annot: 'idle', grp: 'idle', out: 'none', tgt: 'idle', idp: 'idle' },
    nodes: [
      { id: 'idp', domain: 'svc', Icon: c.IdpIcon, title: p('n_idp'), sub: p('n_idp_sub'), rows: [
        { label: 'id_token', k: 'idp', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_signed'), tone: 'ok' }] },
      ] },
      { id: 'job', domain: 'cp', Icon: c.JobIcon, title: p('n_job'), sub: p('n_job_sub'), rows: [
        { label: 'JWT', k: 'jwt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
        { label: p('r_token'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
        { label: p('r_secrets'), k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_fetched'), tone: 'ok' }] },
      ] },
      { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: c.smSub, rows: [
        { label: p('r_sig'), k: 'sig', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
        { label: p('r_issued'), k: 'issued', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_issued'), tone: 'ok' }] },
      ] },
      { id: 'host', domain: 'idira', Icon: UserCheck, title: p('n_host'), sub: c.hostSub, rows: [
        { label: c.claim, k: 'annot', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
        { label: p('r_group'), k: 'grp', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
      ] },
      { id: 'out', domain: 'cp', Icon: c.OutIcon, title: p('n_out'), sub: p('n_out_sub'), rows: [
        { label: p('r_out'), k: 'out', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_out'), tone: 'ok' }, { v: 'done', text: p('st_done'), tone: 'ok' }] },
      ] },
      { id: 'tgt', domain: 'svc', Icon: c.TargetIcon, title: p('n_target'), sub: p('n_target_sub'), rows: [
        { label: p('r_target'), k: 'tgt', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_target'), tone: 'ok' }] },
      ] },
    ],
    edgeKinds: {
      'idp-job': 'identity', 'job-sm': 'identity', 'sm-job': 'identity', 'sm-idp': 'identity',
      'sm-host': 'control', 'job-out': 'secret', 'out-tgt': 'access',
    },
    layouts: {
      wide: {
        w: 980, h: 500,
        boxes: {
          idp: { x: 40, y: 20, w: 250, h: 100 }, job: { x: 40, y: 180, w: 250, h: 136 },
          sm: { x: 400, y: 180, w: 270, h: 116 }, host: { x: 728, y: 180, w: 232, h: 116 },
          out: { x: 40, y: 380, w: 250, h: 100 }, tgt: { x: 728, y: 380, w: 232, h: 100 },
        },
        zones: [
          { d: 'svc', x: 28, y: 10, w: 274, h: 120 }, { d: 'cp', x: 28, y: 168, w: 274, h: 324 },
          { d: 'idira', x: 388, y: 168, w: 584, h: 140 }, { d: 'svc', x: 716, y: 368, w: 256, h: 124 },
        ],
        edges: {
          'idp-job': 'M 165,120 L 165,180', 'job-sm': 'M 290,222 L 400,222', 'sm-job': 'M 400,280 L 290,280',
          'sm-idp': 'M 535,180 C 535,70 400,70 290,70', 'sm-host': 'M 670,238 L 728,238',
          'job-out': 'M 165,316 L 165,380', 'out-tgt': 'M 290,430 L 728,430',
        },
        labels: [
          { x: 165, y: 150, text: c.labels.idp },
          { x: 450, y: 48, text: c.labels.jwks },
          { x: 535, y: 336, text: c.labels.authn },
        ],
      },
      narrow: {
        w: 360, h: 1080, title: 14,
        boxes: {
          idp: { x: 50, y: 30, w: 260, h: 100 }, job: { x: 50, y: 190, w: 260, h: 136 },
          sm: { x: 50, y: 400, w: 260, h: 116 }, host: { x: 50, y: 580, w: 260, h: 116 },
          out: { x: 50, y: 770, w: 260, h: 100 }, tgt: { x: 50, y: 940, w: 260, h: 100 },
        },
        edges: {
          'idp-job': 'M 180,130 L 180,190', 'job-sm': 'M 160,326 L 160,400', 'sm-job': 'M 200,400 L 200,326',
          'sm-idp': 'M 310,440 C 352,440 352,80 310,80', 'sm-host': 'M 180,516 L 180,580',
          'job-out': 'M 50,300 C 12,300 12,820 50,820', 'out-tgt': 'M 180,870 L 180,940',
        },
      },
    },
    steps: [
      { ...step(1), focus: ['job', 'sm'], end: 0.6, fx: [] },
      { ...step(2), focus: ['idp', 'job'], end: 2.2, fx: [
        { t: 'set', at: 0.2, k: 'idp', v: 'ok', pop: true },
        { t: 'packet', at: 0.4, edge: 'idp-job', label: 'JWT' }, { t: 'set', at: 1.4, k: 'jwt', v: 'ok', pop: true }] },
      { ...step(3), focus: ['job', 'sm'], end: 2.0, fx: [
        { t: 'packet', at: 0.3, edge: 'job-sm', label: p('p_authn') }, { t: 'set', at: 1.3, k: 'sig', v: 'check' }] },
      { ...step(4), focus: ['sm', 'idp'], end: 2.8, fx: [
        { t: 'packet', at: 0.3, edge: 'sm-idp', label: 'GET JWKS' },
        { t: 'packet', at: 1.2, edge: 'sm-idp', label: p('p_keys'), reverse: true }, { t: 'set', at: 2.2, k: 'sig', v: 'ok', pop: true }] },
      { ...step(5), focus: ['sm', 'host'], end: 2.6, fx: [
        { t: 'set', at: 0.2, k: 'annot', v: 'check' },
        { t: 'packet', at: 0.3, edge: 'sm-host', label: c.claim }, { t: 'set', at: 1.3, k: 'annot', v: 'ok', pop: true },
        { t: 'set', at: 1.9, k: 'grp', v: 'ok', pop: true }] },
      { ...step(6), focus: ['sm', 'job'], end: 2.2, fx: [
        { t: 'set', at: 0.2, k: 'issued', v: 'ok', pop: true },
        { t: 'packet', at: 0.4, edge: 'sm-job', label: p('p_token') }, { t: 'set', at: 1.4, k: 'tok', v: 'ok', pop: true }] },
      { ...step(7), focus: ['job', 'sm'], end: 2.8, fx: [
        { t: 'packet', at: 0.3, edge: 'job-sm', label: p('p_get') },
        { t: 'packet', at: 1.2, edge: 'sm-job', label: p('p_secrets'), kind: 'secret' }, { t: 'set', at: 2.2, k: 'sec', v: 'ok', pop: true }] },
      { ...step(8), focus: ['job', 'out'], end: 2.0, fx: [
        { t: 'packet', at: 0.3, edge: 'job-out', label: p('p_out'), kind: 'secret' }, { t: 'set', at: 1.3, k: 'out', v: 'ok', pop: true }] },
      { ...step(9), focus: ['out', 'tgt'], end: 2.6, fx: [
        { t: 'packet', at: 0.3, edge: 'out-tgt', label: p('p_use') }, { t: 'set', at: 1.4, k: 'tgt', v: 'ok', pop: true },
        { t: 'set', at: 2.0, k: 'out', v: 'done', pop: true }] },
    ],
  }
}
