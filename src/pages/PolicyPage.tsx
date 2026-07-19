import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause } from 'lucide-react'

type CK = 'cyan' | 'gold' | 'dotnet' | 'spring' | 'slate' | 'green' | 'gh'

const C: Record<CK, { stroke: string; text: string; border: string; bg: string }> = {
  cyan:   { stroke:'#00b4e0', text:'#67e8f9', border:'rgba(0,180,224,0.4)',    bg:'rgba(0,180,224,0.12)'  },
  gold:   { stroke:'#f59e0b', text:'#fcd34d', border:'rgba(245,158,11,0.4)',   bg:'rgba(245,158,11,0.10)' },
  dotnet: { stroke:'#7b5cf6', text:'#c4b5fd', border:'rgba(123,92,246,0.4)',   bg:'rgba(123,92,246,0.12)' },
  spring: { stroke:'#6db33f', text:'#86efac', border:'rgba(109,179,63,0.4)',   bg:'rgba(109,179,63,0.12)' },
  slate:  { stroke:'#64748b', text:'#94a3b8', border:'rgba(100,116,139,0.35)', bg:'rgba(15,30,48,0.7)'    },
  green:  { stroke:'#10b981', text:'#6ee7b7', border:'rgba(16,185,129,0.45)',  bg:'rgba(16,185,129,0.12)' },
  gh:     { stroke:'#1f6feb', text:'#60a5fa', border:'rgba(31,111,235,0.4)',   bg:'rgba(31,111,235,0.12)' },
}

/* ── YAML lines (rendered as SVG <text>) ───────────────────────────── */
interface YLine {
  indent: number
  text:   string
  ck?:    CK   // colour token of the leading tag, used for the highlight
}

const YAML: YLine[] = [
  /*  1 */ { indent: 0, text: '- !policy',                                  ck: 'gold'   },
  /*  2 */ { indent: 2, text: 'id: prod',                                   ck: 'gold'   },
  /*  3 */ { indent: 2, text: 'owner: !group prod-admins',                  ck: 'gold'   },
  /*  4 */ { indent: 2, text: 'body:',                                      ck: 'gold'   },
  /*  5 */ { indent: 4, text: '- !policy',                                  ck: 'gold'   },
  /*  6 */ { indent: 6, text: 'id: app1',                                   ck: 'gold'   },
  /*  7 */ { indent: 6, text: 'body:',                                      ck: 'gold'   },
  /*  8 */ { indent: 8, text: '- !variable db-password',                    ck: 'spring' },
  /*  9 */ { indent: 8, text: '- !host    app1-host',                       ck: 'dotnet' },
  /* 10 */ { indent: 8, text: '- !group   admins',                          ck: 'gh'     },
  /* 11 */ { indent: 8, text: '- !permit',                                  ck: 'green'  },
  /* 12 */ { indent: 10, text: 'role:       !group admins',                 ck: 'green'  },
  /* 13 */ { indent: 10, text: 'privileges: [ read, execute ]',             ck: 'green'  },
  /* 14 */ { indent: 10, text: 'resource:   !variable db-password',         ck: 'green'  },
  /* 15 */ { indent: 8, text: '- !grant',                                   ck: 'green'  },
  /* 16 */ { indent: 10, text: 'role:   !group admins',                     ck: 'green'  },
  /* 17 */ { indent: 10, text: 'member: !host  app1-host',                  ck: 'green'  },
]

/* ── Step definitions ──────────────────────────────────────────────── */
interface PStep {
  vLines:    number[]   // 1-based YAML line numbers visible
  hLines:    number[]   // 1-based YAML line numbers highlighted
  nodes:     string[]   // visible tree nodes
  hi:        string[]   // highlighted tree nodes
  permit?:   boolean    // draw permit arrow (admins → db-password)
  grant?:    boolean    // draw grant arrow (app1-host → admins)
  showFqId?: boolean    // display fully-qualified-id badge
}

const PSTEPS: PStep[] = [
  // 0 – overview: empty YAML, only root/account placeholder
  { vLines: [],
    hLines: [],
    nodes:  ['account'],
    hi:     [] },
  // 1 – root branch (account) + first !policy
  { vLines: [1,2,3,4],
    hLines: [1,2,3,4],
    nodes:  ['account','prod'],
    hi:     ['account','prod'] },
  // 2 – nested !policy creates the "app1" branch
  { vLines: [1,2,3,4,5,6,7],
    hLines: [5,6,7],
    nodes:  ['account','prod','app1'],
    hi:     ['prod','app1'] },
  // 3 – resources inside the branch + fully-qualified IDs
  { vLines: [1,2,3,4,5,6,7,8],
    hLines: [8],
    nodes:  ['account','prod','app1','var'],
    hi:     ['app1','var'],
    showFqId: true },
  // 4 – identity statements: !host and !group
  { vLines: [1,2,3,4,5,6,7,8,9,10],
    hLines: [9,10],
    nodes:  ['account','prod','app1','var','host','group'],
    hi:     ['host','group'] },
  // 5 – !permit gives privileges
  { vLines: [1,2,3,4,5,6,7,8,9,10,11,12,13,14],
    hLines: [11,12,13,14],
    nodes:  ['account','prod','app1','var','host','group'],
    hi:     ['group','var'],
    permit: true },
  // 6 – !grant adds role members
  { vLines: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],
    hLines: [15,16,17],
    nodes:  ['account','prod','app1','var','host','group'],
    hi:     ['host','group'],
    permit: true,
    grant:  true },
  // 7 – review: full picture
  { vLines: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],
    hLines: [],
    nodes:  ['account','prod','app1','var','host','group'],
    hi:     ['account','prod','app1','var','host','group'],
    permit: true,
    grant:  true,
    showFqId: true },
]

const TOTAL = PSTEPS.length

/* ── Tree node geometry (right side of the SVG) ───────────────────── */
interface TreeNode {
  id:     string
  ck:     CK
  cx:     number   // centre x
  cy:     number   // centre y
  w:      number
  h:      number
  labelKey: string
  subKey:   string
}

const NODES: TreeNode[] = [
  { id:'account', ck:'cyan',   cx:635, cy:34,  w:240, h:38, labelKey:'policy.n_root',    subKey:'policy.n_root_sub' },
  { id:'prod',    ck:'gold',   cx:635, cy:100, w:200, h:36, labelKey:'policy.n_prod',    subKey:'policy.n_prod_sub' },
  { id:'app1',    ck:'gold',   cx:635, cy:160, w:170, h:34, labelKey:'policy.n_app1',    subKey:'policy.n_app1_sub' },
  { id:'var',     ck:'spring', cx:475, cy:240, w:140, h:46, labelKey:'policy.n_var',     subKey:'policy.n_var_sub'  },
  { id:'group',   ck:'gh',     cx:635, cy:240, w:120, h:46, labelKey:'policy.n_group',   subKey:'policy.n_group_sub'},
  { id:'host',    ck:'dotnet', cx:795, cy:240, w:140, h:46, labelKey:'policy.n_host',    subKey:'policy.n_host_sub' },
]

export default function PolicyPage() {
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
    }, 3200)
    return () => clearInterval(id)
  }, [playing])

  const cur     = PSTEPS[step]
  const visible = new Set(cur.vLines)
  const lit     = new Set(cur.hLines)
  const nodeOn  = new Set(cur.nodes)
  const nodeHi  = new Set(cur.hi)

  const findNode = (id: string) => NODES.find(n => n.id === id)!

  return (
    <section id="policy" className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* header */}
        <div className="text-center space-y-3">
          <span className="badge bg-conjur-gold/10 text-conjur-gold border border-conjur-gold/30">
            {t('policy.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold">{t('policy.title')}</h1>
          <p className="text-text-muted max-w-2xl mx-auto text-sm">{t('policy.subtitle')}</p>
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
                <p className="text-[10px] font-mono text-conjur-gold/70 mb-0.5">
                  {t('policy.step_of', { current: step + 1, total: TOTAL })}
                </p>
                <p className="text-sm font-semibold text-text leading-snug">
                  {t(`policy.s${step + 1}_title`)}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}
                className={`p-1.5 rounded-lg border transition-colors ${playing
                  ? 'border-conjur-gold/50 text-conjur-gold'
                  : 'border-border text-text-muted hover:text-conjur-gold hover:border-conjur-gold/50'
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
                className="p-1.5 rounded-lg border border-border text-text-muted hover:text-conjur-gold hover:border-conjur-gold/50 transition-colors">
                <RotateCcw size={13} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* SVG diagram — YAML (left) + tree (right) */}
          <div className="px-4 pt-5 pb-3 overflow-x-auto">
            <svg viewBox="0 0 900 380" style={{ minWidth:660, width:'100%' }} role="img" aria-label="Conjur policy structure diagram">
              <defs>
                {(Object.keys(C) as CK[]).map(k => (
                  <marker key={k} id={`pol-${k}`} markerWidth="7" markerHeight="7" refX="6.5" refY="3.5" orient="auto">
                    <path d="M 0 1 L 7 3.5 L 0 6 z" fill={C[k].stroke} />
                  </marker>
                ))}
                <filter id="pol-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* ────── YAML panel ────── */}
              <rect x={10} y={10} width={380} height={360} rx={12}
                fill="rgba(8,18,32,0.85)" stroke="rgba(100,116,139,0.25)" strokeWidth={0.75} />
              <text x={22} y={28} fontSize="9" fontWeight="700" fontFamily="JetBrains Mono, monospace"
                fill="rgba(245,158,11,0.65)">
                policy.yml
              </text>
              <text x={370} y={28} fontSize="8" fontFamily="JetBrains Mono, monospace"
                fill="rgba(148,163,184,0.35)" textAnchor="end">
                YAML
              </text>

              {YAML.map((ln, idx) => {
                const n        = idx + 1
                const baseY    = 52
                const lineH    = 18
                const y        = baseY + idx * lineH    // visual centre of the line
                const isVis    = visible.has(n)
                const isHi     = lit.has(n)
                const hiCk     = ln.ck ?? 'slate'
                return (
                  <g key={n}>
                    {/* highlight band — drawn first so text sits on top */}
                    <AnimatePresence>
                      {isHi && (
                        <motion.rect x={32} y={y - 8} width={350} height={16} rx={3}
                          fill={C[hiCk].bg}
                          stroke={C[hiCk].border} strokeWidth={0.5}
                          initial={{ opacity:0, x:24 }}
                          animate={{ opacity:1, x:32 }}
                          exit={{ opacity:0 }}
                          transition={{ duration:0.28 }} />
                      )}
                    </AnimatePresence>
                    {/* line-number gutter, vertically centred on the band */}
                    <text x={26} y={y} fontSize="8" fontFamily="JetBrains Mono, monospace"
                      fill="rgba(100,116,139,0.45)" textAnchor="end"
                      dominantBaseline="central">
                      {n}
                    </text>
                    {/* code line, vertically centred on the band */}
                    <motion.text x={38 + ln.indent * 5.6} y={y} fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      dominantBaseline="central"
                      fill={isHi ? C[hiCk].text : isVis ? '#cbd5e1' : 'rgba(148,163,184,0.18)'}
                      animate={{ opacity: isVis ? 1 : 0.35 }}
                      transition={{ duration:0.3 }}
                      style={{ whiteSpace:'pre' }}>
                      {ln.text}
                    </motion.text>
                  </g>
                )
              })}

              {/* ────── Tree panel ────── */}
              <rect x={400} y={10} width={490} height={360} rx={12}
                fill="rgba(8,18,32,0.45)" stroke="rgba(100,116,139,0.2)" strokeWidth={0.75}
                strokeDasharray="4 3" />
              <text x={412} y={28} fontSize="9" fontWeight="700" fontFamily="JetBrains Mono, monospace"
                fill="rgba(0,180,224,0.65)">
                {t('policy.tree_label')}
              </text>

              {/* connectors */}
              {nodeOn.has('prod') && (
                <motion.path d="M 635,53 L 635,82"
                  stroke={C.gold.stroke} strokeWidth={1.2} fill="none"
                  initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:0.6 }}
                  transition={{ duration:0.5 }} />
              )}
              {nodeOn.has('app1') && (
                <motion.path d="M 635,118 L 635,143"
                  stroke={C.gold.stroke} strokeWidth={1.2} fill="none"
                  initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:0.6 }}
                  transition={{ duration:0.5 }} />
              )}
              {(nodeOn.has('var') || nodeOn.has('host') || nodeOn.has('group')) && (
                <>
                  <motion.path d="M 635,177 L 635,200"
                    stroke="rgba(100,116,139,0.45)" strokeWidth={1} fill="none"
                    initial={{ pathLength:0 }} animate={{ pathLength:1 }}
                    transition={{ duration:0.4 }} />
                  <motion.path d="M 475,200 L 795,200"
                    stroke="rgba(100,116,139,0.45)" strokeWidth={1} fill="none"
                    initial={{ pathLength:0 }} animate={{ pathLength:1 }}
                    transition={{ duration:0.6 }} />
                  {nodeOn.has('var') && (
                    <motion.path d="M 475,200 L 475,217"
                      stroke={C.spring.stroke} strokeWidth={1.2} fill="none"
                      initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:0.6 }}
                      transition={{ duration:0.4 }} />
                  )}
                  {nodeOn.has('group') && (
                    <motion.path d="M 635,200 L 635,217"
                      stroke={C.gh.stroke} strokeWidth={1.2} fill="none"
                      initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:0.6 }}
                      transition={{ duration:0.4 }} />
                  )}
                  {nodeOn.has('host') && (
                    <motion.path d="M 795,200 L 795,217"
                      stroke={C.dotnet.stroke} strokeWidth={1.2} fill="none"
                      initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:0.6 }}
                      transition={{ duration:0.4 }} />
                  )}
                </>
              )}

              {/* permit arrow: admins (group) → db-password (variable) */}
              <AnimatePresence>
                {cur.permit && (
                  <motion.g initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
                    <motion.path d="M 580,255 C 545,275 510,275 480,266"
                      stroke={C.green.stroke} strokeWidth={1.4} fill="none"
                      strokeDasharray="4 3"
                      markerEnd="url(#pol-green)"
                      animate={reduce ? { strokeDashoffset:0 } : { strokeDashoffset:[0,-14] }}
                      transition={{ duration:1.4, repeat: reduce ? 0 : Infinity, ease:'linear' }} />
                    <text x={528} y={285} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                      fill={C.green.text} textAnchor="middle">
                      permit: read, execute
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>

              {/* grant arrow: app1-host → admins */}
              <AnimatePresence>
                {cur.grant && (
                  <motion.g initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
                    <motion.path d="M 740,255 C 712,275 668,275 695,266"
                      stroke={C.green.stroke} strokeWidth={1.4} fill="none"
                      strokeDasharray="4 3"
                      markerEnd="url(#pol-green)"
                      animate={reduce ? { strokeDashoffset:0 } : { strokeDashoffset:[0,-14] }}
                      transition={{ duration:1.4, repeat: reduce ? 0 : Infinity, ease:'linear' }} />
                    <text x={718} y={305} fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                      fill={C.green.text} textAnchor="middle">
                      grant: member
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>

              {/* tree nodes */}
              {NODES.map(n => {
                const on = nodeOn.has(n.id)
                const hi = nodeHi.has(n.id)
                const x  = n.cx - n.w / 2
                const y  = n.cy - n.h / 2
                return (
                  <motion.g key={n.id}
                    animate={{ opacity: on ? 1 : 0.18 }}
                    transition={{ duration:0.35 }}>
                    {hi && (
                      <motion.rect x={x - 3} y={y - 3} width={n.w + 6} height={n.h + 6} rx={9}
                        fill="none" stroke={C[n.ck].stroke} strokeWidth={1}
                        animate={reduce ? { strokeOpacity:0.5 } : { strokeOpacity:[0.25,0.65,0.25] }}
                        transition={{ duration:2.2, repeat: reduce ? 0 : Infinity, ease:'easeInOut' }}
                        filter="url(#pol-glow)" />
                    )}
                    <rect x={x} y={y} width={n.w} height={n.h} rx={7}
                      style={{
                        fill:        hi ? C[n.ck].bg : 'rgba(12,24,40,0.85)',
                        stroke:      hi ? C[n.ck].border : 'rgba(100,116,139,0.3)',
                        strokeWidth: hi ? 1.4 : 0.8,
                        transition:  'fill 0.4s ease, stroke 0.4s ease',
                      }} />
                    <text x={n.cx} y={n.cy - 4} fontSize="10" fontWeight="700"
                      fontFamily="Inter, system-ui, sans-serif"
                      fill={hi ? C[n.ck].text : '#94a3b8'}
                      textAnchor="middle"
                      style={{ transition:'fill 0.4s ease' }}>
                      {t(n.labelKey)}
                    </text>
                    <text x={n.cx} y={n.cy + 8} fontSize="8" fontFamily="JetBrains Mono, monospace"
                      fill={hi ? 'rgba(203,213,225,0.75)' : 'rgba(148,163,184,0.4)'}
                      textAnchor="middle"
                      style={{ transition:'fill 0.4s ease' }}>
                      {t(n.subKey)}
                    </text>
                  </motion.g>
                )
              })}

              {/* fully-qualified ID badge */}
              <AnimatePresence>
                {cur.showFqId && (
                  <motion.g initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.35 }}>
                    <rect x={430} y={332} width={430} height={28} rx={6}
                      fill="rgba(0,180,224,0.08)" stroke={C.cyan.border} strokeWidth={1} />
                    <text x={444} y={344} fontSize="8" fontFamily="JetBrains Mono, monospace"
                      fill="rgba(0,180,224,0.7)">
                      {t('policy.fqid_label')}
                    </text>
                    <text x={444} y={356} fontSize="11" fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                      fill={C.cyan.text}>
                      prod/app1/db-password
                    </text>
                    {findNode('var') && (
                      <motion.circle cx={475} cy={263} r={5}
                        fill={C.cyan.stroke}
                        animate={reduce ? { opacity:0.9, r:5 } : { opacity:[0.3,0.9,0.3], r:[4,6,4] }}
                        transition={{ duration:2, repeat: reduce ? 0 : Infinity, ease:'easeInOut' }} />
                    )}
                  </motion.g>
                )}
              </AnimatePresence>
            </svg>
          </div>

          {/* description */}
          <div className="px-5 pb-4 pt-1 min-h-[64px]">
            <AnimatePresence mode="wait">
              <motion.p key={step}
                initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-5 }} transition={{ duration:0.22 }}
                className="text-sm text-text-muted leading-relaxed">
                {t(`policy.s${step + 1}_desc`)}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* progress bar */}
          <div className="h-0.5 bg-bg-base/50 mx-5 mb-4 rounded-full overflow-hidden">
            <motion.div className="h-full w-full rounded-full bg-conjur-gold/60"
              style={{ transformOrigin: 'left' }}
              animate={{ scaleX: (step + 1) / TOTAL }}
              transition={{ duration:0.35, ease:'easeOut' }} />
          </div>
        </div>

        {/* key concept cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="section-card space-y-2">
              <h3 className="text-sm font-semibold text-text">{t(`policy.key${n}_title`)}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{t(`policy.key${n}_desc`)}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-muted select-none">{t('policy.keyboard_hint')}</p>
      </div>
    </section>
  )
}
