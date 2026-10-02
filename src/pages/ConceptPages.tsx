import { lazy, Suspense, type ReactNode } from 'react'
import Metaphors from '../components/concepts/Metaphors'
import { useTranslation } from 'react-i18next'
import ConceptLayout from '../components/concepts/ConceptLayout'
import { ConceptCard, CompareTable, FitPanel, GlossaryList, PlatformsTable } from '../components/concepts/ConceptPieces'
import ProblemSection from '../components/ProblemSection'
import Capabilities from '../components/Capabilities'
import Loading from '../components/Loading'

const ArchitectureDiagram = lazy(() => import('../components/ArchitectureDiagram'))

// Full-bleed sections that bring their own header/padding are wrapped so they
// escape the layout's content container cleanly.
function Bleed({ children }: { children: ReactNode }) {
  return <div className="-mx-6 lg:-mx-10">{children}</div>
}

export function SecretsConcept() {
  const { t } = useTranslation()
  return (
    <ConceptLayout title={t('fundamentals.secret.title')} subtitle={t('concepts.secret_sub')}>
      <ConceptCard kind="secret" />
      <Bleed><ProblemSection /></Bleed>
    </ConceptLayout>
  )
}

export function IdentityConcept() {
  const { t } = useTranslation()
  return (
    <ConceptLayout title={t('fundamentals.identity.title')} subtitle={t('concepts.identity_sub')}>
      <ConceptCard kind="identity" />
      <section>
        <h2 className="text-xl font-semibold text-text">{t('practice.platforms_title')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-2">{t('practice.platforms_subtitle')}</p>
        <div className="mt-5"><PlatformsTable /></div>
      </section>
    </ConceptLayout>
  )
}

export function CompareConcept() {
  const { t } = useTranslation()
  return (
    <ConceptLayout title={t('practice.title')} subtitle={t('practice.subtitle')}>
      <Metaphors />
      <CompareTable />
      <FitPanel />
      <Bleed><Capabilities /></Bleed>
    </ConceptLayout>
  )
}

export function KubernetesConcept() {
  const { t } = useTranslation()
  return (
    <ConceptLayout title={t('concepts.k8s_title')} subtitle={t('concepts.k8s_sub')}>
      <Bleed>
        <Suspense fallback={<Loading />}><ArchitectureDiagram /></Suspense>
      </Bleed>
    </ConceptLayout>
  )
}

export function GlossaryConcept() {
  const { t } = useTranslation()
  return (
    <ConceptLayout title={t('nav.c_glossary')} subtitle={t('glossary.subtitle')}>
      <GlossaryList />
    </ConceptLayout>
  )
}
