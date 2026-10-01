import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, FileCode2, KeyRound, Plug, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * /ansible: the cyberark.conjur lookup plugin fetches a secret at run time.
 * Operator runs the playbook -> lookup() -> plugin presents the IdP JWT to
 * authn-jwt/ansible -> Secrets Manager verifies it against the IdP JWKS ->
 * policy (!permit) -> vault -> value bound to an Ansible var -> task runs on
 * the managed nodes with no_log.
 */
export default function AnsibleFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const s = (n: number) => ({ title: t(`ansible.s${n}_title`), desc: t(`ansible.s${n}_desc`) })
    const st = (k: string) => t(`idflow.${k}`)
    const pend = st('st_pending')
    return {
      id: 'ansibleflow',
      ariaLabel: t('ansible.title'),
      initial: { pjwt: 'none', pvar: 'none', pout: 'none', acfg: 'none', aver: 'idle', vperm: 'none', vsec: 'idle', oprun: 'idle' },
      nodes: [
        { id: 'plugin', domain: 'cp', Icon: Plug, title: 'Lookup plugin', sub: 'cyberark.conjur collection', rows: [
          { label: st('r_identity'), k: 'pjwt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'JWT', tone: 'ok' }] },
        ] },
        { id: 'play', domain: 'cp', Icon: FileCode2, title: 'Playbook', sub: 'retrieve-secrets.yaml', rows: [
          { label: 'secret ID', value: 'db-password', tone: 'muted' },
          { label: st('r_secret'), k: 'pvar', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_memory'), tone: 'ok' }] },
          { label: 'no_log', k: 'pout', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: '********', tone: 'ok' }] },
        ] },
        { id: 'jwks', domain: 'neutral', Icon: KeyRound, title: 'IdP · JWKS', sub: '/.well-known/jwks', rows: [
          { label: 'keys', value: 'RSA', tone: 'muted' },
        ] },
        { id: 'op', domain: 'svc', Icon: Server, title: 'Managed nodes', sub: 'operator · ansible-playbook', rows: [
          { label: 'play', k: 'oprun', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'run', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: 'ok=3 failed=0', tone: 'ok' }] },
        ] },
        { id: 'authn', domain: 'idira', Icon: Database, title: 'JWT Authenticator', sub: 'authn-jwt/ansible', rows: [
          { label: 'jwks-uri', k: 'acfg', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_valid'), tone: 'ok' }] },
          { label: 'JWT', k: 'aver', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: st('st_valid'), tone: 'ok' }] },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: 'Secrets Vault', sub: 'data/ansible/*', rows: [
          { label: '!permit', k: 'vperm', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'read/execute', tone: 'ok' }] },
          { label: st('r_secret'), k: 'vsec', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'ok', text: st('st_delivered'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'dev-job': 'access', 'job-plugin': 'access', 'plugin-authn': 'identity', 'a-jw': 'access', 'jw-a': 'identity',
        'authn-vault': 'control', 'vault-plugin': 'secret', 'plugin-job': 'secret',
      },
      layouts: {
        wide: {
          w: 980, h: 470,
          boxes: {
            plugin: { x: 16, y: 50, w: 210, h: 96 }, play: { x: 16, y: 250, w: 210, h: 126 },
            jwks: { x: 390, y: 24, w: 200, h: 96 }, op: { x: 390, y: 350, w: 200, h: 96 },
            authn: { x: 754, y: 50, w: 210, h: 106 }, vault: { x: 754, y: 250, w: 210, h: 106 },
          },
          zones: [
            { d: 'cp', x: 6, y: 36, w: 240, h: 350 }, { d: 'neutral', x: 380, y: 10, w: 220, h: 120 },
            { d: 'svc', x: 380, y: 336, w: 220, h: 120 }, { d: 'idira', x: 744, y: 36, w: 230, h: 330 },
          ],
          edges: {
            'dev-job': 'M 390,398 C 300,398 300,313 226,313',
            'job-plugin': 'M 100,250 L 100,146',
            'plugin-job': 'M 140,146 L 140,250',
            'plugin-authn': 'M 226,130 L 754,130',
            'a-jw': 'M 754,72 C 680,72 660,56 590,56',
            'jw-a': 'M 590,98 C 660,98 680,104 754,104',
            'authn-vault': 'M 859,156 L 859,250',
            'vault-plugin': 'M 754,300 C 560,300 400,180 226,100',
          },
        },
        narrow: {
          w: 360, h: 906, title: 14,
          boxes: {
            op: { x: 70, y: 20, w: 220, h: 96 }, play: { x: 70, y: 160, w: 220, h: 126 },
            plugin: { x: 70, y: 336, w: 220, h: 96 }, jwks: { x: 70, y: 482, w: 220, h: 96 },
            authn: { x: 70, y: 624, w: 220, h: 106 }, vault: { x: 70, y: 780, w: 220, h: 106 },
          },
          zones: [
            { d: 'svc', x: 60, y: 8, w: 240, h: 118 }, { d: 'cp', x: 60, y: 148, w: 240, h: 294 },
            { d: 'neutral', x: 60, y: 470, w: 240, h: 118 }, { d: 'idira', x: 60, y: 612, w: 240, h: 284 },
          ],
          edges: {
            'dev-job': 'M 180,116 L 180,160',
            'job-plugin': 'M 160,286 L 160,336',
            'plugin-job': 'M 200,336 L 200,286',
            'plugin-authn': 'M 290,390 C 345,390 345,670 290,670',
            'a-jw': 'M 160,624 L 160,578',
            'jw-a': 'M 200,578 L 200,624',
            'authn-vault': 'M 180,730 L 180,780',
            'vault-plugin': 'M 70,830 C 15,830 15,384 70,384',
          },
        },
      },
      steps: [
        { ...s(1), focus: ['plugin', 'play', 'jwks', 'op', 'authn', 'vault'], end: 0.6, fx: [] },
        { ...s(2), focus: ['plugin', 'authn', 'vault'], end: 1.6, fx: [
          { t: 'set', at: 0.4, k: 'acfg', v: 'ok', pop: true }, { t: 'set', at: 0.9, k: 'vperm', v: 'ok', pop: true }] },
        { ...s(3), focus: ['op', 'play'], end: 2.2, fx: [
          { t: 'set', at: 0.1, k: 'oprun', v: 'run' }, { t: 'packet', at: 0.3, edge: 'dev-job', label: 'ansible-playbook' }] },
        { ...s(4), focus: ['play', 'plugin'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'job-plugin', label: 'lookup()' }, { t: 'set', at: 1.3, k: 'pjwt', v: 'ok', pop: true }] },
        { ...s(5), focus: ['plugin', 'authn', 'jwks'], end: 4.0, fx: [
          { t: 'packet', at: 0.3, edge: 'plugin-authn', label: 'POST JWT' }, { t: 'set', at: 1.2, k: 'aver', v: 'check' },
          { t: 'packet', at: 1.4, edge: 'a-jw', label: 'GET JWKS' }, { t: 'packet', at: 2.5, edge: 'jw-a', label: 'public keys' },
          { t: 'set', at: 3.5, k: 'aver', v: 'ok', pop: true }] },
        { ...s(6), focus: ['authn', 'vault'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'authn-vault', label: '!permit' }, { t: 'set', at: 1.3, k: 'vsec', v: 'ok', pop: true }] },
        { ...s(7), focus: ['vault', 'plugin', 'play'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'vault-plugin', label: 'secret' }, { t: 'packet', at: 1.5, edge: 'plugin-job', label: 'ansible var' },
          { t: 'set', at: 2.5, k: 'pvar', v: 'ok', pop: true }] },
        { ...s(8), focus: ['play', 'op'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'dev-job', label: 'no_log ****', reverse: true },
          { t: 'set', at: 1.3, k: 'pout', v: 'ok', pop: true }, { t: 'set', at: 1.5, k: 'oprun', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
