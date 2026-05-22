import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'

interface SHStep {
  litEdges: string[]
  hiNodes: string[]
  cpmPulse: boolean
  activeTargets: ('aws' | 'azure' | 'gcp')[]
  showPolicy: boolean
  showTrust: boolean
  showWorkloadRead: boolean
}

const STEPS: SHStep[] = [
  { litEdges: [],                                                hiNodes: ['pam','safe','cpm','hub','aws','azure','gcp','workload'], cpmPulse: false, activeTargets: [],                         showPolicy: false, showTrust: false, showWorkloadRead: false },
  { litEdges: ['cpm-safe'],                                      hiNodes: ['pam','safe','cpm'],                                     cpmPulse: true,  activeTargets: [],                         showPolicy: false, showTrust: false, showWorkloadRead: false },
  { litEdges: [],                                                hiNodes: ['hub','aws','azure','gcp'],                              cpmPulse: false, activeTargets: ['aws','azure','gcp'],       showPolicy: false, showTrust: true,  showWorkloadRead: false },
  { litEdges: ['hub-safe'],                                      hiNodes: ['hub','safe','pam'],                                     cpmPulse: false, activeTargets: [],                         showPolicy: false, showTrust: false, showWorkloadRead: false },
  { litEdges: ['hub-safe'],                                      hiNodes: ['hub','safe'],                                           cpmPulse: false, activeTargets: ['aws','azure','gcp'],       showPolicy: true,  showTrust: false, showWorkloadRead: false },
  { litEdges: ['hub-safe','hub-aws','hub-azure','hub-gcp'],      hiNodes: ['hub','safe','aws','azure','gcp'],                       cpmPulse: false, activeTargets: ['aws','azure','gcp'],       showPolicy: false, showTrust: false, showWorkloadRead: false },
  { litEdges: ['cpm-safe','hub-safe','hub-aws','hub-azure','hub-gcp'], hiNodes: ['cpm','safe','hub','aws','azure','gcp'],           cpmPulse: true,  activeTargets: ['aws','azure','gcp'],       showPolicy: false, showTrust: false, showWorkloadRead: false },
  { litEdges: ['aws-wl','azure-wl','gcp-wl'],                    hiNodes: ['workload','aws','azure','gcp'],                         cpmPulse: false, activeTargets: ['aws','azure','gcp'],       showPolicy: false, showTrust: false, showWorkloadRead: true  },
]

const CK: Record<string, string> = {
  gold:  '#f59e0b',
  cyan:  '#22d3ee',
  aws:   '#FF9900',
  azure: '#60a5fa',
  gcp:   '#4ade80',
}

interface Edge { id: string; d: string; ck: string; label: string; lx: number; ly: number }
const EDGES: Edge[] = [
  { id: 'cpm-safe',  d: 'M 122,185 C 122,170 122,162 122,160',          ck: 'gold',  label: 'rotates', lx: 135, ly: 172 },
  { id: 'hub-safe',  d: 'M 220,108 C 272,108 272,207 325,207',           ck: 'cyan',  label: 'reads',   lx: 270, ly: 148 },
  { id: 'hub-aws',   d: 'M 545,185 C 597,185 597,62 650,62',             ck: 'aws',   label: 'syncs',   lx: 595, ly: 115 },
  { id: 'hub-azure', d: 'M 545,207 C 597,207 597,177 650,177',           ck: 'azure', label: 'syncs',   lx: 595, ly: 190 },
  { id: 'hub-gcp',   d: 'M 545,225 C 597,225 597,292 650,292',           ck: 'gcp',   label: 'syncs',   lx: 595, ly: 270 },
  { id: 'aws-wl',    d: 'M 757,110 C 757,288 726,354 726,360',           ck: 'aws',   label: 'reads',   lx: 735, ly: 234 },
  { id: 'azure-wl',  d: 'M 757,225 C 757,312 757,354 757,360',           ck: 'azure', label: 'reads',   lx: 768, ly: 292 },
  { id: 'gcp-wl',    d: 'M 757,340 C 757,352 788,357 788,360',           ck: 'gcp',   label: 'reads',   lx: 780, ly: 350 },
]

export default function SecretsHubPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const cur = STEPS[step]
  const total = STEPS.length

  const next = useCallback(() => setStep(s => (s + 1) % total), [total])
  const prev = useCallback(() => setStep(s => (s - 1 + total) % total), [total])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(next, 2800)
    return () => clearInterval(id)
  }, [playing, next])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const litEdge = (id: string) => cur.litEdges.includes(id)
  const hiNode  = (id: string) => cur.hiNodes.includes(id)

  // Node stroke/fill helpers
  const ns = (id: string, color: string) => hiNode(id) ? color : '#1e293b'
  const nf = (id: string, color: string) => hiNode(id) ? color + '12' : '#0f172a'

  const tgt = (t: 'aws'|'azure'|'gcp') => cur.activeTargets.includes(t)

  return (
    <section className="min-h-screen bg-bg-base px-4 py-16 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-10">
        <span className="badge mb-4">{t('secretshub.badge')}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t('secretshub.title')}
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {t('secretshub.subtitle')}
        </p>
      </div>

      {/* SVG Diagram */}
      <div className="w-full max-w-5xl bg-bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-slate-500 font-mono">secrets-hub · sync diagram · step {step + 1}/{total}</span>
        </div>

        <svg viewBox="0 0 880 450" className="w-full h-auto select-none" style={{ fontFamily: 'ui-monospace, monospace' }}>
          <defs>
            {Object.entries(CK).map(([k, v]) => (
              <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={v} />
              </marker>
            ))}
          </defs>

          {/* ── Privilege Cloud / PAM frame ── */}
          <rect x={10} y={15} width={225} height={310} rx={14}
            stroke={ns('pam', '#f59e0b')} strokeWidth={1.5} fill={hiNode('pam') ? '#f59e0b08' : 'transparent'}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={122} y={44} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hiNode('pam') ? '#f59e0b' : '#64748b'} style={{ transition: 'fill 0.4s' }}>
            PRIVILEGE CLOUD
          </text>
          <text x={122} y={57} textAnchor="middle" fontSize={8.5} fill="#475569">PAM · Source of Truth</text>

          {/* Safe */}
          <rect x={25} y={68} width={195} height={100} rx={8}
            stroke={ns('safe', '#22d3ee')} strokeWidth={1.5} fill={nf('safe', '#22d3ee')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={122} y={92} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hiNode('safe') ? '#22d3ee' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🔐 PAM Safe
          </text>
          <text x={122} y={108} textAnchor="middle" fontSize={8.5} fill="#64748b">db/password · api/key</text>
          <text x={122} y={122} textAnchor="middle" fontSize={8.5} fill="#64748b">app/token · svc/cert</text>
          <text x={122} y={138} textAnchor="middle" fontSize={8}
            fill={hiNode('safe') ? '#22d3ee88' : '#334155'} style={{ transition: 'fill 0.4s' }}>
            Sourced by CyberArk ↑
          </text>
          <text x={122} y={152} textAnchor="middle" fontSize={8} fill="#475569">audited · versioned</text>

          {/* CPM */}
          <motion.rect x={25} y={192} width={195} height={100} rx={8}
            stroke={ns('cpm', '#f59e0b')} strokeWidth={cur.cpmPulse ? 2 : 1.5} fill={nf('cpm', '#f59e0b')}
            animate={cur.cpmPulse ? { strokeOpacity: [0.25, 1, 0.25] } : { strokeOpacity: 1 }}
            transition={cur.cpmPulse ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
            style={{ transition: 'fill 0.4s' }} />
          <text x={122} y={218} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hiNode('cpm') ? '#f59e0b' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            ⚙ CPM
          </text>
          <text x={122} y={234} textAnchor="middle" fontSize={8.5} fill="#64748b">Central Policy Manager</text>
          <text x={122} y={248} textAnchor="middle" fontSize={8.5} fill="#64748b">auto-rotates on schedule</text>
          <text x={122} y={264} textAnchor="middle" fontSize={8}
            fill={cur.cpmPulse ? '#f59e0bcc' : '#334155'} style={{ transition: 'fill 0.4s' }}>
            {cur.cpmPulse ? '● rotating...' : '● on schedule'}
          </text>
          <text x={122} y={278} textAnchor="middle" fontSize={8} fill="#475569">policies · auditing · SIEM</text>

          {/* ── Secrets Hub ── */}
          <rect x={325} y={130} width={220} height={165} rx={12}
            stroke={ns('hub', '#a78bfa')} strokeWidth={1.5} fill={nf('hub', '#a78bfa')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={435} y={158} textAnchor="middle" fontSize={12} fontWeight="700"
            fill={hiNode('hub') ? '#a78bfa' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            Secrets Hub
          </text>
          <text x={435} y={173} textAnchor="middle" fontSize={8.5} fill="#64748b">SaaS · CyberArk Identity Security Platform</text>

          {/* Sync Policy pill — visible on step 5 */}
          <AnimatePresence>
            {cur.showPolicy && (
              <motion.g key="policy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <rect x={342} y={185} width={186} height={52} rx={7} fill="#a78bfa18" stroke="#a78bfa55" strokeWidth={1} />
                <text x={435} y={202} textAnchor="middle" fontSize={8} fontWeight="700" fill="#a78bfa">SYNC POLICY</text>
                <text x={435} y={216} textAnchor="middle" fontSize={8} fill="#94a3b8">Source: Safe-Prod → Filter: ALL</text>
                <text x={435} y={229} textAnchor="middle" fontSize={8} fill="#94a3b8">Targets: AWS SM + Azure KV + GCP SM</text>
              </motion.g>
            )}
          </AnimatePresence>
          {!cur.showPolicy && (
            <>
              <text x={435} y={202} textAnchor="middle" fontSize={8.5} fill="#475569">scan → diff → push → verify</text>
              <text x={435} y={216} textAnchor="middle" fontSize={8.5} fill="#475569">interval-based · event-driven</text>
            </>
          )}

          {/* Progress bar inside hub */}
          <rect x={345} y={262} width={190} height={6} rx={3} fill="#1e293b" />
          <motion.rect x={345} y={262} height={6} rx={3} fill="#a78bfa"
            animate={{ width: 190 * (step / (total - 1)) }}
            transition={{ duration: 0.4, ease: 'easeOut' }} />
          <text x={435} y={283} textAnchor="middle" fontSize={7.5} fill="#475569">
            {t('secretshub.step_of', { current: step + 1, total })}
          </text>

          {/* ── AWS Secrets Manager ── */}
          <rect x={650} y={15} width={215} height={95} rx={8}
            stroke={ns('aws', '#FF9900')} strokeWidth={1.5} fill={hiNode('aws') ? '#FF990012' : '#0f172a'}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <AnimatePresence>
            {cur.showTrust && tgt('aws') && (
              <motion.g key="trust-aws" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <rect x={800} y={19} width={58} height={15} rx={4} fill="#FF990022" stroke="#FF990077" strokeWidth={1} />
                <text x={829} y={30} textAnchor="middle" fontSize={7} fontWeight="700" fill="#FF9900">IAM Role ✓</text>
              </motion.g>
            )}
          </AnimatePresence>
          <text x={757} y={44} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hiNode('aws') ? '#FF9900' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>AWS Secrets Manager</text>
          <text x={757} y={58} textAnchor="middle" fontSize={8.5} fill="#64748b">us-east-1 · us-west-2 · multi-region</text>
          <text x={757} y={72} textAnchor="middle" fontSize={8}
            fill={tgt('aws') ? '#FF990099' : '#334155'} style={{ transition: 'fill 0.4s' }}>● {tgt('aws') ? 'synced · Sourced by CyberArk' : 'idle'}</text>
          <text x={757} y={88} textAnchor="middle" fontSize={8} fill="#475569">Lambda · ECS · EKS · EC2 · CodePipeline</text>

          {/* ── Azure Key Vault ── */}
          <rect x={650} y={130} width={215} height={95} rx={8}
            stroke={ns('azure', '#60a5fa')} strokeWidth={1.5} fill={hiNode('azure') ? '#60a5fa12' : '#0f172a'}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <AnimatePresence>
            {cur.showTrust && tgt('azure') && (
              <motion.g key="trust-azure" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <rect x={794} y={134} width={66} height={15} rx={4} fill="#60a5fa22" stroke="#60a5fa77" strokeWidth={1} />
                <text x={827} y={145} textAnchor="middle" fontSize={7} fontWeight="700" fill="#60a5fa">App Reg ✓</text>
              </motion.g>
            )}
          </AnimatePresence>
          <text x={757} y={159} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hiNode('azure') ? '#60a5fa' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>Azure Key Vault</text>
          <text x={757} y={173} textAnchor="middle" fontSize={8.5} fill="#64748b">eastus · westeurope · multi-region</text>
          <text x={757} y={187} textAnchor="middle" fontSize={8}
            fill={tgt('azure') ? '#60a5fa99' : '#334155'} style={{ transition: 'fill 0.4s' }}>● {tgt('azure') ? 'synced · Sourced by CyberArk' : 'idle'}</text>
          <text x={757} y={203} textAnchor="middle" fontSize={8} fill="#475569">AKS · App Service · Azure Functions</text>

          {/* ── GCP Secret Manager ── */}
          <rect x={650} y={245} width={215} height={95} rx={8}
            stroke={ns('gcp', '#4ade80')} strokeWidth={1.5} fill={hiNode('gcp') ? '#4ade8012' : '#0f172a'}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <AnimatePresence>
            {cur.showTrust && tgt('gcp') && (
              <motion.g key="trust-gcp" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <rect x={794} y={249} width={66} height={15} rx={4} fill="#4ade8022" stroke="#4ade8077" strokeWidth={1} />
                <text x={827} y={260} textAnchor="middle" fontSize={7} fontWeight="700" fill="#4ade80">Svc Acct ✓</text>
              </motion.g>
            )}
          </AnimatePresence>
          <text x={757} y={274} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hiNode('gcp') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>GCP Secret Manager</text>
          <text x={757} y={288} textAnchor="middle" fontSize={8.5} fill="#64748b">us-central1 · europe-west1</text>
          <text x={757} y={302} textAnchor="middle" fontSize={8}
            fill={tgt('gcp') ? '#4ade8099' : '#334155'} style={{ transition: 'fill 0.4s' }}>● {tgt('gcp') ? 'synced · Sourced by CyberArk' : 'idle'}</text>
          <text x={757} y={318} textAnchor="middle" fontSize={8} fill="#475569">GKE · Cloud Run · Cloud Functions</text>

          {/* ── Workload / Developers ── */}
          <rect x={645} y={360} width={225} height={78} rx={12}
            stroke={ns('workload', '#4ade80')} strokeWidth={1.5} fill={nf('workload', '#4ade80')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={757} y={385} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hiNode('workload') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🖥 Developers / Workloads
          </text>
          <text x={757} y={399} textAnchor="middle" fontSize={8.5} fill="#64748b">Lambda · K8s pod · CI/CD · containers</text>
          <text x={757} y={413} textAnchor="middle" fontSize={8}
            fill={cur.showWorkloadRead ? '#4ade80' : '#334155'} style={{ transition: 'fill 0.4s' }}>
            {cur.showWorkloadRead ? 'native SDK · zero code changes ✓' : 'reads from native store API'}
          </text>
          <text x={757} y={428} textAnchor="middle" fontSize={8} fill="#475569">no CyberArk SDK · no agent required</text>

          {/* ── Edges ── */}
          {EDGES.map(e => (
            <g key={e.id}>
              <motion.path
                d={e.d} fill="none"
                stroke={CK[e.ck]}
                strokeDasharray={litEdge(e.id) ? '7 4' : '0'}
                markerEnd={litEdge(e.id) ? `url(#arr-${e.ck})` : undefined}
                animate={{ opacity: litEdge(e.id) ? 1 : 0, strokeWidth: litEdge(e.id) ? 2 : 0 }}
                transition={{ duration: 0.3 }}
              />
              <AnimatePresence>
                {litEdge(e.id) && (
                  <motion.text key={`lbl-${e.id}`}
                    x={e.lx} y={e.ly} textAnchor="middle" fontSize={8} fontWeight="700" fill={CK[e.ck]}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {e.label}
                  </motion.text>
                )}
              </AnimatePresence>
            </g>
          ))}
        </svg>
      </div>

      {/* Step description */}
      <div className="w-full max-w-5xl mt-6">
        <div className="bg-bg-card border border-border rounded-xl p-5 min-h-[110px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              {t('secretshub.step_of', { current: step + 1, total })}
            </span>
            <span className="text-[10px] font-mono text-slate-600">{t('secretshub.keyboard_hint')}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <p className="text-sm font-semibold text-white mb-1">
                {t(`secretshub.s${step + 1}_title`)}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t(`secretshub.s${step + 1}_desc`)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={prev}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={18} />
          </button>

          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-purple-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`} />
            ))}
          </div>

          <button onClick={() => setPlaying(p => !p)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button onClick={next}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Concept cards */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="section-card">
            <p className="text-sm font-semibold text-white mb-2">{t(`secretshub.key${n}_title`)}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{t(`secretshub.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      {/* Architecture summary */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-widest font-mono">
          {t('secretshub.arch_title')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <span className="text-purple-400 font-mono text-xs font-bold mt-0.5 shrink-0">{String(n).padStart(2,'0')}</span>
              <div>
                <p className="text-xs font-semibold text-slate-200">{t(`secretshub.arch${n}_title`)}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t(`secretshub.arch${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
