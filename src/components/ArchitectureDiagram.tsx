import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Server, Key, Database, Lock, Shield, Layers } from 'lucide-react'

// ── sub-components ────────────────────────────────────────────────────

function GNode({
  icon: Icon, color, border, bg, title, desc, tag, delay, inView,
}: {
  icon: React.ElementType; color: string; border: string; bg: string
  title: string; desc: string; tag?: string; delay: number; inView: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className={`rounded-xl border ${border} ${bg} p-4 flex items-start gap-3 w-full`}
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl border ${border} flex items-center justify-center`}>
        <Icon size={16} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold ${color}`}>{title}</p>
          {tag && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${border} ${color} ${bg}`}>{tag}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

function VStep({ step, label, delay, inView }: {
  step: string; label: string; delay: number; inView: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={inView ? { opacity: 1, scaleY: 1 } : {}}
      transition={{ duration: 0.25, delay }}
      className="flex flex-col items-center gap-0.5 py-1 origin-top"
    >
      <div className="w-px h-4 bg-slate-700" />
      <div className="flex items-center gap-1.5 px-2">
        <span className="text-[10px] font-bold font-mono text-conjur-gold bg-conjur-gold/10 border border-conjur-gold/30 px-1.5 py-0.5 rounded whitespace-nowrap">
          {step}
        </span>
        <span className="text-[11px] text-slate-500 text-center leading-tight">{label}</span>
      </div>
      <div className="w-px h-4 bg-slate-700" />
      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-slate-600" />
    </motion.div>
  )
}

// ── main component ─────────────────────────────────────────────────────

export default function ArchitectureDiagram() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="architecture" ref={ref} className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <span className="badge bg-conjur-gold/10 text-conjur-gold border border-conjur-gold/20">
            {t('architecture.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">{t('architecture.title')}</h2>
        </motion.div>

        {/* ── GRAPH ── */}
        <div className="max-w-3xl mx-auto">

          {/* ── K8s Cluster boundary ── */}
          <motion.div
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative rounded-2xl border border-dashed border-slate-600/50 p-5 space-y-0"
          >
            <span className="absolute -top-2.5 left-5 bg-bg-muted px-2 text-[10px] font-mono text-slate-600">
              Kubernetes Cluster
            </span>

            {/* ── App Pod boundary ── */}
            <div className="relative rounded-xl border border-dashed border-conjur-cyan/25 p-4">
              <span className="absolute -top-2 left-3 bg-bg-muted px-1.5 text-[10px] font-mono text-conjur-cyan/50">
                App Pod
              </span>

              <GNode
                icon={Layers}
                color="text-conjur-cyan" border="border-conjur-cyan/30" bg="bg-conjur-cyan/5"
                title="App Container" desc="Spring Boot / .NET — authenticates with Conjur or reads env vars from Secrets Provider"
                delay={0.2} inView={inView}
              />

              {/* Pod-internal connector: App → JWT */}
              <div className="flex justify-center py-1.5">
                <div className="flex flex-col items-center">
                  <div className="w-px h-3 bg-slate-700/60" />
                  <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-700" />
                </div>
              </div>

              <GNode
                icon={Key}
                color="text-conjur-gold" border="border-conjur-gold/30" bg="bg-conjur-gold/5"
                title="Service Account JWT" desc="Short-lived token auto-projected by Kubernetes into /var/run/secrets/tokens/jwt"
                delay={0.3} inView={inView}
              />
            </div>

            {/* ── Step ①: JWT → Conjur ── */}
            <VStep step="①" label="Authenticate — send JWT to Conjur endpoint" delay={0.4} inView={inView} />

            {/* ── Conjur Cloud row + K8s API side branch ── */}
            <div className="flex items-center gap-3">

              {/* Conjur node (fills available width) */}
              <div className="flex-1 min-w-0">
                <GNode
                  icon={Shield}
                  color="text-conjur-gold" border="border-conjur-gold/30" bg="bg-conjur-gold/5"
                  title="Conjur Cloud" tag="authn-jwt/eks-latam"
                  desc="Receives JWT, calls K8s API to verify workload identity, then issues a short-lived API token"
                  delay={0.5} inView={inView}
                />
              </div>

              {/* K8s API side branch — sm+ */}
              <motion.div
                initial={{ opacity: 0, x: 14 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.58 }}
                className="hidden sm:flex flex-col items-center flex-shrink-0 gap-0.5"
              >
                {/* → ② */}
                <div className="flex items-center gap-1 self-start">
                  <div className="w-5 border-t border-dashed border-conjur-gold/35" />
                  <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[4px] border-t-transparent border-b-transparent border-l-conjur-gold/45" />
                  <span className="text-[9px] font-bold font-mono text-conjur-gold/60 ml-0.5">②</span>
                </div>

                {/* K8s API node */}
                <div className="rounded-xl border border-border bg-bg-card p-3 w-40">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-6 h-6 rounded-lg border border-border bg-bg-base flex items-center justify-center flex-shrink-0">
                      <Server size={12} className="text-slate-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-200">K8s API Server</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Verifies service account JWT against cluster identity</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
                    <span className="text-[9px] text-slate-600">identity confirmed</span>
                  </div>
                </div>

                {/* ← ③ */}
                <div className="flex items-center gap-1 self-start">
                  <span className="text-[9px] font-bold font-mono text-conjur-gold/60 mr-0.5">③</span>
                  <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-r-[4px] border-t-transparent border-b-transparent border-r-conjur-gold/45" />
                  <div className="w-5 border-t border-dashed border-conjur-gold/35" />
                </div>
              </motion.div>
            </div>

            {/* K8s API — mobile fallback */}
            <motion.div
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.58 }}
              className="sm:hidden mt-2 ml-3 flex items-start gap-2 rounded-lg border border-border bg-bg-card p-2.5"
            >
              <Server size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-slate-300">K8s API Server</p>
                <p className="text-[10px] text-slate-500 mt-0.5">② validate JWT identity · ③ identity confirmed</p>
              </div>
            </motion.div>

            {/* ── Step ④: API token back to App ── */}
            <VStep step="④" label="Short-lived Conjur API token returned to app" delay={0.68} inView={inView} />

            {/* ── Secrets Vault ── */}
            <GNode
              icon={Lock}
              color="text-conjur-cyan" border="border-conjur-cyan/30" bg="bg-conjur-cyan/5"
              title="Conjur Secrets Vault" tag="REST API"
              desc="App uses API token to fetch db_user, db_password, db_host — cached in memory for 5 minutes"
              delay={0.78} inView={inView}
            />

            {/* ── Step ⑤ ⑥: fetch + return ── */}
            <VStep step="⑤ ⑥" label="Fetch secrets → credentials returned to app memory" delay={0.88} inView={inView} />

            {/* ── App with credentials ── */}
            <GNode
              icon={Layers}
              color="text-conjur-cyan" border="border-conjur-cyan/30" bg="bg-conjur-cyan/5"
              title="App Container" desc="Now holds db_user, db_password, db_host — in memory, never written to disk or logs"
              delay={0.93} inView={inView}
            />
          </motion.div>

          {/* ── Step ⑦: outside cluster, connect to DB ── */}
          <VStep step="⑦" label="Connect to database with dynamic credentials" delay={0.98} inView={inView} />

          {/* ── MySQL Database (outside cluster) ── */}
          <GNode
            icon={Database}
            color="text-spring" border="border-spring/30" bg="bg-spring/5"
            title="MySQL Database" desc="Connections authenticated with runtime credentials — no hardcoded passwords in source, config, or CI/CD"
            delay={1.03} inView={inView}
          />

        </div>
      </div>
    </section>
  )
}
