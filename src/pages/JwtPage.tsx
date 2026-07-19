import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause } from 'lucide-react'

type CK = 'cyan' | 'gold' | 'dotnet' | 'spring' | 'eso' | 'slate' | 'green' | 'gh'

const C: Record<CK, { stroke: string; text: string; border: string; bg: string }> = {
  cyan:   { stroke:'#00b4e0', text:'#67e8f9', border:'rgba(0,180,224,0.4)',    bg:'rgba(0,180,224,0.12)'  },
  gold:   { stroke:'#f59e0b', text:'#fcd34d', border:'rgba(245,158,11,0.4)',   bg:'rgba(245,158,11,0.08)' },
  dotnet: { stroke:'#7b5cf6', text:'#c4b5fd', border:'rgba(123,92,246,0.4)',   bg:'rgba(123,92,246,0.12)' },
  spring: { stroke:'#6db33f', text:'#86efac', border:'rgba(109,179,63,0.4)',   bg:'rgba(109,179,63,0.12)' },
  eso:    { stroke:'#f97316', text:'#fdba74', border:'rgba(249,115,22,0.4)',   bg:'rgba(249,115,22,0.12)' },
  slate:  { stroke:'#64748b', text:'#94a3b8', border:'rgba(100,116,139,0.35)', bg:'rgba(15,30,48,0.7)'    },
  green:  { stroke:'#10b981', text:'#6ee7b7', border:'rgba(16,185,129,0.45)', bg:'rgba(16,185,129,0.12)' },
  gh:     { stroke:'#1f6feb', text:'#60a5fa', border:'rgba(31,111,235,0.4)',   bg:'rgba(31,111,235,0.12)' },
}

interface JStep {
  litEdges:    string[]
  hiNodes:     string[]
  validatorHi: boolean
  policyHi:    boolean
  showJwt:     boolean
}

const JSTEPS: JStep[] = [
  // 0 – overview
  { litEdges:[],                          hiNodes:['pod','k8s','conjur','vault'], validatorHi:false, policyHi:false, showJwt:false },
  // 1 – K8s projects JWT into pod
  { litEdges:['k8s-pod'],                 hiNodes:['k8s','pod'],                 validatorHi:false, policyHi:false, showJwt:true  },
  // 2 – workload POSTs JWT
  { litEdges:['pod-conjur'],              hiNodes:['pod','conjur'],              validatorHi:false, policyHi:false, showJwt:true  },
  // 3 – Conjur fetches JWKS
  { litEdges:['conjur-k8s','k8s-conjur'], hiNodes:['k8s','conjur'],             validatorHi:true,  policyHi:false, showJwt:true  },
  // 4 – signature + standard claims verified
  { litEdges:['k8s-conjur'],             hiNodes:['conjur'],                    validatorHi:true,  policyHi:false, showJwt:true  },
  // 5 – identity resolved via annotations
  { litEdges:[],                          hiNodes:['conjur'],                    validatorHi:false, policyHi:true,  showJwt:true  },
  // 6 – API token issued
  { litEdges:['conjur-pod'],             hiNodes:['conjur','pod'],              validatorHi:false, policyHi:false, showJwt:true  },
  // 7 – secrets fetched
  { litEdges:['conjur-vlt','vlt-pod'],   hiNodes:['conjur','vault','pod'],      validatorHi:false, policyHi:false, showJwt:true  },
]

const EDGES = [
  { id:'k8s-pod',    d:'M 295,90  C 295,145 87,145 87,188',       ck:'gh'    as CK, tag:'JWT',        lx:145, ly:145 },
  { id:'pod-conjur', d:'M 155,216 L 420,216',                      ck:'cyan'  as CK, tag:'POST jwt',   lx:287, ly:209 },
  { id:'conjur-pod', d:'M 420,230 L 155,230',                      ck:'gold'  as CK, tag:'api-token',  lx:287, ly:242 },
  { id:'conjur-k8s', d:'M 420,75  C 398,75  398,55 375,55',        ck:'dotnet'as CK, tag:'JWKS req',  lx:390, ly:58  },
  { id:'k8s-conjur', d:'M 375,68  C 398,68  398,92 420,92',        ck:'green' as CK, tag:'pub keys',  lx:390, ly:88  },
  { id:'conjur-vlt', d:'M 630,216 L 690,216',                      ck:'gold'  as CK, tag:'authorize', lx:660, ly:209 },
  { id:'vlt-pod',    d:'M 690,234 C 690,305 155,305 155,234',      ck:'spring'as CK, tag:'secret',    lx:420, ly:305 },
]

const TOTAL = JSTEPS.length

export default function JwtPage() {
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

  const cur = JSTEPS[step]
  const hi  = new Set(cur.hiNodes)
  const lit = new Set(cur.litEdges)
  const isHi = (id: string) => hi.has(id)

  const nodeFill   = (ck: CK, active: boolean) => active ? C[ck].bg    : 'rgba(12,24,40,0.8)'
  const nodeStroke = (ck: CK, active: boolean) => active ? C[ck].border : 'rgba(100,116,139,0.25)'
  const nodeText   = (ck: CK, active: boolean) => active ? C[ck].text   : '#94a3b8'
  const nodeSub    = (active: boolean)          => active ? 'rgba(148,163,184,0.6)' : 'rgba(148,163,184,0.25)'

  return (
    <section id="jwt" className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* header */}
        <div className="text-center space-y-3">
          <span className="badge bg-gh/10 text-blue-400 border border-gh/30">
            {t('jwt.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold">{t('jwt.title')}</h1>
          <p className="text-text-muted max-w-2xl mx-auto text-sm">{t('jwt.subtitle')}</p>
        </div>

        {/* main card */}
        <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">

          {/* step bar */}
          <div className="border-b border-border px-5 py-3.5 flex items-center gap-4">
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-6 }} transition={{ duration:0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[10px] font-mono text-blue-400/60 mb-0.5">
                  {t('jwt.step_of', { current: step + 1, total: TOTAL })}
                </p>
                <p className="text-sm font-semibold text-text leading-snug">
                  {t(`jwt.s${step + 1}_title`)}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}
                className={`p-1.5 rounded-lg border transition-colors ${playing
                  ? 'border-blue-400/40 text-blue-400'
                  : 'border-border text-text-muted hover:text-blue-400 hover:border-blue-400/40'
                }`}>
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
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-blue-400 hover:border-blue-400/40 transition-colors">
                <RotateCcw size={13} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* SVG diagram */}
          <div className="px-4 pt-5 pb-3 overflow-x-auto">
            <svg viewBox="0 0 870 400" style={{ minWidth:580, width:'100%' }} role="img" aria-label="JWT authentication flow diagram">
              <defs>
                {(Object.keys(C) as CK[]).map(k => (
                  <marker key={k} id={`jah-${k}`} markerWidth="7" markerHeight="7" refX="6.5" refY="3.5" orient="auto">
                    <path d="M 0 1 L 7 3.5 L 0 6 z" fill={C[k].stroke} />
                  </marker>
                ))}
                <filter id="j-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* ── Conjur frame (featured, always shown) ── */}
              {isHi('conjur') && (
                <motion.rect x={412} y={7} width={226} height={286} rx={16}
                  fill="none" stroke={C.gold.stroke} strokeWidth={1}
                  animate={reduce ? { strokeOpacity:0.4 } : { strokeOpacity:[0.2,0.5,0.2] }}
                  transition={{ duration:2.4, repeat: reduce ? 0 : Infinity, ease:'easeInOut' }}
                  filter="url(#j-glow)" />
              )}
              <rect x={420} y={15} width={210} height={270} rx={12}
                style={{
                  fill:   'rgba(245,158,11,0.04)',
                  stroke: isHi('conjur') ? C.gold.stroke : 'rgba(100,116,139,0.25)',
                  strokeWidth: isHi('conjur') ? 1.5 : 0.75,
                  transition:'stroke 0.4s ease',
                }}
                strokeDasharray="5 3"
              />
              <text x={433} y={10} fontSize="9" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={C.gold.stroke} fillOpacity={0.65}>
                {t('jwt.node_conjur')}
              </text>
              <text x={433} y={48} fontSize="10" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={isHi('conjur') ? C.gold.text : '#94a3b8'}
                style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_conjur')}
              </text>
              <text x={433} y={63} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={nodeSub(isHi('conjur'))}
                style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_conjur_sub')}
              </text>
              {/* pulse dot */}
              <motion.circle cx={614} cy={30} r={4} fill={C.gold.stroke}
                animate={reduce
                  ? { opacity: isHi('conjur') ? 1 : 0.15, r: isHi('conjur') ? 4 : 3 }
                  : isHi('conjur') ? { opacity:[0.4,1,0.4], r:[3,4.5,3] } : { opacity:0.15, r:3 }}
                transition={{ duration:2, repeat: reduce ? 0 : Infinity, ease:'easeInOut' }} />

              {/* ── Validator sub-box ── */}
              <rect x={435} y={75} width={180} height={82} rx={8}
                style={{
                  fill:   cur.validatorHi ? C.green.bg  : 'rgba(8,18,32,0.7)',
                  stroke: cur.validatorHi ? C.green.border : 'rgba(100,116,139,0.2)',
                  strokeWidth: cur.validatorHi ? 1.5 : 0.75,
                  transition:'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={447} y={96} fontSize="10" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={cur.validatorHi ? C.green.text : '#64748b'}
                style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_validator')}
              </text>
              <text x={447} y={111} fontSize="8" fontFamily="JetBrains Mono, monospace"
                fill={cur.validatorHi ? 'rgba(148,163,184,0.65)' : 'rgba(148,163,184,0.25)'}
                style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_validator_sub')}
              </text>
              {/* validator detail when active */}
              <AnimatePresence>
                {cur.validatorHi && (
                  <motion.g initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
                    <text x={447} y={128} fontSize="8" fontFamily="JetBrains Mono, monospace" fill={C.green.stroke}>
                      ✓ exp · iss · aud · sig
                    </text>
                    <text x={447} y={143} fontSize="7.5" fontFamily="JetBrains Mono, monospace" fill="rgba(110,231,183,0.5)">
                      RSA-256 verify
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>

              {/* ── Policy sub-box ── */}
              <rect x={435} y={173} width={180} height={82} rx={8}
                style={{
                  fill:   cur.policyHi ? C.dotnet.bg  : 'rgba(8,18,32,0.7)',
                  stroke: cur.policyHi ? C.dotnet.border : 'rgba(100,116,139,0.2)',
                  strokeWidth: cur.policyHi ? 1.5 : 0.75,
                  transition:'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={447} y={194} fontSize="10" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={cur.policyHi ? C.dotnet.text : '#64748b'}
                style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_policy')}
              </text>
              <text x={447} y={209} fontSize="8" fontFamily="JetBrains Mono, monospace"
                fill={cur.policyHi ? 'rgba(148,163,184,0.65)' : 'rgba(148,163,184,0.25)'}
                style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_policy_sub')}
              </text>
              <AnimatePresence>
                {cur.policyHi && (
                  <motion.g initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
                    <text x={447} y={226} fontSize="7.5" fontFamily="JetBrains Mono, monospace" fill={C.dotnet.text}>
                      namespace: conjur ✓
                    </text>
                    <text x={447} y={240} fontSize="7.5" fontFamily="JetBrains Mono, monospace" fill={C.dotnet.text}>
                      service-account: app ✓
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>

              {/* ── Edges ── */}
              {EDGES.map(e => (
                <g key={e.id}>
                  <motion.path d={e.d} fill="none"
                    stroke={C[e.ck].stroke}
                    strokeWidth={lit.has(e.id) ? 2 : 1}
                    markerEnd={`url(#jah-${e.ck})`}
                    animate={{ opacity: lit.has(e.id) ? 1 : 0.12 }}
                    transition={{ duration:0.35 }}
                  />
                  {e.tag && e.lx ? (
                    <motion.text x={e.lx} y={e.ly} fontSize="8.5" textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace" fontWeight="500"
                      fill={C[e.ck].stroke}
                      animate={{ opacity: lit.has(e.id) ? 0.9 : 0.12 }}
                      transition={{ duration:0.35 }}>
                      {e.tag}
                    </motion.text>
                  ) : null}
                </g>
              ))}

              {/* ── Pod node ── */}
              <rect x={20} y={188} width={135} height={70} rx={10}
                style={{
                  fill:   nodeFill('cyan', isHi('pod')),
                  stroke: nodeStroke('cyan', isHi('pod')),
                  strokeWidth: isHi('pod') ? 1.5 : 0.75,
                  transition:'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={33} y={211} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={nodeText('cyan', isHi('pod'))} style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_pod')}
              </text>
              <text x={33} y={226} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={nodeSub(isHi('pod'))} style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_pod_sub')}
              </text>
              {/* JWT anatomy bars — appear from step 1 onward */}
              <AnimatePresence>
                {cur.showJwt && (
                  <motion.g initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.4 }}>
                    {/* header */}
                    <rect x={33}  y={238} width={28} height={10} rx={3} fill={C.cyan.stroke}   fillOpacity={0.7} />
                    {/* payload */}
                    <rect x={64}  y={238} width={38} height={10} rx={3} fill={C.gold.stroke}   fillOpacity={0.7} />
                    {/* signature */}
                    <rect x={105} y={238} width={28} height={10} rx={3} fill={C.dotnet.stroke} fillOpacity={0.7} />
                    <text x={33}  y={247} fontSize="6" fontFamily="JetBrains Mono, monospace" fill="rgba(0,0,0,0.7)">H</text>
                    <text x={76}  y={247} fontSize="6" fontFamily="JetBrains Mono, monospace" fill="rgba(0,0,0,0.7)" textAnchor="middle">P</text>
                    <text x={119} y={247} fontSize="6" fontFamily="JetBrains Mono, monospace" fill="rgba(0,0,0,0.7)" textAnchor="middle">S</text>
                  </motion.g>
                )}
              </AnimatePresence>
              <motion.circle cx={137} cy={200} r={4} fill={C.cyan.stroke}
                animate={reduce
                  ? { opacity: isHi('pod') ? 1 : 0.15, r: isHi('pod') ? 4 : 3 }
                  : isHi('pod') ? { opacity:[0.4,1,0.4], r:[3,4.5,3] } : { opacity:0.15, r:3 }}
                transition={{ duration:2, repeat: reduce ? 0 : Infinity, ease:'easeInOut' }} />

              {/* ── K8s API node ── */}
              <rect x={215} y={20} width={160} height={70} rx={10}
                style={{
                  fill:   nodeFill('gh', isHi('k8s')),
                  stroke: nodeStroke('gh', isHi('k8s')),
                  strokeWidth: isHi('k8s') ? 1.5 : 0.75,
                  transition:'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={228} y={44} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={nodeText('gh', isHi('k8s'))} style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_k8s')}
              </text>
              <text x={228} y={60} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={nodeSub(isHi('k8s'))} style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_k8s_sub')}
              </text>
              {/* JWKS indicator when k8s-conjur lit */}
              <AnimatePresence>
                {lit.has('k8s-conjur') && (
                  <motion.text x={228} y={78} fontSize="8" fontFamily="JetBrains Mono, monospace"
                    fill={C.green.text}
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    transition={{ duration:0.3 }}>
                    /.well-known/jwks.json
                  </motion.text>
                )}
              </AnimatePresence>

              {/* ── Vault node ── */}
              <rect x={690} y={188} width={155} height={70} rx={10}
                style={{
                  fill:   nodeFill('spring', isHi('vault')),
                  stroke: nodeStroke('spring', isHi('vault')),
                  strokeWidth: isHi('vault') ? 1.5 : 0.75,
                  transition:'fill 0.4s ease, stroke 0.4s ease',
                }}
              />
              <text x={703} y={211} fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
                fill={nodeText('spring', isHi('vault'))} style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_vault')}
              </text>
              <text x={703} y={226} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                fill={nodeSub(isHi('vault'))} style={{ transition:'fill 0.4s ease' }}>
                {t('jwt.node_vault_sub')}
              </text>
              <AnimatePresence>
                {lit.has('vlt-pod') && (
                  <motion.text x={703} y={244} fontSize="8" fontFamily="JetBrains Mono, monospace"
                    fill={C.spring.text}
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    transition={{ duration:0.3 }}>
                    GET /api/secrets/…
                  </motion.text>
                )}
              </AnimatePresence>

              {/* legend: JWT anatomy */}
              <text x={20} y={335} fontSize="8" fontFamily="JetBrains Mono, monospace" fill="rgba(148,163,184,0.35)">
                JWT:
              </text>
              <rect x={48} y={325} width={22} height={10} rx={3} fill={C.cyan.stroke}   fillOpacity={0.4} />
              <text x={49} y={334} fontSize="7" fontFamily="JetBrains Mono, monospace" fill="rgba(148,163,184,0.5)">H</text>
              <rect x={73} y={325} width={32} height={10} rx={3} fill={C.gold.stroke}   fillOpacity={0.4} />
              <text x={74} y={334} fontSize="7" fontFamily="JetBrains Mono, monospace" fill="rgba(148,163,184,0.5)">Payload</text>
              <rect x={108} y={325} width={22} height={10} rx={3} fill={C.dotnet.stroke} fillOpacity={0.4} />
              <text x={109} y={334} fontSize="7" fontFamily="JetBrains Mono, monospace" fill="rgba(148,163,184,0.5)">Sig</text>
            </svg>
          </div>

          {/* description */}
          <div className="px-5 pb-4 pt-1 min-h-[56px]">
            <AnimatePresence mode="wait">
              <motion.p key={step}
                initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-5 }} transition={{ duration:0.22 }}
                className="text-sm text-text-muted leading-relaxed">
                {t(`jwt.s${step + 1}_desc`)}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* progress bar */}
          <div className="h-0.5 bg-bg-base/50 mx-5 mb-4 rounded-full overflow-hidden">
            <motion.div className="h-full w-full rounded-full bg-blue-500/50"
              style={{ transformOrigin: 'left' }}
              animate={{ scaleX: (step + 1) / TOTAL }}
              transition={{ duration:0.35, ease:'easeOut' }} />
          </div>
        </div>

        {/* key concept cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="section-card space-y-2">
              <h3 className="text-sm font-semibold text-text">{t(`jwt.key${n}_title`)}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{t(`jwt.key${n}_desc`)}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-muted select-none">{t('jwt.keyboard_hint')}</p>
      </div>
    </section>
  )
}
