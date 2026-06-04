import { lazy, Suspense } from 'react'
import Hero from '../components/Hero'
import ProblemSection from '../components/ProblemSection'
import Loading from '../components/Loading'

// Heavy below-the-fold SVG diagram — split out so it doesn't weigh down the
// initial paint of the landing page.
const ArchitectureDiagram = lazy(() => import('../components/ArchitectureDiagram'))

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <Suspense fallback={<Loading />}>
        <ArchitectureDiagram />
      </Suspense>
    </>
  )
}
