import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause } from 'lucide-react'

type CK = 'cyan' | 'gold' | 'dotnet' | 'spring' | 'eso' | 'slate' | 'green'

const C: Record<CK, { stroke: string; text: string; border: string; bg: string }> = {
  cyan:   { stroke:'#00b4e0', text:'#67e8f9', border:'rgba(0,180,224,0.4)',    bg:'rgba(0,180,224,0.12)'  },
  gold:   { stroke:'#f59e0b', text:'#fcd34d', border:'rgba(245,158,11,0.4)',   bg:'rgba(245,158,11,0.08)' },
  dotnet: { stroke:'#7b5cf6', text:'#c4b5fd', border:'rgba(123,92,246,0.4)',   bg:'rgba(123,92,246,0.12)' },
  spring: { stroke:'#6db33f', text:'#86efac', border:'rgba(109,179,63,0.4)',   bg:'rgba(109,179,63,0.12)' },
  eso:    { stroke:'#f97316', text:'#fdba74', border:'rgba(249,115,22,0.4)',   bg:'rgba(249,115,22,0.12)' },
  slate:  { stroke:'#64748b', text:'#94a3b8', border:'rgba(100,116,139,0.35)', bg:'rgba(15,30,48,0.7)'    },
  green:  { stroke:'#10b981', text:'#6ee7b7', border:'rgba(16,185,129,0.45)', bg:'rgba(16,185,129,0.12)' },
}

type AcctStatus = 'active' | 'inactive'

interface DStep {
  aStatus:   AcctStatus
  bStatus:   AcctStatus
  cpCache:   'A' | 'B' | 'stale'
  litEdges:  string[]
  hiNodes:   string[]
  cpmPulse:  boolean
}

const DSTEPS: DStep[] = [
  { aStatus:'active',   bStatus:'inactive', cpCache:'A',     litEdges:[],                          hiNodes:['vault','acctA','acctB'],               cpmPulse:false },
  { aStatus:'active',   bStatus:'inactive', cpCache:'A',     litEdges:['app-cp','cp-app','cp-A'],  hiNodes:['app','cp','acctA'],                    cpmPulse:false },
  { aStatus:'active',   bStatus:'inactive', cpCache:'A',     litEdges:['cpm-vlt'],                 hiNodes:['cpm','vault'],                         cpmPulse:true  },
  { aStatus:'inactive', bStatus:'active',   cpCache:'stale', litEdges:['cpm-vlt'],                 hiNodes:['cpm','acctA','acctB'],                 cpmPulse:true  },
  { aStatus:'inactive', bStatus:'active',   cpCache:'B',     litEdges:['cp-B'],                    hiNodes:['cp','acctB'],                          cpmPulse:false },
  { aStatus:'inactive', bStatus:'active',   cpCache:'B',     litEdges:['app-cp','cp-app','cp-B'],  hiNodes:['app','cp','acctB'],                    cpmPulse:false },
  { aStatus:'inactive', bStatus:'active',   cpCache:'B',     litEdges:['cpm-vlt','cpm-db'],        hiNodes:['cpm','acctA','db'],                    cpmPulse:true  },
  { aStatus:'inactive', bStatus:'active',   cpCache:'B',     litEdges:['app-cp','cp-app','cp-B'],  hiNodes:['app','cp','acctA','acctB','db','vault'], cpmPulse:false },
]

const EDGES = [
  { id:'app-cp',  d:'M 150,207 L 200,207', ck:'cyan'   as CK, tag:'request', lx:175, ly:200 },
  { id:'cp-app',  d:'M 200,221 L 150,221', ck:'cyan'   as CK, tag:'cred',    lx:175, ly:231 },
  { id:'cp-A',    d:'M 356,184 C 392,184 392,91 428,91', ck:'green'  as CK, tag:null, lx:0, ly:0 },
  { id:'cp-B',    d:'M 356,228 C 392,228 392,225 428,225', ck:'eso'  as CK, tag:null, lx:0, ly:0 },
  { id:'cpm-vlt', d:'M 680,57  L 620,57',  ck:'dotnet' as CK, tag:'manage',  lx:650, ly:50 },
  { id:'cpm-db',  d:'M 761,91  L 761,328', ck:'dotnet' as CK, tag:'reset pw',lx:778, ly:210 },
]

const TOTAL = DSTEPS.length

// ─── helpers ──────────────────────────────────────────────────────────────────

function statusFill(s: AcctStatus) {
  return s === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.1)'
}
function statusStroke(s: AcctStatus) {
  return s === 'active' ? 'rgba(16,185,129,0.5)' : 'rgba(100,116,139,0.3)'
}
function statusTextFill(s: AcctStatus) {
  return s === 'active' ? '#6ee7b7' : '#94a3b8'
}

// ─── component ────────────────────────────────────────────────────────────────

export default function DualAccountsPage() {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [step, setStep]       = useState(0)
  const [playing, setPlaying] = useState(false)

  const go = useCallback((d: 1 | -1) =>
    setStep(s => Math.max(0, Math.min(TOTAL - 1, s + d))), [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft')  go(-1)
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [go])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setStep(s => {
        if (s >= TOTAL - 1) { setPlaying(false); return s }
        return s + 1
      })
    }, 2800)
    return () => clearInterval(id)
  }, [playing])

  const cur = DSTEPS[step]
  const hi  = new Set(cur.hiNodes)
  const lit = new Set(cur.litEdges)
  const isHi = (id: string) => hi.has(id)

  // cache color
  const cacheColor =
    cur.cpCache === 'A' ? C.green.text :
    cur.cpCache === 'B' ? C.eso.text   :
    C.gold.text

  const cacheLabel =
    cur.cpCache === 'A' ? `→ ${t('dual.acct_a')}` :
    cur.cpCache === 'B' ? `→ ${t('dual.acct_b')}` :
    `→ ${t('dual.acct_a')} ${t('dual.cache_stale')}`

  return (
    <section id="dualaccounts" className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* header */}
        <div className="text-center space-y-3">
          <span className="badge bg-conjur-gold/10 text-conjur-gold border border-conjur-gold/20">
            {t('dual.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold">{t('dual.title')}</h1>
          <p className="text-text-muted max-w-2xl mx-auto text-sm">{t('dual.subtitle')}</p>
        </div>

        {/* main card */}
        <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">

          {/* step bar */}
          <div className="border-b border-border px-5 py-3.5 flex items-center gap-4">
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[10px] font-mono text-conjur-gold/60 mb-0.5">
                  {t('dual.step_of', { current: step + 1, total: TOTAL })}
                </p>
                <p className="text-sm font-semibold text-text leading-snug">
                  {t(`dual.s${step + 1}_title`)}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setPlaying(p => !p)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  playing
                    ? 'border-conjur-gold/40 text-conjur-gold'
                    : 'border-border text-text-muted hover:text-conjur-gold hover:border-conjur-gold/40'
                }`}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
              </button>
              <button onClick={() => go(-1)} disabled={step === 0} aria-label="Previous step"
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text hover:border-slate-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={15} aria-hidden="true" />
              </button>
              <button onClick={() => go(1)} disabled={step === TOTAL - 1} aria-label="Next step"
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text hover:border-slate-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={15} aria-hidden="true" />
              </button>
              <button onClick={() => { setStep(0); setPlaying(false) }} aria-label="Restart"
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-conjur-gold hover:border-conjur-gold/40 transition-colors">
                <RotateCcw size={13} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* SVG */}
          <div className="px-4 pt-5 pb-3 overflow-x-auto">
            <svg viewBox="0 0 870 425" style={{ minWidth: 580, width: '100%' }} role="img" aria-label="Dual Account rotation diagram">
              <defs>
                {(Object.keys(C) as CK[]).map(k => (
                  <marker key={k} id={`dah-${k}`} markerWidth="7" markerHeight="7" refX="6.5" refY="3.5" orient="auto">
                    <path d="M 0 1 L 7 3.5 L 0 6 z" fill={C[k].stroke} />
                  </marker>
                ))}
                <filter id="d-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* ── Vault frame ── */}
              <motion.rect x={413} y={14} width={205} height={312} rx={12}
                fill="rgba(245,158,11,0.03)"
                strokeDasharray="5 3"
                strokeWidth={isHi('vault') ? 1.5 : 0.75}
                animate={{ stroke: isHi('vault') ? C.gold.stroke : 'rgba(100,116,139,0.3)', strokeOpacity: isHi('vault') ? 0.7 : 0.35 }}
                transition={{ duration: 0.4 }}
              />
              <text x={425} y={10} fontSize="9" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={C.gold.stroke} fillOpacity={0.65} textAnchor="start">
                {t('dual.node_vault')}
              </text>

              {/* ── Account A ── */}
              <rect x={427} y={36} width={177} height={112} rx={10}
                style={{
                  fill:   isHi('acctA') ? C.green.bg    : 'rgba(12,24,40,0.9)',
                  stroke: isHi('acctA') ? C.green.border : 'rgba(100,116,139,0.25)',
                  strokeWidth: isHi('acctA') ? 1.5 : 0.75,
                  transition: 'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={440} y={58} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={isHi('acctA') ? C.green.text : '#94a3b8'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.acct_a')}
              </text>
              <text x={440} y={74} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={isHi('acctA') ? 'rgba(148,163,184,0.65)' : 'rgba(148,163,184,0.3)'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.user_a')}
              </text>
              {/* Account A status badge */}
              <rect x={440} y={84} width={105} height={20} rx={10}
                style={{
                  fill:   statusFill(cur.aStatus),
                  stroke: statusStroke(cur.aStatus),
                  strokeWidth: 1,
                  transition: 'fill 0.5s ease, stroke 0.5s ease',
                }}
              />
              <AnimatePresence mode="wait">
                <motion.text key={`a-${cur.aStatus}`}
                  x={492} y={98} fontSize="9" fontWeight="700"
                  fontFamily="JetBrains Mono, monospace" textAnchor="middle"
                  fill={statusTextFill(cur.aStatus)}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}>
                  {t(cur.aStatus === 'active' ? 'dual.status_active' : 'dual.status_inactive')}
                </motion.text>
              </AnimatePresence>
              <text x={440} y={126} fontSize="7.5" fontFamily="JetBrains Mono, monospace"
                fill="rgba(148,163,184,0.3)">
                DualAccountStatus
              </text>

              {/* ── Account B ── */}
              <rect x={427} y={170} width={177} height={112} rx={10}
                style={{
                  fill:   isHi('acctB') ? C.eso.bg    : 'rgba(12,24,40,0.9)',
                  stroke: isHi('acctB') ? C.eso.border : 'rgba(100,116,139,0.25)',
                  strokeWidth: isHi('acctB') ? 1.5 : 0.75,
                  transition: 'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={440} y={192} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={isHi('acctB') ? C.eso.text : '#94a3b8'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.acct_b')}
              </text>
              <text x={440} y={208} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={isHi('acctB') ? 'rgba(148,163,184,0.65)' : 'rgba(148,163,184,0.3)'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.user_b')}
              </text>
              {/* Account B status badge */}
              <rect x={440} y={218} width={105} height={20} rx={10}
                style={{
                  fill:   statusFill(cur.bStatus),
                  stroke: statusStroke(cur.bStatus),
                  strokeWidth: 1,
                  transition: 'fill 0.5s ease, stroke 0.5s ease',
                }}
              />
              <AnimatePresence mode="wait">
                <motion.text key={`b-${cur.bStatus}`}
                  x={492} y={232} fontSize="9" fontWeight="700"
                  fontFamily="JetBrains Mono, monospace" textAnchor="middle"
                  fill={statusTextFill(cur.bStatus)}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}>
                  {t(cur.bStatus === 'active' ? 'dual.status_active' : 'dual.status_inactive')}
                </motion.text>
              </AnimatePresence>
              <text x={440} y={260} fontSize="7.5" fontFamily="JetBrains Mono, monospace"
                fill="rgba(148,163,184,0.3)">
                DualAccountStatus
              </text>

              {/* vault footer note */}
              <text x={516} y={308} fontSize="8" fontFamily="Inter, system-ui, sans-serif"
                fill="rgba(148,163,184,0.35)" textAnchor="middle" fontStyle="italic">
                both enabled on target
              </text>

              {/* ── Edges ── */}
              {EDGES.map(e => (
                <g key={e.id}>
                  <motion.path
                    d={e.d} fill="none"
                    stroke={C[e.ck].stroke}
                    strokeWidth={lit.has(e.id) ? 2 : 1}
                    markerEnd={`url(#dah-${e.ck})`}
                    animate={{ opacity: lit.has(e.id) ? 1 : 0.12 }}
                    transition={{ duration: 0.35 }}
                  />
                  {e.tag && e.lx ? (
                    <motion.text x={e.lx} y={e.ly} fontSize="8.5" textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace" fontWeight="500"
                      fill={C[e.ck].stroke}
                      animate={{ opacity: lit.has(e.id) ? 0.9 : 0.12 }}
                      transition={{ duration: 0.35 }}>
                      {e.tag}
                    </motion.text>
                  ) : null}
                </g>
              ))}

              {/* ── App node ── */}
              <rect x={20} y={178} width={130} height={70} rx={10}
                style={{
                  fill:   isHi('app') ? C.cyan.bg    : 'rgba(12,24,40,0.8)',
                  stroke: isHi('app') ? C.cyan.border : 'rgba(100,116,139,0.25)',
                  strokeWidth: isHi('app') ? 1.5 : 0.75,
                  transition: 'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={33} y={202} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={isHi('app') ? C.cyan.text : '#94a3b8'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.node_app')}
              </text>
              <text x={33} y={218} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={isHi('app') ? 'rgba(148,163,184,0.6)' : 'rgba(148,163,184,0.25)'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.node_app_sub')}
              </text>
              <motion.circle cx={132} cy={190} r={4} fill={C.cyan.stroke}
                animate={reduce
                  ? { opacity: isHi('app') ? 1 : 0.15, r: isHi('app') ? 4 : 3 }
                  : isHi('app') ? { opacity:[0.4,1,0.4], r:[3,4.5,3] } : { opacity:0.15, r:3 }}
                transition={{ duration: 2, repeat: reduce ? 0 : Infinity, ease:'easeInOut' }} />

              {/* ── CP node ── */}
              <rect x={200} y={150} width={156} height={126} rx={10}
                style={{
                  fill:   isHi('cp') ? C.gold.bg    : 'rgba(12,24,40,0.8)',
                  stroke: isHi('cp') ? C.gold.border : 'rgba(100,116,139,0.25)',
                  strokeWidth: isHi('cp') ? 1.5 : 0.75,
                  transition: 'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={213} y={172} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={isHi('cp') ? C.gold.text : '#94a3b8'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.node_cp')}
              </text>
              <text x={213} y={188} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={isHi('cp') ? 'rgba(148,163,184,0.6)' : 'rgba(148,163,184,0.25)'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.node_cp_sub')}
              </text>
              <line x1={213} y1={198} x2={343} y2={198} stroke="rgba(148,163,184,0.12)" strokeWidth={1} />
              <text x={213} y={216} fontSize="8" fontFamily="Inter, system-ui, sans-serif"
                fill="rgba(148,163,184,0.45)">
                {t('dual.cache_label')}:
              </text>
              {/* animated cache indicator */}
              <AnimatePresence mode="wait">
                <motion.text key={cur.cpCache}
                  x={213} y={238} fontSize="11" fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                  fill={cacheColor}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}>
                  {cacheLabel}
                </motion.text>
              </AnimatePresence>
              <text x={213} y={263} fontSize="7.5" fontFamily="JetBrains Mono, monospace"
                fill="rgba(148,163,184,0.28)">
                authn-jwt
              </text>

              {/* ── CPM node ── */}
              {cur.cpmPulse && (
                <motion.rect x={672} y={17} width={178} height={82} rx={16}
                  fill="none" stroke={C.dotnet.stroke} strokeWidth={1}
                  animate={reduce ? { strokeOpacity: 0.4 } : { strokeOpacity: [0.15, 0.5, 0.15] }}
                  transition={{ duration: 1.8, repeat: reduce ? 0 : Infinity, ease:'easeInOut' }}
                  filter="url(#d-glow)" />
              )}
              <rect x={680} y={25} width={162} height={66} rx={10}
                style={{
                  fill:   isHi('cpm') ? C.dotnet.bg    : 'rgba(12,24,40,0.8)',
                  stroke: isHi('cpm') ? C.dotnet.border : 'rgba(100,116,139,0.25)',
                  strokeWidth: isHi('cpm') ? 1.5 : 0.75,
                  transition: 'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={693} y={48} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={isHi('cpm') ? C.dotnet.text : '#94a3b8'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.node_cpm')}
              </text>
              <text x={693} y={64} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={isHi('cpm') ? 'rgba(148,163,184,0.6)' : 'rgba(148,163,184,0.25)'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.node_cpm_sub')}
              </text>

              {/* ── DB node ── */}
              <rect x={680} y={328} width={162} height={66} rx={10}
                style={{
                  fill:   isHi('db') ? C.spring.bg    : 'rgba(12,24,40,0.8)',
                  stroke: isHi('db') ? C.spring.border : 'rgba(100,116,139,0.25)',
                  strokeWidth: isHi('db') ? 1.5 : 0.75,
                  transition: 'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={693} y={351} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={isHi('db') ? C.spring.text : '#94a3b8'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.node_db')}
              </text>
              <text x={693} y={367} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={isHi('db') ? 'rgba(148,163,184,0.6)' : 'rgba(148,163,184,0.25)'}
                style={{ transition: 'fill 0.4s ease' }}>
                {t('dual.node_db_sub')}
              </text>
              <text x={693} y={382} fontSize="7.5" fontFamily="Inter, system-ui, sans-serif"
                fill={isHi('db') ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.2)'}
                style={{ transition: 'fill 0.4s ease' }}>
                A + B both enabled
              </text>
            </svg>
          </div>

          {/* description */}
          <div className="px-5 pb-4 pt-1 min-h-[56px]">
            <AnimatePresence mode="wait">
              <motion.p key={step}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.22 }}
                className="text-sm text-text-muted leading-relaxed">
                {t(`dual.s${step + 1}_desc`)}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* progress bar */}
          <div className="h-0.5 bg-bg-base/50 mx-5 mb-4 rounded-full overflow-hidden">
            <motion.div className="h-full w-full rounded-full bg-conjur-gold/50"
              style={{ transformOrigin: 'left' }}
              animate={{ scaleX: (step + 1) / TOTAL }}
              transition={{ duration: 0.35, ease: 'easeOut' }} />
          </div>
        </div>

        {/* key concept cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="section-card space-y-2">
              <h3 className="text-sm font-semibold text-text">{t(`dual.key${n}_title`)}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{t(`dual.key${n}_desc`)}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-muted select-none">{t('dual.keyboard_hint')}</p>
      </div>
    </section>
  )
}
