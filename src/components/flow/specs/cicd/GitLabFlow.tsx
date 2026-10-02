import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Container, GitBranch, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'
import { CI_EDGE_KINDS, ciLayouts } from './ciLayout'

/**
 * GitLab CI with the authn-jwt-gitlab image: the job declares an ID token
 * (aud must match the authenticator), the Go binary posts it to authn-jwt,
 * Secrets Manager checks it against GitLab's JWKS, maps namespace_path to the
 * workload and checks the ref / project_path annotations, then the binary
 * prints each CONJUR_SECRET_ID value to STDOUT for the job to capture.
 */
export default function GitLabFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`ci_gitlab.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'ci-gitlab',
      ariaLabel: p('diagram_label'),
      initial: { idt: 'none', tok: 'none', sec: 'none', out: 'none', sig: 'idle', host: 'idle', ann: 'idle', pol: 'idle', tgt: 'idle' },
      nodes: [
        { id: 'idp', domain: 'svc', Icon: GitBranch, title: 'GitLab', sub: p('n_idp_sub') },
        { id: 'run', domain: 'cp', Icon: Container, title: p('n_run'), sub: 'cyberark/authn-jwt-gitlab', rows: [
          { label: 'ID_TOKEN_1', k: 'idt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'aud: conjur', tone: 'ok' }] },
          { label: 'token', k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: 'STDOUT', k: 'out', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_captured'), tone: 'ok' }] },
          { label: 'secret', k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_env'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-jwt/gitlab', rows: [
          { label: p('r_sig'), k: 'sig', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: 'host', k: 'host', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: 'namespace1', tone: 'ok' }] },
          { label: p('r_annot'), k: 'ann', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
          { label: 'execute', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'tgt', domain: 'svc', Icon: Server, title: p('n_tgt'), sub: p('n_tgt_sub'), rows: [
          { label: 'deploy', k: 'tgt', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_done'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: CI_EDGE_KINDS,
      layouts: ciLayouts({ issue: 'id_tokens', verify: 'JWKS + iss + aud', api: 'POST /authn-jwt/gitlab/conjur/authenticate' }),
      steps: [
        { ...step(1), focus: ['run', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['idp', 'run'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'idp-run', label: 'ID_TOKEN_1' }, { t: 'set', at: 1.4, k: 'idt', v: 'ok', pop: true }] },
        { ...step(3), focus: ['run', 'sm'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'run-sm', label: 'CONJUR_AUTHN_JWT_TOKEN' }, { t: 'set', at: 1.3, k: 'sig', v: 'check' }] },
        { ...step(4), focus: ['sm', 'idp'], end: 2.4, fx: [
          { t: 'packet', at: 0.2, edge: 'sm-idp', label: '/oauth/discovery/keys' }, { t: 'set', at: 1.6, k: 'sig', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm'], end: 2.4, fx: [
          { t: 'set', at: 0.2, k: 'host', v: 'check' }, { t: 'set', at: 0.9, k: 'host', v: 'ok', pop: true },
          { t: 'set', at: 1.2, k: 'ann', v: 'check' }, { t: 'set', at: 1.9, k: 'ann', v: 'ok', pop: true }] },
        { ...step(6), focus: ['sm', 'run'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-run', label: p('p_token') }, { t: 'set', at: 1.3, k: 'tok', v: 'ok', pop: true }] },
        { ...step(7), focus: ['run', 'sm'], end: 4.0, fx: [
          { t: 'packet', at: 0.3, edge: 'run-sm', label: 'CONJUR_SECRET_ID' }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'sm-run', label: p('p_secret'), kind: 'secret' }, { t: 'set', at: 2.6, k: 'out', v: 'ok', pop: true },
          { t: 'set', at: 3.2, k: 'sec', v: 'ok', pop: true }] },
        { ...step(8), focus: ['run', 'tgt'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'run-tgt', label: p('p_use') }, { t: 'set', at: 1.4, k: 'tgt', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
