import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Server, Vault, Workflow } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'
import { CI_EDGE_KINDS, ciLayouts } from './ciLayout'

/**
 * Azure DevOps with the Idira Conjur Service Connector (JWT, recommended):
 * the task reads secrets.yml from the repo, the Azure Resource Manager service
 * connection gets an Entra ID token for the managed identity or app
 * registration, Secrets Manager validates it (JWKS + iss), maps the sub claim
 * to the workload and checks the appid annotation, then the task fetches every
 * variable in one batch and exposes them as pipeline environment variables.
 */
export default function AzureDevOpsFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`ci_azdo.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'ci-azdo',
      ariaLabel: p('diagram_label'),
      initial: { yml: 'none', jwt: 'none', tok: 'none', env: 'none', sig: 'idle', host: 'idle', ann: 'idle', pol: 'idle', tgt: 'idle' },
      nodes: [
        { id: 'idp', domain: 'svc', Icon: Building2, title: 'Microsoft Entra ID', sub: p('n_idp_sub') },
        { id: 'run', domain: 'cp', Icon: Workflow, title: 'Azure Pipelines', sub: 'Conjur Secret Retrieval Connector', rows: [
          { label: 'secrets.yml', k: 'yml', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_read'), tone: 'ok' }] },
          { label: 'Azure JWT', k: 'jwt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: 'token', k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: 'env vars', k: 'env', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_set'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-jwt/azure-devops', rows: [
          { label: p('r_sig'), k: 'sig', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: 'host = sub', k: 'host', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
          { label: 'appid', k: 'ann', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
          { label: 'execute', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'tgt', domain: 'svc', Icon: Server, title: p('n_tgt'), sub: p('n_tgt_sub'), rows: [
          { label: 'deploy', k: 'tgt', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_done'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: CI_EDGE_KINDS,
      layouts: ciLayouts({ issue: p('l_arm'), verify: 'JWKS + iss', api: 'POST /authn-jwt/azure-devops/conjur/authenticate' }),
      steps: [
        { ...step(1), focus: ['run', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['run'], end: 1.6, fx: [{ t: 'set', at: 0.4, k: 'yml', v: 'ok', pop: true }] },
        { ...step(3), focus: ['idp', 'run'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'idp-run', label: p('p_jwt') }, { t: 'set', at: 1.4, k: 'jwt', v: 'ok', pop: true }] },
        { ...step(4), focus: ['run', 'sm', 'idp'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'run-sm', label: 'jwt=…' }, { t: 'set', at: 1.2, k: 'sig', v: 'check' },
          { t: 'packet', at: 1.4, edge: 'sm-idp', label: 'JWKS' }, { t: 'set', at: 2.6, k: 'sig', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm', 'run'], end: 3.2, fx: [
          { t: 'set', at: 0.2, k: 'host', v: 'check' }, { t: 'set', at: 0.8, k: 'host', v: 'ok', pop: true },
          { t: 'set', at: 1.0, k: 'ann', v: 'check' }, { t: 'set', at: 1.6, k: 'ann', v: 'ok', pop: true },
          { t: 'packet', at: 1.8, edge: 'sm-run', label: p('p_token') }, { t: 'set', at: 2.7, k: 'tok', v: 'ok', pop: true }] },
        { ...step(6), focus: ['run', 'sm'], end: 3.8, fx: [
          { t: 'packet', at: 0.3, edge: 'run-sm', label: p('p_batch') }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'sm-run', label: p('p_secret'), kind: 'secret' }, { t: 'set', at: 2.7, k: 'env', v: 'ok', pop: true }] },
        { ...step(7), focus: ['run', 'tgt'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'run-tgt', label: p('p_use') }, { t: 'set', at: 1.4, k: 'tgt', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
