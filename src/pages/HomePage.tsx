import { lazy, Suspense } from 'react'
import Hero from '../components/Hero'
import ProblemSection from '../components/ProblemSection'
import DemosShowcase from '../components/DemosShowcase'
import Fundamentals from '../components/Fundamentals'
import Capabilities from '../components/Capabilities'
import IdiraPromise from '../components/IdiraPromise'
import Loading from '../components/Loading'

// Heavy below-the-fold SVG diagram — split out so it doesn't weigh down the
// initial paint of the landing page.
const ArchitectureDiagram = lazy(() => import('../components/ArchitectureDiagram'))

export default function HomePage() {
  return (
    <>
      {/* What IDIRA does (hero) → the two concepts (secret, machine identity)
          → pick a demo → why it matters → guarantees → Kubernetes fit → promise. */}
      <Hero />
      <Fundamentals />
      <DemosShowcase />
      <div id="problem">
        <ProblemSection />
      </div>
      <Capabilities />
      <Suspense fallback={<Loading />}>
        <ArchitectureDiagram />
      </Suspense>
      <IdiraPromise />
    </>
  )
}
