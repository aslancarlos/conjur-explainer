import { lazy, Suspense } from 'react'
import Hero from '../components/Hero'
import Fundamentals from '../components/Fundamentals'
import ProblemSection from '../components/ProblemSection'
import IdentityInPractice from '../components/IdentityInPractice'
import FlowSection from '../components/FlowSection'
import Capabilities from '../components/Capabilities'
import Glossary from '../components/Glossary'
import DemosShowcase from '../components/DemosShowcase'
import IdiraPromise from '../components/IdiraPromise'
import Loading from '../components/Loading'

// Heavy below-the-fold SVG diagram — split out so it doesn't weigh down the
// initial paint of the landing page.
const ArchitectureDiagram = lazy(() => import('../components/ArchitectureDiagram'))

/**
 * The home teaches before it demos (DESIGN.md §7):
 * idea (hero) → what a secret / a machine identity is → why static secrets
 * fail → secret vs identity + identity per platform → the flow, live →
 * guarantees → Kubernetes architecture → glossary → jump into the demos → promise.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Fundamentals />
      <div id="problem">
        <ProblemSection />
      </div>
      <IdentityInPractice />
      <FlowSection />
      <Capabilities />
      <Suspense fallback={<Loading />}>
        <ArchitectureDiagram />
      </Suspense>
      <Glossary />
      <DemosShowcase />
      <IdiraPromise />
    </>
  )
}
