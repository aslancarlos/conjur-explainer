import NavBar from './components/NavBar'
import Hero from './components/Hero'
import ProblemSection from './components/ProblemSection'
import ArchitectureDiagram from './components/ArchitectureDiagram'
import SpringBootSection from './components/SpringBootSection'
import DotNetSection from './components/DotNetSection'
import GitHubActionsSection from './components/GitHubActionsSection'
import ComparisonTable from './components/ComparisonTable'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-bg-base text-slate-200">
      <NavBar />
      <main>
        <Hero />
        <ProblemSection />
        <ArchitectureDiagram />
        <SpringBootSection />
        <DotNetSection />
        <GitHubActionsSection />
        <ComparisonTable />
      </main>
      <Footer />
    </div>
  )
}
