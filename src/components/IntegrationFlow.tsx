import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

// ─── color palette ────────────────────────────────────────────────────────────

type CK = 'spring' | 'dotnet' | 'gh' | 'eso' | 'gold' | 'cyan' | 'slate'

const C: Record<CK, { stroke: string; text: string; border: string; bg: string }> = {
  spring: { stroke:'#6db33f', text:'#86efac', border:'rgba(109,179,63,0.4)',  bg:'rgba(109,179,63,0.12)' },
  dotnet: { stroke:'#7b5cf6', text:'#c4b5fd', border:'rgba(123,92,246,0.4)',  bg:'rgba(123,92,246,0.12)' },
  gh:     { stroke:'#1f6feb', text:'#60a5fa', border:'rgba(31,111,235,0.4)',  bg:'rgba(31,111,235,0.12)' },
  eso:    { stroke:'#f97316', text:'#fdba74', border:'rgba(249,115,22,0.4)',   bg:'rgba(249,115,22,0.12)' },
  gold:   { stroke:'#f59e0b', text:'#fcd34d', border:'rgba(245,158,11,0.4)',  bg:'rgba(245,158,11,0.08)' },
  cyan:   { stroke:'#00b4e0', text:'#67e8f9', border:'rgba(0,180,224,0.4)',   bg:'rgba(0,180,224,0.12)' },
  slate:  { stroke:'#64748b', text:'#94a3b8', border:'rgba(100,116,139,0.35)' , bg:'rgba(15,30,48,0.7)' },
}

// ─── graph data ───────────────────────────────────────────────────────────────

interface N { id:string; x:number; y:number; w:number; h:number; label:string; sub:string; ck:CK; feat?:boolean }
interface E { id:string; d:string; ck:CK; tag?:string; lx?:number; ly?:number }

// ViewBox: 0 0 870 415
// Left column (apps):  x=16
// Center (Conjur):     x=354
// Right (K8s API):     x=618
// Bottom right:        x=484 (vault), x=698 (db)
const NODES: N[] = [
  { id:'spring', x:16,  y:24,  w:164, h:58, label:'Spring Boot',    sub:'authn-jwt/eks-latam',                  ck:'spring' },
  { id:'dotnet', x:16,  y:110, w:164, h:58, label:'.NET 8',          sub:'authn-jwt/eks-latam',                 ck:'dotnet' },
  { id:'gha',    x:16,  y:196, w:164, h:58, label:'GitHub Actions',  sub:'OIDC → JWT',                          ck:'gh'     },
  { id:'eso',    x:16,  y:282, w:164, h:58, label:'ESO Shop',         sub:'External Secrets Operator',          ck:'eso'    },
  { id:'conjur', x:354, y:142, w:194, h:82, label:'Secrets Manager',  sub:'latamlab.secretsmgr.cyberark.cloud', ck:'gold', feat:true },
  { id:'k8sapi', x:618, y:155, w:168, h:58, label:'K8s API Server',  sub:'JWT validation',                      ck:'slate'  },
  { id:'vault',  x:484, y:334, w:166, h:58, label:'Secrets Vault',   sub:'data/vault/dev-demo-aslan/…',         ck:'cyan'   },
  { id:'db',     x:698, y:334, w:154, h:58, label:'MySQL',            sub:'mysql.demo.local',                      ck:'spring' },
]

// Edge paths connect exact node midpoints:
//   spring right-center : (180, 53)   conjur left-center: (354, 170–196)
//   dotnet right-center : (180, 139)  k8sapi left-center: (618, 184)
//   gha right-center    : (180, 225)  vault  top-center : (567, 334)
//   eso right-center    : (180, 311)  db     left-center: (698, 363)
//   conjur right-center : (548, 183)  conjur bottom-ctr : (451, 224)
const EDGES: E[] = [
  { id:'sp-cj', d:'M 180,53  C 270,53  270,170 354,170', ck:'spring', tag:'JWT',    lx:228, ly:96  },
  { id:'dn-cj', d:'M 180,139 C 270,139 270,177 354,177', ck:'dotnet', tag:'JWT',    lx:226, ly:152 },
  { id:'gh-cj', d:'M 180,225 C 270,225 270,184 354,184', ck:'gh',     tag:'OIDC',   lx:226, ly:222 },
  { id:'es-cj', d:'M 180,311 C 270,311 270,191 354,191', ck:'eso',    tag:'JWT',    lx:226, ly:300 },
  { id:'cj-k8', d:'M 548,175 L 618,175',                  ck:'gold',   tag:'verify', lx:582, ly:165 },
  { id:'k8-cj', d:'M 618,193 L 548,193',                  ck:'slate',  tag:'✓ ok',   lx:582, ly:205 },
  { id:'cj-vt', d:'M 451,224 C 451,292 567,292 567,334',  ck:'cyan'                               },
  { id:'vt-db', d:'M 650,363 L 698,363',                  ck:'spring'                              },
]

// ─── step definitions ─────────────────────────────────────────────────────────

const RAW: { nodes:string[]; edges:string[]; hi:string[] }[] = [
  { nodes:['spring','dotnet','gha','eso'], edges:[],                   hi:['spring','dotnet','gha','eso'] },
  { nodes:['conjur'],                      edges:[],                   hi:['conjur'] },
  { nodes:['k8sapi'],                      edges:['cj-k8','k8-cj'],   hi:['conjur','k8sapi','cj-k8','k8-cj'] },
  { nodes:[],                              edges:['sp-cj'],            hi:['spring','sp-cj','conjur'] },
  { nodes:[],                              edges:['dn-cj'],            hi:['dotnet','dn-cj','conjur'] },
  { nodes:[],                              edges:['gh-cj'],            hi:['gha','gh-cj','conjur'] },
  { nodes:[],                              edges:['es-cj'],            hi:['eso','es-cj','conjur'] },
  { nodes:['vault'],                       edges:['cj-vt'],            hi:['vault','cj-vt','conjur'] },
  { nodes:['db'],                          edges:['vt-db'],            hi:[] },
]

// build cumulative visibility sets once at module level
const CUM = RAW.reduce<{ nodes: Set<string>; edges: Set<string> }[]>((acc, s) => {
  const prev = acc[acc.length - 1] ?? { nodes: new Set<string>(), edges: new Set<string>() }
  acc.push({ nodes: new Set([...prev.nodes, ...s.nodes]), edges: new Set([...prev.edges, ...s.edges]) })
  return acc
}, [])

const TOTAL = RAW.length

// ─── component ────────────────────────────────────────────────────────────────

export default function IntegrationFlow() {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)

  const go = useCallback((d: 1 | -1) =>
    setStep(s => Math.max(0, Math.min(TOTAL - 1, s + d))), [])

  // Scoped keyboard nav: arrows only steer the stepper when it (or a child) has
  // focus, so we don't hijack page-wide ArrowLeft/Right / scrolling.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1) }
  }

  const vis   = CUM[step]
  const hi    = new Set(RAW[step].hi)
  const isAll = step === TOTAL - 1

  return (
    <section id="flow" className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ── header ── */}
        <div className="text-center space-y-3">
          <span className="badge bg-conjur-cyan/10 text-conjur-cyan border border-conjur-cyan/20">
            {t('flow.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">{t('flow.title')}</h2>
          <p className="text-text-muted max-w-2xl mx-auto text-sm">{t('flow.subtitle')}</p>
        </div>

        {/* ── card ── */}
        <div
          className="rounded-2xl border border-border bg-bg-card overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue"
          tabIndex={0}
          role="group"
          aria-label={t('flow.title')}
          onKeyDown={onKey}
        >

          {/* step bar */}
          <div className="border-b border-border px-5 py-3.5 flex items-center gap-4">
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-[10px] font-mono text-conjur-gold/60 mb-0.5">
                  {t('flow.step_of', { current: step + 1, total: TOTAL })}
                </p>
                <p className="text-sm font-semibold text-text leading-snug">
                  {t(`flow.s${step + 1}_title`)}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => go(-1)} disabled={step === 0}
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-border text-text-muted hover:text-text hover:border-text-muted disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous step">
                <ChevronLeft size={15} aria-hidden="true" />
              </button>
              <button onClick={() => go(1)} disabled={step === TOTAL - 1}
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-border text-text-muted hover:text-text hover:border-text-muted disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Next step">
                <ChevronRight size={15} aria-hidden="true" />
              </button>
              <button onClick={() => setStep(0)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-border text-text-muted hover:text-conjur-gold hover:border-conjur-gold/40 transition-colors"
                aria-label="Reset" title="Reset">
                <RotateCcw size={13} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* SVG graph — pinned to a fixed dark canvas so the dark-tuned diagram
              stays legible in both light and dark themes */}
          <div className="px-4 pt-5 pb-3">
            <div className="overflow-x-auto rounded-xl border border-border bg-[#050d1a] p-4">
            <svg
              viewBox="0 0 870 415"
              style={{ minWidth: 560, width: '100%' }}
              role="img"
              aria-label={t('flow.aria_label')}
            >
              <defs>
                {/* arrowhead markers per color */}
                {(Object.keys(C) as CK[]).map(k => (
                  <marker key={k} id={`ah-${k}`}
                    markerWidth="7" markerHeight="7"
                    refX="6.5" refY="3.5" orient="auto">
                    <path d="M 0 1 L 7 3.5 L 0 6 z" fill={C[k].stroke} />
                  </marker>
                ))}
                {/* subtle glow filter for Conjur node */}
                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── edges ─────────────────────────────────────────────── */}
              {EDGES.map(e => {
                const show   = vis.edges.has(e.id)
                const active = hi.has(e.id) || isAll
                return (
                  <g key={e.id}>
                    <motion.path
                      d={e.d}
                      stroke={C[e.ck].stroke}
                      strokeWidth={active ? 2 : 1.5}
                      fill="none"
                      markerEnd={`url(#ah-${e.ck})`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: show ? 1 : 0,
                        opacity: show ? (active ? 1 : 0.22) : 0,
                      }}
                      transition={{ duration: 0.75, ease: 'easeInOut' }}
                    />
                    {/* edge label */}
                    {e.tag != null && (
                      <motion.text
                        x={e.lx} y={e.ly}
                        fill={C[e.ck].stroke}
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: show ? (active ? 0.9 : 0.25) : 0 }}
                        transition={{ delay: show ? 0.55 : 0, duration: 0.3 }}
                      >
                        {e.tag}
                      </motion.text>
                    )}
                  </g>
                )
              })}

              {/* ── nodes ─────────────────────────────────────────────── */}
              {NODES.map(n => {
                const show   = vis.nodes.has(n.id)
                const active = hi.has(n.id) || isAll
                const c      = C[n.ck]
                const cx     = n.x + n.w / 2
                const cy     = n.y + n.h / 2

                return (
                  <motion.g
                    key={n.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: show ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    {/* glow ring for active featured node */}
                    {n.feat && active && (
                      <motion.rect
                        x={n.x - 8} y={n.y - 8}
                        width={n.w + 16} height={n.h + 16}
                        rx="16"
                        fill={c.stroke}
                        fillOpacity={0}
                        stroke={c.stroke}
                        strokeWidth="1"
                        strokeOpacity="0.35"
                        filter="url(#glow)"
                        animate={reduce ? { strokeOpacity: 0.35 } : { strokeOpacity: [0.2, 0.5, 0.2] }}
                        transition={reduce ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}

                    {/* card background */}
                    <rect
                      x={n.x} y={n.y} width={n.w} height={n.h} rx="10"
                      fill={active ? c.bg : 'rgba(12,24,40,0.8)'}
                      stroke={c.border}
                      strokeWidth={active ? 1.5 : 0.75}
                      strokeOpacity={active ? 1 : 0.3}
                    />

                    {/* node label */}
                    <text
                      x={n.x + 12} y={n.y + (n.feat ? 24 : 22)}
                      fill={active ? c.text : 'rgba(148,163,184,0.4)'}
                      fontSize={n.feat ? 12 : 11}
                      fontWeight="600"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {n.label}
                    </text>

                    {/* sublabel */}
                    <text
                      x={n.x + 12} y={n.y + (n.feat ? 44 : 39)}
                      fill={active ? 'rgba(148,163,184,0.6)' : 'rgba(148,163,184,0.2)'}
                      fontSize="8.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {n.sub}
                    </text>

                    {/* live pulse dot for active Conjur node */}
                    {n.feat && (
                      <motion.circle
                        cx={n.x + n.w - 16} cy={n.y + 16} r="4"
                        fill={c.stroke}
                        animate={
                          reduce
                            ? { opacity: active ? 1 : 0.15, r: active ? 4 : 3 }
                            : active ? { opacity:[0.4,1,0.4], r:[3,4.5,3] } : { opacity:0.15, r:3 }
                        }
                        transition={reduce ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}

                    {/* invisible hit area for future interactivity */}
                    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10" fill="transparent"
                      aria-label={n.label} role="img"
                      style={{ cursor: 'default' }}
                    />

                    {/* suppress unused var warning */}
                    <>{cx}{cy}</>
                  </motion.g>
                )
              })}
            </svg>
            </div>
          </div>

          {/* description */}
          <div className="px-5 pb-4 pt-1 min-h-[52px]">
            <AnimatePresence mode="wait">
              <motion.p key={step}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.22 }}
                className="text-sm text-text-muted leading-relaxed"
              >
                {t(`flow.s${step + 1}_desc`)}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* progress bar */}
          <div className="h-0.5 bg-bg-base/50 mx-5 mb-4 rounded-full overflow-hidden">
            <motion.div
              className="h-full w-full origin-left rounded-full bg-conjur-cyan/50"
              animate={{ scaleX: (step + 1) / TOTAL }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* keyboard hint */}
        <p className="text-center text-xs text-text-muted select-none">
          {t('flow.keyboard_hint')}
        </p>
      </div>
    </section>
  )
}
