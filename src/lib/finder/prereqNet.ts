/**
 * Network prerequisites per recommendation, for the client checklist.
 *
 * Takes the resolved network (flows numbered as in the diagram, requirements)
 * and hands every item to the recommendation that needs it:
 *   - one recommendation needs it: listed under that recommendation;
 *   - several need it (the Secrets Manager core, the Kubernetes JWKS...):
 *     listed once under the general card of their product, never repeated;
 *   - none (sign-in of human users): general card of Secrets Manager.
 * Context keys (EC2, Lambda, AKS, a Secrets Hub target store...) belong to
 * the recommendation that brings them. Docs come from REC_DOCS plus the doc
 * each flow / requirement cites, all docs.cyberark.com links.
 */
import { RECS, type Prod } from '../../pages/finderModel'
import { numberedFlows } from './exports'
import type { Requirement, Resolved } from './netCatalog'
import { docHref, docTitle, forEdition, recDocs } from './recDocs'

export type NumberedFlow = ReturnType<typeof numberedFlows>[number]
export interface DocLink { title: string; url: string }
export interface NetGroup { flows: NumberedFlow[]; reqs: Requirement[]; docs: DocLink[] }

/** Context keys and the recommendations they belong to. */
const CONTEXT_OWNERS: Record<string, string[]> = {
  'aws-ec2': ['awsIam'], 'aws-lambda': ['awsIam', 'python'], 'aws-ecs': ['awsIam'],
  'azure-vm': ['azureMi'], 'azure-func': ['azureMi'], 'gcp-gce': ['gcpId'], 'gcp-func': ['gcpId'],
  'dynamic-aws': ['dynamic'], 'dynamic-gcp': ['dynamic'],
  'shub-aws': ['shubPc', 'shubSh'], 'shub-akv': ['shubPc', 'shubSh'], 'shub-gsm': ['shubPc', 'shubSh'], 'shub-hcv': ['shubPc', 'shubSh'],
  'aws-eks': ['k8sArch'], 'azure-aks': ['k8sArch'], 'gcp-gke': ['k8sArch'],
  iot: ['apiKey', 'cert'],
}

const empty = (): NetGroup => ({ flows: [], reqs: [], docs: [] })
const addDoc = (g: NetGroup, d: DocLink) => { if (!g.docs.some(x => x.url === d.url)) g.docs.push(d) }

export function prereqNetwork(r: Resolved, recs: string[], ranked: Prod[]) {
  const keys = new Set(r.keys)
  const owners = (requiredFor: string[]) => recs.filter(rec =>
    requiredFor.includes(rec) || requiredFor.some(k => (CONTEXT_OWNERS[k] ?? []).includes(rec)))
  const byRec: Record<string, NetGroup> = Object.fromEntries(recs.map(rec => [rec, empty()]))
  const general: Partial<Record<Prod, NetGroup>> = {}
  const generalOf = (p: Prod) => (general[p] ??= empty())
  // shared items go to the best-ranked product among their owners (Secrets Manager when unowned)
  const home = (os: string[]): Prod => ranked.find(p => os.some(o => RECS[o].product === p)) ?? 'sm'
  const place = <T>(item: T, requiredFor: string[], push: (g: NetGroup, x: T) => void, doc: DocLink) => {
    const os = owners(requiredFor)
    const g = os.length === 1 ? byRec[os[0]] : generalOf(home(os))
    push(g, item); addDoc(g, doc)
  }

  const cited = (url: string): DocLink => { const u = forEdition(url, r.edition); return { title: docTitle(u), url: docHref(u) } }
  for (const f of numberedFlows(r)) place(f, f.requiredFor, (g, x) => g.flows.push(x), cited(f.source.url))
  for (const q of r.requirements) place(q, q.requiredFor, (g, x) => g.reqs.push(x), cited(q.source.url))

  // one line per wire: variants of the same connection (SDK, ESO, CSI...) merge their purposes
  const merge = (g: NetGroup) => {
    const out: NumberedFlow[] = []
    for (const f of g.flows) {
      const dup = out.find(x => x.no === f.no && x.from === f.from && x.to === f.to && x.port === f.port && x.protocol === f.protocol && x.endpoint === f.endpoint)
      if (!dup) { out.push({ ...f }); continue }
      if (!dup.purpose.includes(f.purpose)) dup.purpose += `; ${f.purpose}`
      if (f.confidence === 'documented') dup.confidence = 'documented'
    }
    g.flows = out
  }
  Object.values(byRec).forEach(merge)
  Object.values(general).forEach(g => merge(g!))

  // curated docs first (with titles), then the ones cited by flows / requirements
  const titled = (g: NetGroup, curated: DocLink[]) => {
    const cited = g.docs
    g.docs = []
    curated.forEach(d => addDoc(g, d))
    cited.forEach(d => addDoc(g, d))
  }
  recs.forEach(rec => titled(byRec[rec], recDocs(rec, r.edition, keys)))
  Object.values(general).forEach(g => titled(g!, []))
  return { byRec, general }
}
