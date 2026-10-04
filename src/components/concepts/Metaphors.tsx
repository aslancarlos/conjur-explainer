import { m, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Fingerprint, KeyRound, Landmark } from 'lucide-react'

/**
 * Secret vs identity, as two everyday metaphors (Concepts, DESIGN.md §7):
 *   secret   = a key that opens a door: whoever holds it gets in
 *   identity = a passport that only counts because a trusted issuer attested it
 * Illustrations are inline SVG on theme tokens; they play once when scrolled
 * into view and render their final state under reduced motion.
 */
export default function Metaphors() {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduce = useReducedMotion() ?? false
  const play = inView || reduce
  const say = (k: string) => t(`practice.metaphor.${k}`)

  return (
    <section ref={ref} className="grid gap-4 md:grid-cols-2" aria-label={say('label')}>
      <figure className="rounded-2xl border border-border bg-bg-card overflow-hidden">
        <div className="bg-bg-muted/60 border-b border-border px-4 pt-4">
          <DoorScene play={play} reduce={reduce} />
        </div>
        <figcaption className="p-5">
          <p className="inline-flex items-center gap-2 font-semibold text-text">
            <KeyRound size={16} className="text-tone-live" aria-hidden="true" />{say('secret_title')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-2">{say('secret_desc')}</p>
        </figcaption>
      </figure>

      <figure className="rounded-2xl border border-border bg-bg-card overflow-hidden">
        <div className="bg-bg-muted/60 border-b border-border px-4 pt-4">
          <PassportScene play={play} reduce={reduce} stamp={say('stamp')} passport={say('passport')}
            issuer={say('issuer')} issuerSub={say('issuer_sub')} />
        </div>
        <figcaption className="p-5">
          <p className="inline-flex items-center gap-2 font-semibold text-text">
            <Fingerprint size={16} className="text-tone-accent" aria-hidden="true" />{say('identity_title')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-2">{say('identity_desc')}</p>
        </figcaption>
      </figure>
    </section>
  )
}

const ease = [0.22, 1, 0.36, 1] as const

/** A person turns a key in a door; light spills out once it unlocks. */
function DoorScene({ play, reduce }: { play: boolean; reduce: boolean }) {
  const at = (delay: number, duration = 0.5) => (reduce ? { duration: 0 } : { delay, duration, ease })
  return (
    <svg viewBox="0 0 360 200" className="w-full h-auto" aria-hidden="true">
      {/* floor */}
      <line x1="10" y1="186" x2="350" y2="186" strokeWidth="1.5" className="stroke-line" />
      {/* light spilling under / around the door once unlocked */}
      <m.path d="M 176 186 L 290 186 L 340 198 L 140 198 Z" className="fill-tone-live/25"
        initial={{ opacity: 0 }} animate={{ opacity: play ? 1 : 0 }} transition={at(1.7, 0.6)} />
      <m.rect x="171" y="21" width="118" height="168" rx="6" fill="none" strokeWidth="6" className="stroke-tone-live/30"
        initial={{ opacity: 0 }} animate={{ opacity: play ? 1 : 0 }} transition={at(1.7, 0.6)} />
      {/* frame + door */}
      <rect x="168" y="18" width="124" height="171" rx="6" strokeWidth="2" className="fill-bg-muted stroke-text-muted/60" />
      <rect x="176" y="26" width="108" height="160" rx="4" strokeWidth="1.5" className="fill-surface stroke-line" />
      <rect x="188" y="40" width="84" height="56" rx="3" strokeWidth="1.25" className="fill-none stroke-line" />
      <rect x="188" y="108" width="84" height="66" rx="3" strokeWidth="1.25" className="fill-none stroke-line" />
      {/* lock plate + keyhole (on the left, by the person) */}
      <rect x="182" y="96" width="16" height="34" rx="4" className="fill-bg-muted stroke-text-muted/70" strokeWidth="1.25" />
      <circle cx="190" cy="107" r="3" className="fill-text-muted" />
      <rect x="188.6" y="108" width="2.8" height="7" rx="1" className="fill-text-muted" />
      <m.circle cx="190" cy="111" r="9" className="fill-tone-live/30"
        initial={{ opacity: 0 }} animate={{ opacity: play ? 1 : 0 }} transition={at(1.4, 0.4)} />
      {/* person */}
      <circle cx="84" cy="66" r="15" strokeWidth="2" className="fill-surface stroke-text-2" />
      <path d="M 60 186 L 64 120 Q 66 94 84 92 Q 102 94 104 120 L 108 186" strokeWidth="2" className="fill-surface stroke-text-2" />
      {/* arm reaching for the lock */}
      <m.g initial={{ x: reduce ? 0 : -18 }} animate={{ x: play ? 0 : -18 }} transition={at(0.2, 0.7)}>
        <path d="M 98 110 Q 130 116 150 112" strokeWidth="2" fill="none" className="stroke-text-2" />
        {/* key: bow + shaft + teeth, tip ends in the keyhole */}
        <line x1="164" y1="111" x2="189" y2="111" strokeWidth="3" strokeLinecap="round" className="stroke-tone-live" />
        <path d="M 180 111 L 180 116 M 185 111 L 185 117" strokeWidth="2.5" strokeLinecap="round" className="stroke-tone-live" />
        {/* the bow flattens as the key turns (seen from the front) */}
        <m.circle cx="156" cy="111" r="8" strokeWidth="2.5" className="fill-tone-live/20 stroke-tone-live"
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
          initial={{ scaleX: 1 }} animate={{ scaleX: play ? 0.3 : 1 }} transition={at(1.0, 0.45)} />
      </m.g>
    </svg>
  )
}

/** A passport gets stamped by a trusted issuer: that attestation is what makes it valid. */
function PassportScene({ play, reduce, stamp, passport, issuer, issuerSub }: {
  play: boolean; reduce: boolean; stamp: string; passport: string; issuer: string; issuerSub: string
}) {
  const at = (delay: number, duration = 0.5) => (reduce ? { duration: 0 } : { delay, duration, ease })
  return (
    <div className="relative">
    <svg viewBox="0 0 360 200" className="w-full h-auto" aria-hidden="true">
      {/* open passport */}
      <rect x="22" y="26" width="196" height="150" rx="10" strokeWidth="2" className="fill-surface stroke-text-muted/60" />
      <line x1="120" y1="26" x2="120" y2="176" strokeWidth="1.25" strokeDasharray="3 3" className="stroke-line" />
      <text x="34" y="46" fontSize="9" letterSpacing="0.14em" className="fill-text-muted font-mono uppercase">{passport}</text>
      {/* photo */}
      <rect x="34" y="56" width="70" height="84" rx="6" strokeWidth="1.25" className="fill-bg-muted stroke-line" />
      <circle cx="69" cy="88" r="13" className="fill-text-muted/40" />
      <path d="M 44 136 Q 46 110 69 108 Q 92 110 94 136 Z" className="fill-text-muted/40" />
      {/* data lines */}
      {[60, 76, 92, 108].map((y, i) => (
        <rect key={y} x="132" y={y} width={i % 2 ? 52 : 72} height="6" rx="3" className="fill-text-muted/30" />
      ))}
      {/* machine-readable zone */}
      <text x="34" y="158" fontSize="8.5" className="fill-text-muted/70 font-mono">{'P<WORKLOAD<<ORDERS<API<<<<<<'}</text>
      <text x="34" y="169" fontSize="8.5" className="fill-text-muted/70 font-mono">{'SPIFFE<<NS<ORDERS<<SA<API<<<'}</text>

      {/* issuer (the trusted attester) */}
      <circle cx="300" cy="62" r="26" strokeWidth="2" className="fill-surface stroke-tone-accent/70" />
      <Landmark x="287" y="49" width="26" height="26" strokeWidth={1.8} className="text-tone-accent" />
      <text x="300" y="106" fontSize="12" textAnchor="middle" className="fill-text font-sans font-semibold">{issuer}</text>
      <text x="300" y="121" fontSize="9.5" textAnchor="middle" className="fill-text-muted font-sans">{issuerSub}</text>

      {/* attestation path from issuer to the stamp */}
      <m.path d="M 276 70 C 244 80 224 90 200 98" fill="none" strokeWidth="1.75" strokeDasharray="4 4"
        className="stroke-tone-accent" initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
        animate={{ pathLength: play ? 1 : 0, opacity: play ? 1 : 0 }} transition={at(0.3, 0.8)} />

    </svg>
    {/* the stamp lands on the passport (HTML overlay: reliable transform origin);
        centre (170,104) r 30 in the 360x200 viewBox */}
    <m.svg viewBox="0 0 64 64" aria-hidden="true" className="absolute"
      style={{ left: `${(140 / 360) * 100}%`, top: `${(74 / 200) * 100}%`, width: `${(60 / 360) * 100}%` }}
      initial={reduce ? { opacity: 1, scale: 1, rotate: -14 } : { opacity: 0, scale: 1.7, rotate: -4 }}
      animate={play ? { opacity: 1, scale: 1, rotate: -14 } : { opacity: 0, scale: 1.7, rotate: -4 }}
      transition={reduce ? { duration: 0 } : { delay: 1.15, type: 'spring', stiffness: 420, damping: 18 }}>
      <circle cx="32" cy="32" r="29" strokeWidth="2.5" className="fill-tone-accent/10 stroke-tone-accent" />
      <circle cx="32" cy="32" r="23" strokeWidth="1" strokeDasharray="2 2.5" className="fill-none stroke-tone-accent/70" />
      <path d="M 20 26 L 29 35 L 45 19" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="stroke-tone-accent" />
      <text x="32" y="49" fontSize="8" textAnchor="middle" letterSpacing="0.1em" className="fill-tone-accent font-mono font-semibold uppercase">{stamp}</text>
    </m.svg>
    </div>
  )
}
