import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────
   The page is three self-contained walkthroughs:
     1. identity  — how a workload gets an SVID at all
     2. aws       — SPIFFE-aware target: the SVID *is* the credential
     3. db        — non-SPIFFE target: the SVID only opens the vault, and
                    what reaches the database is a username and password
   Panels 2 and 3 are deliberately separate so the two consumption paths
   are never read as one sequence.
   ───────────────────────────────────────────────────────────────────────── */

interface Step {
  litEdges: string[]
  hiNodes: string[]
  pulse?: string          // node id that pulses on this step
  pill?: string           // id of the caption pill shown on this step
}

const CK: Record<string, string> = {
  cyan:   '#22d3ee',
  gold:   '#f59e0b',
  violet: '#a78bfa',
  green:  '#4ade80',
  aws:    '#FF9900',
}

interface Edge { id: string; d: string; ck: string; label: string; lx: number; ly: number }

/* ── Shared SVG helpers ─────────────────────────────────────────────── */

function useFlow(total: number) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-120px' })

  // Each panel starts itself when it first scrolls into view, so the three
  // walkthroughs never animate on top of each other.
  useEffect(() => { if (inView) setPlaying(true) }, [inView])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setStep(s => {
        if (s >= total - 1) { setPlaying(false); return s }
        return s + 1
      })
    }, 2800)
    return () => clearInterval(id)
  }, [playing, total])

  const next = useCallback(() => setStep(s => (s + 1) % total), [total])
  const prev = useCallback(() => setStep(s => (s - 1 + total) % total), [total])
  return { step, setStep, playing, setPlaying, next, prev, ref }
}

function Edges({ edges, lit }: { edges: Edge[]; lit: (id: string) => boolean }) {
  return (
    <>
      {edges.map(e => (
        <g key={e.id}>
          <motion.path
            d={e.d} fill="none"
            stroke={CK[e.ck]}
            strokeDasharray={lit(e.id) ? '7 4' : '0'}
            markerEnd={lit(e.id) ? `url(#swa-arr-${e.ck})` : undefined}
            animate={{ opacity: lit(e.id) ? 1 : 0, strokeWidth: lit(e.id) ? 2 : 0 }}
            transition={{ duration: 0.3 }}
          />
          <AnimatePresence>
            {lit(e.id) && (
              <motion.text key={`lbl-${e.id}`}
                x={e.lx} y={e.ly} textAnchor="middle" fontSize={8} fontWeight="700" fill={CK[e.ck]}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {e.label}
              </motion.text>
            )}
          </AnimatePresence>
        </g>
      ))}
    </>
  )
}

function Markers() {
  return (
    <defs>
      {Object.entries(CK).map(([k, v]) => (
        <marker key={k} id={`swa-arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={v} />
        </marker>
      ))}
    </defs>
  )
}

/* A caption pill under a diagram — used for the SVID, the registration
   policy, the fetched credentials, and so on. */
function Pill({ show, x, y, w, color, title, body, bodySize = 7 }: {
  show: boolean; x: number; y: number; w: number; color: string
  title: string; body: string; bodySize?: number
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.g initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <rect x={x} y={y} width={w} height={32} rx={6} fill={color + '18'} stroke={color + '55'} strokeWidth={1} />
          <text x={x + w / 2} y={y + 13} textAnchor="middle" fontSize={7.5} fontWeight="700" fill={color}>{title}</text>
          <text x={x + w / 2} y={y + 25} textAnchor="middle" fontSize={bodySize} fill="#94a3b8">{body}</text>
        </motion.g>
      )}
    </AnimatePresence>
  )
}

/* ── Panel shell: header, framed SVG, step text, controls ───────────── */

function FlowPanel({ prefix, steps, caption, viewBox, children }: {
  prefix: string
  steps: number
  caption: string
  viewBox: string
  children: (step: number, pulseOn: (id: string) => boolean) => ReactNode
}) {
  const { t } = useTranslation()
  const { step, setStep, playing, setPlaying, next, prev, ref } = useFlow(steps)
  const reduce = useReducedMotion()

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    else if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p) }
  }

  const pulseOn = (id: string) => !reduce && id === (STEP_SETS[prefix][step].pulse ?? '')

  return (
    <div ref={ref} className="w-full max-w-5xl mt-14">
      {/* Panel heading */}
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-text">{t(`swapage.${prefix}_title`)}</h2>
        <p className="mt-2 text-sm text-text-muted leading-relaxed max-w-3xl">{t(`swapage.${prefix}_sub`)}</p>
      </div>

      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={t(`swapage.${prefix}_title`)}
        className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-conjur-cyan"
      >
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-text-muted font-mono">{caption} · step {step + 1}/{steps}</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-[#050d1a] p-4">
          <svg viewBox={viewBox} className="h-auto select-none" role="img"
            aria-label={t(`swapage.${prefix}_title`)}
            style={{ fontFamily: 'ui-monospace, monospace', minWidth: 640, width: '100%' }}>
            <Markers />
            {children(step, pulseOn)}
          </svg>
        </div>
      </div>

      {/* Step description */}
      <div className="bg-bg-card border border-border rounded-xl p-5 min-h-[110px] mt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            {t('swapage.step_of', { current: step + 1, total: steps })}
          </span>
          <span className="text-[10px] font-mono text-text-muted">{t('swapage.keyboard_hint')}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <p className="text-sm font-semibold text-text mb-1">{t(`swapage.${prefix}${step + 1}_title`)}</p>
            <p className="text-sm text-text-muted leading-relaxed">{t(`swapage.${prefix}${step + 1}_desc`)}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button onClick={prev} aria-label="Previous step"
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-muted transition-colors">
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: steps }).map((_, i) => (
            <button key={i} onClick={() => setStep(i)} aria-label={`Go to step ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-conjur-cyan' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
              }`} />
          ))}
        </div>
        <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-muted transition-colors">
          {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        </button>
        <button onClick={next} aria-label="Next step"
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-muted transition-colors">
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/* ── 1 · Identity issuance ──────────────────────────────────────────── */

const ID_STEPS: Step[] = [
  { litEdges: [],             hiNodes: ['cp','td','tree','k8s','srv','agent','wl'] },
  { litEdges: [],             hiNodes: ['cp','td','tree'], pill: 'trustcfg' },
  { litEdges: ['srv-cp'],     hiNodes: ['srv','cp','td'] },
  { litEdges: ['agent-srv'],  hiNodes: ['agent','srv','k8s'], pulse: 'agent' },
  { litEdges: ['wl-agent'],   hiNodes: ['wl','agent'], pulse: 'agent', pill: 'regpol' },
  { litEdges: ['agent-wl'],   hiNodes: ['agent','wl'], pill: 'svid' },
  { litEdges: ['srv-tree'],   hiNodes: ['srv','cp','tree'] },
]

const ID_EDGES: Edge[] = [
  { id: 'srv-cp',    d: 'M 318,150 C 292,150 286,110 262,110', ck: 'violet', label: 'authn-jwt · sync 15m', lx: 292, ly: 122 },
  { id: 'srv-tree',  d: 'M 318,176 C 284,200 286,292 250,302', ck: 'green',  label: 'sync workload',        lx: 288, ly: 252 },
  { id: 'agent-srv', d: 'M 452,232 C 452,215 452,205 452,192', ck: 'cyan',   label: 'k8s_psat attest',      lx: 517, ly: 214 },
  { id: 'wl-agent',  d: 'M 430,338 C 430,322 430,312 430,300', ck: 'green',  label: 'Workload API',         lx: 372, ly: 322 },
  { id: 'agent-wl',  d: 'M 478,300 C 478,312 478,322 478,338', ck: 'cyan',   label: 'JWT-SVID',             lx: 522, ly: 322 },
]

function IdentityDiagram(step: number, pulseOn: (id: string) => boolean) {
  const cur = ID_STEPS[step]
  const hi = (id: string) => cur.hiNodes.includes(id)
  const ns = (id: string, c: string) => hi(id) ? c : '#1e293b'
  const nf = (id: string, c: string) => hi(id) ? c + '12' : '#0f172a'

  return (
    <>
      {/* Control plane */}
      <rect x={10} y={55} width={252} height={300} rx={14}
        stroke={ns('cp', '#a78bfa')} strokeWidth={1.5} fill={hi('cp') ? '#a78bfa08' : 'transparent'}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={136} y={78} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('cp') ? '#a78bfa' : '#64748b'} style={{ transition: 'fill 0.4s' }}>SECRETS MANAGER SaaS</text>
      <text x={136} y={91} textAnchor="middle" fontSize={8.5} fill="#475569">Control Plane · latamlab tenant</text>

      <rect x={24} y={100} width={224} height={88} rx={8}
        stroke={ns('td', '#22d3ee')} strokeWidth={1.5} fill={nf('td', '#22d3ee')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={136} y={121} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('td') ? '#22d3ee' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>🏷 Trust Domain</text>
      <text x={136} y={135} textAnchor="middle" fontSize={8.5} fill="#64748b">idira.machinesec</text>
      {cur.pill === 'trustcfg' ? (
        <>
          <text x={136} y={152} textAnchor="middle" fontSize={8} fill="#22d3eecc">RSA_4096 · RS512</text>
          <text x={136} y={165} textAnchor="middle" fontSize={8} fill="#22d3eecc">signing_key_ttl 86400s</text>
          <text x={136} y={178} textAnchor="middle" fontSize={8} fill="#22d3eecc">token_ttl 300s</text>
        </>
      ) : (
        <>
          <text x={136} y={152} textAnchor="middle" fontSize={8} fill="#475569">CA bundle · /.well-known/jwks</text>
          <text x={136} y={165} textAnchor="middle" fontSize={8} fill="#475569">server groups · node groups</text>
          <text x={136} y={178} textAnchor="middle" fontSize={8} fill="#475569">issues signing material</text>
        </>
      )}

      <rect x={24} y={228} width={224} height={92} rx={8}
        stroke={ns('tree', '#4ade80')} strokeWidth={1.5} fill={nf('tree', '#4ade80')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={136} y={252} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('tree') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>🌳 Workload Inventory</text>
      <text x={136} y={268} textAnchor="middle" fontSize={8} fill="#64748b">data/swa/trust-domains/…/workloads</text>
      <text x={136} y={283} textAnchor="middle" fontSize={8} fill="#475569">one host per SPIFFE ID</text>
      <text x={136} y={298} textAnchor="middle" fontSize={8} fill="#475569">no secret access by default</text>
      <text x={136} y={313} textAnchor="middle" fontSize={8} fill="#475569">audited · reviewable as policy</text>

      {/* Cluster */}
      <rect x={300} y={55} width={300} height={360} rx={14}
        stroke={ns('k8s', '#60a5fa')} strokeWidth={1.5} fill={hi('k8s') ? '#60a5fa08' : 'transparent'}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={450} y={78} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('k8s') ? '#60a5fa' : '#64748b'} style={{ transition: 'fill 0.4s' }}>EKS CLUSTER · latam</text>
      <text x={450} y={91} textAnchor="middle" fontSize={8.5} fill="#475569">sa-east-1 · trust domain member</text>

      <rect x={318} y={104} width={264} height={88} rx={8}
        stroke={ns('srv', '#a78bfa')} strokeWidth={1.5} fill={nf('srv', '#a78bfa')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={450} y={126} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('srv') ? '#a78bfa' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>▣ SWA Server</text>
      <text x={450} y={140} textAnchor="middle" fontSize={8.5} fill="#64748b">Deployment · :8443 gRPC API</text>
      <text x={450} y={155} textAnchor="middle" fontSize={8} fill="#475569">validates node attestation</text>
      <text x={450} y={168} textAnchor="middle" fontSize={8} fill="#475569">signs SVIDs for this trust domain</text>
      <text x={450} y={182} textAnchor="middle" fontSize={8} fill="#475569">server group: swaservers</text>

      <motion.rect x={318} y={232} width={264} height={68} rx={8}
        stroke={ns('agent', '#22d3ee')} strokeWidth={pulseOn('agent') ? 2 : 1.5} fill={nf('agent', '#22d3ee')}
        animate={pulseOn('agent') ? { strokeOpacity: [0.25, 1, 0.25] } : { strokeOpacity: 1 }}
        transition={pulseOn('agent') ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
        style={{ transition: 'fill 0.4s' }} />
      <text x={450} y={253} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('agent') ? '#22d3ee' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>◆ SWA Agent · DaemonSet</text>
      <text x={450} y={267} textAnchor="middle" fontSize={8.5} fill="#64748b">nodeAttestor: k8s_psat · cluster latam</text>
      <text x={450} y={281} textAnchor="middle" fontSize={8} fill="#475569">workload attestor: k8s (kubelet)</text>
      <text x={450} y={294} textAnchor="middle" fontSize={8} fill="#475569">socket /tmp/swa-agent/public/api.sock</text>

      <rect x={318} y={338} width={264} height={64} rx={8}
        stroke={ns('wl', '#4ade80')} strokeWidth={1.5} fill={nf('wl', '#4ade80')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={450} y={358} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('wl') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>🖥 Workload Pod</text>
      <text x={450} y={372} textAnchor="middle" fontSize={8.5} fill="#64748b">ns conjur · sa conjur-sa-swa</text>
      <text x={450} y={386} textAnchor="middle" fontSize={8} fill="#475569">no API key · no stored cloud key</text>

      <Pill show={cur.pill === 'regpol'} x={330} y={426} w={256} color="#4ade80"
        title="WORKLOAD REGISTRATION POLICY" body="k8s.ns=='conjur' && k8s.sa=='conjur-sa-swa'" bodySize={7.5} />
      <Pill show={cur.pill === 'svid'} x={302} y={426} w={300} color="#22d3ee"
        title="JWT-SVID · sub" body="spiffe://idira.machinesec/k8s-prod-ng/ns/conjur/sa/conjur-sa-swa" />

      <Edges edges={ID_EDGES} lit={(id) => cur.litEdges.includes(id)} />
    </>
  )
}

/* ── 2 · Federated identity into AWS (the SVID is the credential) ───── */

const AWS_STEPS: Step[] = [
  { litEdges: [],                    hiNodes: ['td','k8s','agent','wl','aws','oidc','role','sts','s3'] },
  { litEdges: ['wl-agent'],          hiNodes: ['wl','agent'], pill: 'aud' },
  { litEdges: ['agent-wl'],          hiNodes: ['agent','wl'], pill: 'svid' },
  { litEdges: ['wl-sts'],            hiNodes: ['wl','sts','aws'], pill: 'svid' },
  { litEdges: ['sts-oidc','oidc-td'], hiNodes: ['sts','oidc','td'] },
  { litEdges: ['sts-role'],          hiNodes: ['sts','role'] },
  { litEdges: ['sts-wl'],            hiNodes: ['sts','wl'], pill: 'creds' },
  { litEdges: ['wl-s3'],             hiNodes: ['wl','s3'], pill: 'creds' },
]

const AWS_EDGES: Edge[] = [
  { id: 'wl-agent',  d: 'M 120,262 C 120,250 120,244 120,236', ck: 'green',  label: 'fetch jwt',    lx: 78,  ly: 252 },
  { id: 'agent-wl',  d: 'M 200,236 C 200,244 200,250 200,262', ck: 'cyan',   label: 'JWT-SVID',     lx: 243, ly: 252 },
  { id: 'wl-sts',    d: 'M 306,300 C 356,300 368,236 418,236', ck: 'cyan',   label: 'present SVID', lx: 362, ly: 282 },
  { id: 'sts-oidc',  d: 'M 500,196 C 500,182 500,172 500,158', ck: 'aws',    label: 'verify',       lx: 530, ly: 180 },
  { id: 'oidc-td',   d: 'M 418,100 C 350,100 330,62 274,62',   ck: 'aws',    label: 'public JWKS',  lx: 348, ly: 78  },
  { id: 'sts-role',  d: 'M 632,228 C 682,228 700,160 744,160', ck: 'aws',    label: 'aud + sub',    lx: 688, ly: 206 },
  { id: 'sts-wl',    d: 'M 418,262 C 368,262 356,330 306,330', ck: 'aws',    label: 'temp creds',   lx: 362, ly: 318 },
  { id: 'wl-s3',     d: 'M 306,352 C 470,392 620,340 744,288', ck: 'aws',    label: 's3:ListBucket with temp creds', lx: 520, ly: 378 },
]

function AwsDiagram(step: number, _pulseOn: (id: string) => boolean) {
  const cur = AWS_STEPS[step]
  const hi = (id: string) => cur.hiNodes.includes(id)
  const ns = (id: string, c: string) => hi(id) ? c : '#1e293b'
  const nf = (id: string, c: string) => hi(id) ? c + '12' : '#0f172a'

  return (
    <>
      {/* Trust domain (only the public side matters here) */}
      <rect x={20} y={24} width={254} height={76} rx={10}
        stroke={ns('td', '#22d3ee')} strokeWidth={1.5} fill={nf('td', '#22d3ee')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={147} y={46} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('td') ? '#22d3ee' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>🏷 Trust Domain · idira.machinesec</text>
      <text x={147} y={62} textAnchor="middle" fontSize={8} fill="#64748b">/.well-known/openid-configuration</text>
      <text x={147} y={76} textAnchor="middle" fontSize={8} fill="#64748b">/.well-known/jwks · public</text>
      <text x={147} y={91} textAnchor="middle" fontSize={8} fill="#475569">AWS reads this, unauthenticated</text>

      {/* Cluster */}
      <rect x={20} y={130} width={286} height={240} rx={14}
        stroke={ns('k8s', '#60a5fa')} strokeWidth={1.5} fill={hi('k8s') ? '#60a5fa08' : 'transparent'}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={163} y={152} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('k8s') ? '#60a5fa' : '#64748b'} style={{ transition: 'fill 0.4s' }}>EKS CLUSTER · latam</text>

      <rect x={36} y={168} width={254} height={68} rx={8}
        stroke={ns('agent', '#22d3ee')} strokeWidth={1.5} fill={nf('agent', '#22d3ee')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={163} y={190} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('agent') ? '#22d3ee' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>◆ SWA Agent</text>
      <text x={163} y={205} textAnchor="middle" fontSize={8.5} fill="#64748b">Workload API · Unix socket</text>
      <text x={163} y={221} textAnchor="middle" fontSize={8} fill="#475569">attests the pod, then issues the SVID</text>

      <rect x={36} y={262} width={270} height={88} rx={8}
        stroke={ns('wl', '#4ade80')} strokeWidth={1.5} fill={nf('wl', '#4ade80')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={171} y={284} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('wl') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>🖥 Workload Pod</text>
      <text x={171} y={299} textAnchor="middle" fontSize={8.5} fill="#64748b">ns conjur · sa conjur-sa-swa</text>
      <text x={171} y={314} textAnchor="middle" fontSize={8} fill="#475569">holds no AWS access key, ever</text>
      <text x={171} y={330} textAnchor="middle" fontSize={8} fill="#475569">the SVID is the only thing it presents</text>

      {/* AWS */}
      <rect x={400} y={24} width={480} height={300} rx={14}
        stroke={ns('aws', '#FF9900')} strokeWidth={1.5} fill={hi('aws') ? '#FF990008' : 'transparent'}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={640} y={46} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('aws') ? '#FF9900' : '#64748b'} style={{ transition: 'fill 0.4s' }}>AWS ACCOUNT · 475601244925</text>

      <rect x={418} y={70} width={214} height={88} rx={8}
        stroke={ns('oidc', '#FF9900')} strokeWidth={1.5} fill={nf('oidc', '#FF9900')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={525} y={92} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('oidc') ? '#FF9900' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>IAM OIDC Provider</text>
      <text x={525} y={108} textAnchor="middle" fontSize={8} fill="#64748b">issuer = trust domain URL</text>
      <text x={525} y={123} textAnchor="middle" fontSize={8} fill="#475569">verifies the SVID signature</text>
      <text x={525} y={138} textAnchor="middle" fontSize={8} fill="#475569">no shared secret with the cluster</text>
      <text x={525} y={152} textAnchor="middle" fontSize={8} fill="#475569">client id: sts.amazonaws.com</text>

      <rect x={650} y={70} width={212} height={88} rx={8}
        stroke={ns('role', '#FF9900')} strokeWidth={1.5} fill={nf('role', '#FF9900')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={756} y={92} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('role') ? '#FF9900' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>IAM Role</text>
      <text x={756} y={108} textAnchor="middle" fontSize={8} fill="#64748b">trust: aud = sts.amazonaws.com</text>
      <text x={756} y={123} textAnchor="middle" fontSize={8} fill="#64748b">trust: sub = the SPIFFE ID</text>
      <text x={756} y={138} textAnchor="middle" fontSize={8} fill="#475569">policy: s3:ListBucket, s3:GetObject</text>
      <text x={756} y={152} textAnchor="middle" fontSize={8} fill="#475569">one role per workload identity</text>

      <rect x={418} y={196} width={214} height={80} rx={8}
        stroke={ns('sts', '#FF9900')} strokeWidth={1.5} fill={nf('sts', '#FF9900')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={525} y={218} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('sts') ? '#FF9900' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>AWS STS</text>
      <text x={525} y={234} textAnchor="middle" fontSize={8} fill="#64748b">AssumeRoleWithWebIdentity</text>
      <text x={525} y={249} textAnchor="middle" fontSize={8} fill="#475569">web identity token = JWT-SVID</text>
      <text x={525} y={264} textAnchor="middle" fontSize={8} fill="#475569">returns temporary credentials</text>

      <rect x={650} y={196} width={212} height={80} rx={8}
        stroke={ns('s3', '#FF9900')} strokeWidth={1.5} fill={nf('s3', '#FF9900')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={756} y={218} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('s3') ? '#FF9900' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>Amazon S3</text>
      <text x={756} y={234} textAnchor="middle" fontSize={8} fill="#64748b">s3://aslancarlos · sa-east-1</text>
      <text x={756} y={249} textAnchor="middle" fontSize={8} fill="#475569">live demo at /swa-s3</text>
      <text x={756} y={264} textAnchor="middle" fontSize={8} fill="#475569">no secret was fetched to get here</text>

      <Pill show={cur.pill === 'aud'} x={60} y={378} w={236} color="#4ade80"
        title="REQUESTED AUDIENCE" body="swa-agent api fetch jwt --audience=sts.amazonaws.com" bodySize={6.5} />
      <Pill show={cur.pill === 'svid'} x={40} y={378} w={280} color="#22d3ee"
        title="JWT-SVID · sub" body="spiffe://idira.machinesec/k8s-prod-ng/ns/conjur/sa/conjur-sa-swa" bodySize={6.5} />
      <Pill show={cur.pill === 'creds'} x={60} y={378} w={236} color="#FF9900"
        title="TEMPORARY CREDENTIALS" body="AccessKeyId · SecretAccessKey · SessionToken" bodySize={6.5} />
    </>
  )
}

/* ── 3 · Secret retrieval for a non-SPIFFE target (database) ────────── */

const DB_STEPS: Step[] = [
  { litEdges: [],                  hiNodes: ['cp','authn','var','k8s','agent','wl','db'] },
  { litEdges: ['wl-agent'],        hiNodes: ['wl','agent'], pill: 'aud' },
  { litEdges: ['agent-wl'],        hiNodes: ['agent','wl'], pill: 'svid' },
  { litEdges: ['wl-authn'],        hiNodes: ['wl','authn','cp'], pill: 'svid' },
  { litEdges: ['authn-wl'],        hiNodes: ['authn','wl'], pill: 'token' },
  { litEdges: ['wl-var'],          hiNodes: ['wl','var'], pill: 'token' },
  { litEdges: ['var-wl'],          hiNodes: ['var','wl'], pill: 'dbcreds' },
  { litEdges: ['wl-db'],           hiNodes: ['wl','db'], pill: 'dbcreds' },
]

const DB_EDGES: Edge[] = [
  { id: 'wl-agent', d: 'M 400,180 C 400,166 400,158 400,144', ck: 'green',  label: 'fetch jwt',       lx: 358, ly: 168 },
  { id: 'agent-wl', d: 'M 500,144 C 500,158 500,166 500,180', ck: 'cyan',   label: 'JWT-SVID',        lx: 545, ly: 168 },
  { id: 'wl-authn', d: 'M 346,200 C 316,200 306,118 276,110', ck: 'gold',   label: 'authenticate',    lx: 292, ly: 146 },
  { id: 'authn-wl', d: 'M 276,132 C 306,140 316,222 346,222', ck: 'gold',   label: 'access token',    lx: 300, ly: 200 },
  { id: 'wl-var',   d: 'M 346,252 C 316,252 306,232 276,228', ck: 'gold',   label: 'GET variable',    lx: 296, ly: 262 },
  { id: 'var-wl',   d: 'M 276,250 C 306,256 316,274 346,274', ck: 'gold',   label: 'user + password', lx: 302, ly: 292 },
  { id: 'wl-db',    d: 'M 584,240 C 612,240 626,240 652,240', ck: 'green',  label: 'MySQL · user + password', lx: 618, ly: 226 },
]

function DbDiagram(step: number, _pulseOn: (id: string) => boolean) {
  const cur = DB_STEPS[step]
  const hi = (id: string) => cur.hiNodes.includes(id)
  const ns = (id: string, c: string) => hi(id) ? c : '#1e293b'
  const nf = (id: string, c: string) => hi(id) ? c + '12' : '#0f172a'

  return (
    <>
      {/* Control plane */}
      <rect x={14} y={24} width={262} height={346} rx={14}
        stroke={ns('cp', '#a78bfa')} strokeWidth={1.5} fill={hi('cp') ? '#a78bfa08' : 'transparent'}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={145} y={46} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('cp') ? '#a78bfa' : '#64748b'} style={{ transition: 'fill 0.4s' }}>SECRETS MANAGER SaaS</text>

      <rect x={30} y={62} width={230} height={96} rx={8}
        stroke={ns('authn', '#f59e0b')} strokeWidth={1.5} fill={nf('authn', '#f59e0b')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={145} y={84} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('authn') ? '#f59e0b' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>⚙ authn-jwt</text>
      <text x={145} y={99} textAnchor="middle" fontSize={8.5} fill="#64748b">secureWorkloadAccess</text>
      <text x={145} y={114} textAnchor="middle" fontSize={8} fill="#475569">verifies the SVID against the JWKS</text>
      <text x={145} y={128} textAnchor="middle" fontSize={8} fill="#475569">sub → host under …/workloads</text>
      <text x={145} y={143} textAnchor="middle" fontSize={8} fill="#475569">returns a short-lived access token</text>

      <rect x={30} y={186} width={230} height={96} rx={8}
        stroke={ns('var', '#f59e0b')} strokeWidth={1.5} fill={nf('var', '#f59e0b')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={145} y={208} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('var') ? '#f59e0b' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>🔐 Secret</text>
      <text x={145} y={223} textAnchor="middle" fontSize={8} fill="#64748b">data/swa/secrets/myapp/db-password</text>
      <text x={145} y={238} textAnchor="middle" fontSize={8} fill="#475569">permit: read, execute</text>
      <text x={145} y={252} textAnchor="middle" fontSize={8} fill="#475569">rotated centrally, not by the app</text>
      <text x={145} y={267} textAnchor="middle" fontSize={8} fill="#475569">every fetch is audited</text>

      <rect x={30} y={304} width={230} height={50} rx={8}
        stroke="#1e293b" strokeWidth={1.5} fill="#0f172a" />
      <text x={145} y={324} textAnchor="middle" fontSize={8.5} fontWeight="700" fill="#64748b">WHY A SECRET AT ALL?</text>
      <text x={145} y={340} textAnchor="middle" fontSize={7.5} fill="#475569">MySQL cannot validate an SVID</text>

      {/* Cluster */}
      <rect x={330} y={24} width={270} height={346} rx={14}
        stroke={ns('k8s', '#60a5fa')} strokeWidth={1.5} fill={hi('k8s') ? '#60a5fa08' : 'transparent'}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={465} y={46} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('k8s') ? '#60a5fa' : '#64748b'} style={{ transition: 'fill 0.4s' }}>EKS CLUSTER · latam</text>

      <rect x={346} y={62} width={238} height={82} rx={8}
        stroke={ns('agent', '#22d3ee')} strokeWidth={1.5} fill={nf('agent', '#22d3ee')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={465} y={84} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('agent') ? '#22d3ee' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>◆ SWA Agent</text>
      <text x={465} y={100} textAnchor="middle" fontSize={8.5} fill="#64748b">Workload API · Unix socket</text>
      <text x={465} y={116} textAnchor="middle" fontSize={8} fill="#475569">attests the pod, then issues the SVID</text>
      <text x={465} y={132} textAnchor="middle" fontSize={8} fill="#475569">audience here: conjur</text>

      <rect x={346} y={180} width={238} height={120} rx={8}
        stroke={ns('wl', '#4ade80')} strokeWidth={1.5} fill={nf('wl', '#4ade80')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={465} y={202} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('wl') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>🖥 Workload Pod</text>
      <text x={465} y={217} textAnchor="middle" fontSize={8.5} fill="#64748b">ns conjur · sa conjur-sa-swa</text>
      <text x={465} y={236} textAnchor="middle" fontSize={8} fill="#475569">1 · SVID  →  proves who it is</text>
      <text x={465} y={251} textAnchor="middle" fontSize={8} fill="#475569">2 · access token  →  opens the vault</text>
      <text x={465} y={266} textAnchor="middle" fontSize={8} fill="#475569">3 · DB password  →  opens the database</text>
      <text x={465} y={286} textAnchor="middle" fontSize={8} fill="#64748b">the SVID never leaves the pod</text>

      {/* Database */}
      <rect x={652} y={180} width={230} height={120} rx={8}
        stroke={ns('db', '#4ade80')} strokeWidth={1.5} fill={nf('db', '#4ade80')}
        style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
      <text x={767} y={204} textAnchor="middle" fontSize={10} fontWeight="700"
        fill={hi('db') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>▤ MySQL Database</text>
      <text x={767} y={220} textAnchor="middle" fontSize={8.5} fill="#64748b">devsecops-tools · port 3306</text>
      <text x={767} y={238} textAnchor="middle" fontSize={8} fill="#475569">speaks username + password only</text>
      <text x={767} y={253} textAnchor="middle" fontSize={8} fill="#475569">no SPIFFE, no OIDC, no JWKS</text>
      <text x={767} y={271} textAnchor="middle" fontSize={8}
        fill={hi('db') ? '#4ade8099' : '#334155'} style={{ transition: 'fill 0.4s' }}>it never sees the SVID</text>
      <text x={767} y={288} textAnchor="middle" fontSize={8} fill="#475569">unchanged, legacy-friendly</text>

      <Pill show={cur.pill === 'aud'} x={330} y={382} w={270} color="#4ade80"
        title="REQUESTED AUDIENCE" body="swa-agent api fetch jwt --audience=conjur" bodySize={7} />
      <Pill show={cur.pill === 'svid'} x={300} y={382} w={330} color="#22d3ee"
        title="JWT-SVID · sub" body="spiffe://idira.machinesec/k8s-prod-ng/ns/conjur/sa/conjur-sa-swa" bodySize={7} />
      <Pill show={cur.pill === 'token'} x={330} y={382} w={270} color="#f59e0b"
        title="CONJUR ACCESS TOKEN" body="short-lived · scoped to this identity" bodySize={7} />
      <Pill show={cur.pill === 'dbcreds'} x={330} y={382} w={270} color="#f59e0b"
        title="DATABASE CREDENTIAL" body="app_user / ●●●●●●●● — an ordinary password" bodySize={7} />

      <Edges edges={DB_EDGES} lit={(id) => cur.litEdges.includes(id)} />
    </>
  )
}

/* Edges for the AWS panel are drawn after the boxes, like the other two. */
function AwsDiagramWithEdges(step: number, pulseOn: (id: string) => boolean) {
  return (
    <>
      {AwsDiagram(step, pulseOn)}
      <Edges edges={AWS_EDGES} lit={(id) => AWS_STEPS[step].litEdges.includes(id)} />
    </>
  )
}

const STEP_SETS: Record<string, Step[]> = { id: ID_STEPS, aws: AWS_STEPS, db: DB_STEPS }

/* ── Page ───────────────────────────────────────────────────────────── */

export default function SwaPage() {
  const { t } = useTranslation()

  return (
    <section className="min-h-screen bg-bg-base px-4 py-16 flex flex-col items-center">

      <div className="w-full max-w-4xl text-center mb-2">
        <span className="badge mb-4">{t('swapage.badge')}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">{t('swapage.title')}</h1>
        <p className="text-text-muted text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {t('swapage.subtitle')}
        </p>
      </div>

      <FlowPanel prefix="id"  steps={ID_STEPS.length}  viewBox="0 0 900 470"
        caption="secure-workload-access · identity issuance">
        {IdentityDiagram}
      </FlowPanel>

      <FlowPanel prefix="aws" steps={AWS_STEPS.length} viewBox="0 0 900 430"
        caption="path a · federated identity · aws">
        {AwsDiagramWithEdges}
      </FlowPanel>

      <FlowPanel prefix="db"  steps={DB_STEPS.length}  viewBox="0 0 900 432"
        caption="path b · secret retrieval · database">
        {DbDiagram}
      </FlowPanel>

      {/* Concept cards */}
      <div className="w-full max-w-5xl mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="section-card">
            <p className="text-sm font-semibold text-text mb-2">{t(`swapage.key${n}_title`)}</p>
            <p className="text-xs text-text-muted leading-relaxed">{t(`swapage.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      {/* Architecture summary */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-text-2 mb-3 uppercase tracking-widest font-mono">
          {t('swapage.arch_title')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <span className="text-conjur-cyan font-mono text-xs font-bold mt-0.5 shrink-0">{String(n).padStart(2, '0')}</span>
              <div>
                <p className="text-xs font-semibold text-text">{t(`swapage.arch${n}_title`)}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t(`swapage.arch${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
