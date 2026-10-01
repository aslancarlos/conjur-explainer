import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Cloud, Combine, HardDrive, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec, type FlowRow } from '../components/flow/FlowPlayer'

/**
 * Secrets Hub sync (FlowPlayer spec).
 *   CPM rotates the credential in the PAM Safe -> Secrets Hub (Safe member,
 *   PAM_SAFE sync policy) reads it -> pushes it to AWS SM, Azure KV and GCP SM
 *   through each store's own trust (IAM Role, App Registration, Service Account)
 *   -> workloads read it with the native SDK.
 */
export default function SecretsHubPage() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const f = (k: string) => t(`idflow.${k}`)
    const pend = f('st_pending')
    const step = (n: number) => ({ title: t(`secretshub.s${n}_title`), desc: t(`secretshub.s${n}_desc`) })
    const ver = (k: string): FlowRow => ({ label: f('r_secret'), k, states: [
      { v: 'none', text: pend, tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] })
    const trust = (k: string): FlowRow => ({ label: f('r_identity'), k, states: [
      { v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: f('st_valid'), tone: 'ok' }] })
    const push = (at: number, label: string) => ([
      { t: 'packet' as const, at, edge: 'hub-aws', label },
      { t: 'packet' as const, at, edge: 'hub-az', label },
      { t: 'packet' as const, at, edge: 'hub-gcp', label },
    ])
    const land = (at: number, v: string) => (['aws', 'az', 'gcp'] as const).map((k, i) => ({ t: 'set' as const, at: at + i * 0.1, k, v, pop: true }))
    return {
      id: 'shubflow',
      ariaLabel: t('secretshub.title'),
      initial: { sv: 'none', mem: 'none', pol: 'none', sync: 'idle', awsT: 'none', azT: 'none', gcpT: 'none', aws: 'none', az: 'none', gcp: 'none', wl: 'none' },
      nodes: [
        { id: 'safe', domain: 'idira', Icon: Vault, title: 'PAM Safe', sub: 'Privilege Cloud', rows: [
          { label: 'db/password', k: 'sv', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
          { label: 'api/key', value: 'v1', tone: 'ok' },
        ] },
        { id: 'cpm', domain: 'idira', Icon: CalendarClock, title: 'CPM', sub: 'Central Policy Manager' },
        { id: 'hub', domain: 'idira', Icon: Combine, title: 'Secrets Hub', sub: 'SaaS', rows: [
          { label: 'safe', k: 'mem', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'List · Retrieve', tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'PAM_SAFE', tone: 'ok' }] },
          { label: 'sync', k: 'sync', states: [{ v: 'idle', text: f('st_idle'), tone: 'muted' }, { v: 'check', text: f('st_check'), tone: 'warn' }, { v: 'ok', text: f('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'aws', domain: 'svc', Icon: Cloud, title: 'AWS Secrets Manager', sub: 'IAM Role', rows: [trust('awsT'), ver('aws')] },
        { id: 'az', domain: 'svc', Icon: Cloud, title: 'Azure Key Vault', sub: 'App Registration', rows: [trust('azT'), ver('az')] },
        { id: 'gcp', domain: 'svc', Icon: Cloud, title: 'GCP Secret Manager', sub: 'Service Account', rows: [trust('gcpT'), ver('gcp')] },
        { id: 'wl', domain: 'cp', Icon: HardDrive, title: f('n_wl'), sub: 'native SDK', rows: [ver('wl')] },
      ],
      edgeKinds: {
        'cpm-safe': 'secret', 'safe-hub': 'secret', 'hub-safe': 'control',
        'hub-aws': 'secret', 'hub-az': 'secret', 'hub-gcp': 'secret',
        'aws-wl': 'secret', 'az-wl': 'secret', 'gcp-wl': 'secret',
      },
      layouts: {
        wide: {
          w: 980, h: 450, title: 14,
          boxes: {
            safe: { x: 16, y: 56, w: 196, h: 112 }, cpm: { x: 16, y: 270, w: 196, h: 84 },
            hub: { x: 290, y: 146, w: 200, h: 128 },
            aws: { x: 566, y: 32, w: 210, h: 112 }, az: { x: 566, y: 172, w: 210, h: 112 }, gcp: { x: 566, y: 312, w: 210, h: 112 },
            wl: { x: 822, y: 180, w: 150, h: 92 },
          },
          zones: [
            { d: 'idira', x: 6, y: 40, w: 494, h: 330 },
            { d: 'svc', x: 556, y: 22, w: 230, h: 412 },
            { d: 'cp', x: 812, y: 168, w: 166, h: 116 },
          ],
          edges: {
            'cpm-safe': 'M 114,270 L 114,168',
            'safe-hub': 'M 212,92 C 252,92 252,182 290,182', 'hub-safe': 'M 290,214 C 240,214 240,132 212,132',
            'hub-aws': 'M 490,178 C 528,178 528,88 566,88', 'hub-az': 'M 490,210 C 528,210 528,228 566,228', 'hub-gcp': 'M 490,242 C 528,242 528,368 566,368',
            'aws-wl': 'M 776,88 C 799,88 799,210 822,210', 'az-wl': 'M 776,228 L 822,228', 'gcp-wl': 'M 776,368 C 799,368 799,246 822,246',
          },
        },
        narrow: {
          w: 360, h: 1090, title: 14,
          boxes: {
            cpm: { x: 70, y: 30, w: 220, h: 84 }, safe: { x: 50, y: 164, w: 260, h: 112 },
            hub: { x: 50, y: 326, w: 260, h: 128 },
            aws: { x: 50, y: 520, w: 260, h: 112 }, az: { x: 50, y: 662, w: 260, h: 112 }, gcp: { x: 50, y: 804, w: 260, h: 112 },
            wl: { x: 70, y: 976, w: 220, h: 92 },
          },
          zones: [
            { d: 'idira', x: 40, y: 20, w: 280, h: 444 },
            { d: 'svc', x: 40, y: 508, w: 280, h: 420 },
            { d: 'cp', x: 60, y: 964, w: 240, h: 116 },
          ],
          edges: {
            'cpm-safe': 'M 180,114 L 180,164',
            'safe-hub': 'M 160,276 L 160,326', 'hub-safe': 'M 200,326 L 200,276',
            'hub-aws': 'M 180,454 L 180,520',
            'hub-az': 'M 310,400 C 342,400 342,718 310,718', 'hub-gcp': 'M 50,400 C 18,400 18,860 50,860',
            'aws-wl': 'M 50,576 C 8,576 8,1022 70,1022', 'az-wl': 'M 310,718 C 354,718 354,1022 290,1022', 'gcp-wl': 'M 180,916 L 180,976',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['safe', 'cpm', 'hub', 'aws', 'az', 'gcp', 'wl'], end: 0.6, fx: [] },
        { ...step(2), focus: ['cpm', 'safe'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'cpm-safe', label: 'db/password' }, { t: 'set', at: 1.3, k: 'sv', v: 'v1', pop: true }] },
        { ...step(3), focus: ['hub', 'aws', 'az', 'gcp'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'hub-aws', label: 'IAM Role', kind: 'identity' },
          { t: 'packet', at: 0.3, edge: 'hub-az', label: 'App Reg', kind: 'identity' },
          { t: 'packet', at: 0.3, edge: 'hub-gcp', label: 'Svc Acct', kind: 'identity' },
          { t: 'set', at: 1.3, k: 'awsT', v: 'ok', pop: true }, { t: 'set', at: 1.4, k: 'azT', v: 'ok', pop: true }, { t: 'set', at: 1.5, k: 'gcpT', v: 'ok', pop: true }] },
        { ...step(4), focus: ['hub', 'safe'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'hub-safe', label: 'Safe member' }, { t: 'set', at: 1.3, k: 'mem', v: 'ok', pop: true }] },
        { ...step(5), focus: ['hub', 'safe', 'aws', 'az', 'gcp'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'hub-safe', label: 'PAM_SAFE' }, { t: 'set', at: 1.3, k: 'pol', v: 'ok', pop: true }] },
        { ...step(6), focus: ['safe', 'hub', 'aws', 'az', 'gcp'], end: 3.8, fx: [
          { t: 'set', at: 0.2, k: 'sync', v: 'check' },
          { t: 'packet', at: 0.3, edge: 'safe-hub', label: 'db/password' },
          ...push(1.5, 'v1'), ...land(2.5, 'v1'), { t: 'set', at: 2.9, k: 'sync', v: 'ok', pop: true }] },
        { ...step(7), focus: ['cpm', 'safe', 'hub', 'aws', 'az', 'gcp'], end: 5.0, fx: [
          { t: 'set', at: 0.1, k: 'sync', v: 'idle' },
          { t: 'packet', at: 0.3, edge: 'cpm-safe', label: 'v2' }, { t: 'set', at: 1.3, k: 'sv', v: 'v2', pop: true },
          { t: 'set', at: 1.5, k: 'sync', v: 'check' },
          { t: 'packet', at: 1.6, edge: 'safe-hub', label: 'v2' },
          ...push(2.8, 'v2'), ...land(3.8, 'v2'), { t: 'set', at: 4.2, k: 'sync', v: 'ok', pop: true }] },
        { ...step(8), focus: ['aws', 'az', 'gcp', 'wl'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'aws-wl', label: 'GetSecretValue' },
          { t: 'packet', at: 0.9, edge: 'az-wl', label: 'getSecret' },
          { t: 'packet', at: 1.5, edge: 'gcp-wl', label: 'accessSecretVersion' },
          { t: 'set', at: 2.6, k: 'wl', v: 'v2', pop: true }] },
      ],
    }
  }, [t])

  return (
    <section className="min-h-screen bg-bg-base px-4 py-16 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-10">
        <span className="badge mb-4">{t('secretshub.badge')}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">
          {t('secretshub.title')}
        </h1>
        <p className="text-text-muted text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {t('secretshub.subtitle')}
        </p>
      </div>

      <div className="w-full max-w-5xl">
        <FlowPlayer spec={spec} />
      </div>

      {/* Concept cards */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="section-card">
            <p className="text-sm font-semibold text-text mb-2">{t(`secretshub.key${n}_title`)}</p>
            <p className="text-xs text-text-muted leading-relaxed">{t(`secretshub.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      {/* Architecture summary */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-text-2 mb-3 uppercase tracking-widest font-mono">
          {t('secretshub.arch_title')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <span className="text-domain-idira font-mono text-xs font-bold mt-0.5 shrink-0">{String(n).padStart(2,'0')}</span>
              <div>
                <p className="text-xs font-semibold text-text">{t(`secretshub.arch${n}_title`)}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t(`secretshub.arch${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
