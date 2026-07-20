import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react'

// ─── color palette ────────────────────────────────────────────────────────────

type CK = 'spring' | 'gold' | 'cyan' | 'slate'

const C: Record<CK, { stroke: string; text: string; border: string; bg: string }> = {
  spring: { stroke: '#6db33f', text: '#86efac', border: 'rgba(109,179,63,0.4)',  bg: 'rgba(109,179,63,0.12)' },
  gold:   { stroke: '#f59e0b', text: '#fcd34d', border: 'rgba(245,158,11,0.4)',  bg: 'rgba(245,158,11,0.08)' },
  cyan:   { stroke: '#00b4e0', text: '#67e8f9', border: 'rgba(0,180,224,0.4)',   bg: 'rgba(0,180,224,0.10)' },
  slate:  { stroke: '#64748b', text: '#94a3b8', border: 'rgba(100,116,139,0.35)', bg: 'rgba(15,30,48,0.7)'  },
}

// ─── layout (ViewBox 0 0 860 490) — Command-Center style, no crossing lines ───
//
// Auth handshake runs across the TOP (auth ↑ / token ↓ over K8s API);
// secret consumption runs across the BOTTOM (read → vault, secrets ← vault,
// connect → MySQL down the left gutter). Two hubs (App Pod, Secrets Manager)
// with all edges routed so none cross or overlap another node.
//
//   Kubernetes Cluster (x=8..564, y=8..380)          Conjur Cloud · SaaS (x=616..848)
//   ┌ App Pod ┐   [K8s API]                            [ Secrets Manager ]
//   │container │                                        (authn-jwt)
//   │  jwt     │   [Secrets Vault]
//   └──────────┘
//   ─ external ─   [MySQL]  (bottom-left, under the pod)

interface N {
  id: string; x: number; y: number; w: number; h: number
  label: string; sub: string; ck: CK; feat?: boolean; external?: boolean
}
interface E {
  id: string; d: string; ck: CK; tag?: string; lx?: number; ly?: number
}

const NODES: N[] = [
  // ── App Pod (inside Kubernetes cluster) ────────────────────────────────────
  { id:'container', x:40,  y:64,  w:216, h:58,  label:'App Container',       sub:'Spring Boot · .NET · ESO',              ck:'cyan'             },
  { id:'jwt',       x:40,  y:156, w:216, h:58,  label:'Service Account JWT', sub:'/var/run/secrets/tokens/jwt',           ck:'gold'             },
  // ── K8s API Server (inside cluster, upper-middle) ──────────────────────────
  { id:'k8sapi',    x:340, y:118, w:176, h:56,  label:'K8s API Server',      sub:'JWT validation',                        ck:'slate'            },
  // ── Conjur Cloud SaaS (outside cluster, right) ─────────────────────────────
  { id:'sm',        x:636, y:74,  w:196, h:104, label:'Secrets Manager',     sub:'latamlab.secretsmgr.cyberark.cloud',    ck:'gold', feat:true   },
  // ── Secrets Vault (inside cluster, lower-middle) ───────────────────────────
  { id:'vault',     x:336, y:298, w:180, h:56,  label:'Secrets Vault',       sub:'data/vault/dev-demo-aslan/…',           ck:'cyan'             },
  // ── External database (bottom-left, below the pod) ─────────────────────────
  { id:'mysql',     x:40,  y:406, w:216, h:60,  label:'MySQL Database',      sub:'mysql.demo.local',                        ck:'spring', external:true },
]

const EDGES: E[] = [
  // Step 1 — K8s projects a short-lived JWT into the pod filesystem (vertical)
  { id:'jwt-proj', d:'M 148,122 L 148,156',                              ck:'gold',   tag:'projected', lx:178, ly:142 },
  // Step 2 — App sends JWT to Secrets Manager to authenticate (TOP lane, over K8s API)
  { id:'auth-sm',  d:'M 256,80 C 420,44 500,58 636,96',                  ck:'gold',   tag:'JWT',       lx:432, ly:48  },
  // Step 3a — SM forwards JWT to K8s API Server for validation (short, local)
  { id:'sm-k8',    d:'M 636,138 C 590,146 560,146 516,146',              ck:'gold',   tag:'verify',    lx:574, ly:134 },
  // Step 3b — K8s API Server confirms the workload identity (short, below verify)
  { id:'k8-sm',    d:'M 516,158 C 560,160 590,160 636,156',              ck:'slate',  tag:'✓ ok',      lx:574, ly:172 },
  // Step 3c — SM returns a short-lived API token to the app (TOP lane, below auth)
  { id:'sm-app',   d:'M 636,110 C 500,82 420,74 256,100',                ck:'cyan',   tag:'API token', lx:432, ly:78  },
  // Step 4 — Secrets Vault surfaces credentials to Secrets Manager (Vault → SM)
  { id:'sm-vt',    d:'M 516,322 C 596,318 612,240 636,168',              ck:'cyan',   tag:'secrets',   lx:588, ly:252 },
  // Step 5 — App Container reads secret values directly from Secrets Vault (drop, right of pod)
  { id:'app-vt',   d:'M 256,106 C 318,150 318,272 352,300',             ck:'cyan',   tag:'read',      lx:326, ly:214 },
  // Step 6 — App connects to MySQL using retrieved credentials (left gutter → external)
  { id:'app-db',   d:'M 92,122 C 24,260 24,406 148,406',                ck:'spring', tag:'connect',   lx:66,  ly:300 },
]

// ─── step definitions (7 steps matching architecture.flow) ───────────────────

const RAW: { nodes: string[]; edges: string[]; hi: string[] }[] = [
  // s1 — Kubernetes projects JWT into the App Pod filesystem
  { nodes:['container','jwt'], edges:['jwt-proj'],              hi:['container','jwt','jwt-proj']                              },
  // s2 — App authenticates with Secrets Manager using the JWT
  { nodes:['sm'],              edges:['auth-sm'],               hi:['container','jwt','auth-sm','sm']                          },
  // s3 — SM verifies identity with K8s API; returns API token to app
  { nodes:['k8sapi'],          edges:['sm-k8','k8-sm','sm-app'],hi:['sm','k8sapi','sm-k8','k8-sm','sm-app','container']        },
  // s4 — Secrets Vault provides credentials to Secrets Manager (Vault → SM)
  { nodes:['vault'],           edges:['sm-vt'],                 hi:['sm','vault','sm-vt']                                      },
  // s5 (new) — App Container reads secret values directly from Secrets Vault
  { nodes:[],                  edges:['app-vt'],                hi:['container','vault','app-vt']                              },
  // s6 — App Container connects to MySQL with retrieved credentials
  { nodes:['mysql'],           edges:['app-db'],                hi:['container','mysql','app-db']                              },
  // s7 — All visible; credentials cached in memory, auto-refreshed
  { nodes:[],                  edges:[],                        hi:['container','jwt','jwt-proj','auth-sm','sm','sm-k8','k8-sm','k8sapi','sm-app','sm-vt','vault','app-vt','app-db','mysql'] },
]

const CUM = RAW.reduce<{ nodes: Set<string>; edges: Set<string> }[]>((acc, s) => {
  const prev = acc[acc.length - 1] ?? { nodes: new Set<string>(), edges: new Set<string>() }
  acc.push({ nodes: new Set([...prev.nodes, ...s.nodes]), edges: new Set([...prev.edges, ...s.edges]) })
  return acc
}, [])

const TOTAL  = RAW.length
const AUTO_MS = 4000

// ─── component ────────────────────────────────────────────────────────────────

export default function ArchitectureDiagram() {
  const { t } = useTranslation()
  const [step, setStep]       = useState(0)
  const [playing, setPlaying] = useState(false)   // start paused — presenter controls the flow
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((d: 1 | -1) =>
    setStep(s => Math.max(0, Math.min(TOTAL - 1, s + d))), [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { go(1);  setPlaying(false) }
      if (e.key === 'ArrowLeft')  { go(-1); setPlaying(false) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [go])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!playing) return
    timerRef.current = setInterval(() => {
      setStep(s => {
        if (s >= TOTAL - 1) { setPlaying(false); return s }
        return s + 1
      })
    }, AUTO_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [playing])

  const vis    = CUM[step]
  const hi     = new Set(RAW[step].hi)
  const isLast = step === TOTAL - 1

  const titles = t('architecture.step_titles', { returnObjects: true }) as string[]
  const descs  = t('architecture.flow',        { returnObjects: true }) as string[]

  const handlePlayPause = () => {
    if (playing) {
      setPlaying(false)
    } else {
      if (step >= TOTAL - 1) setStep(0)
      setPlaying(true)
    }
  }

  return (
    <section id="architecture" className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* ── header ── */}
        <div className="text-center space-y-3">
          <span className="badge bg-conjur-gold/10 text-conjur-gold border border-conjur-gold/20">
            {t('architecture.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">{t('architecture.title')}</h2>
        </div>

        {/* ── card ── */}
        <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">

          {/* step header */}
          <div className="border-b border-border px-5 py-3.5 flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[10px] font-mono text-conjur-gold/60 mb-0.5">
                  {t('architecture.step_of', { current: step + 1, total: TOTAL })}
                </p>
                <p className="text-sm font-semibold text-text leading-snug">
                  {titles[step]}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={handlePlayPause}
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-conjur-gold hover:border-conjur-gold/40 transition-colors"
                aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button onClick={() => { go(-1); setPlaying(false) }} disabled={step === 0}
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text hover:border-slate-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous step">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => { go(1); setPlaying(false) }} disabled={step === TOTAL - 1}
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text hover:border-slate-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Next step">
                <ChevronRight size={15} />
              </button>
              <button onClick={() => { setStep(0); setPlaying(true) }}
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-conjur-gold hover:border-conjur-gold/40 transition-colors"
                aria-label="Restart" title="Restart">
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* progress dots */}
          <div className="flex items-center justify-center gap-2 pt-3 pb-1">
            {Array.from({ length: TOTAL }, (_, i) => (
              <button key={i} onClick={() => { setStep(i); setPlaying(false) }}
                aria-label={`Step ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === step ? 22 : 6,
                  height:     6,
                  background: i === step  ? '#f59e0b'
                            : i < step   ? 'rgba(245,158,11,0.35)'
                            :              'rgba(100,116,139,0.3)',
                }}
              />
            ))}
          </div>

          {/* ── SVG diagram ── */}
          <div className="overflow-x-auto rounded-xl border border-border bg-[#050d1a] p-4">
            <svg viewBox="0 0 860 490" style={{ minWidth: 560, width: '100%' }}
              role="img" aria-label={t('architecture.badge')}>
              <defs>
                {(Object.keys(C) as CK[]).map(k => (
                  <marker key={k} id={`arch-${k}`}
                    markerWidth="7" markerHeight="7" refX="6.5" refY="3.5" orient="auto">
                    <path d="M 0 1 L 7 3.5 L 0 6 z" fill={C[k].stroke} />
                  </marker>
                ))}
                <filter id="arch-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* ══ Kubernetes Cluster boundary (App Pod + K8s API + Vault inside) ══ */}
              <rect x="8" y="8" width="556" height="372" rx="14"
                fill="rgba(9,18,32,0.5)" stroke="rgba(100,116,139,0.25)"
                strokeWidth="1.5" strokeDasharray="8 5" />
              <text x="24" y="26" fontSize="10" fill="rgba(100,116,139,0.5)"
                fontFamily="JetBrains Mono, monospace" fontWeight="600" letterSpacing="0.3">
                Kubernetes Cluster
              </text>

              {/* ── App Pod boundary — appears with container ── */}
              <motion.rect x="24" y="48" width="248" height="192" rx="10"
                fill="rgba(0,180,224,0.03)" stroke="rgba(0,180,224,0.2)"
                strokeWidth="1" strokeDasharray="5 4"
                initial={{ opacity: 0 }}
                animate={{ opacity: vis.nodes.has('container') ? 1 : 0 }}
                transition={{ duration: 0.4 }} />
              <motion.text x="36" y="62" fontSize="9" fill="rgba(0,180,224,0.4)"
                fontFamily="JetBrains Mono, monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: vis.nodes.has('container') ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}>
                App Pod
              </motion.text>

              {/* ══ Conjur Cloud SaaS boundary (SM only — outside cluster) ════════════ */}
              <motion.rect x="616" y="44" width="232" height="154" rx="14"
                fill="rgba(245,158,11,0.025)" stroke="rgba(245,158,11,0.22)"
                strokeWidth="1" strokeDasharray="6 4"
                initial={{ opacity: 0 }}
                animate={{ opacity: vis.nodes.has('sm') ? 1 : 0 }}
                transition={{ duration: 0.5 }} />
              <motion.text x="632" y="60" fontSize="9" fill="rgba(245,158,11,0.45)"
                fontFamily="JetBrains Mono, monospace" fontWeight="600"
                initial={{ opacity: 0 }}
                animate={{ opacity: vis.nodes.has('sm') ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}>
                Conjur Cloud · SaaS
              </motion.text>

              {/* ══ External zone separator & label ══════════════════════════════════ */}
              <motion.line x1="8" y1="388" x2="852" y2="388"
                stroke="rgba(100,116,139,0.18)" strokeWidth="1" strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                animate={{ opacity: vis.nodes.has('mysql') ? 1 : 0 }}
                transition={{ duration: 0.5 }} />
              <motion.text x="288" y="404" fontSize="9" fill="rgba(100,116,139,0.38)"
                fontFamily="JetBrains Mono, monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: vis.nodes.has('mysql') ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}>
                external · outside cluster
              </motion.text>

              {/* ══ Edges ════════════════════════════════════════════════════════════ */}
              {EDGES.map(e => {
                const show   = vis.edges.has(e.id)
                const active = hi.has(e.id) || isLast
                return (
                  <g key={e.id}>
                    <motion.path d={e.d}
                      stroke={C[e.ck].stroke} strokeWidth={active ? 2.2 : 1.5}
                      fill="none" markerEnd={`url(#arch-${e.ck})`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: show ? 1 : 0, opacity: show ? (active ? 1 : 0.18) : 0 }}
                      transition={{ duration: 0.7, ease: 'easeInOut' }} />
                    {e.tag != null && (
                      <motion.text x={e.lx} y={e.ly} fill={C[e.ck].stroke}
                        fontSize="9" textAnchor="middle"
                        fontFamily="JetBrains Mono, monospace" fontWeight="500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: show ? (active ? 0.9 : 0.2) : 0 }}
                        transition={{ delay: show ? 0.5 : 0, duration: 0.3 }}>
                        {e.tag}
                      </motion.text>
                    )}
                  </g>
                )
              })}

              {/* ══ Nodes ════════════════════════════════════════════════════════════ */}
              {NODES.map(n => {
                const show   = vis.nodes.has(n.id)
                const active = hi.has(n.id) || isLast
                const c      = C[n.ck]

                return (
                  <motion.g key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: show ? 1 : 0, y: show ? 0 : 10 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}>

                    {/* glow ring on Secrets Manager when active */}
                    {n.feat && active && (
                      <motion.rect x={n.x - 7} y={n.y - 7}
                        width={n.w + 14} height={n.h + 14} rx="17"
                        fill="none" stroke={c.stroke} strokeWidth="1"
                        filter="url(#arch-glow)"
                        animate={{ strokeOpacity: [0.15, 0.55, 0.15] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
                    )}

                    {/* card */}
                    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10"
                      fill={active ? c.bg : 'rgba(10,20,36,0.8)'}
                      stroke={c.border}
                      strokeWidth={active ? 1.5 : 0.75}
                      strokeOpacity={active ? 1 : 0.28} />

                    {/* "external" badge on MySQL */}
                    {n.external && (
                      <>
                        <rect x={n.x + n.w - 62} y={n.y + 6} width={54} height={14} rx="4"
                          fill="rgba(109,179,63,0.12)" stroke="rgba(109,179,63,0.35)" strokeWidth="0.75" />
                        <text x={n.x + n.w - 35} y={n.y + 17} fontSize="7.5" textAnchor="middle"
                          fill="#6db33f" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                          external
                        </text>
                      </>
                    )}

                    {/* primary label */}
                    <text x={n.x + 14} y={n.y + (n.feat ? 26 : 24)}
                      fill={active ? c.text : 'rgba(148,163,184,0.3)'}
                      fontSize={n.feat ? 12 : 11} fontWeight="600"
                      fontFamily="Inter, system-ui, sans-serif">
                      {n.label}
                    </text>

                    {/* sub label */}
                    <text x={n.x + 14} y={n.y + (n.feat ? 46 : 40)}
                      fill={active ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.15)'}
                      fontSize="8" fontFamily="JetBrains Mono, monospace">
                      {n.sub}
                    </text>

                    {/* authn-jwt tag inside Secrets Manager */}
                    {n.feat && (
                      <motion.g initial={{ opacity: 0 }}
                        animate={{ opacity: show ? (active ? 1 : 0.3) : 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}>
                        <rect x={n.x + 14} y={n.y + 60} width={74} height={16} rx="4"
                          fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.3)" strokeWidth="0.75" />
                        <text x={n.x + 51} y={n.y + 72} fontSize="8.5" textAnchor="middle"
                          fill="#fcd34d" fontFamily="JetBrains Mono, monospace" fontWeight="500">
                          authn-jwt
                        </text>
                      </motion.g>
                    )}

                    {/* live pulse dot on Secrets Manager */}
                    {n.feat && (
                      <motion.circle cx={n.x + n.w - 16} cy={n.y + 16} r="4" fill={c.stroke}
                        animate={active
                          ? { opacity: [0.4, 1, 0.4], r: [3, 4.5, 3] }
                          : { opacity: 0.15, r: 3 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                    )}

                    {/* "short-lived" tag on JWT node */}
                    {n.id === 'jwt' && (
                      <motion.g initial={{ opacity: 0 }}
                        animate={{ opacity: show ? (active ? 0.9 : 0.25) : 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}>
                        <rect x={n.x + n.w - 74} y={n.y + n.h - 20}
                          width={66} height={14} rx="4"
                          fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.28)" strokeWidth="0.75" />
                        <text x={n.x + n.w - 41} y={n.y + n.h - 9}
                          fontSize="7.5" textAnchor="middle"
                          fill="#fcd34d" fontFamily="JetBrains Mono, monospace" fontWeight="500">
                          short-lived
                        </text>
                      </motion.g>
                    )}

                    {/* "cached ✓" badge on App Container at step 6 */}
                    {n.id === 'container' && isLast && (
                      <motion.g initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}>
                        <rect x={n.x + n.w - 66} y={n.y + n.h - 20}
                          width={58} height={14} rx="4"
                          fill="rgba(0,180,224,0.15)" stroke="rgba(0,180,224,0.4)" strokeWidth="0.75" />
                        <text x={n.x + n.w - 37} y={n.y + n.h - 9}
                          fontSize="7.5" textAnchor="middle"
                          fill="#67e8f9" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                          cached ✓
                        </text>
                      </motion.g>
                    )}
                  </motion.g>
                )
              })}

              {/* ── step counter bubble (top-right) ── */}
              <motion.g key={`bubble-${step}`}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 22 }}>
                <circle cx="832" cy="26" r="14"
                  fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" strokeWidth="1" />
                <text x="832" y="31" textAnchor="middle" fontSize="12" fontWeight="700"
                  fill="#fcd34d" fontFamily="Inter, system-ui, sans-serif">
                  {step + 1}
                </text>
              </motion.g>
            </svg>
          </div>

          {/* ── step description ── */}
          <div className="border-t border-border/50 px-5 pb-2 pt-3 min-h-[64px]">
            <AnimatePresence mode="wait">
              <motion.p key={step}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                className="text-sm text-text-2 leading-relaxed">
                {descs[step]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* ── progress bar ── */}
          <div className="mx-5 mb-4 mt-3 h-0.5 bg-bg-base/60 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-conjur-gold/60"
              animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }} />
          </div>
        </div>

        {/* keyboard hint */}
        <p className="text-center text-xs text-text-muted select-none">
          {t('architecture.keyboard_hint')}
        </p>
      </div>
    </section>
  )
}
