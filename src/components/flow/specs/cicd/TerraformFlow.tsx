import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Blocks, Cloud, KeyRound, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'
import { CI_EDGE_KINDS, ciLayouts } from './ciLayout'

/**
 * Terraform with the Secrets Manager provider (terraform-provider-conjur) in a
 * pipeline: the CI platform hands the job a JWT, the provider authenticates
 * with authn-jwt, reads the secret with an ephemeral "conjur_secret" (execute
 * privilege), the value is marked sensitive and stays out of the state file.
 */
export default function TerraformFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`ci_terraform.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'ci-terraform',
      ariaLabel: p('diagram_label'),
      initial: { prov: 'none', jwt: 'none', sec: 'none', state: 'none', sig: 'idle', host: 'idle', tok: 'idle', pol: 'idle', tgt: 'idle' },
      nodes: [
        { id: 'idp', domain: 'svc', Icon: KeyRound, title: p('n_idp'), sub: p('n_idp_sub') },
        { id: 'run', domain: 'cp', Icon: Blocks, title: p('n_run'), sub: 'cyberark/conjur provider', rows: [
          { label: 'provider', k: 'prov', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_loaded'), tone: 'ok' }] },
          { label: 'JWT', k: 'jwt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: 'secret', k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_sensitive'), tone: 'ok' }] },
          { label: 'state', k: 'state', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_nostate'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-jwt/{service-id}', rows: [
          { label: p('r_sig'), k: 'sig', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: 'host', k: 'host', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
          { label: 'token', k: 'tok', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_issued'), tone: 'ok' }] },
          { label: 'execute', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'tgt', domain: 'svc', Icon: Cloud, title: p('n_tgt'), sub: p('n_tgt_sub'), rows: [
          { label: 'apply', k: 'tgt', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_applied'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: CI_EDGE_KINDS,
      layouts: ciLayouts({ issue: 'JWT', verify: 'JWKS + iss', api: 'POST /authn-jwt/{service-id}/conjur/authenticate' }),
      steps: [
        { ...step(1), focus: ['run', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['run'], end: 1.6, fx: [{ t: 'set', at: 0.4, k: 'prov', v: 'ok', pop: true }] },
        { ...step(3), focus: ['idp', 'run'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'idp-run', label: p('p_jwt') }, { t: 'set', at: 1.4, k: 'jwt', v: 'ok', pop: true }] },
        { ...step(4), focus: ['run', 'sm', 'idp'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'run-sm', label: 'authn_jwt_token' }, { t: 'set', at: 1.2, k: 'sig', v: 'check' },
          { t: 'packet', at: 1.4, edge: 'sm-idp', label: 'JWKS' }, { t: 'set', at: 2.6, k: 'sig', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm', 'run'], end: 3.0, fx: [
          { t: 'set', at: 0.2, k: 'host', v: 'check' }, { t: 'set', at: 1.0, k: 'host', v: 'ok', pop: true },
          { t: 'packet', at: 1.3, edge: 'sm-run', label: p('p_token') }, { t: 'set', at: 2.2, k: 'tok', v: 'ok', pop: true }] },
        { ...step(6), focus: ['run', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'run-sm', label: p('p_get') }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'sm-run', label: p('p_secret'), kind: 'secret' }, { t: 'set', at: 2.6, k: 'sec', v: 'ok', pop: true }] },
        { ...step(7), focus: ['run', 'tgt'], end: 3.0, fx: [
          { t: 'packet', at: 0.3, edge: 'run-tgt', label: 'terraform apply' }, { t: 'set', at: 1.4, k: 'tgt', v: 'ok', pop: true },
          { t: 'set', at: 2.0, k: 'state', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
