import Hero from '../components/Hero'
import FlowSection from '../components/FlowSection'
import ConceptsGrid from '../components/ConceptsGrid'
import DemosShowcase from '../components/DemosShowcase'

/**
 * Clean home (DESIGN.md §7): the idea (hero) → the flow, live → the Concepts
 * trail (each topic is its own page) → jump into the demos.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <FlowSection />
      <ConceptsGrid />
      <DemosShowcase />
    </>
  )
}
