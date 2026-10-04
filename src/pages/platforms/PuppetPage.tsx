import PuppetFlow from '../../components/flow/specs/platforms/PuppetFlow'
import CloudAuthnPage from '../authn/CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/puppet.html',
  'https://github.com/cyberark/conjur-puppet',
  'https://forge.puppet.com/modules/cyberark/conjur',
]

/** Platforms: Puppet module. Self-Hosted only. */
export default function PuppetPage() {
  return <CloudAuthnPage ns="pf_puppet" Flow={PuppetFlow} saas={false} selfHosted docs={DOCS} />
}
